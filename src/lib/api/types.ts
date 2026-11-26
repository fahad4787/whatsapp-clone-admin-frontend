/** DTOs returned by the Aivora backend admin API (snake_case, as sent on the wire). */

export type PersonRef = { id: string; phone: string; display_name: string | null };

export type BackendHealth = { ok: boolean; service: string; db: "up" | "down"; redis: "up" | "down"; ts: string };

export type AdminRole = "SUPER" | "MOD";

export type AdminProfile = { id: string; email: string; display_name: string | null; role: AdminRole };

export type LoginResult =
  | { status: "ok"; access: string; admin: AdminProfile }
  | { status: "totp_required" | "totp_enrollment_required"; ticket: string };

export type TotpSetup = { secret: string; otpauth_uri: string };

export type OtpStatus = "Pending" | "Used" | "Expired" | "Failed" | "Superseded";

export type OtpItem = {
  id: string;
  /** Phone number (E.164) or email address, depending on `channel`. */
  phone: string;
  channel: "phone" | "email";
  purpose: string;
  /** Only present while the code is still usable. */
  code: string | null;
  status: OtpStatus;
  attempts: number;
  expires_at: string;
  created_at: string;
  consumed_at: string | null;
};

export type UserItem = {
  id: string;
  phone: string;
  display_name: string | null;
  about: string | null;
  avatar_url: string | null;
  banned: boolean;
  banned_at: string | null;
  last_seen_at: string | null;
  last_seen_privacy: string;
  online_privacy: string;
  created_at: string;
  updated_at: string;
  device_count: number;
  conversation_count: number;
};

export type ReportStatus = "open" | "resolved" | "dismissed";

export type ReportItem = {
  id: string;
  reporter_id: string;
  target_user_id: string | null;
  target_conversation_id: string | null;
  reason: string | null;
  message_ids: string[];
  status: ReportStatus;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter: PersonRef;
  target_user: PersonRef | null;
  messages?: { id: string; conversation_id: string; type: string; text: string; created_at: string }[];
};

export type Metrics = {
  users_total: number;
  users_banned: number;
  users_online?: number;
  signups_today: number;
  messages_today: number;
  messages_last_7d: number;
  messages_media_today?: number;
  messages_voice_today?: number;
  messages_polls_today?: number;
  messages_events_today?: number;
  reports_open: number;
  conversations_total: number;
  conversations_groups?: number;
  conversations_direct?: number;
  conversations_disappearing?: number;
  calls_active?: number;
  calls_today?: number;
};

/** One UTC day of activity counts from /api/admin/metrics/series. */
export type MetricsPoint = { date: string; signups: number; messages: number; calls: number };
/** `points` covers 2 × `days`: the previous window followed by the current one. */
export type MetricsSeries = { days: number; points: MetricsPoint[] };

export type CallStatus = "ringing" | "active" | "ended" | "rejected" | "missed";

export type CallItem = {
  id: string;
  kind: string;
  media: string;
  status: string;
  end_reason: string | null;
  room_name: string;
  conversation_id: string | null;
  conversation_title: string | null;
  initiator: PersonRef;
  participants: { user_id: string; status: string; phone: string; display_name: string | null }[];
  participants_label: string;
  started_at: string;
  answered_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  expires_at: string | null;
};

export type CallsSnapshot = { items: CallItem[]; count: number; calls_active: number; calls_today: number };

export type ConversationMember = { user_id: string; phone: string; display_name: string | null; role: string };

export type ConversationItem = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  avatar_url: string | null;
  member_count: number;
  message_count: number;
  disappearing_seconds: number;
  only_admins_can_send: boolean;
  only_admins_can_edit_info: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  members: ConversationMember[];
};

export type ConversationMessage = {
  id: string;
  sender_id: string;
  sender_name: string;
  type: string;
  text: string | null;
  status: string;
  forwarded: boolean;
  view_once: boolean;
  edited_at: string | null;
  expires_at: string | null;
  deleted_for_everyone_at: string | null;
  created_at: string;
  attachment_name: string | null;
  attachment_mime: string | null;
  has_attachment: boolean;
  /** Public media URL (absent on older backends and on messages deleted for everyone). */
  attachment_url?: string | null;
  attachment_thumbnail_url?: string | null;
  attachment_size?: number | null;
  attachment_width?: number | null;
  attachment_height?: number | null;
};

export type ConversationDetail = ConversationItem & { messages: ConversationMessage[] };

export type AppSettings = {
  otp_length: number;
  otp_expiry: number;
  otp_attempts: number;
  otp_gap: number;
  otp_per_phone_hourly: number;
  otp_per_ip_hourly: number;
  ring_timeout: number;
  max_group_call_participants: number;
  max_group_size: number;
  upload_limit_mb: number;
  edit_window_minutes: number;
  maintenance_mode: boolean;
  latest_android_version: string;
  latest_android_version_code: number;
  min_android_version_code: number;
  download_url: string;
  allow_people_search: boolean;
  min_search_chars: number;
  sms_enabled: boolean;
};

export type CountryItem = { iso: string; name: string; dial: string; enabled: boolean; sort_order: number };

export type AuditItem = {
  id: string;
  action: string;
  meta: unknown;
  created_at: string;
  actor: { id: string; email: string; display_name: string | null };
};

export type AdminItem = {
  id: string;
  email: string;
  display_name: string | null;
  role: AdminRole;
  created_at: string;
  updated_at?: string;
};

export type ChannelItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  verified: boolean;
  listed: boolean;
  followers: number;
  posts: number;
  created_at: string;
  updated_at: string;
};

export type ChannelPost = { id: string; text: string; deleted: boolean; view_count: number; created_at: string };

export type StickerPack = { id: string; name: string; publisher: string; featured: boolean; stickers: number; created: string };

export type LegalDocs = { privacy_policy: string; terms_of_service: string };

export type SecuritySettings = {
  require_2fa: boolean;
  lock_after_fail: boolean;
  session_hours: number;
  max_fail_attempts: number;
  lock_minutes: number;
};

export type Firewall = { allowlist: string[]; client_ip: string | null };
