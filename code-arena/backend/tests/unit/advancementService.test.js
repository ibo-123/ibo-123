// backend/tests/unit/advancementService.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const {
        computeWinnerFromContest,
} = require("../../src/services/advancementService");
const Result = require("../../src/models/Result");

// Use fake ObjectIds for participantIds
const pidA = new mongoose.Types.ObjectId();
const pidB = new mongoose.Types.ObjectId();

test("computeWinnerFromContest returns null winner for less than 2 results", async () => {
        const original = Result.find;
        Result.find = () => ({
                sort: async () => [{ participantId: pidA, solvedCount: 3, penalty: 10 }],
        });
        try {
                const { winner, tie } = await computeWinnerFromContest("fake", [pidA, pidB]);
                assert.equal(winner, null);
                assert.equal(tie, false);
        } finally {
                Result.find = original;
        }
});

test("computeWinnerFromContest picks higher solved", async () => {
        const original = Result.find;
        Result.find = () => ({
                sort: async () => [
                        { participantId: pidA, solvedCount: 5, penalty: 60 },
                        { participantId: pidB, solvedCount: 3, penalty: 20 },
                ],
        });
        try {
                const { winner, tie } = await computeWinnerFromContest("fake", [pidA, pidB]);
                assert.equal(winner.toString(), pidA.toString());
                assert.equal(tie, false);
        } finally {
                Result.find = original;
        }
});

test("computeWinnerFromContest uses penalty as tiebreak on equal solved", async () => {
        const original = Result.find;
        Result.find = () => ({
                sort: async () => [
                        { participantId: pidB, solvedCount: 3, penalty: 15 },
                        { participantId: pidA, solvedCount: 3, penalty: 40 },
                ],
        });
        try {
                const { winner } = await computeWinnerFromContest("fake", [pidA, pidB]);
                assert.equal(winner.toString(), pidB.toString());
        } finally {
                Result.find = original;
        }
});

test("computeWinnerFromContest detects tie on equal solved + penalty", async () => {
        const original = Result.find;
        Result.find = () => ({
                sort: async () => [
                        { participantId: pidA, solvedCount: 3, penalty: 30 },
                        { participantId: pidB, solvedCount: 3, penalty: 30 },
                ],
        });
        try {
                const { winner, tie } = await computeWinnerFromContest("fake", [pidA, pidB]);
                assert.equal(winner, null);
                assert.equal(tie, true);
        } finally {
                Result.find = original;
        }
});