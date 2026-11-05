// Validates, resizes, and compresses uploaded images for fast website performance

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_RAW_SIZE_BYTES = 20 * 1024 * 1024; // 20MB raw input limit

export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'Nijedan fajl nije izabran.' };
  }
  const type = (file.type || '').toLowerCase();
  if (!ALLOWED_TYPES.includes(type)) {
    return {
      valid: false,
      error: `Nepodržan format fajla "${file.name}". Dozvoljeni formati: JPG, PNG, WebP, GIF, AVIF.`,
    };
  }
  if (file.size > MAX_RAW_SIZE_BYTES) {
    return {
      valid: false,
      error: `Fajl "${file.name}" prelazi maksimalnu veličinu od 20MB.`,
    };
  }
  return { valid: true };
}

export function optimizeImageFile(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.84 } = {}) {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return reject(new Error(validation.error));
    }

    // Preserve animated GIFs directly
    if (file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          dataUrl: reader.result,
          filename: file.name,
          width: null,
          height: null,
          originalSize: file.size,
        });
      reader.onerror = () => reject(new Error('Greška pri čitanju GIF fajla.'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Output optimized WebP (or fallback to JPEG)
        let outputMime = 'image/webp';
        let dataUrl = canvas.toDataURL(outputMime, quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          outputMime = 'image/jpeg';
          dataUrl = canvas.toDataURL(outputMime, quality);
        }

        const baseName = file.name.replace(/\.[^.]+$/, '');
        const ext = outputMime === 'image/webp' ? '.webp' : '.jpg';

        resolve({
          dataUrl,
          filename: `${baseName}${ext}`,
          width,
          height,
          originalSize: file.size,
        });
      };
      img.onerror = () => reject(new Error('Neispravan ili oštećen fajl slike.'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Greška pri čitanju fajla.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Crops an image source using relative percentage coordinates (0-100)
 */
export function cropImageToDataUrl(imageSrc, cropRect, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const natW = img.naturalWidth || img.width;
      const natH = img.naturalHeight || img.height;

      const sx = Math.round((cropRect.x / 100) * natW);
      const sy = Math.round((cropRect.y / 100) * natH);
      const sw = Math.max(20, Math.round((cropRect.width / 100) * natW));
      const sh = Math.max(20, Math.round((cropRect.height / 100) * natH));

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve({ dataUrl, width: sw, height: sh });
    };
    img.onerror = () =>
      reject(new Error('Nije moguće iseći ovu sliku zbog sigurnosnih ograničenja izvora (CORS) ili neispravne putanje.'));
    img.src = imageSrc;
  });
}
