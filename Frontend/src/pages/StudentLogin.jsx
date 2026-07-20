import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { studentLogin } from "../api/apiClient";

export default function StudentLogin({ onLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      setError("Enter both email and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const profile = await studentLogin(email, password);
      onLoggedIn(profile);
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Couldn't sign in. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4 py-8">
      <div className="bg-panel border border-line rounded-xl shadow-sm p-6 sm:p-11 w-full max-w-[380px]">
        <h2 className="text-2xl mb-1.5">Sign in</h2>
        <div className="text-inksoft text-[13px] mb-7">
          Track your applications and continue where you left off.
        </div>

        <label className="text-[13px] text-inksoft block mb-1.5">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          autoComplete="email"
          className="field-input mb-4"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="text-[13px] text-inksoft block mb-1.5">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          autoComplete="current-password"
          className="field-input mb-2"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end mb-4">
          <Link to="/forgot-password?type=student" className="text-[12px] text-inksoft hover:text-ink transition">
            Forgot password?
          </Link>
        </div>
        <p className="text-xs text-inksoft mb-4">
          Try <span className="font-mono">ananya.sharma@email.com</span> / <span className="font-mono">demo1234</span> for a sample account.
        </p>


        {error && <p className="text-xs text-stop mb-3">{error}</p>}
        <button onClick={submit} disabled={submitting} className="btn-primary w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-center text-sm text-inksoft mt-6">
          Don't have an account?{" "}
          <Link to="/student-register" className="text-ink font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
