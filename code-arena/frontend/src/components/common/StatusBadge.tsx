// frontend/src/components/common/StatusBadge.tsx
import type { TournamentStatus, ParticipantStatus, RegistrationStatus } from "../../types";
import "./StatusBadge.css";

type BadgeTone = "gold" | "blue" | "green" | "orange" | "purple" | "pink" | "muted" | "red";

interface StatusBadgeProps {
  status: string | TournamentStatus | ParticipantStatus | RegistrationStatus;
  size?: "sm" | "md";
  className?: string;
}

// ---- Tone mapping ------------------------------------------------------

const TONE_MAP: Record<string, BadgeTone> = {
  // Completed / winner / approved → gold
  COMPLETED: "gold",
  CHAMPION: "gold",
  APPROVED: "gold",

  // Registration / advanced / accepted → blue
  REGISTRATION: "blue",
  ADVANCED: "blue",
  ACCEPTED: "blue",

  // Group / active / finished → green
  GROUP_STAGE: "green",
  ACTIVE: "green",
  FINISHED: "green",

  // Quarter final / live / ongoing → orange
  QUARTER_FINAL: "orange",
  LIVE: "orange",
  ONGOING: "orange",

  // Semi final → purple
  SEMI_FINAL: "purple",

  // Final → pink
  FINAL: "pink",

  // Pending / upcoming → muted
  PENDING: "muted",
  UPCOMING: "muted",

  // Rejected / eliminated / cancelled / declined → red
  REJECTED: "red",
  ELIMINATED: "red",
  CANCELLED: "red",
  DECLINED: "red",
};

// ---- Label mapping -----------------------------------------------------

const LABEL_MAP: Record<string, string> = {
  GROUP_STAGE: "Group Stage",
  QUARTER_FINAL: "Quarter Final",
  SEMI_FINAL: "Semi Final",
  REGISTRATION: "Registration",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  UPCOMING: "Upcoming",
  ONGOING: "Ongoing",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DECLINED: "Declined",
  ACCEPTED: "Accepted",
  ADVANCED: "Advanced",
  ELIMINATED: "Eliminated",
  CHAMPION: "Champion",
  LIVE: "Live",
  ACTIVE: "Active",
  FINISHED: "Finished",
};

// ---- Helpers -----------------------------------------------------------

const normalize = (status: string): string => status.replace(/[\s-]+/g, "_").toUpperCase();

const getTone = (status: string): BadgeTone => TONE_MAP[normalize(status)] ?? "muted";

const getLabel = (status: string): string => {
  const key = normalize(status);
  if (LABEL_MAP[key]) return LABEL_MAP[key];

  // Fallback: convert SNAKE_CASE → Title Case
  return key
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// ---- Component ---------------------------------------------------------

export const StatusBadge = ({ status, size = "md", className = "" }: StatusBadgeProps) => {
  const raw = String(status);
  const tone = getTone(raw);
  const label = getLabel(raw);

  const classes = [
    "status-badge",
    `status-badge--${tone}`,
    size === "sm" ? "status-badge--sm" : "status-badge--md",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} role="status" title={label}>
      <span className="status-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
};

export default StatusBadge;
