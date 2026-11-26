"use client";

import { useSyncExternalStore } from "react";
import { currentAdminIdentity, type AdminIdentity } from "@/lib/api";

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

/** Signed-in admin's email and role from the stored session (display only; the server enforces roles). */
export function useAdminIdentity(): AdminIdentity {
  const email = useSyncExternalStore(subscribe, () => currentAdminIdentity().email, () => null);
  const role = useSyncExternalStore(subscribe, () => currentAdminIdentity().role, () => null);
  return { email, role };
}
