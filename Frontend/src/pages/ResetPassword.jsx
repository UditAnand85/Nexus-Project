import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { adminResetPassword, studentResetPassword } from "../api/apiClient";

/**
 * ResetPassword page
 * Accessible at: /reset-password?token=<token>&type=admin|student
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const type = searchParams.get("type") === "admin" ? "admin" : "student";

  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting]       = useState(false);
  const [done, setDone]                   = useState(false);
  const [error, setError]                 = useState(null);
  const [showPwd, setShowPwd]             = useState(false);

  const isAdmin = type === "admin";

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-[70vh] px-4 py-8">
        <div className="bg-panel border border-line rounded-xl shadow-sm p-6 sm:p-11 w-full max-w-[400px] text-center">
          <p className="text-stop text-sm mb-4">Invalid or missing reset link.</p>
          <Link to={isAdmin ? "/admin-login" : "/student-login"} className="btn-primary inline-block">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isAdmin) {
        await adminResetPassword(token, newPassword);
      } else {
        await studentResetPassword(token, newPassword);
      }
      setDone(true);
    } catch (err) {
      setError(err.message || "Reset failed. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  const backLink = isAdmin ? "/admin-login" : "/student-login";

  if (done) {
    return (
      <div className="flex justify-center items-center min-h-[70vh] px-4 py-8">
        <div className="bg-panel border border-line rounded-xl shadow-sm p-6 sm:p-11 w-full max-w-[400px]">
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 border border-green-200 mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-2xl mb-2">Password reset!</h2>
            <p className="text-[13px] text-inksoft mb-7 leading-relaxed">
              Your password has been updated successfully. You can now sign in with your new password.
            </p>
            <Link to={backLink} className="btn-primary inline-block">
              Sign in now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4 py-8">
      <div className="bg-panel border border-line rounded-xl shadow-sm p-6 sm:p-11 w-full max-w-[400px]">

        {/* Header */}
        <div className="mb-7">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#EEEFEC] mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 className="text-2xl mb-1.5">Set new password</h2>
          <p className="text-[13px] text-inksoft">Choose a strong password for your account.</p>
          <span className="inline-block mt-2 text-[11px] font-mono px-2 py-0.5 rounded bg-[#EEEFEC] text-inksoft">
            {isAdmin ? "Admin account" : "Candidate account"}
          </span>
        </div>

        {/* New password */}
        <label className="text-[13px] text-inksoft block mb-1.5">New password</label>
        <div className="relative mb-4">
          <input
            type={showPwd ? "text" : "password"}
            id="reset-new-password"
            className="field-input pr-10 w-full"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-inksoft hover:text-ink"
            tabIndex={-1}
          >
            {showPwd ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>

        {/* Confirm password */}
        <label className="text-[13px] text-inksoft block mb-1.5">Confirm password</label>
        <input
          type={showPwd ? "text" : "password"}
          id="reset-confirm-password"
          className="field-input mb-5"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        {/* Strength hint */}
        {newPassword && (
          <div className="flex gap-1 mb-4 -mt-3">
            {[8, 12, 16].map((len) => (
              <div
                key={len}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  newPassword.length >= len ? "bg-green-400" : "bg-line"
                }`}
              />
            ))}
            <span className="text-[10px] text-inksoft ml-1">
              {newPassword.length < 8 ? "Too short" : newPassword.length < 12 ? "OK" : "Strong"}
            </span>
          </div>
        )}

        {error && <p className="text-xs text-stop mb-3">{error}</p>}

        <button
          id="reset-password-submit-btn"
          onClick={submit}
          disabled={submitting}
          className="btn-primary w-full mb-4"
        >
          {submitting ? "Updating…" : "Reset password"}
        </button>

        <Link
          to={backLink}
          className="block text-center text-[13px] text-inksoft hover:text-ink transition"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
