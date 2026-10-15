const express = require('express');

const router = express.Router();

const tournamentController = require('../controllers/tournamentController');
const participantController = require('../controllers/participantController');

const {
  authenticate,
  authorize,
} = require('../middleware/auth');

/*
|--------------------------------------------------------------------------
| PUBLIC TOURNAMENT ROUTES
|--------------------------------------------------------------------------
*/

/**
 * GET /api/tournaments
 * Get all tournaments
 */
router.get(
  '/',
  tournamentController.getTournaments
);

/*
|--------------------------------------------------------------------------
| AUTHENTICATED PARTICIPANT ROUTES
|--------------------------------------------------------------------------
| NOTE: this MUST be registered before "/:id" so that "my-tournaments"
| isn't treated as a tournament id.
*/

/**
 * GET /api/tournaments/my-tournaments
 * Get tournaments the current user is registered in.
 */
router.get(
  '/my-tournaments',
  authenticate,
  participantController.getMyTournaments
);

/*
|--------------------------------------------------------------------------
| SPECIFIC TOURNAMENT SUB-RESOURCES
|--------------------------------------------------------------------------
| These also must come BEFORE "/:id".
*/

/**
 * GET /api/tournaments/:tournamentId/participants
 * Get tournament participants
 */
router.get(
  '/:tournamentId/participants',
  participantController.getParticipants
);

/**
 * GET /api/tournaments/:tournamentId/my-status
 * Get the current user's participant record for a tournament.
 */
router.get(
  '/:tournamentId/my-status',
  authenticate,
  participantController.getMyStatus
);

/**
 * GET /api/tournaments/:tournamentId/groups
 * Get tournament groups
 */
router.get(
  '/:tournamentId/groups',
  participantController.getGroups
);

/**
 * GET /api/tournaments/:tournamentId/bracket
 * Get tournament bracket
 */
router.get(
  '/:tournamentId/bracket',
  tournamentController.getBracket
);

/**
 * GET /api/tournaments/:tournamentId/leaderboard
 * Get tournament leaderboard
 */
router.get(
  '/:tournamentId/leaderboard',
  tournamentController.getLeaderboard
);

/**
 * POST /api/tournaments/:tournamentId/join
 * Join a tournament (participant)
 *
 * Uses participantController so `role: "USER"` accounts can register.
 */
router.post(
  '/:tournamentId/join',
  authenticate,
  participantController.joinTournament
);

/**
 * PATCH /api/tournaments/:tournamentId
 * Update a tournament (Admin only)
 */
router.patch(
  '/:tournamentId',
  authenticate,
  authorize('ADMIN'),
  tournamentController.updateTournament
);

/*
|--------------------------------------------------------------------------
| SINGLE TOURNAMENT — MUST BE LAST AMONG GET ROUTES
|--------------------------------------------------------------------------
*/

/**
 * GET /api/tournaments/:id
 * Get single tournament
 */
router.get(
  '/:id',
  tournamentController.getTournament
);

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

/**
 * POST /api/tournaments
 * Create a new tournament (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  tournamentController.createTournament
);

/**
 * POST /api/tournaments/:tournamentId/start
 * Start tournament and generate Groups A-D
 */
router.post(
  '/:tournamentId/start',
  authenticate,
  authorize('ADMIN'),
  tournamentController.startTournament
);

/**
 * POST /api/tournaments/:tournamentId/advance
 * Advance tournament to the next stage.
 */
router.post(
  '/:tournamentId/advance',
  authenticate,
  authorize('ADMIN'),
  tournamentController.advanceTournament
);

module.exports = router;