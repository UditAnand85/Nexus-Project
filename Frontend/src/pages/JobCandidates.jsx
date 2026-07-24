import { useParams, useNavigate } from "react-router-dom";
import { getRankedStudents, getJob, startEvaluation, processResults } from "../api/apiClient";
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

  const isEvaluated = job?.job_status === 'Evaluation Started' || job?.job_status === 'Results Processed';
  const isResultsProcessed = job?.job_status === 'Results Processed';

  // Split into invited (manually invited) and regular candidates
  // Always show the invited section on top
  const invitedCandidates = ranked
    ? ranked.filter((s) => s.current_stage === 'Invited')
    : [];
  const regularCandidates = ranked
    ? (invitedCandidates.length > 0
        ? ranked.filter((s) => s.current_stage !== 'Invited')
        : ranked)
    : [];

  const hasInvited = invitedCandidates.length > 0;

  const gridCols = isEvaluated
    ? 'sm:grid-cols-[34px_1.4fr_90px_90px_110px]'
    : 'sm:grid-cols-[34px_1.4fr_90px_110px]';

  return (
    <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24">
      <button onClick={() => navigate("/admin/dashboard")} className="font-mono text-xs text-inksoft flex items-center gap-1.5 mb-7 hover:text-ink transition">
        ← Back to dashboard
      </button>

      {jobLoading && <Loading label="Loading job details…" />}
      {jobError && <ErrorState message={jobError} />}
      
      {job && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-[30px] font-medium">{job.job_title}</h1>
            <p className="text-inksoft text-[13px] mt-1">
              Top candidates ranked by resume score
            </p>
          </div>
          {job.job_status === 'Shortlisting Closed' && (
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
          {job.job_status === 'Evaluation Started' && (
            <button 
              className="btn-primary" 
              onClick={async () => {
                if (!window.confirm("Process results? This will immediately send physical interview invites to the top candidates, waitlist the next group, and send rejection emails to the rest.")) return;
                try {
                  await processResults(jobId);
                  alert("Results processed and emails sent successfully!");
                  window.location.reload();
                } catch (e) {
                  alert(e.message || "Failed to process results.");
                }
              }}
            >
              Process Results
            </button>
          )}
        </div>
      )}

      {rankedLoading && <Loading label="Loading candidates…" />}
      {rankedError && <ErrorState message={rankedError} onRetry={refetchRanked} />}

      {ranked && (
        <>
          {/* ── Invited Section ─────────────────────────────────────────── */}
          {hasInvited && (
            <div className="mb-8">
              {/* Section header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-go animate-pulse inline-block" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-go font-semibold">
                    Invited — {invitedCandidates.length} candidate{invitedCandidates.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex-1 h-px bg-go/20" />
                <span className="font-mono text-[10px] text-inksoft">Manually invited via Invite button</span>
              </div>

              {/* Invited candidates table */}
              <div className="bg-gosoft/40 border border-go/20 rounded-xl overflow-hidden">
                {/* Header row */}
                <div className={`hidden sm:grid ${gridCols} gap-3.5 py-2.5 px-4 border-b border-go/20 font-mono text-[11px] uppercase tracking-wide text-go/70`}>
                  <span>#</span><span>Student</span><span>Resume Score</span>
                  {isEvaluated && <span>Total Score</span>}
                  <span>Stage</span>
                </div>
                {/* Rows */}
                <div>
                  {invitedCandidates.map((s) => (
                    <CandidateRow
                      key={s.student_id}
                      student={s}
                      onClick={() => onOpenCandidate(s.student_id)}
                      isEvaluated={isEvaluated}
                      highlighted
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── All Candidates Section ──────────────────────────────────────── */}
          <div>
            {hasInvited && (
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-inksoft font-semibold">
                  Other Candidates
                </span>
                <div className="flex-1 h-px bg-line" />
              </div>
            )}

            {/* Header row */}
            <div className={`hidden sm:grid ${gridCols} gap-3.5 py-2.5 px-1.5 border-b border-ink font-mono text-[11px] uppercase tracking-wide text-inksoft`}>
              <span>#</span><span>Student</span><span>Resume Score</span>
              {isEvaluated && <span>Total Score</span>}
              <span>Current Stage</span>
            </div>

            <div>
              {regularCandidates.map((s) => (
                <CandidateRow key={s.student_id} student={s} onClick={() => onOpenCandidate(s.student_id)} isEvaluated={isEvaluated} />
              ))}
              {regularCandidates.length === 0 && !hasInvited && (
                <p className="text-inksoft text-sm py-8 text-center">No applicants for this job yet.</p>
              )}
              {regularCandidates.length === 0 && hasInvited && (
                <p className="text-inksoft text-sm py-8 text-center">All candidates have been invited.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
