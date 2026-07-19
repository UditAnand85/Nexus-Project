import { useState } from "react";
import { changeAdminPassword } from "../api/apiClient";

export default function ChangePassword({ admin, onChanged }) {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.current_password || !form.new_password || !form.confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.new_password.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.new_password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await changeAdminPassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      onChanged();
    } catch (err) {
      setError(err.message || "Could not change password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 py-8">
      <div className="bg-panel border border-line rounded-xl shadow-sm p-6 sm:p-11 w-full max-w-[420px]">
        {/* Header */}
        <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-amber-500">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h2 className="text-2xl mb-1.5">Set your password</h2>
        <p className="text-inksoft text-[13px] mb-7">
          Welcome, <span className="font-medium text-ink">{admin?.full_name?.split(" ")[0]}</span>!
          Your account was created by a Super Admin. Please set a personal password to continue.
        </p>

        <label className="text-[13px] text-inksoft block mb-1.5">Temporary password</label>
        <input
          type="password"
          className="field-input mb-4"
          placeholder="Enter the password you received"
          value={form.current_password}
          onChange={update("current_password")}
        />

        <label className="text-[13px] text-inksoft block mb-1.5">New password</label>
        <input
          type="password"
          className="field-input mb-4"
          placeholder="At least 8 characters"
          value={form.new_password}
          onChange={update("new_password")}
        />

        <label className="text-[13px] text-inksoft block mb-1.5">Confirm new password</label>
        <input
          type="password"
          className="field-input mb-5"
          placeholder="Repeat new password"
          value={form.confirm}
          onChange={update("confirm")}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        {error && <p className="text-xs text-stop mb-3">{error}</p>}

        <button onClick={submit} disabled={submitting} className="btn-primary w-full">
          {submitting ? "Saving…" : "Set password & continue"}
        </button>
      </div>
    </div>
  );
}
