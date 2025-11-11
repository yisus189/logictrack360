import React, { useEffect, useState } from "react";
import supabase from "../lib/supabase"; // usa el cliente central

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || "logictrack360";

const publicUrl = (path) =>
  supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

export default function TemplatesPanel({ onBack }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [role, setRole] = useState("todos");
  const [sort, setSort] = useState("reciente");
  const [templateFile, setTemplateFile] = useState(null);

  // Cargar plantillas
  const loadTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("uploaded_at", { ascending: false });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Error cargando plantillas (RLS / políticas).");
      return;
    }

    setTemplates(data || []);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Subir nueva plantilla
  const handleUploadTemplate = async (e) => {
    e.preventDefault();
    if (!templateFile) {
      alert("Selecciona un archivo primero.");
      return;
    }

    const file = templateFile;
    const filePath = `plantillas/${Date.now()}_${file.name}`;

    try {
      // 1️⃣ Subir archivo al bucket principal
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file);

      if (uploadError) {
        console.error("❌ Error al subir al bucket:", uploadError.message);
        alert("Error al subir la plantilla");
        return;
      }

      // 2️⃣ Registrar metadatos en la tabla templates
      const { error: insertError } = await supabase.from("templates").insert([
        {
          title: file.name.replace(/\.[^/.]+$/, ""),
          category: "documentación",
          role: "líder de equipo",
          phase: "plantillas",
          path: uploadData.path,
          uploaded_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error("❌ Error insertando en tabla:", insertError.message);
        alert("Error al guardar en base de datos");
        return;
      }

      alert("✅ Plantilla subida correctamente");
      setTemplateFile(null);
      loadTemplates();
    } catch (err) {
      console.error("⚠️ Error general:", err.message);
      alert("Error al subir la plantilla");
    }
  };

  // Filtrar plantillas
  const filtered = templates
    .filter((t) => {
      if (category !== "todas" && t.category !== category) return false;
      if (role !== "todos" && t.role !== role) return false;
      if (search.trim()) {
        const term = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(term) ||
          (t.category || "").toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) =>
      sort === "reciente"
        ? new Date(b.uploaded_at) - new Date(a.uploaded_at)
        : a.title.localeCompare(b.title)
    );

  return (
    <div className="templates-container">
      {/* Barra superior */}
      <div className="templates-header">
        <div>
          <h1 className="title">Plantillas LogicTrack360</h1>
          <p className="subtitle">Descarga y usa — sin versionado</p>
        </div>

        <div className="filters">
          <input
            type="text"
            className="search"
            placeholder="Buscar plantilla"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="todas">Todas las categorías</option>
            <option value="documentación">Documentación</option>
            <option value="estrategia">Estrategia</option>
            <option value="requisitos">Requisitos</option>
          </select>
          <select
            className="select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="todos">Todos los roles</option>
            <option value="líder de calidad">Líder de Calidad</option>
            <option value="líder de desarrollo">Líder de Desarrollo</option>
            <option value="líder de equipo">Líder de Equipo</option>
          </select>
          <select
            className="select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="reciente">Orden: Recientes</option>
            <option value="alfabético">Orden: Alfabético</option>
          </select>
        </div>
      </div>

      {/* Subir nueva plantilla */}
      <div className="upload-templates-box">
        <h3>Subir nueva plantilla</h3>
        <form onSubmit={handleUploadTemplate}>
          <input
            type="file"
            onChange={(e) => setTemplateFile(e.target.files[0])}
          />
          <button type="submit" className="btn primary">
            Subir plantilla
          </button>
        </form>
      </div>

      {/* Lista de plantillas */}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="templates-grid">
          {filtered.length ? (
            filtered.map((t) => (
              <div key={t.id} className="template-card">
                <div className="template-header">
                  <h3>{t.title}</h3>
                </div>
                <div className="tags">
                  <span className="tag">{t.category}</span>
                  <span className="tag">{t.phase}</span>
                </div>
                <p className="meta">
                  Rol sugerido: {t.role} • Actualizada:{" "}
                  {new Date(t.uploaded_at).toLocaleString()}
                </p>
                <a
                  href={publicUrl(t.path)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn download"
                >
                  Descargar
                </a>
              </div>
            ))
          ) : (
            <p>No hay plantillas disponibles.</p>
          )}
        </div>
      )}
    </div>
  );
}