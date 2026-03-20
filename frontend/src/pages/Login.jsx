// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params]  = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm]     = useState({ companyCode: '', username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServer] = useState('');
  const [sessionMsg, setSession] = useState('');
  const [showPw, setShowPw]      = useState(false);
  const [loading, setLoading]    = useState(false);
  const [pendingMsg, setPending]  = useState('');

  useEffect(() => { if (isAuthenticated) navigate('/dashboard', { replace: true }); }, [isAuthenticated, navigate]);
  useEffect(() => { if (params.get('reason') === 'session_expired') setSession('Your session expired. Please sign in again.'); }, [params]);

  const from = location.state?.from?.pathname || '/dashboard';

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    if (serverError)  setServer('');
    setPending('');
  };

  const validate = () => {
    const e = {};
    if (!form.companyCode.trim()) e.companyCode = 'Required';
    if (!form.username.trim())    e.username    = 'Required';
    if (!form.password)           e.password    = 'Required';
    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServer(''); setPending('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await loginUser({
        companyCode: form.companyCode.trim().toUpperCase(),
        username:    form.username.trim().toLowerCase(),
        password:    form.password,
      });
      if (res.success) { login(res.data); navigate(from, { replace: true }); }
    } catch (err) {
      const d = err.response?.data;
      if (d?.status === 'pending')   { setPending(d.message); return; }
      if (d?.status === 'rejected')  { setServer(d.message); return; }
      setServer(d?.message || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-layout">
      {/* Left panel */}
      <div className="auth-panel-left">
        <div className="panel-brand">
          <div className="panel-brand-logo">
            <div className="auth-logo-icon" style={{ width: 28, height: 28, fontSize: 14 }}>🖨️</div>
            <span className="panel-brand-name">PrintMixBox</span>
          </div>
          <h2 className="panel-headline">Your printing<br /><em>command center</em></h2>
          <p className="panel-description">Sign in to manage IoT printers, dispatch branding jobs, and monitor your fleet in real-time.</p>
        </div>
        <div className="panel-features">
          {[
            { icon: '🔐', title: 'Company-isolated access',  desc: 'Secure per-tenant workspace with RBAC' },
            { icon: '⚡', title: 'Real-time job queue',      desc: 'Instant print dispatching and tracking' },
            { icon: '🌐', title: 'Multi-device support',     desc: 'Manage any printer from anywhere' },
            { icon: '📦', title: 'Box branding engine',      desc: 'Pixel-perfect brand output at scale' },
          ].map(f => (
            <div className="panel-feature" key={f.title}>
              <div className="panel-feature-icon">{f.icon}</div>
              <div className="panel-feature-text"><h4>{f.title}</h4><p>{f.desc}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🖨️</div>
            <span className="auth-logo-text">PrintMixBox</span>
          </div>
          <div className="auth-card-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in with your company credentials</p>
          </div>

          {sessionMsg  && <div className="alert alert-info">{sessionMsg}</div>}
          {pendingMsg  && (
            <div className="alert alert-warning">
              <span>⏳</span>
              <span>{pendingMsg}</span>
            </div>
          )}
          {serverError && <div className="alert alert-error">{serverError}</div>}

          <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Company Code</label>
              <input type="text" name="companyCode"
                className={`form-input form-input-mono ${errors.companyCode ? 'error' : ''}`}
                placeholder="COMP-4829"
                value={form.companyCode}
                onChange={e => onChange({ target: { name: 'companyCode', value: e.target.value.toUpperCase() } })}
                maxLength={9} autoComplete="off" autoFocus
              />
              {errors.companyCode
                ? <div className="form-error">{errors.companyCode}</div>
                : <div className="form-hint">Sent to you in the credentials email</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" name="username"
                className={`form-input ${errors.username ? 'error' : ''}`}
                placeholder="your_username"
                value={form.username} onChange={onChange}
                autoComplete="username"
              />
              {errors.username && <div className="form-error">{errors.username}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} name="password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={form.password} onChange={onChange}
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4, fontSize: 14, lineHeight: 1 }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="btn-spinner" />Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span className="auth-divider-text">new to printmixbox?</span></div>
          <Link to="/register" className="btn btn-ghost" style={{ width: '100%', marginTop: 0, height: 38, fontSize: 'var(--text-sm)' }}>
            Register your company
          </Link>

          <div className="auth-footer">
            Your credentials are emailed after admin approval.
          </div>
        </div>
      </div>
    </div>
  );
}