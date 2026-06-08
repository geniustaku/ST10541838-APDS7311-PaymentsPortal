import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { fmtDateShort } from './util.js';

export default function CustomersList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  function open(c) {
    navigate(`/dashboard?view=customers&id=${c.CustomerId}`);
  }

  useEffect(() => {
    let cancelled = false;
    api.get('/api/transactions/customers')
      .then(res => { if (!cancelled) setCustomers(res.data.customers || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = filter
    ? customers.filter(c =>
        c.FullName.toLowerCase().includes(filter.toLowerCase()) ||
        c.AccountNumber.includes(filter) ||
        (c.IdNumber || '').includes(filter))
    : customers;

  function isLocked(c) {
    return c.LockedUntil && new Date(c.LockedUntil) > new Date();
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h3 className="mb-1" style={{ color: 'var(--staff-ink)' }}>Customers</h3>
          <p className="mb-0 small text-muted-strong">Registered customer accounts. Click a row to view profile and transactions.</p>
        </div>
        <input
          type="search"
          className="form-control form-control-sm"
          style={{ maxWidth: 280 }}
          placeholder="Search name, account, ID..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      <div className="staff-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table staff-table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Account number</th>
                  <th>ID number</th>
                  <th>Registered</th>
                  <th>Transactions</th>
                  <th>Status</th>
                  <th className="text-end">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-4 text-muted-strong">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-4 text-muted-strong">No customers match.</td></tr>
                ) : filtered.map(c => (
                  <tr
                    key={c.CustomerId}
                    className="row-clickable"
                    onClick={() => open(c)}
                  >
                    <td className="fw-semibold" style={{ color: 'var(--staff-primary)' }}>{c.FullName}</td>
                    <td><code>{c.AccountNumber}</code></td>
                    <td><code>{c.IdNumber}</code></td>
                    <td className="small text-muted-strong">{fmtDateShort(c.CreatedAt)}</td>
                    <td>{c.TransactionCount}</td>
                    <td>
                      {isLocked(c)
                        ? <span className="status-pill status-pending">Locked</span>
                        : <span className="status-pill status-submitted">Active</span>}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={(e) => { e.stopPropagation(); open(c); }}
                      >
                        Open <i className="bi bi-arrow-right ms-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
