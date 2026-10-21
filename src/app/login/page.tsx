"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Download, Eye, EyeOff, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui";
import { AivoraBrand, AivoraLogo } from "@/components/brand";
import { APP, STORAGE_KEYS } from "@/config/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.adminSession, "1");
      router.push("/");
    }, 350);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(APP.downloadUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(18,154,85,0.14),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(12,22,18,0.04),_transparent_45%)]"
      />

      {/* Brand panel */}
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-[#0c1612] px-10 py-12 text-white lg:flex xl:px-14">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,_rgba(29,184,102,0.35),_transparent_55%),radial-gradient(ellipse_at_80%_80%,_rgba(18,154,85,0.18),_transparent_50%)]"
        />
        <div className="relative">
          <AivoraBrand size={44} subtitle="Admin console" inverted />
        </div>

        <div className="relative my-10 flex justify-start" aria-hidden>
          <AivoraLogo size={112} />
        </div>

        <div className="relative max-w-md">
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#6fcf97] uppercase">Secure access</p>
          <h1 className="mt-3 text-[2.15rem] leading-[1.15] font-extrabold tracking-tight">
            Operate the network with confidence.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/65">
            Manage users, OTP flows, calls, and app releases from one calm control room built for your team.
          </p>
          <ul className="mt-8 space-y-3.5 text-sm text-white/75">
            {[
              { icon: ShieldCheck, text: "Role-based admin access" },
              { icon: Lock, text: "Session-aware console" },
              { icon: Smartphone, text: "Android builds & install links" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/8 ring-1 ring-white/10">
                  <Icon size={15} className="text-[#6fcf97]" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">Dev environment · mock authentication</p>
      </aside>

      {/* Auth column */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="bp-page w-full max-w-[420px]">
          <div className="mb-7 lg:hidden">
            <AivoraBrand size={44} subtitle="Admin console" />
          </div>

          <form onSubmit={onSubmit} className="bp-card p-7 sm:p-8">
            <div className="mb-7">
              <h2 className="text-[1.45rem] font-extrabold tracking-tight text-bp-ink">Sign in</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-bp-muted">
                Use your admin email and password to open the console.
              </p>
            </div>

            <label className="block text-sm font-semibold text-bp-ink">
              Email or username
              <input
                className="bp-input mt-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="admin@aivora.dev"
              />
            </label>

            <label className="mt-4 block text-sm font-semibold text-bp-ink">
              Password
              <div className="relative mt-2">
                <input
                  className="bp-input pr-11"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="bp-icon-btn absolute top-1/2 right-1.5 -translate-y-1/2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="mt-3 flex items-center justify-between gap-3 text-[13px]">
              <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-bp-muted">
                <input type="checkbox" className="bp-check" defaultChecked />
                Keep me signed in
              </label>
              <span className="font-medium text-bp-muted/70">Forgot password?</span>
            </div>

            <Button className="mt-7 w-full" type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in to console"}
            </Button>

            <p className="mt-4 text-center text-xs leading-relaxed text-bp-muted">
              Mock auth for local development — any credentials work.
            </p>
          </form>

          <section className="bp-card mt-4 p-6 sm:p-7">
            <div className="flex gap-4">
              <div className="flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center rounded-md border border-bp-border bg-gradient-to-b from-white to-[#f4f7f5]">
                <AivoraLogo size={56} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="shrink-0 text-bp-green" />
                  <h3 className="text-[15px] font-bold tracking-tight text-bp-ink">Get the Android app</h3>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-bp-muted">
                  Scan or open the install link on a phone.
                </p>
                <p className="mt-0.5 text-xs font-medium text-bp-muted">
                  Version {APP.androidVersion} · {APP.androidSize}
                </p>
              </div>
            </div>

            <div className="bp-mono mt-4 truncate rounded-[var(--radius-sm)] border border-bp-border bg-[#f7faf8] px-3 py-2.5 text-[11px] text-bp-muted">
              {APP.downloadUrl}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Button type="button" variant="secondary" className="w-full whitespace-nowrap" onClick={copyLink}>
                <Copy size={15} />
                {copied ? "Copied" : "Copy link"}
              </Button>
              <a href={APP.downloadUrl} className="bp-btn bp-btn-primary w-full whitespace-nowrap">
                <Download size={15} />
                Download APK
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
