// backend/tests/integration/tournament.lifecycle.test.js
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
        createResult,
        createVideoSubmission,
} = require("../factories");

const Participant = require("../../src/models/Participant");

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
        admin = await createAdmin({ username: "admin", email: "admin@test.com" });
        adminToken = getToken(admin);
});

// ============================================================
// 1. Admin creates tournament
// ============================================================
test("admin creates tournament → status is DRAFT", async () => {
        const now = Date.now();
        const res = await request(app)
                .post("/api/admin/tournaments")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                        name: "Lifecycle Test",
                        description: "testing",
                        registrationStart: new Date(now - 1000).toISOString(),
                        registrationEnd: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
                        tournamentStart: new Date(now + 25 * 60 * 60 * 1000).toISOString(),
                        tournamentEnd: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
                        maxParticipants: 8,
                        numberOfGroups: 2,
                        qualifiersPerGroup: 2,
                        groupContests: 1,
                        playoffFormat: "SINGLE_ELIMINATION",
                });

        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.tournament.status, "DRAFT");
});

// ============================================================
// 2. Participant registers
// ============================================================
test("participant registers for a tournament → status PENDING", async () => {
        const tournament = await createTournament(admin, { status: "REGISTRATION" });
        const user = await createParticipantUser({ username: "alice" });
        const token = getToken(user);

        const res = await request(app)
                .post(`/api/tournaments/${tournament._id}/join`)
                .set("Authorization", `Bearer ${token}`)
                .send();

        assert.equal(
                res.status,
                201,
                `Expected 201 but got ${res.status}: ${JSON.stringify(res.body)}`
        );
        assert.equal(res.body.participant.registrationStatus, "PENDING");
});

// ============================================================
// 3. Admin approves participant
// ============================================================
test("admin approves participant → group + seed set", async () => {
        const tournament = await createTournament(admin, { status: "REGISTRATION" });
        const user = await createParticipantUser({ username: "bob" });
        const participant = await createParticipant(user, tournament, {
                registrationStatus: "PENDING",
        });

        const res = await request(app)
                .patch(
                        `/api/admin/tournaments/${tournament._id}/participants/${participant._id}/approve`
                )
                .set("Authorization", `Bearer ${adminToken}`)
                .send();

        assert.equal(res.status, 200);
        assert.equal(res.body.participant.registrationStatus, "APPROVED");
        assert.ok(res.body.participant.group, "group should be assigned");
        assert.ok(res.body.participant.seed, "seed should be assigned");
});

// ============================================================
// 4. Rejected participants free up their slot
// ============================================================
test("rejected participants free up their slot", async () => {
        const tournament = await createTournament(admin, {
                status: "REGISTRATION",
                maxParticipants: 2,
                numberOfGroups: 1,
                participantsPerGroup: 2,
                qualifiersPerGroup: 1,
        });

        // Two approved participants fill both slots
        const u1 = await createParticipantUser({ username: "u1" });
        const p1 = await createParticipant(u1, tournament, {
                registrationStatus: "APPROVED",
        });
        const u2 = await createParticipantUser({ username: "u2" });
        const p2 = await createParticipant(u2, tournament, {
                registrationStatus: "APPROVED",
        });

        // Third user tries to join → Tournament is full
        const u3 = await createParticipantUser({ username: "u3" });
        const joinRes = await request(app)
                .post(`/api/tournaments/${tournament._id}/join`)
                .set("Authorization", `Bearer ${getToken(u3)}`)
                .send();

        assert.equal(
                joinRes.status,
                400,
                `Expected 400 (full) but got ${joinRes.status}: ${JSON.stringify(joinRes.body)}`
        );
        assert.match(joinRes.body.message, /full/i);

        // Reject p2 → frees a slot
        const rejectRes = await request(app)
                .patch(
                        `/api/admin/tournaments/${tournament._id}/participants/${p2._id}/reject`
                )
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ reason: "test rejection" });

        assert.equal(
                rejectRes.status,
                200,
                `Reject failed: ${JSON.stringify(rejectRes.body)}`
        );

        // Diagnostic — verify p2 is actually marked REJECTED
        const rejected = await Participant.findById(p2._id);
        assert.equal(
                rejected.registrationStatus,
                "REJECTED",
                `Expected REJECTED but got ${rejected.registrationStatus}`
        );
        assert.equal(rejected.status, "ELIMINATED");

        // Now u3 can join
        const joinRes2 = await request(app)
                .post(`/api/tournaments/${tournament._id}/join`)
                .set("Authorization", `Bearer ${getToken(u3)}`)
                .send();

        assert.equal(
                joinRes2.status,
                201,
                `Expected 201 but got ${joinRes2.status}: ${JSON.stringify(joinRes2.body)}`
        );
});

// ============================================================
// 5. Admin creates group-stage contest
// ============================================================
test("admin creates group-stage contest", async () => {
        const tournament = await createTournament(admin, { status: "GROUP_STAGE" });

        const res = await request(app)
                .post(`/api/admin/tournaments/${tournament._id}/contests`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                        name: "Group A Round 1",
                        invitationUrl: "https://codeforces.com/contestInvitation/test123",
                        stage: "GROUP_STAGE",
                        group: "A",
                        startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                        durationMinutes: 60,
                });

        assert.equal(res.status, 201);
        assert.equal(res.body.contest.stage, "GROUP_STAGE");
        assert.equal(res.body.contest.group, "A");
});

// ============================================================
// 6. Admin enters results → ranks computed
// ============================================================
test("admin enters results → participant rank updated", async () => {
        const tournament = await createTournament(admin, { status: "GROUP_STAGE" });
        const contest = await createContest(tournament, {
                stage: "GROUP_STAGE",
                group: "A",
        });

        const u1 = await createParticipantUser({ username: "p1" });
        const p1 = await createParticipant(u1, tournament, {
                registrationStatus: "APPROVED",
                group: "A",
                seed: 1,
        });
        const u2 = await createParticipantUser({ username: "p2" });
        const p2 = await createParticipant(u2, tournament, {
                registrationStatus: "APPROVED",
                group: "A",
                seed: 2,
        });

        // Both need approved videos to count
        await createVideoSubmission(contest, p1, { status: "APPROVED" });
        await createVideoSubmission(contest, p2, { status: "APPROVED" });

        // p1: 3 solved, 30 min penalty
        const r1 = await request(app)
                .post(`/api/admin/contests/${contest._id}/results`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ participantId: p1._id.toString(), solved: 3, penalty: 30 });
        assert.equal(
                r1.status,
                200,
                `Save p1 failed: ${JSON.stringify(r1.body)}`
        );

        // p2: 2 solved, 20 min penalty
        const r2 = await request(app)
                .post(`/api/admin/contests/${contest._id}/results`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ participantId: p2._id.toString(), solved: 2, penalty: 20 });
        assert.equal(r2.status, 200);

        // Fetch roster, verify ranks
        const roster = await request(app)
                .get(`/api/admin/contests/${contest._id}/results`)
                .set("Authorization", `Bearer ${adminToken}`);

        assert.equal(roster.status, 200);
        const p1Row = roster.body.roster.find(
                (x) => x.participantId === p1._id.toString()
        );
        const p2Row = roster.body.roster.find(
                (x) => x.participantId === p2._id.toString()
        );
        assert.equal(p1Row.rank, 1, "p1 should be rank 1");
        assert.equal(p2Row.rank, 2, "p2 should be rank 2");
});

// ============================================================
// 7. Non-approved video → 0 solved
// ============================================================
test("non-approved video forces 0 solved", async () => {
        const tournament = await createTournament(admin, { status: "GROUP_STAGE" });
        const contest = await createContest(tournament, {
                stage: "GROUP_STAGE",
                group: "A",
        });

        const user = await createParticipantUser({ username: "novid" });
        const participant = await createParticipant(user, tournament, {
                registrationStatus: "APPROVED",
                group: "A",
                seed: 1,
        });

        // No video submission at all — the participant is ineligible
        await request(app)
                .post(`/api/admin/contests/${contest._id}/results`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                        participantId: participant._id.toString(),
                        solved: 5,
                        penalty: 10,
                });

        const roster = await request(app)
                .get(`/api/admin/contests/${contest._id}/results`)
                .set("Authorization", `Bearer ${adminToken}`);

        const row = roster.body.roster.find(
                (x) => x.participantId === participant._id.toString()
        );
        assert.equal(row.isEligible, false);
        assert.equal(row.effectiveSolved, 0);
        assert.equal(row.effectivePenalty, 0);
});