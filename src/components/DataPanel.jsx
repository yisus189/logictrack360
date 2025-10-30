import React, { useEffect, useState } from "react";
import supabase from "../lib/supabase";

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET_DATA || "data-space";

const publicUrl = (path) =>
  supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

export default function DataPanel() {
  const [dataFiles, setDataFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [sort, setSort] = useState("reciente");

  const loadDataFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("data_space")
      .select("*")
      .order("uploaded_at", { ascending: false });
    setLoading(false);

    if (error) {
      console.error(error);
      alert("Error cargando archivos de datos (RLS / políticas).");
      return;
    }
    setDataFiles(data || []);
  };

  useEffect(() => {
    loadDataFiles();
  }, []);

  const filtered = dataFiles
    .filter((d) => {
      if (category !== "todas" && d.category !== category) return false;
      if (search.trim()) {
        const term = search.toLowerCase();
        return (
          d.title.toLowerCase().includes(term) ||
          (d.description || "").toLowerCase().includes(term) ||
          (d.category || "").toLowerCase().includes(term)
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
          <h1 className="title">Espacio de Datos</h1>
          <p className="subtitle">Accede a datasets y archivos de datos del proyecto</p>
        </div>

        <div className="filters">
          <input
            type="text"
            className="search"
            placeholder="Buscar archivo de datos"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="todas">Todas las categorías</option>
            <option value="datasets">Datasets</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="xml">XML</option>
            <option value="excel">Excel</option>
            <option value="otros">Otros</option>
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

      {/* Lista de archivos de datos */}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="templates-grid">
          {filtered.length ? (
            filtered.map((d) => (
              <div key={d.id} className="template-card">
                <div className="template-header">
                  <h3>{d.title}</h3>
                </div>
                <div className="tags">
                  <span className="tag">{d.category}</span>
                  {d.format && <span className="tag">{d.format}</span>}
                </div>
                {d.description && (
                  <p className="meta" style={{ marginTop: "8px" }}>
                    {d.description}
                  </p>
                )}
                <p className="meta">
                  {d.size && `Tamaño: ${(d.size / 1024).toFixed(2)} KB • `}
                  Actualizado: {new Date(d.uploaded_at).toLocaleDateString()}
                </p>
                <a
                  href={publicUrl(d.path)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn download"
                >
                  Descargar
                </a>
              </div>
            ))
          ) : (
            <p>No hay archivos de datos disponibles.</p>
          )}
        </div>
      )}
    </div>
  );
}
