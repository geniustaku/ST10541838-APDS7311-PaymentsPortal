// db/connection.js
// Pooled connection to Azure SQL. Uses the `mssql` driver (not raw ADO.NET connection strings).
// SECURITY: encrypt=true forces TLS to Azure SQL; trustServerCertificate=false rejects forged
// certificates and defeats man-in-the-middle attacks on the DB channel.

const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true,                  // SECURITY (MITM): TLS required for Azure SQL
    trustServerCertificate: false   // SECURITY (MITM): validate Azure's certificate chain
  }
};

// Single shared promise that resolves to a live connection pool.
// Controllers await this to reuse the same pool across requests.
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('[db] Connected to Azure SQL');
    return pool;
  })
  .catch(err => {
    console.error('[db] Connection failed:', err.message);
    process.exit(1);
  });

module.exports = { sql, poolPromise };
