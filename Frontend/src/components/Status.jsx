export function Loading({ label = "Loading…" }) {
  return (
    <div className="py-16 text-center">
      <p className="font-mono text-xs text-inksoft">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="py-16 text-center">
      <p className="text-stop text-sm mb-3">{message || "Something went wrong."}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost text-[13px] py-2 px-5">
          Try again
        </button>
      )}
    </div>
  );
}

export function BackendOfflineBanner() {
  return (
    <div className="bg-stopsoft border-b border-stop px-8 py-2.5 text-center">
      <span className="font-mono text-[12px] text-stop">
        Can't reach the backend at the configured API_BASE_URL. Check that it's running, or set
        VITE_USE_MOCK=true in .env to preview with sample data.
      </span>
    </div>
  );
}
