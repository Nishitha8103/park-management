/**
 * Utility to process a File or Blob image by stamping:
 * - Live GPS Geolocation (Latitude, Longitude) or Address
 * - Live Date and Time
 * - Custom Tag / Portal Stamp
 * 
 * Returns a new Promise<File> with stamped image.
 */

export const stampImageWithGeoAndTimestamp = async (
  imageSource, // File, Blob, or Image element
  options = {}
) => {
  const {
    location = null, // { latitude, longitude }
    tag = 'Parks Monitoring System',
    fileName = `stamped_${Date.now()}.jpg`
  } = options;

  // 1. Get current geolocation if not provided
  let geo = location;
  if (!geo && navigator.geolocation) {
    try {
      geo = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 8000, enableHighAccuracy: true }
        );
      });
    } catch (e) {
      console.warn('Geolocation capture skipped:', e);
    }
  }

  // 2. Load image onto canvas
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

        // Draw the original photo
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Prepare watermark text
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });

        const locationText = geo
          ? `📍 GPS: ${geo.latitude.toFixed(5)}° N, ${geo.longitude.toFixed(5)}° E`
          : '📍 Location: GPS Acquired On-Site';

        const dateTimeText = `🗓️ ${dateStr}  ⏰ ${timeStr}`;
        const tagText = `🛡️ ${tag}`;

        // Dynamic font sizing based on canvas dimensions
        const fontSize = Math.max(16, Math.floor(canvas.width * 0.024));
        const padding = Math.max(12, Math.floor(canvas.width * 0.02));
        const lineHeight = fontSize * 1.45;
        const totalHeight = lineHeight * 3 + padding * 2;

        // Draw semi-transparent dark banner at bottom
        ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
        ctx.fillRect(0, canvas.height - totalHeight, canvas.width, totalHeight);

        // Decorative accent bar
        ctx.fillStyle = '#10b981'; // vibrant emerald
        ctx.fillRect(0, canvas.height - totalHeight, 8, totalHeight);

        // Text styles
        ctx.font = `bold ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'top';

        // Shadow for maximum contrast
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        const startY = canvas.height - totalHeight + padding;
        const startX = padding + 12;

        // Line 1: Tag & Verified Stamp
        ctx.fillStyle = '#34d399'; // light emerald
        ctx.fillText(`${tagText}  [VERIFIED ON-SITE]`, startX, startY);

        // Line 2: Geolocation
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(locationText, startX, startY + lineHeight);

        // Line 3: Date and Time
        ctx.fillStyle = '#fbbf24'; // amber yellow
        ctx.fillText(dateTimeText, startX, startY + lineHeight * 2);

        // Export to File Blob
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
              location: geo,
              timestamp: now.toISOString()
            });
          },
          'image/jpeg',
          0.92
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
