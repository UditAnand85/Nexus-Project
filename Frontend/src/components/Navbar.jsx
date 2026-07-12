import { useState, useRef, useEffect } from "react";
import { APP_NAME } from "../constants/roles";

const ADMIN_VIEWS = ["admin-login", "admin-dashboard", "job-create"];

export default function Navbar({ view, isStudentAuthed, isAdminAuthed, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAdminSection = ADMIN_VIEWS.includes(view);

  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-line bg-paper sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate("portal")}>
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-white font-mono font-semibold text-[13px]">
          RA
        </div>
        <div className="font-serif font-semibold text-[19px]">{APP_NAME}</div>
      </div>

      {/* Right nav */}
      <div className="flex gap-1.5 items-center">
        <button
          onClick={() => onNavigate("portal")}
          className={`px-4 py-2 text-sm rounded-full transition ${
            !isAdminSection && view !== "my-applications"
              ? "bg-primary text-white"
              : "text-inksoft hover:bg-[#EEEFEC] hover:text-ink"
          }`}
        >
          Career Portal
        </button>

        {/* My Applications — shown only when a candidate is signed in */}
        {isStudentAuthed && (
          <button
            onClick={() => onNavigate("my-applications")}
            className={`px-4 py-2 text-sm rounded-full transition ${
              view === "my-applications"
                ? "bg-primary text-white"
                : "text-inksoft hover:bg-[#EEEFEC] hover:text-ink"
            }`}
          >
            My Applications
          </button>
        )}

        {/* Admin Dashboard — shown only when an admin is signed in */}
        {isAdminAuthed && (
          <button
            onClick={() => onNavigate("admin-dashboard")}
            className={`px-4 py-2 text-sm rounded-full transition ${
              isAdminSection
                ? "bg-primary text-white"
                : "text-inksoft hover:bg-[#EEEFEC] hover:text-ink"
            }`}
          >
            Dashboard
          </button>
        )}

        {/* Show Sign In / Admin options only if no one is signed in */}
        {!isStudentAuthed && !isAdminAuthed && (
          <>
            <div className="w-px h-5 bg-line mx-1.5" />

            {isAdminSection ? (
              <button
                onClick={() => onNavigate("admin-dashboard")}
                className="px-4 py-2 text-sm rounded-full bg-ink text-white transition"
              >
                Admin
              </button>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="px-4 py-2 text-sm rounded-full transition flex items-center gap-1.5 text-inksoft hover:bg-[#EEEFEC] hover:text-ink"
                >
                  Sign in
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-paper border border-line rounded-xl shadow-lg py-1.5 z-50 animate-fade-in">
                    {/* Candidate section */}
                    <div className="px-3.5 pt-2 pb-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-inksoft">Candidate</span>
                    </div>
                    <MenuItem
                      label="Sign in as Candidate"
                      sub="Apply to open roles"
                      onClick={() => { onNavigate("student-login"); setMenuOpen(false); }}
                    />
                    <MenuItem
                      label="Create account"
                      sub="Register to apply"
                      onClick={() => { onNavigate("student-register"); setMenuOpen(false); }}
                    />

                    <div className="mx-3.5 my-1.5 h-px bg-line" />

                    {/* Admin section */}
                    <div className="px-3.5 pt-1 pb-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-inksoft">Admin</span>
                    </div>
                    <MenuItem
                      label="Admin Sign in"
                      sub="HR recruiter access"
                      onClick={() => {
                        onNavigate("admin-login");
                        setMenuOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MenuItem({ label, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3.5 py-2 hover:bg-[#EEEFEC] transition rounded-md mx-0"
    >
      <div className="text-sm text-ink font-medium">{label}</div>
      <div className="text-[11px] text-inksoft mt-0.5">{sub}</div>
    </button>
  );
}
