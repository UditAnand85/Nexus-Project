import { useState } from "react";
import { submitApplication } from "../api/apiClient";
import { validateResumeFile } from "../utils/format";

export default function Apply({ job, account, onBack, onSubmitted }) {
  const [form, setForm] = useState({
    full_name: account?.full_name || "",
    email: account?.email || "",
    phone: account?.phone || "",
  });
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
    if (!form.email.trim()) next.email = "Enter your email.";
    if (!form.phone.trim()) next.phone = "Enter your phone number.";
    if (!file) next.resume = "Upload your resume as a PDF.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const student = await submitApplication({ ...form, job_id: job.job_id }, file, account);
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
      <p className="text-inksoft text-sm mt-2">
        Applying to <span className="font-medium text-ink">{job?.job_title}</span>
      </p>

      <div className="bg-panel border border-line rounded-xl shadow-sm p-9 max-w-[560px] mt-6">
        <Field label="Name" error={errors.full_name}>
          <input className="field-input" placeholder="Jordan Rivera" value={form.full_name} onChange={update("full_name")} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" className="field-input" placeholder="jordan@email.com" value={form.email} onChange={update("email")} />
        </Field>
        <Field label="Phone number" error={errors.phone}>
          <input className="field-input" placeholder="+91 90000 00000" value={form.phone} onChange={update("phone")} />
        </Field>

        <Field label="Resume (upload PDF)" error={errors.resume}>
          <label
            className={`block border-[1.5px] border-dashed rounded-lg p-6 text-center text-[13px] cursor-pointer ${
              file ? "border-solid border-go text-go bg-gosoft" : "border-line text-inksoft"
            }`}
          >
            {file ? `${file.name} — ready to submit` : "Click to upload your resume — PDF, under 5MB"}
            <input type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
          </label>
        </Field>

        {submitError && <p className="text-xs text-stop mb-3">{submitError}</p>}

        <button onClick={handleSubmit} disabled={submitting} className={`btn-primary w-full mt-1.5 flex items-center justify-center gap-2 ${submitting ? 'opacity-80 cursor-not-allowed' : ''}`}>
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Resume...
            </>
          ) : (
            "Submit application"
          )}
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
