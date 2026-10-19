import { ResourcePage } from "@/components/data/ResourcePage";
import { stickersResource } from "@/lib/resources";

export default function StickersPage() {
  return <ResourcePage {...stickersResource} />;
}
