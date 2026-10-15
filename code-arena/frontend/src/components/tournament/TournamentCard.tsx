// frontend/src/components/tournament/TournamentCard.tsx
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Trophy, Users, Calendar, ArrowUpRight, Zap, Sparkles } from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import type { Tournament } from "../../types";

interface TournamentCardProps {
  tournament: Tournament;
  variant?: "default" | "compact" | "featured";
}

// ---- Design tokens ---------------------------------------------------

const c = {
  bg: {
    card: "rgba(255, 255, 255, 0.02)",
    cardHover: "rgba(255, 255, 255, 0.03)",
    chip: "rgba(255, 255, 255, 0.04)",
    progress: "rgba(255, 255, 255, 0.04)",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.06)",
    mid: "rgba(255, 255, 255, 0.1)",
  },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.7)",
    muted: "rgba(255, 255, 255, 0.5)",
    faint: "rgba(255, 255, 255, 0.35)",
  },
  radius: { sm: "10px", md: "14px", lg: "20px" },
} as const;

const getStatusColor = (status?: string): string => {
  switch (status) {
    case "REGISTRATION":
    case "DRAFT":
      return "#2979FF";
    case "GROUP_STAGE":
      return "#22C55E";
    case "QUARTER_FINAL":
      return "#F59E0B";
    case "SEMI_FINAL":
      return "#2979FF";
    case "FINAL":
      return "#FFD700";
    case "COMPLETED":
      return "#EAB308";
    case "CANCELLED":
      return "#EF4444";
    default:
      return "#2979FF";
  }
};

export const TournamentCard = ({ tournament, variant = "default" }: TournamentCardProps) => {
  const cardRef = useRef<HTMLAnchorElement>(null);

  const isCompact = variant === "compact";
  const isFeatured = variant === "featured";

  const statusColor = getStatusColor(tournament.status);
  const participantCount = tournament.participantCount || 0;
  const maxParticipants = tournament.maxParticipants || 20;
  const fillPct = Math.min(100, (participantCount / maxParticipants) * 100);
  const isFull = participantCount >= maxParticipants;

  // Track mouse for the radial glow
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mouse-x", `${x}%`);
    el.style.setProperty("--mouse-y", `${y}%`);
  };

  const padding = isCompact ? "18px" : isFeatured ? "28px" : "24px";
  const gap = isCompact ? "12px" : "16px";
  const radius = isCompact ? c.radius.md : isFeatured ? c.radius.lg : c.radius.lg;
  const titleSize = isCompact ? "16px" : isFeatured ? "22px" : "19px";

  return (
    <Link
      ref={cardRef}
      to={`/tournaments/${tournament._id}`}
      onMouseMove={handleMouseMove}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap,
        padding,
        background: c.bg.card,
        border: isFeatured ? "1px solid rgba(255, 215, 0, 0.15)" : `1px solid ${c.border.subtle}`,
        borderRadius: radius,
        textDecoration: "none",
        color: "inherit",
        overflow: "hidden",
        isolation: "isolate",
        transition:
          "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.35s ease, box-shadow 0.35s ease, background-color 0.35s ease",
        // @ts-expect-error CSS custom properties
        "--status-color": statusColor,
        "--mouse-x": "50%",
        "--mouse-y": "50%",
      }}
      className="tc-card"
    >
      {/* Radial cursor glow */}
      <div className="tc-cursor-glow" aria-hidden="true" />

      {/* Ambient status glow */}
      <div className="tc-glow" aria-hidden="true" />

      {/* Top status strip */}
      <div className="tc-status-strip" aria-hidden="true" />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <StatusBadge status={tournament.status} size={isCompact ? "sm" : "md"} />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 10px",
            borderRadius: "999px",
            background: c.bg.chip,
            border: `1px solid ${c.border.subtle}`,
            fontSize: "12px",
            fontWeight: 600,
            color: c.text.muted,
          }}
        >
          <Users size={12} />
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {participantCount}
            <span style={{ color: c.text.faint, fontWeight: 500 }}>/{maxParticipants}</span>
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h3
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            color: c.text.primary,
            margin: 0,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            lineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {tournament.name}
        </h3>

        {!isCompact && tournament.description && (
          <p
            style={{
              fontSize: "13px",
              color: c.text.muted,
              lineHeight: 1.6,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              lineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {tournament.description}
          </p>
        )}
      </div>

      {/* Meta */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 16px",
          fontSize: "12px",
          color: c.text.muted,
          position: "relative",
          zIndex: 1,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Calendar size={12} style={{ opacity: 0.6 }} />
          {tournament.tournamentStart
            ? new Date(tournament.tournamentStart).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "TBD"}
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Trophy size={12} style={{ opacity: 0.6 }} />
          {maxParticipants} slots
        </span>

        {tournament.currentStage && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              color: statusColor,
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            <Zap size={12} style={{ opacity: 0.8 }} />
            {tournament.currentStage.replace(/_/g, " ").toLowerCase()}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "3px",
          width: "100%",
          background: c.bg.progress,
          borderRadius: "999px",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
        role="progressbar"
        aria-valuenow={participantCount}
        aria-valuemin={0}
        aria-valuemax={maxParticipants}
        aria-label={`${participantCount} of ${maxParticipants} slots filled`}
      >
        <div
          style={{
            height: "100%",
            width: `${fillPct}%`,
            background: isFull
              ? "linear-gradient(90deg, #EF5350, #F44336)"
              : `linear-gradient(90deg, ${statusColor}, #64B5F6)`,
            borderRadius: "999px",
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 12px ${isFull ? "rgba(239,83,80,0.5)" : `${statusColor}80`}`,
          }}
        />
      </div>

      {/* Hover arrow */}
      <div
        className="tc-arrow"
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: isCompact ? "14px" : "20px",
          right: isCompact ? "14px" : "20px",
          width: isCompact ? "30px" : "36px",
          height: isCompact ? "30px" : "36px",
          borderRadius: "50%",
          background: "rgba(41, 121, 255, 0.1)",
          border: "1px solid rgba(41, 121, 255, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64B5F6",
          opacity: 0,
          transform: "translate(-6px, 6px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          zIndex: 1,
        }}
      >
        <ArrowUpRight size={16} />
      </div>

      {/* Featured badge */}
      {isFeatured && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 10px",
            borderRadius: "999px",
            background: "rgba(255, 215, 0, 0.12)",
            border: "1px solid rgba(255, 215, 0, 0.3)",
            color: "#FFD700",
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            zIndex: 2,
          }}
        >
          <Sparkles size={10} />
          Featured
        </div>
      )}

      <style>{`
        .tc-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle 400px at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(41, 121, 255, 0.08),
            transparent 60%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 0;
        }

        .tc-card:hover::before {
          opacity: 1;
        }

        .tc-card:hover {
          transform: translateY(-6px);
          border-color: rgba(41, 121, 255, 0.3);
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.4),
            0 0 40px rgba(41, 121, 255, 0.08);
          background: ${c.bg.cardHover};
        }

        .tc-card:hover .tc-arrow {
          opacity: 1;
          transform: translate(0, 0);
        }

        .tc-glow {
          position: absolute;
          top: -50%;
          right: -30%;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: var(--status-color, #2979FF);
          opacity: 0;
          filter: blur(80px);
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 0;
        }

        .tc-card:hover .tc-glow {
          opacity: 0.1;
        }

        .tc-status-strip {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(
            90deg,
            var(--status-color, #2979FF),
            transparent
          );
          opacity: 0.7;
        }

        .tc-cursor-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .tc-card,
          .tc-arrow,
          .tc-card::before,
          .tc-glow {
            transition: none;
          }
          .tc-card:hover {
            transform: none;
          }
        }
      `}</style>
    </Link>
  );
};

export default TournamentCard;
