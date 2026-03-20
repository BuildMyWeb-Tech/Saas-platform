// src/pages/admin/Companies.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCompanies, approveCompany, rejectCompany, resendCredentials } from '../../services/adminService';

const STATUS_BADGE = {
  pending:  <span className="badge badge-yellow">Pending</span>,
  approved: <span className="badge badge-green">Approved</span>,
  rejected: <span className="badge badge-red">Rejected</span>,
};

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel, confirmStyle = 'btn-danger', note, setNote, showNote }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{message}</p>
          {showNote && (
            <div style={{ marginTop: 16 }}>
              <label className="form-label">{showNote}</label>
              <textarea
                className="form-input" rows={3}
                placeholder="Optional note..."
                value={note} onChange={e => setNote(e.target.value)}
                style={{ height: 'auto', padding: '10px 12px', resize: 'vertical' }}
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn ${confirmStyle}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Companies Page ───────────────────────────────────────────────────────
export default function Companies() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [companies, setCompanies] = useState([]);
  const [pagination, setPag]      = useState({});
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setAL]    = useState(null);
  const [toast, setToast]         = useState('');
  const [search, setSearch]       = useState('');
  const searchRef = useRef(null);

  const status = searchParams.get('status') || '';
  const page   = parseInt(searchParams.get('page') || '1');

  // Modal state
  const [modal, setModal]   = useState({ open: false, type: '', company: null });
  const [note, setNote]     = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCompanies({ status, page, limit: 15, search: searchRef.current || '' });
      setCompanies(res.data.companies);
      setPag(res.data.pagination);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  // Search debounce
  const searchTimeout = useRef(null);
  const onSearchChange = (e) => {
    const v = e.target.value;
    setSearch(v);
    searchRef.current = v;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(load, 400);
  };

  const setFilter = (s) => {
    const p = new URLSearchParams(searchParams);
    if (s) p.set('status', s); else p.delete('status');
    p.delete('page');
    setSearchParams(p);
  };

  const openModal = (type, company) => { setModal({ open: true, type, company }); setNote(''); };
  const closeModal = () => setModal({ open: false, type: '', company: null });

  const handleApprove = async () => {
    const { company } = modal; closeModal();
    setAL(company._id);
    try {
      const res = await approveCompany(company._id, note);
      showToast(`✅ ${company.companyName} approved — credentials sent to ${company.email}`);
      load();
    } catch (err) { showToast(`❌ ${err.response?.data?.message || 'Failed to approve.'}`); }
    finally { setAL(null); }
  };

  const handleReject = async () => {
    const { company } = modal; closeModal();
    setAL(company._id);
    try {
      await rejectCompany(company._id, note);
      showToast(`Company rejected.`);
      load();
    } catch (err) { showToast(`❌ ${err.response?.data?.message || 'Failed to reject.'}`); }
    finally { setAL(null); }
  };

  const handleResend = async (company) => {
    setAL(company._id);
    try {
      await resendCredentials(company._id);
      showToast(`📧 New credentials sent to ${company.email}`);
    } catch (err) { showToast(`❌ ${err.response?.data?.message || 'Failed to resend.'}`); }
    finally { setAL(null); }
  };

  const TABS = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1e293b', color: '#fff', padding: '12px 18px', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', boxShadow: 'var(--shadow-lg)', maxWidth: 400, lineHeight: 1.5, animation: 'fadeInUp 0.2s ease' }}>
          {toast}
        </div>
      )}

      {/* Modals */}
      <ConfirmModal
        open={modal.open && modal.type === 'approve'}
        onClose={closeModal} onConfirm={handleApprove}
        title="Approve Company"
        message={`Approve ${modal.company?.companyName}? A company code will be generated and login credentials will be emailed to ${modal.company?.email}.`}
        confirmLabel="Approve & Send Credentials"
        confirmStyle="btn-success"
        showNote="Admin note (optional)"
        note={note} setNote={setNote}
      />
      <ConfirmModal
        open={modal.open && modal.type === 'reject'}
        onClose={closeModal} onConfirm={handleReject}
        title="Reject Company"
        message={`Reject ${modal.company?.companyName}? This will mark the application as rejected.`}
        confirmLabel="Reject"
        confirmStyle="btn-danger"
        showNote="Reason for rejection (optional)"
        note={note} setNote={setNote}
      />

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text" placeholder="Search by name, email, GST, code…"
            value={search} onChange={onSearchChange}
          />
        </div>
        <div className="filter-tabs">
          {TABS.map(t => (
            <button key={t.value} className={`filter-tab ${status === t.value ? 'active' : ''}`} onClick={() => setFilter(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
            <div className="pmb-spinner" />
          </div>
        ) : companies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏭</div>
            <h3>No companies found</h3>
            <p>{search ? 'Try a different search term.' : 'No registrations in this category yet.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>GST Number</th>
                <th>Email</th>
                <th>Code</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => {
                const busy = actionLoading === c._id;
                return (
                  <tr key={c._id}>
                    <td>
                      <div style={{ fontWeight: 'var(--weight-medium)' }}>{c.companyName}</div>
                    </td>
                    <td className="mono">{c.gstNumber}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{c.email}</td>
                    <td className="mono">{c.companyCode || <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}</td>
                    <td>{STATUS_BADGE[c.status]}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {/* Detail */}
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/companies/${c._id}`)}>
                          View
                        </button>

                        {/* Pending → approve or reject */}
                        {c.status === 'pending' && (
                          <>
                            <button className="btn btn-success btn-sm" disabled={busy} onClick={() => openModal('approve', c)}>
                              {busy ? <span className="btn-spinner" /> : 'Approve'}
                            </button>
                            <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => openModal('reject', c)}>
                              Reject
                            </button>
                          </>
                        )}

                        {/* Approved → resend credentials */}
                        {c.status === 'approved' && (
                          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => handleResend(c)}
                            title="Send new credentials email"
                          >
                            {busy ? <span className="btn-spinner btn-spinner-dark" /> : '📧 Resend'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          <span>{pagination.total} companies total</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p}
                className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                style={{ width: 32, padding: 0 }}
                onClick={() => {
                  const sp = new URLSearchParams(searchParams);
                  sp.set('page', p); setSearchParams(sp);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}