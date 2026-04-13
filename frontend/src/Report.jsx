function Report({
  inventory,
  usageLogs,
  lowStockItems,
  highRiskItems,
  itemsByRiskLevel,
  totalItems,
  totalUnitsRemaining,
  onEditItem,
  formatUsageDate
}) {
  const topUsageItems = [...inventory]
    .sort((a, b) => (b.totalUsed || 0) - (a.totalUsed || 0))
    .slice(0, 5);

  const safeCount = itemsByRiskLevel?.Low?.length || 0;
  const atRiskCount = itemsByRiskLevel?.Medium?.length || 0;
  const criticalCount = itemsByRiskLevel?.High?.length || 0;

  const totalUnitsUsed = inventory.reduce((sum, item) => sum + (item.totalUsed || 0), 0);

  const getDisplayRisk = (riskLevel) => {
    if (riskLevel === "High") return "Critical";
    if (riskLevel === "Medium") return "At Risk";
    return "Safe";
  };

  const getRiskClass = (riskLevel) => {
    if (riskLevel === "High") return "high";
    if (riskLevel === "Medium") return "medium";
    return "low";
  };

  const formatDateValue = (value) => {
    if (typeof formatUsageDate === "function") {
      return formatUsageDate(value);
    }
    return value ? new Date(value).toLocaleDateString() : "N/A";
  };

  const getUsageLogsForItem = (itemName) => {
    return usageLogs.filter((log) => log.itemName === itemName);
  };

  const getActiveDays = (itemName) => {
    const itemLogs = getUsageLogsForItem(itemName);

    if (itemLogs.length === 0) {
      return 1;
    }

    const validDates = itemLogs
      .map((log) => new Date(log.usageDate))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a - b);

    if (validDates.length === 0) {
      return 1;
    }

    const firstUsageDate = validDates[0];
    const today = new Date();
    const diffTime = today - firstUsageDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(diffDays, 1);
  };

  const consumptionRateData = [...inventory]
    .map((item) => {
      const totalUsed = item.totalUsed || 0;
      const activeDays = getActiveDays(item.itemName);
      const usageRate = totalUsed > 0 ? totalUsed / activeDays : 0;
      const daysToDepletion =
        usageRate > 0 ? Math.floor(item.currentStock / usageRate) : null;

      return {
        ...item,
        totalUsed,
        activeDays,
        usageRate: Number(usageRate.toFixed(2)),
        daysToDepletion
      };
    })
    .sort((a, b) => b.usageRate - a.usageRate);

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
          <p className="stat-title">Total Units Used</p>
          <h3>{totalUnitsUsed}</h3>
        </div>

        <div className="stat-card">
          <p className="stat-title">Low Stock Alerts</p>
          <h3>{lowStockItems.length}</h3>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel glass-panel">
          <div className="panel-header">
            <h2>Risk Breakdown Summary</h2>
            <span className="panel-tag">Statistics</span>
          </div>

          <section className="stats-grid" style={{ marginBottom: 0 }}>
            <div className="stat-card">
              <p className="stat-title">Safe Items</p>
              <h3>{safeCount}</h3>
            </div>

            <div className="stat-card">
              <p className="stat-title">At Risk Items</p>
              <h3>{atRiskCount}</h3>
            </div>

            <div className="stat-card">
              <p className="stat-title">Critical Items</p>
              <h3>{criticalCount}</h3>
            </div>
          </section>
        </div>

        <div className="panel glass-panel">
          <div className="panel-header">
            <h2>Top Usage Items</h2>
            <span className="panel-tag">Top 5</span>
          </div>

          {topUsageItems.length === 0 ? (
            <div className="empty-state">
              <h3>No usage data yet</h3>
              <p>Top usage items will appear here after inventory usage is recorded.</p>
            </div>
          ) : (
            <div className="alert-list">
              {topUsageItems.map((item, index) => (
                <div className="alert-item" key={item._id}>
                  <div>
                    <h4>
                      #{index + 1} {item.itemName}
                    </h4>
                    <p>
                      Total Used: <strong>{item.totalUsed || 0}</strong>
                    </p>
                    <p>
                      Current Stock: <strong>{item.currentStock}</strong>
                    </p>
                    <p>
                      Threshold: <strong>{item.reorderThreshold}</strong>
                    </p>
                  </div>

                  <span className={`risk-badge ${getRiskClass(item.riskLevel)}`}>
                    {getDisplayRisk(item.riskLevel)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="table-panel">
        <div className="panel-header">
          <h2>Consumption Rate Analysis</h2>
          <span className="panel-tag">Usage Rate</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Current Stock</th>
                <th>Total Used</th>
                <th>Active Days</th>
                <th>Usage Rate / Day</th>
                <th>Days to Depletion</th>
                <th>Risk Level</th>
              </tr>
            </thead>

            <tbody>
              {consumptionRateData.length === 0 ? (
                <tr>
                  <td colSpan="7">No inventory data available for consumption analysis.</td>
                </tr>
              ) : (
                consumptionRateData.map((item) => (
                  <tr key={item._id}>
                    <td>{item.itemName}</td>
                    <td>{item.currentStock}</td>
                    <td>{item.totalUsed}</td>
                    <td>{item.activeDays}</td>
                    <td>{item.usageRate}</td>
                    <td>
                      {item.daysToDepletion === null ? (
                        <span className="depletion-na">N/A</span>
                      ) : (
                        <span
                          className={`depletion-days ${
                            item.daysToDepletion <= 7
                              ? "critical"
                              : item.daysToDepletion <= 14
                              ? "warning"
                              : "safe"
                          }`}
                        >
                          {item.daysToDepletion} days
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`risk-badge ${getRiskClass(item.riskLevel)}`}>
                        {getDisplayRisk(item.riskLevel)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              High: "🔴 Critical Items",
              Medium: "🟡 At Risk Items",
              Low: "🟢 Safe Items"
            };

            const levelClass = `${level.toLowerCase()}-risk-item`;
            const titleClass = `${level.toLowerCase()}-risk-title`;

            return (
              <div className="risk-category" key={level}>
                <h3 className={`category-title ${titleClass}`}>
                  {titleMap[level]} ({items.length})
                </h3>

                {items.length === 0 ? (
                  <p className="empty-category">No items in this category</p>
                ) : (
                  <div className="items-list">
                    {items.map((item) => (
                      <div className={`category-item ${levelClass}`} key={item._id}>
                        <div className="item-info">
                          <h4>{item.itemName}</h4>
                          <p>
                            Stock: <strong>{item.currentStock}</strong> | Threshold:{" "}
                            <strong>{item.reorderThreshold}</strong> | Used:{" "}
                            <strong>{item.totalUsed || 0}</strong>
                          </p>
                        </div>

                        <span className={`category-label ${level.toLowerCase()}-label`}>
                          {getDisplayRisk(level)}
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
                <th>Threshold</th>
                <th>Total Used</th>
                <th>Risk Level</th>
                {typeof onEditItem === "function" && <th>Action</th>}
              </tr>
            </thead>

            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={typeof onEditItem === "function" ? "6" : "5"}>
                    No inventory items added yet.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item._id}>
                    <td>{item.itemName}</td>
                    <td>{item.currentStock}</td>
                    <td>{item.reorderThreshold}</td>
                    <td>{item.totalUsed || 0}</td>
                    <td>
                      <span className={`risk-badge ${getRiskClass(item.riskLevel)}`}>
                        {getDisplayRisk(item.riskLevel)}
                      </span>
                    </td>

                    {typeof onEditItem === "function" && (
                      <td>
                        <button type="button" onClick={() => onEditItem(item)}>
                          Edit
                        </button>
                      </td>
                    )}
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
                    <td>{formatDateValue(log.usageDate)}</td>
                    <td>{log.remainingStock}</td>
                    <td>
                      <span className={`risk-badge ${getRiskClass(log.riskLevel)}`}>
                        {getDisplayRisk(log.riskLevel)}
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