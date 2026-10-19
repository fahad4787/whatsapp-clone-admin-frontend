import { ResourcePage } from "@/components/data/ResourcePage";
import { adminsResource } from "@/lib/resources";

export default function AdminsPage() {
  return <ResourcePage {...adminsResource} />;
}
