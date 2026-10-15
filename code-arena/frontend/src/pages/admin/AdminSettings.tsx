import { useEffect, useState, useCallback } from "react";
import {
  User,
  Mail,
  Lock,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  Shield,
  Users,
  Trophy,
  Eye,
  EyeOff,
  Sparkles,
  Crown,
  Key,
} from "lucide-react";
import { LoadingState, ErrorState } from "../../components/ui";
import { adminApi } from "../../services/adminApi";
import { useAuth } from "../../context/AuthContext";

interface AdminSettingsData {
  name: string;
  email: string;
  username: string;
  role: string;
  tournamentDefaults: {
    maxParticipants: number;
    numberOfGroups: number;
    participantsPerGroup: number;
    qualifiersPerGroup: number;
    playoffFormat: string;
  };
}

// ---- Design tokens ---------------------------------------------------

const c = {
  bg: {
    card: "rgba(255, 255, 255, 0.02)",
    header: "rgba(255, 255, 255, 0.04)",
    input: "rgba(255, 255, 255, 0.04)",
    inputHover: "rgba(255, 255, 255, 0.06)",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.06)",
    mid: "rgba(255, 255, 255, 0.1)",
    input: "rgba(255, 255, 255, 0.08)",
  },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.7)",
    muted: "rgba(255, 255, 255, 0.5)",
    faint: "rgba(255, 255, 255, 0.3)",
  },
  accent: {
    blue: "#64B5F6",
    green: "#22C55E",
    red: "#EF5350",
    gold: "#FFD700",
    purple: "#7DD3FC",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
  },
} as const;

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: c.radius.sm,
  background: c.bg.input,
  border: `1px solid ${c.border.input}`,
  color: c.text.primary,
  fontSize: "14px",
  outline: "none",
  transition: "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export const AdminSettings = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [settings, setSettings] = useState<AdminSettingsData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [defaults, setDefaults] = useState({
    maxParticipants: 20,
    numberOfGroups: 4,
    participantsPerGroup: 5,
    qualifiersPerGroup: 2,
    playoffFormat: "SINGLE_ELIMINATION",
  });

  // ---- Load ----------------------------------------------------------
  const loadSettings = useCallback(async () => {
    try {
      setError("");
      const response = await adminApi.getSettings();
      if (response.success && response.settings) {
        const data = response.settings;
        setSettings(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          password: "",
          confirmPassword: "",
        });
        if (data.tournamentDefaults) {
          setDefaults({
            maxParticipants: data.tournamentDefaults.maxParticipants ?? 20,
            numberOfGroups: data.tournamentDefaults.numberOfGroups ?? 4,
            participantsPerGroup: data.tournamentDefaults.participantsPerGroup ?? 5,
            qualifiersPerGroup: data.tournamentDefaults.qualifiersPerGroup ?? 2,
            playoffFormat: data.tournamentDefaults.playoffFormat || "SINGLE_ELIMINATION",
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    loadSettings().finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [loadSettings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  };

  // ---- Form handlers -------------------------------------------------
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleDefaultsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDefaults((prev) => ({
      ...prev,
      [name]: name === "playoffFormat" ? value : Number(value),
    }));
    setError("");
    setSuccess("");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const updateData: { name?: string; email?: string; password?: string } = {};
    if (formData.name !== settings?.name) updateData.name = formData.name;
    if (formData.email !== settings?.email) updateData.email = formData.email;
    if (formData.password) updateData.password = formData.password;

    if (Object.keys(updateData).length === 0) {
      setError("No changes to save");
      return;
    }

    setSavingProfile(true);
    try {
      await adminApi.updateSettings(updateData);
      await refreshUser();
      setSuccess("Profile updated successfully");
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDefaultsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingDefaults(true);
    try {
      await adminApi.updateSettings({ tournamentDefaults: defaults });
      setSuccess("Tournament defaults updated successfully");
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update defaults");
    } finally {
      setSavingDefaults(false);
    }
  };

  // ---- Loading / error -----------------------------------------------
  if (loading) return <LoadingState label="Loading admin settings..." />;
  if (error && !settings) return <ErrorState error={error} />;

  // const initials = (user?.name || user?.username || "A")
  //   .split(" ")
  //   .map((w) => w.charAt(0))
  //   .slice(0, 2)
  //   .join("")
  //   .toUpperCase();

  return (
    <div style={{ padding: "24px 0", maxWidth: "1200px", margin: "0 auto" }}>
      {/* ---- Header ---- */}
      <div
        style={{
          position: "relative",
          padding: "28px 32px",
          borderRadius: c.radius.lg,
          background: "linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(56, 189, 248, 0.06))",
          border: `1px solid ${c.border.subtle}`,
          overflow: "hidden",
          marginBottom: "20px",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-50%",
            right: "-10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 215, 0, 0.1), transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: c.radius.md,
                background: "linear-gradient(135deg, #FFD700, #FFA000)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 12px 32px rgba(255, 215, 0, 0.3)",
                flexShrink: 0,
                fontSize: "18px",
                fontWeight: 800,
                letterSpacing: "-0.5px",
              }}
            >
              <Settings size={24} />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1.2px",
                    color: "rgba(255, 215, 0, 0.85)",
                  }}
                >
                  Control Center
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: "rgba(255, 215, 0, 0.12)",
                    border: "1px solid rgba(255, 215, 0, 0.25)",
                    color: c.accent.gold,
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  <Shield size={10} />
                  {user?.role || "ADMIN"}
                </span>
              </div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "-0.01em",
                  background: "linear-gradient(135deg, #FFFFFF, #FFD700)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Admin Settings
              </h1>
              <div
                style={{
                  fontSize: "13px",
                  color: c.text.muted,
                  marginTop: "2px",
                }}
              >
                Manage your profile and tournament defaults
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: c.radius.md,
              background: "rgba(255, 255, 255, 0.04)",
              border: `1px solid ${c.border.mid}`,
              color: c.text.primary,
              fontSize: "13px",
              fontWeight: 600,
              cursor: refreshing ? "wait" : "pointer",
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: refreshing ? "spin 0.9s linear infinite" : "none",
              }}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ---- Account stat row ---- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          icon={<Crown size={18} />}
          label="Signed in as"
          value={settings?.name || user?.name || "Admin"}
          color={c.accent.gold}
        />
        <StatCard
          icon={<Mail size={18} />}
          label="Email"
          value={settings?.email || user?.email || "—"}
          color={c.accent.blue}
        />
        <StatCard
          icon={<Shield size={18} />}
          label="Role"
          value={settings?.role || user?.role || "ADMIN"}
          color={c.accent.purple}
        />
        <StatCard
          icon={<CheckCircle size={18} />}
          label="Status"
          value="Active"
          color={c.accent.green}
        />
      </div>

      {/* ---- Alerts ---- */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 18px",
            borderRadius: c.radius.md,
            background: "rgba(239, 83, 80, 0.1)",
            border: "1px solid rgba(239, 83, 80, 0.25)",
            color: c.accent.red,
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 18px",
            borderRadius: c.radius.md,
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.25)",
            color: c.accent.green,
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* ---- Two-column layout ---- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Profile card */}
        <form
          onSubmit={handleProfileSubmit}
          style={{
            padding: "24px 28px",
            background: c.bg.card,
            border: `1px solid ${c.border.subtle}`,
            borderRadius: c.radius.lg,
          }}
        >
          <SectionHeader
            icon={<User size={18} />}
            iconColor={c.accent.blue}
            title="Profile Settings"
            subtitle="Update your admin account information"
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <Field label="Display Name" icon={<User size={12} />}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleProfileChange}
                placeholder="Your full name"
                style={inputBase}
              />
            </Field>

            <Field label="Email Address" icon={<Mail size={12} />}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleProfileChange}
                placeholder="admin@example.com"
                style={inputBase}
              />
            </Field>

            <Field label="Username" icon={<Crown size={12} />}>
              <input
                type="text"
                value={settings?.username || ""}
                disabled
                style={{
                  ...inputBase,
                  opacity: 0.55,
                  cursor: "not-allowed",
                }}
              />
              <div
                style={{
                  fontSize: "11px",
                  color: c.text.faint,
                  marginTop: "4px",
                }}
              >
                Username cannot be changed
              </div>
            </Field>

            <Field label="New Password" icon={<Lock size={12} />}>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleProfileChange}
                  placeholder="Leave blank to keep current"
                  style={{ ...inputBase, paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: c.text.faint,
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {formData.password && (
              <Field label="Confirm Password" icon={<Lock size={12} />}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleProfileChange}
                  placeholder="Confirm new password"
                  style={inputBase}
                />
              </Field>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              style={primaryButton(savingProfile, "linear-gradient(135deg, #2979FF, #1565C0)")}
            >
              {savingProfile ? (
                <>
                  <RefreshCw size={16} style={{ animation: "spin 0.9s linear infinite" }} />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Profile Changes
                </>
              )}
            </button>
          </div>
        </form>

        {/* Tournament defaults card */}
        <form
          onSubmit={handleDefaultsSubmit}
          style={{
            padding: "24px 28px",
            background: c.bg.card,
            border: `1px solid ${c.border.subtle}`,
            borderRadius: c.radius.lg,
          }}
        >
          <SectionHeader
            icon={<Trophy size={18} />}
            iconColor={c.accent.gold}
            title="Tournament Defaults"
            subtitle="Pre-filled values when creating a tournament"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Field label="Max Participants" icon={<Users size={12} />}>
              <input
                type="number"
                name="maxParticipants"
                value={defaults.maxParticipants}
                onChange={handleDefaultsChange}
                min={1}
                style={inputBase}
              />
            </Field>

            <Field label="Number of Groups" icon={<Users size={12} />}>
              <input
                type="number"
                name="numberOfGroups"
                value={defaults.numberOfGroups}
                onChange={handleDefaultsChange}
                min={1}
                style={inputBase}
              />
            </Field>

            <Field label="Participants per Group" icon={<Users size={12} />}>
              <input
                type="number"
                name="participantsPerGroup"
                value={defaults.participantsPerGroup}
                onChange={handleDefaultsChange}
                min={1}
                style={inputBase}
              />
            </Field>

            <Field label="Qualifiers per Group" icon={<Shield size={12} />}>
              <input
                type="number"
                name="qualifiersPerGroup"
                value={defaults.qualifiersPerGroup}
                onChange={handleDefaultsChange}
                min={1}
                style={inputBase}
              />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Playoff Format" icon={<Trophy size={12} />}>
                <select
                  name="playoffFormat"
                  value={defaults.playoffFormat}
                  onChange={handleDefaultsChange}
                  style={{
                    ...inputBase,
                    cursor: "pointer",
                    appearance: "none",
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.4)' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                    paddingRight: "36px",
                  }}
                >
                  <option value="SINGLE_ELIMINATION" style={{ background: "#0F1420" }}>
                    Single Elimination
                  </option>
                </select>
              </Field>
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
              <button
                type="submit"
                disabled={savingDefaults}
                style={primaryButton(
                  savingDefaults,
                  "linear-gradient(135deg, #FFD700, #FFA000)",
                  "#0a0e1a",
                )}
              >
                {savingDefaults ? (
                  <>
                    <RefreshCw size={16} style={{ animation: "spin 0.9s linear infinite" }} />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Defaults
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ---- System info ---- */}
      <div
        style={{
          marginTop: "20px",
          padding: "22px 28px",
          background: c.bg.card,
          border: `1px solid ${c.border.subtle}`,
          borderRadius: c.radius.lg,
        }}
      >
        <SectionHeader
          icon={<Settings size={18} />}
          iconColor={c.accent.purple}
          title="System Information"
          subtitle="Account metadata and platform status"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
          }}
        >
          <InfoItem label="Username" value={settings?.username || "—"} icon={<User size={12} />} />
          <InfoItem label="Role" value={settings?.role || "ADMIN"} icon={<Shield size={12} />} />
          <InfoItem
            label="Session"
            value="Active"
            icon={<Sparkles size={12} />}
            valueColor={c.accent.blue}
          />
          <InfoItem
            label="Security"
            value="High"
            icon={<Key size={12} />}
            valueColor={c.accent.green}
          />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus, select:focus {
          border-color: #2979FF !important;
          box-shadow: 0 0 0 3px rgba(41,121,255,0.15) !important;
          background: rgba(255,255,255,0.06) !important;
        }
        input:hover:not(:disabled), select:hover {
          border-color: rgba(255,255,255,0.16) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// Small helper components
// ============================================================

interface SectionHeaderProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, iconColor, title, subtitle }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "20px",
      paddingBottom: "16px",
      borderBottom: `1px solid ${c.border.subtle}`,
    }}
  >
    <div
      style={{
        width: "38px",
        height: "38px",
        borderRadius: c.radius.sm,
        background: `${iconColor}1a`,
        border: `1px solid ${iconColor}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: iconColor,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: c.text.primary,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: "12px",
            color: c.text.muted,
            marginTop: "2px",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  </div>
);

interface FieldProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, icon, children }) => (
  <div>
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "12px",
        fontWeight: 600,
        color: c.text.secondary,
        marginBottom: "6px",
      }}
    >
      {icon}
      {label}
    </label>
    {children}
  </div>
);

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "14px 16px",
      borderRadius: c.radius.md,
      background: c.bg.card,
      border: `1px solid ${c.border.subtle}`,
      transition: "transform 0.2s ease, border-color 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.borderColor = `${color}40`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = c.border.subtle;
    }}
  >
    <div
      style={{
        width: "38px",
        height: "38px",
        borderRadius: c.radius.sm,
        background: `${color}1a`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          color: c.text.muted,
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: c.text.primary,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

interface InfoItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueColor?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, icon, valueColor }) => (
  <div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "10px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        color: c.text.muted,
        marginBottom: "4px",
      }}
    >
      {icon}
      {label}
    </div>
    <div
      style={{
        fontSize: "14px",
        fontWeight: 600,
        color: valueColor ?? c.text.primary,
      }}
    >
      {value}
    </div>
  </div>
);

// ---- Style helpers ---------------------------------------------------

const primaryButton = (
  disabled: boolean,
  gradient: string,
  textColor = "#ffffff",
): React.CSSProperties => ({
  width: "100%",
  padding: "11px 20px",
  borderRadius: c.radius.md,
  background: disabled ? "rgba(255, 255, 255, 0.05)" : gradient,
  border: "none",
  color: textColor,
  fontWeight: 700,
  fontSize: "13px",
  cursor: disabled ? "not-allowed" : "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  opacity: disabled ? 0.6 : 1,
  transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.15s ease",
});

export default AdminSettings;
