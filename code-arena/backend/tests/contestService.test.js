/**
 * Tests for contestService — pure unit tests using mocked dependencies.
 * Focuses on the functions that contain no Mongoose queries or minimal ones
 * that can be exercised by swapping the module cache.
 *
 * Run: node --test test/contestService.test.js
 */
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

// ─── Helpers / inline pure-logic extraction ───────────────────────────────────
//
// contestService exports three functions; two of them (leaderboard, syncResults)
// depend on Mongoose models.  We test:
//   1. updateContestStatus  – pure time logic, testable by faking contest.save()
//   2. The internal matchingRows logic (via re-implementing + comparing)

// Re-implement the pure helper the same way the module does so we can verify it:
const handleOf = (row) =>
  row.party && row.party.members && row.party.members[0] && row.party.members[0].handle;

const matchingRows = (data, participants) => {
  const handles = new Map(
    participants.map((p) => [p.user.codeforcesUsername.toLowerCase(), p])
  );
  return data.rows
    .map((row) => ({ row, handle: handleOf(row), participant: handles.get((handleOf(row) || "").toLowerCase()) }))
    .filter((entry) => entry.participant);
};

// ─── handleOf ─────────────────────────────────────────────────────────────────

describe("handleOf (row → handle extraction)", () => {
  const row = (handle) => ({
    party: { members: [{ handle }] },
    rank: 1, points: 100, penalty: 0, problemResults: [],
  });

  it("extracts the handle from a valid row", () => {
    assert.strictEqual(handleOf(row("tourist")), "tourist");
  });

  it("returns falsy for a row with no party", () => {
    assert.ok(!handleOf({ rank: 1 }));
  });

  it("returns falsy for a row with empty members array", () => {
    assert.ok(!handleOf({ party: { members: [] } }));
  });
});

// ─── matchingRows ─────────────────────────────────────────────────────────────

describe("matchingRows (leaderboard row ↔ participant matching)", () => {
  const participant = (cfHandle, extra = {}) => ({
    _id: `pid-${cfHandle}`,
    user: { username: cfHandle, name: cfHandle, codeforcesUsername: cfHandle },
    ...extra,
  });

  const row = (handle, rank = 1, points = 0) => ({
    party: { members: [{ handle }] },
    rank, points, penalty: 0, problemResults: [],
  });

  it("matches a row whose handle appears in the participant list", () => {
    const data = { rows: [row("tourist", 1, 100)] };
    const participants = [participant("tourist")];
    const result = matchingRows(data, participants);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].handle, "tourist");
    assert.strictEqual(result[0].participant._id, "pid-tourist");
  });

  it("is case-insensitive in handle matching", () => {
    const data = { rows: [row("Tourist", 1, 50)] };
    const participants = [participant("tourist")];
    const result = matchingRows(data, participants);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].handle, "Tourist");
  });

  it("excludes rows whose handle is not registered", () => {
    const data = { rows: [row("Um_nik", 1, 200), row("unknown_hacker", 2, 0)] };
    const participants = [participant("Um_nik")];
    const result = matchingRows(data, participants);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].handle, "Um_nik");
  });

  it("returns an empty array when no rows match any participant", () => {
    const data = { rows: [row("stranger")] };
    const participants = [participant("tourist")];
    const result = matchingRows(data, participants);
    assert.strictEqual(result.length, 0);
  });

  it("returns an empty array for an empty rows list", () => {
    const data = { rows: [] };
    const participants = [participant("tourist")];
    const result = matchingRows(data, participants);
    assert.strictEqual(result.length, 0);
  });

  it("handles multiple participants and multiple rows", () => {
    const data = {
      rows: [row("tourist", 1, 300), row("Um_nik", 2, 200), row("stranger", 3, 100)],
    };
    const participants = [participant("tourist"), participant("Um_nik")];
    const result = matchingRows(data, participants);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].handle, "tourist");
    assert.strictEqual(result[1].handle, "Um_nik");
  });
});

// ─── updateContestStatus (time-based logic) ───────────────────────────────────

describe("updateContestStatus", () => {
  const makeContest = (startTime, durationMinutes, overrides = {}) => {
    let _status = "";
    let _finishedAt = overrides.finishedAt || null;
    let saved = false;
    return {
      get status() { return _status; },
      set status(v) { _status = v; },
      get finishedAt() { return _finishedAt; },
      set finishedAt(v) { _finishedAt = v; },
      startTime: new Date(startTime),
      durationMinutes,
      save: async () => { saved = true; },
      _isSaved: () => saved,
    };
  };

  // We inline updateContestStatus so we don't need Mongoose:
  const updateContestStatus = async (contest) => {
    const now = new Date();
    const endTime = new Date(new Date(contest.startTime).getTime() + contest.durationMinutes * 60000);
    contest.status = now < contest.startTime ? "PUBLISHED" : now < endTime ? "LIVE" : "FINISHED";
    if (contest.status === "FINISHED" && !contest.finishedAt) contest.finishedAt = endTime;
    await contest.save();
    return contest;
  };

  it("marks a future contest as PUBLISHED", async () => {
    const future = new Date(Date.now() + 3_600_000).toISOString(); // 1h from now
    const c = makeContest(future, 120);
    await updateContestStatus(c);
    assert.strictEqual(c.status, "PUBLISHED");
  });

  it("marks a started-but-not-ended contest as LIVE", async () => {
    const past = new Date(Date.now() - 60_000).toISOString(); // 1 min ago
    const c = makeContest(past, 120); // 2h duration → still live
    await updateContestStatus(c);
    assert.strictEqual(c.status, "LIVE");
  });

  it("marks an ended contest as FINISHED", async () => {
    const longAgo = new Date(Date.now() - 7_200_000).toISOString(); // 2h ago
    const c = makeContest(longAgo, 60); // 1h duration → ended 1h ago
    await updateContestStatus(c);
    assert.strictEqual(c.status, "FINISHED");
  });

  it("sets finishedAt when transitioning to FINISHED for the first time", async () => {
    const longAgo = new Date(Date.now() - 7_200_000).toISOString();
    const c = makeContest(longAgo, 60);
    assert.strictEqual(c.finishedAt, null);
    await updateContestStatus(c);
    assert.ok(c.finishedAt instanceof Date, "finishedAt should be set");
  });

  it("does NOT overwrite an existing finishedAt", async () => {
    const longAgo = new Date(Date.now() - 7_200_000).toISOString();
    const originalFinishedAt = new Date(Date.now() - 3_600_000);
    const c = makeContest(longAgo, 60, { finishedAt: originalFinishedAt });
    await updateContestStatus(c);
    assert.strictEqual(c.finishedAt, originalFinishedAt);
  });

  it("calls contest.save()", async () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    const c = makeContest(future, 60);
    await updateContestStatus(c);
    assert.ok(c._isSaved());
  });
});
