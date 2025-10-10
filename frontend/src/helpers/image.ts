/** Client-side image processing utilities: strip metadata and compress to WebP. */

export type ProcessedImage = {
  blob: Blob; // WebP blob
  width: number;
  height: number;
};

const MAX_EDGE = 1280; // downscale very large images to save space
const QUALITY = 0.5; // WebP quality (0-1)

/**
 * Load a File into an HTMLImageElement via a blob URL.
 */
async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = url;
    });
    const img = new Image();
    img.src = url;
    return img;
  } finally {
    // Note: do not revoke here; canvas draw needs it; revoke later
  }
}

/**
 * Draw the image onto a canvas to remove EXIF/GPS and re-encode as WebP.
 */
export async function processImageToWebP(file: File): Promise<ProcessedImage> {
  const img = await loadImage(file);
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;

  // Compute scale to fit within MAX_EDGE
  const scale = Math.min(1, MAX_EDGE / Math.max(naturalW, naturalH));
  const outW = Math.max(1, Math.round(naturalW * scale));
  const outH = Math.max(1, Math.round(naturalH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get 2D context");

  ctx.drawImage(img, 0, 0, outW, outH);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("WebP encode failed"))),
      "image/webp",
      QUALITY
    );
  });

  // Revoke the object URL created earlier
  try {
    URL.revokeObjectURL(img.src);
  } catch {}

  return { blob, width: outW, height: outH };
}


