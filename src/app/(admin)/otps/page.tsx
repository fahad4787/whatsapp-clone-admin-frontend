"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import { fetchAdminOtps, type AdminOtpItem } from "@/lib/api";

function tone(status: string): "green" | "yellow" | "red" | "gray" {
  if (status === "Used") return "green";
  if (status === "Pending") return "yellow";
  if (status === "Failed") return "red";
  return "gray";
}

export default function OtpsPage() {
  const [items, setItems] = useState<AdminOtpItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);
      if (!token) {
        setError("Sign in again to view OTP codes");
        setItems([]);
        return;
      }
      const data = await fetchAdminOtps(token);
      setItems(data.items);
    } catch {
      setError("Could not load OTP codes — check API / admin token");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="bp-page">
      <PageHeader
        title="OTP log"
        description="Dev codes from the shared API. Copy a code into the Android app to sign in."
        actions={
          <button type="button" className="bp-btn bp-btn-secondary" onClick={() => void load()}>
            Refresh
          </button>
        }
      />

      {error ? (
        <div className="mb-3 rounded-[var(--radius)] border border-[#f0d4d4] bg-[#fff7f7] px-4 py-2.5 text-sm">
          {error}
        </div>
      ) : null}

      <div className="bp-card overflow-hidden">
        <table className="bp-table">
          <thead>
            <tr>
              <th>Requested</th>
              <th>Phone</th>
              <th>Code</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Expires</th>
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
                  No OTP requests yet. Request one from the Android app.
                </td>
              </tr>
            ) : (
              items.map((o) => (
                <tr key={o.id}>
                  <td className="whitespace-nowrap">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="text-bp-green">{o.phone}</td>
                  <td className="font-mono text-sm">
                    {o.code ? (
                      <button
                        type="button"
                        className="text-left font-mono"
                        onClick={() =>
                          setRevealed((r) => ({ ...r, [o.id]: !r[o.id] }))
                        }
                        title="Click to reveal / hide"
                      >
                        {revealed[o.id] ? o.code : "••••••"}
                      </button>
                    ) : (
                      <span className="text-bp-muted">—</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge label={o.status} tone={tone(o.status)} />
                  </td>
                  <td>{o.attempts}</td>
                  <td className="whitespace-nowrap text-bp-muted">
                    {new Date(o.expires_at).toLocaleTimeString()}
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
