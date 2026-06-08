const express = require('express');
const router = express.Router();

const {
  create,
  listMine,
  listForEmployee,
  verify,
  submitToSwift,
  recentAudit,
  listCustomers,
  getCustomer,
  listEmployees
} = require('../controllers/transactionController');
const { validateBody } = require('../middleware/validation');
const { requireCustomer, requireEmployee } = require('../middleware/auth');

// Customer routes
router.get('/mine', requireCustomer, listMine);
router.post(
  '/',
  requireCustomer,
  validateBody(['amount', 'currency', 'provider', 'payeeAccount', 'swiftCode']),
  create
);

// Employee transaction routes
router.get('/', requireEmployee, listForEmployee);
router.patch('/:id/verify', requireEmployee, verify);
router.post('/submit', requireEmployee, submitToSwift);
router.get('/audit/recent', requireEmployee, recentAudit);

// Employee operations routes
router.get('/customers',     requireEmployee, listCustomers);
router.get('/customers/:id', requireEmployee, getCustomer);
router.get('/employees',     requireEmployee, listEmployees);

module.exports = router;
