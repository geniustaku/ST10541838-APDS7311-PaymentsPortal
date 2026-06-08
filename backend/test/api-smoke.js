/* eslint-disable no-console */
// API smoke test that proves the security middleware works without needing a database.
// Builds the Express app directly, mounts it on supertest, and asserts the controls.

const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'smoke-test-secret-only-used-in-ci';
process.env.CUSTOMER_PORTAL_URL = 'https://localhost:5173';

// Provide harmless DB config so requiring db/connection does not throw at parse time.
// The connection attempt will fail in the background, which is fine — the smoke test only
// exercises endpoints that reject before any SQL hits.
process.env.DB_SERVER = process.env.DB_SERVER || 'smoke.invalid';
process.env.DB_NAME = process.env.DB_NAME || 'smoke';
process.env.DB_USER = process.env.DB_USER || 'smoke';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'smoke';

// Silence the connection failure logs so the test output is clean.
const realError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].startsWith('[db]')) return;
  realError(...args);
};

const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { authLimiter, paymentLimiter, generalLimiter } = require('../middleware/rateLimiters');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'no-referrer' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use(generalLimiter);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth',         authLimiter,    require('../routes/auth'));
app.use('/api/transactions', paymentLimiter, require('../routes/transactions'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('[smoke-app-error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Boot on a random local port and run requests with node http client.
const http = require('node:http');
const server = http.createServer(app);

function request(method, route, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname: '127.0.0.1',
      port: server.address().port,
      path: route,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: `token=${cookie}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = http.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: buf }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  console.log(`smoke: listening on :${server.address().port}`);

  console.log('smoke: 1 health check responds 200');
  const health = await request('GET', '/api/health');
  assert.equal(health.status, 200);

  console.log('smoke: 2 helmet headers present');
  assert.ok(health.headers['strict-transport-security'], 'HSTS header missing');
  assert.ok(health.headers['x-frame-options'], 'X-Frame-Options header missing');
  assert.ok(health.headers['x-content-type-options'], 'X-Content-Type-Options header missing');
  assert.ok(health.headers['content-security-policy'], 'CSP header missing');

  console.log('smoke: 3 unauthenticated transaction creation rejected with 401');
  const noAuth = await request('POST', '/api/transactions', { body: { amount: '10' } });
  assert.equal(noAuth.status, 401);

  console.log('smoke: 4 malformed register payload rejected with 400');
  const badReg = await request('POST', '/api/auth/register', {
    body: { fullName: '<script>', idNumber: 'abc', accountNumber: '1', password: 'weak' }
  });
  assert.equal(badReg.status, 400);

  console.log('smoke: 5 malformed login payload rejected with 400');
  const badLogin = await request('POST', '/api/auth/login', {
    body: { accountNumber: 'not-numeric', password: 'Anything@1' }
  });
  assert.equal(badLogin.status, 400);

  console.log('smoke: 6 employee login route exists (not 404)');
  const empLogin = await request('POST', '/api/auth/employee/login', {
    body: { username: 'nope', password: 'Anything@1' }
  });
  assert.notEqual(empLogin.status, 404);

  console.log('smoke: ALL SECURITY ASSERTIONS PASSED');
  server.close();
  process.exit(0);
}

run().catch(err => {
  console.error('smoke: FAILED ->', err.message);
  console.error(err.stack);
  process.exit(1);
});
