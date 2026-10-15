import { DashboardLayout, type NavItem } from './DashboardLayout';

const adminNav: NavItem[] = [
  { to: 'dashboard', label: 'Dashboard', end: true, icon: 'dashboard' },
  { to: 'contributors', label: 'Contributors', icon: 'users' },
  { to: 'jobs', label: 'Jobs', icon: 'briefcase' },
  { to: 'templates', label: 'Templates', icon: 'layers' },
  { to: 'submissions', label: 'Submissions', icon: 'inbox' },
  { to: 'content', label: 'Content', icon: 'check' },
  { to: 'activity', label: 'Activity', icon: 'activity' },
];

export function AdminLayout() {
  return <DashboardLayout title="Admin" navItems={adminNav} />;
}
