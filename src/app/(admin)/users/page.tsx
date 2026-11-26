"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Ban, Download, MessagesSquare, Plus, RotateCcw, Trash2, Users } from "lucide-react";
import {
  Badge,
  Button,
  ButtonLink,
  ErrorCallout,
  Card,
  CardToolbar,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Person,
  SearchInput,
  Segmented,
  Textarea,
  useConfirm,
  type Column,
} from "@/components/ui";
import { PHONE_RE } from "@/config/constants";
import { useAction } from "@/hooks/useAction";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type UserItem } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { fmtDate, fmtDateTime, fmtNumber, timeAgo } from "@/lib/format";

type Filter = "all" | "banned";

function StatusBadge({ u }: { u: UserItem }) {
  return u.banned ? <Badge tone="danger">Banned</Badge> : <Badge tone="success">Active</Badge>;
}

function CreateUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (u: UserItem) => void }) {
  const { run, isPending } = useAction();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const phoneError = !PHONE_RE.test(phone.trim()) ? "Use international format with country code, e.g. +923001234567." : null;
  const nameError = name.trim().length > 80 ? "Keep the name under 80 characters." : null;

  const close = () => {
    setPhone("");
    setName("");
    setTouched(false);
    onClose();
  };

  const submit = async () => {
    setTouched(true);
    if (phoneError || nameError) return;
    const user = await run("create", () => adminApi.users.create(phone.trim(), name.trim()), {
      success: "User created",
      errorTitle: "Couldn't create user",
    });
    if (user) {
      onCreated(user);
      close();
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create user"
      description="Adds an account without an OTP. The person signs in on the app with this number."
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" loading={isPending("create")}>Create user</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Phone number" required error={touched ? phoneError : null} hint="International format with country code.">
          {(a) => <Input {...a} inputMode="tel" autoComplete="off" placeholder="+923001234567" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[\s()-]/g, ""))} invalid={touched && !!phoneError} />}
        </Field>
        <Field label="Display name" error={nameError} hint="Optional. They can change it in the app.">
          {(a) => <Input {...a} maxLength={80} placeholder="Ayesha Khan" value={name} onChange={(e) => setName(e.target.value)} invalid={!!nameError} />}
        </Field>
      </div>
    </Modal>
  );
}

function BanModal({ user, onClose, onDone }: { user: UserItem | null; onClose: () => void; onDone: (u: UserItem) => void }) {
  const { run, isPending } = useAction();
  const [reason, setReason] = useState("");
  const close = () => {
    setReason("");
    onClose();
  };
  const submit = async () => {
    if (!user || reason.length > 500) return;
    const updated = await run("ban", () => adminApi.users.ban(user.id, reason.trim()), { success: "User banned", errorTitle: "Couldn't ban user" });
    if (updated) {
      onDone(updated);
      close();
    }
  };
  return (
    <Modal
      open={!!user}
      onClose={close}
      size="sm"
      title={`Ban ${user?.display_name || user?.phone || "user"}?`}
      description="They are signed out on every device and can't sign in until unbanned."
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" variant="danger" loading={isPending("ban")} icon={<Ban size={16} />}>Ban user</Button>
        </>
      }
    >
      <Field label="Reason" hint={`${reason.length}/500 · Optional, kept in the audit log.`} error={reason.length > 500 ? "Keep the reason under 500 characters." : null}>
        {(a) => <Textarea {...a} rows={3} placeholder="Spam, abuse, impersonation…" value={reason} onChange={(e) => setReason(e.target.value)} />}
      </Field>
    </Modal>
  );
}

function UserDrawer({
  user,
  onClose,
  onChanged,
  onRemoved,
  onBan,
}: {
  user: UserItem | null;
  onClose: () => void;
  onChanged: (u: UserItem) => void;
  onRemoved: (id: string) => void;
  onBan: (u: UserItem) => void;
}) {
  const { run, isPending } = useAction();
  const confirm = useConfirm();
  if (!user) return null;
  const label = user.display_name || user.phone;

  const unban = async () => {
    const u = await run("unban", () => adminApi.users.unban(user.id), { success: "User unbanned", errorTitle: "Couldn't unban user" });
    if (u) onChanged(u);
  };
  const remove = async () => {
    const ok = await confirm({
      title: `Delete ${label}?`,
      description: "Their account, devices and messages they sent are removed for good. This can't be undone.",
      confirmLabel: "Delete user",
    });
    if (!ok) return;
    const done = await run("delete", () => adminApi.users.remove(user.id), { success: "User deleted", errorTitle: "Couldn't delete user" });
    if (done !== undefined) onRemoved(user.id);
  };

  const rows: [string, React.ReactNode][] = [
    ["Phone", <span key="p" className="font-mono">{user.phone}</span>],
    ["About", user.about || "—"],
    ["Status", <StatusBadge key="s" u={user} />],
    ...(user.banned ? ([["Banned", fmtDateTime(user.banned_at)]] as [string, React.ReactNode][]) : []),
    ["Last seen", user.last_seen_at ? `${timeAgo(user.last_seen_at)} · ${fmtDateTime(user.last_seen_at)}` : "Never"],
    ["Joined", fmtDateTime(user.created_at)],
    ["Devices", fmtNumber(user.device_count)],
    ["Conversations", fmtNumber(user.conversation_count)],
  ];

  return (
    <Drawer
      open
      onClose={onClose}
      title={label}
      description={user.display_name ? user.phone : undefined}
      footer={
        <>
          <Button variant="danger-soft" icon={<Trash2 size={16} />} loading={isPending("delete")} onClick={remove} className="mr-auto">
            Delete
          </Button>
          {user.banned ? (
            <Button variant="secondary" icon={<RotateCcw size={16} />} loading={isPending("unban")} onClick={unban}>Unban</Button>
          ) : (
            <Button variant="danger" icon={<Ban size={16} />} onClick={() => onBan(user)}>Ban</Button>
          )}
        </>
      }
    >
      <Person name={user.display_name} sub={user.phone} seed={user.id} size={56} />
      <dl className="mt-6 divide-y divide-line rounded-xl border border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 px-4 py-3 text-[13px]">
            <dt className="shrink-0 font-medium text-muted">{k}</dt>
            <dd className="min-w-0 text-right text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {user.conversation_count > 0 ? (
        <ButtonLink href={`/conversations?q=${encodeURIComponent(user.phone)}`} className="mt-4 w-full" icon={<MessagesSquare size={16} />}>
          View their conversations
        </ButtonLink>
      ) : null}
    </Drawer>
  );
}

function UsersView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filter: Filter = params.get("banned") === "1" ? "banned" : "all";
  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  // Follow ?q= when it changes underneath us (e.g. a search from the command palette).
  const [seenUrlQ, setSeenUrlQ] = useState(urlQ);
  if (urlQ !== seenUrlQ) {
    setSeenUrlQ(urlQ);
    setQ(urlQ);
  }
  const query = useDebouncedValue(q.trim(), 300);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<UserItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const list = useQuery(`users:${filter}:${query}`, (s) => adminApi.users.list({ q: query, banned: filter === "banned" }, s));
  const items = useMemo(() => list.data?.items ?? [], [list.data]);
  const selected = items.find((u) => u.id === selectedId) ?? null;

  const setFilter = (f: Filter) => router.replace(f === "banned" ? `${pathname}?banned=1` : pathname, { scroll: false });
  const upsert = (u: UserItem) =>
    list.setData((d) => {
      if (!d) return d;
      const exists = d.items.some((x) => x.id === u.id);
      // Merge so counts the write endpoints don't return (devices, chats) stay on screen.
      return { ...d, items: exists ? d.items.map((x) => (x.id === u.id ? { ...x, ...u } : x)) : [u, ...d.items] };
    });
  const removeLocal = (id: string) => {
    list.setData((d) => (d ? { ...d, items: d.items.filter((x) => x.id !== id) } : d));
    setSelectedId(null);
  };

  const columns: Column<UserItem>[] = [
    { key: "user", header: "User", sortValue: (u) => u.display_name, cell: (u) => <Person name={u.display_name} sub={u.phone} seed={u.id} /> },
    { key: "status", header: "Status", cell: (u) => <StatusBadge u={u} /> },
    { key: "devices", header: "Devices", sortValue: (u) => u.device_count, align: "right", hideBelow: "md", className: "tabular-nums", cell: (u) => fmtNumber(u.device_count) },
    { key: "chats", header: "Chats", sortValue: (u) => u.conversation_count, align: "right", hideBelow: "md", className: "tabular-nums", cell: (u) => fmtNumber(u.conversation_count) },
    { key: "seen", header: "Last seen", sortValue: (u) => (u.last_seen_at ? Date.parse(u.last_seen_at) : null), hideBelow: "lg", className: "whitespace-nowrap text-muted", cell: (u) => (u.last_seen_at ? timeAgo(u.last_seen_at) : "Never") },
    { key: "joined", header: "Joined", sortValue: (u) => Date.parse(u.created_at), hideBelow: "sm", className: "whitespace-nowrap text-muted", cell: (u) => fmtDate(u.created_at) },
  ];

  const exportCsv = () =>
    downloadCsv(`aivora-users-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["id", "phone", "display_name", "banned", "devices", "conversations", "last_seen_at", "created_at"],
      ...items.map((u) => [u.id, u.phone, u.display_name ?? "", u.banned ? "yes" : "no", u.device_count, u.conversation_count, u.last_seen_at ?? "", u.created_at]),
    ]);

  return (
    <>
      <PageHeader
        title="Users"
        count={list.data ? items.length : undefined}
        description="Search by phone or name. Open a user to ban, unban or delete them."
        actions={
          <>
            <Button variant="secondary" icon={<Download size={16} />} onClick={exportCsv} disabled={!items.length}>Export CSV</Button>
            <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Create user</Button>
          </>
        }
      />

      {list.error ? <ErrorCallout error={list.error} onRetry={list.reload} retrying={list.fetching} className="mb-4" /> : null}

      <Card>
        <CardToolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Search phone or name" className="md:max-w-xs" aria-label="Search users" />
          <Segmented label="Filter users" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "banned", label: "Banned" }]} />
        </CardToolbar>
        <DataTable
          label="Users"
          columns={columns}
          rows={list.data ? items : undefined}
          loading={list.loading}
          getKey={(u) => u.id}
          onRowClick={(u) => setSelectedId(u.id)}
          selectedKey={selectedId}
          resetKey={`${filter}:${query}`}
          empty={
            <EmptyState
              icon={<Users size={22} />}
              title={query ? "No users match your search" : filter === "banned" ? "No banned users" : "No users yet"}
              description={query ? "Try a different phone number or name." : filter === "banned" ? "Nobody is banned right now." : "People appear here after they sign up in the app."}
            />
          }
        />
        {items.length >= 100 ? <p className="border-t border-line px-5 py-3 text-xs text-muted">Showing the first 100 matches. Narrow the search to find someone specific.</p> : null}
      </Card>

      <UserDrawer user={selected} onClose={() => setSelectedId(null)} onChanged={upsert} onRemoved={removeLocal} onBan={setBanTarget} />
      <BanModal user={banTarget} onClose={() => setBanTarget(null)} onDone={upsert} />
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={upsert} />
    </>
  );
}

export default function UsersPage() {
  return (
    <Suspense>
      <UsersView />
    </Suspense>
  );
}
