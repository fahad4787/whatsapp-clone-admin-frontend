"use client";

import { useCallback, useMemo, useState } from "react";
import { Alert, DataTable, PageHeader, RefreshButton, StatusBadge, type Column } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import {
  banAdminUser,
  createAdminUser,
  deleteAdminUser,
  downloadCsv,
  fetchAdminUsers,
  getAdminToken,
  unbanAdminUser,
  type AdminUserItem,
} from "@/lib/api";
import { fmtDate, fmtDateTime } from "@/lib/format";

export default function UsersPage() {
  const [draftQ, setDraftQ] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetcher = useCallback(async (t: string) => (await fetchAdminUsers(t, query || undefined)).items, [query]);
  const { items, setItems, loading, error, reload } = useAdminList(fetcher, {
    interval: 12_000,
    errorMessage: "Could not load users — check your connection",
  });

  /** Runs a per-row mutation with shared busy/error handling. */
  const mutate = useCallback(
    async (user: AdminUserItem, failMsg: string, run: (token: string) => Promise<void>) => {
      const token = getAdminToken();
      if (!token) return;
      setBusyId(user.id);
      setActionError(null);
      try {
        await run(token);
      } catch {
        setActionError(failMsg);
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  const toggleBan = useCallback(
    (user: AdminUserItem) =>
      mutate(user, user.banned ? "Unban failed" : "Ban failed", async (t) => {
        const updated = user.banned ? await unbanAdminUser(t, user.id) : await banAdminUser(t, user.id, "Banned from admin");
        setItems((list) => list.map((u) => (u.id === user.id ? updated : u)));
      }),
    [mutate, setItems],
  );

  const removeUser = useCallback(
    (user: AdminUserItem) => {
      if (!window.confirm(`Delete ${user.phone}? This cannot be undone.`)) return;
      return mutate(user, "Delete failed", async (t) => {
        await deleteAdminUser(t, user.id);
        setItems((list) => list.filter((u) => u.id !== user.id));
      });
    },
    [mutate, setItems],
  );

  async function addUser() {
    const phone = window.prompt("Phone in international format, e.g. +923001234567");
    const token = getAdminToken();
    if (!phone || !token) return;
    const name = window.prompt("Display name (optional)") ?? "";
    try {
      const u = await createAdminUser(token, phone.trim(), name.trim());
      setActionError(null);
      setItems((list) => [u, ...list]);
    } catch (e) {
      setActionError(e instanceof Error && e.message === "phone_taken" ? "That phone already exists" : "Create failed — use +countrycode number");
    }
  }

  function exportUsers() {
    downloadCsv("users.csv", [
      ["Joined", "Phone", "Name", "Chats", "Last seen", "Status"],
      ...items.map((u) => [u.created_at, u.phone, u.display_name, u.conversation_count, u.last_seen_at, u.banned ? "Banned" : "Active"]),
    ]);
  }

  const columns = useMemo<Column<AdminUserItem>[]>(
    () => [
      { key: "joined", header: "Joined", className: "whitespace-nowrap text-bp-muted", cell: (u) => fmtDate(u.created_at) },
      { key: "phone", header: "Phone", className: "text-bp-green", cell: (u) => u.phone },
      { key: "name", header: "Name", cell: (u) => u.display_name || "—" },
      { key: "chats", header: "Chats", cell: (u) => u.conversation_count },
      { key: "seen", header: "Last seen", className: "whitespace-nowrap text-[12px] text-bp-muted", cell: (u) => fmtDateTime(u.last_seen_at) },
      {
        key: "privacy",
        header: "Privacy",
        className: "text-[12px] text-bp-muted",
        cell: (u) => (
          <>
            seen:{u.last_seen_privacy || "everyone"}
            <br />
            online:{u.online_privacy || "everyone"}
          </>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (u) => <StatusBadge label={u.banned ? "Banned" : "Active"} tone={u.banned ? "red" : "green"} />,
      },
      {
        key: "actions",
        header: "",
        align: "right",
        cell: (u) => (
          <div className="flex justify-end gap-2">
            <button type="button" className="bp-btn bp-btn-secondary" disabled={busyId === u.id} onClick={() => void toggleBan(u)}>
              {u.banned ? "Unban" : "Ban"}
            </button>
            <button type="button" className="bp-btn bp-btn-secondary" disabled={busyId === u.id} onClick={() => void removeUser(u)}>
              Delete
            </button>
          </div>
        ),
      },
    ],
    [busyId, toggleBan, removeUser],
  );

  return (
    <div className="bp-page">
      <PageHeader
        title="Users"
        description="Search accounts, ban spam, and restore access."
        actions={
          <div className="flex gap-2">
            <button type="button" className="bp-btn bp-btn-secondary" onClick={exportUsers}>
              Export CSV
            </button>
            <RefreshButton onClick={() => void reload()} />
            <button type="button" className="bp-btn bp-btn-primary" onClick={() => void addUser()}>
              Create user
            </button>
          </div>
        }
      />

      <form
        className="mb-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(draftQ.trim());
        }}
      >
        <input
          className="bp-input min-w-[220px] flex-1"
          placeholder="Search phone, name, or user id"
          value={draftQ}
          onChange={(e) => setDraftQ(e.target.value)}
        />
        <button type="submit" className="bp-btn bp-btn-primary">
          Search
        </button>
      </form>

      <Alert>{actionError ?? error}</Alert>
      <DataTable columns={columns} rows={items} getKey={(u) => u.id} loading={loading} empty="No users found." />
    </div>
  );
}
