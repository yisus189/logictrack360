import React, { useEffect, useState } from "react";
import { fetchDataCatalog, searchDataCatalog, transformToDataSpaceFormat } from "../../lib/openmetadata";
import supabase from "../../lib/supabase";

/**
 * Data Catalog Component
 * Integrates with OpenMetadata to display available datasets
 * Allows users to browse and request access to data
 */
export default function DataCatalog({ userRole }) {
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [useOpenMetadata, setUseOpenMetadata] = useState(true);

  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useOpenMetadata]);

  const loadCatalog = async () => {
    setLoading(true);
    
    if (useOpenMetadata) {
      // Load from OpenMetadata
      const result = await fetchDataCatalog({ limit: 50 });
      if (result.success) {
        const transformed = result.data.map(transformToDataSpaceFormat);
        setCatalogItems(transformed);
      } else {
        // Fallback to local database
        await loadLocalCatalog();
      }
    } else {
      // Load from local database
      await loadLocalCatalog();
    }
    
    setLoading(false);
  };

  const loadLocalCatalog = async () => {
    const { data, error } = await supabase
      .from("data_catalog")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setCatalogItems(data || []);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadCatalog();
      return;
    }

    setLoading(true);
    if (useOpenMetadata) {
      const result = await searchDataCatalog(searchQuery);
      if (result.success) {
        const transformed = result.data.map((hit) =>
          transformToDataSpaceFormat(hit._source)
        );
        setCatalogItems(transformed);
      }
    } else {
      // Local search
      const { data } = await supabase
        .from("data_catalog")
        .select("*")
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      setCatalogItems(data || []);
    }
    setLoading(false);
  };

  const handleRequestAccess = async (item) => {
    // Create a data access request
    const { error } = await supabase.from("data_requests").insert({
      catalog_item_id: item.id,
      requester_role: userRole,
      request_type: "Data Access Request",
      status: "Pending",
      requested_at: new Date().toISOString(),
    });

    if (!error) {
      alert("✅ Solicitud de acceso enviada correctamente");
    } else {
      alert("❌ Error al enviar solicitud: " + error.message);
    }
  };

  return (
    <div className="catalog-container">
      {/* Search and Filter Bar */}
      <div className="catalog-controls">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar en el catálogo de datos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="btn primary" onClick={handleSearch}>
            🔍 Buscar
          </button>
        </div>
        
        <div className="catalog-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useOpenMetadata}
              onChange={(e) => setUseOpenMetadata(e.target.checked)}
            />
            Usar OpenMetadata
          </label>
          <button className="btn" onClick={loadCatalog}>
            🔄 Recargar
          </button>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="loading-state">Cargando catálogo...</div>
      ) : (
        <div className="catalog-grid">
          {catalogItems.length === 0 ? (
            <div className="empty-state">
              <p>📭 No hay datasets disponibles en el catálogo</p>
              <p className="hint">
                {useOpenMetadata
                  ? "Verifica la configuración de OpenMetadata"
                  : "Publica datos para verlos aquí"}
              </p>
            </div>
          ) : (
            catalogItems.map((item) => (
              <div key={item.id} className="catalog-card">
                <div className="card-header">
                  <h3>{item.displayName || item.name}</h3>
                  <span className="badge">{item.tier || "Tier 1"}</span>
                </div>

                <p className="description">
                  {item.description || "Sin descripción disponible"}
                </p>

                <div className="metadata">
                  <div className="meta-item">
                    <strong>Base de datos:</strong> {item.database || "N/A"}
                  </div>
                  <div className="meta-item">
                    <strong>Servicio:</strong> {item.service || "N/A"}
                  </div>
                  <div className="meta-item">
                    <strong>Propietario:</strong> {item.owner || "Unknown"}
                  </div>
                  {item.columns && item.columns.length > 0 && (
                    <div className="meta-item">
                      <strong>Columnas:</strong> {item.columns.length}
                    </div>
                  )}
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div className="tags">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="card-actions">
                  <button
                    className="btn"
                    onClick={() => setSelectedItem(item)}
                  >
                    👁️ Ver Detalles
                  </button>
                  <button
                    className="btn primary"
                    onClick={() => handleRequestAccess(item)}
                  >
                    📨 Solicitar Acceso
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedItem.displayName || selectedItem.name}</h2>
            <p>{selectedItem.description}</p>
            
            {selectedItem.columns && selectedItem.columns.length > 0 && (
              <div className="columns-section">
                <h3>Esquema de Columnas</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Tipo de Dato</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.columns.map((col, idx) => (
                      <tr key={idx}>
                        <td><code>{col.name}</code></td>
                        <td>{col.dataType}</td>
                        <td>{col.description || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button className="btn" onClick={() => setSelectedItem(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
