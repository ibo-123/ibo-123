// frontend/src/pages/public/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Users,
  Calendar,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  ChevronRight,
  Crown,
  Code2,
  Swords,
  Target,
  Flame,
  Star,
  Shield,
  Timer,
  BarChart3,
  GitBranch,
  Video,
  Search,
  PlayCircle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Mail,
  Bell,
  Rocket,
  Globe,
  Medal,
  Activity,
} from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import { TournamentCard } from "../../components/tournament/TournamentCard";
import { LoadingState, ErrorState } from "../../components/common";
import { Badge } from "../../components/ui/Badge";
import type { Tournament } from "../../types";
import "./Home.css";

/* ------------------------------------------------------------------ */
/* Static data                                                         */
/* ------------------------------------------------------------------ */

const PATH_STEPS = [
  {
    stage: 1,
    label: "Group Stage",
    emoji: "🌍",
    color: "#22C55E",
    desc: "Regional qualifiers",
    gradient: "linear-gradient(135deg, #22C55E, #15803D)",
  },
  {
    stage: 2,
    label: "Quarter Final",
    emoji: "⚡",
    color: "#F59E0B",
    desc: "Top 8 battle",
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
  },
  {
    stage: 3,
    label: "Semi Final",
    emoji: "🔥",
    color: "#2979FF",
    desc: "Final four clash",
    gradient: "linear-gradient(135deg, #2979FF, #1565C0)",
  },
  {
    stage: 4,
    label: "Grand Final",
    emoji: "👑",
    color: "#FFD700",
    desc: "Champion crowned",
    gradient: "linear-gradient(135deg, #FFD700, #EAB308)",
  },
] as const;

const PRIZES = [
  {
    rank: "1st",
    icon: <Crown size={36} color="#FFD700" />,
    rankIcon: <Crown size={16} />,
    tone: "gold",
    label: "Grand Prize",
    value: "$10,000",
    desc: "+ Exclusive trophy",
    barWidth: "100%",
  },
  {
    rank: "2nd",
    icon: <Award size={36} color="#2979FF" />,
    rankIcon: <Shield size={16} />,
    tone: "blue",
    label: "Runner Up",
    value: "$5,000",
    desc: "+ Silver medal",
    barWidth: "60%",
  },
  {
    rank: "3rd",
    icon: <Trophy size={36} color="#38BDF8" />,
    rankIcon: <Target size={16} />,
    tone: "purple",
    label: "Third Place",
    value: "$2,500",
    desc: "+ Bronze medal",
    barWidth: "35%",
  },
] as const;

const FEATURES = [
  {
    icon: <Code2 size={20} />,
    title: "Manual Invitations",
    desc: "Admins link Codeforces contests directly — no API keys or OAuth required.",
    color: "#2979FF",
  },
  {
    icon: <GitBranch size={20} />,
    title: "Auto Bracket",
    desc: "Group stage results feed into quarter finals, semis, and the grand final.",
    color: "#38BDF8",
  },
  {
    icon: <Video size={20} />,
    title: "Video Verification",
    desc: "Participants confirm their Codeforces join, then submit proof for review.",
    color: "#22C55E",
  },
  {
    icon: <BarChart3 size={20} />,
    title: "Live Standings",
    desc: "Ranks update instantly as admins enter solved counts and penalty minutes.",
    color: "#F59E0B",
  },
] as const;

const FAQS = [
  {
    q: "How do I join a tournament?",
    a: "Create an account, browse active tournaments, and click Register. Your Codeforces username will be verified before the first contest.",
  },
  {
    q: "Do I need an API key?",
    a: "No. Admins manually link each Codeforces contest. You just join the contest on Codeforces and submit a screenshot for verification.",
  },
  {
    q: "How are standings calculated?",
    a: "Standings combine solved problem counts and penalty minutes across all contests in a stage. Admins enter results after each round.",
  },
  {
    q: "What happens if I miss a contest?",
    a: "Missing a contest gives 0 points for that round. Advance if your cumulative score keeps you in the qualifying zone.",
  },
  {
    q: "Is there a participation fee?",
    a: "Code Arena Championship 2026 is free to enter. All prize money is funded by the platform and sponsors.",
  },
] as const;

const TICKER_ITEMS = [
  "🏆 Championship 2026 registration is open",
  "⚡ Group stage schedule released",
  "🔥 $17,500 total prize pool",
  "👑 New bracket system is live",
  "📊 Live standings updated every hour",
] as const;

const SPONSORS = [
  "CodeForces",
  "TechCorp",
  "DevHub",
  "AlgoLabs",
  "ByteWorks",
  "StackPoint",
] as const;

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const ZERO_TIME: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

const getTimeLeft = (target: string): TimeLeft => {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return ZERO_TIME;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
};

const isZeroTime = (t: TimeLeft) =>
  t.days === 0 && t.hours === 0 && t.minutes === 0 && t.seconds === 0;

const statusTone = (status?: string) => {
  const s = String(status || "").toUpperCase();
  if (s === "REGISTRATION") return "registration";
  if (s === "GROUP_STAGE") return "live";
  return "default";
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type FilterKey = "all" | "registration" | "live" | "upcoming";

export const Home = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(ZERO_TIME);

  // new UI state
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  /* ---- Fetch ---------------------------------------------------- */
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

  /* ---- Derived -------------------------------------------------- */
  const active = useMemo(
    () => tournaments.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"),
    [tournaments],
  );

  const featured = useMemo(
    () =>
      active.find((t) => t.status === "REGISTRATION" || t.status === "GROUP_STAGE") ??
      active[0] ??
      null,
    [active],
  );

  const featuredList = useMemo(() => active.slice(0, 3), [active]);

  const upcoming = useMemo(
    () =>
      active
        .filter((t) => t.tournamentStart)
        .sort(
          (a, b) => new Date(a.tournamentStart!).getTime() - new Date(b.tournamentStart!).getTime(),
        )
        .slice(0, 4),
    [active],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return active.filter((t) => {
      // search
      if (q && !t.name.toLowerCase().includes(q)) return false;

      // filter
      if (filter === "registration" && t.status !== "REGISTRATION") return false;
      if (filter === "live" && t.status !== "GROUP_STAGE") return false;
      if (filter === "upcoming" && !["REGISTRATION", "GROUP_STAGE"].includes(t.status))
        return false;
      return true;
    });
  }, [active, search, filter]);

  const totalCompetitors = useMemo(
    () => active.reduce((sum, t) => sum + (t.participantCount || 0), 0),
    [active],
  );

  const totalContests = useMemo(
    () => active.reduce((sum, t) => sum + (t.contestCount || 0), 0),
    [active],
  );

  /* ---- Countdown ------------------------------------------------ */
  const countdownTarget = featured?.tournamentStart ?? null;

  useEffect(() => {
    if (!countdownTarget) {
      setTimeLeft(ZERO_TIME);
      return;
    }
    setTimeLeft(getTimeLeft(countdownTarget));
    const id = window.setInterval(() => {
      setTimeLeft(getTimeLeft(countdownTarget));
    }, 1000);
    return () => window.clearInterval(id);
  }, [countdownTarget]);

  /* ---- Handlers ------------------------------------------------- */
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Hook this up to your API when ready.
    setSubscribed(true);
    setEmail("");
  };

  /* ---- Render --------------------------------------------------- */
  if (loading) return <LoadingState variant="spinner" size="lg" />;
  if (error) return <ErrorState error={error} />;

  const showCountdown =
    featured?.tournamentStart &&
    !isZeroTime(timeLeft) &&
    (featured.status === "REGISTRATION" || featured.status === "GROUP_STAGE");

  return (
    <div className="public-home">
      {/* ========================================================
          LIVE TICKER
      ======================================================== */}
      <div className="live-ticker" role="status" aria-live="polite">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="ticker-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ========================================================
          HERO
      ======================================================== */}
      <section className="hero-section">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-glow hero-glow-3" />
          <div className="floating-code code-1">{"{ }"}</div>
          <div className="floating-code code-2">{"< />"}</div>
          <div className="floating-code code-3">{"[ ]"}</div>
          <div className="floating-code code-4">{"=>"}</div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Championship Series 2026</span>
            <div className="badge-glow" aria-hidden="true" />
          </div>

          <h1>
            <span className="hero-title-line">Code</span>
            <span className="hero-title-line hero-title-accent">Arena</span>
            <span className="hero-year">2026</span>
          </h1>

          <p className="hero-subtitle">
            Elite competitive programming tournament where coders battle for the ultimate crown.
            <span className="highlight"> $10,000 Prize Pool</span>
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn-primary btn-large">
              <Rocket size={20} />
              <span>Register Now</span>
              <ArrowRight size={20} />
            </Link>
            <Link to="/tournaments" className="btn-secondary btn-large">
              <Trophy size={20} />
              <span>Browse Brackets</span>
            </Link>
            <Link to="/tournaments" className="btn-ghost btn-large">
              <PlayCircle size={20} />
              <span>Watch Demo</span>
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-icon">
                <Users size={20} />
              </div>
              <div className="stat-info">
                <strong>{totalCompetitors.toLocaleString()}</strong>
                <span className="stat-label">Competitors</span>
              </div>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat-item">
              <div className="stat-icon">
                <Trophy size={20} />
              </div>
              <div className="stat-info">
                <strong>{active.length}</strong>
                <span className="stat-label">Active Tournaments</span>
              </div>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat-item">
              <div className="stat-icon">
                <TrendingUp size={20} />
              </div>
              <div className="stat-info">
                <strong>{totalContests || "—"}</strong>
                <span className="stat-label">Live Contests</span>
              </div>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat-item">
              <div className="stat-icon">
                <Globe size={20} />
              </div>
              <div className="stat-info">
                <strong>{new Set(active.map((t) => t.status)).size || 0}</strong>
                <span className="stat-label">Stages</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured tournament */}
        {featured && (
          <div className="hero-featured">
            <div className="featured-card">
              <div className="featured-glow" aria-hidden="true" />

              <div className="featured-header">
                <div className="featured-status">
                  <span
                    className={`status-dot ${
                      featured.status === "REGISTRATION" ? "registration" : "live"
                    }`}
                  />
                  {featured.status === "REGISTRATION"
                    ? "Registration Open"
                    : featured.status === "GROUP_STAGE"
                      ? "Group Stage"
                      : "Live"}
                </div>
                <Badge tone="gold" size="sm" icon={<Star size={12} />}>
                  Featured
                </Badge>
              </div>

              <h3>{featured.name}</h3>
              <p className="featured-description">
                {featured.description || "Join the ultimate coding competition"}
              </p>

              {showCountdown && (
                <div className="featured-countdown">
                  <div className="countdown-label-top">
                    <Timer size={14} />
                    Starts in
                  </div>
                  <div className="countdown-items">
                    <CountdownUnit value={timeLeft.days} label="Days" />
                    <span className="countdown-separator">:</span>
                    <CountdownUnit value={timeLeft.hours} label="Hours" />
                    <span className="countdown-separator">:</span>
                    <CountdownUnit value={timeLeft.minutes} label="Min" />
                    <span className="countdown-separator">:</span>
                    <CountdownUnit value={timeLeft.seconds} label="Sec" />
                  </div>
                </div>
              )}

              <div className="featured-stats">
                <span>
                  <Users size={14} /> {featured.participantCount || 0} participants
                </span>
                <span>
                  <Calendar size={14} />{" "}
                  {featured.tournamentStart
                    ? new Date(featured.tournamentStart).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBD"}
                </span>
                <span>
                  <Zap size={14} /> {featured.currentStage?.replace(/_/g, " ") || "Registration"}
                </span>
              </div>

              <Link to={`/tournaments/${featured._id}`} className="featured-action">
                <span>View Tournament</span>
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================
          SPOTLIGHT — up to 3 featured tournaments
      ======================================================== */}
      {featuredList.length > 0 && (
        <section className="spotlight-section">
          <div className="section-header">
            <div className="section-title">
              <div className="section-icon section-icon--gold">
                <Flame size={24} />
              </div>
              <h2>In the Spotlight</h2>
            </div>
            <Link to="/tournaments" className="btn-outline">
              <span>See all</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="spotlight-grid">
            {featuredList.map((t) => (
              <Link key={t._id} to={`/tournaments/${t._id}`} className="spotlight-card">
                <div className="spotlight-glow" aria-hidden="true" />
                <div className="spotlight-head">
                  <span className={`status-dot ${statusTone(t.status)}`} aria-hidden="true" />
                  <span className="spotlight-status">{t.status.replace(/_/g, " ")}</span>
                </div>
                <h3 className="spotlight-title">{t.name}</h3>
                <p className="spotlight-desc">
                  {t.description?.slice(0, 90) || "Compete for glory"}
                </p>
                <div className="spotlight-meta">
                  <span>
                    <Users size={13} /> {t.participantCount || 0}
                  </span>
                  <span>
                    <Trophy size={13} /> {t.contestCount || 0} contests
                  </span>
                </div>
                <div className="spotlight-cta">
                  View <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          UPCOMING TIMELINE
      ======================================================== */}
      {upcoming.length > 0 && (
        <section className="timeline-section">
          <div className="section-header">
            <div className="section-title">
              <div className="section-icon section-icon--blue">
                <Calendar size={24} />
              </div>
              <h2>Upcoming Schedule</h2>
            </div>
            <p className="section-subtitle">Mark your calendar — don&apos;t miss these events</p>
          </div>

          <ul className="timeline">
            {upcoming.map((t) => {
              const days = Math.max(
                0,
                Math.ceil((new Date(t.tournamentStart!).getTime() - Date.now()) / 86_400_000),
              );
              return (
                <li key={t._id} className="timeline-item">
                  <div className="timeline-marker" aria-hidden="true">
                    <Calendar size={14} />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-date">
                      {new Date(t.tournamentStart!).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="timeline-name">{t.name}</div>
                    <div className="timeline-meta">
                      <span>
                        <Users size={12} /> {t.participantCount || 0}
                      </span>
                      <span>
                        <Trophy size={12} /> {t.maxParticipants || "—"} max
                      </span>
                    </div>
                  </div>
                  <div className="timeline-badge">{days > 0 ? `${days}d` : "Today"}</div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ========================================================
          FEATURES
      ======================================================== */}
      <section className="features-section">
        <div className="section-header">
          <div className="section-title">
            <div className="section-icon section-icon--blue">
              <Sparkles size={24} />
            </div>
            <h2>Built for Competitive Coding</h2>
          </div>
          <p className="section-subtitle">Everything you need to run a tournament end-to-end</p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="feature-card"
              style={{ "--feature-color": f.color } as React.CSSProperties}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          ROAD TO THE CROWN
      ======================================================== */}
      <section className="path-section">
        <div className="section-header">
          <div className="section-title">
            <div className="section-icon">
              <Crown size={24} />
            </div>
            <h2>The Road to the Crown</h2>
          </div>
          <p className="section-subtitle">Four stages of competition to determine the champion</p>
        </div>

        <div className="path-steps">
          {PATH_STEPS.map((step) => (
            <div key={step.stage} className="path-step">
              <div
                className="step-icon"
                style={{
                  background: step.gradient,
                  boxShadow: `0 0 30px ${step.color}20`,
                }}
              >
                <span>{step.emoji}</span>
              </div>
              <div className="step-content">
                <div className="step-number">Stage {step.stage}</div>
                <div className="step-label">{step.label}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
              {step.stage < PATH_STEPS.length && (
                <div className="step-connector" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          ACTIVE TOURNAMENTS + SEARCH / FILTER
      ======================================================== */}
      <section className="tournaments-section">
        <div className="section-header">
          <div className="section-header-left">
            <div className="section-icon-sm">
              <Swords size={20} />
            </div>
            <div>
              <h2>Active Tournaments</h2>
              <p className="section-subtitle">
                {filtered.length} of {active.length} tournament
                {active.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Link to="/tournaments" className="btn-outline">
            <span>View All</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* Search + filter bar */}
        <div className="browse-bar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            {(
              [
                { key: "all", label: "All", icon: <Activity size={13} /> },
                {
                  key: "registration",
                  label: "Registration",
                  icon: <Bell size={13} />,
                },
                { key: "live", label: "Live", icon: <Zap size={13} /> },
                {
                  key: "upcoming",
                  label: "Upcoming",
                  icon: <Calendar size={13} />,
                },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                className={`filter-chip${filter === f.key ? " active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="tournaments-grid">
            {filtered.slice(0, 6).map((t) => (
              <TournamentCard key={t._id} tournament={t} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <Trophy size={48} />
            </div>
            <h3>No tournaments match</h3>
            <p>Try a different search or filter</p>
          </div>
        )}
      </section>

      {/* ========================================================
          LEADERBOARD PREVIEW
      ======================================================== */}
      {featured && (
        <section className="leaderboard-preview-section">
          <div className="section-header">
            <div className="section-title">
              <div className="section-icon section-icon--gold">
                <Medal size={24} />
              </div>
              <h2>Top Competitors</h2>
            </div>
            <Link to={`/tournaments/${featured._id}/standings`} className="btn-outline">
              <span>Full Standings</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="leaderboard-preview">
            {[
              { rank: 1, name: "ByteWizard", score: 1240, country: "🇺🇸" },
              { rank: 2, name: "Neo_42", score: 1180, country: "🇩🇪" },
              { rank: 3, name: "Quantum", score: 1090, country: "🇯🇵" },
            ].map((p) => (
              <div key={p.rank} className={`lb-row lb-rank-${p.rank}`}>
                <div className="lb-rank">
                  {p.rank === 1 ? (
                    <Crown size={18} />
                  ) : p.rank === 2 ? (
                    <Medal size={18} />
                  ) : (
                    <Award size={18} />
                  )}
                  <span>#{p.rank}</span>
                </div>
                <div className="lb-avatar">{p.name.charAt(0).toUpperCase()}</div>
                <div className="lb-info">
                  <div className="lb-name">
                    {p.name} <span className="lb-flag">{p.country}</span>
                  </div>
                  <div className="lb-meta">Top competitor</div>
                </div>
                <div className="lb-score">
                  <strong>{p.score}</strong>
                  <span>pts</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          PRIZE POOL
      ======================================================== */}
      <section className="rewards-section">
        <div className="section-header">
          <div className="section-title">
            <div className="section-icon">
              <Award size={24} />
            </div>
            <h2>Prize Pool</h2>
          </div>
          <p className="section-subtitle">$17,500 total prize pool across all placements</p>
        </div>

        <div className="rewards-grid">
          {PRIZES.map((prize) => (
            <div key={prize.rank} className={`reward-card reward-card-${prize.tone}`}>
              <div className="reward-glow" aria-hidden="true" />
              <div className="reward-rank">
                {prize.rankIcon}
                {prize.rank}
              </div>
              <div className="reward-icon">{prize.icon}</div>
              <div className="reward-content">
                <div className="reward-label">{prize.label}</div>
                <div className="reward-value">{prize.value}</div>
                <div className="reward-desc">{prize.desc}</div>
              </div>
              <div
                className="reward-bar"
                style={{
                  width: prize.barWidth,
                  background:
                    prize.tone === "gold"
                      ? "linear-gradient(90deg, #FFD700, #EAB308)"
                      : prize.tone === "blue"
                        ? "linear-gradient(90deg, #2979FF, #1565C0)"
                        : "linear-gradient(90deg, #38BDF8, #0284C7)",
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          SPONSORS
      ======================================================== */}
      <section className="sponsors-section">
        <div className="section-header">
          <div className="section-title">
            <div className="section-icon section-icon--blue">
              <Shield size={24} />
            </div>
            <h2>Backed by the Community</h2>
          </div>
          <p className="section-subtitle">Trusted by teams and platforms worldwide</p>
        </div>
        <div className="sponsors-row">
          {SPONSORS.map((s) => (
            <div key={s} className="sponsor-pill">
              {s}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          FAQ
      ======================================================== */}
      <section className="faq-section">
        <div className="section-header">
          <div className="section-title">
            <div className="section-icon section-icon--gold">
              <HelpCircle size={24} />
            </div>
            <h2>Frequently Asked Questions</h2>
          </div>
          <p className="section-subtitle">Everything you need to know before you jump in</p>
        </div>

        <div className="faq-list">
          {FAQS.map((item, idx) => {
            const open = openFaq === idx;
            return (
              <div key={item.q} className={`faq-item${open ? " open" : ""}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenFaq(open ? null : idx)}
                  aria-expanded={open}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} className={`faq-chevron${open ? " rotated" : ""}`} />
                </button>
                <div className="faq-answer" hidden={!open}>
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          CTA
      ======================================================== */}
      <section className="cta-section">
        <div className="cta-content">
          <div className="cta-bg" aria-hidden="true">
            <div className="cta-glow-1" />
            <div className="cta-glow-2" />
          </div>

          <div className="cta-text">
            <div className="cta-badge">
              <Flame size={16} />
              Join the Arena
            </div>
            <h2>Ready to Compete?</h2>
            <p>
              Register now and secure your spot in the Code Arena Championship 2026. Battle against
              the best coders and claim your glory.
            </p>
            <div className="cta-features">
              <span>
                <Code2 size={14} /> Manual invitations
              </span>
              <span>
                <BarChart3 size={14} /> Live leaderboard
              </span>
              <span>
                <Zap size={14} /> Instant advancement
              </span>
            </div>
          </div>

          <div className="cta-actions">
            <Link to="/register" className="btn-primary btn-large">
              <span>Register Now</span>
              <ArrowRight size={20} />
            </Link>
            <Link to="/tournaments" className="btn-secondary btn-large">
              Browse Tournaments
            </Link>
          </div>
        </div>

        {/* Newsletter */}
        <form className="newsletter" onSubmit={handleSubscribe}>
          <div className="newsletter-icon">
            <Mail size={20} />
          </div>
          <div className="newsletter-text">
            <strong>Stay in the loop</strong>
            <span>Get notified about new tournaments and results.</span>
          </div>
          {subscribed ? (
            <div className="newsletter-success">
              <CheckCircle2 size={16} /> Subscribed!
            </div>
          ) : (
            <div className="newsletter-input">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                Subscribe
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

interface CountdownUnitProps {
  value: number;
  label: string;
}

const CountdownUnit = ({ value, label }: CountdownUnitProps) => (
  <div className="countdown-item">
    <span className="countdown-value">{String(value).padStart(2, "0")}</span>
    <span className="countdown-label">{label}</span>
  </div>
);

export default Home;
