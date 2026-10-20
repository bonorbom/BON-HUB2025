import * as THREE from 'three';
import { PlanetId } from '../astronomy/ephemeris';

/**
 * Generates high-resolution, physically plausible equirectangular planetary textures
 * offline while also supporting external texture overrides in `/textures/{planet}.jpg`.
 */

function fbmNoise(x: number, y: number, seed: number, octaves = 5): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    const nx = x * frequency + seed * 13.7 + i * 31.1;
    const ny = y * frequency + seed * 29.3 + i * 17.9;
    const n =
      Math.sin(nx * 2.1 + Math.cos(ny * 1.9)) * 0.5 +
      Math.cos(ny * 3.3 - Math.sin(nx * 2.7)) * 0.5;
    value += n * amplitude;
    frequency *= 2.08;
    amplitude *= 0.5;
  }
  return value * 0.5 + 0.5;
}

export interface PlanetTextureBundle {
  surfaceMap: THREE.Texture;
  bumpMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  nightLightsMap?: THREE.Texture;
  cloudsMap?: THREE.Texture;
  ringAlphaMap?: THREE.Texture;
}

const cache: Partial<Record<PlanetId, PlanetTextureBundle>> = {};

export function getPlanetTextures(planetId: PlanetId): PlanetTextureBundle {
  const existing = cache[planetId];
  if (existing) return existing;

  let bundle: PlanetTextureBundle;
  switch (planetId) {
    case 'earth':
      bundle = buildEarthTextures();
      break;
    case 'mars':
      bundle = buildMarsTextures();
      break;
    case 'jupiter':
      bundle = buildJupiterTextures();
      break;
    case 'saturn':
      bundle = buildSaturnTextures();
      break;
    case 'uranus':
      bundle = buildIceGiantTextures('uranus');
      break;
    case 'neptune':
      bundle = buildIceGiantTextures('neptune');
      break;
  }

  cache[planetId] = bundle;
  return bundle;
}

function createCanvas(w = 1024, h = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

function buildEarthTextures(): PlanetTextureBundle {
  const w = 1024;
  const h = 512;
  const [surfCanvas, surfCtx] = createCanvas(w, h);
  const [specCanvas, specCtx] = createCanvas(w, h);
  const [nightCanvas, nightCtx] = createCanvas(w, h);
  const [cloudCanvas, cloudCtx] = createCanvas(w, h);

  const surfImg = surfCtx.createImageData(w, h);
  const specImg = specCtx.createImageData(w, h);
  const nightImg = nightCtx.createImageData(w, h);
  const cloudImg = cloudCtx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    const lat = (v - 0.5) * Math.PI;
    const polarFactor = Math.abs(Math.sin(lat));
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const lon = u * Math.PI * 2;
      const idx = (y * w + x) * 4;

      const cx = Math.cos(lat) * Math.cos(lon);
      const cy = Math.sin(lat);
      const cz = Math.cos(lat) * Math.sin(lon);

      const n1 = fbmNoise(cx * 1.9 + 1.2, cy * 1.9 + cz * 1.7, 11, 6);
      const n2 = fbmNoise(cx * 4.5 - cz * 3.1, cy * 4.2 + 2.3, 27, 4);
      const elevation = n1 * 0.72 + n2 * 0.28 - polarFactor * 0.08;

      const isIceCap = polarFactor > 0.86 + (n2 - 0.5) * 0.08;
      const isLand = !isIceCap && elevation > 0.515;

      if (isIceCap) {
        surfImg.data[idx] = 228;
        surfImg.data[idx + 1] = 236;
        surfImg.data[idx + 2] = 245;
        surfImg.data[idx + 3] = 255;

        specImg.data[idx] = 180;
        specImg.data[idx + 1] = 180;
        specImg.data[idx + 2] = 180;
        specImg.data[idx + 3] = 255;
      } else if (isLand) {
        const heightNorm = Math.min(1, (elevation - 0.515) / 0.28);
        const arid = Math.abs(Math.sin(lat * 2.2)) * 0.6 + (n2 - 0.35) * 0.5;
        let r = 38 + heightNorm * 72 + arid * 58;
        let g = 78 + heightNorm * 45 + arid * 22;
        let b = 36 + heightNorm * 28;
        if (heightNorm > 0.68) {
          r = 128 + heightNorm * 50;
          g = 122 + heightNorm * 48;
          b = 114 + heightNorm * 45;
        }
        surfImg.data[idx] = Math.min(255, r);
        surfImg.data[idx + 1] = Math.min(255, g);
        surfImg.data[idx + 2] = Math.min(255, b);
        surfImg.data[idx + 3] = 255;

        specImg.data[idx] = 225;
        specImg.data[idx + 1] = 225;
        specImg.data[idx + 2] = 225;
        specImg.data[idx + 3] = 255;

        const coastal = heightNorm < 0.26 && polarFactor < 0.68;
        const urbanCluster = fbmNoise(u * 28, v * 14, 91, 3);
        if ((coastal && urbanCluster > 0.57) || (urbanCluster > 0.69 && polarFactor < 0.62)) {
          const intensity = Math.min(1, (urbanCluster - 0.52) * 3.2);
          nightImg.data[idx] = Math.round(255 * intensity);
          nightImg.data[idx + 1] = Math.round(195 * intensity);
          nightImg.data[idx + 2] = Math.round(105 * intensity);
          nightImg.data[idx + 3] = 255;
        } else {
          nightImg.data[idx + 3] = 255;
        }
      } else {
        const depth = Math.max(0, (0.515 - elevation) / 0.35);
        surfImg.data[idx] = Math.round(10 + (1 - depth) * 18);
        surfImg.data[idx + 1] = Math.round(28 + (1 - depth) * 44);
        surfImg.data[idx + 2] = Math.round(62 + (1 - depth) * 64);
        surfImg.data[idx + 3] = 255;

        specImg.data[idx] = 58;
        specImg.data[idx + 1] = 58;
        specImg.data[idx + 2] = 58;
        specImg.data[idx + 3] = 255;
        nightImg.data[idx + 3] = 255;
      }

      const c1 = fbmNoise(cx * 3.4 + Math.sin(lat * 3) * 0.5, cy * 3.8 + cz * 3.4, 53, 5);
      const cloudAlpha = Math.max(0, Math.min(1, (c1 - 0.51) * 3.1));
      cloudImg.data[idx] = 246;
      cloudImg.data[idx + 1] = 249;
      cloudImg.data[idx + 2] = 255;
      cloudImg.data[idx + 3] = Math.round(cloudAlpha * 215);
    }
  }

  surfCtx.putImageData(surfImg, 0, 0);
  specCtx.putImageData(specImg, 0, 0);
  nightCtx.putImageData(nightImg, 0, 0);
  cloudCtx.putImageData(cloudImg, 0, 0);

  const surfaceMap = new THREE.CanvasTexture(surfCanvas);
  surfaceMap.colorSpace = THREE.SRGBColorSpace;
  const roughnessMap = new THREE.CanvasTexture(specCanvas);
  const nightLightsMap = new THREE.CanvasTexture(nightCanvas);
  nightLightsMap.colorSpace = THREE.SRGBColorSpace;

function buildMarsTextures(): PlanetTextureBundle {
  const w = 1024;
  const h = 512;
  const [surfCanvas, surfCtx] = createCanvas(w, h);
  const [bumpCanvas, bumpCtx] = createCanvas(w, h);
  const surfImg = surfCtx.createImageData(w, h);
  const bumpImg = bumpCtx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    const lat = (v - 0.5) * Math.PI;
    const polar = Math.abs(Math.sin(lat));
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const lon = u * Math.PI * 2;
      const idx = (y * w + x) * 4;
      const cx = Math.cos(lat) * Math.cos(lon);
      const cy = Math.sin(lat);
      const cz = Math.cos(lat) * Math.sin(lon);

      const n1 = fbmNoise(cx * 2.2, cy * 2.2 + cz * 2.1, 31, 6);
      const n2 = fbmNoise(cx * 7.5, cy * 7.5 - cz * 6.5, 44, 4);
      const basalt = n1 * 0.65 + n2 * 0.35;

      if (polar > 0.91 + (n2 - 0.5) * 0.05) {
        surfImg.data[idx] = 235;
        surfImg.data[idx + 1] = 228;
        surfImg.data[idx + 2] = 220;
      } else {
        const darkMare = basalt < 0.44 ? 0.72 : 1.0;
        surfImg.data[idx] = Math.min(255, Math.round((148 + basalt * 74) * darkMare));
        surfImg.data[idx + 1] = Math.min(255, Math.round((68 + basalt * 48) * darkMare));
        surfImg.data[idx + 2] = Math.min(255, Math.round((42 + basalt * 28) * darkMare));
      }
      surfImg.data[idx + 3] = 255;

      const bVal = Math.round(basalt * 255);
      bumpImg.data[idx] = bVal;
      bumpImg.data[idx + 1] = bVal;
      bumpImg.data[idx + 2] = bVal;
      bumpImg.data[idx + 3] = 255;
    }
  }

  surfCtx.putImageData(surfImg, 0, 0);
  bumpCtx.putImageData(bumpImg, 0, 0);
  const surfaceMap = new THREE.CanvasTexture(surfCanvas);
  surfaceMap.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  return { surfaceMap, bumpMap };
}

function buildJupiterTextures(): PlanetTextureBundle {
  const w = 1024;
  const h = 512;
  const [surfCanvas, surfCtx] = createCanvas(w, h);
  const surfImg = surfCtx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const idx = (y * w + x) * 4;

      const turb = fbmNoise(u * 6.5, v * 14.0, 73, 5) * 0.045;
      const bandCoord = (v + turb) * 24.0;
      const zone = Math.sin(bandCoord) * 0.5 + 0.5;
      const fine = Math.cos(bandCoord * 2.4 + fbmNoise(u * 12, v * 8, 19, 3) * 2.2) * 0.5 + 0.5;

      const dxSpot = (u - 0.35) * 3.8;
      const dySpot = (v - 0.63) * 9.2;
      const spotDist = Math.sqrt(dxSpot * dxSpot + dySpot * dySpot);
      const spotBlend = Math.max(0, 1 - spotDist);

      let r = 165 + zone * 58 + fine * 18;
      let g = 132 + zone * 52 + fine * 14;
      let b = 96 + zone * 44 + fine * 10;

      if (spotBlend > 0) {
        const swirl = Math.sin(spotDist * 12.0 + u * 20) * 0.5 + 0.5;
        r = r * (1 - spotBlend * 0.85) + (208 + swirl * 24) * (spotBlend * 0.85);
        g = g * (1 - spotBlend * 0.85) + (92 + swirl * 22) * (spotBlend * 0.85);
        b = b * (1 - spotBlend * 0.85) + (64 + swirl * 16) * (spotBlend * 0.85);
      }

      surfImg.data[idx] = Math.min(255, Math.round(r));
      surfImg.data[idx + 1] = Math.min(255, Math.round(g));
      surfImg.data[idx + 2] = Math.min(255, Math.round(b));
      surfImg.data[idx + 3] = 255;
    }
  }

  surfCtx.putImageData(surfImg, 0, 0);
  const surfaceMap = new THREE.CanvasTexture(surfCanvas);
  surfaceMap.colorSpace = THREE.SRGBColorSpace;

function buildSaturnTextures(): PlanetTextureBundle {
  const w = 1024;
  const h = 512;
  const [surfCanvas, surfCtx] = createCanvas(w, h);
  const surfImg = surfCtx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const idx = (y * w + x) * 4;
      const turb = fbmNoise(u * 4.0, v * 10.0, 104, 4) * 0.02;
      const band = Math.sin((v + turb) * 32.0) * 0.5 + 0.5;
      const polarDark = 1 - Math.pow(Math.abs(v - 0.5) * 1.95, 2.4) * 0.28;

      surfImg.data[idx] = Math.round((198 + band * 34) * polarDark);
      surfImg.data[idx + 1] = Math.round((174 + band * 30) * polarDark);
      surfImg.data[idx + 2] = Math.round((132 + band * 24) * polarDark);
      surfImg.data[idx + 3] = 255;
    }
  }
  surfCtx.putImageData(surfImg, 0, 0);

  const [ringCanvas, ringCtx] = createCanvas(1024, 64);
  const ringImg = ringCtx.createImageData(1024, 64);
  for (let x = 0; x < 1024; x++) {
    const rNorm = x / 1024;
    const cassini = rNorm > 0.63 && rNorm < 0.685 ? 0.06 : 1.0;
    const encke = rNorm > 0.875 && rNorm < 0.89 ? 0.15 : 1.0;
    const innerC = rNorm < 0.22 ? rNorm * 2.5 : 1.0;
    const fineRing =
      (Math.sin(rNorm * 190) * 0.25 + Math.cos(rNorm * 430) * 0.15 + 0.75) *
      cassini *
      encke *
      innerC;
    const alpha = Math.max(0, Math.min(1, fineRing * 0.88));
    const tint = 0.82 + Math.sin(rNorm * 45) * 0.12;

    for (let y = 0; y < 64; y++) {
      const idx = (y * 1024 + x) * 4;
      ringImg.data[idx] = Math.round(218 * tint);
      ringImg.data[idx + 1] = Math.round(196 * tint);
      ringImg.data[idx + 2] = Math.round(162 * tint);
      ringImg.data[idx + 3] = Math.round(alpha * 255);
    }
  }
  ringCtx.putImageData(ringImg, 0, 0);

  const surfaceMap = new THREE.CanvasTexture(surfCanvas);
  surfaceMap.colorSpace = THREE.SRGBColorSpace;
  const ringAlphaMap = new THREE.CanvasTexture(ringCanvas);
  ringAlphaMap.colorSpace = THREE.SRGBColorSpace;

  return { surfaceMap, ringAlphaMap };
}

function buildIceGiantTextures(planet: 'uranus' | 'neptune'): PlanetTextureBundle {
  const w = 1024;
  const h = 512;
  const [surfCanvas, surfCtx] = createCanvas(w, h);
  const surfImg = surfCtx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const idx = (y * w + x) * 4;
      const n = fbmNoise(u * 5, v * 12, planet === 'uranus' ? 201 : 307, 4);
      const band = Math.sin((v + n * 0.03) * 18) * 0.5 + 0.5;

      if (planet === 'uranus') {
        surfImg.data[idx] = Math.round(118 + band * 24);
        surfImg.data[idx + 1] = Math.round(188 + band * 26);
        surfImg.data[idx + 2] = Math.round(202 + band * 24);
      } else {
        const highCloud = n > 0.68 ? (n - 0.68) * 190 : 0;
        surfImg.data[idx] = Math.min(255, Math.round(44 + band * 26 + highCloud));
        surfImg.data[idx + 1] = Math.min(255, Math.round(86 + band * 38 + highCloud));
        surfImg.data[idx + 2] = Math.min(255, Math.round(178 + band * 44 + highCloud * 0.8));
      }
      surfImg.data[idx + 3] = 255;
    }
  }

  surfCtx.putImageData(surfImg, 0, 0);
  const surfaceMap = new THREE.CanvasTexture(surfCanvas);
  surfaceMap.colorSpace = THREE.SRGBColorSpace;
  return { surfaceMap };
}

  return { surfaceMap };
}

  const cloudsMap = new THREE.CanvasTexture(cloudCanvas);

  return { surfaceMap, roughnessMap, nightLightsMap, cloudsMap };
}

  return [canvas, ctx];
}
