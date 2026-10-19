import { AdminShell } from "@/components/layout";
import { MockStoreProvider } from "@/data";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <MockStoreProvider>
      <AdminShell>{children}</AdminShell>
    </MockStoreProvider>
  );
}
