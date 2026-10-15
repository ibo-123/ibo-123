require('dotenv').config();
const crypto = require('crypto');

const CONTEST_ID = 709424;
const API_KEY = process.env.CODEFORCES_API_KEY;
const API_SECRET = process.env.CODEFORCES_API_SECRET;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeSignature(method, params) {
  const rand = Math.random().toString(36).substring(2, 8);

  const sorted = Object.entries(params)
    .sort(([aKey, aValue], [bKey, bValue]) => {
      if (aKey !== bKey) return aKey.localeCompare(bKey);
      return String(aValue).localeCompare(String(bValue));
    });

  const query = sorted
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const signatureString =
    `${rand}/${method}?${query}#${API_SECRET}`;

  const hash = crypto
    .createHash('sha512')
    .update(signatureString)
    .digest('hex');

  return rand + hash;
}

async function call(method, params = {}) {
  const authParams = {
    ...params,
    apiKey: API_KEY,
    time: Math.floor(Date.now() / 1000)
  };

  authParams.apiSig = makeSignature(method, authParams);

  const url =
    `https://codeforces.com/api/${method}?` +
    new URLSearchParams(authParams).toString();

  console.log(`\n[REQUEST] ${method}`);
  console.log(`[URL] ${url.replace(API_KEY, '***')}`);

  const response = await fetch(url);
  const data = await response.json();

  console.log(`[HTTP] ${response.status}`);

  if (data.status !== 'OK') {
    throw new Error(data.comment || 'Codeforces API request failed');
  }

  return data.result;
}

async function main() {
  console.log('========================================');
  console.log('CODEFORCES CONTEST 709424 TEST');
  console.log('========================================');

  if (!API_KEY || !API_SECRET) {
    throw new Error(
      'CODEFORCES_API_KEY or CODEFORCES_API_SECRET is missing'
    );
  }

  // 1. Contest list
  console.log('\n1. CHECKING CONTEST LIST');

  const contests = await call('contest.list', {
    gym: false
  });

  const contest = contests.find(
    c => Number(c.id) === CONTEST_ID
  );

  if (!contest) {
    console.log(
      `❌ Contest ${CONTEST_ID} was not returned by contest.list`
    );
    console.log(
      'This may mean the contest is private/not visible through this list.'
    );
  } else {
    console.log('✅ Contest found');
    console.log(JSON.stringify(contest, null, 2));
  }

  await sleep(2500);

  // 2. Standings
  console.log('\n2. TESTING STANDINGS');

  try {
    const standings = await call('contest.standings', {
      contestId: CONTEST_ID,
      from: 1,
      count: 10,
      showUnofficial: true
    });

    console.log('✅ Standings request succeeded');

    console.log('\nContest:');
    console.log(JSON.stringify(standings.contest, null, 2));

    console.log('\nProblems:');
    console.log(
      standings.problems.map(p => ({
        index: p.index,
        name: p.name,
        rating: p.rating,
        tags: p.tags
      }))
    );

    console.log('\nRows returned:', standings.rows.length);

    if (standings.rows.length > 0) {
      console.log('\nFirst participant:');
      console.log(
        JSON.stringify(standings.rows[0], null, 2)
      );
    }
  } catch (error) {
    console.log('❌ Standings failed:', error.message);
  }

  await sleep(2500);

  // 3. Submissions
  console.log('\n3. TESTING CONTEST STATUS');

  try {
    const submissions = await call('contest.status', {
      contestId: CONTEST_ID,
      from: 1,
      count: 10
    });

    console.log('✅ Contest status succeeded');
    console.log('Submissions returned:', submissions.length);

    if (submissions.length > 0) {
      console.log('\nFirst submission:');
      console.log(
        JSON.stringify(submissions[0], null, 2)
      );
    }
  } catch (error) {
    console.log('❌ Contest status failed:', error.message);
  }

  console.log('\n========================================');
  console.log('TEST COMPLETE');
  console.log('========================================');
}

main().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  process.exit(1);
});