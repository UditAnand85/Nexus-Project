import { getMyApplications, STAGE_LABEL } from "../api/apiClient";
import { useApi } from "../utils/useApi";
import { Loading, ErrorState } from "../components/Status";

export default function MyApplications({ account, onBrowseJobs, onLogout }) {
  const { data: applications, loading, error, refetch } = useApi(() => getMyApplications(), []);

  return (
    <div className="max-w-[1080px] mx-auto px-8 py-12 pb-24">
      <div className="flex justify-between items-start mb-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-inksoft block mb-3.5">
            Signed in as {account?.full_name}
          </span>
          <h1 className="text-[34px] font-medium">My applications</h1>
        </div>
        <button onClick={onLogout} className="btn-ghost">Log out</button>
      </div>

      {loading && <Loading label="Loading your applications…" />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {applications && applications.length === 0 && (
        <div className="bg-panel border border-line rounded-xl shadow-sm p-10 text-center">
          <p className="text-inksoft text-sm mb-5">You haven't applied to any roles yet.</p>
          <button onClick={onBrowseJobs} className="btn-primary">Browse open roles</button>
        </div>
      )}

      {applications && applications.length > 0 && (
        <div className="flex flex-col border-t border-line">
          {applications.map((app) => {
            const info = STAGE_LABEL[app.current_stage] || STAGE_LABEL[app.application_status] || { cls: "review", label: app.application_status };
            const pillStyles = {
              invited: "bg-gosoft text-go",
              wait: "bg-holdsoft text-hold",
              review: "bg-[#EEF0EE] text-inksoft",
            };
            return (
              <div key={app.student_id} className="grid grid-cols-[1fr_140px] gap-4 items-center py-5 border-b border-line">
                <div>
                  <div className="font-serif text-lg font-medium">{app.job_title}</div>
                  <div className="text-xs text-inksoft mt-0.5">{app.student_id}</div>
                </div>
                <div className="flex justify-end">
                  <span className={`font-mono text-[11px] px-2.5 py-1.5 rounded-full text-center ${pillStyles[info.cls]}`}>
                    {info.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

