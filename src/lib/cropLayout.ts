export interface CropLayout {
  imageWidth: number;
  imageHeight: number;
  viewportSize: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  coverScale: number;
  displayScale: number;
  drawWidth: number;
  drawHeight: number;
  originX: number;
  originY: number;
}

export const CROP_ZOOM_MIN = 1;
export const CROP_ZOOM_MAX = 3;

export function clampZoom(zoom: number): number {
  return Math.max(CROP_ZOOM_MIN, Math.min(CROP_ZOOM_MAX, zoom));
}

/** Layout math shared by the crop preview and export pipelines. */
export function computeCropLayout(params: {
  imageWidth: number;
  imageHeight: number;
  viewportSize: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
}): CropLayout {
  const { imageWidth, imageHeight, viewportSize, zoom, offsetX, offsetY } = params;
  const coverScale = Math.max(viewportSize / imageWidth, viewportSize / imageHeight);
  const displayScale = coverScale * clampZoom(zoom);
  const drawWidth = imageWidth * displayScale;
  const drawHeight = imageHeight * displayScale;
  const originX = (viewportSize - drawWidth) / 2 + offsetX;
  const originY = (viewportSize - drawHeight) / 2 + offsetY;
  return {
    imageWidth,
    imageHeight,
    viewportSize,
    zoom: clampZoom(zoom),
    offsetX,
    offsetY,
    coverScale,
    displayScale,
    drawWidth,
    drawHeight,
    originX,
    originY,
  };
}

/** Square source region (image pixels) that fills the viewport crop window. */
export function cropRectInSourcePixels(layout: CropLayout): {
  originX: number;
  originY: number;
  width: number;
  height: number;
} {
  const { displayScale, originX, originY, viewportSize, imageWidth, imageHeight } = layout;
  let x = Math.round((0 - originX) / displayScale);
  let y = Math.round((0 - originY) / displayScale);
  let size = Math.round(viewportSize / displayScale);
  size = Math.max(1, Math.min(size, imageWidth, imageHeight));
  x = Math.max(0, Math.min(x, imageWidth - size));
  y = Math.max(0, Math.min(y, imageHeight - size));
  return { originX: x, originY: y, width: size, height: size };
}
