import React, { useState } from "react";

function ReportGenerationLayout() {
  const [reportType, setReportType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generated, setGenerated] = useState(false);
  const [message, setMessage] = useState("");

  const handleGenerateReport = (e) => {
    e.preventDefault();

    if (!reportType || !startDate || !endDate) {
      alert("Please select report type and date range.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after end date.");
      return;
    }

    setGenerated(true);

    const fileName = `${reportType}_${startDate}_to_${endDate}.csv`;
    setMessage(`Report exported successfully: ${fileName}`);
  };

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

          <form className="usage-form" onSubmit={handleGenerateReport}>
            <label>
              Report Type
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
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
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>

            <label>
              End Date
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>

            <button type="submit">Generate Report</button>
          </form>
          {message && (
            <div className="status-message success" style={{ marginTop: "10px" }}>
                {message}
            </div>
            )}
        </div>

        <div className="report-preview-card">
          <div className="dashboard-section-header">
            <h3>Report Preview</h3>
          </div>

          {!generated ? (
            <div className="empty-state">
              <h3>No report generated</h3>
              <p>Select a report type and date range to generate a report preview.</p>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Filtered Report Ready</h3>
              <p>
                Report Type: <strong>{reportType}</strong>
              </p>
              <p>
                Date Range: <strong>{startDate}</strong> to <strong>{endDate}</strong>
              </p>
              <p>The report data will now be filtered using this selected date range.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ReportGenerationLayout;