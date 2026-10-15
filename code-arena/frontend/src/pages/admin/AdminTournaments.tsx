// frontend/src/pages/admin/AdminTournaments.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Calendar, Users } from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { Tournament } from "../../types";

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    tournamentApi
      .list()
      .then(({ tournaments }) => setTournaments(tournaments))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="admin-tournaments">
      <div className="admin-header">
        <h1>Tournaments</h1>
        <Link to="/admin/tournaments/create" className="btn-primary">
          <Plus size={18} />
          Create Tournament
        </Link>
      </div>

      <div className="tournaments-grid">
        {tournaments.map((t) => (
          <div key={t._id} className="admin-tournament-card">
            <div className="card-header">
              <StatusBadge status={t.status} />
              <div className="card-actions">
                <Link to={`/admin/tournaments/${t._id}`} className="btn-outline btn-sm">
                  Manage
                </Link>
                <Link to={`/admin/tournaments/${t._id}/edit`} className="btn-outline btn-sm">
                  <Edit size={14} />
                </Link>
              </div>
            </div>
            <h3>{t.name}</h3>
            <p>{t.description}</p>
            <div className="card-stats">
              <span>
                <Users size={14} /> {t.participantCount || 0} participants
              </span>
              <span>
                <Calendar size={14} />{" "}
                {t.tournamentStart ? new Date(t.tournamentStart).toLocaleDateString() : "TBD"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTournaments;
