import { ResourcePage } from "@/components/data/ResourcePage";
import { reportsResource } from "@/lib/resources";

export default function ReportsPage() {
  return <ResourcePage {...reportsResource} />;
}
