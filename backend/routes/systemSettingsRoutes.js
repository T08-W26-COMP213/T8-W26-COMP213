const express = require("express");
const {
  getSystemSettings,
  updateSystemSettings
} = require("../controllers/systemSettingsController");

const router = express.Router();

router.get("/", getSystemSettings);
router.put("/", updateSystemSettings);

module.exports = router;