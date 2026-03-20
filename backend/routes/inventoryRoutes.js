const express = require("express");
const mongoose = require("mongoose");
const Inventory = require("../models/Inventory");
const UsageLog = require("../models/UsageLog");

const router = express.Router();

function calculateRiskLevel(stock, threshold) {
  if (stock <= threshold * 0.5) return "High";
  if (stock <= threshold) return "Medium";
  return "Low";
}

router.get("/", async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch inventory items",
      error: error.message
    });
  }
});

router.get("/logs", async (req, res) => {
  try {
    const logs = await UsageLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch usage logs",
      error: error.message
    });
  }
});

router.post("/usage", async (req, res) => {
  try {
    let { itemId, quantityUsed, usageDate } = req.body;

    if (!itemId) {
      return res.status(400).json({
        message: "Item ID is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        message: "Invalid item ID"
      });
    }

    quantityUsed = Number(quantityUsed);

    if (Number.isNaN(quantityUsed) || quantityUsed <= 0) {
      return res.status(400).json({
        message: "Quantity used must be a valid number greater than 0"
      });
    }

    if (!usageDate || !String(usageDate).trim()) {
      return res.status(400).json({
        message: "Usage date is required"
      });
    }

    const item = await Inventory.findById(itemId);

    if (!item) {
      return res.status(404).json({
        message: "Item not found"
      });
    }

    if (quantityUsed > item.currentStock) {
      return res.status(400).json({
        message: "Usage quantity cannot exceed current stock"
      });
    }

    item.currentStock -= quantityUsed;
    item.totalUsed += quantityUsed;
    item.riskLevel = calculateRiskLevel(item.currentStock, item.reorderThreshold);

    const updatedItem = await item.save();

    const newUsageLog = new UsageLog({
      itemId: updatedItem._id,
      itemName: updatedItem.itemName,
      quantityUsed,
      usageDate,
      remainingStock: updatedItem.currentStock,
      riskLevel: updatedItem.riskLevel
    });

    const savedLog = await newUsageLog.save();

    res.json({
      message: "Inventory usage logged successfully",
      item: updatedItem,
      log: savedLog
    });
  } catch (error) {
    console.error("Usage update error:", error);
    res.status(400).json({
      message: "Failed to update inventory usage",
      error: error.message
    });
  }
});

module.exports = router;