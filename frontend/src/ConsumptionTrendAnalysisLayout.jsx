import React from "react";

function ConsumptionTrendAnalysisLayout() {
  return (
    <section className="panel glass-panel consumption-trend-panel">
      <div className="panel-header">
        <h2>Consumption Trend Analysis</h2>
        <span className="panel-tag">Analytics</span>
      </div>

      <div className="trend-summary-grid">
        <div className="trend-summary-card">
          <p className="trend-card-label">Total Consumption</p>
          <h3>1,240 Units</h3>
        </div>

        <div className="trend-summary-card">
          <p className="trend-card-label">Highest Usage Item</p>
          <h3>Printer Paper</h3>
        </div>

        <div className="trend-summary-card">
          <p className="trend-card-label">Average Weekly Use</p>
          <h3>310 Units</h3>
        </div>

        <div className="trend-summary-card">
          <p className="trend-card-label">Trend Direction</p>
          <h3>Increasing</h3>
        </div>
      </div>

      <div className="trend-content-grid">
        <div className="trend-chart-card">
          <div className="dashboard-section-header">
            <h3>Consumption Trend Chart</h3>
          </div>

          <div className="trend-chart-placeholder">
            Line or bar chart for weekly/monthly consumption trend will appear here.
          </div>
        </div>

        <div className="trend-filter-card">
          <div className="dashboard-section-header">
            <h3>Trend Filters</h3>
          </div>

          <form className="usage-form">
            <label>
              Item Category
              <select defaultValue="">
                <option value="" disabled>
                  Select category
                </option>
                <option value="office-supplies">Office Supplies</option>
                <option value="electronics">Electronics</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>

            <label>
              Time Range
              <select defaultValue="">
                <option value="" disabled>
                  Select time range
                </option>
                <option value="7-days">Last 7 Days</option>
                <option value="30-days">Last 30 Days</option>
                <option value="90-days">Last 90 Days</option>
              </select>
            </label>

            <button type="submit">Apply Filters</button>
          </form>
        </div>
      </div>

      <div className="trend-table-card">
        <div className="dashboard-section-header">
          <h3>Top Consumed Items</h3>
        </div>

        <div className="dashboard-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Total Used</th>
                <th>Average Use</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Printer Paper</td>
                <td>420</td>
                <td>105 / week</td>
                <td>Increasing</td>
              </tr>
              <tr>
                <td>Ink Cartridge</td>
                <td>180</td>
                <td>45 / week</td>
                <td>Stable</td>
              </tr>
              <tr>
                <td>Cleaning Supplies</td>
                <td>140</td>
                <td>35 / week</td>
                <td>Decreasing</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default ConsumptionTrendAnalysisLayout;