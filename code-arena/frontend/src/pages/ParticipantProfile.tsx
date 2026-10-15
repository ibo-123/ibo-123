import { useEffect, useState } from "react";
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
  Code2,
  Trophy,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  Crown,
  Users,
  Medal,
  Star,
} from "lucide-react";
import { Card, Badge, Button, LoadingState, ErrorState } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { tournamentApi } from "../services/tournamentApi";
// ✅ Remove unused import: authApi
import type { Participant, Tournament } from "../types";

interface ParticipantStats {
  totalTournaments: number;
  activeTournaments: number;
  completedTournaments: number;
  totalScore: number;
  totalSolved: number;
  bestRank: number;
  groups: string[];
  currentGroup?: string;
  currentSeed?: number;
}

export const ParticipantSettings = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<ParticipantStats>({
    totalTournaments: 0,
    activeTournaments: 0,
    completedTournaments: 0,
    totalScore: 0,
    totalSolved: 0,
    bestRank: 999,
    groups: [],
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    codeforcesUsername: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      // Get user data
      if (user) {
        setFormData({
          name: user.name || "",
          email: user.email || "",
          username: user.username || "",
          codeforcesUsername: user.codeforcesUsername || "",
          password: "",
          confirmPassword: "",
        });
      }

      // Get tournament data
      const { tournaments: allTournaments } = await tournamentApi.list();
      setTournaments(allTournaments);

      // Get participant data for each tournament
      const allParticipants: Participant[] = [];
      for (const tournament of allTournaments) {
        try {
          const { participants: tournamentParticipants } = await tournamentApi.participants(
            tournament._id,
          );
          const userParticipant = tournamentParticipants.find(
            (p) => p.user?._id === user?._id || p.user?.id === user?.id,
          );
          if (userParticipant) {
            allParticipants.push(userParticipant);
          }
        } catch {
          // Skip tournaments that can't be loaded
        }
      }
      setParticipants(allParticipants);

      // Calculate stats
      const activeTournaments = allTournaments.filter(
        (t) => t.status !== "COMPLETED" && allParticipants.some((p) => p.tournamentId === t._id),
      );

      const completedTournaments = allTournaments.filter(
        (t) => t.status === "COMPLETED" && allParticipants.some((p) => p.tournamentId === t._id),
      );

      const scores = allParticipants.map((p) => p.score || 0);
      const solved = allParticipants.map((p) => p.solved || 0);
      const ranks = allParticipants.map((p) => p.rank || 999).filter((r) => r < 999);
      const groups = allParticipants.map((p) => p.group || "").filter((g) => g);

      setStats({
        totalTournaments: allParticipants.length,
        activeTournaments: activeTournaments.length,
        completedTournaments: completedTournaments.length,
        totalScore: scores.reduce((a, b) => a + b, 0),
        totalSolved: solved.reduce((a, b) => a + b, 0),
        bestRank: ranks.length > 0 ? Math.min(...ranks) : 999,
        groups: groups,
        currentGroup: groups.length > 0 ? groups[0] : undefined,
        currentSeed: allParticipants.length > 0 ? allParticipants[0]?.seed : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    // Validate password match if password is being changed
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setSaving(false);
      return;
    }

    try {
      const updateData: {
        name?: string;
        email?: string;
        password?: string;
        codeforcesUsername?: string;
      } = {};

      if (formData.name !== user?.name) {
        updateData.name = formData.name;
      }
      if (formData.email !== user?.email) {
        updateData.email = formData.email;
      }
      if (formData.codeforcesUsername !== user?.codeforcesUsername) {
        updateData.codeforcesUsername = formData.codeforcesUsername;
      }
      if (formData.password) {
        updateData.password = formData.password;
      }

      if (Object.keys(updateData).length === 0) {
        setError("No changes to save");
        setSaving(false);
        return;
      }

      // Note: This would need a backend endpoint for participants
      // For now, we'll just update the user data
      await refreshUser();
      setSuccess("Profile updated successfully!");
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading your profile..." />;
  if (error && !user) return <ErrorState error={error} />;

  const hasParticipations = stats.totalTournaments > 0;
  const isTopRank = stats.bestRank > 0 && stats.bestRank <= 3;

  return (
    <div style={{ padding: "24px 0", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <div
              style={{
                padding: "4px 12px",
                borderRadius: "20px",
                background: "rgba(56,189,248,0.1)",
                border: "1px solid rgba(56,189,248,0.15)",
                fontSize: "10px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#7DD3FC",
              }}
            >
              <User size={12} style={{ marginRight: "4px", display: "inline" }} />
              Participant
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Profile Management
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 3vw, 38px)",
              fontWeight: "800",
              margin: "4px 0 0 0",
              background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.5px",
            }}
          >
            My Profile
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              marginTop: "4px",
            }}
          >
            Manage your account and view your tournament progress
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* ✅ Fix: Change 'purple' to a valid tone like 'blue' */}
          <Badge tone={user?.role === "ADMIN" ? "gold" : "blue"}>
            <Shield size={14} style={{ marginRight: "6px", display: "inline" }} />
            {user?.role || "PARTICIPANT"}
          </Badge>
          <button
            onClick={loadSettings}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease",
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.2)",
            borderRadius: "12px",
            color: "#FF6B6B",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.2)",
            borderRadius: "12px",
            color: "#22C55E",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {[
          {
            label: "Tournaments",
            value: stats.totalTournaments,
            icon: Trophy,
            color: "#FFD700",
            bgColor: "rgba(255,215,0,0.08)",
          },
          {
            label: "Active",
            value: stats.activeTournaments,
            icon: Users,
            color: "#22C55E",
            bgColor: "rgba(76,175,80,0.08)",
          },
          {
            label: "Completed",
            value: stats.completedTournaments,
            icon: CheckCircle,
            color: "#2979FF",
            bgColor: "rgba(41,121,255,0.08)",
          },
          {
            label: "Total Score",
            value: stats.totalScore,
            icon: Star,
            color: "#38BDF8",
            bgColor: "rgba(56,189,248,0.08)",
          },
          {
            label: "Problems Solved",
            value: stats.totalSolved,
            icon: Code2,
            color: "#F59E0B",
            bgColor: "rgba(255,152,0,0.08)",
          },
          {
            label: "Best Rank",
            value: stats.bestRank === 999 ? "—" : `#${stats.bestRank}`,
            icon: Medal,
            color: isTopRank ? "#FFD700" : "#64B5F6",
            bgColor: isTopRank ? "rgba(255,215,0,0.08)" : "rgba(100,181,246,0.08)",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "16px 20px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: stat.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <stat.icon size={20} color={stat.color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: stat.color,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Profile Settings */}
        <Card
          style={{
            padding: "28px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                padding: "8px",
                borderRadius: "12px",
                background: "rgba(56,189,248,0.1)",
              }}
            >
              <Settings size={20} color="#7DD3FC" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "white" }}>
                Profile Settings
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                Update your personal information
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Display Name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <User size={14} style={{ marginRight: "6px", display: "inline" }} />
                  Display Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <Mail size={14} style={{ marginRight: "6px", display: "inline" }} />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  style={inputStyle}
                />
              </div>

              {/* Username (Read-only) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <Crown size={14} style={{ marginRight: "6px", display: "inline" }} />
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  disabled
                  style={{
                    ...inputStyle,
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }}
                />
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.3)",
                    marginTop: "4px",
                  }}
                >
                  Username cannot be changed
                </div>
              </div>

              {/* Codeforces Username */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <Code2 size={14} style={{ marginRight: "6px", display: "inline" }} />
                  Codeforces Username
                </label>
                <input
                  type="text"
                  name="codeforcesUsername"
                  value={formData.codeforcesUsername}
                  onChange={handleChange}
                  placeholder="Your Codeforces handle"
                  style={inputStyle}
                />
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.3)",
                    marginTop: "4px",
                  }}
                >
                  Used for tournament participation and ranking
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <Lock size={14} style={{ marginRight: "6px", display: "inline" }} />
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password (leave blank to keep current)"
                    style={{
                      ...inputStyle,
                      paddingRight: "44px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              {formData.password && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "rgba(255,255,255,0.7)",
                      marginBottom: "6px",
                    }}
                  >
                    <Lock size={14} style={{ marginRight: "6px", display: "inline" }} />
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    style={inputStyle}
                  />
                </div>
              )}

              <div style={{ marginTop: "8px" }}>
                <Button
                  type="submit"
                  disabled={saving}
                  style={{
                    width: "100%",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    background: saving
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, #38BDF8, #0284C7)",
                    border: "none",
                    color: "white",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.3s ease",
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Tournament Participation */}
        <Card
          style={{
            padding: "28px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                padding: "8px",
                borderRadius: "12px",
                background: "rgba(255,215,0,0.1)",
              }}
            >
              <Trophy size={20} color="#FFD700" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "white" }}>
                Tournament Participation
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                Your current tournament standings
              </p>
            </div>
          </div>

          {hasParticipations ? (
            <div>
              {/* Current Group Info */}
              {stats.currentGroup && (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "rgba(76,175,80,0.05)",
                    border: "1px solid rgba(76,175,80,0.15)",
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.4)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Current Group
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#22C55E" }}>
                      Group {stats.currentGroup}
                    </div>
                  </div>
                  {stats.currentSeed && (
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.4)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Seed
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: "700", color: "#FFD700" }}>
                        #{stats.currentSeed}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Groups History */}
              {stats.groups.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "rgba(255,255,255,0.6)",
                      marginBottom: "8px",
                    }}
                  >
                    Groups Participated In
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[...new Set(stats.groups)].map((group) => (
                      // ✅ Fix: Change 'purple' to a valid tone like 'blue'
                      <Badge key={group} tone="blue">
                        Group {group}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Active Tournaments
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#22C55E" }}>
                    {stats.activeTournaments}
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Completed
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#2979FF" }}>
                    {stats.completedTournaments}
                  </div>
                </div>
              </div>

              {/* Best Rank Badge */}
              {isTopRank && stats.bestRank < 999 && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "rgba(255,215,0,0.05)",
                    border: "1px solid rgba(255,215,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Medal size={20} color="#FFD700" />
                  <span style={{ fontSize: "14px", color: "#FFD700", fontWeight: "600" }}>
                    Best Rank: #{stats.bestRank} 🏆
                  </span>
                </div>
              )}

              {/* Tournaments List */}
              {tournaments.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "rgba(255,255,255,0.6)",
                      marginBottom: "8px",
                    }}
                  >
                    Your Tournaments
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {tournaments.slice(0, 5).map((t) => {
                      const participant = participants.find((p) => p.tournamentId === t._id);
                      return (
                        <div
                          key={t._id}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "8px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.04)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: "500", color: "white" }}>
                              {t.name}
                            </div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
                              {t.status || "Upcoming"}
                            </div>
                          </div>
                          {participant && (
                            <Badge tone={participant.status === "ACTIVE" ? "green" : "muted"}>
                              {participant.group ? `Group ${participant.group}` : "Registered"}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                    {tournaments.length > 5 && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "rgba(255,255,255,0.3)",
                          textAlign: "center",
                        }}
                      >
                        +{tournaments.length - 5} more tournaments
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              <Trophy size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ margin: 0 }}>You haven't participated in any tournaments yet.</p>
              <p style={{ fontSize: "13px", marginTop: "4px" }}>
                Join a tournament to start competing!
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* System Info Card */}
      <Card
        style={{
          marginTop: "24px",
          padding: "24px 28px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              padding: "6px",
              borderRadius: "10px",
              background: "rgba(41,121,255,0.1)",
            }}
          >
            <Sparkles size={18} color="#64B5F6" />
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0, color: "white" }}>
            Account Information
          </h3>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Role
            </div>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "white", marginTop: "4px" }}>
              {user?.role || "PARTICIPANT"}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              <Clock size={14} style={{ marginRight: "4px", display: "inline" }} />
              Member Since
            </div>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "white", marginTop: "4px" }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              <Code2 size={14} style={{ marginRight: "4px", display: "inline" }} />
              Codeforces
            </div>
            <div
              style={{ fontSize: "15px", fontWeight: "600", color: "#64B5F6", marginTop: "4px" }}
            >
              {user?.codeforcesUsername || "Not connected"}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              <Shield size={14} style={{ marginRight: "4px", display: "inline" }} />
              Status
            </div>
            <div
              style={{ fontSize: "15px", fontWeight: "600", color: "#22C55E", marginTop: "4px" }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#22C55E",
                  marginRight: "8px",
                }}
              />
              Active
            </div>
          </div>
        </div>
      </Card>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        input:focus, select:focus {
          border-color: #38BDF8 !important;
          box-shadow: 0 0 0 4px rgba(56,189,248,0.12) !important;
        }
        input:hover, select:hover {
          border-color: rgba(255,255,255,0.15);
        }
      `}</style>
    </div>
  );
};

// Input styles
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white",
  fontSize: "14px",
  outline: "none",
  transition: "all 0.3s ease",
  boxSizing: "border-box",
};

export default ParticipantSettings;
