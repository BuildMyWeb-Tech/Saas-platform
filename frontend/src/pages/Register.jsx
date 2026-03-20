// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerCompany } from '../services/authService';

export default function Register() {
  const [form, setForm]           = useState({ companyName: '', gstNumber: '', email: '' });
  const [errors, setErrors]       = useState({});
  const [serverError, setServer]  = useState('');
  const [success, setSuccess]     = useState(null);
  const [loading, setLoading]     = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    if (serverError)  setServer('');
  };

  const validate = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = 'Required';
    if (!form.gstNumber.trim())   e.gstNumber   = 'Required';
    else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber.toUpperCase()))
      e.gstNumber = 'Invalid format — e.g. 27AAPFU0939F1ZV';
    if (!form.email.trim())       e.email       = 'Required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServer('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await registerCompany({ ...form, gstNumber: form.gstNumber.toUpperCase() });
      if (res.success) setSuccess(res.data);
    } catch (err) {
      const d = err.response?.data;
      if (d?.field) setErrors(p => ({ ...p, [d.field]: d.message }));
      else          setServer(d?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  /* ── Success screen ── */
  if (success) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🖨️</div>
          <span className="auth-logo-text">PrintMixBox</span>
        </div>

        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-success-bg)', border: '1.5px solid var(--color-success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 20 }}>✓</div>

        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 8 }}>Application received</h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: 20 }}>
          Thank you for registering <strong style={{ color: 'var(--color-text-primary)' }}>{success.companyName}</strong>. We have sent a confirmation to <strong style={{ color: 'var(--color-text-primary)' }}>{success.email}</strong>.
        </p>

        <div className="alert alert-info" style={{ marginBottom: 0 }}>
          <span>⏳</span>
          <span>Our admin team will review your application and email your login credentials within 1–2 business days.</span>
        </div>

        <div className="auth-footer">
          Already have credentials? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );

  /* ── Registration form ── */
  return (
    <div className="auth-layout">
      {/* Left */}
      <div className="auth-panel-left">
        <div className="panel-brand">
          <div className="panel-brand-logo">
            <div className="auth-logo-icon" style={{ width: 28, height: 28, fontSize: 14 }}>🖨️</div>
            <span className="panel-brand-name">PrintMixBox</span>
          </div>
          <h2 className="panel-headline">IoT printing &amp;<br /><em>box branding</em> platform</h2>
          <p className="panel-description">Register your company and our team will verify your details and send login credentials directly to your email.</p>
        </div>
        <div className="panel-features">
          {[
            { icon: '🏭', title: 'Multi-tenant workspaces',  desc: 'Each company gets its own isolated environment' },
            { icon: '📡', title: 'IoT device management',    desc: 'Connect and control your printer fleet remotely' },
            { icon: '🎨', title: 'Branding templates',       desc: 'Logos, brand colors, and custom box designs' },
            { icon: '🔐', title: 'Admin-verified access',    desc: 'Credentials issued by our team after review' },
          ].map(f => (
            <div className="panel-feature" key={f.title}>
              <div className="panel-feature-icon">{f.icon}</div>
              <div className="panel-feature-text"><h4>{f.title}</h4><p>{f.desc}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🖨️</div>
            <span className="auth-logo-text">PrintMixBox</span>
          </div>
          <div className="auth-card-header">
            <h1 className="auth-title">Register your company</h1>
            <p className="auth-subtitle">Submit your details for admin review</p>
          </div>

          {serverError && <div className="alert alert-error">{serverError}</div>}

          <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input type="text" name="companyName"
                className={`form-input ${errors.companyName ? 'error' : ''}`}
                placeholder="Acme Packaging Pvt. Ltd."
                value={form.companyName} onChange={onChange}
                autoComplete="organization" autoFocus
              />
              {errors.companyName && <div className="form-error">{errors.companyName}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input type="text" name="gstNumber"
                className={`form-input form-input-mono ${errors.gstNumber ? 'error' : ''}`}
                placeholder="27AAPFU0939F1ZV"
                value={form.gstNumber}
                onChange={e => onChange({ target: { name: 'gstNumber', value: e.target.value.toUpperCase() } })}
                maxLength={15} autoComplete="off"
              />
              {errors.gstNumber
                ? <div className="form-error">{errors.gstNumber}</div>
                : <div className="form-hint">15-character Indian GST identification number</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Company Email</label>
              <input type="email" name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@company.com"
                value={form.email} onChange={onChange}
                autoComplete="email"
              />
              {errors.email
                ? <div className="form-error">{errors.email}</div>
                : <div className="form-hint">Login credentials will be sent to this address after approval</div>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="btn-spinner" />Submitting...</> : 'Submit Registration'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}