const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    systemName: {
      type: String,
      default: "StockGuard System"
    },
    organizationName: {
      type: String,
      default: "Default Organization"
    },
    timezone: {
      type: String,
      default: "America/Toronto"
    },
    language: {
      type: String,
      default: "English"
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    criticalStockThreshold: {
      type: Number,
      default: 5
    },
    autoRiskCalculation: {
      type: Boolean,
      default: true
    },
    emailAlerts: {
      type: Boolean,
      default: true
    },
    lowStockAlerts: {
      type: Boolean,
      default: true
    },
    criticalAlerts: {
      type: Boolean,
      default: true
    },
    sessionTimeout: {
      type: Number,
      default: 30
    },
    roleBasedAccess: {
      type: Boolean,
      default: true
    },
    auditLogging: {
      type: Boolean,
      default: true
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    refreshInterval: {
      type: Number,
      default: 15
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);