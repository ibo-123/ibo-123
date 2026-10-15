import { createFileRoute } from "@tanstack/react-router";
import RolePage from "@/components/layout/RolePage";
import ProfilePanel from "@/components/common/ProfilePanel";

export const Route = createFileRoute("/customer/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — HabeshaFreight" },
      { name: "description", content: "Update your HabeshaFreight contact details." },
      { property: "og:title", content: "Your profile — HabeshaFreight" },
      { property: "og:description", content: "Manage your customer account information." },
    ],
  }),
  component: () => (
    <RolePage role="customer" title="Profile" description="Keep your contact details up to date.">
      <ProfilePanel />
    </RolePage>
  ),
});
