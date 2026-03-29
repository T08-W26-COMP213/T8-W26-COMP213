const mongoose = require("mongoose");

const usageLogSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  quantityUsed: {
    type: Number,
    required: true,
    min: 1
  },
  usageDate: {
    type: String,
    required: true
  },
  remainingStock: {
    type: Number,
    required: true,
    min: 0
  },
  riskLevel: {
    type: String,
    enum: ["Low", "Medium", "High"],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("UsageLog", usageLogSchema);