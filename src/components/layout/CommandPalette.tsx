"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Ban, CornerDownLeft, History, LogOut, MessagesSquare, Monitor, Moon, PanelLeft, Search, Sun, UserSearch, type LucideIcon } from "lucide-react";
import { useOverlay, usePresence } from "@/components/ui/Modal";
import { STORAGE_KEYS } from "@/config/constants";
import { NAV_ITEMS } from "@/config/nav";
import { clearAdminSession } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme";

type Entry = {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: "Recent" | "Pages" | "Search" | "Actions";
  /** Extra words that match but aren't shown. */
  keywords?: string;
  run: () => void;
};

const MAX_RECENT = 5;

export function readRecentPages(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEYS.recentPages) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Remember a visited page (most recent first). Only known nav pages are stored. */
export function rememberPage(pathname: string) {
  const item = NAV_ITEMS.find((i) => i.href === pathname);
  if (!item) return;
  try {
    const next = [item.href, ...readRecentPages().filter((h) => h !== item.href)].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEYS.recentPages, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Substring match ranks highest (earlier and word-start better). With `fuzzy`, falls back to a
 * subsequence match with bonuses for word starts and contiguous runs. 0 = no match.
 */
function score(query: string, text: string, fuzzy = true) {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const idx = t.indexOf(q);
  if (idx === 0) return 100;
  if (idx > 0) return 80 - Math.min(idx, 30) + (/\s/.test(t[idx - 1]) ? 10 : 0);
  if (!fuzzy || q.length < 2) return 0;
  let s = 0;
  let ti = 0;
  let run = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found < 0) return 0;
    run = found === ti ? run + 1 : 0;
    s += 1 + run + (found === 0 || /\s/.test(t[found - 1]) ? 2 : 0);
    ti = found + 1;
  }
  return Math.min(s, 60);
}

type Props = { open: boolean; onClose: () => void; collapsed: boolean; toggleCollapsed: () => void };

export function CommandPalette({ open, onClose, collapsed, toggleCollapsed }: Props) {
  const router = useRouter();
  const { setPref } = useTheme();
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, panel);
  const { mounted, closing } = usePresence(open, 140);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  // Fresh state each time it opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setActive(0);
      setRecent(readRecentPages());
    }
  }

  const entries = useMemo(() => {
    const go = (href: string) => () => {
      onClose();
      router.push(href);
    };
    const q = query.trim();
    const out: (Entry & { s: number })[] = [];
    const add = (e: Entry, s: number) => s > 0 && out.push({ ...e, s });

    if (!q) {
      for (const href of recent) {
        const item = NAV_ITEMS.find((i) => i.href === href);
        if (item) add({ id: `recent:${href}`, label: item.label, hint: item.description, icon: History, group: "Recent", run: go(href) }, 1);
      }
    }
    for (const item of NAV_ITEMS) {
      add(
        { id: `page:${item.href}`, label: item.label, hint: item.description, icon: item.icon, group: "Pages", run: go(item.href) },
        Math.max(score(q, item.label), score(q, `${item.description} ${item.keywords ?? ""}`, false) * 0.6),
      );
    }
    if (q) {
      const enc = encodeURIComponent(q);
      add({ id: "search:users", label: `Search users for “${q}”`, hint: "Name, phone or username", icon: UserSearch, group: "Search", run: go(`/users?q=${enc}`) }, 1);
      add({ id: "search:conversations", label: `Search conversations for “${q}”`, hint: "Group or chat name, member phone", icon: MessagesSquare, group: "Search", run: go(`/conversations?q=${enc}`) }, 1);
    }
    const actions: Entry[] = [
      { id: "act:banned", label: "Show banned users", icon: Ban, group: "Actions", keywords: "blocked suspended", run: go("/users?banned=1") },
      { id: "act:light", label: "Theme: Light", icon: Sun, group: "Actions", keywords: "appearance mode", run: () => (setPref("light"), onClose()) },
      { id: "act:dark", label: "Theme: Dark", icon: Moon, group: "Actions", keywords: "appearance mode night", run: () => (setPref("dark"), onClose()) },
      { id: "act:system", label: "Theme: Match system", icon: Monitor, group: "Actions", keywords: "appearance mode auto", run: () => (setPref("system"), onClose()) },
      { id: "act:sidebar", label: collapsed ? "Expand sidebar" : "Collapse sidebar", icon: PanelLeft, group: "Actions", keywords: "navigation menu", run: () => (toggleCollapsed(), onClose()) },
      {
        id: "act:signout",
        label: "Sign out",
        icon: LogOut,
        group: "Actions",
        keywords: "logout log out exit",
        run: () => {
          clearAdminSession();
          window.location.replace("/login");
        },
      },
    ];
    for (const a of actions) add(a, Math.max(score(q, a.label), score(q, a.keywords ?? "", false) * 0.6));

    const order = { Recent: 0, Search: 1, Pages: 2, Actions: 3 } as const;
    // With a query: best matches first within each group, groups ordered by their best hit.
    if (q) {
      const best = new Map<string, number>();
      for (const e of out) best.set(e.group, Math.max(best.get(e.group) ?? 0, e.s));
      best.set("Search", 45); // search rows beat loose fuzzy hits, trail real substring matches
      return out.sort((a, b) => (best.get(b.group)! - best.get(a.group)!) || order[a.group] - order[b.group] || b.s - a.s);
    }
    return out.sort((a, b) => order[a.group] - order[b.group]);
  }, [query, recent, collapsed, onClose, router, setPref, toggleCollapsed]);

  const current = Math.min(active, Math.max(entries.length - 1, 0));

  const move = (to: number) => {
    const n = entries.length;
    if (!n) return;
    const next = (to + n) % n;
    setActive(next);
    list.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const jump =
      e.key === "ArrowDown" ? current + 1
      : e.key === "ArrowUp" ? current - 1
      : e.key === "Home" && e.ctrlKey ? 0
      : e.key === "End" && e.ctrlKey ? entries.length - 1
      : null;
    if (jump != null) {
      e.preventDefault();
      move(jump);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!closing) entries[current]?.run();
    }
  };

  if (!mounted || typeof document === "undefined") return null;

  let lastGroup = "";
  return createPortal(
    <div className={cn("fixed inset-0 z-50 flex items-start justify-center px-3 pt-[12vh]", closing && "pointer-events-none")}>
      <div className={cn("absolute inset-0 bg-scrim backdrop-blur-[2px]", closing ? "animate-fade-out" : "animate-fade-in")} onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Search and jump to"
        className={cn(
          "relative flex max-h-[min(34rem,76vh)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-pop",
          closing ? "animate-pop-out" : "animate-pop-in",
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search size={17} className="shrink-0 text-muted" aria-hidden />
          <input
            data-autofocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages, users, conversations…"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-activedescendant={entries[current] ? `cmdk-${entries[current].id}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-subtle"
          />
          <kbd className="hidden shrink-0 rounded border border-line bg-surface-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted sm:block">Esc</kbd>
        </div>

        <div ref={list} id="cmdk-list" role="listbox" aria-label="Results" className="flex-1 overflow-y-auto p-1.5">
          {entries.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted">No pages or actions match “{query.trim()}”.</div>
          ) : (
            entries.map((e, i) => {
              const header = e.group !== lastGroup ? e.group : null;
              lastGroup = e.group;
              const Icon = e.icon;
              const selected = i === current;
              return (
                <div key={e.id}>
                  {header ? (
                    <div role="presentation" className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                      {header}
                    </div>
                  ) : null}
                  <div
                    id={`cmdk-${e.id}`}
                    role="option"
                    aria-selected={selected}
                    data-index={i}
                    onMouseMove={() => i !== current && setActive(i)}
                    onClick={() => !closing && e.run()}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px] transition-colors duration-100",
                      selected ? "bg-surface-hover text-ink" : "text-ink-soft",
                    )}
                  >
                    <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md border border-line", selected ? "bg-surface text-brand" : "bg-surface-muted text-muted")}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{e.label}</span>
                      {e.hint ? <span className="block truncate text-xs text-muted">{e.hint}</span> : null}
                    </span>
                    {selected ? <ArrowRight size={14} className="shrink-0 text-muted" aria-hidden /> : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-line bg-surface-muted/60 px-4 py-2 text-[11.5px] text-muted sm:flex">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-line bg-surface px-1 font-sans">↑</kbd>
            <kbd className="rounded border border-line bg-surface px-1 font-sans">↓</kbd> to move
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="grid h-[18px] place-items-center rounded border border-line bg-surface px-1"><CornerDownLeft size={10} /></kbd> to open
          </span>
          <span className="ml-auto">{entries.length} result{entries.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
