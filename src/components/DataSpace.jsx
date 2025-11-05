import React, { useState } from "react";
import DataCatalog from "./dataspace/DataCatalog";
import DataPublications from "./dataspace/DataPublications";
import DataRequests from "./dataspace/DataRequests";
import DataContracts from "./dataspace/DataContracts";
import DataTransfers from "./dataspace/DataTransfers";
import "./DataSpace.css";

/**
 * Main Data Space Component - IDSA/DSSC Compliant
 * Provides a complete data space implementation with:
 * - Data Catalog (from OpenMetadata)
 * - Data Publications
 * - Request Management
 * - Contract Management
 * - Data Transfers
 */
export default function DataSpace() {
  const [activeTab, setActiveTab] = useState("catalog");
  const [userRole, setUserRole] = useState("Data Consumer");

  const tabs = [
    { id: "catalog", label: "📚 Catálogo de Datos", icon: "📚" },
    { id: "publications", label: "📤 Mis Publicaciones", icon: "📤" },
    { id: "requests", label: "📨 Solicitudes", icon: "📨" },
    { id: "contracts", label: "📋 Contratos", icon: "📋" },
    { id: "transfers", label: "🔄 Transferencias", icon: "🔄" },
  ];

  return (
    <div className="data-space-container">
      {/* Header */}
      <div className="data-space-header">
        <div className="header-content">
          <div>
            <h1 className="ds-title">🌐 Data Space</h1>
            <p className="ds-subtitle">
              IDSA/DSSC Compliant • OpenMetadata Integration
            </p>
          </div>
          <div className="user-role-selector">
            <label>Rol actual:</label>
            <select
              className="select"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
            >
              <option>Data Provider</option>
              <option>Data Consumer</option>
              <option>Service Provider</option>
              <option>Broker Service Provider</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="ds-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`ds-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="ds-content">
        {activeTab === "catalog" && <DataCatalog userRole={userRole} />}
        {activeTab === "publications" && <DataPublications userRole={userRole} />}
        {activeTab === "requests" && <DataRequests userRole={userRole} />}
        {activeTab === "contracts" && <DataContracts userRole={userRole} />}
        {activeTab === "transfers" && <DataTransfers userRole={userRole} />}
      </div>
    </div>
  );
}
