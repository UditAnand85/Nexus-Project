import { useState } from "react";
import { studentLogin } from "../api/apiClient";

export default function StudentLogin({ onLoggedIn, onGoToRegister }) {
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
      const { account } = await studentLogin(email, password);
      onLoggedIn(account);
    } catch (err) {
      setError(err.message || "Couldn't sign in. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4">
      <div className="bg-panel border border-line rounded-xl shadow-sm p-11 w-[380px]">
        <h2 className="text-2xl mb-1.5">Sign in</h2>
        <div className="text-inksoft text-[13px] mb-7">
          Track your applications and continue where you left off.
        </div>

        <label className="text-[13px] text-inksoft block mb-1.5">Email</label>
        <input
          type="email"
          className="field-input mb-4"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="text-[13px] text-inksoft block mb-1.5">Password</label>
        <input
          type="password"
          className="field-input mb-2"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-inksoft mb-4">
          Try <span className="font-mono">ananya.sharma@email.com</span> / <span className="font-mono">demo1234</span> for a sample account.
        </p>

        {error && <p className="text-xs text-stop mb-3">{error}</p>}
        <button onClick={submit} disabled={submitting} className="btn-primary w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-[13px] text-inksoft text-center mt-5">
          New here?{" "}
          <button onClick={onGoToRegister} className="text-primary font-medium underline underline-offset-2">
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
