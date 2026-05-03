// middleware/auth.js
// SECURITY: Verifies the JWT that was issued at login and delivered via an HttpOnly cookie.
// HttpOnly cookies cannot be read by JavaScript, which defeats XSS session theft.
// The jwt.verify call validates the signature so forged tokens are rejected.

const jwt = require('jsonwebtoken');

function requireCustomer(req, res, next) {
  const token = req.cookies?.token;

  // No cookie = not logged in.
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Signature validation — throws on tamper or expiry.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // SECURITY: role check — customer tokens must not pass for employee routes in Task 3.
    if (decoded.role !== 'customer') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Attach the authenticated user to the request for downstream use.
    req.user = {
      customerId: decoded.customerId,
      accountNumber: decoded.accountNumber,
      fullName: decoded.fullName
    };
    next();
  } catch (err) {
    // Do not leak the specific reason (expired vs invalid signature vs malformed).
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireCustomer };
