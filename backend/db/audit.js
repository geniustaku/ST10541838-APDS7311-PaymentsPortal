const { sql, poolPromise } = require('./connection');

function clientIp(req) {
  if (!req) return null;
  const fwd = req.headers?.['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || null;
}

async function record({ actor, action, targetType = null, targetId = null, req = null, notes = null }) {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('actor',      sql.NVarChar, String(actor || 'anon').slice(0, 50))
      .input('action',     sql.NVarChar, String(action).slice(0, 50))
      .input('targetType', sql.NVarChar, targetType ? String(targetType).slice(0, 20) : null)
      .input('targetId',   sql.NVarChar, targetId   ? String(targetId).slice(0, 50) : null)
      .input('ip',         sql.NVarChar, clientIp(req))
      .input('notes',      sql.NVarChar, notes ? String(notes).slice(0, 500) : null)
      .query(`INSERT INTO AuditLog (Actor, Action, TargetType, TargetId, IpAddress, Notes)
              VALUES (@actor, @action, @targetType, @targetId, @ip, @notes)`);
  } catch (err) {
    // Audit must never crash the request path.
    console.error('[audit]', err.message);
  }
}

module.exports = { record };
