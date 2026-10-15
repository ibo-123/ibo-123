// frontend/src/pages/participant/Profile.tsx
import { useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Code2,
  Shield,
  Calendar,
  Sparkles,
  Trophy,
  Award,
  Target,
  CheckCircle2,
  Zap,
  Pencil,
  Save,
  X,
  Camera,
  Copy,
  Check,
  Activity,
  Settings,
  BarChart3,
  TrendingUp,
  Medal,
  Clock,
  Globe,
  Languages,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Flame,
  ExternalLink,
} from "lucide-react";

type TabKey = "overview" | "stats" | "activity" | "settings";

const ROLE_CONFIG = {
  ADMIN: { label: "Administrator", color: "#FFD700", icon: Shield },
  PARTICIPANT: { label: "Competitor", color: "#64B5F6", icon: Target },
  JUDGE: { label: "Judge", color: "#7DD3FC", icon: Award },
} as const;

const MOCK_ACTIVITY = [
  {
    id: "a1",
    icon: <Trophy size={14} />,
    color: "#FFD700",
    text: "Joined tournament “Code Arena Spring”",
    time: "2 hours ago",
  },
  {
    id: "a2",
    icon: <CheckCircle2 size={14} />,
    color: "#22C55E",
    text: "Solved problem “Binary Search Basics”",
    time: "5 hours ago",
  },
  {
    id: "a3",
    icon: <Zap size={14} />,
    color: "#F59E0B",
    text: "Advanced to Group Stage in “Practice”",
    time: "1 day ago",
  },
  {
    id: "a4",
    icon: <Code2 size={14} />,
    color: "#64B5F6",
    text: "Linked Codeforces handle",
    time: "3 days ago",
  },
  {
    id: "a5",
    icon: <User size={14} />,
    color: "#7DD3FC",
    text: "Account created",
    time: "2 weeks ago",
  },
];

export const Profile = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("overview");

  // editable fields
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    username: user?.username ?? "",
    name: user?.name ?? "",
    email: user?.email ?? "",
    codeforcesUsername: user?.codeforcesUsername ?? "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const role =
    ROLE_CONFIG[(user?.role as keyof typeof ROLE_CONFIG) ?? "PARTICIPANT"] ??
    ROLE_CONFIG.PARTICIPANT;
  const RoleIcon = role.icon;

  const initials = (form.username || "?").charAt(0).toUpperCase();
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  /* ---- Completion % --------------------------------------------- */
  const completion = useMemo(() => {
    const fields = [form.username, form.name, form.email, form.codeforcesUsername, avatarPreview];
    const filled = fields.filter((f) => Boolean(f)).length;
    return Math.round((filled / fields.length) * 100);
  }, [form, avatarPreview]);

  /* ---- Handlers ------------------------------------------------- */
  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSave = () => {
    // TODO: call API to persist
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({
      username: user?.username ?? "",
      name: user?.name ?? "",
      email: user?.email ?? "",
      codeforcesUsername: user?.codeforcesUsername ?? "",
    });
    setEditing(false);
  };

  /* ---- Quick stats --------------------------------------------- */
  const quickStats = [
    {
      icon: Trophy,
      tone: "gold",
      value: 3,
      label: "Tournaments",
      delta: "+1",
    },
    {
      icon: Award,
      tone: "blue",
      value: 12,
      label: "Contests",
      delta: "+2",
    },
    {
      icon: CheckCircle2,
      tone: "green",
      value: 47,
      label: "Solved",
      delta: "+5",
    },
    {
      icon: Medal,
      tone: "purple",
      value: "#8",
      label: "Best Rank",
      delta: "↑3",
    },
  ];

  return (
    <div className="profile-page">
      {/* ================= HEADER ================= */}
      <div className="page-header">
        <div className="page-header-glow" />
        <div className="page-header-content">
          <div className="header-icon">
            <User size={24} />
          </div>
          <div>
            <h1>My Profile</h1>
            <p className="subtitle">Your account information and competitive identity</p>
          </div>
        </div>

        <div className="header-actions">
          {editing ? (
            <>
              <button type="button" className="btn-ghost" onClick={handleCancel}>
                <X size={16} />
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleSave}>
                <Save size={16} />
                Save Changes
              </button>
            </>
          ) : (
            <button type="button" className="btn-primary" onClick={() => setEditing(true)}>
              <Pencil size={16} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ================= HERO CARD ================= */}
      <div className="profile-hero">
        <div className="profile-hero-glow" />
        <div className="profile-hero-bg" />

        <div className="profile-hero-content">
          <div className="profile-avatar-wrap">
            <button
              type="button"
              className="profile-avatar"
              onClick={handleAvatarClick}
              aria-label="Change avatar"
            >
              {avatarPreview ? <img src={avatarPreview} alt="avatar" /> : <span>{initials}</span>}
              <div className="avatar-ring" />
              <div className="avatar-overlay">
                <Camera size={22} />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
            <div className="avatar-status" />
          </div>

          <div className="profile-identity">
            <h2 className="profile-name">{form.username || "—"}</h2>
            <p className="profile-email">{form.email || "—"}</p>

            <div className="profile-badges">
              <div
                className="role-badge"
                style={{ "--role-color": role.color } as React.CSSProperties}
              >
                <RoleIcon size={14} />
                <span>{role.label}</span>
              </div>

              {form.codeforcesUsername ? (
                <div className="codeforces-badge">
                  <CheckCircle2 size={14} />
                  <span>Codeforces Connected</span>
                </div>
              ) : (
                <div className="codeforces-badge not-connected">
                  <Zap size={14} />
                  <span>Codeforces Not Connected</span>
                </div>
              )}
            </div>

            {/* Completion bar */}
            <div className="completion">
              <div className="completion-top">
                <span>Profile completion</span>
                <strong>{completion}%</strong>
              </div>
              <div className="completion-track">
                <div className="completion-fill" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="profile-tabs">
        {(
          [
            { key: "overview", label: "Overview", icon: User },
            { key: "stats", label: "Stats", icon: BarChart3 },
            { key: "activity", label: "Activity", icon: Activity },
            { key: "settings", label: "Settings", icon: Settings },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              className={`profile-tab${tab === t.key ? " active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ================= TAB: OVERVIEW ================= */}
      {tab === "overview" && (
        <>
          <div className="details-card">
            <div className="details-header">
              <div className="details-header-icon">
                <Sparkles size={18} />
              </div>
              <div>
                <h3>Account Details</h3>
                <p>{editing ? "Click a field to edit" : "Your personal information"}</p>
              </div>
            </div>

            <div className="details-grid">
              {/* Username */}
              <DetailRow
                icon={User}
                label="Username"
                editing={editing}
                value={form.username}
                onChange={(v) => setForm({ ...form, username: v })}
              />
              {/* Name */}
              <DetailRow
                icon={User}
                label="Display Name"
                editing={editing}
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              {/* Email */}
              <DetailRow
                icon={Mail}
                label="Email"
                editing={editing}
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                onCopy={() => handleCopy("email", form.email)}
                copied={copied === "email"}
              />
              {/* Codeforces */}
              <DetailRow
                icon={Code2}
                label="Codeforces Handle"
                editing={editing}
                value={form.codeforcesUsername}
                placeholder="Not connected"
                onChange={(v) => setForm({ ...form, codeforcesUsername: v })}
                onCopy={
                  form.codeforcesUsername
                    ? () => handleCopy("cf", form.codeforcesUsername ?? "")
                    : undefined
                }
                copied={copied === "cf"}
                mono
                highlight={!!form.codeforcesUsername}
              />
              {/* Joined */}
              <DetailRow icon={Calendar} label="Member Since" value={joinedDate} readOnly />
              {/* Timezone */}
              <DetailRow
                icon={Globe}
                label="Timezone"
                value={Intl.DateTimeFormat().resolvedOptions().timeZone}
                readOnly
              />
            </div>
          </div>
        </>
      )}

      {/* ================= TAB: STATS ================= */}
      {tab === "stats" && (
        <>
          <div className="stats-row">
            {quickStats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`stat-tile tone-${s.tone}`}>
                  <div className="stat-tile-icon">
                    <Icon size={20} />
                  </div>
                  <div className="stat-tile-body">
                    <div className="stat-tile-value">{s.value}</div>
                    <div className="stat-tile-label">{s.label}</div>
                  </div>
                  <div className="stat-tile-delta">
                    <TrendingUp size={12} />
                    {s.delta}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="details-card">
            <div className="details-header">
              <div className="details-header-icon">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3>Performance</h3>
                <p>Your competitive breakdown</p>
              </div>
            </div>

            <div className="progress-list">
              {[
                { label: "Problems Solved", value: 47, max: 100 },
                { label: "Contests Attended", value: 12, max: 30 },
                { label: "Avg. Rank Percentile", value: 78, max: 100 },
                { label: "Streak (days)", value: 14, max: 30 },
              ].map((p) => (
                <div key={p.label} className="progress-item">
                  <div className="progress-head">
                    <span>{p.label}</span>
                    <strong>{p.value}</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${(p.value / p.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ================= TAB: ACTIVITY ================= */}
      {tab === "activity" && (
        <div className="details-card">
          <div className="details-header">
            <div className="details-header-icon">
              <Activity size={18} />
            </div>
            <div>
              <h3>Recent Activity</h3>
              <p>Your last actions on Code Arena</p>
            </div>
          </div>

          <ul className="activity-list">
            {MOCK_ACTIVITY.map((a) => (
              <li key={a.id} className="activity-item">
                <div
                  className="activity-icon"
                  style={{
                    color: a.color,
                    background: `${a.color}1A`,
                    borderColor: `${a.color}33`,
                  }}
                >
                  {a.icon}
                </div>
                <div className="activity-body">
                  <div className="activity-text">{a.text}</div>
                  <div className="activity-time">
                    <Clock size={11} /> {a.time}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ================= TAB: SETTINGS ================= */}
      {tab === "settings" && (
        <>
          <div className="details-card">
            <div className="details-header">
              <div className="details-header-icon">
                <Settings size={18} />
              </div>
              <div>
                <h3>Preferences</h3>
                <p>Customize your experience</p>
              </div>
            </div>

            <div className="settings-list">
              <SettingRow
                icon={<Globe size={16} />}
                label="Language"
                control={
                  <select defaultValue="en">
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                }
              />
              <SettingRow
                icon={<Languages size={16} />}
                label="Public profile"
                control={<Toggle defaultChecked />}
              />
              <SettingRow
                icon={<Zap size={16} />}
                label="Email notifications"
                control={<Toggle defaultChecked />}
              />
              <SettingRow
                icon={<Flame size={16} />}
                label="Show in leaderboards"
                control={<Toggle defaultChecked />}
              />
            </div>
          </div>

          {/* Danger zone */}
          <div className="danger-zone">
            <div className="danger-header">
              <AlertTriangle size={18} />
              <div>
                <h3>Danger Zone</h3>
                <p>These actions are irreversible — proceed with caution</p>
              </div>
            </div>

            <div className="danger-actions">
              <button type="button" className="danger-btn warning">
                <RotateCcw size={15} />
                Reset Stats
              </button>
              <button type="button" className="danger-btn">
                <Trash2 size={15} />
                Delete Account
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= STYLES ================= */}
      <style>{`
        .profile-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
        }

        /* ============================================
           HEADER
        ============================================ */
        .page-header {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          padding: 32px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(56, 189, 248, 0.06));
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }

        .page-header-glow {
          position: absolute;
          top: -50%;
          right: -10%;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(41, 121, 255, 0.15), transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .page-header-content {
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          z-index: 1;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        .header-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, #2979FF, #EAB308);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 12px 32px rgba(41, 121, 255, 0.3);
          flex-shrink: 0;
        }

        .page-header h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 4px;
          background: linear-gradient(135deg, #FFFFFF, #90CAF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-header .subtitle {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        /* Buttons */
        .btn-primary,
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.25s ease, box-shadow 0.25s ease,
            background-color 0.25s ease, border-color 0.25s ease;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2979FF, #1565C0);
          color: white;
          box-shadow: 0 8px 24px rgba(41, 121, 255, 0.35);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(41, 121, 255, 0.5);
        }

        .btn-ghost {
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-ghost:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        /* ============================================
           PROFILE HERO
        ============================================ */
        .profile-hero {
          position: relative;
          padding: 40px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.08), rgba(56, 189, 248, 0.08));
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .profile-hero-glow {
          position: absolute;
          top: -30%;
          left: 30%;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(41, 121, 255, 0.2), transparent 70%);
          filter: blur(80px);
          pointer-events: none;
        }

        .profile-hero-bg {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
          pointer-events: none;
        }

        .profile-hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        /* Avatar */
        .profile-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .profile-avatar {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 32px;
          background: linear-gradient(135deg, #2979FF, #EAB308);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 48px;
          font-weight: 800;
          box-shadow: 0 20px 60px rgba(41, 121, 255, 0.4);
          overflow: hidden;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-ring {
          position: absolute;
          inset: 0;
          border-radius: 32px;
          background: linear-gradient(135deg, rgba(255,255,255,0.25), transparent 40%);
          pointer-events: none;
        }

        .avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.25s ease;
          color: white;
        }

        .profile-avatar:hover .avatar-overlay { opacity: 1; }

        .avatar-status {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #22C55E;
          border: 4px solid #080A14;
          box-shadow: 0 0 16px rgba(76, 175, 80, 0.6);
        }

        /* Identity */
        .profile-identity {
          flex: 1;
          min-width: 240px;
        }

        .profile-name {
          font-size: 32px;
          font-weight: 800;
          color: white;
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }

        .profile-email {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0 0 16px;
        }

        .profile-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }

        .role-badge,
        .codeforces-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .role-badge {
          background: color-mix(in srgb, var(--role-color) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--role-color) 30%, transparent);
          color: var(--role-color);
        }

        .codeforces-badge {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.25);
          color: #22C55E;
        }

        .codeforces-badge.not-connected {
          background: rgba(255, 152, 0, 0.1);
          border-color: rgba(255, 152, 0, 0.25);
          color: #F59E0B;
        }

        /* Completion */
        .completion {
          max-width: 340px;
        }

        .completion-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 600;
          margin-bottom: 6px;
        }

        .completion-top strong {
          color: white;
          font-size: 13px;
        }

        .completion-track {
          height: 6px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }

        .completion-fill {
          height: 100%;
          background: linear-gradient(90deg, #2979FF, #EAB308);
          border-radius: 100px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 16px rgba(41, 121, 255, 0.6);
        }

        /* ============================================
           TABS
        ============================================ */
        .profile-tabs {
          display: flex;
          gap: 6px;
          padding: 6px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow-x: auto;
        }

        .profile-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.55);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .profile-tab:hover { color: white; background: rgba(255, 255, 255, 0.04); }

        .profile-tab.active {
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.2), rgba(56, 189, 248, 0.2));
          color: white;
          border: 1px solid rgba(100, 181, 246, 0.3);
        }

        /* ============================================
           DETAILS CARD
        ============================================ */
        .details-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
        }

        .details-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 24px 28px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.01);
        }

        .details-header-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFD700;
          flex-shrink: 0;
        }

        .details-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin: 0 0 2px;
        }

        .details-header p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: rgba(255, 255, 255, 0.04);
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px 28px;
          background: rgba(10, 12, 22, 0.6);
          transition: background 0.25s ease;
        }

        .detail-item:hover { background: rgba(41, 121, 255, 0.04); }

        .detail-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(41, 121, 255, 0.08);
          border: 1px solid rgba(41, 121, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64B5F6;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }

        .detail-item:hover .detail-icon {
          transform: scale(1.05);
          background: rgba(41, 121, 255, 0.15);
        }

        .detail-content {
          min-width: 0;
          flex: 1;
        }

        .detail-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        .detail-value {
          font-size: 15px;
          font-weight: 700;
          color: white;
          word-break: break-word;
        }

        .detail-value.muted {
          color: rgba(255, 255, 255, 0.35);
          font-weight: 500;
          font-style: italic;
        }

        .detail-value.highlight {
          font-family: "Fira Code", "JetBrains Mono", monospace;
          color: #64B5F6;
          font-size: 14px;
        }

        .detail-input {
          width: 100%;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }

        .detail-input:focus {
          border-color: rgba(100, 181, 246, 0.5);
          background: rgba(255, 255, 255, 0.06);
        }

        .detail-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
          font-style: italic;
        }

        .copy-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
        }

        .copy-btn:hover {
          color: #64B5F6;
          border-color: rgba(100, 181, 246, 0.3);
          background: rgba(41, 121, 255, 0.12);
        }

        .copy-btn.copied {
          color: #22C55E;
          border-color: rgba(76, 175, 80, 0.3);
          background: rgba(76, 175, 80, 0.12);
        }

        /* ============================================
           STATS
        ============================================ */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .stat-tile {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: transform 0.3s ease, border-color 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-tile:hover { transform: translateY(-3px); }

        .stat-tile-icon {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tone-gold .stat-tile-icon { background: rgba(255, 215, 0, 0.12); color: #FFD700; border: 1px solid rgba(255, 215, 0, 0.2); }
        .tone-blue .stat-tile-icon { background: rgba(41, 121, 255, 0.12); color: #64B5F6; border: 1px solid rgba(41, 121, 255, 0.2); }
        .tone-green .stat-tile-icon { background: rgba(76, 175, 80, 0.12); color: #22C55E; border: 1px solid rgba(76, 175, 80, 0.2); }
        .tone-purple .stat-tile-icon { background: rgba(56, 189, 248, 0.12); color: #7DD3FC; border: 1px solid rgba(56, 189, 248, 0.2); }

        .stat-tile-body { flex: 1; min-width: 0; }

        .stat-tile-value {
          font-size: 22px;
          font-weight: 800;
          color: white;
          line-height: 1;
        }

        .stat-tile-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.7px;
          margin-top: 5px;
        }

        .stat-tile-delta {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 3px 8px;
          border-radius: 100px;
          background: rgba(76, 175, 80, 0.12);
          color: #22C55E;
          font-size: 11px;
          font-weight: 800;
        }

        .progress-list {
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .progress-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          margin-bottom: 8px;
        }

        .progress-head strong { color: white; font-size: 14px; }

        .progress-track {
          height: 8px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.05);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 100px;
          background: linear-gradient(90deg, #2979FF, #EAB308);
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 14px rgba(41, 121, 255, 0.4);
        }

        /* ============================================
           ACTIVITY
        ============================================ */
        .activity-list {
          list-style: none;
          margin: 0;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 14px;
          transition: background-color 0.2s ease;
        }

        .activity-item:hover { background: rgba(255, 255, 255, 0.03); }

        .activity-icon {
          width: 36px;
          height: 36px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
          flex-shrink: 0;
        }

        .activity-body { flex: 1; min-width: 0; }

        .activity-text {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 3px;
        }

        .activity-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        /* ============================================
           SETTINGS
        ============================================ */
        .settings-list {
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
        }

        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px;
          border-radius: 12px;
          transition: background-color 0.2s ease;
        }

        .setting-row:hover { background: rgba(255, 255, 255, 0.03); }

        .setting-label {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
        }

        .setting-label svg { color: #64B5F6; }

        .setting-row select {
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          cursor: pointer;
        }

        /* Toggle */
        .toggle {
          position: relative;
          width: 44px;
          height: 24px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          cursor: pointer;
          transition: background-color 0.25s ease, border-color 0.25s ease;
          padding: 0;
        }

        .toggle::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          transition: transform 0.25s ease, background-color 0.25s ease;
        }

        .toggle.on {
          background: linear-gradient(135deg, #2979FF, #1565C0);
          border-color: rgba(41, 121, 255, 0.5);
        }

        .toggle.on::after {
          transform: translateX(20px);
          background: white;
        }

        /* Danger zone */
        .danger-zone {
          padding: 24px 28px;
          border-radius: 20px;
          background: rgba(239, 83, 80, 0.04);
          border: 1px solid rgba(239, 83, 80, 0.2);
        }

        .danger-header {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #EF5350;
          margin-bottom: 18px;
        }

        .danger-header h3 {
          font-size: 15px;
          font-weight: 800;
          color: #EF5350;
          margin: 0 0 2px;
        }

        .danger-header p {
          font-size: 12px;
          color: rgba(239, 83, 80, 0.65);
          margin: 0;
        }

        .danger-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .danger-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 11px;
          background: rgba(239, 83, 80, 0.15);
          color: #EF5350;
          border: 1px solid rgba(239, 83, 80, 0.3);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }

        .danger-btn:hover {
          background: rgba(239, 83, 80, 0.25);
          transform: translateY(-2px);
        }

        .danger-btn.warning {
          background: rgba(255, 152, 0, 0.14);
          color: #F59E0B;
          border-color: rgba(255, 152, 0, 0.3);
        }

        .danger-btn.warning:hover { background: rgba(255, 152, 0, 0.24); }

        /* ============================================
           RESPONSIVE
        ============================================ */
        @media (max-width: 900px) {
          .profile-hero-content {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .profile-identity { min-width: 0; }

          .profile-badges { justify-content: center; }

          .completion { margin: 0 auto; }

          .stats-row { grid-template-columns: repeat(2, 1fr); }

          .details-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .page-header { padding: 24px; }
          .page-header h1 { font-size: 22px; }
          .header-icon { width: 48px; height: 48px; }

          .page-header-content { flex-wrap: wrap; }
          .header-actions { width: 100%; }
          .header-actions .btn-primary,
          .header-actions .btn-ghost { flex: 1; justify-content: center; }

          .profile-hero { padding: 28px 24px; }

          .profile-avatar {
            width: 96px;
            height: 96px;
            font-size: 38px;
            border-radius: 26px;
          }

          .profile-name { font-size: 24px; }

          .stats-row { grid-template-columns: 1fr; }

          .detail-item { padding: 20px; }

          .details-grid { grid-template-columns: 1fr; }
        }

        @media (prefers-reduced-motion: reduce) {
          .stat-tile:hover,
          .btn-primary:hover,
          .btn-ghost:hover,
          .danger-btn:hover {
            transform: none;
          }

          .completion-fill,
          .progress-fill,
          .toggle,
          .toggle::after { transition: none; }
        }
      `}</style>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Helper components                                                   */
/* ------------------------------------------------------------------ */

interface DetailRowProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
  editing?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  onChange?: (v: string) => void;
  onCopy?: () => void;
  copied?: boolean;
  mono?: boolean;
  highlight?: boolean;
}

const DetailRow = ({
  icon: Icon,
  label,
  value,
  editing,
  readOnly,
  placeholder,
  onChange,
  onCopy,
  copied,
  mono,
  highlight,
}: DetailRowProps) => {
  const muted = !value;

  return (
    <div className="detail-item">
      <div className="detail-icon">
        <Icon size={18} />
      </div>
      <div className="detail-content">
        <div className="detail-label">{label}</div>
        {editing && !readOnly ? (
          <input
            className="detail-input"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ) : (
          <div
            className={`detail-value${muted ? " muted" : ""}${highlight ? " highlight" : ""}`}
            style={mono && !highlight ? { fontFamily: "monospace" } : undefined}
          >
            {value || placeholder || "—"}
          </div>
        )}
      </div>
      {onCopy && value && (
        <button
          type="button"
          className={`copy-btn${copied ? " copied" : ""}`}
          onClick={onCopy}
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      )}
    </div>
  );
};

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  control: React.ReactNode;
}

const SettingRow = ({ icon, label, control }: SettingRowProps) => (
  <div className="setting-row">
    <span className="setting-label">
      {icon}
      {label}
    </span>
    {control}
  </div>
);

interface ToggleProps {
  defaultChecked?: boolean;
}

const Toggle = ({ defaultChecked }: ToggleProps) => {
  const [on, setOn] = useState(Boolean(defaultChecked));
  return (
    <button
      type="button"
      className={`toggle${on ? " on" : ""}`}
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
      role="switch"
    />
  );
};

export default Profile;
