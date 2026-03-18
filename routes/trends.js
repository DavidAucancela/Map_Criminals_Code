const express = require('express');
let googleTrends;
try {
  googleTrends = require('google-trends-api');
} catch (e) {
  googleTrends = null;
}

const router = express.Router();

// In-memory cache: { key -> { score, time } }
const cache = {};
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function getTrendScore(name) {
  const now = Date.now();
  if (cache[name] && now - cache[name].time < CACHE_TTL) {
    return cache[name].score;
  }

  if (!googleTrends) return 0;

  try {
    const result = await googleTrends.interestOverTime({
      keyword: name,
      startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
      granularTimeResolution: false,
    });

    const data = JSON.parse(result);
    const timelineData = data?.default?.timelineData || [];
    if (timelineData.length === 0) {
      cache[name] = { score: 0, time: now };
      return 0;
    }

    // Average of values over the period (each value is 0-100)
    const values = timelineData.map(d => (d.value && d.value[0]) || 0);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    cache[name] = { score: avg, time: now };
    return avg;
  } catch (e) {
    // Graceful fallback — never crash the page
    cache[name] = { score: 0, time: now };
    return 0;
  }
}

// GET /api/trends?names=name1,name2,...
router.get('/', async (req, res) => {
  const namesParam = req.query.names || '';
  if (!namesParam) return res.json({});

  const names = namesParam
    .split(',')
    .map(n => n.trim())
    .filter(Boolean)
    .slice(0, 10); // Limit to 10 to avoid rate limiting

  try {
    const results = {};
    await Promise.all(
      names.map(async name => {
        results[name] = await getTrendScore(name);
      })
    );
    res.json(results);
  } catch (e) {
    // Always return empty object on error, never crash
    res.json({});
  }
});

module.exports = router;
