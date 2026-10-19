import { ResourcePage } from "@/components/data/ResourcePage";
import { auditResource } from "@/lib/resources";

export default function AuditPage() {
  return <ResourcePage {...auditResource} />;
}
