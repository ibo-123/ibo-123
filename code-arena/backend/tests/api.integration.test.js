// test/api.integration.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const sinon = require('sinon');

process.env.JWT_SECRET = 'test-secret';

const app = require('../src/app');
const User = require('../src/models/User');
const Tournament = require('../src/models/Tournament');
const Participant = require('../src/models/Participant');
const Contest = require('../src/models/Contest');
const Result = require('../src/models/Result');
const Match = require('../src/models/Match');
const AuditLog = require('../src/models/AuditLog');
const codeforcesService = require('../src/services/codeforcesService');

let mongoServer;
let adminToken, userToken;
let adminUser, regularUser;
let cfStub;

const TEST_TIMEOUT = 120000;

before(async () => {
  cfStub = sinon.stub(codeforcesService);
  cfStub.getContestStandings.resolves({
    rows: [
      {
        rank: 1,
        party: { members: [{ handle: 'cf_player' }] },
        points: 100,
        penalty: 0,
        problemResults: [{ points: 100, rejectedAttemptCount: 0, bestSubmissionTimeSeconds: 300 }],
      },
    ],
    problems: [{ index: 'A', name: 'Problem A' }],
  });
  cfStub.validateContest.resolves({ valid: true, contest: { id: 1234, name: 'Test Contest' } });

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, TEST_TIMEOUT);

after(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  sinon.restore();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Tournament.deleteMany({});
  await Participant.deleteMany({});
  await Contest.deleteMany({});
  await Result.deleteMany({});
  await Match.deleteMany({});
  await AuditLog.deleteMany({});

  adminUser = await User.create({
    username: 'admin',
    email: 'admin@test.com',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'ADMIN',
  });
  regularUser = await User.create({
    username: 'player',
    email: 'player@test.com',
    password: 'Player123!',
    name: 'Regular Player',
    codeforcesUsername: 'cf_player',
  });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'Admin123!' });
  adminToken = adminLogin.body.token;

  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'player', password: 'Player123!' });
  userToken = userLogin.body.token;
});

// ===== AUTH TESTS =====
describe('Auth API', () => {
  it('POST /api/auth/register – creates new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'newbie',
        email: 'newbie@test.com',
        password: 'Newbie123!',
        name: 'New User',
        codeforcesUsername: 'new_cf',
      });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.username, 'newbie');
  });

  it('POST /api/auth/login – returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'player', password: 'Player123!' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
  });

  it('GET /api/auth/me – returns current user (protected)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.username, 'player');
  });
});

// ===== TOURNAMENT TESTS =====
describe('Tournament API', () => {
  it('POST /api/admin/tournaments – admin creates tournament', async () => {
    const payload = {
      name: 'Test Tournament',
      description: 'Integration test',
      registrationStart: new Date(Date.now() + 60000).toISOString(),
      registrationEnd: new Date(Date.now() + 120000).toISOString(),
      tournamentStart: new Date(Date.now() + 180000).toISOString(),
      tournamentEnd: new Date(Date.now() + 240000).toISOString(),
      maxParticipants: 20,
      numberOfGroups: 4,
      qualifiersPerGroup: 2,
      groupContests: 1,
      playoffFormat: 'SINGLE_ELIMINATION',
    };
    const res = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.tournament.name, 'Test Tournament');
  });

  it('GET /api/tournaments – list all', async () => {
    const payload = {
      name: 'List Test',
      description: 'For listing',
      registrationStart: new Date(Date.now() + 60000).toISOString(),
      registrationEnd: new Date(Date.now() + 120000).toISOString(),
      tournamentStart: new Date(Date.now() + 180000).toISOString(),
      tournamentEnd: new Date(Date.now() + 240000).toISOString(),
      maxParticipants: 20,
      numberOfGroups: 4,
      qualifiersPerGroup: 2,
      groupContests: 1,
      playoffFormat: 'SINGLE_ELIMINATION',
    };
    await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    const res = await request(app).get('/api/tournaments');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.tournaments.length > 0);
  });

  it('GET /api/tournaments/:id – get single', async () => {
    const payload = {
      name: 'Single Test',
      description: 'For single',
      registrationStart: new Date(Date.now() + 60000).toISOString(),
      registrationEnd: new Date(Date.now() + 120000).toISOString(),
      tournamentStart: new Date(Date.now() + 180000).toISOString(),
      tournamentEnd: new Date(Date.now() + 240000).toISOString(),
      maxParticipants: 20,
      numberOfGroups: 4,
      qualifiersPerGroup: 2,
      groupContests: 1,
      playoffFormat: 'SINGLE_ELIMINATION',
    };
    const createRes = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    const id = createRes.body.tournament._id;

    const res = await request(app).get(`/api/tournaments/${id}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.tournament._id, id);
  });

  it('PATCH /api/admin/tournaments/:id – admin updates', async () => {
    const payload = {
      name: 'Update Test',
      description: 'Before update',
      registrationStart: new Date(Date.now() - 60000).toISOString(),
      registrationEnd: new Date(Date.now() + 60000).toISOString(),
      tournamentStart: new Date(Date.now() + 120000).toISOString(),
      tournamentEnd: new Date(Date.now() + 180000).toISOString(),
      maxParticipants: 20,
      numberOfGroups: 4,
      qualifiersPerGroup: 2,
      groupContests: 1,
      playoffFormat: 'SINGLE_ELIMINATION',
    };
    const createRes = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    const id = createRes.body.tournament._id;

    const res = await request(app)
      .patch(`/api/admin/tournaments/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated description' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.tournament.description, 'Updated description');
  });

  it('POST /api/tournaments/:id/join – user joins', async () => {
    const payload = {
      name: 'Join Test',
      description: 'For join',
      registrationStart: new Date(Date.now() - 60000).toISOString(),
      registrationEnd: new Date(Date.now() + 60000).toISOString(),
      tournamentStart: new Date(Date.now() + 120000).toISOString(),
      tournamentEnd: new Date(Date.now() + 180000).toISOString(),
      maxParticipants: 20,
      numberOfGroups: 4,
      qualifiersPerGroup: 2,
      groupContests: 1,
      playoffFormat: 'SINGLE_ELIMINATION',
    };
    const createRes = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    const id = createRes.body.tournament._id;

    const res = await request(app)
      .post(`/api/tournaments/${id}/join`)
      .set('Authorization', `Bearer ${userToken}`);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.participant.user, regularUser._id.toString());
  });

  it('POST /api/admin/tournaments/:id/start – admin starts tournament (requires 20 participants)', async () => {
    const payload = {
      name: 'Start Test',
      description: 'For start',
      registrationStart: new Date(Date.now() - 60000).toISOString(),
      registrationEnd: new Date(Date.now() + 60000).toISOString(),
      tournamentStart: new Date(Date.now() + 120000).toISOString(),
      tournamentEnd: new Date(Date.now() + 180000).toISOString(),
      maxParticipants: 20,
      numberOfGroups: 4,
      qualifiersPerGroup: 2,
      groupContests: 1,
      playoffFormat: 'SINGLE_ELIMINATION',
    };
    const createRes = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    const id = createRes.body.tournament._id;

    const users = [];
    for (let i = 0; i < 19; i++) {
      const u = await User.create({
        username: `user${i}`,
        email: `user${i}@test.com`,
        password: 'Pass123!',
        name: `User ${i}`,
        codeforcesUsername: `cf${i}`,
      });
      users.push(u);
    }
    await Participant.create({ tournamentId: id, user: regularUser._id });
    for (const u of users) {
      await Participant.create({ tournamentId: id, user: u._id });
    }

    await Tournament.findByIdAndUpdate(id, { status: 'REGISTRATION' });

    const res = await request(app)
      .post(`/api/admin/tournaments/${id}/start`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.tournament.status, 'GROUP_STAGE');
  });

  it('POST /api/admin/tournaments/:id/advance – group-stage to QF', async () => {
    const payload = {
      name: 'Advance Test',
      description: 'For advance',
      registrationStart: new Date(Date.now() - 60000).toISOString(),
      registrationEnd: new Date(Date.now() + 60000).toISOString(),
      tournamentStart: new Date(Date.now() + 120000).toISOString(),
      tournamentEnd: new Date(Date.now() + 180000).toISOString(),
      maxParticipants: 20,
      numberOfGroups: 4,
      qualifiersPerGroup: 2,
      groupContests: 1,
      playoffFormat: 'SINGLE_ELIMINATION',
    };
    const createRes = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    const id = createRes.body.tournament._id;

    const users = [];
    for (let i = 0; i < 19; i++) {
      const u = await User.create({
        username: `advuser${i}`,
        email: `advuser${i}@test.com`,
        password: 'Pass123!',
        name: `AdvUser ${i}`,
        codeforcesUsername: `cfadv${i}`,
      });
      users.push(u);
    }
    await Participant.create({ tournamentId: id, user: regularUser._id });
    for (const u of users) {
      await Participant.create({ tournamentId: id, user: u._id });
    }

    await Tournament.findByIdAndUpdate(id, { status: 'REGISTRATION' });
    await request(app)
      .post(`/api/admin/tournaments/${id}/start`)
      .set('Authorization', `Bearer ${adminToken}`);

    const groups = ['A', 'B', 'C', 'D'];
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    for (const group of groups) {
      await Contest.create({
        tournamentId: id,
        codeforcesContestId: 1234 + groups.indexOf(group),
        codeforcesContestName: `CF Round ${group}`,
        codeforcesUrl: 'https://codeforces.com/contest/1234',
        type: 'CF',
        phase: 'FINISHED',
        startTime: threeHoursAgo,
        durationSeconds: 7200,
        stage: 'GROUP_STAGE',
        group: group,
        published: true,
        status: 'FINISHED',
      });
    }

    const participants = await Participant.find({ tournamentId: id });
    const contests = await Contest.find({ tournamentId: id, stage: 'GROUP_STAGE' });
    for (const contest of contests) {
      const groupParticipants = participants.filter(p => p.group === contest.group);
      for (let i = 0; i < groupParticipants.length; i++) {
        await Result.create({
          contestId: contest._id,
          tournamentId: id,
          participantId: groupParticipants[i]._id,
          codeforcesHandle: `cf_${groupParticipants[i].user.username}`,
          rank: i + 1,
          points: 100 - i * 10,
          penalty: 0,
          solvedCount: 5 - i,
          problemResults: [],
        });
      }
    }

    const res = await request(app)
      .post(`/api/admin/tournaments/${id}/advance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stage: 'group-stage' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.message.includes('Advanced'));
  });
});

// ===== CONTEST TESTS =====
describe('Contest API', () => {
  let contestId;
  let tournamentId;

  beforeEach(async () => {
    const payload = {
      name: 'Contest Test',
      description: 'For contest',
      registrationStart: new Date(Date.now() - 60000).toISOString(),
      registrationEnd: new Date(Date.now() + 60000).toISOString(),
      tournamentStart: new Date(Date.now() + 120000).toISOString(),
      tournamentEnd: new Date(Date.now() + 180000).toISOString(),
      maxParticipants: 20,
      numberOfGroups: 4,
      qualifiersPerGroup: 2,
      groupContests: 1,
      playoffFormat: 'SINGLE_ELIMINATION',
    };
    const createRes = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    tournamentId = createRes.body.tournament._id;

    const contest = await Contest.create({
      tournamentId: tournamentId,
      codeforcesContestId: 1234,
      codeforcesContestName: 'CF Round 1234',
      codeforcesUrl: 'https://codeforces.com/contest/1234',
      type: 'CF',
      phase: 'FINISHED',
      startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      durationSeconds: 7200,
      stage: 'GROUP_STAGE',
      group: 'A',
      published: true,
      status: 'FINISHED',
    });
    contestId = contest._id;
  });

  it('GET /api/tournaments/:tournamentId/contests – list', async () => {
    const res = await request(app).get(`/api/tournaments/${tournamentId}/contests`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.contests.length, 1);
  });

  it('GET /api/tournaments/:tournamentId/contests/:contestId – get one', async () => {
    const res = await request(app).get(`/api/tournaments/${tournamentId}/contests/${contestId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.contest._id, contestId.toString());
  });

  it('GET /api/tournaments/:tournamentId/contests/:contestId/leaderboard – returns leaderboard', async () => {
    const participants = [];
    for (let i = 0; i < 3; i++) {
      const u = await User.create({
        username: `p${i}`,
        email: `p${i}@test.com`,
        password: 'Pass123!',
        name: `P${i}`,
        codeforcesUsername: `cf${i}`,
      });
      const p = await Participant.create({ tournamentId, user: u._id });
      participants.push(p);
      await Result.create({
        contestId,
        tournamentId,
        participantId: p._id,
        codeforcesHandle: `cf${i}`,
        rank: i + 1,
        points: 100 - i * 10,
        penalty: 0,
        solvedCount: 5 - i,
        problemResults: [],
      });
    }
    const res = await request(app).get(`/api/tournaments/${tournamentId}/contests/${contestId}/leaderboard`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.leaderboard.length > 0);
  });

  it('POST /api/admin/tournaments/:tournamentId/contests/:contestId/sync – admin sync results', async () => {
    const u = await User.create({
      username: 'syncuser',
      email: 'sync@test.com',
      password: 'Pass123!',
      name: 'Sync User',
      codeforcesUsername: 'cf_player',
    });
    await Participant.create({ tournamentId, user: u._id });

    const res = await request(app)
      .post(`/api/admin/tournaments/${tournamentId}/contests/${contestId}/sync`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.stats.matched > 0);
  });
});

// ===== ADMIN TESTS =====
describe('Admin API', () => {
  it('GET /api/admin/stats – admin only', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.stats.totalTournaments !== undefined);
  });

  it('GET /api/admin/audit-logs – admin only', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.logs));
  });

  it('GET /api/admin/settings – admin only', async () => {
    const res = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.settings.username, 'admin');
  });

  it('PATCH /api/admin/settings – update admin', async () => {
    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Admin Name' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.settings.name, 'New Admin Name');
  });
});

// ===== PARTICIPANT TESTS =====
describe('Participant API', () => {
  let tournamentId;

  beforeEach(async () => {
    const payload = {
      name: 'Participant Test',
      description: 'For participant',
      registrationStart: new Date(Date.now() - 60000).toISOString(),
      registrationEnd: new Date(Date.now() + 60000).toISOString(),
      tournamentStart: new Date(Date.now() + 120000).toISOString(),
      tournamentEnd: new Date(Date.now() + 180000).toISOString(),
      maxParticipants: 20,
      numberOfGroups: 4,
      qualifiersPerGroup: 2,
      groupContests: 1,
      playoffFormat: 'SINGLE_ELIMINATION',
    };
    const createRes = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    tournamentId = createRes.body.tournament._id;
    await Participant.create({ tournamentId, user: regularUser._id, group: 'A', seed: 1 });
  });

  it('GET /api/tournaments/:tournamentId/participants – list participants', async () => {
    const res = await request(app).get(`/api/tournaments/${tournamentId}/participants`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.participants.length > 0);
  });

  it('GET /api/tournaments/:tournamentId/groups – group distribution', async () => {
    const res = await request(app).get(`/api/tournaments/${tournamentId}/groups`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.groups);
  });
});

// ===== MATCH & BRACKET TESTS =====
describe('Match & Bracket', () => {
  let tournamentId;
  let matchId;

  beforeEach(async () => {
    const payload = {
      name: 'Bracket Test',
      description: 'For bracket',
      registrationStart: new Date(Date.now() - 60000).toISOString(),
      registrationEnd: new Date(Date.now() + 60000).toISOString(),
      tournamentStart: new Date(Date.now() + 120000).toISOString(),
      tournamentEnd: new Date(Date.now() + 180000).toISOString(),
      maxParticipants: 20,
      numberOfGroups: 4,
      qualifiersPerGroup: 2,
      groupContests: 1,
      playoffFormat: 'SINGLE_ELIMINATION',
    };
    const createRes = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    tournamentId = createRes.body.tournament._id;

    const users = [];
    for (let i = 0; i < 19; i++) {
      const u = await User.create({
        username: `b${i}`,
        email: `b${i}@test.com`,
        password: 'Pass123!',
        name: `B${i}`,
        codeforcesUsername: `cfb${i}`,
      });
      users.push(u);
    }
    await Participant.create({ tournamentId, user: regularUser._id });
    for (const u of users) {
      await Participant.create({ tournamentId, user: u._id });
    }

    await Tournament.findByIdAndUpdate(tournamentId, { status: 'REGISTRATION' });
    await request(app)
      .post(`/api/admin/tournaments/${tournamentId}/start`)
      .set('Authorization', `Bearer ${adminToken}`);

    const groups = ['A', 'B', 'C', 'D'];
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    for (const group of groups) {
      await Contest.create({
        tournamentId,
        codeforcesContestId: 1234 + groups.indexOf(group),
        codeforcesContestName: `CF Round ${group}`,
        codeforcesUrl: 'https://codeforces.com/contest/1234',
        type: 'CF',
        phase: 'FINISHED',
        startTime: threeHoursAgo,
        durationSeconds: 7200,
        stage: 'GROUP_STAGE',
        group: group,
        published: true,
        status: 'FINISHED',
      });
    }

    const participants = await Participant.find({ tournamentId });
    const contests = await Contest.find({ tournamentId, stage: 'GROUP_STAGE' });
    for (const contest of contests) {
      const groupParticipants = participants.filter(p => p.group === contest.group);
      for (let i = 0; i < groupParticipants.length; i++) {
        await Result.create({
          contestId: contest._id,
          tournamentId,
          participantId: groupParticipants[i]._id,
          codeforcesHandle: `cf_${groupParticipants[i].user.username}`,
          rank: i + 1,
          points: 100 - i * 10,
          penalty: 0,
          solvedCount: 5 - i,
          problemResults: [],
        });
      }
    }

    await request(app)
      .post(`/api/admin/tournaments/${tournamentId}/advance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stage: 'group-stage' });

    const match = await Match.findOne({ tournament: tournamentId });
    matchId = match?._id;
  });

  it('GET /api/tournaments/:tournamentId/bracket – returns bracket structure', async () => {
    const res = await request(app).get(`/api/tournaments/${tournamentId}/bracket`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.bracket.groupStage);
  });

  // ✅ FIXED: use /api/admin/matches/:matchId
  it('PATCH /api/admin/matches/:matchId – admin sets winner', async () => {
    if (!matchId) {
      assert.ok(matchId, 'Match should exist after advancing group stage');
    }
    const match = await Match.findById(matchId).populate('participants');
    const winnerId = match.participants[0]._id;
    const res = await request(app)
      .patch(`/api/admin/matches/${matchId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ winnerId });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.match.winner, winnerId.toString());
  });
});

// ===== LEADERBOARD =====
describe('Leaderboard', () => {
  let tournamentId;

  beforeEach(async () => {
    const payload = {
      name: 'Leaderboard Test',
      description: 'For leaderboard',
      registrationStart: new Date(Date.now() - 60000).toISOString(),
      registrationEnd: new Date(Date.now() + 60000).toISOString(),
      tournamentStart: new Date(Date.now() + 120000).toISOString(),
      tournamentEnd: new Date(Date.now() + 180000).toISOString(),
      maxParticipants: 20,
      numberOfGroups: 4,
      qualifiersPerGroup: 2,
      groupContests: 1,
      playoffFormat: 'SINGLE_ELIMINATION',
    };
    const createRes = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    tournamentId = createRes.body.tournament._id;

    const p = await Participant.create({ tournamentId, user: regularUser._id, group: 'A', seed: 1 });
    await Result.create({
      contestId: new mongoose.Types.ObjectId(),
      tournamentId,
      participantId: p._id,
      codeforcesHandle: 'cf_player',
      rank: 1,
      points: 100,
      penalty: 0,
      solvedCount: 5,
      problemResults: [],
    });
  });

  it('GET /api/tournaments/:tournamentId/leaderboard – global standings', async () => {
    const res = await request(app).get(`/api/tournaments/${tournamentId}/leaderboard`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.leaderboard));
  });
});

// ===== AUTHORIZATION CHECKS =====
describe('Authorization checks', () => {
  let tournamentId;

  beforeEach(async () => {
    const payload = {
      name: 'Auth Test',
      description: 'For auth',
      registrationStart: new Date(Date.now() - 60000).toISOString(),
      registrationEnd: new Date(Date.now() + 60000).toISOString(),
      tournamentStart: new Date(Date.now() + 120000).toISOString(),
      tournamentEnd: new Date(Date.now() + 180000).toISOString(),
      maxParticipants: 20,
      numberOfGroups: 4,
      qualifiersPerGroup: 2,
      groupContests: 1,
      playoffFormat: 'SINGLE_ELIMINATION',
    };
    const createRes = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    tournamentId = createRes.body.tournament._id;
  });

  it('Non-admin cannot start tournament', async () => {
    const res = await request(app)
      .post(`/api/admin/tournaments/${tournamentId}/start`)
      .set('Authorization', `Bearer ${userToken}`);
    assert.strictEqual(res.status, 403);
  });

  it('Non-admin cannot access admin stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);
    assert.strictEqual(res.status, 403);
  });
});