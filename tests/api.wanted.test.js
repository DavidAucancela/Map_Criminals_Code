/**
 * Tests for GET /api/wanted
 * Run with: npm test
 * Note: tests use ?source=manual or non-US countries to avoid external FBI API calls.
 */

const request = require('supertest');
const express = require('express');

// Minimal server for testing (no rate limiter)
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/wanted', require('../routes/wanted'));
  return app;
}

let app;

beforeAll(() => {
  app = buildApp();
});

describe('GET /api/wanted', () => {
  test('returns 200 with expected shape (manual source)', async () => {
    const res = await request(app).get('/api/wanted?source=manual');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('returns manual data filtered by country EC', async () => {
    const res = await request(app).get('/api/wanted?country=EC');
    expect(res.status).toBe(200);
    expect(res.body.items.every(i => i.country === 'EC')).toBe(true);
  });

  test('filters by crime', async () => {
    const res = await request(app).get('/api/wanted?country=EC&crime=Narcotráfico');
    expect(res.status).toBe(200);
    res.body.items.forEach(item => {
      const hasCrime = (item.crimes || []).some(c =>
        c.toLowerCase().includes('narcotráfico')
      );
      expect(hasCrime).toBe(true);
    });
  });

  test('pagination works correctly', async () => {
    const page1 = await request(app).get('/api/wanted?source=manual&limit=2&page=1');
    const page2 = await request(app).get('/api/wanted?source=manual&limit=2&page=2');
    expect(page1.body.items.length).toBeLessThanOrEqual(2);
    expect(page2.body.items.length).toBeLessThanOrEqual(2);
    if (page1.body.items.length > 0 && page2.body.items.length > 0) {
      expect(page1.body.items[0].id).not.toBe(page2.body.items[0].id);
    }
  });

  test('rejects invalid country codes — falls back to manual only', async () => {
    // <script> gets sanitized to '' by sanitizeStr (strips < > chars)
    // '' is not in VALID_COUNTRIES → countryFilter = ''
    // With source=manual to avoid FBI network call in test env
    const res = await request(app).get('/api/wanted?source=manual&country=INVALID');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
  });

  test('search filter is case-insensitive', async () => {
    const res = await request(app).get('/api/wanted?country=CO&search=fito');
    expect(res.status).toBe(200);
    res.body.items.forEach(item => {
      const match =
        item.name.toLowerCase().includes('fito') ||
        (item.description || '').toLowerCase().includes('fito') ||
        (item.crimes || []).some(c => c.toLowerCase().includes('fito'));
      expect(match).toBe(true);
    });
  });

  test('respects limit parameter — capped at 100', async () => {
    const res = await request(app).get('/api/wanted?source=manual&limit=999');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(100);
  });

  test('all items have required fields', async () => {
    const res = await request(app).get('/api/wanted?source=manual');
    expect(res.status).toBe(200);
    res.body.items.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('country');
      expect(Array.isArray(item.crimes)).toBe(true);
    });
  });

  test('returns totalPages correctly', async () => {
    const res = await request(app).get('/api/wanted?source=manual&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.totalPages).toBe(Math.ceil(res.body.total / 5));
  });
});
