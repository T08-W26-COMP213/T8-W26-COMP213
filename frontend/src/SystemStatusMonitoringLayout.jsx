import React from "react";

function SystemStatusMonitoringLayout() {
  return (
    <section className="panel glass-panel system-status-panel">
      <div className="panel-header">
        <h2>System Status Monitoring</h2>
        <span className="panel-tag">Monitoring</span>
      </div>

      <div className="status-grid">
        <div className="status-card">
          <div className="dashboard-section-header">
            <h3>Server Status</h3>
          </div>
          <p className="status-label online">Online</p>
          <p>Backend server is running normally.</p>
        </div>

        <div className="status-card">
          <div className="dashboard-section-header">
            <h3>Database Status</h3>
          </div>
          <p className="status-label online">Connected</p>
          <p>Database connection is healthy.</p>
        </div>

        <div className="status-card">
          <div className="dashboard-section-header">
            <h3>API Health</h3>
          </div>
          <p className="status-label warning">Stable</p>
          <p>All API endpoints are responding.</p>
        </div>

        <div className="status-card">
          <div className="dashboard-section-header">
            <h3>Last Sync</h3>
          </div>
          <p className="status-label neutral">2 mins ago</p>
          <p>Latest inventory data synchronization completed.</p>
        </div>
      </div>

      <div className="status-table-card">
        <div className="dashboard-section-header">
          <h3>Recent System Events</h3>
        </div>

        <div className="dashboard-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Component</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>10:15 AM</td>
                <td>Backend</td>
                <td>Online</td>
                <td>Server running normally</td>
              </tr>
              <tr>
                <td>10:10 AM</td>
                <td>Database</td>
                <td>Connected</td>
                <td>Connection successful</td>
              </tr>
              <tr>
                <td>10:05 AM</td>
                <td>API</td>
                <td>Stable</td>
                <td>All routes responding</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default SystemStatusMonitoringLayout;