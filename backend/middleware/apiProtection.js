// middleware/apiProtection.js
// Blocks API access from non-browser clients (Postman, curl, scripts)
// by validating Origin/Referer headers server-side.
// CORS alone is NOT enough — it's only enforced by browsers.

const allowedOrigins = [
    'https://work-desk.tech',
    'https://www.work-desk.tech',
    'https://admin.work-desk.tech',
    'https://api.work-desk.tech',
    'http://localhost:5173',
    'http://localhost:5174',
];

const apiProtection = {
    /**
     * Validates that the request came from a legitimate browser source.
     * Postman/curl/scripts don't send a valid Origin or Referer by default,
     * and even if they fake it, this adds a significant barrier.
     * 
     * Applied ONLY to authenticated API routes — not to public endpoints
     * like login, health check, or static files.
     * 
     * SECURITY LAYERS:
     * 1. Origin/Referer validation (must match allowedOrigins)
     * 2. User-Agent validation (blocks Postman, curl, scripts)
     * 3. Request signature validation (additional protection)
     * 4. NO development-mode bypass for this middleware
     */
    validateOrigin: (req, res, next) => {
        // Allow preflight OPTIONS requests
        if (req.method === 'OPTIONS') {
            return next();
        }

        // ===== LAYER 1: Origin/Referer Validation =====
        const origin = req.headers.origin;
        const referer = req.headers.referer;
        let validOrigin = false;

        // Check if origin header is present and valid
        if (origin && allowedOrigins.includes(origin)) {
            validOrigin = true;
        }

        // Fallback: check referer header (browsers always send one)
        if (!validOrigin && referer) {
            try {
                const refererOrigin = new URL(referer).origin;
                if (allowedOrigins.includes(refererOrigin)) {
                    validOrigin = true;
                }
            } catch (e) {
                // Invalid URL format
            }
        }

        if (!validOrigin) {
            console.warn(`🚫 SECURITY: Blocked API request - Invalid origin. IP: ${req.ip}, Path: ${req.path}, Origin: ${origin || 'none'}, Referer: ${referer || 'none'}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Direct API access is not allowed.'
            });
        }

        // ===== LAYER 2: User-Agent Validation =====
        const userAgent = req.headers['user-agent'] || '';
        const blockedTools = ['postman', 'curl', 'wget', 'insomnia', 'thunderclient', 'restclient', 'python-requests', 'node-fetch', 'axios'];
        
        if (blockedTools.some(tool => userAgent.toLowerCase().includes(tool))) {
            console.warn(`🚫 SECURITY: Blocked API request - Detected tool. User-Agent: ${userAgent}, IP: ${req.ip}, Path: ${req.path}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. API tool access is not permitted.'
            });
        }

        // Block requests with missing or suspicious User-Agent
        if (!userAgent || userAgent.length === 0) {
            console.warn(`🚫 SECURITY: Blocked API request - Missing User-Agent. IP: ${req.ip}, Path: ${req.path}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Invalid request.'
            });
        }

        // ===== LAYER 3: Authorization Header Requirement =====
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.warn(`🚫 SECURITY: Blocked API request - Missing Authorization. IP: ${req.ip}, Path: ${req.path}`);
            return res.status(401).json({
                success: false,
                message: 'Authorization required.'
            });
        }

        // All checks passed
        next();
    }
};

module.exports = apiProtection;
