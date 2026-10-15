// frontend/src/pages/admin/AdminInvitations.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Calendar,
} from "lucide-react";
// import { Badge } from "../../components/ui";
import { useAdmin } from "../../context/AdminContext";

interface Invitation {
  _id: string;
  participantId: string;
  contestId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  updatedAt: string;
  participant?: {
    user?: {
      name?: string;
      username?: string;
    };
  };
  contest?: {
    codeforcesContestName?: string;
    name?: string;
    stage?: string;
  };
}

type FilterStatus = "all" | "pending" | "accepted" | "declined";

// ---- Tokens ----------------------------------------------------------

const c = {
  bg: {
    card: "rgba(255, 255, 255, 0.02)",
    header: "rgba(255, 255, 255, 0.04)",
    hover: "rgba(255, 255, 255, 0.03)",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.06)",
    mid: "rgba(255, 255, 255, 0.1)",
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

const STATUS_META: Record<FilterStatus, { label: string; color: string }> = {
  all: { label: "All", color: c.accent.blue },
  pending: { label: "Pending", color: c.accent.gold },
  accepted: { label: "Accepted", color: c.accent.green },
  declined: { label: "Declined", color: c.accent.red },
};

const getStatusTone = (
  status: string,
): { color: string; bg: string; border: string; icon: React.ReactNode } => {
  switch (status) {
    case "ACCEPTED":
      return {
        color: c.accent.green,
        bg: "rgba(76, 175, 80, 0.12)",
        border: "rgba(76, 175, 80, 0.25)",
        icon: <CheckCircle size={12} />,
      };
    case "DECLINED":
      return {
        color: c.accent.red,
        bg: "rgba(239, 83, 80, 0.12)",
        border: "rgba(239, 83, 80, 0.25)",
        icon: <XCircle size={12} />,
      };
    default:
      return {
        color: c.accent.gold,
        bg: "rgba(255, 215, 0, 0.12)",
        border: "rgba(255, 215, 0, 0.25)",
        icon: <Clock size={12} />,
      };
  }
};

const formatStage = (stage?: string): string => (stage ? stage.replace(/_/g, " ") : "—");

export const AdminInvitations: React.FC = () => {
  const { selectedTournament } = useAdmin();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [refreshing, setRefreshing] = useState(false);

  const tournamentId = selectedTournament?._id;
  const token = localStorage.getItem("code-arena-token");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // ---- Load invitations ----------------------------------------------
  const loadInvitations = useCallback(
    async (tId: string, showSpinner = true) => {
      try {
        if (showSpinner) setLoading(true);
        setError(null);

        let url = `${API_URL}/admin/tournaments/${tId}/invitations`;
        if (filter !== "all") {
          url += `?status=${filter.toUpperCase()}`;
        }

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch invitations: ${response.statusText}`);
        }

        const data = await response.json();
        setInvitations(data.invitations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invitations");
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [API_URL, filter, token],
  );

  useEffect(() => {
    if (tournamentId) {
      loadInvitations(tournamentId);
    } else {
      setLoading(false);
    }
  }, [tournamentId, loadInvitations]);

  const handleRefresh = async () => {
    if (!tournamentId) return;
    setRefreshing(true);
    await loadInvitations(tournamentId, false);
    setRefreshing(false);
  };

  // ---- Stats ---------------------------------------------------------
  const counts = {
    all: invitations.length,
    pending: invitations.filter((i) => i.status === "PENDING").length,
    accepted: invitations.filter((i) => i.status === "ACCEPTED").length,
    declined: invitations.filter((i) => i.status === "DECLINED").length,
  };

  // ---- Empty: no tournament ------------------------------------------
  if (!tournamentId) {
    return (
      <div style={{ padding: "24px 0" }}>
        <div
          style={{
            padding: "24px",
            borderRadius: c.radius.lg,
            background: "rgba(255, 215, 0, 0.06)",
            border: `1px solid rgba(255, 215, 0, 0.25)`,
            color: c.accent.gold,
            fontSize: "14px",
          }}
        >
          No tournament selected. Please select a tournament from the sidebar to view invitations.
        </div>
      </div>
    );
  }

  // ---- Loading -------------------------------------------------------
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          color: c.text.muted,
          gap: "10px",
        }}
      >
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }} />
        Loading invitations...
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 0" }}>
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
            background: "radial-gradient(circle, rgba(41, 121, 255, 0.15), transparent 70%)",
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
                background: "linear-gradient(135deg, #2979FF, #EAB308)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 12px 32px rgba(41, 121, 255, 0.35)",
                flexShrink: 0,
              }}
            >
              <Mail size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  color: "rgba(100, 181, 246, 0.85)",
                  marginBottom: "2px",
                }}
              >
                Contest Invitations
              </div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "-0.01em",
                  background: "linear-gradient(135deg, #FFFFFF, #90CAF9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Invitation Management
              </h1>
              <div
                style={{
                  fontSize: "13px",
                  color: c.text.muted,
                  marginTop: "2px",
                }}
              >
                {selectedTournament.name} · {counts.all} invitation
                {counts.all !== 1 ? "s" : ""}
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

      {/* ---- Stat cards ---- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          icon={<Mail size={18} />}
          label="Total"
          value={counts.all}
          color={c.accent.blue}
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Pending"
          value={counts.pending}
          color={c.accent.gold}
        />
        <StatCard
          icon={<CheckCircle size={18} />}
          label="Accepted"
          value={counts.accepted}
          color={c.accent.green}
        />
        <StatCard
          icon={<XCircle size={18} />}
          label="Declined"
          value={counts.declined}
          color={c.accent.red}
        />
      </div>

      {/* ---- Filter chips ---- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
          padding: "12px 16px",
          borderRadius: c.radius.md,
          background: c.bg.card,
          border: `1px solid ${c.border.subtle}`,
          marginBottom: "20px",
        }}
      >
        {(["all", "pending", "accepted", "declined"] as FilterStatus[]).map((status) => {
          const meta = STATUS_META[status];
          const isActive = filter === status;
          const count = counts[status];

          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "999px",
                background: isActive ? `${meta.color}1a` : "rgba(255,255,255,0.03)",
                border: isActive ? `1px solid ${meta.color}40` : "1px solid rgba(255,255,255,0.06)",
                color: isActive ? meta.color : c.text.muted,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.15s ease",
              }}
            >
              {meta.label}
              <span
                style={{
                  padding: "1px 7px",
                  borderRadius: "999px",
                  background: isActive ? `${meta.color}25` : "rgba(255,255,255,0.05)",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---- Error ---- */}
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
          <XCircle size={18} />
          {error}
        </div>
      )}

      {/* ---- Content ---- */}
      {invitations.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            gap: "16px",
            textAlign: "center",
            background: c.bg.card,
            borderRadius: c.radius.lg,
            border: `1px dashed ${c.border.mid}`,
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "24px",
              background: "rgba(100, 181, 246, 0.06)",
              border: "1px solid rgba(100, 181, 246, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: c.accent.blue,
              marginBottom: "8px",
            }}
          >
            <Mail size={40} />
          </div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: c.text.secondary,
              margin: 0,
            }}
          >
            No invitations found
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: c.text.muted,
              margin: 0,
              maxWidth: "400px",
              lineHeight: 1.6,
            }}
          >
            {filter === "all"
              ? "Invitations will appear here once contests are published."
              : `No ${filter} invitations match the current filter.`}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: c.bg.card,
            border: `1px solid ${c.border.subtle}`,
            borderRadius: c.radius.lg,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr style={{ background: c.bg.header }}>
                  <Th>Participant</Th>
                  <Th>Contest</Th>
                  <Th align="center">Stage</Th>
                  <Th>Sent</Th>
                  <Th align="center">Status</Th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => {
                  const name = invitation.participant?.user?.name || "Unknown";
                  const username = invitation.participant?.user?.username || "unknown";
                  const initial = name.charAt(0).toUpperCase();
                  const tone = getStatusTone(invitation.status);

                  return (
                    <tr
                      key={invitation._id}
                      style={{
                        borderTop: `1px solid ${c.border.subtle}`,
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = c.bg.hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Participant */}
                      <td style={{ padding: "14px 20px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "10px",
                              background: "linear-gradient(135deg, #2979FF, #EAB308)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: "13px",
                              flexShrink: 0,
                            }}
                          >
                            {initial}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: c.text.primary,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: c.text.muted,
                              }}
                            >
                              @{username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contest */}
                      <td
                        style={{
                          padding: "14px 20px",
                          color: c.text.secondary,
                          fontSize: "13px",
                        }}
                      >
                        {invitation.contest?.name ||
                          invitation.contest?.codeforcesContestName ||
                          "Unknown"}
                      </td>

                      {/* Stage */}
                      <td
                        style={{
                          padding: "14px 20px",
                          textAlign: "center",
                        }}
                      >
                        {invitation.contest?.stage ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "3px 10px",
                              borderRadius: "6px",
                              background: "rgba(41, 121, 255, 0.1)",
                              border: "1px solid rgba(41, 121, 255, 0.2)",
                              color: c.accent.blue,
                              fontSize: "11px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            {formatStage(invitation.contest.stage)}
                          </span>
                        ) : (
                          <span style={{ color: c.text.faint }}>—</span>
                        )}
                      </td>

                      {/* Sent */}
                      <td
                        style={{
                          padding: "14px 20px",
                          color: c.text.muted,
                          fontSize: "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Calendar size={12} />
                          {new Date(invitation.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Status */}
                      <td
                        style={{
                          padding: "14px 20px",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 12px",
                            borderRadius: "999px",
                            background: tone.bg,
                            border: `1px solid ${tone.border}`,
                            color: tone.color,
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {tone.icon}
                          {invitation.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
};

// ---- Small helpers ---------------------------------------------------

interface ThProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}

const Th: React.FC<ThProps> = ({ children, align = "left" }) => (
  <th
    style={{
      padding: "14px 20px",
      textAlign: align,
      fontSize: "11px",
      fontWeight: 700,
      color: "rgba(255, 255, 255, 0.4)",
      textTransform: "uppercase",
      letterSpacing: "1px",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </th>
);

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
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
    <div>
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
          fontSize: "20px",
          fontWeight: 800,
          color: c.text.primary,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

export default AdminInvitations;
