// frontend/src/pages/public/TournamentDetails.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  PlayCircle,
  ChevronDown,
  Sparkles,
  ListChecks,
  Info,
  Timer,
  Zap,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuth } from "../../context/AuthContext";
import { tournamentApi } from "../../services/tournamentApi";
import type { Tournament, Participant } from "../../types";
import { AxiosError } from "axios";

// ----- Helper to display dates in Ethiopia time (EAT, UTC+3) -----
const formatEAT = (date: string | Date | undefined, fallback: string = "TBD") => {
  if (!date) return fallback;
  const d = new Date(date);
  if (isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

export const TournamentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [showTournamentDropdown, setShowTournamentDropdown] = useState(false);

  const [loading, setLoading] = useState(true);
  const [, setLoadingTournaments] = useState(false);
  const [error, setError] = useState("");

  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const [currentTime, setCurrentTime] = useState(() => new Date());

  // --- Real‑time clock (updates every second) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Load all tournaments for dropdown ---
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setLoadingTournaments(true);
        const response = await tournamentApi.list();
        const tournaments = response?.tournaments || [];
        setAllTournaments(tournaments);

        if (!id && tournaments.length > 0) {
          navigate(`/tournaments/${tournaments[0]._id}`, { replace: true });
        }
      } catch (err) {
        console.error("Failed to load tournaments:", err);
      } finally {
        setLoadingTournaments(false);
      }
    };
    loadTournaments();
  }, [id, navigate]);

  // --- Fetch tournament details ---
  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");

        const tournamentRes = await tournamentApi.get(id);
        const t = tournamentRes.tournament;
        setTournament(t);
        setParticipantCount(t.participantCount ?? 0);

        // Fetch participants in a separate try/catch so a failure here
        // doesn't break the whole page
        try {
          const participantsRes = await tournamentApi.participants(id);
          const participants = participantsRes.participants || [];
          setParticipantCount(participants.length);

          if (isAuthenticated && user) {
            const userParticipant = participants.find((p) => p.user?._id === user._id);
            if (userParticipant) setParticipant(userParticipant);
          }
        } catch {
          // Participants endpoint might be admin-only — ignore
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tournament details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, isAuthenticated, user]);

  // --- Join tournament ---
  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    if (!id) return;

    try {
      setRegistering(true);
      setRegisterError("");
      const result = await tournamentApi.join(id);

      setRegisterSuccess(true);
      setParticipant(result.participant);
      setParticipantCount((prev) => prev + 1);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setRegisterError(err.response.data.message);
      } else if (err instanceof Error) {
        setRegisterError(err.message);
      } else {
        setRegisterError("Server error");
      }
    } finally {
      setRegistering(false);
    }
  };

  // --- Handle tournament selection ---
  const handleTournamentSelect = (tournamentId: string) => {
    setShowTournamentDropdown(false);
    navigate(`/tournaments/${tournamentId}`);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  // ----------------------------------------------------------
  // No tournament selected — show selector
  // ----------------------------------------------------------
  if (!id || !tournament) {
    return (
      <div
        style={{
          padding: "60px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: "600px", width: "100%" }}>
          <Card
            style={{
              padding: "48px",
              background: "rgba(20, 25, 45, 0.85)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
              borderRadius: "24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "rgba(41,121,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <ListChecks size={40} color="#64B5F6" />
            </div>
            <h2
              style={{
                margin: "0 0 8px 0",
                fontSize: "28px",
                fontWeight: "700",
              }}
            >
              Select a Tournament
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                marginBottom: "32px",
              }}
            >
              Choose a tournament to view details and register
            </p>

            {allTournaments.length > 0 ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowTournamentDropdown(!showTournamentDropdown)}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "16px",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>Select Tournament</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transition: "transform 0.2s ease",
                      transform: showTournamentDropdown ? "rotate(180deg)" : "none",
                    }}
                  />
                </button>

                {showTournamentDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: 0,
                      right: 0,
                      background: "#1a1f35",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "14px",
                      overflow: "hidden",
                      zIndex: 100,
                      maxHeight: "300px",
                      overflowY: "auto",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                    }}
                  >
                    {allTournaments.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => handleTournamentSelect(t._id)}
                        style={{
                          width: "100%",
                          padding: "14px 20px",
                          border: "none",
                          background: "transparent",
                          color: "white",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.15s ease",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#f1f5f9",
                          }}
                        >
                          {t.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.4)",
                            marginTop: "2px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <span>{t.status || "Upcoming"}</span>
                          <span>•</span>
                          <span>{t.maxParticipants || 0} participants</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: "24px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px dashed rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                <p style={{ margin: 0 }}>No tournaments available</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // ---------- Time‑based logic ----------
  const now = currentTime;

  const registrationStart = tournament.registrationStart
    ? new Date(tournament.registrationStart)
    : null;
  const registrationEnd = tournament.registrationEnd ? new Date(tournament.registrationEnd) : null;
  const tournamentStart = tournament.tournamentStart ? new Date(tournament.tournamentStart) : null;

  const hasTournamentStarted = tournamentStart !== null && now >= tournamentStart;

  const isRegistrationNotStarted = registrationStart !== null && now < registrationStart;

  const isRegistrationClosed =
    registrationEnd !== null && now >= registrationEnd && !hasTournamentStarted;

  const isRegistrationOpen =
    registrationStart !== null &&
    registrationEnd !== null &&
    now >= registrationStart &&
    now < registrationEnd &&
    !hasTournamentStarted;

  // ---------- UI helpers ----------
  const maxParticipants = tournament.maxParticipants || 20;
  const availableSlots = Math.max(0, maxParticipants - participantCount);
  const isFull = participantCount >= maxParticipants;
  const isRegistered = !!participant;
  const isApproved = participant?.registrationStatus === "APPROVED";
  const isPending = participant?.registrationStatus === "PENDING";
  const isRejected = participant?.registrationStatus === "REJECTED";

  const getCountdown = (target: Date | null) => {
    if (!target) return null;
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const registrationCountdown = isRegistrationNotStarted ? getCountdown(registrationStart) : null;
  const tournamentCountdown = hasTournamentStarted ? null : getCountdown(tournamentStart);

  const getStatusBadge = () => {
    if (hasTournamentStarted) return { tone: "gold" as const, label: "LIVE", icon: Zap };
    if (isRegistrationOpen)
      return {
        tone: "blue" as const,
        label: "REGISTRATION OPEN",
        icon: Clock,
      };
    if (isRegistrationNotStarted)
      return { tone: "muted" as const, label: "UPCOMING", icon: Calendar };
    if (isRegistrationClosed)
      return {
        tone: "red" as const,
        label: "CLOSED",
        icon: ShieldAlert,
      };
    return { tone: "muted" as const, label: tournament.status, icon: Info };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  const getParticipantStatusDisplay = () => {
    if (isApproved)
      return {
        label: "Approved",
        color: "#22C55E",
        icon: CheckCircle2,
      };
    if (isPending)
      return {
        label: "Pending Approval",
        color: "#FFC107",
        icon: Clock,
      };
    if (isRejected)
      return {
        label: "Rejected",
        color: "#FF6B6B",
        icon: ShieldAlert,
      };
    return null;
  };

  const participantStatus = getParticipantStatusDisplay();

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      {/* Tournament Selector Bar */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          padding: "12px 20px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          <Sparkles size={14} style={{ marginRight: "6px", display: "inline" }} />
          Switch Tournament:
        </span>
        <select
          value={tournament._id}
          onChange={(e) => handleTournamentSelect(e.target.value)}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            outline: "none",
            minWidth: "200px",
          }}
        >
          {allTournaments.map((t) => (
            <option key={t._id} value={t._id} style={{ background: "#1a1f35", color: "white" }}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Header */}
      <div
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
          <Badge
            tone={status.tone}
            style={{
              fontSize: "11px",
              padding: "6px 16px",
              borderRadius: "100px",
              fontWeight: "600",
              marginBottom: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background:
                status.tone === "gold"
                  ? "linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,152,0,0.1))"
                  : status.tone === "blue"
                    ? "linear-gradient(135deg, rgba(41,121,255,0.2), rgba(21,101,192,0.1))"
                    : status.tone === "red"
                      ? "linear-gradient(135deg, rgba(244,67,54,0.2), rgba(198,40,40,0.1))"
                      : "rgba(255,255,255,0.05)",
              border: `1px solid ${
                status.tone === "gold"
                  ? "rgba(255,215,0,0.3)"
                  : status.tone === "blue"
                    ? "rgba(41,121,255,0.3)"
                    : status.tone === "red"
                      ? "rgba(244,67,54,0.3)"
                      : "rgba(255,255,255,0.08)"
              }`,
            }}
          >
            <StatusIcon size={14} />
            {status.label}
          </Badge>
          <h1
            style={{
              fontSize: "clamp(32px, 4.5vw, 52px)",
              fontWeight: "800",
              margin: "0 0 8px 0",
              background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            {tournament.name}
          </h1>
          {tournament.description && (
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "16px",
                lineHeight: "1.7",
                maxWidth: "700px",
                margin: "4px 0 0",
              }}
            >
              {tournament.description}
            </p>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "100px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Users size={18} color="#64B5F6" />
            <span style={{ fontWeight: "600" }}>{participantCount}</span>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>participants</span>
          </div>
          {isRegistered && participantStatus && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "100px",
                background: `rgba(${
                  participantStatus.color === "#22C55E"
                    ? "76,175,80"
                    : participantStatus.color === "#FFC107"
                      ? "255,193,7"
                      : "255,107,107"
                }, 0.12)`,
                border: `1px solid ${participantStatus.color}44`,
              }}
            >
              <participantStatus.icon size={14} color={participantStatus.color} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: participantStatus.color,
                }}
              >
                {participantStatus.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "28px",
        }}
      >
        {/* Registration Card */}
        <Card
          style={{
            padding: "32px",
            background: "rgba(20, 25, 45, 0.85)",
            border: "1px solid rgba(255,255,255,0.08)",
            gridColumn: "1 / -1",
            backdropFilter: "blur(8px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-50%",
              right: "-30%",
              width: "400px",
              height: "400px",
              background: "radial-gradient(circle, rgba(41,121,255,0.08) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {registerSuccess ? (
              <div
                style={{
                  background: "rgba(76, 175, 80, 0.12)",
                  border: "1px solid rgba(76, 175, 80, 0.35)",
                  padding: "28px",
                  borderRadius: "16px",
                  width: "100%",
                  animation: "fadeInUp 0.5s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      background: "rgba(76, 175, 80, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle2 size={36} color="#22C55E" />
                  </div>
                </div>
                <h2
                  style={{
                    color: "#22C55E",
                    margin: "0 0 8px 0",
                    fontSize: "26px",
                  }}
                >
                  🎉 Registration Successful!
                </h2>
                <p
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    margin: "0 0 6px 0",
                  }}
                >
                  You are now registered for <strong>{tournament.name}</strong>.
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "20px",
                    flexWrap: "wrap",
                    margin: "16px 0",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      Status
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: isApproved ? "#22C55E" : "#FFC107",
                      }}
                    >
                      {isApproved ? "✅ Approved" : "⏳ Pending"}
                    </div>
                  </div>
                  {participant?.group && (
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        Group
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#64B5F6",
                        }}
                      >
                        Group {participant.group}
                      </div>
                    </div>
                  )}
                  {participant?.seed && (
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        Seed
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#FFD700",
                        }}
                      >
                        #{participant.seed}
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => setRegisterSuccess(false)}
                  variant="primary"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  Continue
                </Button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Trophy size={20} color="#FFD700" />
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "22px",
                      fontWeight: "700",
                    }}
                  >
                    Registration Status
                  </h2>
                </div>

                {registerError && (
                  <div
                    style={{
                      padding: "12px 20px",
                      background: "rgba(244, 67, 54, 0.12)",
                      border: "1px solid rgba(244, 67, 54, 0.3)",
                      color: "#FF6B6B",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "14px",
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    <ShieldAlert size={18} />
                    {registerError}
                  </div>
                )}

                {isRegistered ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      padding: "20px 0",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 24px",
                        background: isApproved
                          ? "rgba(76, 175, 80, 0.15)"
                          : isPending
                            ? "rgba(255, 193, 7, 0.15)"
                            : "rgba(255, 107, 107, 0.15)",
                        color: isApproved ? "#22C55E" : isPending ? "#FFC107" : "#FF6B6B",
                        borderRadius: "100px",
                        border: `1px solid ${
                          isApproved
                            ? "rgba(76, 175, 80, 0.3)"
                            : isPending
                              ? "rgba(255, 193, 7, 0.3)"
                              : "rgba(255, 107, 107, 0.3)"
                        }`,
                        fontWeight: "600",
                        fontSize: "16px",
                      }}
                    >
                      <CheckCircle2 size={20} />
                      {isApproved
                        ? "✓ Approved"
                        : isPending
                          ? "⏳ Pending Approval"
                          : isRejected
                            ? "✗ Rejected"
                            : "Registered"}
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>
                      {isApproved
                        ? "You have been approved for this tournament."
                        : isPending
                          ? "Your registration is awaiting admin approval."
                          : isRejected
                            ? "Your registration was rejected."
                            : "You are registered for this tournament."}
                    </span>
                  </div>
                ) : hasTournamentStarted ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 0",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 20px",
                        background: "rgba(255, 152, 0, 0.12)",
                        color: "#FFA726",
                        borderRadius: "100px",
                        border: "1px solid rgba(255, 152, 0, 0.3)",
                        fontWeight: "600",
                      }}
                    >
                      <PlayCircle size={18} />
                      Tournament already started
                    </div>
                    <Button disabled variant="secondary" size="lg">
                      Registration Closed
                    </Button>
                  </div>
                ) : isRegistrationNotStarted ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 0",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 20px",
                        background: "rgba(255,255,255,0.06)",
                        color: "white",
                        borderRadius: "100px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        fontWeight: "600",
                      }}
                    >
                      <Clock size={18} />
                      Registration not yet open
                    </div>
                    {registrationCountdown && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "8px 20px",
                          background: "rgba(0,0,0,0.3)",
                          borderRadius: "10px",
                        }}
                      >
                        <Timer size={18} color="#64B5F6" />
                        <span
                          style={{
                            color: "#64B5F6",
                            fontSize: "20px",
                            fontWeight: "700",
                            fontVariantNumeric: "tabular-nums",
                            letterSpacing: "1px",
                          }}
                        >
                          {registrationCountdown}
                        </span>
                      </div>
                    )}
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>
                      Opens: {formatEAT(tournament.registrationStart)}
                    </span>
                    <Button disabled variant="secondary" size="lg">
                      Registration Closed
                    </Button>
                  </div>
                ) : isRegistrationClosed ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 0",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 20px",
                        background: "rgba(244, 67, 54, 0.1)",
                        color: "#EF5350",
                        borderRadius: "100px",
                        border: "1px solid rgba(244, 67, 54, 0.3)",
                        fontWeight: "600",
                      }}
                    >
                      <ShieldAlert size={18} />
                      Registration Closed
                    </div>
                    <Button disabled variant="secondary" size="lg">
                      Registration Closed
                    </Button>
                  </div>
                ) : isFull ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 0",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 20px",
                        background: "rgba(244, 67, 54, 0.1)",
                        color: "#EF5350",
                        borderRadius: "100px",
                        border: "1px solid rgba(244, 67, 54, 0.3)",
                        fontWeight: "600",
                      }}
                    >
                      <Users size={18} />
                      Tournament Full
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>
                      {participantCount} / {maxParticipants} participants
                    </span>
                    <Button disabled variant="secondary" size="lg">
                      Registration Closed
                    </Button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "20px",
                      padding: "8px 0",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 24px",
                        background: "rgba(41, 121, 255, 0.12)",
                        color: "#64B5F6",
                        borderRadius: "100px",
                        border: "1px solid rgba(41, 121, 255, 0.3)",
                        fontWeight: "600",
                        fontSize: "16px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "#64B5F6",
                          boxShadow: "0 0 12px #64B5F6",
                          display: "inline-block",
                          animation: "pulse 1.5s infinite",
                        }}
                      />
                      Registration Open
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      <Users size={16} />
                      <span>
                        <strong style={{ color: "white" }}>{availableSlots}</strong> slot
                        {availableSlots !== 1 ? "s" : ""} remaining
                      </span>
                      <span style={{ opacity: 0.3 }}>•</span>
                      <span>
                        <strong style={{ color: "white" }}>{participantCount}</strong> registered
                      </span>
                    </div>

                    <Button
                      onClick={handleRegister}
                      disabled={registering}
                      size="lg"
                      style={{
                        padding: "16px 48px",
                        fontSize: "18px",
                        background: "linear-gradient(135deg, #2979FF, #1565C0)",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: "700",
                        letterSpacing: "0.5px",
                        boxShadow: "0 4px 20px rgba(41, 121, 255, 0.3)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}
                    >
                      {registering ? "Registering..." : "REGISTER NOW"}
                      {!registering && <ArrowRight size={20} />}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Schedule Card */}
        <div
          style={{
            padding: "24px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
              color: "white",
            }}
          >
            <div
              style={{
                padding: "8px",
                borderRadius: "10px",
                background: "rgba(100,181,246,0.1)",
              }}
            >
              <Calendar size={22} color="#64B5F6" />
            </div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>Schedule</h3>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div className="schedule-item">
              <span className="schedule-label">Registration Opens</span>
              <span className="schedule-value">{formatEAT(tournament.registrationStart)}</span>
            </div>

            <div className="schedule-item">
              <span className="schedule-label">Registration Closes</span>
              <span className="schedule-value">{formatEAT(tournament.registrationEnd)}</span>
            </div>

            <div className="schedule-item highlight">
              <span className="schedule-label">Tournament Starts</span>
              <span className="schedule-value gold">{formatEAT(tournament.tournamentStart)}</span>
            </div>

            <div className="schedule-item">
              <span className="schedule-label">Tournament Ends</span>
              <span className="schedule-value">{formatEAT(tournament.tournamentEnd)}</span>
            </div>

            {tournamentCountdown && !hasTournamentStarted && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "14px",
                  borderRadius: "10px",
                  background: "rgba(255,215,0,0.05)",
                  border: "1px solid rgba(255,215,0,0.1)",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  <Timer size={14} style={{ display: "inline", marginRight: "6px" }} />
                  Starts in
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#FFD700",
                    fontVariantNumeric: "tabular-nums",
                    marginTop: "2px",
                  }}
                >
                  {tournamentCountdown}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Format Card */}
        <div
          style={{
            padding: "24px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
              color: "white",
            }}
          >
            <div
              style={{
                padding: "8px",
                borderRadius: "10px",
                background: "rgba(255,215,0,0.1)",
              }}
            >
              <Trophy size={22} color="#FFD700" />
            </div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>Format & Structure</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="format-item">
              <span className="format-label">Capacity</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="format-value">
                  {participantCount} / {maxParticipants}
                </span>
                <div
                  style={{
                    width: "60px",
                    height: "4px",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(participantCount / maxParticipants) * 100}%`,
                      height: "100%",
                      background:
                        participantCount / maxParticipants > 0.8
                          ? "linear-gradient(90deg, #FF6B6B, #F59E0B)"
                          : "linear-gradient(90deg, #22C55E, #64B5F6)",
                      borderRadius: "2px",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="format-item">
              <span className="format-label">Groups</span>
              <span className="format-value">{tournament.numberOfGroups || 4} Groups</span>
            </div>

            <div className="format-item">
              <span className="format-label">Group Size</span>
              <span className="format-value">
                {tournament.participantsPerGroup ||
                  Math.round(maxParticipants / (tournament.numberOfGroups || 4))}{" "}
                per group
              </span>
            </div>

            <div className="format-item">
              <span className="format-label">Qualifiers</span>
              <span className="format-value highlight-gold">
                Top {tournament.qualifiersPerGroup || 2} advance
              </span>
            </div>

            <div className="format-item">
              <span className="format-label">Playoffs</span>
              <span className="format-value">
                {tournament.playoffFormat
                  ? tournament.playoffFormat.replace(/_/g, " ")
                  : "SINGLE ELIMINATION"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .schedule-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .schedule-item:last-of-type {
          border-bottom: none;
        }

        .schedule-item.highlight {
          background: rgba(255, 215, 0, 0.03);
          padding: 8px 12px;
          border-radius: 8px;
          border-bottom: none;
          margin: 0 -12px;
        }

        .schedule-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .schedule-value {
          font-weight: 500;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .schedule-value.gold {
          color: #FFD700;
          font-weight: 600;
        }

        .format-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .format-item:last-of-type {
          border-bottom: none;
          padding-bottom: 0;
        }

        .format-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .format-value {
          font-weight: 500;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .format-value.highlight-gold {
          color: #FFD700;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .schedule-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .format-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .schedule-item.highlight {
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default TournamentDetails;
