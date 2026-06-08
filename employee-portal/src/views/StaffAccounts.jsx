import { useEffect, useState } from 'react';
import api from '../api.js';
import { fmtDate, fmtDateShort } from './util.js';

export default function StaffAccounts() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/api/transactions/employees')
      .then(res => { if (!cancelled) setStaff(res.data.employees || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function isLocked(e) {
    return e.LockedUntil && new Date(e.LockedUntil) > new Date();
  }

  return (
    <>
      <div className="mb-4">
        <h3 className="mb-1" style={{ color: 'var(--staff-ink)' }}>Staff accounts</h3>
        <p className="mb-0 small text-muted-strong">Pre-registered operators with access to the payments portal.</p>
      </div>

      <div className="staff-card mb-4">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table staff-table mb-0">
              <thead>
                <tr>
                  <th>Full name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Failed attempts</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-4 text-muted-strong">Loading...</td></tr>
                ) : staff.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-muted-strong">No staff accounts.</td></tr>
                ) : staff.map(s => (
                  <tr key={s.EmployeeId}>
                    <td className="fw-semibold">{s.FullName}</td>
                    <td><code>{s.Username}</code></td>
                    <td><span className="badge badge-soft">{s.Role}</span></td>
                    <td className="small text-muted-strong">{fmtDateShort(s.CreatedAt)}</td>
                    <td>{s.FailedLoginCount}</td>
                    <td>
                      {isLocked(s)
                        ? <span className="status-pill status-pending">Locked until {fmtDate(s.LockedUntil)}</span>
                        : <span className="status-pill status-submitted">Active</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="staff-card">
        <div className="card-body p-3">
          <h6 className="mb-2" style={{ color: 'var(--staff-ink)' }}>
            <i className="bi bi-info-circle me-1" style={{ color: 'var(--staff-primary)' }} />
            Static login policy
          </h6>
          <p className="small text-muted-strong mb-0">
            Staff accounts are seeded by an administrator script (<code>backend/db/seed.js</code>) and stored with bcrypt-hashed passwords.
            The application exposes <strong>no</strong> registration endpoint for the Employees table &mdash; new operators can only be added
            by a database administrator. This satisfies the static-login requirement and prevents privilege escalation through the public API.
          </p>
        </div>
      </div>
    </>
  );
}
