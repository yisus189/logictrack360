import React, { useEffect, useState, useRef } from "react";
import supabase from "../../lib/supabase";
import { DATA_CATEGORIES, DATA_FORMATS, USAGE_POLICIES } from "../../constants";

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET_DATA || "data-space";

/**
 * Data Publications Component
 * Allows Data Providers to publish datasets to the Data Space
 */
export default function DataPublications({ userRole }) {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: DATA_CATEGORIES[0],
    format: DATA_FORMATS[0],
    usagePolicy: USAGE_POLICIES[0],
    license: "CC-BY-4.0",
    price: 0,
    isPaid: false,
    metadata: {},
  });

  useEffect(() => {
    loadPublications();
  }, []);

  const loadPublications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("data_publications")
      .select("*")
      .order("published_at", { ascending: false });

    if (!error) {
      setPublications(data || []);
    }
    setLoading(false);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];

    if (!file && !formData.metadata.apiEndpoint) {
      alert("Debes seleccionar un archivo o proporcionar un endpoint de API");
      return;
    }

    setLoading(true);
    try {
      let filePath = null;
      let fileSize = null;

      // Upload file if provided
      if (file) {
        const fileName = `${Date.now()}_${file.name}`;
        filePath = `publications/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        fileSize = file.size;
      }

      // Create publication record
      const { error } = await supabase.from("data_publications").insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        format: formData.format,
        usage_policy: formData.usagePolicy,
        license: formData.license,
        price: formData.isPaid ? formData.price : 0,
        is_paid: formData.isPaid,
        file_path: filePath,
        file_size: fileSize,
        metadata: formData.metadata,
        publisher_role: userRole,
        status: "Active",
        published_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert("✅ Datos publicados correctamente");
      setShowForm(false);
      resetForm();
      await loadPublications();
    } catch (error) {
      console.error(error);
      alert("❌ Error al publicar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: DATA_CATEGORIES[0],
      format: DATA_FORMATS[0],
      usagePolicy: USAGE_POLICIES[0],
      license: "CC-BY-4.0",
      price: 0,
      isPaid: false,
      metadata: {},
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (id, filePath) => {
    if (!window.confirm("¿Eliminar esta publicación?")) return;

    try {
      if (filePath) {
        await supabase.storage.from(BUCKET).remove([filePath]);
      }
      await supabase.from("data_publications").delete().eq("id", id);
      alert("✅ Publicación eliminada");
      await loadPublications();
    } catch (error) {
      alert("❌ Error al eliminar: " + error.message);
    }
  };

  return (
    <div className="publications-container">
      <div className="section-header">
        <h2>📤 Mis Publicaciones de Datos</h2>
        <button
          className="btn primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "❌ Cancelar" : "➕ Nueva Publicación"}
        </button>
      </div>

      {/* Publication Form */}
      {showForm && (
        <form className="publication-form" onSubmit={handlePublish}>
          <div className="form-grid">
            <div className="form-group">
              <label>Título *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Nombre del dataset"
              />
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                {DATA_CATEGORIES.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Formato</label>
              <select
                value={formData.format}
                onChange={(e) =>
                  setFormData({ ...formData, format: e.target.value })
                }
              >
                {DATA_FORMATS.map((fmt) => (
                  <option key={fmt}>{fmt}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Política de Uso</label>
              <select
                value={formData.usagePolicy}
                onChange={(e) =>
                  setFormData({ ...formData, usagePolicy: e.target.value })
                }
              >
                {USAGE_POLICIES.map((policy) => (
                  <option key={policy}>{policy}</option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Descripción *</label>
              <textarea
                required
                rows="3"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe el contenido y propósito de los datos"
              />
            </div>

            <div className="form-group">
              <label>Licencia</label>
              <input
                type="text"
                value={formData.license}
                onChange={(e) =>
                  setFormData({ ...formData, license: e.target.value })
                }
                placeholder="ej: CC-BY-4.0, MIT"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) =>
                    setFormData({ ...formData, isPaid: e.target.checked })
                  }
                />
                Datos de pago
              </label>
              {formData.isPaid && (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) })
                  }
                  placeholder="Precio en €"
                />
              )}
            </div>

            <div className="form-group full-width">
              <label>Archivo de datos</label>
              <input ref={fileRef} type="file" />
              <small className="hint">
                Sube un archivo o proporciona un endpoint de API en metadatos
              </small>
            </div>
          </div>

          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? "Publicando..." : "📤 Publicar Datos"}
          </button>
        </form>
      )}

      {/* Publications List */}
      {loading && !showForm ? (
        <div className="loading-state">Cargando publicaciones...</div>
      ) : (
        <div className="publications-grid">
          {publications.length === 0 ? (
            <div className="empty-state">
              <p>📭 No has publicado datos aún</p>
              <p className="hint">Haz clic en "Nueva Publicación" para comenzar</p>
            </div>
          ) : (
            publications.map((pub) => (
              <div key={pub.id} className="publication-card">
                <div className="card-header">
                  <h3>{pub.title}</h3>
                  <span className={`status-badge ${pub.status.toLowerCase()}`}>
                    {pub.status}
                  </span>
                </div>

                <p className="description">{pub.description}</p>

                <div className="metadata">
                  <div className="meta-row">
                    <strong>Categoría:</strong> {pub.category}
                  </div>
                  <div className="meta-row">
                    <strong>Formato:</strong> {pub.format}
                  </div>
                  <div className="meta-row">
                    <strong>Política:</strong> {pub.usage_policy}
                  </div>
                  <div className="meta-row">
                    <strong>Licencia:</strong> {pub.license}
                  </div>
                  {pub.is_paid && (
                    <div className="meta-row">
                      <strong>Precio:</strong> €{pub.price}
                    </div>
                  )}
                  <div className="meta-row">
                    <strong>Publicado:</strong>{" "}
                    {new Date(pub.published_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn danger"
                    onClick={() => handleDelete(pub.id, pub.file_path)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
