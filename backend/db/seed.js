require('dotenv').config();
const bcrypt = require('bcrypt');
const { sql, poolPromise } = require('./connection');

// Operators are seeded by an administrator. The application exposes no employee
// registration endpoint. Credentials live in environment variables so this file
// can be committed to a public repository without leaking working logins.
const employees = [
  {
    fullName: process.env.SEED_EMPLOYEE_1_FULLNAME || 'John Smith',
    username: process.env.SEED_EMPLOYEE_1_USERNAME || 'jsmith',
    password: process.env.SEED_EMPLOYEE_1_PASSWORD
  },
  {
    fullName: process.env.SEED_EMPLOYEE_2_FULLNAME || 'Sarah Johnson',
    username: process.env.SEED_EMPLOYEE_2_USERNAME || 'sjohnson',
    password: process.env.SEED_EMPLOYEE_2_PASSWORD
  }
];

async function seed() {
  const missing = employees.filter(e => !e.password).map(e => e.username);
  if (missing.length > 0) {
    console.error(`Cannot seed: missing passwords for ${missing.join(', ')}.`);
    console.error('Set SEED_EMPLOYEE_1_PASSWORD and SEED_EMPLOYEE_2_PASSWORD in backend/.env');
    process.exit(1);
  }

  const pool = await poolPromise;

  for (const emp of employees) {
    const existing = await pool.request()
      .input('username', sql.NVarChar, emp.username)
      .query('SELECT EmployeeId FROM Employees WHERE Username = @username');

    if (existing.recordset.length > 0) {
      console.log(`Skip ${emp.username} (already exists)`);
      continue;
    }

    const hash = await bcrypt.hash(emp.password, 12);

    await pool.request()
      .input('fullName', sql.NVarChar, emp.fullName)
      .input('username', sql.NVarChar, emp.username)
      .input('hash',     sql.NVarChar, hash)
      .query(`INSERT INTO Employees (FullName, Username, PasswordHash)
              VALUES (@fullName, @username, @hash)`);

    console.log(`Seeded employee: ${emp.username}`);
  }

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
