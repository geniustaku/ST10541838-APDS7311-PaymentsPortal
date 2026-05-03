import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { patterns, messages } from '../patterns.js';

const initial = { fullName: '', idNumber: '', accountNumber: '', password: '', confirm: '' };

export default function Register() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    const errs = {};
    ['fullName', 'idNumber', 'accountNumber', 'password'].forEach(f => {
      if (!patterns[f].test(form[f] || '')) errs[f] = messages[f];
    });
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
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
      await api.post('/api/auth/register', {
        fullName:      form.fullName,
        idNumber:      form.idNumber,
        accountNumber: form.accountNumber,
        password:      form.password
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setServerError(err?.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h3 className="mb-1 fw-bold"><i className="bi bi-person-plus me-2 text-primary" />Create your account</h3>
            <p className="text-muted small mb-4">Register to send international payments.</p>

            {serverError && <div className="alert alert-danger py-2 small">{serverError}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <Field label="Full name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} />
              <Field label="ID number" name="idNumber" value={form.idNumber} onChange={handleChange} error={errors.idNumber} maxLength={13} />
              <Field label="Account number" name="accountNumber" value={form.accountNumber} onChange={handleChange} error={errors.accountNumber} maxLength={12} />
              <Field label="Password" type="password" name="password" value={form.password} onChange={handleChange} error={errors.password} />
              <Field label="Confirm password" type="password" name="confirm" value={form.confirm} onChange={handleChange} error={errors.confirm} />

              <button type="submit" className="btn btn-primary w-100 mt-2" disabled={submitting}>
                {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-check-circle me-2" />}
                Register
              </button>
            </form>

            <p className="text-center small text-muted mt-3 mb-0">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, error, type = 'text', maxLength }) {
  return (
    <div className="mb-3">
      <label className="form-label small fw-semibold">{label}</label>
      <input
        type={type}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        autoComplete="off"
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
