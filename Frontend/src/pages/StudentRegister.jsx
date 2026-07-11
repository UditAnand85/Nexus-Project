import { useState } from "react";
import { studentRegister } from "../api/apiClient";
import { validateEmail, validatePhone, validatePassword } from "../utils/format";

export default function StudentRegister({ onRegistered, onGoToLogin }) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.full_name.trim()) next.full_name = "Enter your full name.";
    if (!validateEmail(form.email)) next.email = "Enter a valid email.";
    if (!validatePhone(form.phone)) next.phone = "Enter a valid phone number.";
    if (!validatePassword(form.password)) next.password = "At least 6 characters.";
    if (form.confirm !== form.password) next.confirm = "Passwords don't match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const { account } = await studentRegister(form);
      onRegistered(account);
    } catch (err) {
      setFormError(err.message || "Couldn't create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4">
      <div className="bg-panel border border-line rounded-xl shadow-sm p-11 w-[400px]">
        <h2 className="text-2xl mb-1.5">Create your account</h2>
        <div className="text-inksoft text-[13px] mb-7">
          Apply to roles and track your application status.
        </div>

        <Field label="Full name" error={errors.full_name}>
          <input className="field-input" placeholder="Jordan Rivera" value={form.full_name} onChange={update("full_name")} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" className="field-input" placeholder="jordan@email.com" value={form.email} onChange={update("email")} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input className="field-input" placeholder="+91 90000 00000" value={form.phone} onChange={update("phone")} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" className="field-input" placeholder="At least 6 characters" value={form.password} onChange={update("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <input type="password" className="field-input" value={form.confirm} onChange={update("confirm")} />
        </Field>

        {formError && <p className="text-xs text-stop mb-3">{formError}</p>}

        <button onClick={submit} disabled={submitting} className="btn-primary w-full mt-1.5">
          {submitting ? "Creating account…" : "Create account"}
        </button>

        <p className="text-[13px] text-inksoft text-center mt-5">
          Already have an account?{" "}
          <button onClick={onGoToLogin} className="text-primary font-medium underline underline-offset-2">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="mb-4">
      <label className="text-[13px] text-inksoft block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-stop mt-1.5">{error}</p>}
    </div>
  );
}
