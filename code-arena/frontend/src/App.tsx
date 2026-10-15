// frontend/src/App.tsx
import { lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdminProvider } from "./context/AdminContext";

// Layouts (eagerly loaded — they wrap everything)
import { PublicLayout } from "./layouts/PublicLayout";
import { ParticipantLayout } from "./layouts/ParticipantLayout";
import AdminLayout from "./layouts/AdminLayout";

// Route guards (small, eagerly loaded)
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";

// Shared fallbacks
import { ErrorState } from "./components/common";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ScrollToTop } from "./components/common/ScrollToTop";

// ============================================================
// Lazy-loaded pages
// ============================================================

// Public
const Home = lazy(() => import("./pages/public/Home"));
const Tournaments = lazy(() => import("./pages/public/Tournaments"));
const TournamentDetails = lazy(() =>
  import("./pages/public/TournamentDetails").then((m) => ({
    default: m.TournamentDetails,
  })),
);
const Bracket = lazy(() => import("./pages/public/Bracket").then((m) => ({ default: m.Bracket })));
const Login = lazy(() => import("./pages/auth/Login").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("./pages/auth/Register").then((m) => ({ default: m.Register })));

// Participant
const ParticipantDashboard = lazy(() => import("./pages/participant/Dashboard"));
const MyTournaments = lazy(() => import("./pages/participant/MyTournaments"));
const ParticipantTournament = lazy(() => import("./pages/participant/ParticipantTournament"));
const ParticipantContests = lazy(() => import("./pages/participant/ParticipantContests"));
const ContestDetails = lazy(() =>
  import("./pages/participant/ContestDetails").then((m) => ({
    default: m.ContestDetails,
  })),
);
const Standings = lazy(() => import("./pages/participant/Standings"));
const Invitations = lazy(() => import("./pages/participant/Invitations"));
const Profile = lazy(() => import("./pages/participant/Profile"));
const ParticipantBracket = lazy(() =>
  import("./pages/participant/ParticipantBracket").then((m) => ({
    default: m.ParticipantBracket,
  })),
);
const ParticipantMatch = lazy(() =>
  import("./pages/participant/ParticipantMatch").then((m) => ({
    default: m.ParticipantMatch,
  })),
);

// Admin
const AdminContestResults = lazy(() => import("./pages/admin/AdminContestResults"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminTournaments = lazy(() => import("./pages/admin/AdminTournaments"));
const AdminTournamentDetail = lazy(() => import("./pages/admin/AdminTournamentDetail"));
const CreateTournament = lazy(() => import("./pages/admin/CreateTournament"));
const EditTournament = lazy(() => import("./pages/admin/EditTournament"));
const AdminParticipants = lazy(() =>
  import("./pages/admin/AdminParticipants").then((m) => ({
    default: m.AdminParticipants,
  })),
);
const AdminGroups = lazy(() =>
  import("./pages/admin/AdminGroups").then((m) => ({
    default: m.AdminGroups,
  })),
);
const AdminContests = lazy(() =>
  import("./pages/admin/AdminContests").then((m) => ({
    default: m.AdminContests,
  })),
);
const AdminInvitations = lazy(() =>
  import("./pages/admin/AdminInvitations").then((m) => ({
    default: m.AdminInvitations,
  })),
);
const AdminVideos = lazy(() =>
  import("./pages/admin/AdminVideos").then((m) => ({
    default: m.AdminVideos,
  })),
);
const AdminStandings = lazy(() =>
  import("./pages/admin/AdminStandings").then((m) => ({
    default: m.AdminStandings,
  })),
);
const AdminBracket = lazy(() =>
  import("./pages/admin/AdminBracket").then((m) => ({
    default: m.AdminBracket,
  })),
);
const AdminMatches = lazy(() =>
  import("./pages/admin/AdminMatches").then((m) => ({
    default: m.AdminMatches,
  })),
);
const AdminLogs = lazy(() =>
  import("./pages/admin/AdminLogs").then((m) => ({ default: m.AdminLogs })),
);
const AdminSettings = lazy(() =>
  import("./pages/admin/AdminSettings").then((m) => ({
    default: m.AdminSettings,
  })),
);

// ============================================================
// Wrappers
// ============================================================

const AdminShell = () => (
  <AdminProvider>
    <AdminLayout />
  </AdminProvider>
);

// ============================================================
// App
// ============================================================

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary fallback={<ErrorState error="Something went wrong." />}>
        <AuthProvider>
          <ScrollToTop />

          <Routes>
            {/* ==========================================================
                PUBLIC
            ========================================================== */}
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="tournaments" element={<Tournaments />} />
              <Route path="tournaments/:id" element={<TournamentDetails />} />
              <Route path="tournaments/:id/bracket" element={<Bracket />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            {/* ==========================================================
                PARTICIPANT
            ========================================================== */}
            <Route element={<ProtectedRoute />}>
              <Route element={<ParticipantLayout />}>
                <Route path="dashboard" element={<ParticipantDashboard />} />
                <Route path="dashboard/tournaments" element={<MyTournaments />} />

                {/* ---- Tournament detail + nested tabs ---- */}
                <Route path="dashboard/tournaments/:id" element={<ParticipantTournament />}>
                  <Route path="contests" element={<ParticipantContests />} />
                  <Route path="standings" element={<Standings />} />
                  <Route path="bracket" element={<ParticipantBracket />} />
                  <Route path="my-match" element={<ParticipantMatch />} />
                </Route>

                {/* Contest detail under a specific tournament */}
                <Route
                  path="dashboard/tournaments/:id/contests/:contestId"
                  element={<ContestDetails />}
                />

                {/* Standalone participant pages */}
                <Route path="dashboard/standings" element={<Standings />} />
                <Route path="dashboard/invitations" element={<Invitations />} />
                <Route path="dashboard/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* ==========================================================
                ADMIN
            ========================================================== */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminShell />}>
                <Route path="admin" element={<AdminDashboard />} />

                <Route path="admin/tournaments" element={<AdminTournaments />} />
                <Route path="admin/tournaments/create" element={<CreateTournament />} />
                <Route path="admin/tournaments/:id" element={<AdminTournamentDetail />} />
                <Route path="admin/tournaments/:id/edit" element={<EditTournament />} />
                <Route path="admin/contests/:contestId/results" element={<AdminContestResults />} />
                <Route path="admin/contests" element={<AdminContests />} />
                <Route path="admin/participants" element={<AdminParticipants />} />
                <Route path="admin/groups" element={<AdminGroups />} />
                <Route path="admin/standings" element={<AdminStandings />} />
                <Route path="admin/bracket" element={<AdminBracket />} />
                <Route path="admin/matches" element={<AdminMatches />} />
                <Route path="admin/videos" element={<AdminVideos />} />
                <Route path="admin/invitations" element={<AdminInvitations />} />
                <Route path="admin/logs" element={<AdminLogs />} />
                <Route path="admin/settings" element={<AdminSettings />} />

                <Route path="admin/tournaments/:id/participants" element={<AdminParticipants />} />
                <Route path="admin/tournaments/:id/groups" element={<AdminGroups />} />
                <Route path="admin/tournaments/:id/contests" element={<AdminContests />} />
                <Route path="admin/tournaments/:id/invitations" element={<AdminInvitations />} />
                <Route path="admin/tournaments/:id/videos" element={<AdminVideos />} />
                <Route path="admin/tournaments/:id/standings" element={<AdminStandings />} />
                <Route path="admin/tournaments/:id/bracket" element={<AdminBracket />} />
                <Route path="admin/tournaments/:id/matches" element={<AdminMatches />} />
              </Route>
            </Route>

            {/* ==========================================================
                FALLBACK
            ========================================================== */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
