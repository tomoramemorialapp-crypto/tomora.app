import { describe, expect, it } from 'vitest';
import { computeCropLayout, cropRectInSourcePixels } from '../cropLayout';

describe('cropImage layout', () => {
  it('covers the viewport at zoom 1', () => {
    const layout = computeCropLayout({
      imageWidth: 800,
      imageHeight: 600,
      viewportSize: 280,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
    expect(layout.drawWidth).toBeGreaterThanOrEqual(280);
    expect(layout.drawHeight).toBeGreaterThanOrEqual(280);
  });

  it('maps viewport to a valid source crop rect', () => {
    const layout = computeCropLayout({
      imageWidth: 1200,
      imageHeight: 1600,
      viewportSize: 280,
      zoom: 1.2,
      offsetX: 12,
      offsetY: -8,
    });
    const rect = cropRectInSourcePixels(layout);
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.originX).toBeGreaterThanOrEqual(0);
    expect(rect.originY).toBeGreaterThanOrEqual(0);
    expect(rect.originX + rect.width).toBeLessThanOrEqual(layout.imageWidth);
    expect(rect.originY + rect.height).toBeLessThanOrEqual(layout.imageHeight);
  });
});
