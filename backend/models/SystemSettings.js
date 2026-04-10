const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    systemName: {
      type: String,
      default: "StockGuard System"
    },
    defaultReorderThreshold: {
      type: Number,
      default: 10
    },
    enableAlerts: {
      type: Boolean,
      default: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);