import React, { useEffect, useMemo, useState } from "react";
import ConfirmationBanner from "./ConfirmationBanner";
import "./SystemConfiguration.css";

function SystemConfigurationLayout() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const defaultSettings = {
    systemName: "StockGuard System",
    organizationName: "Default Organization",
    timezone: "America/Toronto",
    language: "English",
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    autoRiskCalculation: true,
    emailAlerts: true,
    lowStockAlerts: true,
    criticalAlerts: true,
    sessionTimeout: 30,
    roleBasedAccess: true,
    auditLogging: true,
    darkMode: false,
    refreshInterval: 15
  };

  const [settings, setSettings] = useState(defaultSettings);
  const [initialSettings, setInitialSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value
    }));

    if (message) {
      clearMessage();
    }
  };

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/system-settings`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch system settings.");
      }

      const mergedSettings = {
        ...defaultSettings,
        ...data
      };

      setSettings(mergedSettings);
      setInitialSettings({ ...mergedSettings });
    } catch (error) {
      setSettings(defaultSettings);
      setInitialSettings({ ...defaultSettings });
      showMessage("Using default frontend settings for now.", "success");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    clearMessage();

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE_URL}/api/system-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save system settings.");
      }

      const savedSettings = {
        ...defaultSettings,
        ...(data.settings || settings)
      };

      setSettings(savedSettings);
      setInitialSettings({ ...savedSettings });
      showMessage(data.message || "System settings updated successfully.", "success");
    } catch (error) {
      showMessage(error.message || "Backend not connected yet. Frontend design is ready.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSettings(defaultSettings);
    showMessage("Settings reset to defaults locally. Click Save to apply.", "success");
  };

  return (
    <section className="panel glass-panel system-config-panel">
      <div className="panel-header system-config-header">
        <div>
          <h2>System Configuration</h2>
          <p className="system-config-subtext">
            Configure organization-wide settings, alert behavior, access controls,
            and operational preferences for StockGuard.
          </p>
        </div>

        <div className="system-config-header-right">
          <span className="panel-tag">Admin Settings</span>
          {hasUnsavedChanges && <span className="unsaved-badge">Unsaved Changes</span>}
        </div>
      </div>

      <ConfirmationBanner message={message} type={messageType} onClose={clearMessage} />

      {loading ? (
        <div className="empty-state">
          <h3>Loading system settings...</h3>
          <p>Please wait while the configuration console is prepared.</p>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="system-config-form">
          <div className="system-config-grid">
            <div className="system-config-card">
              <div className="dashboard-section-header system-card-header">
                <div className="system-card-icon">⚙️</div>
                <div>
                  <h3>General Settings</h3>
                  <p>Core organization and regional setup</p>
                </div>
              </div>

              <label>
                System Name
                <input
                  type="text"
                  name="systemName"
                  value={settings.systemName}
                  onChange={handleChange}
                  placeholder="Enter system name"
                />
              </label>

              <label>
                Organization Name
                <input
                  type="text"
                  name="organizationName"
                  value={settings.organizationName}
                  onChange={handleChange}
                  placeholder="Enter organization name"
                />
              </label>

              <label>
                Timezone
                <select name="timezone" value={settings.timezone} onChange={handleChange}>
                  <option value="America/Toronto">America/Toronto</option>
                  <option value="America/Vancouver">America/Vancouver</option>
                  <option value="America/Edmonton">America/Edmonton</option>
                  <option value="America/Halifax">America/Halifax</option>
                </select>
              </label>

              <label>
                Language
                <select name="language" value={settings.language} onChange={handleChange}>
                  <option value="English">English</option>
                  <option value="French">French</option>
                </select>
              </label>
            </div>

            <div className="system-config-card">
              <div className="dashboard-section-header system-card-header">
                <div className="system-card-icon">📦</div>
                <div>
                  <h3>Inventory Controls</h3>
                  <p>Thresholds and automated stock logic</p>
                </div>
              </div>

              <label>
                Default Low Stock Threshold
                <input
                  type="number"
                  name="lowStockThreshold"
                  min="1"
                  value={settings.lowStockThreshold}
                  onChange={handleChange}
                />
              </label>

              <label>
                Critical Stock Threshold
                <input
                  type="number"
                  name="criticalStockThreshold"
                  min="1"
                  value={settings.criticalStockThreshold}
                  onChange={handleChange}
                />
              </label>

              <label className="toggle-setting premium-toggle-row">
                <div>
                  <span>Automatic Risk Calculation</span>
                  <small>Recalculate risk levels based on stock movement</small>
                </div>
                <span className="switch">
                  <input
                    type="checkbox"
                    name="autoRiskCalculation"
                    checked={settings.autoRiskCalculation}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </span>
              </label>
            </div>

            <div className="system-config-card">
              <div className="dashboard-section-header system-card-header">
                <div className="system-card-icon">🔔</div>
                <div>
                  <h3>Alert Settings</h3>
                  <p>Notification rules and stock alerts</p>
                </div>
              </div>

              <label className="toggle-setting premium-toggle-row">
                <div>
                  <span>Email Alerts</span>
                  <small>Send alert notifications by email</small>
                </div>
                <span className="switch">
                  <input
                    type="checkbox"
                    name="emailAlerts"
                    checked={settings.emailAlerts}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </span>
              </label>

              <label className="toggle-setting premium-toggle-row">
                <div>
                  <span>Low Stock Alerts</span>
                  <small>Notify when stock reaches reorder level</small>
                </div>
                <span className="switch">
                  <input
                    type="checkbox"
                    name="lowStockAlerts"
                    checked={settings.lowStockAlerts}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </span>
              </label>

              <label className="toggle-setting premium-toggle-row">
                <div>
                  <span>Critical Alerts</span>
                  <small>Trigger urgent alerts for critical stock levels</small>
                </div>
                <span className="switch">
                  <input
                    type="checkbox"
                    name="criticalAlerts"
                    checked={settings.criticalAlerts}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </span>
              </label>
            </div>

            <div className="system-config-card">
              <div className="dashboard-section-header system-card-header">
                <div className="system-card-icon">🔐</div>
                <div>
                  <h3>Security & Access</h3>
                  <p>Session rules and access governance</p>
                </div>
              </div>

              <label>
                Session Timeout (minutes)
                <input
                  type="number"
                  name="sessionTimeout"
                  min="5"
                  value={settings.sessionTimeout}
                  onChange={handleChange}
                />
              </label>

              <label className="toggle-setting premium-toggle-row">
                <div>
                  <span>Role-Based Access Control</span>
                  <small>Restrict features based on user role</small>
                </div>
                <span className="switch">
                  <input
                    type="checkbox"
                    name="roleBasedAccess"
                    checked={settings.roleBasedAccess}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </span>
              </label>

              <label className="toggle-setting premium-toggle-row">
                <div>
                  <span>Audit Logging</span>
                  <small>Track administrative and system actions</small>
                </div>
                <span className="switch">
                  <input
                    type="checkbox"
                    name="auditLogging"
                    checked={settings.auditLogging}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </span>
              </label>
            </div>

            <div className="system-config-card">
              <div className="dashboard-section-header system-card-header">
                <div className="system-card-icon">🖥️</div>
                <div>
                  <h3>System Preferences</h3>
                  <p>Display behavior and runtime refresh</p>
                </div>
              </div>

              <label className="toggle-setting premium-toggle-row">
                <div>
                  <span>Dark Mode</span>
                  <small>Enable a darker console appearance</small>
                </div>
                <span className="switch">
                  <input
                    type="checkbox"
                    name="darkMode"
                    checked={settings.darkMode}
                    onChange={handleChange}
                  />
                  <span className="slider"></span>
                </span>
              </label>

              <label>
                Refresh Interval (seconds)
                <input
                  type="number"
                  name="refreshInterval"
                  min="5"
                  value={settings.refreshInterval}
                  onChange={handleChange}
                />
              </label>
            </div>
          </div>

          <div className="system-config-actions sticky-actions">
            <div className="settings-status-inline">
              <span className={`status-dot ${hasUnsavedChanges ? "pending" : "saved"}`}></span>
              <span>{hasUnsavedChanges ? "Changes pending" : "All changes saved"}</span>
            </div>

            <div className="settings-action-buttons">
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </button>

              <button
                type="button"
                className="secondary-action-btn"
                onClick={handleResetDefaults}
                disabled={saving}
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

export default SystemConfigurationLayout;