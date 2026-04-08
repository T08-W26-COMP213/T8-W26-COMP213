import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./App.css";
import ConfirmationBanner from "./ConfirmationBanner";
import Report from "./Report";

function App() {
  const [inventory, setInventory] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantityUsed, setQuantityUsed] = useState("");
  const [usageDate, setUsageDate] = useState(new Date().toISOString().split("T")[0]);
  const [usageLogs, setUsageLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);

  const [newItemName, setNewItemName] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newThreshold, setNewThreshold] = useState("");
  const [backendConnected, setBackendConnected] = useState(false);

  const API_URL = "http://localhost:5000/api/inventory";

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch inventory.");
      }

      setInventory(data);

      if (data.length > 0) {
        const selectedStillExists = data.find((item) => item._id === selectedItemId);
        if (!selectedStillExists) {
          setSelectedItemId(data[0]._id);
        }
      } else {
        setSelectedItemId("");
      }
    } catch (error) {
      showMessage("Failed to load inventory data.", "error");
    }
  };

  const fetchUsageLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/logs`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch usage logs.");
      }

      setUsageLogs(data);
    } catch (error) {
      showMessage("Failed to load usage logs.", "error");
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/health");
        setBackendConnected(res.ok);
      } catch (error) {
        setBackendConnected(false);
      }

      setLoading(true);
      await Promise.all([fetchInventory(), fetchUsageLogs()]);
      setLoading(false);
    };

    initializeApp();
  }, []);

  const handleUsageSubmit = async (e) => {
    e.preventDefault();
    clearMessage();

    const usedQty = Number(quantityUsed);

    if (!selectedItemId) {
      alert("Please choose an item before submitting.");
      showMessage("Please choose an item before submitting.", "error");
      return;
    }

    if (!usageDate || !String(usageDate).trim()) {
      alert("Please choose the date of use.");
      showMessage("Please choose the date of use.", "error");
      return;
    }

    if (quantityUsed === "" || Number.isNaN(usedQty) || usedQty <= 0) {
      alert("Please enter a quantity greater than 0.");
      showMessage("Please enter a quantity greater than 0.", "error");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/usage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          itemId: selectedItemId,
          quantityUsed: usedQty,
          usageDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not save this usage entry.");
        showMessage(data.message || "Could not save this usage entry.", "error");
        return;
      }

      showMessage(
        "Usage recorded successfully",
        "success"
      );
      setQuantityUsed("");
      setUsageDate(new Date().toISOString().split("T")[0]);

      await Promise.all([fetchInventory(), fetchUsageLogs()]);
    } catch (error) {
      alert("Something went wrong while saving the usage entry.");
      showMessage("Something went wrong while saving the usage entry.", "error");
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    clearMessage();

    const trimmedItemName = newItemName.trim();
    const stockValue = Number(newStock);
    const thresholdValue = Number(newThreshold);

    if (newItemName === "" || trimmedItemName === "") {
      alert("Please enter an item name.");
      showMessage("Please enter an item name.", "error");
      return;
    }

    if (trimmedItemName.length < 2) {
      alert("Item name must be at least 2 characters long.");
      showMessage("Item name must be at least 2 characters long.", "error");
      return;
    }

    if (newStock === "" || Number.isNaN(stockValue) || stockValue < 0) {
      alert("Current stock must be a valid number greater than or equal to 0.");
      showMessage("Current stock must be a valid number greater than or equal to 0.", "error");
      return;
    }

    if (newThreshold === "" || Number.isNaN(thresholdValue) || thresholdValue < 1) {
      alert("Reorder threshold must be a valid number greater than or equal to 1.");
      showMessage("Reorder threshold must be a valid number greater than or equal to 1.", "error");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          itemName: trimmedItemName,
          currentStock: stockValue,
          reorderThreshold: thresholdValue
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to add inventory item.");
        showMessage(data.message || "Failed to add inventory item.", "error");
        return;
      }

      showMessage(data.message || "Inventory item added successfully.", "success");
      setNewItemName("");
      setNewStock("");
      setNewThreshold("");

      await fetchInventory();
    } catch (error) {
      alert("Server error while adding item.");
      showMessage("Server error while adding item.", "error");
    }
  };

  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => item.currentStock <= item.reorderThreshold);
  }, [inventory]);

  const highRiskItems = useMemo(() => {
    return inventory.filter((item) => item.riskLevel === "High");
  }, [inventory]);

  const itemsByRiskLevel = useMemo(() => {
    return {
      High: inventory.filter((item) => item.riskLevel === "High"),
      Medium: inventory.filter((item) => item.riskLevel === "Medium"),
      Low: inventory.filter((item) => item.riskLevel === "Low")
    };
  }, [inventory]);

  const totalItems = inventory.length;

  const totalUnitsRemaining = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.currentStock, 0);
  }, [inventory]);

  const reportDate = new Date().toISOString().slice(0, 10);

  const downloadCSV = () => {
    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [];

    rows.push(["Inventory Report"]);
    rows.push(["Generated", reportDate]);
    rows.push([]);
    rows.push(["Summary"]);
    rows.push(["Total Inventory Items", totalItems]);
    rows.push(["Units Remaining", totalUnitsRemaining]);
    rows.push(["Low Stock Alerts", lowStockItems.length]);
    rows.push(["High Risk Items", highRiskItems.length]);
    rows.push([]);
    rows.push(["Inventory Overview"]);
    rows.push(["Item Name", "Stock Level", "Risk Level", "Threshold", "Used"]);
    inventory.forEach((item) => {
      rows.push([
        item.itemName,
        item.currentStock,
        item.riskLevel,
        item.reorderThreshold,
        item.totalUsed ?? 0
      ]);
    });
    rows.push([]);
    rows.push(["Inventory Usage Log"]);
    rows.push(["Item Name", "Quantity Used", "Date", "Remaining Stock", "Risk Level"]);
    usageLogs.forEach((log) => {
      rows.push([
        log.itemName,
        log.quantityUsed,
        log.usageDate || "N/A",
        log.remainingStock ?? "",
        log.riskLevel
      ]);
    });

    const csvContent = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const filename = `inventory-report-${reportDate}.csv`;
    const link = document.createElement("a");

    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Inventory Report", 14, 18);
    doc.setFontSize(11);
    doc.text(`Generated: ${reportDate}`, 14, 26);
    doc.text(`Total Items: ${totalItems}`, 14, 34);
    doc.text(`Units Remaining: ${totalUnitsRemaining}`, 14, 40);
    doc.text(`Low Stock Alerts: ${lowStockItems.length}`, 14, 46);
    doc.text(`High Risk Items: ${highRiskItems.length}`, 14, 52);

    doc.autoTable({
      startY: 60,
      head: [["Item Name", "Stock", "Risk", "Threshold", "Used"]],
      body: inventory.map((item) => [
        item.itemName,
        item.currentStock,
        item.riskLevel,
        item.reorderThreshold,
        item.totalUsed ?? 0
      ]),
      theme: "grid",
      headStyles: { fillColor: [23, 59, 143], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    if (usageLogs.length > 0) {
      doc.addPage();
      doc.autoTable({
        startY: 14,
        head: [["Item Name", "Quantity Used", "Date", "Remaining Stock", "Risk Level"]],
        body: usageLogs.map((log) => [
          log.itemName,
          log.quantityUsed,
          log.usageDate || "N/A",
          log.remainingStock ?? "",
          log.riskLevel
        ]),
        theme: "grid",
        headStyles: { fillColor: [23, 59, 143], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 }
      });
    }

    doc.save(`inventory-report-${reportDate}.pdf`);
  };

  return (
    <div className="app-shell">
      <nav className="topbar">
        <div className="brand-group">
          <div>
            <h1 className="brand">StockGuard</h1>
            <p className="brand-subtitle">Inventory Risk Monitoring Dashboard</p>
          </div>
        </div>

        <div className="topbar-actions">
          <button type="button" onClick={downloadCSV}>Export CSV</button>
          <button type="button" onClick={downloadPDF}>Export PDF</button>
        </div>
      </nav>

      <main className="dashboard-container">
        <section className="hero-panel">
          <div>
            <p className="hero-label">Smart Inventory Control</p>
            <h2>Monitor stock usage, detect risk, and prevent shortages.</h2>
            <p className="hero-text">
              Track consumption in real time and identify inventory items that need attention
              before they become critical.
            </p>
          </div>
        </section>

        <Report
          inventory={inventory}
          usageLogs={usageLogs}
          lowStockItems={lowStockItems}
          highRiskItems={highRiskItems}
          itemsByRiskLevel={itemsByRiskLevel}
          totalItems={totalItems}
          totalUnitsRemaining={totalUnitsRemaining}
        />

        <section className="content-grid">
          <div className="panel glass-panel">
            <div className="panel-header">
              <h2>Add Inventory Item</h2>
              <span className="panel-tag">Database Entry</span>
            </div>

            <form onSubmit={handleAddItem} className="usage-form">
              <label>
                Item Name
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => {
                    setNewItemName(e.target.value);
                    if (messageType === "error") {
                      clearMessage();
                    }
                  }}
                  onBlur={() => {
                    if (!newItemName.trim()) {
                      alert("Please enter an item name.");
                      showMessage("Please enter an item name.", "error");
                    }
                  }}
                  placeholder="Enter item name"
                />
              </label>

              <label>
                Current Stock
                <input
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="Enter current stock"
                />
              </label>

              <label>
                Reorder Threshold
                <input
                  type="number"
                  min="1"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  placeholder="Enter reorder threshold"
                />
              </label>

              <button type="submit">Add Item</button>
            </form>
          </div>

          <div className="panel glass-panel">
            <div className="panel-header">
              <h2>Log Inventory Usage</h2>
              <span className="panel-tag">Operational Staff</span>
            </div>

            <form onSubmit={handleUsageSubmit} className="usage-form">
              <label>
                Select Item
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                >
                  <option value="">Select an item</option>
                  {inventory.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.itemName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Quantity Used
                <input
                  type="number"
                  min="1"
                  value={quantityUsed}
                  onChange={(e) => setQuantityUsed(e.target.value)}
                  placeholder="Enter quantity used"
                />
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={usageDate}
                  onChange={(e) => setUsageDate(e.target.value)}
                />
              </label>

              <button type="submit">Submit Usage</button>
            </form>
          </div>
        </section>

        <ConfirmationBanner 
          message={message} 
          type={messageType} 
          onClose={clearMessage}
          autoCloseDuration={messageType === "success" ? 4000 : 5000}
        />

        <section className="content-grid">
          <div className="panel glass-panel">
            <div className="panel-header">
              <h2>Low Stock Alerts</h2>
              <span className="panel-tag warning-tag">Live Status</span>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="empty-state">
                <h3>No low-stock alerts</h3>
                <p>All inventory items are currently above their reorder threshold.</p>
              </div>
            ) : (
              <div className="alert-list">
                {lowStockItems.map((item) => (
                  <div className="alert-item" key={item._id}>
                    <div>
                      <h4>{item.itemName}</h4>
                      <p>
                        Current Stock: <strong>{item.currentStock}</strong>
                      </p>
                      <p>
                        Reorder Threshold: <strong>{item.reorderThreshold}</strong>
                      </p>
                    </div>
                    <span className={`risk-badge ${item.riskLevel.toLowerCase()}`}>
                      {item.riskLevel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel glass-panel">
            <div className="panel-header">
              <h2>System Status</h2>
              <span className="panel-tag">Backend Sync</span>
            </div>

            <div className="empty-state">
              <h3>
                {loading
                  ? "Loading..."
                  : backendConnected
                  ? "Backend Connected"
                  : "Backend Not Connected"}
              </h3>
              <p>
                {backendConnected
                  ? "Inventory is synchronized with MongoDB."
                  : "Backend server is not reachable."}
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;