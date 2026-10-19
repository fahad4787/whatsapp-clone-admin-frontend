"use client";

import { Eye, Phone, Radio, Sticker, Video } from "lucide-react";
import type { Column } from "@/components/data";
import { PersonCell, StatusBadge } from "@/components/ui";
import { uid } from "@/data/store";
import type { CollectionKey } from "@/types/models";
import { statusTone } from "@/types/status";

export type FormFieldSpec = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox";
  options?: string[];
  required?: boolean;
  /** half = share a row; full = entire row. Defaults: select/number = half, text/checkbox = full */
  span?: "half" | "full";
};

export type ResourceSpec<T extends { id: string }> = {
  key: CollectionKey;
  title: string;
  singular: string;
  description?: string;
  banner?: { tone?: "green" | "warn"; text: string };
  searchPlaceholder?: string;
  searchKeys: (keyof T & string)[];
  statusField?: keyof T & string;
  statusOptions?: string[];
  /** First option is "any" sentinel */
  typeField?: keyof T & string;
  typeOptions?: string[];
  chip?: { label: string; match: (row: T) => boolean };
  columns: Column<T>[];
  formFields: FormFieldSpec[];
  defaults: () => T;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  empty?: { icon: React.ReactNode; title: string; description?: string };
  createLabel?: string;
};

export const usersSpec: ResourceSpec<import("@/types/models").UserRow> = {
  key: "users",
  title: "Users",
  singular: "user",
  description: "Everyone who has signed up with an allowed country code.",
  searchPlaceholder: "Phone or name",
  searchKeys: ["name", "phone"],
  statusField: "status",
  statusOptions: ["Any status", "Active", "Blocked", "Inactive", "Deleted"],
  chip: { label: "New this week", match: (u) => u.joined.includes("minute") || u.joined.includes("hour") },
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canExport: true,
  createLabel: "Create user",
  defaults: () => ({
    id: uid("u"),
    name: "",
    phone: "+92 ",
    status: "Active",
    lastSeen: "just now",
    joined: "just now",
  }),
  formFields: [
    { key: "name", label: "Name", type: "text", required: true, span: "half" },
    { key: "phone", label: "Phone", type: "text", required: true, span: "half" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["Active", "Blocked", "Inactive", "Deleted"],
      required: true,
      span: "full",
    },
  ],
  columns: [
    { id: "user", header: "User", cell: (u) => <PersonCell name={u.name} subtitle={u.phone} /> },
    { id: "status", header: "Status", cell: (u) => <StatusBadge label={u.status} tone={statusTone(u.status)} /> },
    { id: "lastSeen", header: "Last seen", cell: (u) => u.lastSeen },
    { id: "joined", header: "Joined", cell: (u) => u.joined },
  ],
};

export const otpsSpec: ResourceSpec<import("@/types/models").OtpRow> = {
  key: "otps",
  title: "OTP log",
  singular: "code",
  description: "Every sign-in code requested in the last retention window.",
  banner: {
    tone: "warn",
    text: "Revealing a code is recorded in the audit log. Codes re-mask after you leave this page.",
  },
  searchPlaceholder: "Phone",
  searchKeys: ["phone"],
  statusField: "status",
  statusOptions: ["Any status", "Pending", "Used", "Expired", "Failed"],
  canCreate: true,
  canEdit: true,
  canDelete: true,
  createLabel: "Generate code",
  defaults: () => ({
    id: uid("o"),
    time: new Date().toTimeString().slice(0, 8),
    phone: "+92 ",
    code: String(Math.floor(100000 + Math.random() * 900000)),
    status: "Pending",
    attempts: 0,
    expires: "05:00",
  }),
  formFields: [
    { key: "phone", label: "Phone", type: "text", required: true, span: "full" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["Pending", "Used", "Expired", "Failed"],
      span: "full",
    },
  ],
  columns: [
    { id: "time", header: "Requested", cell: (o) => o.time },
    { id: "phone", header: "Phone", cell: (o) => <span className="text-bp-green">{o.phone}</span> },
    { id: "code", header: "Code", cell: () => <span className="bp-mono">••••••</span> },
    {
      id: "reveal",
      header: "",
      cell: (o) => (
        <span className="inline-flex items-center gap-1 text-sm text-bp-muted">
          <Eye size={14} /> {o.code}
        </span>
      ),
    },
    { id: "status", header: "Status", cell: (o) => <StatusBadge label={o.status} tone={statusTone(o.status)} /> },
    { id: "attempts", header: "Attempts", cell: (o) => o.attempts },
    { id: "expires", header: "Expires", cell: (o) => o.expires },
  ],
};

export const conversationsSpec: ResourceSpec<import("@/types/models").ConversationRow> = {
  key: "conversations",
  title: "Conversations",
  singular: "conversation",
  description: "Direct chats and groups across the network.",
  searchPlaceholder: "Group name",
  searchKeys: ["title"],
  typeField: "type",
  typeOptions: ["Groups and direct", "Groups", "Direct"],
  canCreate: true,
  canEdit: true,
  canDelete: true,
  createLabel: "New conversation",
  defaults: () => ({
    id: uid("c"),
    title: "",
    type: "Direct",
    members: 2,
    messages: 0,
    created: "just now",
    last: "New",
  }),
  formFields: [
    { key: "title", label: "Title", type: "text", required: true, span: "full" },
    { key: "type", label: "Type", type: "select", options: ["Direct", "Group"], span: "half" },
    { key: "members", label: "Members", type: "number", span: "half" },
  ],
  columns: [
    { id: "conversation", header: "Conversation", cell: (c) => <PersonCell name={c.title} tone="lavender" /> },
    { id: "type", header: "Type", cell: (c) => <StatusBadge label={c.type} tone={statusTone(c.type)} /> },
    { id: "members", header: "Members", cell: (c) => c.members },
    { id: "messages", header: "Messages", cell: (c) => c.messages },
    { id: "created", header: "Created", cell: (c) => c.created },
    { id: "last", header: "Last activity", cell: (c) => c.last },
  ],
};

export const callsSpec: ResourceSpec<import("@/types/models").CallRow> = {
  key: "calls",
  title: "Call history",
  singular: "call",
  description: "Completed, missed, and cancelled voice or video calls.",
  searchPlaceholder: "Participant name",
  searchKeys: ["participants"],
  typeField: "kind",
  typeOptions: ["Any kind", "Direct", "Group"],
  statusField: "outcome",
  statusOptions: ["Any outcome", "Completed", "Missed", "Cancelled"],
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canExport: true,
  createLabel: "Log call",
  defaults: () => ({
    id: uid("k"),
    started: new Date().toLocaleString(),
    kind: "Direct",
    media: "audio",
    participants: "",
    outcome: "Completed",
  }),
  formFields: [
    { key: "participants", label: "Participants", type: "text", required: true, span: "full" },
    { key: "kind", label: "Kind", type: "select", options: ["Direct", "Group"], span: "half" },
    { key: "media", label: "Media", type: "select", options: ["audio", "video"], span: "half" },
    { key: "outcome", label: "Outcome", type: "select", options: ["Completed", "Missed", "Cancelled"], span: "full" },
  ],
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
    { id: "participants", header: "Participants", cell: (c) => <span className="text-bp-green">{c.participants}</span> },
    { id: "outcome", header: "Outcome", cell: (c) => <StatusBadge label={c.outcome} tone={statusTone(c.outcome)} /> },
  ],
};

export const reportsSpec: ResourceSpec<import("@/types/models").ReportRow> = {
  key: "reports",
  title: "Reports",
  singular: "report",
  description: "User and channel reports awaiting review.",
  searchPlaceholder: "Reason, reporter or target",
  searchKeys: ["reason", "reporter", "target"],
  statusField: "status",
  statusOptions: ["Any status", "Open", "Resolved"],
  canCreate: true,
  canEdit: true,
  canDelete: true,
  createLabel: "Add report",
  defaults: () => ({
    id: uid("r"),
    reported: new Date().toLocaleString(),
    reporter: "",
    target: "",
    reason: "",
    status: "Open",
    action: "block",
  }),
  formFields: [
    { key: "reporter", label: "Reporter", type: "text", required: true, span: "half" },
    { key: "target", label: "Target", type: "text", required: true, span: "half" },
    { key: "reason", label: "Reason", type: "text", required: true, span: "full" },
    { key: "status", label: "Status", type: "select", options: ["Open", "Resolved"], span: "half" },
    { key: "action", label: "Action type", type: "select", options: ["block", "channel"], span: "half" },
  ],
  columns: [
    { id: "reported", header: "Reported", cell: (r) => r.reported },
    { id: "reporter", header: "Reporter", cell: (r) => <span className="text-bp-green">{r.reporter}</span> },
    { id: "target", header: "Target", cell: (r) => <span className="text-bp-green">{r.target}</span> },
    { id: "reason", header: "Reason", cell: (r) => <span className="font-semibold">{r.reason}</span> },
    { id: "status", header: "Status", cell: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ],
};

export const countriesSpec: ResourceSpec<import("@/types/models").CountryRow> = {
  key: "countries",
  title: "Countries",
  singular: "country",
  description: "Only enabled countries can sign up.",
  banner: {
    text: "Only the countries switched on here can sign up: a number from anywhere else is refused outright.",
  },
  searchPlaceholder: "Country or dial code",
  searchKeys: ["name", "dial", "iso"],
  canCreate: true,
  canEdit: true,
  canDelete: true,
  createLabel: "Add country",
  defaults: () => ({
    id: uid("co"),
    name: "",
    dial: "+",
    iso: "",
    enabled: true,
  }),
  formFields: [
    { key: "name", label: "Name", type: "text", required: true, span: "full" },
    { key: "dial", label: "Dial code", type: "text", required: true, span: "half" },
    { key: "iso", label: "ISO", type: "text", required: true, span: "half" },
    { key: "enabled", label: "Sign-up enabled", type: "checkbox", span: "full" },
  ],
  columns: [
    { id: "name", header: "Country", cell: (c) => <span className="font-semibold">{c.name}</span> },
    { id: "dial", header: "Dial code", cell: (c) => c.dial },
    { id: "iso", header: "ISO", cell: (c) => c.iso },
    {
      id: "enabled",
      header: "Sign-up",
      cell: (c) => <StatusBadge label={c.enabled ? "On" : "Off"} tone={c.enabled ? "green" : "gray"} />,
    },
  ],
};

export const channelsSpec: ResourceSpec<import("@/types/models").ChannelRow> = {
  key: "channels",
  title: "Channels",
  singular: "channel",
  searchPlaceholder: "Name or slug",
  searchKeys: ["name", "slug"],
  canCreate: true,
  canEdit: true,
  canDelete: true,
  createLabel: "New channel",
  defaults: () => ({
    id: uid("ch"),
    name: "",
    slug: "",
    followers: 0,
    posts: 0,
  }),
  formFields: [
    { key: "name", label: "Name", type: "text", required: true, span: "half" },
    { key: "slug", label: "Slug", type: "text", required: true, span: "half" },
    { key: "followers", label: "Followers", type: "number", span: "half" },
    { key: "posts", label: "Posts", type: "number", span: "half" },
  ],
  columns: [
    { id: "name", header: "Channel", cell: (c) => <span className="font-semibold">{c.name}</span> },
    { id: "slug", header: "Slug", cell: (c) => <span className="bp-mono text-bp-muted">{c.slug}</span> },
    { id: "followers", header: "Followers", cell: (c) => c.followers },
    { id: "posts", header: "Posts", cell: (c) => c.posts },
  ],
};

export const adminsSpec: ResourceSpec<import("@/types/models").AdminRow> = {
  key: "admins",
  title: "Admin users",
  singular: "admin",
  searchPlaceholder: "Name or email",
  searchKeys: ["name", "email"],
  canCreate: true,
  canEdit: true,
  canDelete: true,
  createLabel: "Invite admin",
  defaults: () => ({
    id: uid("a"),
    name: "",
    email: "",
    role: "Admin",
    lastLogin: "never",
  }),
  formFields: [
    { key: "name", label: "Name", type: "text", required: true, span: "half" },
    { key: "email", label: "Email", type: "text", required: true, span: "half" },
    { key: "role", label: "Role", type: "select", options: ["Admin", "Superadmin", "Support"], span: "full" },
  ],
  columns: [
    { id: "admin", header: "Admin", cell: (a) => <PersonCell name={a.name} subtitle={a.email} /> },
    { id: "role", header: "Role", cell: (a) => a.role },
    { id: "lastLogin", header: "Last login", cell: (a) => a.lastLogin },
  ],
};

export const auditSpec: ResourceSpec<import("@/types/models").AuditRow> = {
  key: "audit",
  title: "Audit log",
  singular: "event",
  searchPlaceholder: "Actor or action",
  searchKeys: ["actor", "action", "detail"],
  canCreate: false,
  canEdit: false,
  canDelete: true,
  defaults: () => ({
    id: uid("au"),
    time: new Date().toTimeString().slice(0, 8),
    actor: "Fixel",
    action: "",
    detail: "",
  }),
  formFields: [],
  columns: [
    { id: "time", header: "Time", cell: (a) => a.time },
    { id: "actor", header: "Actor", cell: (a) => <span className="font-semibold">{a.actor}</span> },
    { id: "action", header: "Action", cell: (a) => a.action },
    { id: "detail", header: "Detail", cell: (a) => <span className="text-bp-muted">{a.detail}</span> },
  ],
};

export const stickersSpec: ResourceSpec<import("@/types/models").StickerRow> = {
  key: "stickers",
  title: "Stickers",
  singular: "pack",
  description: "Packs available to users inside the Android app.",
  searchPlaceholder: "Pack name",
  searchKeys: ["name"],
  canCreate: true,
  canEdit: true,
  canDelete: true,
  createLabel: "Upload pack",
  empty: {
    icon: <Sticker size={28} strokeWidth={1.75} />,
    title: "No sticker packs yet",
    description: "Upload a pack to make stickers available in chats.",
  },
  defaults: () => ({
    id: uid("st"),
    name: "",
    stickers: 0,
    created: "just now",
  }),
  formFields: [
    { key: "name", label: "Pack name", type: "text", required: true, span: "full" },
    { key: "stickers", label: "Sticker count", type: "number", span: "half" },
  ],
  columns: [
    { id: "name", header: "Pack", cell: (s) => <span className="font-semibold">{s.name}</span> },
    { id: "stickers", header: "Stickers", cell: (s) => s.stickers },
    { id: "created", header: "Created", cell: (s) => s.created },
  ],
};

export const liveSpec: ResourceSpec<import("@/types/models").LiveCallRow> = {
  key: "live",
  title: "Live calls",
  singular: "live call",
  description: "Rooms that are ringing or connected right now.",
  searchPlaceholder: "Room or participant",
  searchKeys: ["room", "participants"],
  canCreate: true,
  canEdit: true,
  canDelete: true,
  createLabel: "Simulate call",
  empty: {
    icon: <Radio size={28} strokeWidth={1.75} />,
    title: "No calls in progress",
    description: "When someone places a call, it will show up here in real time.",
  },
  defaults: () => ({
    id: uid("lv"),
    room: `room_${Math.floor(Math.random() * 999)}`,
    participants: "",
    started: "just now",
    kind: "audio",
  }),
  formFields: [
    { key: "room", label: "Room", type: "text", required: true, span: "half" },
    { key: "kind", label: "Kind", type: "select", options: ["audio", "video"], span: "half" },
    { key: "participants", label: "Participants", type: "text", required: true, span: "full" },
  ],
  columns: [
    { id: "room", header: "Room", cell: (l) => <span className="bp-mono">{l.room}</span> },
    { id: "participants", header: "Participants", cell: (l) => l.participants },
    { id: "kind", header: "Kind", cell: (l) => l.kind },
    { id: "started", header: "Started", cell: (l) => l.started },
  ],
};
