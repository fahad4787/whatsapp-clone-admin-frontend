"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Copy } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    window.setTimeout(() => {
      localStorage.setItem("bp-admin-session", "1");
      router.push("/");
    }, 350);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bp-bg px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(29,170,97,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(14,143,78,0.08),_transparent_45%)]"
      />

      <div className="relative flex w-full max-w-[420px] flex-col gap-4">
        <form onSubmit={onSubmit} className="bp-card p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-bp-green to-bp-green-dark text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(29,170,97,0.35)]">
              BP
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-bp-ink">Bolta Punjab admin</h1>
              <p className="text-sm text-bp-muted">Sign in with your admin account.</p>
            </div>
          </div>

          <label className="block text-sm font-semibold">
            Email or username
            <input
              className="bp-input mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold">
            Password
            <input
              className="bp-input mt-1.5"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button className="bp-btn bp-btn-primary mt-6 w-full" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <section className="bp-card p-6 text-center">
          <div className="mx-auto mb-3 flex h-32 w-32 items-center justify-center rounded-2xl border border-dashed border-bp-border bg-gradient-to-b from-white to-slate-50 text-xs font-medium text-bp-muted">
            QR code
          </div>
          <h2 className="text-[15px] font-bold">Get the Android app</h2>
          <p className="mt-1 text-sm text-bp-muted">
            Scan with the phone camera, or open the link on the phone.
            <br />
            Version 1.12.13 · 28.2 MB
          </p>
          <div className="bp-input bp-mono mt-3 truncate text-left text-[12px]">
            https://wa.zirvik.com/download
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" className="bp-btn bp-btn-secondary flex-1">
              <Copy size={15} /> Copy link
            </button>
            <button type="button" className="bp-btn bp-btn-primary flex-1">
              <Download size={15} /> Download APK
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
