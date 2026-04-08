const express = require("express");
const { getInventorySummaryReport } = require("../controllers/reportController");

const router = express.Router();

router.get("/inventory-summary", getInventorySummaryReport);

module.exports = router;