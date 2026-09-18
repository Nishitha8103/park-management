/**
 * Authentic GPS Map Camera Stamp Utility
 * 
 * Recreates the exact GPS Map Camera format:
 * - Left: Map Box with red pin & Google branding
 * - Right: Dark translucent badge with:
 *   - City, State, Country
 *   - Plus Code / Full Street Address
 *   - Lat xx.xxxxxx°
 *   - Long xx.xxxxxx°
 *   - DD/MM/YY HH:MM AM/PM
 * - Top Right: GPS Map Camera badge
 */

const geoCache = new Map();

/**
 * Forward geocode a place / city / park name into exact coordinates
 */
/**
 * Forward geocode a place / city / park name into exact coordinates with rich street details
 */
export const forwardGeocode = async (query) => {
  if (!query || !query.trim()) return null;
  const q = query.trim();

  // Live lookup via OpenStreetMap Nominatim with full address details
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'ParkMonitorApp/2.0' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const addr = item.address || {};
        const road = addr.road || addr.pedestrian || addr.street || '';
        const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.village || '';
        const city = addr.city || addr.town || addr.county || addr.state_district || '';
        const state = addr.state || '';
        const country = addr.country || '';
        const postcode = addr.postcode || '';

        const line1Parts = [locality || road, city, country].filter(Boolean);
        const line1 = line1Parts.join(', ');

        const line2Parts = [road, locality, city, state, postcode, country].filter(Boolean);
        const line2 = item.display_name || line2Parts.join(', ');

        return {
          latitude: lat,
          longitude: lon,
          cityStateCountry: line1 || item.display_name || `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
          fullAddress: line2 || item.display_name
        };
      }
    }
  } catch (err) {
    console.warn('Forward geocoding error:', err);
  }

  return null;
};

/**
 * Fetch true live geolocation directly from Browser GPS (no IP guessing)
 */
export const getLiveGeoLocation = async () => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  return new Promise((resolve, reject) => {
    // 1. Try high accuracy GPS (mobile GPS / Wi-Fi triangulation)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos && pos.coords) {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 5,
            source: 'Device GPS'
          });
        } else {
          reject(new Error('Invalid GPS coordinates received.'));
        }
      },
      (err1) => {
        console.warn('High accuracy GPS error:', err1?.message || err1);
        // 2. Retry with standard accuracy
        navigator.geolocation.getCurrentPosition(
          (pos2) => {
            if (pos2 && pos2.coords) {
              resolve({
                latitude: pos2.coords.latitude,
                longitude: pos2.coords.longitude,
                accuracy: pos2.coords.accuracy || 15,
                source: 'Browser Geolocation'
              });
            } else {
              reject(new Error('Location unavailable.'));
            }
          },
          (err2) => {
            console.error('Browser GPS failed:', err2);
            reject(err2);
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
};

/**
 * Reverse geocode latitude/longitude into human-readable city, state, detailed street address
 */
export const reverseGeocodeDetails = async (lat, lon) => {
  if (lat === null || lat === undefined || lon === null || lon === undefined) return null;
  const key = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
  if (geoCache.has(key)) return geoCache.get(key);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'ParkMonitorApp/2.0' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const road = addr.road || addr.pedestrian || addr.street || addr.residential || '';
      const locality = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || addr.hamlet || '';
      const city = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || '';
      const state = addr.state || '';
      const country = addr.country || '';
      const postcode = addr.postcode || '';

      const topArea = locality || road || city;
      const line1Parts = [topArea, city, country].filter(Boolean);
      const line1 = line1Parts.filter((item, idx) => line1Parts.indexOf(item) === idx).join(', ');

      const parts = [road, locality, city, state, postcode, country].filter(Boolean);
      const uniqueParts = parts.filter((item, index) => parts.indexOf(item) === index);
      const line2 = data.display_name || uniqueParts.join(', ');

      const result = {
        cityStateCountry: line1 || data.display_name || `Lat ${Number(lat).toFixed(4)}°, Lon ${Number(lon).toFixed(4)}°`,
        fullAddress: line2 || `Coordinates: ${lat}, ${lon}`,
        city,
        state,
        country
      };

      geoCache.set(key, result);
      return result;
    }
  } catch (err) {
    console.warn('Geocoding lookup error:', err);
  }

  return {
    cityStateCountry: `Lat ${Number(lat).toFixed(5)}°, Long ${Number(lon).toFixed(5)}°`,
    fullAddress: `Live GPS Location (${Number(lat).toFixed(6)}°, ${Number(lon).toFixed(6)}°)`,
    city: '',
    state: '',
    country: ''
  };
};

/**
 * Draws a mini map tile with pin and Google badge on a sub-canvas
 */
const drawMiniMap = (width, height, lat, lon) => {
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = width;
  mapCanvas.height = height;
  const ctx = mapCanvas.getContext('2d');

  // Background map color (standard Google Maps off-white/beige)
  ctx.fillStyle = '#e8ecef';
  ctx.fillRect(0, 0, width, height);

  // Draw simulated street roads
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, width * 0.05);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Road grid paths
  ctx.beginPath();
  ctx.moveTo(width * 0.2, 0);
  ctx.lineTo(width * 0.25, height * 0.4);
  ctx.lineTo(width * 0.6, height * 0.6);
  ctx.lineTo(width * 0.55, height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, height * 0.45);
  ctx.lineTo(width * 0.5, height * 0.4);
  ctx.lineTo(width, height * 0.3);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width * 0.5, height * 0.4);
  ctx.lineTo(width * 0.9, height * 0.85);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width * 0.1, height * 0.7);
  ctx.lineTo(width * 0.6, height * 0.6);
  ctx.stroke();

  // Draw Red Google Maps Pin at center
  const pinX = width * 0.5;
  const pinY = height * 0.46;
  const pinRadius = Math.max(8, width * 0.14);

  // Pin shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(pinX, pinY + pinRadius * 1.35, pinRadius * 0.6, pinRadius * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pin head circle
  ctx.fillStyle = '#ea4335'; // Google Red
  ctx.beginPath();
  ctx.arc(pinX, pinY, pinRadius, 0, Math.PI * 2);
  ctx.fill();

  // Pin point triangle
  ctx.beginPath();
  ctx.moveTo(pinX - pinRadius * 0.85, pinY + pinRadius * 0.35);
  ctx.lineTo(pinX + pinRadius * 0.85, pinY + pinRadius * 0.35);
  ctx.lineTo(pinX, pinY + pinRadius * 1.4);
  ctx.closePath();
  ctx.fill();

  // Pin inner dot
  ctx.fillStyle = '#7a140d';
  ctx.beginPath();
  ctx.arc(pinX, pinY, pinRadius * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Google logo branding in bottom left
  const brandH = Math.max(10, Math.floor(height * 0.14));
  ctx.font = `bold ${brandH}px Roboto, Arial, sans-serif`;
  ctx.fillStyle = '#4285F4'; // G
  ctx.fillText('G', 6, height - 6);
  const w1 = ctx.measureText('G').width;
  ctx.fillStyle = '#EA4335'; // o
  ctx.fillText('o', 6 + w1, height - 6);
  const w2 = w1 + ctx.measureText('o').width;
  ctx.fillStyle = '#FBBC05'; // o
  ctx.fillText('o', 6 + w2, height - 6);
  const w3 = w2 + ctx.measureText('o').width;
  ctx.fillStyle = '#4285F4'; // g
  ctx.fillText('g', 6 + w3, height - 6);
  const w4 = w3 + ctx.measureText('g').width;
  ctx.fillStyle = '#34A853'; // l
  ctx.fillText('l', 6 + w4, height - 6);
  const w5 = w4 + ctx.measureText('l').width;
  ctx.fillStyle = '#EA4335'; // e
  ctx.fillText('e', 6 + w5, height - 6);

  // Clean border around map
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, width, height);

  return mapCanvas;
};

/**
 * Main Stamp Engine
 */
export const stampImageWithGeoAndTimestamp = async (
  imageSource,
  options = {}
) => {
  const {
    location = null,
    fileName = `gps_map_${Date.now()}.jpg`
  } = options;

  // 1. Resolve GPS Coordinates synchronously or from provided options
  let geo = location;
  if (!geo || (geo.latitude === undefined && geo.longitude === undefined)) {
    try {
      geo = await getLiveGeoLocation();
    } catch (err) {
      console.warn('Live geolocation resolution fallback:', err);
      geo = { latitude: 0, longitude: 0 };
    }
  }

  const lat = geo?.latitude ?? 0;
  const lon = geo?.longitude ?? 0;

  // 2. Resolve Geocoding Address Details
  // If placeName or fullAddress is already provided, use it directly without making network requests
  let addrDetails;
  if (geo && (geo.placeName || geo.fullAddress)) {
    addrDetails = {
      cityStateCountry: geo.placeName || geo.fullAddress || 'Live Verified Location',
      fullAddress: geo.fullAddress || geo.placeName || 'Live Verified Location'
    };
  } else if (lat !== 0 || lon !== 0) {
    try {
      addrDetails = await reverseGeocodeDetails(lat, lon);
    } catch (e) {
      addrDetails = {
        cityStateCountry: `Lat ${Number(lat).toFixed(5)}°, Lon ${Number(lon).toFixed(5)}°`,
        fullAddress: `GPS: ${lat}, ${lon}`
      };
    }
  } else {
    addrDetails = {
      cityStateCountry: 'GPS Location Unavailable',
      fullAddress: 'Please enable GPS permissions in browser'
    };
  }

  // 3. Render Canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isFile = imageSource instanceof Blob || imageSource instanceof File;
    const objectUrl = isFile ? URL.createObjectURL(imageSource) : imageSource;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.naturalWidth || img.width || 1280;
        canvas.height = img.naturalHeight || img.height || 720;

        // Draw original photo
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Date & Time formatting: DD/MM/YY hh:mm AM/PM
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const timeStr = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        const dateLine = `${dd}/${mm}/${yy} ${timeStr}`;

        // Dimension calculations
        const margin = Math.max(16, Math.floor(canvas.width * 0.025));
        const mapSize = Math.max(100, Math.floor(canvas.width * 0.17));
        const fontSize = Math.max(13, Math.floor(canvas.width * 0.020));
        const lineHeight = fontSize * 1.32;

        // Text lines
        const line1 = (geo && geo.placeName) || addrDetails.cityStateCountry;
        const line2 = (geo && geo.fullAddress) || addrDetails.fullAddress;
        const line3 = `Lat ${Number(lat).toFixed(6)}°`;
        const line4 = `Long ${Number(lon).toFixed(6)}°`;
        const line5 = dateLine;

        // Overlay dimensions & dynamic height
        const textPadding = Math.max(12, Math.floor(canvas.width * 0.016));
        const textBlockWidth = Math.max(340, Math.floor(canvas.width * 0.62));
        
        // Helper to wrap text into lines
        const wrapText = (text, maxWidth, font) => {
          ctx.font = font;
          const words = text.split(', ');
          const lines = [];
          let currentLine = words[0] || '';

          for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ', ' + word).width;
            if (width < maxWidth) {
              currentLine += ', ' + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) lines.push(currentLine);
          return lines;
        };

        const maxTextW = textBlockWidth - textPadding * 2;
        const fontLine2 = `500 ${Math.floor(fontSize * 0.88)}px Roboto, Arial, sans-serif`;
        const addressLines = wrapText(line2, maxTextW, fontLine2);

        const totalTextLines = 1 + addressLines.length + 3; // line1 + wrapped address + lat + long + date
        const calculatedBoxH = Math.max(mapSize, textPadding * 2 + totalTextLines * lineHeight);
        const boxHeight = calculatedBoxH;
        const startY = canvas.height - margin - boxHeight;

        // 1. Draw Mini Map Tile (Left)
        const mapX = margin;
        const mapTile = drawMiniMap(mapSize, boxHeight, lat, lon);
        ctx.drawImage(mapTile, mapX, startY);

        // 2. Draw Dark Translucent Details Box (Right of Map)
        const textX = mapX + mapSize + 8;
        const textWidth = textBlockWidth;

        ctx.fillStyle = 'rgba(28, 25, 23, 0.88)'; // Dark slate/charcoal
        ctx.fillRect(textX, startY, textWidth, boxHeight);

        // Text Rendering
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        let curY = startY + textPadding;
        const textContentX = textX + textPadding;

        // Line 1: Area, City, Country (Bold white)
        ctx.font = `bold ${Math.floor(fontSize * 1.05)}px Roboto, Arial, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(line1, textContentX, curY, maxTextW);
        curY += lineHeight * 1.05;

        // Line 2: Full Detailed Multi-line Street Address (Light gray/white)
        ctx.font = fontLine2;
        ctx.fillStyle = '#f1f5f9';
        for (const addrLine of addressLines) {
          ctx.fillText(addrLine, textContentX, curY, maxTextW);
          curY += lineHeight * 0.95;
        }

        // Line 3: Lat xx.xxxxxx°
        ctx.font = `500 ${fontSize}px Roboto, Arial, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(line3, textContentX, curY, maxTextW);
        curY += lineHeight * 0.92;

        // Line 4: Long xx.xxxxxx°
        ctx.fillText(line4, textContentX, curY, maxTextW);
        curY += lineHeight * 0.92;

        // Line 5: DD/MM/YY HH:MM AM/PM
        ctx.fillText(line5, textContentX, curY, maxTextW);

        // 3. Top Right "GPS Map Camera" Badge
        const badgeW = Math.max(120, Math.floor(canvas.width * 0.18));
        const badgeH = Math.max(30, Math.floor(canvas.width * 0.04));
        const badgeX = canvas.width - margin - badgeW;
        const badgeY = margin;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

        ctx.font = `bold ${Math.max(10, Math.floor(badgeH * 0.42))}px Roboto, Arial, sans-serif`;
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('📷 GPS Map Camera', badgeX + 8, badgeY + badgeH * 0.28);

        // Export to Stamped JPEG File
        canvas.toBlob(
          (blob) => {
            if (isFile) URL.revokeObjectURL(objectUrl);
            if (!blob) {
              return reject(new Error('Canvas toBlob failed'));
            }
            const stampedFile = new File([blob], fileName, { type: 'image/jpeg' });
            resolve({
              file: stampedFile,
              preview: URL.createObjectURL(stampedFile),
              location: { latitude: lat, longitude: lon, placeName: line1, fullAddress: line2 },
              timestamp: now.toISOString()
            });
          },
          'image/jpeg',
          0.93
        );
      } catch (err) {
        if (isFile) URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = (err) => {
      if (isFile) URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
};

export const reverseGeocode = async (lat, lon) => {
  const d = await reverseGeocodeDetails(lat, lon);
  return d ? d.cityStateCountry : null;
};
