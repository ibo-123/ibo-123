import type { ReactNode } from "react";
import RoleGate from "@/components/auth/RoleGate";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { Role } from "@/types";

export function RolePage({
  role,
  title,
  description,
  actions,
  children,
}: {
  role: Role;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <RoleGate role={role}>
      <DashboardLayout
        role={role}
        title={title}
        {...(description ? { description } : {})}
        {...(actions ? { actions } : {})}
      >
        {children}
      </DashboardLayout>
    </RoleGate>
  );
}

export default RolePage;
