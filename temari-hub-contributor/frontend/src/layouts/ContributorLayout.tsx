import { DashboardLayout, type NavItem } from './DashboardLayout';

const contributorNav: NavItem[] = [
  { to: 'dashboard', label: 'Dashboard', end: true, icon: 'dashboard' },
  { to: 'jobs', label: 'My Jobs', icon: 'briefcase' },
  { to: 'submissions', label: 'Submissions', icon: 'inbox' },
  { to: 'submit-resource', label: 'Topic Resource', icon: 'file' },
];

export function ContributorLayout() {
  return <DashboardLayout title="Contributor" navItems={contributorNav} />;
}
