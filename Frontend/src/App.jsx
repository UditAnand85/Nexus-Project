import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import CandidateDrawer from "./components/CandidateDrawer";
import CareerPortal from "./pages/CareerPortal";
import JobDetail from "./pages/JobDetail";
import Apply from "./pages/Apply";
import Evaluation from "./pages/Evaluation";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import MyApplications from "./pages/MyApplications";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ChangePassword from "./pages/ChangePassword";
import JobCreate from "./pages/JobCreate";
import { getJob, getStudentDetail, getStoredStudentAccount, studentLogout, adminLogout, getAdminMe, getStudentMe, getStoredAdmin } from "./api/apiClient";
import { checkBackendHealth } from "./api/config";
import { useApi } from "./utils/useApi";
import { BackendOfflineBanner } from "./components/Status";

export default function App() {
  const [view, setView] = useState("portal");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [submittedStudent, setSubmittedStudent] = useState(null);
  const [drawerStudentId, setDrawerStudentId] = useState(null);
  const [adminAccount, setAdminAccount] = useState(() => getStoredAdmin());
  const [studentAccount, setStudentAccount] = useState(() => getStoredStudentAccount());
  const [backendOk, setBackendOk] = useState(true);
  const [pendingApplyJobId, setPendingApplyJobId] = useState(null);

  const isAdminAuthed = !!adminAccount;
  const isStudentAuthed = !!studentAccount;

  useEffect(() => {
    checkBackendHealth().then((result) => setBackendOk(result.ok));

    // Restore candidate session on load
    if (getStoredStudentAccount()) {
      getStudentMe()
        .then((profile) => setStudentAccount(profile))
        .catch(() => {
          studentLogout();
          setStudentAccount(null);
        });
    }

    // Restore admin session on load
    if (getStoredAdmin()) {
      getAdminMe()
        .then((profile) => setAdminAccount(profile))
        .catch(() => {
          adminLogout();
          setAdminAccount(null);
        });
    }
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

  const startApply = () => {
    if (!isStudentAuthed) {
      setPendingApplyJobId(selectedJobId);
      navigate("student-login");
      return;
    }
    navigate("apply");
  };

  const handleStudentAuthed = (account) => {
    setStudentAccount(account);
    if (pendingApplyJobId) {
      setSelectedJobId(pendingApplyJobId);
      setPendingApplyJobId(null);
      navigate("apply");
    } else {
      navigate("portal");
    }
  };

  const handleStudentLogout = () => {
    studentLogout();
    setStudentAccount(null);
    navigate("portal");
  };

  const handleAdminLogout = () => {
    adminLogout();
    setAdminAccount(null);
    navigate("portal");
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

      <Navbar
        view={view}
        isStudentAuthed={isStudentAuthed}
        isAdminAuthed={isAdminAuthed}
        onNavigate={navigate}
      />

      {view === "portal" && <CareerPortal onOpenJob={openJob} />}

      {view === "jobDetail" && (
        <JobDetail
          job={selectedJob}
          loading={jobLoading}
          error={jobError}
          onRetry={refetchJob}
          onBack={() => navigate("portal")}
          onApply={startApply}
          requiresLogin={!isStudentAuthed}
          isAdminAuthed={isAdminAuthed}
        />
      )}

      {view === "apply" && (
        <Apply
          job={selectedJob}
          account={studentAccount}
          onBack={() => navigate("jobDetail")}
          onSubmitted={(student) => {
            setSubmittedStudent(student);
            navigate("evaluation");
          }}
        />
      )}

      {view === "evaluation" && <Evaluation student={submittedStudent} />}

      {view === "student-login" && (
        <StudentLogin onLoggedIn={handleStudentAuthed} onGoToRegister={() => navigate("student-register")} />
      )}

      {view === "student-register" && (
        <StudentRegister onRegistered={handleStudentAuthed} onGoToLogin={() => navigate("student-login")} />
      )}

      {view === "my-applications" && (
        <MyApplications account={studentAccount} onBrowseJobs={() => navigate("portal")} onLogout={handleStudentLogout} />
      )}

      {view === "admin-login" && (
        <AdminLogin
          onLogin={(admin) => {
            setAdminAccount(admin);
            // First login — force password change before accessing dashboard
            if (admin?.must_change_password) {
              navigate("change-password");
            } else {
              navigate("admin-dashboard");
            }
          }}
        />
      )}

      {view === "change-password" && (
        <ChangePassword
          admin={adminAccount}
          onChanged={() => {
            // Clear the must_change_password flag locally and go to dashboard
            const updated = { ...adminAccount, must_change_password: false };
            setAdminAccount(updated);
            localStorage.setItem("recruitai_admin_user", JSON.stringify(updated));
            navigate("admin-dashboard");
          }}
        />
      )}

      {view === "admin-dashboard" && (
        <AdminDashboard
          admin={adminAccount}
          onNewJob={() => navigate("job-create")}
          onOpenCandidate={(id) => setDrawerStudentId(id)}
          onLogout={handleAdminLogout}
        />
      )}

      {view === "job-create" && (
        <JobCreate onBack={() => navigate("admin-dashboard")} onPublished={() => navigate("admin-dashboard")} />
      )}

      <CandidateDrawer student={drawerStudent} job={drawerJob} onClose={() => setDrawerStudentId(null)} />
    </div>
  );
}
