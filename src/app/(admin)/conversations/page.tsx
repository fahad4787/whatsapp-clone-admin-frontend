import { ResourcePage } from "@/components/data/ResourcePage";
import { conversationsResource } from "@/lib/resources";

export default function ConversationsPage() {
  return <ResourcePage {...conversationsResource} />;
}
