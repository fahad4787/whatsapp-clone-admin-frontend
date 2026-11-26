/** Re-mounts per route, so each page eases in (the shell around it stays put). */
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
