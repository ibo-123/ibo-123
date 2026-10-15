import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'dashboard'
  | 'users'
  | 'briefcase'
  | 'layers'
  | 'inbox'
  | 'check'
  | 'activity'
  | 'file'
  | 'bell'
  | 'logout'
  | 'menu'
  | 'alert'
  | 'folder'
  | 'clock'
  | 'plus';

type IconProps = SVGProps<SVGSVGElement> & { name: IconName };

export function Icon({ name, className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

export function BrandMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0f172a" />
      <path d="M8 8.5h16v3.2h-6.2V23.5h-3.6V11.7H8V8.5z" fill="#fff" />
    </svg>
  );
}

const paths: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  users: (
    <>
      <path d="M16 11a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0Z" />
      <path d="M3.5 19.5c.6-2.6 3-4 6-4s5.4 1.4 6 4" />
      <path d="M17 11.2a3 3 0 0 1 0-5.7" />
      <path d="M18.2 15.6c2.2.3 3.9 1.6 4.3 3.9" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
      <path d="M3 12h18" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5 3.5 8 12 12.5 20.5 8 12 3.5Z" />
      <path d="M3.5 12 12 16.5 20.5 12" />
      <path d="M3.5 16 12 20.5 20.5 16" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 13.5 6 5.5h12l2.5 8" />
      <path d="M3.5 13.5h4.2a2 2 0 0 0 1.8 1.2h5a2 2 0 0 0 1.8-1.2h4.2V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19v-5.5Z" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </>
  ),
  activity: <path d="M3 12h4l2.2-5 3.6 10L15.2 12H21" />,
  file: (
    <>
      <path d="M7 3.5h7l5 5V20.5H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V9h5.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16.5h12l-1.2-2V10a4.8 4.8 0 0 0-9.6 0v4.5L6 16.5Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </>
  ),
  logout: (
    <>
      <path d="M10 5.5H6.5A1.5 1.5 0 0 0 5 7v10a1.5 1.5 0 0 0 1.5 1.5H10" />
      <path d="M13 8.5 17.5 12 13 15.5" />
      <path d="M17 12H9" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.5 3.8 19h16.4L12 4.5Z" />
      <path d="M12 10v4" />
      <path d="M12 16.5h.01" />
    </>
  ),
  folder: (
    <>
      <path d="M3.5 8.5V7A1.5 1.5 0 0 1 5 5.5h4l2 2h8A1.5 1.5 0 0 1 20.5 9v9A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18V8.5Z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 8v4.5l3 2" />
    </>
  ),
  plus: (
    <>
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </>
  ),
};
