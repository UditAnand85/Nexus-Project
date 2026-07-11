import { formatDate } from "../utils/format";

export default function JobRow({ job, onClick, adminMeta = false }) {
  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[1fr_auto_auto_auto] gap-6 items-center py-[22px] px-1 border-b border-line transition ${
        onClick ? "cursor-pointer hover:bg-panel hover:px-4" : ""
      }`}
    >
      <div>
        <div className="font-serif text-xl font-medium">{job.job_title}</div>
        <div className="text-[13px] text-inksoft mt-1">
          {adminMeta
            ? `${job.job_id} · ${job.openings} opening${job.openings > 1 ? "s" : ""} · created by ${job.created_by}`
            : `${job.employment_type} · ${job.job_location} · ${job.expected_ctc} · ${job.openings} opening${job.openings > 1 ? "s" : ""}`}
        </div>
      </div>
      <span className="font-mono text-[11px] px-2.5 py-1.5 rounded-full bg-gosoft text-go whitespace-nowrap">
        {job.job_status}
      </span>
      <span className="font-mono text-[13px] text-inksoft">Closes {formatDate(job.application_end_date)}</span>
      <span className="text-inksoft text-lg">→</span>
    </div>
  );
}
