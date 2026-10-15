/**
 * Codeforces Private Gym API Test
 *
 * Tests:
 * 1. API credentials
 * 2. Authenticated Gym contest list
 * 3. Specific Gym contest
 * 4. Gym standings
 * 5. Gym submissions
 * 6. URL extraction
 * 7. Gym URL detection
 *
 * Run:
 *   node tests/testCodeforcesGym.js
 *
 * Required .env:
 *   CODEFORCES_API_KEY=your_key
 *   CODEFORCES_API_SECRET=your_secret
 *
 * Optional:
 *   GYM_CONTEST_ID=123456
 *   GYM_CONTEST_URL=https://codeforces.com/gym/123456
 */

require('dotenv').config();

const crypto = require('crypto');

const BASE_URL = 'https://codeforces.com/api';
const TIMEOUT = 30000;

const API_KEY = process.env.CODEFORCES_API_KEY;
const API_SECRET = process.env.CODEFORCES_API_SECRET;

const GYM_CONTEST_ID = process.env.GYM_CONTEST_ID
  ? Number(process.env.GYM_CONTEST_ID)
  : null;

const GYM_CONTEST_URL =
  process.env.GYM_CONTEST_URL || null;


// ============================================================
// Utility
// ============================================================

function section(title) {
  console.log('\n');
  console.log('='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

function success(message) {
  console.log(`\n✅ ${message}`);
}

function failure(message) {
  console.error(`\n❌ ${message}`);
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}


// ============================================================
// Validation
// ============================================================

function validateEnvironment() {
  section('1. ENVIRONMENT CHECK');

  if (!API_KEY) {
    failure('CODEFORCES_API_KEY is missing');
    return false;
  }

  if (!API_SECRET) {
    failure('CODEFORCES_API_SECRET is missing');
    return false;
  }

  success('Codeforces API key found');
  success('Codeforces API secret found');

  if (GYM_CONTEST_ID) {
    info(`GYM_CONTEST_ID = ${GYM_CONTEST_ID}`);
  } else {
    info('GYM_CONTEST_ID not configured');
  }

  if (GYM_CONTEST_URL) {
    info(`GYM_CONTEST_URL = ${GYM_CONTEST_URL}`);
  } else {
    info('GYM_CONTEST_URL not configured');
  }

  return true;
}


// ============================================================
// Authentication
// ============================================================

function buildAuthParams(method, params = {}) {
  const time = Math.floor(Date.now() / 1000);

  // Codeforces requires a random hexadecimal prefix.
  const rand = crypto
    .randomBytes(3)
    .toString('hex');

  const authParams = {
    ...params,
    apiKey: API_KEY,
    time,
  };

  const sortedParams = Object.entries(authParams)
    .sort(([keyA, valueA], [keyB, valueB]) => {
      if (keyA !== keyB) {
        return keyA.localeCompare(keyB);
      }

      return String(valueA).localeCompare(
        String(valueB)
      );
    })
    .map(
      ([key, value]) =>
        `${key}=${value}`
    )
    .join('&');

  const signatureBase =
    `${rand}/${method}?${sortedParams}#${API_SECRET}`;

  const hash = crypto
    .createHash('sha512')
    .update(signatureBase)
    .digest('hex');

  authParams.apiSig =
    `${rand}${hash}`;

  return authParams;
}


// ============================================================
// HTTP Request
// ============================================================

async function request(
  endpoint,
  params = {},
  authenticated = false
) {
  const method =
    endpoint.replace('/', '');

  let finalParams = {
    ...params,
  };

  if (authenticated) {
    finalParams =
      buildAuthParams(
        method,
        finalParams
      );
  }

  const searchParams =
    new URLSearchParams();

  for (
    const [key, value]
    of Object.entries(finalParams)
  ) {
    if (
      value === undefined ||
      value === null
    ) {
      continue;
    }

    searchParams.append(
      key,
      String(value)
    );
  }

  const url =
    `${BASE_URL}${endpoint}?${searchParams.toString()}`;

  console.log(
    `\n[REQUEST] ${endpoint}`
  );

  if (authenticated) {
    console.log(
      '[AUTH] Authenticated request'
    );
  } else {
    console.log(
      '[AUTH] Anonymous request'
    );
  }

  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () => controller.abort(),
      TIMEOUT
    );

  try {
    const response =
      await fetch(url, {
        signal:
          controller.signal,

        headers: {
          Accept:
            'application/json',

          'User-Agent':
            'CodeArena2026/1.0',
        },
      });

    const text =
      await response.text();

    let data;

    try {
      data =
        JSON.parse(text);
    } catch {
      throw new Error(
        `Codeforces returned non-JSON response: ${text.substring(
          0,
          300
        )}`
      );
    }

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${
          data.comment ||
          'Unknown error'
        }`
      );
    }

    if (data.status !== 'OK') {
      throw new Error(
        data.comment ||
        'Codeforces API error'
      );
    }

    return data.result;

  } finally {
    clearTimeout(timeoutId);
  }
}


// ============================================================
// Test 1
// Authenticated Gym List
// ============================================================

async function testGymList() {
  section(
    '2. TEST AUTHENTICATED GYM LIST'
  );

  try {
    const contests =
      await request(
        '/contest.list',
        {
          gym: true,
        },
        true
      );

    if (!Array.isArray(contests)) {
      throw new Error(
        'Expected an array of contests'
      );
    }

    success(
      `Received ${contests.length} Gym contests`
    );

    console.log('\nFirst 10 contests:\n');

    contests
      .slice(0, 10)
      .forEach(contest => {
        console.log({
          id: contest.id,
          name: contest.name,
          type: contest.type,
          phase: contest.phase,
          durationSeconds:
            contest.durationSeconds,
        });
      });

    return contests;

  } catch (error) {
    failure(
      `Gym list failed: ${error.message}`
    );

    return null;
  }
}


// ============================================================
// Test 2
// Find Specific Gym
// ============================================================

async function testSpecificGym(contests) {
  section(
    '3. TEST SPECIFIC PRIVATE GYM'
  );

  if (!GYM_CONTEST_ID) {
    info(
      'Skipping because GYM_CONTEST_ID is not configured.'
    );

    return null;
  }

  try {
    const contest =
      contests?.find(
        c =>
          c.id ===
          GYM_CONTEST_ID
      );

    if (!contest) {
      throw new Error(
        `Gym ${GYM_CONTEST_ID} was not found in the authenticated Gym list.`
      );
    }

    success(
      `Gym ${GYM_CONTEST_ID} is accessible`
    );

    console.log('\nContest information:\n');

    console.log(
      JSON.stringify(
        contest,
        null,
        2
      )
    );

    return contest;

  } catch (error) {
    failure(
      `Specific Gym test failed: ${error.message}`
    );

    return null;
  }
}


// ============================================================
// Test 3
// Gym Standings
// ============================================================

async function testGymStandings() {
  section(
    '4. TEST GYM STANDINGS'
  );

  if (!GYM_CONTEST_ID) {
    info(
      'Skipping because GYM_CONTEST_ID is not configured.'
    );

    return null;
  }

  try {
    const result =
      await request(
        '/contest.standings',
        {
          contestId:
            GYM_CONTEST_ID,
        },
        true
      );

    if (
      !result ||
      typeof result !== 'object'
    ) {
      throw new Error(
        'Invalid standings response'
      );
    }

    success(
      'Gym standings fetched successfully'
    );

    console.log(
      `Contest: ${
        result.contest?.name ||
        'Unknown'
      }`
    );

    console.log(
      `Problems: ${
        result.problems?.length ||
        0
      }`
    );

    console.log(
      `Rows: ${
        result.rows?.length ||
        0
      }`
    );

    if (
      result.rows &&
      result.rows.length > 0
    ) {
      console.log(
        '\nFirst 5 participants:\n'
      );

      result.rows
        .slice(0, 5)
        .forEach((row, index) => {
          console.log({
            position:
              index + 1,

            rank:
              row.rank,

            handle:
              row.party?.members?.[0]
                ?.handle,

            points:
              row.points,

            penalty:
              row.penalty,
          });
        });
    }

    return result;

  } catch (error) {
    failure(
      `Gym standings failed: ${error.message}`
    );

    return null;
  }
}


// ============================================================
// Test 4
// Gym Submissions
// ============================================================

async function testGymSubmissions() {
  section(
    '5. TEST GYM SUBMISSIONS'
  );

  if (!GYM_CONTEST_ID) {
    info(
      'Skipping because GYM_CONTEST_ID is not configured.'
    );

    return null;
  }

  try {
    const submissions =
      await request(
        '/contest.status',
        {
          contestId:
            GYM_CONTEST_ID,
        },
        true
      );

    if (
      !Array.isArray(
        submissions
      )
    ) {
      throw new Error(
        'Expected submissions array'
      );
    }

    success(
      `Received ${submissions.length} submissions`
    );

    if (
      submissions.length > 0
    ) {
      console.log(
        '\nFirst 5 submissions:\n'
      );

      submissions
        .slice(0, 5)
        .forEach(submission => {
          console.log({
            id:
              submission.id,

            contestId:
              submission.contestId,

            handle:
              submission.author
                ?.members?.[0]
                ?.handle,

            problem:
              submission.problem
                ?.index,

            verdict:
              submission.verdict,

            programmingLanguage:
              submission.programmingLanguage,
          });
        });
    }

    return submissions;

  } catch (error) {
    failure(
      `Gym submissions failed: ${error.message}`
    );

    return null;
  }
}


// ============================================================
// Test 5
// URL Extraction
// ============================================================

function testUrlParsing() {
  section(
    '6. TEST URL PARSING'
  );

  const urls = [
    'https://codeforces.com/contest/123456',
    'https://codeforces.com/gym/123456',
    'https://codeforces.com/problemset/contest/123456',
    'https://codeforces.com/problemset/gym/123456',
  ];

  urls.forEach(url => {
    const match =
      url.match(
        /codeforces\.com\/(?:contest|gym|problemset\/contest|problemset\/gym)\/(\d+)/i
      );

    const id =
      match
        ? Number(match[1])
        : null;

    const isGym =
      /codeforces\.com\/(?:gym|problemset\/gym)\//i
        .test(url);

    console.log({
      url,
      contestId: id,
      isGym,
    });
  });

  success(
    'URL parsing test completed'
  );
}


// ============================================================
// Test 6
// Complete Private Gym Flow
// ============================================================

async function testCompleteFlow() {
  section(
    '7. COMPLETE PRIVATE GYM FLOW'
  );

  if (!GYM_CONTEST_ID) {
    info(
      'Skipping because GYM_CONTEST_ID is not configured.'
    );

    return;
  }

  try {
    console.log(
      `Gym ID: ${GYM_CONTEST_ID}`
    );

    // 1. Verify Gym exists
    const contests =
      await request(
        '/contest.list',
        {
          gym: true,
        },
        true
      );

    const contest =
      contests.find(
        c =>
          c.id ===
          GYM_CONTEST_ID
      );

    if (!contest) {
      throw new Error(
        'Gym not accessible'
      );
    }

    success(
      '1/3 Gym is accessible'
    );

    // 2. Get standings
    const standings =
      await request(
        '/contest.standings',
        {
          contestId:
            GYM_CONTEST_ID,
        },
        true
      );

    success(
      `2/3 Standings fetched (${standings.rows?.length || 0} rows)`
    );

    // 3. Get submissions
    const submissions =
      await request(
        '/contest.status',
        {
          contestId:
            GYM_CONTEST_ID,
        },
        true
      );

    success(
      `3/3 Submissions fetched (${submissions.length} submissions)`
    );

    console.log('\n');

    success(
      'PRIVATE GYM INTEGRATION TEST PASSED'
    );

    console.log('\nContest:');
    console.log(
      contest.name
    );

    console.log(
      `ID: ${contest.id}`
    );

    console.log(
      `Phase: ${contest.phase}`
    );

    console.log(
      `Participants: ${
        standings.rows?.length ||
        0
      }`
    );

    console.log(
      `Submissions: ${
        submissions.length
      }`
    );

  } catch (error) {
    failure(
      `Complete Gym flow failed: ${error.message}`
    );
  }
}


// ============================================================
// Main
// ============================================================

async function main() {
  console.log('\n');
  console.log(
    '🚀 CODE ARENA - CODEFORCES GYM TEST'
  );
  console.log(
    'Testing private Codeforces Gym integration'
  );

  if (
    !validateEnvironment()
  ) {
    process.exit(1);
  }

  const contests =
    await testGymList();

  await testSpecificGym(
    contests
  );

  await testGymStandings();

  await testGymSubmissions();

  testUrlParsing();

  await testCompleteFlow();

  section(
    'TESTING FINISHED'
  );

  console.log(
    '\nIf the private Gym tests passed, your Codeforces authentication is working.'
  );

  console.log(
    'Next step: connect this service to contestController.js and your admin contest creation endpoint.'
  );

  console.log('\n');
}


// Run
main().catch(error => {
  console.error(
    '\n💥 UNEXPECTED TEST ERROR:',
    error
  );

  process.exit(1);
});