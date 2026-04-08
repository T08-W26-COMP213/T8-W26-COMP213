import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import "./ReportDashboard.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api/reports/inventory-summary`;

const PIE_COLORS = {
  High: "#dc2626",
  Medium: "#f59e0b",
  Low: "#16a34a"
};

const getRiskBadgeClass = (riskLevel) => {
  if (riskLevel === "High") return "risk-badge high";
  if (riskLevel === "Medium") return "risk-badge medium";
  return "risk-badge low";
};

function ReportDashboard() {
  const [reportData, setReportData] = useState(null);
  const [selectedItem, setSelectedItem] = useState("All Items");
  const [reportType, setReportType] = useState("stock-levels");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch report data");
        }

        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err.message || "Something went wrong while loading reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const filteredUsageData = useMemo(() => {
    if (!reportData?.usageTrends) return [];

    if (selectedItem === "All Items") {
      return [...reportData.usageTrends]
        .sort((a, b) => b.totalUsed - a.totalUsed)
        .slice(0, 8);
    }

    return reportData.usageTrends.filter((item) => item.name === selectedItem);
  }, [reportData, selectedItem]);

  const selectedItemDetails = useMemo(() => {
    if (!reportData?.itemDetails || selectedItem === "All Items") return null;
    return reportData.itemDetails.find((item) => item.itemName === selectedItem) || null;
  }, [reportData, selectedItem]);

  const itemOptions = useMemo(() => {
    if (!reportData?.itemDetails) return ["All Items"];
    return ["All Items", ...reportData.itemDetails.map((item) => item.itemName)];
  }, [reportData]);

  const stockHealthWidth = useMemo(() => {
    if (!selectedItemDetails) return 0;
    const percentage =
      (selectedItemDetails.currentStock / selectedItemDetails.reorderThreshold) * 100;
    return Math.min(percentage, 100);
  }, [selectedItemDetails]);

  if (loading) {
    return <div className="report-message">Loading report dashboard...</div>;
  }

  if (error) {
    return <div className="report-message error">{error}</div>;
  }

  return (
    <div className="report-dashboard">
      <div className="report-heading-row">
        <div>
          <p className="report-eyebrow">Analytics Overview</p>
          <h2 className="report-title">Inventory Report Dashboard</h2>
          <p className="report-subtitle">
            Monitor stock usage, compare risk levels, and review item performance.
          </p>
        </div>
      </div>

      <div className="report-cards">
        {reportType === "stock-levels" && (
          <>
            <div className="report-card">
              <span className="card-label">Total Items</span>
              <h3>{reportData.totalItems}</h3>
            </div>

            <div className="report-card">
              <span className="card-label">Stock Remaining</span>
              <h3>{reportData.totalStockRemaining}</h3>
            </div>

            <div className="report-card">
              <span className="card-label">Low Stock Items</span>
              <h3>{reportData.lowStockItems}</h3>
            </div>

            <div className="report-card">
              <span className="card-label">High Risk Items</span>
              <h3>{reportData.highRiskItems}</h3>
            </div>
          </>
        )}

        {reportType === "risk-analysis" && (
          <>
            <div className="report-card">
              <span className="card-label">High Risk Items</span>
              <h3>{reportData.highRiskItems}</h3>
            </div>

            <div className="report-card">
              <span className="card-label">Low Stock Items</span>
              <h3>{reportData.lowStockItems}</h3>
            </div>

            <div className="report-card">
              <span className="card-label">Total Items</span>
              <h3>{reportData.totalItems}</h3>
            </div>

            <div className="report-card">
              <span className="card-label">Stock Remaining</span>
              <h3>{reportData.totalStockRemaining}</h3>
            </div>
          </>
        )}

        {reportType === "usage-history" && (
          <>
            <div className="report-card">
              <span className="card-label">Total Units Used</span>
              <h3>{reportData.totalUnitsUsed}</h3>
            </div>

            <div className="report-card">
              <span className="card-label">Total Items</span>
              <h3>{reportData.totalItems}</h3>
            </div>

            <div className="report-card">
              <span className="card-label">Stock Remaining</span>
              <h3>{reportData.totalStockRemaining}</h3>
            </div>

            <div className="report-card">
              <span className="card-label">Low Stock Items</span>
              <h3>{reportData.lowStockItems}</h3>
            </div>
          </>
        )}
      </div>

      <div className="report-filter-card">
        <div>
          <p className="filter-title">Report Type</p>
          <p className="filter-subtitle">
            Select a report category to view different inventory insights.
          </p>
        </div>

        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="report-filter-select"
        >
          <option value="stock-levels">Stock Levels</option>
          <option value="risk-analysis">Risk Analysis</option>
          <option value="usage-history">Usage History</option>
        </select>
      </div>

      <div className="report-filter-card">
        <div>
          <p className="filter-title">Filter by Item</p>
          <p className="filter-subtitle">
            Choose one item to view a focused summary and chart.
          </p>
        </div>

        <select
          value={selectedItem}
          onChange={(e) => setSelectedItem(e.target.value)}
          className="report-filter-select"
        >
          {itemOptions.map((itemName) => (
            <option key={itemName} value={itemName}>
              {itemName}
            </option>
          ))}
        </select>
      </div>

      {selectedItemDetails && (
        <div className="selected-item-card">
          <div className="selected-item-header">
            <div>
              <p className="selected-item-label">Selected Item</p>
              <h3>{selectedItemDetails.itemName}</h3>
            </div>

            <span className={getRiskBadgeClass(selectedItemDetails.riskLevel)}>
              {selectedItemDetails.riskLevel}
            </span>
          </div>

          <div className="selected-item-grid">
            <div className="detail-box">
              <span className="detail-label">Current Stock</span>
              <p>{selectedItemDetails.currentStock}</p>
            </div>

            <div className="detail-box">
              <span className="detail-label">Reorder Threshold</span>
              <p>{selectedItemDetails.reorderThreshold}</p>
            </div>

            <div className="detail-box">
              <span className="detail-label">Total Used</span>
              <p>{selectedItemDetails.totalUsed}</p>
            </div>

            <div className="detail-box">
              <span className="detail-label">Risk Level</span>
              <p>{selectedItemDetails.riskLevel}</p>
            </div>
          </div>
        </div>
      )}

      <div className="report-chart-grid">
        {reportType === "stock-levels" && selectedItemDetails && (
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3>Stock Health</h3>
                <p>Live stock position compared with the reorder threshold for the selected item.</p>
              </div>
            </div>

            <div className="stock-health-card">
              <div className="stock-health-top">
                <div className="stock-health-stat">
                  <span>Current Stock</span>
                  <strong>{selectedItemDetails.currentStock}</strong>
                </div>

                <div className="stock-health-stat">
                  <span>Threshold</span>
                  <strong>{selectedItemDetails.reorderThreshold}</strong>
                </div>
              </div>

              <div className="stock-health-bar-area">
                <div className="stock-health-bar-labels">
                  <span>Stock Level</span>
                  <span>{Math.round(stockHealthWidth)}%</span>
                </div>

                <div className="stock-health-bar-track">
                  <div
                    className={`stock-health-bar-fill ${selectedItemDetails.riskLevel.toLowerCase()}`}
                    style={{ width: `${stockHealthWidth}%` }}
                  ></div>
                </div>
              </div>

              <div className="stock-health-summary">
                <div className="stock-summary-box">
                  <span>Total Used</span>
                  <strong>{selectedItemDetails.totalUsed}</strong>
                </div>

                <div className="stock-summary-box">
                  <span>Risk Status</span>
                  <strong>{selectedItemDetails.riskLevel}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === "stock-levels" && !selectedItemDetails && (
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3>Stock Levels Overview</h3>
                <p>Select a specific item to view detailed stock health information.</p>
              </div>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={reportData.itemDetails}
                  margin={{ top: 10, right: 20, left: 0, bottom: 45 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="itemName"
                    angle={-20}
                    textAnchor="end"
                    height={70}
                    tick={{ fill: "#4b5563", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
                    }}
                  />
                  <Bar dataKey="currentStock" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {reportType === "risk-analysis" && (
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3>Risk Distribution</h3>
                <p>Distribution of inventory items across High, Medium, and Low risk categories.</p>
              </div>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie
                    data={reportData.riskDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={110}
                    paddingAngle={3}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {reportData.riskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {reportType === "usage-history" && (
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3>Usage by Item</h3>
                <p>
                  {selectedItem === "All Items"
                    ? "Compare item usage across the full inventory list."
                    : `Usage summary for ${selectedItem}.`}
                </p>
              </div>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={filteredUsageData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 45 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    angle={selectedItem === "All Items" ? -20 : 0}
                    textAnchor={selectedItem === "All Items" ? "end" : "middle"}
                    height={60}
                    tick={{ fill: "#4b5563", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
                    }}
                  />
                  <Bar
                    dataKey="totalUsed"
                    fill="#2563eb"
                    radius={[8, 8, 0, 0]}
                    barSize={selectedItem === "All Items" ? 28 : 42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportDashboard;