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
const INVENTORY_SUMMARY_URL = `${API_BASE_URL}/api/reports/inventory-summary`;
const CONSUMPTION_ANALYTICS_URL = `${API_BASE_URL}/api/reports/consumption-analytics`;

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

const getDisplayRiskName = (riskLevel) => {
  if (riskLevel === "High") return "Critical";
  if (riskLevel === "Medium") return "At Risk";
  return "Safe";
};

const getDepletionStatusClass = (status) => {
  if (status === "Critical") return "depletion-badge critical";
  if (status === "Warning") return "depletion-badge warning";
  return "depletion-badge monitor";
};

function ReportDashboard() {
  const [inventorySummary, setInventorySummary] = useState([]);
  const [consumptionAnalytics, setConsumptionAnalytics] = useState([]);
  const [selectedItem, setSelectedItem] = useState("All Items");
  const [reportType, setReportType] = useState("stock-levels");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError("");

        const [inventoryResponse, analyticsResponse] = await Promise.all([
          fetch(INVENTORY_SUMMARY_URL),
          fetch(CONSUMPTION_ANALYTICS_URL)
        ]);

        if (!inventoryResponse.ok) {
          throw new Error("Failed to fetch inventory summary.");
        }

        if (!analyticsResponse.ok) {
          throw new Error("Failed to fetch consumption analytics.");
        }

        const inventoryData = await inventoryResponse.json();
        const analyticsData = await analyticsResponse.json();

        setInventorySummary(Array.isArray(inventoryData) ? inventoryData : []);
        setConsumptionAnalytics(Array.isArray(analyticsData) ? analyticsData : []);
      } catch (err) {
        setError(err.message || "Something went wrong while loading reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const itemOptions = useMemo(() => {
    if (!inventorySummary.length) return ["All Items"];
    return ["All Items", ...inventorySummary.map((item) => item.itemName)];
  }, [inventorySummary]);

  const selectedItemDetails = useMemo(() => {
    if (selectedItem === "All Items") return null;
    return inventorySummary.find((item) => item.itemName === selectedItem) || null;
  }, [inventorySummary, selectedItem]);

  const selectedAnalyticsDetails = useMemo(() => {
    if (selectedItem === "All Items") return null;
    return consumptionAnalytics.find((item) => item.itemName === selectedItem) || null;
  }, [consumptionAnalytics, selectedItem]);

  const mergedReportData = useMemo(() => {
    return inventorySummary.map((item) => {
      const analytics =
        consumptionAnalytics.find((entry) => entry.itemName === item.itemName) || {};

      return {
        itemId: item.itemId,
        itemName: item.itemName,
        currentStock: item.currentStock ?? 0,
        reorderThreshold: item.reorderThreshold ?? 0,
        totalUsed: item.totalUsed ?? 0,
        consumptionRate: item.consumptionRate ?? 0,
        riskLevel: item.riskLevel || "Low",
        stockStatus: getDisplayRiskName(item.riskLevel),
        averageDailyConsumption: analytics.averageDailyConsumption ?? 0,
        estimatedDaysUntilDepletion: analytics.estimatedDaysUntilDepletion ?? null,
        depletionStatus: analytics.depletionStatus || "Monitor"
      };
    });
  }, [inventorySummary, consumptionAnalytics]);

  const totalItems = mergedReportData.length;

  const totalStockRemaining = useMemo(() => {
    return mergedReportData.reduce((sum, item) => sum + item.currentStock, 0);
  }, [mergedReportData]);

  const lowStockItems = useMemo(() => {
    return mergedReportData.filter(
      (item) => item.currentStock <= item.reorderThreshold
    ).length;
  }, [mergedReportData]);

  const highRiskItems = useMemo(() => {
    return mergedReportData.filter((item) => item.riskLevel === "High").length;
  }, [mergedReportData]);

  const totalUnitsUsed = useMemo(() => {
    return mergedReportData.reduce((sum, item) => sum + item.totalUsed, 0);
  }, [mergedReportData]);

  const criticalDepletionItems = useMemo(() => {
    return mergedReportData.filter((item) => item.depletionStatus === "Critical");
  }, [mergedReportData]);

  const warningDepletionItems = useMemo(() => {
    return mergedReportData.filter((item) => item.depletionStatus === "Warning");
  }, [mergedReportData]);

  const safestItems = useMemo(() => {
    return [...mergedReportData]
      .filter((item) => item.depletionStatus === "Monitor")
      .sort(
        (a, b) =>
          (b.estimatedDaysUntilDepletion ?? 0) - (a.estimatedDaysUntilDepletion ?? 0)
      )
      .slice(0, 3);
  }, [mergedReportData]);

  const highestConsumptionItems = useMemo(() => {
    return [...mergedReportData]
      .sort((a, b) => b.averageDailyConsumption - a.averageDailyConsumption)
      .slice(0, 5);
  }, [mergedReportData]);

  const riskDistribution = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };

    mergedReportData.forEach((item) => {
      if (counts[item.riskLevel] !== undefined) {
        counts[item.riskLevel] += 1;
      }
    });

    return [
      { name: "High", value: counts.High },
      { name: "Medium", value: counts.Medium },
      { name: "Low", value: counts.Low }
    ];
  }, [mergedReportData]);

  const filteredUsageData = useMemo(() => {
    const usageTrends = mergedReportData.map((item) => ({
      name: item.itemName,
      totalUsed: item.totalUsed,
      averageDailyConsumption: item.averageDailyConsumption,
      estimatedDaysUntilDepletion: item.estimatedDaysUntilDepletion,
      depletionStatus: item.depletionStatus
    }));

    if (selectedItem === "All Items") {
      return [...usageTrends]
        .sort((a, b) => b.averageDailyConsumption - a.averageDailyConsumption)
        .slice(0, 8);
    }

    return usageTrends.filter((item) => item.name === selectedItem);
  }, [mergedReportData, selectedItem]);

  const stockHealthWidth = useMemo(() => {
    if (!selectedItemDetails) return 0;

    const threshold = selectedItemDetails.reorderThreshold || 1;
    const percentage = (selectedItemDetails.currentStock / threshold) * 100;

    return Math.min(percentage, 100);
  }, [selectedItemDetails]);

  const exportRows = useMemo(() => {
    return selectedItem === "All Items"
      ? mergedReportData
      : mergedReportData.filter((item) => item.itemName === selectedItem);
  }, [mergedReportData, selectedItem]);

  const dashboardInsight = useMemo(() => {
    if (!mergedReportData.length) return "No analytics available yet.";

    if (criticalDepletionItems.length > 0) {
      return `${criticalDepletionItems.length} item(s) are in critical depletion range and require immediate restocking attention.`;
    }

    if (warningDepletionItems.length > 0) {
      return `${warningDepletionItems.length} item(s) are approaching depletion and should be reviewed soon.`;
    }

    return "Inventory depletion risk is currently stable across tracked items.";
  }, [mergedReportData, criticalDepletionItems, warningDepletionItems]);

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
        "Status Label",
        "Average Daily Consumption",
        "Estimated Days Until Depletion",
        "Depletion Status"
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
        item.stockStatus,
        item.averageDailyConsumption,
        item.estimatedDaysUntilDepletion ?? "N/A",
        item.depletionStatus
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

      const highRiskCount = exportRows.filter((item) => item.riskLevel === "High").length;
      const mediumRiskCount = exportRows.filter((item) => item.riskLevel === "Medium").length;
      const lowRiskCount = exportRows.filter((item) => item.riskLevel === "Low").length;

      const criticalCount = exportRows.filter(
        (item) => item.depletionStatus === "Critical"
      ).length;
      const warningCount = exportRows.filter(
        (item) => item.depletionStatus === "Warning"
      ).length;

      doc.setFontSize(20);
      doc.text("StockGuard Inc.", 14, 18);

      doc.setFontSize(14);
      doc.text("Official Inventory Analytics Report", 14, 28);

      doc.setFontSize(11);
      doc.text(`Report ID: ${reportId}`, 14, 38);
      doc.text(`Date: ${formattedDate}`, 14, 45);
      doc.text(`Report Type: ${safeReportTypeLabel}`, 14, 52);
      doc.text(`Filter: ${selectedItem}`, 14, 59);
      doc.text(`Total Items: ${exportRows.length}`, 14, 66);

      doc.autoTable({
        startY: 76,
        head: [["Summary", "Count"]],
        body: [
          ["Critical Risk Items", highRiskCount],
          ["At Risk Items", mediumRiskCount],
          ["Safe Items", lowRiskCount],
          ["Critical Depletion Items", criticalCount],
          ["Warning Depletion Items", warningCount]
        ],
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 10 }
      });

      const rows = exportRows.map((item) => [
        item.itemName,
        item.currentStock,
        item.reorderThreshold,
        item.totalUsed,
        item.stockStatus,
        item.averageDailyConsumption,
        item.estimatedDaysUntilDepletion ?? "N/A",
        item.depletionStatus
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [
          [
            "Item Name",
            "Current Stock",
            "Threshold",
            "Total Used",
            "Risk Level",
            "Avg Daily Use",
            "Days Left",
            "Depletion Status"
          ]
        ],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [29, 78, 216] },
        styles: { fontSize: 9 }
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
        <div className="report-card">
          <span className="card-label">Total Items</span>
          <h3>{totalItems}</h3>
        </div>

        <div className="report-card">
          <span className="card-label">Stock Remaining</span>
          <h3>{totalStockRemaining}</h3>
        </div>

        <div className="report-card">
          <span className="card-label">Low Stock Items</span>
          <h3>{lowStockItems}</h3>
        </div>

        <div className="report-card">
          <span className="card-label">High Risk Items</span>
          <h3>{highRiskItems}</h3>
        </div>

        <div className="report-card">
          <span className="card-label">Critical Depletion</span>
          <h3>{criticalDepletionItems.length}</h3>
        </div>

        <div className="report-card">
          <span className="card-label">Total Units Used</span>
          <h3>{totalUnitsUsed}</h3>
        </div>
      </div>

      <div className="report-filter-card">
        <div>
          <p className="filter-title">Operational Insight</p>
          <p className="filter-subtitle">{dashboardInsight}</p>
        </div>
      </div>

      {(criticalDepletionItems.length > 0 || warningDepletionItems.length > 0) && (
        <div className="selected-item-card">
          <div className="selected-item-header">
            <div>
              <p className="selected-item-label">Priority Restocking Alerts</p>
              <h3>Items Needing Attention</h3>
            </div>
          </div>

          <div className="selected-item-grid">
            {criticalDepletionItems.slice(0, 3).map((item) => (
              <div className="detail-box" key={`critical-${item.itemName}`}>
                <span className="detail-label">{item.itemName}</span>
                <p>
                  {item.estimatedDaysUntilDepletion ?? "N/A"} day(s) left
                </p>
                <span className={getDepletionStatusClass(item.depletionStatus)}>
                  {item.depletionStatus}
                </span>
              </div>
            ))}

            {warningDepletionItems.slice(0, 2).map((item) => (
              <div className="detail-box" key={`warning-${item.itemName}`}>
                <span className="detail-label">{item.itemName}</span>
                <p>
                  {item.estimatedDaysUntilDepletion ?? "N/A"} day(s) left
                </p>
                <span className={getDepletionStatusClass(item.depletionStatus)}>
                  {item.depletionStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <option value="consumption-trends">Consumption Trends</option>
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

            {selectedAnalyticsDetails && (
              <>
                <div className="detail-box">
                  <span className="detail-label">Avg Daily Consumption</span>
                  <p>{selectedAnalyticsDetails.averageDailyConsumption}</p>
                </div>

                <div className="detail-box">
                  <span className="detail-label">Days Until Depletion</span>
                  <p>{selectedAnalyticsDetails.estimatedDaysUntilDepletion ?? "N/A"}</p>
                </div>

                <div className="detail-box">
                  <span className="detail-label">Depletion Status</span>
                  <span className={getDepletionStatusClass(selectedAnalyticsDetails.depletionStatus)}>
                    {selectedAnalyticsDetails.depletionStatus}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {highestConsumptionItems.length > 0 && selectedItem === "All Items" && (
        <div className="selected-item-card">
          <div className="selected-item-header">
            <div>
              <p className="selected-item-label">Top Consumption Insights</p>
              <h3>Most Consumed Items</h3>
            </div>
          </div>

          <div className="selected-item-grid">
            {highestConsumptionItems.map((item) => (
              <div className="detail-box" key={item.itemName}>
                <span className="detail-label">{item.itemName}</span>
                <p>{item.averageDailyConsumption} units/day</p>
                <span className={getDepletionStatusClass(item.depletionStatus)}>
                  {item.depletionStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {safestItems.length > 0 && selectedItem === "All Items" && (
        <div className="selected-item-card">
          <div className="selected-item-header">
            <div>
              <p className="selected-item-label">Stable Inventory</p>
              <h3>Safest Stock Positions</h3>
            </div>
          </div>

          <div className="selected-item-grid">
            {safestItems.map((item) => (
              <div className="detail-box" key={`safe-${item.itemName}`}>
                <span className="detail-label">{item.itemName}</span>
                <p>{item.estimatedDaysUntilDepletion ?? "N/A"} day(s) remaining</p>
                <span className={getDepletionStatusClass(item.depletionStatus)}>
                  {item.depletionStatus}
                </span>
              </div>
            ))}
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
                  data={mergedReportData}
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
                    tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(value) =>
                      value.length > 14 ? `${value.substring(0, 14)}...` : value
                    }
                  />
                  <YAxis tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }} />
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
                    data={riskDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={110}
                    paddingAngle={3}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {riskDistribution.map((entry) => (
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

        {reportType === "consumption-trends" && (
          <div className="chart-card premium-chart-card">
            <div className="chart-header">
              <div>
                <h3>Consumption Trend Analysis</h3>
                <p>
                  Review average daily consumption and estimated depletion timing for inventory items.
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
                    <linearGradient id="consumptionBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6d28d9" />
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
                    formatter={(value, name) => {
                      if (name === "averageDailyConsumption") {
                        return [value, "Avg Daily Consumption"];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Item: ${label}`}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
                    }}
                  />
                  <Bar
                    dataKey="averageDailyConsumption"
                    fill="url(#consumptionBarGradient)"
                    radius={[8, 8, 0, 0]}
                    barSize={selectedItem === "All Items" ? 28 : 42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {selectedAnalyticsDetails && (
              <div className="selected-item-grid" style={{ marginTop: "20px" }}>
                <div className="detail-box">
                  <span className="detail-label">Avg Daily Consumption</span>
                  <p>{selectedAnalyticsDetails.averageDailyConsumption}</p>
                </div>

                <div className="detail-box">
                  <span className="detail-label">Estimated Days Until Depletion</span>
                  <p>{selectedAnalyticsDetails.estimatedDaysUntilDepletion ?? "N/A"}</p>
                </div>

                <div className="detail-box">
                  <span className="detail-label">Depletion Status</span>
                  <span className={getDepletionStatusClass(selectedAnalyticsDetails.depletionStatus)}>
                    {selectedAnalyticsDetails.depletionStatus}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportDashboard;