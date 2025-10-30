import React, { useEffect, useState } from "react";
import supabase from "../../lib/supabase";
import { TRANSFER_STATUS } from "../../constants";

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET_DATA || "data-space";

/**
 * Data Transfers Component
 * Manages actual data transfers resulting from contracts
 */
export default function DataTransfers({ userRole }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTransfers = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("data_transfers")
      .select(`
        *,
        data_publications (title, format, file_path, file_size),
        data_contracts (status, contract_terms)
      `)
      .or(`provider_role.eq.${userRole},consumer_role.eq.${userRole}`)
      .order("initiated_at", { ascending: false });

    if (!error) {
      setTransfers(data || []);
    }
    setLoading(false);
  };

  const handleStartTransfer = async (transferId) => {
    setLoading(true);
    try {
      const transfer = transfers.find((t) => t.id === transferId);
      if (!transfer) throw new Error("Transfer not found");

      // Update transfer status
      const { error } = await supabase
        .from("data_transfers")
        .update({
          status: "In Progress",
          started_at: new Date().toISOString(),
        })
        .eq("id", transferId);

      if (error) throw error;

      // In a real implementation, this would trigger the actual data transfer
      // For now, we'll simulate it by immediately completing
      setTimeout(async () => {
        await supabase
          .from("data_transfers")
          .update({
            status: "Completed",
            completed_at: new Date().toISOString(),
            bytes_transferred: transfer.data_publications?.file_size || 0,
          })
          .eq("id", transferId);
        
        await loadTransfers();
      }, 2000);

      alert("✅ Transferencia iniciada");
      await loadTransfers();
    } catch (error) {
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (transfer) => {
    if (!transfer.data_publications?.file_path) {
      alert("No hay archivo disponible para descargar");
      return;
    }

    try {
      const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(transfer.data_publications.file_path);

      if (data?.publicUrl) {
        window.open(data.publicUrl, "_blank");
      }
    } catch (error) {
      alert("❌ Error al descargar: " + error.message);
    }
  };

  const handleCancelTransfer = async (transferId) => {
    if (!window.confirm("¿Cancelar esta transferencia?")) return;

    setLoading(true);
    const { error } = await supabase
      .from("data_transfers")
      .update({
        status: "Cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", transferId);

    if (!error) {
      alert("✅ Transferencia cancelada");
      await loadTransfers();
    } else {
      alert("❌ Error: " + error.message);
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "warning",
      "In Progress": "info",
      Completed: "success",
      Failed: "danger",
      Cancelled: "muted",
    };
    return colors[status] || "default";
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getProgress = (transfer) => {
    if (transfer.status === "Completed") return 100;
    if (transfer.status === "In Progress") {
      // Simulate progress based on time
      const start = new Date(transfer.started_at).getTime();
      const now = Date.now();
      const elapsed = now - start;
      return Math.min(95, Math.floor((elapsed / 10000) * 100));
    }
    return 0;
  };

  const isProvider = (transfer) => transfer.provider_role === userRole;
  const isConsumer = (transfer) => transfer.consumer_role === userRole;

  return (
    <div className="transfers-container">
      <div className="section-header">
        <h2>🔄 Transferencias de Datos</h2>
        <button className="btn" onClick={loadTransfers}>
          🔄 Recargar
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Cargando transferencias...</div>
      ) : transfers.length === 0 ? (
        <div className="empty-state">
          <p>📭 No hay transferencias registradas</p>
          <p className="hint">
            Las transferencias se crean desde los contratos activos
          </p>
        </div>
      ) : (
        <div className="transfers-list">
          {transfers.map((transfer) => (
            <div key={transfer.id} className="transfer-card">
              <div className="card-header">
                <div>
                  <h3>{transfer.data_publications?.title || "Dataset"}</h3>
                  <p className="meta">
                    {isProvider(transfer) ? "🔹 Enviando" : "🔸 Recibiendo"}
                  </p>
                </div>
                <span className={`status-badge ${getStatusColor(transfer.status)}`}>
                  {transfer.status}
                </span>
              </div>

              <div className="metadata">
                <div className="meta-row">
                  <strong>Método:</strong> {transfer.transfer_method || "Direct Download"}
                </div>
                <div className="meta-row">
                  <strong>Formato:</strong> {transfer.data_publications?.format || "N/A"}
                </div>
                <div className="meta-row">
                  <strong>Tamaño:</strong>{" "}
                  {formatBytes(transfer.data_publications?.file_size)}
                </div>
                <div className="meta-row">
                  <strong>Iniciado:</strong>{" "}
                  {new Date(transfer.initiated_at).toLocaleDateString()}
                </div>
                {transfer.completed_at && (
                  <div className="meta-row">
                    <strong>Completado:</strong>{" "}
                    {new Date(transfer.completed_at).toLocaleDateString()}
                  </div>
                )}
                {transfer.bytes_transferred > 0 && (
                  <div className="meta-row">
                    <strong>Transferido:</strong>{" "}
                    {formatBytes(transfer.bytes_transferred)}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {transfer.status === "In Progress" && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${getProgress(transfer)}%` }}
                  />
                  <span className="progress-text">{getProgress(transfer)}%</span>
                </div>
              )}

              {/* Actions */}
              <div className="card-actions">
                {transfer.status === "Pending" && isProvider(transfer) && (
                  <button
                    className="btn primary"
                    onClick={() => handleStartTransfer(transfer.id)}
                    disabled={loading}
                  >
                    ▶️ Iniciar Transferencia
                  </button>
                )}

                {transfer.status === "Completed" && isConsumer(transfer) && (
                  <button
                    className="btn success"
                    onClick={() => handleDownload(transfer)}
                  >
                    ⬇️ Descargar Datos
                  </button>
                )}

                {(transfer.status === "Pending" || transfer.status === "In Progress") && (
                  <button
                    className="btn danger"
                    onClick={() => handleCancelTransfer(transfer.id)}
                    disabled={loading}
                  >
                    ❌ Cancelar
                  </button>
                )}
              </div>

              {/* Transfer Logs */}
              {transfer.transfer_logs && transfer.transfer_logs.length > 0 && (
                <details className="transfer-logs">
                  <summary>📝 Ver Logs</summary>
                  <ul>
                    {transfer.transfer_logs.map((log, idx) => (
                      <li key={idx}>
                        <small>{new Date(log.timestamp).toLocaleString()}</small>
                        : {log.message}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
