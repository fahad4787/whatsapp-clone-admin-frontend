"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import {
  createAdminChannel,
  deleteAdminChannel,
  fetchAdminChannelPosts,
  fetchAdminChannels,
  hideAdminChannelPost,
  patchAdminChannel,
  type AdminChannelItem,
  type AdminChannelPostItem,
} from "@/lib/api";

export default function ChannelsPage() {
  const [items, setItems] = useState<AdminChannelItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [selected, setSelected] = useState<AdminChannelItem | null>(null);
  const [posts, setPosts] = useState<AdminChannelPostItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);
      if (!token) {
        setError("Sign in again");
        return;
      }
      const data = await fetchAdminChannels(token);
      setItems(data.items);
    } catch {
      setError("Could not load channels");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token || !newName.trim()) return;
    setBusyId("create");
    try {
      await createAdminChannel(token, { name: newName.trim(), listed: true });
      setNewName("");
      await load();
    } catch {
      setError("Create failed");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleListed(c: AdminChannelItem) {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    setBusyId(c.id);
    try {
      const updated = await patchAdminChannel(token, c.id, { listed: !c.listed });
      setItems((list) => list.map((row) => (row.id === updated.id ? updated : row)));
    } catch {
      setError("Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleVerified(c: AdminChannelItem) {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    setBusyId(c.id);
    try {
      const updated = await patchAdminChannel(token, c.id, { verified: !c.verified });
      setItems((list) => list.map((row) => (row.id === updated.id ? updated : row)));
    } catch {
      setError("Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(c: AdminChannelItem) {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    if (!window.confirm(`Delete channel “${c.name}”?`)) return;
    setBusyId(c.id);
    try {
      await deleteAdminChannel(token, c.id);
      if (selected?.id === c.id) {
        setSelected(null);
        setPosts([]);
      }
      await load();
    } catch {
      setError("Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function openPosts(c: AdminChannelItem) {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    setSelected(c);
    setPostsLoading(true);
    try {
      const data = await fetchAdminChannelPosts(token, c.id);
      setPosts(data.items);
    } catch {
      setError("Could not load posts");
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }

  async function hidePost(postId: string) {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token || !selected) return;
    try {
      await hideAdminChannelPost(token, selected.id, postId);
      setPosts((list) =>
        list.map((p) => (p.id === postId ? { ...p, deleted: true } : p)),
      );
    } catch {
      setError("Hide post failed");
    }
  }

  return (
    <div className="bp-page">
      <PageHeader
        title="Channels"
        description="Moderate broadcast channels — unlist, verify, hide posts, or delete."
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

      <div className="bp-card mb-4 flex flex-wrap items-end gap-3 p-4">
        <label className="grow text-sm font-semibold">
          New channel
          <input
            className="bp-input mt-1.5"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
          />
        </label>
        <button
          type="button"
          className="bp-btn"
          disabled={busyId === "create" || !newName.trim()}
          onClick={() => void create()}
        >
          Create
        </button>
      </div>

      <div className="bp-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-bp-line bg-bp-soft/40 text-xs uppercase tracking-wide text-bp-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Channel</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Followers</th>
              <th className="px-4 py-3 font-semibold">Posts</th>
              <th className="px-4 py-3 font-semibold">Flags</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-bp-muted" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-bp-muted" colSpan={6}>
                  No channels
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="border-b border-bp-line/70 last:border-0">
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-bp-muted">{c.slug}</td>
                  <td className="px-4 py-3">{c.followers}</td>
                  <td className="px-4 py-3">{c.posts}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge
                        label={c.listed ? "Listed" : "Hidden"}
                        tone={c.listed ? "green" : "gray"}
                      />
                      {c.verified ? <StatusBadge label="Verified" tone="green" /> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        className="bp-btn bp-btn-secondary"
                        disabled={busyId === c.id}
                        onClick={() => void openPosts(c)}
                      >
                        Posts
                      </button>
                      <button
                        type="button"
                        className="bp-btn bp-btn-secondary"
                        disabled={busyId === c.id}
                        onClick={() => void toggleListed(c)}
                      >
                        {c.listed ? "Unlist" : "List"}
                      </button>
                      <button
                        type="button"
                        className="bp-btn bp-btn-secondary"
                        disabled={busyId === c.id}
                        onClick={() => void toggleVerified(c)}
                      >
                        {c.verified ? "Unverify" : "Verify"}
                      </button>
                      <button
                        type="button"
                        className="bp-btn bp-btn-secondary"
                        disabled={busyId === c.id}
                        onClick={() => void remove(c)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
                    <button
                      type="button"
                      className="bp-btn bp-btn-secondary shrink-0"
                      onClick={() => void hidePost(p.id)}
                    >
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
