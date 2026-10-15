import {
  Activity,
  BarChart3,
  Bell,
  ClipboardList,
  FileBarChart,
  Gauge,
  History,
  Map,
  MapPin,
  Navigation,
  Settings,
  Truck,
  UserCircle,
  Users,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  mobile?: boolean;
}

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  customer: [
    { label: "Overview", to: "/customer", icon: Gauge, mobile: true },
    { label: "Live tracking", to: "/customer/track", icon: MapPin, mobile: true },
    { label: "My trips", to: "/customer/trips", icon: ClipboardList, mobile: true },
    { label: "History", to: "/customer/history", icon: History, mobile: true },
    { label: "Profile", to: "/customer/profile", icon: UserCircle },
    { label: "Settings", to: "/customer/settings", icon: Settings },
  ],
  driver: [
    { label: "Dashboard", to: "/driver", icon: Gauge, mobile: true },
    { label: "Assigned trips", to: "/driver/trips", icon: ClipboardList, mobile: true },
    { label: "Active trip", to: "/driver/active-trip", icon: Navigation, mobile: true },
    { label: "History", to: "/driver/history", icon: History, mobile: true },
    { label: "Profile", to: "/driver/profile", icon: UserCircle },
    { label: "Settings", to: "/driver/settings", icon: Settings },
  ],
  dispatcher: [
    { label: "Control room", to: "/dispatcher", icon: Gauge, mobile: true },
    { label: "Trips", to: "/dispatcher/trips", icon: ClipboardList, mobile: true },
    { label: "Drivers", to: "/dispatcher/drivers", icon: Truck, mobile: true },
    { label: "Live map", to: "/dispatcher/map", icon: Map, mobile: true },
    { label: "Assignments", to: "/dispatcher/assignments", icon: UsersRound },
    { label: "Alerts", to: "/dispatcher/alerts", icon: Bell },
    { label: "Reports", to: "/dispatcher/reports", icon: FileBarChart },
  ],
  admin: [
    { label: "System", to: "/admin", icon: Gauge, mobile: true },
    { label: "Users", to: "/admin/users", icon: Users, mobile: true },
    { label: "Drivers", to: "/admin/drivers", icon: Truck, mobile: true },
    { label: "Customers", to: "/admin/customers", icon: UsersRound },
    { label: "Trips", to: "/admin/trips", icon: ClipboardList, mobile: true },
    { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
    { label: "Reports", to: "/admin/reports", icon: FileBarChart },
    { label: "Activity", to: "/admin/activity", icon: Activity },
    { label: "Settings", to: "/admin/settings", icon: Settings },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  customer: "Customer",
  driver: "Driver",
  dispatcher: "Dispatcher",
  admin: "Administrator",
};
