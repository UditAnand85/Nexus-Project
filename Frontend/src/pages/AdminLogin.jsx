import { useState } from "react";
import { adminLogin } from "../api/apiClient";

export default function AdminLogin({ onLogin }) {
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
      await adminLogin(email, password);
      onLogin();
    } catch (err) {
      setError(err.message || "Couldn't sign in. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="bg-panel border border-line p-11 w-[360px]">
        <h2 className="text-2xl mb-1.5">Admin sign in</h2>
        <div className="text-inksoft text-[13px] mb-7">HR recruiter access only</div>

        <label className="text-[13px] text-inksoft block mb-1.5">Email</label>
        <input
          type="email"
          className="field-input mb-5"
          placeholder="priya.nair@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="text-[13px] text-inksoft block mb-1.5">Password</label>
        <input
          type="password"
          className="field-input mb-5"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-xs text-stop mb-3">{error}</p>}
        <button onClick={submit} disabled={submitting} className="btn-primary w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
