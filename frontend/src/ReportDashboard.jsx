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
import { jsPDF } from "jspdf";
import "jspdf-autotable";
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
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
  const mockData = {
    totalItems: 5,
    totalStockRemaining: 200,
    lowStockItems: 2,
    highRiskItems: 1,
    totalUnitsUsed: 120,
    itemDetails: [
      {
        itemName: "Gloves",
        currentStock: 20,
        reorderThreshold: 30,
        totalUsed: 50,
        riskLevel: "Medium"
      },
      {
        itemName: "Masks",
        currentStock: 80,
        reorderThreshold: 40,
        totalUsed: 30,
        riskLevel: "Low"
      },
      {
        itemName: "Sanitizer",
        currentStock: 10,
        reorderThreshold: 25,
        totalUsed: 70,
        riskLevel: "High"
      }
    ],
    riskDistribution: [
      { name: "High", value: 1 },
      { name: "Medium", value: 1 },
      { name: "Low", value: 1 }
    ],
    usageTrends: [
      { name: "Gloves", totalUsed: 50 },
      { name: "Masks", totalUsed: 30 },
      { name: "Sanitizer", totalUsed: 70 }
    ]
  };

  setReportData(mockData);
  setLoading(false);
}, []);

  const getDisplayRiskName = (riskLevel) => {
    if (riskLevel === "High") return "Critical";
    if (riskLevel === "Medium") return "At Risk";
    return "Safe";
  };

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

    const threshold = selectedItemDetails.reorderThreshold || 1;
    const percentage = (selectedItemDetails.currentStock / threshold) * 100;

    return Math.min(percentage, 100);
  }, [selectedItemDetails]);

  const exportRows = useMemo(() => {
    if (!reportData?.itemDetails) return [];

    const sourceData =
      selectedItem === "All Items"
        ? reportData.itemDetails
        : reportData.itemDetails.filter((item) => item.itemName === selectedItem);

    return sourceData.map((item) => ({
      itemName: item.itemName || "N/A",
      currentStock: item.currentStock ?? 0,
      reorderThreshold: item.reorderThreshold ?? 0,
      totalUsed: item.totalUsed ?? 0,
      riskLevel: item.riskLevel || "Low",
      stockStatus:
        item.riskLevel === "High"
          ? "Critical"
          : item.riskLevel === "Medium"
            ? "At Risk"
            : "Safe"
    }));
  }, [reportData, selectedItem]);

  const handleExportCSV = () => {
    if (!exportRows.length) return;

    try {
      setIsExportingCSV(true);

      const headers = [
        "Item Name",
        "Current Stock",
        "Reorder Threshold",
        "Total Used",
        "Risk Level",
        "Status Label"
      ];

      const escapeCSVValue = (value) => {
        const stringValue = String(value ?? "");

        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      };

      const csvRows = exportRows.map((item) => [
        item.itemName,
        item.currentStock,
        item.reorderThreshold,
        item.totalUsed,
        item.riskLevel,
        item.stockStatus
      ]);

      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) => row.map(escapeCSVValue).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);

      const today = new Date().toISOString().split("T")[0];
      const safeReportType = reportType.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
      const safeItemName =
        selectedItem === "All Items"
          ? "all-items"
          : selectedItem.replace(/[^a-z0-9-]/gi, "-").toLowerCase();

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `stockguard-${safeReportType}-${safeItemName}-${today}.csv`
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error("CSV export failed:", exportError);
      alert("CSV export failed. Please try again.");
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = () => {
    if (!exportRows.length) return;

    try {
      setIsExportingPDF(true);

      const doc = new jsPDF();
      const reportId = `INV-${Date.now()}`;
      const formattedDate = new Date().toLocaleDateString();

      const safeReportTypeLabel = reportType
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      const summarySource =
        selectedItem === "All Items"
          ? exportRows
          : exportRows.filter((item) => item.itemName === selectedItem);

      const highRiskCount = summarySource.filter((item) => item.riskLevel === "High").length;
      const mediumRiskCount = summarySource.filter((item) => item.riskLevel === "Medium").length;
      const lowRiskCount = summarySource.filter((item) => item.riskLevel === "Low").length;

      doc.setFontSize(20);
      doc.text("StockGuard Inc.", 14, 18);

      doc.setFontSize(14);
      doc.text("Official Inventory Report", 14, 28);

      doc.setFontSize(11);
      doc.text(`Report ID: ${reportId}`, 14, 38);
      doc.text(`Date: ${formattedDate}`, 14, 45);
      doc.text(`Report Type: ${safeReportTypeLabel}`, 14, 52);
      doc.text(`Filter: ${selectedItem}`, 14, 59);
      doc.text(`Total Items: ${summarySource.length}`, 14, 66);
      doc.text("Status: Active", 14, 73);

      doc.autoTable({
        startY: 82,
        head: [["Summary", "Count"]],
        body: [
          ["Critical Items", highRiskCount],
          ["At Risk Items", mediumRiskCount],
          ["Safe Items", lowRiskCount]
        ],
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 10 }
      });

      const rows = summarySource.map((item) => [
        item.itemName,
        item.currentStock,
        item.reorderThreshold,
        item.totalUsed,
        getDisplayRiskName(item.riskLevel)
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Item Name", "Current Stock", "Threshold", "Total Used", "Risk Level"]],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [29, 78, 216] },
        styles: { fontSize: 10 }
      });

      doc.setFontSize(10);
      doc.text("Generated by StockGuard System", 14, doc.lastAutoTable.finalY + 18);
      doc.text("Confidential Business Report", 14, doc.lastAutoTable.finalY + 24);

      const today = new Date().toISOString().split("T")[0];
      const safeReportTypeFile = reportType.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
      const safeItemName =
        selectedItem === "All Items"
          ? "all-items"
          : selectedItem.replace(/[^a-z0-9-]/gi, "-").toLowerCase();

      doc.save(`stockguard-${safeReportTypeFile}-${safeItemName}-${today}.pdf`);
    } catch (pdfError) {
      console.error("PDF export failed:", pdfError);
      alert("PDF export failed. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (loading) {
    return <div className="report-message">Loading report dashboard...</div>;
  }

  if (error) {
    return <div className="report-message error">{error}</div>;
  }
if (!reportData) {
  return <div className="report-message">Loading data...</div>;
}
  return (
    <div className="report-dashboard">
      <div className="report-heading-row report-heading-row-enhanced">
        <div>
          <p className="report-eyebrow">Analytics Overview</p>
          <h2 className="report-title">Inventory Report Dashboard</h2>
          <p className="report-subtitle">
            Monitor stock usage, compare risk levels, and review item performance.
          </p>
        </div>

        <div className="report-export-actions">
          <button
            type="button"
            className="report-export-btn"
            onClick={handleExportCSV}
            disabled={!exportRows.length || isExportingCSV || isExportingPDF}
          >
            {isExportingCSV ? "Exporting CSV..." : "Export CSV"}
          </button>

          <button
            type="button"
            className="report-export-btn report-export-btn-secondary"
            onClick={handleExportPDF}
            disabled={!exportRows.length || isExportingCSV || isExportingPDF}
          >
            {isExportingPDF ? "Exporting PDF..." : "Export PDF"}
          </button>
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

      <div className="report-chart-grid premium-report-grid">
        {reportType === "stock-levels" && selectedItemDetails && (
          
          <div className="chart-card premium-chart-card">
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
          <div className="chart-card premium-chart-card">
            <div className="chart-header">
              <div>
                <h3>Stock Levels Overview</h3>
                <p>Select a specific item to view detailed stock health information.</p>
              </div>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart
                  data={reportData.itemDetails}
                  margin={{ top: 10, right: 30, left: 10, bottom: 70 }}
                >
                  <defs>
                    <linearGradient id="stockBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="itemName"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={70}
                    tick={{
                      fill: "#475569",
                      fontSize: 12,
                      fontWeight: 600
                    }}
                    tickFormatter={(value) =>
                      value.length > 14 ? `${value.substring(0, 14)}...` : value
                    }
                  />
                  <YAxis
                    tick={{
                      fill: "#475569",
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}`, "Current Stock"]}
                    labelFormatter={(label) => `Item: ${label}`}
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.08)"
                    }}
                  />
                  <Bar
                    dataKey="currentStock"
                    fill="url(#stockBarGradient)"
                    radius={[8, 8, 0, 0]}
                    barSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {reportType === "risk-analysis" && selectedItem === "All Items" && (
          <div className="chart-card premium-chart-card">
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

        {reportType === "risk-analysis" &&
          selectedItem !== "All Items" &&
          selectedItemDetails && (
            <div className="chart-card premium-chart-card">
              <div className="chart-header">
                <div>
                  <h3>Item Risk Insight</h3>
                  <p>Detailed risk and stock breakdown for the selected inventory item.</p>
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
                    <span>Risk-Based Stock Position</span>
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

        {reportType === "usage-history" && (
          <div className="chart-card premium-chart-card">
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
                  <defs>
                    <linearGradient id="usageBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={selectedItem === "All Items" ? -20 : 0}
                    textAnchor={selectedItem === "All Items" ? "end" : "middle"}
                    height={60}
                    tick={{ fill: "#4b5563", fontSize: 12 }}
                    tickFormatter={(value) =>
                      selectedItem === "All Items" && value.length > 14
                        ? `${value.substring(0, 14)}...`
                        : value
                    }
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
                    fill="url(#usageBarGradient)"
                    radius={[8, 8, 0, 0]}
                    barSize={selectedItem === "All Items" ? 28 : 42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      {/* ✅ Trend Data Table */}
<div className="report-table-section">
  <h3>Trend Data Table</h3>

  <div className="table-responsive">
    <table className="report-table">
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
  {exportRows?.length > 0 ? (
    exportRows.map((item, index) => (
      <tr key={index}>
        <td>{item.itemName}</td>
        <td>{item.currentStock}</td>
        <td>{item.reorderThreshold}</td>
        <td>{item.totalUsed}</td>
        <td className={`risk-${item.riskLevel.toLowerCase()}`}>
          {item.riskLevel}
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="5">No data available</td>
    </tr>
  )}
</tbody>
    </table>
  </div>
</div>
    </div>
  );
}
 

export default ReportDashboard;