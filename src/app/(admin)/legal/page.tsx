import { PageHeader } from "@/components/ui/primitives";

const docs = [
  { title: "Privacy policy", value: "Privacy policy content…" },
  { title: "Terms of service", value: "Terms of service content…" },
];

export default function LegalPage() {
  return (
    <div>
      <PageHeader title="Legal" />
      <div className="grid gap-4 lg:grid-cols-2">
        {docs.map((doc) => (
          <div key={doc.title} className="bp-card p-4">
            <h2 className="mb-2 font-semibold">{doc.title}</h2>
            <textarea className="bp-input min-h-48" defaultValue={doc.value} />
          </div>
        ))}
      </div>
    </div>
  );
}
