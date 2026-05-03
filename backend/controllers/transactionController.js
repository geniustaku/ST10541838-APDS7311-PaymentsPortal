// controllers/transactionController.js
// Customer-side transaction creation for Task 2.
// Employee listing / verify / submit-to-SWIFT belong to Task 3.

const { sql, poolPromise } = require('../db/connection');

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

module.exports = { create, listMine };
