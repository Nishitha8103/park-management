/**
 * Compress and convert mobile phone images (including high-res camera photos, HEIC, PNG, JPEG)
 * into a lightweight, standard web-compatible JPEG File and preview URL.
 * 
 * @param {File} file - Original file from <input type="file">
 * @param {number} maxDimension - Max width or height (default 1280)
 * @param {number} quality - JPEG compression quality 0.0 - 1.0 (default 0.85)
 * @returns {Promise<{ file: File, previewUrl: string, isPdf: boolean }>}
 */
export const processMobileImage = (file, maxDimension = 1280, quality = 0.85) => {
  return new Promise((resolve) => {
    if (!file) {
      return resolve({ file: null, previewUrl: '', isPdf: false });
    }

    // If it's a PDF document, return as is without image compression
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
    if (isPdf) {
      let previewUrl = '';
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (e) {
        console.warn('Could not create object URL for PDF:', e);
      }
      return resolve({ file, previewUrl, isPdf: true });
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const baseName = (file.name || 'photo').replace(/\.[^/.]+$/, '');
                const convertedFile = new File([blob], `${baseName}.jpg`, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                const previewUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve({ file: convertedFile, previewUrl, isPdf: false });
              } else {
                // Fallback to original
                resolve({ file, previewUrl: readerEvent.target.result, isPdf: false });
              }
            },
            'image/jpeg',
            quality
          );
        } catch (canvasErr) {
          console.warn('Canvas image processing fallback:', canvasErr);
          resolve({ file, previewUrl: readerEvent.target.result, isPdf: false });
        }
      };

      img.onerror = () => {
        // Fallback to object URL if image loader fails
        try {
          const previewUrl = URL.createObjectURL(file);
          resolve({ file, previewUrl, isPdf: false });
        } catch (e) {
          resolve({ file, previewUrl: '', isPdf: false });
        }
      };

      img.src = readerEvent.target.result;
    };

    reader.onerror = () => {
      try {
        const previewUrl = URL.createObjectURL(file);
        resolve({ file, previewUrl, isPdf: false });
      } catch (e) {
        resolve({ file, previewUrl: '', isPdf: false });
      }
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Resolve media URL consistently for local development, network IP (phone testing), and production
 */
export const resolveMediaUrl = (path, defaultFolder = 'complaints') => {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  let clean = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (!clean.startsWith('/uploads/')) {
    if (clean.startsWith('/complaints/')) {
      clean = '/uploads' + clean;
    } else if (clean.startsWith('/parks/')) {
      clean = '/uploads' + clean;
    } else if (clean.startsWith('/kyc/')) {
      clean = '/uploads' + clean;
    } else if (defaultFolder) {
      clean = `/uploads/${defaultFolder}${clean}`;
    } else {
      clean = `/uploads${clean}`;
    }
  }
  return clean;
};
