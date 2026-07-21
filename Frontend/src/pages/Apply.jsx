import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { submitApplication, getJob } from "../api/apiClient";
import { validateResumeFile, validateEmail, validatePhone } from "../utils/format";
import { useApi } from "../utils/useApi";
import { Loading, ErrorState } from "../components/Status";

export default function Apply({ account, onSubmitted }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: job, loading, error } = useApi(() => (id ? getJob(id) : Promise.resolve(null)), [id]);

  const [form, setForm] = useState({
    full_name: account?.full_name || "",
    email: account?.email || "",
    phone: account?.phone || "",
  });

  useEffect(() => {
    if (account) {
      setForm((prev) => ({
        full_name: prev.full_name || account.full_name || "",
        email: prev.email || account.email || "",
        phone: prev.phone || account.phone || "",
      }));
    }
  }, [account]);

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
    if (!validateEmail(form.email)) next.email = "Enter a valid email address.";
    if (!validatePhone(form.phone)) next.phone = "Phone number must be 10-20 digits.";
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

  if (loading) return <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-8 md:py-12"><Loading label="Loading role…" /></div>;
  if (error) return <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-8 md:py-12"><ErrorState message={error} /></div>;
  if (!job) return null;

  return (
    <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24">
      <button onClick={() => navigate(`/job/${job.job_id}`)} className="font-mono text-[10px] md:text-xs text-inksoft flex items-center gap-1.5 mb-7">
        ← Back to role
      </button>
      <span className="font-mono text-[10px] md:text-xs uppercase tracking-wider text-inksoft block mb-3.5">Step 1 of 3</span>
      <h1 className="text-2xl md:text-[30px] font-medium">Submit your application</h1>
      <p className="text-inksoft mt-1.5 mb-8 text-sm md:text-base">Role: {job.job_title}</p>

      <div className="bg-panel border border-line rounded-xl shadow-sm p-5 sm:p-9 max-w-[560px] w-full mt-6">
        <Field label="Name" error={errors.full_name}>
          <input className="field-input" placeholder="Jordan Rivera" value={form.full_name} onChange={update("full_name")} maxLength={255} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" className="field-input" placeholder="jordan@email.com" value={form.email} onChange={update("email")} maxLength={255} />
        </Field>
        <Field label="Phone number" error={errors.phone}>
          <input className="field-input" placeholder="+91 90000 00000" value={form.phone} onChange={update("phone")} maxLength={20} />
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
