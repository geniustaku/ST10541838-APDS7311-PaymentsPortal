const express = require('express');
const router = express.Router();

const { register, login, employeeLogin, logout, me } = require('../controllers/authController');
const { validateBody, patterns } = require('../middleware/validation');
const { requireAnyAuth } = require('../middleware/auth');

router.post(
  '/register',
  validateBody(['fullName', 'idNumber', 'accountNumber', 'password']),
  register
);

router.post(
  '/login',
  validateBody(['accountNumber', 'password']),
  login
);

// Employee login: pre-registered usernames only, no registration endpoint exposes Employees.
router.post(
  '/employee/login',
  validateBody(['username', 'password']),
  employeeLogin
);

router.post('/logout', logout);

router.get('/me', requireAnyAuth, me);

module.exports = router;
