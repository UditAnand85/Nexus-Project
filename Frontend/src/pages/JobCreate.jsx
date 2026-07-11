import { useState } from "react";
import { createJob } from "../api/apiClient";
import { EMPLOYMENT_TYPES } from "../constants/roles";

const EMPTY = {
  job_title: "", expected_ctc: "", job_location: "", employment_type: EMPLOYMENT_TYPES[0],
  openings: 1, application_start_date: "", application_end_date: "",
  job_description: "", evaluation_prompt: "", email_template: "default_evaluation_invite",
};

export default function JobCreate({ onBack, onPublished }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const publish = async () => {
    if (!form.job_title.trim() || !form.job_description.trim()) {
      setError("Job title and description are required.");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      await createJob({ ...form, openings: Number(form.openings) || 1 });
      onPublished();
    } catch (err) {
      setError(err.message || "Couldn't publish this job. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-[1080px] mx-auto px-8 py-12 pb-24">
      <button onClick={onBack} className="font-mono text-xs text-inksoft flex items-center gap-1.5 mb-6">
        ← Dashboard
      </button>
      <h1 className="text-[28px] font-medium mb-6">New job posting</h1>

      <div className="bg-panel border border-line p-8 max-w-[640px]">
        <Field label="job_title">
          <input className="field-input" placeholder="e.g. Backend Engineer" value={form.job_title} onChange={update("job_title")} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="expected_ctc">
            <input className="field-input" placeholder="₹15–22 LPA" value={form.expected_ctc} onChange={update("expected_ctc")} />
          </Field>
          <Field label="job_location">
            <input className="field-input" placeholder="Bengaluru (Hybrid)" value={form.job_location} onChange={update("job_location")} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="employment_type">
            <select className="field-input" value={form.employment_type} onChange={update("employment_type")}>
              {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="openings">
            <input type="number" min="1" className="field-input" value={form.openings} onChange={update("openings")} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="application_start_date">
            <input type="date" className="field-input" value={form.application_start_date} onChange={update("application_start_date")} />
          </Field>
          <Field label="application_end_date">
            <input type="date" className="field-input" value={form.application_end_date} onChange={update("application_end_date")} />
          </Field>
        </div>

        <Field label="job_description">
          <textarea rows={4} className="field-input" placeholder="Role responsibilities and qualifications..." value={form.job_description} onChange={update("job_description")} />
        </Field>

        <Field label="evaluation_prompt">
          <textarea rows={2} className="field-input" placeholder="What should the AI weigh when scoring resumes and videos for this role?" value={form.evaluation_prompt} onChange={update("evaluation_prompt")} />
        </Field>

        <Field label="email_template">
          <input className="field-input" value={form.email_template} onChange={update("email_template")} />
        </Field>

        {error && <p className="text-xs text-stop mb-3">{error}</p>}
        <button onClick={publish} disabled={publishing} className="btn-primary">
          {publishing ? "Publishing…" : "Publish job (created_by: ADM-001)"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-5">
      <label className="text-[13px] text-inksoft block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
