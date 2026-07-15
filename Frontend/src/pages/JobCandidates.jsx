import { useParams, useNavigate } from "react-router-dom";
import { getRankedStudents, getJob, startEvaluation } from "../api/apiClient";
import { useApi } from "../utils/useApi";
import CandidateRow from "../components/CandidateRow";
import { Loading, ErrorState } from "../components/Status";

export default function JobCandidates({ onOpenCandidate }) {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { data: job, loading: jobLoading, error: jobError } = useApi(() => (jobId ? getJob(jobId) : Promise.resolve(null)), [jobId]);
  const {
    data: ranked, loading: rankedLoading, error: rankedError, refetch: refetchRanked,
  } = useApi(() => (jobId ? getRankedStudents(jobId) : Promise.resolve(null)), [jobId]);

  const isEvaluated = job?.job_status === 'Evaluation Started';

  return (
    <div className="max-w-[1080px] mx-auto px-8 py-12 pb-24">
      <button onClick={() => navigate("/admin/dashboard")} className="font-mono text-xs text-inksoft flex items-center gap-1.5 mb-7 hover:text-ink transition">
        ← Back to dashboard
      </button>

      {jobLoading && <Loading label="Loading job details…" />}
      {jobError && <ErrorState message={jobError} />}
      
      {job && (
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-[30px] font-medium">{job.job_title}</h1>
            <p className="text-inksoft text-[13px] mt-1">
              Top candidates ranked by resume score
            </p>
          </div>
          {!isEvaluated && (
            <button 
              className="btn-primary" 
              onClick={async () => {
                try {
                  await startEvaluation(jobId);
                  alert("Evaluation started and emails sent successfully!");
                  window.location.reload();
                } catch (e) {
                  alert(e.message || "Failed to start evaluation.");
                }
              }}
            >
              Evaluate
            </button>
          )}
        </div>
      )}

      <div className={`grid ${isEvaluated ? 'grid-cols-[34px_1.4fr_90px_90px_110px]' : 'grid-cols-[34px_1.4fr_90px_110px]'} gap-3.5 py-2.5 px-1.5 border-b border-ink font-mono text-[11px] uppercase tracking-wide text-inksoft`}>
        <span>#</span><span>Student</span><span>Resume Score</span>
        {isEvaluated && <span>Total Score</span>}
        <span>Current Stage</span>
      </div>
      
      {rankedLoading && <Loading label="Loading candidates…" />}
      {rankedError && <ErrorState message={rankedError} onRetry={refetchRanked} />}
      
      {ranked && (
        <div>
          {ranked.map((s) => (
            <CandidateRow key={s.student_id} student={s} onClick={() => onOpenCandidate(s.student_id)} isEvaluated={isEvaluated} />
          ))}
          {ranked.length === 0 && (
            <p className="text-inksoft text-sm py-8 text-center">No applicants for this job yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
