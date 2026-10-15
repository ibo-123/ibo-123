// scripts/fixQuarterFinal.js
const mongoose = require('mongoose');
require('dotenv').config();

const Contest = require('./src/models/Contest');
const Match = require('./src/models/Match');

const CONTEST_ID = '6ab0f074a512faefebae7328';
const TOURNAMENT_ID = '6aaf5e0c1be78dbd7944d794';

(async () => {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');

        const contest = await Contest.findById(CONTEST_ID);
        if (!contest) {
                console.error('Contest not found');
                process.exit(1);
        }

        console.log('Before:', {
                name: contest.name,
                stage: contest.stage,
                matchNumber: contest.matchNumber,
                matchNumbers: contest.matchNumbers,
        });

        // Find ALL matches in this stage for this tournament
        const roundMatches = await Match.find({
                tournament: TOURNAMENT_ID,
                stage: 'QUARTER_FINAL',
        }).sort({ matchNumber: 1 });

        console.log(`Found ${roundMatches.length} QF matches:`);
        for (const m of roundMatches) {
                console.log(`  #${m.matchNumber} contest=${m.contest} participants=${m.participants?.length ?? 0}`);
        }

        const matchNumbers = roundMatches
                .map((m) => m.matchNumber)
                .filter((n) => Number.isInteger(n));

        // Update contest
        contest.matchNumbers = matchNumbers;
        contest.matchNumber = matchNumbers.length === 1 ? matchNumbers[0] : undefined;
        await contest.save();

        // Link all round matches to this contest
        const result = await Match.updateMany(
                { tournament: TOURNAMENT_ID, matchNumber: { $in: matchNumbers } },
                { $set: { contest: contest._id } }
        );

        console.log(`Linked ${result.modifiedCount} matches to contest`);
        console.log('After:', {
                name: contest.name,
                stage: contest.stage,
                matchNumber: contest.matchNumber,
                matchNumbers: contest.matchNumbers,
        });

        await mongoose.disconnect();
        console.log('Done');
})();