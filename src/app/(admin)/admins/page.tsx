"use client";

import { useCallback, useMemo, useState } from "react";
import { Alert, Button, DataTable, FilterBar, PageHeader, RefreshButton, StatusBadge, TextInput, type Column } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import { createAdminAdmin, fetchAdminAdmins, getAdminToken, type AdminAdminItem } from "@/lib/api";

export default function AdminsPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const fetcher = useCallback(async (t: string) => (await fetchAdminAdmins(t)).items, []);
  const { items, loading, error, reload } = useAdminList(fetcher, {
    interval: 30_000,
    errorMessage: "Could not load admins — check your connection",
  });

  async function invite() {
    const token = getAdminToken();
    if (!token) return;
    setBusy(true);
    setActionError(null);
    try {
      await createAdminAdmin(token, { email: email.trim(), password, display_name: name.trim() || undefined, role: "MOD" });
      setEmail("");
      setPassword("");
      setName("");
      await reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Invite failed (SUPER only)");
    } finally {
      setBusy(false);
    }
  }

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((a) => `${a.display_name ?? ""} ${a.email} ${a.role}`.toLowerCase().includes(needle));
  }, [items, q]);

  const columns = useMemo<Column<AdminAdminItem>[]>(
    () => [
      { key: "name", header: "Name", className: "font-semibold", cell: (a) => a.display_name || "—" },
      { key: "email", header: "Email", cell: (a) => a.email },
      { key: "role", header: "Role", cell: (a) => <StatusBadge label={a.role} tone={a.role === "SUPER" ? "green" : "gray"} /> },
    ],
    [],
  );

  return (
    <div className="bp-page">
      <PageHeader
        title="Admins"
        description="Console operators. Inviting requires SUPER role."
        actions={<RefreshButton onClick={() => void reload()} />}
      />

      <div className="bp-card mb-5 p-5">
        <div className="mb-3 text-sm font-bold">Invite admin</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <TextInput placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextInput placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextInput type="password" placeholder="Temp password (8+)" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="mt-3">
          <Button disabled={busy || !email.trim() || password.length < 8} onClick={() => void invite()}>
            {busy ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>

      <FilterBar search={{ value: q, onChange: setQ, onSubmit: () => {}, placeholder: "Search name, email, or role" }} />
      <Alert>{actionError ?? error}</Alert>
      <DataTable columns={columns} rows={rows} getKey={(a) => a.id} loading={loading} empty="No admins found." />
    </div>
  );
}
