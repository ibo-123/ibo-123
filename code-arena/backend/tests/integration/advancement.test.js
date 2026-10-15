// backend/tests/integration/advancement.test.js
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../../src/app");
const { connect, disconnect, clearDatabase } = require("../setup");
const {
        createAdmin,
        createParticipantUser,
        getToken,
        createTournament,
        createParticipant,
        createContest,
        createVideoSubmission,
} = require("../factories");

const Match = require("../../src/models/Match");
const Result = require("../../src/models/Result");

let admin;
let adminToken;

before(async () => {
        await connect();
});

after(async () => {
        await disconnect();
});

beforeEach(async () => {
        await clearDatabase();
        admin = await createAdmin();
        adminToken = getToken(admin);
});

// ============================================================
// Helper — build a QUARTER_FINAL tournament with 4 matches
// and 8 approved participants (2 per match).
// ============================================================
async function buildQF() {
        const tournament = await createTournament(admin, {
                status: "QUARTER_FINAL",
                currentStage: "QUARTER_FINAL",
                numberOfGroups: 4,
                participantsPerGroup: 2,
                maxParticipants: 8,
        });

        const names = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
        const users = await Promise.all(
                names.map((n) => createParticipantUser({ username: n }))
        );
        const participants = await Promise.all(
                users.map((u, i) =>
                        createParticipant(u, tournament, {
                                registrationStatus: "APPROVED",
                                // A, A, B, B, C, C, D, D
                                group: String.fromCharCode(65 + Math.floor(i / 2)),
                                seed: (i % 2) + 1,
                                status: "ADVANCED",
                                currentStage: "QUARTER_FINAL",
                        })
                )
        );

        const matches = [];
        const contests = [];

        for (let i = 0; i < 4; i++) {
                const p1 = participants[i * 2];
                const p2 = participants[i * 2 + 1];

                const match = await Match.create({
                        tournament: tournament._id,
                        stage: "QUARTER_FINAL",
                        matchNumber: i + 1,
                        participants: [p1._id, p2._id],
                });

                const contest = await createContest(tournament, {
                        stage: "QUARTER_FINAL",
                        matchNumber: i + 1,
                });

                match.contest = contest._id;
                await match.save();

                // Approve videos for both participants so results count
                await createVideoSubmission(contest, p1, { status: "APPROVED" });
                await createVideoSubmission(contest, p2, { status: "APPROVED" });

                matches.push(match);
                contests.push(contest);
        }

        return { tournament, participants, matches, contests };
}

// ============================================================
// Test 1 — Advance QF → SF
// ============================================================
test("advancing QF → SF creates semifinal matches from winners", async () => {
        const { tournament, participants, contests } = await buildQF();

        // For each of the 4 matches, the lower-seeded participant wins
        for (let i = 0; i < 4; i++) {
                const winner = participants[i * 2];
                const loser = participants[i * 2 + 1];
                const contest = contests[i];

                await request(app)
                        .post(`/api/admin/contests/${contest._id}/results`)
                        .set("Authorization", `Bearer ${adminToken}`)
                        .send({
                                participantId: winner._id.toString(),
                                solved: 3,
                                penalty: 10,
                        })
                        .expect(200);

                await request(app)
                        .post(`/api/admin/contests/${contest._id}/results`)
                        .set("Authorization", `Bearer ${adminToken}`)
                        .send({
                                participantId: loser._id.toString(),
                                solved: 1,
                                penalty: 30,
                        })
                        .expect(200);
        }

        const res = await request(app)
                .post(`/api/admin/tournaments/${tournament._id}/advance`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ stage: "qf" });

        assert.equal(
                res.status,
                200,
                `Advance failed: ${JSON.stringify(res.body)}`
        );

        // 4 winners → 2 semifinal matches
        const sfMatches = await Match.find({
                tournament: tournament._id,
                stage: "SEMI_FINAL",
        });
        assert.equal(sfMatches.length, 2);

        // Winners were promoted
        const advanced = await require("../../src/models/Participant").find({
                tournamentId: tournament._id,
                status: "ADVANCED",
                currentStage: "SEMI_FINAL",
        });
        assert.equal(advanced.length, 4);
});

// ============================================================
// Test 2 — Tie detection
// ============================================================
test("tie in a match → match.status is TIE", async () => {
        const { matches, contests, participants } = await buildQF();

        // Match 1 (index 0) — identical results for both participants
        await request(app)
                .post(`/api/admin/contests/${contests[0]._id}/results`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                        participantId: participants[0]._id.toString(),
                        solved: 2,
                        penalty: 20,
                })
                .expect(200);

        await request(app)
                .post(`/api/admin/contests/${contests[0]._id}/results`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                        participantId: participants[1]._id.toString(),
                        solved: 2,
                        penalty: 20,
                })
                .expect(200);

        const updated = await Match.findById(matches[0]._id);
        assert.equal(updated.status, "TIE");
        assert.equal(updated.winner, null);
});

// ============================================================
// Test 3 — Rematch
// ============================================================
test("rematch creates new contest and clears old results", async () => {
        const { matches, contests, participants } = await buildQF();

        // Create a tie in match 1
        await request(app)
                .post(`/api/admin/contests/${contests[0]._id}/results`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                        participantId: participants[0]._id.toString(),
                        solved: 2,
                        penalty: 20,
                });

        await request(app)
                .post(`/api/admin/contests/${contests[0]._id}/results`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                        participantId: participants[1]._id.toString(),
                        solved: 2,
                        penalty: 20,
                });

        // Start rematch on the tied match
        const res = await request(app)
                .post(`/api/admin/matches/${matches[0]._id}/rematch`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                        invitationUrl: "https://codeforces.com/contestInvitation/rematch",
                        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                        durationMinutes: 60,
                });

        assert.equal(
                res.status,
                200,
                `Rematch failed: ${JSON.stringify(res.body)}`
        );
        assert.equal(res.body.match.status, "PENDING");

        // Match's contest changed
        const updated = await Match.findById(matches[0]._id);
        assert.notEqual(updated.contest.toString(), contests[0]._id.toString());
        assert.ok(
                updated.previousContests.length >= 1,
                "previousContests should include the old contest"
        );
        assert.equal(updated.rematchRound, 1);

        // Old results were deleted
        const oldResults = await Result.find({ contestId: contests[0]._id });
        assert.equal(oldResults.length, 0);
});