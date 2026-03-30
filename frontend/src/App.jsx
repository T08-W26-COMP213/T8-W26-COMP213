import { useEffect, useMemo, useState } from "react";
import "./App.css";
import InventoryRiskLayout from "./InventoryRiskLayout";

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

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const API_URL = `${API_BASE_URL}/api/inventory`;

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
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
    if (!message) return;

    const timer = setTimeout(() => {
      clearMessage();
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

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
        alert(data.message || "Failed to update inventory usage.");
        showMessage(data.message || "Failed to update inventory usage.", "error");
        return;
      }

      showMessage(data.message || "Usage recorded successfully.", "success");
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

  return (
    <div className="app-shell">
      <nav className="topbar">
        <div>
          <h1 className="brand">StockGuard</h1>
          <p className="brand-subtitle">Inventory Risk Monitoring Dashboard</p>
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

        {message && (
          <div className={`status-message ${messageType}`}>
            {message}
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <p className="stat-title">Total Inventory Items</p>
            <h3>{totalItems}</h3>
          </div>

          <div className="stat-card">
            <p className="stat-title">Units Remaining</p>
            <h3>{totalUnitsRemaining}</h3>
          </div>

          <div className="stat-card">
            <p className="stat-title">Low Stock Alerts</p>
            <h3>{lowStockItems.length}</h3>
          </div>

          <div className="stat-card">
            <p className="stat-title">High Risk Items</p>
            <h3>{highRiskItems.length}</h3>
          </div>
        </section>

        <InventoryRiskLayout
          inventory={inventory}
          loading={loading}
          backendConnected={backendConnected}
          fetchInventory={fetchInventory}
        />

        <section className="panel glass-panel classification-panel">
          <div className="panel-header">
            <h2>Items by Risk Category</h2>
            <span className="panel-tag">Classification</span>
          </div>

          <div className="category-container">
            <div className="risk-category">
              <h3 className="category-title high-risk-title">
                🔴 High Risk Items ({itemsByRiskLevel.High.length})
              </h3>
              {itemsByRiskLevel.High.length === 0 ? (
                <p className="empty-category">No high risk items</p>
              ) : (
                <div className="items-list">
                  {itemsByRiskLevel.High.map((item) => (
                    <div className="category-item high-risk-item" key={item._id}>
                      <div className="item-info">
                        <h4 className="high-risk-item-title">
                          <span className="critical-icon">⚠️</span>
                          <span>{item.itemName}</span>
                        </h4>
                        <p>
                          Stock: <strong>{item.currentStock}</strong> | Threshold:{" "}
                          <strong>{item.reorderThreshold}</strong> | Used:{" "}
                          <strong>{item.totalUsed}</strong>
                        </p>
                      </div>
                      <span className="category-label high-label">High</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="risk-category">
              <h3 className="category-title medium-risk-title">
                🟡 Medium Risk Items ({itemsByRiskLevel.Medium.length})
              </h3>
              {itemsByRiskLevel.Medium.length === 0 ? (
                <p className="empty-category">No medium risk items</p>
              ) : (
                <div className="items-list">
                  {itemsByRiskLevel.Medium.map((item) => (
                    <div className="category-item medium-risk-item" key={item._id}>
                      <div className="item-info">
                        <h4>{item.itemName}</h4>
                        <p>
                          Stock: <strong>{item.currentStock}</strong> | Threshold:{" "}
                          <strong>{item.reorderThreshold}</strong> | Used:{" "}
                          <strong>{item.totalUsed}</strong>
                        </p>
                      </div>
                      <span className="category-label medium-label">Medium</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="risk-category">
              <h3 className="category-title low-risk-title">
                🟢 Low Risk Items ({itemsByRiskLevel.Low.length})
              </h3>
              {itemsByRiskLevel.Low.length === 0 ? (
                <p className="empty-category">No low risk items</p>
              ) : (
                <div className="items-list">
                  {itemsByRiskLevel.Low.map((item) => (
                    <div className="category-item low-risk-item" key={item._id}>
                      <div className="item-info">
                        <h4>{item.itemName}</h4>
                        <p>
                          Stock: <strong>{item.currentStock}</strong> | Threshold:{" "}
                          <strong>{item.reorderThreshold}</strong> | Used:{" "}
                          <strong>{item.totalUsed}</strong>
                        </p>
                      </div>
                      <span className="category-label low-label">Low</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

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

            {message && (
              <div className={`status-message ${messageType}`}>
                {message}
              </div>
            )}
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

            {message && <div className={`status-message ${messageType}`}>{message}</div>}
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

        <section className="table-panel">
          <div className="panel-header">
            <h2>Inventory Overview</h2>
            <span className="panel-tag">Real-Time Snapshot</span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Current Stock</th>
                  <th>Reorder Threshold</th>
                  <th>Total Used</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan="5">No inventory items found.</td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item._id}>
                      <td>{item.itemName}</td>
                      <td>{item.currentStock}</td>
                      <td>{item.reorderThreshold}</td>
                      <td>{item.totalUsed}</td>
                      <td>
                        <span className={`risk-badge ${getRiskDisplayClass(item.riskLevel)}`}>
                          {getRiskDisplayName(item.riskLevel)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="table-panel">
          <div className="panel-header">
            <h2>Inventory Usage Log</h2>
            <span className="panel-tag">Recent Activity</span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity Used</th>
                  <th>Usage Date</th>
                  <th>Updated Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {usageLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4">No usage logs found.</td>
                  </tr>
                ) : (
                  usageLogs.map((log) => (
                    <tr key={log._id}>
                      <td>{log.itemName}</td>
                      <td>{log.quantityUsed}</td>
                      <td>{new Date(log.usageDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`risk-badge ${getRiskDisplayClass(log.riskLevel)}`}>
                          {getRiskDisplayName(log.riskLevel)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;