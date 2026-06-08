const { sql, poolPromise } = require('./connection');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// table === 'Customers' uses CustomerId as the PK column.
// table === 'Employees' uses EmployeeId as the PK column.
function pkColumn(table) {
  return table === 'Customers' ? 'CustomerId' : 'EmployeeId';
}

function isLockedNow(row) {
  if (!row?.LockedUntil) return false;
  return new Date(row.LockedUntil) > new Date();
}

async function registerFailure(table, idValue) {
  const pool = await poolPromise;
  const pk = pkColumn(table);

  const updated = await pool.request()
    .input('id', sql.Int, idValue)
    .query(`UPDATE ${table}
            SET FailedLoginCount = FailedLoginCount + 1
            OUTPUT inserted.FailedLoginCount
            WHERE ${pk} = @id`);

  const count = updated.recordset[0]?.FailedLoginCount ?? 0;

  if (count >= MAX_FAILED_ATTEMPTS) {
    await pool.request()
      .input('id', sql.Int, idValue)
      .input('minutes', sql.Int, LOCKOUT_MINUTES)
      .query(`UPDATE ${table}
              SET LockedUntil = DATEADD(MINUTE, @minutes, GETDATE()),
                  FailedLoginCount = 0
              WHERE ${pk} = @id`);
    return { locked: true, until: new Date(Date.now() + LOCKOUT_MINUTES * 60_000) };
  }
  return { locked: false, count };
}

async function clearFailures(table, idValue) {
  const pool = await poolPromise;
  const pk = pkColumn(table);
  await pool.request()
    .input('id', sql.Int, idValue)
    .query(`UPDATE ${table} SET FailedLoginCount = 0, LockedUntil = NULL WHERE ${pk} = @id`);
}

module.exports = { isLockedNow, registerFailure, clearFailures, MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES };
