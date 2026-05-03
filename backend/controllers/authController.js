// controllers/authController.js
// Customer registration, login, logout. Employees are Task 3 — not implemented here.

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../db/connection');

// SECURITY: 12 bcrypt rounds. Each round doubles the time — makes offline brute force infeasible.
const BCRYPT_ROUNDS = 12;

// JWT lifetime: 1 hour. Short window limits damage if a cookie is somehow stolen.
const JWT_EXPIRY = '1h';
const COOKIE_MAX_AGE = 60 * 60 * 1000;

// Helper: set the JWT cookie with all protective flags in one place.
function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,                                       // SECURITY (XSS): JS cannot read this cookie
    secure: process.env.NODE_ENV === 'production',        // SECURITY (MITM): HTTPS-only in prod
    sameSite: 'Strict',                                   // SECURITY (CSRF): not sent cross-site
    maxAge: COOKIE_MAX_AGE
  });
}

// POST /api/auth/register
async function register(req, res) {
  const { fullName, idNumber, accountNumber, password } = req.body;

  try {
    const pool = await poolPromise;

    // SECURITY (SQL injection): parameterised query. The driver binds the value; the SQL engine never parses it as code.
    const existing = await pool.request()
      .input('idNumber', sql.NVarChar, idNumber)
      .input('accountNumber', sql.NVarChar, accountNumber)
      .query('SELECT CustomerId FROM Customers WHERE IdNumber = @idNumber OR AccountNumber = @accountNumber');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: 'An account with that ID or account number already exists' });
    }

    // SECURITY (password hashing + salting): bcrypt embeds a per-password salt in the hash output.
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Parameterised INSERT. No template string, no string building.
    const result = await pool.request()
      .input('fullName',      sql.NVarChar, fullName)
      .input('idNumber',      sql.NVarChar, idNumber)
      .input('accountNumber', sql.NVarChar, accountNumber)
      .input('passwordHash',  sql.NVarChar, passwordHash)
      .query(`INSERT INTO Customers (FullName, IdNumber, AccountNumber, PasswordHash)
              OUTPUT INSERTED.CustomerId
              VALUES (@fullName, @idNumber, @accountNumber, @passwordHash)`);

    const customerId = result.recordset[0].CustomerId;

    // Do NOT auto-login after register — forces the user to authenticate explicitly.
    return res.status(201).json({
      message: 'Registration successful. Please log in.',
      customerId
    });
  } catch (err) {
    console.error('[register]', err.message);
    return res.status(500).json({ error: 'Registration failed' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { accountNumber, password } = req.body;

  try {
    const pool = await poolPromise;

    // SECURITY (SQL injection): parameterised lookup by account number only.
    const result = await pool.request()
      .input('accountNumber', sql.NVarChar, accountNumber)
      .query('SELECT CustomerId, FullName, AccountNumber, PasswordHash FROM Customers WHERE AccountNumber = @accountNumber');

    const customer = result.recordset[0];

    // SECURITY: identical generic error for "user not found" and "wrong password".
    // Prevents account enumeration — an attacker cannot learn which account numbers exist.
    if (!customer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // SECURITY: bcrypt.compare is constant-time to avoid timing attacks.
    const valid = await bcrypt.compare(password, customer.PasswordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Issue a signed JWT. Signature uses a 64-char secret from .env.
    const token = jwt.sign(
      {
        customerId: customer.CustomerId,
        accountNumber: customer.AccountNumber,
        fullName: customer.FullName,
        role: 'customer'
      },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    setAuthCookie(res, token);

    return res.json({
      message: 'Login successful',
      user: {
        customerId: customer.CustomerId,
        fullName: customer.FullName,
        accountNumber: customer.AccountNumber
      }
    });
  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ error: 'Login failed' });
  }
}

// POST /api/auth/logout
function logout(req, res) {
  // Overwrite the cookie with an expired one — same flags so the browser accepts the overwrite.
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  });
  return res.json({ message: 'Logged out' });
}

// GET /api/auth/me — used by the SPA's ProtectedRoute to verify the session is still valid.
async function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, logout, me };
