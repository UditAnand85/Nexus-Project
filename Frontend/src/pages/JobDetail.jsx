import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDate } from "../utils/format";
import { Loading, ErrorState } from "../components/Status";
import { useApi } from "../utils/useApi";
import { getJob } from "../api/apiClient";

export default function JobDetail({ requiresLogin, isAdminAuthed }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showResultsInfo, setShowResultsInfo] = useState(false);

  const { data: job, loading, error, refetch: onRetry } = useApi(
    () => (id ? getJob(id) : Promise.resolve(null)), 
    [id]
  );

  if (loading) return <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-8 md:py-12"><Loading label="Loading role…" /></div>;
  if (error) return <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-8 md:py-12"><ErrorState message={error} onRetry={onRetry} /></div>;
  if (!job) return null;

  const isClosed = job.job_status !== "Open" || new Date(job.application_end_date) < new Date();
  const tags = [job.employment_type, job.job_location, `${job.openings} opening${job.openings > 1 ? "s" : ""}`];

  return (
    <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24">
      <button onClick={() => navigate("/")} className="font-mono text-[10px] md:text-xs text-inksoft flex items-center gap-1.5 mb-7">
        ← All roles
      </button>

      <h1 className="text-2xl md:text-[34px] font-medium mb-2">{job.job_title}</h1>

      <div className="flex gap-2 my-4 mb-8 flex-wrap">
        {tags.map((t) => (
          <span key={t} className="font-mono text-[10px] md:text-[11px] px-2.5 py-1.5 border border-line rounded-full text-inksoft bg-panel">
            {t}
          </span>
        ))}
      </div>

      <span className="font-mono text-[10px] md:text-xs uppercase tracking-wider text-inksoft block mb-3">
        About the role
      </span>
      <div className="text-inksoft leading-relaxed text-sm md:text-[15px] max-w-[640px]">
        <p>{job.job_description}</p>
        <ul className="pl-4 md:pl-5 list-disc">
          <li className="mb-1.5 mt-2">Expected CTC: {job.expected_ctc}</li>
          <li className="mb-1.5">Location: {job.job_location}</li>
          <li className="mb-1.5">
            Application window: {formatDate(job.application_start_date)} – {formatDate(job.application_end_date)}
          </li>
          <li className="mb-1.5">Number of applicants: {job.applicants_count || 0}</li>
          <li className="mb-1.5">Evaluation: resume screen → aptitude test</li>
        </ul>
      </div>

      <div className="mt-10 flex flex-col items-start">
        <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center">
          {!isClosed ? (
            isAdminAuthed ? (
              <button disabled className="btn-primary opacity-50 cursor-not-allowed w-full sm:w-auto text-center">
                Applying as Admin Disabled
              </button>
            ) : (
              <button onClick={() => navigate(`/apply/${job.job_id}`)} className="btn-primary w-full sm:w-auto text-center">
                {requiresLogin ? "Sign in to apply" : "Apply now"}
              </button>
            )
          ) : (
            <button 
              onClick={() => setShowResultsInfo(!showResultsInfo)} 
              className="btn-primary w-full sm:w-auto text-center" 
              style={{ backgroundColor: '#1A1D2B', borderColor: '#1A1D2B' }}
            >
              View Results
            </button>
          )}
          <button onClick={() => navigate("/")} className="btn-ghost w-full sm:w-auto text-center">Back to roles</button>
          {!isClosed && !isAdminAuthed && requiresLogin && (
            <span className="text-inksoft text-xs font-mono mt-2 sm:mt-0">Sign in required to apply</span>
          )}
        </div>
        {showResultsInfo && isClosed && (
          <div className="mt-4 px-4 py-3 bg-[#EEEFEC] border border-line rounded-lg text-sm text-ink font-medium w-full max-w-[640px]">
            Results will be shared on your registered Email!
          </div>
        )}
      </div>
      
    </div>
  );
}
