"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_KEYS } from "@/config/constants";
import {
  seedAdmins,
  seedAudit,
  seedCalls,
  seedChannels,
  seedConversations,
  seedCountries,
  seedLive,
  seedOtps,
  seedReports,
  seedSettings,
  seedStickers,
  seedUsers,
} from "@/data/seed";
import type {
  AdminRow,
  AuditRow,
  CallRow,
  ChannelRow,
  CollectionKey,
  ConversationRow,
  CountryRow,
  LiveCallRow,
  OtpRow,
  ReportRow,
  SettingsMap,
  StickerRow,
  UserRow,
} from "@/types/models";

export type StoreState = {
  users: UserRow[];
  otps: OtpRow[];
  conversations: ConversationRow[];
  calls: CallRow[];
  reports: ReportRow[];
  countries: CountryRow[];
  channels: ChannelRow[];
  admins: AdminRow[];
  audit: AuditRow[];
  stickers: StickerRow[];
  live: LiveCallRow[];
  settings: SettingsMap;
};

type StoreApi = StoreState & {
  ready: boolean;
  reset: () => void;
  setSettings: (next: SettingsMap) => void;
  create: <K extends CollectionKey>(key: K, row: StoreState[K][number]) => void;
  update: <K extends CollectionKey>(key: K, id: string, patch: Partial<StoreState[K][number]>) => void;
  remove: <K extends CollectionKey>(key: K, id: string) => void;
  pushAudit: (action: string, detail: string) => void;
};

const SEED: StoreState = {
  users: seedUsers,
  otps: seedOtps,
  conversations: seedConversations,
  calls: seedCalls,
  reports: seedReports,
  countries: seedCountries,
  channels: seedChannels,
  admins: seedAdmins,
  audit: seedAudit,
  stickers: seedStickers,
  live: seedLive,
  settings: seedSettings,
};

const Ctx = createContext<StoreApi | null>(null);

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowTime() {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(SEED);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.mockStore);
      if (raw) {
        const parsed = JSON.parse(raw) as StoreState;
        setState({ ...SEED, ...parsed, settings: { ...SEED.settings, ...parsed.settings } });
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEYS.mockStore, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  const reset = useCallback(() => setState(SEED), []);

  const setSettings = useCallback((next: SettingsMap) => {
    setState((s) => ({ ...s, settings: next }));
  }, []);

  const pushAudit = useCallback((action: string, detail: string) => {
    setState((s) => ({
      ...s,
      audit: [{ id: uid("au"), time: nowTime(), actor: "Fixel", action, detail }, ...s.audit],
    }));
  }, []);

  const create = useCallback(<K extends CollectionKey>(key: K, row: StoreState[K][number]) => {
    setState((s) => ({
      ...s,
      [key]: [row, ...(s[key] as StoreState[K][number][])],
    }));
  }, []);

  const update = useCallback(<K extends CollectionKey>(key: K, id: string, patch: Partial<StoreState[K][number]>) => {
    setState((s) => ({
      ...s,
      [key]: (s[key] as { id: string }[]).map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  }, []);

  const remove = useCallback(<K extends CollectionKey>(key: K, id: string) => {
    setState((s) => ({
      ...s,
      [key]: (s[key] as { id: string }[]).filter((row) => row.id !== id),
    }));
  }, []);

  const value = useMemo<StoreApi>(
    () => ({
      ...state,
      ready,
      reset,
      setSettings,
      create,
      update,
      remove,
      pushAudit,
    }),
    [state, ready, reset, setSettings, create, update, remove, pushAudit],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMockStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMockStore must be used inside MockStoreProvider");
  return ctx;
}

export { uid, nowTime };
