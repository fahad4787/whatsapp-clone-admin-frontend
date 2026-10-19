import { ResourcePage } from "@/components/data";
import { liveSpec } from "@/features/resources";

export default function Page() {
  return <ResourcePage spec={liveSpec} />;
}
