// Simple Leaflet map initializer
// Loads `cities.json` and plots markers using Latitude and Longitude fields.

document.addEventListener('DOMContentLoaded', function () {
  // Make sure the #map element exists
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Configuration: maxBounds (set to an approximate Canada extent by default)
  // You can tweak these values or set `useMaxBounds` to false to disable bounds.
  const useMaxBounds = true;
  const canadaSouthWest = L.latLng(38, -147); // approximate SW
  const canadaNorthEast = L.latLng(74, -40); // approximate NE
  const canadaBounds = L.latLngBounds(canadaSouthWest, canadaNorthEast);

  // Initialize map centered roughly on Canada
  const mapOptions = {
    center: [56, -96],
    zoom: 4,
    minZoom: 2,
    maxZoom: 19,
  };

  if (useMaxBounds) {
    mapOptions.maxBounds = canadaBounds;
    // Optionally tighten minZoom when bounds are enforced; comment out if undesired
    mapOptions.minZoom = 3;
  }

  const map = L.map('map', mapOptions);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  // Fetch cities.json and add markers
  fetch('data/cities.json')
    .then(r => r.json())
    .then(data => {
      data.forEach(item => {
        // Some files may have fields with BOM in the key names; prefer normalized keys
        const lat = item.Latitude || item.latitude || item.lat;
        const lon = item.Longitude || item.longitude || item.lng || item.lon;
        const name = item['\ufeffMunicipality (n=104)'] || item['Municipality (n=104)'] || item.Municipality || item['Municipality'];
        const province = item.Province || item.province || '';
        const pop = item.Population || '';
        const planyear = item.Year || '';

        if (lat && lon) {
          const marker = L.marker([lat, lon]).addTo(map);
          const popupHtml = `<strong>${name || 'Unknown'}</strong>, 
            <br/>${province}<br/>
            Population: ${pop || 'n/a'} <br/>
            Year of plan: ${planyear || 'n/a'} <br/>
            `;
          marker.bindPopup(popupHtml);
        }
      });
    })
    .catch(err => {
      console.error('Error loading cities.json for map', err);
    });
});
