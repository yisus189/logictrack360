import React, { useEffect, useState } from "react";
import supabase from "../../lib/supabase";
import { REQUEST_TYPES, REQUEST_STATUS } from "../../constants";

/**
 * Data Requests Component
 * Manages data access requests (sent and received)
 */
export default function DataRequests({ userRole }) {
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState("sent"); // sent | received

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const loadRequests = async () => {
    setLoading(true);
    
    if (activeView === "sent") {
      const { data, error } = await supabase
        .from("data_requests")
        .select(`
          *,
          data_publications (title, description, category)
        `)
        .eq("requester_role", userRole)
        .order("requested_at", { ascending: false });

      if (!error) {
        setSentRequests(data || []);
      }
    } else {
      // For received requests, we need to match with user's publications
      const { data: myPubs } = await supabase
        .from("data_publications")
        .select("id")
        .eq("publisher_role", userRole);

      if (myPubs && myPubs.length > 0) {
        const pubIds = myPubs.map((p) => p.id);
        const { data, error } = await supabase
          .from("data_requests")
          .select(`
            *,
            data_publications (title, description, category)
          `)
          .in("publication_id", pubIds)
          .order("requested_at", { ascending: false });

        if (!error) {
          setReceivedRequests(data || []);
        }
      }
    }
    
    setLoading(false);
  };

  const handleApprove = async (requestId) => {
    setLoading(true);
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from("data_requests")
        .update({ 
          status: "Approved",
          responded_at: new Date().toISOString()
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Create contract automatically
      const request = receivedRequests.find((r) => r.id === requestId);
      if (request) {
        const { error: contractError } = await supabase
          .from("data_contracts")
          .insert({
            request_id: requestId,
            publication_id: request.publication_id,
            provider_role: userRole,
            consumer_role: request.requester_role,
            status: "Active",
            contract_terms: {
              usagePolicy: request.data_publications?.usage_policy || "Standard",
              duration: "1 year",
              autoCreated: true,
            },
            signed_at: new Date().toISOString(),
            valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (contractError) throw contractError;
      }

      alert("✅ Solicitud aprobada y contrato creado");
      await loadRequests();
    } catch (error) {
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm("¿Rechazar esta solicitud?")) return;

    setLoading(true);
    const { error } = await supabase
      .from("data_requests")
      .update({ 
        status: "Rejected",
        responded_at: new Date().toISOString()
      })
      .eq("id", requestId);

    if (!error) {
      alert("✅ Solicitud rechazada");
      await loadRequests();
    } else {
      alert("❌ Error: " + error.message);
    }
    setLoading(false);
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm("¿Cancelar esta solicitud?")) return;

    setLoading(true);
    const { error } = await supabase
      .from("data_requests")
      .delete()
      .eq("id", requestId);

    if (!error) {
      alert("✅ Solicitud cancelada");
      await loadRequests();
    } else {
      alert("❌ Error: " + error.message);
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "warning",
      Approved: "success",
      Rejected: "danger",
      Negotiating: "info",
      Expired: "muted",
    };
    return colors[status] || "default";
  };

  return (
    <div className="requests-container">
      <div className="section-header">
        <h2>📨 Solicitudes de Datos</h2>
        <div className="view-toggle">
          <button
            className={`btn ${activeView === "sent" ? "primary" : ""}`}
            onClick={() => setActiveView("sent")}
          >
            📤 Enviadas
          </button>
          <button
            className={`btn ${activeView === "received" ? "primary" : ""}`}
            onClick={() => setActiveView("received")}
          >
            📥 Recibidas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando solicitudes...</div>
      ) : (
        <div className="requests-list">
          {activeView === "sent" ? (
            sentRequests.length === 0 ? (
              <div className="empty-state">
                <p>📭 No has enviado solicitudes</p>
                <p className="hint">
                  Explora el catálogo para solicitar acceso a datos
                </p>
              </div>
            ) : (
              sentRequests.map((req) => (
                <div key={req.id} className="request-card">
                  <div className="card-header">
                    <div>
                      <h3>{req.data_publications?.title || "Dataset"}</h3>
                      <p className="meta">
                        {req.data_publications?.description}
                      </p>
                    </div>
                    <span className={`status-badge ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="metadata">
                    <div className="meta-row">
                      <strong>Tipo:</strong> {req.request_type}
                    </div>
                    <div className="meta-row">
                      <strong>Categoría:</strong>{" "}
                      {req.data_publications?.category}
                    </div>
                    <div className="meta-row">
                      <strong>Solicitado:</strong>{" "}
                      {new Date(req.requested_at).toLocaleDateString()}
                    </div>
                    {req.responded_at && (
                      <div className="meta-row">
                        <strong>Respondido:</strong>{" "}
                        {new Date(req.responded_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {req.status === "Pending" && (
                    <div className="card-actions">
                      <button
                        className="btn danger"
                        onClick={() => handleCancel(req.id)}
                      >
                        ❌ Cancelar Solicitud
                      </button>
                    </div>
                  )}
                </div>
              ))
            )
          ) : receivedRequests.length === 0 ? (
            <div className="empty-state">
              <p>📭 No has recibido solicitudes</p>
              <p className="hint">
                Las solicitudes aparecerán cuando otros usuarios pidan acceso a
                tus publicaciones
              </p>
            </div>
          ) : (
            receivedRequests.map((req) => (
              <div key={req.id} className="request-card">
                <div className="card-header">
                  <div>
                    <h3>{req.data_publications?.title || "Dataset"}</h3>
                    <p className="meta">
                      Solicitado por: {req.requester_role}
                    </p>
                  </div>
                  <span className={`status-badge ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>

                <div className="metadata">
                  <div className="meta-row">
                    <strong>Tipo:</strong> {req.request_type}
                  </div>
                  <div className="meta-row">
                    <strong>Solicitado:</strong>{" "}
                    {new Date(req.requested_at).toLocaleDateString()}
                  </div>
                  {req.message && (
                    <div className="meta-row">
                      <strong>Mensaje:</strong> {req.message}
                    </div>
                  )}
                </div>

                {req.status === "Pending" && (
                  <div className="card-actions">
                    <button
                      className="btn success"
                      onClick={() => handleApprove(req.id)}
                      disabled={loading}
                    >
                      ✅ Aprobar
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => handleReject(req.id)}
                      disabled={loading}
                    >
                      ❌ Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
