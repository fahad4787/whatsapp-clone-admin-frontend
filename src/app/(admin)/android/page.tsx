import { Button, PageHeader } from "@/components/ui/primitives";
import { mockSettings } from "@/lib/mock";

const meta = [
  { label: "Latest version", value: mockSettings.latestAndroidVersion },
  { label: "Version code", value: String(mockSettings.latestAndroidVersionCode) },
  { label: "Download URL", value: mockSettings.downloadUrl, accent: true, span: true },
];

export default function AndroidPage() {
  return (
    <div>
      <PageHeader title="Android app" />
      <div className="bp-card p-5">
        <p className="mb-4 text-sm text-bp-muted">
          Upload a new APK to publish builds and QR install links for phones.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Version (optional)
            <input className="bp-input mt-1" placeholder="from APK" />
          </label>
          <label className="text-sm font-semibold">
            Notes (optional)
            <input className="bp-input mt-1" placeholder="What changed" />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary">Browse…</Button>
          <Button variant="primary" disabled>
            Upload APK
          </Button>
        </div>
        <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
          {meta.map((item) => (
            <div key={item.label} className={item.span ? "sm:col-span-2" : undefined}>
              <dt className="text-bp-muted">{item.label}</dt>
              <dd className={`font-semibold ${item.accent ? "text-bp-green" : ""}`}>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
