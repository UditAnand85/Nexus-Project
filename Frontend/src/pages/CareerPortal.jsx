import { getJobs } from "../api/apiClient";
import { useApi } from "../utils/useApi";
import { useNavigate } from "react-router-dom";
import JobRow from "../components/JobRow";
import { Loading, ErrorState } from "../components/Status";

export default function CareerPortal() {
  const navigate = useNavigate();
  const { data: jobs, loading, error, refetch } = useApi(() => getJobs(), []);

  return (
    <div className="max-w-[1080px] mx-auto px-8 py-12 pb-24">
      <div className="mb-14">
        <span className="font-mono text-xs uppercase tracking-wider text-inksoft block mb-3.5">
          Open roles · Updated today
        </span>
        <h1 className="text-[44px] leading-[1.05] max-w-[640px] font-medium">
          Work that gets evaluated fairly, and quickly.
        </h1>
        <p className="max-w-[520px] text-inksoft text-base mt-4 leading-relaxed">
          Apply once. Your resume, a short video, and a short skills check decide what happens next —
          no waiting weeks for a reply.
        </p>
      </div>

      {loading && <Loading label="Loading open roles…" />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {jobs && (
        <>
          <div className="flex flex-col border-t border-line">
            {jobs.filter(j => j.job_status === "Open" && new Date(j.application_end_date) >= new Date()).map((job) => (
              <JobRow key={job.job_id} job={job} onClick={() => navigate(`/job/${job.job_id}`)} />
            ))}
            {jobs.filter(j => j.job_status === "Open" && new Date(j.application_end_date) >= new Date()).length === 0 && (
              <p className="text-inksoft text-sm py-10 text-center">No open roles right now — check back soon.</p>
            )}
          </div>

          {jobs.some(j => j.job_status !== "Open" || new Date(j.application_end_date) < new Date()) && (
            <div className="mt-16">
              <span className="font-mono text-xs uppercase tracking-wider text-inksoft block mb-3.5">
                Evaluation in progress
              </span>
              <div className="flex flex-col border-t border-line">
                {jobs.filter(j => j.job_status !== "Open" || new Date(j.application_end_date) < new Date()).map((job) => (
                  <JobRow key={job.job_id} job={job} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
