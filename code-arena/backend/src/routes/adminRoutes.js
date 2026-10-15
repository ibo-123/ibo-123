const express = require('express');
const router = express.Router();

// Middleware
const { authenticate, authorize } = require('../middleware/auth');

// Controllers
const resultsEntryController = require("../controllers/resultsEntryController");
const tournamentController = require('../controllers/tournamentController');
const contestController = require('../controllers/contestController');

// const resultsEntryController = require("../controllers/resultsEntryController");
const participantController = require('../controllers/participantController');
const auditLogController = require('../controllers/auditLogController');
const matchController = require('../controllers/matchController');
const videoController = require('../controllers/videoSubmissionController');
const standingsController = require('../controllers/standingsController');
const adminController = require('../controllers/adminController');

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

// ============================================
// HEALTH
// ============================================
router.get('/health', (req, res) => res.json({ success: true, message: 'Admin API is healthy' }));

// ============================================
// TOURNAMENT MANAGEMENT
// ============================================
router.post('/tournaments', tournamentController.createTournament);
router.patch('/tournaments/:tournamentId', tournamentController.updateTournament);
router.post('/tournaments/:tournamentId/start', tournamentController.startTournament);
router.post('/tournaments/:tournamentId/advance', tournamentController.advanceTournament);

// ---- Contest result entry ----
router.get(
        "/contests/:contestId/results",
        resultsEntryController.getContestResultsRoster
);

router.post(
        "/contests/:contestId/results",
        resultsEntryController.saveParticipantResult
);

// ---- Rematch ----
router.post("/matches/:matchId/rematch", resultsEntryController.startRematch);
// ============================================
// CONTEST MANAGEMENT — V1 (manual invitations, no Codeforces API)
// ============================================
router.get('/tournaments/:tournamentId/contests', contestController.getAdminContests);
router.post('/tournaments/:tournamentId/contests', contestController.createContest);
router.get('/tournaments/:tournamentId/contests/:contestId', contestController.getContestDetails);
router.patch('/tournaments/:tournamentId/contests/:contestId', contestController.updateContest);
router.post('/tournaments/:tournamentId/contests/:contestId/publish', contestController.publishContestV1);
router.delete('/tournaments/:tournamentId/contests/:contestId', contestController.deleteContestV1);
router.get(
        '/tournaments/:tournamentId/contests/:contestId/participants',
        contestController.getContestEligibleParticipants
);

// ============================================
// LEGACY / NON-V1 CONTEST ROUTES
// (kept for non-admin workflows; NOT used by V1 admin UI)
// ============================================
// Deprecated: Codeforces API-based validation. Kept for backward compatibility.
router.post('/tournaments/:tournamentId/contests/validate/:contestId', contestController.validateCodeforcesContest);

// Codeforces API-based result sync — NOT part of V1, kept for future use
router.post('/tournaments/:tournamentId/contests/:contestId/sync', contestController.syncResults);
router.get('/tournaments/:tournamentId/contests/:contestId/leaderboard', contestController.getLeaderboard);
router.post('/tournaments/:tournamentId/contests/reconcile', contestController.reconcileContestsMatches);
router.post('/tournaments/:tournamentId/contests/bulk-sync', contestController.bulkSyncContests);
router.get(
        "/contests/:contestId/results",
        resultsEntryController.getContestResultsRoster
);

router.post(
        "/contests/:contestId/results",
        resultsEntryController.saveParticipantResult
);
// ============================================
// PARTICIPANT MANAGEMENT
// ============================================
router.get('/tournaments/:tournamentId/participants', participantController.getParticipants);
router.get('/tournaments/:tournamentId/groups', participantController.getGroups);
router.patch('/tournaments/:tournamentId/participants/:participantId', participantController.updateParticipant);
router.patch('/tournaments/:tournamentId/participants/:participantId/approve', participantController.approveParticipant);
router.patch('/tournaments/:tournamentId/participants/:participantId/reject', participantController.rejectParticipant);

// ============================================
// STANDINGS MANAGEMENT
// ============================================
router.get('/tournaments/:tournamentId/standings', standingsController.getTournamentStandings);
router.get('/tournaments/:tournamentId/groups/:groupId/standings', standingsController.getGroupStandings);

// ============================================
// VIDEO SUBMISSION MANAGEMENT
// ============================================
router.get('/contests/:contestId/video-submissions', videoController.getVideoSubmissions);
router.patch('/video-submissions/:submissionId/approve', videoController.approveVideo);
router.patch('/video-submissions/:submissionId/reject', videoController.rejectVideo);

// ============================================
// PENALTY MANAGEMENT
// ============================================
router.post('/contests/:contestId/participants/:participantId/penalty', contestController.addPenalty);

// ============================================
// BRACKET/MATCH MANAGEMENT
// ============================================
router.get('/tournaments/:tournamentId/bracket', tournamentController.getBracket);
router.get('/tournaments/:tournamentId/matches', matchController.getMatches);
router.patch('/matches/:matchId', matchController.updateMatchResult);
router.patch('/matches/:matchId/winner', matchController.updateMatchResult);

// ============================================
// STATS & AUDIT
// ============================================
router.get('/stats', adminController.getAdminStats);
router.get('/audit-logs', auditLogController.getAuditLogs);

// ============================================
// ADMIN SETTINGS
// ============================================
router.get('/settings', adminController.getAdminSettings);
router.patch('/settings', adminController.updateAdminSettings);

module.exports = router;