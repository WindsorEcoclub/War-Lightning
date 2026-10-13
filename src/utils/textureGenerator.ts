import * as THREE from 'three';

/**
 * Procedural AAA-grade PBR texture generator for photorealistic military vehicles and environments.
 * Generates high-res textures with normal/bump mapping, roughness, and metalness.
 */

// 1. Procedural Tank Armor Plate Texture with Cast Steel Pitting, Weld Seams, and Scratch Weathering
export function generateArmorPlateTexture(baseHex: string = '#4b553e', pattern: 'green' | 'desert' | 'camo' = 'green'): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext('2d')!;

  // Base background
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, size, size);

  roughCtx.fillStyle = '#b0b0b0'; // matte finish
  roughCtx.fillRect(0, 0, size, size);

  // If camo, paint authentic military camouflage patches
  if (pattern === 'camo') {
    // Dark Earth / Black disruptive bands
    ctx.fillStyle = '#262923';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.ellipse(x, y, 140 + Math.random() * 180, 80 + Math.random() * 120, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // Sand/Clay disruptive patches
    ctx.fillStyle = '#8c7d58';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.ellipse(x, y, 110 + Math.random() * 140, 70 + Math.random() * 100, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pattern === 'desert') {
    ctx.fillStyle = '#c8b488';
    ctx.fillRect(0, 0, size, size);
    // Subtle sand abrasion
    ctx.fillStyle = '#a99468';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * size, Math.random() * size, 160, 90, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Micro-noise: Cast steel stippling & rolled plate grain
  const imgData = ctx.getImageData(0, 0, size, size);
  const bumpData = bumpCtx.getImageData(0, 0, size, size);
  const roughData = roughCtx.getImageData(0, 0, size, size);

  const pixels = imgData.data;
  const bPixels = bumpData.data;
  const rPixels = roughData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    // Base color modulation
    pixels[i] = Math.min(255, Math.max(0, pixels[i] + noise));
    pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + noise));
    pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + noise));

    // Bump height (cast stippling)
    const bumpVal = Math.min(255, Math.max(0, 128 + noise * 2.2));
    bPixels[i] = bumpVal;
    bPixels[i + 1] = bumpVal;
    bPixels[i + 2] = bumpVal;

    // Roughness variation
    const roughVal = Math.min(255, Math.max(160, 190 + noise * 1.5));
    rPixels[i] = roughVal;
    rPixels[i + 1] = roughVal;
    rPixels[i + 2] = roughVal;
  }

  ctx.putImageData(imgData, 0, 0);
  bumpCtx.putImageData(bumpData, 0, 0);
  roughCtx.putImageData(roughData, 0, 0);

  // Ballistic scratches & armor plate weld seams
  ctx.strokeStyle = 'rgba(20, 24, 20, 0.45)';
  ctx.lineWidth = 2.5;
  for (let j = 0; j < 25; j++) {
    ctx.beginPath();
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 80, sy + (Math.random() - 0.5) * 80);
    ctx.stroke();
  }

  // Edge burnish & faint rust stains
  ctx.fillStyle = 'rgba(70, 42, 24, 0.18)';
  for (let r = 0; r < 14; r++) {
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 15 + Math.random() * 30, 0, Math.PI * 2);
    ctx.fill();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap, roughnessMap };
}

// 2. Continuous Segmented Caterpillar Tank Track Texture
export function generateTrackTexture(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 256;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = w;
  bCanvas.height = h;
  const bCtx = bCanvas.getContext('2d')!;

  // Dark gunmetal base
  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, 0, w, h);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  // Draw repeating track shoe links with rubber pads and steel guide pins
  const linkHeight = 32;
  const numLinks = h / linkHeight;

  for (let l = 0; l < numLinks; l++) {
    const y = l * linkHeight;

    // Pin groove
    ctx.fillStyle = '#111317';
    ctx.fillRect(0, y, w, 4);
    bCtx.fillStyle = '#303030';
    bCtx.fillRect(0, y, w, 4);

    // Track link steel body
    ctx.fillStyle = '#2a2f38';
    ctx.fillRect(4, y + 4, w - 8, linkHeight - 6);
    bCtx.fillStyle = '#b0b0b0';
    bCtx.fillRect(4, y + 4, w - 8, linkHeight - 6);

    // Rubber chevron road pad (left & right)
    ctx.fillStyle = '#151719';
    ctx.fillRect(16, y + 7, (w / 2) - 28, linkHeight - 12);
    ctx.fillRect((w / 2) + 12, y + 7, (w / 2) - 28, linkHeight - 12);
    bCtx.fillStyle = '#e8e8e8';
    bCtx.fillRect(16, y + 7, (w / 2) - 28, linkHeight - 12);
    bCtx.fillRect((w / 2) + 12, y + 7, (w / 2) - 28, linkHeight - 12);

    // Center guide horn (runs between dual roadwheels)
    ctx.fillStyle = '#404652';
    ctx.fillRect((w / 2) - 8, y + 5, 16, linkHeight - 8);
    bCtx.fillStyle = '#ffffff';
    bCtx.fillRect((w / 2) - 8, y + 5, 16, linkHeight - 8);

    // Metal wear highlights on track edge pins
    ctx.fillStyle = '#8c95a6';
    ctx.fillRect(0, y + 1, 6, 6);
    ctx.fillRect(w - 6, y + 1, 6, 6);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap };
}

// 3. Volumetric Particle Texture for Muzzle Flash Fireball & Explosions
export function generateExplosionParticleTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.2, 'rgba(255, 215, 60, 0.95)');
  gradient.addColorStop(0.45, 'rgba(249, 115, 22, 0.75)');
  gradient.addColorStop(0.7, 'rgba(180, 50, 15, 0.4)');
  gradient.addColorStop(0.88, 'rgba(50, 40, 35, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 4. Ground Scorched Decal Texture for Shell Hits
export function generateImpactCraterTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(15, 12, 10, 0.95)');
  grad.addColorStop(0.4, 'rgba(38, 28, 20, 0.8)');
  grad.addColorStop(0.75, 'rgba(65, 52, 40, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Radiating blast fracture lines
  ctx.strokeStyle = 'rgba(20, 16, 12, 0.85)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
    const len = 40 + Math.random() * 80;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2);
    ctx.lineTo(size / 2 + Math.cos(angle) * len, size / 2 + Math.sin(angle) * len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
