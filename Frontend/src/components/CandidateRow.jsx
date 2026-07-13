import { scoreOrDash } from "../utils/format";
import { STAGE_LABEL } from "../api/apiClient";

function ScoreCell({ value }) {
  return value !== null && value !== undefined ? (
    <span className="font-mono text-sm">{value}</span>
  ) : (
    <span className="font-mono text-sm text-line">—</span>
  );
}

function StagePill({ stage }) {
  const info = STAGE_LABEL[stage] || { cls: "review", label: stage };
  const styles = {
    invited: "bg-gosoft text-go",
    wait: "bg-holdsoft text-hold",
    review: "bg-[#EEF0EE] text-inksoft",
  };
  return (
    <span className={`font-mono text-[11px] px-2.5 py-1.5 rounded-full text-center ${styles[info.cls]}`}>
      {info.label}
    </span>
  );
}

export default function CandidateRow({ student, onClick, isEvaluated }) {
  const stage = isEvaluated ? "Pending evaluation" : "Applied";

  return (
    <div
      onClick={onClick}
      className={`grid ${isEvaluated ? 'grid-cols-[34px_1.4fr_90px_90px_110px]' : 'grid-cols-[34px_1.4fr_90px_110px]'} gap-3.5 items-center py-4 px-1.5 border-b border-line cursor-pointer hover:bg-panel hover:rounded-lg hover:shadow-sm`}
    >
      <span className="font-mono text-inksoft">{student.rank}</span>
      <div>
        <div className="font-serif text-base font-medium">{student.full_name}</div>
        <div className="text-xs text-inksoft mt-0.5">{student.student_id}</div>
      </div>
      <ScoreCell value={student.resume_score} />
      {isEvaluated && <ScoreCell value={student.final_score} />}
      <StagePill stage={stage} />
    </div>
  );
}

export { scoreOrDash };
