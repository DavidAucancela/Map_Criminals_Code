const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// In-memory cache
let fbiCache = null;
let fbiCacheTime = 0;
const FBI_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const FBI_BASE = 'https://api.fbi.gov/wanted/v1/list';

// Convert inches to cm
function inToCm(inches) {
  if (!inches) return null;
  return Math.round(inches * 2.54);
}

// Convert lbs to kg
function lbsToKg(lbs) {
  if (!lbs) return null;
  return Math.round(lbs * 0.453592);
}

// Normalize FBI item to unified shape
function normalizeFBI(item) {
  const photo = item.images && item.images.length > 0
    ? item.images[0].thumb
    : 'Imagenes/3167755.png';

  const heightMin = item.height_min ? inToCm(item.height_min) : null;
  const heightMax = item.height_max ? inToCm(item.height_max) : null;
  const weightMin = item.weight_min ? lbsToKg(item.weight_min) : null;
  const weightMax = item.weight_max ? lbsToKg(item.weight_max) : null;

  return {
    id: item.uid || item['@id'] || `fbi-${Math.random().toString(36).slice(2)}`,
    source: 'fbi',
    country: 'US',
    name: item.title || 'Unknown',
    description: item.description || item.details || '',
    crimes: item.subjects || item.crimes || [],
    reward: item.reward_text
      ? parseInt(item.reward_text.replace(/[^0-9]/g, ''), 10) || 0
      : 0,
    reward_text: item.reward_text || '',
    nationality: item.nationality || '',
    lat: null,
    lng: null,
    photo: photo,
    height_cm: heightMin && heightMax
      ? `${heightMin}–${heightMax}`
      : heightMin || heightMax || null,
    weight_kg: weightMin && weightMax
      ? `${weightMin}–${weightMax}`
      : weightMin || weightMax || null,
    hair: item.hair_raw || '',
    eyes: item.eyes_raw || '',
    age_range: item.age_range || item.age_min
      ? (item.age_min && item.age_max ? `${item.age_min}–${item.age_max}` : item.age_min || '')
      : '',
    sex: item.sex || '',
    url: item.url || '',
    trendScore: 0,
  };
}

// Load and normalize manual data
function loadManual() {
  const filePath = path.join(__dirname, '../data/manual.json');
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const items = JSON.parse(raw);
    return items.map(item => ({
      ...item,
      trendScore: 0,
      reward_text: item.reward > 0 ? `$${item.reward.toLocaleString()}` : 'N/A',
    }));
  } catch (e) {
    console.error('Error loading manual.json:', e.message);
    return [];
  }
}

// Fetch all FBI pages and cache
async function fetchFBI() {
  const now = Date.now();
  if (fbiCache && now - fbiCacheTime < FBI_CACHE_TTL) {
    return fbiCache;
  }

  let allItems = [];
  let page = 1;
  const MAX_PAGES = 5;

  while (page <= MAX_PAGES) {
    try {
      const res = await fetch(`${FBI_BASE}?page=${page}`);
      if (!res.ok) break;
      const data = await res.json();
      const items = data.items || [];
      if (items.length === 0) break;
      allItems = allItems.concat(items.map(normalizeFBI));
      if (items.length < 20) break;
      page++;
    } catch (e) {
      console.error(`FBI fetch error page ${page}:`, e.message);
      break;
    }
  }

  fbiCache = allItems;
  fbiCacheTime = now;
  return allItems;
}

// Sanitize a string param: strip to plain text, limit length
function sanitizeStr(val, maxLen = 100) {
  if (typeof val !== 'string') return '';
  return val.replace(/[<>"'`]/g, '').trim().slice(0, maxLen);
}

// Valid ISO country codes supported by the app
const VALID_COUNTRIES = new Set(['EC','CO','PE','MX','BR','AR','VE','CL','US']);
const VALID_SOURCES   = new Set(['all', 'fbi', 'manual']);

// GET /api/wanted
router.get('/', async (req, res) => {
  try {
    const page  = Math.max(1, Math.min(100, parseInt(req.query.page)  || 1));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const search = sanitizeStr(req.query.search).toLowerCase();
    const rawSource  = sanitizeStr(req.query.source);
    const sourceFilter = VALID_SOURCES.has(rawSource) ? rawSource : 'all';
    const crimeFilter = sanitizeStr(req.query.crime);
    const nationalityFilter = sanitizeStr(req.query.nationality);
    const rawCountry = sanitizeStr(req.query.country).toUpperCase();
    const countryFilter = VALID_COUNTRIES.has(rawCountry) ? rawCountry : '';

    const manualItems = loadManual();
    let fbiItems = [];

    // Only hit FBI API when needed — non-US country filter or manual-only source skips entirely (<50ms)
    const needsFBI = (countryFilter === 'US' || sourceFilter === 'fbi') ||
                     (!countryFilter && sourceFilter !== 'manual');
    if (needsFBI) {
      fbiItems = await fetchFBI();
    }

    let all = [];

    // Country filter takes priority over source filter
    if (countryFilter === 'US') {
      all = fbiItems.slice(0, 20);
    } else if (countryFilter) {
      // Non-US country → manual data only (instant)
      all = manualItems.filter(item => item.country === countryFilter);
    } else if (sourceFilter === 'fbi') {
      all = fbiItems;
    } else if (sourceFilter === 'manual') {
      all = manualItems;
    } else {
      all = [...fbiItems, ...manualItems];
    }

    // Apply search
    if (search) {
      all = all.filter(item =>
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        (item.crimes || []).some(c => c.toLowerCase().includes(search))
      );
    }

    // Apply crime filter
    if (crimeFilter) {
      all = all.filter(item =>
        (item.crimes || []).some(c => c.toLowerCase().includes(crimeFilter.toLowerCase()))
      );
    }

    // Apply nationality filter
    if (nationalityFilter) {
      all = all.filter(item =>
        (item.nationality || '').toLowerCase().includes(nationalityFilter.toLowerCase())
      );
    }

    const total = all.length;
    const offset = (page - 1) * limit;
    const items = all.slice(offset, offset + limit);

    // Short public cache for non-real-time endpoints; US data refreshes from FBI API so keep short
    const ttl = countryFilter === 'US' ? 60 : 300;
    res.set('Cache-Control', `public, max-age=${ttl}`);
    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
    });
  } catch (e) {
    console.error('Error in /api/wanted:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
