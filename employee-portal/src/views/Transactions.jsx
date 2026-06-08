import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api.js';
import TransactionDetails from '../components/TransactionDetails.jsx';
import { fmtDate, statusPill } from './util.js';

const TITLES = {
  pending:   { title: 'Pending review',  blurb: 'Payments waiting for verification before being dispatched.' },
  verified:  { title: 'Verified',        blurb: 'Verified payments queued for the next SWIFT batch.' },
  submitted: { title: 'Submitted',       blurb: 'Payments already sent to the SWIFT network.' }
};

export default function Transactions({ status }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [active, setActive] = useState(null);
  const [submitBusy, setSubmitBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/transactions?status=${status}`);
      setItems(res.data.transactions || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const meta = TITLES[status];

  const verifiedCount = useMemo(() => items.length, [items]);

  async function submitAllVerified() {
    if (!confirm('Submit all verified transactions to SWIFT?')) return;
    setSubmitBusy(true);
    setInfo('');
    try {
      const res = await api.post('/api/transactions/submit');
      setInfo(`${res.data.count} transaction${res.data.count === 1 ? '' : 's'} submitted to SWIFT.`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Submit failed');
    } finally {
      setSubmitBusy(false);
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h3 className="mb-1" style={{ color: 'var(--staff-ink)' }}>{meta.title}</h3>
          <p className="mb-0 small text-muted-strong">{meta.blurb}</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1" />Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {info  && <div className="alert alert-success py-2 small">{info}</div>}

      <div className="staff-card">
        <div className="card-body p-0">
          {status === 'verified' && verifiedCount > 0 && (
            <div className="d-flex justify-content-end px-3 pt-3">
              <button className="btn btn-success btn-sm" onClick={submitAllVerified} disabled={submitBusy}>
                {submitBusy
                  ? <span><span className="spinner-border spinner-border-sm me-2" />Submitting</span>
                  : <span><i className="bi bi-send-fill me-1" />Submit to SWIFT</span>}
              </button>
            </div>
          )}

          <div className="table-responsive">
            <table className="table staff-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>From account</th>
                  <th>Amount</th>
                  <th>Payee</th>
                  <th>SWIFT</th>
                  <th>{status === 'pending' ? 'Created' : status === 'verified' ? 'Verified' : 'Submitted'}</th>
                  {status !== 'pending' && <th>Verifier</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-4 text-muted-strong">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-4 text-muted-strong">No transactions in this state.</td></tr>
                ) : items.map(tx => (
                  <tr key={tx.TransactionId} className="row-clickable" onClick={() => setActive(tx)}>
                    <td className="fw-semibold">#{tx.TransactionId}</td>
                    <td>{tx.FullName}</td>
                    <td><code>{tx.AccountNumber}</code></td>
                    <td>{tx.Amount} {tx.Currency}</td>
                    <td><code>{tx.PayeeAccount}</code></td>
                    <td><code>{tx.SwiftCode}</code></td>
                    <td className="small text-muted-strong">
                      {status === 'pending'   && fmtDate(tx.CreatedAt)}
                      {status === 'verified'  && fmtDate(tx.VerifiedAt)}
                      {status === 'submitted' && fmtDate(tx.SubmittedAt)}
                    </td>
                    {status !== 'pending' && <td>{tx.VerifiedByUsername || '—'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TransactionDetails tx={active} onClose={() => setActive(null)} onChanged={load} />
    </>
  );
}
