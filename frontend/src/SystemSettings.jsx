import React, { useEffect, useState } from "react";
import "./SystemSettings.css";

function SystemSettings() {
  const [settings, setSettings] = useState({
    highRiskPercentage: 50,
    mediumRiskPercentage: 100
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/system-settings`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch settings");
      }

      setSettings({
        highRiskPercentage: data?.riskSettings?.highRiskPercentage ?? 50,
        mediumRiskPercentage: data?.riskSettings?.mediumRiskPercentage ?? 100
      });
    } catch (error) {
      setMessage("Failed to load settings");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: value
    }));

    if (message) {
      setMessage("");
      setMessageType("");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const high = Number(settings.highRiskPercentage);
    const medium = Number(settings.mediumRiskPercentage);

    if (!high || !medium) {
      setMessage("Please enter both percentage values.");
      setMessageType("error");
      return;
    }

    if (high <= 0 || medium <= 0) {
      setMessage("Percentages must be greater than 0.");
      setMessageType("error");
      return;
    }

    if (high >= medium) {
      setMessage("High risk percentage must be less than medium risk percentage.");
      setMessageType("error");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(`${API_BASE_URL}/api/system-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          riskSettings: {
            highRiskPercentage: high,
            mediumRiskPercentage: medium
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save settings");
      }

      setMessage("Settings saved successfully");
      setMessageType("success");

      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (error) {
      setMessage(error.message || "Failed to save settings");
      setMessageType("error");
    } finally {
      setIsSaving(false);
    }
  };

  const highPreview = `${settings.highRiskPercentage || 0}%`;
  const mediumPreview = `${settings.mediumRiskPercentage || 0}%`;

  if (loading) {
    return (
      <section className="panel glass-panel risk-settings-panel">
        <div className="panel-header">
          <h2>⚙️ Risk Threshold Settings</h2>
          <span className="panel-tag">Loading</span>
        </div>
        <p className="risk-settings-loading">Loading settings...</p>
      </section>
    );
  }

  return (
    <section className="panel glass-panel risk-settings-panel">
      <div className="panel-header">
        <h2>⚙️ Risk Threshold Settings</h2>
        <span className="panel-tag">Admin Control</span>
      </div>

      <p className="risk-settings-description">
        Configure how the system classifies inventory risk levels based on the
        percentage of each item’s reorder threshold.
      </p>

      <div className="risk-settings-preview">
        <div className="risk-preview-card high">
          <span className="risk-preview-label">High Risk Rule</span>
          <strong>Stock ≤ {highPreview} of threshold</strong>
        </div>

        <div className="risk-preview-card medium">
          <span className="risk-preview-label">Medium Risk Rule</span>
          <strong>Stock ≤ {mediumPreview} of threshold</strong>
        </div>
      </div>

      <form onSubmit={handleSave} className="risk-settings-form">
        <div className="risk-settings-grid">
          <div className="risk-input-group">
            <label htmlFor="highRiskPercentage">High Risk Percentage (%)</label>

            <input
              type="range"
              id="highRiskPercentageRange"
              name="highRiskPercentage"
              min="1"
              max="100"
              value={settings.highRiskPercentage}
              onChange={handleChange}
              className="risk-slider high-slider"
            />

            <input
              type="number"
              id="highRiskPercentage"
              name="highRiskPercentage"
              min="1"
              max="100"
              value={settings.highRiskPercentage}
              onChange={handleChange}
              placeholder="Enter high risk percentage"
            />

            <small>
              Items at or below this percentage of the reorder threshold become
              high risk.
            </small>
          </div>

          <div className="risk-input-group">
            <label htmlFor="mediumRiskPercentage">Medium Risk Percentage (%)</label>

            <input
              type="range"
              id="mediumRiskPercentageRange"
              name="mediumRiskPercentage"
              min="1"
              max="200"
              value={settings.mediumRiskPercentage}
              onChange={handleChange}
              className="risk-slider medium-slider"
            />

            <input
              type="number"
              id="mediumRiskPercentage"
              name="mediumRiskPercentage"
              min="1"
              max="200"
              value={settings.mediumRiskPercentage}
              onChange={handleChange}
              placeholder="Enter medium risk percentage"
            />

            <small>
              Items at or below this percentage of the reorder threshold become
              medium risk.
            </small>
          </div>
        </div>

        <div className="risk-settings-actions">
          <button type="submit" className="save-settings-button" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {message && (
          <div className={`risk-settings-message ${messageType}`}>
            {messageType === "success" ? "✅" : "⚠️"} {message}
          </div>
        )}
      </form>
    </section>
  );
}

export default SystemSettings;