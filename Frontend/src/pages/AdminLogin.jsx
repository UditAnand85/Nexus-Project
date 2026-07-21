import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminInitiateLogin, adminVerifyOTP } from "../api/apiClient";
import { validateEmail } from "../utils/format";

// Roles — 3 defined roles (R001 Super Admin, R002 Recruiter, R003 Employee)
const ADMIN_ROLES = [
  { key: "R001", label: "Super Admin",  description: "Full access — create, edit, delete" },
  { key: "R002", label: "Recruiter",    description: "Manage jobs and review candidates" },
  { key: "R003", label: "Employee",     description: "View-only access" },
];

export default function AdminLogin({ onLogin }) {
  // Step: "credentials" | "otp"
  const [step, setStep]             = useState("credentials");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [roleKey, setRoleKey]       = useState("R001");
  const [adminName, setAdminName]   = useState("");

  // OTP state
  const [otp, setOtp]               = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs                     = useRef([]);

  const [error, setError]           = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate                    = useNavigate();

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Step 1: Validate credentials & send OTP ──────────────────────────────
  const submitCredentials = async () => {
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address (max 30 characters).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await adminInitiateLogin(email, password);
      setAdminName(data.full_name || "");
      setStep("otp");
      setResendCooldown(30);
      // Focus first OTP cell after render
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || "Couldn't sign in. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const submitOTP = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Enter the 6-digit OTP sent to your email.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { admin } = await adminVerifyOTP(email, code);
      onLogin(admin);
    } catch (err) {
      setError(err.message || "Invalid or expired OTP. Try again.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  };

  // ── OTP input handling ───────────────────────────────────────────────────
  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return; // digits only
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setOtp(["", "", "", "", "", ""]);
    try {
      await adminInitiateLogin(email, password);
      setResendCooldown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError("Could not resend OTP. Please go back and try again.");
    }
  };

  const selectedRole = ADMIN_ROLES.find((r) => r.key === roleKey);

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4 py-8">
      <div className="bg-panel border border-line rounded-xl shadow-sm p-6 sm:p-11 w-full max-w-[420px]">

        {/* ── Step 1: Credentials ── */}
        {step === "credentials" && (
          <>
            <h2 className="text-2xl mb-1.5">Admin sign in</h2>
            <div className="text-inksoft text-[13px] mb-7">HR recruiter access only</div>

            {/* Role selector */}
            <label className="text-[13px] text-inksoft block mb-1.5">Select your role</label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {ADMIN_ROLES.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setRoleKey(role.key)}
                  className={`text-left px-3 py-2.5 rounded-lg border transition ${
                    roleKey === role.key
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-paper text-inksoft hover:border-ink hover:text-ink"
                  }`}
                >
                  <div className="text-[12px] font-medium leading-tight">{role.label}</div>
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
              id="admin-email"
              className="field-input mb-4"
              placeholder="admin@recruitai.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitCredentials()}
              maxLength={30}
            />

            <label className="text-[13px] text-inksoft block mb-1.5">Password</label>
            <input
              type="password"
              id="admin-password"
              className="field-input mb-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitCredentials()}
              maxLength={25}
            />

            <div className="flex justify-end mb-5">
              <Link
                to="/forgot-password?type=admin"
                className="text-[12px] text-inksoft hover:text-ink transition"
              >
                Forgot password?
              </Link>
            </div>

            {error && <p className="text-xs text-stop mb-3">{error}</p>}
            <button
              id="admin-sign-in-btn"
              onClick={submitCredentials}
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? "Verifying…" : "Continue →"}
            </button>
          </>
        )}

        {/* ── Step 2: OTP ── */}
        {step === "otp" && (
          <>
            <button
              onClick={() => { setStep("credentials"); setError(null); setOtp(["","","","","",""]); }}
              className="text-inksoft text-[12px] hover:text-ink transition flex items-center gap-1 mb-6"
            >
              ← Back
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EEEFEC] mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <h2 className="text-2xl mb-1">Check your email</h2>
              <p className="text-[13px] text-inksoft">
                We sent a 6-digit OTP to<br />
                <span className="font-medium text-ink">{email}</span>
              </p>
              {adminName && (
                <p className="text-[12px] text-inksoft mt-1">Hi, {adminName.split(" ")[0]} 👋</p>
              )}
            </div>

            {/* OTP Cells */}
            <div className="flex gap-2 justify-center mb-5" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(i, e)}
                  className={`w-11 h-12 text-center text-lg font-mono font-semibold border rounded-lg bg-paper outline-none transition
                    ${digit ? "border-ink" : "border-line"}
                    focus:border-ink focus:ring-1 focus:ring-ink`}
                />
              ))}
            </div>

            {error && <p className="text-xs text-stop mb-3 text-center">{error}</p>}

            <button
              id="admin-verify-otp-btn"
              onClick={submitOTP}
              disabled={submitting || otp.join("").length < 6}
              className="btn-primary w-full mb-4"
            >
              {submitting ? "Verifying…" : "Verify & Sign in"}
            </button>

            <p className="text-center text-[12px] text-inksoft">
              Didn't receive it?{" "}
              {resendCooldown > 0 ? (
                <span className="text-inksoft">Resend in {resendCooldown}s</span>
              ) : (
                <button onClick={handleResend} className="text-ink font-medium hover:underline">
                  Resend OTP
                </button>
              )}
            </p>

            <p className="text-center text-[11px] text-inksoft mt-3">
              OTP expires in 5 minutes. Check your spam folder if you don't see it.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
