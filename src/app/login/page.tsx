"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, ShieldCheck, Users } from "lucide-react";
import { AivoraBrand } from "@/components/brand";
import { Button, Callout, CopyButton, Field, Input } from "@/components/ui";
import { authApi, getAdminToken, saveAdminSession, type LoginResult, type TotpSetup } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

type Step =
  | { kind: "credentials" }
  | { kind: "code"; ticket: string }
  | { kind: "enroll"; ticket: string; setup: TotpSetup | null };

/** Only same-site paths; never bounce back to /login. */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/login") ? raw : "/";
}

const FEATURES = [
  { icon: Users, text: "Users, chats and reports in one place" },
  { icon: ShieldCheck, text: "Two-factor sign-in and IP allow-list" },
  { icon: Lock, text: "Every admin action is audited" },
];

function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="6-digit code" hint="From Google Authenticator, 1Password or a similar app.">
      {(a) => (
        <Input
          {...a}
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className="h-12 text-center font-mono text-xl tracking-[0.5em]"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        />
      )}
    </Field>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const expired = params.get("expired") === "1";

  const [step, setStep] = useState<Step>({ kind: "credentials" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (and not bounced here by an expired session) → straight in.
  useEffect(() => {
    if (!expired && getAdminToken()) router.replace(next);
  }, [expired, next, router]);

  const restart = () => {
    setStep({ kind: "credentials" });
    setCode("");
    setError(null);
  };

  const handle = async (result: LoginResult) => {
    if (result.status === "ok") {
      saveAdminSession(result.access, result.admin.email);
      router.replace(next);
      return;
    }
    setCode("");
    if (result.status === "totp_required") {
      setStep({ kind: "code", ticket: result.ticket });
      return;
    }
    setStep({ kind: "enroll", ticket: result.ticket, setup: null });
    const setup = await authApi.setupTotp(result.ticket);
    setStep({ kind: "enroll", ticket: result.ticket, setup });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (step.kind !== "credentials" && code.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    try {
      if (step.kind === "credentials") await handle(await authApi.login(email.trim(), password));
      else if (step.kind === "code") await handle(await authApi.verifyTotp(step.ticket, code));
      else await handle(await authApi.confirmTotp(step.ticket, code));
    } catch (err) {
      setError(errorMessage(err, step.kind === "credentials" ? "Couldn't sign in. Try again." : "That code didn't work. Try again."));
      if (step.kind !== "credentials") setCode("");
    } finally {
      setBusy(false);
    }
  };

  const heading =
    step.kind === "credentials"
      ? { title: "Sign in", text: "Use your admin email and password." }
      : step.kind === "code"
        ? { title: "Two-factor check", text: "Enter the code from your authenticator app." }
        : { title: "Set up two-factor", text: "Your account needs an authenticator app before you can continue." };

  return (
    <form onSubmit={onSubmit} noValidate className="animate-pop-in rounded-3xl border border-line bg-surface p-7 shadow-pop sm:p-9">
      {step.kind !== "credentials" ? (
        <button type="button" onClick={restart} className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink">
          <ArrowLeft size={15} /> Back
        </button>
      ) : null}
      <div className="mb-7">
        {step.kind !== "credentials" ? (
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand"><KeyRound size={20} /></span>
        ) : null}
        <h1 className="text-[1.6rem] font-extrabold tracking-tight text-ink">{heading.title}</h1>
        <p className="mt-1.5 text-sm text-muted">{heading.text}</p>
      </div>

      {expired && step.kind === "credentials" && !error ? (
        <Callout tone="warning" className="mb-5">Your session ended. Sign in again to continue.</Callout>
      ) : null}

      {step.kind === "credentials" ? (
        <div className="flex flex-col gap-4">
          <Field label="Email">
            {(a) => (
              <Input {...a} type="email" autoFocus autoComplete="username" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
          </Field>
          <Field label="Password">
            {(a) => (
              <Input
                {...a}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                trailing={
                  <button
                    type="button"
                    className="rounded-md p-1 text-muted hover:text-ink"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            )}
          </Field>
        </div>
      ) : step.kind === "code" ? (
        <CodeInput value={code} onChange={setCode} />
      ) : (
        <div className="flex flex-col gap-5">
          <ol className="space-y-2 text-sm text-ink-soft">
            <li><b className="text-ink">1.</b> Open your authenticator app and add an account.</li>
            <li><b className="text-ink">2.</b> Enter the setup key below, or open the link on this device.</li>
            <li><b className="text-ink">3.</b> Type the 6-digit code it shows.</li>
          </ol>
          <div className="rounded-2xl border border-line bg-surface-muted p-4">
            <p className="text-xs font-semibold text-muted">Setup key</p>
            {step.setup ? (
              <>
                <div className="mt-1 flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all font-mono text-sm font-semibold text-ink">{step.setup.secret}</code>
                  <CopyButton value={step.setup.secret} label="Copy setup key" />
                </div>
                <a href={step.setup.otpauth_uri} className="mt-2 inline-block text-[13px] font-semibold text-brand hover:text-brand-text">
                  Open in authenticator app
                </a>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">Generating…</p>
            )}
          </div>
          <CodeInput value={code} onChange={setCode} />
        </div>
      )}

      {error ? <Callout tone="danger" className="mt-5">{error}</Callout> : null}

      <Button type="submit" className="mt-7 h-11 w-full" loading={busy} disabled={step.kind === "enroll" && !step.setup}>
        {step.kind === "credentials" ? "Sign in" : step.kind === "code" ? "Verify" : "Turn on two-factor"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh bg-canvas">
      <aside className="relative hidden w-[42%] max-w-xl flex-col justify-between overflow-hidden bg-[#0c1612] p-12 text-white lg:flex">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(29,184,102,0.32),transparent_55%),radial-gradient(ellipse_at_85%_90%,rgba(18,154,85,0.18),transparent_50%)]" />
        <div className="relative"><AivoraBrand size={42} subtitle="Admin console" inverted /></div>
        <div className="relative max-w-md">
          <h2 className="text-[2.1rem] font-extrabold leading-[1.15] tracking-tight">Run Aivora from one calm place.</h2>
          <ul className="mt-8 space-y-3.5 text-sm text-white/75">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><Icon size={15} className="text-[#6fcf97]" /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">Authorised staff only.</p>
      </aside>
      <div className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(18,154,85,0.10),transparent_55%)]" />
        <div className="relative w-full max-w-[420px]">
          <div className="mb-7 lg:hidden"><AivoraBrand size={40} subtitle="Admin console" /></div>
          <Suspense fallback={<div className="h-96 rounded-3xl border border-line bg-surface shadow-pop" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
