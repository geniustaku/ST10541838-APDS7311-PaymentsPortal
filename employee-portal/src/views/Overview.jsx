import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { fmtDate, statusPill } from './util.js';

export default function Overview() {
  const [data, setData] = useState({ transactions: [], audit: [], customers: [], employees: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/api/transactions'),
      api.get('/api/transactions/audit/recent'),
      api.get('/api/transactions/customers'),
      api.get('/api/transactions/employees')
    ]).then(([tx, au, c, e]) => {
      if (cancelled) return;
      setData({
        transactions: tx.data.transactions || [],
        audit: au.data.entries || [],
        customers: c.data.customers || [],
        employees: e.data.employees || []
      });
    }).catch(err => {
      if (!cancelled) setError(err?.response?.data?.error || 'Failed to load overview');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const counts = data.transactions.reduce(
    (acc, t) => { if (acc[t.Status] !== undefined) acc[t.Status] += 1; return acc; },
    { pending: 0, verified: 0, submitted: 0 }
  );

  const recentTransactions = data.transactions.slice(0, 6);
  const recentAudit = data.audit.slice(0, 8);

  return (
    <>
      <div className="mb-4">
        <h3 className="mb-1" style={{ color: 'var(--staff-ink)' }}>Operations overview</h3>
        <p className="mb-0 small text-muted-strong">Snapshot of payments, customers and operator activity.</p>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-3"><KPI label="Customers" value={data.customers.length} icon="bi-people" /></div>
        <div className="col-md-3"><KPI label="Pending" value={counts.pending} icon="bi-hourglass-split" tone="amber" /></div>
        <div className="col-md-3"><KPI label="Verified" value={counts.verified} icon="bi-shield-check" /></div>
        <div className="col-md-3"><KPI label="Submitted" value={counts.submitted} icon="bi-send-check" tone="green" /></div>
      </div>

      <div className="row g-3">
        <div className="col-lg-7">
          <div className="staff-card">
            <div className="card-body p-3">
              <div className="d-flex align-items-center mb-2">
                <h6 className="mb-0" style={{ color: 'var(--staff-ink)' }}>Recent transactions</h6>
                <Link className="ms-auto small" to="/dashboard?view=pending">Open queue &rarr;</Link>
              </div>
              {loading ? (
                <p className="small mb-0 text-muted-strong">Loading...</p>
              ) : recentTransactions.length === 0 ? (
                <p className="small mb-0 text-muted-strong">No transactions yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table staff-table mb-0">
                    <thead>
                      <tr><th>#</th><th>Customer</th><th>Amount</th><th>Status</th><th>Created</th></tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map(t => (
                        <tr key={t.TransactionId}>
                          <td className="fw-semibold">#{t.TransactionId}</td>
                          <td>{t.FullName}</td>
                          <td>{t.Amount} {t.Currency}</td>
                          <td><span className={statusPill(t.Status)}>{t.Status}</span></td>
                          <td className="small text-muted-strong">{fmtDate(t.CreatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="staff-card">
            <div className="card-body p-3">
              <div className="d-flex align-items-center mb-2">
                <h6 className="mb-0" style={{ color: 'var(--staff-ink)' }}>Recent activity</h6>
                <Link className="ms-auto small" to="/dashboard?view=activity">Full log &rarr;</Link>
              </div>
              {loading ? (
                <p className="small mb-0 text-muted-strong">Loading...</p>
              ) : recentAudit.length === 0 ? (
                <p className="small mb-0 text-muted-strong">No activity yet.</p>
              ) : recentAudit.map(a => (
                <div key={a.AuditId} className="audit-row d-flex align-items-center">
                  <div className="flex-grow-1">
                    <span className="audit-actor me-2">{a.Actor}</span>
                    <span className="audit-action">{a.Action}</span>
                  </div>
                  <div className="audit-time">{fmtDate(a.CreatedAt)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function KPI({ label, value, icon, tone }) {
  const cls = `kpi-card ${tone === 'amber' ? 'kpi-amber' : tone === 'green' ? 'kpi-green' : ''}`;
  return (
    <div className={cls}>
      <div className="d-flex align-items-center">
        <div className="flex-grow-1">
          <div className="kpi-label">{label}</div>
          <div className="kpi-value">{value}</div>
        </div>
        <i className={`bi ${icon}`} style={{ fontSize: 28, color: 'var(--staff-primary)' }} />
      </div>
    </div>
  );
}
