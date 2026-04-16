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

// Public auth paths that don't need origin validation.
// These are safe to exempt because:
//   - /auth/login requires valid credentials (no data leak)
//   - /auth/forgot-password just sends an email
//   - /auth/reset-password requires a valid reset token
//   - /auth/tenant/ returns only minimal public tenant info (name, logo)
const publicPaths = [
    '/auth/login',
    '/auth/forgot-password',
    '/auth/reset-password/',
    '/auth/tenant/',
];

const apiProtection = {
    /**
     * Validates that the request came from a legitimate browser source.
     *
     * - Public auth endpoints (login, forgot-password): ALLOWED for everyone
     *   (they don't return sensitive data, and users need them to authenticate)
     *
     * - All other endpoints (employees, salary, etc.): BLOCKED unless the
     *   request has a valid Origin or Referer header from an allowed domain.
     *   Postman/curl don't send these → BLOCKED even with a valid JWT.
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

        // Allow public auth endpoints (login, forgot-password, etc.)
        // These don't expose sensitive data — they require valid credentials/tokens.
        const isPublicPath = publicPaths.some(p => req.path.startsWith(p));
        if (isPublicPath) {
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
            try {
                const refererOrigin = new URL(referer).origin;
                if (allowedOrigins.includes(refererOrigin)) {
                    return next();
                }
            } catch (e) {
                // Invalid referer URL, fall through to block
            }
        }

        // No valid origin or referer — block the request
        const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';
        console.warn(`🚫 SECURITY: Blocked API request. IP: ${clientIP}, Path: ${req.path}, Origin: ${origin || 'none'}, Referer: ${referer || 'none'}`);
        return res.status(403).json({
            success: false,
            message: 'Access denied. Direct API access is not allowed.'
        });
    }
};

module.exports = apiProtection;
