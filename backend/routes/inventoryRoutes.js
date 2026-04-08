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

function calculateConsumptionRate(totalUsed, createdAt) {
  const createdDate = new Date(createdAt);
  const today = new Date();
  const diffTime = today - createdDate;
  const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);

  return Number((totalUsed / diffDays).toFixed(2));
}

function validateInventoryPayload(itemName, currentStock, reorderThreshold) {
  if (!itemName || !String(itemName).trim()) {
    return "Item name is required";
  }

  const stock = Number(currentStock);
  const threshold = Number(reorderThreshold);

  if (Number.isNaN(stock) || stock < 0) {
    return "Current stock must be a valid number >= 0";
  }

  if (Number.isNaN(threshold) || threshold < 1) {
    return "Reorder threshold must be a valid number >= 1";
  }

  return null;
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

router.post("/", async (req, res) => {
  try {
    const { itemName, currentStock, reorderThreshold } = req.body;
    const validationError = validateInventoryPayload(itemName, currentStock, reorderThreshold);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const stock = Number(currentStock);
    const threshold = Number(reorderThreshold);

    const newItem = new Inventory({
      itemName: String(itemName).trim(),
      currentStock: stock,
      reorderThreshold: threshold,
      totalUsed: 0,
      consumptionRate: 0,
      riskLevel: calculateRiskLevel(stock, threshold)
    });

    const savedItem = await newItem.save();

    res.status(201).json({
      message: "Inventory item added successfully",
      item: savedItem
    });
  } catch (error) {
    console.error("Add item error:", error);
    res.status(400).json({
      message: "Failed to add inventory item",
      error: error.message
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, currentStock, reorderThreshold } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const validationError = validateInventoryPayload(itemName, currentStock, reorderThreshold);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const stock = Number(currentStock);
    const threshold = Number(reorderThreshold);

    const item = await Inventory.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.itemName = String(itemName).trim();
    item.currentStock = stock;
    item.reorderThreshold = threshold;
    item.riskLevel = calculateRiskLevel(stock, threshold);
    item.totalUsed = Math.max(Number(item.totalUsed) || 0, 0);
    item.consumptionRate = calculateConsumptionRate(item.totalUsed, item.createdAt);

    const updatedItem = await item.save();

    res.json({
      message: "Inventory item updated successfully",
      item: updatedItem
    });
  } catch (error) {
    console.error("Update item error:", error);
    res.status(400).json({
      message: "Failed to update inventory item",
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
      return res.status(400).json({ message: "Item ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    quantityUsed = Number(quantityUsed);

    if (Number.isNaN(quantityUsed) || quantityUsed <= 0) {
      return res.status(400).json({
        message: "Quantity used must be a valid number greater than 0"
      });
    }

    if (!usageDate || !String(usageDate).trim()) {
      return res.status(400).json({ message: "Usage date is required" });
    }

    const normalizedUsageDate = String(usageDate).trim().split("T")[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedUsageDate)) {
      return res.status(400).json({
        message: "Usage date must be in YYYY-MM-DD format"
      });
    }

    const item = await Inventory.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (quantityUsed > item.currentStock) {
      return res.status(400).json({
        message: "Usage quantity cannot exceed current stock"
      });
    }

    item.currentStock -= quantityUsed;
    item.totalUsed = (item.totalUsed || 0) + quantityUsed;
    item.consumptionRate = calculateConsumptionRate(item.totalUsed, item.createdAt);
    item.riskLevel = calculateRiskLevel(item.currentStock, item.reorderThreshold);

    const updatedItem = await item.save();

    const newUsageLog = new UsageLog({
      itemId: updatedItem._id,
      itemName: updatedItem.itemName,
      quantityUsed,
      usageDate: normalizedUsageDate,
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