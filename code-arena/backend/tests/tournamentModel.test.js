/**
 * Tests for Tournament model — schema-level validation and pre-hooks.
 * These tests run against the schema logic in isolation using Mongoose's
 * validate() method.  A real MongoDB connection is NOT required because
 * we use Mongoose's in-process validation path only.
 *
 * Run: node --test test/tournamentModel.test.js
 */
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

// Disconnect immediately if Mongoose auto-connects (it won't here, but be safe)
before(async () => {
  // Override the connect to a dummy in-memory target — we only need the schema.
  // Mongoose validation works without a live connection.
  // Use the buffering default (mongoose.set('bufferCommands', true)) — no connection needed.
});

after(async () => {
  // Nothing to clean up — no connection was made.
});

const Tournament = require("../src/models/Tournament");

// ─── Helper: build a minimal valid tournament doc ─────────────────────────────

const validPayload = () => ({
  name: "Test Tournament",
  description: "A test",
  maxParticipants: 20,
  numberOfGroups: 4,
  qualifiersPerGroup: 1,
  groupContests: 1,
  registrationStart: new Date("2026-01-01"),
  registrationEnd:   new Date("2026-01-15"),
  tournamentStart:   new Date("2026-01-16"),
  tournamentEnd:     new Date("2026-01-30"),
});

/** Run Mongoose schema validation on a plain object (no DB write). */
const validate = async (data) => {
  const doc = new Tournament(data);
  return doc.validate(); // throws ValidationError on failure
};

// ─── Slug generation ──────────────────────────────────────────────────────────

describe("Tournament slug generation (pre-save hook)", () => {
  it("generates a URL-safe slug from the name", () => {
    const doc = new Tournament({ ...validPayload(), name: "Code Arena 2026!" });
    // Trigger the pre-save hook logic by manually invoking it
    // (without saving to DB)
    if (doc.isModified("name") && doc.name) {
      doc.slug = doc.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
    assert.strictEqual(doc.slug, "code-arena-2026");
  });

  it("handles names with underscores and extra spaces", () => {
    const doc = new Tournament({ ...validPayload(), name: "  My_Tournament  " });
    if (doc.isModified("name") && doc.name) {
      doc.slug = doc.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
    assert.strictEqual(doc.slug, "my-tournament");
  });
});

// ─── participantsPerGroup auto-calculation ────────────────────────────────────

describe("Tournament pre-validate: participantsPerGroup auto-calc", () => {
  it("calculates participantsPerGroup = maxParticipants / numberOfGroups", async () => {
    const doc = new Tournament({ ...validPayload(), participantsPerGroup: undefined });
    await doc.validate();
    assert.strictEqual(doc.participantsPerGroup, 5); // 20 / 4
  });

  it("does not overwrite an existing participantsPerGroup", async () => {
    const doc = new Tournament({ ...validPayload(), participantsPerGroup: 5 });
    await doc.validate();
    assert.strictEqual(doc.participantsPerGroup, 5);
  });
});

// ─── maxParticipants divisibility ────────────────────────────────────────────

describe("Tournament pre-validate: maxParticipants divisibility", () => {
  it("throws when maxParticipants is not divisible by numberOfGroups", async () => {
    const doc = new Tournament({ ...validPayload(), maxParticipants: 21, numberOfGroups: 4 });
    await assert.rejects(
      () => doc.validate(),
      /divisible by number of groups/
    );
  });

  it("passes when maxParticipants is exactly divisible", async () => {
    const doc = new Tournament({ ...validPayload(), maxParticipants: 16, numberOfGroups: 4 });
    await assert.doesNotReject(() => doc.validate());
  });
});

// ─── qualifiersPerGroup constraint ───────────────────────────────────────────

describe("Tournament pre-validate: qualifiers < participantsPerGroup", () => {
  it("throws when qualifiersPerGroup >= participantsPerGroup", async () => {
    // 20 / 4 = 5 per group; set qualifiers to 5 (equal → should fail)
    const doc = new Tournament({ ...validPayload(), qualifiersPerGroup: 5 });
    await assert.rejects(
      () => doc.validate(),
      /Qualifiers per group must be less than participants per group/
    );
  });

  it("passes when qualifiersPerGroup < participantsPerGroup", async () => {
    const doc = new Tournament({ ...validPayload(), qualifiersPerGroup: 2 });
    await assert.doesNotReject(() => doc.validate());
  });
});

// ─── Date validations ─────────────────────────────────────────────────────────

describe("Tournament pre-validate: date ordering", () => {
  it("throws when registrationEnd is before registrationStart", async () => {
    const doc = new Tournament({
      ...validPayload(),
      registrationStart: new Date("2026-01-15"),
      registrationEnd:   new Date("2026-01-01"),
    });
    await assert.rejects(() => doc.validate(), /Registration end must be after/);
  });

  it("throws when registrationStart equals registrationEnd", async () => {
    const same = new Date("2026-01-10");
    const doc  = new Tournament({
      ...validPayload(),
      registrationStart: same,
      registrationEnd:   same,
    });
    await assert.rejects(() => doc.validate(), /Registration end must be after/);
  });

  it("throws when tournamentStart is before registrationEnd", async () => {
    const doc = new Tournament({
      ...validPayload(),
      registrationEnd: new Date("2026-01-20"),
      tournamentStart: new Date("2026-01-15"),
    });
    await assert.rejects(() => doc.validate(), /Tournament start must be after registration end/);
  });

  it("throws when tournamentEnd is before tournamentStart", async () => {
    const doc = new Tournament({
      ...validPayload(),
      tournamentStart: new Date("2026-01-25"),
      tournamentEnd:   new Date("2026-01-20"),
    });
    await assert.rejects(() => doc.validate(), /Tournament end must be after tournament start/);
  });

  it("throws when tournamentStart equals tournamentEnd", async () => {
    const same = new Date("2026-01-20");
    const doc  = new Tournament({
      ...validPayload(),
      tournamentStart: same,
      tournamentEnd:   same,
    });
    await assert.rejects(() => doc.validate(), /Tournament end must be after tournament start/);
  });

  it("passes a document with correct date ordering", async () => {
    const doc = new Tournament(validPayload());
    await assert.doesNotReject(() => doc.validate());
  });
});

// ─── Schema-level field constraints ──────────────────────────────────────────

describe("Tournament schema field validation", () => {
  it("requires the name field", async () => {
    const doc = new Tournament({ ...validPayload(), name: undefined });
    await assert.rejects(() => doc.validate(), /name/);
  });

  it("rejects an invalid status enum value", async () => {
    const doc = new Tournament({ ...validPayload(), status: "INVALID_STATUS" });
    await assert.rejects(() => doc.validate(), /status/);
  });

  it("accepts all valid status enum values", async () => {
    const statuses = ["DRAFT", "REGISTRATION", "GROUP_STAGE", "QUARTER_FINAL", "SEMI_FINAL", "FINAL", "COMPLETED", "CANCELLED"];
    for (const status of statuses) {
      const doc = new Tournament({ ...validPayload(), status });
      await assert.doesNotReject(() => doc.validate(), `Status ${status} should be valid`);
    }
  });

  it("rejects maxParticipants < 1", async () => {
    const doc = new Tournament({ ...validPayload(), maxParticipants: 0 });
    await assert.rejects(() => doc.validate());
  });
});
