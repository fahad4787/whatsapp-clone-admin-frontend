import { Button, FormSection, PageHeader } from "@/components/ui/primitives";
import { mockSettings } from "@/lib/mock";
import { renderSettingsField, settingsSections } from "@/lib/settings";

export default function SettingsPage() {
  return (
    <div className="pb-20">
      <PageHeader title="Settings" />
      {settingsSections.map((section) => (
        <FormSection key={section.title} title={section.title}>
          {section.fields.map((field) => renderSettingsField(field, mockSettings))}
        </FormSection>
      ))}
      <div className="fixed bottom-0 left-[240px] right-0 flex items-center justify-between border-t border-bp-border bg-white px-5 py-3">
        <span className="text-sm text-bp-muted">No changes</span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled>
            Cancel
          </Button>
          <Button variant="primary" disabled>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
