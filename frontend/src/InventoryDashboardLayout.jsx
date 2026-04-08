import React from "react";

function InventoryDashboardLayout({ inventory = [], loading, backendConnected }) {
  const totalItems = inventory.length;

  const totalStock = inventory.reduce(
    (sum, item) => sum + (item.currentStock || 0),
    0
  );

  const atRiskItems = inventory.filter(
    (item) => item.riskLevel === "Medium"
  ).length;

  const criticalItems = inventory.filter(
    (item) => item.riskLevel === "High"
  ).length;

  return (
    <section className="panel glass-panel dashboard-layout-panel">
      <div className="panel-header">
        <h2>Inventory Summary Dashboard</h2>
        <span className="panel-tag">Business Owner</span>
      </div>

      <div className="dashboard-summary-grid">
        <div className="dashboard-summary-card">
          <p>Total Inventory Items</p>
          <h3>{totalItems}</h3>
        </div>

        <div className="dashboard-summary-card">
          <p>Total Stock Count</p>
          <h3>{totalStock}</h3>
        </div>

        <div className="dashboard-summary-card">
          <p>At Risk Items</p>
          <h3>{atRiskItems}</h3>
        </div>

        <div className="dashboard-summary-card">
          <p>Critical Items</p>
          <h3>{criticalItems}</h3>
        </div>
      </div>

      <div className="dashboard-table-card">
        <h3>Inventory Table</h3>

        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Stock Level</th>
              <th>Risk Status</th>
            </tr>
          </thead>

          <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan="3">
                  {loading ? "Loading..." : "No inventory data"}
                </td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr key={item._id}>
                  <td>{item.itemName}</td>
                  <td>{item.currentStock}</td>
                  <td>{item.riskLevel}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    <div className="dashboard-chart-card">
  <h3>Inventory Chart</h3>

  {inventory.length === 0 ? (
    <p>{loading ? "Loading chart..." : "No inventory data available."}</p>
  ) : (
    <div className="dashboard-bar-chart">
      {inventory.slice(0, 8).map((item) => {
        const maxStock = Math.max(...inventory.map((i) => i.currentStock), 1);

        return (
          <div key={item._id} className="dashboard-bar-row">
            <span className="dashboard-bar-label">{item.itemName}</span>

            <div className="dashboard-bar-track">
              <div
                className="dashboard-bar-fill"
                style={{
                  width: `${(item.currentStock / maxStock) * 100}%`
                }}
              ></div>
            </div>

            <span className="dashboard-bar-value">{item.currentStock}</span>
          </div>
        );
      })}
    </div>
  )}
</div>
    </section>
  );
}

export default InventoryDashboardLayout;