const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  reorderThreshold: {
    type: Number,
    required: true,
    min: 1
  },
  totalUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  consumptionRate: {
  type: Number,
  default: 0,
  min: 0
  },
  riskLevel: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Inventory", inventorySchema);