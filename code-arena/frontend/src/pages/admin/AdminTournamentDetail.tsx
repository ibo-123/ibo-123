// frontend/src/pages/admin/AdminTournamentDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, Users, Calendar } from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { Tournament } from "../../types";

const AdminTournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tabs = [
    { path: "participants", label: "Participants" },
    { path: "groups", label: "Groups" },
    { path: "contests", label: "Contests" },
    { path: "invitations", label: "Invitations" },
    { path: "videos", label: "Videos" },
    { path: "standings", label: "Standings" },
    { path: "bracket", label: "Bracket" },
  ];

  useEffect(() => {
    if (!id) return;
    tournamentApi
      .get(id)
      .then(({ tournament }) => setTournament(tournament))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!tournament) return <div>Tournament not found</div>;

  return (
    <div className="admin-tournament-detail">
      <div className="detail-header">
        <Link to="/admin/tournaments" className="back-link">
          <ArrowLeft size={18} />
          Back to Tournaments
        </Link>
        <h1>{tournament.name}</h1>
        <div className="header-meta">
          <StatusBadge status={tournament.status} />
          <span>
            <Users size={14} /> {tournament.participantCount || 0}
          </span>
          <span>
            <Calendar size={14} />{" "}
            {tournament.tournamentStart
              ? new Date(tournament.tournamentStart).toLocaleDateString()
              : "TBD"}
          </span>
        </div>
      </div>

      <div className="tabs-nav">
        {tabs.map((tab) => {
          const isActive = location.pathname.includes(tab.path);
          return (
            <Link
              key={tab.path}
              to={`/admin/tournaments/${id}/${tab.path}`}
              className={`tab-link ${isActive ? "active" : ""}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="tab-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminTournamentDetail;
