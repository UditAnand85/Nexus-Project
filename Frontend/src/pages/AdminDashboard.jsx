import { useState } from "react";
import { getJobs, getRankedStudents, getStats, getJob } from "../api/apiClient";
import { useApi } from "../utils/useApi";
import { ADMIN_TABS } from "../constants/roles";
import JobRow from "../components/JobRow";
import CandidateRow from "../components/CandidateRow";
import { Loading, ErrorState } from "../components/Status";

export default function AdminDashboard({ onNewJob, onOpenCandidate }) {
  const [tab, setTab] = useState("jobs");
  const [activeJobId, setActiveJobId] = useState("JOB-1001");

  const { data: jobs, loading: jobsLoading, error: jobsError, refetch: refetchJobs } = useApi(() => getJobs(), []);
  const { data: stats } = useApi(() => getStats(), []);
  const { data: activeJob } = useApi(() => getJob(activeJobId), [activeJobId]);
  const {
    data: ranked,
    loading: rankedLoading,
    error: rankedError,
    refetch: refetchRanked,
  } = useApi(() => getRankedStudents(activeJobId), [activeJobId]);

  return (
    <div className="max-w-[1080px] mx-auto px-8 py-12 pb-24">
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-[30px] font-medium">Recruitment overview</h1>
        <button onClick={onNewJob} className="btn-ghost">+ New job</button>
      </div>

      <div className="flex border border-line mb-10">
        <Stat num={stats?.openJobs ?? "—"} label="JOBS (job_status = open)" />
        <Stat num={stats?.totalStudents ?? "—"} label="STUDENTS (total rows)" />
        <Stat num={stats?.shortlistedCount ?? "—"} label="SHORTLISTED_STUDENTS rows" />
        <Stat num={stats?.finalInterviewCount ?? "—"} label="current_stage = final_interview" last />
      </div>

      <div className="flex gap-1 mb-6 border-b border-line">
        {ADMIN_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`bg-none border-none py-2.5 px-1 mr-6 text-sm border-b-2 ${
              tab === t.key ? "text-ink border-ink font-medium" : "text-inksoft border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "jobs" && (
        <>
          {jobsLoading && <Loading label="Loading jobs…" />}
          {jobsError && <ErrorState message={jobsError} onRetry={refetchJobs} />}
          {jobs && (
            <div className="flex flex-col">
              {jobs.map((job) => (
                <JobRow key={job.job_id} job={job} adminMeta />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "ranked" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={activeJobId}
              onChange={(e) => setActiveJobId(e.target.value)}
              className="field-input w-auto py-2"
            >
              {(jobs || []).map((j) => (
                <option key={j.job_id} value={j.job_id}>{j.job_title}</option>
              ))}
            </select>
          </div>
          <p className="text-inksoft text-[13px] mb-4.5">
            {activeJob?.job_title} — ranked by final_score, joined from STUDENTS + SHORTLISTED_STUDENTS.
          </p>
          <div className="grid grid-cols-[34px_1.4fr_repeat(4,90px)_110px] gap-3.5 py-2.5 px-1.5 border-b border-ink font-mono text-[11px] uppercase tracking-wide text-inksoft">
            <span>#</span><span>student</span><span>resume_score</span><span>video_score</span>
            <span>aptitude_score</span><span>final_score</span><span>current_stage</span>
          </div>

          {rankedLoading && <Loading label="Loading candidates…" />}
          {rankedError && <ErrorState message={rankedError} onRetry={refetchRanked} />}

          {ranked && (
            <div>
              {ranked.map((s) => (
                <CandidateRow key={s.student_id} student={s} onClick={() => onOpenCandidate(s.student_id)} />
              ))}
              {ranked.length === 0 && (
                <p className="text-inksoft text-sm py-8 text-center">No shortlisted candidates for this job yet.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ num, label, last }) {
  return (
    <div className={`flex-1 py-5 px-6 ${!last ? "border-r border-line" : ""}`}>
      <div className="font-mono text-[26px] font-semibold">{num}</div>
      <div className="text-xs text-inksoft mt-1">{label}</div>
    </div>
  );
}
