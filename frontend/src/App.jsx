import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import ConfirmationBanner from "./ConfirmationBanner";
import Report from "./Report";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api/inventory`;

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
  const [backendConnected, setBackendConnected] = useState(false);
  const [databaseConnected, setDatabaseConnected] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newThreshold, setNewThreshold] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState("");

  const showGlobalMessage = useCallback((text, type = "error") => {
    setGlobalMessage(text);
    setGlobalMessageType(type);
  }, []);

  const clearGlobalMessage = useCallback(() => {
    setGlobalMessage("");
    setGlobalMessageType("");
  }, []);

  const showAddItemMessage = useCallback((text, type = "error") => {
    setAddItemMessage(text);
    setAddItemMessageType(type);
  }, []);

  const clearAddItemMessage = useCallback(() => {
    setAddItemMessage("");
    setAddItemMessageType("");
  }, []);

  const showUsageMessage = useCallback((text, type = "error") => {
    setUsageMessage(text);
    setUsageMessageType(type);
  }, []);

  const clearUsageMessage = useCallback(() => {
    setUsageMessage("");
    setUsageMessageType("");
  }, []);

  const clearAllMessages = useCallback(() => {
    clearAddItemMessage();
    clearUsageMessage();
    clearGlobalMessage();
  }, [clearAddItemMessage, clearGlobalMessage, clearUsageMessage]);

  const fetchJson = useCallback(async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      const rawText = await response.text();
      let data = {};

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { message: rawText };
        }
      }

      return { response, data };
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const getRiskDisplayName = useCallback((riskLevel) => {
    if (riskLevel === "High") return "Critical";
    if (riskLevel === "Medium") return "At Risk";
    return "Safe";
  }, []);

  const getRiskDisplayClass = useCallback((riskLevel) => {
    if (riskLevel === "High") return "high";
    if (riskLevel === "Medium") return "medium";
    return "low";
  }, []);

 const formatUsageDate = useCallback((value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-");
      return `${year}/${Number(month)}/${Number(day)}`;
    }

    const cleaned = trimmed.replace(/\s*\([^)]*\)\s*$/, "");
    const parsedFromCleaned = new Date(cleaned);

    if (!Number.isNaN(parsedFromCleaned.getTime())) {
      return `${parsedFromCleaned.getFullYear()}/${parsedFromCleaned.getMonth() + 1}/${parsedFromCleaned.getDate()}`;
    }
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}/${parsed.getMonth() + 1}/${parsed.getDate()}`;
  }

  return String(value);
}, []);

  const fetchInventory = useCallback(async () => {
    try {
      const { response, data } = await fetchJson(API_URL);

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch inventory.");
      }

      setInventory(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      setInventory([]);
      showGlobalMessage(error.message || "Failed to load inventory data.", "error");
      return [];
    }
  }, [fetchJson, showGlobalMessage]);

  const fetchUsageLogs = useCallback(async () => {
    try {
      const { response, data } = await fetchJson(`${API_URL}/logs`);

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch usage logs.");
      }

      setUsageLogs(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      setUsageLogs([]);
      showGlobalMessage(error.message || "Failed to load usage logs.", "error");
      return [];
    }
  }, [fetchJson, showGlobalMessage]);

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      clearAllMessages();

      try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/api/health`);
        setBackendConnected(response.ok);
        setDatabaseConnected(Boolean(data?.database?.connected));
      } catch {
        setBackendConnected(false);
        setDatabaseConnected(false);
      }

      const inventoryData = await fetchInventory();
      await fetchUsageLogs();

      if (inventoryData.length > 0) {
        setSelectedItemId((currentId) => {
          const selectedStillExists = inventoryData.find((item) => item._id === currentId);
          return selectedStillExists ? currentId : inventoryData[0]._id;
        });
      } else {
        setSelectedItemId("");
      }

      setLoading(false);
    };

    initializeApp();
  }, [clearAllMessages, fetchInventory, fetchJson, fetchUsageLogs]);

  useEffect(() => {
    if (!globalMessage) return undefined;
    const timer = setTimeout(clearGlobalMessage, 3500);
    return () => clearTimeout(timer);
  }, [globalMessage, clearGlobalMessage]);

  useEffect(() => {
    if (!addItemMessage) return undefined;
    const timer = setTimeout(clearAddItemMessage, 3500);
    return () => clearTimeout(timer);
  }, [addItemMessage, clearAddItemMessage]);

  useEffect(() => {
    if (!usageMessage) return undefined;
    const timer = setTimeout(clearUsageMessage, 3500);
    return () => clearTimeout(timer);
  }, [usageMessage, clearUsageMessage]);

  const handleEditClick = useCallback(
    (item) => {
      setIsEditing(true);
      setEditingItemId(item._id);
      setNewItemName(item.itemName || "");
      setNewStock(String(item.currentStock ?? ""));
      setNewThreshold(String(item.reorderThreshold ?? ""));
      clearAddItemMessage();
      showAddItemMessage(`Editing ${item.itemName}`, "success");
    },
    [clearAddItemMessage, showAddItemMessage]
  );

  const resetItemForm = useCallback(() => {
    setIsEditing(false);
    setEditingItemId("");
    setNewItemName("");
    setNewStock("");
    setNewThreshold("");
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const { response, data } = await fetchJson(`${API_BASE_URL}/api/health`);
      setBackendConnected(response.ok);
      setDatabaseConnected(Boolean(data?.database?.connected));
    } catch {
      setBackendConnected(false);
      setDatabaseConnected(false);
    }
  }, [fetchJson]);

  const handleUsageSubmit = async (event) => {
    event.preventDefault();
    clearUsageMessage();

    const usedQty = Number(quantityUsed);

    if (!selectedItemId) {
      showUsageMessage("Please choose an item before submitting.", "error");
      return;
    }

    if (!usageDate || !String(usageDate).trim()) {
      showUsageMessage("Please choose the date of use.", "error");
      return;
    }

    if (quantityUsed === "" || Number.isNaN(usedQty) || usedQty <= 0) {
      showUsageMessage("Please enter a quantity greater than 0.", "error");
      return;
    }

    try {
      const { response, data } = await fetchJson(`${API_URL}/usage`, {
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

      if (!response.ok) {
        throw new Error(data.message || "Failed to update inventory usage.");
      }

      showUsageMessage(data.message || "Usage recorded successfully.", "success");
      setQuantityUsed("");
      setUsageDate(new Date().toISOString().split("T")[0]);

      await Promise.all([refreshStatus(), fetchInventory(), fetchUsageLogs()]);
    } catch (error) {
      showUsageMessage(
        error.message || "Something went wrong while saving the usage entry.",
        "error"
      );
      await refreshStatus();
    }
  };

  const handleAddItem = async (event) => {
    event.preventDefault();
    clearAddItemMessage();

    const trimmedItemName = newItemName.trim();
    const stockValue = Number(newStock);
    const thresholdValue = Number(newThreshold);

    if (!trimmedItemName) {
      showAddItemMessage("Please enter an item name.", "error");
      return;
    }

    if (trimmedItemName.length < 2) {
      showAddItemMessage("Item name must be at least 2 characters long.", "error");
      return;
    }

    if (newStock === "" || Number.isNaN(stockValue) || stockValue < 0) {
      showAddItemMessage(
        "Current stock must be a valid number greater than or equal to 0.",
        "error"
      );
      return;
    }

    if (newThreshold === "" || Number.isNaN(thresholdValue) || thresholdValue < 1) {
      showAddItemMessage(
        "Reorder threshold must be a valid number greater than or equal to 1.",
        "error"
      );
      return;
    }

    try {
      const url = isEditing ? `${API_URL}/${editingItemId}` : API_URL;
      const method = isEditing ? "PUT" : "POST";

      const { response, data } = await fetchJson(url, {
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

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing ? "Failed to update inventory item." : "Failed to add inventory item.")
        );
      }

      showAddItemMessage(
        data.message ||
          (isEditing
            ? "Inventory item updated successfully."
            : "Inventory item added successfully."),
        "success"
      );

      resetItemForm();
      await Promise.all([refreshStatus(), fetchInventory()]);
    } catch (error) {
      showAddItemMessage(
        error.message ||
          (isEditing ? "Server error while updating item." : "Server error while adding item."),
        "error"
      );
      await refreshStatus();
    }
  };

  const lowStockItems = useMemo(
    () => inventory.filter((item) => item.currentStock <= item.reorderThreshold),
    [inventory]
  );

  const highRiskItems = useMemo(
    () => inventory.filter((item) => item.riskLevel === "High"),
    [inventory]
  );

  const itemsByRiskLevel = useMemo(
    () => ({
      High: inventory.filter((item) => item.riskLevel === "High"),
      Medium: inventory.filter((item) => item.riskLevel === "Medium"),
      Low: inventory.filter((item) => item.riskLevel === "Low")
    }),
    [inventory]
  );

  const totalItems = inventory.length;

  const totalUnitsRemaining = useMemo(
    () => inventory.reduce((sum, item) => sum + item.currentStock, 0),
    [inventory]
  );

  const activeBanner = useMemo(() => {
    if (addItemMessage) {
      return {
        message: addItemMessage,
        type: addItemMessageType,
        onClose: clearAddItemMessage
      };
    }

    if (usageMessage) {
      return {
        message: usageMessage,
        type: usageMessageType,
        onClose: clearUsageMessage
      };
    }

    if (globalMessage) {
      return {
        message: globalMessage,
        type: globalMessageType,
        onClose: clearGlobalMessage
      };
    }

    return { message: "", type: "", onClose: () => {} };
  }, [
    addItemMessage,
    addItemMessageType,
    clearAddItemMessage,
    clearGlobalMessage,
    clearUsageMessage,
    globalMessage,
    globalMessageType,
    usageMessage,
    usageMessageType
  ]);

  return (
    <div className="app-shell">
      <ConfirmationBanner
        message={activeBanner.message}
        type={activeBanner.type}
        onClose={activeBanner.onClose}
        autoCloseDuration={activeBanner.type === "success" ? 4000 : 5000}
      />

      <nav className="topbar">
        <div className="brand-group">
          <div>
            <h1 className="brand">StockGuard</h1>
            <p className="brand-subtitle">Inventory Risk Monitoring Dashboard</p>
          </div>
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
          onEditItem={handleEditClick}
          formatUsageDate={formatUsageDate}
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
                  onChange={(event) => {
                    setNewItemName(event.target.value);
                    if (addItemMessageType === "error") {
                      clearAddItemMessage();
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
                  onChange={(event) => setNewStock(event.target.value)}
                  placeholder="Enter current stock"
                />
              </label>

              <label>
                Reorder Threshold
                <input
                  type="number"
                  min="1"
                  value={newThreshold}
                  onChange={(event) => setNewThreshold(event.target.value)}
                  placeholder="Enter reorder threshold"
                />
              </label>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit">{isEditing ? "Update Item" : "Add Item"}</button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      resetItemForm();
                      clearAddItemMessage();
                    }}
                  >
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
                <select
                  value={selectedItemId}
                  onChange={(event) => setSelectedItemId(event.target.value)}
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
                  onChange={(event) => setQuantityUsed(event.target.value)}
                  placeholder="Enter quantity used"
                />
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={usageDate}
                  onChange={(event) => setUsageDate(event.target.value)}
                />
              </label>

              <button type="submit">Submit Usage</button>
            </form>
          </div>
        </section>

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
                        Status: <strong>Alert Triggered</strong>
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
                  : !backendConnected
                  ? "Backend Not Connected"
                  : databaseConnected
                  ? "Backend and MongoDB Connected"
                  : "Backend Connected, MongoDB Not Connected"}
              </h3>
              <p>
                {!backendConnected
                  ? "The frontend cannot reach the Express server. Make sure the backend is running on port 5000."
                  : databaseConnected
                  ? "Inventory is synchronized with MongoDB."
                  : "The server is up, but MongoDB is disconnected. Start MongoDB or fix MONGO_URI to use inventory features."}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;