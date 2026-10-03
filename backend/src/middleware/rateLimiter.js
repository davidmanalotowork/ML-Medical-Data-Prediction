import { rateLimitHelpers } from '../config/upstash.js';

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests from this IP, please try again later.',
    keyGenerator = (req) => req.ip,
    skip = () => false,
    onLimitReached = null
  } = options;

  return async (req, res, next) => {
    try {
      if (skip(req)) {
        return next();
      }

      const key = `rate_limit:${keyGenerator(req)}`;
      const ttl = Math.ceil(windowMs / 1000);

      const currentCount = await rateLimitHelpers.incrementCount(key, ttl);

      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - currentCount),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
      });

      if (currentCount > max) {
        const timeToReset = await rateLimitHelpers.getTimeToLive(key);

        res.set({
          'X-RateLimit-Remaining': 0,
          'Retry-After': Math.max(0, timeToReset)
        });

        if (onLimitReached) {
          onLimitReached(req, res);
        }

        return res.status(429).json({
          success: false,
          message,
          retryAfter: timeToReset
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next();
    }
  };
};

export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please slow down.'
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  keyGenerator: (req) => `auth:${req.ip}:${req.body.email || 'unknown'}`,
  onLimitReached: (req, res) => {
    console.warn(`Rate limit exceeded for auth attempt from IP: ${req.ip}, Email: ${req.body.email}`);
  }
});

export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many API requests, please try again later.'
});

export const strictLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Rate limit exceeded for sensitive operation.',
  keyGenerator: (req) => `strict:${req.ip}:${req.user?.id || 'anonymous'}`
});

export const customRateLimiter = (windowMs, max, message) => {
  return createRateLimiter({ windowMs, max, message });
};

export default {
  createRateLimiter,
  generalLimiter,
  authLimiter,
  apiLimiter,
  strictLimiter,
  customRateLimiter
};
