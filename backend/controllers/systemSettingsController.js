const SystemSettings = require("../models/SystemSettings");

// GET settings
const getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    // If no settings exist → create default
    if (!settings) {
      settings = new SystemSettings();
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch system settings",
      error: error.message
    });
  }
};

// UPDATE settings
const updateSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = new SystemSettings();
    }

    const {
      systemName,
      defaultReorderThreshold,
      enableAlerts,
      maintenanceMode
    } = req.body;

    if (systemName !== undefined) settings.systemName = systemName;
    if (defaultReorderThreshold !== undefined)
      settings.defaultReorderThreshold = Number(defaultReorderThreshold);
    if (enableAlerts !== undefined) settings.enableAlerts = enableAlerts;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;

    const updated = await settings.save();

    res.json({
      message: "System settings updated successfully",
      settings: updated
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update system settings",
      error: error.message
    });
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings
};