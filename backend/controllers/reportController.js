const Inventory = require("../models/Inventory");
const UsageLog = require("../models/UsageLog");

/**
 * Builds the inventory summary payload used by reporting dashboards.
 * Supports optional YYYY-MM-DD date range filtering for usage metrics.
 */
const getInventorySummaryReport = async (req, res) => {
  try {
    const reportType = String(req.query.reportType || "stock-levels");
    const startDate = String(req.query.startDate || "").trim();
    const endDate = String(req.query.endDate || "").trim();

    const usageMatch = {};
    if (/^\d{4}-\d{2}-\d{2}$/.test(startDate) || /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      usageMatch.usageDate = {};
      if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        usageMatch.usageDate.$gte = startDate;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        usageMatch.usageDate.$lte = endDate;
      }
    }

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
      ...(Object.keys(usageMatch).length > 0 ? [{ $match: usageMatch }] : []),
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
      ...(Object.keys(usageMatch).length > 0 ? [{ $match: usageMatch }] : []),
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

    const usageEntries = await UsageLog.find(usageMatch)
      .select("itemName quantityUsed usageDate")
      .sort({ usageDate: -1, createdAt: -1 })
      .lean();

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
      reportType,
      appliedDateRange: {
        startDate: /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : null,
        endDate: /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : null
      },
      totalItems,
      totalStockRemaining,
      lowStockItems,
      highRiskItems,
      totalUnitsUsed,
      usageTrends: usageTrends.map((item) => ({
        name: item._id,
        totalUsed: item.totalUsed
      })),
      usageEntries,
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