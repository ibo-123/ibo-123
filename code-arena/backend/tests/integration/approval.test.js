// backend/tests/integration/approval.test.js
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
} = require("../factories");

let admin;
let adminToken;

before(async () => { await connect(); });
after(async () => { await disconnect(); });

beforeEach(async () => {
        await clearDatabase();
        admin = await createAdmin();
        adminToken = getToken(admin);
});

test("approving assigns participants to groups round-robin", async () => {
        const tournament = await createTournament(admin, {
                status: "REGISTRATION",
                numberOfGroups: 2,
                participantsPerGroup: 2,
                maxParticipants: 4,
        });

        const users = await Promise.all(
                ["a", "b", "c", "d"].map((n) => createParticipantUser({ username: n }))
        );
        const participants = await Promise.all(
                users.map((u) =>
                        createParticipant(u, tournament, { registrationStatus: "PENDING" })
                )
        );

        for (const p of participants) {
                const res = await request(app)
                        .patch(
                                `/api/admin/tournaments/${tournament._id}/participants/${p._id}/approve`
                        )
                        .set("Authorization", `Bearer ${adminToken}`)
                        .send();
                assert.equal(res.status, 200);
        }

        // Reload participants
        const { default: Participant } = await import("../../src/models/Participant.js");
        const reloaded = await Participant.find({ tournamentId: tournament._id });
        const groups = reloaded.map((p) => p.group).sort();
        assert.deepEqual(groups, ["A", "A", "B", "B"]);

        const seeds = reloaded.map((p) => p.seed).sort();
        assert.deepEqual(seeds, [1, 1, 2, 2]);
});

test("rejecting a pending participant sets status REJECTED", async () => {
        const tournament = await createTournament(admin, { status: "REGISTRATION" });
        const user = await createParticipantUser({ username: "toreject" });
        const participant = await createParticipant(user, tournament, {
                registrationStatus: "PENDING",
        });

        const res = await request(app)
                .patch(
                        `/api/admin/tournaments/${tournament._id}/participants/${participant._id}/reject`
                )
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ reason: "not eligible" });

        assert.equal(res.status, 200);
        assert.equal(res.body.participant.registrationStatus, "REJECTED");
        assert.equal(res.body.participant.status, "ELIMINATED");
});

test("rejecting without a body does not crash", async () => {
        const tournament = await createTournament(admin, { status: "REGISTRATION" });
        const user = await createParticipantUser({ username: "emptybody" });
        const participant = await createParticipant(user, tournament, {
                registrationStatus: "PENDING",
        });

        const res = await request(app)
                .patch(
                        `/api/admin/tournaments/${tournament._id}/participants/${participant._id}/reject`
                )
                .set("Authorization", `Bearer ${adminToken}`)
                .send();

        assert.equal(res.status, 200);
        assert.equal(res.body.participant.registrationStatus, "REJECTED");
});