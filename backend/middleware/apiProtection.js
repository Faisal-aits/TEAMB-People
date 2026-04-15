// middleware/apiProtection.js
// Blocks API access from non-browser clients (Postman, curl, scripts)
// by validating Origin/Referer headers server-side.
// CORS alone is NOT enough — it's only enforced by browsers.

const allowedOrigins = [
    'https://work-desk.tech',
    'https://www.work-desk.tech',
    'https://admin.work-desk.tech',
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
     */
    validateOrigin: (req, res, next) => {
        // Skip origin check in development mode for easier local testing
        if (process.env.NODE_ENV === 'development') {
            return next();
        }

        // Allow preflight OPTIONS requests
        if (req.method === 'OPTIONS') {
            return next();
        }

        const origin = req.headers.origin;
        const referer = req.headers.referer;

        // Check if origin header is present and valid
        if (origin && allowedOrigins.includes(origin)) {
            return next();
        }

        // Fallback: check referer header (browsers always send one of these)
        if (referer) {
            const refererOrigin = new URL(referer).origin;
            if (allowedOrigins.includes(refererOrigin)) {
                return next();
            }
        }

        // No valid origin or referer — block the request
        console.warn(`🚫 Blocked API request from unauthorized source. IP: ${req.ip}, Path: ${req.path}, Origin: ${origin || 'none'}, Referer: ${referer || 'none'}`);
        return res.status(403).json({
            success: false,
            message: 'Access denied. Direct API access is not allowed.'
        });
    }
};

module.exports = apiProtection;
