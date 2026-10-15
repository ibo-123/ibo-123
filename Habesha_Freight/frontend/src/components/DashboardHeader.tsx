import { useAuth } from '../context/AuthContext';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  title: string;
}

export default function DashboardHeader({ onMenuClick, title }: DashboardHeaderProps) {
  const { user } = useAuth();
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-left">
        <button onClick={onMenuClick} className="dashboard-hamburger" aria-label="Toggle menu">
          ☰
        </button>
        <div>
          <h1 className="dashboard-header-title">{title}</h1>
          <p className="dashboard-header-date">{formattedDate}</p>
        </div>
      </div>

      <div className="dashboard-header-right">
        <div className="dashboard-avatar">
          {user?.full_name ? getInitials(user.full_name) : 'SB'}
        </div>
      </div>
    </header>
  );
}