// routes/auth.js
// Customer authentication routes. Rate-limited at the router level via authLimiter.

const express = require('express');
const router = express.Router();

const { register, login, logout, me } = require('../controllers/authController');
const { validateBody } = require('../middleware/validation');
const { requireCustomer } = require('../middleware/auth');

// POST /api/auth/register — creates a new customer
router.post(
  '/register',
  validateBody(['fullName', 'idNumber', 'accountNumber', 'password']),
  register
);

// POST /api/auth/login — account number + password → HttpOnly cookie
router.post(
  '/login',
  validateBody(['accountNumber', 'password']),
  login
);

// POST /api/auth/logout — clears the cookie
router.post('/logout', logout);

// GET /api/auth/me — returns the logged-in customer; used by the SPA to check session
router.get('/me', requireCustomer, me);

module.exports = router;
