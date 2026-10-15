/**
 * Tests for CodeforcesService
 * Uses Node's built-in test runner (node:test) — no external deps required.
 * Run: node --test test/codeforcesService.test.js
 */
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const svc = require("../src/services/codeforcesService");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const originalFetch = global.fetch;
after(() => { global.fetch = originalFetch; });

const makeFetch = (json) =>
  async () => ({ ok: true, json: async () => json });

// ─── buildQueryString ─────────────────────────────────────────────────────────

describe("buildQueryString", () => {
  it("returns empty string when no params", () => {
    assert.strictEqual(svc.buildQueryString({}), "");
  });

  it("builds a query string for a single param", () => {
    const qs = svc.buildQueryString({ contestId: 1 });
    assert.ok(qs.startsWith("?"), "should start with '?'");
    assert.ok(qs.includes("contestId=1"));
  });

  it("omits null and undefined values", () => {
    const qs = svc.buildQueryString({ a: null, b: undefined, c: "x" });
    assert.ok(!qs.includes("a="), "null should be omitted");
    assert.ok(!qs.includes("b="), "undefined should be omitted");
    assert.ok(qs.includes("c=x"));
  });

  it("handles multiple params", () => {
    const qs = svc.buildQueryString({ contestId: 2, gym: false });
    assert.ok(qs.includes("contestId=2"));
    assert.ok(qs.includes("gym=false"));
  });
});

// ─── extractContestIdFromUrl ──────────────────────────────────────────────────

describe("extractContestIdFromUrl", () => {
  it("extracts from /contest/ URL", () => {
    assert.strictEqual(
      svc.extractContestIdFromUrl("https://codeforces.com/contest/1234"),
      1234
    );
  });

  it("extracts from /gym/ URL", () => {
    assert.strictEqual(
      svc.extractContestIdFromUrl("https://codeforces.com/gym/5678"),
      5678
    );
  });

  it("extracts from /problemset/contest/ URL", () => {
    assert.strictEqual(
      svc.extractContestIdFromUrl(
        "https://codeforces.com/problemset/contest/9999/problem/A"
      ),
      9999
    );
  });

  it("returns null for unrecognised URL", () => {
    assert.strictEqual(
      svc.extractContestIdFromUrl("https://codeforces.com/profile/tourist"),
      null
    );
  });

  it("returns null for an empty string", () => {
    assert.strictEqual(svc.extractContestIdFromUrl(""), null);
  });
});

// ─── formatContestUrl ─────────────────────────────────────────────────────────

describe("formatContestUrl", () => {
  it("builds the expected URL for a numeric ID", () => {
    assert.strictEqual(
      svc.formatContestUrl(1234),
      "https://codeforces.com/contest/1234"
    );
  });
});

// ─── getContestStandings (via fetch mock) ─────────────────────────────────────

describe("getContestStandings", () => {
  it("rejects an invalid (non-numeric) contest ID", async () => {
    global.fetch = async () => { throw new Error("should not be called"); };
    await assert.rejects(
      svc.getContestStandings("invalid"),
      /Invalid Codeforces contest ID/
    );
  });

  it("rejects zero as contest ID", async () => {
    global.fetch = async () => { throw new Error("should not be called"); };
    await assert.rejects(svc.getContestStandings(0), /Invalid Codeforces contest ID/);
  });

  it("rejects a negative contest ID", async () => {
    global.fetch = async () => { throw new Error("should not be called"); };
    await assert.rejects(svc.getContestStandings(-5), /Invalid Codeforces contest ID/);
  });

  it("returns standings on a successful API response", async () => {
    global.fetch = makeFetch({
      status: "OK",
      result: { contest: { id: 1 }, problems: [], rows: [] },
    });
    const standings = await svc.getContestStandings(1);
    assert.deepEqual(standings.rows, []);
    assert.deepEqual(standings.problems, []);
  });

  it("surfaces a FAILED status from Codeforces", async () => {
    global.fetch = makeFetch({
      status: "FAILED",
      comment: "contestId: Contest not found",
    });
    await assert.rejects(svc.getContestStandings(1), /Contest not found/);
  });

  it("passes handles as a semicolon-joined string", async () => {
    let capturedUrl = "";
    global.fetch = async (url) => {
      capturedUrl = url;
      return { ok: true, json: async () => ({ status: "OK", result: { contest: {}, problems: [], rows: [] } }) };
    };
    await svc.getContestStandings(100, ["tourist", "Um_nik"]);
    assert.ok(capturedUrl.includes("handles=tourist%3BUm_nik") || capturedUrl.includes("handles=tourist;Um_nik"),
      `Expected handles in URL, got: ${capturedUrl}`);
  });

  it("omits handles param when array is empty", async () => {
    let capturedUrl = "";
    global.fetch = async (url) => {
      capturedUrl = url;
      return { ok: true, json: async () => ({ status: "OK", result: { contest: {}, problems: [], rows: [] } }) };
    };
    await svc.getContestStandings(100, []);
    assert.ok(!capturedUrl.includes("handles="), "handles should not appear in URL");
  });
});

// ─── validateContest ──────────────────────────────────────────────────────────

describe("validateContest", () => {
  it("returns { valid: true, contest } when the contest is found", async () => {
    const fakeContest = { id: 42, name: "Educational Round" };
    // getContest internally calls request('/contest.list', ...) then finds by id
    global.fetch = makeFetch({ status: "OK", result: [fakeContest] });
    const result = await svc.validateContest(42);
    assert.strictEqual(result.valid, true);
    assert.deepEqual(result.contest, fakeContest);
  });

  it("returns { valid: false, error } when the contest is not found", async () => {
    global.fetch = makeFetch({ status: "OK", result: [] }); // empty list
    const result = await svc.validateContest(9999);
    assert.strictEqual(result.valid, false);
    assert.ok(typeof result.error === "string");
  });

  it("returns { valid: false, error } on a FAILED API response", async () => {
    global.fetch = makeFetch({ status: "FAILED", comment: "some error" });
    const result = await svc.validateContest(1);
    assert.strictEqual(result.valid, false);
    assert.ok(typeof result.error === "string");
  });
});

// ─── request timeout simulation ───────────────────────────────────────────────

describe("request — timeout error", () => {
  it("wraps AbortError as a timeout message", async () => {
    global.fetch = async (_url, { signal }) => {
      // Simulate abort
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    };
    await assert.rejects(svc.getContestStandings(1), /timed out/);
  });
});
