import * as ImageManipulator from 'expo-image-manipulator';
import { Image as RNImage, Platform } from 'react-native';

import { computeCropLayout, cropRectInSourcePixels } from './cropLayout';

export type { CropLayout } from './cropLayout';
export { CROP_ZOOM_MAX, CROP_ZOOM_MIN, clampZoom, computeCropLayout, cropRectInSourcePixels } from './cropLayout';

export interface CropResult {
  uri: string;
  blob?: Blob;
  width: number;
  height: number;
}

export function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
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
    imageWidth: number;
    imageHeight: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
  },
): Promise<CropResult | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;

  const layout = computeCropLayout({
    imageWidth: opts.imageWidth,
    imageHeight: opts.imageHeight,
    viewportSize: opts.viewportSize,
    zoom: opts.zoom,
    offsetX: opts.offsetX,
    offsetY: opts.offsetY,
  });

  const img = await loadHtmlImage(imageUri);
  const { viewportSize, outputSize } = opts;
  const { originX, originY, drawWidth, drawHeight } = layout;

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const ratio = outputSize / viewportSize;
  ctx.save();
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(
    img,
    0,
    0,
    img.width,
    img.height,
    originX * ratio,
    originY * ratio,
    drawWidth * ratio,
    drawHeight * ratio,
  );
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

/** Native crop via expo-image-manipulator (square viewport). */
export async function cropImageNative(
  imageUri: string,
  opts: {
    viewportSize: number;
    imageWidth: number;
    imageHeight: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
  },
): Promise<CropResult | null> {
  if (Platform.OS === 'web') return null;
  try {
    const layout = computeCropLayout({
      imageWidth: opts.imageWidth,
      imageHeight: opts.imageHeight,
      viewportSize: opts.viewportSize,
      zoom: opts.zoom,
      offsetX: opts.offsetX,
      offsetY: opts.offsetY,
    });
    const rect = cropRectInSourcePixels(layout);
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ crop: rect }],
      { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
    );
    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  } catch {
    return null;
  }
}

export async function exportCroppedProfilePhoto(
  imageUri: string,
  opts: {
    viewportSize: number;
    outputSize: number;
    imageWidth: number;
    imageHeight: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
  },
): Promise<CropResult | null> {
  if (Platform.OS === 'web') {
    return cropImageToSquare(imageUri, opts);
  }
  return cropImageNative(imageUri, opts);
}

function loadHtmlImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = uri;
  });
}
