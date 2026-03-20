// src/pages/ChangePassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const getStrength = (pw) => {
  if (!pw) return { score: 0, label: '', level: '' };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 2) return { score: s, label: 'Weak',   level: 'weak' };
  if (s <= 3) return { score: s, label: 'Fair',   level: 'fair' };
  return             { score: s, label: 'Strong', level: 'strong' };
};

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, company, clearTempPassword } = useAuth();

  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServer] = useState('');
  const [loading, setLoading]    = useState(false);
  const [showCur, setShowCur]    = useState(false);
  const [showNew, setShowNew]    = useState(false);

  const strength = getStrength(form.newPassword);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    if (serverError)  setServer('');
  };

  const validate = () => {
    const e = {};
    if (!form.currentPassword)           e.currentPassword = 'Required';
    if (!form.newPassword)               e.newPassword = 'Required';
    else if (form.newPassword.length < 8)      e.newPassword = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(form.newPassword))  e.newPassword = 'Include at least one uppercase letter';
    else if (!/[0-9]/.test(form.newPassword))  e.newPassword = 'Include at least one number';
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServer('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      clearTempPassword();
      navigate('/dashboard');
    } catch (err) {
      setServer(err.response?.data?.message || 'Failed to change password.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🖨️</div>
          <span className="auth-logo-text">PrintMixBox</span>
        </div>

        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <span>⚠️</span>
          <span>You are using a temporary password. Please set a new password to continue.</span>
        </div>

        <div className="auth-card-header">
          <h1 className="auth-title">Set your password</h1>
          <p className="auth-subtitle">Signed in as <strong>{user?.username}</strong> · {company?.companyName}</p>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Temporary Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showCur ? 'text' : 'password'} name="currentPassword"
                className={`form-input ${errors.currentPassword ? 'error' : ''}`}
                placeholder="Enter the password from your email"
                value={form.currentPassword} onChange={onChange}
                autoComplete="current-password" autoFocus
                style={{ paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowCur(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: 14 }}>{showCur ? '🙈' : '👁️'}</button>
            </div>
            {errors.currentPassword && <div className="form-error">{errors.currentPassword}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showNew ? 'text' : 'password'} name="newPassword"
                className={`form-input ${errors.newPassword ? 'error' : ''}`}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={form.newPassword} onChange={onChange}
                autoComplete="new-password"
                style={{ paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowNew(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: 14 }}>{showNew ? '🙈' : '👁️'}</button>
            </div>
            {errors.newPassword && <div className="form-error">{errors.newPassword}</div>}
            {form.newPassword && (
              <div style={{ marginTop: 6 }}>
                <div className="strength-bars">
                  {[1,2,3,4,5].map(n => <div key={n} className={`strength-bar ${n <= strength.score ? `active-${strength.level}` : ''}`} />)}
                </div>
                <span className="strength-label">Strength: {strength.label}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input type="password" name="confirmPassword"
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Re-enter your new password"
              value={form.confirmPassword} onChange={onChange}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="btn-spinner" />Updating password...</> : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}