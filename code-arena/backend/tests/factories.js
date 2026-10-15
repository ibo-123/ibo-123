// backend/tests/factories.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../src/models/User");
const Tournament = require("../src/models/Tournament");
const Participant = require("../src/models/Participant");
const Contest = require("../src/models/Contest");
const Result = require("../src/models/Result");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Guaranteed-unique suffix — works even under Promise.all
const unique = () => crypto.randomBytes(4).toString("hex");

// ---- Users ----
async function createAdmin(overrides = {}) {
        const u = unique();
        const username = `${overrides.username || "admin"}_${u}`;
        const email = overrides.email || `admin_${u}@test.com`;

        return User.create({
                password: "password123",
                name: "Test Admin",
                role: "ADMIN",
                ...overrides,
                username,
                email,
        });
}

async function createParticipantUser(overrides = {}) {
        const u = unique();
        const username = `${overrides.username || "user"}_${u}`;
        const email = overrides.email || `user_${u}@test.com`;
        const codeforcesUsername = `${overrides.codeforcesUsername || "cf"}_${u}`;

        return User.create({
                password: "password123",
                name: "Test User",
                role: "USER",
                ...overrides,
                username,
                email,
                codeforcesUsername,
        });
}

function getToken(user) {
        return jwt.sign(
                { userId: user._id.toString(), id: user._id.toString(), role: user.role },
                JWT_SECRET,
                { expiresIn: "1h" }
        );
}

// ---- Tournaments ----
async function createTournament(createdBy, overrides = {}) {
        const now = Date.now();

        const participantsPerGroup = overrides.participantsPerGroup ?? 4;
        const numberOfGroups = overrides.numberOfGroups ?? 2;
        const maxParticipants =
                overrides.maxParticipants ?? participantsPerGroup * numberOfGroups;
        const qualifiersPerGroup =
                overrides.qualifiersPerGroup ?? Math.max(1, participantsPerGroup - 1);

        return Tournament.create({
                name: overrides.name || `Test Tournament ${unique()}`,
                slug: `test-tournament-${unique()}`,
                description: "Test description",
                registrationStart: new Date(now - 24 * 60 * 60 * 1000),
                registrationEnd: new Date(now + 24 * 60 * 60 * 1000),
                tournamentStart: new Date(now + 25 * 60 * 60 * 1000),
                tournamentEnd: new Date(now + 48 * 60 * 60 * 1000),
                maxParticipants,
                numberOfGroups,
                participantsPerGroup,
                qualifiersPerGroup,
                groupContests: 1,
                playoffFormat: "SINGLE_ELIMINATION",
                status: "REGISTRATION",
                createdBy: createdBy._id,
                ...overrides,
                // Always enforce a valid derived combination unless caller overrode it
                maxParticipants: overrides.maxParticipants ?? maxParticipants,
                qualifiersPerGroup: overrides.qualifiersPerGroup ?? qualifiersPerGroup,
        });
}

// ---- Participants ----
async function createParticipant(user, tournament, overrides = {}) {
        return Participant.create({
                user: user._id,
                tournamentId: tournament._id,
                registrationStatus: "PENDING",
                status: "ACTIVE",
                currentStage: "REGISTRATION",
                ...overrides,
        });
}

// ---- Contests ----
async function createContest(tournament, overrides = {}) {
        const now = Date.now();
        return Contest.create({
                tournamentId: tournament._id,
                name: overrides.name || `Test Contest ${unique()}`,
                invitationUrl:
                        overrides.invitationUrl ||
                        "https://codeforces.com/contestInvitation/test123",
                description: "",
                stage: overrides.stage || "GROUP_STAGE",
                group: overrides.group,
                matchNumber: overrides.matchNumber,
                startTime: overrides.startTime || new Date(now - 60 * 60 * 1000),
                endTime: overrides.endTime || new Date(now - 30 * 60 * 1000),
                durationSeconds: overrides.durationSeconds || 1800,
                status: overrides.status || "PUBLISHED",
                published: overrides.published ?? true,
                publishedAt: overrides.publishedAt || new Date(),
                ...overrides,
        });
}

// ---- Results ----
async function createResult(contest, participant, overrides = {}) {
        return Result.create({
                contestId: contest._id,
                tournamentId: contest.tournamentId,
                participantId: participant._id,
                codeforcesHandle: overrides.codeforcesHandle || "test",
                rank: overrides.rank ?? 1,
                points: overrides.points ?? overrides.solvedCount ?? 0,
                score: overrides.score ?? overrides.solvedCount ?? 0,
                penalty: overrides.penalty ?? 0,
                solvedCount: overrides.solvedCount ?? 0,
                problemResults: overrides.problemResults || [],
                syncedAt: new Date(),
                ...overrides,
        });
}

// ---- Video submissions ----
async function createVideoSubmission(contest, participant, overrides = {}) {
        const VideoSubmission = require("../src/models/VideoSubmission");
        return VideoSubmission.create({
                contestId: contest._id,
                tournamentId: contest.tournamentId,
                participantId: participant._id,
                videoUrl: overrides.videoUrl || "https://youtube.com/watch?v=test123",
                note: overrides.note || "",
                status: overrides.status || "PENDING",
                ...overrides,
        });
}

module.exports = {
        createAdmin,
        createParticipantUser,
        getToken,
        createTournament,
        createParticipant,
        createContest,
        createResult,
        createVideoSubmission,
};