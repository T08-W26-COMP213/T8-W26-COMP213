const SystemSettings = require("../models/SystemSettings");
const { refreshAllInventoryRiskLevels } = require("../utils/inventoryRisk");

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
      refreshInterval,
      riskSettings
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

    // NEW: risk percentage settings
    if (riskSettings !== undefined) {
      const currentHigh = settings.riskSettings?.highRiskPercentage ?? 50;
      const currentMedium = settings.riskSettings?.mediumRiskPercentage ?? 100;

      const highRiskPercentage =
        riskSettings.highRiskPercentage !== undefined
          ? Number(riskSettings.highRiskPercentage)
          : currentHigh;

      const mediumRiskPercentage =
        riskSettings.mediumRiskPercentage !== undefined
          ? Number(riskSettings.mediumRiskPercentage)
          : currentMedium;

      if (
        isNaN(highRiskPercentage) ||
        isNaN(mediumRiskPercentage) ||
        highRiskPercentage <= 0 ||
        mediumRiskPercentage <= 0
      ) {
        return res.status(400).json({
          message: "Risk percentages must be valid positive numbers"
        });
      }

      if (highRiskPercentage >= mediumRiskPercentage) {
        return res.status(400).json({
          message: "High risk percentage must be less than medium risk percentage"
        });
      }

      settings.riskSettings = {
        highRiskPercentage,
        mediumRiskPercentage
      };
    }

    const updated = await settings.save();

    if (riskSettings !== undefined) {
      await refreshAllInventoryRiskLevels();
    }

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