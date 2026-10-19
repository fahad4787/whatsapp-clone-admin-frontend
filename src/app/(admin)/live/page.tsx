import { ResourcePage } from "@/components/data/ResourcePage";
import { liveResource } from "@/lib/resources";

export default function LivePage() {
  return <ResourcePage {...liveResource} />;
}
