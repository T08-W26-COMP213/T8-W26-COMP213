import React from "react";

function InventoryRiskLayout({ inventory = [], loading = false, backendConnected = false }) {
  const safeItems = inventory.filter((item) => item.riskLevel === "Safe");
  const atRiskItems = inventory.filter((item) => item.riskLevel === "Medium");
  const criticalItems = inventory.filter((item) => item.riskLevel === "High");

  const renderItems = (items, emptyText) => {
    if (items.length === 0) {
      return <p className="risk-empty-text">{emptyText}</p>;
    }

    return (
      <div className="risk-item-list">
        {items.map((item) => (
          <div key={item._id} className="risk-item">
            <span>{item.itemName}</span>
            <span className="risk-stock">Stock: {item.currentStock}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="panel glass-panel risk-layout-panel">
      <div className="panel-header">
        <h2>Inventory Risk Alerts</h2>
        <span className="panel-tag warning-tag">Operational Staff</span>
      </div>

      {!backendConnected ? (
        <div className="risk-empty-state">
          <h3>Backend not connected</h3>
          <p>Risk alerts will appear here when inventory data becomes available.</p>
        </div>
      ) : loading ? (
        <div className="risk-empty-state">
          <h3>Loading risk alerts...</h3>
          <p>Please wait while inventory data is being loaded.</p>
        </div>
      ) : inventory.length === 0 ? (
        <div className="risk-empty-state">
          <h3>No inventory items yet</h3>
          <p>Add inventory items to see Safe, At Risk, and Critical sections update.</p>
        </div>
      ) : (
        <div className="risk-grid">
          <div className="risk-status-card safe-section">
            <div className="risk-status-header">
              <h3>Safe</h3>
              <span className="risk-count">{safeItems.length}</span>
            </div>
            {renderItems(safeItems, "No safe items right now.")}
          </div>

          <div className="risk-status-card at-risk-section">
            <div className="risk-status-header">
              <h3>At Risk</h3>
              <span className="risk-count">{atRiskItems.length}</span>
            </div>
            {renderItems(atRiskItems, "No at-risk items right now.")}
          </div>

          <div className="risk-status-card critical-section">
            <div className="risk-status-header">
              <h3>Critical</h3>
              <span className="risk-count">{criticalItems.length}</span>
            </div>
            {renderItems(criticalItems, "No critical items right now.")}
          </div>
        </div>
      )}
    </section>
  );
}

export default InventoryRiskLayout;