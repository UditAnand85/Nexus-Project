import { useState } from "react";
import { adminLogin } from "../api/apiClient";

// Roles from the database ROLES table (R001–R004)
const ADMIN_ROLES = [
  { key: "R001", label: "Super Admin",     description: "Full access — create, edit, delete" },
  { key: "R002", label: "HR Manager",      description: "Manage jobs and review candidates" },
  { key: "R003", label: "Hiring Manager",  description: "View shortlists and recommend hires" },
  { key: "R004", label: "Viewer",          description: "Read-only access" },
];

export default function AdminLogin({ onLogin }) {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [roleKey, setRoleKey]     = useState("R001");
  const [error, setError]         = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { admin } = await adminLogin(email, password);
      onLogin(admin);
    } catch (err) {
      setError(err.message || "Couldn't sign in. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRole = ADMIN_ROLES.find((r) => r.key === roleKey);

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4 py-8">
      <div className="bg-panel border border-line rounded-xl shadow-sm p-6 sm:p-11 w-full max-w-[400px]">
        <h2 className="text-2xl mb-1.5">Admin sign in</h2>
        <div className="text-inksoft text-[13px] mb-7">HR recruiter access only</div>

        {/* Role selector */}
        <label className="text-[13px] text-inksoft block mb-1.5">Select your role</label>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {ADMIN_ROLES.map((role) => (
            <button
              key={role.key}
              type="button"
              onClick={() => setRoleKey(role.key)}
              className={`text-left px-3.5 py-2.5 rounded-lg border transition ${
                roleKey === role.key
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-paper text-inksoft hover:border-ink hover:text-ink"
              }`}
            >
              <div className="text-[13px] font-medium leading-tight">{role.label}</div>
              <div className={`text-[10px] mt-0.5 leading-tight ${roleKey === role.key ? "text-white/70" : "text-inksoft"}`}>
                {role.key}
              </div>
            </button>
          ))}
        </div>
        {selectedRole && (
          <p className="text-[11px] text-inksoft mb-5 -mt-2 font-mono">{selectedRole.description}</p>
        )}

        <label className="text-[13px] text-inksoft block mb-1.5">Email</label>
        <input
          type="email"
          className="field-input mb-4"
          placeholder="admin@recruitai.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        <label className="text-[13px] text-inksoft block mb-1.5">Password</label>
        <input
          type="password"
          className="field-input mb-5"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        {error && <p className="text-xs text-stop mb-3">{error}</p>}
        <button onClick={submit} disabled={submitting} className="btn-primary w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
