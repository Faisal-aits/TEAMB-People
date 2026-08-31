const integrationModel = require('../features/integrations/integrationModel');
const sendResponse = require('../utils/response');

/**
 * API Key authentication middleware for external integrations.
 *
 * Looks for the key in:
 *   - Header:  X-API-KEY: <key>
 *   - Header:  Authorization: Apikey <key>
 *
 * On success, attaches to req:
 *   req.tenantId       — the tenant that owns the key
 *   req.integration    — { apiKeyId, apiKeyName }
 *   req.isIntegration  — true (used by controllers to distinguish external calls)
 */
const verifyApiKey = async (req, res, next) => {
  try {
    const rawKey =
      req.headers['x-api-key'] ||
      (req.headers.authorization?.startsWith('Apikey ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!rawKey) {
      return sendResponse(res, 401, false, 'API key is missing. Provide X-API-KEY header.', null);
    }

    const keyRecord = await integrationModel.findApiKey(rawKey);

    if (!keyRecord) {
      return sendResponse(res, 401, false, 'Invalid API key.', null);
    }

    if (keyRecord.status !== 'active') {
      return sendResponse(res, 403, false, 'This API key has been revoked.', null);
    }

    req.tenantId = keyRecord.tenant_id;
    req.integration = {
      apiKeyId: keyRecord.id,
      apiKeyName: keyRecord.name,
      projectId: keyRecord.project_id,
    };
    req.isIntegration = true;

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Flexible middleware that accepts EITHER a valid JWT (existing browser sessions)
 * OR a valid API Key (external application integrations).
 * Falls through to the next middleware/handler on success.
 */
const verifyTokenOrApiKey = (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const sendResp = require('../utils/response');

  const authHeader = req.headers.authorization;
  const hasJwt = authHeader && authHeader.startsWith('Bearer ');
  const hasApiKey =
    req.headers['x-api-key'] ||
    (authHeader && authHeader.startsWith('Apikey '));

  if (hasJwt) {
    // JWT path — mirrors auth.middleware.js verifyToken
    try {
      const token = authHeader.split(' ')[1];
      if (!process.env.JWT_SECRET) {
        return sendResp(res, 500, false, 'Server configuration error', null);
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const role = decoded.role || decoded.position || decoded.role_name;
      req.user = decoded;
      req.user.id = decoded.id || decoded.user_id;
      req.user.user_id = decoded.user_id || decoded.id;
      req.user.position = decoded.position || role;
      req.user.role = decoded.role || role;
      req.user.role_name = decoded.role_name || role;
      req.tenantId = decoded.tenant_id;
      req.isIntegration = false;
      return next();
    } catch {
      return sendResp(res, 401, false, 'Invalid or expired token', null);
    }
  }

  if (hasApiKey) {
    return verifyApiKey(req, res, next);
  }

  return sendResp(res, 401, false, 'Authentication required. Provide a Bearer JWT or X-API-KEY header.', null);
};

module.exports = { verifyApiKey, verifyTokenOrApiKey };
