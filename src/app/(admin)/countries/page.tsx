"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import {
  fetchAdminCountries,
  updateAdminCountry,
  type AdminCountryItem,
} from "@/lib/api";

export default function CountriesPage() {
  const [items, setItems] = useState<AdminCountryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyIso, setBusyIso] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);
      if (!token) {
        setError("Sign in again");
        return;
      }
      const data = await fetchAdminCountries(token);
      setItems(data.items);
    } catch {
      setError("Could not load countries");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(c: AdminCountryItem) {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    setBusyIso(c.iso);
    try {
      const updated = await updateAdminCountry(token, c.iso, { enabled: !c.enabled });
      setItems((list) => list.map((row) => (row.iso === updated.iso ? updated : row)));
    } catch {
      setError("Update failed");
    } finally {
      setBusyIso(null);
    }
  }

  return (
    <div className="bp-page">
      <PageHeader
        title="Countries"
        description="Allowlist dial codes for signup. Disabled countries cannot request OTP."
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
      <div className="bp-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-bp-line bg-bp-soft/40 text-xs uppercase tracking-wide text-bp-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Country</th>
              <th className="px-4 py-3 font-semibold">ISO</th>
              <th className="px-4 py-3 font-semibold">Dial</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-bp-muted" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-bp-muted" colSpan={5}>
                  No countries
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.iso} className="border-b border-bp-line/70 last:border-0">
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3">{c.iso}</td>
                  <td className="px-4 py-3">{c.dial}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={c.enabled ? "Enabled" : "Disabled"}
                      tone={c.enabled ? "green" : "gray"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="bp-btn bp-btn-secondary"
                      disabled={busyIso === c.iso}
                      onClick={() => void toggle(c)}
                    >
                      {c.enabled ? "Disable" : "Enable"}
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
