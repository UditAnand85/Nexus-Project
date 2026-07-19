import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { APP_NAME } from "../constants/roles";
import { getEvaluationQuestions, submitEvaluation } from "../api/apiClient";
import { apiFetch } from "../api/config";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// ─── Timer hook ───────────────────────────────────────────────────────────────
function useTimer(initialSeconds, onExpire) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const ref = useRef(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(ref.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, []); // eslint-disable-line

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return { remaining, display: fmt(remaining) };
}

// ─── Result Screen ────────────────────────────────────────────────────────────
function ResultScreen({ candidate, job }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <div className="bg-paper border-b border-line px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-ink rounded-md flex items-center justify-center">
            <span className="text-white font-mono font-semibold text-[11px]">RA</span>
          </div>
          <span className="font-serif font-semibold text-[18px] text-ink">{APP_NAME}</span>
        </div>
        <div className="text-xs text-inksoft font-mono">Evaluation Complete</div>
      </div>

      <div className="flex-1 max-w-[600px] mx-auto w-full px-5 sm:px-6 py-10 sm:py-14 text-center">
        {/* Checkmark */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl sm:text-4xl" style={{ background: `#22c55e18`, border: `2px solid #22c55e` }}>
          ✅
        </div>

        <span className="font-mono text-xs uppercase tracking-wider text-inksoft block mb-2">Evaluation Complete</span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink mb-1">Submitted Successfully!</h1>
        <p className="text-inksoft text-sm mb-10">You've completed the evaluation for <strong className="text-ink">{job?.job_title}</strong></p>

        <p className="text-sm text-inksoft leading-relaxed">
          Your responses have been recorded. The hiring team at <strong className="text-ink">{job?.job_title}</strong> will review your performance and reach out to you at <strong className="text-ink">{candidate?.email}</strong>.
        </p>
      </div>
    </div>
  );
}

// ─── Quiz Screen ──────────────────────────────────────────────────────────────
function QuizScreen({ questions, token, candidate, job, onComplete }) {
  const allQuestions = questions; // already mixed array passed in
  const total = allQuestions.length;
  const QUIZ_SECONDS = total * 72; // ~72s per question

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { question_id: selected_option }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [section, setSection] = useState("aptitude"); // 'aptitude' | 'technical'

  const aptitudeCount = questions.filter((q) => q.type === "aptitude").length;

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = allQuestions.map((q) => ({
        question_id: q.question_id,
        type: q.type,
        selected_option: answers[q.question_id] || null,
      }));
      const result = await submitEvaluation(token, payload);
      onComplete(result);
    } catch (err) {
      setSubmitError(err.message || "Submission failed. Please try again.");
      setSubmitting(false);
    }
  }, [answers, allQuestions, token, onComplete]);

  const { display: timerDisplay, remaining } = useTimer(QUIZ_SECONDS, handleSubmit);

  const q = allQuestions[current];
  const answered = Object.keys(answers).length;
  const progress = ((current + 1) / total) * 100;
  const timerColor = remaining < 120 ? "#ef4444" : remaining < 300 ? "#f59e0b" : "#22c55e";

  const selectOption = (opt) => setAnswers((prev) => ({ ...prev, [q.question_id]: opt }));

  const goNext = () => {
    if (current < total - 1) {
      setCurrent(current + 1);
      if (current + 1 === aptitudeCount) setSection("technical");
    }
  };
  const goPrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
      if (current === aptitudeCount) setSection("aptitude");
    }
  };

  const sectionLabel = current < aptitudeCount ? "Aptitude Test" : "Technical Assessment";
  const sectionNum = current < aptitudeCount ? current + 1 : current - aptitudeCount + 1;
  const sectionTotal = current < aptitudeCount ? aptitudeCount : total - aptitudeCount;

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Header */}
      <div className="bg-paper border-b border-line px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 bg-ink rounded-md flex items-center justify-center shrink-0">
            <span className="text-white font-mono font-semibold text-[10px]">RA</span>
          </div>
          <span className="font-medium text-sm text-ink truncate max-w-[110px] sm:max-w-none">{sectionLabel}</span>
          <span className="font-mono text-[11px] text-inksoft shrink-0">Q{sectionNum}/{sectionTotal}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block text-xs text-inksoft">{answered}/{total} answered</div>
          <div className="font-mono text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-1 rounded-lg" style={{ color: timerColor, background: `${timerColor}15` }}>
            ⏱ {timerDisplay}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#E4E4E0]">
        <div className="h-full bg-ink transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Section divider indicator */}
      <div className="flex bg-paper border-b border-line">
        {["aptitude", "technical"].map((sec, i) => (
          <div
            key={sec}
            className="flex-1 text-center py-2 text-[11px] font-mono transition-colors"
            style={{
              background: section === sec ? "rgba(0,0,0,0.04)" : "transparent",
              color: section === sec ? "#0F0F0E" : "#9B9B8C",
              borderBottom: section === sec ? "2px solid #0F0F0E" : "2px solid transparent",
            }}
          >
            {i + 1}. {sec === "aptitude" ? `Aptitude (${aptitudeCount}Q)` : `Technical (${total - aptitudeCount}Q)`}
          </div>
        ))}
      </div>

      {/* Question */}
      <div className="flex-1 max-w-[720px] mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[10px] text-inksoft bg-[#EEEFEC] px-2 py-0.5 rounded">{q.category}</span>
        </div>

        <h2 className="text-base sm:text-[17px] font-medium text-ink leading-relaxed mb-6 sm:mb-7">
          <span className="text-inksoft font-mono text-sm mr-2">{current + 1}.</span>
          {q.question}
        </h2>

        {/* Options */}
        <div className="flex flex-col gap-3 mb-8 sm:mb-10">
          {["A", "B", "C", "D"].map((opt) => {
            const text = q[`option_${opt.toLowerCase()}`];
            const selected = answers[q.question_id] === opt;
            return (
              <button
                key={opt}
                onClick={() => selectOption(opt)}
                className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all"
                style={{
                  borderColor: selected ? "#0F0F0E" : "#E4E4DC",
                  background: selected ? "#0F0F0E" : "#FFFFFF",
                  color: selected ? "#FFFFFF" : "#0F0F0E",
                }}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-mono font-bold flex-shrink-0 mt-0.5 transition-all"
                  style={{
                    background: selected ? "rgba(255,255,255,0.15)" : "#F4F4F1",
                    color: selected ? "#FFFFFF" : "#0F0F0E",
                  }}
                >
                  {opt}
                </span>
                <span className="text-sm leading-relaxed">{text}</span>
              </button>
            );
          })}
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {submitError}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={goPrev}
            disabled={current === 0}
            className="px-3.5 sm:px-5 py-2.5 rounded-lg border border-line text-sm font-medium text-ink disabled:opacity-30 hover:bg-[#F4F4F1] transition-colors whitespace-nowrap"
          >
            ← Previous
          </button>

          <div className="flex gap-2">
            {/* Quick jump dots (show first 5 and last 5 only) */}
            <div className="hidden sm:flex items-center gap-1">
              {allQuestions.slice(0, Math.min(total, 10)).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); if (i >= aptitudeCount) setSection("technical"); else setSection("aptitude"); }}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: i === current ? "#0F0F0E" : answers[allQuestions[i]?.question_id] ? "#22c55e" : "#D4D4C8",
                  }}
                />
              ))}
              {total > 10 && <span className="text-inksoft text-xs font-mono">+{total - 10}</span>}
            </div>
          </div>

          {current < total - 1 ? (
            <button
              onClick={goNext}
              className="px-3.5 sm:px-5 py-2.5 rounded-lg bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors whitespace-nowrap"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap"
              style={{ background: submitting ? "#E4E4DC" : "#22c55e", color: submitting ? "#9B9B8C" : "#FFFFFF" }}
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
              ) : (
                "Submit Test ✓"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main EvaluationLanding ───────────────────────────────────────────────────

const STAGES = [
  { key: "aptitude", step: 1, label: "Aptitude Test", icon: "🧠", description: "20 questions — Spatial, Quantitative & Analytical reasoning.", time: "~25 min" },
  { key: "technical", step: 2, label: "Technical Assessment", icon: "💻", description: "30 questions — Role-specific knowledge & Computer Science fundamentals.", time: "~35 min" },
  { key: "final", step: 3, label: "Final Review", icon: "⭐", description: "Results reviewed by the hiring team." },
];

export default function EvaluationLanding() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | valid | invalid | expired | completed
  const [candidate, setCandidate] = useState(null);
  const [job, setJob] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Quiz flow state
  const [screen, setScreen] = useState("landing"); // landing | loading_q | quiz | result
  const [questions, setQuestions] = useState([]); // flat array: aptitude first, then technical
  const [result, setResult] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMsg("No evaluation token was provided.");
      return;
    }
    fetch(`${API_BASE}/evaluate/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCandidate(data.data.student);
          setJob(data.data.job);
          if (data.data.already_completed) setStatus("completed");
          else setStatus("valid");
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

  const handleBegin = async () => {
    setScreen("loading_q");
    setLoadError(null);
    try {
      const data = await getEvaluationQuestions(token);
      // Merge: aptitude first, then technical, each tagged with type
      const merged = [
        ...data.aptitude.map((q) => ({ ...q, type: "aptitude" })),
        ...data.technical.map((q) => ({ ...q, type: "technical" })),
      ];
      setQuestions(merged);
      setScreen("quiz");
    } catch (err) {
      setLoadError(err.message || "Failed to load questions. Please try again.");
      setScreen("landing");
    }
  };

  const handleComplete = (scoreResult) => {
    setResult(scoreResult);
    setScreen("result");
  };

  // ── Loading ──
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

  // ── Invalid / Expired ──
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
            <p className="text-inksoft text-xs mt-3">Please contact your recruiter to receive a new link.</p>
          )}
        </div>
      </div>
    );
  }

  // ── Already Completed ──
  if (status === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-5">✅</div>
          <h1 className="text-2xl font-semibold text-ink mb-2">Already Submitted</h1>
          <p className="text-inksoft text-sm leading-relaxed">
            You have already completed this evaluation, {candidate?.full_name?.split(" ")[0]}. Your results have been sent to the hiring team.
          </p>
        </div>
      </div>
    );
  }

  // ── Quiz in progress ──
  if (screen === "quiz") {
    return (
      <QuizScreen
        questions={questions}
        token={token}
        candidate={candidate}
        job={job}
        onComplete={handleComplete}
      />
    );
  }

  // ── Result screen ──
  if (screen === "result" && result) {
    return <ResultScreen candidate={candidate} job={job} />;
  }

  // ── Landing page ──
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Top Bar */}
      <div className="bg-paper border-b border-line px-4 sm:px-8 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 bg-ink rounded-md flex items-center justify-center shrink-0">
            <span className="text-white font-mono font-semibold text-[11px]">RA</span>
          </div>
          <span className="font-serif font-semibold text-[18px] text-ink">{APP_NAME}</span>
        </div>
        <div className="text-left sm:text-right min-w-0">
          <div className="text-sm font-medium text-ink truncate max-w-[220px] sm:max-w-none">{job?.job_title}</div>
          <div className="text-xs text-inksoft font-mono">Candidate Evaluation Portal</div>
        </div>
      </div>

      <div className="flex-1 max-w-[680px] mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-gosoft text-go text-xs font-mono px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-go rounded-full animate-pulse inline-block" />
            Evaluation Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink mb-2">
            Welcome, {candidate?.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="text-inksoft text-[15px] leading-relaxed">
            You've been shortlisted for <strong className="text-ink">{job?.job_title}</strong>.
            Complete all stages below to proceed in the hiring process.
          </p>
        </div>

        {/* Stage stepper */}
        <div className="flex items-center gap-0 mb-8 relative">
          {STAGES.map((stage, idx) => (
            <div key={stage.key} className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-1.5 z-10 relative flex-shrink-0">
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all border-2 ${idx === 0 ? "bg-ink border-ink text-white shadow-md" : "bg-paper border-line text-inksoft"}`}>
                  {stage.step}
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono text-inksoft whitespace-nowrap">{stage.label.split(" ")[0]}</span>
              </div>
              {idx < STAGES.length - 1 && <div className="flex-1 h-px bg-line mx-1" />}
            </div>
          ))}
        </div>

        {/* Stage cards */}
        <div className="flex flex-col gap-3 mb-8">
          {STAGES.map((stage, idx) => (
            <div
              key={stage.key}
              className={`bg-paper border rounded-xl p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-start gap-3 sm:gap-4 transition-all ${idx === 0 ? "border-ink shadow-sm" : "border-line opacity-60"}`}
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-base sm:text-lg flex-shrink-0 ${idx === 0 ? "bg-ink/5" : "bg-[#EEEFEC]"}`}>
                {stage.icon}
              </div>
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-[10px] text-inksoft">STEP {stage.step}</span>
                  {idx === 0 && <span className="font-mono text-[10px] bg-gosoft text-go px-2 py-0.5 rounded-full">Up Next</span>}
                </div>
                <div className="text-sm font-semibold text-ink">{stage.label}</div>
                <div className="text-xs text-inksoft mt-0.5 leading-relaxed">{stage.description}</div>
                {stage.time && idx === 0 && <div className="text-xs text-inksoft mt-1 font-mono">⏱ {stage.time}</div>}
              </div>
              {idx === 0 ? (
                <div className="flex-shrink-0 w-full sm:w-auto">
                  {screen === "loading_q" ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-ink/10 rounded-lg">
                      <span className="w-3.5 h-3.5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                      <span className="text-xs text-ink">Loading…</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleBegin}
                      className="btn-primary text-sm px-4 py-2 w-full sm:w-auto"
                    >
                      Begin →
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-line flex-shrink-0 mt-1 hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-5">
            {loadError}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-holdsoft border border-hold/30 rounded-xl p-4 flex gap-3">
          <div className="text-hold mt-0.5 flex-shrink-0">ℹ</div>
          <div>
            <div className="text-sm font-medium text-ink mb-1">Important Instructions</div>
            <ul className="text-xs text-inksoft leading-relaxed space-y-1">
              <li>• Complete all stages in order — you cannot skip ahead.</li>
              <li>• Once the quiz starts, it must be completed in a single session.</li>
              <li>• The timer will auto-submit when it reaches zero.</li>
              <li>• Your evaluation link is personal. Do not share it with anyone.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-inksoft">Signed in as</div>
            <div className="text-sm font-medium text-ink">{candidate?.full_name}</div>
            <div className="text-xs text-inksoft font-mono break-all">{candidate?.email}</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs text-inksoft">ATS Resume Score</div>
            <div className="text-2xl font-mono font-bold text-ink">
              {candidate?.resume_score ? `${parseFloat(candidate.resume_score).toFixed(0)}` : "—"}
              <span className="text-sm font-normal text-inksoft">/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}