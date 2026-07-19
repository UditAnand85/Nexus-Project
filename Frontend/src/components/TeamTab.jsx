import { useState } from "react";
import { createEmployee, getEmployees } from "../api/apiClient";
import { useApi } from "../utils/useApi";
import { Loading, ErrorState } from "./Status";

const ROLES = [
  { key: "R001", label: "Super Admin" },
  { key: "R002", label: "HR Manager" },
  { key: "R003", label: "Hiring Manager" },
  { key: "R004", label: "Viewer" },
];

const ROLE_BADGE = {
  R001: "bg-purple-100 text-purple-700",
  R002: "bg-blue-100 text-blue-700",
  R003: "bg-cyan-100 text-cyan-700",
  R004: "bg-gray-100 text-gray-600",
};

export default function TeamTab() {
  const { data: employees, loading, error, refetch } = useApi(() => getEmployees(), []);
  const [showModal, setShowModal] = useState(false);
  const [created, setCreated] = useState(null); // { employee, tempPassword }

  const handleCreated = (result) => {
    setCreated(result);
    setShowModal(false);
    refetch();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-lg font-medium">Team members</h2>
          <p className="text-[13px] text-inksoft mt-0.5">Manage admin employee accounts</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm w-full sm:w-auto">
          + Add employee
        </button>
      </div>

      {/* Temp password banner after creation */}
      {created && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-amber-500 mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">
                Account created for <span className="font-semibold">{created.employee.full_name}</span>
              </p>
              <p className="text-[13px] text-amber-700 mt-1">
                ✉️ A welcome email with login instructions has been sent to <span className="font-mono break-all">{created.employee.email}</span>.
              </p>
              <p className="text-[13px] text-amber-700 mt-2">
                Backup — temporary password (in case email is delayed):
              </p>
              <code className="inline-block mt-1 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded text-amber-900 font-mono text-sm tracking-wider select-all break-all">
                {created.tempPassword}
              </code>
              <p className="text-[11px] text-amber-600 mt-1.5">
                ⚠ This password is shown only once. The new admin must change it on first login.
              </p>
            </div>
            <button onClick={() => setCreated(null)} className="ml-auto text-amber-400 hover:text-amber-600 text-lg leading-none shrink-0">✕</button>
          </div>
        </div>
      )}

      {loading && <Loading label="Loading team…" />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {employees && (
        <div className="border border-line rounded-xl overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_130px_120px_110px] gap-4 px-5 py-3 bg-[#F7F7F5] border-b border-line font-mono text-[11px] uppercase tracking-wide text-inksoft">
            <span>Employee</span><span>Role</span><span>Status</span><span>Joined</span>
          </div>
          {employees.length === 0 && (
            <p className="text-inksoft text-sm text-center py-10">No employees found.</p>
          )}
          {employees.map((emp) => (
            <div
              key={emp.admin_id}
              className="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_130px_120px_110px] sm:gap-4 px-5 py-4 border-b border-line last:border-b-0 sm:items-center"
            >
              <div>
                <div className="text-[15px] font-medium flex items-center gap-2 flex-wrap">
                  {emp.full_name}
                  {emp.must_change_password && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                      Pending setup
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-inksoft mt-0.5 break-all">{emp.email}</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-mono text-[11px] px-2 py-1 rounded-full w-fit ${ROLE_BADGE[emp.role_key] || "bg-gray-100 text-gray-600"}`}>
                  {emp.role_name || emp.role_key}
                </span>
                <span className={`sm:hidden font-mono text-[11px] ${emp.account_status === "Active" ? "text-go" : "text-stop"}`}>
                  · {emp.account_status}
                </span>
              </div>
              <span className={`hidden sm:inline font-mono text-[11px] ${emp.account_status === "Active" ? "text-go" : "text-stop"}`}>
                {emp.account_status}
              </span>
              <span className="text-[12px] text-inksoft font-mono">
                {emp.created_at ? new Date(emp.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddEmployeeModal onCreated={handleCreated} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

// ─── Add Employee Modal ────────────────────────────────────────────────────────

function AddEmployeeModal({ onCreated, onClose }) {
  const [form, setForm] = useState({
    full_name: "", email: "", role_key: "R002", account_status: "Active", department: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.role_key) {
      setError("Full name, email, and role are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createEmployee(form);
      onCreated(result);
    } catch (err) {
      setError(err.message || "Could not create employee.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-paper border border-line rounded-xl shadow-xl w-full max-w-[480px] p-5 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-medium">Add new employee</h3>
            <p className="text-[13px] text-inksoft mt-1">
              A random temporary password will be generated. Share it with the employee.
            </p>
          </div>
          <button onClick={onClose} className="text-inksoft hover:text-ink text-xl leading-none mt-0.5">✕</button>
        </div>

        <div className="space-y-4">
          <Field label="Full name">
            <input className="field-input" placeholder="Priya Nair" value={form.full_name} onChange={update("full_name")} />
          </Field>
          <Field label="Email">
            <input type="email" className="field-input" placeholder="priya@recruitai.com" value={form.email} onChange={update("email")} />
          </Field>
          <Field label="Department (optional)">
            <input className="field-input" placeholder="Talent Acquisition" value={form.department} onChange={update("department")} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Role">
              <select className="field-input" value={form.role_key} onChange={update("role_key")}>
                {ROLES.map((r) => (
                  <option key={r.key} value={r.key}>{r.label} ({r.key})</option>
                ))}
              </select>
            </Field>
            <Field label="Account status">
              <select className="field-input" value={form.account_status} onChange={update("account_status")}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
          </div>
        </div>

        {error && <p className="text-xs text-stop mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={submit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? "Creating…" : "Create & get password"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[13px] text-inksoft block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
