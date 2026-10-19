import { ResourcePage } from "@/components/data";
import { auditSpec } from "@/features/resources";

export default function Page() {
  return <ResourcePage spec={auditSpec} />;
}
