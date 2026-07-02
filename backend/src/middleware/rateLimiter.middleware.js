/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Keyed by api_key_id (for integration requests) or user_id (for JWT requests).
 * Default: 100 requests per 15-minute window per key.
 *
 * For production deployments with multiple Node.js processes, replace the
 * in-memory store with a Redis-backed implementation (e.g. ioredis + sliding
 * log pattern) to share state across instances.
 */

const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_REQUESTS = 100;

// store: Map<string, number[]> — key -> array of timestamps
const store = new Map();

/**
 * Prune timestamps outside the current window for a given key.
 */
const prune = (timestamps, windowStart) =>
  timestamps.filter((ts) => ts > windowStart);

/**
 * Factory: returns an Express middleware with the given limits.
 * @param {object} options
 * @param {number} options.windowMs   — Rolling window size in ms (default 15 min)
 * @param {number} options.maxRequests — Max requests allowed per window (default 100)
 * @param {string} options.message    — Error message when rate limit is exceeded
 */
const createRateLimiter = ({
  windowMs = DEFAULT_WINDOW_MS,
  maxRequests = DEFAULT_MAX_REQUESTS,
  message = 'Too many requests. Please slow down and try again later.',
} = {}) => {
  return (req, res, next) => {
    // Only rate-limit integration (API Key) requests
    if (!req.isIntegration) {
      return next();
    }

    const key = `apikey:${req.integration?.apiKeyId}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = prune(store.get(key) || [], windowStart);

    if (timestamps.length >= maxRequests) {
      const retryAfterSec = Math.ceil(windowMs / 1000);
      res.set('Retry-After', String(retryAfterSec));
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', '0');
      return res.status(429).json({
        success: false,
        message,
        data: {
          limit: maxRequests,
          windowMs,
          retryAfterSeconds: retryAfterSec,
        },
      });
    }

    timestamps.push(now);
    store.set(key, timestamps);

    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(maxRequests - timestamps.length));

    return next();
  };
};

/** Default limiter: 100 req / 15 min per API key */
const defaultRateLimiter = createRateLimiter();

module.exports = { createRateLimiter, defaultRateLimiter };
