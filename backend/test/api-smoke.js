/* eslint-disable no-console */
// API smoke test. Boots the server in-process and asserts that the security
// controls and core flows respond as designed. Runs in CI as the "API testing"
// pillar of the DevSecOps pipeline.

const assert = require('node:assert/strict');
const http = require('node:http');
const https = require('node:https');

// Allow self-signed cert in the smoke test (we are talking to localhost).
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const PORT = process.env.SMOKE_PORT || 3100;
process.env.PORT = PORT;
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-test-secret-not-used-in-production';

// Avoid touching the real database. Stub the connection module so importing the
// server does not try to open a SQL Server connection.
const Module = require('node:module');
const origResolve = Module._resolve_filename || Module._resolveFilename;
const stubPath = require('node:path').resolve(__dirname, 'db-stub.js');
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.endsWith('db/connection') || request === '../db/connection') {
    return stubPath;
  }
  return origResolve.call(this, request, parent, ...rest);
};

// Boot the server. The smoke test only exercises endpoints that fail before any
// SQL hits (rate-limit replies, validation rejects, role checks).
let server;
async function start() {
  return new Promise((resolve, reject) => {
    try {
      require('../server.js');
      // server.js calls .listen synchronously; give the event loop a tick.
      setTimeout(resolve, 500);
    } catch (e) { reject(e); }
  });
}

function request(method, path, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname: 'localhost',
      port: PORT,
      path,
      protocol: process.env.NODE_ENV === 'production' ? 'http:' : 'https:',
      agent: process.env.NODE_ENV === 'production' ? undefined : httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: `token=${cookie}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const lib = opts.protocol === 'https:' ? https : http;
    const req = lib.request(opts, res => {
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
  console.log(`smoke: booting server on :${PORT}`);
  await start();

  console.log('smoke: health check responds');
  const health = await request('GET', '/api/health');
  assert.equal(health.status, 200, 'health should be 200');

  console.log('smoke: helmet security headers present');
  assert.ok(health.headers['strict-transport-security'], 'HSTS header missing');
  assert.ok(health.headers['x-frame-options'], 'X-Frame-Options header missing');
  assert.ok(health.headers['x-content-type-options'], 'X-Content-Type-Options header missing');
  assert.ok(health.headers['content-security-policy'], 'CSP header missing');

  console.log('smoke: unauthenticated transaction creation rejected');
  const noAuth = await request('POST', '/api/transactions', { body: { amount: '10' } });
  assert.equal(noAuth.status, 401, 'unauth POST /api/transactions should be 401');

  console.log('smoke: invalid registration payload rejected by RegEx whitelist');
  const badReg = await request('POST', '/api/auth/register', {
    body: { fullName: '<script>', idNumber: 'abc', accountNumber: '1', password: 'weak' }
  });
  assert.equal(badReg.status, 400, 'malformed register should be 400');

  console.log('smoke: customer login with malformed account number rejected');
  const badLogin = await request('POST', '/api/auth/login', {
    body: { accountNumber: 'not-numeric', password: 'Anything@1' }
  });
  assert.equal(badLogin.status, 400, 'malformed login should be 400');

  console.log('smoke: employee login route exists');
  const empLogin = await request('POST', '/api/auth/employee/login', {
    body: { username: 'nope', password: 'Anything@1' }
  });
  // Either 400 (validation), 401 (not found), or 423 (locked) is acceptable; what
  // we are proving is that the route exists and does not 404.
  assert.notEqual(empLogin.status, 404, 'employee login should not be 404');

  console.log('smoke: ALL TESTS PASSED');
  process.exit(0);
}

run().catch(err => {
  console.error('smoke: FAILED ->', err.message);
  console.error(err.stack);
  process.exit(1);
});
