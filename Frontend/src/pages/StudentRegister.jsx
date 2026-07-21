import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { studentRegister } from "../api/apiClient";
import { validateEmail, validatePhone, validatePassword } from "../utils/format";

export default function StudentRegister({ onRegistered }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.full_name.trim()) next.full_name = "Enter your full name.";
    if (!validateEmail(form.email)) next.email = "Enter a valid email address.";
    if (form.phone && !validatePhone(form.phone)) next.phone = "Phone number must be 10-20 digits.";
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
      const profile = await studentRegister(form);
      onRegistered(profile);
      navigate("/");
    } catch (err) {
      setFormError(err.message || "Couldn't create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4 py-8">
      <div className="bg-panel border border-line rounded-xl shadow-sm p-6 sm:p-11 w-full max-w-[400px]">
        <h2 className="text-2xl mb-1.5">Create your account</h2>
        <div className="text-inksoft text-[13px] mb-7">
          Apply to roles and track your application status.
        </div>

        <Field label="Full name" error={errors.full_name}>
          <input type="text" name="name" id="name" autoComplete="name" className="field-input" placeholder="Jordan Rivera" value={form.full_name} onChange={update("full_name")} maxLength={100} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" name="email" id="email" autoComplete="email" className="field-input" placeholder="jordan@email.com" value={form.email} onChange={update("email")} maxLength={255} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input type="tel" name="phone" id="phone" autoComplete="tel" className="field-input" placeholder="+91 90000 00000" value={form.phone} onChange={update("phone")} maxLength={20} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" name="password" id="password" autoComplete="new-password" className="field-input" placeholder="At least 6 characters" value={form.password} onChange={update("password")} maxLength={100} />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <input type="password" name="confirm_password" id="confirm_password" autoComplete="new-password" className="field-input" value={form.confirm} onChange={update("confirm")} maxLength={100} />
        </Field>

        {formError && <p className="text-xs text-stop mb-3">{formError}</p>}

        <button onClick={submit} disabled={submitting} className="btn-primary w-full mt-1.5">
          {submitting ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-sm text-inksoft mt-6">
          Already have an account?{" "}
          <Link to="/student-login" className="text-ink font-medium hover:underline">
            Sign in here
          </Link>
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
