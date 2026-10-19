import { APP } from "@/config/constants";
import type {
  AdminRow,
  AuditRow,
  CallRow,
  ChannelRow,
  ConversationRow,
  CountryRow,
  LiveCallRow,
  OtpRow,
  ReportRow,
  SettingsMap,
  StickerRow,
  UserRow,
} from "@/types/models";

export const seedUsers: UserRow[] = [
  { id: "u1", name: "B Test", phone: "+92 300 2882200", status: "Active", lastSeen: "1 minute ago", joined: "56 minutes ago" },
  { id: "u2", name: "B Home", phone: "+92 321 2222724", status: "Active", lastSeen: "12 hours ago", joined: "12 hours ago" },
  { id: "u3", name: "Zara", phone: "+92 304 4197479", status: "Blocked", lastSeen: "3 days ago", joined: "3 days ago" },
  { id: "u4", name: "Hamza", phone: "+92 307 7253342", status: "Inactive", lastSeen: "3 days ago", joined: "3 days ago" },
  { id: "u5", name: "Sana", phone: "+92 303 3167713", status: "Active", lastSeen: "3 days ago", joined: "3 days ago" },
];

export const seedOtps: OtpRow[] = [
  { id: "o1", time: "00:09:51", phone: "+92 323 4226146", code: "482910", status: "Used", attempts: 0, expires: "00:14" },
  { id: "o2", time: "00:08:12", phone: "+92 300 2882200", code: "119203", status: "Pending", attempts: 0, expires: "00:13" },
  { id: "o3", time: "23:55:01", phone: "+92 321 2222724", code: "774001", status: "Expired", attempts: 0, expires: "00:00" },
];

export const seedConversations: ConversationRow[] = [
  { id: "c1", title: "Direct chat", type: "Direct", members: 2, messages: 179, created: "3 days ago", last: "just now" },
  { id: "c2", title: "Punjab Friends", type: "Group", members: 8, messages: 42, created: "3 days ago", last: "6 m ago" },
  { id: "c3", title: "Direct chat", type: "Direct", members: 2, messages: 12, created: "3 minutes ago", last: "New" },
];

export const seedCalls: CallRow[] = [
  { id: "k1", started: "20 Oct 2026, 00:44", kind: "Direct", media: "audio", participants: "B Test · B Chaudhry", outcome: "Completed" },
  { id: "k2", started: "19 Oct 2026, 21:10", kind: "Direct", media: "video", participants: "Mustafa · haadi", outcome: "Missed" },
  { id: "k3", started: "19 Oct 2026, 18:02", kind: "Group", media: "audio", participants: "Zara · Hamza · Ali", outcome: "Cancelled" },
];

export const seedReports: ReportRow[] = [
  { id: "r1", reported: "17 Oct 2026, 03:03", reporter: "Nadia", target: "Kamran", reason: "spam", status: "Open", action: "block" },
  { id: "r2", reported: "16 Oct 2026, 14:22", reporter: "Ali", target: "Channel: Punjab News", reason: "Misleading advice", status: "Open", action: "channel" },
];

export const seedCountries: CountryRow[] = [
  { id: "au", name: "Australia", dial: "+61", iso: "AU", enabled: true },
  { id: "om", name: "Oman", dial: "+968", iso: "OM", enabled: true },
  { id: "pk", name: "Pakistan", dial: "+92", iso: "PK", enabled: true },
  { id: "ae", name: "United Arab Emirates", dial: "+971", iso: "AE", enabled: true },
  { id: "gb", name: "United Kingdom", dial: "+44", iso: "GB", enabled: false },
  { id: "us", name: "United States", dial: "+1", iso: "US", enabled: true },
];

export const seedChannels: ChannelRow[] = [
  { id: "ch1", name: "Punjab News", slug: "punjab-news", followers: 1280, posts: 42 },
  { id: "ch2", name: "Bolta Updates", slug: "bolta-updates", followers: 540, posts: 18 },
];

export const seedAdmins: AdminRow[] = [
  { id: "a1", name: "Fixel", email: "admin@example.com", role: "Superadmin", lastLogin: "just now" },
];

export const seedAudit: AuditRow[] = [
  { id: "au1", time: "00:45:12", actor: "Fixel", action: "Viewed OTP code", detail: "+92 •••• 6146" },
  { id: "au2", time: "00:40:01", actor: "Fixel", action: "Signed in", detail: "Admin panel" },
];

export const seedStickers: StickerRow[] = [];

export const seedLive: LiveCallRow[] = [];

export const seedSettings: SettingsMap = {
  otpLength: 6,
  otpExpiry: 300,
  otpAttempts: 5,
  otpGap: 60,
  otpPerPhoneHourly: 5,
  otpPerIpHourly: 300,
  ringTimeout: 60,
  maxGroupCallParticipants: 32,
  maxGroupSize: 256,
  uploadLimitMb: 100,
  editWindowMinutes: 15,
  maintenanceMode: false,
  latestAndroidVersion: APP.androidVersion,
  latestAndroidVersionCode: 28,
  downloadUrl: APP.downloadUrl,
  allowPeopleSearch: true,
  minSearchChars: 3,
  smsEnabled: false,
};

export const seedStats = {
  registeredUsers: seedUsers.length,
  activeToday: 6,
  messagesThisWeek: 140,
  callMinutesThisWeek: 104.9,
  onlineUsers: 3,
  openConnections: 3,
  activeCalls: seedLive.length,
  livekitRooms: 0,
  otpRequests24h: seedOtps.length,
  otpLockouts24h: 0,
  pushesSent24h: 21,
  pushesFailed24h: 1,
  openReports: seedReports.filter((r) => r.status === "Open").length,
};
