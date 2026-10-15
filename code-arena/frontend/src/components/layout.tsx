import { Link, NavLink, Outlet } from 'react-router-dom'
import { Activity, Brackets, Code2, LayoutDashboard, LogOut, Trophy, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const Navbar = () => {
  const { user, logout } = useAuth()
  return <header className="navbar"><Link className="brand" to="/"><span className="brand-mark">&lt;/&gt;</span><span>CODE ARENA <em>2026</em></span></Link><nav><NavLink to="/">Home</NavLink><NavLink to="/bracket">Bracket</NavLink><NavLink to="/leaderboard">Leaderboard</NavLink><NavLink to="/live"><i className="live-dot" />Live</NavLink></nav><div className="nav-actions">{user ? <><span className="user-label">{user.username}</span><button className="text-button" onClick={logout}>Logout</button></> : <Link className="button" to="/login">Login</Link>}</div></header>
}
const links = [{ to: '/dashboard', label: 'Overview', icon: LayoutDashboard }, { to: '/bracket', label: 'My Group', icon: Users }, { to: '/live', label: 'Live Contest', icon: Activity }, { to: '/leaderboard', label: 'Leaderboard', icon: Trophy }]
export const DashboardLayout = ({ admin = false }: { admin?: boolean }) => {
  const { user, logout } = useAuth(); const nav = admin ? [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }, { to: '/admin/participants', label: 'Participants', icon: Users }, { to: '/admin/groups', label: 'Groups & Seeding', icon: Brackets }, { to: '/admin/contests', label: 'Codeforces Contests', icon: Code2 }, { to: '/admin/results', label: 'Results', icon: Activity }, { to: '/admin/bracket', label: 'Tournament Seeding', icon: Trophy }, { to: '/admin/logs', label: 'System Logs', icon: Activity }] : links
  return <div className="app-shell"><aside className="sidebar"><Link className="brand" to="/"><span className="brand-mark">&lt;/&gt;</span> ARENA</Link><div className="profile-mini"><div className="avatar">{user?.username?.slice(0, 1).toUpperCase()}</div><div><strong>{user?.username}</strong><small>{admin ? 'Tournament Administrator' : 'Verified Participant'}</small></div></div><div className="side-nav">{nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/admin' || to === '/dashboard'}><Icon size={18} />{label}</NavLink>)}</div><button className="logout" onClick={logout}><LogOut size={18} />Logout</button></aside><main className="dashboard-main"><Outlet /></main></div>
}
