// ─── Security helpers ─────────────────────────────────────────────────────────
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

// ─── Toast notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'error') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.textContent = message;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));

  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 4000);
}

// ─── i18n ─────────────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  es: {
    title: 'Los Más Buscados del Mundo',
    panel_title: 'MONITOR DE AMENAZAS',
    reward_label: 'Recompensa',
    no_reward: 'Sin recompensa',
    crimes_label: 'Crímenes',
    loading: 'Cargando...',
    no_results: 'Sin resultados.',
    persons_found: 'persona(s) encontrada(s)',
    source_fbi: 'Fuente: FBI Most Wanted',
    more_info: 'Más info',
    danger_critical: 'CRÍTICO',
    danger_high: 'ALTO',
    danger_medium: 'MEDIO',
    danger_low: 'BAJO',
    danger_min: 'MÍN',
    world_total_label: '🌎 Mundo',
    filter_search_placeholder: 'Buscar por nombre…',
    filter_crime_all: 'Todos los crímenes',
    filter_danger_all: 'Todos los niveles',
    filter_danger_critical: 'CRÍTICO',
    filter_danger_high: 'ALTO',
    filter_danger_medium: 'MEDIO',
    filter_danger_low: 'BAJO',
    filter_danger_min: 'MÍN',
    filter_reset: 'Limpiar',
    sort_reward: 'Mayor recompensa',
    sort_name: 'Nombre A-Z',
    sort_danger: 'Más peligroso',
    sort_country: 'País',
    stats_records: 'registros',
    stats_total_reward: 'en recompensas',
    modal_crimes: 'Crímenes',
    modal_nationality: 'Nacionalidad',
    modal_description: 'Descripción',
    modal_view_map: 'Ver en mapa',
    modal_more_info: 'Más información',
    modal_close: 'Cerrar',
    modal_copy: 'Copiar ficha',
    modal_copied: '¡Copiado!',
    modal_no_desc: 'Sin descripción disponible.',
    wanted_label: 'BUSCADO',
  },
  en: {
    title: "World's Most Wanted",
    panel_title: 'THREAT MONITOR',
    reward_label: 'Reward',
    no_reward: 'No reward',
    crimes_label: 'Crimes',
    loading: 'Loading...',
    no_results: 'No results.',
    persons_found: 'person(s) found',
    source_fbi: 'Source: FBI Most Wanted',
    more_info: 'More info',
    danger_critical: 'CRITICAL',
    danger_high: 'HIGH',
    danger_medium: 'MEDIUM',
    danger_low: 'LOW',
    danger_min: 'MIN',
    world_total_label: '🌎 World',
    filter_search_placeholder: 'Search by name…',
    filter_crime_all: 'All crimes',
    filter_danger_all: 'All levels',
    filter_danger_critical: 'CRITICAL',
    filter_danger_high: 'HIGH',
    filter_danger_medium: 'MEDIUM',
    filter_danger_low: 'LOW',
    filter_danger_min: 'MIN',
    filter_reset: 'Reset',
    sort_reward: 'Highest reward',
    sort_name: 'Name A-Z',
    sort_danger: 'Most dangerous',
    sort_country: 'Country',
    stats_records: 'records',
    stats_total_reward: 'in rewards',
    modal_crimes: 'Crimes',
    modal_nationality: 'Nationality',
    modal_description: 'Description',
    modal_view_map: 'View on map',
    modal_more_info: 'More info',
    modal_close: 'Close',
    modal_copy: 'Copy profile',
    modal_copied: 'Copied!',
    modal_no_desc: 'No description available.',
    wanted_label: 'WANTED',
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
let manualData = [];
let filterName   = '';
let filterCrime  = '';
let filterDanger = '';
let sortBy       = 'reward';
let detailItem   = null;

// ─── Search highlight ─────────────────────────────────────────────────────────
function highlightText(text, query) {
  if (!text) return '';
  if (!query) return escapeHtml(text);
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  return (
    escapeHtml(text.slice(0, idx)) +
    '<mark class="hl">' + escapeHtml(text.slice(idx, idx + query.length)) + '</mark>' +
    escapeHtml(text.slice(idx + query.length))
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function countryDisplayName(code) {
  const c = COUNTRIES[code];
  if (!c) return code;
  return lang === 'es' ? c.name : c.nameEN;
}

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ─── Build country grid ───────────────────────────────────────────────────────
function buildCountryGrid() {
  const grid = document.getElementById('country-grid');
  const threatLabels = { es: ['', 'Mínimo', 'Bajo', 'Medio', 'Alto', 'Crítico'], en: ['', 'Min', 'Low', 'Medium', 'High', 'Critical'] };
  grid.innerHTML = Object.entries(COUNTRIES).map(([code, c]) => {
    const threatColor = THREAT_COLORS[c.threat] || '#718096';
    const countryName = lang === 'es' ? c.name : c.nameEN;
    const threatLabel = (threatLabels[lang] || threatLabels.es)[c.threat] || '';
    const isSelected  = selectedCountry === code;
    return `
      <button
        class="country-btn ${isSelected ? 'active' : ''}"
        id="btn-${code}"
        onclick="selectCountry('${code}')"
        title="${countryName}"
        aria-label="${countryName} — ${lang === 'es' ? 'Amenaza' : 'Threat'}: ${threatLabel}"
        aria-pressed="${isSelected}"
        style="--threat-color:${threatColor}"
      >
        <span class="flag" aria-hidden="true">${c.flag}</span>
        <span class="country-name">${countryName}</span>
        <span class="threat-dot" style="background:${threatColor}" aria-hidden="true"></span>
      </button>
    `;
  }).join('');
}

// ─── Preload all data once ────────────────────────────────────────────────────
async function preloadAllData() {
  try {
    const res = await fetch('data/manual.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    manualData = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Error cargando data/manual.json:', e);
    manualData = [];
    showToast(lang === 'es'
      ? 'Error al cargar los datos. Intente recargar la página.'
      : 'Error loading data. Please reload the page.');
  }
  applyFilters();
}

// ─── Apply filters (central, synchronous) ────────────────────────────────────
function applyFilters() {
  let items = manualData.slice();

  if (selectedCountry !== null) {
    items = items.filter(p => p.country === selectedCountry);
  }

  if (filterName) {
    const q = filterName.toLowerCase();
    items = items.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  if (filterCrime) {
    items = items.filter(p => p.crimes && p.crimes.includes(filterCrime));
  }

  if (filterDanger) {
    items = items.filter(p => getDangerLevel(p.reward || 0).en === filterDanger);
  }

  // Sort
  if (sortBy === 'name') {
    items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sortBy === 'danger') {
    items.sort((a, b) => getDangerLevel(b.reward || 0).score - getDangerLevel(a.reward || 0).score);
  } else if (sortBy === 'country') {
    items.sort((a, b) => (a.country || '').localeCompare(b.country || ''));
  } else {
    items.sort((a, b) => (b.reward || 0) - (a.reward || 0)); // default: reward desc
  }

  currentItems = items;

  const headerEl = document.getElementById('result-header');
  if (selectedCountry) {
    const c = COUNTRIES[selectedCountry];
    headerEl.textContent = `${c.flag} ${countryDisplayName(selectedCountry)} — ${currentItems.length} ${t('persons_found')}`;
  } else {
    headerEl.textContent = `${t('world_total_label')} — ${currentItems.length} ${t('persons_found')}`;
  }

  document.getElementById('panel-result').style.display = 'flex';
  document.getElementById('panel-loading').style.display = 'none';

  renderWantedList(currentItems);

  try {
    if (typeof addMarkers === 'function') {
      addMarkers(currentItems.filter(i => i.lat != null && i.lng != null));
    }
  } catch(e) { console.error('addMarkers error:', e); }
}

// ─── Build crime filter dropdown ──────────────────────────────────────────────
function buildCrimeFilter() {
  const sel = document.getElementById('filter-crime');
  if (!sel) return;
  const crimes = new Set();
  manualData.forEach(p => { if (p.crimes) p.crimes.forEach(c => crimes.add(c)); });
  const sorted = Array.from(crimes).sort();
  sel.innerHTML = `<option value="">${t('filter_crime_all')}</option>` +
    sorted.map(c => `<option value="${c}"${filterCrime === c ? ' selected' : ''}>${c}</option>`).join('');
}

// ─── Reset filters ────────────────────────────────────────────────────────────
function resetFilters() {
  filterName  = '';
  filterCrime = '';
  filterDanger = '';
  const nameEl   = document.getElementById('filter-name');
  const crimeEl  = document.getElementById('filter-crime');
  const dangerEl = document.getElementById('filter-danger');
  if (nameEl)   nameEl.value   = '';
  if (crimeEl)  crimeEl.value  = '';
  if (dangerEl) dangerEl.value = '';
  applyFilters();
}

// ─── Update filter placeholders for i18n ──────────────────────────────────────
function updateFilterPlaceholders() {
  const nameEl = document.getElementById('filter-name');
  if (nameEl) nameEl.placeholder = t('filter_search_placeholder');
}

// ─── Select a country (synchronous, toggleable) ───────────────────────────────
function selectCountry(code) {
  if (selectedCountry === code) {
    selectedCountry = null;
    document.querySelectorAll('.country-btn').forEach(btn => btn.classList.remove('active'));
    try { if (typeof flyToCountry === 'function') flyToCountry([5, -75], 3); } catch(e) {}
    try { if (typeof countryCircle !== 'undefined' && countryCircle) { worldMap.removeLayer(countryCircle); countryCircle = null; } } catch(e) {}
    applyFilters();
    return;
  }

  selectedCountry = code;
  const c = COUNTRIES[code];

  document.querySelectorAll('.country-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `btn-${code}`);
  });

  try { if (typeof flyToCountry    === 'function') flyToCountry(c.center, c.zoom); }         catch(e) { console.error('flyToCountry error:', e); }
  try { if (typeof radarPing       === 'function') radarPing(c.center); }                    catch(e) { console.error('radarPing error:', e); }
  try { if (typeof showCountryCircle === 'function') showCountryCircle(c.center, c.radius); } catch(e) { console.error('showCountryCircle error:', e); }

  applyFilters();
}

// ─── Render mini-cards ────────────────────────────────────────────────────────
function renderWantedList(items) {
  const listEl  = document.getElementById('wanted-list');
  const statsEl = document.getElementById('panel-stats');

  if (!items || items.length === 0) {
    listEl.innerHTML = `<div class="panel-empty">${t('no_results')}</div>`;
    if (statsEl) statsEl.style.display = 'none';
    return;
  }

  listEl.innerHTML = items.map((item, idx) => buildMiniCard(item, idx)).join('');

  // Stats footer
  if (statsEl) {
    const totalReward = items.reduce((acc, i) => acc + (i.reward || 0), 0);
    const rewardStr = totalReward > 0 ? `$${totalReward.toLocaleString()} ${t('stats_total_reward')}` : '';
    statsEl.innerHTML = `
      <span class="stats-count">${items.length} ${t('stats_records')}</span>
      ${rewardStr ? `<span class="stats-reward">${rewardStr}</span>` : ''}
    `;
    statsEl.style.display = 'flex';
  }
}

function buildMiniCard(item, idx) {
  const safeName  = escapeHtml(item.name);
  const safePhoto = safeUrl(item.photo);
  const hlName = highlightText(item.name, filterName);

  const photoEl = safePhoto
    ? `<img class="mini-photo" src="${safePhoto}" alt="${safeName}"
          style="border-color:${getDangerLevel(item.reward||0).color}33"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" loading="lazy"/>
       <div class="mini-photo-placeholder" style="display:none"><i class="fas fa-user-secret" aria-hidden="true"></i></div>`
    : `<div class="mini-photo-placeholder"><i class="fas fa-user-secret" aria-hidden="true"></i></div>`;

  const topCrime = (item.crimes && item.crimes.length > 0) ? escapeHtml(item.crimes[0]) : '—';
  const crimeCount = item.crimes ? item.crimes.length : 0;

  const reward = item.reward || 0;
  const danger = getDangerLevel(reward);
  const dangerLabel = lang === 'es' ? danger.es : danger.en;

  const rewardText = reward > 0
    ? `$${reward.toLocaleString()}`
    : t('no_reward');
  const rewardClass = reward > 0 ? 'mini-reward' : 'mini-reward no-reward';

  const barPct = Math.min(100, (reward / 10000000) * 100).toFixed(1);

  const countryFlag = COUNTRIES[item.country] ? COUNTRIES[item.country].flag : '';

  return `
    <div class="mini-card" onclick="openDetailModal(${idx})" title="${safeName}" style="--i:${idx};--dc:${danger.color}">
      <div class="mini-photo-wrap">
        ${photoEl}
        <div class="mini-threat-ring" style="border-color:${danger.color}44"></div>
      </div>
      <div class="mini-info">
        <div class="mini-name-row">
          <div class="mini-name">${hlName}</div>
          <span class="danger-badge" style="color:${danger.color};background:${danger.bg}">${dangerLabel}</span>
        </div>
        <div class="mini-crime">${topCrime}${crimeCount > 1 ? ` <span class="crime-more">+${crimeCount-1}</span>` : ''}</div>
        <div class="mini-bottom-row">
          <span class="${rewardClass}">${rewardText}</span>
          <span class="mini-country-tag">${countryFlag}</span>
        </div>
        ${reward > 0 ? `<div class="reward-bar"><div class="reward-bar-fill" style="width:${barPct}%;background:${danger.color}"></div></div>` : ''}
      </div>
    </div>
  `;
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
function openDetailModal(idx) {
  const item = currentItems[idx];
  if (!item) return;
  detailItem = item;

  const modal   = document.getElementById('detail-modal');
  const danger  = getDangerLevel(item.reward || 0);
  const safeName = escapeHtml(item.name);
  const safePhoto = safeUrl(item.photo);
  const country = COUNTRIES[item.country];

  // Wanted label
  document.getElementById('modal-wanted-label').textContent = t('wanted_label');

  // Photo
  const photoImg = document.getElementById('modal-photo-img');
  const photoPh  = document.getElementById('modal-photo-ph');
  if (safePhoto) {
    photoImg.src = safePhoto;
    photoImg.alt = safeName;
    photoImg.style.display = 'block';
    photoPh.style.display  = 'none';
    photoImg.onerror = () => { photoImg.style.display='none'; photoPh.style.display='flex'; };
  } else {
    photoImg.style.display = 'none';
    photoPh.style.display  = 'flex';
  }

  // Danger badge
  const badgeEl = document.getElementById('modal-danger-badge');
  badgeEl.textContent = lang === 'es' ? danger.es : danger.en;
  badgeEl.style.color      = danger.color;
  badgeEl.style.borderColor = danger.color;
  badgeEl.style.background  = danger.bg;

  // Reward
  const rewardEl = document.getElementById('modal-reward-display');
  rewardEl.textContent = item.reward > 0
    ? `$${Number(item.reward).toLocaleString()}`
    : t('no_reward');
  rewardEl.style.color = item.reward > 0 ? danger.color : '#718096';

  // Name
  document.getElementById('modal-name-heading').textContent = item.name;

  // Meta (country + nationality)
  const metaEl = document.getElementById('modal-meta');
  const flagStr = country ? `${country.flag} ${lang === 'es' ? country.name : country.nameEN}` : (item.country || '');
  metaEl.innerHTML = `
    <span class="modal-meta-item">${flagStr}</span>
    ${item.nationality ? `<span class="modal-meta-sep">•</span><span class="modal-meta-item">${escapeHtml(item.nationality)}</span>` : ''}
  `;

  // Crimes
  document.getElementById('modal-crimes-title').textContent = t('modal_crimes');
  const crimes = item.crimes || [];
  document.getElementById('modal-crimes-list').innerHTML = crimes.length > 0
    ? crimes.map(c => `<span class="crime-chip">${escapeHtml(c)}</span>`).join('')
    : '<span class="modal-no-data">—</span>';

  // Description
  document.getElementById('modal-desc-title').textContent = t('modal_description');
  document.getElementById('modal-desc-text').textContent = item.description || t('modal_no_desc');

  // Actions
  const actionsEl = document.getElementById('modal-actions');
  const hasCoords = item.lat != null && item.lng != null;
  actionsEl.innerHTML = `
    ${hasCoords ? `<button class="modal-action-btn primary" onclick="closeDetailModal();zoomToMarker(${item.lat},${item.lng})">
      <i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${t('modal_view_map')}
    </button>` : ''}
    ${safeUrl(item.url) ? `<a class="modal-action-btn" href="${safeUrl(item.url)}" target="_blank" rel="noopener noreferrer">
      <i class="fas fa-external-link-alt" aria-hidden="true"></i> ${t('modal_more_info')}
    </a>` : ''}
    <button class="modal-action-btn" id="modal-copy-btn" onclick="copyItemInfo()">
      <i class="fas fa-copy" aria-hidden="true"></i> <span id="modal-copy-label">${t('modal_copy')}</span>
    </button>
  `;

  // Frame color from danger level
  document.querySelector('.modal-photo-frame').style.borderColor = danger.color + '88';
  document.querySelector('.modal-photo-frame').style.boxShadow = `0 0 24px ${danger.color}33`;

  modal.classList.remove('hidden');
  modal.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  const modal = document.getElementById('detail-modal');
  if (!modal) return;
  modal.classList.remove('visible');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  detailItem = null;
}

function copyItemInfo() {
  if (!detailItem) return;
  const danger = getDangerLevel(detailItem.reward || 0);
  const lines = [
    `${t('wanted_label')}: ${detailItem.name}`,
    `${lang === 'es' ? 'País' : 'Country'}: ${detailItem.country || ''}`,
    detailItem.nationality ? `${t('modal_nationality')}: ${detailItem.nationality}` : '',
    `${t('modal_crimes')}: ${(detailItem.crimes || []).join(', ')}`,
    `${t('reward_label')}: ${detailItem.reward > 0 ? '$' + Number(detailItem.reward).toLocaleString() : t('no_reward')}`,
    `${lang === 'es' ? 'Nivel' : 'Level'}: ${lang === 'es' ? danger.es : danger.en}`,
    detailItem.description ? `\n${t('modal_description')}: ${detailItem.description}` : '',
  ].filter(Boolean).join('\n');

  navigator.clipboard.writeText(lines).then(() => {
    const label = document.getElementById('modal-copy-label');
    if (label) {
      label.textContent = t('modal_copied');
      setTimeout(() => { label.textContent = t('modal_copy'); }, 2000);
    }
  }).catch(() => showToast(lang === 'es' ? 'No se pudo copiar.' : 'Could not copy.', 'warn'));
}

// ─── Language toggle ──────────────────────────────────────────────────────────
function toggleLang() {
  lang = lang === 'es' ? 'en' : 'es';
  document.getElementById('lang-toggle').textContent = lang === 'es' ? 'EN' : 'ES';
  applyI18n();
  buildCountryGrid();
  buildCrimeFilter();
  updateFilterPlaceholders();
  applyFilters();
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

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV() {
  if (!currentItems || currentItems.length === 0) {
    showToast(lang === 'es' ? 'No hay datos para exportar.' : 'No data to export.', 'warn');
    return;
  }

  const headers = ['ID', 'Name', 'Country', 'Crimes', 'Reward (USD)', 'Danger Level', 'Nationality', 'Description'];
  const rows = currentItems.map(item => {
    const danger = getDangerLevel(item.reward || 0);
    return [
      item.id || '',
      item.name || '',
      item.country || '',
      (item.crimes || []).join(' | '),
      item.reward || 0,
      danger.en,
      item.nationality || '',
      (item.description || '').replace(/"/g, '""'),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wanted_${selectedCountry || 'world'}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  applyI18n();
  buildCountryGrid();
  startClock();
  await preloadAllData();
  buildCrimeFilter();
  updateFilterPlaceholders();

  const nameInput  = document.getElementById('filter-name');
  const crimeSelect  = document.getElementById('filter-crime');
  const dangerSelect = document.getElementById('filter-danger');
  const resetBtn     = document.getElementById('filter-reset');

  if (nameInput) {
    nameInput.addEventListener('input', debounce(e => {
      filterName = e.target.value.trim();
      applyFilters();
    }, 250));
  }

  if (crimeSelect) {
    crimeSelect.addEventListener('change', e => {
      filterCrime = e.target.value;
      applyFilters();
    });
  }

  if (dangerSelect) {
    dangerSelect.addEventListener('change', e => {
      filterDanger = e.target.value;
      applyFilters();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }

  // Sort
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      sortBy = e.target.value;
      applyFilters();
    });
  }

  // Modal close button
  const modalCloseBtn = document.getElementById('modal-close');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDetailModal);

  // Modal overlay click to close
  const modalOverlay = document.getElementById('detail-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeDetailModal();
    });
  }

  // Keyboard: ESC closes modal or deselects country
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('detail-modal');
      if (modal && modal.classList.contains('visible')) {
        closeDetailModal();
      } else if (selectedCountry) {
        selectCountry(selectedCountry); // toggle off
      }
    }
  });
});
