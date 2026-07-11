import { useState } from "react";
import { submitApplication } from "../api/apiClient";
import { validateResumeFile, validateEmail, validatePhone } from "../utils/format";

export default function Apply({ job, onBack, onSubmitted }) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", skills: "", achievements: "" });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    const err = validateResumeFile(f);
    if (err) {
      setErrors((prev) => ({ ...prev, resume: err }));
      setFile(null);
    } else {
      setErrors((prev) => ({ ...prev, resume: null }));
      setFile(f);
    }
  };

  const validate = () => {
    const next = {};
    if (!form.full_name.trim()) next.full_name = "Enter your full name.";
    if (!validateEmail(form.email)) next.email = "Enter a valid email.";
    if (!validatePhone(form.phone)) next.phone = "Enter a valid phone number.";
    if (!form.skills.trim()) next.skills = "List at least one skill.";
    if (!file) next.resume = "Upload your resume as a PDF.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const student = await submitApplication({ ...form, job_id: job.job_id }, file);
      onSubmitted(student);
    } catch (err) {
      setSubmitError(err.message || "Couldn't submit your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1080px] mx-auto px-8 py-12 pb-24">
      <button onClick={onBack} className="font-mono text-xs text-inksoft flex items-center gap-1.5 mb-7">
        ← Back to role
      </button>
      <span className="font-mono text-xs uppercase tracking-wider text-inksoft block mb-3.5">Step 1 of 3</span>
      <h1 className="text-[30px] font-medium">Submit your application</h1>

      <div className="bg-panel border border-line p-9 max-w-[560px] mt-6">
        <Field label="full_name" error={errors.full_name}>
          <input className="field-input" placeholder="Jordan Rivera" value={form.full_name} onChange={update("full_name")} />
        </Field>
        <Field label="email" error={errors.email}>
          <input type="email" className="field-input" placeholder="jordan@email.com" value={form.email} onChange={update("email")} />
        </Field>
        <Field label="phone" error={errors.phone}>
          <input className="field-input" placeholder="+91 90000 00000" value={form.phone} onChange={update("phone")} />
        </Field>
        <Field label="skills" error={errors.skills}>
          <input className="field-input" placeholder="Figma, Design Systems, User Research" value={form.skills} onChange={update("skills")} />
        </Field>
        <Field label="achievements">
          <input className="field-input" placeholder="Optional — awards, publications, notable projects" value={form.achievements} onChange={update("achievements")} />
        </Field>

        <Field label="resume_url (upload PDF)" error={errors.resume}>
          <label
            className={`block border-[1.5px] border-dashed p-6 text-center text-[13px] cursor-pointer rounded-sm ${
              file ? "border-solid border-go text-go bg-gosoft" : "border-line text-inksoft"
            }`}
          >
            {file ? `${file.name} — ready to submit` : "Click to upload your resume — PDF, under 5MB"}
            <input type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
          </label>
        </Field>

        {submitError && <p className="text-xs text-stop mb-3">{submitError}</p>}

        <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full mt-1.5">
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="mb-5">
      <label className="text-[13px] text-inksoft block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-stop mt-1.5">{error}</p>}
    </div>
  );
}
