import { useState } from 'react';
import api from '../api.js';
import { patterns, messages } from '../patterns.js';
import { fmtDate, statusPill } from '../views/util.js';

export default function TransactionDetails({ tx, onClose, onChanged }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!tx) return null;

  async function handleVerify() {
    if (note && !patterns.note.test(note)) {
      setError(messages.note);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.patch(`/api/transactions/${tx.TransactionId}/verify`, { note: note || null });
      onChanged && onChanged();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Verification failed');
    } finally {
      setBusy(false);
    }
  }

  const status = tx.Status;

  const timeline = [
    { key: 'created',   label: 'Created',   when: tx.CreatedAt,   done: true },
    { key: 'verified',  label: 'Verified',  when: tx.VerifiedAt,  done: !!tx.VerifiedAt, by: tx.VerifiedByUsername },
    { key: 'submitted', label: 'Submitted', when: tx.SubmittedAt, done: !!tx.SubmittedAt }
  ];

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(15, 23, 42, 0.45)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content" style={{ borderRadius: 14, border: '1px solid var(--staff-border)' }}>
          <div className="modal-header">
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="modal-title mb-0">Transaction #{tx.TransactionId}</h5>
                <span className={statusPill(status)}>{status}</span>
              </div>
              <div className="small mt-1 text-muted-strong">
                Created {fmtDate(tx.CreatedAt)}
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <div className="row g-3">
              <div className="col-md-6">
                <div className="detail-block">
                  <div className="detail-title">Customer</div>
                  <div className="detail-line"><strong>{tx.FullName || '—'}</strong></div>
                  <div className="detail-line text-muted-strong small">
                    Account <code>{tx.AccountNumber || '—'}</code>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="detail-block">
                  <div className="detail-title">Payment</div>
                  <div className="detail-line"><strong>{tx.Amount} {tx.Currency}</strong></div>
                  <div className="detail-line text-muted-strong small">
                    To <code>{tx.PayeeAccount}</code> &middot; SWIFT <code>{tx.SwiftCode}</code> &middot; via {tx.Provider}
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="detail-block">
                  <div className="detail-title">Verification</div>
                  {tx.VerifiedBy ? (
                    <>
                      <div className="detail-line">
                        Verified by <strong>{tx.VerifiedByUsername}</strong> on {fmtDate(tx.VerifiedAt)}
                      </div>
                      {tx.VerificationNotes && (
                        <div className="detail-line small text-muted-strong mt-1">
                          Note: {tx.VerificationNotes}
                        </div>
                      )}
                    </>
                  ) : status === 'pending' ? (
                    <>
                      <div className="detail-line text-muted-strong small mb-2">
                        Confirm payee account and SWIFT code match the customer's instruction, then approve below.
                      </div>
                      <label className="form-label small">Verification note (optional)</label>
                      <textarea
                        rows={3}
                        className="form-control"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        maxLength={500}
                        placeholder="e.g. KYC checked, payee account confirmed against customer record"
                      />
                    </>
                  ) : (
                    <div className="detail-line text-muted-strong small">Awaiting review</div>
                  )}
                </div>
              </div>

              <div className="col-12">
                <div className="detail-block">
                  <div className="detail-title">Timeline</div>
                  <div className="tx-timeline">
                    {timeline.map((step, i) => (
                      <div key={step.key} className={`tx-step ${step.done ? 'tx-step-done' : ''}`}>
                        <div className="tx-dot" />
                        {i < timeline.length - 1 && <div className="tx-bar" />}
                        <div className="tx-step-content">
                          <div className="tx-step-label">{step.label}</div>
                          <div className="tx-step-when small text-muted-strong">
                            {step.when ? fmtDate(step.when) : '—'}
                            {step.by && <> &middot; by <strong>{step.by}</strong></>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>
            {status === 'pending' && (
              <button type="button" className="btn btn-primary" onClick={handleVerify} disabled={busy}>
                {busy
                  ? <span><span className="spinner-border spinner-border-sm me-2" />Verifying</span>
                  : <span><i className="bi bi-check2-square me-1" />Mark verified</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
