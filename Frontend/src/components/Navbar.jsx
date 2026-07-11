import { APP_NAME } from "../constants/roles";

export default function Navbar({ view, onNavigate }) {
  const isAdminSection = view.startsWith("admin") || view === "job-create";

  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-line bg-paper sticky top-0 z-50">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-ink rounded-sm flex items-center justify-center text-paper font-mono font-semibold text-[13px]">
          RA
        </div>
        <div className="font-serif font-semibold text-[19px]">{APP_NAME}</div>
      </div>
      <div className="flex gap-1.5 items-center">
        <button
          onClick={() => onNavigate("portal")}
          className={`px-4 py-2 text-sm rounded-full transition ${
            !isAdminSection ? "bg-ink text-paper" : "text-inksoft hover:bg-[#E9EAE6] hover:text-ink"
          }`}
        >
          Career Portal
        </button>
        <button
          onClick={() => onNavigate("admin-login")}
          className={`px-4 py-2 text-sm rounded-full transition ${
            isAdminSection ? "bg-ink text-paper" : "text-inksoft hover:bg-[#E9EAE6] hover:text-ink"
          }`}
        >
          Admin
        </button>
      </div>
    </div>
  );
}
