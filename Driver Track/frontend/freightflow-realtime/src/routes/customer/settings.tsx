import { createFileRoute } from "@tanstack/react-router";
import RolePage from "@/components/layout/RolePage";
import SettingsPanel from "@/components/common/SettingsPanel";

export const Route = createFileRoute("/customer/settings")({
  head: () => ({
    meta: [
      { title: "Settings — HabeshaFreight" },
      { name: "description", content: "Theme, notification and connection settings." },
      { property: "og:title", content: "Settings — HabeshaFreight" },
      { property: "og:description", content: "Configure your HabeshaFreight experience." },
    ],
  }),
  component: () => (
    <RolePage role="customer" title="Settings" description="Appearance, alerts and connectivity.">
      <SettingsPanel />
    </RolePage>
  ),
});
