// src/pages/Register.jsx
// ─────────────────────────────────────────────
//  Company Registration Page
// ─────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCompany } from '../services/authService';

// ─── Password Strength Analyzer ───────────────────────────────────────────────
const getPasswordStrength = (pw) => {
  if (!pw) return { score: 0, label: '', level: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { score, label: 'Weak', level: 'weak' };
  if (score <= 3) return { score, label: 'Fair', level: 'fair' };
  return { score, label: 'Strong', level: 'strong' };
};

// ─── Left Panel ────────────────────────────────────────────────────────────────
const AuthLeftPanel = () => (
  <div className="auth-panel-left">
    <div className="grid-bg" />

    <div className="panel-brand">
      <div className="panel-brand-logo">
        <div className="auth-logo-icon">🖨️</div>
        <span className="panel-brand-name">PrintMixBox</span>
      </div>

      <h2 className="panel-headline">
        Smart printing<br />for <em>modern brands</em>
      </h2>
      <p className="panel-description">
        Connect your printers, manage box branding, and run
        print jobs — all from one IoT-powered platform.
      </p>
    </div>

    <div className="panel-features">
      {[
        { icon: '🏭', title: 'Multi-Company Support', desc: 'Isolated workspace per company' },
        { icon: '📡', title: 'IoT Printer Control', desc: 'Real-time device management' },
        { icon: '🎨', title: 'Brand Templates', desc: 'Logos, colors, box designs' },
        { icon: '📊', title: 'Job Queue Analytics', desc: 'Track every print job' },
      ].map((f) => (
        <div className="panel-feature" key={f.title}>
          <div className="panel-feature-icon">{f.icon}</div>
          <div className="panel-feature-text">
            <h4>{f.title}</h4>
            <p>{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Register Form ─────────────────────────────────────────────────────────────
const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: '',
    gstNumber: '',
    email: '',
    username: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const errors = {};
    if (!form.companyName.trim()) errors.companyName = 'Company name is required';
    if (!form.gstNumber.trim()) errors.gstNumber = 'GST number is required';
    else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber.toUpperCase()))
      errors.gstNumber = 'Invalid GST format (e.g. 27AAPFU0939F1ZV)';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Invalid email address';
    if (!form.username.trim()) errors.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) errors.username = 'Letters, numbers, underscores only (3–30 chars)';
    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 8) errors.password = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(form.password)) errors.password = 'Must include an uppercase letter';
    else if (!/[0-9]/.test(form.password)) errors.password = 'Must include a number';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerCompany({
        ...form,
        gstNumber: form.gstNumber.toUpperCase(),
      });

      if (result.success) {
        setSuccessData(result.data);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      const field = err.response?.data?.field;

      if (field) {
        setFieldErrors((prev) => ({ ...prev, [field]: message }));
      } else {
        setServerError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Success State ───────────────────────────────────────────────────────────
  if (successData) {
    return (
      <div className="auth-layout">
        <AuthLeftPanel />
        <div className="auth-panel-right">
          <div className="auth-card">
            <div className="auth-logo">
              <div className="auth-logo-icon">🖨️</div>
              <span className="auth-logo-text">PrintMixBox</span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Company Registered!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>
                A verification code was sent to
              </p>
              <p style={{ color: 'var(--teal)', fontSize: 14, fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                {successData.email}
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div className="code-display">
                <div className="code-label">YOUR COMPANY CODE</div>
                <div className="code-value">{successData.companyCode}</div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                Save this code — you'll need it to log in.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => navigate(`/verify?code=${successData.companyCode}`)}
            >
              Verify My Account →
            </button>

            <div className="auth-footer" style={{ marginTop: 16 }}>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Log in</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Registration Form ───────────────────────────────────────────────────────
  return (
    <div className="auth-layout">
      <AuthLeftPanel />

      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-logo">
              <div className="auth-logo-icon">🖨️</div>
              <span className="auth-logo-text">PrintMixBox</span>
            </div>
            <h1 className="auth-title">Register your company</h1>
            <p className="auth-subtitle">// Create a new workspace</p>
          </div>

          {serverError && (
            <div className="alert alert-error">⚠ {serverError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Company Name */}
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                name="companyName"
                className={`form-input ${fieldErrors.companyName ? 'error' : ''}`}
                placeholder="Acme Packaging Pvt. Ltd."
                value={form.companyName}
                onChange={handleChange}
                autoComplete="organization"
              />
              {fieldErrors.companyName && (
                <div className="form-error">⚠ {fieldErrors.companyName}</div>
              )}
            </div>

            {/* GST Number */}
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input
                type="text"
                name="gstNumber"
                className={`form-input form-input-mono ${fieldErrors.gstNumber ? 'error' : ''}`}
                placeholder="27AAPFU0939F1ZV"
                value={form.gstNumber}
                onChange={(e) => handleChange({ target: { name: 'gstNumber', value: e.target.value.toUpperCase() } })}
                maxLength={15}
                autoComplete="off"
              />
              {fieldErrors.gstNumber && (
                <div className="form-error">⚠ {fieldErrors.gstNumber}</div>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Company Email</label>
              <input
                type="email"
                name="email"
                className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                placeholder="hello@acme.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <div className="form-error">⚠ {fieldErrors.email}</div>
              )}
            </div>

            {/* Username + Password */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  className={`form-input ${fieldErrors.username ? 'error' : ''}`}
                  placeholder="admin_user"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                />
                {fieldErrors.username && (
                  <div className="form-error">⚠ {fieldErrors.username}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                  placeholder="Min 8 chars, 1 uppercase"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {fieldErrors.password && (
                  <div className="form-error">⚠ {fieldErrors.password}</div>
                )}
              </div>
            </div>

            {/* Password Strength */}
            {form.password && (
              <div className="password-strength" style={{ marginTop: -8, marginBottom: 16 }}>
                <div className="strength-bars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`strength-bar ${
                        n <= passwordStrength.score
                          ? `active-${passwordStrength.level}`
                          : ''
                      }`}
                    />
                  ))}
                </div>
                <span className="strength-label">
                  Password strength: {passwordStrength.label}
                </span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner" />
                  Registering...
                </>
              ) : (
                'Create Company Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already registered?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
            {' '}·{' '}
            <Link to="/verify" className="auth-link">Verify account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
