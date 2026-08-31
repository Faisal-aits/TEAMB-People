// backend/src/features/settings/settingsController.js
const Settings = require('./settingsModel');

const settingsController = {
  getAll: async (req, res) => {
    try {
      const settings = await Settings.getAll(req.tenantId);
      res.json({ success: true, settings });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ message: 'Failed to get settings' });
    }
  },

  get: async (req, res) => {
    try {
      const defaults = { enable_probation: 'true' };
      const value = await Settings.get(req.tenantId, req.params.key);
      res.json({ success: true, key: req.params.key, value: value ?? defaults[req.params.key] ?? null });
    } catch (error) {
      console.error('Get setting error:', error);
      res.status(500).json({ message: 'Failed to get setting' });
    }
  },

  set: async (req, res) => {
    try {
      const { value } = req.body;
      if (value === undefined || value === null) {
        return res.status(400).json({ message: 'value is required' });
      }
      await Settings.set(req.tenantId, req.params.key, value);
      res.json({ success: true, message: 'Setting updated' });
    } catch (error) {
      console.error('Set setting error:', error);
      res.status(500).json({ message: 'Failed to update setting' });
    }
  },

  setMany: async (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ message: 'settings object is required' });
      }
      for (const [key, value] of Object.entries(settings)) {
        await Settings.set(req.tenantId, key, value);
      }
      res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
      console.error('Set many settings error:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  }
};

module.exports = settingsController;
