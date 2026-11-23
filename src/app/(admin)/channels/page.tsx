"use client";

import { useCallback, useMemo, useState } from "react";
import { Alert, DataTable, FilterBar, PageHeader, RefreshButton, StatusBadge, type Column } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import {
  createAdminChannel,
  deleteAdminChannel,
  fetchAdminChannelPosts,
  fetchAdminChannels,
  getAdminToken,
  hideAdminChannelPost,
  patchAdminChannel,
  type AdminChannelItem,
  type AdminChannelPostItem,
} from "@/lib/api";

export default function ChannelsPage() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [q, setQ] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [selected, setSelected] = useState<AdminChannelItem | null>(null);
  const [posts, setPosts] = useState<AdminChannelPostItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const fetcher = useCallback(async (t: string) => (await fetchAdminChannels(t)).items, []);
  const { items, setItems, loading, error, reload } = useAdminList(fetcher, {
    interval: 30_000,
    errorMessage: "Could not load channels — check your connection",
  });

  /** Shared busy/error handling for per-channel actions. */
  const run = useCallback(
    async (id: string, failMsg: string, action: (token: string) => Promise<void>) => {
      const token = getAdminToken();
      if (!token) return;
      setBusyId(id);
      setActionError(null);
      try {
        await action(token);
      } catch {
        setActionError(failMsg);
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  const patch = useCallback(
    (c: AdminChannelItem, change: { listed?: boolean; verified?: boolean }) =>
      run(c.id, "Update failed", async (t) => {
        const updated = await patchAdminChannel(t, c.id, change);
        setItems((list) => list.map((row) => (row.id === updated.id ? updated : row)));
      }),
    [run, setItems],
  );

  const remove = useCallback(
    (c: AdminChannelItem) => {
      if (!window.confirm(`Delete channel “${c.name}”?`)) return;
      return run(c.id, "Delete failed", async (t) => {
        await deleteAdminChannel(t, c.id);
        setSelected((s) => (s?.id === c.id ? null : s));
        setItems((list) => list.filter((row) => row.id !== c.id));
      });
    },
    [run, setItems],
  );

  const openPosts = useCallback(
    async (c: AdminChannelItem) => {
      const token = getAdminToken();
      if (!token) return;
      setSelected(c);
      setPostsLoading(true);
      setPosts([]);
      try {
        setPosts((await fetchAdminChannelPosts(token, c.id)).items);
      } catch {
        setActionError("Could not load posts");
      } finally {
        setPostsLoading(false);
      }
    },
    [],
  );

  async function create() {
    if (!newName.trim()) return;
    await run("create", "Create failed", async (t) => {
      await createAdminChannel(t, { name: newName.trim(), listed: true });
      setNewName("");
      await reload();
    });
  }

  async function hidePost(postId: string) {
    const token = getAdminToken();
    if (!token || !selected) return;
    try {
      await hideAdminChannelPost(token, selected.id, postId);
      setPosts((list) => list.map((p) => (p.id === postId ? { ...p, deleted: true } : p)));
    } catch {
      setActionError("Hide post failed");
    }
  }

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (c) =>
        (visibility === "all" || (visibility === "listed") === c.listed) &&
        (!needle || `${c.name} ${c.slug}`.toLowerCase().includes(needle)),
    );
  }, [items, q, visibility]);

  const columns = useMemo<Column<AdminChannelItem>[]>(
    () => [
      { key: "name", header: "Channel", className: "font-semibold", cell: (c) => c.name },
      { key: "slug", header: "Slug", className: "font-mono text-bp-muted", cell: (c) => c.slug },
      { key: "followers", header: "Followers", cell: (c) => c.followers },
      { key: "posts", header: "Posts", cell: (c) => c.posts },
      {
        key: "flags",
        header: "Flags",
        cell: (c) => (
          <div className="flex flex-wrap gap-1">
            <StatusBadge label={c.listed ? "Listed" : "Hidden"} tone={c.listed ? "green" : "gray"} />
            {c.verified ? <StatusBadge label="Verified" tone="green" /> : null}
          </div>
        ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        cell: (c) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="bp-btn bp-btn-secondary" disabled={busyId === c.id} onClick={() => void openPosts(c)}>
              Posts
            </button>
            <button type="button" className="bp-btn bp-btn-secondary" disabled={busyId === c.id} onClick={() => void patch(c, { listed: !c.listed })}>
              {c.listed ? "Unlist" : "List"}
            </button>
            <button type="button" className="bp-btn bp-btn-secondary" disabled={busyId === c.id} onClick={() => void patch(c, { verified: !c.verified })}>
              {c.verified ? "Unverify" : "Verify"}
            </button>
            <button type="button" className="bp-btn bp-btn-secondary" disabled={busyId === c.id} onClick={() => void remove(c)}>
              Delete
            </button>
          </div>
        ),
      },
    ],
    [busyId, openPosts, patch, remove],
  );

  return (
    <div className="bp-page">
      <PageHeader
        title="Channels"
        description="Moderate broadcast channels — unlist, verify, hide posts, or delete."
        actions={<RefreshButton onClick={() => void reload()} />}
      />

      <div className="bp-card mb-4 flex flex-wrap items-end gap-3 p-4">
        <label className="grow text-sm font-semibold">
          New channel
          <input className="bp-input mt-1.5" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" />
        </label>
        <button type="button" className="bp-btn" disabled={busyId === "create" || !newName.trim()} onClick={() => void create()}>
          Create
        </button>
      </div>

      <FilterBar
        search={{ value: q, onChange: setQ, onSubmit: () => {}, placeholder: "Search channel name or slug" }}
        segments={{
          value: visibility,
          onChange: setVisibility,
          options: [
            { value: "all", label: "All" },
            { value: "listed", label: "Listed" },
            { value: "hidden", label: "Hidden" },
          ],
        }}
      />
      <Alert>{actionError ?? error}</Alert>
      <DataTable
        columns={columns}
        rows={rows}
        getKey={(c) => c.id}
        loading={loading}
        empty="No channels found."
        selectedKey={selected?.id ?? null}
      />

      {selected ? (
        <div className="bp-card mt-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-bp-line px-4 py-3">
            <h2 className="text-sm font-semibold">Posts · {selected.name}</h2>
            <button
              type="button"
              className="bp-btn bp-btn-secondary"
              onClick={() => {
                setSelected(null);
                setPosts([]);
              }}
            >
              Close
            </button>
          </div>
          {postsLoading ? (
            <p className="px-4 py-6 text-sm text-bp-muted">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="px-4 py-6 text-sm text-bp-muted">No posts</p>
          ) : (
            <ul className="divide-y divide-bp-line/70">
              {posts.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className={p.deleted ? "text-bp-muted line-through" : ""}>{p.text}</p>
                    <p className="mt-1 text-xs text-bp-muted">
                      {p.view_count} views · {p.created_at}
                      {p.deleted ? " · hidden" : ""}
                    </p>
                  </div>
                  {!p.deleted ? (
                    <button type="button" className="bp-btn bp-btn-secondary shrink-0" onClick={() => void hidePost(p.id)}>
                      Hide
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
