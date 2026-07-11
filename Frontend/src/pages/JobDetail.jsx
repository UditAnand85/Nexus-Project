import { formatDate } from "../utils/format";
import { Loading, ErrorState } from "../components/Status";

export default function JobDetail({ job, loading, error, onBack, onApply, onRetry, requiresLogin }) {
  if (loading) return <div className="max-w-[1080px] mx-auto px-8 py-12"><Loading label="Loading role…" /></div>;
  if (error) return <div className="max-w-[1080px] mx-auto px-8 py-12"><ErrorState message={error} onRetry={onRetry} /></div>;
  if (!job) return null;

  const tags = [job.employment_type, job.job_location, `${job.openings} opening${job.openings > 1 ? "s" : ""}`];

  return (
    <div className="max-w-[1080px] mx-auto px-8 py-12 pb-24">
      <button onClick={onBack} className="font-mono text-xs text-inksoft flex items-center gap-1.5 mb-7">
        ← All roles
      </button>

      <h1 className="text-[34px] font-medium mb-2">{job.job_title}</h1>

      <div className="flex gap-2 my-4 mb-8 flex-wrap">
        {tags.map((t) => (
          <span key={t} className="font-mono text-[11px] px-2.5 py-1.5 border border-line rounded-full text-inksoft bg-panel">
            {t}
          </span>
        ))}
      </div>

      <span className="font-mono text-xs uppercase tracking-wider text-inksoft block mb-3">
        About the role
      </span>
      <div className="text-inksoft leading-relaxed text-[15px] max-w-[640px]">
        <p>{job.job_description}</p>
        <ul className="pl-4.5 list-disc pl-5">
          <li className="mb-1.5">Expected CTC: {job.expected_ctc}</li>
          <li className="mb-1.5">Location: {job.job_location}</li>
          <li className="mb-1.5">
            Application window: {formatDate(job.application_start_date)} – {formatDate(job.application_end_date)}
          </li>
          <li className="mb-1.5">Evaluation: resume screen → video intro → aptitude test</li>
        </ul>
      </div>

      <div className="mt-10 flex gap-3.5 items-center">
        <button onClick={onApply} className="btn-primary">Apply now</button>
        <button onClick={onBack} className="btn-ghost">Back to roles</button>
        {requiresLogin && (
          <span className="text-inksoft text-xs font-mono">Sign in required to apply</span>
        )}
      </div>
    </div>
  );
}
