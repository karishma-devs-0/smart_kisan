import { MOCK_DEVICE_TYPES } from '../features/devices/mock/devicesMockData';

/**
 * Generates a Leaflet HTML map with field markers and device pins.
 *
 * @param {Object} options
 * @param {Array} options.fields - Field objects with location.lat/lng
 * @param {Array} options.devices - Device objects with coordinates.lat/lng
 * @param {boolean} options.interactive - Allow zoom/pan (true for full screen, false for widget)
 * @param {number} options.zoom - Initial zoom level
 * @returns {string} Complete HTML string for WebView
 */
export function generateMapHTML({ fields = [], devices = [], interactive = true, zoom = 15 }) {
  // Calculate center from all points
  const allLats = [
    ...fields.map((f) => f.location?.lat).filter(Boolean),
    ...devices.map((d) => d.coordinates?.lat).filter(Boolean),
  ];
  const allLngs = [
    ...fields.map((f) => f.location?.lng).filter(Boolean),
    ...devices.map((d) => d.coordinates?.lng).filter(Boolean),
  ];

  const centerLat = allLats.length ? allLats.reduce((a, b) => a + b, 0) / allLats.length : 23.258;
  const centerLng = allLngs.length ? allLngs.reduce((a, b) => a + b, 0) / allLngs.length : 77.411;

  // Build field markers JS
  const fieldMarkersJS = fields.map((f) => {
    const lat = f.location?.lat;
    const lng = f.location?.lng;
    if (!lat || !lng) return '';
    const color = f.status === 'harvested' ? '#FF9800' : '#4CAF50';
    const shortName = f.name.split(' - ')[0];
    return `
      L.circleMarker([${lat}, ${lng}], {
        radius: 14,
        fillColor: '${color}',
        color: '#fff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.85,
      }).addTo(map)
        .bindPopup('<b>${f.name}</b><br>${f.crop} · ${f.area} acres<br>Growth: ${f.growthProgress}%', { closeButton: false })
        .bindTooltip('${shortName}', { permanent: true, direction: 'bottom', offset: [0, 10], className: 'field-label' });
    `;
  }).join('\n');

  // Build device markers JS
  const deviceMarkersJS = devices.filter((d) => d.coordinates).map((d) => {
    const lat = d.coordinates.lat;
    const lng = d.coordinates.lng;
    const typeInfo = MOCK_DEVICE_TYPES[d.type] || {};
    const isOnline = d.status === 'online';
    const ringColor = isOnline ? '#4CAF50' : '#F44336';
    const iconColor = typeInfo.color || '#607D8B';
    return `
      L.circleMarker([${lat}, ${lng}], {
        radius: 8,
        fillColor: '${iconColor}',
        color: '${ringColor}',
        weight: 3,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map)
        .bindPopup('<div style="min-width:140px"><b>${d.name}</b><br><span style="color:${ringColor}">${isOnline ? '● Online' : '● Offline'}</span><br>Battery: ${d.batteryLevel}%<br>Location: ${d.location}</div>', { closeButton: false });
    `;
  }).join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .field-label {
      background: rgba(0,0,0,0.7) !important;
      border: none !important;
      color: #fff !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      box-shadow: none !important;
    }
    .field-label::before { display: none !important; }
    .leaflet-popup-content-wrapper {
      border-radius: 12px !important;
      font-family: -apple-system, sans-serif !important;
      font-size: 13px !important;
    }
    .leaflet-popup-tip-container { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${centerLat}, ${centerLng}],
      zoom: ${zoom},
      zoomControl: ${interactive},
      dragging: ${interactive},
      touchZoom: ${interactive},
      scrollWheelZoom: ${interactive},
      doubleClickZoom: ${interactive},
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    });

    // Satellite tile layer (Esri World Imagery - free, no API key)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
    }).addTo(map);

    // Semi-transparent labels overlay
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      opacity: 0.6,
    }).addTo(map);

    // Field markers
    ${fieldMarkersJS}

    // Device markers
    ${deviceMarkersJS}

    // Fit bounds to show all markers with padding
    var allCoords = [
      ${fields.map((f) => f.location ? `[${f.location.lat}, ${f.location.lng}]` : '').filter(Boolean).join(',')}
      ${fields.length && devices.filter((d) => d.coordinates).length ? ',' : ''}
      ${devices.filter((d) => d.coordinates).map((d) => `[${d.coordinates.lat}, ${d.coordinates.lng}]`).join(',')}
    ];
    if (allCoords.length > 1) {
      map.fitBounds(allCoords, { padding: [40, 40] });
    }
  </script>
</body>
</html>
  `.trim();
}
