// scripts/backfillContestMatchNumbers.js
const mongoose = require('mongoose');
require('dotenv').config();

const Contest = require('./src/models/Contest');
const Match = require('./src/models/Match');

(async () => {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');

        // Find knockout contests that have matchNumber but no matchNumbers
        const contests = await Contest.find({
                stage: { $in: ['QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'] },
                $or: [
                        { matchNumbers: { $exists: false } },
                        { matchNumbers: { $size: 0 } },
                ],
                matchNumber: { $ne: null },
        });

        console.log(`Found ${contests.length} contests to backfill`);

        for (const c of contests) {
                // Find all matches in the same stage that have the same contest _id
                // OR that match the single matchNumber (legacy).
                const matches = await Match.find({
                        tournament: c.tournamentId,
                        $or: [
                                { contest: c._id },
                                { matchNumber: c.matchNumber },
                        ],
                });

                const nums = matches
                        .map((m) => m.matchNumber)
                        .filter((n) => Number.isInteger(n));

                if (nums.length > 0) {
                        c.matchNumbers = nums;
                        await c.save();
                        console.log(`  → ${c.name}: matchNumbers = [${nums.join(', ')}]`);
                } else {
                        console.log(`  → ${c.name}: no matches found, skipped`);
                }
        }

        // Also relink every match in the round to the same contest
        for (const c of contests) {
                if (!c.matchNumbers?.length) continue;
                await Match.updateMany(
                        { tournament: c.tournamentId, matchNumber: { $in: c.matchNumbers } },
                        { $set: { contest: c._id } }
                );
        }

        console.log('Done');
        await mongoose.disconnect();
})();