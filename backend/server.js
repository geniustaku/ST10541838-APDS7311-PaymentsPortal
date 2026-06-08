// server.js
// Assembly of the Express app with every security control applied in the correct order.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const { authLimiter, paymentLimiter, generalLimiter } = require('./middleware/rateLimiters');

const app = express();

// In production we serve the built React app from the same origin as the API.
// SECURITY: same-origin means SameSite=Strict cookies work without exception, and we
// avoid CORS entirely, which removes a class of misconfiguration risks.
const isProd = process.env.NODE_ENV === 'production';
const customerBuildDir = path.join(__dirname, '..', 'customer-portal', 'dist');
const employeeBuildDir = path.join(__dirname, '..', 'employee-portal', 'dist');

// 1. Trust the reverse proxy (Azure App Service terminates TLS in front of Node).
app.set('trust proxy', 1);

// 2. Security headers MUST come before any route handler.
//    SECURITY:
//    - frameguard = Clickjacking (X-Frame-Options: DENY)
//    - hsts       = force HTTPS for a year, all subdomains (MITM)
//    - noSniff    = stops browsers guessing content types (XSS)
//    - xssFilter  = legacy browser XSS filter
//    - referrerPolicy = no referrer leaks
//    - CSP        = only self-hosted scripts/styles + no framing (Clickjacking + XSS)
app.use(helmet({
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'no-referrer' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'"],
      styleSrc:      ["'self'", "'unsafe-inline'"],  // Bootstrap inline styles
      imgSrc:        ["'self'", 'data:'],
      connectSrc:    ["'self'"],
      frameAncestors: ["'none'"]                     // Clickjacking
    }
  }
}));

// 3. Body parser with a tight size limit — defends against oversized-payload DoS.
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 4. CORS — only used in development where the React dev server runs on a different port.
//    In production frontend and backend share an origin, so CORS is unnecessary.
if (!isProd) {
  const allowedOrigins = [
    process.env.CUSTOMER_PORTAL_URL,
    process.env.EMPLOYEE_PORTAL_URL
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type']
  }));
}

// 5. General rate limiter applied to every route (DDoS shield).
app.use(generalLimiter);

// 6. Routes with extra route-specific rate limits.
app.use('/api/auth',         authLimiter,    require('./routes/auth'));
app.use('/api/transactions', paymentLimiter, require('./routes/transactions'));

// 7. Health check for Azure App Service warm-up probes.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 8. Serve both React builds in production. The employee SPA lives under /employee/*.
if (isProd) {
  if (fs.existsSync(employeeBuildDir)) {
    app.use('/employee', express.static(employeeBuildDir, { index: false }));
    app.get(/^\/employee(\/.*)?$/, (req, res) => {
      res.sendFile(path.join(employeeBuildDir, 'index.html'));
    });
  }

  if (fs.existsSync(customerBuildDir)) {
    app.use(express.static(customerBuildDir, { index: false }));
    app.get(/^\/(?!api|employee).*/, (req, res) => {
      res.sendFile(path.join(customerBuildDir, 'index.html'));
    });
  }
}

// 9. 404 handler — no stack trace, no echoing of the path (prevents reflected XSS).
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// 10. Generic error handler — log internally, respond with a generic message.
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// 11. Boot.
//     In production (Azure), HTTPS is terminated by the platform — run plain HTTP here.
//     In development, we serve HTTPS locally with the self-signed cert so cookies marked
//     Secure still flow during end-to-end testing.
const PORT = process.env.PORT || 3000;

if (isProd) {
  http.createServer(app).listen(PORT, () => {
    console.log(`[server] HTTP (behind Azure TLS) on port ${PORT}`);
  });
} else {
  const sslOptions = {
    key:  fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };
  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`[server] HTTPS (self-signed) on https://localhost:${PORT}`);
  });
}
