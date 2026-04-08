const mongoose = require("mongoose");
require("dotenv").config();

const Inventory = require("./models/Inventory");
const UsageLog = require("./models/UsageLog");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/inventorydb";

const calculateRiskLevel = (stock, threshold) => {
  if (stock <= threshold * 0.5) return "High";
  if (stock <= threshold) return "Medium";
  return "Low";
};

const items = [
   // 🔴 HIGH RISK (stock <= 50% of threshold)
  { itemName: "Hospital Gowns", currentStock: 18, reorderThreshold: 40, totalUsed: 120 },
  { itemName: "Wheelchairs", currentStock: 7, reorderThreshold: 15, totalUsed: 35 },
  { itemName: "Oxygen Tanks", currentStock: 10, reorderThreshold: 25, totalUsed: 60 },
  { itemName: "Gloves (Heavy Duty)", currentStock: 18, reorderThreshold: 40, totalUsed: 85 },

  // 🟡 MEDIUM RISK (stock <= threshold)
  { itemName: "Latex Gloves", currentStock: 40, reorderThreshold: 50, totalUsed: 170 },
  { itemName: "IV Drips", currentStock: 35, reorderThreshold: 40, totalUsed: 110 },
  { itemName: "Syringes", currentStock: 50, reorderThreshold: 50, totalUsed: 100 },
  { itemName: "Face Towels", currentStock: 55, reorderThreshold: 60, totalUsed: 140 },
  { itemName: "Bandages", currentStock: 60, reorderThreshold: 60, totalUsed: 125 },

  // 🟢 LOW RISK (stock > threshold)
  { itemName: "Glass Bucket", currentStock: 120, reorderThreshold: 60, totalUsed: 430 },
  { itemName: "Surgical Masks", currentStock: 200, reorderThreshold: 80, totalUsed: 170 },
  { itemName: "Thermometers", currentStock: 60, reorderThreshold: 30, totalUsed: 95 },
  { itemName: "Hand Sanitizer", currentStock: 150, reorderThreshold: 70, totalUsed: 180 },
  { itemName: "Injection Kits", currentStock: 80, reorderThreshold: 50, totalUsed: 80 },
  { itemName: "Bedsheets", currentStock: 75, reorderThreshold: 40, totalUsed: 90 }
].map((item) => ({
  ...item,
  riskLevel: calculateRiskLevel(item.currentStock, item.reorderThreshold)
}));

const generateUsageLogs = (inventoryItems) => {
  const logs = [];

  inventoryItems.forEach((item) => {
    let remainingUsage = item.totalUsed || 0;
    const logCount = 8;

    for (let i = 0; i < logCount; i++) {
      let qty;

      if (i === logCount - 1) {
        qty = remainingUsage;
      } else {
        const average = Math.max(1, Math.floor(remainingUsage / (logCount - i)));
        qty = Math.max(1, Math.floor(Math.random() * average));
      }

      remainingUsage -= qty;

      logs.push({
        itemId: item._id,
        itemName: item.itemName,
        quantityUsed: qty,
        remainingStock: item.currentStock,
        riskLevel: item.riskLevel,
        usageDate: new Date(Date.now() - Math.random() * 1000000000)
      });
    }
  });

  return logs.filter((log) => log.quantityUsed > 0);
};

const seedData = async () => {
  try {
    console.log("Starting seed...");

    await Inventory.deleteMany({});
    console.log("Inventory cleared");

    await UsageLog.deleteMany({});
    console.log("Usage logs cleared");

    const insertedItems = await Inventory.insertMany(items);
    console.log("Items inserted");

    const logs = generateUsageLogs(insertedItems);
    await UsageLog.insertMany(logs);
    console.log("Logs inserted");

    console.log("🔥 Database seeded with realistic data!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB for seeding");
    return seedData();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });