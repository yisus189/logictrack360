import React, { useEffect, useMemo, useRef, useState } from "react";
import supabase from "./lib/supabase";
import { ROLES, PHASES, CATEGORIES } from "./constants";
import "./index.css";
import TemplatesPanel from "./components/TemplatesPanel";
import DataPanel from "./components/DataPanel";
import logo from "/src/assets/logoLogicTrack360.jpeg";

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || "logictrack360";

const safeName = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.-]+/g, "_");

const publicUrl = (path) =>
  supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

export default function App() {
  const [docs, setDocs] = useState([]);
  const [activeRole, setActiveRole] = useState("todos");
  const [activePhase, setActivePhase] = useState("todas");
  const [sort, setSort] = useState("reciente");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  // campos para subir
  const [newRole, setNewRole] = useState(ROLES[0]);
  const [newPhase, setNewPhase] = useState(PHASES[0]);
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [customVersion, setCustomVersion] = useState("v1.0");

  const fileRef = useRef(null);

  const loadDocs = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("docs")
      .select("*, versions(*)")
      .order("uploaded_at", { ascending: false });
    setBusy(false);
    if (error) {
      console.error(error);
      alert("Error cargando documentos (RLS / políticas).");
      return;
    }
    setDocs(data || []);
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const filtered = useMemo(() => {
    let out = docs.slice();
    if (activeRole !== "todos") out = out.filter((d) => d.role === activeRole);
    if (activePhase !== "todas") out = out.filter((d) => d.phase === activePhase);
    if (q.trim()) {
      const t = q.toLowerCase();
      out = out.filter((d) =>
        (d.title + " " + (d.description || "") + " " + d.category)
          .toLowerCase()
          .includes(t)
      );
    }
    if (sort === "reciente")
      out.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
    if (sort === "alfabético") out.sort((a, b) => a.title.localeCompare(b.title));
    return out;
  }, [docs, activeRole, activePhase, sort, q]);

  // agrupar por fase (para lista central)
  const groupedByPhase = useMemo(() => {
    const map = {};
    filtered.forEach((d) => {
      map[d.phase] = map[d.phase] || [];
      map[d.phase].push(d);
    });
    const order = {};
    PHASES.forEach((p, i) => (order[p] = i));
    return Object.entries(map).sort(
      (a, b) => (order[a[0]] ?? 999) - (order[b[0]] ?? 999)
    );
  }, [filtered]);

  const openPicker = () => fileRef.current?.click();

  const handlePickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);

    try {
      for (const file of files) {
        const title = file.name.replace(/\.[^.]+$/, "");
        const { data: doc, error: errDoc } = await supabase
          .from("docs")
          .insert([{ title, category: newCategory, role: newRole, phase: newPhase }])
          .select()
          .single();
        if (errDoc) throw errDoc;

        const versionId = crypto.randomUUID();
        const path = `${doc.id}/${versionId}/${safeName(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (upErr) throw upErr;

        const { data: ver, error: vErr } = await supabase
          .from("versions")
          .insert([{
            id: versionId,
            doc_id: doc.id,
            file_name: file.name,
            mime_type: file.type || "application/octet-stream",
            size: file.size,
            path,
            version_tag: "v1.0"
          }])
          .select()
          .single();
        if (vErr) throw vErr;

        await supabase.from("docs").update({
          current_version_id: ver.id,
          uploaded_at: new Date().toISOString(),
        }).eq("id", doc.id);
      }
      await loadDocs();
    } catch (e2) {
      console.error(e2);
      alert("No se pudo subir documento.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const handleUpdateVersion = async (docId, file) => {
    if (!file) return;
    setBusy(true);
    try {
      const versionId = crypto.randomUUID();
      const path = `${docId}/${versionId}/${safeName(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || "application/octet-stream" });
      if (upErr) throw upErr;

      const { data: ver, error: vErr } = await supabase
        .from("versions")
        .insert([{
          id: versionId,
          doc_id: docId,
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          size: file.size,
          path,
          version_tag: customVersion || "v1.1"
        }])
        .select()
        .single();
      if (vErr) throw vErr;

      await supabase.from("docs").update({
        current_version_id: ver.id,
        uploaded_at: new Date().toISOString(),
      }).eq("id", docId);

      await loadDocs();
    } catch (err) {
      console.error(err);
      alert("Error al subir nueva versión");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("¿Eliminar documento y todas sus versiones?")) return;
    try {
      const { data: versions } = await supabase.from("versions").select("*").eq("doc_id", docId);
      for (const v of versions || []) {
        await supabase.storage.from(BUCKET).remove([v.path]);
      }
      await supabase.from("versions").delete().eq("doc_id", docId);
      await supabase.from("docs").delete().eq("id", docId);
      alert("Documento eliminado ✅");
      await loadDocs();
    } catch (err) {
      console.error(err);
      alert("Error eliminando documento");
    }
  };

  const selectedDoc = useMemo(
    () => docs.find((d) => d.id === selectedDocId) || null,
    [selectedDocId, docs]
  );

  return (
    <div className="container">
      <div className="app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <h2>Roles</h2>
          <button className={`role-btn ${activeRole === "todos" ? "active" : ""}`} onClick={() => setActiveRole("todos")}>
            Todos
          </button>
          {ROLES.map((r) => (
            <button key={r} className={`role-btn ${activeRole === r ? "active" : ""}`} onClick={() => setActiveRole(r)}>
              {r}
            </button>
          ))}

          <h2 style={{ marginTop: 16 }}>Recursos</h2>

          <button
            className="btn"
            onClick={() => setActiveRole("plantillas")}
          >
            📄 Plantillas
          </button>

          <button
            className="btn"
            onClick={() => setActiveRole("datos")}
            style={{ marginTop: 8 }}
          >
            📊 Datos
          </button>

          <div style={{ marginTop: 18 }}>
            <div className="badge">Subir documentos</div>
            <div className="uploader">
              <select className="select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
              <select className="select" value={newPhase} onChange={(e) => setNewPhase(e.target.value)}>
                {PHASES.map((p) => <option key={p}>{p}</option>)}
              </select>
              <select className="select" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <button className="btn primary" onClick={openPicker}>📂 Elegir archivo(s)</button>
              <input ref={fileRef} type="file" multiple className="hidden-input" onChange={handlePickFiles} />
            </div>
            {busy && <div className="badge">Procesando…</div>}
          </div>
        </aside>

        {/* MAIN */}
        <main>
          <div className="header">
            <img src={logo} alt="LogicTrack360" style={{ height: "40px" }} />
            <h1>LogicTrack360</h1>
            <input className="search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="select" value={activePhase} onChange={(e) => setActivePhase(e.target.value)}>
              <option value="todas">Todas las fases</option>
              {PHASES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="reciente">Recientes</option>
              <option value="alfabético">Alfabético</option>
            </select>
          </div>

          {/* 👇 Aquí está la condición: si se seleccionan Plantillas o Datos, mostrar el panel correspondiente */}
          {activeRole === "plantillas" ? (
            <TemplatesPanel />
          ) : activeRole === "datos" ? (
            <DataPanel />
          ) : (
            groupedByPhase.map(([phase, items]) => (
              <section key={phase}>
                <div className="phase-title">Fase: {phase}</div>
                {items.map((doc) => (
                  <DocRow
                    key={doc.id}
                    doc={doc}
                    onClick={() =>
                      setSelectedDocId((prev) => (prev === doc.id ? null : doc.id))
                    }
                  />
                ))}
                {selectedDoc && selectedDoc.phase === phase && (
                  <DocDetail
                    doc={selectedDoc}
                    onUpdateVersion={handleUpdateVersion}
                    onDelete={handleDeleteDocument}
                    onClose={() => setSelectedDocId(null)}
                    setCustomVersion={setCustomVersion}
                  />
                )}
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  );
}

function DocRow({ doc, onClick }) {
  return (
    <div className="card">
      <div className="row doc-row" onClick={onClick}>
        <div style={{ flex: 1 }}>
          <div className="title">{doc.title.toLowerCase()}</div>
          <div className="meta">{doc.role} • {(doc.versions || []).length} versión(es)</div>
        </div>
        <div className="chips">
          {(doc.versions || []).map((v) => (
            <span key={v.id} className="chip">{v.version_tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocDetail({ doc, onUpdateVersion, onDelete, onClose, setCustomVersion }) {
  const inputRef = useRef(null);
  const versions = (doc.versions || []).slice().sort((a, b) =>
    new Date(a.uploaded_at) - new Date(b.uploaded_at)
  );

  return (
    <div className="card detail">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="title">{doc.title.toLowerCase()}</div>
          <div className="meta">{doc.role} • {versions.length} versión(es)</div>
        </div>
        <div className="actions">
          <input type="text" placeholder="Ej: 2.0" className="select" onChange={(e) => setCustomVersion(e.target.value)} />
          <button className="btn" onClick={() => inputRef.current?.click()}>Actualizar</button>
          <button className="btn danger" onClick={() => onDelete(doc.id)}>Eliminar</button>
          <button className="btn" onClick={onClose}>Cerrar</button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => onUpdateVersion(doc.id, e.target.files?.[0])} />
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Versión</th>
            <th>Actualizado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v) => {
            const url = publicUrl(v.path);
            const d = new Date(v.uploaded_at);
            return (
              <tr key={v.id}>
                <td>{v.version_tag}</td>
                <td>{d.toLocaleDateString()}</td>
                <td className="actions">
                  <a className="btn" href={url} target="_blank" rel="noreferrer">Vista</a>
                  <a className="btn" href={url} download={v.file_name}>Descargar</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
