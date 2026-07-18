import { formatDate } from "../utils/format";

export default function JobRow({ job, onClick, adminMeta = false, admin = null, onStopShortlisting = null, onStartEvaluation = null, onDeleteJob = null }) {
  const isClosed = job.job_status !== "Open" || new Date(job.application_end_date) < new Date();

  let statusLabel = "Open";
  let statusCls = "bg-gosoft text-go";
  if (job.job_status === "Evaluation Started") {
    statusLabel = "Evaluation Started";
    statusCls = "bg-holdsoft text-hold";
  } else if (job.job_status === "Results Processed") {
    statusLabel = "Results Processed";
    statusCls = "bg-gosoft text-go";
  } else if (isClosed) {
    statusLabel = "Shortlisting Closed";
    statusCls = "bg-[#EEEFEC] text-inksoft";
  }

  return (
    <div
      onClick={onClick}
      className={`flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto_auto] gap-3 md:gap-6 items-start md:items-center py-4 md:py-[22px] px-1 border-b border-line transition ${
        onClick ? "cursor-pointer hover:bg-panel hover:rounded-lg hover:shadow-sm hover:px-4" : ""
      }`}
    >
      <div>
        <div className="font-serif text-xl font-medium">{job.job_title}</div>
        <div className="text-[13px] text-inksoft mt-1">
          {adminMeta
            ? `${job.job_id} · ${job.openings} opening${job.openings > 1 ? "s" : ""} · ${job.applicants_count || 0} applicant${job.applicants_count !== 1 ? "s" : ""} · created by ${job.created_by_name || job.created_by}`
            : `${job.employment_type} · ${job.job_location} · ${job.expected_ctc} · ${job.openings} opening${job.openings > 1 ? "s" : ""} · ${job.applicants_count || 0} applicant${job.applicants_count !== 1 ? "s" : ""}`}
        </div>
      </div>
      <span className={`font-mono text-[11px] px-2.5 py-1.5 rounded-full whitespace-nowrap ${statusCls}`}>
        {statusLabel}
      </span>
      {adminMeta && job.job_status === "Open" && admin?.role_key !== "R004" && onStopShortlisting && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStopShortlisting(job.job_id);
          }}
          className="font-mono text-xs text-stop border border-stop rounded px-2 py-1 hover:bg-[#FFF5F5] transition"
        >
          Close
        </button>
      )}
      {adminMeta && isClosed && job.job_status === "Shortlisting Closed" && admin?.role_key !== "R004" && onStartEvaluation && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartEvaluation(job.job_id);
          }}
          className="font-mono text-xs text-primary border border-primary rounded px-2 py-1 hover:bg-blue-50 transition whitespace-nowrap"
        >
          ▶ Evaluate
        </button>
      )}
      {adminMeta && isClosed && admin?.role_key !== "R004" && onDeleteJob && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteJob(job.job_id);
          }}
          className="font-mono text-xs text-[#d32f2f] border border-[#d32f2f] rounded px-2 py-1 hover:bg-[#ffebee] transition"
        >
          Delete
        </button>
      )}
      <span className="font-mono text-[13px] text-inksoft">Closes {formatDate(job.application_end_date)}</span>
      {onClick ? (
        <span className="text-inksoft text-lg">→</span>
      ) : (
        <span className="text-transparent text-lg">→</span>
      )}
    </div>
  );
}
