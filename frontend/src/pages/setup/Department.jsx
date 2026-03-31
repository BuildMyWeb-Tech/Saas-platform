// src/pages/setup/Department.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../services/departmentService';
import { useAuth } from '../../context/AuthContext';

/* ── Icons ─────────────────────────────────────────────────────── */
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

/* ── Empty form state ───────────────────────────────────────────── */
const EMPTY_FORM = { code: '', name: '', shortName: '' };

/* ═══════════════════════════════════════════════════════════════
   MODAL — Add / Edit Department
   ═══════════════════════════════════════════════════════════════ */
function DepartmentModal({ mode, initial, onSave, onClose, saving }) {
  const [form, setForm]     = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.code.trim())  e.code  = 'Code is required';
    if (!form.name.trim())  e.name  = 'Name is required';
    return e;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <div className="dept-modal-overlay" onClick={onClose}>
      <div className="dept-modal" onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button className="dept-modal-close" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>

        {/* Title */}
        <h2 className="dept-modal-title">Department</h2>

        <form onSubmit={onSubmit} noValidate>
          {/* Code */}
          <div className="dept-field">
            <label className="dept-label">
              Code <span className="dept-required">*</span>
            </label>
            <input
              type="text"
              name="code"
              className={`dept-input ${errors.code ? 'error' : ''}`}
              placeholder="Department Code"
              value={form.code}
              onChange={onChange}
              autoFocus
            />
            {errors.code && <div className="dept-field-error">{errors.code}</div>}
          </div>

          {/* Name */}
          <div className="dept-field">
            <label className="dept-label">
              Name <span className="dept-required">*</span>
            </label>
            <input
              type="text"
              name="name"
              className={`dept-input ${errors.name ? 'error' : ''}`}
              placeholder="Department Name"
              value={form.name}
              onChange={onChange}
            />
            {errors.name && <div className="dept-field-error">{errors.name}</div>}
          </div>

          {/* Short Name */}
          <div className="dept-field">
            <label className="dept-label">Short Name</label>
            <input
              type="text"
              name="shortName"
              className="dept-input"
              placeholder="Short Name"
              value={form.shortName}
              onChange={onChange}
            />
          </div>

          {/* Buttons */}
          <div className="dept-modal-actions">
            <button type="submit" className="dept-btn-save" disabled={saving}>
              {saving ? (
                <><span className="dept-btn-spinner" /> Saving...</>
              ) : 'Save'}
            </button>
            <button type="button" className="dept-btn-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONFIRM DELETE MODAL
   ═══════════════════════════════════════════════════════════════ */
function ConfirmModal({ item, onConfirm, onClose, deleting }) {
  return (
    <div className="dept-modal-overlay" onClick={onClose}>
      <div className="dept-confirm-modal" onClick={e => e.stopPropagation()}>
        <button className="dept-modal-close" onClick={onClose}><IconClose /></button>

        {/* <div className="dept-confirm-icon">🗑️</div> */}
        <h3 className="dept-confirm-title">Delete Department</h3>
        <p className="dept-confirm-msg">
          Are you sure you want to delete{' '}
          <strong>{item?.name}</strong>?
          <br />This action cannot be undone.
        </p>

        <div className="dept-confirm-actions">
          <button className="dept-btn-delete-confirm" onClick={onConfirm} disabled={deleting}>
            {deleting ? <><span className="dept-btn-spinner" /> Deleting...</> : 'Yes, Delete'}
          </button>
          <button className="dept-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DEPARTMENT PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function Department() {
  const { userId } = useAuth();

  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');

  // Modal state
  const [modal, setModal]       = useState(null); // null | 'add' | 'edit'
  const [editRow, setEditRow]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saveErr, setSaveErr]   = useState('');

  // Delete confirm
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  // Toast
  const [toast, setToast]   = useState('');
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  /* Load list */
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchDepartments();
      setRows(res.success ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Filtered rows */
  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return (
      r.code?.toLowerCase().includes(q) ||
      r.name?.toLowerCase().includes(q) ||
      r.shortName?.toLowerCase().includes(q)
    );
  });

  /* Add */
  const openAdd = () => { setSaveErr(''); setModal('add'); setEditRow(null); };

  /* Edit */
  const openEdit = (row) => {
    setSaveErr('');
    setEditRow(row);
    setModal('edit');
  };

  /* Save (add or edit) */
  const handleSave = async (form) => {
    setSaveErr('');
    setSaving(true);
    try {
      if (modal === 'add') {
        await createDepartment({ ...form, userId });
        showToast('Department added successfully.');
      } else {
        await updateDepartment({ ...form, id: editRow.id, userId });
        showToast('Department updated successfully.');
      }
      setModal(null);
      load();
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* Delete */
  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteDepartment({ id: deleteItem.id });
      showToast('Department deleted.');
      setDeleteItem(null);
      load();
    } catch (err) {
      showToast('Delete failed: ' + (err.response?.data?.message || err.message));
      setDeleteItem(null);
    } finally {
      setDeleting(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="dept-page">

      {/* Toast */}
      {toast && (
        <div className="dept-toast">
          <span>✓</span> {toast}
        </div>
      )}

      {/* Modals */}
      {modal && (
        <DepartmentModal
          mode={modal}
          initial={modal === 'edit' ? { code: editRow.code, name: editRow.name, shortName: editRow.shortName || '' } : EMPTY_FORM}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
      {deleteItem && (
        <ConfirmModal
          item={deleteItem}
          onConfirm={handleDelete}
          onClose={() => setDeleteItem(null)}
          deleting={deleting}
        />
      )}

      {/* Page header */}
      <div className="dept-page-header">
        <h1 className="dept-page-title">Department List</h1>
        <div className="dept-page-actions">
          <button className="dept-btn-add" onClick={openAdd}>
            <IconPlus /> Add New Record
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {/* <div className="dept-toolbar">
        <div className="dept-show-entries">
          <span>Show</span>
          <select className="dept-entries-select">
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="dept-search-wrap">
          <span className="dept-search-icon"><IconSearch /></span>
          <input
            type="text"
            className="dept-search-input"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div> */}

      {/* Error */}
      {error && (
        <div className="dept-alert-error">{error}</div>
      )}

      {/* Table */}
      <div className="dept-table-wrap">
        {loading ? (
          <div className="dept-loading">
            <div className="dept-spinner" />
          </div>
        ) : (
          <table className="dept-table">
            <thead>
              <tr>
                <th className="dept-th dept-th-bordered">
                  CODE
                  {/* <span className="dept-sort-icons">
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                      <path d="M4 0L7.46 5H.54L4 0z" opacity=".5"/>
                      <path d="M4 12L.54 7H7.46L4 12z"/>
                    </svg>
                  </span> */}
                </th>
                <th className="dept-th dept-th-bordered">
                  DEPARTMENT NAME
                  {/* <span className="dept-sort-icons">
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                      <path d="M4 0L7.46 5H.54L4 0z" opacity=".5"/>
                      <path d="M4 12L.54 7H7.46L4 12z"/>
                    </svg>
                  </span> */}
                </th>
                <th className="dept-th dept-th-bordered">
                  SHORT NAME
                  {/* <span className="dept-sort-icons">
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                      <path d="M4 0L7.46 5H.54L4 0z" opacity=".5"/>
                      <path d="M4 12L.54 7H7.46L4 12z"/>
                    </svg>
                  </span> */}
                </th>
                <th className="dept-th dept-th-action dept-th-bordered">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="dept-empty-row">
                    {search ? 'No results match your search.' : 'No departments found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="dept-row">
                    <td className="dept-td">{row.code}</td>
                    <td className="dept-td">{row.name}</td>
                    <td className="dept-td">{row.shortName || '—'}</td>
                    <td className="dept-td dept-td-action">
                      <button
                        className="dept-icon-btn dept-icon-btn-edit"
                        onClick={() => openEdit(row)}
                        title="Edit"
                        aria-label="Edit department"
                      >
                        <IconEdit />
                      </button>
                      <button
                        className="dept-icon-btn dept-icon-btn-delete"
                        onClick={() => setDeleteItem(row)}
                        title="Delete"
                        aria-label="Delete department"
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {!loading && (
        <div className="dept-table-footer">
          <span>
            Showing {filtered.length} of {rows.length} entries
          </span>
        </div>
      )}
    </div>
  );
}