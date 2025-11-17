// @ts-check

// ==UserScript==
// @name         Map Addresses on LIV Residential
// @namespace    http://your.namespace.here
// @version      0.1.0
// @description  Identifies all addresses on LIV Residential and displays them on an OpenStreetMap overlay
// @author       Your Name
// @match        https://portal.livresidential.nl/zoeken*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @require      https://unpkg.com/leaflet@1.9.3/dist/leaflet.js
// @resource     LEAFLET_CSS https://unpkg.com/leaflet@1.9.3/dist/leaflet.css
// @top-level-await
// ==/UserScript==

// @ts-nocheck
/* eslint-disable */

// Add Leaflet CSS to the page
// @ts-expect-error Global Greasemonkey functions
GM_addStyle(GM_getResourceText('LEAFLET_CSS'));

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function domReady() {
  if (document.readyState === 'loading') {
    return new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', () => resolve(), {
        once: true,
      });
    });
  }
  return Promise.resolve();
}

function getCachedLocation(query) {
  try {
    const key = 'liv-geocode:' + query;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (
      typeof data === 'object' &&
      data &&
      typeof data.lat === 'number' &&
      typeof data.lng === 'number'
    ) {
      return data;
    }
  } catch (err) {
    console.warn('[LivMap] Error reading geocode cache', err);
  }
  return null;
}

function setCachedLocation(query, lat, lng) {
  try {
    const key = 'liv-geocode:' + query;
    const value = JSON.stringify({ lat, lng });
    window.localStorage.setItem(key, value);
  } catch (err) {
    console.warn('[LivMap] Error writing geocode cache', err);
  }
}

async function geocode(query) {
  const cached = getCachedLocation(query);
  if (cached) {
    return cached;
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', query);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept-Language': 'nl,en',
      'User-Agent': 'liv-properties-userscript/0.2 (personal use)',
    },
  });

  if (!response.ok) {
    throw new Error('Geocoding failed: ' + response.status);
  }

  const results = await response.json();
  if (!results || !results[0]) {
    return null;
  }

  const lat = parseFloat(results[0].lat);
  const lng = parseFloat(results[0].lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  setCachedLocation(query, lat, lng);
  return { lat, lng };
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function initMapOnce() {
  const list = document.querySelector('#propertyList');
  if (!list) {
    console.warn('[LivMap] #propertyList not found');
    return;
  }

  const cards = list.querySelectorAll('a.property');
  if (!cards.length) {
    console.warn('[LivMap] No property cards found');
    return;
  }

  if (document.getElementById('liv-property-map')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'liv-property-map';
  container.style.height = '500px';
  container.style.margin = '2rem 0';

  list.parentNode.insertBefore(container, list);

  const map = window.L.map('liv-property-map').setView([52.2, 5.3], 7);

  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const bounds = window.L.latLngBounds();
  let markerCount = 0;

  for (const card of cards) {
    const titleEl = card.querySelector('h3');
    const addrEl = card.querySelector('p.text-base');

    if (!titleEl || !addrEl) continue;

    const title = titleEl.textContent.trim();
    const address = addrEl.textContent.replace(/\s+/g, ' ').trim();
    const href = card.href;

    const query = title + ', ' + address + ', Netherlands';

    try {
      const location = await geocode(query);
      if (!location) {
        console.warn('[LivMap] No geocode result for', query);
        continue;
      }

      const marker = window.L.marker([location.lat, location.lng]).addTo(map);

      const popupHtml =
        '<div>' +
        '<div style="font-weight:600; margin-bottom:4px;">' +
        escapeHtml(title) +
        '</div>' +
        '<div style="font-size:0.9rem; margin-bottom:4px;">' +
        escapeHtml(address) +
        '</div>' +
        '<a href="' +
        href +
        '" target="_blank" rel="noopener noreferrer">' +
        'Bekijk woning' +
        '</a>' +
        '</div>';

      marker.bindPopup(popupHtml);
      bounds.extend([location.lat, location.lng]);
      markerCount += 1;

      // Be polite to the public geocoding service
      await delay(1000);
    } catch (err) {
      console.error('[LivMap] Error geocoding', query, err);
    }
  }

  if (markerCount > 0 && bounds.isValid()) {
    map.fitBounds(bounds, { padding: [40, 40] });
  } else {
    console.warn('[LivMap] No markers added');
  }
}

// Top level await, enabled by @top-level-await
await domReady();

if (window.top === window.self) {
  try {
    await initMapOnce();
  } catch (err) {
    console.error('[LivMap] Failed to initialize map', err);
  }
}
