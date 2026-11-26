"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Eye, EyeOff, Megaphone, Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  ErrorCallout,
  Card,
  CardToolbar,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Skeleton,
  Switch,
  SwitchRow,
  Textarea,
  useConfirm,
  type Column,
} from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type ChannelItem, type ChannelPost } from "@/lib/api";
import { fmtDate, fmtDateTime, fmtNumber } from "@/lib/format";

type Form = { name: string; description: string; verified: boolean; listed: boolean };
const EMPTY: Form = { name: "", description: "", verified: false, listed: true };

/** Create (channel = null) or edit a channel. */
function ChannelModal({
  open,
  channel,
  onClose,
  onSaved,
}: {
  open: boolean;
  channel: ChannelItem | null;
  onClose: () => void;
  onSaved: (c: ChannelItem) => void;
}) {
  const { run, isPending } = useAction();
  const [form, setForm] = useState<Form>(EMPTY);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const key = open ? (channel?.id ?? "new") : null;
  if (key !== loadedFor) {
    setLoadedFor(key);
    setTouched(false);
    setForm(channel ? { name: channel.name, description: channel.description ?? "", verified: channel.verified, listed: channel.listed } : EMPTY);
  }

  const name = form.name.trim();
  const description = form.description.trim();
  const errors = {
    name: name.length < 2 ? "At least 2 characters." : name.length > 80 ? "Up to 80 characters." : null,
    description: description.length > 500 ? "Up to 500 characters." : null,
  };

  const submit = async () => {
    setTouched(true);
    if (errors.name || errors.description) return;
    const body = { name, description: description || null, verified: form.verified, listed: form.listed };
    const saved = await run("save", () => (channel ? adminApi.channels.update(channel.id, body) : adminApi.channels.create(body)), {
      success: channel ? "Channel updated" : "Channel created",
      errorTitle: "Couldn't save channel",
    });
    if (saved) {
      onSaved(saved);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={channel ? "Edit channel" : "New channel"}
      description={channel ? `Slug: ${channel.slug}` : "A one-way broadcast that people can follow from the Updates tab."}
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isPending("save")}>{channel ? "Save" : "Create channel"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name" required error={touched ? errors.name : null}>
          {(a) => <Input {...a} data-autofocus value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        </Field>
        <Field label="Description" hint={`${description.length}/500`} error={errors.description}>
          {(a) => <Textarea {...a} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}
        </Field>
        <div className="divide-y divide-line rounded-xl border border-line px-4">
          <div className="py-3">
            <SwitchRow label="Verified" description="Shows a verified badge next to the name." checked={form.verified} onChange={(verified) => setForm({ ...form, verified })} />
          </div>
          <div className="py-3">
            <SwitchRow label="Listed" description="Appears in the app's channel directory. Unlisted channels can still be opened by link." checked={form.listed} onChange={(listed) => setForm({ ...form, listed })} />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PostsDrawer({ channel, onClose }: { channel: ChannelItem | null; onClose: () => void }) {
  const posts = useQuery(`channel-posts:${channel?.id}`, (s) => adminApi.channels.posts(channel!.id, s), { enabled: !!channel });
  const { run, isPending } = useAction();
  const confirm = useConfirm();

  const hide = async (p: ChannelPost) => {
    if (!channel) return;
    const ok = await confirm({ title: "Hide this post?", description: "Followers won't see it anymore. This can't be undone from here.", confirmLabel: "Hide post" });
    if (!ok) return;
    const r = await run(p.id, () => adminApi.channels.hidePost(channel.id, p.id), { success: "Post hidden", errorTitle: "Couldn't hide post" });
    if (r) posts.setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === p.id ? { ...x, deleted: true } : x)) } : d));
  };

  const items = posts.data?.items ?? [];
  return (
    <Drawer open={!!channel} onClose={onClose} title={channel ? `${channel.name} posts` : "Posts"} description="Latest 50 posts, newest first.">
      {posts.error ? <ErrorCallout error={posts.error} onRetry={posts.reload} retrying={posts.fetching} /> : null}
      {!posts.data ? (
        <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : items.length ? (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.id} className="rounded-xl border border-line p-4">
              <p className={p.deleted ? "text-sm text-muted line-through" : "whitespace-pre-wrap text-sm text-ink"}>{p.text}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                <span>{fmtDateTime(p.created_at)}</span>
                <span className="inline-flex items-center gap-1"><Eye size={12} /> {fmtNumber(p.view_count)}</span>
                {p.deleted ? (
                  <Badge tone="neutral" className="ml-auto"><EyeOff size={11} /> Hidden</Badge>
                ) : (
                  <Button size="sm" variant="danger-soft" className="ml-auto" icon={<EyeOff size={14} />} loading={isPending(p.id)} onClick={() => void hide(p)}>
                    Hide
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<Newspaper size={22} />} title="No posts yet" />
      )}
    </Drawer>
  );
}

export default function ChannelsPage() {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<{ channel: ChannelItem | null } | null>(null);
  const [postsFor, setPostsFor] = useState<ChannelItem | null>(null);
  const { run, isPending } = useAction();
  const confirm = useConfirm();
  const list = useQuery("channels", (s) => adminApi.channels.list(s));
  const all = useMemo(() => list.data?.items ?? [], [list.data]);
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? all.filter((c) => c.name.toLowerCase().includes(n) || c.slug.includes(n)) : all;
  }, [all, q]);

  const upsert = (c: ChannelItem) =>
    list.setData((d) => {
      if (!d) return d;
      const exists = d.items.some((x) => x.id === c.id);
      return { ...d, items: exists ? d.items.map((x) => (x.id === c.id ? { ...x, ...c } : x)) : [c, ...d.items] };
    });

  const toggle = async (c: ChannelItem, field: "verified" | "listed", value: boolean) => {
    upsert({ ...c, [field]: value });
    const saved = await run(`${c.id}:${field}`, () => adminApi.channels.update(c.id, { [field]: value }), {
      success: field === "verified" ? (value ? "Marked verified" : "Verification removed") : value ? "Channel listed" : "Channel unlisted",
      errorTitle: "Couldn't update channel",
    });
    upsert(saved ?? c);
  };

  const remove = async (c: ChannelItem) => {
    const ok = await confirm({
      title: `Delete ${c.name}?`,
      description: `Its ${fmtNumber(c.posts)} posts and ${fmtNumber(c.followers)} followers are removed for good.`,
      confirmLabel: "Delete channel",
    });
    if (!ok) return;
    const r = await run(c.id, () => adminApi.channels.remove(c.id), { success: "Channel deleted", errorTitle: "Couldn't delete channel" });
    if (r) list.setData((d) => (d ? { ...d, items: d.items.filter((x) => x.id !== c.id) } : d));
  };

  const columns: Column<ChannelItem>[] = [
    {
      key: "channel",
      header: "Channel",
      sortValue: (c) => c.name,
      cell: (c) => (
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><Megaphone size={16} /></span>
          <span className="min-w-0 max-w-[12rem] xl:max-w-[18rem]">
            <span className="flex items-center gap-1 font-semibold text-ink">
              <span className="truncate">{c.name}</span>
              {c.verified ? <BadgeCheck size={15} className="shrink-0 text-brand" aria-label="Verified" /> : null}
            </span>
            <span className="block truncate text-xs text-muted">{c.description || `/${c.slug}`}</span>
          </span>
        </span>
      ),
    },
    { key: "followers", header: "Followers", sortValue: (c) => c.followers, align: "right", hideBelow: "sm", className: "tabular-nums", cell: (c) => fmtNumber(c.followers) },
    {
      key: "posts",
      header: "Posts",
      sortValue: (c) => c.posts,
      align: "right",
      hideBelow: "xl",
      cell: (c) => (
        <button type="button" onClick={() => setPostsFor(c)} className="rounded font-semibold tnum text-brand-text underline-offset-2 hover:underline">
          {fmtNumber(c.posts)}
        </button>
      ),
    },
    { key: "verified", header: "Verified", align: "center", hideBelow: "lg", cell: (c) => <Switch size="sm" label={`Verified: ${c.name}`} checked={c.verified} disabled={isPending(`${c.id}:verified`)} onChange={(v) => void toggle(c, "verified", v)} /> },
    { key: "listed", header: "Listed", align: "center", hideBelow: "lg", cell: (c) => <Switch size="sm" label={`Listed: ${c.name}`} checked={c.listed} disabled={isPending(`${c.id}:listed`)} onChange={(v) => void toggle(c, "listed", v)} /> },
    { key: "created", header: "Created", sortValue: (c) => Date.parse(c.created_at), hideBelow: "xl", className: "whitespace-nowrap text-muted", cell: (c) => fmtDate(c.created_at) },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (c) => (
        <span className="inline-flex gap-1">
          <IconButton size="sm" label={`Posts in ${c.name}`} onClick={() => setPostsFor(c)}><Newspaper size={15} /></IconButton>
          <IconButton size="sm" label={`Edit ${c.name}`} onClick={() => setModal({ channel: c })}><Pencil size={15} /></IconButton>
          <IconButton size="sm" tone="danger" label={`Delete ${c.name}`} disabled={isPending(c.id)} onClick={() => void remove(c)}><Trash2 size={15} /></IconButton>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Channels"
        count={list.data ? all.length : undefined}
        description="Broadcast channels people follow in the app's Updates tab."
        actions={<Button icon={<Plus size={16} />} onClick={() => setModal({ channel: null })}>New channel</Button>}
      />
      {list.error ? <ErrorCallout error={list.error} onRetry={list.reload} retrying={list.fetching} className="mb-4" /> : null}
      <Card>
        <CardToolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Search channels" className="md:max-w-xs" aria-label="Search channels" />
        </CardToolbar>
        <DataTable
          label="Channels"
          columns={columns}
          rows={list.data ? rows : undefined}
          loading={list.loading}
          getKey={(c) => c.id}
          resetKey={q}
          empty={<EmptyState icon={<Megaphone size={22} />} title={q ? "No channels match" : "No channels yet"} action={q ? undefined : <Button size="sm" icon={<Plus size={14} />} onClick={() => setModal({ channel: null })}>New channel</Button>} />}
        />
      </Card>
      <ChannelModal open={!!modal} channel={modal?.channel ?? null} onClose={() => setModal(null)} onSaved={upsert} />
      <PostsDrawer channel={postsFor} onClose={() => setPostsFor(null)} />
    </>
  );
}
