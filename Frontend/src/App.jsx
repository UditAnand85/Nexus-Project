import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import CandidateDrawer from "./components/CandidateDrawer";
import CareerPortal from "./pages/CareerPortal";
import JobDetail from "./pages/JobDetail";
import Apply from "./pages/Apply";
import Evaluation from "./pages/Evaluation";
import EvaluationLanding from "./pages/EvaluationLanding";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import MyApplications from "./pages/MyApplications";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ChangePassword from "./pages/ChangePassword";
import JobCreate from "./pages/JobCreate";
import JobCandidates from "./pages/JobCandidates";
import { getStudentDetail, getStoredStudentAccount, studentLogout, adminLogout, getAdminMe, getStudentMe, getStoredAdmin } from "./api/apiClient";
import { checkBackendHealth } from "./api/config";
import { useApi } from "./utils/useApi";
import { BackendOfflineBanner } from "./components/Status";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [submittedStudent, setSubmittedStudent] = useState(null);
  const [drawerStudentId, setDrawerStudentId] = useState(null);
  
  const [adminAccount, setAdminAccount] = useState(() => getStoredAdmin());
  const [studentAccount, setStudentAccount] = useState(() => getStoredStudentAccount());
  const [backendOk, setBackendOk] = useState(true);

  const isAdminAuthed = !!adminAccount;
  const isStudentAuthed = !!studentAccount;

  useEffect(() => {
    checkBackendHealth().then((result) => setBackendOk(result.ok));

    if (getStoredStudentAccount()) {
      getStudentMe()
        .then((profile) => setStudentAccount(profile))
        .catch(() => {
          studentLogout();
          setStudentAccount(null);
        });
    }

    if (getStoredAdmin()) {
      getAdminMe()
        .then((profile) => setAdminAccount(profile))
        .catch(() => {
          adminLogout();
          setAdminAccount(null);
        });
    }
  }, []);

  const handleStudentAuthed = (account) => {
    setStudentAccount(account);
  };

  const handleStudentLogout = () => {
    studentLogout();
    setStudentAccount(null);
    navigate("/");
  };

  const handleAdminLogout = () => {
    adminLogout();
    setAdminAccount(null);
    navigate("/");
  };

  const { data: drawerStudent } = useApi(
    () => (drawerStudentId ? getStudentDetail(drawerStudentId) : Promise.resolve(null)),
    [drawerStudentId]
  );

  return (
    <div>
      {!backendOk && <BackendOfflineBanner />}

      {!location.pathname.startsWith("/evaluate") && (
        <Navbar
          isStudentAuthed={isStudentAuthed}
          isAdminAuthed={isAdminAuthed}
          onNavigate={(path) => navigate(path)}
        />
      )}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<CareerPortal />} />
        <Route path="/job/:id" element={<JobDetail requiresLogin={!isStudentAuthed} isAdminAuthed={isAdminAuthed} />} />
        
        <Route path="/student-login" element={<StudentLogin onLoggedIn={handleStudentAuthed} />} />
        <Route path="/student-register" element={<StudentRegister onRegistered={handleStudentAuthed} />} />
        <Route path="/admin-login" element={<AdminLogin onLogin={(admin) => {
          setAdminAccount(admin);
          if (admin?.must_change_password) navigate("/admin/change-password");
          else navigate("/admin/dashboard");
        }} />} />

        {/* Candidate Protected Routes */}
        <Route path="/apply/:id" element={
          isStudentAuthed ? 
          <Apply account={studentAccount} onSubmitted={(s) => { setSubmittedStudent(s); navigate("/evaluation-success"); }} /> : 
          <Navigate to="/student-login" state={{ from: location }} replace />
        } />
        <Route path="/evaluation-success" element={<Evaluation student={submittedStudent} />} />
        <Route path="/my-applications" element={
          isStudentAuthed ? 
          <MyApplications account={studentAccount} onBrowseJobs={() => navigate("/")} onLogout={handleStudentLogout} /> : 
          <Navigate to="/student-login" replace />
        } />
        <Route path="/evaluate" element={<EvaluationLanding />} />

        {/* Admin Protected Routes */}
        <Route path="/admin/dashboard" element={
          isAdminAuthed ? 
          <AdminDashboard admin={adminAccount} onLogout={handleAdminLogout} /> : 
          <Navigate to="/admin-login" replace />
        } />
        <Route path="/admin/change-password" element={
          isAdminAuthed ? 
          <ChangePassword admin={adminAccount} onChanged={() => {
            const updated = { ...adminAccount, must_change_password: false };
            setAdminAccount(updated);
            localStorage.setItem("recruitai_admin_user", JSON.stringify(updated));
            navigate("/admin/dashboard");
          }} /> : 
          <Navigate to="/admin-login" replace />
        } />
        <Route path="/admin/job/create" element={
          isAdminAuthed ? 
          <JobCreate onBack={() => navigate("/admin/dashboard")} onPublished={() => navigate("/admin/dashboard")} /> : 
          <Navigate to="/admin-login" replace />
        } />
        <Route path="/admin/job/:id/candidates" element={
          isAdminAuthed ? 
          <JobCandidates onBack={() => navigate("/admin/dashboard")} onOpenCandidate={(id) => setDrawerStudentId(id)} /> : 
          <Navigate to="/admin-login" replace />
        } />
      </Routes>

      <CandidateDrawer student={drawerStudent} job={null} onClose={() => setDrawerStudentId(null)} />
    </div>
  );
}
