import type { NavItem } from '../types/person2';

export const driverNav: NavItem[] = [
  { label: 'Dashboard', path: '/driver', icon: '📊' },
  {
    label: 'Requests',
    path: '/driver/requests',
    icon: '📋',
    children: [
      { label: 'Incoming Requests', path: '/driver/requests/incoming' },
      { label: 'Available Loads', path: '/driver/requests/loads' },
    ],
  },
  {
    label: 'Bids',
    path: '/driver/bids',
    icon: '💰',
    children: [{ label: 'Bid History', path: '/driver/bids/history' }],
  },
  {
    label: 'Deliveries',
    path: '/driver/deliveries',
    icon: '🚚',
    children: [
      { label: 'Active Delivery', path: '/driver/deliveries/active' },
      { label: 'Live Tracking', path: '/driver/deliveries/tracking' },
      { label: 'Delivery History', path: '/driver/deliveries/history' },
    ],
  },
  { label: 'Ratings', path: '/driver/ratings', icon: '⭐' },
  { label: 'Messages', path: '/driver/messages', icon: '💬' },
  {
    label: 'Profile',
    path: '/driver/profile',
    icon: '👤',
    children: [
      { label: 'Driver Info', path: '/driver/profile/info' },
      { label: 'License', path: '/driver/profile/license' },
      { label: 'Settings', path: '/driver/profile/settings' },
    ],
  },
];

export const companyNav: NavItem[] = [
  { label: 'Dashboard', path: '/company', icon: '📊' },
  {
    label: 'Fleet Requests',
    path: '/company/requests',
    icon: '📋',
    children: [{ label: 'Incoming Requests', path: '/company/requests/incoming' }],
  },
  {
    label: 'Deliveries',
    path: '/company/deliveries',
    icon: '🚚',
    children: [
      { label: 'Active Deliveries', path: '/company/deliveries/active' },
      { label: 'Completed Deliveries', path: '/company/deliveries/completed' },
    ],
  },
  {
    label: 'Fleet',
    path: '/company/fleet',
    icon: '🚛',
    children: [
      { label: 'Vehicles', path: '/company/fleet/vehicles' },
      { label: 'Add Vehicle', path: '/company/fleet/vehicles/add' },
    ],
  },
  {
    label: 'Drivers',
    path: '/company/drivers',
    icon: '👥',
    children: [{ label: 'Driver List', path: '/company/drivers/list' }],
  },
  { label: 'Ratings', path: '/company/ratings', icon: '⭐' },
  {
    label: 'Profile',
    path: '/company/profile',
    icon: '🏢',
    children: [{ label: 'Settings', path: '/company/profile/settings' }],
  },
];

export const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: '📊' },
  {
    label: 'Users',
    path: '/admin/users',
    icon: '👥',
    children: [{ label: 'User List', path: '/admin/users/list' }],
  },
  {
    label: 'Drivers',
    path: '/admin/drivers',
    icon: '🧑‍✈️',
    children: [{ label: 'Driver Verification', path: '/admin/drivers/verification' }],
  },
  {
    label: 'Companies',
    path: '/admin/companies',
    icon: '🏢',
    children: [{ label: 'Company Verification', path: '/admin/companies/verification' }],
  },
  {
    label: 'Vehicles',
    path: '/admin/vehicles',
    icon: '🚛',
    children: [{ label: 'Vehicle Verification', path: '/admin/vehicles/verification' }],
  },
  { label: 'Shipments', path: '/admin/shipments', icon: '📦' },
  { label: 'Payments', path: '/admin/payments', icon: '💳' },
  { label: 'Disputes', path: '/admin/disputes', icon: '⚖️' },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: '📝' },
  { label: 'Reports', path: '/admin/reports', icon: '📈' },
  { label: 'Settings', path: '/admin/settings', icon: '⚙️' },
];
