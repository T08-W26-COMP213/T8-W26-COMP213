import React from "react";

function ReportGenerationLayout() {
  return (
    <section className="panel glass-panel report-generation-panel">
      <div className="panel-header">
        <h2>Report Generation</h2>
        <span className="panel-tag">Reports</span>
      </div>

      <div className="report-generation-grid">
        <div className="report-form-card">
          <div className="dashboard-section-header">
            <h3>Generate Report</h3>
          </div>

          <form className="usage-form">
            <label>
              Report Type
              <select defaultValue="">
                <option value="" disabled>
                  Select report type
                </option>
                <option value="inventory-summary">Inventory Summary</option>
                <option value="usage-report">Usage Report</option>
                <option value="risk-report">Risk Report</option>
                <option value="low-stock-report">Low Stock Report</option>
              </select>
            </label>

            <label>
              Start Date
              <input type="date" />
            </label>

            <label>
              End Date
              <input type="date" />
            </label>

            <button type="submit">Generate Report</button>
          </form>
        </div>

        <div className="report-preview-card">
          <div className="dashboard-section-header">
            <h3>Report Preview</h3>
          </div>

          <div className="empty-state">
            <h3>No report generated</h3>
            <p>Select a report type and date range to generate a report preview.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReportGenerationLayout;