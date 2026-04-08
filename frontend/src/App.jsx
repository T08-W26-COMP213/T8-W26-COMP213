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

  const [globalMessage, setGlobalMessage] = useState("");
  const [globalMessageType, setGlobalMessageType] = useState("");

  const [addItemMessage, setAddItemMessage] = useState("");
  const [addItemMessageType, setAddItemMessageType] = useState("");

  const [usageMessage, setUsageMessage] = useState("");
  const [usageMessageType, setUsageMessageType] = useState("");

  const [loading, setLoading] = useState(true);

  const [newItemName, setNewItemName] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newThreshold, setNewThreshold] = useState("");
  const [backendConnected, setBackendConnected] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState("");
  const showGlobalMessage = (text, type = "error") => {
  setGlobalMessage(text);
  setGlobalMessageType(type);
};

const clearGlobalMessage = () => {
  setGlobalMessage("");
  setGlobalMessageType("");
};

const showAddItemMessage = (text, type = "error") => {
  setAddItemMessage(text);
  setAddItemMessageType(type);
};

const showMessage = (text, type = "error") => {
  setAddItemMessage(text);
  setAddItemMessageType(type);
};

const clearMessage = () => {
  setAddItemMessage("");
  setAddItemMessageType("");
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api/inventory`;

  const clearAddItemMessage = () => {
    setAddItemMessage("");
    setAddItemMessageType("");
  };

  const showUsageMessage = (text, type = "error") => {
    setUsageMessage(text);
    setUsageMessageType(type);
  };

  const clearUsageMessage = () => {
    setUsageMessage("");
    setUsageMessageType("");
  };

  const getRiskDisplayName = (riskLevel) => {
    if (riskLevel === "High") return "Critical";
    if (riskLevel === "Medium") return "At Risk";
    return "Safe";
  };

  const getRiskDisplayClass = (riskLevel) => {
    if (riskLevel === "High") return "high";
    if (riskLevel === "Medium") return "medium";
    return "low";
  };

  const formatUsageDate = (value) => {
    if (!value) return "";

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-");
      return `${year}/${Number(month)}/${Number(day)}`;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return `${parsed.getFullYear()}/${parsed.getMonth() + 1}/${parsed.getDate()}`;
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
      showGlobalMessage("Failed to load inventory data.", "error");
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
      showGlobalMessage("Failed to load usage logs.", "error");
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`);
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

  useEffect(() => {
    if (!globalMessage) return;

    const timer = setTimeout(() => {
      clearGlobalMessage();
    }, 3000);

    return () => clearTimeout(timer);
  }, [globalMessage]);

  useEffect(() => {
    if (!addItemMessage) return;

    const timer = setTimeout(() => {
      clearAddItemMessage();
    }, 3000);

    return () => clearTimeout(timer);
  }, [addItemMessage]);

  useEffect(() => {
    if (!usageMessage) return;

    const timer = setTimeout(() => {
      clearUsageMessage();
    }, 3000);

    return () => clearTimeout(timer);
  }, [usageMessage]);

  const handleEditClick = (item) => {
    setIsEditing(true);
    setEditingItemId(item._id);
    setNewItemName(item.itemName || "");
    setNewStock(String(item.currentStock ?? ""));
    setNewThreshold(String(item.reorderThreshold ?? ""));
    clearMessage();
  };

  const resetItemForm = () => {
    setIsEditing(false);
    setEditingItemId("");
    setNewItemName("");
    setNewStock("");
    setNewThreshold("");
  };

  const handleUsageSubmit = async (e) => {
    e.preventDefault();
    clearUsageMessage();

    const usedQty = Number(quantityUsed);

    if (!selectedItemId) {
      alert("Please choose an item before submitting.");
      showUsageMessage("Please choose an item before submitting.", "error");
      return;
    }

    if (!usageDate || !String(usageDate).trim()) {
      alert("Please choose the date of use.");
      showUsageMessage("Please choose the date of use.", "error");
      return;
    }

    if (quantityUsed === "" || Number.isNaN(usedQty) || usedQty <= 0) {
      alert("Please enter a quantity greater than 0.");
      showUsageMessage("Please enter a quantity greater than 0.", "error");
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
        alert(data.message || "Failed to update inventory usage.");
        showUsageMessage(data.message || "Failed to update inventory usage.", "error");
        return;
      }

      showUsageMessage(data.message || "Usage recorded successfully.", "success");
      setQuantityUsed("");
      setUsageDate(new Date().toISOString().split("T")[0]);

      await Promise.all([fetchInventory(), fetchUsageLogs()]);
    } catch (error) {
      alert("Something went wrong while saving the usage entry.");
      showUsageMessage("Something went wrong while saving the usage entry.", "error");
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    clearAddItemMessage();

    const trimmedItemName = newItemName.trim();
    const stockValue = Number(newStock);
    const thresholdValue = Number(newThreshold);

    if (newItemName === "" || trimmedItemName === "") {
      alert("Please enter an item name.");
      showAddItemMessage("Please enter an item name.", "error");
      return;
    }

    if (trimmedItemName.length < 2) {
      alert("Item name must be at least 2 characters long.");
      showAddItemMessage("Item name must be at least 2 characters long.", "error");
      return;
    }

    if (newStock === "" || Number.isNaN(stockValue) || stockValue < 0) {
      alert("Current stock must be a valid number greater than or equal to 0.");
      showAddItemMessage("Current stock must be a valid number greater than or equal to 0.", "error");
      return;
    }

    if (newThreshold === "" || Number.isNaN(thresholdValue) || thresholdValue < 1) {
      alert("Reorder threshold must be a valid number greater than or equal to 1.");
      showAddItemMessage("Reorder threshold must be a valid number greater than or equal to 1.", "error");
      return;
    }

    try {
      const url = isEditing ? `${API_URL}/${editingItemId}` : API_URL;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
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
        alert(
          data.message ||
            (isEditing ? "Failed to update inventory item." : "Failed to add inventory item.")
        );
        showMessage(
          data.message ||
            (isEditing ? "Failed to update inventory item." : "Failed to add inventory item."),
          "error"
        );
        return;
      }

      showMessage(
        data.message ||
          (isEditing
            ? "Inventory item updated successfully."
            : "Inventory item added successfully."),
        "success"
      );

      resetItemForm();
      await fetchInventory();
    } catch (error) {
      alert(isEditing ? "Server error while updating item." : "Server error while adding item.");
      showMessage(
        isEditing ? "Server error while updating item." : "Server error while adding item.",
        "error"
      );
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
{globalMessage && (
  <div className={`status-message ${globalMessageType}`}>
    {globalMessage}
  </div>
)}
        

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
              <h2>{isEditing ? "Edit Inventory Item" : "Add Inventory Item"}</h2>
              <span className="panel-tag">{isEditing ? "Edit Mode" : "Database Entry"}</span>
            </div>

            <form onSubmit={handleAddItem} className="usage-form">
              <label>
                Item Name
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => {
                    setNewItemName(e.target.value);
                    if (addItemMessageType === "error") {
                      clearAddItemMessage();
                    }
                  }}
                  onBlur={() => {
                    if (!newItemName.trim()) {
                      alert("Please enter an item name.");
                      showAddItemMessage("Please enter an item name.", "error");
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

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit">{isEditing ? "Update Item" : "Add Item"}</button>

                {isEditing && (
                  <button type="button" onClick={resetItemForm}>
                    Cancel
                  </button>
                )}
              </div>
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
                <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
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
                <input type="date" value={usageDate} onChange={(e) => setUsageDate(e.target.value)} />
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
                      <p>
                        Status:{" "}
                        <strong>
                          {item.currentStock <= item.reorderThreshold ? "Alert Triggered" : "Normal"}
                        </strong>
                      </p>
                    </div>
                    <span className={`risk-badge ${getRiskDisplayClass(item.riskLevel)}`}>
                      {getRiskDisplayName(item.riskLevel)}
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