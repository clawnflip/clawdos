/**
 * ClawdOS Store API Server
 * 
 * Standalone Express server for the /v1/store/submit endpoint.
 * Run: node server.js
 * 
 * For Vercel deployment, use api/v1/store/submit.js instead (automatic).
 * This server is for local development and non-Vercel hosting.
 */

import { createClient } from '@supabase/supabase-js';
import http from 'http';

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = 'https://hgdaqhswimnltndrajeg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZGFxaHN3aW1ubHRuZHJhamVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDk4OTgsImV4cCI6MjA4NTk4NTg5OH0.SoC4vPIIgsEZ9QJWYz2LWQ-Ib4EtebAmNWCVKB3gsh4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const VALID_CATEGORIES = ['game', 'defi', 'social', 'utility', 'media', 'other'];
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}`;

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function safeText(value) {
  return typeof value === 'string' ? value : '';
}

function parseLikeNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function simplifyTweet(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const legacy = raw.legacy || raw.tweet || raw;
  const user = raw.core?.user_results?.result?.legacy || raw.user || {};
  const fullText = safeText(legacy.full_text || legacy.text);

  if (!fullText) return null;

  return {
    id: safeText(raw.rest_id || legacy.id_str || raw.id),
    text: fullText,
    createdAt: safeText(legacy.created_at || raw.created_at),
    lang: safeText(legacy.lang),
    favoriteCount: parseLikeNumber(legacy.favorite_count),
    retweetCount: parseLikeNumber(legacy.retweet_count),
    replyCount: parseLikeNumber(legacy.reply_count),
    quoteCount: parseLikeNumber(legacy.quote_count),
    viewCount: parseLikeNumber(raw.views?.count || legacy.views?.count),
    author: {
      name: safeText(user.name),
      screenName: safeText(user.screen_name),
      followersCount: parseLikeNumber(user.followers_count),
      verified: Boolean(user.verified)
    }
  };
}

function walkObjects(root, visit) {
  const seen = new Set();
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    if (seen.has(current)) continue;
    seen.add(current);
    visit(current);
    for (const value of Object.values(current)) {
      if (value && typeof value === 'object') stack.push(value);
    }
  }
}

function collectTweets(payload, maxItems = 30) {
  const byId = new Map();
  walkObjects(payload, (node) => {
    const candidates = [
      node?.tweet_results?.result,
      node?.itemContent?.tweet_results?.result,
      node?.item?.itemContent?.tweet_results?.result,
      node
    ];
    for (const candidate of candidates) {
      const simplified = simplifyTweet(candidate);
      if (simplified && !byId.has(simplified.id)) {
        byId.set(simplified.id, simplified);
      }
      if (byId.size >= maxItems) break;
    }
  });
  return Array.from(byId.values()).slice(0, maxItems);
}

function extractTimelineTweets(payload, maxItems = 30) {
  return collectTweets(payload, maxItems);
}

function extractSearchTweets(payload, maxItems = 40) {
  return collectTweets(payload, maxItems);
}

function collectUsers(payload) {
  const users = [];
  const seen = new Set();
  walkObjects(payload, (node) => {
    const legacy = node?.legacy;
    const core = node?.core || {};
    const screenName = safeText(legacy?.screen_name || core?.screen_name);
    if (!screenName) return;
    const id = safeText(node?.rest_id || legacy?.id_str || node?.id);
    const key = `${id}:${screenName.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    users.push({
      id,
      name: safeText(legacy?.name || core?.name),
      screenName,
      description: safeText(legacy?.description),
      followersCount: parseLikeNumber(legacy?.followers_count),
      followingCount: parseLikeNumber(legacy?.friends_count),
      tweetCount: parseLikeNumber(legacy?.statuses_count),
      favouritesCount: parseLikeNumber(legacy?.favourites_count),
      mediaCount: parseLikeNumber(legacy?.media_count),
      verified: Boolean(legacy?.verified),
      createdAt: safeText(legacy?.created_at),
      location: safeText(legacy?.location)
    });
  });
  return users;
}

function extractUserProfile(payload, fallbackUsername = '') {
  const users = collectUsers(payload);
  const lower = fallbackUsername.toLowerCase();
  const exact = users.find((u) => u.screenName.toLowerCase() === lower);
  if (exact) return exact;
  if (users.length > 0) return users[0];
  return {
    id: '',
    name: '',
    screenName: fallbackUsername,
    description: '',
    followersCount: 0,
    followingCount: 0,
    tweetCount: 0,
    favouritesCount: 0,
    mediaCount: 0,
    verified: false,
    createdAt: '',
    location: ''
  };
}

function mergeProfiles(primary, fallback) {
  return {
    id: primary.id || fallback.id,
    name: primary.name || fallback.name,
    screenName: primary.screenName || fallback.screenName,
    description: primary.description || fallback.description,
    followersCount: primary.followersCount > 0 ? primary.followersCount : fallback.followersCount,
    followingCount: primary.followingCount > 0 ? primary.followingCount : fallback.followingCount,
    tweetCount: primary.tweetCount > 0 ? primary.tweetCount : fallback.tweetCount,
    favouritesCount: primary.favouritesCount > 0 ? primary.favouritesCount : fallback.favouritesCount,
    mediaCount: primary.mediaCount > 0 ? primary.mediaCount : fallback.mediaCount,
    verified: primary.verified || fallback.verified,
    createdAt: primary.createdAt || fallback.createdAt,
    location: primary.location || fallback.location
  };
}

function extractUserId(payload, username = '') {
  const users = collectUsers(payload);
  const lower = username.toLowerCase();
  const exact = users.find((u) => u.screenName.toLowerCase() === lower && /^\d+$/.test(u.id));
  if (exact) return exact.id;
  const any = users.find((u) => /^\d+$/.test(u.id));
  return any ? any.id : '';
}

function computeSentimentSummary(tweets) {
  const positiveTerms = [
    'bull', 'pumped', 'moon', 'win', 'good', 'great', 'strong', 'breakout',
    'partnership', 'launch', 'listed', 'adoption', 'milestone', 'up only'
  ];
  const negativeTerms = [
    'bear', 'dump', 'scam', 'rug', 'hack', 'exploit', 'bad', 'weak', 'delay',
    'sell', 'down', 'fud', 'issue', 'problem'
  ];

  let positive = 0;
  let negative = 0;
  let neutral = 0;

  for (const tweet of tweets) {
    const text = tweet.text.toLowerCase();
    const posScore = positiveTerms.reduce((acc, term) => acc + (text.includes(term) ? 1 : 0), 0);
    const negScore = negativeTerms.reduce((acc, term) => acc + (text.includes(term) ? 1 : 0), 0);

    if (posScore > negScore) positive += 1;
    else if (negScore > posScore) negative += 1;
    else neutral += 1;
  }

  return { total: tweets.length, positive, negative, neutral };
}

async function rapidGet(path, params, apiKey) {
  const url = new URL(path, RAPIDAPI_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': apiKey
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RapidAPI request failed (${response.status}): ${text.slice(0, 240)}`);
  }

  return response.json();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rapidGetWithRetry(path, params, apiKey) {
  const attempts = [0, 1400, 2800];
  let lastError = null;

  for (let i = 0; i < attempts.length; i += 1) {
    if (attempts[i] > 0) {
      await sleep(attempts[i]);
    }
    try {
      return await rapidGet(path, params, apiKey);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('(429)')) {
        throw error;
      }
    }
  }

  throw lastError || new Error('RapidAPI request failed (429): rate limited');
}

function dedupeStrings(items) {
  return [...new Set(items.filter((item) => typeof item === 'string' && item.length > 0))];
}

async function rapidGetAny(pathCandidates, paramCandidates, apiKey) {
  const paths = dedupeStrings(pathCandidates);
  let lastError = null;

  for (const path of paths) {
    for (const params of paramCandidates) {
      try {
        return await rapidGetWithRetry(path, params, apiKey);
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        const is404 = message.includes('(404)');
        if (!is404) {
          throw error;
        }
      }
    }
  }

  throw lastError || new Error('RapidAPI request failed: no matching endpoint');
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, {});
  }

  // Health check
  if (req.url === '/v1/health') {
    return sendJson(res, 200, { status: 'ok', service: 'clawdos-store-api', version: '1.0.0' });
  }

  // Submit endpoint
  if (req.url === '/v1/store/submit' && req.method === 'POST') {
    try {
      const body = await parseBody(req);

      // Validate required fields
      if (!body.app_url || typeof body.app_url !== 'string' || !body.app_url.startsWith('https://')) {
        return sendJson(res, 400, { error: { message: 'app_url is required and must be a valid HTTPS URL', code: 'VALIDATION_ERROR' } });
      }
      if (!body.name || typeof body.name !== 'string' || body.name.length < 3 || body.name.length > 50) {
        return sendJson(res, 400, { error: { message: 'name is required (3-50 characters)', code: 'VALIDATION_ERROR' } });
      }
      if (!body.twitter_handle || typeof body.twitter_handle !== 'string') {
        return sendJson(res, 400, { error: { message: 'twitter_handle is required (e.g. @myhandle)', code: 'VALIDATION_ERROR' } });
      }

      const twitter = body.twitter_handle.startsWith('@') ? body.twitter_handle : '@' + body.twitter_handle;
      const category = VALID_CATEGORIES.includes(body.category) ? body.category : 'other';
      const tags = Array.isArray(body.tags) ? body.tags.slice(0, 5) : [];

      const insertData = {
        name: body.name.trim(),
        app_url: body.app_url.trim(),
        app_type: 'url',
        status: 'pending_review',
        twitter_handle: twitter,
        description: body.description?.substring(0, 300) || null,
        icon: body.icon || '📦',
        category,
        tags,
        owner_wallet: body.wallet || null,
        developer_name: body.developer_name || null,
        image_url: body.image_url || null,
      };

      // Check duplicate
      const { data: existing } = await supabase
        .from('mini_apps')
        .select('id')
        .eq('app_url', insertData.app_url)
        .limit(1);

      if (existing && existing.length > 0) {
        return sendJson(res, 409, { error: { message: 'An app with this URL has already been submitted', code: 'DUPLICATE_URL' } });
      }

      // Insert
      const { data, error } = await supabase
        .from('mini_apps')
        .insert([insertData])
        .select('id, name, status, app_url')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return sendJson(res, 500, { error: { message: 'Failed to submit app', code: 'INSERT_ERROR' } });
      }

      return sendJson(res, 201, {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          status: data.status,
          app_url: data.app_url,
          message: 'Your app has been submitted to the ClawdOS Store for review. ClawdOS agents will review it within 24-48 hours.'
        }
      });

    } catch (err) {
      console.error('Server error:', err);
      return sendJson(res, 500, { error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
    }
  }

  // Twitter advisor endpoint
  if (req.url === '/v1/twitter/advisor' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const apiKey = process.env.RAPIDAPI_KEY || process.env.X_RAPIDAPI_KEY || body.rapidApiKey;

      if (!apiKey) {
        return sendJson(res, 500, {
          error: { message: 'Missing RAPIDAPI_KEY environment variable.', code: 'MISSING_CONFIG' }
        });
      }

      if (!body.username || typeof body.username !== 'string') {
        return sendJson(res, 400, {
          error: { message: 'username is required.', code: 'VALIDATION_ERROR' }
        });
      }
      if (!body.ticker || typeof body.ticker !== 'string') {
        return sendJson(res, 400, {
          error: { message: 'ticker is required.', code: 'VALIDATION_ERROR' }
        });
      }

      const normalizedUsername = body.username.replace(/^@/, '').trim();
      const normalizedTicker = body.ticker.replace(/^\$/, '').trim().toUpperCase();
      const projectName = typeof body.projectName === 'string' ? body.projectName : '';
      const profilePath = typeof body.profilePath === 'string' ? body.profilePath : '/user';
      const userTweetsPath = typeof body.userTweetsPath === 'string' ? body.userTweetsPath : '/user-tweets';
      const searchPath = typeof body.searchPath === 'string' ? body.searchPath : '/search';

      const profilePayload = await rapidGetAny(
        [profilePath, '/user'],
        [
          { username: normalizedUsername },
          { username: normalizedUsername.toLowerCase() },
          { username: normalizedUsername.toUpperCase() }
        ],
        apiKey
      );
      const userId = extractUserId(profilePayload, normalizedUsername);
      if (!userId) {
        return sendJson(res, 422, {
          error: {
            message: 'Twitter user id resolve edilemedi. Endpoint username ile numeric rest_id dondurmuyor.',
            code: 'USER_ID_RESOLVE_FAILED'
          }
        });
      }

      await sleep(450);
      const userTweetsPayload = await rapidGetAny(
        [userTweetsPath, '/user-tweets'],
        [{ user: userId, count: 25 }],
        apiKey
      );

      await sleep(450);
      const searchQuery = `$${normalizedTicker} OR ${projectName || normalizedTicker}`;
      const searchPayload = await rapidGetAny(
        [searchPath, '/search', '/search-v2'],
        [
          { type: 'Top', count: 20, query: searchQuery },
          { type: 'Top', count: 20, q: searchQuery },
          { query: searchQuery, type: 'Latest' }
        ],
        apiKey
      );
      await sleep(300);
      const mentionPayload = await rapidGetAny(
        [searchPath, '/search', '/search-v2'],
        [
          { type: 'Top', count: 20, query: `@${normalizedUsername}` },
          { type: 'Latest', count: 20, query: `@${normalizedUsername}` }
        ],
        apiKey
      );

      const profileFromSearch = extractUserProfile(profilePayload, normalizedUsername);
      const profileFromTweets = extractUserProfile(userTweetsPayload, normalizedUsername);
      const profile = mergeProfiles(profileFromSearch, profileFromTweets);
      const userTweets = extractTimelineTweets(userTweetsPayload, 25);
      const searchTweets = extractSearchTweets(searchPayload, 20);
      const mentionTweets = extractSearchTweets(mentionPayload, 20);
      const sentiment = computeSentimentSummary(searchTweets);

      return sendJson(res, 200, {
        success: true,
        data: {
          username: normalizedUsername,
          ticker: normalizedTicker,
          profile,
          userTweets,
          searchTweets,
          mentionTweets,
          sentiment,
          sources: { profilePath, userTweetsPath, searchPath }
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      const isRateLimited = message.includes('(429)');
      const isMissingUserId = message.includes('ParseInt: parsing "undefined"');
      return sendJson(res, 500, {
        error: {
          message: isMissingUserId
            ? 'RapidAPI user-tweets endpointi numeric `user` id istiyor. Username->userId cozumu basarisiz oldu.'
            : isRateLimited
              ? 'RapidAPI rate limit (429). Bu endpoint tek analizde 3 istek attigi icin limit dolmus olabilir. 30-60 sn sonra tekrar dene veya plan limitini kontrol et.'
              : message,
          code: isMissingUserId ? 'USER_ID_REQUIRED' : isRateLimited ? 'RATE_LIMITED' : 'ADVISOR_FETCH_ERROR'
        }
      });
    }
  }

  // 404
  sendJson(res, 404, { error: { message: 'Not found. Available endpoints: POST /v1/store/submit, POST /v1/twitter/advisor', code: 'NOT_FOUND' } });
});

server.listen(PORT, () => {
  console.log(`\n🐾 ClawdOS Store API running on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/v1/store/submit`);
  console.log(`   GET  http://localhost:${PORT}/v1/health\n`);
});
