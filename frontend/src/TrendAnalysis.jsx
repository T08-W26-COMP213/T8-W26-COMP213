import { useMemo } from "react";
import "./TrendAnalysis.css";

function TrendAnalysis({ inventory = [], usageLogs = [] }) {

  const totalStock = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.currentStock, 0);
  }, [inventory]);

  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.currentStock <= item.reorderThreshold);
  }, [inventory]);

  const highRiskItems = useMemo(() => {
    return inventory.filter(item => item.riskLevel === "High");
  }, [inventory]);

  return (
    <div className="trend-container">

      {/* HEADER */}
      <div className="trend-header">
        <h2>Trend Analysis Dashboard</h2>
        <p>Analyze stock usage trends and monitor inventory performance.</p>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <p>Total Items</p>
          <h3>{inventory.length}</h3>
        </div>

        <div className="stat-card">
          <p>Total Stock</p>
          <h3>{totalStock}</h3>
        </div>

        <div className="stat-card">
          <p>Low Stock</p>
          <h3>{lowStockItems.length}</h3>
        </div>

        <div className="stat-card">
          <p>High Risk</p>
          <h3>{highRiskItems.length}</h3>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      <div className="trend-card">
        <h3>Inventory Table</h3>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Used</th>
                <th>Risk</th>
              </tr>
            </thead>

            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty">No inventory data</td>
                </tr>
              ) : (
                inventory.map(item => (
                  <tr key={item._id}>
                    <td>{item.itemName}</td>
                    <td>{item.currentStock}</td>
                    <td>{item.reorderThreshold}</td>
                    <td>{item.totalUsed}</td>
                    <td className={`risk ${item.riskLevel?.toLowerCase()}`}>
                      {item.riskLevel}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USAGE TABLE */}
      <div className="trend-card">
        <h3>Usage Trends</h3>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity Used</th>
                <th>Date</th>
                <th>Risk</th>
              </tr>
            </thead>

            <tbody>
              {usageLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty">No usage data</td>
                </tr>
              ) : (
                usageLogs.map(log => (
                  <tr key={log._id}>
                    <td>{log.itemName}</td>
                    <td>{log.quantityUsed}</td>
                    <td>{new Date(log.usageDate).toLocaleDateString()}</td>
                    <td className={`risk ${log.riskLevel?.toLowerCase()}`}>
                      {log.riskLevel}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default TrendAnalysis;