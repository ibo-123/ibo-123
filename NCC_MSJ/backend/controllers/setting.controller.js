const Settings = require("../models/Settings.model");
const AuditLog = require("../models/AuditLog.model");

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private/Admin
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    // Remove sensitive information
    const safeSettings = settings.toObject();
    delete safeSettings.email?.auth?.pass;
    delete safeSettings.sms?.apiKey;

    res.status(200).json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings"
    });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    // Store old settings for audit
    const oldSettings = {
      siteName: settings.siteName,
      contactEmail: settings.contactEmail,
      maintenanceMode: settings.maintenanceMode?.enabled,
      allowRegistration: settings.users?.allowRegistration
    };

    // Update settings
    await settings.updateSettings(req.body, req.user.id);

    // Remove sensitive information from response
    const safeSettings = settings.toObject();
    delete safeSettings.email?.auth?.pass;
    delete safeSettings.sms?.apiKey;

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "config_change",
      resource: "Settings",
      resourceName: "System Settings",
      changes: {
        before: oldSettings,
        after: {
          siteName: settings.siteName,
          contactEmail: settings.contactEmail,
          maintenanceMode: settings.maintenanceMode?.enabled,
          allowRegistration: settings.users?.allowRegistration
        },
        fields: Object.keys(req.body)
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: safeSettings
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update settings"
    });
  }
};

// @desc    Get specific setting
// @route   GET /api/settings/:path
// @access  Private/Admin
exports.getSetting = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const value = settings.get(req.params.path);

    if (value === undefined) {
      return res.status(404).json({
        success: false,
        message: "Setting not found"
      });
    }

    // Check for sensitive settings
    const sensitivePaths = ["email.auth.pass", "sms.apiKey"];
    if (sensitivePaths.includes(req.params.path)) {
      return res.status(403).json({
        success: false,
        message: "Access to this setting is restricted"
      });
    }

    res.status(200).json({
      success: true,
      data: { [req.params.path]: value }
    });
  } catch (error) {
    console.error("Get setting error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch setting"
    });
  }
};

// @desc    Update specific setting
// @route   PATCH /api/settings/:path
// @access  Private/Admin
exports.updateSetting = async (req, res) => {
  try {
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: "Value is required"
      });
    }

    const settings = await Settings.getSettings();

    // Get old value for audit
    const oldValue = settings.get(req.params.path);

    // Update setting
    settings.set(req.params.path, value);
    await settings.save();

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "config_change",
      resource: "Settings",
      resourceName: req.params.path,
      changes: {
        before: { [req.params.path]: oldValue },
        after: { [req.params.path]: value },
        fields: [req.params.path]
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Setting updated successfully",
      data: { [req.params.path]: value }
    });
  } catch (error) {
    console.error("Update setting error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update setting"
    });
  }
};

// @desc    Toggle maintenance mode
// @route   POST /api/settings/maintenance/toggle
// @access  Private/Admin
exports.toggleMaintenance = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const currentMode = settings.maintenanceMode?.enabled || false;

    await settings.updateSettings({
      maintenanceMode: {
        ...settings.maintenanceMode,
        enabled: !currentMode,
        message: req.body.message || settings.maintenanceMode?.message
      }
    }, req.user.id);

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "config_change",
      resource: "Settings",
      resourceName: "Maintenance Mode",
      changes: {
        before: { enabled: currentMode },
        after: { enabled: !currentMode }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: `Maintenance mode ${!currentMode ? 'enabled' : 'disabled'}`,
      data: {
        maintenanceMode: !currentMode
      }
    });
  } catch (error) {
    console.error("Toggle maintenance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle maintenance mode"
    });
  }
};

// @desc    Reset settings to defaults
// @route   POST /api/settings/reset
// @access  Private/Admin
exports.resetSettings = async (req, res) => {
  try {
    if (!req.body.confirm) {
      return res.status(400).json({
        success: false,
        message: "Confirmation required. Send { confirm: true } in request body."
      });
    }

    // Delete existing settings
    await Settings.deleteMany({});

    // Create new default settings
    const settings = await Settings.create({});

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "config_change",
      resource: "Settings",
      resourceName: "All Settings",
      changes: {
        after: { reset: true }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Settings reset to defaults",
      data: settings
    });
  } catch (error) {
    console.error("Reset settings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset settings"
    });
  }
};