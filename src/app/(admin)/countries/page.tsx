import { ResourcePage } from "@/components/data/ResourcePage";
import { countriesResource } from "@/lib/resources";

export default function CountriesPage() {
  return <ResourcePage {...countriesResource} />;
}
