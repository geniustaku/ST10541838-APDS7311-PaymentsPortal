const GROUPS = [
  {
    title: 'Authentication',
    items: [
      ['bcrypt 12-round hashing', 'Login passwords are hashed with bcrypt at cost factor 12 for both customers and staff.'],
      ['Strong password policy', 'Minimum 8 characters with upper, lower, digit and one symbol from a safe set.'],
      ['Account lockout', '5 consecutive failed logins lock the account for 15 minutes. Lockout is per-account, complementing per-IP rate limiting.'],
      ['Static staff login', 'Operators are seeded in the database. No public registration endpoint exists for the Employees table.']
    ]
  },
  {
    title: 'Session',
    items: [
      ['JWT in HttpOnly cookie', 'JavaScript cannot read the token, defeating XSS-based session theft.'],
      ['Secure + SameSite=Strict', 'Cookie travels only over HTTPS and is never sent on cross-site requests.'],
      ['1 hour expiry', 'Short token lifetime limits damage from a stolen session.'],
      ['Server-side logout', '/api/auth/logout clears the cookie at the browser.']
    ]
  },
  {
    title: 'Transport',
    items: [
      ['HTTPS only', 'Local development uses a self-signed certificate; production uses Microsoft-issued TLS on Azure App Service.'],
      ['HSTS for one year', 'Strict-Transport-Security header forces HTTPS in browsers for 365 days.'],
      ['Azure SQL TLS', 'Database driver enforces encrypt=true with certificate validation, defeating MITM on the SQL channel.']
    ]
  },
  {
    title: 'Application hardening',
    items: [
      ['Parameterised SQL only', 'Every query binds values as typed parameters. No string concatenation anywhere in the codebase.'],
      ['RegEx whitelist', 'Every API field is validated against an allow-list pattern. Anything not matching is refused with HTTP 400.'],
      ['Helmet security headers', 'X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy and Content-Security-Policy with self-only sources.'],
      ['Clickjacking prevention', 'CSP frame-ancestors none plus X-Frame-Options DENY.'],
      ['CSRF prevention', 'JWT cookie marked SameSite=Strict so browsers refuse cross-site requests.'],
      ['Rate limiting', '5 auth attempts per 15 minutes, 10 payments per hour, 100 requests per 15 minutes in production. DDoS shield + brute-force protection.']
    ]
  },
  {
    title: 'Audit and accountability',
    items: [
      ['Every sensitive action logged', 'Customer logins, employee logins, transaction creation, verification and SWIFT submission each emit one row in AuditLog with actor, action, target, IP and timestamp.'],
      ['Non-repudiation on verification', 'When an employee verifies a transaction the verifier id, verification time and an optional note are recorded against the row.'],
      ['Errors never leak internals', 'Application errors return a generic message to the client; the stack trace is logged server-side only.']
    ]
  }
];

export default function SecurityPolicy() {
  return (
    <>
      <div className="mb-4">
        <h3 className="mb-1" style={{ color: 'var(--staff-ink)' }}>Security policy</h3>
        <p className="mb-0 small text-muted-strong">
          Controls in force across the customer portal, the staff portal and the API.
        </p>
      </div>

      {GROUPS.map(g => (
        <div key={g.title} className="policy-group">
          <h6>{g.title}</h6>
          {g.items.map(([label, detail], i) => (
            <div key={i} className="policy-item">
              <i className="bi bi-check-circle-fill policy-check" />
              <div>
                <div className="policy-label">{label}</div>
                <div className="policy-detail">{detail}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
