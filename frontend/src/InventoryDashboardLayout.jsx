import React from "react";

function InventoryDashboardLayout() {
  return (
    <section className="panel glass-panel dashboard-layout-panel">
      <div className="panel-header">
        <h2>Inventory Summary Dashboard</h2>
        <span className="panel-tag">Business Owner</span>
      </div>

      <div className="dashboard-summary-grid">
        <div className="dashboard-summary-card">
          <p className="dashboard-card-label">Total Inventory Items</p>
          <h3>0</h3>
        </div>

        <div className="dashboard-summary-card">
          <p className="dashboard-card-label">Total Stock Count</p>
          <h3>0</h3>
        </div>

        <div className="dashboard-summary-card">
          <p className="dashboard-card-label">At Risk Items</p>
          <h3>0</h3>
        </div>

        <div className="dashboard-summary-card">
          <p className="dashboard-card-label">Critical Items</p>
          <h3>0</h3>
        </div>
      </div>

      <div className="dashboard-content-stack">
        <div className="dashboard-table-card">
          <div className="dashboard-section-header">
            <h3>Inventory Table</h3>
          </div>

          <div className="dashboard-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Stock Level</th>
                  <th>Risk Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="3">Inventory data will appear here.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-section-header">
            <h3>Inventory Chart</h3>
          </div>

          <div className="dashboard-chart-placeholder">
            <p>Chart visualization will appear here.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InventoryDashboardLayout;