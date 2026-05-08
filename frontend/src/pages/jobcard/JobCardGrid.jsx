// frontend/src/pages/jobcard/JobCardGrid.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePermissions } from "../../context/AuthContext";
import { Pencil, Trash2, RotateCcw, Plus, Search, X } from "lucide-react";
import {
  getJobCards,
  deleteJobCard,
  restoreJobCard,
} from "../../services/jobCardService";

/* ── Date formatter: yyyy-MM-dd → dd/MM/yyyy ─────────────── */
const fmtDate = (d) => {
  if (!d) return "—";
  const s = d.split("T")[0];
  const [y, m, day] = s.split("-");
  return `${day}/${m}/${y}`;
};

/* ── Shared sub-components (same pattern as Customers.jsx) ── */
function Toast({ toast }) {
  if (!toast?.msg) return null;
  return (
    <div className={`gm-toast ${toast.type === "error" ? "gm-toast-error" : ""}`}>
      <span>{toast.type === "error" ? "⚠" : "✓"}</span>
      {toast.msg}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <div className="gm-toggle-wrap" role="switch" aria-checked={checked} tabIndex={0}
      onKeyDown={e => e.key === " " && onChange()}>
      <span
        className={`gm-toggle-label ${!checked ? "gm-toggle-label--on" : "gm-toggle-label--off"}`}
        onClick={onChange} style={{ cursor: "pointer" }}>
        Inactive
      </span>
      <div
        className={`gm-toggle-pill ${checked ? "gm-toggle-pill--active" : "gm-toggle-pill--inactive"}`}
        onClick={onChange}>
        <div className="gm-toggle-knob" />
      </div>
      <span
        className={`gm-toggle-label ${checked ? "gm-toggle-label--on" : "gm-toggle-label--off"}`}
        onClick={onChange} style={{ cursor: "pointer" }}>
        Active
      </span>
    </div>
  );
}

function SortTh({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field;
  return (
    <th className="gm-th gm-th-sortable" onClick={() => onSort(field)} aria-sort={active ? sortDir : "none"}>
      <div className="gm-th-inner">
        {label}
        <span className="gm-sort-arrows">
          <svg width="8" height="5" viewBox="0 0 8 5">
            <path d="M4 0L7.46 5H.54L4 0z" fill={active && sortDir === "asc" ? "#818cf8" : "#475569"} />
          </svg>
          <svg width="8" height="5" viewBox="0 0 8 5">
            <path d="M4 5L.54 0H7.46L4 5z" fill={active && sortDir === "desc" ? "#818cf8" : "#475569"} />
          </svg>
        </span>
      </div>
    </th>
  );
}

function ConfirmModal({ jobName, onConfirm, onClose, deleting }) {
  return (
    <div className="gm-overlay" onClick={onClose}>
      <div className="gm-confirm" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="gm-modal-close" onClick={onClose}><X size={13} /></button>
        <div className="gm-confirm-emoji">🗑️</div>
        <h3 className="gm-confirm-title">Delete Job Card</h3>
        <p className="gm-confirm-msg">
          Are you sure you want to delete <strong>{jobName}</strong>?<br />
          This will deactivate the job card record.
        </p>
        <div className="gm-confirm-actions">
          <button className="gm-btn-danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? <><span className="gm-spinner-sm" />Deleting...</> : "Yes, Delete"}
          </button>
          <button className="gm-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ═══ MAIN GRID ════════════════════════════════════════════ */
export default function JobCardGrid() {
  const navigate = useNavigate();
  const location = useLocation();
  const { canAdd, canEdit, canDelete } = usePermissions("Job Card");

  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isActive,  setIsActive]  = useState(true);
  const [search,    setSearch]    = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDir,   setSortDir]   = useState("asc");
  const [confirm,   setConfirm]   = useState(null);
  const [deleting,  setDeleting]  = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  const [toast, setToast] = useState(() => location.state?.toast || null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (location.state?.toast) window.history.replaceState({}, "");
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setLoadError("");
    try {
      const res = await getJobCards(isActive ? 1 : 0);
      setRows(res.data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Failed to load job cards.");
      setRows([]);
    } finally { setLoading(false); }
  }, [isActive]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSearch(""); setSortField(null); }, [isActive]);

  const displayRows = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        String(r.DocNo         || "").toLowerCase().includes(q) ||
        String(r.JobName       || "").toLowerCase().includes(q) ||
        String(r.ContactPerson || "").toLowerCase().includes(q) ||
        String(r.ContactMobile || "").includes(q)
      );
    }
    if (sortField) {
      list = [...list].sort((a, b) => {
        let av = a[sortField] ?? ""; let bv = b[sortField] ?? "";
        if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ?  1 : -1;
        return 0;
      });
    }
    return list;
  }, [rows, search, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await deleteJobCard(confirm.uid);
      showToast(`"${confirm.JobName}" deleted.`);
      setConfirm(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed.", "error");
      setConfirm(null);
    } finally { setDeleting(false); }
  };

  const handleRestore = async (row) => {
    setLoadingId(row.uid);
    try {
      const res = await restoreJobCard(row.uid);
      showToast(res.message || `"${row.JobName}" restored.`);
      setIsActive(true); // switch to active tab; load() fires via useEffect
    } catch (err) {
      showToast(err.response?.data?.message || "Restore failed.", "error");
    } finally { setLoadingId(null); }
  };

  const SORT_COLS = [
    { key: "DocDate",       label: "JC DATE"        },
    { key: "DocNo",         label: "JC NO"           },
    { key: "JobName",       label: "JOB NAME"        },
    { key: "ContactPerson", label: "CONTACT PERSON"  },
    { key: "ContactMobile", label: "MOBILE"          },
  ];

  return (
    <div className="gm-page">
      <Toast toast={toast || { msg: "" }} />

      {confirm && (
        <ConfirmModal
          jobName={confirm.JobName}
          onConfirm={handleDelete}
          onClose={() => setConfirm(null)}
          deleting={deleting}
        />
      )}

      <div className="gm-page-header">
        <div>
          <h1 className="gm-page-title">Job Card List</h1>
          <p className="gm-page-subtitle">
            {isActive ? "Showing active job cards" : "Showing inactive job cards"}
          </p>
        </div>
        {isActive && canAdd && (
          <button className="gm-btn-add" onClick={() => navigate("/planning/job-card/create")}>
            <Plus size={14} /> Add New Job Card
          </button>
        )}
      </div>

      <div className="gm-controls">
        <Toggle checked={isActive} onChange={() => setIsActive(v => !v)} />
        <div className="gm-controls-right">
          <div className="gm-search-wrap">
            <span className="gm-search-icon"><Search size={14} /></span>
            <input
              type="text" className="gm-search-input"
              placeholder="Search job cards..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="gm-search-clear" onClick={() => setSearch("")}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {loadError && <div className="gm-alert-error">⚠ {loadError}</div>}

      <div className="gm-table-wrap">
        {loading ? (
          <div className="gm-loading">
            <div className="gm-spinner" /><span>Loading job cards...</span>
          </div>
        ) : (
          <table className="gm-table">
            <thead>
  <tr>
    <th className="gm-th">S.NO</th>

    {SORT_COLS.map(col => (
      <SortTh
        key={col.key}
        label={col.label}
        field={col.key}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
      />
    ))}

    <th className="gm-th gm-th-action">ACTION</th>
  </tr>
</thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="gm-empty">
                    {search
                      ? `No results for "${search}".`
                      : `No ${isActive ? "active" : "inactive"} job cards found.`}
                  </td>
                </tr>
              ) : (
                displayRows.map((row, idx) => (
                  <tr key={row.uid ?? idx} className="gm-row">
                    <td className="gm-td gm-td-code">{idx + 1}</td>
                    <td className="gm-td">{fmtDate(row.DocDate)}</td>
                    <td className="gm-td gm-td-code" style={{ color: "#818cf8" }}>{row.DocNo || "—"}</td>
                    <td className="gm-td" style={{ fontWeight: 600, color: "#e2e8f0" }}>{row.JobName || "—"}</td>
                    <td className="gm-td">{row.ContactPerson || "—"}</td>
                    <td className="gm-td">{row.ContactMobile || "—"}</td>

                    <td className="gm-td gm-td-actions">
                      {isActive ? (
                        <>
                          {canEdit && (
                            <button
                              className="gm-icon-btn gm-icon-edit"
                              onClick={() => navigate(`/planning/job-card/edit/${row.uid}`)}
                              disabled={loadingId === row.uid}
                              title={`Edit ${row.JobName}`}>
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="gm-icon-btn gm-icon-delete"
                              onClick={() => setConfirm({ uid: row.uid, JobName: row.JobName })}
                              disabled={loadingId === row.uid}
                              title={`Delete ${row.JobName}`}>
                              <Trash2 size={14} />
                            </button>
                          )}
                          {!canEdit && !canDelete && <span className="gm-no-actions">—</span>}
                        </>
                      ) : (
                        canEdit ? (
                          <button
                            className="gm-icon-btn gm-icon-restore"
                            onClick={() => handleRestore(row)}
                            disabled={loadingId === row.uid}
                            title={`Restore ${row.JobName}`}>
                            {loadingId === row.uid
                              ? <span className="gm-spinner-sm" />
                              : <RotateCcw size={14} />
                            }
                          </button>
                        ) : (
                          <span className="gm-inactive-badge">Inactive</span>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && (
        <div className="gm-footer">
          {displayRows.length !== rows.length
            ? `${displayRows.length} of ${rows.length} job cards`
            : `${rows.length} job card${rows.length !== 1 ? "s" : ""}`}
          {" · "}{isActive ? "🟢 Active" : "🔴 Inactive"}
        </div>
      )}
    </div>
  );
}