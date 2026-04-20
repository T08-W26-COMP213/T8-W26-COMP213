import { useCallback, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import "./App.css";
import "./theme-dark.css";
import Login from "./Login";
import Sidebar from "./Sidebar";
import InventoryRiskLayout from "./InventoryRiskLayout";
import InventoryDashboardLayout from "./InventoryDashboardLayout";
import ReportDashboard from "./ReportDashboard";
import UserAccountManagementLayout from "./UserAccountManagementLayout";
import ConfirmationBanner from "./ConfirmationBanner";
import SystemConfigurationLayout from "./SystemConfigurationLayout";
import SystemSettings from "./SystemSettings";

/** Session-only: cleared when the browser tab/session ends so users see sign-in first on a new visit. */
const USER_SESSION_KEY = "stockguard_user";

function App() {
  const getTodayLocalISO = useCallback(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().split("T")[0];
  }, []);

  const formatUsageDateForUI = (value) => {
    const text = String(value ?? "").trim();
    if (!text) return "-";
    const isoDay = text.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDay) {
      const [y, m, d] = isoDay[1].split("-");
      return `${m}/${d}/${y}`;
    }
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      const mm = String(parsed.getMonth() + 1).padStart(2, "0");
      const dd = String(parsed.getDate()).padStart(2, "0");
      const yyyy = parsed.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }
    return text;
  };

  const usageCalendarSortKey = (log) => {
    const raw = String(log?.usageDate ?? "").trim();
    const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return new Date(`${m[1]}T12:00:00`).getTime();
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  const toLocalYMD = useCallback((date) => {
    const d = new Date(date);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().split("T")[0];
  }, []);

  const logUsageYmdForFilter = useCallback((log) => {
    const raw = String(log?.usageDate ?? "").trim();
    const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const parsed = new Date(raw).getTime();
    if (!Number.isNaN(parsed)) return toLocalYMD(new Date(parsed));
    if (log?.createdAt) return toLocalYMD(new Date(log.createdAt));
    return getTodayLocalISO();
  }, [toLocalYMD, getTodayLocalISO]);

  const getTimelineCutoffYmd = useCallback((calendarDaysInclusive) => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    t.setDate(t.getDate() - (calendarDaysInclusive - 1));
    return toLocalYMD(t);
  }, [toLocalYMD]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const API_URL = `${API_BASE_URL}/api/inventory`;

  const FALLBACK_LOW_STOCK_DEFAULT = 10;

  const fetchSystemSettingsForClient = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/system-settings`);
      const data = await response.json();
      if (!response.ok) {
        return { lowStockThreshold: FALLBACK_LOW_STOCK_DEFAULT, darkMode: false };
      }
      const n = Number(data?.lowStockThreshold);
      const lowStockThreshold =
        Number.isFinite(n) && n >= 1 ? n : FALLBACK_LOW_STOCK_DEFAULT;
      return {
        lowStockThreshold,
        darkMode: Boolean(data?.darkMode)
      };
    } catch {
      return { lowStockThreshold: FALLBACK_LOW_STOCK_DEFAULT, darkMode: false };
    }
  }, [API_BASE_URL]);

  const applyDarkModeFromSettings = useCallback((darkMode) => {
    document.documentElement.classList.toggle("stockguard-theme-dark", Boolean(darkMode));
  }, []);

  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem(USER_SESSION_KEY);
      if (!saved) return null;
      const u = JSON.parse(saved);
      if (u.role === "Strategic Role") {
        u.role = "Business Owner";
        sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(u));
      }
      return u;
    } catch {
      return null;
    }
  });

  const [activePage, setActivePage] = useState("dashboard");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantityUsed, setQuantityUsed] = useState("");
  const [usageDate, setUsageDate] = useState(getTodayLocalISO());
  const [usageLogs, setUsageLogs] = useState([]);
  const [systemActivityLogs, setSystemActivityLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newThreshold, setNewThreshold] = useState("");
  const [backendConnected, setBackendConnected] = useState(false);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [databaseStateLabel, setDatabaseStateLabel] = useState("disconnected");
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState("");
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [inventoryModalOffset, setInventoryModalOffset] = useState({ x: 0, y: 0 });
  const [duplicateResolution, setDuplicateResolution] = useState(null);
  const [duplicateModalOffset, setDuplicateModalOffset] = useState({ x: 0, y: 0 });
  const [inventoryRiskFilter, setInventoryRiskFilter] = useState("all");
  const [inventorySortBy, setInventorySortBy] = useState("name");
  const [inventorySortDirection, setInventorySortDirection] = useState("asc");
  const [usageRiskFilter, setUsageRiskFilter] = useState("all");
  const [usageTimelineFilter, setUsageTimelineFilter] = useState("all");
  const [usageSortBy, setUsageSortBy] = useState("submitted");
  const [usageSortDirection, setUsageSortDirection] = useState("desc");
  const [showUsageExportMenu, setShowUsageExportMenu] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageModalOffset, setUsageModalOffset] = useState({ x: 0, y: 0 });
  const [serverLogs, setServerLogs] = useState([]);
  const [serverLogLevelFilter, setServerLogLevelFilter] = useState("ALL");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("stockguard_sidebar_collapsed") === "1";
    } catch {
      return false;
    }
  });

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  const addSystemLog = (level, logMessage) => {
    const newLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toLocaleString(),
      level,
      message: logMessage
    };
    setSystemActivityLogs((prevLogs) => [newLog, ...prevLogs].slice(0, 50));
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

  const getRestockRecommendation = (item) => {
    if (!item) return "Monitor";
    if (item.currentStock <= item.reorderThreshold || item.riskLevel === "High") return "Immediate";
    if (item.currentStock <= Math.ceil(item.reorderThreshold * 1.5) || item.riskLevel === "Medium") {
      return "Reorder Soon";
    }
    return "Monitor";
  };

  const getRestockRecommendationClass = (rec) => {
    if (rec === "Immediate") return "high";
    if (rec === "Reorder Soon") return "medium";
    return "low";
  };

  const getLogLevelClass = (level) => {
    if (level === "ERROR" || level === "error") return "high";
    if (level === "WARN" || level === "warning") return "medium";
    return "low";
  };

  const fetchInventory = useCallback(async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch inventory.");
      setInventory(data);
      if (data.length > 0) {
        const exists = data.find((item) => item._id === selectedItemId);
        if (!exists) setSelectedItemId(data[0]._id);
      } else {
        setSelectedItemId("");
      }
    } catch {
      addSystemLog("ERROR", "Failed to load inventory data.");
    }
  }, [API_URL, selectedItemId]);

  const fetchUsageLogs = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/logs`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch usage logs.");
      setUsageLogs(data);
    } catch {
      addSystemLog("ERROR", "Failed to load usage logs.");
    }
  }, [API_URL]);

  const fetchHealthStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      setBackendConnected(response.ok);
      setDatabaseConnected(Boolean(data?.database?.connected));
      setDatabaseStateLabel(data?.database?.stateLabel || "disconnected");
      if (response.ok) addSystemLog("INFO", "Backend connected successfully.");
    } catch {
      setBackendConnected(false);
      setDatabaseConnected(false);
      setDatabaseStateLabel("disconnected");
      addSystemLog("ERROR", "Backend server is not reachable.");
    }
  }, [API_BASE_URL]);

  const fetchServerLogs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/logs?limit=50`);
      const data = await response.json();
      if (response.ok && data.logs) setServerLogs(data.logs);
    } catch {
      // Keep monitoring view resilient when logs endpoint is temporarily unavailable.
      void 0;
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    if (!user) {
      document.documentElement.classList.remove("stockguard-theme-dark");
      return undefined;
    }

    const onSystemSettingsChanged = () => {
      fetchSystemSettingsForClient().then((s) => applyDarkModeFromSettings(s.darkMode));
    };
    window.addEventListener("stockguard-system-settings-changed", onSystemSettingsChanged);

    const initializeApp = async () => {
      setLoading(true);
      await fetchHealthStatus();
      const sys = await fetchSystemSettingsForClient();
      applyDarkModeFromSettings(sys.darkMode);
      await Promise.all([fetchInventory(), fetchUsageLogs(), fetchServerLogs()]);
      setLoading(false);
      addSystemLog("INFO", "System initialization completed.");
    };
    initializeApp();

    return () => {
      window.removeEventListener("stockguard-system-settings-changed", onSystemSettingsChanged);
    };
  }, [user, fetchSystemSettingsForClient, applyDarkModeFromSettings, fetchHealthStatus, fetchInventory, fetchUsageLogs, fetchServerLogs]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => clearMessage(), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    try {
      localStorage.removeItem(USER_SESSION_KEY);
    } catch {
      void 0;
    }
  }, []);

  const handleLogin = (userData) => {
    const normalized = { ...userData };
    if (normalized.role === "Strategic Role") {
      normalized.role = "Business Owner";
    }
    setUser(normalized);
    try {
      sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(normalized));
    } catch {
      void 0;
    }
    setActivePage("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem(USER_SESSION_KEY);
      localStorage.removeItem(USER_SESSION_KEY);
    } catch {
      void 0;
    }
    setActivePage("dashboard");
    setInventory([]);
    setUsageLogs([]);
    setSystemActivityLogs([]);
    setServerLogs([]);
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("stockguard_sidebar_collapsed", next ? "1" : "0");
      } catch {
        void 0;
      }
      return next;
    });
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    setEditingItemId(item._id);
    setNewItemName(item.itemName || "");
    setNewStock(String(item.currentStock ?? ""));
    setNewThreshold(String(item.reorderThreshold ?? ""));
    setShowInventoryForm(true);
    clearMessage();
    addSystemLog("INFO", `Editing inventory item: ${item.itemName}.`);
  };

  const handleDeleteItem = async (item) => {
    const confirmed = window.confirm(`Delete "${item.itemName}" from inventory?`);
    if (!confirmed) return;

    clearMessage();
    try {
      const response = await fetch(`${API_URL}/${item._id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        showMessage(data.message || "Failed to delete item.", "error");
        return;
      }
      showMessage(data.message || "Item deleted successfully.", "success");
      addSystemLog("INFO", `Item deleted: ${item.itemName}.`);
      await fetchInventory();
    } catch {
      showMessage("Server error while deleting item.", "error");
    }
  };

  const resetItemForm = () => {
    setIsEditing(false);
    setEditingItemId("");
    setNewItemName("");
    setNewStock("");
    setNewThreshold("");
    setShowInventoryForm(false);
    setInventoryModalOffset({ x: 0, y: 0 });
  };

  const handleOpenAddInventoryForm = async () => {
    resetItemForm();
    const sys = await fetchSystemSettingsForClient();
    setNewThreshold(String(sys.lowStockThreshold));
    setShowInventoryForm(true);
    clearMessage();
  };

  useEffect(() => {
    if (showInventoryForm) {
      setInventoryModalOffset({ x: 0, y: 0 });
    }
  }, [showInventoryForm]);

  useEffect(() => {
    if (duplicateResolution) {
      setDuplicateModalOffset({ x: 0, y: 0 });
    }
  }, [duplicateResolution]);

  useEffect(() => {
    if (showUsageModal) {
      setUsageModalOffset({ x: 0, y: 0 });
    }
  }, [showUsageModal]);

  const handleInventoryModalDragStart = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (e.target.closest("button, a, input, select, textarea, label")) return;
      e.preventDefault();
      const originX = e.clientX;
      const originY = e.clientY;
      const baseX = inventoryModalOffset.x;
      const baseY = inventoryModalOffset.y;

      const onMove = (ev) => {
        let nx = baseX + (ev.clientX - originX);
        let ny = baseY + (ev.clientY - originY);
        const limX = Math.min(Math.max(window.innerWidth * 0.38, 280), 520);
        const limY = Math.min(Math.max(window.innerHeight * 0.32, 200), 380);
        nx = Math.max(-limX, Math.min(limX, nx));
        ny = Math.max(-limY, Math.min(limY, ny));
        setInventoryModalOffset({ x: nx, y: ny });
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [inventoryModalOffset]
  );

  const handleDuplicateModalDragStart = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (e.target.closest("button, a, input, select, textarea, label")) return;
      e.preventDefault();
      const originX = e.clientX;
      const originY = e.clientY;
      const baseX = duplicateModalOffset.x;
      const baseY = duplicateModalOffset.y;

      const onMove = (ev) => {
        let nx = baseX + (ev.clientX - originX);
        let ny = baseY + (ev.clientY - originY);
        const limX = Math.min(Math.max(window.innerWidth * 0.38, 280), 520);
        const limY = Math.min(Math.max(window.innerHeight * 0.32, 200), 380);
        nx = Math.max(-limX, Math.min(limX, nx));
        ny = Math.max(-limY, Math.min(limY, ny));
        setDuplicateModalOffset({ x: nx, y: ny });
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [duplicateModalOffset]
  );

  const handleUsageModalDragStart = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (e.target.closest("button, a, input, select, textarea, label")) return;
      e.preventDefault();
      const originX = e.clientX;
      const originY = e.clientY;
      const baseX = usageModalOffset.x;
      const baseY = usageModalOffset.y;

      const onMove = (ev) => {
        let nx = baseX + (ev.clientX - originX);
        let ny = baseY + (ev.clientY - originY);
        const limX = Math.min(Math.max(window.innerWidth * 0.42, 320), 600);
        const limY = Math.min(Math.max(window.innerHeight * 0.34, 220), 400);
        nx = Math.max(-limX, Math.min(limX, nx));
        ny = Math.max(-limY, Math.min(limY, ny));
        setUsageModalOffset({ x: nx, y: ny });
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [usageModalOffset]
  );

  const handleUsageSubmit = async (e) => {
    e.preventDefault();
    clearMessage();
    const usedQty = Number(quantityUsed);
    if (!selectedItemId) {
      showMessage("Please choose an item before submitting.", "error");
      return false;
    }
    const submittedUsageDate = String(usageDate).trim();
    if (!submittedUsageDate) {
      showMessage("Please choose the date of use.", "error");
      return false;
    }
    if (submittedUsageDate > getTodayLocalISO()) {
      showMessage("Usage date cannot be in the future.", "error");
      return false;
    }
    if (quantityUsed === "" || Number.isNaN(usedQty) || usedQty <= 0) {
      showMessage("Please enter a quantity greater than 0.", "error");
      return false;
    }
    try {
      const response = await fetch(`${API_URL}/usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: selectedItemId, quantityUsed: usedQty, usageDate: submittedUsageDate })
      });
      const data = await response.json();
      if (!response.ok) {
        showMessage(data.message || "Failed to update inventory usage.", "error");
        return false;
      }
      const dateLabel = formatUsageDateForUI(submittedUsageDate);
      showMessage(`${data.message || "Usage recorded successfully."} (${dateLabel})`, "success");
      addSystemLog("INFO", `Usage recorded for ${dateLabel}. Quantity used: ${usedQty}.`);
      setQuantityUsed("");
      setUsageDate(getTodayLocalISO());
      await Promise.all([fetchInventory(), fetchUsageLogs()]);
      return true;
    } catch {
      showMessage("Something went wrong while saving the usage entry.", "error");
      return false;
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    clearMessage();
    const trimmedItemName = newItemName.trim();
    const stockValue = Number(newStock);
    const thresholdValue = Number(newThreshold);
    if (!trimmedItemName) {
      showMessage("Please enter an item name.", "error");
      return;
    }
    if (trimmedItemName.length < 2) {
      showMessage("Item name must be at least 2 characters.", "error");
      return;
    }
    if (newStock === "" || Number.isNaN(stockValue) || stockValue < 0) {
      showMessage("Current stock must be >= 0.", "error");
      return;
    }
    if (newThreshold === "" || Number.isNaN(thresholdValue) || thresholdValue < 1) {
      showMessage("Reorder threshold must be >= 1.", "error");
      return;
    }

    const itemPayload = {
      itemName: trimmedItemName,
      currentStock: stockValue,
      reorderThreshold: thresholdValue
    };

    const executeItemSave = async (url, method, payload, mode) => {
      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
          showMessage(data.message || (mode === "edit" ? "Failed to update item." : "Failed to add item."), "error");
          return false;
        }

        if (mode === "merge") {
          showMessage("Existing item merged successfully.", "success");
          addSystemLog("INFO", `Duplicate item merged: ${payload.itemName}.`);
        } else if (mode === "replace") {
          showMessage("Existing item replaced successfully.", "success");
          addSystemLog("INFO", `Duplicate item replaced: ${payload.itemName}.`);
        } else {
          showMessage(data.message || (mode === "edit" ? "Item updated successfully." : "Item added successfully."), "success");
          addSystemLog("INFO", mode === "edit" ? `Item updated: ${payload.itemName}.` : `Item added: ${payload.itemName}.`);
        }

        resetItemForm();
        setDuplicateResolution(null);
        await fetchInventory();
        return true;
      } catch {
        showMessage(mode === "edit" ? "Server error while updating item." : "Server error while adding item.", "error");
        return false;
      }
    };

    if (!isEditing) {
      const duplicate = inventory.find(
        (item) => (item.itemName || "").trim().toLowerCase() === trimmedItemName.toLowerCase()
      );
      if (duplicate) {
        setDuplicateResolution({
          existingItem: duplicate,
          incomingItem: itemPayload
        });
        return;
      }
    }

    const url = isEditing ? `${API_URL}/${editingItemId}` : API_URL;
    const method = isEditing ? "PUT" : "POST";
    await executeItemSave(url, method, itemPayload, isEditing ? "edit" : "add");
  };

  const handleDuplicateMerge = async () => {
    if (!duplicateResolution) return;
    const { existingItem, incomingItem } = duplicateResolution;
    const mergedPayload = {
      itemName: existingItem.itemName,
      currentStock: Number(existingItem.currentStock || 0) + Number(incomingItem.currentStock || 0),
      reorderThreshold: Math.max(
        Number(existingItem.reorderThreshold || 0),
        Number(incomingItem.reorderThreshold || 0)
      )
    };

    try {
      const response = await fetch(`${API_URL}/${existingItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mergedPayload)
      });
      const data = await response.json();
      if (!response.ok) {
        showMessage(data.message || "Failed to merge duplicate item.", "error");
        return;
      }
      showMessage("Existing item merged successfully.", "success");
      addSystemLog("INFO", `Duplicate item merged: ${mergedPayload.itemName}.`);
      resetItemForm();
      setDuplicateResolution(null);
      await fetchInventory();
    } catch {
      showMessage("Server error while merging duplicate item.", "error");
    }
  };

  const handleDuplicateReplace = async () => {
    if (!duplicateResolution) return;
    const { existingItem, incomingItem } = duplicateResolution;
    try {
      const response = await fetch(`${API_URL}/${existingItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incomingItem)
      });
      const data = await response.json();
      if (!response.ok) {
        showMessage(data.message || "Failed to replace duplicate item.", "error");
        return;
      }
      showMessage("Existing item replaced successfully.", "success");
      addSystemLog("INFO", `Duplicate item replaced: ${incomingItem.itemName}.`);
      resetItemForm();
      setDuplicateResolution(null);
      await fetchInventory();
    } catch {
      showMessage("Server error while replacing duplicate item.", "error");
    }
  };

  const handleExportReport = () => {
    if (!displayedUsageLogs || displayedUsageLogs.length === 0) {
      showMessage("No usage report data available to export.", "error");
      return;
    }
    const headers = ["Item Name", "Quantity Used", "Usage Date", "Updated Risk Level"];
    const rows = displayedUsageLogs.map((log) => [
      log.itemName ?? "",
      log.quantityUsed ?? "",
      formatUsageDateForUI(log.usageDate),
      getRiskDisplayName(log.riskLevel) ?? ""
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventory-usage-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showMessage(`Report exported. ${displayedUsageLogs.length} record(s).`, "success");
    addSystemLog("INFO", `Usage report exported with ${displayedUsageLogs.length} record(s).`);
  };

  const handleExportReportPdf = () => {
    if (!displayedUsageLogs || displayedUsageLogs.length === 0) {
      showMessage("No usage report data available to export.", "error");
      return;
    }
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Inventory Usage Report", 14, 16);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);
      doc.setFontSize(9);
      let y = 34;
      doc.text("Item Name", 14, y);
      doc.text("Qty", 98, y);
      doc.text("Usage Date", 118, y);
      doc.text("Risk", 165, y);
      y += 4;
      doc.line(14, y, 196, y);
      y += 6;

      displayedUsageLogs.forEach((log, index) => {
        const row = [
          String(log.itemName ?? ""),
          String(log.quantityUsed ?? ""),
          formatUsageDateForUI(log.usageDate),
          String(getRiskDisplayName(log.riskLevel) ?? "")
        ];

        if (y > 280) {
          doc.addPage();
          y = 18;
        }

        doc.text(row[0].slice(0, 35), 14, y);
        doc.text(row[1], 98, y);
        doc.text(row[2], 118, y);
        doc.text(row[3], 165, y);
        y += 6;

        if ((index + 1) % 2 === 0) {
          doc.setDrawColor(235, 238, 245);
          doc.line(14, y - 3, 196, y - 3);
        }
      });

      doc.save(`inventory-usage-report-${new Date().toISOString().split("T")[0]}.pdf`);
      showMessage(`PDF report exported. ${displayedUsageLogs.length} record(s).`, "success");
      addSystemLog("INFO", `Usage PDF report exported with ${displayedUsageLogs.length} record(s).`);
    } catch {
      showMessage("PDF export failed. Please try again.", "error");
      addSystemLog("ERROR", "PDF export failed in usage log.");
    }
  };

  const lowStockItems = useMemo(() => inventory.filter((item) => item.currentStock <= item.reorderThreshold), [inventory]);
  const highRiskItems = useMemo(() => inventory.filter((item) => item.riskLevel === "High"), [inventory]);
  const itemsByRiskLevel = useMemo(() => ({
    High: inventory.filter((i) => i.riskLevel === "High"),
    Medium: inventory.filter((i) => i.riskLevel === "Medium"),
    Low: inventory.filter((i) => i.riskLevel === "Low")
  }), [inventory]);
  const totalItems = inventory.length;
  const totalUnitsRemaining = useMemo(() => inventory.reduce((sum, item) => sum + item.currentStock, 0), [inventory]);
  const displayedInventory = useMemo(() => {
    const filtered = inventory.filter((item) => {
      if (inventoryRiskFilter === "all") return true;
      if (inventoryRiskFilter === "safe") return item.riskLevel === "Low";
      if (inventoryRiskFilter === "at-risk") return item.riskLevel === "Medium";
      return item.riskLevel === "High";
    });

    const riskRank = { High: 3, Medium: 2, Low: 1 };
    const sorted = [...filtered].sort((a, b) => {
      let left = 0;
      let right = 0;

      if (inventorySortBy === "name") {
        left = a.itemName.toLowerCase();
        right = b.itemName.toLowerCase();
      } else if (inventorySortBy === "risk") {
        left = riskRank[a.riskLevel] ?? 0;
        right = riskRank[b.riskLevel] ?? 0;
      } else {
        left = Number(a.currentStock) || 0;
        right = Number(b.currentStock) || 0;
      }

      if (left < right) return inventorySortDirection === "asc" ? -1 : 1;
      if (left > right) return inventorySortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [inventory, inventoryRiskFilter, inventorySortBy, inventorySortDirection]);

  const displayedUsageLogs = useMemo(() => {
    const filtered = usageLogs.filter((log) => {
      if (usageRiskFilter === "all") return true;
      if (usageRiskFilter === "safe") return log.riskLevel === "Low";
      if (usageRiskFilter === "at-risk") return log.riskLevel === "Medium";
      return log.riskLevel === "High";
    }).filter((log) => {
      if (usageTimelineFilter === "all") return true;
      const days = Number(usageTimelineFilter);
      if (!Number.isFinite(days) || days <= 0) return true;
      const cutoff = getTimelineCutoffYmd(days);
      const ymd = logUsageYmdForFilter(log);
      return ymd >= cutoff;
    });

    const riskRank = { High: 3, Medium: 2, Low: 1 };
    const sorted = [...filtered].sort((a, b) => {
      let left = 0;
      let right = 0;

      if (usageSortBy === "name") {
        left = (a.itemName || "").toLowerCase();
        right = (b.itemName || "").toLowerCase();
      } else if (usageSortBy === "risk") {
        left = riskRank[a.riskLevel] ?? 0;
        right = riskRank[b.riskLevel] ?? 0;
      } else if (usageSortBy === "quantity") {
        left = Number(a.quantityUsed) || 0;
        right = Number(b.quantityUsed) || 0;
      } else if (usageSortBy === "submitted") {
        left = new Date(a.createdAt || 0).getTime();
        right = new Date(b.createdAt || 0).getTime();
      } else {
        left = usageCalendarSortKey(a);
        right = usageCalendarSortKey(b);
      }

      if (left < right) return usageSortDirection === "asc" ? -1 : 1;
      if (left > right) return usageSortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [usageLogs, usageRiskFilter, usageTimelineFilter, usageSortBy, usageSortDirection, getTimelineCutoffYmd, logUsageYmdForFilter]);

  const displayedServerLogs = useMemo(() => {
    if (serverLogLevelFilter === "ALL") return serverLogs;
    return serverLogs.filter(
      (log) => String(log.level || "").toUpperCase() === serverLogLevelFilter
    );
  }, [serverLogs, serverLogLevelFilter]);

  const SERVER_PORT = (() => {
    try {
      const u = new URL(API_BASE_URL);
      return u.port || (u.protocol === "https:" ? "443" : "80");
    } catch {
      return "Unknown";
    }
  })();

  if (!user) return <Login onLogin={handleLogin} />;

  const getPageTitle = () => {
    const titles = {
      dashboard: "Dashboard",
      inventory: "Inventory Management",
      usage: "Log Inventory Usage",
      "risk-alerts": "Inventory Risk Alerts",
      trends: "Consumption Trends",
      users: "User Account Management",
      reports: "Reports & Analytics",
      settings: "System Settings",
      monitoring: "System Monitoring"
    };
    return titles[activePage] || "Dashboard";
  };

  const renderDashboard = () => (
    <>
      <section className="stats-grid">
        <div className="stat-card">
          <p className="stat-title">Total Items</p>
          <h3>{totalItems}</h3>
        </div>
        <div className="stat-card">
          <p className="stat-title">Total Stock</p>
          <h3>{totalUnitsRemaining}</h3>
        </div>
        <div className="stat-card">
          <p className="stat-title">At Risk</p>
          <h3>{itemsByRiskLevel.Medium.length}</h3>
        </div>
        <div className="stat-card">
          <p className="stat-title">Critical</p>
          <h3>⚠️ {highRiskItems.length}</h3>
        </div>
      </section>

      <InventoryDashboardLayout
        inventory={inventory}
        loading={loading}
        onRefresh={async () => {
          try {
            const response = await fetch(`${API_URL}/recalculate-risk`, {
              method: "POST",
              headers: { "Content-Type": "application/json" }
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
              showMessage(data.message || "Could not recalculate inventory risk levels.", "error");
              addSystemLog("ERROR", "Recalculate-risk request failed.");
              return;
            }
            await fetchInventory();
            addSystemLog("INFO", data.message || "Inventory risk levels refreshed.");
          } catch {
            showMessage("Could not refresh inventory risk levels.", "error");
            addSystemLog("ERROR", "Recalculate-risk request failed.");
          }
        }}
      />

      <section className="panel glass-panel classification-panel">
        <div className="panel-header">
          <h2>Items by Risk Category</h2>
          <span className="panel-tag">Classification</span>
        </div>
        <div className="category-container">
          {["High", "Medium", "Low"].map((level) => {
            const icons = { High: "\u{1F534}", Medium: "\u{1F7E1}", Low: "\u{1F7E2}" };
            const classes = { High: "high-risk", Medium: "medium-risk", Low: "low-risk" };
            const labels = { High: "Critical", Medium: "At Risk", Low: "Safe" };
            return (
              <div className="risk-category" key={level}>
                <h3 className={`category-title ${classes[level]}-title`}>
                  {icons[level]} {labels[level]} Items ({itemsByRiskLevel[level].length})
                </h3>
                {itemsByRiskLevel[level].length === 0 ? (
                  <p className="empty-category">No {labels[level].toLowerCase()} items</p>
                ) : (
                  <div className="items-list">
                    {itemsByRiskLevel[level].map((item) => (
                      <div className={`category-item ${classes[level]}-item`} key={item._id}>
                        <div className="item-info">
                          <h4>
                            {item.riskLevel === "High" && <span className="critical-icon">{"\u26A0\uFE0F"} </span>}
                            {item.itemName}
                          </h4>
                          <p>
                            Stock: <strong>{item.currentStock}</strong> | Threshold: <strong>{item.reorderThreshold}</strong> | Used: <strong>{item.totalUsed}</strong>
                          </p>
                        </div>
                        <span className={`category-label ${level.toLowerCase()}-label`}>{level}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );

  const renderInventory = () => (
    <>
      <section className="table-panel">
        <div className="panel-header">
          <h2>Inventory Overview</h2>
          <span className="panel-tag">Real-Time Snapshot</span>
        </div>
        <div className="table-controls">
          <select value={inventoryRiskFilter} onChange={(e) => setInventoryRiskFilter(e.target.value)}>
            <option value="all">All Risks</option>
            <option value="safe">Safe</option>
            <option value="at-risk">At Risk</option>
            <option value="critical">Critical</option>
          </select>
          <select value={inventorySortBy} onChange={(e) => setInventorySortBy(e.target.value)}>
            <option value="name">Sort by Name</option>
            <option value="risk">Sort by Risk</option>
            <option value="count">Sort by Stock Count</option>
          </select>
          <select value={inventorySortDirection} onChange={(e) => setInventorySortDirection(e.target.value)}>
            <option value="asc">Top to Bottom (Asc)</option>
            <option value="desc">Bottom to Top (Desc)</option>
          </select>
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
                <th>Recommendation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedInventory.length === 0 ? (
                <tr>
                  <td colSpan="7">No inventory items added yet.</td>
                </tr>
              ) : (
                displayedInventory.map((item) => (
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
                    <td>
                      <span className={`risk-badge ${getRestockRecommendationClass(getRestockRecommendation(item))}`}>
                        {getRestockRecommendation(item)}
                      </span>
                    </td>
                    <td>
                      <div className="inventory-action-buttons">
                        <button type="button" onClick={() => handleEditClick(item)}>Edit</button>
                        <button type="button" className="inventory-delete-btn" onClick={() => handleDeleteItem(item)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="section-action-row">
          <button type="button" className="section-action-btn" onClick={handleOpenAddInventoryForm}>
            Add Inventory Item
          </button>
        </div>
      </section>

      {showInventoryForm && (
        <div className="form-overlay" onClick={() => resetItemForm()}>
          <div
            className="form-modal form-modal--draggable"
            style={{
              transform: `translate(${inventoryModalOffset.x}px, ${inventoryModalOffset.y}px)`
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-modal-title"
          >
            <div
              className="panel-header form-modal-drag-handle"
              onPointerDown={handleInventoryModalDragStart}
              title="Drag to move this window"
            >
              <h2 id="inventory-modal-title">{isEditing ? "Edit Inventory Item" : "Add Inventory Item"}</h2>
              <span className="panel-tag">{isEditing ? "Edit Mode" : "Database Entry"}</span>
            </div>
            <form onSubmit={handleAddItem} className="usage-form">
              <label>
                Item Name
                <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Enter item name" />
              </label>
              <label>
                Current Stock
                <input type="number" min="0" value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="Enter current stock" />
              </label>
              <label>
                Reorder Threshold
                <input
                  type="number"
                  min="1"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  placeholder="Enter reorder threshold"
                  title={
                    isEditing
                      ? undefined
                      : "Prefilled from System Configuration → Default Low Stock Threshold"
                  }
                />
              </label>
              <div className="section-action-row">
                <button type="submit" className="section-action-btn">{isEditing ? "Update Item" : "Add Item"}</button>
                <button type="button" className="section-action-btn section-action-btn-secondary" onClick={resetItemForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {duplicateResolution && (
        <div className="form-overlay" onClick={() => setDuplicateResolution(null)}>
          <div
            className="form-modal form-modal--draggable"
            style={{
              transform: `translate(${duplicateModalOffset.x}px, ${duplicateModalOffset.y}px)`
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-modal-title"
          >
            <div
              className="panel-header form-modal-drag-handle"
              onPointerDown={handleDuplicateModalDragStart}
              title="Drag to move this window"
            >
              <h2 id="duplicate-modal-title">Duplicate Item Found</h2>
              <span className="panel-tag">Choose Action</span>
            </div>
            <p>
              Item <strong>{duplicateResolution.incomingItem.itemName}</strong> already exists.
            </p>
            <p>Choose how to continue:</p>
            <div className="duplicate-resolution-actions">
              <button type="button" className="section-action-btn" onClick={handleDuplicateMerge}>
                Merge
              </button>
              <button type="button" className="section-action-btn" onClick={handleDuplicateReplace}>
                Replace
              </button>
              <button type="button" className="section-action-btn section-action-btn-secondary" onClick={() => setDuplicateResolution(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderUsage = () => {
    const confirmationBody =
      messageType === "success" && message
        ? message
        : messageType === "error" && message
          ? message
          : "After you submit, a success or error message will appear here.";

    const selectedInventoryItem = inventory.find((item) => item._id === selectedItemId);

    return (
      <>
        <section className="table-panel usage-entry-section">
          <div className="panel-header">
            <h2>Log inventory usage</h2>
          </div>

          <div className="usage-entry-toolbar">
            <div className="confirmation-wire-box usage-entry-confirmation" aria-live="polite" aria-relevant="additions text">
              <h3 className="confirmation-wire-title">Confirmation Message</h3>
              <p
                className={`confirmation-wire-body ${
                  messageType === "success" ? "is-success" : messageType === "error" ? "is-error" : ""
                }`}
              >
                {confirmationBody}
              </p>
            </div>
            <button type="button" className="section-action-btn usage-entry-open-btn" onClick={() => setShowUsageModal(true)}>
              Submit Usage
            </button>
          </div>

          <div className="dashboard-table-card usage-inventory-overview">
            <h3>Inventory Overview</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Stock</th>
                    <th>Threshold</th>
                    <th>Used</th>
                    <th>Rate</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan="6">{loading ? "Loading..." : "No inventory items yet."}</td>
                    </tr>
                  ) : (
                    inventory.map((item) => (
                      <tr key={item._id}>
                        <td>{item.itemName}</td>
                        <td>{item.currentStock}</td>
                        <td>{item.reorderThreshold}</td>
                        <td>{item.totalUsed ?? 0}</td>
                        <td>{item.consumptionRate != null ? `${item.consumptionRate}/day` : "—"}</td>
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
          </div>
        </section>

        {showUsageModal && (
          <div className="form-overlay" onClick={() => setShowUsageModal(false)}>
            <div
              className="form-modal form-modal--draggable"
              style={{
                transform: `translate(${usageModalOffset.x}px, ${usageModalOffset.y}px)`
              }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="usage-modal-title"
            >
              <div
                className="panel-header form-modal-drag-handle"
                onPointerDown={handleUsageModalDragStart}
                title="Drag to move this window"
              >
                <h2 id="usage-modal-title">Submit usage</h2>
              </div>

              <form
                onSubmit={async (e) => {
                  const ok = await handleUsageSubmit(e);
                  if (ok) setShowUsageModal(false);
                }}
                className="usage-form usage-inline-form"
              >
                <label>
                  Select Item
                  <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
                    <option value="">-- Select item --</option>
                    {inventory.map((item) => (
                      <option key={item._id} value={item._id}>{item.itemName}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Total stock count
                  <input
                    type="text"
                    readOnly
                    className="usage-readonly-stock"
                    value={selectedInventoryItem != null ? String(selectedInventoryItem.currentStock) : "—"}
                    aria-live="polite"
                  />
                </label>
                <label>
                  Quantity Used
                  <input
                    type="number"
                    min="1"
                    value={quantityUsed}
                    onChange={(e) => setQuantityUsed(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </label>
                <label>
                  Date
                  <input type="date" value={usageDate} onChange={(e) => setUsageDate(e.target.value)} />
                </label>
                <div className="section-action-row usage-modal-actions">
                  <button type="submit" className="section-action-btn">Submit Usage</button>
                  <button
                    type="button"
                    className="section-action-btn section-action-btn-secondary"
                    onClick={() => setShowUsageModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="table-panel">
          <div className="usage-log-title-row">
            <span className="panel-tag usage-log-recent-tag">Usage Log</span>
            <h2>Recent usage entries</h2>
          </div>
          <div className="usage-log-controls-row">
            <div className="usage-controls-left">
              <div className="table-controls">
                <select value={usageRiskFilter} onChange={(e) => setUsageRiskFilter(e.target.value)}>
                  <option value="all">All Risks</option>
                  <option value="safe">Safe</option>
                  <option value="at-risk">At Risk</option>
                  <option value="critical">Critical</option>
                </select>
                <select value={usageTimelineFilter} onChange={(e) => setUsageTimelineFilter(e.target.value)}>
                  <option value="all">All time</option>
                  <option value="7">Last 7 days</option>
                  <option value="14">Last 14 days</option>
                  <option value="30">Last 30 days</option>
                </select>
                <select value={usageSortBy} onChange={(e) => setUsageSortBy(e.target.value)}>
                  <option value="submitted">Sort by submission time</option>
                  <option value="date">Sort by usage date</option>
                  <option value="name">Sort by Name</option>
                  <option value="risk">Sort by Risk</option>
                  <option value="quantity">Sort by Quantity</option>
                </select>
                <select value={usageSortDirection} onChange={(e) => setUsageSortDirection(e.target.value)}>
                  <option value="asc">Top to Bottom (Asc)</option>
                  <option value="desc">Bottom to Top (Desc)</option>
                </select>
              </div>
            </div>
            <div className="export-menu-wrapper">
              <button
                type="button"
                className="section-action-btn export-trigger-btn"
                disabled={usageLogs.length === 0}
                onClick={() => setShowUsageExportMenu((prev) => !prev)}
              >
                Export
              </button>
              {showUsageExportMenu && usageLogs.length > 0 && (
                <div className="export-menu">
                  <button type="button" onClick={() => { handleExportReport(); setShowUsageExportMenu(false); }}>
                    Export CSV
                  </button>
                  <button type="button" onClick={() => { handleExportReportPdf(); setShowUsageExportMenu(false); }}>
                    Export PDF
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="table-wrapper usage-log-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Date</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsageLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      {usageLogs.length > 0 && (usageRiskFilter !== "all" || usageTimelineFilter !== "all")
                        ? "No usage logs match the current filters."
                        : "No usage logs found."}
                    </td>
                  </tr>
                ) : (
                  displayedUsageLogs.map((log) => (
                    <tr key={log._id}>
                      <td>{log.itemName}</td>
                      <td>{log.quantityUsed}</td>
                      <td>{formatUsageDateForUI(log.usageDate)}</td>
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
      </>
    );
  };

  const renderRiskAlerts = () => (
    <>
      <InventoryRiskLayout
        inventory={inventory}
        loading={loading}
        backendConnected={backendConnected}
        fetchInventory={fetchInventory}
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
              <p>All inventory items are above their reorder threshold.</p>
            </div>
          ) : (
            <div className="alert-list">
              {lowStockItems.map((item) => (
                <div className="alert-item" key={item._id}>
                  <div>
                    <h4>{item.itemName}</h4>
                    <p>Current Stock: <strong>{item.currentStock}</strong></p>
                    <p>Reorder Threshold: <strong>{item.reorderThreshold}</strong></p>
                    <p>Status: <strong>{item.currentStock <= item.reorderThreshold ? "Alert Triggered" : "Normal"}</strong></p>
                  </div>
                  <span className={`risk-badge ${getRiskDisplayClass(item.riskLevel)}`}>
                    {getRiskDisplayName(item.riskLevel)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );

  const renderTrends = () => {
    const trendRows = inventory.map((item) => {
      const logsForItem = usageLogs.filter((log) => log.itemName === item.itemName);
      const totalUsed = logsForItem.reduce((sum, log) => sum + (Number(log.quantityUsed) || 0), 0);
      const daySet = new Set(
        logsForItem
          .map((log) => (log.usageDate ? new Date(log.usageDate).toDateString() : null))
          .filter(Boolean)
      );
      const daysTracked = Math.max(daySet.size, 1);
      const avgDailyUsage = totalUsed / daysTracked;
      const daysRemaining = avgDailyUsage > 0 ? item.currentStock / avgDailyUsage : Infinity;
      const priority = daysRemaining <= 3 ? "Immediate" : daysRemaining <= 7 ? "Reorder Soon" : "Monitor";

      return {
        id: item._id,
        itemName: item.itemName,
        currentStock: item.currentStock,
        totalUsed: Number(item.totalUsed) || totalUsed,
        avgDailyUsage,
        daysRemaining,
        priority
      };
    }).sort((a, b) => {
      const u = b.avgDailyUsage - a.avgDailyUsage;
      if (u !== 0) return u;
      return (a.itemName || "").localeCompare(b.itemName || "");
    });
    const immediateRows = trendRows.filter((row) => row.priority === "Immediate");
    const reorderSoonRows = trendRows.filter((row) => row.priority === "Reorder Soon");
    const monitorRows = trendRows.filter((row) => row.priority === "Monitor");

    return (
      <section className="table-panel">
        <div className="panel-header">
          <h2>Consumption Trend Analysis</h2>
          <span className="panel-tag">{user?.role || ""}</span>
        </div>
        <div className="dashboard-table-card trends-consumption-card">
          <h3>Consumption Rate by Item</h3>
          <div className="table-wrapper">
            <table className="trends-consumption-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Stock</th>
                  <th>Used</th>
                  <th>Rate/day</th>
                  <th>Est. days left</th>
                  <th>Risk level</th>
                </tr>
              </thead>
              <tbody>
                {trendRows.length === 0 ? (
                  <tr>
                    <td colSpan="6">No inventory data available.</td>
                  </tr>
                ) : (
                  trendRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.itemName}</td>
                      <td>{row.currentStock}</td>
                      <td>{row.totalUsed}</td>
                      <td>{row.avgDailyUsage.toFixed(2)}</td>
                      <td>{Number.isFinite(row.daysRemaining) ? row.daysRemaining.toFixed(1) : "N/A"}</td>
                      <td>
                        <span className={`risk-badge ${getRestockRecommendationClass(row.priority)}`}>
                          {row.priority}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="dashboard-table-card usage-inventory-overview trends-recommendations-card">
          <h3>Restocking Recommendations</h3>
          <div className="table-wrapper">
            <table className="trends-recommendations-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Item</th>
                  <th>Current Stock</th>
                  <th>Est. days left</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {trendRows.length === 0 ? (
                  <tr>
                    <td colSpan="5">No recommendation data available.</td>
                  </tr>
                ) : (
                  [...immediateRows, ...reorderSoonRows, ...monitorRows].map((row) => (
                    <tr key={`${row.id}-recommendation`}>
                      <td>
                        <span className={`risk-badge ${getRestockRecommendationClass(row.priority)}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td>{row.itemName}</td>
                      <td>{row.currentStock}</td>
                      <td>{Number.isFinite(row.daysRemaining) ? row.daysRemaining.toFixed(1) : "N/A"}</td>
                      <td>
                        {row.priority === "Immediate"
                          ? "Depletes very soon, reorder now."
                          : row.priority === "Reorder Soon"
                            ? "Approaching threshold, place reorder."
                            : "Stock level stable, continue monitoring."}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  };

  const renderReports = () => (
    <div className="report-dashboard-section">
      <ReportDashboard />
    </div>
  );

  const renderUsers = () => <UserAccountManagementLayout />;

  const renderSettings = () => (
    <div className="settings-page-stack">
      <SystemConfigurationLayout />
      <SystemSettings />
    </div>
  );

  const renderMonitoring = () => (
    <>
      <section className="content-grid">
        <div className="panel glass-panel">
          <div className="panel-header">
            <h2>System Status</h2>
          </div>
          <div className="database-status-overview">
            <div className="database-status-card">
              <span className="database-status-title">MongoDB Status</span>
              <span className={`database-status-badge ${databaseConnected ? "connected" : "disconnected"}`}>
                {databaseConnected ? "Connected" : "Disconnected"}
              </span>
              <p className="database-status-subtext">{databaseStateLabel}</p>
            </div>
            <div className="database-status-card">
              <span className="database-status-title">Backend Status</span>
              <span className={`database-status-badge ${backendConnected ? "connected" : "disconnected"}`}>
                {backendConnected ? "Available" : "Unavailable"}
              </span>
              <p className="database-status-subtext">API service health</p>
            </div>
            <div className="database-status-card">
              <span className="database-status-title">API Status</span>
              <span className={`database-status-badge ${backendConnected ? "connected" : "disconnected"}`}>
                {backendConnected ? "Healthy" : "Down"}
              </span>
              <p className="database-status-subtext">`/api/health` endpoint</p>
            </div>
          </div>
          <div className="database-settings-box">
            <div className="database-setting-row">
              <span className="database-setting-label">Connection State</span>
              <span className="database-state-text">{databaseStateLabel}</span>
            </div>
            <div className="database-setting-row">
              <span className="database-setting-label">Server Port</span>
              <span className="database-state-text">{SERVER_PORT}</span>
            </div>
            <div className="database-setting-row">
              <span className="database-setting-label">API Base URL</span>
              <code className="database-setting-value">{API_BASE_URL}</code>
            </div>
          </div>
        </div>
      </section>

      <section className="table-panel">
        <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2>Server System Logs</h2>
            <span className="panel-tag">Backend Logs</span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={serverLogLevelFilter}
              onChange={(e) => setServerLogLevelFilter(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #c9d2e4" }}
              aria-label="Filter logs by level"
            >
              <option value="ALL">All Levels</option>
              <option value="ERROR">ERROR</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
            <button
              type="button"
              onClick={fetchServerLogs}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "none", cursor: "pointer" }}
            >
              Refresh Logs
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Level</th>
                <th>Source</th>
                <th>Event</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {displayedServerLogs.length === 0 ? (
                <tr>
                  <td colSpan="5">No server logs available.</td>
                </tr>
              ) : (
                displayedServerLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                      <span className={`risk-badge ${getLogLevelClass(log.level)}`}>{log.level}</span>
                    </td>
                    <td>{log.source}</td>
                    <td>{log.event}</td>
                    <td>{log.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="table-panel">
        <div className="panel-header">
          <h2>Client Activity Log</h2>
          <span className="panel-tag">Frontend Monitoring</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Level</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {systemActivityLogs.length === 0 ? (
                <tr>
                  <td colSpan="3">No client activity logged yet.</td>
                </tr>
              ) : (
                systemActivityLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.timestamp}</td>
                    <td>
                      <span className={`risk-badge ${getLogLevelClass(log.level)}`}>{log.level}</span>
                    </td>
                    <td>{log.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return renderDashboard();
      case "inventory": return renderInventory();
      case "usage": return renderUsage();
      case "risk-alerts": return renderRiskAlerts();
      case "trends": return renderTrends();
      case "users": return renderUsers();
      case "reports": return renderReports();
      case "settings": return renderSettings();
      case "monitoring": return renderMonitoring();
      default: return renderDashboard();
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={handleLogout}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      <div className={`main-content ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="main-header">
          <h1>{getPageTitle()}</h1>
          <span className="main-header-meta">Logged in as {user.username} ({user.role})</span>
        </div>
        <div className="page-content">
          {message && (
            <ConfirmationBanner
              message={message}
              type={messageType}
              onClose={clearMessage}
              autoCloseDuration={messageType === "success" ? 4000 : 5000}
            />
          )}
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default App;
