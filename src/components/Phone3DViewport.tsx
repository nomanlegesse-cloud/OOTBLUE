import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { PhoneOSController } from '../os/usePhoneOS';
import { PhoneScreenOS } from './os/PhoneScreenOS';

export type CameraPreset = 'front' | 'hero' | 'back' | 'side';
export type ChassisFinish = 'ootblue' | 'obsidian' | 'natural' | 'bronze';

interface Phone3DViewportProps {
  os: PhoneOSController;
  interactionMode: 'interact' | 'orbit';
  chassisFinish: ChassisFinish;
  presetTrigger: { preset: CameraPreset; seq: number } | null;
  zoomTrigger: { delta: number; seq: number } | null;
  rotateTrigger: { dAzimuth: number; dPolar: number; seq: number } | null;
  onVisitAirportTerminal?: () => void;
}

const FINISH_COLORS: Record<
  ChassisFinish,
  { frame: number; ring: number; topHex: string; botHex: string; logoHex: string }
> = {
  ootblue: {
    frame: 0x3eaef2,
    ring: 0x67c8ff,
    topHex: '#35aff8',
    botHex: '#8bd8ff',
    logoHex: '#4f6e86',
  },
  obsidian: {
    frame: 0x242a34,
    ring: 0x333a47,
    topHex: '#171b24',
    botHex: '#28303f',
    logoHex: '#64748b',
  },
  natural: {
    frame: 0x8e8d8a,
    ring: 0xa6a5a1,
    topHex: '#7e7d7a',
    botHex: '#b4b3ae',
    logoHex: '#3f3f46',
  },
  bronze: {
    frame: 0x6e5646,
    ring: 0x8c6d59,
    topHex: '#4b382d',
    botHex: '#7b5f4f',
    logoHex: '#d6c1b3',
  },
};

// 1:1 CSS-pixel scale so CSS3DObject renders at native 1.0 scale with sharp text and exact hit-testing
const PRESET_POSITIONS: Record<CameraPreset, THREE.Vector3> = {
  front: new THREE.Vector3(0, -85, 1980),
  hero: new THREE.Vector3(340, 20, 1940),
  back: new THREE.Vector3(-340, 20, -1940),
  side: new THREE.Vector3(1780, -40, 420),
};

const TARGET_CENTER = new THREE.Vector3(0, -85, 0);

const _localCam = new THREE.Vector3();
const _spherical = new THREE.Spherical();

function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// Create the signature OOTBLUE 1 back glass texture (sky-blue gradient + stylized OTBLUE box-O logo)
function createOotblueBackTexture(topHex: string, botHex: string, logoHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Diagonal sky-blue sheen gradient matching reference image
  const grad = ctx.createLinearGradient(0, 0, 512, 1024);
  grad.addColorStop(0, topHex);
  grad.addColorStop(0.5, botHex);
  grad.addColorStop(1, topHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1024);

  // Soft diagonal highlight band
  const sheen = ctx.createLinearGradient(0, 260, 512, 760);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.16)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 512, 1024);

  // Draw centered stylized "[O]TBLUE" wordmark from reference image
  ctx.save();
  ctx.translate(256, 520);
  ctx.fillStyle = logoHex;
  ctx.strokeStyle = logoHex;

  // Wide rectangular stylized 'O'
  ctx.lineWidth = 13;
  ctx.lineJoin = 'round';
  ctx.strokeRect(-146, -24, 72, 46);

  // Bold chunky "TBLUE" lettering
  ctx.font = '900 54px "Plus Jakarta Sans", "Arial Black", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TBLUE', -62, 1);

  // Subtle "OOTBLUE 1" model mark underneath
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.65;
  ctx.fillText('OOTBLUE 1', 0, 52);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Create the radial indigo-violet-blue lens glass texture matching the reference image
function createVioletLensTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 124);
  grad.addColorStop(0, '#7c3aed');
  grad.addColorStop(0.42, '#6d5dfc');
  grad.addColorStop(0.78, '#60a5fa');
  grad.addColorStop(1, '#38bdf8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Crisp subtle specular glint
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.ellipse(92, 86, 26, 14, -0.5, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.58)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.2)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const Phone3DViewport: React.FC<Phone3DViewportProps> = ({
  os,
  interactionMode,
  chassisFinish,
  presetTrigger,
  zoomTrigger,
  rotateTrigger,
  onVisitAirportTerminal,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const webglMountRef = useRef<HTMLDivElement | null>(null);
  const cssMountRef = useRef<HTMLDivElement | null>(null);

  const [screenEl] = useState<HTMLDivElement>(() => {
    const el = document.createElement('div');
    el.style.width = '390px';
    el.style.height = '844px';
    el.style.borderRadius = '44px';
    el.style.overflow = 'hidden';
    el.style.backfaceVisibility = 'hidden';
    el.style.webkitBackfaceVisibility = 'hidden';
    el.style.pointerEvents = 'auto';
    return el;
  });

  const osRef = useRef(os);
  osRef.current = os;

  const materialsRef = useRef<{
    frameMat: THREE.MeshStandardMaterial;
    backGlassMat: THREE.MeshStandardMaterial;
    ringMat: THREE.MeshStandardMaterial;
    maxAniso: number;
  } | null>(null);

  const sceneControlsRef = useRef<{
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    requestRender: () => void;
    setTargetCamPos: (v: THREE.Vector3) => void;
  } | null>(null);

  useEffect(() => {
    screenEl.style.pointerEvents = interactionMode === 'interact' ? 'auto' : 'none';
  }, [interactionMode, screenEl]);

  useEffect(() => {
    if (!materialsRef.current || !sceneControlsRef.current) return;
    const palette = FINISH_COLORS[chassisFinish];
    materialsRef.current.frameMat.color.setHex(palette.frame);
    materialsRef.current.ringMat.color.setHex(palette.ring);

    const oldMap = materialsRef.current.backGlassMat.map;
    const newMap = createOotblueBackTexture(palette.topHex, palette.botHex, palette.logoHex);
    newMap.anisotropy = materialsRef.current.maxAniso;
    materialsRef.current.backGlassMat.map = newMap;
    materialsRef.current.backGlassMat.needsUpdate = true;
    oldMap?.dispose();

    sceneControlsRef.current.requestRender();
  }, [chassisFinish]);

  useEffect(() => {
    if (!presetTrigger || !sceneControlsRef.current) return;
    sceneControlsRef.current.setTargetCamPos(PRESET_POSITIONS[presetTrigger.preset].clone());
  }, [presetTrigger]);

  useEffect(() => {
    if (!zoomTrigger || !sceneControlsRef.current) return;
    const { camera, controls, setTargetCamPos } = sceneControlsRef.current;
    const dir = camera.position.clone().sub(controls.target);
    const dist = dir.length();
    const nextDist = THREE.MathUtils.clamp(dist + zoomTrigger.delta * 280, 950, 3200);
    dir.normalize().multiplyScalar(nextDist);
    setTargetCamPos(controls.target.clone().add(dir));
  }, [zoomTrigger]);

  useEffect(() => {
    if (!rotateTrigger || !sceneControlsRef.current) return;
    const { camera, controls, setTargetCamPos } = sceneControlsRef.current;
    const offset = camera.position.clone().sub(controls.target);
    _spherical.setFromVector3(offset);
    _spherical.theta += rotateTrigger.dAzimuth;
    _spherical.phi = THREE.MathUtils.clamp(_spherical.phi + rotateTrigger.dPolar, 0.25, Math.PI - 0.25);
    offset.setFromSpherical(_spherical);
    setTargetCamPos(controls.target.clone().add(offset));
  }, [rotateTrigger]);

  useEffect(() => {
    const container = containerRef.current;
    const webglMount = webglMountRef.current;
    const cssMount = cssMountRef.current;
    if (!container || !webglMount || !cssMount) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    renderer.setSize(width, height);
    webglMount.appendChild(renderer.domElement);

    const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());

    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(width, height);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.inset = '0';
    cssRenderer.domElement.style.pointerEvents = 'none';
    cssMount.appendChild(cssRenderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);

    const camera = new THREE.PerspectiveCamera(38, width / height, 20, 8000);
    camera.position.copy(PRESET_POSITIONS.hero);
    camera.lookAt(TARGET_CENTER);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.05);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(1200, 1600, 1500);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.15);
    fillLight.position.set(-1100, 550, 1100);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(-1200, 800, -1400);
    scene.add(rimLight);

    // OOTBLUE 1 Composite 3D Hardware Group (1:1 CSS Pixel World Scale)
    const phoneGroup = new THREE.Group();
    scene.add(phoneGroup);

    const W = 434;
    const H = 878;
    const D = 43;
    const R = 60;

    const palette = FINISH_COLORS[chassisFinish];

    const frameMat = new THREE.MeshStandardMaterial({
      color: palette.frame,
      metalness: 0.72,
      roughness: 0.26,
    });

    const bezelGlassMat = new THREE.MeshStandardMaterial({
      color: 0x06070a,
      metalness: 0.2,
      roughness: 0.08,
    });

    const backTex = createOotblueBackTexture(palette.topHex, palette.botHex, palette.logoHex);
    backTex.anisotropy = maxAniso;

    const backGlassMat = new THREE.MeshStandardMaterial({
      map: backTex,
      metalness: 0.1,
      roughness: 0.22,
    });

    const ringMat = new THREE.MeshStandardMaterial({
      color: palette.ring,
      metalness: 0.75,
      roughness: 0.24,
    });

    materialsRef.current = { frameMat, backGlassMat, ringMat, maxAniso };

    // Part 1: Main Anodized Chassis
    const chassisShape = createRoundedRectShape(W - 8, H - 8, R);
    const chassisGeo = new THREE.ExtrudeGeometry(chassisShape, {
      depth: D - 8,
      bevelEnabled: true,
      bevelThickness: 4,
      bevelSize: 4,
      bevelSegments: 2,
      curveSegments: 10,
    });
    chassisGeo.center();
    phoneGroup.add(new THREE.Mesh(chassisGeo, frameMat));

    // Part 2: Front Ceramic Shield Bezel
    const frontBezelShape = createRoundedRectShape(W - 15, H - 15, R - 5);
    const frontBezelGeo = new THREE.ExtrudeGeometry(frontBezelShape, {
      depth: 2.2,
      bevelEnabled: true,
      bevelThickness: 1.1,
      bevelSize: 1.1,
      bevelSegments: 1,
      curveSegments: 10,
    });
    frontBezelGeo.center();
    const frontBezelMesh = new THREE.Mesh(frontBezelGeo, bezelGlassMat);
    frontBezelMesh.position.z = D / 2 - 0.3;
    phoneGroup.add(frontBezelMesh);

    // Part 3: Recessed OLED Backing
    const screenBackingShape = createRoundedRectShape(390, 844, 44);
    const screenBackingGeo = new THREE.ShapeGeometry(screenBackingShape, 8);
    const screenBackingMesh = new THREE.Mesh(
      screenBackingGeo,
      new THREE.MeshBasicMaterial({ color: 0x030407 }),
    );
    screenBackingMesh.position.z = D / 2 + 1.7;
    phoneGroup.add(screenBackingMesh);

    // Part 4: OOTBLUE 1 Back Glass Panel with UV normalization so CanvasTexture maps 1:1
    const bw = W - 12;
    const bh = H - 12;
    const backPlaneGeo = new THREE.ShapeGeometry(createRoundedRectShape(bw, bh, R - 3), 10);
    const uvAttr = backPlaneGeo.attributes.uv;
    const posAttr = backPlaneGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const px = posAttr.getX(i);
      const py = posAttr.getY(i);
      uvAttr.setXY(i, (px + bw / 2) / bw, (py + bh / 2) / bh);
    }
    uvAttr.needsUpdate = true;

    const backGlassMesh = new THREE.Mesh(backPlaneGeo, backGlassMat);
    backGlassMesh.rotation.y = Math.PI;
    backGlassMesh.position.z = -D / 2 - 0.6;
    phoneGroup.add(backGlassMesh);

    // Part 5: OOTBLUE 1 Camera Module (Matches reference image_f6e38978.png)
    const camGroup = new THREE.Group();
    camGroup.position.set(0, 0, -D / 2 - 1.4);
    phoneGroup.add(camGroup);

    const pillShape = createRoundedRectShape(144, 294, 71);
    const pillGeo = new THREE.ExtrudeGeometry(pillShape, {
      depth: 6.7,
      bevelEnabled: true,
      bevelThickness: 1.7,
      bevelSize: 1.7,
      bevelSegments: 2,
      curveSegments: 12,
    });
    pillGeo.center();
    const pillMat = new THREE.MeshStandardMaterial({
      color: 0xeef1f5,
      metalness: 0.08,
      roughness: 0.25,
    });
    const pillMesh = new THREE.Mesh(pillGeo, pillMat);
    pillMesh.position.set(107, 261, -2.2);
    camGroup.add(pillMesh);

    const blackRingMat = new THREE.MeshStandardMaterial({
      color: 0x090d14,
      metalness: 0.45,
      roughness: 0.22,
    });
    const lensTex = createVioletLensTexture();
    lensTex.anisotropy = maxAniso;
    const violetGlassMat = new THREE.MeshStandardMaterial({
      map: lensTex,
      metalness: 0.18,
      roughness: 0.08,
    });

    const addOotblueLens = (x: number, y: number, radius: number, zOffset: number) => {
      const bezel = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, 6.2, 28),
        blackRingMat,
      );
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(x, y, zOffset);
      camGroup.add(bezel);

      const glass = new THREE.Mesh(
        new THREE.CircleGeometry(radius * 0.86, 28),
        violetGlassMat,
      );
      glass.rotation.y = Math.PI;
      glass.position.set(x, y, zOffset - 3.2);
      camGroup.add(glass);
    };

    // Two large stacked lenses inside the vertical white pill
    addOotblueLens(107, 326, 57, -5);
    addOotblueLens(107, 196, 57, -5);

    // Third smaller circular lens/sensor at upper-right outside the white pill
    addOotblueLens(-4, 339, 29, -1.5);

    // Part 6: Physical Interactive Side Buttons (Raycast Layer 1)
    const raycastTargets: THREE.Mesh[] = [];
    const buttonConfigs: {
      action: 'power' | 'volUp' | 'volDown' | 'action';
      x: number;
      y: number;
      h: number;
    }[] = [
      { action: 'power', x: W / 2 + 3, y: 100, h: 94 },
      { action: 'action', x: -W / 2 - 3, y: 216, h: 39 },
      { action: 'volUp', x: -W / 2 - 3, y: 128, h: 66 },
      { action: 'volDown', x: -W / 2 - 3, y: 39, h: 66 },
    ];

    const buttonAnimations = new Map<THREE.Mesh, { baseX: number; press: number }>();

    for (const cfg of buttonConfigs) {
      const btnMesh = new THREE.Mesh(new THREE.BoxGeometry(8, cfg.h, 13), ringMat);
      btnMesh.position.set(cfg.x, cfg.y, 0);
      btnMesh.userData.hwAction = cfg.action;
      btnMesh.layers.enable(1);
      phoneGroup.add(btnMesh);
      raycastTargets.push(btnMesh);
      buttonAnimations.set(btnMesh, { baseX: cfg.x, press: 0 });
    }

    // Part 7: Bottom USB-C & Speaker Grilles
    const usbcSlot = new THREE.Mesh(
      new THREE.BoxGeometry(66, 5, 19),
      new THREE.MeshBasicMaterial({ color: 0x090b10 }),
    );
    usbcSlot.position.set(0, -H / 2 + 1.2, 0);
    phoneGroup.add(usbcSlot);

    const holeGeo = new THREE.CylinderGeometry(3, 3, 3.5, 8);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x0a0d12 });
    const holePositions = [-128, -114, -100, -86, -72, 72, 86, 100, 114, 128];
    const speakerMesh = new THREE.InstancedMesh(holeGeo, holeMat, holePositions.length);
    const dummy = new THREE.Object3D();
    holePositions.forEach((hx, i) => {
      dummy.position.set(hx, -H / 2 + 0.6, 0);
      dummy.updateMatrix();
      speakerMesh.setMatrixAt(i, dummy.matrix);
    });
    speakerMesh.instanceMatrix.needsUpdate = true;
    speakerMesh.computeBoundingSphere();
    phoneGroup.add(speakerMesh);

    // Part 8: Top Earpiece
    const earpiece = new THREE.Mesh(
      new THREE.BoxGeometry(61, 4, 3),
      new THREE.MeshBasicMaterial({ color: 0x11151c }),
    );
    earpiece.position.set(0, H / 2 - 8.5, D / 2 + 1.2);
    phoneGroup.add(earpiece);

    // Part 9: Contact Shadow Plane
    const shadowTex = createContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(720, 550),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.6,
      }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -495;
    scene.add(shadowPlane);

    // Part 10: Synchronized CSS3D Interactive Screen (Native 1.0 Scale)
    const cssObject = new CSS3DObject(screenEl);
    cssObject.scale.set(1, 1, 1);
    cssObject.position.set(0, 0, D / 2 + 3.2);
    phoneGroup.add(cssObject);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.16;
    controls.rotateSpeed = 1.15;
    controls.zoomSpeed = 1.25;
    controls.enablePan = false;
    controls.minDistance = 950;
    controls.maxDistance = 3200;
    controls.target.copy(TARGET_CENTER);
    controls.update();

    let targetCamPos: THREE.Vector3 | null = null;
    let animatingButtons = false;

    const setTargetCamPos = (v: THREE.Vector3) => {
      targetCamPos = v;
      requestRender();
    };

    controls.addEventListener('start', () => {
      targetCamPos = null;
    });
    controls.addEventListener('change', () => {
      requestRender();
    });

    let frameId = 0;
    let scheduled = false;
    let lastTime = performance.now();
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 4);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 16);
        }
      };
      frameId = window.setTimeout(poll, 4);
    }

    function renderOnce(dt: number): boolean {
      let needsNextFrame = false;

      if (targetCamPos) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamPos.x, 16, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamPos.y, 16, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamPos.z, 16, dt);
        if (camera.position.distanceTo(targetCamPos) < 4) {
          camera.position.copy(targetCamPos);
          targetCamPos = null;
        } else {
          needsNextFrame = true;
        }
      }

      if (animatingButtons) {
        let anyActive = false;
        buttonAnimations.forEach((info, mesh) => {
          if (info.press > 0.005) {
            info.press = THREE.MathUtils.damp(info.press, 0, 18, dt);
            const dirSign = info.baseX > 0 ? -1 : 1;
            mesh.position.x = info.baseX + dirSign * info.press * 4;
            anyActive = true;
          } else {
            info.press = 0;
            mesh.position.x = info.baseX;
          }
        });
        animatingButtons = anyActive;
        if (anyActive) needsNextFrame = true;
      }

      if (controls.update()) {
        needsNextFrame = true;
      }

      _localCam.copy(camera.position);
      phoneGroup.worldToLocal(_localCam);
      const facingFront = _localCam.z > 10;
      if (cssObject.visible !== facingFront) {
        cssObject.visible = facingFront;
        screenEl.style.display = facingFront ? 'block' : 'none';
      }

      renderer.render(scene, camera);
      cssRenderer.render(scene, camera);

      return needsNextFrame;
    }

    function requestRender() {
      if (disposed || scheduled) return;
      scheduled = true;
      frameId = requestAnimationFrame(() => {
        scheduled = false;
        if (disposed) return;

        const now = performance.now();
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        const needsNextFrame = renderOnce(dt);

        if (needsNextFrame) {
          if (isSoftwareGl) afterDraw(requestRender);
          else requestRender();
        }
      });
    }

    sceneControlsRef.current = {
      camera,
      controls,
      requestRender,
      setTargetCamPos,
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Initial synchronous draw so screen appears immediately with zero flash
    renderOnce(0.016);

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let downPt = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      downPt = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(raycastTargets, false);
      if (hits.length > 0) {
        const hitMesh = hits[0].object as THREE.Mesh;
        const anim = buttonAnimations.get(hitMesh);
        if (anim) {
          anim.press = 1;
          animatingButtons = true;
          requestRender();
        }
        const action = hitMesh.userData.hwAction as 'power' | 'volUp' | 'volDown' | 'action';
        if (action === 'power') osRef.current.pressPowerButton();
        else if (action === 'volUp') osRef.current.adjustVolume(10);
        else if (action === 'volDown') osRef.current.adjustVolume(-10);
        else if (action === 'action') osRef.current.openApp('camera');
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      cssRenderer.setSize(w, h);
      requestRender();
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    const onLost = (ev: Event) => ev.preventDefault();
    const onRestored = () => requestRender();
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    renderer.domElement.addEventListener('webglcontextrestored', onRestored);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
      controls.dispose();
      chassisGeo.dispose();
      frontBezelGeo.dispose();
      screenBackingGeo.dispose();
      backPlaneGeo.dispose();
      pillGeo.dispose();
      holeGeo.dispose();
      shadowTex.dispose();
      lensTex.dispose();
      materialsRef.current?.backGlassMat.map?.dispose();
      scene.environment?.dispose();
      renderer.dispose();
      if (webglMount.contains(renderer.domElement)) webglMount.removeChild(renderer.domElement);
      if (cssMount.contains(cssRenderer.domElement)) cssMount.removeChild(cssRenderer.domElement);
    };
  }, [screenEl]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <div ref={webglMountRef} className="absolute inset-0" />
      <div ref={cssMountRef} className="absolute inset-0 pointer-events-none" />
      {createPortal(
        <PhoneScreenOS
          os={os}
          onVisitAirportTerminal={onVisitAirportTerminal}
        />,
        screenEl,
      )}
    </div>
  );
};
