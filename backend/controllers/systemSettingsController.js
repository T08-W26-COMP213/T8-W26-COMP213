const SystemSettings = require("../models/SystemSettings");

// GET settings
const getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

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
      organizationName,
      timezone,
      language,
      lowStockThreshold,
      criticalStockThreshold,
      autoRiskCalculation,
      emailAlerts,
      lowStockAlerts,
      criticalAlerts,
      sessionTimeout,
      roleBasedAccess,
      auditLogging,
      darkMode,
      refreshInterval
    } = req.body;

    if (systemName !== undefined) settings.systemName = systemName;
    if (organizationName !== undefined) settings.organizationName = organizationName;
    if (timezone !== undefined) settings.timezone = timezone;
    if (language !== undefined) settings.language = language;

    if (lowStockThreshold !== undefined) {
      settings.lowStockThreshold = Number(lowStockThreshold);
    }

    if (criticalStockThreshold !== undefined) {
      settings.criticalStockThreshold = Number(criticalStockThreshold);
    }

    if (autoRiskCalculation !== undefined) {
      settings.autoRiskCalculation = autoRiskCalculation;
    }

    if (emailAlerts !== undefined) settings.emailAlerts = emailAlerts;
    if (lowStockAlerts !== undefined) settings.lowStockAlerts = lowStockAlerts;
    if (criticalAlerts !== undefined) settings.criticalAlerts = criticalAlerts;

    if (sessionTimeout !== undefined) {
      settings.sessionTimeout = Number(sessionTimeout);
    }

    if (roleBasedAccess !== undefined) settings.roleBasedAccess = roleBasedAccess;
    if (auditLogging !== undefined) settings.auditLogging = auditLogging;
    if (darkMode !== undefined) settings.darkMode = darkMode;

    if (refreshInterval !== undefined) {
      settings.refreshInterval = Number(refreshInterval);
    }

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