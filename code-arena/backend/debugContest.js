// scripts/debugContest.js
const mongoose = require('mongoose');
require('dotenv').config();

const Contest = require('./src/models/Contest');
const Match = require('./src/models/Match');
const Participant = require('./src/models/Participant');

(async () => {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');

        // 1. Show every contest in the DB (compact)
        const allContests = await Contest.find({}).lean();
        console.log(`\n=== ${allContests.length} contests total ===`);
        for (const c of allContests) {
                console.log({
                        _id: c._id,
                        name: c.name,
                        stage: c.stage,
                        group: c.group,
                        matchNumber: c.matchNumber,
                        matchNumbers: c.matchNumbers,
                        published: c.published,
                        tournamentId: c.tournamentId,
                });
        }

        // 2. For each knockout contest, find matching matches
        console.log(`\n=== Matches per knockout contest ===`);
        for (const c of allContests) {
                if (!['QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'].includes(c.stage)) continue;

                const matchesByContestId = await Match.find({ contest: c._id }).lean();
                const matchesByNumber = c.matchNumber
                        ? await Match.find({ tournament: c.tournamentId, matchNumber: c.matchNumber }).lean()
                        : [];
                const matchesByNumbers =
                        Array.isArray(c.matchNumbers) && c.matchNumbers.length
                                ? await Match.find({
                                        tournament: c.tournamentId,
                                        matchNumber: { $in: c.matchNumbers },
                                }).lean()
                                : [];

                console.log(`\nContest "${c.name}" (${c.stage})`);
                console.log(`  matchNumber:`, c.matchNumber);
                console.log(`  matchNumbers:`, c.matchNumbers);
                console.log(`  matches with contest=${c._id}:`, matchesByContestId.length);
                console.log(`  matches with matchNumber=${c.matchNumber}:`, matchesByNumber.length);
                console.log(`  matches with matchNumbers in [${c.matchNumbers}]:`, matchesByNumbers.length);

                // Show every match in this tournament with this stage
                const allStageMatches = await Match.find({
                        tournament: c.tournamentId,
                        stage: c.stage,
                }).lean();
                console.log(`  ALL matches in stage ${c.stage}:`, allStageMatches.length);
                for (const m of allStageMatches) {
                        console.log(`    - match #${m.matchNumber} contest=${m.contest} participants=${m.participants?.length ?? 0}`);
                }
        }

        // 3. Show participants of this tournament (approved)
        const tournamentIds = [...new Set(allContests.map((c) => String(c.tournamentId)))];
        for (const tid of tournamentIds) {
                const approved = await Participant.find({
                        tournamentId: tid,
                        registrationStatus: 'APPROVED',
                }).lean();
                console.log(`\n=== Tournament ${tid}: ${approved.length} approved participants ===`);
                for (const p of approved) {
                        console.log(`  - ${p._id} group=${p.group} seed=${p.seed}`);
                }
        }

        await mongoose.disconnect();
        console.log('\nDone');
})();