import { useEffect, useState } from "react";
import { Crown, ChevronRight, Trophy, ChevronDown, RefreshCw, Users, Calendar } from "lucide-react";
import { Navbar } from "../../components/layout/Navbar";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { tournamentApi } from "../../services/tournamentApi";
import type { Tournament, Bracket as BracketType, BracketMatch, Participant } from "../../types";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const Bracket = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<BracketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTournamentMenu, setShowTournamentMenu] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadBracket(selectedTournament._id);
    }
  }, [selectedTournament]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const { tournaments } = await tournamentApi.list();
      setTournaments(tournaments);

      if (tournaments.length > 0) {
        // Try to load saved selection from localStorage
        const savedId = localStorage.getItem("public-selected-tournament");
        const savedTournament = savedId
          ? tournaments.find((t: Tournament) => t._id === savedId)
          : null;
        setSelectedTournament(savedTournament || tournaments[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  };

  const loadBracket = async (tournamentId: string) => {
    try {
      setLoading(true);
      const { bracket: data } = await tournamentApi.bracket(tournamentId);
      setBracket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bracket");
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentChange = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    localStorage.setItem("public-selected-tournament", tournament._id);
    setShowTournamentMenu(false);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const isCompleted = selectedTournament?.status === "COMPLETED";

  // ---- Match Card ----
  const MatchCard = ({ match }: { match: BracketMatch }) => (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: "12px",
        padding: "16px",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "default",
        width: "100%",
        maxWidth: "280px",
        margin: "0 auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.5)" }}>
          Match {match.matchNumber}
        </span>
        <Badge
          tone={match.status === "COMPLETED" ? "green" : match.status === "LIVE" ? "red" : "muted"}
        >
          {match.status || "PENDING"}
        </Badge>
      </div>

      {match.participants?.map((p: Participant) => {
        const isWinner = match.winner?._id === p._id;
        return (
          <div
            key={p._id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 10px",
              marginBottom: "6px",
              borderRadius: "8px",
              background: isWinner ? "rgba(255,215,0,0.08)" : "transparent",
              border: isWinner ? "1px solid rgba(255,215,0,0.25)" : "1px solid transparent",
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: isWinner
                  ? "linear-gradient(135deg, #FFD700, #F57C00)"
                  : "linear-gradient(135deg, #64B5F6, #1565C0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {getInitials(p.user?.username || "?")}
            </div>
            <span
              style={{
                flex: 1,
                fontSize: "14px",
                fontWeight: isWinner ? "600" : "400",
                color: isWinner ? "#FFD700" : "rgba(255,255,255,0.9)",
              }}
            >
              {p.user?.username || "Unknown"}
            </span>
            {isWinner && <Crown size={16} color="#FFD700" style={{ flexShrink: 0 }} />}
          </div>
        );
      })}

      {match.contest && (
        <div
          style={{
            marginTop: "10px",
            paddingTop: "10px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            fontSize: "11px",
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
          }}
        >
          Contest #{match.contest.codeforcesContestId}
        </div>
      )}
    </div>
  );

  // ---- Group Card ----
  const GroupCard = ({ group, players }: { group: string; players: Participant[] }) => (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: "12px",
        padding: "16px",
        border: "1px solid rgba(255,255,255,0.06)",
        width: "100%",
        maxWidth: "280px",
        margin: "0 auto",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(41,121,255,0.2)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${getGroupColor(group)}, ${getGroupColor(group)}cc)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "14px",
              color: "white",
            }}
          >
            {group}
          </div>
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#64B5F6" }}>
            Group {group}
          </span>
        </div>
        <Badge tone="blue">
          {players.length} {players.length === 1 ? "participant" : "participants"}
        </Badge>
      </div>

      {players.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {players
            .sort((a, b) => (a.seed || 999) - (b.seed || 999))
            .map((p) => {
              const isEliminated = p.status === "ELIMINATED";
              const isTopSeed = p.seed && p.seed <= 2;

              return (
                <div
                  key={p._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: isEliminated
                      ? "rgba(255,0,0,0.05)"
                      : isTopSeed
                        ? "rgba(255,215,0,0.05)"
                        : "transparent",
                    border:
                      isTopSeed && !isEliminated
                        ? "1px solid rgba(255,215,0,0.1)"
                        : "1px solid transparent",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: isEliminated
                        ? "rgba(255,255,255,0.05)"
                        : isTopSeed
                          ? "rgba(255,215,0,0.1)"
                          : "linear-gradient(135deg, #78909C, #37474F)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "700",
                      color: isEliminated
                        ? "rgba(255,255,255,0.3)"
                        : isTopSeed
                          ? "#FFD700"
                          : "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {p.seed || "?"}
                  </div>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "13px",
                      color: isEliminated ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.9)",
                      fontWeight: isTopSeed && !isEliminated ? "600" : "400",
                    }}
                  >
                    {p.user?.username || "Unknown"}
                  </span>
                  {isTopSeed && !isEliminated && (
                    <span style={{ fontSize: "12px", color: "#FFD700" }}>⭐</span>
                  )}
                  <Badge
                    tone={isEliminated ? "muted" : "green"}
                    style={{ fontSize: "9px", padding: "1px 6px" }}
                  >
                    {p.status || "ACTIVE"}
                  </Badge>
                </div>
              );
            })}
        </div>
      ) : (
        <div style={{ padding: "20px 0" }}>
          <EmptyState label="Awaiting draw" />
        </div>
      )}
    </div>
  );

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
          {/* Header with Tournament Selector */}
          <header
            style={{
              marginBottom: "40px",
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
                style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}
              >
                CODE ARENA 2026
              </div>
              <h1
                style={{
                  fontSize: "clamp(32px, 5vw, 52px)",
                  fontWeight: "800",
                  margin: "0 0 6px 0",
                  background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Championship Bracket
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "16px" }}>
                The road to the crown
              </p>
            </div>

            {/* Tournament Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <Badge
                tone={isCompleted ? "gold" : "blue"}
                style={{ fontSize: "14px", padding: "8px 20px" }}
              >
                {selectedTournament?.status || "REGISTRATION"}
              </Badge>

              {tournaments.length > 1 && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowTournamentMenu(!showTournamentMenu)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.05)",
                      color: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                  >
                    <Trophy size={18} color="#FFD700" />
                    <span>{selectedTournament?.name || "Select Tournament"}</span>
                    <ChevronDown
                      size={16}
                      style={{
                        transition: "transform 0.2s ease",
                        transform: showTournamentMenu ? "rotate(180deg)" : "none",
                      }}
                    />
                  </button>

                  {showTournamentMenu && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        minWidth: "280px",
                        background: "#1e293b",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        overflow: "hidden",
                        zIndex: 100,
                        maxHeight: "300px",
                        overflowY: "auto",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                      }}
                    >
                      {tournaments.map((tournament) => (
                        <button
                          key={tournament._id}
                          onClick={() => handleTournamentChange(tournament)}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "none",
                            background:
                              selectedTournament?._id === tournament._id
                                ? "rgba(59,130,246,0.2)"
                                : "transparent",
                            color: "white",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background 0.15s ease",
                            borderLeft:
                              selectedTournament?._id === tournament._id
                                ? "3px solid #3b82f6"
                                : "3px solid transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedTournament?._id !== tournament._id) {
                              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTournament?._id !== tournament._id) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight:
                                selectedTournament?._id === tournament._id ? "600" : "500",
                              color:
                                selectedTournament?._id === tournament._id ? "#60a5fa" : "#f1f5f9",
                            }}
                          >
                            {tournament.name}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#94a3b8",
                              marginTop: "4px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span>{tournament.status || "Upcoming"}</span>
                            <span>•</span>
                            <span>{tournament.maxParticipants || 0} participants</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => selectedTournament && loadBracket(selectedTournament._id)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                }}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </header>

          {/* Tournament Info Card */}
          {selectedTournament && (
            <Card
              style={{
                padding: "20px 24px",
                marginBottom: "32px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Tournament
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "white" }}>
                    {selectedTournament.name}
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
                    <Calendar size={14} style={{ marginRight: "4px", display: "inline" }} />
                    Stage
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#64B5F6" }}>
                    {selectedTournament.currentStage || selectedTournament.status || "Registration"}
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
                    <Users size={14} style={{ marginRight: "4px", display: "inline" }} />
                    Participants
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "white" }}>
                    {selectedTournament.participantCount || selectedTournament.maxParticipants || 0}
                  </div>
                </div>
              </div>
              <Badge tone={isCompleted ? "gold" : "blue"}>
                {isCompleted ? "🏆 COMPLETED" : "🔄 IN PROGRESS"}
              </Badge>
            </Card>
          )}

          {/* Bracket columns - horizontal scroll on small screens */}
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              gap: "32px",
              overflowX: "auto",
              paddingBottom: "20px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.2) transparent",
            }}
          >
            {/* Group Stage */}
            <section style={{ flex: "0 0 auto", minWidth: "300px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                GROUP STAGE
              </h3>
              {bracket?.groupStage && Object.keys(bracket.groupStage).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {Object.entries(bracket.groupStage)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([group, players]) => (
                      <GroupCard key={group} group={group} players={players} />
                    ))}
                </div>
              ) : (
                <div style={{ padding: "20px" }}>
                  <EmptyState label="Groups not yet drawn" />
                </div>
              )}
            </section>

            {/* Connector arrow */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "rgba(255,255,255,0.15)",
              }}
            >
              <ChevronRight size={32} />
            </div>

            {/* Quarter Finals */}
            <section style={{ flex: "0 0 auto", minWidth: "300px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                QUARTER FINALS
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {bracket?.quarterFinal?.length ? (
                  bracket.quarterFinal.map((match) => (
                    <MatchCard key={match.matchNumber} match={match} />
                  ))
                ) : (
                  <div style={{ padding: "20px" }}>
                    <EmptyState label="Quarter finals pending" />
                  </div>
                )}
              </div>
            </section>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "rgba(255,255,255,0.15)",
              }}
            >
              <ChevronRight size={32} />
            </div>

            {/* Semi Finals */}
            <section style={{ flex: "0 0 auto", minWidth: "300px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                SEMIFINALS
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {bracket?.semiFinal?.length ? (
                  bracket.semiFinal.map((match) => (
                    <MatchCard key={match.matchNumber} match={match} />
                  ))
                ) : (
                  <div style={{ padding: "20px" }}>
                    <EmptyState label="Semifinals pending" />
                  </div>
                )}
              </div>
            </section>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "rgba(255,255,255,0.15)",
              }}
            >
              <ChevronRight size={32} />
            </div>

            {/* Final & Champion */}
            <section style={{ flex: "0 0 auto", minWidth: "300px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                GRAND FINAL
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                {bracket?.final ? (
                  <MatchCard match={bracket.final} />
                ) : (
                  <div style={{ padding: "20px" }}>
                    <EmptyState label="Finalists pending" />
                  </div>
                )}

                {/* Champion Card */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "280px",
                    background: bracket?.champion
                      ? "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,152,0,0.08))"
                      : "linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,152,0,0.02))",
                    borderRadius: "16px",
                    padding: "24px 20px",
                    border: bracket?.champion
                      ? "2px solid rgba(255,215,0,0.3)"
                      : "1px solid rgba(255,215,0,0.1)",
                    textAlign: "center",
                    marginTop: "12px",
                    boxShadow: bracket?.champion
                      ? "0 8px 32px rgba(255,215,0,0.15)"
                      : "0 4px 16px rgba(255,215,0,0.05)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "linear-gradient(145deg, #0a0e1a 0%, #12172f 50%, #0a0e1a 100%)",
                      padding: "0 12px",
                    }}
                  >
                    <Trophy
                      size={32}
                      color={bracket?.champion ? "#FFD700" : "rgba(255,215,0,0.3)"}
                    />
                  </div>
                  <div style={{ marginTop: "16px" }}>
                    <small
                      style={{
                        color: bracket?.champion ? "rgba(255,215,0,0.8)" : "rgba(255,255,255,0.3)",
                        fontSize: "11px",
                        letterSpacing: "1px",
                      }}
                    >
                      {bracket?.champion ? "🏆 CHAMPION" : "CROWN AWAITS"}
                    </small>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: "800",
                        margin: "8px 0",
                        background: bracket?.champion
                          ? "linear-gradient(135deg, #FFD700, #F57C00)"
                          : "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {bracket?.champion?.user?.username || "To be crowned"}
                    </div>
                    {bracket?.champion && (
                      <Badge tone="gold" style={{ fontSize: "12px", padding: "4px 16px" }}>
                        🏆 CHAMPION
                      </Badge>
                    )}
                    {!bracket?.champion && bracket?.final && (
                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "12px",
                          color: "rgba(255,255,255,0.3)",
                        }}
                      >
                        Final match in progress...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

// Helper function for group colors
const getGroupColor = (group: string): string => {
  const colors: Record<string, string> = {
    A: "#22C55E",
    B: "#2979FF",
    C: "#F59E0B",
    D: "#38BDF8",
    E: "#14B8A6",
    F: "#0EA5E9",
    G: "#F97316",
    H: "#64748B",
  };
  return colors[group] || "#607D8B";
};

export default Bracket;
