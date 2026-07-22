import { getMyApplications, STAGE_LABEL } from "../api/apiClient";
import { useApi } from "../utils/useApi";
import { useNavigate } from "react-router-dom";
import { Loading, ErrorState } from "../components/Status";

export default function MyApplications({ account, onLogout }) {
  const navigate = useNavigate();
  const { data: applications, loading, error, refetch } = useApi(() => getMyApplications(), []);

  return (
 <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24">
   <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
     <div>
       <span className="font-mono text-[10px] md:text-xs uppercase tracking-wider text-inksoft block mb-3.5">
         Signed in as {account?.full_name}
       </span>
       <h1 className="text-2xl md:text-[34px] font-medium">My applications</h1>
     </div>
     <button onClick={onLogout} className="btn-ghost w-full sm:w-auto">Log out</button>
   </div>

      {loading && <Loading label="Loading your applications…" />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {applications && applications.length === 0 && (
        <div className="bg-panel border border-line rounded-xl shadow-sm p-6 sm:p-10 text-center">
          <p className="text-inksoft text-sm mb-5">You haven't applied to any roles yet.</p>
          <button onClick={() => navigate("/")} className="btn-primary">Browse open roles</button>
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
              <div className="flex justify-between items-center border-b border-line py-4 px-6 last:border-b-0">
                <div className="flex-1">
                  <div className="font-serif text-lg font-medium">{app.job_title}</div>
                  <div className="text-sm text-inksoft mt-1">
                    Applied on {new Date(app.applied_at).toLocaleDateString()}
                  </div>
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

