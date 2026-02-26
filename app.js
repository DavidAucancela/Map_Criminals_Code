// ─── i18n ─────────────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  es: {
    title: 'Los Más Buscados del Mundo',
    panel_title: 'MONITOR DE AMENAZAS',
    reward_label: 'Recompensa',
    no_reward: 'Sin recompensa',
    crimes_label: 'Crímenes',
    loading: 'Cargando...',
    no_results: 'Sin resultados para este país.',
    persons_found: 'persona(s) encontrada(s)',
    source_fbi: 'Fuente: FBI Most Wanted',
    more_info: 'Más info',
    danger_critical: 'CRÍTICO',
    danger_high: 'ALTO',
    danger_medium: 'MEDIO',
    danger_low: 'BAJO',
    danger_min: 'MÍN',
  },
  en: {
    title: "World's Most Wanted",
    panel_title: 'THREAT MONITOR',
    reward_label: 'Reward',
    no_reward: 'No reward',
    crimes_label: 'Crimes',
    loading: 'Loading...',
    no_results: 'No results for this country.',
    persons_found: 'person(s) found',
    source_fbi: 'Source: FBI Most Wanted',
    more_info: 'More info',
    danger_critical: 'CRITICAL',
    danger_high: 'HIGH',
    danger_medium: 'MEDIUM',
    danger_low: 'LOW',
    danger_min: 'MIN',
  },
};

let lang = 'es';

function t(key) {
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
}

// ─── Danger level ─────────────────────────────────────────────────────────────
function getDangerLevel(reward) {
  if (reward >= 5000000) return { es: 'CRÍTICO', en: 'CRITICAL', color: '#ff3b3b', bg: 'rgba(255,59,59,.18)',  score: 5 };
  if (reward >= 1000000) return { es: 'ALTO',    en: 'HIGH',     color: '#ff8c00', bg: 'rgba(255,140,0,.18)',  score: 4 };
  if (reward >= 500000)  return { es: 'MEDIO',   en: 'MEDIUM',   color: '#ffd700', bg: 'rgba(255,215,0,.18)',  score: 3 };
  if (reward >= 50000)   return { es: 'BAJO',    en: 'LOW',      color: '#00d4aa', bg: 'rgba(0,212,170,.18)',  score: 2 };
  return                        { es: 'MÍN',     en: 'MIN',      color: '#718096', bg: 'rgba(113,128,150,.18)', score: 1 };
}

// ─── Countries config ─────────────────────────────────────────────────────────
const COUNTRIES = {
  EC: { flag: '🇪🇨', name: 'Ecuador',   nameEN: 'Ecuador',   center: [-1.83, -78.18],  zoom: 7, threat: 4, radius: 350  },
  CO: { flag: '🇨🇴', name: 'Colombia',  nameEN: 'Colombia',  center: [4.57, -74.29],   zoom: 6, threat: 5, radius: 650  },
  PE: { flag: '🇵🇪', name: 'Perú',      nameEN: 'Peru',      center: [-9.19, -75.02],  zoom: 5, threat: 3, radius: 700  },
  MX: { flag: '🇲🇽', name: 'México',    nameEN: 'Mexico',    center: [23.63, -102.55], zoom: 5, threat: 5, radius: 950  },
  BR: { flag: '🇧🇷', name: 'Brasil',    nameEN: 'Brazil',    center: [-14.24, -51.93], zoom: 4, threat: 4, radius: 1500 },
  AR: { flag: '🇦🇷', name: 'Argentina', nameEN: 'Argentina', center: [-38.41, -63.62], zoom: 4, threat: 3, radius: 1100 },
  VE: { flag: '🇻🇪', name: 'Venezuela', nameEN: 'Venezuela', center: [6.42, -66.59],   zoom: 6, threat: 4, radius: 550  },
  CL: { flag: '🇨🇱', name: 'Chile',     nameEN: 'Chile',     center: [-35.68, -71.54], zoom: 4, threat: 2, radius: 700  },
  US: { flag: '🇺🇸', name: 'EE.UU.',   nameEN: 'USA',       center: [37.09, -95.71],  zoom: 4, threat: 4, radius: 1800 },
};

// Threat color map
const THREAT_COLORS = ['', '#718096', '#00d4aa', '#ffd700', '#ff8c00', '#ff3b3b'];

// ─── State ────────────────────────────────────────────────────────────────────
let selectedCountry = null;
let currentItems = [];
let selectSeq = 0;   // increments each call; lets stale responses self-discard
let manualData = []; // datos cargados desde data/manual.json
let manualLoaded = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function countryDisplayName(code) {
  const c = COUNTRIES[code];
  if (!c) return code;
  return lang === 'es' ? c.name : c.nameEN;
}

// ─── Build country grid ───────────────────────────────────────────────────────
function buildCountryGrid() {
  const grid = document.getElementById('country-grid');
  grid.innerHTML = Object.entries(COUNTRIES).map(([code, c]) => {
    const threatColor = THREAT_COLORS[c.threat] || '#718096';
    return `
      <button
        class="country-btn ${selectedCountry === code ? 'active' : ''}"
        id="btn-${code}"
        onclick="selectCountry('${code}')"
        title="${lang === 'es' ? c.name : c.nameEN}"
        style="--threat-color:${threatColor}"
      >
        <span class="flag">${c.flag}</span>
        <span class="country-name">${lang === 'es' ? c.name : c.nameEN}</span>
        <span class="threat-dot" style="background:${threatColor}"></span>
      </button>
    `;
  }).join('');
}

// ─── Cargar datos manuales una sola vez ──────────────────────────────────────
async function loadManualData() {
  if (manualLoaded && manualData.length > 0) return manualData;
  try {
    const res = await fetch('data/manual.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    manualData = Array.isArray(data) ? data : [];
    manualLoaded = true;
  } catch (e) {
    console.error('Error cargando data/manual.json:', e);
    manualData = [];
    manualLoaded = true;
  }
  return manualData;
}

// ─── Select a country ─────────────────────────────────────────────────────────
async function selectCountry(code) {
  const mySeq = ++selectSeq;   // stamp this call; stale calls self-discard below
  selectedCountry = code;
  const c = COUNTRIES[code];

  // 1. Activate button glow immediately
  document.querySelectorAll('.country-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `btn-${code}`);
  });

  // 2. Fire map animations instantly — each wrapped so a Leaflet error can't
  //    block the fetch that follows
  try { if (typeof flyToCountry    === 'function') flyToCountry(c.center, c.zoom); }    catch(e) { console.error('flyToCountry error:', e); }
  try { if (typeof radarPing       === 'function') radarPing(c.center); }              catch(e) { console.error('radarPing error:', e); }
  try { if (typeof showCountryCircle=== 'function') showCountryCircle(c.center, c.radius); } catch(e) { console.error('showCountryCircle error:', e); }

  // 3. Show loading spinner
  const resultSection = document.getElementById('panel-result');
  const loadingEl     = document.getElementById('panel-loading');
  const listEl        = document.getElementById('wanted-list');
  const headerEl      = document.getElementById('result-header');

  resultSection.style.display = 'flex';
  loadingEl.style.display     = 'flex';
  listEl.innerHTML             = '';
  headerEl.textContent         = '';

  // 4. Obtener datos desde el archivo local manual.json y filtrar por país
  let items = [];
  try {
    const all = await loadManualData();
    items = all.filter(p => p.country === code);
  } catch (e) {
    console.error('selectCountry data error:', e);
  }

  // Discard if a newer click happened while this was in-flight
  if (mySeq !== selectSeq) return;

  currentItems = items;

  // 5. Hide spinner, write header, render cards + markers
  loadingEl.style.display = 'none';
  headerEl.textContent = `${c.flag} ${countryDisplayName(code)} — ${currentItems.length} ${t('persons_found')}`;

  renderWantedList(currentItems);

  try {
    if (typeof addMarkers === 'function') {
      addMarkers(currentItems.filter(i => i.lat != null && i.lng != null));
    }
  } catch(e) { console.error('addMarkers error:', e); }
}

// ─── Render mini-cards ────────────────────────────────────────────────────────
function renderWantedList(items) {
  const listEl = document.getElementById('wanted-list');

  if (!items || items.length === 0) {
    listEl.innerHTML = `<div class="panel-empty">${t('no_results')}</div>`;
    return;
  }

  listEl.innerHTML = items.map((item, idx) => buildMiniCard(item, idx)).join('');
}

function buildMiniCard(item, idx) {
  const photoEl = item.photo
    ? `<img class="mini-photo" src="${item.photo}" alt="${item.name}" onerror="this.outerHTML='<div class=\\'mini-photo-placeholder\\'>👤</div>'" loading="lazy"/>`
    : `<div class="mini-photo-placeholder">👤</div>`;

  const topCrime = (item.crimes && item.crimes.length > 0) ? item.crimes[0] : '—';

  const reward = item.reward || 0;
  const danger = getDangerLevel(reward);
  const dangerLabel = lang === 'es' ? danger.es : danger.en;

  const rewardText = reward > 0
    ? `$${reward.toLocaleString()}`
    : t('no_reward');
  const rewardClass = reward > 0 ? 'mini-reward' : 'mini-reward no-reward';

  // Reward progress bar (reward / 10M, capped at 100%)
  const barPct = Math.min(100, (reward / 10000000) * 100).toFixed(1);

  const hasCoords = item.lat != null && item.lng != null;
  const clickHandler = hasCoords
    ? `onclick="zoomToMarker(${item.lat}, ${item.lng})"`
    : '';

  return `
    <div class="mini-card" ${clickHandler} title="${item.name}" style="--i:${idx}">
      ${photoEl}
      <div class="mini-info">
        <div class="mini-name-row">
          <div class="mini-name">${item.name}</div>
          <span class="danger-badge" style="color:${danger.color};background:${danger.bg}">${dangerLabel}</span>
        </div>
        <div class="mini-crime">${topCrime}</div>
        <span class="${rewardClass}">${rewardText}</span>
        ${reward > 0 ? `<div class="reward-bar"><div class="reward-bar-fill" style="width:${barPct}%;background:${danger.color}"></div></div>` : ''}
      </div>
    </div>
  `;
}

// ─── Language toggle ──────────────────────────────────────────────────────────
function toggleLang() {
  lang = lang === 'es' ? 'en' : 'es';
  document.getElementById('lang-toggle').textContent = lang === 'es' ? 'EN' : 'ES';
  applyI18n();
  buildCountryGrid();
  if (selectedCountry && currentItems.length > 0) {
    const c = COUNTRIES[selectedCountry];
    document.getElementById('result-header').textContent =
      `${c.flag} ${countryDisplayName(selectedCountry)} — ${currentItems.length} ${t('persons_found')}`;
    renderWantedList(currentItems);
  }
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.title = t('title');
}

// ─── Navbar clock ─────────────────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById('nav-clock');
  if (!el) return;
  function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    el.textContent = `${hh}:${mm}:${ss}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyI18n();
  buildCountryGrid();
  startClock();
});
