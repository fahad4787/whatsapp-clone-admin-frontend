import { Sidebar } from "@/components/Sidebar";
import { PanelLeft, Smartphone } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bp-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-bp-border/80 bg-white/80 px-4 backdrop-blur-md">
          <button
            type="button"
            className="rounded-lg p-2 text-bp-muted transition-colors hover:bg-slate-100 hover:text-bp-ink"
            aria-label="Collapse sidebar"
          >
            <PanelLeft size={18} />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-bp-muted transition-colors hover:bg-slate-100 hover:text-bp-ink"
            aria-label="Get the Android app"
          >
            <Smartphone size={18} />
          </button>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 overflow-auto p-5 md:p-7">{children}</main>
      </div>
    </div>
  );
}
