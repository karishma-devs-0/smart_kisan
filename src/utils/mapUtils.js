/**
 * Projects an array of items with { lat, lng } into pixel { x, y }
 * positions within a given view size.
 *
 * @param {Array} items - Objects with .lat and .lng (or .location.lat / .location.lng)
 * @param {number} viewWidth - Available width in pixels
 * @param {number} viewHeight - Available height in pixels
 * @param {number} padding - Inner padding in pixels
 * @returns {Array} Same items with added .x and .y properties
 */
export function projectCoordinates(items, viewWidth, viewHeight, padding = 24) {
  if (!items.length) return [];

  // Extract lat/lng from items (support both flat and nested formats)
  const coords = items.map((item) => {
    const lat = item.lat ?? item.coordinates?.lat ?? item.location?.lat;
    const lng = item.lng ?? item.coordinates?.lng ?? item.location?.lng;
    return { lat, lng };
  });

  // Find bounding box
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  coords.forEach(({ lat, lng }) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  const drawWidth = viewWidth - padding * 2;
  const drawHeight = viewHeight - padding * 2;

  return items.map((item, i) => {
    const { lat, lng } = coords[i];

    // Normalize to 0..1
    const normLng = (lng - minLng) / lngRange;
    const normLat = (lat - minLat) / latRange;

    return {
      ...item,
      x: padding + normLng * drawWidth,
      // Flip Y: higher latitude → top of screen (lower y)
      y: padding + (1 - normLat) * drawHeight,
    };
  });
}
