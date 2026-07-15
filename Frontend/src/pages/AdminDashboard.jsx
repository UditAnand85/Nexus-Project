import { useState, useEffect } from "react";
import { getJobs, getRankedStudents, getStats, getJob, stopShortlisting, deleteJob, startEvaluation } from "../api/apiClient";
import { useApi } from "../utils/useApi";
import { useNavigate } from "react-router-dom";
import JobRow from "../components/JobRow";
import CandidateRow from "../components/CandidateRow";
import TeamTab from "../components/TeamTab";
import { Loading, ErrorState } from "../components/Status";

const TABS = [
  { key: "jobs",    label: "Jobs" },
  { key: "team",    label: "Team" },      // Super Admin only
];

export default function AdminDashboard({ admin, onLogout }) {
  const navigate = useNavigate();
  const isSuperAdmin = admin?.role_key === "R001";

  const [tab, setTab] = useState("jobs");
  const [activeJobId, setActiveJobId] = useState(null);

  const { data: jobs, loading: jobsLoading, error: jobsError, refetch: refetchJobs } = useApi(() => getJobs(), []);
  const { data: stats } = useApi(() => getStats(), []);

  useEffect(() => {
    if (jobs && jobs.length > 0 && !activeJobId) setActiveJobId(jobs[0].job_id);
  }, [jobs, activeJobId]);

  const handleStopShortlisting = async (jobId) => {
    try { await stopShortlisting(jobId); refetchJobs(); }
    catch (err) { alert(err.message || "Could not close shortlisting"); }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to permanently delete this job? This will also remove all associated candidates and their evaluations.")) return;
    try { 
      await deleteJob(jobId); 
      refetchJobs(); 
    }
    catch (err) { alert(err.message || "Could not delete job"); }
  };

  const handleStartEvaluation = async (jobId) => {
    if (!window.confirm("Start evaluation for this job? An email will be sent to all shortlisted candidates with their unique assessment link.")) return;
    try {
      await startEvaluation(jobId);
      refetchJobs();
    } catch (err) {
      alert(err.message || "Could not start evaluation");
    }
  };

  const visibleTabs = TABS.filter((t) => t.key !== "team" || isSuperAdmin);

  return (
    <div className="max-w-[1080px] mx-auto px-8 py-12 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[30px] font-medium">Recruitment overview</h1>
          <p className="text-inksoft text-[13px] mt-1">
            Signed in as <span className="font-medium text-ink">{admin?.full_name}</span>
            {" · "}<span className="font-mono text-[11px] px-1.5 py-0.5 bg-[#EEEFEC] rounded">{admin?.role_name || admin?.role_key}</span>
          </p>
        </div>
        <div className="flex gap-3">
          {admin?.role_key !== "R004" && (
            <button onClick={() => navigate("/admin/job/create")} className="btn-primary">+ New job</button>
          )}
          <button onClick={onLogout} className="btn-ghost">Log out</button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex border border-line rounded-xl shadow-sm overflow-hidden mb-10 bg-panel">
        <Stat num={stats?.openJobs ?? "—"} label="Open jobs" />
        <Stat num={stats?.totalStudents ?? "—"} label="Total applicants" />
        <Stat num={stats?.shortlistedCount ?? "—"} label="Shortlisted" />
        <Stat num={stats?.finalInterviewCount ?? "—"} label="Final interview" last />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-line">
        {visibleTabs.map((t) => (
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

      {/* Jobs tab */}
      {tab === "jobs" && (
        <>
          {jobsLoading && <Loading label="Loading jobs…" />}
          {jobsError && <ErrorState message={jobsError} onRetry={refetchJobs} />}
          {jobs && (
            <div className="flex flex-col">
              {jobs.map((job) => (
                <JobRow
                  key={job.job_id}
                  job={job}
                  adminMeta
                  admin={admin}
                  onStopShortlisting={handleStopShortlisting}
                  onStartEvaluation={handleStartEvaluation}
                  onDeleteJob={handleDeleteJob}
                  onClick={() => navigate(`/admin/job/${job.job_id}/candidates`)}
                />
              ))}
              {jobs.length === 0 && (
                <p className="text-inksoft text-sm py-10 text-center">No jobs yet. Click "+ New job" to create one.</p>
              )}
            </div>
          )}
        </>
      )}


      {/* Team tab — Super Admin only */}
      {tab === "team" && isSuperAdmin && <TeamTab />}
    </div>
  );
}

function Stat({ num, label, last }) {
  return (
    <div className={`flex-1 py-5 px-6 ${!last ? "border-r border-line" : ""}`}>
      <div className="font-mono text-[26px] font-semibold text-primary">{num}</div>
      <div className="text-xs text-inksoft mt-1">{label}</div>
    </div>
  );
}
