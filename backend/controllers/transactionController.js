// controllers/transactionController.js
// Customer-side transaction creation for Task 2.
// Employee listing / verify / submit-to-SWIFT belong to Task 3.

const { sql, poolPromise } = require('../db/connection');
const audit = require('../db/audit');

// POST /api/transactions  [requireCustomer]
async function create(req, res) {
  const { amount, currency, provider, payeeAccount, swiftCode } = req.body;

  try {
    const pool = await poolPromise;

    // SECURITY (SQL injection): every value is bound as a typed parameter.
    // SECURITY (authorisation): CustomerId, FullName and AccountNumber come from the verified JWT,
    // never from the request body — the client cannot inject someone else's identity.
    const result = await pool.request()
      .input('customerId',    sql.Int,          req.user.customerId)
      .input('fullName',      sql.NVarChar,     req.user.fullName)
      .input('accountNumber', sql.NVarChar,     req.user.accountNumber)
      .input('amount',        sql.Decimal(18,2), amount)
      .input('currency',      sql.NVarChar,     currency)
      .input('provider',      sql.NVarChar,     provider || 'SWIFT')
      .input('payeeAccount',  sql.NVarChar,     payeeAccount)
      .input('swiftCode',     sql.NVarChar,     swiftCode)
      .query(`INSERT INTO Transactions
                (CustomerId, FullName, AccountNumber, Amount, Currency, Provider, PayeeAccount, SwiftCode, Status)
              OUTPUT INSERTED.TransactionId, INSERTED.CreatedAt
              VALUES (@customerId, @fullName, @accountNumber, @amount, @currency, @provider, @payeeAccount, @swiftCode, 'pending')`);

    const inserted = result.recordset[0];

    await audit.record({
      actor: `customer:${req.user.accountNumber}`,
      action: 'tx_create',
      targetType: 'transaction',
      targetId: inserted.TransactionId,
      req,
      notes: `${currency} ${amount} → ${payeeAccount}`
    });

    return res.status(201).json({
      message: 'Payment submitted successfully',
      transaction: {
        transactionId: inserted.TransactionId,
        createdAt: inserted.CreatedAt,
        amount,
        currency,
        provider: provider || 'SWIFT',
        payeeAccount,
        swiftCode,
        status: 'pending'
      }
    });
  } catch (err) {
    console.error('[transactions.create]', err.message);
    return res.status(500).json({ error: 'Failed to submit payment' });
  }
}

// GET /api/transactions/mine  [requireCustomer]
// SECURITY: the WHERE clause uses req.user.customerId — taken from the verified JWT —
// NOT from the URL or query string. This prevents IDOR (Insecure Direct Object Reference).
// A customer cannot see another customer's transactions even by tampering with the request.
async function listMine(req, res) {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('customerId', sql.Int, req.user.customerId)
      .query(`SELECT TransactionId,
                     CAST(Amount AS NVARCHAR(20)) AS Amount,
                     Currency,
                     Provider,
                     PayeeAccount,
                     SwiftCode,
                     Status,
                     CreatedAt
              FROM Transactions
              WHERE CustomerId = @customerId
              ORDER BY CreatedAt DESC`);

    return res.json({ transactions: result.recordset });
  } catch (err) {
    console.error('[transactions.listMine]', err.message);
    return res.status(500).json({ error: 'Failed to load transactions' });
  }
}

// GET /api/transactions  [requireEmployee]
async function listForEmployee(req, res) {
  const status = req.query.status; // optional: pending | verified | submitted
  try {
    const pool = await poolPromise;
    const request = pool.request();

    let where = '';
    if (status === 'pending' || status === 'verified' || status === 'submitted') {
      request.input('status', sql.NVarChar, status);
      where = 'WHERE Status = @status';
    }

    const result = await request.query(`
      SELECT t.TransactionId,
             t.CustomerId,
             t.FullName,
             t.AccountNumber,
             CAST(t.Amount AS NVARCHAR(20)) AS Amount,
             t.Currency,
             t.Provider,
             t.PayeeAccount,
             t.SwiftCode,
             t.Status,
             t.CreatedAt,
             t.VerifiedBy,
             t.VerifiedAt,
             t.VerificationNotes,
             t.SubmittedAt,
             e.Username AS VerifiedByUsername
      FROM Transactions t
      LEFT JOIN Employees e ON e.EmployeeId = t.VerifiedBy
      ${where}
      ORDER BY t.CreatedAt DESC`);

    return res.json({ transactions: result.recordset });
  } catch (err) {
    console.error('[transactions.listForEmployee]', err.message);
    return res.status(500).json({ error: 'Failed to load transactions' });
  }
}

// PATCH /api/transactions/:id/verify  [requireEmployee]
async function verify(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid transaction id' });
  }

  const note = req.body?.note ?? null;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id',        sql.Int,      id)
      .input('verifier',  sql.Int,      req.user.employeeId)
      .input('note',      sql.NVarChar, note)
      .query(`UPDATE Transactions
              SET Status = 'verified',
                  VerifiedBy = @verifier,
                  VerifiedAt = GETDATE(),
                  VerificationNotes = @note
              OUTPUT inserted.TransactionId, inserted.Status, inserted.VerifiedAt
              WHERE TransactionId = @id AND Status = 'pending'`);

    if (result.recordset.length === 0) {
      return res.status(409).json({ error: 'Transaction not pending or not found' });
    }

    await audit.record({
      actor: `employee:${req.user.username}`,
      action: 'tx_verify',
      targetType: 'transaction',
      targetId: id,
      req,
      notes: note
    });

    return res.json({ message: 'Transaction verified', transaction: result.recordset[0] });
  } catch (err) {
    console.error('[transactions.verify]', err.message);
    return res.status(500).json({ error: 'Failed to verify transaction' });
  }
}

// POST /api/transactions/submit  [requireEmployee]
// Submits all currently-verified transactions to SWIFT. Simulated dispatch — flips Status and stamps SubmittedAt.
async function submitToSwift(req, res) {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      UPDATE Transactions
      SET Status = 'submitted', SubmittedAt = GETDATE()
      OUTPUT inserted.TransactionId
      WHERE Status = 'verified'`);

    const submittedIds = result.recordset.map(r => r.TransactionId);

    await audit.record({
      actor: `employee:${req.user.username}`,
      action: 'tx_submit',
      targetType: 'transaction',
      targetId: submittedIds.join(',') || null,
      req,
      notes: `submitted ${submittedIds.length} transactions to SWIFT`
    });

    return res.json({ message: 'Submitted to SWIFT', count: submittedIds.length, ids: submittedIds });
  } catch (err) {
    console.error('[transactions.submitToSwift]', err.message);
    return res.status(500).json({ error: 'Failed to submit to SWIFT' });
  }
}

// GET /api/audit  [requireEmployee] — recent activity for the employee dashboard.
async function recentAudit(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 100 AuditId, Actor, Action, TargetType, TargetId, IpAddress, Notes, CreatedAt
      FROM AuditLog ORDER BY CreatedAt DESC`);
    return res.json({ entries: result.recordset });
  } catch (err) {
    console.error('[transactions.recentAudit]', err.message);
    return res.status(500).json({ error: 'Failed to load audit log' });
  }
}

// GET /api/customers  [requireEmployee]
async function listCustomers(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT c.CustomerId, c.FullName, c.IdNumber, c.AccountNumber, c.CreatedAt,
             c.FailedLoginCount, c.LockedUntil,
             (SELECT COUNT(*) FROM Transactions t WHERE t.CustomerId = c.CustomerId) AS TransactionCount
      FROM Customers c
      ORDER BY c.CreatedAt DESC`);
    return res.json({ customers: result.recordset });
  } catch (err) {
    console.error('[customers.list]', err.message);
    return res.status(500).json({ error: 'Failed to load customers' });
  }
}

// GET /api/customers/:id  [requireEmployee] — customer profile + their transactions + their audit entries.
async function getCustomer(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid customer id' });
  }

  try {
    const pool = await poolPromise;

    const customerResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT CustomerId, FullName, IdNumber, AccountNumber, CreatedAt,
                     FailedLoginCount, LockedUntil
              FROM Customers WHERE CustomerId = @id`);

    if (customerResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const customer = customerResult.recordset[0];

    const txResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT t.TransactionId,
                     CAST(t.Amount AS NVARCHAR(20)) AS Amount,
                     t.Currency, t.Provider, t.PayeeAccount, t.SwiftCode,
                     t.Status, t.CreatedAt, t.VerifiedAt, t.SubmittedAt,
                     e.Username AS VerifiedByUsername
              FROM Transactions t
              LEFT JOIN Employees e ON e.EmployeeId = t.VerifiedBy
              WHERE t.CustomerId = @id
              ORDER BY t.CreatedAt DESC`);

    const auditResult = await pool.request()
      .input('actor', sql.NVarChar, `customer:${customer.AccountNumber}`)
      .query(`SELECT TOP 50 AuditId, Actor, Action, TargetType, TargetId, IpAddress, Notes, CreatedAt
              FROM AuditLog WHERE Actor = @actor
              ORDER BY CreatedAt DESC`);

    return res.json({
      customer,
      transactions: txResult.recordset,
      audit: auditResult.recordset
    });
  } catch (err) {
    console.error('[customers.get]', err.message);
    return res.status(500).json({ error: 'Failed to load customer' });
  }
}

// GET /api/employees  [requireEmployee] — list of seeded operators, no password material exposed.
async function listEmployees(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT EmployeeId, FullName, Username, Role, FailedLoginCount, LockedUntil, CreatedAt
      FROM Employees ORDER BY CreatedAt ASC`);
    return res.json({ employees: result.recordset });
  } catch (err) {
    console.error('[employees.list]', err.message);
    return res.status(500).json({ error: 'Failed to load employees' });
  }
}

module.exports = {
  create, listMine,
  listForEmployee, verify, submitToSwift, recentAudit,
  listCustomers, getCustomer, listEmployees
};
