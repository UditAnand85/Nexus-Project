import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { APP_NAME } from "../constants/roles";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const STAGES = [
  { key: "video",     step: 1, label: "Video Introduction", icon: "🎥", description: "Record a short video introducing yourself and your background." },
  { key: "aptitude",  step: 2, label: "Aptitude Test",      icon: "🧠", description: "Assess your logical reasoning, numerical, and verbal abilities." },
  { key: "technical", step: 3, label: "Technical Assessment", icon: "💻", description: "Demonstrate your role-specific technical knowledge and skills." },
  { key: "final",     step: 4, label: "Final Review",       icon: "⭐", description: "A panel review of your overall performance across all rounds." },
];

export default function EvaluationLanding() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | valid | invalid | expired
  const [candidate, setCandidate] = useState(null);
  const [job, setJob] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMsg("No evaluation token was provided.");
      return;
    }

    fetch(`${API_BASE}/evaluate/verify?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCandidate(data.data.student);
          setJob(data.data.job);
          setStatus("valid");
        } else {
          const isExpired = data.message?.toLowerCase().includes("expired");
          setStatus(isExpired ? "expired" : "invalid");
          setErrorMsg(data.message || "Invalid evaluation link.");
        }
      })
      .catch(() => {
        setStatus("invalid");
        setErrorMsg("Could not reach the server. Please try again later.");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-inksoft text-sm">Verifying your evaluation link…</p>
        </div>
      </div>
    );
  }

  if (status === "invalid" || status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">{status === "expired" ? "⏰" : "🔗"}</div>
          <h1 className="text-2xl font-semibold text-ink mb-2">
            {status === "expired" ? "Link Expired" : "Invalid Link"}
          </h1>
          <p className="text-inksoft text-sm leading-relaxed">{errorMsg}</p>
          {status === "expired" && (
            <p className="text-inksoft text-xs mt-3">
              Please contact your recruiter to receive a new link.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Top Bar */}
      <div className="bg-paper border-b border-line px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-ink rounded-md flex items-center justify-center">
            <span className="text-white font-mono font-semibold text-[11px]">RA</span>
          </div>
          <span className="font-serif font-semibold text-[18px] text-ink">{APP_NAME}</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-ink">{job?.job_title}</div>
          <div className="text-xs text-inksoft font-mono">Candidate Evaluation Portal</div>
        </div>
      </div>

      <div className="flex-1 max-w-[680px] mx-auto w-full px-6 py-12">
        {/* Welcome header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-gosoft text-go text-xs font-mono px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-go rounded-full animate-pulse inline-block" />
            Evaluation Active
          </div>
          <h1 className="text-3xl font-semibold text-ink mb-2">
            Welcome, {candidate?.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="text-inksoft text-[15px] leading-relaxed">
            You've been shortlisted for <strong className="text-ink">{job?.job_title}</strong>.
            Complete all four stages below to proceed in the hiring process.
          </p>
        </div>

        {/* Stage stepper */}
        <div className="mb-8">
          <div className="flex items-center gap-0 mb-8 relative">
            {STAGES.map((stage, idx) => (
              <div key={stage.key} className="flex-1 flex items-center">
                {/* Step circle */}
                <div className="flex flex-col items-center gap-1.5 z-10 relative flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all border-2 ${
                    idx === 0
                      ? "bg-ink border-ink text-white shadow-md"
                      : "bg-paper border-line text-inksoft"
                  }`}>
                    {stage.step}
                  </div>
                  <span className="text-[10px] font-mono text-inksoft whitespace-nowrap">{stage.label.split(" ")[0]}</span>
                </div>
                {/* Connector line */}
                {idx < STAGES.length - 1 && (
                  <div className="flex-1 h-px bg-line mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stage cards */}
        <div className="flex flex-col gap-3 mb-10">
          {STAGES.map((stage, idx) => (
            <div
              key={stage.key}
              className={`bg-paper border rounded-xl p-5 flex items-start gap-4 transition-all ${
                idx === 0
                  ? "border-ink shadow-sm"
                  : "border-line opacity-60"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                idx === 0 ? "bg-ink/5" : "bg-[#EEEFEC]"
              }`}>
                {stage.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-inksoft">STEP {stage.step}</span>
                  {idx === 0 && (
                    <span className="font-mono text-[10px] bg-gosoft text-go px-2 py-0.5 rounded-full">Up Next</span>
                  )}
                </div>
                <div className="text-sm font-semibold text-ink">{stage.label}</div>
                <div className="text-xs text-inksoft mt-0.5 leading-relaxed">{stage.description}</div>
              </div>
              {idx === 0 ? (
                <button
                  disabled
                  className="btn-primary text-sm px-4 py-2 flex-shrink-0 opacity-50 cursor-not-allowed"
                  title="Coming soon"
                >
                  Begin →
                </button>
              ) : (
                <div className="w-5 h-5 rounded-full border border-line flex-shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="bg-holdsoft border border-hold/30 rounded-xl p-4 flex gap-3">
          <div className="text-hold mt-0.5 flex-shrink-0">ℹ</div>
          <div>
            <div className="text-sm font-medium text-ink mb-1">Important Instructions</div>
            <ul className="text-xs text-inksoft leading-relaxed space-y-1">
              <li>• Complete all stages in order — you cannot skip ahead.</li>
              <li>• Ensure you are in a quiet, well-lit environment for your video introduction.</li>
              <li>• Once a stage is started, it must be completed in a single session.</li>
              <li>• Your evaluation link is personal. Do not share it with anyone.</li>
            </ul>
          </div>
        </div>

        {/* Candidate info footer */}
        <div className="mt-8 pt-6 border-t border-line flex items-center justify-between">
          <div>
            <div className="text-xs text-inksoft">Signed in as</div>
            <div className="text-sm font-medium text-ink">{candidate?.full_name}</div>
            <div className="text-xs text-inksoft font-mono">{candidate?.email}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-inksoft">ATS Resume Score</div>
            <div className="text-2xl font-mono font-bold text-primary">
              {candidate?.resume_score ? `${parseFloat(candidate.resume_score).toFixed(0)}` : "—"}
              <span className="text-sm font-normal text-inksoft">/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
