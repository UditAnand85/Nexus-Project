import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminForgotPassword, studentForgotPassword } from "../api/apiClient";

/**
 * ForgotPassword page
 * Accessible at: /forgot-password?type=admin  or  /forgot-password?type=student
 * Defaults to student if type param is absent.
 */
export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") === "admin" ? "admin" : "student";

  const [email, setEmail]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState(null);

  const isAdmin = type === "admin";

  const submit = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isAdmin) {
        await adminForgotPassword(email);
      } else {
        await studentForgotPassword(email);
      }
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const backLink = isAdmin ? "/admin-login" : "/student-login";

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4 py-8">
      <div className="bg-panel border border-line rounded-xl shadow-sm p-6 sm:p-11 w-full max-w-[400px]">

        {!sent ? (
          <>
            {/* Header */}
            <div className="mb-7">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#EEEFEC] mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h2 className="text-2xl mb-1.5">Forgot password?</h2>
              <p className="text-[13px] text-inksoft">
                {isAdmin
                  ? "Enter your admin email and we'll send you a reset link."
                  : "Enter your account email and we'll send you a reset link."}
              </p>
              <span className="inline-block mt-2 text-[11px] font-mono px-2 py-0.5 rounded bg-[#EEEFEC] text-inksoft">
                {isAdmin ? "Admin account" : "Candidate account"}
              </span>
            </div>

            <label className="text-[13px] text-inksoft block mb-1.5">Email address</label>
            <input
              type="email"
              id="forgot-password-email"
              className="field-input mb-5"
              placeholder={isAdmin ? "admin@recruitai.com" : "you@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
            />

            {error && <p className="text-xs text-stop mb-3">{error}</p>}

            <button
              id="forgot-password-submit-btn"
              onClick={submit}
              disabled={submitting}
              className="btn-primary w-full mb-4"
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>

            <Link
              to={backLink}
              className="block text-center text-[13px] text-inksoft hover:text-ink transition"
            >
              ← Back to sign in
            </Link>
          </>
        ) : (
          /* Success state */
          <>
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 border border-green-200 mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="text-2xl mb-2">Check your inbox</h2>
              <p className="text-[13px] text-inksoft leading-relaxed mb-2">
                If an account exists for{" "}
                <span className="font-medium text-ink">{email}</span>,
                we've sent a password reset link.
              </p>
              <p className="text-[12px] text-inksoft mb-7">
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
              <Link
                to={backLink}
                className="btn-primary inline-block"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
