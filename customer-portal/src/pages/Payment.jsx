import { useRef, useState } from 'react';
import api from '../api.js';
import { patterns, messages } from '../patterns.js';
import { useAuth } from '../App.jsx';
import MyPayments from '../components/MyPayments.jsx';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'AUD'];

const initial = {
  amount: '',
  currency: 'USD',
  provider: 'SWIFT',
  payeeAccount: '',
  swiftCode: ''
};

export default function Payment() {
  const { user } = useAuth();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const myPaymentsRef = useRef(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    const errs = {};
    ['amount', 'currency', 'provider', 'payeeAccount', 'swiftCode'].forEach(f => {
      if (!patterns[f].test(form[f] || '')) errs[f] = messages[f];
    });
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    setSuccess(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await api.post('/api/transactions', form);
      setSuccess(res.data.transaction);
      setForm(initial);
      // Refresh the customer's transaction list with the newly created payment.
      myPaymentsRef.current?.refresh();
    } catch (err) {
      setServerError(err?.response?.data?.error || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-7">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h3 className="mb-1 fw-bold"><i className="bi bi-bank me-2 text-primary" />New international payment</h3>
            <p className="text-muted small mb-4">
              Paying from account <strong>{user?.accountNumber}</strong>
            </p>

            {serverError && <div className="alert alert-danger py-2 small">{serverError}</div>}
            {success && (
              <div className="alert alert-success">
                <div className="fw-semibold mb-1"><i className="bi bi-check-circle me-1" />Payment submitted</div>
                <div className="small">
                  Reference: <strong>#{success.transactionId}</strong> &middot;{' '}
                  {success.amount} {success.currency} via {success.provider} to {success.payeeAccount} ({success.swiftCode})
                </div>
                <div className="small text-muted mt-1">Status: {success.status}. Bank staff will verify and submit to SWIFT.</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">Amount</label>
                  <input
                    type="text"
                    name="amount"
                    className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="e.g. 1500.00"
                  />
                  {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
                </div>

                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">Currency</label>
                  <select
                    name="currency"
                    className={`form-select ${errors.currency ? 'is-invalid' : ''}`}
                    value={form.currency}
                    onChange={handleChange}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.currency && <div className="invalid-feedback">{errors.currency}</div>}
                </div>

                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">Provider</label>
                  <select
                    name="provider"
                    className={`form-select ${errors.provider ? 'is-invalid' : ''}`}
                    value={form.provider}
                    onChange={handleChange}
                  >
                    <option value="SWIFT">SWIFT</option>
                  </select>
                </div>

                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">Payee account</label>
                  <input
                    type="text"
                    name="payeeAccount"
                    className={`form-control ${errors.payeeAccount ? 'is-invalid' : ''}`}
                    value={form.payeeAccount}
                    onChange={handleChange}
                    maxLength={12}
                  />
                  {errors.payeeAccount && <div className="invalid-feedback">{errors.payeeAccount}</div>}
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold">SWIFT code</label>
                  <input
                    type="text"
                    name="swiftCode"
                    className={`form-control text-uppercase ${errors.swiftCode ? 'is-invalid' : ''}`}
                    value={form.swiftCode}
                    onChange={e => setForm({ ...form, swiftCode: e.target.value.toUpperCase() })}
                    maxLength={11}
                    placeholder="e.g. ABSAZAJJ"
                  />
                  {errors.swiftCode && <div className="invalid-feedback">{errors.swiftCode}</div>}
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 mt-4" disabled={submitting}>
                {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-send-check me-2" />}
                Pay Now
              </button>
            </form>
          </div>
        </div>

        <MyPayments ref={myPaymentsRef} />

        <p className="text-muted text-center small mt-3">
          <i className="bi bi-shield-lock me-1" />
          All traffic is encrypted. Your session is protected with an HttpOnly cookie.
        </p>
      </div>
    </div>
  );
}
