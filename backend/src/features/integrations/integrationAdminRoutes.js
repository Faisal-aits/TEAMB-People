const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const sendResponse = require('../../utils/response');
const integrationModel = require('../integrations/integrationModel');
const { verifyToken } = require('../../middleware/auth.middleware');

// All admin key management routes require JWT (admin only)
router.use(verifyToken);

const requireAdmin = (req, res, next) => {
  const role = req.user?.position || req.user?.role || req.user?.role_name;
  if (role !== 'admin') {
    return sendResponse(res, 403, false, 'Administrator access required.', null);
  }
  return next();
};

// Generate a new API key for the tenant
router.post('/keys', requireAdmin, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return sendResponse(res, 400, false, 'API key name is required.', null);
    }
    const apiKey = `wdk_${crypto.randomBytes(32).toString('hex')}`;
    const keyId = await integrationModel.createApiKey(req.tenantId, String(name).trim(), apiKey);
    return sendResponse(res, 201, true, 'API key created successfully', {
      id: keyId,
      name: String(name).trim(),
      api_key: apiKey, // Only shown once — store it securely
      note: 'This key will not be shown again. Store it securely.',
    });
  } catch (error) {
    return next(error);
  }
});

// List all API keys for the tenant (values are hidden)
router.get('/keys', requireAdmin, async (req, res, next) => {
  try {
    const keys = await integrationModel.listApiKeys(req.tenantId);
    return sendResponse(res, 200, true, 'API keys retrieved successfully', keys);
  } catch (error) {
    return next(error);
  }
});

// Revoke an API key
router.delete('/keys/:id', requireAdmin, async (req, res, next) => {
  try {
    const keyId = Number(req.params.id);
    if (!keyId) {
      return sendResponse(res, 400, false, 'Invalid key ID.', null);
    }
    const revoked = await integrationModel.revokeApiKey(req.tenantId, keyId);
    if (!revoked) {
      return sendResponse(res, 404, false, 'API key not found or already revoked.', null);
    }
    return sendResponse(res, 200, true, 'API key revoked successfully.', null);
  } catch (error) {
    return next(error);
  }
});

// Get audit logs for the tenant
router.get('/audit-logs', requireAdmin, async (req, res, next) => {
  try {
    const { api_key_id, limit } = req.query;
    const logs = await integrationModel.getAuditLogs(req.tenantId, {
      apiKeyId: api_key_id ? Number(api_key_id) : undefined,
      limit: limit ? Math.min(Number(limit), 500) : 100,
    });
    return sendResponse(res, 200, true, 'Audit logs retrieved successfully', logs);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
