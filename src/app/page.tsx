import { ShakeDiscovery } from "@/components/ShakeDiscovery";
import { isDemoMode } from "@/lib/demoMode";

export default function HomePage() {
  return <ShakeDiscovery demoMode={isDemoMode()} />;
}
