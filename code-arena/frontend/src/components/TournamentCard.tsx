import { Link } from "react-router-dom";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { Calendar, Users, Trophy } from "lucide-react";
import type { Tournament } from "../types";

interface TournamentCardProps {
  tournament: Tournament;
}

export const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const isCompleted = tournament.status === "COMPLETED";
  const isRegistration = tournament.status === "REGISTRATION";

  const statusColor = isCompleted ? "gold" : isRegistration ? "blue" : "muted";
  const statusLabel = tournament.status || "DRAFT";

  return (
    <div
      style={{
        transition: "all 0.3s ease",
        cursor: "pointer",
        height: "100%",
      }}
      onMouseEnter={(e) => {
        const card = e.currentTarget.querySelector(".card-inner") as HTMLElement;
        if (card) {
          card.style.transform = "translateY(-4px)";
          card.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)";
        }
      }}
      onMouseLeave={(e) => {
        const card = e.currentTarget.querySelector(".card-inner") as HTMLElement;
        if (card) {
          card.style.transform = "translateY(0)";
          card.style.boxShadow = "none";
        }
      }}
    >
      <Link
        to={`/tournaments/${tournament._id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Card
          className="card-inner"
          style={{
            padding: "24px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "16px",
            transition: "all 0.3s ease",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px",
              }}
            >
              <Badge tone={statusColor as any}>{statusLabel}</Badge>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                <Trophy size={14} color="#FFD700" />
                <span>{tournament.participantCount || 0}</span>
              </div>
            </div>

            <h3
              style={{
                fontSize: "20px",
                fontWeight: "700",
                margin: "0 0 8px 0",
                color: "white",
              }}
            >
              {tournament.name}
            </h3>

            {tournament.description && (
              <p
                style={{
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.5)",
                  margin: "0 0 16px 0",
                  lineHeight: "1.6",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {tournament.description}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "16px",
                fontSize: "12px",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={14} />
                <span>
                  {tournament.tournamentStart
                    ? new Date(tournament.tournamentStart).toLocaleDateString()
                    : "TBD"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Users size={14} />
                <span>{tournament.maxParticipants || 20} slots</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
};
