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
  High: "#ff1a6b",
  Medium: "#ffc400",
  Low: "#00e5c8"
};

const getRiskBadgeClass = (riskLevel) => {
  if (riskLevel === "High") return "risk-badge high";
  if (riskLevel === "Medium") return "risk-badge medium";
  return "risk-badge low";
};
const REPORT_TYPE_LABELS = {
  "stock-levels": "Stock Levels",
  "risk-analysis": "Risk Analysis",
  "usage-history": "Usage History"
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

  const riskCounts = useMemo(() => {
    const items = reportData?.itemDetails ?? [];
    return {
      safe: items.filter((i) => i.riskLevel === "Low").length,
      atRisk: items.filter((i) => i.riskLevel === "Medium").length,
      critical: items.filter((i) => i.riskLevel === "High").length
    };
  }, [reportData]);

  const stockHealthWidth = useMemo(() => {
    if (!selectedItemDetails) return 0;

    const threshold = selectedItemDetails.reorderThreshold || 1;
    const percentage = (selectedItemDetails.currentStock / threshold) * 100;

    return Math.min(percentage, 100);
  }, [selectedItemDetails]);

  const exportRows = useMemo(() => {
    if (!reportData) return [];

    if (reportType === "usage-history") {
      const usageRows = selectedItem === "All Items"
        ? reportData.usageTrends ?? []
        : (reportData.usageTrends ?? []).filter((item) => item.name === selectedItem);
      return usageRows.map((item) => ({
        itemName: item.name || "N/A",
        totalUsed: item.totalUsed ?? 0
      }));
    }

    const sourceData =
      selectedItem === "All Items"
        ? reportData.itemDetails ?? []
        : (reportData.itemDetails ?? []).filter((item) => item.itemName === selectedItem);

    return sourceData.map((item) => ({
      itemName: item.itemName || "N/A",
      currentStock: item.currentStock ?? 0,
      reorderThreshold: item.reorderThreshold ?? 0,
      totalUsed: item.totalUsed ?? 0,
      riskLevel: item.riskLevel || "Low",
      stockStatus: getDisplayRiskName(item.riskLevel || "Low")
    }));
  }, [reportData, reportType, selectedItem]);

  const handleExportCSV = () => {
    if (!exportRows.length) return;

    try {
      setIsExportingCSV(true);

      const headers = reportType === "usage-history"
        ? ["Item Name", "Total Used"]
        : reportType === "risk-analysis"
          ? ["Item Name", "Risk Level", "Status Label", "Current Stock", "Reorder Threshold"]
          : ["Item Name", "Current Stock", "Reorder Threshold", "Total Used", "Risk Level", "Status Label"];

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

      const csvRows = exportRows.map((item) => {
        if (reportType === "usage-history") {
          return [item.itemName, item.totalUsed];
        }
        if (reportType === "risk-analysis") {
          return [
            item.itemName,
            item.riskLevel,
            item.stockStatus,
            item.currentStock,
            item.reorderThreshold
          ];
        }
        return [
          item.itemName,
          item.currentStock,
          item.reorderThreshold,
          item.totalUsed,
          item.riskLevel,
          item.stockStatus
        ];
      });

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

      const safeReportTypeLabel = REPORT_TYPE_LABELS[reportType] || "Inventory Report";

      const summarySource = exportRows;
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

      if (reportType === "usage-history") {
        const totalUsed = summarySource.reduce((sum, row) => sum + (Number(row.totalUsed) || 0), 0);
        doc.autoTable({
          startY: 82,
          head: [["Summary", "Value"]],
          body: [
            ["Items Included", summarySource.length],
            ["Total Units Used", totalUsed]
          ],
          theme: "grid",
          headStyles: { fillColor: [37, 99, 235] },
          styles: { fontSize: 10 }
        });

        const rows = summarySource.map((item) => [item.itemName, item.totalUsed]);
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 10,
          head: [["Item Name", "Total Used"]],
          body: rows,
          theme: "grid",
          headStyles: { fillColor: [29, 78, 216] },
          styles: { fontSize: 10 }
        });
      } else if (reportType === "risk-analysis") {
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
          getDisplayRiskName(item.riskLevel),
          item.currentStock,
          item.reorderThreshold
        ]);
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 10,
          head: [["Item Name", "Risk Level", "Current Stock", "Threshold"]],
          body: rows,
          theme: "grid",
          headStyles: { fillColor: [29, 78, 216] },
          styles: { fontSize: 10 }
        });
      } else {
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
      }

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
            <div className="report-card report-card--accent-blue">
              <span className="card-label">Total Items</span>
              <h3>{reportData.totalItems}</h3>
            </div>

            <div className="report-card report-card--accent-slate">
              <span className="card-label">Stock Remaining</span>
              <h3>{reportData.totalStockRemaining}</h3>
            </div>

            <div className="report-card report-card--tone-safe">
              <span className="card-label">Safe</span>
              <h3>{riskCounts.safe}</h3>
            </div>

            <div className="report-card report-card--tone-at-risk">
              <span className="card-label">At Risk</span>
              <h3>{riskCounts.atRisk}</h3>
            </div>

            <div className="report-card report-card--tone-critical">
              <span className="card-label">Critical</span>
              <h3>{riskCounts.critical}</h3>
            </div>
          </>
        )}

        {reportType === "risk-analysis" && (
          <>
            <div className="report-card report-card--tone-critical">
              <span className="card-label">Critical</span>
              <h3>{riskCounts.critical}</h3>
            </div>

            <div className="report-card report-card--tone-at-risk">
              <span className="card-label">At Risk</span>
              <h3>{riskCounts.atRisk}</h3>
            </div>

            <div className="report-card report-card--tone-safe">
              <span className="card-label">Safe</span>
              <h3>{riskCounts.safe}</h3>
            </div>

            <div className="report-card report-card--accent-blue">
              <span className="card-label">Total Items</span>
              <h3>{reportData.totalItems}</h3>
            </div>

            <div className="report-card report-card--accent-slate">
              <span className="card-label">Stock Remaining</span>
              <h3>{reportData.totalStockRemaining}</h3>
            </div>
          </>
        )}

        {reportType === "usage-history" && (
          <>
            <div className="report-card report-card--accent-blue">
              <span className="card-label">Total Units Used</span>
              <h3>{reportData.totalUnitsUsed}</h3>
            </div>

            <div className="report-card report-card--accent-slate">
              <span className="card-label">Total Items</span>
              <h3>{reportData.totalItems}</h3>
            </div>

            <div className="report-card report-card--accent-slate">
              <span className="card-label">Stock Remaining</span>
              <h3>{reportData.totalStockRemaining}</h3>
            </div>

            <div className="report-card report-card--tone-at-risk">
              <span className="card-label">At Risk</span>
              <h3>{riskCounts.atRisk}</h3>
            </div>

            <div className="report-card report-card--tone-critical">
              <span className="card-label">Critical</span>
              <h3>{riskCounts.critical}</h3>
            </div>
          </>
        )}
      </div>

      <div className="report-filters-grid">
        <div className="report-filter-card report-filter-card--stacked">
          <div className="report-filter-copy">
            <p className="filter-title">Report Type</p>
            <p className="filter-subtitle">
              Stock levels, risk mix, or usage trends.
            </p>
          </div>

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="report-filter-select"
            aria-label="Report type"
          >
            <option value="stock-levels">Stock Levels</option>
            <option value="risk-analysis">Risk Analysis</option>
            <option value="usage-history">Usage History</option>
          </select>
        </div>

        <div className="report-filter-card report-filter-card--stacked">
          <div className="report-filter-copy">
            <p className="filter-title">Filter by Item</p>
            <p className="filter-subtitle">
              All items for portfolio view, or one item for detail.
            </p>
          </div>

          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="report-filter-select"
            aria-label="Filter by item"
          >
            {itemOptions.map((itemName) => (
              <option key={itemName} value={itemName}>
                {itemName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedItemDetails && (
        <div className="selected-item-card">
          <div className="selected-item-header">
            <div>
              <p className="selected-item-label">Selected Item</p>
              <h3>{selectedItemDetails.itemName}</h3>
            </div>

            <span className={getRiskBadgeClass(selectedItemDetails.riskLevel)}>
              {getDisplayRiskName(selectedItemDetails.riskLevel)}
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
              <p>{getDisplayRiskName(selectedItemDetails.riskLevel)}</p>
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
                  <strong>{getDisplayRiskName(selectedItemDetails.riskLevel)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === "stock-levels" && !selectedItemDetails && (
          <div className="chart-card premium-chart-card">
            <div className="chart-header">
              <div>
                <h3>Stock levels overview</h3>
                <p>
                  Current stock by item (bars use risk color: Safe, At Risk, Critical). Pick a single item
                  above for the detailed stock health card.
                </p>
              </div>
            </div>

            <div className="chart-wrapper chart-wrapper--tall">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={reportData.itemDetails}
                  margin={{ top: 10, right: 30, left: 10, bottom: 70 }}
                >
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
                    formatter={(value, _name, item) => [
                      `${value} units`,
                      item?.payload?.riskLevel
                        ? getDisplayRiskName(item.payload.riskLevel)
                        : "Current stock"
                    ]}
                    labelFormatter={(label) => `Item: ${label}`}
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.08)"
                    }}
                  />
                  <Bar dataKey="currentStock" radius={[8, 8, 0, 0]} barSize={34}>
                    {(reportData.itemDetails || []).map((entry) => (
                      <Cell
                        key={entry._id}
                        fill={PIE_COLORS[entry.riskLevel] || "#64748b"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {reportType === "risk-analysis" && selectedItem === "All Items" && (
          <div className="chart-card premium-chart-card">
            <div className="chart-header">
              <div>
                <h3>Risk distribution</h3>
                <p>Share of items that are Safe, At Risk, or Critical.</p>
              </div>
            </div>

            <div className="chart-wrapper chart-wrapper--medium">
              <ResponsiveContainer width="100%" height={360}>
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
                    label={({ name, value }) => `${getDisplayRiskName(name)}: ${value}`}
                  >
                    {reportData.riskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, item) => [
                      value,
                      getDisplayRiskName(item?.payload?.name ?? name)
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
                    }}
                  />
                  <Legend formatter={(value) => getDisplayRiskName(value)} />
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
                    <strong>{getDisplayRiskName(selectedItemDetails.riskLevel)}</strong>
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

            <div className="chart-wrapper chart-wrapper--medium">
              <ResponsiveContainer width="100%" height={360}>
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