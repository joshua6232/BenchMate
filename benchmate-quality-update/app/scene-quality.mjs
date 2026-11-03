// Bound rendering cost independently of CSS size; retain an economy escape hatch.
export const qualityProfiles = Object.freeze({
  economy: { pixels: 900000, dpr: 1 },
  balanced: { pixels: 3686400, dpr: 1.5 },
  high: { pixels: 8294400, dpr: 2 },
});

export function scenePixelRatio(width, height, deviceRatio = 1, quality = 'balanced', maxDimension = 8192) {
  const profile = qualityProfiles[quality] ?? qualityProfiles.balanced;
  const positive = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;
  width = positive(width, 1); height = positive(height, 1);
  const limit = positive(maxDimension, 8192);
  return Math.min(positive(deviceRatio, 1), profile.dpr,
    Math.sqrt(profile.pixels / (width * height)), limit / width, limit / height);
}
