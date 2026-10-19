import { ResourcePage } from "@/components/data/ResourcePage";
import { channelsResource } from "@/lib/resources";

export default function ChannelsPage() {
  return <ResourcePage {...channelsResource} />;
}
