// routes/transactions.js
// Task 2: only the customer-side create-payment endpoint.
// Task 3 will add GET list, PATCH verify and POST submit-to-SWIFT (employee-only).

const express = require('express');
const router = express.Router();

const { create, listMine } = require('../controllers/transactionController');
const { validateBody } = require('../middleware/validation');
const { requireCustomer } = require('../middleware/auth');

// GET /api/transactions/mine — list only the logged-in customer's transactions
// SECURITY: requireCustomer enforces a valid JWT cookie; controller scopes by customerId from the token.
router.get('/mine', requireCustomer, listMine);

// POST /api/transactions — customer pays
router.post(
  '/',
  requireCustomer,
  validateBody(['amount', 'currency', 'provider', 'payeeAccount', 'swiftCode']),
  create
);

module.exports = router;
