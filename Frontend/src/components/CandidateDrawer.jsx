import { scoreOrDash } from "../utils/format";

export default function CandidateDrawer({ student, job, onClose }) {
  const open = !!student;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-[100] transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed top-0 right-0 w-[420px] max-w-[92vw] h-full bg-panel shadow-[-8px_0_24px_rgba(0,0,0,0.08)] z-[101] overflow-y-auto p-9 transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {student && (
          <>
            <button onClick={onClose} className="float-right text-xl text-inksoft" aria-label="Close">
              ×
            </button>
            <h2 className="text-2xl">{student.full_name}</h2>
            <div className="text-xs text-inksoft mt-0.5">
              {student.student_id} · Applied for {job?.job_title}
            </div>

            <div className="my-7">
              {[
                ["resume_score", student.resume_score],
                ["video_score", student.video_score],
                ["aptitude_score", student.aptitude_score],
                ["final_score", student.final_score],
                ["current_stage", student.current_stage ?? student.application_status],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center py-3 border-b border-line">
                  <span className="text-[13px] text-inksoft">{label}</span>
                  <span className="font-mono text-[15px] font-semibold">{scoreOrDash(val)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-3 border-b border-line">
                <span className="text-[13px] text-inksoft">resume_url</span>
                <span className="font-mono text-[11px]">{student.resume_url}</span>
              </div>
            </div>

            <span className="font-mono text-xs uppercase tracking-wider text-inksoft block mb-3">
              AI summary
            </span>
            <p className="text-inksoft text-sm leading-relaxed">
              {student.recommendation || "No recommendation yet — evaluation in progress."}
            </p>

            <div className="flex gap-2.5 mt-7">
              <button className="btn-primary flex-1 text-[13px] py-2.5">Invite</button>
              <button className="btn-ghost flex-1 text-[13px] py-2.5">Waitlist</button>
              <button className="btn-ghost flex-1 text-[13px] py-2.5 border-stop text-stop">Reject</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
