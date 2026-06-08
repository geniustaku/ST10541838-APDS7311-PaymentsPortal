const rateLimit = require('express-rate-limit');

const isProd = process.env.NODE_ENV === 'production';

// Auth routes: strict in production to stop credential-stuffing and password spraying.
// Relaxed in development so hot-reload and double-StrictMode fetches do not lock the developer out.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 5 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip the lightweight session-check endpoint so it does not consume a slot.
  skip: (req) => req.path === '/me',
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

// Payment creation: 10 per hour per IP in prod, generous in dev for the same reason.
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 10 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Payment rate limit exceeded. Please try again later.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

module.exports = { authLimiter, paymentLimiter, generalLimiter };
