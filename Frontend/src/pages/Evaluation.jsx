/**
 * Evaluation.jsx — Application submitted confirmation screen.
 *
 * Shown immediately after a candidate submits their application.
 * The resume screening / shortlisting pipeline runs in the background.
 * If shortlisted, the candidate will be contacted via email for next steps.
 *
 * Video intro + aptitude test stages have been removed from this view —
 * they will be communicated via email to shortlisted candidates only.
 */

export default function Evaluation({ student }) {
  const firstName = student?.full_name?.split(" ")[0] || "there";

  return (
    <div className="max-w-[680px] mx-auto px-8 py-20 pb-32 text-center">
      {/* Check icon */}
      <div className="w-16 h-16 rounded-full bg-gosoft border-2 border-go flex items-center justify-center mx-auto mb-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-go"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <span className="font-mono text-xs uppercase tracking-wider text-inksoft block mb-3">
        Application received
      </span>

      <h1 className="text-[32px] font-medium mb-4">
        Thank you, {firstName}!
      </h1>

      <p className="text-inksoft text-[16px] leading-relaxed mb-8 max-w-[520px] mx-auto">
        Your application has been successfully submitted. Our team will review your resume
        and get back to you about the further selection process via email.
      </p>

      <div className="bg-panel border border-line rounded-xl p-7 text-left max-w-[480px] mx-auto">
        <h3 className="text-sm font-medium mb-4 text-ink">What happens next?</h3>
        <ul className="space-y-3">
          {[
            { step: "01", text: "Our AI screens all submitted resumes after the application window closes." },
            { step: "02", text: "Top candidates are shortlisted based on profile match and resume score." },
            { step: "03", text: "Shortlisted candidates receive an email with details of the next evaluation round." },
            { step: "04", text: "Final decisions are made by the hiring team after reviewing all evaluations." },
          ].map(({ step, text }) => (
            <li key={step} className="flex gap-3.5 items-start">
              <span className="font-mono text-[11px] text-inksoft bg-[#EEEFEC] rounded px-1.5 py-0.5 mt-0.5 shrink-0">
                {step}
              </span>
              <span className="text-sm text-inksoft leading-relaxed">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[13px] text-inksoft mt-8">
        Keep an eye on your inbox at{" "}
        <span className="font-medium text-ink">{student?.email || "your registered email"}</span>.
      </p>
    </div>
  );
}
