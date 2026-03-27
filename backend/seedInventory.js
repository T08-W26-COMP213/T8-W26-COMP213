const mongoose = require("mongoose");
require("dotenv").config();

const Inventory = require("./models/Inventory");

function calculateRiskLevel(stock, threshold) {
  if (stock <= threshold * 0.5) return "High";
  if (stock <= threshold) return "Medium";
  return "Low";
}

const rawInventory = [
  { itemName: "Surgical Masks", currentStock: 120, reorderThreshold: 50 },   // Low
  { itemName: "Latex Gloves", currentStock: 40, reorderThreshold: 50 },      // Medium
  { itemName: "Sanitizer Bottles", currentStock: 15, reorderThreshold: 40 }, // High
  { itemName: "IV Bags", currentStock: 8, reorderThreshold: 25 },            // High
  { itemName: "Thermometers", currentStock: 30, reorderThreshold: 30 },      // Medium
  { itemName: "Bandages", currentStock: 80, reorderThreshold: 25 },          // Low
  { itemName: "Face Shields", currentStock: 12, reorderThreshold: 20 },      // Medium
  { itemName: "Hand Soap", currentStock: 5, reorderThreshold: 15 },          // High
  { itemName: "Cotton Rolls", currentStock: 60, reorderThreshold: 20 }       // Low
];

const mockInventory = rawInventory.map((item) => ({
  ...item,
  totalUsed: 0,
  consumptionRate: 0,
  riskLevel: calculateRiskLevel(item.currentStock, item.reorderThreshold)
}));

async function seedInventory() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    await Inventory.deleteMany({});
    console.log("Old inventory deleted");

    await Inventory.insertMany(mockInventory);
    console.log("Seed inventory inserted successfully");

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Seed error:", error);
  }
}

seedInventory();