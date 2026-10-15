// frontend/src/pages/admin/AdminLogs.tsx
import { useEffect, useState, useCallback } from "react";
import { AdminLogsPanel } from "../../components/admin";
// import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { RefreshCw, Activity, Clock, Shield, Calendar, FileText } from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import { useAdmin } from "../../context/AdminContext";
import type { Tournament } from "../../types";

// ---- Design tokens (inline) ------------------------------------------

const c = {
  bg: {
    card: "rgba(255, 255, 255, 0.02)",
    header: "rgba(255, 255, 255, 0.04)",
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
    gold: "#FFD700",
    orange: "#F59E0B",
    purple: "#7DD3FC",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
  },
} as const;

export const AdminLogs = () => {
  const { selectedTournament } = useAdmin();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const tournamentId = selectedTournament?._id;

  // ---- Load tournament (only if not provided by context) -------------
  const fetchTournament = useCallback(async () => {
    if (!tournamentId) return;
    try {
      setError("");
      const { tournaments } = await tournamentApi.list();
      setTournament(tournaments.find((t) => t._id === tournamentId) ?? tournaments[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tournament");
    }
  }, [tournamentId]);

  useEffect(() => {
    let isMounted = true;
    if (!tournamentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchTournament().finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [tournamentId, fetchTournament]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTournament();
    setRefreshing(false);
  };

  if (loading) return <LoadingState label="Loading audit logs..." />;
  if (error) return <ErrorState error={error} />;
  if (!tournamentId || !tournament) {
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
          No tournament selected. Please select a tournament from the sidebar to view its audit
          logs.
        </div>
      </div>
    );
  }

  const isCompleted = tournament.status === "COMPLETED";

  const statCards = [
    {
      label: "Tournament",
      value: tournament.name || "Code Arena 2026",
      icon: <Activity size={18} />,
      color: c.accent.blue,
    },
    {
      label: "Status",
      value: tournament.status || "Registration",
      icon: <Clock size={18} />,
      color: isCompleted ? c.accent.gold : c.accent.green,
    },
    {
      label: "Current Stage",
      value: tournament.currentStage?.replace(/_/g, " ") || "N/A",
      icon: <Calendar size={18} />,
      color: c.accent.orange,
    },
    {
      label: "Audit Mode",
      value: "Enabled",
      icon: <Shield size={18} />,
      color: c.accent.purple,
    },
  ];

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
              <FileText size={24} />
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
                Audit Trail
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
                System Logs
              </h1>
              <div
                style={{
                  fontSize: "13px",
                  color: c.text.muted,
                  marginTop: "2px",
                }}
              >
                Track all administrative actions and system events
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

      {/* ---- Stats row ---- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {statCards.map((stat) => (
          <div
            key={stat.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px 18px",
              borderRadius: c.radius.md,
              background: c.bg.card,
              border: `1px solid ${c.border.subtle}`,
              transition: "transform 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.borderColor = `${stat.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = c.border.subtle;
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: c.radius.sm,
                background: `${stat.color}1a`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: stat.color,
                flexShrink: 0,
              }}
            >
              {stat.icon}
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
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: c.text.primary,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---- Logs panel ---- */}
      <AdminLogsPanel tournamentId={tournament._id} />

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

export default AdminLogs;
