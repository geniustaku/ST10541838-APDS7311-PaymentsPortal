# APDS7311 — International Payments Portal

**Student:** Genius Mhirizhonga &middot; **Student number:** ST10541838 &middot; **Module:** APDS7311 Application Development Security &middot; **Institution:** IIE Rosebank College

A secure customer portal for international payments built for ICE Task 2.

---

## Stack

- **Backend:** Node.js + Express on Azure App Service
- **Frontend:** React (Vite) + Bootstrap 5
- **Database:** Azure SQL Database
- **Security:** bcrypt, helmet, JWT in HttpOnly cookies, parameterised SQL, RegEx whitelist, rate limiting, HTTPS

## Security Measures (12)

1. Password hashing + salting — bcrypt with 12 rounds
2. RegEx whitelist on every input (`backend/middleware/validation.js`)
3. SSL / HTTPS — self-signed locally, Microsoft cert on Azure
4. JWT issued on login, stored in HttpOnly + Secure + SameSite=Strict cookie
5. Helmet headers (HSTS, CSP, X-Frame-Options, etc.)
6. Session hijacking — HttpOnly cookie + 1 hour expiry
7. Clickjacking — `frame-ancestors 'none'` + `X-Frame-Options: DENY`
8. SQL injection — parameterised queries only
9. XSS — whitelist + React JSX auto-escape + CSP
10. CSRF — `SameSite=Strict` cookie
11. MITM — HTTPS + HSTS + Azure SQL `encrypt: true`
12. DDoS / brute force — `express-rate-limit` per route

## Project structure

```
apds7311-payments-portal/
├── backend/                  Node + Express API
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── db/
│   └── server.js
├── customer-portal/          React + Vite SPA
│   └── src/
└── README.md
```

## Local development

```bash
# 1. Install
npm run install:all

# 2. Set up backend/.env (copy from .env.example, fill in real values)

# 3. Generate self-signed SSL cert
cd backend && mkdir -p ssl && \
  openssl req -nodes -new -x509 \
    -keyout ssl/server.key -out ssl/server.cert \
    -days 365 -subj "/CN=localhost"

# 4. Run backend (https://localhost:3000) and frontend (https://localhost:5173)
npm run dev:backend
# in a second terminal:
npm run dev:frontend
```

Open https://localhost:5173 and accept the self-signed certificate warning.

## Production (Azure App Service)

The backend serves the React build from `customer-portal/dist/` so the entire app
runs on one origin.

Required Azure App Service application settings:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DB_SERVER` | (Azure SQL server hostname, set in Azure) |
| `DB_NAME` | (Azure SQL database name, set in Azure) |
| `DB_USER` | (set in Azure, never in repo) |
| `DB_PASSWORD` | (set in Azure, never in repo) |
| `JWT_SECRET` | 64+ char hex (set in Azure, never in repo) |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~20` |

## Submission

| Item | Status |
|------|--------|
| Customer registration | ✓ |
| Customer login | ✓ |
| Payment creation | ✓ |
| Customer's own transactions list | ✓ |
| All 12 security measures | ✓ |
| HTTPS everywhere | ✓ |
| Demo video | (record after Azure deploy) |
