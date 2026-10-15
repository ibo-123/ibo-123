require('dotenv').config();

const crypto = require('crypto');

const API_KEY = process.env.CODEFORCES_API_KEY;
const API_SECRET = process.env.CODEFORCES_API_SECRET;

function buildAuth(method, params = {}) {
  const time = Math.floor(Date.now() / 1000);

  const rand = crypto
    .randomBytes(3)
    .toString('hex');

  const allParams = {
    ...params,
    apiKey: API_KEY,
    time,
  };

  const sorted = Object.entries(allParams)
    .sort(([ka, va], [kb, vb]) => {
      if (ka !== kb) {
        return ka.localeCompare(kb);
      }

      return String(va).localeCompare(String(vb));
    })
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const signature =
    `${rand}/${method}?${sorted}#${API_SECRET}`;

  const hash = crypto
    .createHash('sha512')
    .update(signature)
    .digest('hex');

  return {
    ...allParams,
    apiSig: `${rand}${hash}`,
  };
}

async function main() {
  console.log('\n=== CODEFORCES AUTH TEST ===\n');

  if (!API_KEY) {
    throw new Error('CODEFORCES_API_KEY missing');
  }

  if (!API_SECRET) {
    throw new Error('CODEFORCES_API_SECRET missing');
  }

  const params = buildAuth(
    'user.info',
    {
      handles: 'ibrahimkediramdela2211',
    }
  );

  const query = new URLSearchParams(params);

  const url =
    `https://codeforces.com/api/user.info?${query}`;

  console.log('Requesting Codeforces...');

  const response = await fetch(url);

  const text = await response.text();

  console.log('\nHTTP:', response.status);

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    console.log(text.substring(0, 500));
    return;
  }

  console.log(
    JSON.stringify(data, null, 2)
  );

  if (data.status === 'OK') {
    console.log(
      '\n✅ CODEFORCES API AUTHENTICATION WORKS'
    );
  } else {
    console.log(
      '\n❌ CODEFORCES API AUTHENTICATION FAILED'
    );

    console.log(
      data.comment
    );
  }
}

main().catch(error => {
  console.error(
    '\n❌ ERROR:',
    error.message
  );
});