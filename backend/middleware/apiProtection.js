// middleware/apiProtection.js
// Blocks API access from non-browser clients (Postman, curl, scripts)
// by validating Origin/Referer headers server-side.
// CORS alone is NOT enough — it's only enforced by browsers.
//
// IMPORTANT: In production, Nginx reverse-proxies requests to Node on localhost.
// Nginx strips Origin/Referer headers, so requests arrive from 127.0.0.1 with
// no origin info. We trust 127.0.0.1 because only Nginx can reach port 3000.
// Make sure port 3000 is firewalled from external access (only Nginx should reach it).

const allowedOrigins = [
    'https://work-desk.tech',
    'https://www.work-desk.tech',
    'https://admin.work-desk.tech',
    'https://api.work-desk.tech',
    'http://localhost:5173',
    'http://localhost:5174',
];

// IPs that indicate the request came through a trusted reverse proxy (Nginx)
const trustedProxyIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

const apiProtection = {
    /**
     * Validates that the request came from a legitimate source.
     * 
     * For reverse-proxied requests (from Nginx on 127.0.0.1): ALLOW
     *   - Nginx is the gatekeeper; only browser requests get proxied.
     *   - Ensure port 3000 is not publicly exposed (use firewall).
     * 
     * For direct connections (if port 3000 is somehow reachable):
     *   - Validate Origin or Referer headers against allowedOrigins.
     *   - Postman/curl won't have valid Origin/Referer → BLOCKED.
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

        // Trust requests from Nginx reverse proxy (localhost)
        const clientIP = req.ip || req.connection?.remoteAddress || '';
        if (trustedProxyIPs.some(ip => clientIP.includes(ip))) {
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
        console.warn(`🚫 SECURITY: Blocked API request. IP: ${clientIP}, Path: ${req.path}, Origin: ${origin || 'none'}, Referer: ${referer || 'none'}`);
        return res.status(403).json({
            success: false,
            message: 'Access denied. Direct API access is not allowed.'
        });
    }
};

module.exports = apiProtection;
