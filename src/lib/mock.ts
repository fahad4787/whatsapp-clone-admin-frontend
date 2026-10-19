export const mockStats = {
  registeredUsers: 173,
  activeToday: 6,
  messagesThisWeek: 140,
  callMinutesThisWeek: 104.9,
  onlineUsers: 3,
  openConnections: 3,
  activeCalls: 1,
  livekitRooms: 1,
  otpRequests24h: 7,
  otpLockouts24h: 0,
  pushesSent24h: 21,
  pushesFailed24h: 1,
  openReports: 4,
};

export const mockUsers = [
  { id: "1", name: "B Test", phone: "+92 300 2882200", status: "Active", lastSeen: "1 minute ago", joined: "56 minutes ago" },
  { id: "2", name: "B Home", phone: "+92 321 2222724", status: "Active", lastSeen: "12 hours ago", joined: "12 hours ago" },
  { id: "3", name: "Zara", phone: "+92 304 4197479", status: "Active", lastSeen: "3 days ago", joined: "3 days ago" },
  { id: "4", name: "Hamza", phone: "+92 307 7253342", status: "Active", lastSeen: "3 days ago", joined: "3 days ago" },
  { id: "5", name: "Sana", phone: "+92 303 3167713", status: "Active", lastSeen: "3 days ago", joined: "3 days ago" },
];

export const mockOtps = [
  { time: "00:09:51", phone: "+92 323 4226146", status: "Used", attempts: 0, expires: "00:14" },
  { time: "00:08:12", phone: "+92 300 2882200", status: "Pending", attempts: 0, expires: "00:13" },
  { time: "23:55:01", phone: "+92 321 2222724", status: "Expired", attempts: 0, expires: "00:00" },
];

export const mockConversations = [
  { title: "Direct chat", type: "Direct", members: 2, messages: 179, created: "3 days ago", last: "just now" },
  { title: "Direct chat", type: "Direct", members: 2, messages: 42, created: "3 days ago", last: "6 m ago" },
  { title: "Direct chat", type: "Direct", members: 2, messages: 12, created: "3 minutes ago", last: "New" },
];

export const mockCalls = [
  { started: "20 Oct 2026, 00:44", kind: "Direct", media: "audio", participants: "B Test · B Chaudhry", outcome: "Completed" },
  { started: "19 Oct 2026, 21:10", kind: "Direct", media: "video", participants: "Mustafa · haadi", outcome: "Missed" },
  { started: "19 Oct 2026, 18:02", kind: "Direct", media: "audio", participants: "Zara · Hamza", outcome: "Cancelled" },
];

export const mockReports = [
  { reported: "17 Oct 2026, 03:03", reporter: "Nadia", target: "Kamran", reason: "spam", status: "Open", action: "block" },
  { reported: "16 Oct 2026, 14:22", reporter: "Ali", target: "Channel: Punjab News", reason: "Misleading advice", status: "Open", action: "channel" },
];

export const mockCountries = [
  { name: "Australia", dial: "+61", iso: "AU", enabled: true },
  { name: "Oman", dial: "+968", iso: "OM", enabled: true },
  { name: "Pakistan", dial: "+92", iso: "PK", enabled: true },
  { name: "United Arab Emirates", dial: "+971", iso: "AE", enabled: true },
  { name: "United Kingdom", dial: "+44", iso: "GB", enabled: true },
  { name: "United States", dial: "+1", iso: "US", enabled: true },
];

export const mockChannels = [
  { name: "Punjab News", slug: "punjab-news", followers: 1280, posts: 42 },
  { name: "Bolta Updates", slug: "bolta-updates", followers: 540, posts: 18 },
];

export const mockAdmins = [
  { name: "Fixel", email: "admin@example.com", role: "Superadmin", lastLogin: "just now" },
];

export const mockAudit = [
  { time: "00:45:12", actor: "Fixel", action: "Viewed OTP code", detail: "+92 •••• 6146" },
  { time: "00:40:01", actor: "Fixel", action: "Signed in", detail: "Admin panel" },
];

export const mockSettings = {
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
  latestAndroidVersion: "1.12.13",
  latestAndroidVersionCode: 28,
  downloadUrl: "https://wa.zirvik.com/download",
  allowPeopleSearch: true,
  minSearchChars: 3,
  smsEnabled: false,
};
