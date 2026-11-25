import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Anchor,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BatteryCharging,
  Car,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Compass,
  Home,
  MessageCircle,
  PlaneTakeoff,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Terminal,
  Ticket,
  User,
  Users,
  X,
} from 'lucide-react';
import { MultiplayerController } from '../hooks/useMultiplayer';
import { COUNTRY_MAP, CountryId } from '../os/countries';
import { playTapSound } from '../os/sound';
import { PhoneOSController } from '../os/usePhoneOS';
import { NpcCatalogItem, WORLD_NPCS } from '../shared/npcCatalog';
import { AvatarCustomizerPanel } from './world/AvatarCustomizerPanel';
import { NpcApiTesterPanel } from './world/NpcApiTesterPanel';
import {
  buildAirportComplex,
  buildBiomeTrees,
  buildCountryLandmarks,
  buildPlayerHouse,
  createAirplaneMesh,
} from './world/airportAndBiomes';
import {
  animateHumanRig,
  createRealisticHumanMesh,
  HumanAppearanceOptions,
  loadSavedAvatar,
  RealisticHumanRig,
  saveAvatar,
} from './world/humanModels';
import { createRealisticBoatMesh, createRealisticVehicleMesh } from './world/vehicles';
import {
  buildCitySkyscrapers,
  buildCoastalTerrainAndPier,
  buildPlazaLandmarksAndProps,
  createRealisticHouseMesh,
} from './world/cityAndArchitecture';
import {
  createAsphaltTexture,
  createGrassTexture,
  createPlazaStoneTexture,
  createSkyAndClouds,
  createWeatherSystem,
  createWoodPlankTexture,
  WEATHER_OPTIONS,
  WeatherType,
} from './world/worldWeatherAndSky';

interface World3DViewportProps {
  os: PhoneOSController;
  currentCountry: CountryId;
  multiplayer: MultiplayerController;
  onBoardTicket: (ticketId: string) => void;
  onOpenAirportApp: () => void;
  onOpenPhone: () => void;
  playerStateRef: React.MutableRefObject<{
    x: number;
    z: number;
    yaw: number;
    camYaw: number;
    tokensCollected: string[];
  }>;
}

type NpcDefinition = NpcCatalogItem;

interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface DrivableVehicleInfo {
  id: string;
  name: string;
  kind: 'car' | 'boat';
  maxSpeed: number;
  group: THREE.Group;
  wheels: THREE.Group[];
  frontWheelPivots: THREE.Group[];
  steeringWheel?: THREE.Group;
  seatMount?: THREE.Group;
  wakeMesh?: THREE.Mesh;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  steerAngle: number;
  dockX?: number;
  dockZ?: number;
}

// Shared NPC catalog loaded from ../shared/npcCatalog (kept in sync with /api/npcs)

const TOKEN_COORDS: { id: string; x: number; z: number }[] = [
  { id: 'tk1', x: 0, z: 6.5 },
  { id: 'tk2', x: -12, z: -16 },
  { id: 'tk3', x: 16, z: -13 },
  { id: 'tk4', x: -16, z: 13 },
  { id: 'tk5', x: 0, z: -40 },
  { id: 'tk6', x: 0, z: 38 },
  { id: 'tk7', x: -45, z: -4 },
  { id: 'tk8', x: 46, z: -22 },
];

const CIRCLE_COLLIDERS: { x: number; z: number; r: number }[] = [
  { x: 0, z: 0, r: 3.3 }, // Central fountain
  { x: 0, z: 42, r: 2.1 }, // Lighthouse base
];

function createCityWindowTexture(accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 256, 512);

  const cols = 6;
  const rows = 14;
  const padX = 12;
  const padY = 14;
  const cellW = (256 - padX * 2) / cols;
  const cellH = (512 - padY * 2) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = (r * 7 + c * 13) % 5 !== 0;
      ctx.fillStyle = lit ? ((r + c) % 3 === 0 ? '#fde68a' : accentHex) : '#0f172a';
      ctx.fillRect(
        padX + c * cellW + 4,
        padY + r * cellH + 4,
        cellW - 8,
        cellH - 9,
      );
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createNameTagSprite(label: string, accentHex: string): {
  sprite: THREE.Sprite;
  texture: THREE.CanvasTexture;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(10, 8, 236, 48, 14);
  ctx.fill();

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(10, 8, 236, 48, 14);
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.slice(0, 16), 128, 33);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.3, 0.58, 1);
  sprite.position.y = 2.52;
  return { sprite, texture };
}

export const World3DViewport: React.FC<World3DViewportProps> = ({
  os,
  currentCountry,
  multiplayer,
  onBoardTicket,
  onOpenAirportApp,
  onOpenPhone,
  playerStateRef,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const virtualInputRef = useRef({ x: 0, y: 0, jump: false });
  const toggleVehicleRef = useRef<(() => void) | null>(null);
  const jumpToAirportRef = useRef<(() => void) | null>(null);
  const jumpToHomeRef = useRef<(() => void) | null>(null);
  const rebuildPlayerAvatarRef = useRef<((opts: HumanAppearanceOptions) => void) | null>(null);

  const activeCountryObj = COUNTRY_MAP[currentCountry] ?? COUNTRY_MAP.ootblue;

  const [nearbyNpc, setNearbyNpc] = useState<NpcDefinition | null>(null);
  const [activeNpc, setActiveNpc] = useState<NpcDefinition | null>(null);
  const [npcCatalog, setNpcCatalog] = useState<NpcCatalogItem[]>(WORLD_NPCS);
  const [showNpcApiPanel, setShowNpcApiPanel] = useState(false);
  const [npcChatInput, setNpcChatInput] = useState('');
  const [npcChatLoading, setNpcChatLoading] = useState(false);
  const [npcChatError, setNpcChatError] = useState<string | null>(null);
  const [npcMessagesById, setNpcMessagesById] = useState<
    Record<string, { role: 'user' | 'npc'; text: string }[]>
  >({});
  const [nearbyVehicle, setNearbyVehicle] = useState<{ id: string; name: string; kind: 'car' | 'boat' } | null>(null);
  const [drivingVehicle, setDrivingVehicle] = useState<{ id: string; name: string; kind: 'car' | 'boat' } | null>(null);
  const [nearAirportGate, setNearAirportGate] = useState(false);
  const [nearHomePad, setNearHomePad] = useState(false);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showMultiplayerPanel, setShowMultiplayerPanel] = useState(false);
  const [avatarOpts, setAvatarOpts] = useState<HumanAppearanceOptions>(() => loadSavedAvatar());
  const [showAvatarPanel, setShowAvatarPanel] = useState(false);
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [autoWeather, setAutoWeather] = useState(false);
  const [showWeatherMenu, setShowWeatherMenu] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [speedMph, setSpeedMph] = useState(0);
  const [tokensCount, setTokensCount] = useState(playerStateRef.current.tokensCollected.length);
  const [toast, setToast] = useState<string>(`Now at ${activeCountryObj.airportName} (${activeCountryObj.airportCode})`);

  const npcSessionIdRef = useRef(`sess-${Math.random().toString(36).slice(2, 10)}`);
  const npcCatalogRef = useRef<NpcCatalogItem[]>(WORLD_NPCS);
  npcCatalogRef.current = npcCatalog;
  const npcThreadEndRef = useRef<HTMLDivElement | null>(null);
  const nearbyNpcRef = useRef<NpcDefinition | null>(null);
  const activeNpcRef = useRef<NpcDefinition | null>(null);
  activeNpcRef.current = activeNpc;
  const nearAirportGateRef = useRef(false);
  nearAirportGateRef.current = nearAirportGate;
  const nearHomePadRef = useRef(false);
  nearHomePadRef.current = nearHomePad;
  const weatherRef = useRef<WeatherType>(weather);
  weatherRef.current = weather;
  const avatarOptsRef = useRef<HumanAppearanceOptions>(avatarOpts);
  avatarOptsRef.current = avatarOpts;

  const osRef = useRef(os);
  osRef.current = os;
  const multiplayerRef = useRef(multiplayer);
  multiplayerRef.current = multiplayer;

  const refreshNpcCatalog = async () => {
    try {
      const res = await fetch('/api/npcs');
      if (!res.ok) return;
      const data = (await res.json()) as { ok?: boolean; npcs?: NpcCatalogItem[] };
      if (data.ok && Array.isArray(data.npcs) && data.npcs.length > 0) {
        setNpcCatalog(data.npcs);
        npcCatalogRef.current = data.npcs;
        setActiveNpc((prev) =>
          prev ? data.npcs!.find((n) => n.id === prev.id) ?? prev : null,
        );
        setNearbyNpc((prev) =>
          prev ? data.npcs!.find((n) => n.id === prev.id) ?? prev : null,
        );
      }
    } catch {
      // Keep local fallback catalog if server is temporarily unreachable
    }
  };

  useEffect(() => {
    refreshNpcCatalog();
  }, []);

  useEffect(() => {
    npcThreadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeNpc?.id, npcMessagesById, npcChatLoading]);

  useEffect(() => {
    const t = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(t);
  }, [currentCountry]);

  useEffect(() => {
    if (!autoWeather) return;
    const cycle: WeatherType[] = ['clear', 'cloudy', 'rain', 'storm', 'snow'];
    const id = window.setInterval(() => {
      setWeather((prev) => {
        const idx = cycle.indexOf(prev);
        return cycle[(idx + 1) % cycle.length];
      });
    }, 35000);
    return () => window.clearInterval(id);
  }, [autoWeather]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };

  const handleAvatarChange = (next: HumanAppearanceOptions) => {
    setAvatarOpts(next);
    saveAvatar(next);
    rebuildPlayerAvatarRef.current?.(next);
  };

  const sendNpcChatMessage = async (overrideMessage?: string) => {
    if (!activeNpc || npcChatLoading) return;
    const text = (overrideMessage ?? npcChatInput).trim();
    if (!text) return;

    const npcId = activeNpc.id;
    if (!overrideMessage) {
      setNpcChatInput('');
      setNpcMessagesById((prev) => ({
        ...prev,
        [npcId]: [...(prev[npcId] ?? []), { role: 'user', text }],
      }));
    }
    setNpcChatError(null);
    setNpcChatLoading(true);

    try {
      const res = await fetch(`/api/npcs/${encodeURIComponent(npcId)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          country: currentCountry,
          playerName: os.state.settings.deviceName,
          sessionId: npcSessionIdRef.current,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; reply?: string; error?: string };
      if (!res.ok || !data.ok || !data.reply) {
        setNpcChatError(data.error ?? `NPC API returned status ${res.status}.`);
      } else {
        setNpcMessagesById((prev) => ({
          ...prev,
          [npcId]: [...(prev[npcId] ?? []), { role: 'npc', text: data.reply! }],
        }));
      }
    } catch (err) {
      setNpcChatError(
        err instanceof Error ? err.message : 'Unable to reach NPC API.',
      );
    } finally {
      setNpcChatLoading(false);
    }
  };

  const resetNpcConversation = async (npcId: string) => {
    setNpcMessagesById((prev) => {
      const copy = { ...prev };
      delete copy[npcId];
      return copy;
    });
    setNpcChatError(null);
    try {
      await fetch(
        `/api/npcs/${encodeURIComponent(npcId)}/chat?sessionId=${encodeURIComponent(npcSessionIdRef.current)}`,
        { method: 'DELETE' },
      );
    } catch {
      // Ignore transient network error on reset
    }
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2');
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
    renderer.toneMappingExposure = 1.04;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());

    const country = COUNTRY_MAP[currentCountry] ?? COUNTRY_MAP.ootblue;
    const pal = country.palette;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(pal.skyColor);
    scene.fog = new THREE.FogExp2(pal.fogColor, 0.0042);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.3, 360);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();
    pmrem.dispose();

    // Realistic Atmospheric Sky Dome & Drifting Cloud Layer
    const skyRig = createSkyAndClouds(scene, pal.skyColor);
    const weatherSys = createWeatherSystem(scene);

    // Daylight Sky & Shadow-Casting Sun Rig
    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x3b5249, 1.05);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfffbeb, 2.1);
    sun.position.set(45, 70, 35);
    sun.castShadow = !isSoftwareGl;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 190;
    sun.shadow.camera.left = -56;
    sun.shadow.camera.right = 56;
    sun.shadow.camera.top = 56;
    sun.shadow.camera.bottom = -56;
    sun.shadow.bias = -0.00045;
    sun.shadow.normalBias = 0.028;
    scene.add(sun);
    scene.add(sun.target);

    const fill = new THREE.DirectionalLight(0xbae6fd, 0.75);
    fill.position.set(-40, 25, -35);
    scene.add(fill);

    const boxColliders: BoxCollider[] = [];
    const addBoxCollider = (cx: number, cz: number, w: number, d: number, pad = 0.4) => {
      boxColliders.push({
        minX: cx - w / 2 - pad,
        maxX: cx + w / 2 + pad,
        minZ: cz - d / 2 - pad,
        maxZ: cz + d / 2 + pad,
      });
    };

    // Procedural PBR Surface Textures
    const grassTex = createGrassTexture(maxAniso);
    const asphaltTex = createAsphaltTexture(maxAniso);
    const plazaTex = createPlazaStoneTexture(maxAniso);
    const woodTex = createWoodPlankTexture(maxAniso);

    // 1. Coastal Meadow, Seabed, Seawall, Multi-Part Pier & Ocean Water
    const waterTimeUniform = { value: 0 };
    const waterChopUniform = { value: 0.9 };
    const { meadowMat, pierWoodMat: woodMat } = buildCoastalTerrainAndPier(
      scene,
      pal,
      { grassTex, woodTex },
      waterTimeUniform,
      waterChopUniform,
    );

    // 2. City Ring Road & Neighborhood Avenues
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      map: asphaltTex,
      roughness: 0.88,
      metalness: 0.08,
    });
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const whitePaintMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    const addRoadSegment = (cx: number, cz: number, w: number, d: number, horiz: boolean) => {
      const road = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), asphaltMat);
      road.position.set(cx, 0.04, cz);
      road.receiveShadow = true;
      scene.add(road);

      // Dashed center lines
      const span = horiz ? w : d;
      const count = Math.floor(span / 4.5);
      for (let i = 0; i < count; i++) {
        const offset = -span / 2 + 2.2 + i * 4.5;
        const dash = new THREE.Mesh(
          new THREE.BoxGeometry(horiz ? 2.1 : 0.18, 0.01, horiz ? 0.18 : 2.1),
          stripeMat,
        );
        dash.position.set(horiz ? cx + offset : cx, 0.066, horiz ? cz : cz + offset);
        scene.add(dash);
      }
    };

    // City Ring Road (North Ave z=-32, South Coastal Blvd z=17.2, West Blvd x=-36, East Blvd x=36)
    addRoadSegment(0, -32, 79, 6.5, true);
    addRoadSegment(0, 17.2, 79, 5.2, true);
    addRoadSegment(-36, -7.4, 6.5, 55.5, false);
    addRoadSegment(36, -7.4, 6.5, 55.5, false);
    // East Downtown, Airport Access & West Neighborhood spurs
    addRoadSegment(59.5, -32, 41, 6.5, true);
    addRoadSegment(77, -19.5, 6.2, 31, false);
    addRoadSegment(-56, -6, 34, 6.0, true);

    // Crosswalk stripes at South Coastal Blvd -> Pier (x=0, z=17.2)
    for (let cx = -1.8; cx <= 1.8; cx += 0.9) {
      const cw = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.015, 4.2), whitePaintMat);
      cw.position.set(cx, 0.068, 17.2);
      scene.add(cw);
    }

    // 3. Central Stone Plaza Circle & Walkways
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0xd6d3cd,
      map: plazaTex,
      roughness: 0.85,
      metalness: 0.05,
    });
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(19.0, 19.4, 0.08, 40), plazaMat);
    plaza.position.set(0, 0.01, -1.8);
    plaza.receiveShadow = true;
    scene.add(plaza);

    const northSouthWalk = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.06, 46), plazaMat);
    northSouthWalk.position.set(0, 0.022, -4);
    northSouthWalk.receiveShadow = true;
    scene.add(northSouthWalk);

    const eastWestWalk = new THREE.Mesh(new THREE.BoxGeometry(64, 0.06, 4.5), plazaMat);
    eastWestWalk.position.set(0, 0.022, 0);
    eastWestWalk.receiveShadow = true;
    scene.add(eastWestWalk);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.75 });
    const { skipDefaultNorthTower } = buildCountryLandmarks(scene, country, woodMat, stoneMat);

    // 4b. INTERNATIONAL AIRPORT COMPLEX (Terminal, ATC Tower, Runway & Parked Jetliner)
    const airportAssets = buildAirportComplex(
      scene,
      country,
      addBoxCollider,
      plazaMat,
      asphaltMat,
      whitePaintMat,
      stripeMat,
    );
    const skyPlane = createAirplaneMesh(0xf8fafc, pal.accentColor);
    skyPlane.scale.setScalar(0.95);
    scene.add(skyPlane);

    // 5. Central Tiered Stone Fountain, Benches, Streetlamps, Rocks, Pavilion, Café & Arcade
    const { statuePhone } = buildPlazaLandmarksAndProps(scene, plazaMat, stoneMat, woodMat, addBoxCollider);

    // 6. City Skyline District (North & East Urban Towers)
    const skyWinTex = createCityWindowTexture('#7dd3fc');
    const warmWinTex = createCityWindowTexture('#bae6fd');
    buildCitySkyscrapers(scene, skipDefaultNorthTower, plazaMat, skyWinTex, warmWinTex, addBoxCollider);

    // 9. RESIDENTIAL NEIGHBORHOOD HOUSES & YOUR WALK-IN HOME
    const lawnMat = new THREE.MeshStandardMaterial({ color: 0x4d8b46, map: grassTex, roughness: 0.9 });
    const houseAssets = buildPlayerHouse(scene, addBoxCollider, plazaMat, lawnMat);
    const houseGlassMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.35,
      roughness: 0.2,
    });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 });

    const houses: {
      x: number;
      z: number;
      rotY: number;
      w: number;
      d: number;
      h: number;
      wall: number;
      roof: number;
    }[] = [
      // West Neighborhood facing East Boulevard / Spur Lane
      { x: -49, z: -20, rotY: Math.PI / 2, w: 7.4, d: 6.2, h: 4.6, wall: 0xe0f2fe, roof: 0x0284c7 },
      { x: -49, z: -12.5, rotY: 0, w: 7.2, d: 6.0, h: 3.4, wall: 0xfef3c7, roof: 0xb45309 },
      { x: -62, z: -14, rotY: 0, w: 7.8, d: 6.4, h: 4.8, wall: 0xd1fae5, roof: 0x047857 },
      { x: -49, z: 3, w: 7.4, d: 6.0, rotY: Math.PI / 2, h: 3.6, wall: 0xffe4e6, roof: 0xbe123c },
      { x: -62, z: 2.5, rotY: Math.PI, w: 7.6, d: 6.2, h: 4.6, wall: 0xf1f5f9, roof: 0x334155 },
      { x: -49, z: 12.5, rotY: Math.PI / 2, w: 7.0, d: 5.8, h: 3.4, wall: 0xbae6fd, roof: 0x0369a1 },
      // East Coastal Cottages facing South/West
      { x: 49, z: 11, rotY: -Math.PI / 2, w: 7.4, d: 6.0, h: 4.5, wall: 0xfef3c7, roof: 0x0284c7 },
      { x: 63, z: 11, rotY: 0, w: 7.2, d: 5.8, h: 3.5, wall: 0xd1fae5, roof: 0x0f766e },
    ];

    houses.forEach((hs, idx) => {
      const wallCol = pal.houseWalls[idx % pal.houseWalls.length] ?? hs.wall;
      const roofCol = pal.houseRoofs[idx % pal.houseRoofs.length] ?? hs.roof;
      const hMesh = createRealisticHouseMesh(hs.w, hs.d, hs.h, wallCol, roofCol, lawnMat, houseGlassMat, trimMat);
      hMesh.position.set(hs.x, 0, hs.z);
      hMesh.rotation.y = hs.rotY;
      hMesh.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry instanceof THREE.BoxGeometry && obj.position.y < 0.05) {
            obj.receiveShadow = true;
          } else {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        }
      });
      scene.add(hMesh);
      const turned = Math.abs(Math.sin(hs.rotY)) > 0.5;
      addBoxCollider(hs.x, hs.z, turned ? hs.d : hs.w, turned ? hs.w : hs.d);
    });

    // 10. Sculpted Rolling Perimeter Hills & Instanced Biome Trees
    const hillsGroup = new THREE.Group();
    const hillMat = new THREE.MeshStandardMaterial({ color: pal.hillColor, roughness: 0.92 });
    const hillSubMat = new THREE.MeshStandardMaterial({ color: pal.groundColor, roughness: 0.94 });
    const hillCoords: [number, number, number, number][] = [
      [-92, -85, 34, 18],
      [0, -104, 44, 22],
      [112, -98, 36, 20],
      [-102, -10, 32, 16],
      [152, -18, 34, 18],
    ];
    for (const [hx, hz, hr, hh] of hillCoords) {
      const hillProfile = [
        new THREE.Vector2(hr * 1.05, 0),
        new THREE.Vector2(hr * 0.88, hh * 0.18),
        new THREE.Vector2(hr * 0.65, hh * 0.52),
        new THREE.Vector2(hr * 0.36, hh * 0.84),
        new THREE.Vector2(hr * 0.14, hh * 0.97),
        new THREE.Vector2(0, hh),
      ];
      const hill = new THREE.Mesh(new THREE.LatheGeometry(hillProfile, 28), hillMat);
      hill.position.set(hx, -0.35, hz);
      hill.scale.set(1.15, 1, 0.92);
      hill.receiveShadow = true;
      hillsGroup.add(hill);

      const foot = new THREE.Mesh(
        new THREE.LatheGeometry(
          [
            new THREE.Vector2(hr * 0.65, 0),
            new THREE.Vector2(hr * 0.42, hh * 0.38),
            new THREE.Vector2(0, hh * 0.56),
          ],
          20,
        ),
        hillSubMat,
      );
      foot.position.set(hx + hr * 0.42, -0.35, hz + hr * 0.25);
      foot.receiveShadow = true;
      hillsGroup.add(foot);
    }
    scene.add(hillsGroup);

    const treePositions: [number, number, number][] = [];
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      const dist = 76 + (i % 3) * 8;
      const tx = Math.cos(angle) * dist;
      const tz = Math.sin(angle) * dist;
      if (tz > 14) continue; // Keep coastal bay clear
      if (tx > 70 && tx < 134 && tz > -66 && tz < 22) continue; // Keep airport & runway clear
      treePositions.push([tx, tz, 0.9 + (i % 4) * 0.14]);
    }
    // Park trees near Plaza corners (clear of Roadster & buildings)
    treePositions.push([-24, 5, 0.95], [24, 5, 0.9], [-28, -19, 1.0], [27, -20, 0.95]);
    buildBiomeTrees(scene, treePositions, pal.treeKind);

    // 12. BOATS ON THE COASTAL BAY
    interface AiBoatActor {
      group: THREE.Group;
      cx: number;
      cz: number;
      rx: number;
      rz: number;
      speed: number;
      phase: number;
    }
    const aiBoats: AiBoatActor[] = [];
    const boatConfigs: {
      kind: 'sailboat' | 'yacht';
      hull: number;
      accent: number;
      cx: number;
      cz: number;
      rx: number;
      rz: number;
      speed: number;
      phase: number;
    }[] = [
      { kind: 'sailboat', hull: 0xf8fafc, accent: 0x38bdf8, cx: -24, cz: 46, rx: 14, rz: 8, speed: 0.24, phase: 0 },
      { kind: 'sailboat', hull: 0x1e293b, accent: 0xf43f5e, cx: 28, cz: 50, rx: 16, rz: 9, speed: -0.2, phase: 2.1 },
      { kind: 'sailboat', hull: 0xfef3c7, accent: 0x10b981, cx: -48, cz: 64, rx: 18, rz: 10, speed: 0.18, phase: 4.0 },
      { kind: 'yacht', hull: 0xf8fafc, accent: 0x0284c7, cx: 12, cz: 72, rx: 28, rz: 11, speed: 0.16, phase: 1.2 },
      { kind: 'yacht', hull: 0x0f172a, accent: 0x38bdf8, cx: -16, cz: 86, rx: 32, rz: 10, speed: -0.14, phase: 3.4 },
    ];
    for (const bc of boatConfigs) {
      const { group } = createRealisticBoatMesh(bc.kind, bc.hull, bc.accent);
      scene.add(group);
      aiBoats.push({
        group,
        cx: bc.cx,
        cz: bc.cz,
        rx: bc.rx,
        rz: bc.rz,
        speed: bc.speed,
        phase: bc.phase,
      });
    }

    // 13. AI TRAFFIC VEHICLES ON CITY RING ROAD
    // Loop path: (-36,-32) -> (36,-32) -> (36,17.2) -> (-36,17.2) -> back
    const roadLoopWaypoints: [number, number][] = [
      [-37.5, -33.5],
      [37.5, -33.5],
      [37.5, 18.5],
      [-37.5, 18.5],
    ];
    const loopSegs: { ax: number; az: number; bx: number; bz: number; len: number }[] = [];
    let totalLoopLen = 0;
    for (let i = 0; i < roadLoopWaypoints.length; i++) {
      const [ax, az] = roadLoopWaypoints[i];
      const [bx, bz] = roadLoopWaypoints[(i + 1) % roadLoopWaypoints.length];
      const len = Math.hypot(bx - ax, bz - az);
      loopSegs.push({ ax, az, bx, bz, len });
      totalLoopLen += len;
    }

    const aiTrafficDefs: { style: 'sedan' | 'bus' | 'van' | 'suv' | 'roadster'; color: number; offset: number; speed: number }[] = [
      { style: 'sedan', color: 0xef4444, offset: 0, speed: 11.5 },
      { style: 'bus', color: 0xf59e0b, offset: totalLoopLen * 0.22, speed: 9.2 },
      { style: 'van', color: 0xe2e8f0, offset: totalLoopLen * 0.45, speed: 10.5 },
      { style: 'suv', color: 0x10b981, offset: totalLoopLen * 0.68, speed: 11.8 },
      { style: 'roadster', color: 0x6366f1, offset: totalLoopLen * 0.85, speed: 13.0 },
    ];
    const aiTraffic = aiTrafficDefs.map((def) => {
      const rig = createRealisticVehicleMesh(def.style, def.color);
      scene.add(rig.group);
      return { ...def, rig, dist: def.offset };
    });

    // 14. DRIVABLE VEHICLES (2 Cars + 1 Speedboat)
    const drivableVehicles: DrivableVehicleInfo[] = [];

    const roadsterRig = createRealisticVehicleMesh('roadster', 0x38bdf8);
    roadsterRig.group.position.set(-23, 0, -24.5);
    roadsterRig.group.rotation.y = Math.PI / 2;
    scene.add(roadsterRig.group);
    drivableVehicles.push({
      id: 'roadster',
      name: 'OOTBLUE Roadster',
      kind: 'car',
      maxSpeed: 18.5,
      group: roadsterRig.group,
      wheels: roadsterRig.wheels,
      frontWheelPivots: roadsterRig.frontWheelPivots,
      steeringWheel: roadsterRig.steeringWheel,
      seatMount: roadsterRig.seatMount,
      x: -23,
      z: -24.5,
      yaw: Math.PI / 2,
      speed: 0,
      steerAngle: 0,
    });

    const suvRig = createRealisticVehicleMesh('suv', 0x0f766e);
    suvRig.group.position.set(-41, 0, 6);
    suvRig.group.rotation.y = 0;
    scene.add(suvRig.group);
    drivableVehicles.push({
      id: 'suv',
      name: 'Coastal SUV',
      kind: 'car',
      maxSpeed: 15.5,
      group: suvRig.group,
      wheels: suvRig.wheels,
      frontWheelPivots: suvRig.frontWheelPivots,
      steeringWheel: suvRig.steeringWheel,
      seatMount: suvRig.seatMount,
      x: -41,
      z: 6,
      yaw: 0,
      speed: 0,
      steerAngle: 0,
    });

    const speedboatRig = createRealisticBoatMesh('speedboat', 0xf8fafc, 0x38bdf8);
    speedboatRig.group.position.set(5.4, -0.26, 32);
    speedboatRig.group.rotation.y = 0;
    scene.add(speedboatRig.group);
    drivableVehicles.push({
      id: 'speedboat',
      name: 'OOTBLUE Speedboat',
      kind: 'boat',
      maxSpeed: 21.0,
      group: speedboatRig.group,
      wheels: [],
      frontWheelPivots: [],
      steeringWheel: speedboatRig.steeringWheel,
      seatMount: speedboatRig.seatMount,
      wakeMesh: speedboatRig.wakeMesh,
      x: 5.4,
      z: 32,
      yaw: 0,
      speed: 0,
      steerAngle: 0,
      dockX: 4.5,
      dockZ: 28,
    });

    // 15. Collectible OOTBLUE Tokens
    const tokenMeshes: { id: string; mesh: THREE.Mesh; baseX: number; baseZ: number }[] = [];
    const tokenGeo = new THREE.OctahedronGeometry(0.52, 0);
    const tokenMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.65,
      metalness: 0.4,
      roughness: 0.15,
    });
    for (const tk of TOKEN_COORDS) {
      if (playerStateRef.current.tokensCollected.includes(tk.id)) continue;
      const mesh = new THREE.Mesh(tokenGeo, tokenMat);
      mesh.position.set(tk.x, 1.1, tk.z);
      scene.add(mesh);
      tokenMeshes.push({ id: tk.id, mesh, baseX: tk.x, baseZ: tk.z });
    }

    // 16. Spawn Realistic Sculpted NPCs
    const npcActors = npcCatalogRef.current.map((def, idx) => {
      const rig = createRealisticHumanMesh({
        shirtColor: def.shirtColor,
        hairColor: def.hairColor,
        ...def.appearance,
      });
      rig.group.position.set(def.homeX, 0, def.homeZ);
      scene.add(rig.group);
      return { def, rig, phase: idx * 1.4, walkPhase: idx * 1.1 };
    });

    // 17. Spawn Realistic Player Character (Live-Customizable) + Multiplayer Remote Actor Registry
    let playerRig = createRealisticHumanMesh(avatarOptsRef.current);
    playerRig.group.position.set(playerStateRef.current.x, 0, playerStateRef.current.z);
    playerRig.group.rotation.y = playerStateRef.current.yaw;
    scene.add(playerRig.group);

    rebuildPlayerAvatarRef.current = (nextOpts: HumanAppearanceOptions) => {
      const parent = playerRig.group.parent ?? scene;
      const prevPos = playerRig.group.position.clone();
      const prevRot = playerRig.group.rotation.clone();
      const prevVisible = playerRig.group.visible;

      parent.remove(playerRig.group);
      playerRig.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m?.dispose());
        }
      });

      const nextRig = createRealisticHumanMesh(nextOpts);
      nextRig.group.position.copy(prevPos);
      nextRig.group.rotation.copy(prevRot);
      nextRig.group.visible = prevVisible;
      parent.add(nextRig.group);
      playerRig = nextRig;
    };

    interface RemoteActorVisual {
      rig: RealisticHumanRig;
      sprite: THREE.Sprite;
      labelTex: THREE.CanvasTexture;
      name: string;
      color: number;
      walkPhase: number;
    }
    const remoteActors = new Map<string, RemoteActorVisual>();

    const disposeRemoteActor = (actor: RemoteActorVisual) => {
      scene.remove(actor.rig.group);
      actor.rig.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m?.dispose());
        }
      });
      (actor.sprite.material as THREE.SpriteMaterial).dispose();
      actor.labelTex.dispose();
    };

    let camYaw = playerStateRef.current.camYaw;
    let camPitch = 0.36;
    let camDist = 9.5;
    let playerVy = 0;
    let playerY = playerRig.group.position.z > 20 && Math.abs(playerRig.group.position.x) <= 2.4 ? 0.35 : 0;
    let walkPhase = 0;

    let activeVehicle: DrivableVehicleInfo | null = null;
    let nearbyVehicleId: string | null = null;
    let lastMphUi = -1;

    camera.position.set(
      playerRig.group.position.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist,
      playerRig.group.position.y + 1.8 + Math.sin(camPitch) * camDist,
      playerRig.group.position.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist,
    );
    camera.lookAt(
      playerRig.group.position.x,
      playerRig.group.position.y + 1.4,
      playerRig.group.position.z,
    );

    const resolveCollisions = (nx: number, nz: number, radius: number): [number, number] => {
      for (const ob of CIRCLE_COLLIDERS) {
        const dx = nx - ob.x;
        const dz = nz - ob.z;
        const dist = Math.hypot(dx, dz);
        const minD = ob.r + radius;
        if (dist < minD && dist > 0.001) {
          nx = ob.x + (dx / dist) * minD;
          nz = ob.z + (dz / dist) * minD;
        }
      }
      for (const bx of boxColliders) {
        const closestX = THREE.MathUtils.clamp(nx, bx.minX, bx.maxX);
        const closestZ = THREE.MathUtils.clamp(nz, bx.minZ, bx.maxZ);
        const dx = nx - closestX;
        const dz = nz - closestZ;
        const distSq = dx * dx + dz * dz;
        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            nx = closestX + (dx / dist) * radius;
            nz = closestZ + (dz / dist) * radius;
          } else {
            // Inside box fallback push to nearest edge
            const dLeft = Math.abs(nx - bx.minX);
            const dRight = Math.abs(bx.maxX - nx);
            const dTop = Math.abs(nz - bx.minZ);
            const dBot = Math.abs(bx.maxZ - nz);
            const m = Math.min(dLeft, dRight, dTop, dBot);
            if (m === dLeft) nx = bx.minX - radius;
            else if (m === dRight) nx = bx.maxX + radius;
            else if (m === dTop) nz = bx.minZ - radius;
            else nz = bx.maxZ + radius;
          }
        }
      }
      return [nx, nz];
    };

    const exitCurrentVehicle = (v: DrivableVehicleInfo) => {
      scene.add(playerRig.group);
      playerRig.group.rotation.set(0, v.yaw, 0);
      playerRig.group.visible = true;
      playerRig.contactShadow.visible = true;
      v.speed = 0;
      v.steerAngle = 0;
      for (const p of v.frontWheelPivots) p.rotation.y = 0;
      if (v.steeringWheel) v.steeringWheel.rotation.z = 0;
    };

    const toggleVehicle = () => {
      if (activeVehicle) {
        const prevYaw = activeVehicle.yaw;
        const isBoat = activeVehicle.kind === 'boat';
        const dockX = activeVehicle.dockX ?? 4.5;
        const dockZ = activeVehicle.dockZ ?? 28;
        const vX = activeVehicle.x;
        const vZ = activeVehicle.z;
        exitCurrentVehicle(activeVehicle);

        if (isBoat) {
          playerRig.group.position.set(dockX, 0.35, dockZ);
          playerY = 0.35;
        } else {
          const exitX = vX + Math.cos(prevYaw) * 2.2;
          const exitZ = vZ - Math.sin(prevYaw) * 2.2;
          const [sx, sz] = resolveCollisions(
            THREE.MathUtils.clamp(exitX, -74, 120),
            THREE.MathUtils.clamp(exitZ, -66, 19.5),
            0.4,
          );
          playerRig.group.position.set(sx, 0, sz);
          playerY = 0;
        }
        activeVehicle = null;
        setDrivingVehicle(null);
        setSpeedMph(0);
        camDist = 9.5;
        playTapSound(osRef.current.state.settings.volume, osRef.current.state.settings.muted);
      } else if (nearbyVehicleId) {
        const found = drivableVehicles.find((v) => v.id === nearbyVehicleId);
        if (found) {
          activeVehicle = found;
          activeVehicle.steerAngle = 0;
          if (found.seatMount) {
            found.seatMount.add(playerRig.group);
            playerRig.group.position.set(0, 0, 0);
            playerRig.group.rotation.set(0, 0, 0);
            playerRig.group.visible = true;
            playerRig.contactShadow.visible = false;
          } else {
            playerRig.group.visible = false;
          }
          setDrivingVehicle({ id: found.id, name: found.name, kind: found.kind });
          setNearbyVehicle(null);
          nearbyVehicleId = null;
          setActiveNpc(null);
          camDist = found.kind === 'boat' ? 11.5 : 8.8;
          camYaw = found.yaw + Math.PI;
          playTapSound(osRef.current.state.settings.volume, osRef.current.state.settings.muted);
          showToast(
            found.kind === 'boat'
              ? `Cruising ${found.name} — Press F to return to Marina`
              : `Driving ${found.name} — Press F to exit`,
          );
        }
      }
    };
    toggleVehicleRef.current = toggleVehicle;
    jumpToAirportRef.current = () => {
      if (activeVehicle) {
        exitCurrentVehicle(activeVehicle);
        activeVehicle = null;
        setDrivingVehicle(null);
        setSpeedMph(0);
      }
      playerRig.group.position.set(74.5, 0, -18);
      playerRig.group.rotation.y = Math.PI / 2;
      playerY = 0;
      playerVy = 0;
      camYaw = -Math.PI / 2;
      camDist = 9.5;
      showToast(`Arrived at ${country.airportName} · See Officer Kenji`);
    };
    jumpToHomeRef.current = () => {
      if (activeVehicle) {
        exitCurrentVehicle(activeVehicle);
        activeVehicle = null;
        setDrivingVehicle(null);
        setSpeedMph(0);
      }
      playerRig.group.position.set(28, 0, 1.2);
      playerRig.group.rotation.y = Math.PI;
      playerY = 0;
      playerVy = 0;
      camYaw = 0;
      camDist = 9.5;
      showToast('Arrived at Your House — Walk right inside!');
    };

    // Mouse look drag on world canvas
    let draggingLook = false;
    let lastMouse = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      draggingLook = true;
      lastMouse = { x: e.clientX, y: e.clientY };
      mount.focus({ preventScroll: true });
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingLook) return;
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      lastMouse = { x: e.clientX, y: e.clientY };
      camYaw -= dx * 0.006;
      camPitch = THREE.MathUtils.clamp(camPitch + dy * 0.005, 0.1, 1.15);
    };
    const onPointerUp = () => {
      draggingLook = false;
    };
    const onWheel = (e: WheelEvent) => {
      camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.008, 4.5, 22);
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: true });

    const mapKeyToken = (e: KeyboardEvent): string | null => {
      const k = e.key.toLowerCase();
      if (e.code === 'KeyW' || k === 'w' || e.code === 'ArrowUp') return 'up';
      if (e.code === 'KeyS' || k === 's' || e.code === 'ArrowDown') return 'down';
      if (e.code === 'KeyA' || k === 'a' || e.code === 'ArrowLeft') return 'left';
      if (e.code === 'KeyD' || k === 'd' || e.code === 'ArrowRight') return 'right';
      if (e.code === 'Space' || k === ' ') return 'jump';
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') return 'sprint';
      return null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      const token = mapKeyToken(e);
      if (token) {
        e.preventDefault();
        keysRef.current[token] = true;
        if (token === 'jump' && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
      if ((e.code === 'KeyE' || e.key.toLowerCase() === 'e') && !activeVehicle && nearbyNpcRef.current && !activeNpcRef.current) {
        if (nearbyNpcRef.current.id === 'kenji') {
          setShowFlightModal(true);
        } else {
          setActiveNpc(nearbyNpcRef.current);
          setNpcChatError(null);
        }
      }
      if (e.code === 'KeyF' || e.key.toLowerCase() === 'f') {
        toggleVehicleRef.current?.();
      }
      if ((e.code === 'KeyG' || e.key.toLowerCase() === 'g') && nearAirportGateRef.current) {
        setShowFlightModal((prev) => !prev);
      }
      if ((e.code === 'KeyH' || e.key.toLowerCase() === 'h') && nearHomePadRef.current) {
        osRef.current.updateSettings({ batteryLevel: 100 });
        playTapSound(osRef.current.state.settings.volume, osRef.current.state.settings.muted);
        showToast('Rested at Home · OOTBLUE 1 charged to 100%!');
      }
      if (e.code === 'Escape') {
        if (activeNpcRef.current) {
          setActiveNpc(null);
          setNpcChatError(null);
        }
        setShowFlightModal(false);
        setShowAvatarPanel(false);
        setShowNpcApiPanel(false);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const token = mapKeyToken(e);
      if (token) keysRef.current[token] = false;
    };
    const clearKeys = () => {
      keysRef.current = {};
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', clearKeys);
    mount.focus({ preventScroll: true });

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsedTotal = 0;

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsedTotal += dt;

      const k = keysRef.current;
      const v = virtualInputRef.current;
      let moveForward = (k.up ? 1 : 0) - (k.down ? 1 : 0) + v.y;
      let moveRight = (k.right ? 1 : 0) - (k.left ? 1 : 0) + v.x;
      moveForward = THREE.MathUtils.clamp(moveForward, -1, 1);
      moveRight = THREE.MathUtils.clamp(moveRight, -1, 1);

      let focusX = playerRig.group.position.x;
      let focusY = playerRig.group.position.y;
      let focusZ = playerRig.group.position.z;

      if (activeVehicle) {
        // DRIVING / BOATING PHYSICS
        const throttle = moveForward;
        const steer = moveRight;
        const braking = Boolean(k.jump || v.jump);

        if (braking) {
          activeVehicle.speed = THREE.MathUtils.damp(activeVehicle.speed, 0, 10, dt);
        } else if (Math.abs(throttle) > 0.05) {
          const targetSpd = throttle > 0 ? activeVehicle.maxSpeed * throttle : -activeVehicle.maxSpeed * 0.45;
          activeVehicle.speed = THREE.MathUtils.damp(activeVehicle.speed, targetSpd, 4.2, dt);
        } else {
          activeVehicle.speed = THREE.MathUtils.damp(activeVehicle.speed, 0, 2.8, dt);
        }

        if (Math.abs(steer) > 0.05 && (Math.abs(activeVehicle.speed) > 0.35 || activeVehicle.kind === 'boat')) {
          const turnDir = activeVehicle.speed >= -0.1 ? 1 : -1;
          const turnRate = activeVehicle.kind === 'boat' ? 1.65 : 2.15;
          activeVehicle.yaw -= steer * turnDir * turnRate * dt;
        }

        let nx = activeVehicle.x + Math.sin(activeVehicle.yaw) * activeVehicle.speed * dt;
        let nz = activeVehicle.z + Math.cos(activeVehicle.yaw) * activeVehicle.speed * dt;

        activeVehicle.steerAngle = THREE.MathUtils.damp(activeVehicle.steerAngle, steer, 10, dt);

        if (activeVehicle.kind === 'boat') {
          nx = THREE.MathUtils.clamp(nx, -92, 92);
          nz = THREE.MathUtils.clamp(nz, 24.5, 112);
          // Avoid Lighthouse pier & lighthouse
          if (Math.abs(nx) < 5.2 && nz < 44.5) {
            if (activeVehicle.x >= 5.2) nx = 5.2;
            else if (activeVehicle.x <= -5.2) nx = -5.2;
          }
          const bob = Math.sin(elapsedTotal * 2.8) * 0.08;
          activeVehicle.group.position.set(nx, -0.26 + bob, nz);
          activeVehicle.group.rotation.set(
            -activeVehicle.speed * 0.008,
            activeVehicle.yaw,
            -activeVehicle.steerAngle * 0.06,
          );
          if (activeVehicle.wakeMesh) {
            activeVehicle.wakeMesh.visible = Math.abs(activeVehicle.speed) > 1.2;
          }
        } else {
          nx = THREE.MathUtils.clamp(nx, -76, 122);
          nz = THREE.MathUtils.clamp(nz, -64, 18.2);
          [nx, nz] = resolveCollisions(nx, nz, 1.35);
          activeVehicle.group.position.set(nx, 0, nz);
          activeVehicle.group.rotation.y = activeVehicle.yaw;
          for (const w of activeVehicle.wheels) {
            w.rotation.x += activeVehicle.speed * dt * 2.4;
          }
          for (const p of activeVehicle.frontWheelPivots) {
            p.rotation.y = -activeVehicle.steerAngle * 0.42;
          }
        }

        if (activeVehicle.steeringWheel) {
          activeVehicle.steeringWheel.rotation.z = -activeVehicle.steerAngle * 0.65;
        }

        activeVehicle.x = nx;
        activeVehicle.z = nz;
        if (!activeVehicle.seatMount) {
          playerRig.group.position.set(nx, activeVehicle.kind === 'boat' ? 0.4 : 0, nz);
        } else {
          animateHumanRig(playerRig, false, 0, 0, elapsedTotal, dt, 0, false, 0, {
            active: true,
            steer: activeVehicle.steerAngle,
            speedRatio: Math.abs(activeVehicle.speed) / activeVehicle.maxSpeed,
          });
        }

        // Smooth camera follow behind moving vehicle unless mouse-dragging
        if (!draggingLook && Math.abs(activeVehicle.speed) > 1.0) {
          const desiredCamYaw = activeVehicle.yaw + Math.PI;
          let diff = desiredCamYaw - camYaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          camYaw += diff * Math.min(1, dt * 3.5);
        }

        const mph = Math.round(Math.abs(activeVehicle.speed) * 2.4);
        if (mph !== lastMphUi) {
          lastMphUi = mph;
          setSpeedMph(mph);
        }

        focusX = nx;
        focusY = activeVehicle.kind === 'boat' ? 0.35 : 0.7;
        focusZ = nz;
      } else {
        // ON-FOOT WALKING & SPRINTING
        const sprinting = Boolean(k.sprint);
        const speed = sprinting ? 11.2 : 7.0;

        const isMoving = Math.abs(moveForward) > 0.05 || Math.abs(moveRight) > 0.05;
        if (isMoving) {
          const len = Math.hypot(moveForward, moveRight);
          const nf = moveForward / len;
          const nr = moveRight / len;

          if (!draggingLook && Math.abs(nr) > 0.1) {
            camYaw -= nr * 0.72 * dt;
          }

          const sinY = Math.sin(camYaw);
          const cosY = Math.cos(camYaw);
          const worldDx = (-sinY * nf + cosY * nr) * speed * dt;
          const worldDz = (-cosY * nf - sinY * nr) * speed * dt;

          let nx = THREE.MathUtils.clamp(playerRig.group.position.x + worldDx, -76, 122);
          let nz = THREE.MathUtils.clamp(playerRig.group.position.z + worldDz, -66, 42);

          // Stay on land or pier/marina slip
          const onMarinaSlip = nx >= 2.1 && nx <= 7.2 && nz >= 26.2 && nz <= 29.8;
          const onMainPier = Math.abs(nx) <= 2.45 && nz > 20;
          if (nz > 20 && !onMainPier && !onMarinaSlip) {
            if (playerRig.group.position.z <= 20) {
              nz = 20;
            } else if (playerRig.group.position.z >= 26.2 && playerRig.group.position.z <= 29.8 && nx > 2.45) {
              nx = THREE.MathUtils.clamp(nx, -2.45, 7.1);
            } else {
              nx = THREE.MathUtils.clamp(nx, -2.45, 2.45);
            }
          }

          const prevX = playerRig.group.position.x;
          const prevZ = playerRig.group.position.z;
          [nx, nz] = resolveCollisions(nx, nz, 0.4);
          playerRig.group.position.x = nx;
          playerRig.group.position.z = nz;

          const targetYaw = Math.atan2(worldDx, worldDz);
          let diff = targetYaw - playerRig.group.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          playerRig.group.rotation.y += diff * Math.min(1, dt * 12);

          const movedDist = Math.hypot(nx - prevX, nz - prevZ);
          walkPhase += Math.max(movedDist * 1.65, dt * (sprinting ? 10.5 : 7.5));
        }

        // Jump Physics
        const onPier = playerRig.group.position.z > 19.6 && Math.abs(playerRig.group.position.x) <= 7.2;
        const pierElevation = onPier ? 0.35 : 0;
        if ((k.jump || v.jump) && playerY <= pierElevation + 0.02) {
          playerVy = 6.8;
          v.jump = false;
        }
        playerVy -= 19.5 * dt;
        playerY += playerVy * dt;
        if (playerY < pierElevation) {
          playerY = pierElevation;
          playerVy = 0;
        }
        playerRig.group.position.y = playerY;

        const isAirborne = playerY > pierElevation + 0.06;
        animateHumanRig(
          playerRig,
          isMoving,
          sprinting ? 1 : 0,
          walkPhase,
          elapsedTotal,
          dt,
          0,
          isAirborne,
          playerVy,
        );

        focusX = playerRig.group.position.x;
        focusY = playerY;
        focusZ = playerRig.group.position.z;

        // Check nearby drivable vehicle
        let bestVeh: DrivableVehicleInfo | null = null;
        let bestDist = 4.5;
        for (const veh of drivableVehicles) {
          const checkX = veh.kind === 'boat' ? (veh.dockX ?? veh.x) : veh.x;
          const checkZ = veh.kind === 'boat' ? (veh.dockZ ?? veh.z) : veh.z;
          const d = Math.hypot(checkX - focusX, checkZ - focusZ);
          const dReal = Math.hypot(veh.x - focusX, veh.z - focusZ);
          const minD = Math.min(d, dReal);
          if (minD < bestDist) {
            bestDist = minD;
            bestVeh = veh;
          }
        }
        if ((bestVeh?.id ?? null) !== nearbyVehicleId) {
          nearbyVehicleId = bestVeh?.id ?? null;
          setNearbyVehicle(bestVeh ? { id: bestVeh.id, name: bestVeh.name, kind: bestVeh.kind } : null);
        }
      }

      // Persist player world coords & stream live position over WebSocket
      const worldX = activeVehicle ? activeVehicle.x : playerRig.group.position.x;
      const worldY = activeVehicle ? (activeVehicle.kind === 'boat' ? 0.14 : 0) : playerRig.group.position.y;
      const worldZ = activeVehicle ? activeVehicle.z : playerRig.group.position.z;
      const worldYaw = activeVehicle ? activeVehicle.yaw : playerRig.group.rotation.y;

      playerStateRef.current.x = worldX;
      playerStateRef.current.z = worldZ;
      playerStateRef.current.yaw = worldYaw;
      playerStateRef.current.camYaw = camYaw;

      const localMoving = activeVehicle
        ? Math.abs(activeVehicle.speed) > 0.4
        : Math.abs(moveForward) > 0.05 || Math.abs(moveRight) > 0.05;
      multiplayerRef.current.sendMove({
        x: worldX,
        y: worldY,
        z: worldZ,
        yaw: worldYaw,
        moving: localMoving,
        drivingKind: activeVehicle ? activeVehicle.kind : null,
      });

      // Animate Pavilion Sculpture, Airport Radar, House Pad, Sky Airliner & Tokens
      statuePhone.rotation.y = elapsedTotal * 0.85;
      airportAssets.atcRadar.rotation.y = elapsedTotal * 1.45;
      houseAssets.welcomeRing.rotation.z = elapsedTotal * 0.6;
      const gateDist = Math.hypot(focusX - 80.2, focusZ - -16.5);
      const isNearGate = gateDist < 5.0 && !activeVehicle;
      if (isNearGate !== nearAirportGateRef.current) {
        nearAirportGateRef.current = isNearGate;
        setNearAirportGate(isNearGate);
      }
      const inOrAtHome =
        !activeVehicle &&
        ((Math.hypot(focusX - 28, focusZ - -2.2) < 3.2) ||
          (focusX > 24 && focusX < 32 && focusZ > -10.4 && focusZ < -3.3));
      if (inOrAtHome !== nearHomePadRef.current) {
        nearHomePadRef.current = inOrAtHome;
        setNearHomePad(inOrAtHome);
      }

      // Overhead Sky Airliner Flight Loop
      const pt = elapsedTotal * 0.16;
      const px = Math.cos(pt) * 86;
      const pz = Math.sin(pt) * 62 - 8;
      const pvx = -Math.sin(pt) * 86;
      const pvz = Math.cos(pt) * 62;
      skyPlane.position.set(px, 34 + Math.sin(elapsedTotal * 0.5) * 2.2, pz);
      skyPlane.rotation.set(0, Math.atan2(pvx, pvz), -0.18);

      for (let i = tokenMeshes.length - 1; i >= 0; i--) {
        const tk = tokenMeshes[i];
        tk.mesh.rotation.y = elapsedTotal * 2.2;
        tk.mesh.position.y = 1.05 + Math.sin(elapsedTotal * 3 + i) * 0.16;
        const dist = Math.hypot(tk.baseX - focusX, tk.baseZ - focusZ);
        if (dist < 2.1) {
          scene.remove(tk.mesh);
          tokenMeshes.splice(i, 1);
          playerStateRef.current.tokensCollected.push(tk.id);
          setTokensCount(playerStateRef.current.tokensCollected.length);
          playTapSound(osRef.current.state.settings.volume, osRef.current.state.settings.muted);
          showToast(`Collected OOTBLUE Token (${playerStateRef.current.tokensCollected.length}/${TOKEN_COORDS.length})`);
        }
      }

      // Animate Bay Boats
      for (const b of aiBoats) {
        const t = elapsedTotal * b.speed + b.phase;
        const bx = b.cx + Math.cos(t) * b.rx;
        const bz = b.cz + Math.sin(t) * b.rz;
        const vx = -Math.sin(t) * b.rx * b.speed;
        const vz = Math.cos(t) * b.rz * b.speed;
        b.group.position.set(bx, -0.26 + Math.sin(elapsedTotal * 2.2 + b.phase) * 0.12, bz);
        b.group.rotation.y = Math.atan2(vx, vz);
        b.group.rotation.z = Math.sin(elapsedTotal * 1.9 + b.phase) * 0.04;
      }

      // Animate AI Ring-Road Traffic
      for (const car of aiTraffic) {
        car.dist = (car.dist + car.speed * dt) % totalLoopLen;
        let rem = car.dist;
        for (const seg of loopSegs) {
          if (rem <= seg.len) {
            const frac = rem / seg.len;
            const cx = seg.ax + (seg.bx - seg.ax) * frac;
            const cz = seg.az + (seg.bz - seg.az) * frac;
            car.rig.group.position.set(cx, 0, cz);
            car.rig.group.rotation.y = Math.atan2(seg.bx - seg.ax, seg.bz - seg.az);
            for (const w of car.rig.wheels) w.rotation.x += car.speed * dt * 2.3;
            break;
          }
          rem -= seg.len;
        }
      }

      // Animate NPCs & Proximity
      let closestNpc: NpcDefinition | null = null;
      let closestDist = activeVehicle ? 0 : 3.6;

      for (const npc of npcActors) {
        const t = elapsedTotal * 0.65 + npc.phase;
        const targetX = npc.def.homeX + Math.cos(t) * npc.def.patrolRadius;
        const targetZ = npc.def.homeZ + Math.sin(t) * npc.def.patrolRadius;

        const distToPlayer = Math.hypot(
          npc.rig.group.position.x - focusX,
          npc.rig.group.position.z - focusZ,
        );

        if (!activeVehicle && distToPlayer < closestDist) {
          closestDist = distToPlayer;
          closestNpc =
            npcCatalogRef.current.find((item) => item.id === npc.def.id) ?? npc.def;
        }

        if (!activeVehicle && distToPlayer < 4.0) {
          const targetYaw = Math.atan2(
            focusX - npc.rig.group.position.x,
            focusZ - npc.rig.group.position.z,
          );
          let nDiff = targetYaw - npc.rig.group.rotation.y;
          while (nDiff > Math.PI) nDiff -= Math.PI * 2;
          while (nDiff < -Math.PI) nDiff += Math.PI * 2;
          npc.rig.group.rotation.y += nDiff * Math.min(1, dt * 8);
          animateHumanRig(npc.rig, false, 0, npc.walkPhase, elapsedTotal, dt, npc.phase);
        } else {
          const dx = targetX - npc.rig.group.position.x;
          const dz = targetZ - npc.rig.group.position.z;
          const stepX = dx * Math.min(1, dt * 1.5);
          const stepZ = dz * Math.min(1, dt * 1.5);
          const stepDist = Math.hypot(stepX, stepZ);
          const npcSpeed = stepDist / Math.max(dt, 0.001);

          if (npcSpeed >= 0.42) {
            npc.rig.group.position.x += stepX;
            npc.rig.group.position.z += stepZ;
            const targetYaw = Math.atan2(dx, dz);
            let nDiff = targetYaw - npc.rig.group.rotation.y;
            while (nDiff > Math.PI) nDiff -= Math.PI * 2;
            while (nDiff < -Math.PI) nDiff += Math.PI * 2;
            npc.rig.group.rotation.y += nDiff * Math.min(1, dt * 8);
            npc.walkPhase += stepDist * 3.2;
            animateHumanRig(npc.rig, true, 0, npc.walkPhase, elapsedTotal, dt, npc.phase);
          } else {
            animateHumanRig(npc.rig, false, 0, npc.walkPhase, elapsedTotal, dt, npc.phase);
          }
        }
      }

      if (nearbyNpcRef.current?.id !== closestNpc?.id) {
        nearbyNpcRef.current = closestNpc;
        setNearbyNpc(closestNpc);
      }
      if (activeNpcRef.current && closestNpc?.id !== activeNpcRef.current.id) {
        const activeActor = npcActors.find((n) => n.def.id === activeNpcRef.current?.id);
        if (activeActor) {
          const d = Math.hypot(
            activeActor.rig.group.position.x - focusX,
            activeActor.rig.group.position.z - focusZ,
          );
          if (d > 4.6) {
            setActiveNpc(null);
            setNpcChatError(null);
          }
        }
      }

      // Sync & animate Remote WebSocket Players in this country
      const remoteSnapshot = multiplayerRef.current.remotePlayersRef.current;
      for (const [rid, actor] of remoteActors.entries()) {
        const rp = remoteSnapshot.get(rid);
        if (!rp || rp.country !== currentCountry) {
          disposeRemoteActor(actor);
          remoteActors.delete(rid);
        }
      }
      remoteSnapshot.forEach((rp, rid) => {
        if (rp.country !== currentCountry) return;
        let actor = remoteActors.get(rid);
        if (actor && (actor.name !== rp.name || actor.color !== rp.color)) {
          disposeRemoteActor(actor);
          remoteActors.delete(rid);
          actor = undefined;
        }
        if (!actor) {
          const rig = createRealisticHumanMesh({
            shirtColor: rp.color,
            hairColor: 0x1e293b,
            skinColor: 0xe8b896,
            hairStyle: 'short',
            hasJacket: true,
            jacketColor: rp.color,
          });
          rig.group.position.set(rp.x, rp.y, rp.z);
          rig.group.rotation.y = rp.yaw;
          const hex = `#${rp.color.toString(16).padStart(6, '0')}`;
          const { sprite, texture } = createNameTagSprite(rp.name, hex);
          rig.group.add(sprite);
          scene.add(rig.group);
          actor = {
            rig,
            sprite,
            labelTex: texture,
            name: rp.name,
            color: rp.color,
            walkPhase: 0,
          };
          remoteActors.set(rid, actor);
        }
        actor.rig.group.position.x = THREE.MathUtils.damp(actor.rig.group.position.x, rp.x, 12, dt);
        actor.rig.group.position.y = THREE.MathUtils.damp(actor.rig.group.position.y, rp.y, 12, dt);
        actor.rig.group.position.z = THREE.MathUtils.damp(actor.rig.group.position.z, rp.z, 12, dt);
        let rDiff = rp.yaw - actor.rig.group.rotation.y;
        while (rDiff > Math.PI) rDiff -= Math.PI * 2;
        while (rDiff < -Math.PI) rDiff += Math.PI * 2;
        actor.rig.group.rotation.y += rDiff * Math.min(1, dt * 12);

        if (rp.moving) {
          actor.walkPhase += dt * 9.5;
          animateHumanRig(actor.rig, true, 0.2, actor.walkPhase, elapsedTotal, dt, 0);
        } else {
          animateHumanRig(actor.rig, false, 0, actor.walkPhase, elapsedTotal, dt, 0);
        }
      });

      // Keep sun shadow frustum centered near the player for crisp shadows everywhere
      if (sun.castShadow) {
        const snapX = Math.round(focusX * 2) / 2;
        const snapZ = Math.round(focusZ * 2) / 2;
        sun.target.position.set(snapX, 0, snapZ);
        sun.position.set(snapX + 45, 70, snapZ + 35);
      }

      // Advance Ocean Wave Shader & Dynamic Weather Atmosphere
      waterTimeUniform.value = elapsedTotal;
      weatherSys.update(dt, elapsedTotal, focusX, focusZ, weatherRef.current, {
        baseSkyColor: pal.skyColor,
        baseFogColor: pal.fogColor,
        baseGroundColor: pal.groundColor,
        sun,
        hemi,
        fill,
        scene,
        skyRig,
        asphaltMat,
        plazaMat,
        meadowMat,
        waterChopUniform,
      });

      // Third-Person Chase Camera
      const targetCamX = focusX + Math.sin(camYaw) * Math.cos(camPitch) * camDist;
      const targetCamY = focusY + 1.8 + Math.sin(camPitch) * camDist;
      const targetCamZ = focusZ + Math.cos(camYaw) * Math.cos(camPitch) * camDist;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 12, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 12, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 12, dt);
      camera.lookAt(focusX, focusY + 1.4, focusZ);

      renderer.render(scene, camera);
      frameId = isSoftwareGl ? window.setTimeout(tick, 32) : requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearKeys);
      document.removeEventListener('visibilitychange', clearKeys);
      for (const actor of remoteActors.values()) {
        disposeRemoteActor(actor);
      }
      remoteActors.clear();
      weatherSys.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m?.dispose());
        }
      });
      grassTex.dispose();
      asphaltTex.dispose();
      plazaTex.dispose();
      woodTex.dispose();
      skyWinTex.dispose();
      warmWinTex.dispose();
      airportAssets.signTex.dispose();
      houseAssets.houseSignTex.dispose();
      scene.environment?.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [playerStateRef, currentCountry]);

  const unreadCount = os.state.notifications.filter((n) => !n.read).length;
  const readyTicketsFromHere = os.state.boardingPasses.filter(
    (bp) => bp.status === 'ready' && bp.fromCountry === currentCountry,
  );
  const sameCountryPlayers = multiplayer.onlinePlayers.filter(
    (p) => p.country === currentCountry,
  );

  const setVirtualAxis = (x: number, y: number) => {
    virtualInputRef.current.x = x;
    virtualInputRef.current.y = y;
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mountRef} tabIndex={0} className="w-full h-full outline-none" />

      {/* Top-Left World Header, Fast Travel & Online Counter */}
      <div className="absolute top-4 left-5 z-10 space-y-1.5">
        <h1 className="pointer-events-none font-display text-lg font-bold text-slate-900 drop-shadow-[0_1px_4px_rgba(255,255,255,0.85)]">
          {activeCountryObj.city} · {activeCountryObj.name} ({activeCountryObj.airportCode})
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="pointer-events-none flex items-center gap-3 text-xs font-medium text-slate-800 bg-white/85 px-3 py-1.5 rounded-xl border border-slate-900/10 shadow-sm w-fit">
            <span className="flex items-center gap-1 font-mono tabular-nums">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Tokens {tokensCount}/{TOKEN_COORDS.length}
            </span>
            <span className="text-slate-400">·</span>
            <span>{activeCountryObj.landmarkName}</span>
          </div>
          <button
            onClick={() => jumpToHomeRef.current?.()}
            className="px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-white text-xs font-semibold border border-white/15 shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
            title="Fast travel to Your House"
          >
            <Home className="w-3.5 h-3.5 text-sky-400" />
            <span>My House</span>
          </button>
          <button
            onClick={() => jumpToAirportRef.current?.()}
            className="px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-white text-xs font-semibold border border-white/15 shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
            title="Fast travel to Airport Passport Control"
          >
            <PlaneTakeoff className="w-3.5 h-3.5 text-sky-400" />
            <span>Airport</span>
          </button>
          <button
            onClick={() => {
              setShowMultiplayerPanel((v) => !v);
              setShowAvatarPanel(false);
              setShowNpcApiPanel(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-white text-xs font-semibold border border-white/15 shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
            title="Online Players & Live World Chat"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {multiplayer.connected
                ? `Online (${multiplayer.onlinePlayers.length + 1})`
                : 'Connecting...'}
            </span>
          </button>

          <button
            onClick={() => {
              setShowAvatarPanel((v) => !v);
              setShowMultiplayerPanel(false);
              setShowNpcApiPanel(false);
              setShowWeatherMenu(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 transition ${
              showAvatarPanel
                ? 'bg-sky-500 text-slate-950 border-sky-400'
                : 'bg-slate-950/85 hover:bg-slate-900 text-white border-white/15'
            }`}
            title="Customize your 3D Avatar"
          >
            <User className={`w-3.5 h-3.5 ${showAvatarPanel ? 'text-slate-950' : 'text-sky-400'}`} />
            <span>Avatar</span>
          </button>

          <button
            onClick={() => {
              setShowNpcApiPanel((v) => !v);
              setShowAvatarPanel(false);
              setShowMultiplayerPanel(false);
              setShowWeatherMenu(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 transition ${
              showNpcApiPanel
                ? 'bg-sky-500 text-slate-950 border-sky-400'
                : 'bg-slate-950/85 hover:bg-slate-900 text-white border-white/15'
            }`}
            title="Test REST & AI NPC Endpoints"
          >
            <Terminal className={`w-3.5 h-3.5 ${showNpcApiPanel ? 'text-slate-950' : 'text-sky-400'}`} />
            <span>NPC API</span>
          </button>

          {/* Dynamic Weather Control */}
          <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowWeatherMenu((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-white text-xs font-semibold border border-white/15 shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
              title="Change World Weather"
            >
              {weather === 'clear' && <Sun className="w-3.5 h-3.5 text-amber-300" />}
              {weather === 'cloudy' && <Cloud className="w-3.5 h-3.5 text-slate-300" />}
              {weather === 'rain' && <CloudRain className="w-3.5 h-3.5 text-sky-400" />}
              {weather === 'storm' && <CloudLightning className="w-3.5 h-3.5 text-yellow-300" />}
              {weather === 'snow' && <CloudSnow className="w-3.5 h-3.5 text-sky-200" />}
              <span>
                {WEATHER_OPTIONS.find((w) => w.id === weather)?.label ?? 'Weather'}
                {autoWeather ? ' · Auto' : ''}
              </span>
            </button>
            {showWeatherMenu && (
              <div className="absolute left-0 mt-1.5 w-48 rounded-2xl bg-slate-950/95 text-white border border-white/15 p-1.5 shadow-2xl z-30 space-y-1">
                {WEATHER_OPTIONS.map((opt) => {
                  const active = weather === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setWeather(opt.id);
                        setShowWeatherMenu(false);
                        showToast(`Weather changed to ${opt.label}`);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-medium flex items-center gap-2 transition ${
                        active
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      {opt.id === 'clear' && <Sun className="w-3.5 h-3.5" />}
                      {opt.id === 'cloudy' && <Cloud className="w-3.5 h-3.5" />}
                      {opt.id === 'rain' && <CloudRain className="w-3.5 h-3.5" />}
                      {opt.id === 'storm' && <CloudLightning className="w-3.5 h-3.5" />}
                      {opt.id === 'snow' && <CloudSnow className="w-3.5 h-3.5" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
                <div className="border-t border-white/10 pt-1 mt-1">
                  <button
                    onClick={() => setAutoWeather((v) => !v)}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition ${
                      autoWeather
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span>Auto Cycle</span>
                    <span className="text-[10px] font-mono">{autoWeather ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top-Right Controls Hint */}
      <div className="hidden sm:block absolute top-4 right-5 z-10 pointer-events-none bg-slate-950/75 text-white text-xs px-3.5 py-2 rounded-xl border border-white/15">
        WASD Walk/Drive · Drag Look · E Talk · F Vehicle · G Passport Control
      </div>

      {/* Live 3D Avatar Customizer */}
      {showAvatarPanel && (
        <AvatarCustomizerPanel
          value={avatarOpts}
          onChange={handleAvatarChange}
          onClose={() => setShowAvatarPanel(false)}
        />
      )}

      {/* Live NPC REST & AI API Tester */}
      {showNpcApiPanel && (
        <NpcApiTesterPanel
          npcs={npcCatalog}
          currentCountry={currentCountry}
          playerName={os.state.settings.deviceName}
          sessionId={npcSessionIdRef.current}
          onNpcCatalogUpdated={refreshNpcCatalog}
          onClose={() => setShowNpcApiPanel(false)}
        />
      )}

      {/* Collapsible Live Multiplayer Players & Chat Panel */}
      {showMultiplayerPanel && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-28 right-5 z-20 w-[min(320px,90vw)] bg-slate-950/92 text-white rounded-2xl border border-white/15 p-3 shadow-2xl space-y-2.5"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">
                World Multiplayer · {multiplayer.onlinePlayers.length + 1} Online
              </span>
            </div>
            <button
              onClick={() => setShowMultiplayerPanel(false)}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20"
              aria-label="Close multiplayer panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-24 overflow-y-auto space-y-1 text-[11px]">
            <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-sky-500/15 border border-sky-400/25">
              <span className="font-semibold truncate">
                {os.state.settings.deviceName} (You)
              </span>
              <span className="font-mono text-sky-300">{activeCountryObj.airportCode}</span>
            </div>
            {multiplayer.onlinePlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/5"
              >
                <span className="truncate">{p.name}</span>
                <span className="font-mono text-slate-400">
                  {COUNTRY_MAP[p.country]?.airportCode ?? p.country}
                </span>
              </div>
            ))}
            {sameCountryPlayers.length === 0 && (
              <p className="text-[10px] text-slate-400 px-1 pt-0.5">
                Open another tab to see live players walk around together!
              </p>
            )}
          </div>

          <div className="border-t border-white/10 pt-2 space-y-2">
            <div className="max-h-28 overflow-y-auto space-y-1 text-[11px]">
              {multiplayer.chatMessages.length === 0 ? (
                <p className="text-[10px] text-slate-400">No world chat messages yet.</p>
              ) : (
                multiplayer.chatMessages.slice(-8).map((m) => (
                  <div key={m.id} className="leading-snug">
                    <span className="font-semibold text-sky-300">{m.name}: </span>
                    <span className="text-slate-200">{m.text}</span>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatDraft.trim()) return;
                multiplayer.sendChat(chatDraft);
                setChatDraft('');
              }}
              className="flex items-center gap-1.5"
            >
              <input
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Say hi to online players..."
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-xs outline-none focus:border-sky-400"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 transition"
                aria-label="Send chat message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Center Toast */}
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-slate-950/90 text-white text-xs font-semibold border border-sky-400/30 shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Your House Welcome Mat Prompt */}
      {nearHomePad && !showFlightModal && !activeNpc && !drivingVehicle && !nearbyVehicle && !nearAirportGate && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => {
              os.updateSettings({ batteryLevel: 100 });
              playTapSound(os.state.settings.volume, os.state.settings.muted);
              showToast('Rested at Home · OOTBLUE 1 charged to 100%!');
            }}
            className="px-4 py-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-900 text-white border border-sky-400/40 shadow-xl flex items-center gap-2 text-xs font-semibold whitespace-nowrap shrink-0 transition"
          >
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
            <span>Home · Recharge OOTBLUE 1 to 100% (H)</span>
          </button>
        </div>
      )}

      {/* Airport Passport Control Prompt */}
      {nearAirportGate && !showFlightModal && !activeNpc && !drivingVehicle && !nearbyVehicle && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => setShowFlightModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-xl flex items-center gap-2 text-xs font-bold whitespace-nowrap shrink-0 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Passport &amp; Ticket Control (G)</span>
          </button>
        </div>
      )}

      {/* Airport Passport & Ticket Inspection Checkpoint Modal */}
      {showFlightModal && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto z-30 w-[min(460px,92vw)] bg-slate-950/95 text-white rounded-2xl border border-white/15 p-4 shadow-2xl space-y-3"
        >
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <PlaneTakeoff className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold">
                  Officer Kenji · Passport Control ({activeCountryObj.airportCode})
                </h2>
                <p className="text-[11px] text-slate-400">
                  {activeCountryObj.airportName} · Boarding Checkpoint
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFlightModal(false)}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20"
              aria-label="Close passport control"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step 1: Passport Check (Always Present & Valid) */}
          <div className="p-3 rounded-xl bg-emerald-500/12 border border-emerald-400/35 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  OOTBLUE Citizen Passport · VERIFIED
                </p>
                <p className="text-[11px] text-slate-300">
                  Holder: {os.state.settings.deviceName} · ID: OBL-849201
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              VALID
            </span>
          </div>

          {/* Step 2: Ticket Verification from Phone Airport App */}
          {readyTicketsFromHere.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-500/12 border border-amber-400/35 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-amber-300">
                    Cannot Board Yet — Flight Ticket Required
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    &ldquo;Your Passport is valid, but I don&apos;t see a flight ticket on your
                    phone! Open the <strong>Airport</strong> app on your OOTBLUE 1 to get a flight
                    ticket first.&rdquo;
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFlightModal(false);
                  onOpenAirportApp();
                }}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open Phone → Airport App</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-0.5">
              <p className="text-xs text-emerald-300 font-semibold">
                &ldquo;Passport and flight ticket verified! Ready for boarding:&rdquo;
              </p>
              {readyTicketsFromHere.map((bp) => {
                const dest = COUNTRY_MAP[bp.toCountry];
                if (!dest) return null;
                return (
                  <div
                    key={bp.id}
                    className="p-3 rounded-xl bg-slate-900/95 border border-sky-400/35 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                          {bp.flightNo}
                        </span>
                        <span className="text-xs font-bold truncate">
                          {dest.name} ({dest.airportCode})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Compass className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="truncate">
                          {bp.gate} · Seat {bp.seat} · {dest.landmarkName}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowFlightModal(false);
                        onBoardTicket(bp.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 transition"
                    >
                      Board Flight
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Vehicle Interaction / Driving HUD */}
      {drivingVehicle ? (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 bg-slate-950/90 text-white px-4 py-2 rounded-2xl border border-sky-400/40 shadow-xl">
          {drivingVehicle.kind === 'boat' ? (
            <Anchor className="w-4 h-4 text-sky-400" />
          ) : (
            <Car className="w-4 h-4 text-sky-400" />
          )}
          <span className="text-xs font-semibold whitespace-nowrap">{drivingVehicle.name}</span>
          <span className="text-xs font-mono tabular-nums text-sky-300 bg-white/10 px-2 py-0.5 rounded-lg">
            {speedMph} MPH
          </span>
          <button
            onClick={() => toggleVehicleRef.current?.()}
            className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold whitespace-nowrap shrink-0 transition"
          >
            Exit (F)
          </button>
        </div>
      ) : nearbyVehicle ? (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => toggleVehicleRef.current?.()}
            className="px-4 py-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-900 text-white border border-sky-400/40 shadow-xl flex items-center gap-2 text-xs font-semibold whitespace-nowrap shrink-0 transition"
          >
            {nearbyVehicle.kind === 'boat' ? (
              <Anchor className="w-4 h-4 text-sky-400" />
            ) : (
              <Car className="w-4 h-4 text-sky-400" />
            )}
            <span>
              {nearbyVehicle.kind === 'boat' ? 'Board' : 'Drive'} {nearbyVehicle.name} (F)
            </span>
          </button>
        </div>
      ) : null}

      {/* Nearby NPC Interaction Prompt */}
      {nearbyNpc && !activeNpc && !drivingVehicle && !nearbyVehicle && !nearAirportGate && !showFlightModal && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => {
              if (nearbyNpc.id === 'kenji') {
                setShowFlightModal(true);
              } else {
                setActiveNpc(nearbyNpc);
                setNpcChatError(null);
              }
            }}
            className="px-4 py-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-900 text-white border border-sky-400/40 shadow-xl flex items-center gap-2 text-xs font-semibold whitespace-nowrap shrink-0 transition"
          >
            <MessageCircle className="w-4 h-4 text-sky-400" />
            <span>
              {nearbyNpc.id === 'kenji'
                ? 'Check Passport & Ticket with Officer Kenji (E)'
                : `Talk to ${nearbyNpc.name} (E)`}
            </span>
          </button>
        </div>
      )}

      {/* Active NPC Dialogue Modal with Live AI Chat */}
      {activeNpc && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[min(460px,92vw)] bg-slate-950/95 text-white rounded-2xl border border-white/15 p-4 shadow-2xl space-y-3"
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-sky-400">{activeNpc.name}</h2>
              <p className="text-[11px] text-slate-400">
                {activeNpc.role} · AI Dialogue API
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {(npcMessagesById[activeNpc.id]?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => resetNpcConversation(activeNpc.id)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition"
                  title="Reset conversation"
                  aria-label="Reset NPC conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setActiveNpc(null);
                  setNpcChatError(null);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
                aria-label="Close dialogue"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation History */}
          <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs leading-relaxed text-slate-200">
              {activeNpc.greeting}
            </div>
            {(npcMessagesById[activeNpc.id] ?? []).map((turn, idx) => (
              <div
                key={`${activeNpc.id}-msg-${idx}`}
                className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  turn.role === 'user'
                    ? 'ml-8 bg-sky-500/20 border border-sky-400/30 text-sky-100'
                    : 'mr-6 bg-white/5 border border-white/10 text-slate-200'
                }`}
              >
                <span className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                  {turn.role === 'user' ? os.state.settings.deviceName : activeNpc.name}
                </span>
                <span>{turn.text}</span>
              </div>
            ))}
            {npcChatLoading && (
              <div className="mr-6 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-slate-400">
                {activeNpc.name} is thinking...
              </div>
            )}
            <div ref={npcThreadEndRef} />
          </div>

          {npcChatError && (
            <div className="rounded-xl bg-amber-500/15 border border-amber-400/35 px-3 py-2 text-[11px] text-amber-200 flex items-center justify-between gap-2">
              <span className="leading-snug">{npcChatError}</span>
              <button
                type="button"
                onClick={() => {
                  const turns = npcMessagesById[activeNpc.id] ?? [];
                  const lastUser = [...turns].reverse().find((t) => t.role === 'user');
                  if (lastUser) sendNpcChatMessage(lastUser.text);
                }}
                className="px-2 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-100 font-semibold shrink-0 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* Quick Actions (including Phone integration) */}
          {activeNpc.lines.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeNpc.lines.map((line) => (
                <button
                  key={line.label}
                  type="button"
                  onClick={() => {
                    setNpcMessagesById((prev) => ({
                      ...prev,
                      [activeNpc.id]: [
                        ...(prev[activeNpc.id] ?? []),
                        { role: 'user', text: line.label },
                        { role: 'npc', text: line.reply },
                      ],
                    }));
                    if (line.sendToPhone) {
                      os.receiveNpcMessage(activeNpc.name, line.sendToPhone);
                      showToast(`New message from ${activeNpc.name} on your OOTBLUE 1`);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-sky-600/25 hover:bg-sky-600/40 border border-sky-400/30 text-[11px] font-medium text-sky-200 whitespace-nowrap shrink-0 transition"
                >
                  {line.label}
                </button>
              ))}
            </div>
          )}

          {/* Freeform AI Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendNpcChatMessage();
            }}
            className="flex items-center gap-2 pt-1 border-t border-white/10"
          >
            <input
              value={npcChatInput}
              onChange={(e) => setNpcChatInput(e.target.value)}
              placeholder={`Ask ${activeNpc.name} anything...`}
              maxLength={400}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder:text-slate-500 outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              disabled={npcChatLoading || !npcChatInput.trim()}
              className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* Bottom-Left Touch / Mouse Walk & Drive Pad */}
      <div className="absolute bottom-5 left-5 z-20 flex items-end gap-2.5 select-none touch-none">
        <div className="grid grid-cols-3 gap-1.5 w-32">
          <div />
          <button
            onPointerDown={() => setVirtualAxis(0, 1)}
            onPointerUp={() => setVirtualAxis(0, 0)}
            onPointerCancel={() => setVirtualAxis(0, 0)}
            onPointerLeave={() => setVirtualAxis(0, 0)}
            className="h-10 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white border border-white/15 flex items-center justify-center active:bg-sky-600"
            aria-label="Walk Forward"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div />
          <button
            onPointerDown={() => setVirtualAxis(-1, 0)}
            onPointerUp={() => setVirtualAxis(0, 0)}
            onPointerCancel={() => setVirtualAxis(0, 0)}
            onPointerLeave={() => setVirtualAxis(0, 0)}
            className="h-10 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white border border-white/15 flex items-center justify-center active:bg-sky-600"
            aria-label="Walk Left"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onPointerDown={() => setVirtualAxis(0, -1)}
            onPointerUp={() => setVirtualAxis(0, 0)}
            onPointerCancel={() => setVirtualAxis(0, 0)}
            onPointerLeave={() => setVirtualAxis(0, 0)}
            className="h-10 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white border border-white/15 flex items-center justify-center active:bg-sky-600"
            aria-label="Walk Backward"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onPointerDown={() => setVirtualAxis(1, 0)}
            onPointerUp={() => setVirtualAxis(0, 0)}
            onPointerCancel={() => setVirtualAxis(0, 0)}
            onPointerLeave={() => setVirtualAxis(0, 0)}
            className="h-10 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white border border-white/15 flex items-center justify-center active:bg-sky-600"
            aria-label="Walk Right"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onPointerDown={() => {
            virtualInputRef.current.jump = true;
          }}
          onPointerUp={() => {
            virtualInputRef.current.jump = false;
          }}
          onPointerCancel={() => {
            virtualInputRef.current.jump = false;
          }}
          onPointerLeave={() => {
            virtualInputRef.current.jump = false;
          }}
          className="h-10 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white border border-white/15 text-xs font-semibold whitespace-nowrap shrink-0 active:bg-sky-600"
        >
          {drivingVehicle ? 'Brake' : 'Jump'}
        </button>
      </div>

      {/* Prominent "Phone" Button (Bottom-Right) */}
      <div className="absolute bottom-5 right-5 z-20">
        <button
          onClick={() => {
            setVirtualAxis(0, 0);
            onOpenPhone();
          }}
          className="relative px-5 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-sm shadow-xl shadow-sky-950/40 flex items-center gap-2.5 whitespace-nowrap shrink-0 active:scale-95 transition"
        >
          <Smartphone className="w-5 h-5" />
          <span>Phone</span>
          {unreadCount > 0 && (
            <span className="ml-0.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
