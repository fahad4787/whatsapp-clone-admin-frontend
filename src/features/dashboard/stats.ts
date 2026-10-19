import { mockStats } from "@/data";

export const dashboardStats = [
  { label: "Registered users", value: `${mockStats.registeredUsers}`, delta: "+555% vs last week" },
  { label: "Active today", value: `${mockStats.activeToday}` },
  { label: "Messages this week", value: `${mockStats.messagesThisWeek}`, delta: "-54% vs last week" },
  {
    label: "Call minutes this week",
    value: `${mockStats.callMinutesThisWeek} min`,
    delta: "-51% vs last week",
  },
];

export const liveMetrics = [
  { label: "Online users", value: mockStats.onlineUsers },
  { label: "Open connections", value: mockStats.openConnections },
  { label: "Active calls", value: mockStats.activeCalls },
  { label: "LiveKit rooms", value: mockStats.livekitRooms },
];

export const last24hRows = [
  { k: "OTP requests", v: mockStats.otpRequests24h },
  { k: "OTP lockouts", v: mockStats.otpLockouts24h },
  { k: "Pushes sent", v: mockStats.pushesSent24h },
  { k: "Pushes failed", v: mockStats.pushesFailed24h },
  { k: "Open reports", v: mockStats.openReports, accent: true },
];

export const chartData = [
  { day: "19 Sept", dau: 4, calls: 2, messages: 12, users: 1 },
  { day: "26 Sept", dau: 8, calls: 12, messages: 40, users: 3 },
  { day: "4 Oct", dau: 15, calls: 28, messages: 55, users: 5 },
  { day: "12 Oct", dau: 22, calls: 18, messages: 70, users: 8 },
  { day: "19 Oct", dau: 110, calls: 48, messages: 95, users: 150 },
];

export type ChartSpec =
  | { title: string; kind: "area"; dataKey: "dau" | "calls"; stroke: string; fill: string }
  | { title: string; kind: "bar"; dataKey: "messages" | "users"; fill: string };

export const chartSpecs: ChartSpec[] = [
  { title: "Daily active users", kind: "area", dataKey: "dau", stroke: "#1daa61", fill: "#e8f8ef" },
  { title: "Calls per day", kind: "area", dataKey: "calls", stroke: "#b0894a", fill: "#f5efe4" },
  { title: "Messages per day", kind: "bar", dataKey: "messages", fill: "#1daa61" },
  { title: "New users per day", kind: "bar", dataKey: "users", fill: "#b0894a" },
];
