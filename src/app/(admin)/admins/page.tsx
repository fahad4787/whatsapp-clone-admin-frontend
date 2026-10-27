"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, PageHeader, TextInput } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import {
  createAdminAdmin,
  fetchAdminAdmins,
  type AdminAdminItem,
} from "@/lib/api";

export default function AdminsPage() {
  const [items, setItems] = useState<AdminAdminItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);
      if (!token) {
        setError("Sign in again");
        return;
      }
      const data = await fetchAdminAdmins(token);
      setItems(data.items);
    } catch {
      setError("Could not load admins");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite() {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await createAdminAdmin(token, {
        email: email.trim(),
        password,
        display_name: name.trim() || undefined,
        role: "MOD",
      });
      setEmail("");
      setPassword("");
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invite failed (SUPER only)");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bp-page">
      <PageHeader
        title="Admins"
        description="Console operators. Inviting requires SUPER role."
        actions={
          <button type="button" className="bp-btn bp-btn-secondary" onClick={() => void load()}>
            Refresh
          </button>
        }
      />
      {error ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="bp-card mb-5 p-5">
        <div className="mb-3 text-sm font-bold">Invite admin</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <TextInput placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextInput
            placeholder="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextInput
            type="password"
            placeholder="Temp password (8+)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <Button
            disabled={busy || !email.trim() || password.length < 8}
            onClick={() => void invite()}
          >
            {busy ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>

      <div className="bp-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-bp-line bg-bp-soft/40 text-xs uppercase tracking-wide text-bp-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-bp-muted" colSpan={3}>
                  Loading…
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="border-b border-bp-line/70 last:border-0">
                  <td className="px-4 py-3 font-semibold">{a.display_name || "—"}</td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3">{a.role}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
