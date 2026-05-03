import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api.js';
import { patterns, messages } from '../patterns.js';
import { useAuth } from '../App.jsx';

export default function Login() {
  const [form, setForm] = useState({ accountNumber: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    const errs = {};
    if (!patterns.accountNumber.test(form.accountNumber || '')) errs.accountNumber = messages.accountNumber;
    if (!patterns.password.test(form.password || '')) errs.password = messages.password;
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await api.post('/api/auth/login', form);
      setUser(res.data.user);
      navigate('/payment');
    } catch (err) {
      setServerError(err?.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-5 col-lg-4">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h3 className="mb-1 fw-bold"><i className="bi bi-box-arrow-in-right me-2 text-primary" />Log in</h3>
            <p className="text-muted small mb-4">Enter your account number and password.</p>

            {location.state?.registered && (
              <div className="alert alert-success py-2 small">
                <i className="bi bi-check-circle me-1" />Account created. Please log in.
              </div>
            )}
            {serverError && <div className="alert alert-danger py-2 small">{serverError}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Account number</label>
                <input
                  type="text"
                  className={`form-control ${errors.accountNumber ? 'is-invalid' : ''}`}
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  maxLength={12}
                  autoComplete="off"
                />
                {errors.accountNumber && <div className="invalid-feedback">{errors.accountNumber}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              <button type="submit" className="btn btn-primary w-100 mt-2" disabled={submitting}>
                {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-shield-check me-2" />}
                Log in
              </button>
            </form>

            <p className="text-center small text-muted mt-3 mb-0">
              No account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
