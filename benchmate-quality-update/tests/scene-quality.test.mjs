import test from 'node:test';
import assert from 'node:assert/strict';
import { scenePixelRatio, qualityProfiles } from '../app/scene-quality.mjs';

test('balanced preserves native 1080p and 1440p detail', () => {
  assert.equal(scenePixelRatio(1920,1080,1),1);
  assert.equal(scenePixelRatio(2560,1440,1),1);
  assert.equal(scenePixelRatio(1280,720,2),1.5);
});
test('all modes bound pixel count and hardware dimensions across screens', () => {
  for (const [mode, profile] of Object.entries(qualityProfiles)) {
    for (const [w,h] of [[390,844],[1920,1080],[2560,1440],[3840,2160],[10000,100]]) {
      for (const dpr of [1,1.25,2,3]) {
        const ratio=scenePixelRatio(w,h,dpr,mode,4096);
        assert.ok(w*h*ratio*ratio <= profile.pixels+0.001);
        assert.ok(w*ratio <= 4096 && h*ratio <= 4096);
        assert.ok(ratio <= dpr && ratio <= profile.dpr);
      }
    }
  }
});
test('high supports native 4K and economy retains the previous pixel budget', () => {
  assert.equal(scenePixelRatio(3840,2160,1,'high'),1);
  const ratio=scenePixelRatio(1920,1080,2,'economy');
  assert.ok(Math.abs(1920*1080*ratio*ratio-900000)<0.001);
  assert.ok(Number.isFinite(scenePixelRatio(0,NaN,Infinity,'unknown')));
});
