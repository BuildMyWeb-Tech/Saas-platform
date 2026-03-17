// src/pages/Login.jsx
// ─────────────────────────────────────────────
//  Login Page
//  Company Code + Username + Password
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    companyCode: '',
    username: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Session expired message
  useEffect(() => {
    if (searchParams.get('reason') === 'session_expired') {
      setSessionMessage('Your session expired. Please log in again.');
    }
  }, [searchParams]);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    if (serverError) setServerError('');
  };

  const validate = () => {
    const errors = {};
    if (!form.companyCode.trim()) errors.companyCode = 'Company code is required';
    if (!form.username.trim()) errors.username = 'Username is required';
    if (!form.password) errors.password = 'Password is required';
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
      const result = await loginUser({
        companyCode: form.companyCode.trim().toUpperCase(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
      });

      if (result.success) {
        login(result.data);
        navigate(from, { replace: true });
      }
    } catch (err) {
      const data = err.response?.data;

      if (data?.action === 'VERIFY_REQUIRED') {
        setServerError('');
        navigate(`/verify?code=${data.companyCode}`);
        return;
      }

      setServerError(data?.message || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Panel */}
      <div className="auth-panel-left">
        <div className="grid-bg" />

        <div className="panel-brand">
          <div className="panel-brand-logo">
            <div className="auth-logo-icon">🖨️</div>
            <span className="panel-brand-name">PrintMixBox</span>
          </div>

          <h2 className="panel-headline">
            Your printing<br />command <em>center</em>
          </h2>
          <p className="panel-description">
            Log in to manage your IoT printers, dispatch
            branding jobs, and monitor your entire fleet in
            real-time.
          </p>
        </div>

        <div className="panel-features">
          {[
            { icon: '🔐', title: 'Company-Isolated Access', desc: 'Secure per-tenant workspace' },
            { icon: '⚡', title: 'Real-Time Job Queue', desc: 'Instant print dispatching' },
            { icon: '🌐', title: 'Multi-Device Support', desc: 'Any printer, anywhere' },
            { icon: '📦', title: 'Box Branding Engine', desc: 'Pixel-perfect brand output' },
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

      {/* Right: Login Form */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-logo">
              <div className="auth-logo-icon">🖨️</div>
              <span className="auth-logo-text">PrintMixBox</span>
            </div>
            <h1 className="auth-title">Sign in</h1>
            <p className="auth-subtitle">// Access your company dashboard</p>
          </div>

          {/* Session expired notice */}
          {sessionMessage && (
            <div className="alert alert-info">
              🕐 {sessionMessage}
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <div className="alert alert-error">⚠ {serverError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Company Code */}
            <div className="form-group">
              <label className="form-label">Company Code</label>
              <input
                type="text"
                name="companyCode"
                className={`form-input form-input-mono ${fieldErrors.companyCode ? 'error' : ''}`}
                placeholder="COMP-4829"
                value={form.companyCode}
                onChange={(e) => handleChange({
                  target: { name: 'companyCode', value: e.target.value.toUpperCase() }
                })}
                maxLength={9}
                autoComplete="off"
                autoFocus
              />
              {fieldErrors.companyCode && (
                <div className="form-error">⚠ {fieldErrors.companyCode}</div>
              )}
            </div>

            {/* Username */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className={`form-input ${fieldErrors.username ? 'error' : ''}`}
                placeholder="your_username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
              {fieldErrors.username && (
                <div className="form-error">⚠ {fieldErrors.username}</div>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="form-error">⚠ {fieldErrors.password}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner" />
                  Signing in...
                </>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span className="auth-divider-text">new here?</span>
          </div>

          <Link to="/register" className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>
            Register your company
          </Link>

          <div className="auth-footer">
            Need to verify?{' '}
            <Link to="/verify" className="auth-link">Verify account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
