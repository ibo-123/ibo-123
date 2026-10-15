const crypto = require('crypto');

class CodeforcesService {
  constructor() {
    this.baseUrl = 'https://codeforces.com/api';
    this.timeout = 30000;

    this.apiKey = process.env.CODEFORCES_API_KEY;
    this.apiSecret = process.env.CODEFORCES_API_SECRET;

    // Codeforces API is rate-limited.
    this.minRequestInterval = 2100;
    this.lastRequestTime = 0;
  }

  /**
   * Small delay between API requests.
   *
   * Codeforces recommends approximately one request
   * every two seconds.
   */
  async waitForRateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    if (elapsed < this.minRequestInterval) {
      await new Promise(resolve =>
        setTimeout(
          resolve,
          this.minRequestInterval - elapsed
        )
      );
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Convert parameters to a query string.
   */
  buildQueryString(params = {}) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        searchParams.append(
          key,
          value.join(';')
        );
      } else {
        searchParams.append(
          key,
          String(value)
        );
      }
    }

    const query = searchParams.toString();

    return query ? `?${query}` : '';
  }

  /**
   * Build authenticated Codeforces API parameters.
   *
   * Signature:
   *
   * rand/method?sortedParams#secret
   *
   * apiSig = rand + SHA512(signature)
   */
  buildAuthParams(method, params = {}) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error(
        'Codeforces API credentials are not configured'
      );
    }

    const time = Math.floor(
      Date.now() / 1000
    );

    // Codeforces requires a random 6-character prefix.
    const rand = crypto
      .randomBytes(3)
      .toString('hex');

    const authParams = {
      ...params,
      apiKey: this.apiKey,
      time,
    };

    /**
     * Sort parameters by key.
     *
     * If keys are equal, sort by value as well.
     */
    const sortedParams = Object.entries(
      authParams
    )
      .sort(([keyA, valueA], [keyB, valueB]) => {
        if (keyA !== keyB) {
          return keyA.localeCompare(keyB);
        }

        return String(valueA).localeCompare(
          String(valueB)
        );
      })
      .map(([key, value]) => {
        return `${key}=${value}`;
      })
      .join('&');

    const signatureBase =
      `${rand}/${method}?${sortedParams}#${this.apiSecret}`;

    const hash = crypto
      .createHash('sha512')
      .update(signatureBase)
      .digest('hex');

    authParams.apiSig = `${rand}${hash}`;

    return authParams;
  }

  /**
   * Make a request to Codeforces API.
   *
   * authenticated = true should be used for private
   * contests and all authenticated operations.
   */
  async request(
    endpoint,
    params = {},
    authenticated = false
  ) {
    let url = '';

    try {
      const method = endpoint
        .replace(/^\/+/, '');

      let finalParams = {
        ...params,
      };

      if (authenticated) {
        finalParams = this.buildAuthParams(
          method,
          finalParams
        );
      }

      url =
        `${this.baseUrl}${endpoint}` +
        this.buildQueryString(finalParams);

      console.log(
        `[Codeforces] GET ${endpoint}` +
        `${authenticated ? ' [AUTH]' : ''}`
      );

      await this.waitForRateLimit();

      const controller =
        new AbortController();

      const timeoutId = setTimeout(
        () => controller.abort(),
        this.timeout
      );

      let response;

      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent':
              'CodeArena2026/1.0',
          },
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const rawText =
        await response.text();

      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        console.error(
          '[Codeforces] Non-JSON response:',
          rawText.substring(0, 300)
        );

        throw new Error(
          `Codeforces returned non-JSON response (HTTP ${response.status})`
        );
      }

      if (!response.ok) {
        throw new Error(
          `Codeforces HTTP ${response.status}: ${
            data.comment ||
            'Unknown error'
          }`
        );
      }

      if (data.status !== 'OK') {
        throw new Error(
          `Codeforces API error: ${
            data.comment ||
            'Unknown Codeforces error'
          }`
        );
      }

      return data.result;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(
          `Codeforces API request timed out after ${
            this.timeout / 1000
          } seconds`
        );
      }

      throw error;
    }
  }

  /**
   * Validate a contest ID.
   *
   * IMPORTANT:
   * Do NOT use contest.list here because private contests
   * may not appear in contest.list.
   *
   * contest.standings directly verifies that the
   * authenticated Codeforces account can access the contest.
   */
  async getContest(contestId) {
    const id = this.normalizeContestId(
      contestId
    );

    const standings =
      await this.getContestStandings(
        id,
        null,
        true
      );

    if (
      !standings ||
      !standings.contest
    ) {
      throw new Error(
        `Contest ${id} returned no contest information`
      );
    }

    return standings.contest;
  }

  /**
   * Get contest information directly through standings.
   *
   * This works for private contests that are accessible
   * to the configured Codeforces account.
   */
  async getContestInfo(contestId) {
    const id = this.normalizeContestId(
      contestId
    );

    const standings =
      await this.getContestStandings(
        id,
        null,
        true
      );

    return standings.contest;
  }

  /**
   * Get accessible Gym contests.
   *
   * Useful for discovering Gym contests, but should NOT
   * be used to validate a known private contest ID.
   */
  async getGymContests() {
    return this.request(
      '/contest.list',
      {
        gym: true,
      },
      true
    );
  }

  /**
   * Get a specific Gym contest.
   *
   * First tries contest.list because that is useful for
   * Gym discovery. If the contest is not returned there,
   * directly query standings.
   */
  async getGymContest(contestId) {
    const id = this.normalizeContestId(
      contestId
    );

    try {
      const contests =
        await this.getGymContests();

      const contest =
        contests.find(
          c => Number(c.id) === id
        );

      if (contest) {
        return contest;
      }
    } catch (error) {
      console.warn(
        `[Codeforces] Gym list unavailable: ${error.message}`
      );
    }

    // Direct fallback.
    const standings =
      await this.getContestStandings(
        id,
        null,
        true
      );

    if (
      !standings ||
      !standings.contest
    ) {
      throw new Error(
        `Gym contest ${id} was not found or is not accessible`
      );
    }

    return standings.contest;
  }

  /**
   * Get contest standings.
   *
   * Authentication is always enabled because Code Arena
   * needs to support private contests.
   */
  async getContestStandings(
    contestId,
    handles = null,
    isGym = false
  ) {
    const id = this.normalizeContestId(
      contestId
    );

    const params = {
      contestId: id,
      from: 1,
      count: 10000,
    };

    if (
      handles &&
      Array.isArray(handles) &&
      handles.length > 0
    ) {
      params.handles =
        handles.join(';');
    }

    /**
     * IMPORTANT:
     *
     * We authenticate even when isGym=false.
     *
     * This is required for private contests such as:
     * 709424
     */
    return this.request(
      '/contest.standings',
      params,
      true
    );
  }

  /**
   * Get contest submissions/status.
   *
   * Authentication is always enabled.
   */
  async getContestStatus(
    contestId,
    handle = null,
    isGym = false
  ) {
    const id = this.normalizeContestId(
      contestId
    );

    const params = {
      contestId: id,
      from: 1,
      count: 10000,
    };

    if (handle) {
      params.handle = handle;
    }

    return this.request(
      '/contest.status',
      params,
      true
    );
  }

  /**
   * Get all submissions for a contest.
   *
   * Alias that makes the intention clearer inside
   * tournament/result synchronization code.
   */
  async getContestSubmissions(
    contestId,
    handle = null
  ) {
    return this.getContestStatus(
      contestId,
      handle,
      false
    );
  }

  /**
   * Validate a contest.
   *
   * Directly accesses standings instead of contest.list.
   *
   * This works for:
   * - public contests
   * - private contests
   * - accessible Gym contests
   */
  async validateContest(
    contestId,
    isGym = false
  ) {
    try {
      const contest =
        await this.getContestInfo(
          contestId
        );

      return {
        valid: true,
        contest,
        contestId:
          contest.id,
        isGym:
          contest.type === 'IOI'
            ? false
            : Boolean(isGym),
      };

    } catch (error) {
      return {
        valid: false,
        contestId:
          Number(contestId),
        error: error.message,
      };
    }
  }

  /**
   * Normalize and validate contest ID.
   */
  normalizeContestId(contestId) {
    const id = Number(
      contestId
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(
        'Invalid Codeforces contest ID'
      );
    }

    return id;
  }

  /**
   * Extract contest ID from Codeforces URLs.
   *
   * Supports:
   *
   * /contest/709424
   * /contests/709424
   * /gym/709424
   * /problemset/contest/709424
   * /problemset/gym/709424
   */
  extractContestIdFromUrl(url) {
    if (!url) {
      return null;
    }

    const patterns = [
      /codeforces\.com\/contest\/(\d+)/i,
      /codeforces\.com\/contests\/(\d+)/i,
      /codeforces\.com\/gym\/(\d+)/i,
      /codeforces\.com\/problemset\/contest\/(\d+)/i,
      /codeforces\.com\/problemset\/gym\/(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match =
        String(url).match(
          pattern
        );

      if (match) {
        return parseInt(
          match[1],
          10
        );
      }
    }

    return null;
  }

  /**
   * Detect whether a URL is explicitly a Gym URL.
   */
  isGymUrl(url) {
    if (!url) {
      return false;
    }

    return (
      /codeforces\.com\/gym\/\d+/i.test(
        url
      ) ||
      /codeforces\.com\/problemset\/gym\/\d+/i.test(
        url
      )
    );
  }

  /**
   * Detect whether a URL contains a normal contest ID.
   */
  isContestUrl(url) {
    if (!url) {
      return false;
    }

    return (
      /codeforces\.com\/contest\/\d+/i.test(
        url
      ) ||
      /codeforces\.com\/contests\/\d+/i.test(
        url
      ) ||
      /codeforces\.com\/problemset\/contest\/\d+/i.test(
        url
      )
    );
  }

  /**
   * Parse a Codeforces URL into structured data.
   */
  parseContestUrl(url) {
    const contestId =
      this.extractContestIdFromUrl(
        url
      );

    if (!contestId) {
      return {
        valid: false,
        contestId: null,
        isGym: false,
        url,
      };
    }

    return {
      valid: true,
      contestId,
      isGym:
        this.isGymUrl(url),
      url,
    };
  }

  /**
   * Format a Codeforces contest URL.
   */
  formatContestUrl(
    contestId,
    isGym = false
  ) {
    const id =
      this.normalizeContestId(
        contestId
      );

    return isGym
      ? `https://codeforces.com/gym/${id}`
      : `https://codeforces.com/contest/${id}`;
  }

  /**
   * Test whether API credentials exist.
   */
  isConfigured() {
    return Boolean(
      this.apiKey &&
      this.apiSecret
    );
  }
}

module.exports =
  new CodeforcesService();