import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { patterns, messages } from '../patterns.js';
import { useAuth } from '../App.jsx';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    const errs = {};
    if (!patterns.username.test(form.username || '')) errs.username = messages.username;
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
      const res = await api.post('/api/auth/employee/login', form);
      setUser(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      if (err?.response?.status === 423) {
        setServerError('This account is temporarily locked due to repeated failed attempts. Try again later.');
      } else {
        setServerError(err?.response?.data?.error || 'Login failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="row w-100 justify-content-center">
        <div className="col-md-5 col-lg-4">
          <div className="login-card p-4">
            <div className="text-center mb-4">
              <div className="login-bar mb-3" />
              <i className="bi bi-shield-lock-fill" style={{ fontSize: 36, color: 'var(--staff-primary)' }} />
              <h4 className="mt-2 mb-1" style={{ color: 'var(--staff-ink)' }}>Staff sign in</h4>
              <p className="small mb-0" style={{ color: 'var(--staff-muted)' }}>Authorised personnel only</p>
            </div>

            {serverError && (
              <div className="alert alert-danger py-2 small">{serverError}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label small" style={{ color: 'var(--staff-ink-soft)' }}>Username</label>
                <input
                  type="text"
                  name="username"
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  maxLength={20}
                />
                {errors.username && <div className="invalid-feedback">{errors.username}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label small" style={{ color: 'var(--staff-ink-soft)' }}>Password</label>
                <input
                  type="password"
                  name="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                {submitting ? (
                  <span><span className="spinner-border spinner-border-sm me-2" />Verifying...</span>
                ) : (
                  <span><i className="bi bi-box-arrow-in-right me-1" />Sign in</span>
                )}
              </button>
            </form>

            <p className="text-center small mt-3 mb-0" style={{ color: 'var(--staff-muted)' }}>
              No registration. Accounts are pre-issued.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
