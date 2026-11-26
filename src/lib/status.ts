import type { Tone } from "@/components/ui/Badge";
import type { OtpItem, OtpStatus, ReportStatus } from "@/lib/api";

/** Status → badge tone and plain-language help, shared by every screen that shows them. */

export const OTP_STATUS: Record<OtpStatus, { tone: Tone; help: string }> = {
  Pending: { tone: "warning", help: "Waiting for the user to enter it" },
  Used: { tone: "success", help: "Verified, the user signed in" },
  Failed: { tone: "danger", help: "Too many wrong attempts" },
  Expired: { tone: "neutral", help: "Not used before it expired" },
  Superseded: { tone: "neutral", help: "Replaced by a newer code" },
};

/** A pending code whose clock ran out is Expired without waiting for the next refresh. */
export function otpEffectiveStatus(o: OtpItem, now: number): OtpStatus {
  if (o.status === "Pending" && +new Date(o.expires_at) < now) return "Expired";
  return o.status;
}

const OTP_PURPOSE: Record<string, string> = {
  login: "Sign in",
  change_number: "Change number",
  add_email: "Add email",
  verify_email: "Verify email",
  two_step: "Two-step verification",
};
export const otpPurpose = (p: string) => OTP_PURPOSE[p] ?? p.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export const CALL_STATUS: Record<string, { tone: Tone; label: string }> = {
  ringing: { tone: "warning", label: "Ringing" },
  active: { tone: "success", label: "In call" },
  ended: { tone: "neutral", label: "Ended" },
  rejected: { tone: "danger", label: "Declined" },
  missed: { tone: "danger", label: "Missed" },
};
export const callStatus = (s: string) => CALL_STATUS[s] ?? { tone: "neutral" as Tone, label: s };

export const REPORT_STATUS: Record<ReportStatus, { tone: Tone; label: string }> = {
  open: { tone: "warning", label: "Open" },
  resolved: { tone: "success", label: "Resolved" },
  dismissed: { tone: "neutral", label: "Dismissed" },
};
