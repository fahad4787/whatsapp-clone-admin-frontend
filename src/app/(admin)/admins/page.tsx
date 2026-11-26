"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import {
  Badge,
  Button,
  Callout,
  Card,
  DataTable,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Person,
  Select,
  type Column,
} from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { useAdminIdentity } from "@/hooks/useAdminIdentity";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type AdminItem, type AdminRole } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { isEmail } from "@/lib/validate";

const ROLE: Record<AdminRole, { label: string; tone: "brand" | "info"; help: string }> = {
  SUPER: { label: "Super admin", tone: "brand", help: "Everything, including adding admins." },
  MOD: { label: "Moderator", tone: "info", help: "Everything except adding admins." },
};

const EMPTY = { email: "", password: "", name: "", role: "MOD" as AdminRole };

function InviteModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (a: AdminItem) => void }) {
  const { run, isPending } = useAction();
  const [form, setForm] = useState(EMPTY);
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);

  const email = form.email.trim();
  const errors = {
    email: !email ? "Enter an email." : !isEmail(email) ? "Enter a valid email." : null,
    password: form.password.length < 8 ? "At least 8 characters." : form.password.length > 72 ? "Up to 72 characters." : null,
    name: form.name.trim().length > 80 ? "Up to 80 characters." : null,
  };
  const valid = !errors.email && !errors.password && !errors.name;

  const close = () => {
    setForm(EMPTY);
    setShow(false);
    setTouched(false);
    onClose();
  };
  const submit = async () => {
    setTouched(true);
    if (!valid) return;
    const created = await run(
      "invite",
      () => adminApi.admins.create({ email, password: form.password, display_name: form.name.trim() || undefined, role: form.role }),
      { success: "Admin added", errorTitle: "Couldn't add admin" },
    );
    if (created) {
      onCreated(created);
      close();
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add an admin"
      description="Share the email and password with them privately. They sign in at this console's login page."
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" icon={<UserPlus size={16} />} loading={isPending("invite")}>Add admin</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" required error={touched ? errors.email : null} className="sm:col-span-2">
          {(a) => <Input {...a} data-autofocus type="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
        </Field>
        <Field label="Temporary password" required error={touched ? errors.password : null} hint="8 to 72 characters." className="sm:col-span-2">
          {(a) => (
            <Input
              {...a}
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              maxLength={72}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              trailing={
                <IconButton size="sm" label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </IconButton>
              }
            />
          )}
        </Field>
        <Field label="Name" error={errors.name} hint="Optional">
          {(a) => <Input {...a} value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        </Field>
        <Field label="Role" hint={ROLE[form.role].help}>
          {(a) => (
            <Select
              {...a}
              value={form.role}
              onChange={(role) => setForm({ ...form, role })}
              options={[
                { value: "MOD", label: ROLE.MOD.label },
                { value: "SUPER", label: ROLE.SUPER.label },
              ]}
            />
          )}
        </Field>
      </div>
    </Modal>
  );
}

export default function AdminsPage() {
  const me = useAdminIdentity();
  const isSuper = me.role === "SUPER";
  const [inviteOpen, setInviteOpen] = useState(false);
  const list = useQuery("admins", (s) => adminApi.admins.list(s));
  const items = useMemo(() => list.data?.items ?? [], [list.data]);

  const columns: Column<AdminItem>[] = [
    {
      key: "who",
      header: "Admin",
      cell: (a) => (
        <Person
          name={a.display_name || a.email}
          sub={a.display_name ? a.email : undefined}
          seed={a.id}
          trailing={me.email && me.email.toLowerCase() === a.email ? <Badge tone="neutral">You</Badge> : undefined}
        />
      ),
    },
    { key: "role", header: "Role", cell: (a) => <Badge tone={ROLE[a.role].tone}>{ROLE[a.role].label}</Badge> },
    { key: "added", header: "Added", hideBelow: "sm", className: "whitespace-nowrap text-muted", cell: (a) => fmtDate(a.created_at) },
  ];

  return (
    <>
      <PageHeader
        title="Admins"
        count={list.data ? items.length : undefined}
        description="People who can sign in to this console."
        actions={isSuper ? <Button icon={<UserPlus size={16} />} onClick={() => setInviteOpen(true)}>Add admin</Button> : undefined}
      />
      {list.error ? <Callout tone="danger" className="mb-4">{list.error}</Callout> : null}
      {me.role === "MOD" ? (
        <Callout tone="info" className="mb-4" title="Only super admins can add admins">
          Ask a super admin if someone needs access.
        </Callout>
      ) : null}
      <Card>
        <DataTable
          label="Admins"
          columns={columns}
          rows={list.data ? items : undefined}
          loading={list.loading}
          getKey={(a) => a.id}
          pageSize={0}
          empty={<EmptyState icon={<UsersRound size={22} />} title="No admins" />}
        />
      </Card>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <ShieldCheck size={14} /> Two-step sign-in and lockout rules are on the Admin security page.
      </p>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onCreated={(a) => list.setData((d) => (d ? { ...d, items: [...d.items, a] } : d))} />
    </>
  );
}
