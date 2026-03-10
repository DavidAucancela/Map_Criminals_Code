/**
 * Unit tests for frontend utility functions (getDangerLevel, escapeHtml, safeUrl)
 * These are extracted from app.js / script.js logic and tested independently.
 */

// ─── Inline implementations (mirrors app.js / script.js) ─────────────────────

function getDangerLevel(reward) {
  if (reward >= 5000000) return { es: 'CRÍTICO', en: 'CRITICAL', score: 5 };
  if (reward >= 1000000) return { es: 'ALTO',    en: 'HIGH',     score: 4 };
  if (reward >= 500000)  return { es: 'MEDIO',   en: 'MEDIUM',   score: 3 };
  if (reward >= 50000)   return { es: 'BAJO',    en: 'LOW',      score: 2 };
  return                        { es: 'MÍN',     en: 'MIN',      score: 1 };
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function safeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '';
  } catch {
    return '';
  }
}

// ─── getDangerLevel ───────────────────────────────────────────────────────────

describe('getDangerLevel', () => {
  test('classifies CRITICAL for reward >= 5M', () => {
    expect(getDangerLevel(5000000).en).toBe('CRITICAL');
    expect(getDangerLevel(10000000).en).toBe('CRITICAL');
  });

  test('classifies HIGH for 1M–4.9M', () => {
    expect(getDangerLevel(1000000).en).toBe('HIGH');
    expect(getDangerLevel(4999999).en).toBe('HIGH');
  });

  test('classifies MEDIUM for 500k–999k', () => {
    expect(getDangerLevel(500000).en).toBe('MEDIUM');
    expect(getDangerLevel(999999).en).toBe('MEDIUM');
  });

  test('classifies LOW for 50k–499k', () => {
    expect(getDangerLevel(50000).en).toBe('LOW');
    expect(getDangerLevel(499999).en).toBe('LOW');
  });

  test('classifies MIN for < 50k', () => {
    expect(getDangerLevel(0).en).toBe('MIN');
    expect(getDangerLevel(49999).en).toBe('MIN');
  });

  test('has Spanish labels', () => {
    expect(getDangerLevel(5000000).es).toBe('CRÍTICO');
    expect(getDangerLevel(1000000).es).toBe('ALTO');
    expect(getDangerLevel(500000).es).toBe('MEDIO');
    expect(getDangerLevel(50000).es).toBe('BAJO');
    expect(getDangerLevel(0).es).toBe('MÍN');
  });

  test('score increases with reward', () => {
    const scores = [0, 50000, 500000, 1000000, 5000000].map(r => getDangerLevel(r).score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]);
    }
  });
});

// ─── escapeHtml ───────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  test('escapes < and >', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  test('escapes &', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  test('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  test('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });

  test('returns empty string for non-string input', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('');
  });

  test('leaves safe strings unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  test('prevents XSS payloads', () => {
    const xss = '<img src=x onerror="alert(1)">';
    const result = escapeHtml(xss);
    expect(result).not.toContain('<img');
    expect(result).not.toContain('>');
  });
});

// ─── safeUrl ──────────────────────────────────────────────────────────────────

describe('safeUrl', () => {
  test('allows https URLs', () => {
    expect(safeUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
  });

  test('allows http URLs', () => {
    expect(safeUrl('http://example.com/photo.jpg')).toBe('http://example.com/photo.jpg');
  });

  test('blocks javascript: protocol', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('');
  });

  test('blocks data: URIs', () => {
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  test('returns empty for null/undefined', () => {
    expect(safeUrl(null)).toBe('');
    expect(safeUrl(undefined)).toBe('');
    expect(safeUrl('')).toBe('');
  });

  test('returns empty for malformed URLs', () => {
    expect(safeUrl('not-a-url')).toBe('');
  });
});
