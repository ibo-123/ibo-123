/**
 * Tests for authMiddleware (protect + authorize)
 * Pure unit tests — no database, no HTTP server needed.
 * Run: node --test test/authMiddleware.test.js
 */
const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

// Set a test secret before requiring the module
const TEST_SECRET = "test-jwt-secret-for-unit-tests";
process.env.JWT_SECRET = TEST_SECRET;

const { protect, authorize } = require("../src/middleware/authMiddleware");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Creates a minimal mock response with status/json recording. */
const mockRes = () => {
  const res = { _status: null, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json   = (body)  => { res._body = body;  return res; };
  return res;
};

/** Generates a valid JWT for the given payload. */
const sign = (payload) => jwt.sign(payload, TEST_SECRET, { expiresIn: "1h" });

// ─── protect middleware ───────────────────────────────────────────────────────

describe("protect middleware", () => {
  it("responds 401 when Authorization header is missing", () => {
    const req  = { headers: {} };
    const res  = mockRes();
    let called = false;
    protect(req, res, () => { called = true; });
    assert.strictEqual(res._status, 401);
    assert.strictEqual(res._body.success, false);
    assert.ok(!called, "next() should not be called");
  });

  it("responds 401 when header does not start with 'Bearer '", () => {
    const req  = { headers: { authorization: "Token abc123" } };
    const res  = mockRes();
    let called = false;
    protect(req, res, () => { called = true; });
    assert.strictEqual(res._status, 401);
    assert.ok(!called);
  });

  it("responds 401 for a malformed / tampered token", () => {
    const req  = { headers: { authorization: "Bearer notavalidtoken" } };
    const res  = mockRes();
    let called = false;
    protect(req, res, () => { called = true; });
    assert.strictEqual(res._status, 401);
    assert.ok(!called);
  });

  it("responds 401 for an expired token", () => {
    const token = jwt.sign({ userId: "u1", role: "PARTICIPANT" }, TEST_SECRET, { expiresIn: -1 });
    const req   = { headers: { authorization: `Bearer ${token}` } };
    const res   = mockRes();
    let called  = false;
    protect(req, res, () => { called = true; });
    assert.strictEqual(res._status, 401);
    assert.ok(!called);
  });

  it("sets req.user and calls next() for a valid token", () => {
    const payload = { userId: "u1", role: "PARTICIPANT", username: "alice" };
    const token   = sign(payload);
    const req     = { headers: { authorization: `Bearer ${token}` } };
    const res     = mockRes();
    let called    = false;
    protect(req, res, () => { called = true; });
    assert.ok(called, "next() should be called");
    assert.ok(req.user, "req.user should be populated");
    assert.strictEqual(req.user.userId, "u1");
    assert.strictEqual(req.user.role, "PARTICIPANT");
  });

  it("sets req.user.role correctly for ADMIN tokens", () => {
    const token = sign({ userId: "admin1", role: "ADMIN" });
    const req   = { headers: { authorization: `Bearer ${token}` } };
    const res   = mockRes();
    protect(req, res, () => {});
    assert.strictEqual(req.user.role, "ADMIN");
  });
});

// ─── authorize middleware ─────────────────────────────────────────────────────

describe("authorize middleware", () => {
  it("responds 401 when req.user is not set", () => {
    const req  = {};
    const res  = mockRes();
    let called = false;
    authorize("ADMIN")(req, res, () => { called = true; });
    assert.strictEqual(res._status, 401);
    assert.ok(!called);
  });

  it("responds 403 when user role is not in the allowed list", () => {
    const req  = { user: { role: "PARTICIPANT" } };
    const res  = mockRes();
    let called = false;
    authorize("ADMIN")(req, res, () => { called = true; });
    assert.strictEqual(res._status, 403);
    assert.strictEqual(res._body.success, false);
    assert.ok(!called);
  });

  it("calls next() when user role is in the allowed list", () => {
    const req  = { user: { role: "ADMIN" } };
    const res  = mockRes();
    let called = false;
    authorize("ADMIN")(req, res, () => { called = true; });
    assert.ok(called);
    assert.strictEqual(res._status, null, "no response should be sent");
  });

  it("allows multiple accepted roles", () => {
    const req  = { user: { role: "PARTICIPANT" } };
    const res  = mockRes();
    let called = false;
    authorize("ADMIN", "PARTICIPANT")(req, res, () => { called = true; });
    assert.ok(called);
  });

  it("blocks a role that is not in the multi-role list", () => {
    const req  = { user: { role: "GUEST" } };
    const res  = mockRes();
    let called = false;
    authorize("ADMIN", "PARTICIPANT")(req, res, () => { called = true; });
    assert.strictEqual(res._status, 403);
    assert.ok(!called);
  });
});
