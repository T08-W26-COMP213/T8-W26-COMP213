const Inventory = require("../models/Inventory");
const UsageLog = require("../models/UsageLog");

const getInventorySummaryReport = async (req, res) => {
  try {
    const totalItems = await Inventory.countDocuments();
    const inventoryItems = await Inventory.find();

    const totalStockRemaining = inventoryItems.reduce(
      (sum, item) => sum + (item.currentStock || 0),
      0
    );

    const lowStockItems = inventoryItems.filter(
      (item) => item.currentStock <= item.reorderThreshold
    ).length;

    const highRiskItems = inventoryItems.filter(
      (item) => item.riskLevel === "High"
    ).length;

    const totalUnitsUsedAgg = await UsageLog.aggregate([
      {
        $group: {
          _id: null,
          totalUnitsUsed: { $sum: "$quantityUsed" }
        }
      }
    ]);

    const totalUnitsUsed =
      totalUnitsUsedAgg.length > 0 ? totalUnitsUsedAgg[0].totalUnitsUsed : 0;

    const usageTrends = await UsageLog.aggregate([
      {
        $group: {
          _id: "$itemName",
          totalUsed: { $sum: "$quantityUsed" }
        }
      },
      {
        $sort: { totalUsed: -1 }
      }
    ]);

    const riskDistributionAgg = await Inventory.aggregate([
      {
        $group: {
          _id: "$riskLevel",
          value: { $sum: 1 }
        }
      }
    ]);

    const riskLevels = ["High", "Medium", "Low"];
    const riskDistribution = riskLevels.map((level) => {
      const found = riskDistributionAgg.find((item) => item._id === level);
      return {
        name: level,
        value: found ? found.value : 0
      };
    });

    const itemDetails = inventoryItems.map((item) => ({
      _id: item._id,
      itemName: item.itemName,
      currentStock: item.currentStock,
      reorderThreshold: item.reorderThreshold,
      totalUsed: item.totalUsed || 0,
      riskLevel: item.riskLevel
    }));

    res.status(200).json({
      totalItems,
      totalStockRemaining,
      lowStockItems,
      highRiskItems,
      totalUnitsUsed,
      usageTrends: usageTrends.map((item) => ({
        name: item._id,
        totalUsed: item.totalUsed
      })),
      riskDistribution,
      itemDetails
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate inventory summary report",
      error: error.message
    });
  }
};

module.exports = { getInventorySummaryReport };