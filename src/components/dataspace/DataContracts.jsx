import React, { useEffect, useState } from "react";
import supabase from "../../lib/supabase";
import { CONTRACT_STATUS } from "../../constants";

/**
 * Data Contracts Component
 * Manages data usage contracts between providers and consumers
 * Contracts are created when requests are approved
 */
export default function DataContracts({ userRole }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  useEffect(() => {
    loadContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    
    // Load contracts where user is provider or consumer
    const { data, error } = await supabase
      .from("data_contracts")
      .select(`
        *,
        data_publications (title, description, category, format),
        data_requests (request_type, requester_role)
      `)
      .or(`provider_role.eq.${userRole},consumer_role.eq.${userRole}`)
      .order("signed_at", { ascending: false });

    if (!error) {
      setContracts(data || []);
    }
    setLoading(false);
  };

  const handleInitiateTransfer = async (contractId) => {
    setLoading(true);
    try {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) throw new Error("Contract not found");

      // Create a data transfer
      const { error } = await supabase.from("data_transfers").insert({
        contract_id: contractId,
        publication_id: contract.publication_id,
        provider_role: contract.provider_role,
        consumer_role: contract.consumer_role,
        status: "Pending",
        initiated_at: new Date().toISOString(),
        transfer_method: "Direct Download", // or "API", "Streaming", etc.
      });

      if (error) throw error;

      alert("✅ Transferencia iniciada correctamente");
      // Optionally navigate to transfers tab
    } catch (error) {
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateContract = async (contractId) => {
    if (!window.confirm("¿Terminar este contrato?")) return;

    setLoading(true);
    const { error } = await supabase
      .from("data_contracts")
      .update({ 
        status: "Terminated",
        terminated_at: new Date().toISOString()
      })
      .eq("id", contractId);

    if (!error) {
      alert("✅ Contrato terminado");
      await loadContracts();
    } else {
      alert("❌ Error: " + error.message);
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: "muted",
      Active: "success",
      Completed: "info",
      Terminated: "danger",
      Suspended: "warning",
    };
    return colors[status] || "default";
  };

  const isProvider = (contract) => contract.provider_role === userRole;

  return (
    <div className="contracts-container">
      <div className="section-header">
        <h2>📋 Contratos de Datos</h2>
        <button className="btn" onClick={loadContracts}>
          🔄 Recargar
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Cargando contratos...</div>
      ) : contracts.length === 0 ? (
        <div className="empty-state">
          <p>📭 No tienes contratos activos</p>
          <p className="hint">
            Los contratos se crean automáticamente cuando se aprueban solicitudes
          </p>
        </div>
      ) : (
        <div className="contracts-grid">
          {contracts.map((contract) => (
            <div key={contract.id} className="contract-card">
              <div className="card-header">
                <div>
                  <h3>
                    {contract.data_publications?.title || "Dataset"}
                  </h3>
                  <p className="meta">
                    {isProvider(contract) ? "🔹 Proveedor" : "🔸 Consumidor"}
                  </p>
                </div>
                <span className={`status-badge ${getStatusColor(contract.status)}`}>
                  {contract.status}
                </span>
              </div>

              <p className="description">
                {contract.data_publications?.description}
              </p>

              <div className="metadata">
                <div className="meta-row">
                  <strong>Proveedor:</strong> {contract.provider_role}
                </div>
                <div className="meta-row">
                  <strong>Consumidor:</strong> {contract.consumer_role}
                </div>
                <div className="meta-row">
                  <strong>Firmado:</strong>{" "}
                  {new Date(contract.signed_at).toLocaleDateString()}
                </div>
                {contract.valid_until && (
                  <div className="meta-row">
                    <strong>Válido hasta:</strong>{" "}
                    {new Date(contract.valid_until).toLocaleDateString()}
                  </div>
                )}
                <div className="meta-row">
                  <strong>Formato:</strong>{" "}
                  {contract.data_publications?.format || "N/A"}
                </div>
              </div>

              {contract.contract_terms && (
                <div className="contract-terms">
                  <h4>Términos del Contrato</h4>
                  <ul>
                    {Object.entries(contract.contract_terms).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong>{" "}
                        {typeof value === "object" ? JSON.stringify(value) : value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="card-actions">
                <button
                  className="btn"
                  onClick={() => setSelectedContract(contract)}
                >
                  👁️ Ver Detalles
                </button>
                
                {contract.status === "Active" && (
                  <>
                    {isProvider(contract) && (
                      <button
                        className="btn primary"
                        onClick={() => handleInitiateTransfer(contract.id)}
                        disabled={loading}
                      >
                        🔄 Iniciar Transferencia
                      </button>
                    )}
                    <button
                      className="btn danger"
                      onClick={() => handleTerminateContract(contract.id)}
                      disabled={loading}
                    >
                      ❌ Terminar Contrato
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
          <div className="modal-content contract-detail" onClick={(e) => e.stopPropagation()}>
            <h2>Detalles del Contrato</h2>
            
            <div className="detail-section">
              <h3>Información General</h3>
              <table className="table">
                <tbody>
                  <tr>
                    <td><strong>ID Contrato:</strong></td>
                    <td><code>{selectedContract.id}</code></td>
                  </tr>
                  <tr>
                    <td><strong>Dataset:</strong></td>
                    <td>{selectedContract.data_publications?.title}</td>
                  </tr>
                  <tr>
                    <td><strong>Estado:</strong></td>
                    <td>
                      <span className={`status-badge ${getStatusColor(selectedContract.status)}`}>
                        {selectedContract.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Proveedor:</strong></td>
                    <td>{selectedContract.provider_role}</td>
                  </tr>
                  <tr>
                    <td><strong>Consumidor:</strong></td>
                    <td>{selectedContract.consumer_role}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="detail-section">
              <h3>Fechas</h3>
              <table className="table">
                <tbody>
                  <tr>
                    <td><strong>Firmado:</strong></td>
                    <td>{new Date(selectedContract.signed_at).toLocaleString()}</td>
                  </tr>
                  {selectedContract.valid_until && (
                    <tr>
                      <td><strong>Válido hasta:</strong></td>
                      <td>{new Date(selectedContract.valid_until).toLocaleString()}</td>
                    </tr>
                  )}
                  {selectedContract.terminated_at && (
                    <tr>
                      <td><strong>Terminado:</strong></td>
                      <td>{new Date(selectedContract.terminated_at).toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedContract.contract_terms && (
              <div className="detail-section">
                <h3>Términos y Condiciones</h3>
                <pre className="contract-json">
                  {JSON.stringify(selectedContract.contract_terms, null, 2)}
                </pre>
              </div>
            )}

            <button className="btn" onClick={() => setSelectedContract(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
