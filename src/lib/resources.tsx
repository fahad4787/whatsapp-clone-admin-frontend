import { Eye, Phone, Radio, Sticker, Video } from "lucide-react";
import type { ResourcePageProps } from "@/components/data/ResourcePage";
import { Button, PersonCell, StatusBadge } from "@/components/ui/primitives";
import {
  mockAdmins,
  mockAudit,
  mockCalls,
  mockChannels,
  mockConversations,
  mockCountries,
  mockOtps,
  mockReports,
  mockUsers,
} from "@/lib/mock";

type Tone = "green" | "yellow" | "gray" | "red" | "brown";

const STATUS_TONE: Record<string, Tone> = {
  Active: "green",
  Used: "green",
  Completed: "green",
  Open: "green",
  Direct: "green",
  Pending: "yellow",
  Missed: "brown",
  Expired: "gray",
  Cancelled: "gray",
};

function tone(status: string): Tone {
  return STATUS_TONE[status] ?? "gray";
}

export const usersResource: ResourcePageProps<(typeof mockUsers)[number]> = {
  title: "Users",
  count: "173 users",
  selectable: true,
  actions: [
    { label: "Export CSV", variant: "secondary", icon: "download" },
    { label: "Create user", variant: "primary", icon: "plus" },
  ],
  filters: [
    { type: "search", placeholder: "Phone or name" },
    { type: "select", options: ["Any status", "Active", "Blocked", "Inactive", "Deleted"] },
    { type: "chip", label: "New this week" },
  ],
  rows: mockUsers,
  rowKey: (u) => u.id,
  columns: [
    { id: "user", header: "User", cell: (u) => <PersonCell name={u.name} subtitle={u.phone} /> },
    { id: "status", header: "Status", cell: (u) => <StatusBadge label={u.status} tone={tone(u.status)} /> },
    { id: "lastSeen", header: "Last seen", cell: (u) => u.lastSeen },
    { id: "joined", header: "Joined", cell: (u) => u.joined },
  ],
};

export const otpsResource: ResourcePageProps<(typeof mockOtps)[number]> = {
  title: "OTP log",
  count: "889 codes",
  banner: {
    tone: "warn",
    text: "Revealing a code is recorded in the audit log with your account. Codes re-mask after 30 seconds.",
  },
  actions: [{ label: "Generate code", variant: "primary", icon: "plus" }],
  filters: [
    { type: "search", placeholder: "Phone" },
    { type: "select", options: ["Any status", "Pending", "Used", "Expired", "Failed"] },
  ],
  rows: mockOtps,
  rowKey: (o) => `${o.time}-${o.phone}`,
  columns: [
    { id: "time", header: "Requested", cell: (o) => o.time },
    { id: "phone", header: "Phone", cell: (o) => <span className="text-bp-green">{o.phone}</span> },
    { id: "code", header: "Code", cell: () => <span className="bp-mono">••••••</span> },
    {
      id: "reveal",
      header: "",
      cell: () => (
        <button type="button" className="inline-flex items-center gap-1 text-sm text-bp-muted hover:text-bp-ink">
          <Eye size={14} /> Reveal
        </button>
      ),
    },
    { id: "status", header: "Status", cell: (o) => <StatusBadge label={o.status} tone={tone(o.status)} /> },
    { id: "attempts", header: "Attempts", cell: (o) => o.attempts },
    { id: "expires", header: "Expires", cell: (o) => o.expires },
  ],
};

export const conversationsResource: ResourcePageProps<(typeof mockConversations)[number]> = {
  title: "Conversations",
  count: "90 chats",
  filters: [
    { type: "search", placeholder: "Group name, member phone or name" },
    { type: "select", options: ["Groups and direct", "Groups", "Direct"] },
  ],
  rows: mockConversations,
  rowKey: (c) => `${c.title}-${c.messages}-${c.created}`,
  columns: [
    { id: "conversation", header: "Conversation", cell: (c) => <PersonCell name={c.title} tone="lavender" /> },
    { id: "type", header: "Type", cell: (c) => <StatusBadge label={c.type} tone={tone(c.type)} /> },
    { id: "members", header: "Members", cell: (c) => c.members },
    { id: "messages", header: "Messages", cell: (c) => c.messages },
    { id: "created", header: "Created", cell: (c) => c.created },
    { id: "last", header: "Last activity", cell: (c) => c.last },
  ],
};

export const callsResource: ResourcePageProps<(typeof mockCalls)[number]> = {
  title: "Call history",
  count: "247 calls",
  actions: [{ label: "Export CSV", variant: "secondary", icon: "download" }],
  filters: [
    { type: "search", placeholder: "Participant name or phone" },
    { type: "select", options: ["Any kind", "Direct", "Group"] },
    { type: "select", options: ["Audio or video", "Audio", "Video"] },
    { type: "select", options: ["Any outcome", "Completed", "Missed", "Cancelled"] },
  ],
  rows: mockCalls,
  rowKey: (c) => `${c.started}-${c.participants}`,
  columns: [
    { id: "started", header: "Started", cell: (c) => c.started },
    {
      id: "type",
      header: "Type",
      cell: (c) => (
        <span className="inline-flex items-center gap-1.5">
          {c.media === "video" ? <Video size={14} /> : <Phone size={14} />}
          {c.kind}
        </span>
      ),
    },
    {
      id: "participants",
      header: "Participants",
      cell: (c) => <span className="text-bp-green">{c.participants}</span>,
    },
    {
      id: "outcome",
      header: "Outcome",
      cell: (c) => <StatusBadge label={c.outcome} tone={tone(c.outcome)} />,
    },
  ],
};

export const reportsResource: ResourcePageProps<(typeof mockReports)[number]> = {
  title: "Reports",
  count: "4 open",
  filters: [
    { type: "search", placeholder: "Reason, reporter or target" },
    { type: "select", options: ["Open", "Resolved", "Any status"] },
  ],
  rows: mockReports,
  rowKey: (r) => `${r.reported}-${r.target}`,
  columns: [
    { id: "reported", header: "Reported", cell: (r) => r.reported },
    { id: "reporter", header: "Reporter", cell: (r) => <span className="text-bp-green">{r.reporter}</span> },
    { id: "target", header: "Target", cell: (r) => <span className="text-bp-green">{r.target}</span> },
    { id: "reason", header: "Reason", cell: (r) => <span className="font-semibold">{r.reason}</span> },
    { id: "status", header: "Status", cell: (r) => <StatusBadge label={r.status} tone={tone(r.status)} /> },
    {
      id: "actions",
      header: "",
      cell: (r) =>
        r.action === "block" ? (
          <Button variant="danger">Block user</Button>
        ) : (
          <Button variant="secondary">Open channel</Button>
        ),
    },
  ],
};

export const countriesResource: ResourcePageProps<(typeof mockCountries)[number]> = {
  title: "Countries",
  banner: {
    text: "Only the countries switched on here can sign up: a number from anywhere else is refused outright, not merely missing from the picker.",
  },
  rows: mockCountries,
  rowKey: (c) => c.iso,
  columns: [
    { id: "name", header: "Country", cell: (c) => <span className="font-semibold">{c.name}</span> },
    { id: "dial", header: "Dial code", cell: (c) => c.dial },
    { id: "iso", header: "ISO", cell: (c) => c.iso },
    {
      id: "enabled",
      header: "",
      cell: (c) => (
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked={c.enabled} className="accent-bp-green" />
          Sign-up for {c.name}
        </label>
      ),
    },
  ],
};

export const channelsResource: ResourcePageProps<(typeof mockChannels)[number]> = {
  title: "Channels",
  count: `${mockChannels.length} channels`,
  actions: [{ label: "New channel", variant: "primary", icon: "plus" }],
  rows: mockChannels,
  rowKey: (c) => c.slug,
  columns: [
    { id: "name", header: "Channel", cell: (c) => <span className="font-semibold">{c.name}</span> },
    { id: "slug", header: "Slug", cell: (c) => <span className="bp-mono text-bp-muted">{c.slug}</span> },
    { id: "followers", header: "Followers", cell: (c) => c.followers },
    { id: "posts", header: "Posts", cell: (c) => c.posts },
  ],
};

export const adminsResource: ResourcePageProps<(typeof mockAdmins)[number]> = {
  title: "Admin users",
  actions: [{ label: "Invite admin", variant: "primary", icon: "plus" }],
  rows: mockAdmins,
  rowKey: (a) => a.email,
  columns: [
    { id: "admin", header: "Admin", cell: (a) => <PersonCell name={a.name} subtitle={a.email} /> },
    { id: "role", header: "Role", cell: (a) => a.role },
    { id: "lastLogin", header: "Last login", cell: (a) => a.lastLogin },
  ],
};

export const auditResource: ResourcePageProps<(typeof mockAudit)[number]> = {
  title: "Audit log",
  rows: mockAudit,
  rowKey: (a) => `${a.time}-${a.action}`,
  columns: [
    { id: "time", header: "Time", cell: (a) => a.time },
    { id: "actor", header: "Actor", cell: (a) => <span className="font-semibold">{a.actor}</span> },
    { id: "action", header: "Action", cell: (a) => a.action },
    { id: "detail", header: "Detail", cell: (a) => <span className="text-bp-muted">{a.detail}</span> },
  ],
};

export const liveResource: ResourcePageProps<never> = {
  title: "Live calls",
  count: "0 in progress",
  empty: { icon: <Radio size={40} strokeWidth={1.5} />, title: "No calls in progress." },
};

export const stickersResource: ResourcePageProps<never> = {
  title: "Stickers",
  actions: [{ label: "Upload pack", variant: "primary", icon: "plus" }],
  empty: { icon: <Sticker size={40} strokeWidth={1.5} />, title: "No sticker packs yet." },
};
