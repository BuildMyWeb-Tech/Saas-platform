// frontend/src/pages/jobcard/JobCardForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, FileText } from "lucide-react";
import {
  createJobCard,
  updateJobCard,
  getJobCardById,
} from "../../services/jobCardService";
import { getCustomers } from "../../services/customerService";
import "./jc_styles.css";

/* ── Date helpers ────────────────────────────────────────── */
// yyyy-MM-dd  ←→  input[type=date] value (browser handles display)
const toDateInput = (d) => {
  if (!d) return "";
  return d.split("T")[0]; // strip time if present
};

/* ── Reusable field wrapper (same as CustomerForm) ──────── */
function Field({ label, required, error, children }) {
  return (
    <div className="gm-field">
      <label className="gm-label">
        {label}{required && <span className="gm-req"> *</span>}
      </label>
      {children}
      {error && <div className="gm-field-err">{error}</div>}
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
      color: "#818cf8", textTransform: "uppercase",
      borderBottom: "1px solid rgba(99,102,241,0.18)",
      paddingBottom: 8, marginBottom: 18, marginTop: 8,
    }}>
      {title}
    </div>
  );
}

/* ── Customer Autocomplete ───────────────────────────────── */
function CustomerLookup({ value, onSelect, error, customers }) {
  const [query,    setQuery]    = useState("");
  const [open,     setOpen]     = useState(false);
  const [selected, setSelected] = useState(value || null);
  const wrapRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // When parent resets value (e.g. on edit load)
  useEffect(() => {
    if (value) setSelected(value);
  }, [value]);

  const filtered = query.trim()
    ? customers.filter(c =>
        c.Pname.toLowerCase().includes(query.toLowerCase()) ||
        String(c.Pbranch || "").toLowerCase().includes(query.toLowerCase())
      )
    : customers.slice(0, 50); // show first 50 when no query

  const handleSelect = (c) => {
    setSelected(c);
    setQuery("");
    setOpen(false);
    onSelect(c);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    onSelect(null);
  };

  return (
    <div className="jc-lookup-wrap" ref={wrapRef}>
      {selected ? (
        <div className={`gm-input jc-selected-customer${error ? " error" : ""}`}>
          <span style={{ flex: 1, color: "#e2e8f0" }}>
            {selected.Pname}
            {selected.Pbranch ? <span style={{ color: "#64748b", marginLeft: 8 }}>({selected.Pbranch})</span> : null}
          </span>
          <button type="button" onClick={handleClear} className="jc-clear-btn" title="Clear customer">
            ✕
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            className={`gm-input${error ? " error" : ""}`}
            placeholder="Search customer by name or branch..."
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
          {open && filtered.length > 0 && (
            <div className="jc-dropdown">
              {filtered.map(c => (
                <button
                  key={c.uid}
                  type="button"
                  className="jc-dropdown-item"
                  onMouseDown={() => handleSelect(c)}
                >
                  <span className="jc-dropdown-name">{c.Pname}</span>
                  <span className="jc-dropdown-branch">{c.Pbranch}</span>
                </button>
              ))}
            </div>
          )}
          {open && query.trim() && filtered.length === 0 && (
            <div className="jc-dropdown">
              <div style={{ padding: "10px 12px", color: "#475569", fontSize: 13 }}>
                No customers found for "{query}"
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
const todayISO = () => new Date().toISOString().split("T")[0]; // yyyy-MM-dd

/* ═══ MAIN FORM ════════════════════════════════════════════ */
const EMPTY = {
  DocNo:         "",
  DocDate:       todayISO(),   // ← auto-fill today on create
  CustomerUid:   null,
  ContactMobile: "",
  ContactPerson: "",
  JobName:       "",
  JobDesc:       "",
  DelivaryDate:  "",
  Active:        1,
};

export default function JobCardForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);

  const [form,       setForm]       = useState(EMPTY);
  const [errors,     setErrors]     = useState({});
  const [saving,     setSaving]     = useState(false);
  const [apiError,   setApiError]   = useState("");
  const [loaded,     setLoaded]     = useState(!isEdit);
  const [customers,  setCustomers]  = useState([]);
  const [selCustomer, setSelCustomer] = useState(null); // full customer object for display

  /* ── Load customers for dropdown ── */
  useEffect(() => {
    let cancelled = false;
    getCustomers(1)
      .then(res => { if (!cancelled) setCustomers(res.data || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  /* ── Load existing job card for edit ── */
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getJobCardById(id);
        if (cancelled) return;
        const d = res.data;
        if (d) {
          setForm({
            DocNo:         d.DocNo         || "",
            DocDate:       toDateInput(d.DocDate),
            CustomerUid:   d.CustomerUid   ?? null,
            ContactMobile: d.ContactMobile != null ? String(d.ContactMobile) : "",
            ContactPerson: d.ContactPerson || "",
            JobName:       d.JobName       || "",
            JobDesc:       d.JobDesc       || "",
            DelivaryDate:  toDateInput(d.DelivaryDate),
            Active:        Number(d.Active ?? 1),
          });
          // Pre-fill selected customer for display
          if (d.CustomerUid) {
            setSelCustomer({ uid: d.CustomerUid, Pname: d.Pname || `Customer #${d.CustomerUid}`, Pbranch: d.Pbranch || "" });
          }
        }
      } catch {
        if (!cancelled) setApiError("Failed to load job card details.");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  /* ── Customer selection ── */
  const handleCustomerSelect = (c) => {
    if (!c) {
      setForm(prev => ({ ...prev, CustomerUid: null, ContactMobile: "", ContactPerson: "" }));
      setSelCustomer(null);
      return;
    }
    setForm(prev => ({
      ...prev,
      CustomerUid:   c.uid,
      ContactMobile: c.Mobile ? String(c.Mobile) : prev.ContactMobile,
      ContactPerson: c.contactperson || prev.ContactPerson,
    }));
    setSelCustomer(c);
    if (errors.CustomerUid) setErrors(prev => ({ ...prev, CustomerUid: "" }));
  };

  /* ── Validate ── */
  const validate = () => {
    const e = {};
    if (!form.DocDate)       e.DocDate     = "Job date is required";
    if (!form.CustomerUid)   e.CustomerUid = "Customer is required";
    if (!form.JobName.trim()) e.JobName    = "Job name is required";
    if (!form.DelivaryDate)  e.DelivaryDate = "Delivery date is required";
    if (form.ContactMobile.trim() && !/^\d{10}$/.test(form.ContactMobile.trim()))
      e.ContactMobile = "Mobile must be exactly 10 digits";
    return e;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!loaded) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);

    try {
      const payload = {
        DocNo:         form.DocNo,
        DocDate:       form.DocDate,
        CustomerUid:   form.CustomerUid,
        ContactMobile: form.ContactMobile.trim() ? Number(form.ContactMobile.trim()) : null,
        ContactPerson: form.ContactPerson.trim(),
        JobName:       form.JobName.trim(),
        JobDesc:       form.JobDesc.trim(),
        DelivaryDate:  form.DelivaryDate,
        Active:        form.Active,
        // NOTE: Address fields are display-only — NOT sent to backend
      };

      let res;
      if (isEdit) {
        res = await updateJobCard(id, { ...payload, UID: Number(id) });
      } else {
        res = await createJobCard({ ...payload, UID: 0 });
      }

      navigate("/planning/job-card", {
        state: {
          toast: {
            msg: res?.message || (isEdit ? "Job card updated successfully." : `Job card created. ${res?.docNo ? `Doc No: ${res.docNo}` : ""}`),
            type: "success",
          },
        },
      });
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || "Operation failed.");
      setSaving(false);
    }
  };

  return (
   <div className="um-form-page">
  <div className="um-form-wrap jc-form-wrap">

        {/* ── Breadcrumb ── */}
        <div className="um-breadcrumb">
          <button className="um-breadcrumb-back" onClick={() => navigate("/planning/job-card")}>
            <ArrowLeft size={14} /> Job Cards
          </button>
          <span style={{ color: "#475569", margin: "0 6px" }}>›</span>
          <span className="um-breadcrumb-active">
            {isEdit ? "Edit Job Card" : "New Job Card"}
          </span>
        </div>

        {/* ── Card ── */}
        <div className="um-card">
          <div className="um-card-header">
            <div className="um-card-icon"><FileText size={18} /></div>
            <div>
              <div className="um-card-title">{isEdit ? "Edit Job Card" : "New Job Card"}</div>
              <div className="um-card-subtitle">
                {isEdit ? "Update job card details" : "Fill in the details to create a new job card"}
              </div>
            </div>
          </div>

          {isEdit && !loaded ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0" }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  height: 42, borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
              ))}
              <div style={{ fontSize: 13, color: "#475569", textAlign: "center", marginTop: 4 }}>
                Loading job card details…
              </div>
            </div>
          ) : (
            <>
              {apiError && <div className="gm-modal-error">⚠ {apiError}</div>}

              <form onSubmit={handleSubmit} noValidate autoComplete="off">

                {/* ════ SECTION 1: Job Details ════ */}
                <SectionHeader title="Job Details" />

                <div className="gm-form-grid-2">

                  {isEdit && (
                    <Field label="Job No">
                      <input
                        name="DocNo" type="text" className="gm-input"
                        value={form.DocNo} readOnly
                        style={{ opacity: 0.55, cursor: "not-allowed" }}
                      />
                    </Field>
                  )}

                  <Field label="Job Date" required error={errors.DocDate}>
  <input
    name="DocDate" type="date"
    className="gm-input"
    value={form.DocDate}
    onChange={handleChange}
    disabled
    style={{ opacity: 0.7, cursor: "not-allowed" }}
  />
</Field>

                  <Field label="Delivery Date" required error={errors.DelivaryDate}>
                    <input
                      name="DelivaryDate" type="date"
                      className={`gm-input${errors.DelivaryDate ? " error" : ""}`}
                      value={form.DelivaryDate} onChange={handleChange}
                    />
                  </Field>

                </div>

                {/* ════ SECTION 2: Customer ════ */}
                <SectionHeader title="Customer" />

                <Field label="Customer" required error={errors.CustomerUid}>
                  <CustomerLookup
                    value={selCustomer}
                    onSelect={handleCustomerSelect}
                    error={errors.CustomerUid}
                    customers={customers}
                  />
                </Field>

                <div className="gm-form-grid-2">

                  <Field label="Contact Person" error={errors.ContactPerson}>
                    <input
                      name="ContactPerson" type="text"
                      className={`gm-input${errors.ContactPerson ? " error" : ""}`}
                      placeholder="Contact name"
                      value={form.ContactPerson} onChange={handleChange}
                    />
                  </Field>

                  <Field label="Mobile" error={errors.ContactMobile}>
                    <input
                      name="ContactMobile" type="text"
                      className={`gm-input${errors.ContactMobile ? " error" : ""}`}
                      placeholder="10-digit mobile"
                      value={form.ContactMobile} onChange={handleChange}
                      maxLength={10}
                    />
                  </Field>

                </div>

                {/* ════ SECTION 3: Job Info ════ */}
                <SectionHeader title="Job Info" />

                <Field label="Job Name" required error={errors.JobName}>
                  <input
                    name="JobName" type="text"
                    className={`gm-input${errors.JobName ? " error" : ""}`}
                    placeholder="Enter job name"
                    value={form.JobName} onChange={handleChange}
                  />
                </Field>

                <Field label="Job Description" error={errors.JobDesc}>
                  <textarea
                    name="JobDesc"
                    className="gm-input"
                    placeholder="Describe the job (optional)"
                    value={form.JobDesc} onChange={handleChange}
                    rows={3}
                    style={{ height: "auto", padding: "10px 12px", resize: "vertical" }}
                  />
                </Field>

                {/* ── Actions ── */}
                <div className="um-form-actions" style={{ marginTop: 28 }}>
                  <button
                    type="button" className="gm-btn-cancel"
                    onClick={() => navigate("/planning/job-card")} disabled={saving}
                  >
                    <ArrowLeft size={14} style={{ marginRight: 4 }} /> Back
                  </button>
                  <button
                    type="submit" className="gm-btn-save um-submit-btn"
                    disabled={saving || !loaded}
                  >
                    {saving ? <span className="gm-spinner-sm" /> : <Save size={14} />}
                    {isEdit ? "Save Changes" : "Create Job Card"}
                  </button>
                </div>

              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}