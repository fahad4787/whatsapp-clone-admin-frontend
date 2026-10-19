import { ResourcePage } from "@/components/data";
import { callsSpec } from "@/features/resources";

export default function Page() {
  return <ResourcePage spec={callsSpec} />;
}
