// @ts-check

// ==UserScript==
// @name         Map Addresses on Huurflits
// @namespace    http://your.namespace.here
// @version      0.3.0
// @description  Identifies all addresses on huurflits.nl and displays them on an OpenStreetMap overlay
// @author       Your Name
// @match        https://huurflits.nl/woningoverzicht/zoekresultaten*
// @match        https://huurflits.nl/huurwoningen/*
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

// Add custom CSS for the map controls and markers
GM_addStyle(`
  .map-toggle-button {
    position: absolute;
    top: 50%;
    left: -20px;
    width: 20px;
    height: 40px;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px 0 0 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }
  .custom-div-icon {
    background-color: #2A81CB;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid #fff;
  }
`);

// Create the overlay and map container
const overlay = document.createElement('div');
overlay.id = 'address-map-overlay';
Object.assign(overlay.style, {
  position: 'fixed',
  top: '0',
  right: '0',
  width: '50%',
  height: '100%',
  zIndex: '9999',
  backgroundColor: '#fff',
  boxShadow: '0 0 10px rgba(0,0,0,0.5)',
  transition: 'width 0.3s ease',
});

const toggleButton = document.createElement('div');
toggleButton.className = 'map-toggle-button';
toggleButton.innerHTML = '&gt;';
toggleButton.style.top = '50%';
toggleButton.style.left = '-20px';
toggleButton.onclick = () => {
  if (overlay.style.width !== '20px') {
    overlay.style.width = '20px';
    toggleButton.innerHTML = '&lt;';
    toggleButton.style.left = '0';
  } else {
    overlay.style.width = '50%';
    toggleButton.innerHTML = '&gt;';
    toggleButton.style.left = '-20px';
  }
};
overlay.appendChild(toggleButton);

const mapDiv = document.createElement('div');
mapDiv.id = 'address-map';
mapDiv.style.width = '100%';
mapDiv.style.height = '100%';
overlay.appendChild(mapDiv);

document.body.appendChild(overlay);

// Wait for Leaflet to be available
await new Promise((resolve) => {
  if (typeof L !== 'undefined') {
    resolve();
  } else {
    const checkInterval = setInterval(() => {
      if (typeof L !== 'undefined') {
        clearInterval(checkInterval);
        resolve();
      }
    }, 50);
  }
});

const map = L.map('address-map').setView([52.3676, 4.9041], 12); // Center on Amsterdam

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19,
}).addTo(map);

// Extract property data from the page
const propertyElements = document.querySelectorAll('.feat_property');
/** @type {Array<{ address: string, price: string, url: string }> } */
const properties = [];

propertyElements.forEach((propertyElement) => {
  // Extract the address
  const addressElement = propertyElement.querySelector('.tc_content h4');
  if (!addressElement) return;

  const addressText = addressElement.textContent.trim();
  const addressMatch = addressText.match(/^[^\s]+\s+(.*)\s+in\s+(.+)/i);
  if (!addressMatch) return;

  const streetName = addressMatch[1];
  const cityName = addressMatch[2];
  const fullAddress = `${streetName}, ${cityName}, Netherlands`;

  // Extract the price
  const priceElement = propertyElement.querySelector('.fp_price');
  const priceText = priceElement
    ? priceElement.textContent.trim().replace(/\s+/g, ' ')
    : '';

  // Extract the URL
  // The parent of .feat_property is a div with an onclick attribute
  let url = '';
  let parent = propertyElement.parentElement;
  while (parent && !parent.getAttribute('onclick')) {
    parent = parent.parentElement;
  }
  if (parent && parent.getAttribute('onclick')) {
    const onclick = parent.getAttribute('onclick');
    const urlMatch = onclick.match(/location\.href='([^']+)'/);
    if (urlMatch) {
      url = urlMatch[1];
    }
  }

  properties.push({
    address: fullAddress,
    price: priceText,
    url: url,
  });
});

if (properties.length === 0) {
  console.log('No properties found on this page.');
} else {
  const bounds = L.latLngBounds();
  /** @type {{ [address: string]: { lat: number; lon: number } }} */
  const geocodeCache = {};

  // Function to add a marker to the map (used more than once)
  /**
   * @param {number} lat
   * @param {number} lon
   * @param {string} address
   * @param {string} price
   * @param {string} url
   */
  function addMarker(lat, lon, address, price, url) {
    const marker = L.marker([lat, lon], {
      icon: L.divIcon({
        className: 'custom-div-icon',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
    }).addTo(map);

    const popupContent = `<a href="${url}" target="_blank">${price} - ${address}</a>`;
    marker.bindPopup(popupContent);
    bounds.extend([lat, lon]);
  }

  // Geocode addresses concurrently
  const geocodePromises = properties.map((property) => {
    const { address, price, url } = property;
    if (geocodeCache[address]) {
      const { lat, lon } = geocodeCache[address];
      addMarker(lat, lon, address, price, url);
      return Promise.resolve();
    } else {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address,
      )}&addressdetails=1&limit=1`;

      return fetch(geocodeUrl)
        .then((response) => response.json())
        .then((data) => {
          if (data && data[0]) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);

            geocodeCache[address] = { lat, lon };

            addMarker(lat, lon, address, price, url);
          } else {
            console.error(
              `Geocode was not successful for the address "${address}".`,
            );
          }
        })
        .catch((error) => {
          console.error(
            `Error fetching geocode for address "${address}":`,
            error,
          );
        });
    }
  });

  await Promise.all(geocodePromises);

  if (bounds.isValid()) {
    map.fitBounds(bounds);
  }
}
