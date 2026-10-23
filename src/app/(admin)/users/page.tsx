"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import {
  banAdminUser,
  fetchAdminUsers,
  unbanAdminUser,
  type AdminUserItem,
} from "@/lib/api";

export default function UsersPage() {
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);
      if (!token) {
        setError("Sign in again to manage users");
        setItems([]);
        return;
      }
      const data = await fetchAdminUsers(token, search);
      setItems(data.items);
    } catch {
      setError("Could not load users — check API / admin token");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleBan(user: AdminUserItem) {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    setBusyId(user.id);
    try {
      const updated = user.banned
        ? await unbanAdminUser(token, user.id)
        : await banAdminUser(token, user.id, "Banned from admin");
      setItems((list) => list.map((u) => (u.id === user.id ? updated : u)));
    } catch {
      setError(user.banned ? "Unban failed" : "Ban failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="bp-page">
      <PageHeader
        title="Users"
        description="Search accounts, ban spam, and restore access."
        actions={
          <button type="button" className="bp-btn bp-btn-secondary" onClick={() => void load(q)}>
            Refresh
          </button>
        }
      />

      <form
        className="mb-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load(q);
        }}
      >
        <input
          className="bp-input min-w-[220px] flex-1"
          placeholder="Search phone, name, or user id"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="bp-btn bp-btn-primary">
          Search
        </button>
      </form>

      {error ? (
        <div className="mb-3 rounded-[var(--radius)] border border-[#f0d4d4] bg-[#fff7f7] px-4 py-2.5 text-sm">
          {error}
        </div>
      ) : null}

      <div className="bp-card overflow-hidden">
        <table className="bp-table">
          <thead>
            <tr>
              <th>Joined</th>
              <th>Phone</th>
              <th>Name</th>
              <th>Chats</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-bp-muted">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-bp-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.id}>
                  <td className="whitespace-nowrap text-bp-muted">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-bp-green">{u.phone}</td>
                  <td>{u.display_name || "—"}</td>
                  <td>{u.conversation_count}</td>
                  <td>
                    <StatusBadge
                      label={u.banned ? "Banned" : "Active"}
                      tone={u.banned ? "red" : "green"}
                    />
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="bp-btn bp-btn-secondary"
                      disabled={busyId === u.id}
                      onClick={() => void toggleBan(u)}
                    >
                      {u.banned ? "Unban" : "Ban"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
