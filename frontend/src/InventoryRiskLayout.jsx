import React, { useState } from "react";

function InventoryRiskLayout({ inventory = [], loading = false, backendConnected = false }) {
  const [filterOption, setFilterOption] = useState("all");

  const safeItems = inventory.filter((item) => item.riskLevel === "Low");
  const atRiskItems = inventory.filter((item) => item.riskLevel === "Medium");
  const criticalItems = inventory.filter((item) => item.riskLevel === "High");

  const riskChartData = [
    { label: "Safe", count: safeItems.length, className: "safe" },
    { label: "At Risk", count: atRiskItems.length, className: "at-risk" },
    { label: "Critical", count: criticalItems.length, className: "critical" }
  ];

  const maxRiskCount = Math.max(...riskChartData.map((item) => item.count), 1);

  const renderItems = (items, emptyText) => {
    if (items.length === 0) {
      return <p className="risk-empty-text">{emptyText}</p>;
    }

    return (
      <div className="risk-item-list">
        {items.map((item) => (
          <div key={item._id} className="risk-item">
            <div className="risk-item-left">
              {item.riskLevel === "High" && <span className="critical-icon">⚠️</span>}
              <span className="risk-item-name">{item.itemName}</span>
            </div>
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

      {backendConnected && !loading && inventory.length > 0 && (
        <div className="risk-filter-bar">
          <label htmlFor="riskFilter">Filter View:</label>
          <select
            id="riskFilter"
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
            className="risk-filter-select"
          >
            <option value="all">All Items</option>
            <option value="safe">Safe Only</option>
            <option value="atRisk">At Risk Only</option>
            <option value="critical">Critical Only</option>
          </select>
        </div>
      )}

      {backendConnected && !loading && inventory.length > 0 && (
        <div className="risk-chart-panel">
          <div className="risk-chart-header">
            <h3>Risk Level Overview</h3>
            <span className="risk-chart-subtitle">Simple Bar Chart</span>
          </div>

          <div className="risk-chart">
            {riskChartData.map((item) => (
              <div className="risk-chart-row" key={item.label}>
                <div className="risk-chart-label">{item.label}</div>

                <div className="risk-chart-track">
                  <div
                    className={`risk-chart-fill ${item.className}`}
                    style={{ width: `${(item.count / maxRiskCount) * 100}%` }}
                  ></div>
                </div>

                <div className="risk-chart-count">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          {(filterOption === "all" || filterOption === "safe") && (
            <div className="risk-status-card safe-section">
              <div className="risk-status-header">
                <h3>Safe</h3>
                <span className="risk-count">{safeItems.length}</span>
              </div>
              {renderItems(safeItems, "No safe items right now.")}
            </div>
          )}

          {(filterOption === "all" || filterOption === "atRisk") && (
            <div className="risk-status-card at-risk-section">
              <div className="risk-status-header">
                <h3>At Risk</h3>
                <span className="risk-count">{atRiskItems.length}</span>
              </div>
              {renderItems(atRiskItems, "No at-risk items right now.")}
            </div>
          )}

          {(filterOption === "all" || filterOption === "critical") && (
            <div className="risk-status-card critical-section">
              <div className="risk-status-header">
                <h3>Critical</h3>
                <span className="risk-count">{criticalItems.length}</span>
              </div>
              {renderItems(criticalItems, "No critical items right now.")}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default InventoryRiskLayout;