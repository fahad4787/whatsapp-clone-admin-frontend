import { Button, PageHeader } from "@/components/ui/primitives";

export default function FirewallPage() {
  return (
    <div>
      <PageHeader title="IP access" />
      <div className="bp-card p-5">
        <p className="mb-4 text-sm text-bp-muted">
          Restrict admin sign-in to allowlisted networks. Leave empty to allow all IPs.
        </p>
        <label className="block text-sm font-semibold">
          Allowlist (CIDR, one per line)
          <textarea className="bp-input mt-1 min-h-32 font-mono text-sm" placeholder="203.0.113.0/24" />
        </label>
        <Button variant="primary" className="mt-4">
          Save allowlist
        </Button>
      </div>
    </div>
  );
}
