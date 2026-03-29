const mongoose = require("mongoose");
require("dotenv").config();

const Inventory = require("./models/Inventory");

function calculateRiskLevel(stock, threshold) {
  if (stock <= threshold * 0.5) return "High";
  if (stock <= threshold) return "Medium";
  return "Low";
}

const rawInventory = [
  // 🟢 LOW RISK (8 items)
  { itemName: "Surgical Masks", currentStock: 120, reorderThreshold: 50 },
  { itemName: "Bandages", currentStock: 80, reorderThreshold: 25 },
  { itemName: "Cotton Rolls", currentStock: 60, reorderThreshold: 20 },
  { itemName: "Antibiotic Kits", currentStock: 75, reorderThreshold: 50 },
  { itemName: "Face Towels", currentStock: 90, reorderThreshold: 30 },
  { itemName: "Glucose Test Strips", currentStock: 150, reorderThreshold: 60 },
  { itemName: "Medical Tape", currentStock: 95, reorderThreshold: 35 },
  { itemName: "Sterile Gauze Pads", currentStock: 110, reorderThreshold: 45 },

  // 🟡 MEDIUM RISK (5 items)
  { itemName: "Latex Gloves", currentStock: 40, reorderThreshold: 50 },
  { itemName: "Thermometers", currentStock: 30, reorderThreshold: 30 },
  { itemName: "Face Shields", currentStock: 12, reorderThreshold: 20 },
  { itemName: "Glucose Drips", currentStock: 22, reorderThreshold: 40 },
  { itemName: "Saline Solution", currentStock: 18, reorderThreshold: 30 },

  // 🔴 HIGH RISK (3 items)
  { itemName: "Sanitizer Bottles", currentStock: 15, reorderThreshold: 40 },
  { itemName: "IV Bags", currentStock: 8, reorderThreshold: 25 },
  { itemName: "Emergency Kits", currentStock: 3, reorderThreshold: 15 }
];

const mockInventory = rawInventory.map((item) => ({
  ...item,

  // 🔹 Random usage data
  totalUsed: Math.floor(Math.random() * 100),       // 0–99
  consumptionRate: Math.floor(Math.random() * 10),  // 0–9

  // 🔹 Risk calculation
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