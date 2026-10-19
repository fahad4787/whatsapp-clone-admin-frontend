import { ResourcePage } from "@/components/data/ResourcePage";
import { usersResource } from "@/lib/resources";

export default function UsersPage() {
  return <ResourcePage {...usersResource} />;
}
