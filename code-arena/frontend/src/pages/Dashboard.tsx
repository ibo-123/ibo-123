import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
  Award,
  Clock,
  Users,
  Code2,
  Target,
  BarChart3,
  Medal,
  Star,
  Flame,
  Trophy,
  Zap,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/layout/Navbar";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { tournamentApi } from "../services/tournamentApi";
import type { Tournament, Participant } from "../types";

export const Dashboard = () => {
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { tournaments } = await tournamentApi.list();
        const t = tournaments[0] || null;
        setTournament(t);

        if (t) {
          const result = await tournamentApi.participants(t._id);
          setTotalParticipants(result.participants.length);

          const p = result.participants.find(
            (item) => item.user._id === user?._id || item.user.id === user?.id,
          );
          setParticipant(p || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  // ---- Derived values ----
  const isCompleted = tournament?.status === "COMPLETED";
  const isRegistration = tournament?.status === "REGISTRATION";
  const currentStage = tournament?.currentStage || tournament?.status || "Registration";

  // const isRegistered =
  //   participant?.registrationStatus === "APPROVED" || participant?.registrationStatus === "PENDING";
  const isApproved = participant?.registrationStatus === "APPROVED";
  const isPending = participant?.registrationStatus === "PENDING";
  const isRejected = participant?.registrationStatus === "REJECTED";

  const statusLabel = isApproved
    ? isRegistration
      ? "✓ Approved"
      : "Active"
    : isPending
      ? "⏳ Pending Approval"
      : isRejected
        ? "✗ Rejected"
        : participant?.status === "ACTIVE"
          ? "Active"
          : participant?.status || (isRegistration ? "Registration" : "Not Registered");

  const rank = participant?.rank || 0;
  const group = participant?.group ? `Group ${participant.group}` : "Not assigned yet";
  const seed = participant?.seed ? `#${participant.seed}` : "Not assigned yet";
  const totalScore = participant?.score || 0;
  const solved = participant?.solved || 0;
  const penalty = participant?.penalty || 0;
  const isTopRank = rank > 0 && rank <= 3;
  const rankPercentile =
    totalParticipants > 0 && rank > 0
      ? Math.round(((totalParticipants - rank) / totalParticipants) * 100)
      : 0;

  const statItems = [
    {
      label: "Current Stage",
      value: currentStage,
      icon: Target,
      color: "#2979FF",
      bgColor: "rgba(41,121,255,0.1)",
    },
    {
      label: "Group",
      value: group,
      icon: Users,
      color: "#38BDF8",
      bgColor: "rgba(56,189,248,0.1)",
    },
    { label: "Seed", value: seed, icon: Star, color: "#F59E0B", bgColor: "rgba(255,152,0,0.1)" },
    {
      label: "Current Rank",
      value: rank > 0 ? `#${rank}` : "—",
      icon: Medal,
      color: isTopRank ? "#FFD700" : "#64B5F6",
      bgColor: isTopRank ? "rgba(255,215,0,0.1)" : "rgba(100,181,246,0.1)",
    },
    {
      label: "Score",
      value: `${totalScore} pts`,
      icon: Award,
      color: "#22C55E",
      bgColor: "rgba(76,175,80,0.1)",
    },
    {
      label: "Problems Solved",
      value: solved,
      icon: Code2,
      color: "#F59E0B",
      bgColor: "rgba(255,152,0,0.1)",
    },
    {
      label: "Penalty",
      value: penalty,
      icon: Clock,
      color: "#F44336",
      bgColor: "rgba(244,67,54,0.1)",
    },
    {
      label: "Percentile",
      value: rank > 0 ? `${rankPercentile}%` : "—",
      icon: BarChart3,
      color: "#38BDF8",
      bgColor: "rgba(56,189,248,0.1)",
    },
  ];

  // ---- Render ----
  return (
    <>
      <Navbar />
      <main
        style={{
          background: "linear-gradient(145deg, #0a0e1a 0%, #12172f 50%, #0a0e1a 100%)",
          minHeight: "100vh",
          color: "white",
          padding: "40px 20px",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Header */}
          <header
            style={{
              marginBottom: "36px",
              borderBottom: "2px solid rgba(41, 121, 255, 0.2)",
              paddingBottom: "28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #2979FF, #EAB308)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "white",
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <small
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                    }}
                  >
                    Participant Dashboard
                  </small>
                  <h1
                    style={{
                      fontSize: "clamp(24px, 2.5vw, 36px)",
                      fontWeight: "700",
                      margin: 0,
                      background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Welcome back, {user?.username}
                  </h1>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginTop: "8px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    color: "#22C55E",
                    background: "rgba(34, 197, 94, 0.1)",
                    padding: "4px 12px",
                    borderRadius: "100px",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                  }}
                >
                  <CheckCircle2 size={14} />
                  Codeforces Synced
                </div>
                {totalParticipants > 0 && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    <Users size={14} />
                    {totalParticipants} participants
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <Badge
                tone={
                  isCompleted
                    ? "gold"
                    : isApproved
                      ? "green"
                      : isPending
                        ? "blue"
                        : isRejected
                          ? "red"
                          : isRegistration
                            ? "blue"
                            : "muted"
                }
                style={{
                  fontSize: "12px",
                  padding: "6px 16px",
                  borderRadius: "100px",
                  fontWeight: "600",
                }}
              >
                {statusLabel}
              </Badge>
              {isTopRank && isApproved && (
                <Badge
                  tone="gold"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    padding: "6px 16px",
                    borderRadius: "100px",
                    fontWeight: "700",
                    background: "linear-gradient(135deg, #FFD700, #FFA000)",
                  }}
                >
                  <Star size={14} />
                  Top {rank}
                </Badge>
              )}
            </div>
          </header>

          {/* Stats Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            {statItems.map((stat) => (
              <Card
                key={stat.label}
                style={{
                  padding: "20px 24px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "16px",
                  transition: "transform 0.2s",
                  cursor: "default",
                }}
              >
                <div
                  onMouseEnter={(e) => {
                    e.currentTarget.parentElement!.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.parentElement!.style.transform = "translateY(0)";
                  }}
                  style={{ height: "100%" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <small
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.4)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      {stat.label}
                    </small>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: stat.bgColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <stat.icon size={16} color={stat.color} />
                    </div>
                  </div>
                  <strong
                    style={{
                      fontSize: "clamp(24px, 2vw, 32px)",
                      fontWeight: "700",
                      color: stat.color,
                      display: "block",
                    }}
                  >
                    {stat.value}
                  </strong>
                </div>
              </Card>
            ))}
          </div>

          {/* Two Column Layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "24px",
              marginBottom: "24px",
            }}
          >
            {/* Next Match / Status Card */}
            <Card
              style={{
                padding: "32px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-50%",
                  right: "-30%",
                  width: "300px",
                  height: "300px",
                  background: "radial-gradient(circle, rgba(41,121,255,0.05) 0%, transparent 70%)",
                  borderRadius: "50%",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <Target size={18} color="#2979FF" />
                  <small
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Next Match Status
                  </small>
                </div>

                <h2
                  style={{
                    fontSize: "clamp(20px, 1.8vw, 28px)",
                    fontWeight: "700",
                    margin: "0 0 8px 0",
                    background: isRegistration
                      ? "linear-gradient(135deg, #22C55E, #8BC34A)"
                      : "linear-gradient(135deg, #2979FF, #64B5F6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {isRegistration
                    ? "Registration is Open"
                    : tournament?.currentStage || "Upcoming Match"}
                </h2>

                <p
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    marginBottom: "20px",
                  }}
                >
                  {isRegistration
                    ? participant
                      ? isApproved
                        ? "You are approved and registered! Wait for the tournament to start to receive your group and seed."
                        : isPending
                          ? "Your registration is pending admin approval. You'll be notified once approved."
                          : "You are registered! Wait for the tournament to start."
                      : "Secure your spot in the arena. Registration closes soon!"
                    : "Check the live contest and bracket for the official match state."}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <Link to={isRegistration ? `/tournaments/${tournament?._id}` : "/live"}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 24px",
                        borderRadius: "12px",
                        background: isRegistration
                          ? "linear-gradient(135deg, #22C55E, #388E3C)"
                          : "linear-gradient(135deg, #2979FF, #1565C0)",
                        color: "white",
                        fontWeight: "600",
                        fontSize: "14px",
                        border: "none",
                        cursor: "pointer",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {isRegistration ? "View Tournament" : "Open Live Contest"}
                      <ArrowRight size={16} />
                    </div>
                  </Link>

                  {!isRegistration && (
                    <Link to="/bracket">
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "12px 24px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.08)",
                          color: "white",
                          fontWeight: "500",
                          fontSize: "14px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                        }}
                      >
                        View Bracket
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </Card>

            {/* Recent Results Card */}
            <Card
              style={{
                padding: "32px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "20px",
                }}
              >
                <Flame size={18} color="#FF6B6B" />
                <small
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Recent Contest Logs
                </small>
              </div>

              {participant && isApproved ? (
                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.3)",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        Rank
                      </div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "700",
                          color: isTopRank ? "#FFD700" : "white",
                        }}
                      >
                        #{rank || "—"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "12px 16px",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.3)",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        Solved
                      </div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "700",
                          color: "#22C55E",
                        }}
                      >
                        {solved}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.3)",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        Total Score
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                        }}
                      >
                        {totalScore} pts
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.3)",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        Penalty
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#F44336",
                        }}
                      >
                        {penalty}
                      </div>
                    </div>
                  </div>

                  {isTopRank && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "10px 16px",
                        borderRadius: "12px",
                        background: "rgba(255,215,0,0.05)",
                        border: "1px solid rgba(255,215,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Medal size={16} color="#FFD700" />
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#FFD700",
                          fontWeight: "600",
                        }}
                      >
                        Outstanding performance! Top {rank} rank
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  label={isPending ? "Registration pending approval" : "No contest results yet."}
                  description={
                    isPending
                      ? "Your registration is being reviewed."
                      : "Your performance data will appear here once you participate in matches."
                  }
                  icon={<Code2 size={32} />}
                />
              )}
            </Card>
          </div>

          {/* Quick Actions */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            {[
              { label: "View Bracket", to: "/bracket", icon: <Trophy size={18} /> },
              { label: "Live Contest", to: "/live", icon: <Zap size={18} /> },
              { label: "Leaderboard", to: "/leaderboard", icon: <BarChart3 size={18} /> },
              { label: "Profile Settings", to: "/profile", icon: <Settings size={18} /> },
            ].map((action) => (
              <Link key={action.label} to={action.to} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    padding: "14px 20px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.8)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{action.icon}</span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
