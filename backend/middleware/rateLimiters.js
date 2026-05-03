// middleware/rateLimiters.js
// SECURITY: defends against brute-force (login guessing) and DDoS (request flooding).
// Each limiter uses a different window + max depending on the sensitivity of the endpoint.

const rateLimit = require('express-rate-limit');

// Auth routes: 5 attempts per 15 minutes per IP. Stops credential-stuffing and password spraying.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

// Payment creation: 10 per hour per IP. Enough for normal use, blocks automated abuse.
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Payment rate limit exceeded. Please try again later.' }
});

// General: 100 requests per 15 minutes for all other routes — DDoS shield.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

module.exports = { authLimiter, paymentLimiter, generalLimiter };
