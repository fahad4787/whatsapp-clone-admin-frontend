import { ResourcePage } from "@/components/data/ResourcePage";
import { callsResource } from "@/lib/resources";

export default function CallsPage() {
  return <ResourcePage {...callsResource} />;
}
