import { Platform } from 'react-native';

export interface CropResult {
  uri: string;
  blob?: Blob;
  width: number;
  height: number;
}

/**
 * Export a square crop from an image URI (web canvas). The crop is centered on
 * the given offset/scale within a square viewport.
 */
export async function cropImageToSquare(
  imageUri: string,
  opts: {
    viewportSize: number;
    outputSize: number;
    scale: number;
    offsetX: number;
    offsetY: number;
  },
): Promise<CropResult | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;

  const img = await loadImage(imageUri);
  const { viewportSize, outputSize, scale, offsetX, offsetY } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const x = (viewportSize - drawW) / 2 + offsetX;
  const y = (viewportSize - drawH) / 2 + offsetY;

  const ratio = outputSize / viewportSize;
  ctx.save();
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x * ratio, y * ratio, drawW * ratio, drawH * ratio);
  ctx.restore();

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve({
          uri: URL.createObjectURL(blob),
          blob,
          width: outputSize,
          height: outputSize,
        });
      },
      'image/jpeg',
      0.92,
    );
  });
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = uri;
  });
}
