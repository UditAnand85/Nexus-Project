import { useState } from "react";
import { createJob } from "../api/apiClient";
import { EMPLOYMENT_TYPES } from "../constants/roles";

const EMPTY = {
  job_title: "", expected_ctc: "", job_location: "", employment_type: EMPLOYMENT_TYPES[0],
  openings: 1, application_start_date: "", application_end_date: "",
  job_description: "", evaluation_prompt: "", email_template: "default_evaluation_invite",
  resume_cutoff_score: 50,
  coding_round_enabled: false,
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
      await createJob({
        ...form,
        openings: Number(form.openings) || 1,
        resume_cutoff_score: Number(form.resume_cutoff_score) || 0,
      });
      onPublished();
    } catch (err) {
      setError(err.message || "Couldn't publish this job. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24">
      <button onClick={onBack} className="font-mono text-xs text-inksoft flex items-center gap-1.5 mb-6">
        ← Dashboard
      </button>
      <h1 className="text-2xl md:text-[28px] font-medium mb-6">New job posting</h1>

      <div className="bg-panel border border-line rounded-xl shadow-sm p-5 sm:p-8 max-w-[640px]">
        <Field label="job_title">
          <input className="field-input" placeholder="e.g. Backend Engineer" value={form.job_title} onChange={update("job_title")} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="expected_ctc">
            <input className="field-input" placeholder="₹15–22 LPA" value={form.expected_ctc} onChange={update("expected_ctc")} />
          </Field>
          <Field label="job_location">
            <input className="field-input" placeholder="Bengaluru (Hybrid)" value={form.job_location} onChange={update("job_location")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="employment_type">
            <select className="field-input" value={form.employment_type} onChange={update("employment_type")}>
              {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="openings">
            <input type="number" min="1" className="field-input" value={form.openings} onChange={update("openings")} />
          </Field>
          <Field label="ATS Resume Cutoff Score (0-100)">
            <input type="number" min="0" max="100" className="field-input" value={form.resume_cutoff_score} onChange={update("resume_cutoff_score")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <textarea rows={2} className="field-input" placeholder="What should the AI weigh when scoring resumes for this role?" value={form.evaluation_prompt} onChange={update("evaluation_prompt")} />
        </Field>

        <Field label="email_template">
          <input className="field-input" value={form.email_template} onChange={update("email_template")} />
        </Field>

        {/* ── Coding Round Toggle ─────────────────────────────────────────── */}
        <div className="mb-5">
          <div
            className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer select-none"
            style={{
              borderColor: form.coding_round_enabled ? "#0F0F0E" : "#E4E4DC",
              background: form.coding_round_enabled ? "#0F0F0E" : "#FAFAF8",
            }}
            onClick={() => setForm((f) => ({ ...f, coding_round_enabled: !f.coding_round_enabled }))}
            id="coding-round-toggle"
            role="switch"
            aria-checked={form.coding_round_enabled}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") setForm((f) => ({ ...f, coding_round_enabled: !f.coding_round_enabled })); }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-all"
                style={{ background: form.coding_round_enabled ? "rgba(255,255,255,0.12)" : "#EEEFEC" }}
              >
                💻
              </div>
              <div className="min-w-0">
                <div
                  className="text-sm font-semibold transition-colors"
                  style={{ color: form.coding_round_enabled ? "#FFFFFF" : "#0F0F0E" }}
                >
                  Coding Round
                </div>
                <div
                  className="text-xs mt-0.5 leading-relaxed transition-colors"
                  style={{ color: form.coding_round_enabled ? "rgba(255,255,255,0.65)" : "#9B9B8C" }}
                >
                  {form.coding_round_enabled
                    ? "3 LLaMA-generated coding problems will be added after the quiz."
                    : "Optional — enable for technical roles that require coding skills."}
                </div>
              </div>
            </div>

            {/* Slide Toggle */}
            <div className="flex-shrink-0">
              <div
                className="relative w-12 h-6 rounded-full transition-all duration-300"
                style={{
                  background: form.coding_round_enabled ? "#22c55e" : "rgba(255,255,255,0.2)",
                  border: form.coding_round_enabled ? "none" : "2px solid #C8C8C0",
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full shadow transition-all duration-300"
                  style={{
                    background: "#FFFFFF",
                    left: form.coding_round_enabled ? "calc(100% - 22px)" : "2px",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Badge when enabled */}
          {form.coding_round_enabled && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-inksoft font-mono">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
              Coding problems will be auto-generated via LLaMA after publishing.
              Score weight: <span className="text-ink font-semibold">30% aptitude · 40% technical · 30% coding</span>
            </div>
          )}
        </div>
        {/* ─────────────────────────────────────────────────────────────────── */}

        {error && <p className="text-xs text-stop mb-3">{error}</p>}
        <button onClick={publish} disabled={publishing} className="btn-primary w-full sm:w-auto">
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
