import type { ReactNode } from "react";

export function Alert({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div className="bp-alert" role="alert">
      {children}
    </div>
  );
}

export function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="bp-btn bp-btn-secondary" onClick={onClick}>
      Refresh
    </button>
  );
}
