import { ApiError } from "@/lib/api/http";

/** Backend error codes → messages an admin can act on. */
const MESSAGES: Record<string, string> = {
  network_error: "Can't reach the server. Check your connection and try again.",
  unauthorized: "Your session has ended. Please sign in again.",
  invalid_credentials: "Email or password is incorrect.",
  login_locked: "Too many failed attempts. This account is locked for a while.",
  ip_blocked: "Sign-in isn't allowed from this IP address.",
  invalid_code: "That code is incorrect or has expired.",
  wrong_ticket: "This sign-in step has expired. Start again.",
  setup_first: "Set up your authenticator app first.",
  totp_not_enrolled: "Two-factor isn't set up for this account yet.",
  super_only: "Only a super admin can do this.",
  email_taken: "An admin with this email already exists.",
  phone_taken: "A user with this phone number already exists.",
  invalid_phone: "Enter the number in international format, e.g. +923001234567.",
  banned: "This user is banned. Unban them first.",
  not_found: "It no longer exists. The list has been refreshed.",
  invalid_body: "Some values are invalid. Check the form and try again.",
  rate_limited: "Too many requests. Wait a moment and try again.",
};

export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof ApiError) return MESSAGES[err.code] ?? (err.status >= 500 ? "The server had a problem. Try again shortly." : fallback);
  return fallback;
}
