import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type DashboardSection = 'dashboard' | 'find-truck' | 'requests' | 'deliveries' | 'history' | 'ratings' | 'profile';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

export default function Sidebar({ isOpen, onClose, activeSection, onSectionChange }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems: { id: DashboardSection; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'find-truck', label: 'Find Truck', icon: '🔍' },
    { id: 'requests', label: 'Requests', icon: '📋' },
    { id: 'deliveries', label: 'Deliveries', icon: '🚚' },
    { id: 'history', label: 'History', icon: '🗂️' },
    { id: 'ratings', label: 'Ratings', icon: '⭐' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const handleNavClick = (section: DashboardSection) => {
    onSectionChange(section);
    onClose();
    if (section === 'profile') {
      navigate('/profile');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🚚</span>
          <span className="sidebar-brand-habesha">Habesha</span>
          <span className="sidebar-brand-freight">Freight</span>
        </div>
        <p className="sidebar-account-type">Shipper Account</p>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
              type="button"
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              {user?.full_name?.charAt(0) || 'S'}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user?.full_name || 'Sara Bekele'}</span>
              <span className="sidebar-user-role">Shipper</span>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout-btn" type="button">
            ← Log Out
          </button>
        </div>
      </aside>
    </>
  );
}