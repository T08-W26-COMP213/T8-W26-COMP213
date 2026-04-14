const express = require("express");
const {
  getInventorySummaryReport,
  getConsumptionAnalytics
} = require("../controllers/reportController");

const router = express.Router();

router.get("/inventory-summary", getInventorySummaryReport);
router.get("/consumption-analytics", getConsumptionAnalytics);

module.exports = router;