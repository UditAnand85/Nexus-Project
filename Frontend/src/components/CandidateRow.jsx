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
    invited:     "bg-gosoft text-go border border-go/20",
    shortlisted: "bg-amber-50 text-amber-600 border border-amber-200",
    review:      "bg-[#EEF0EE] text-inksoft border border-transparent",
    rejected:    "bg-red-50 text-red-600 border border-red-200",
  };
  return (
    <span className={`font-mono text-[11px] px-2.5 py-1.5 rounded-full text-center ${styles[info.cls] || styles.review}`}>
      {info.label}
    </span>
  );
}

export default function CandidateRow({ student, onClick, isEvaluated, highlighted }) {
  let stage = student.current_stage || student.application_status || (isEvaluated ? "Pending" : "Applied");
  if (isEvaluated && student.final_score === null) {
    if (stage !== 'Invited' && stage !== 'Selected' && stage !== 'Rejected') {
      stage = 'Pending';
    }
  }

  return (
    <div
      onClick={onClick}
      className={`flex flex-col sm:grid ${isEvaluated ? 'sm:grid-cols-[34px_1.4fr_90px_90px_110px]' : 'sm:grid-cols-[34px_1.4fr_90px_110px]'} gap-2 sm:gap-3.5 items-start sm:items-center py-4 px-4 sm:px-4 border-b last:border-b-0 cursor-pointer transition-colors ${
        highlighted
          ? 'border-go/20 hover:bg-go/10'
          : 'border-line hover:bg-panel hover:rounded-lg hover:shadow-sm'
      }`}
    >
      <div className="flex gap-2 items-center sm:hidden">
        <span className="font-mono text-inksoft">{student.rank}</span>
        <div className="font-serif text-base font-medium">{student.full_name}</div>
        <StagePill stage={stage} />
      </div>

      <span className="hidden sm:inline font-mono text-inksoft">{student.rank}</span>
      <div className="hidden sm:block">
        <div className="font-serif text-base font-medium">{student.full_name}</div>
      </div>
      
      <div className="flex sm:contents gap-4 text-sm mt-1 sm:mt-0">
        <div className="flex sm:contents gap-2">
          <span className="sm:hidden text-inksoft">Resume:</span>
          <ScoreCell value={student.resume_score} />
        </div>
        {isEvaluated && (
          <div className="flex sm:contents gap-2">
            <span className="sm:hidden text-inksoft">Final:</span>
            <ScoreCell value={student.final_score} />
          </div>
        )}
      </div>
      <div className="hidden sm:block">
        <StagePill stage={stage} />
      </div>
    </div>
  );
}


export { scoreOrDash };
