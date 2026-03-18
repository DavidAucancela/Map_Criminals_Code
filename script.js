// ─── World Map (Leaflet) ──────────────────────────────────────────────────────

let worldMap = null;
let markersLayer = null;
let countryCircle = null;

function initWorldMap() {
  if (worldMap) return;

  worldMap = L.map('world-map', {
    center: [5, -75],
    zoom: 3,
    minZoom: 2,
    maxZoom: 12,
    renderer: L.canvas(),
    zoomAnimation: true,
    zoomAnimationThreshold: 4,
    fadeAnimation: true,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; ' +
      '<a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
    keepBuffer: 2,
    updateWhenZooming: true,
    updateWhenIdle: true,
  }).addTo(worldMap);

  markersLayer = L.layerGroup().addTo(worldMap);
}

// ─── Marker color by reward ───────────────────────────────────────────────────
function markerColor(reward) {
  if (reward >= 5000000) return '#ff3b3b';
  if (reward >= 1000000) return '#ff8c00';
  if (reward >= 500000)  return '#ffd700';
  if (reward >= 50000)   return '#00d4aa';
  return '#4f8ef7';
}

// ─── Pulsing divIcon ──────────────────────────────────────────────────────────
function createPulseMarker(color) {
  return L.divIcon({
    html: `<div class="pulse-marker" style="--mc:${color}">
             <div class="pulse-ring"></div>
             <div class="pulse-ring r2"></div>
             <div class="pulse-dot"></div>
           </div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

// ─── Radar ping (3 expanding rings) ──────────────────────────────────────────
function radarPing(center) {
  [0, 450, 900].forEach(delay => {
    setTimeout(() => {
      const c = L.circle(center, {
        radius: 80000,
        color: '#4f8ef7',
        fill: false,
        weight: 1.5,
        opacity: 0.8,
      }).addTo(worldMap);

      let r = 80000;
      let op = 0.8;
      const ticker = setInterval(() => {
        r += 18000;
        op -= 0.045;
        if (op <= 0) {
          clearInterval(ticker);
          worldMap.removeLayer(c);
          return;
        }
        c.setRadius(r);
        c.setStyle({ opacity: op });
      }, 40);
    }, delay);
  });
}

// ─── Country boundary circle ──────────────────────────────────────────────────
function showCountryCircle(center, radiusKm) {
  if (countryCircle) worldMap.removeLayer(countryCircle);
  countryCircle = L.circle(center, {
    radius: radiusKm * 1000,
    color: '#4f8ef7',
    fill: true,
    fillColor: '#4f8ef7',
    fillOpacity: 0.04,
    weight: 1,
    dashArray: '6 5',
    opacity: 0.3,
  }).addTo(worldMap);
}

// ─── Fly to country ───────────────────────────────────────────────────────────
function flyToCountry(center, zoom) {
  if (!worldMap) return;
  worldMap.flyTo(center, zoom, { animate: true, duration: 1 });
}

// ─── Zoom to marker, open popup after fly ────────────────────────────────────
function zoomToMarker(lat, lng) {
  if (!worldMap) return;
  worldMap.flyTo([lat, lng], 9, { animate: true, duration: 0.8 });

  setTimeout(() => {
    markersLayer.eachLayer(layer => {
      const ll = layer.getLatLng();
      if (Math.abs(ll.lat - lat) < 0.001 && Math.abs(ll.lng - lng) < 0.001) {
        layer.openPopup();
      }
    });
  }, 900);
}

// ─── Add pulsing markers ──────────────────────────────────────────────────────
function addMarkers(items) {
  if (!worldMap) initWorldMap();
  markersLayer.clearLayers();

  items.forEach(item => {
    if (item.lat == null || item.lng == null) return;

    const color = markerColor(item.reward || 0);

    const photoHtml = item.photo
      ? `<img src="${item.photo}" alt="${item.name}"
              style="width:56px;height:56px;object-fit:cover;border-radius:6px;
                     border:2px solid rgba(255,255,255,0.2);margin-bottom:6px;"
              onerror="this.src='Imagenes/3167755.png'"/>`
      : `<div style="width:56px;height:56px;background:#2d3561;border-radius:6px;
                     display:flex;align-items:center;justify-content:center;
                     margin-bottom:6px;font-size:1.4rem;">👤</div>`;

    const rewardText = item.reward > 0
      ? `<div style="color:${color};font-weight:700;font-size:0.75rem;margin-top:4px;">
           $${item.reward.toLocaleString()}
         </div>`
      : '';

    const moreLink = item.url
      ? `<a href="${item.url}" target="_blank" rel="noopener"
              style="color:#90bdff;font-size:0.7rem;font-weight:600;display:block;margin-top:4px;">
           Ver más &rarr;
         </a>`
      : '';

    const topCrime = (item.crimes && item.crimes.length > 0) ? item.crimes[0] : '';

    const popupContent = `
      <div style="text-align:center;font-family:'Quicksand',sans-serif;min-width:110px;max-width:160px;">
        ${photoHtml}
        <div style="font-weight:700;font-size:0.82rem;line-height:1.2;margin-bottom:3px;">${item.name}</div>
        ${topCrime ? `<div style="font-size:0.65rem;color:#a0aec0;margin-bottom:2px;">${topCrime}</div>` : ''}
        ${rewardText}
        ${moreLink}
      </div>
    `;

    const marker = L.marker([item.lat, item.lng], {
      icon: createPulseMarker(color),
    });

    marker.bindPopup(popupContent, { maxWidth: 180 });
    markersLayer.addLayer(marker);
  });
}

// ─── Auto-initialize map when DOM is ready ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initWorldMap();
});
