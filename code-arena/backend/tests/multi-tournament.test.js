// test/multi-tournament.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret';
const app = require('../src/app');
const User = require('../src/models/User');
const Tournament = require('../src/models/Tournament');
const Participant = require('../src/models/Participant');

let mongoServer;
let adminToken;
let adminUser;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000);

after(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Tournament.deleteMany({});
  await Participant.deleteMany({});

  adminUser = await User.create({
    username: 'admin',
    email: 'admin@test.com',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'ADMIN',
  });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'Admin123!' });
  adminToken = adminLogin.body.token;
});

describe('Multi-Tournament Isolation - Backend', () => {
  let tournamentA, tournamentB;

  it('creates two tournaments independently', async () => {
    const payload = {
      name: 'Tournament A',
      description: 'First tournament',
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

    const resA = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    
    assert.strictEqual(resA.status, 201);
    tournamentA = resA.body.tournament;

    const resB = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...payload, name: 'Tournament B' });
    
    assert.strictEqual(resB.status, 201);
    tournamentB = resB.body.tournament;

    // Verify both exist
    const listRes = await request(app).get('/api/tournaments');
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.tournaments.length, 2);
  });

  it('keeps participants isolated between tournaments', async () => {
    // Create two tournaments
    const payload = {
      name: 'Isolation Test A',
      description: 'Test',
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

    const resA = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    const tournamentA = resA.body.tournament;

    const resB = await request(app)
      .post('/api/admin/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...payload, name: 'Isolation Test B' });
    const tournamentB = resB.body.tournament;

    // Create a user
    const user = await User.create({
      username: 'player1',
      email: 'player1@test.com',
      password: 'Player123!',
      name: 'Player One',
      codeforcesUsername: 'cf_player1',
    });

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'player1', password: 'Player123!' });
    const userToken = userLogin.body.token;

    // Join Tournament A
    await request(app)
      .post(`/api/tournaments/${tournamentA._id}/join`)
      .set('Authorization', `Bearer ${userToken}`);

    // Join Tournament B
    await request(app)
      .post(`/api/tournaments/${tournamentB._id}/join`)
      .set('Authorization', `Bearer ${userToken}`);

    // Verify participants in Tournament A
    const participantsA = await request(app)
      .get(`/api/tournaments/${tournamentA._id}/participants`);
    assert.strictEqual(participantsA.status, 200);
    assert.strictEqual(participantsA.body.participants.length, 1);
    assert.strictEqual(participantsA.body.participants[0].user.username, 'player1');

    // Verify participants in Tournament B
    const participantsB = await request(app)
      .get(`/api/tournaments/${tournamentB._id}/participants`);
    assert.strictEqual(participantsB.status, 200);
    assert.strictEqual(participantsB.body.participants.length, 1);
    assert.strictEqual(participantsB.body.participants[0].user.username, 'player1');

    // Verify the participants are different documents
    assert.notStrictEqual(
      participantsA.body.participants[0]._id,
      participantsB.body.participants[0]._id
    );
  });
});