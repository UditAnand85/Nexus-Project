import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import CandidateDrawer from "./components/CandidateDrawer";
import CareerPortal from "./pages/CareerPortal";
import JobDetail from "./pages/JobDetail";
import Apply from "./pages/Apply";
import Evaluation from "./pages/Evaluation";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import JobCreate from "./pages/JobCreate";
import { getJob, getStudentDetail } from "./api/apiClient";
import { checkBackendHealth, getAuthToken } from "./api/config";
import { useApi } from "./utils/useApi";
import { BackendOfflineBanner } from "./components/Status";

export default function App() {
  const [view, setView] = useState("portal");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [submittedStudent, setSubmittedStudent] = useState(null);
  const [drawerStudentId, setDrawerStudentId] = useState(null);
  const [isAdminAuthed, setIsAdminAuthed] = useState(!!getAuthToken());
  const [backendOk, setBackendOk] = useState(true);

  useEffect(() => {
    checkBackendHealth().then((result) => setBackendOk(result.ok));
  }, []);

  const navigate = (target) => {
    if (target === "admin-login" && isAdminAuthed) {
      setView("admin-dashboard");
    } else {
      setView(target);
    }
    window.scrollTo(0, 0);
  };

  const openJob = (jobId) => {
    setSelectedJobId(jobId);
    setView("jobDetail");
  };

  const {
    data: selectedJob,
    loading: jobLoading,
    error: jobError,
    refetch: refetchJob,
  } = useApi(() => (selectedJobId ? getJob(selectedJobId) : Promise.resolve(null)), [selectedJobId]);

  const { data: drawerStudent } = useApi(
    () => (drawerStudentId ? getStudentDetail(drawerStudentId) : Promise.resolve(null)),
    [drawerStudentId]
  );

  const { data: drawerJob } = useApi(
    () => (drawerStudent?.job_id ? getJob(drawerStudent.job_id) : Promise.resolve(null)),
    [drawerStudent?.job_id]
  );

  return (
    <div>
      {!backendOk && <BackendOfflineBanner />}

      <Navbar view={view} onNavigate={navigate} />

      {view === "portal" && <CareerPortal onOpenJob={openJob} />}

      {view === "jobDetail" && (
        <JobDetail
          job={selectedJob}
          loading={jobLoading}
          error={jobError}
          onRetry={refetchJob}
          onBack={() => navigate("portal")}
          onApply={() => navigate("apply")}
        />
      )}

      {view === "apply" && (
        <Apply
          job={selectedJob}
          onBack={() => navigate("jobDetail")}
          onSubmitted={(student) => {
            setSubmittedStudent(student);
            navigate("evaluation");
          }}
        />
      )}

      {view === "evaluation" && <Evaluation student={submittedStudent} />}

      {view === "admin-login" && (
        <AdminLogin
          onLogin={() => {
            setIsAdminAuthed(true);
            navigate("admin-dashboard");
          }}
        />
      )}

      {view === "admin-dashboard" && (
        <AdminDashboard
          onNewJob={() => navigate("job-create")}
          onOpenCandidate={(id) => setDrawerStudentId(id)}
        />
      )}

      {view === "job-create" && (
        <JobCreate onBack={() => navigate("admin-dashboard")} onPublished={() => navigate("admin-dashboard")} />
      )}

      <CandidateDrawer student={drawerStudent} job={drawerJob} onClose={() => setDrawerStudentId(null)} />
    </div>
  );
}
