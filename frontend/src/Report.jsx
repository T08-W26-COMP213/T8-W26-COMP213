function Report({
  inventory,
  usageLogs,
  lowStockItems,
  highRiskItems,
  itemsByRiskLevel,
  totalItems,
  totalUnitsRemaining
}) {
  return (
    <>
      <section className="stats-grid">
        <div className="stat-card">
          <p className="stat-title">Total Inventory Items</p>
          <h3>{totalItems}</h3>
        </div>

        <div className="stat-card">
          <p className="stat-title">Units Remaining</p>
          <h3>{totalUnitsRemaining}</h3>
        </div>

        <div className="stat-card">
          <p className="stat-title">Low Stock Alerts</p>
          <h3>{lowStockItems.length}</h3>
        </div>

        <div className="stat-card">
          <p className="stat-title">High Risk Items</p>
          <h3>{highRiskItems.length}</h3>
        </div>
      </section>

      <section className="panel glass-panel">
        <div className="panel-header">
          <h2>Items by Risk Category</h2>
          <span className="panel-tag">Classification</span>
        </div>

        <div className="category-container">
          {Object.entries(itemsByRiskLevel).map(([level, items]) => {
            const titleMap = {
              High: "🔴 High Risk Items",
              Medium: "🟡 Medium Risk Items",
              Low: "🟢 Low Risk Items"
            };
            const levelClass = `${level.toLowerCase()}-risk-item`;
            const titleClass = `${level.toLowerCase()}-risk-title`;

            return (
              <div className="risk-category" key={level}>
                <h3 className={`category-title ${titleClass}`}>
                  {titleMap[level]} ({items.length})
                </h3>
                {items.length === 0 ? (
                  <p className="empty-category">No {level.toLowerCase()}-risk items</p>
                ) : (
                  <div className="items-list">
                    {items.map((item) => (
                      <div className={`category-item ${levelClass}`} key={item._id}>
                        <div className="item-info">
                          <h4>{item.itemName}</h4>
                          <p>
                            Stock: <strong>{item.currentStock}</strong> | Threshold: <strong>{item.reorderThreshold}</strong> | Used: <strong>{item.totalUsed}</strong>
                          </p>
                        </div>
                        <span className={`category-label ${level.toLowerCase()}-label`}>
                          {level}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="table-panel">
        <div className="panel-header">
          <h2>Inventory Overview</h2>
          <span className="panel-tag">System Summary</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Stock Level</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="3">No inventory items added yet.</td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item._id}>
                    <td>{item.itemName}</td>
                    <td>{item.currentStock}</td>
                    <td>
                      <span className={`risk-badge ${item.riskLevel.toLowerCase()}`}>
                        {item.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="table-panel">
        <div className="panel-header">
          <h2>Inventory Usage Log</h2>
          <span className="panel-tag">Submission History</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity Used</th>
                <th>Date</th>
                <th>Remaining Stock</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {usageLogs.length === 0 ? (
                <tr>
                  <td colSpan="5">No usage records submitted yet.</td>
                </tr>
              ) : (
                usageLogs.map((log) => (
                  <tr key={log._id}>
                    <td>{log.itemName}</td>
                    <td>{log.quantityUsed}</td>
                    <td>{log.usageDate || "N/A"}</td>
                    <td>{log.remainingStock}</td>
                    <td>
                      <span className={`risk-badge ${log.riskLevel.toLowerCase()}`}>
                        {log.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default Report;
