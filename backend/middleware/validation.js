// middleware/validation.js
// SECURITY: RegEx WHITELIST. Any field that does not match its pattern is rejected with 400.
// A whitelist is strictly safer than a blacklist — we define what IS allowed, everything else is refused.
// This defeats SQL injection, XSS payloads, command injection, header injection, etc. at the door.

const patterns = {
  // Names: letters and spaces only. Blocks <script>, quotes, semicolons.
  fullName:      /^[a-zA-Z\s]{2,50}$/,
  // South African ID number: exactly 13 digits.
  idNumber:      /^[0-9]{13}$/,
  // Bank account number: 10–12 digits.
  accountNumber: /^[0-9]{10,12}$/,
  // Strong password: 8+ chars, upper, lower, digit, special from safe set.
  password:      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  // Money amount: digits with up to 2 decimal places.
  amount:        /^\d+(\.\d{1,2})?$/,
  // Currency: only allowed ISO codes.
  currency:      /^(USD|EUR|GBP|ZAR|JPY|AUD)$/,
  // Payee account same shape as account number.
  payeeAccount:  /^[0-9]{10,12}$/,
  // SWIFT/BIC code: 8 or 11 chars (6 letters + 2 alnum + optional 3 alnum).
  swiftCode:     /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  // Provider: only SWIFT for now.
  provider:      /^(SWIFT)$/
};

// Factory: returns an Express middleware that validates every field in `required`.
function validateBody(required) {
  return (req, res, next) => {
    for (const field of required) {
      const value = req.body[field];
      // Missing or empty value: reject.
      if (value === undefined || value === null || value === '') {
        return res.status(400).json({ error: `Missing ${field}` });
      }
      const pattern = patterns[field];
      // No pattern configured: defensive — refuse to accept an unknown field.
      if (!pattern) {
        return res.status(400).json({ error: `Unknown field ${field}` });
      }
      // Pattern mismatch: reject without echoing the bad value (prevents reflected XSS in errors).
      if (!pattern.test(String(value))) {
        return res.status(400).json({ error: `Invalid ${field}` });
      }
    }
    next();
  };
}

module.exports = { patterns, validateBody };
