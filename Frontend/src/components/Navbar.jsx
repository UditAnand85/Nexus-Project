import { APP_NAME } from "../constants/roles";

const CANDIDATE_VIEWS = ["portal", "jobDetail", "apply", "evaluation"];
const STUDENT_AUTH_VIEWS = ["student-login", "student-register", "my-applications"];
const ADMIN_VIEWS = ["admin-login", "admin-dashboard", "job-create"];

export default function Navbar({ view, isStudentAuthed, isAdminAuthed, onNavigate }) {
  const section = ADMIN_VIEWS.includes(view)
    ? "admin"
    : STUDENT_AUTH_VIEWS.includes(view)
    ? "student-auth"
    : "portal";

  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-line bg-paper sticky top-0 z-50">
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate("portal")}>
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-white font-mono font-semibold text-[13px]">
          RA
        </div>
        <div className="font-serif font-semibold text-[19px]">{APP_NAME}</div>
      </div>
      <div className="flex gap-1.5 items-center">
        <button
          onClick={() => onNavigate("portal")}
          className={`px-4 py-2 text-sm rounded-full transition ${
            section === "portal" ? "bg-primary text-white" : "text-inksoft hover:bg-[#EEEFEC] hover:text-ink"
          }`}
        >
          Career Portal
        </button>

        {isStudentAuthed ? (
          <button
            onClick={() => onNavigate("my-applications")}
            className={`px-4 py-2 text-sm rounded-full transition ${
              view === "my-applications" ? "bg-primary text-white" : "text-inksoft hover:bg-[#EEEFEC] hover:text-ink"
            }`}
          >
            My Applications
          </button>
        ) : (
          <button
            onClick={() => onNavigate("student-login")}
            className={`px-4 py-2 text-sm rounded-full transition ${
              section === "student-auth" ? "bg-primary text-white" : "text-inksoft hover:bg-[#EEEFEC] hover:text-ink"
            }`}
          >
            Sign in
          </button>
        )}

        <div className="w-px h-5 bg-line mx-1.5" />

        <button
          onClick={() => onNavigate(isAdminAuthed ? "admin-dashboard" : "admin-login")}
          className={`px-4 py-2 text-sm rounded-full transition ${
            section === "admin" ? "bg-ink text-white" : "text-inksoft hover:bg-[#EEEFEC] hover:text-ink"
          }`}
        >
          Admin
        </button>
      </div>
    </div>
  );
}
