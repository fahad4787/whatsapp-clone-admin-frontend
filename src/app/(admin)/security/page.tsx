import { NumberInput, PageHeader } from "@/components/ui/primitives";

const toggles = [
  { label: "Require 2FA for admins", defaultChecked: false },
  { label: "Lock account after failed logins", defaultChecked: true },
];

export default function SecurityPage() {
  return (
    <div>
      <PageHeader title="Security" />
      <div className="bp-card space-y-4 p-5">
        {toggles.map((t) => (
          <label key={t.label} className="flex items-center justify-between gap-4 text-sm font-semibold">
            {t.label}
            <input type="checkbox" defaultChecked={t.defaultChecked} className="accent-bp-green" />
          </label>
        ))}
        <label className="block text-sm font-semibold">
          Session lifetime (hours)
          <NumberInput className="bp-input mt-1 max-w-xs" defaultValue={12} />
        </label>
      </div>
    </div>
  );
}
