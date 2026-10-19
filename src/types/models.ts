export type UserRow = {
  id: string;
  name: string;
  phone: string;
  status: "Active" | "Blocked" | "Inactive" | "Deleted";
  lastSeen: string;
  joined: string;
};

export type OtpRow = {
  id: string;
  time: string;
  phone: string;
  code: string;
  status: "Pending" | "Used" | "Expired" | "Failed";
  attempts: number;
  expires: string;
};

export type ConversationRow = {
  id: string;
  title: string;
  type: "Direct" | "Group";
  members: number;
  messages: number;
  created: string;
  last: string;
};

export type CallRow = {
  id: string;
  started: string;
  kind: "Direct" | "Group";
  media: "audio" | "video";
  participants: string;
  outcome: "Completed" | "Missed" | "Cancelled";
};

export type ReportRow = {
  id: string;
  reported: string;
  reporter: string;
  target: string;
  reason: string;
  status: "Open" | "Resolved";
  action: "block" | "channel";
};

export type CountryRow = {
  id: string;
  name: string;
  dial: string;
  iso: string;
  enabled: boolean;
};

export type ChannelRow = {
  id: string;
  name: string;
  slug: string;
  followers: number;
  posts: number;
};

export type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
};

export type AuditRow = {
  id: string;
  time: string;
  actor: string;
  action: string;
  detail: string;
};

export type StickerRow = {
  id: string;
  name: string;
  stickers: number;
  created: string;
};

export type LiveCallRow = {
  id: string;
  room: string;
  participants: string;
  started: string;
  kind: "audio" | "video";
};

export type SettingsMap = {
  otpLength: number;
  otpExpiry: number;
  otpAttempts: number;
  otpGap: number;
  otpPerPhoneHourly: number;
  otpPerIpHourly: number;
  ringTimeout: number;
  maxGroupCallParticipants: number;
  maxGroupSize: number;
  uploadLimitMb: number;
  editWindowMinutes: number;
  maintenanceMode: boolean;
  latestAndroidVersion: string;
  latestAndroidVersionCode: number;
  downloadUrl: string;
  allowPeopleSearch: boolean;
  minSearchChars: number;
  smsEnabled: boolean;
};

export type CollectionKey =
  | "users"
  | "otps"
  | "conversations"
  | "calls"
  | "reports"
  | "countries"
  | "channels"
  | "admins"
  | "audit"
  | "stickers"
  | "live";
