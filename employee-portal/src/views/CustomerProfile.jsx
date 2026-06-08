import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import TransactionDetails from '../components/TransactionDetails.jsx';
import { fmtDate, statusPill } from './util.js';

export default function CustomerProfile({ customerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('transactions');
  const [active, setActive] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/transactions/customers/${customerId}`);
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    if (!data) return null;
    const totalByCurrency = {};
    let last = null;
    for (const t of data.transactions) {
      const k = t.Currency;
      totalByCurrency[k] = (totalByCurrency[k] || 0) + parseFloat(t.Amount);
      const created = new Date(t.CreatedAt);
      if (!last || created > last) last = created;
    }
    return {
      count: data.transactions.length,
      totals: totalByCurrency,
      lastActivity: last
    };
  }, [data]);

  if (loading) return <p className="text-muted-strong">Loading customer...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return null;

  const c = data.customer;
  const locked = c.LockedUntil && new Date(c.LockedUntil) > new Date();

  return (
    <>
      <div className="mb-3">
        <Link to="/dashboard?view=customers" className="small text-decoration-none">
          <i className="bi bi-arrow-left me-1" />Back to customers
        </Link>
      </div>

      <div className="profile-header">
        <div className="d-flex align-items-start gap-3">
          <div style={{ flex: 1 }}>
            <h2 className="profile-name">{c.FullName}</h2>
            <div className="profile-meta">
              Account <code style={{ color: '#ffffff' }}>{c.AccountNumber}</code>
              &middot; ID <code style={{ color: '#ffffff' }}>{c.IdNumber}</code>
            </div>
            <div className="profile-meta small mt-1">
              Registered {fmtDate(c.CreatedAt)}
            </div>
          </div>
          <div>
            {locked
              ? <span className="status-pill status-pending">Locked until {fmtDate(c.LockedUntil)}</span>
              : <span className="status-pill status-submitted">Active</span>}
          </div>
        </div>

        <div className="row g-2 mt-3">
          <div className="col-md-3"><div className="profile-stat"><div className="label">Transactions</div><div className="value">{stats.count}</div></div></div>
          {Object.entries(stats.totals).map(([cur, total]) => (
            <div key={cur} className="col-md-3">
              <div className="profile-stat">
                <div className="label">Total {cur}</div>
                <div className="value">{total.toFixed(2)}</div>
              </div>
            </div>
          ))}
          <div className="col-md-3">
            <div className="profile-stat">
              <div className="label">Last activity</div>
              <div className="value">{stats.lastActivity ? stats.lastActivity.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }) : '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="staff-card mb-4">
        <div className="card-body p-3">
          <h6 className="mb-2" style={{ color: 'var(--staff-ink)' }}>Security state</h6>
          <div className="row g-3">
            <div className="col-md-4 small">
              <div className="text-muted-strong">Failed login attempts</div>
              <div className="fw-semibold">{c.FailedLoginCount}</div>
            </div>
            <div className="col-md-4 small">
              <div className="text-muted-strong">Locked until</div>
              <div className="fw-semibold">{c.LockedUntil ? fmtDate(c.LockedUntil) : '—'}</div>
            </div>
            <div className="col-md-4 small">
              <div className="text-muted-strong">Account active</div>
              <div className="fw-semibold">{locked ? 'No' : 'Yes'}</div>
            </div>
          </div>
        </div>
      </div>

      <ul className="nav nav-tabs staff-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'transactions' ? 'active' : ''}`} onClick={() => setTab('transactions')}>
            Transactions <span className="badge badge-soft ms-1">{data.transactions.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'activity' ? 'active' : ''}`} onClick={() => setTab('activity')}>
            Activity <span className="badge badge-soft ms-1">{data.audit.length}</span>
          </button>
        </li>
      </ul>

      {tab === 'transactions' && (
        <div className="staff-card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table staff-table mb-0">
                <thead>
                  <tr><th>#</th><th>Amount</th><th>Payee</th><th>SWIFT</th><th>Status</th><th>Created</th></tr>
                </thead>
                <tbody>
                  {data.transactions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-4 text-muted-strong">No transactions yet.</td></tr>
                  ) : data.transactions.map(tx => (
                    <tr key={tx.TransactionId} className="row-clickable" onClick={() => setActive({ ...tx, FullName: c.FullName, AccountNumber: c.AccountNumber })}>
                      <td className="fw-semibold">#{tx.TransactionId}</td>
                      <td>{tx.Amount} {tx.Currency}</td>
                      <td><code>{tx.PayeeAccount}</code></td>
                      <td><code>{tx.SwiftCode}</code></td>
                      <td><span className={statusPill(tx.Status)}>{tx.Status}</span></td>
                      <td className="small text-muted-strong">{fmtDate(tx.CreatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className="staff-card">
          <div className="card-body p-3">
            {data.audit.length === 0 ? (
              <p className="small mb-0 text-muted-strong">No activity recorded.</p>
            ) : data.audit.map(a => (
              <div key={a.AuditId} className="audit-row d-flex align-items-center">
                <div className="flex-grow-1">
                  <span className="audit-action">{a.Action}</span>
                  {a.Notes && <span className="small ms-2 text-muted-strong">— {a.Notes}</span>}
                  {a.IpAddress && <span className="small ms-2 text-muted-strong">&middot; {a.IpAddress}</span>}
                </div>
                <div className="audit-time">{fmtDate(a.CreatedAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TransactionDetails tx={active} onClose={() => setActive(null)} onChanged={load} />
    </>
  );
}
