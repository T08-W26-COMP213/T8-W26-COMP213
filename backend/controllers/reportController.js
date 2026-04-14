const Inventory = require("../models/Inventory");
const UsageLog = require("../models/UsageLog");

const getInventorySummaryReport = async (req, res) => {
  try {
    const inventory = await Inventory.find();

    const summary = inventory.map((item) => ({
      itemId: item._id,
      itemName: item.itemName,
      currentStock: item.currentStock,
      reorderThreshold: item.reorderThreshold,
      totalUsed: item.totalUsed || 0,
      consumptionRate: item.consumptionRate || 0,
      riskLevel: item.riskLevel
    }));

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch inventory summary report",
      error: error.message
    });
  }
};

const getConsumptionAnalytics = async (req, res) => {
  try {
    const inventoryItems = await Inventory.find();
    const usageLogs = await UsageLog.find().sort({ usageDate: 1 });

    const analytics = inventoryItems.map((item) => {
      const itemLogs = usageLogs.filter(
        (log) => String(log.itemId) === String(item._id)
      );

      const totalUsed = itemLogs.reduce(
        (sum, log) => sum + (log.quantityUsed || 0),
        0
      );

      let averageDailyConsumption = 0;
      let estimatedDaysUntilDepletion = null;

      if (itemLogs.length > 0) {
        const firstDate = new Date(itemLogs[0].usageDate);
        const lastDate = new Date(itemLogs[itemLogs.length - 1].usageDate);

        const diffTime = lastDate - firstDate;
        const diffDays = Math.max(
          1,
          Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        );

        averageDailyConsumption = totalUsed / diffDays;

        if (averageDailyConsumption > 0) {
          estimatedDaysUntilDepletion = Number(
            (item.currentStock / averageDailyConsumption).toFixed(2)
          );
        }
      }

      let depletionStatus = "Monitor";

      if (estimatedDaysUntilDepletion !== null) {
        if (estimatedDaysUntilDepletion <= 3) {
          depletionStatus = "Critical";
        } else if (estimatedDaysUntilDepletion <= 7) {
          depletionStatus = "Warning";
        }
      }

      return {
        itemId: item._id,
        itemName: item.itemName,
        currentStock: item.currentStock,
        reorderThreshold: item.reorderThreshold,
        totalUsed,
        averageDailyConsumption: Number(averageDailyConsumption.toFixed(2)),
        estimatedDaysUntilDepletion,
        depletionStatus
      };
    });

    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({
      message: "Failed to calculate consumption analytics",
      error: error.message
    });
  }
};

module.exports = {
  getInventorySummaryReport,
  getConsumptionAnalytics
};