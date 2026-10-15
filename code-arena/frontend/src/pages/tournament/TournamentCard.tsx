import { Link } from "react-router-dom";
import { Trophy, Users, Calendar, ArrowRight } from "lucide-react";
import { StatusBadge } from "../../components/common/StatusBadge";
import type { Tournament } from "../../types";
import "./TournamentCard.css";

interface TournamentCardProps {
  tournament: Tournament;
}

export const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const formatDate = (date?: string) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const participantCount = tournament.participantCount ?? 0;
  const maxParticipants = tournament.maxParticipants ?? 20;
  const isFull = participantCount >= maxParticipants;
  const fillPercentage = Math.min((participantCount / maxParticipants) * 100, 100);

  return (
    <Link
      to={`/tournaments/${tournament._id}`}
      className="tournament-card group"
      aria-label={`View tournament: ${tournament.name}`}
    >
      {/* Decorative gradient overlay */}
      <div className="card-glow" aria-hidden="true" />

      <div className="card-header">
        <StatusBadge status={tournament.status} />
        <span className={`participant-count${isFull ? " participant-count--full" : ""}`}>
          <Users size={14} />
          {participantCount}/{maxParticipants}
        </span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{tournament.name}</h3>
        <p className="card-description">{tournament.description || "No description provided."}</p>
      </div>

      {/* Progress bar for slots */}
      <div
        className="card-progress"
        role="progressbar"
        aria-valuenow={participantCount}
        aria-valuemin={0}
        aria-valuemax={maxParticipants}
        aria-label={`${participantCount} of ${maxParticipants} slots filled`}
      >
        <div
          className={`card-progress-fill${isFull ? " card-progress-fill--full" : ""}`}
          style={{ width: `${fillPercentage}%` }}
        />
      </div>

      <div className="card-footer">
        <div className="card-meta">
          <span className="card-meta-item">
            <Calendar size={14} />
            {formatDate(tournament.tournamentStart)}
          </span>
          <span className="card-meta-item">
            <Trophy size={14} />
            {maxParticipants} slots
          </span>
        </div>

        <span className="card-cta">
          View
          <ArrowRight size={14} className="card-cta-icon" />
        </span>
      </div>
    </Link>
  );
};
