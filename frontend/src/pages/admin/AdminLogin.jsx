// src/pages/admin/AdminLogin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminLogin } from '../../services/adminService';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, isAuthenticated } = useAdminAuth();

  const [form, setForm]     = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServer] = useState('');
  const [sessionMsg, setSession] = useState('');
  const [showPw, setShowPw]      = useState(false);
  const [loading, setLoading]    = useState(false);

  useEffect(() => { if (isAuthenticated) navigate('/admin', { replace: true }); }, [isAuthenticated, navigate]);
  useEffect(() => { if (params.get('reason') === 'session_expired') setSession('Admin session expired. Please sign in again.'); }, [params]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    if (serverError)  setServer('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.username.trim()) errs.username = 'Required';
    if (!form.password)        errs.password = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await adminLogin(form);
      if (res.success) { login(res.data); navigate('/admin', { replace: true }); }
    } catch (err) {
      setServer(err.response?.data?.message || 'Invalid admin credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="auth-card" style={{ maxWidth: 380 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: 'var(--sidebar-bg)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 16px' }}>🛡️</div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 6 }}>Admin Panel</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>PrintMixBox administration access</p>
        </div>

        {sessionMsg  && <div className="alert alert-info">{sessionMsg}</div>}
        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Admin Username</label>
            <input type="text" name="username"
              className={`form-input ${errors.username ? 'error' : ''}`}
              placeholder="superadmin"
              value={form.username} onChange={onChange}
              autoComplete="username" autoFocus
            />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter admin password"
                value={form.password} onChange={onChange}
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: 14 }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-bg)' }}
          >
            {loading ? <><span className="btn-spinner" />Signing in...</> : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '12px 14px', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
            Default credentials: <code style={{ fontFamily: 'var(--font-mono)' }}>superadmin</code> / <code style={{ fontFamily: 'var(--font-mono)' }}>Admin@1234</code><br />
            Run <code style={{ fontFamily: 'var(--font-mono)' }}>npm run seed:admin</code> to create the account.
          </p>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
          <a href="/login" style={{ color: 'var(--color-text-tertiary)' }}>← Back to company login</a>
        </div>
      </div>
    </div>
  );
}