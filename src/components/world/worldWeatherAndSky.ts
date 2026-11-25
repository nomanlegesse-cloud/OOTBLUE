import * as THREE from 'three';

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow';

export const WEATHER_OPTIONS: { id: WeatherType; label: string }[] = [
  { id: 'clear', label: 'Clear Sky' },
  { id: 'cloudy', label: 'Overcast' },
  { id: 'rain', label: 'Rain' },
  { id: 'storm', label: 'Thunderstorm' },
  { id: 'snow', label: 'Snowfall' },
];

// Deterministic fast PRNG so procedural surface textures never flicker or look uniform
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGrassTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(104729);

  // Neutral bright base so material.color (biome groundColor) tints accurately
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 4500; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const w = 1 + rand() * 2.5;
    const h = 2 + rand() * 4;
    const v = 200 + Math.floor(rand() * 52);
    ctx.fillStyle = `rgb(${v}, ${Math.min(255, v + 5)}, ${v - 6})`;
    ctx.fillRect(x, y, w, h);
  }

  for (let i = 0; i < 65; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const r = 8 + rand() * 18;
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    const shade = rand() > 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(120,130,115,0.11)';
    g.addColorStop(0, shade);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(64, 64);
  tex.anisotropy = anisotropy;
  return tex;
}

export function createAsphaltTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(8191);

  ctx.fillStyle = '#d4d8df';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 5500; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const v = 175 + Math.floor(rand() * 68);
    ctx.fillStyle = `rgb(${v}, ${v + 2}, ${Math.min(255, v + 6)})`;
    ctx.fillRect(x, y, 1.6, 1.6);
  }

  // Subtle tire wear bands
  ctx.fillStyle = 'rgba(110, 120, 138, 0.14)';
  ctx.fillRect(46, 0, 32, 256);
  ctx.fillRect(178, 0, 32, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = anisotropy;
  return tex;
}

export function createPlazaStoneTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(4421);

  ctx.fillStyle = '#e7e5e0';
  ctx.fillRect(0, 0, 256, 256);

  const step = 32;
  for (let row = 0; row < 8; row++) {
    const offset = (row % 2) * (step / 2);
    for (let col = -1; col < 9; col++) {
      const px = col * step + offset;
      const py = row * step;
      const v = 216 + Math.floor(rand() * 28);
      ctx.fillStyle = `rgb(${v}, ${v - 2}, ${v - 6})`;
      ctx.fillRect(px + 1, py + 1, step - 2, step - 2);
    }
  }

  // Fine mineral grain
  for (let i = 0; i < 1800; i++) {
    const v = 190 + Math.floor(rand() * 55);
    ctx.fillStyle = `rgba(${v},${v},${v},0.22)`;
    ctx.fillRect(rand() * 256, rand() * 256, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = anisotropy;
  return tex;
}

export function createWoodPlankTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(9913);

  ctx.fillStyle = '#dfd3c3';
  ctx.fillRect(0, 0, 256, 256);

  const plankH = 32;
  for (let p = 0; p < 8; p++) {
    const y = p * plankH;
    const base = 205 + Math.floor(rand() * 34);
    ctx.fillStyle = `rgb(${base}, ${Math.floor(base * 0.92)}, ${Math.floor(base * 0.82)})`;
    ctx.fillRect(0, y, 256, plankH - 2);

    // Dark plank seam
    ctx.fillStyle = 'rgba(70, 45, 25, 0.35)';
    ctx.fillRect(0, y + plankH - 2, 256, 2);

    // Wood grain streaks
    for (let g = 0; g < 10; g++) {
      ctx.fillStyle = 'rgba(110, 75, 42, 0.12)';
      ctx.fillRect(0, y + 3 + rand() * (plankH - 7), 256, 1.2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 6);
  tex.anisotropy = anisotropy;
  return tex;
}

function createSnowflakeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 28);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
  grad.addColorStop(0.45, 'rgba(241, 245, 249, 0.72)');
  grad.addColorStop(1, 'rgba(241, 245, 249, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function applyRealisticWaterShader(
  waterMat: THREE.MeshStandardMaterial,
  timeUniform: { value: number },
  chopUniform: { value: number },
): void {
  waterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterTime = timeUniform;
    shader.uniforms.uWaterChop = chopUniform;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uWaterTime;
        uniform float uWaterChop;
        varying vec3 vWaterWorldPos;`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        vec3 wPosNorm = (modelMatrix * vec4(position, 1.0)).xyz;
        float shoreCalmN = smoothstep(21.4, 30.0, wPosNorm.z);
        float w1 = cos(position.x * 0.14 + uWaterTime * 1.4) * 0.06 * uWaterChop * shoreCalmN;
        float w2 = cos(position.y * 0.18 - uWaterTime * 1.85) * 0.05 * uWaterChop * shoreCalmN;
        objectNormal = normalize(vec3(-w1, -w2, 1.0));`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec3 wPosBase = (modelMatrix * vec4(transformed, 1.0)).xyz;
        float shoreCalm = smoothstep(21.4, 30.0, wPosBase.z);
        float waveH = (sin(position.x * 0.14 + uWaterTime * 1.4) * 0.14 * uWaterChop
                    + sin(position.y * 0.18 - uWaterTime * 1.85) * 0.11 * uWaterChop
                    + sin((position.x + position.y) * 0.09 + uWaterTime * 0.95) * 0.09 * uWaterChop) * shoreCalm;
        transformed.z += waveH;
        vWaterWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uWaterTime;
        uniform float uWaterChop;
        varying vec3 vWaterWorldPos;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float shoreBand = clamp((vWaterWorldPos.z - 21.8) / 14.0, 0.0, 1.0);
        float rippleA = sin(vWaterWorldPos.x * 0.72 + uWaterTime * 2.3) * sin(vWaterWorldPos.z * 0.68 - uWaterTime * 1.9);
        float foamWave = smoothstep(0.65, 0.96, sin((vWaterWorldPos.z - 22.0) * 1.45 - uWaterTime * 2.1)) * (1.0 - shoreBand);
        vec3 shallowTint = vec3(0.22, 0.78, 0.88);
        diffuseColor.rgb = mix(shallowTint, diffuseColor.rgb, shoreBand);
        diffuseColor.rgb += vec3(0.06, 0.1, 0.12) * max(0.0, rippleA) * uWaterChop;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.97, 1.0), foamWave * 0.48);`,
      );
  };
  waterMat.customProgramCacheKey = () => 'ootblue-realistic-water-v2';
}

export interface SkyAndCloudsRig {
  skyDome: THREE.Mesh;
  skyMat: THREE.MeshBasicMaterial;
  cloudGroup: THREE.Group;
  cloudMat: THREE.MeshStandardMaterial;
  clouds: { mesh: THREE.Group; speed: number; baseZ: number }[];
}

export function createSkyAndClouds(
  scene: THREE.Scene,
  baseSkyColorHex: number,
): SkyAndCloudsRig {
  // Gradient vertex-colored sky dome
  const skyGeo = new THREE.SphereGeometry(265, 24, 16);
  const posAttr = skyGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const zenith = new THREE.Color(0xffffff);
  const horizon = new THREE.Color(0xdbeafe);
  const tmp = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const ny = THREE.MathUtils.clamp(posAttr.getY(i) / 265, 0, 1);
    tmp.copy(horizon).lerp(zenith, Math.pow(ny, 0.55));
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const skyMat = new THREE.MeshBasicMaterial({
    color: baseSkyColorHex,
    vertexColors: true,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // Drifting multi-puff cloud layer
  const cloudGroup = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0,
    transparent: true,
    opacity: 0.88,
  });
  const puffGeo = new THREE.IcosahedronGeometry(1, 1);
  const clouds: { mesh: THREE.Group; speed: number; baseZ: number }[] = [];
  const rand = mulberry32(7331);

  for (let i = 0; i < 18; i++) {
    const cg = new THREE.Group();
    const puffCount = 3 + Math.floor(rand() * 3);
    for (let p = 0; p < puffCount; p++) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      const sx = 4.2 + rand() * 4.5;
      const sy = 1.9 + rand() * 1.8;
      const sz = 3.5 + rand() * 3.4;
      puff.scale.set(sx, sy, sz);
      puff.position.set((p - 1.2) * 4.5 + (rand() - 0.5) * 2.5, (rand() - 0.5) * 1.4, (rand() - 0.5) * 2.8);
      cg.add(puff);
    }
    const cx = -170 + (i / 18) * 340 + (rand() - 0.5) * 18;
    const cy = 58 + rand() * 18;
    const cz = -125 + rand() * 225;
    cg.position.set(cx, cy, cz);
    cloudGroup.add(cg);
    clouds.push({ mesh: cg, speed: 1.2 + rand() * 1.6, baseZ: cz });
  }
  scene.add(cloudGroup);

  return { skyDome, skyMat, cloudGroup, cloudMat, clouds };
}

export interface WeatherAtmosphereTargets {
  baseSkyColor: number;
  baseFogColor: number;
  baseGroundColor: number;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  fill: THREE.DirectionalLight;
  scene: THREE.Scene;
  skyRig: SkyAndCloudsRig;
  asphaltMat: THREE.MeshStandardMaterial;
  plazaMat: THREE.MeshStandardMaterial;
  meadowMat: THREE.MeshStandardMaterial;
  waterChopUniform: { value: number };
}

export interface WeatherSystem {
  update: (
    dt: number,
    elapsed: number,
    focusX: number,
    focusZ: number,
    weather: WeatherType,
    targets: WeatherAtmosphereTargets,
  ) => void;
  dispose: () => void;
}

const _skyCol = new THREE.Color();
const _fogCol = new THREE.Color();
const _sunCol = new THREE.Color();
const _cloudCol = new THREE.Color();
const _groundCol = new THREE.Color();
const _splashDummy = new THREE.Object3D();

export function createWeatherSystem(scene: THREE.Scene): WeatherSystem {
  // 1. Rain Streaks (LineSegments wrapping seamlessly around the player/camera)
  const RAIN_COUNT = 1600;
  const RAIN_SPAN = 78;
  const RAIN_HEIGHT = 32;
  const rainPositions = new Float32Array(RAIN_COUNT * 6);
  const rainOffsets = new Float32Array(RAIN_COUNT * 3);
  const rainSpeeds = new Float32Array(RAIN_COUNT);
  const rand = mulberry32(2026);

  for (let i = 0; i < RAIN_COUNT; i++) {
    rainOffsets[i * 3] = (rand() - 0.5) * RAIN_SPAN;
    rainOffsets[i * 3 + 1] = rand() * RAIN_HEIGHT;
    rainOffsets[i * 3 + 2] = (rand() - 0.5) * RAIN_SPAN;
    rainSpeeds[i] = 24 + rand() * 12;
  }

  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0xcbd5e1,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  rainLines.frustumCulled = false;
  rainLines.visible = false;
  scene.add(rainLines);

  // 2. Ground Rain Splash Rings (InstancedMesh)
  const SPLASH_COUNT = 44;
  const splashGeo = new THREE.RingGeometry(0.12, 0.24, 12);
  splashGeo.rotateX(-Math.PI / 2);
  const splashMat = new THREE.MeshBasicMaterial({
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const splashInst = new THREE.InstancedMesh(splashGeo, splashMat, SPLASH_COUNT);
  splashInst.frustumCulled = false;
  splashInst.visible = false;
  const splashData = Array.from({ length: SPLASH_COUNT }, () => ({
    ox: (rand() - 0.5) * 42,
    oz: (rand() - 0.5) * 42,
    phase: rand(),
    rate: 1.8 + rand() * 1.4,
  }));
  scene.add(splashInst);

  // 3. Snow Particles (Points with soft snowflake sprite)
  const SNOW_COUNT = 1200;
  const SNOW_SPAN = 80;
  const SNOW_HEIGHT = 30;
  const snowPositions = new Float32Array(SNOW_COUNT * 3);
  const snowOffsets = new Float32Array(SNOW_COUNT * 3);
  const snowSpeeds = new Float32Array(SNOW_COUNT);
  for (let i = 0; i < SNOW_COUNT; i++) {
    snowOffsets[i * 3] = (rand() - 0.5) * SNOW_SPAN;
    snowOffsets[i * 3 + 1] = rand() * SNOW_HEIGHT;
    snowOffsets[i * 3 + 2] = (rand() - 0.5) * SNOW_SPAN;
    snowSpeeds[i] = 2.6 + rand() * 2.2;
  }
  const snowTex = createSnowflakeTexture();
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
  const snowMat = new THREE.PointsMaterial({
    map: snowTex,
    color: 0xffffff,
    size: 0.42,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const snowPoints = new THREE.Points(snowGeo, snowMat);
  snowPoints.frustumCulled = false;
  snowPoints.visible = false;
  scene.add(snowPoints);

  let nextLightningCooldown = 3.5;
  let lightningFlash = 0;

  const update = (
    dt: number,
    elapsed: number,
    focusX: number,
    focusZ: number,
    weather: WeatherType,
    targets: WeatherAtmosphereTargets,
  ) => {
    const isRain = weather === 'rain';
    const isStorm = weather === 'storm';
    const isSnow = weather === 'snow';
    const isCloudy = weather === 'cloudy';

    // Target atmosphere presets
    const targetSunInt = isStorm ? 0.55 : isRain ? 0.95 : isSnow ? 1.15 : isCloudy ? 1.25 : 2.1;
    const targetHemiInt = isStorm ? 0.68 : isRain ? 0.85 : isSnow ? 1.12 : isCloudy ? 0.95 : 1.05;
    const targetFogDensity = isStorm ? 0.0115 : isRain ? 0.0085 : isSnow ? 0.0092 : isCloudy ? 0.0062 : 0.0042;
    const targetChop = isStorm ? 2.15 : isRain ? 1.45 : isCloudy ? 1.1 : isSnow ? 0.7 : 0.9;
    const targetWetRoad = isStorm ? 0.24 : isRain ? 0.3 : 0.88;
    const targetWetPlaza = isStorm ? 0.34 : isRain ? 0.42 : 0.85;
    const targetCloudOp = isStorm ? 0.96 : isRain || isCloudy ? 0.93 : isSnow ? 0.9 : 0.82;

    // Storm lightning flashes
    if (isStorm) {
      nextLightningCooldown -= dt;
      if (nextLightningCooldown <= 0) {
        lightningFlash = 1.0;
        nextLightningCooldown = 3.2 + rand() * 5.5;
      }
      lightningFlash = Math.max(0, lightningFlash - dt * 5.2);
    } else {
      lightningFlash = 0;
    }

    const flashBoost = lightningFlash > 0.35 ? 2.4 : lightningFlash * 1.4;
    targets.sun.intensity = THREE.MathUtils.damp(targets.sun.intensity, targetSunInt, 4, dt);
    targets.hemi.intensity = THREE.MathUtils.damp(targets.hemi.intensity, targetHemiInt + flashBoost * 0.45, 4, dt);
    targets.fill.intensity = THREE.MathUtils.damp(targets.fill.intensity, (isStorm ? 0.65 : 0.75) + flashBoost * 0.85, 6, dt);

    // Sun warmth vs overcast cool tint
    _sunCol.setHex(isStorm ? 0x94a3b8 : isRain ? 0xcbd5e1 : isSnow ? 0xe0f2fe : isCloudy ? 0xe2e8f0 : 0xfffbeb);
    targets.sun.color.lerp(_sunCol, Math.min(1, dt * 4));

    // Sky & Fog colors blended from country base palette
    _skyCol.setHex(targets.baseSkyColor);
    _fogCol.setHex(targets.baseFogColor);
    if (isCloudy) {
      _skyCol.lerp(_sunCol.setHex(0x94a3b8), 0.48);
      _fogCol.lerp(_sunCol.setHex(0xb6c4d4), 0.52);
    } else if (isRain) {
      _skyCol.lerp(_sunCol.setHex(0x64748b), 0.68);
      _fogCol.lerp(_sunCol.setHex(0x7c8ea3), 0.7);
    } else if (isStorm) {
      _skyCol.lerp(_sunCol.setHex(0x1e293b), 0.82);
      _fogCol.lerp(_sunCol.setHex(0x334155), 0.82);
      if (lightningFlash > 0.25) {
        _skyCol.lerp(_sunCol.setHex(0xcbd5e1), lightningFlash * 0.55);
      }
    } else if (isSnow) {
      _skyCol.lerp(_sunCol.setHex(0xcbd5e1), 0.62);
      _fogCol.lerp(_sunCol.setHex(0xe2e8f0), 0.75);
    }

    (targets.scene.background as THREE.Color).lerp(_skyCol, Math.min(1, dt * 4));
    targets.skyRig.skyMat.color.lerp(_skyCol, Math.min(1, dt * 4));
    if (targets.scene.fog instanceof THREE.FogExp2) {
      targets.scene.fog.color.lerp(_fogCol, Math.min(1, dt * 4));
      targets.scene.fog.density = THREE.MathUtils.damp(targets.scene.fog.density, targetFogDensity, 4, dt);
    }

    // Cloud tint & gentle wind drift
    _cloudCol.setHex(isStorm ? 0x475569 : isRain ? 0x94a3b8 : isCloudy ? 0xdbeafe : 0xffffff);
    if (lightningFlash > 0.25) _cloudCol.lerp(_sunCol.setHex(0xf8fafc), lightningFlash * 0.6);
    targets.skyRig.cloudMat.color.lerp(_cloudCol, Math.min(1, dt * 4));
    targets.skyRig.cloudMat.opacity = THREE.MathUtils.damp(targets.skyRig.cloudMat.opacity, targetCloudOp, 4, dt);

    const cloudWindScale = isStorm ? 3.2 : isRain ? 2.0 : 1.0;
    for (const cl of targets.skyRig.clouds) {
      cl.mesh.position.x += cl.speed * cloudWindScale * dt;
      if (cl.mesh.position.x > 185) cl.mesh.position.x = -185;
    }

    // Wet ground reflection & snow ground dusting
    targets.asphaltMat.roughness = THREE.MathUtils.damp(targets.asphaltMat.roughness, targetWetRoad, 3.5, dt);
    targets.plazaMat.roughness = THREE.MathUtils.damp(targets.plazaMat.roughness, targetWetPlaza, 3.5, dt);
    targets.waterChopUniform.value = THREE.MathUtils.damp(targets.waterChopUniform.value, targetChop, 3.0, dt);

    _groundCol.setHex(targets.baseGroundColor);
    if (isSnow) _groundCol.lerp(_sunCol.setHex(0xe2e8f0), 0.72);
    else if (isRain || isStorm) _groundCol.multiplyScalar(0.84);
    targets.meadowMat.color.lerp(_groundCol, Math.min(1, dt * 2.5));

    // Update Rain Streaks & Splashes
    const targetRainOp = isStorm ? 0.68 : isRain ? 0.5 : 0;
    rainMat.opacity = THREE.MathUtils.damp(rainMat.opacity, targetRainOp, 6, dt);
    splashMat.opacity = THREE.MathUtils.damp(splashMat.opacity, isStorm ? 0.45 : isRain ? 0.35 : 0, 6, dt);

    if (rainMat.opacity > 0.02) {
      rainLines.visible = true;
      splashInst.visible = true;
      const speedMult = isStorm ? 1.45 : 1.0;
      const windSlantX = isStorm ? -0.26 : -0.09;
      const windSlantZ = isStorm ? 0.14 : 0.04;
      const streakLen = isStorm ? 1.35 : 0.95;

      const posArr = rainGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < RAIN_COUNT; i++) {
        let oy = rainOffsets[i * 3 + 1] - rainSpeeds[i] * speedMult * dt;
        let ox = rainOffsets[i * 3] + windSlantX * rainSpeeds[i] * speedMult * dt * 0.45;
        let oz = rainOffsets[i * 3 + 2] + windSlantZ * rainSpeeds[i] * speedMult * dt * 0.45;

        if (oy < 0) oy += RAIN_HEIGHT;
        if (ox < -RAIN_SPAN / 2) ox += RAIN_SPAN;
        if (ox > RAIN_SPAN / 2) ox -= RAIN_SPAN;
        if (oz < -RAIN_SPAN / 2) oz += RAIN_SPAN;
        if (oz > RAIN_SPAN / 2) oz -= RAIN_SPAN;

        rainOffsets[i * 3] = ox;
        rainOffsets[i * 3 + 1] = oy;
        rainOffsets[i * 3 + 2] = oz;

        const wx = focusX + ox;
        const wz = focusZ + oz;
        const base = i * 6;
        posArr[base] = wx;
        posArr[base + 1] = oy;
        posArr[base + 2] = wz;
        posArr[base + 3] = wx + windSlantX * streakLen;
        posArr[base + 4] = oy - streakLen;
        posArr[base + 5] = wz + windSlantZ * streakLen;
      }
      rainGeo.attributes.position.needsUpdate = true;

      for (let i = 0; i < SPLASH_COUNT; i++) {
        const sp = splashData[i];
        sp.phase = (sp.phase + dt * sp.rate) % 1;
        const sc = 0.4 + sp.phase * 1.9;
        _splashDummy.position.set(focusX + sp.ox, 0.085, focusZ + sp.oz);
        _splashDummy.scale.set(sc * (1 - sp.phase * 0.3), 1, sc * (1 - sp.phase * 0.3));
        _splashDummy.updateMatrix();
        splashInst.setMatrixAt(i, _splashDummy.matrix);
      }
      splashInst.instanceMatrix.needsUpdate = true;
    } else {
      rainLines.visible = false;
      splashInst.visible = false;
    }

    // Update Snow Particles
    snowMat.opacity = THREE.MathUtils.damp(snowMat.opacity, isSnow ? 0.92 : 0, 5, dt);
    if (snowMat.opacity > 0.02) {
      snowPoints.visible = true;
      const posArr = snowGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < SNOW_COUNT; i++) {
        let oy = snowOffsets[i * 3 + 1] - snowSpeeds[i] * dt;
        if (oy < 0) oy += SNOW_HEIGHT;
        snowOffsets[i * 3 + 1] = oy;

        const swayX = Math.sin(elapsed * 1.4 + i) * 0.55;
        const swayZ = Math.cos(elapsed * 1.1 + i * 0.7) * 0.55;
        posArr[i * 3] = focusX + snowOffsets[i * 3] + swayX;
        posArr[i * 3 + 1] = oy;
        posArr[i * 3 + 2] = focusZ + snowOffsets[i * 3 + 2] + swayZ;
      }
      snowGeo.attributes.position.needsUpdate = true;
    } else {
      snowPoints.visible = false;
    }
  };

  const dispose = () => {
    rainGeo.dispose();
    rainMat.dispose();
    splashGeo.dispose();
    splashMat.dispose();
    snowGeo.dispose();
    snowMat.dispose();
    snowTex.dispose();
  };

  return { update, dispose };
}
