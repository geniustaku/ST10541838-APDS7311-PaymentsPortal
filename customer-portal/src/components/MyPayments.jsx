import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import api from '../api.js';

// Customer's own transaction list. Scoped server-side by the JWT cookie's customerId
// (see backend/controllers/transactionController.js -> listMine).
// Parent calls ref.refresh() after a successful new payment.
const MyPayments = forwardRef(function MyPayments(_, ref) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/transactions/mine');
      setItems(res.data.transactions || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useImperativeHandle(ref, () => ({ refresh: load }));

  function statusBadge(status) {
    const map = {
      pending:  'bg-warning text-dark',
      verified: 'bg-info text-dark',
      submitted: 'bg-success'
    };
    return <span className={`badge ${map[status] || 'bg-secondary'}`}>{status}</span>;
  }

  function fmtDate(d) {
    return new Date(d).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
  }

  return (
    <div className="card shadow-sm border-0 mt-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 fw-bold"><i className="bi bi-clock-history me-2 text-primary" />My payments</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1" />Refresh
          </button>
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        {loading ? (
          <div className="text-center py-3"><div className="spinner-border spinner-border-sm" /></div>
        ) : items.length === 0 ? (
          <p className="text-muted small mb-0">No payments yet. Submit one above and it will appear here.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Ref</th>
                  <th>Amount</th>
                  <th>Payee</th>
                  <th>SWIFT</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map(t => (
                  <tr key={t.TransactionId}>
                    <td className="fw-semibold">#{t.TransactionId}</td>
                    <td>{t.Amount} {t.Currency}</td>
                    <td>{t.PayeeAccount}</td>
                    <td><code className="small">{t.SwiftCode}</code></td>
                    <td>{statusBadge(t.Status)}</td>
                    <td className="text-muted small">{fmtDate(t.CreatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});

export default MyPayments;
