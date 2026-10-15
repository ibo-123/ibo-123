// frontend/src/pages/public/Tournaments.tsx
import { useEffect, useMemo, useState } from "react";
import { Search, Filter, ChevronDown, X, Trophy } from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import { TournamentCard } from "../../components/tournament/TournamentCard";
import { LoadingState, ErrorState, StatusBadge } from "../../components/common";
import type { Tournament } from "../../types";
import "./Tournaments.css";

type SortOption = "newest" | "oldest" | "participants";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "participants", label: "Most Participants" },
];

const formatStatusLabel = (status: string): string =>
  status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const Tournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;

    tournamentApi
      .list()
      .then(({ tournaments }) => {
        if (!cancelled) setTournaments(tournaments);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Derived data (memoized) -----------------------------------------

  const availableStatuses = useMemo(
    () => ["all", ...new Set(tournaments.map((t) => t.status))],
    [tournaments],
  );

  const stats = useMemo(() => {
    const active = tournaments.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED",
    ).length;
    const participants = tournaments.reduce((sum, t) => sum + (t.participantCount || 0), 0);
    return { total: tournaments.length, active, participants };
  }, [tournaments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const matches = tournaments.filter((t) => {
      const matchesSearch =
        !q || t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      const matchesFilter = filter === "all" || t.status === filter;
      return matchesSearch && matchesFilter;
    });

    return matches.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "participants":
          return (b.participantCount || 0) - (a.participantCount || 0);
        default:
          return 0;
      }
    });
  }, [tournaments, search, filter, sortBy]);

  const activeFilterCount = (filter !== "all" ? 1 : 0) + (search.trim() ? 1 : 0);

  const hasAnyFilter = filter !== "all" || search.trim() !== "" || sortBy !== "newest";

  // ---- Handlers ---------------------------------------------------------

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
    setSortBy("newest");
  };

  // ---- Render -----------------------------------------------------------

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="tournaments-page">
      {/* Page Header */}
      <header className="page-header">
        <div className="header-content">
          <div className="header-intro">
            <div className="header-badge">
              <Trophy size={16} />
              Tournament Hub
            </div>
            <h1>All Tournaments</h1>
            <p>Browse and join competitive programming tournaments</p>
          </div>

          <div className="header-stats" role="list">
            <div className="stat-chip" role="listitem">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-chip" role="listitem">
              <span className="stat-number">{stats.active}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-chip" role="listitem">
              <span className="stat-number">{stats.participants}</span>
              <span className="stat-label">Participants</span>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Bar */}
      <section className="filters-bar" aria-label="Tournament filters">
        <div className="search-box">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search tournaments by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tournaments"
          />
          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="filters-actions">
          <button
            type="button"
            className="filter-toggle"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="expanded-filters"
          >
            <Filter size={18} />
            Filters
            {activeFilterCount > 0 && (
              <span className="filter-count" aria-label={`${activeFilterCount} active filters`}>
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              size={16}
              className={`chevron ${showFilters ? "open" : ""}`}
              aria-hidden="true"
            />
          </button>

          {hasAnyFilter && (
            <button type="button" className="clear-filters" onClick={clearFilters}>
              <X size={14} />
              Clear all
            </button>
          )}
        </div>
      </section>

      {/* Expanded Filters */}
      {showFilters && (
        <section id="expanded-filters" className="filters-expanded">
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-options" role="group" aria-label="Filter by status">
              {availableStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`filter-option ${filter === status ? "active" : ""}`}
                  onClick={() => setFilter(status)}
                  aria-pressed={filter === status}
                >
                  {status === "all" ? "All" : formatStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <div className="filter-options" role="group" aria-label="Sort tournaments">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`filter-option ${sortBy === option.value ? "active" : ""}`}
                  onClick={() => setSortBy(option.value)}
                  aria-pressed={sortBy === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Results Info */}
      <div className="results-info" aria-live="polite">
        <span>
          Showing <strong>{filtered.length}</strong> tournament
          {filtered.length !== 1 ? "s" : ""}
          {filter !== "all" && (
            <>
              {" "}
              with status <StatusBadge status={filter} size="sm" />
            </>
          )}
        </span>
      </div>

      {/* Tournaments Grid */}
      {filtered.length > 0 ? (
        <div className="tournaments-grid">
          {filtered.map((t) => (
            <TournamentCard key={t._id} tournament={t} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            <Search size={48} />
          </div>
          <h3>No tournaments found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <button type="button" className="btn-primary" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Tournaments;
