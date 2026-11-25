import * as THREE from 'three';
import { CountryDestination } from '../../os/countries';
import { applyRealisticWaterShader } from './worldWeatherAndSky';

export function buildCoastalTerrainAndPier(
  scene: THREE.Scene,
  pal: CountryDestination['palette'],
  textures: {
    grassTex: THREE.CanvasTexture;
    woodTex: THREE.CanvasTexture;
  },
  waterTimeUniform: { value: number },
  waterChopUniform: { value: number },
): {
  meadowMat: THREE.MeshStandardMaterial;
  pierWoodMat: THREE.MeshStandardMaterial;
} {
  // 1. Land Meadow strictly north of shoreline (z <= 20.0) so grass NEVER pokes through ocean!
  const meadowMat = new THREE.MeshStandardMaterial({
    color: pal.groundColor,
    map: textures.grassTex,
    roughness: 0.92,
  });
  const meadow = new THREE.Mesh(new THREE.PlaneGeometry(480, 260), meadowMat);
  meadow.rotation.x = -Math.PI / 2;
  meadow.position.set(0, -0.02, -110);
  meadow.receiveShadow = true;
  scene.add(meadow);

  // 2. Deep Sandy Ocean Seabed under water (z >= 19.5)
  const seabedMat = new THREE.MeshStandardMaterial({
    color: 0xcab993,
    roughness: 0.95,
  });
  const seabed = new THREE.Mesh(new THREE.PlaneGeometry(480, 240), seabedMat);
  seabed.rotation.x = -Math.PI / 2;
  seabed.position.set(0, -2.2, 139.5);
  seabed.receiveShadow = true;
  scene.add(seabed);

  // 3. Sloped Coastal Beach Bank (z = 19.8 at y = +0.02 sloping down under water to z = 36 at y = -2.2)
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0xe7d4ad,
    map: textures.grassTex,
    roughness: 0.92,
  });
  const beachShape = new THREE.Shape();
  beachShape.moveTo(19.6, -2.3);
  beachShape.lineTo(19.6, 0.03);
  beachShape.lineTo(21.4, -0.06);
  beachShape.lineTo(25.5, -0.65);
  beachShape.lineTo(35.0, -2.3);
  beachShape.closePath();

  const beachGeo = new THREE.ExtrudeGeometry(beachShape, {
    depth: 480,
    bevelEnabled: false,
  });
  beachGeo.translate(0, 0, -240);
  // Rotate so shape +X -> +Z (seaward) and extrude +Z -> -X (centered along coast)
  beachGeo.rotateY(-Math.PI / 2);
  const beachBank = new THREE.Mesh(beachGeo, sandMat);
  beachBank.receiveShadow = true;
  scene.add(beachBank);

  // 4. Coastal Promenade Stone Seawall Coping along z = 19.7 (split around Pier opening x in [-2.8, 2.8])
  const copingMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.78 });
  const wallDarkMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
  for (const [cx, span] of [
    [-116.4, 227.2],
    [116.4, 227.2],
  ] as [number, number][]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(span, 0.24, 0.68), wallDarkMat);
    curb.position.set(cx, 0.06, 19.7);
    curb.receiveShadow = true;
    curb.castShadow = true;
    scene.add(curb);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(span, 0.08, 0.78), copingMat);
    cap.position.set(cx, 0.21, 19.7);
    cap.receiveShadow = true;
    cap.castShadow = true;
    scene.add(cap);
  }

  // Harbor Promenade Bollards near the pier mouth
  const bollardMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.55,
    roughness: 0.4,
  });
  for (let bx = -24; bx <= 24; bx += 4) {
    if (Math.abs(bx) < 3.2) continue;
    const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.72, 10), bollardMat);
    bollard.position.set(bx, 0.56, 19.7);
    bollard.castShadow = true;
    scene.add(bollard);
  }

  // 5. Realistic Animated Ocean Water starting cleanly at z = 21.4 (never inside grass!)
  const waterMat = new THREE.MeshStandardMaterial({
    color: pal.waterColor,
    metalness: 0.34,
    roughness: 0.12,
  });
  applyRealisticWaterShader(waterMat, waterTimeUniform, waterChopUniform);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(480, 220, 96, 64), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.26, 131.4);
  water.receiveShadow = true;
  scene.add(water);

  // 6. Multi-Part Harbor Wooden Pier & Marina Boat Slip
  const pierWoodMat = new THREE.MeshStandardMaterial({
    color: 0x9b6b3e,
    map: textures.woodTex,
    roughness: 0.82,
  });
  const darkTimberMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.88 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.35 });
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: 0xfde047,
    emissiveIntensity: 0.9,
  });

  const pierGroup = new THREE.Group();

  // Main Pier Deck + Sub-deck Stringer Beams
  const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 25.4), pierWoodMat);
  pierDeck.position.set(0, 0.24, 31.6);
  pierGroup.add(pierDeck);

  for (const sx of [-2.2, 0, 2.2]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 25.0), darkTimberMat);
    beam.position.set(sx, 0.02, 31.6);
    pierGroup.add(beam);
  }

  // Timber Side Curbs
  for (const cx of [-2.46, 2.46]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 25.2), darkTimberMat);
    curb.position.set(cx, 0.42, 31.6);
    pierGroup.add(curb);
  }

  // East Marina Finger Slip for Drivable Speedboat
  const marinaSlip = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.2, 3.1), pierWoodMat);
  marinaSlip.position.set(4.5, 0.22, 28);
  pierGroup.add(marinaSlip);

  // Deep Timber Pilings extending into seabed + Mooring Cleats + Lantern Posts
  for (let pz = 21; pz <= 42; pz += 4.2) {
    for (const px of [-2.35, 2.35]) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 3.4, 10), darkTimberMat);
      piling.position.set(px, -0.45, pz);
      pierGroup.add(piling);

      // Rope cap collar
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 6, 12), pierWoodMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(px, 1.02, pz);
      pierGroup.add(collar);
    }
    // Cross-transom beam under deck
    const cross = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.2, 0.22), darkTimberMat);
    cross.position.set(0, 0.0, pz);
    pierGroup.add(cross);
  }

  // Mooring bollards & harbor lanterns on pier entrance & slip
  for (const [lx, lz] of [
    [-2.35, 21.0],
    [2.35, 21.0],
    [-2.35, 33.6],
    [2.35, 33.6],
    [6.6, 26.8],
  ]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.4, 8), ironMat);
    post.position.set(lx, 1.85, lz);
    pierGroup.add(post);

    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), lanternGlowMat);
    lamp.position.set(lx, 2.6, lz);
    pierGroup.add(lamp);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.14, 8), ironMat);
    cap.position.set(lx, 2.75, lz);
    pierGroup.add(cap);
  }

  // Marina slip pilings & mooring cleat
  for (const sz of [26.7, 29.3]) {
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 3.0, 10), darkTimberMat);
    sp.position.set(6.6, -0.5, sz);
    pierGroup.add(sp);
  }
  const cleat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.1), ironMat);
  cleat.position.set(6.2, 0.37, 28.8);
  pierGroup.add(cleat);

  pierGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(pierGroup);

  return { meadowMat, pierWoodMat };
}

export function createRealisticHouseMesh(
  w: number,
  d: number,
  wallH: number,
  wallColor: number,
  roofColor: number,
  lawnMat: THREE.Material,
  glassMat: THREE.Material,
  trimMat: THREE.Material,
): THREE.Group {
  const house = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.88 });
  const shingleRoofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.72 });
  const fasciaMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 });
  const shutterMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.62 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x5c2c16, roughness: 0.52 });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.85,
    roughness: 0.22,
  });
  const sconceGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 0.9,
  });

  // Lawn & front stone walkway
  const lawn = new THREE.Mesh(new THREE.BoxGeometry(w + 3.8, 0.06, d + 4.8), lawnMat);
  lawn.position.set(0, 0.02, 0.7);
  house.add(lawn);

  const path = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 2.4), stoneMat);
  path.position.set(0, 0.04, d / 2 + 2.3);
  house.add(path);

  // Stone veneer foundation
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(w + 0.36, 0.42, d + 0.36), stoneMat);
  foundation.position.y = 0.21;
  house.add(foundation);

  // Main exterior walls + horizontal corner trims
  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.72 });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat);
  walls.position.y = 0.42 + wallH / 2;
  house.add(walls);

  const beltTrim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.14, d + 0.08), trimMat);
  beltTrim.position.y = 0.44;
  house.add(beltTrim);

  for (const cx of [-w / 2, w / 2]) {
    for (const cz of [-d / 2, d / 2]) {
      const corner = new THREE.Mesh(new THREE.BoxGeometry(0.16, wallH, 0.16), trimMat);
      corner.position.set(cx, 0.42 + wallH / 2, cz);
      house.add(corner);
    }
  }

  // Overhanging Pitched Gable Roof + Gable End + Ridge Cap
  const roofH = 2.25;
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-(w / 2 + 0.55), -0.06);
  roofShape.lineTo(w / 2 + 0.55, -0.06);
  roofShape.lineTo(0, roofH);
  roofShape.closePath();

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: d + 0.95,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 1,
  });
  roofGeo.translate(0, 0, -(d + 0.95) / 2);
  const roof = new THREE.Mesh(roofGeo, shingleRoofMat);
  roof.position.y = 0.42 + wallH;
  house.add(roof);

  // Ridge beam cap
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, d + 1.08), fasciaMat);
  ridge.position.set(0, 0.42 + wallH + roofH + 0.04, 0);
  house.add(ridge);

  // Brick Chimney + Corbeled Cap + Terracotta Pot
  const brickMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.85 });
  const chimBaseY = 0.42 + wallH;
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.9, 0.72), brickMat);
  chimney.position.set(w * 0.28, chimBaseY + 1.15, -d * 0.18);
  house.add(chimney);

  const chimCap = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.14, 0.86), stoneMat);
  chimCap.position.set(w * 0.28, chimBaseY + 2.12, -d * 0.18);
  house.add(chimCap);

  const chimPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 0.34, 10),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 }),
  );
  chimPot.position.set(w * 0.28, chimBaseY + 2.34, -d * 0.18);
  house.add(chimPot);

  // Front Porch Deck, Stone Steps, Columns with Bases/Capitals & Railings
  const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(w * 0.58, 0.32, 1.85), stoneMat);
  porchDeck.position.set(0, 0.16, d / 2 + 0.92);
  house.add(porchDeck);

  const step1 = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 0.45), stoneMat);
  step1.position.set(0, 0.08, d / 2 + 2.02);
  house.add(step1);

  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.62, 0.22, 1.95), shingleRoofMat);
  porchRoof.position.set(0, 2.86, d / 2 + 0.92);
  porchRoof.rotation.x = 0.08;
  house.add(porchRoof);

  for (const px of [-w * 0.25, w * 0.25]) {
    const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.24), stoneMat);
    colBase.position.set(px, 0.48, d / 2 + 1.68);
    house.add(colBase);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.105, 2.24, 10), trimMat);
    post.position.set(px, 1.72, d / 2 + 1.68);
    house.add(post);
  }
  for (const rx of [-w * 0.16, w * 0.16]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.18, 0.08, 0.08), trimMat);
    rail.position.set(rx, 0.92, d / 2 + 1.68);
    house.add(rail);
  }

  // Paneled Front Door + Frame + Brass Doorknob + Lantern Sconces
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.14, 2.22, 0.12), trimMat);
  doorFrame.position.set(0, 1.43, d / 2 + 0.04);
  house.add(doorFrame);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.96, 2.08, 0.14), doorMat);
  door.position.set(0, 1.38, d / 2 + 0.06);
  house.add(door);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), brassMat);
  knob.position.set(0.34, 1.32, d / 2 + 0.16);
  house.add(knob);

  for (const sx of [-0.74, 0.74]) {
    const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.14), sconceGlowMat);
    sconce.position.set(sx, 2.05, d / 2 + 0.12);
    house.add(sconce);
  }

  // Helper for Framed 3D Mullioned Windows with Sill & Shutters
  const addWindow = (wx: number, wy: number, wz: number, rotY = 0, withShutters = true) => {
    const wg = new THREE.Group();
    wg.position.set(wx, wy, wz);
    wg.rotation.y = rotY;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.28, 0.1), trimMat);
    wg.add(frame);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.08, 0.12), glassMat);
    wg.add(glass);

    const vMullion = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 0.14), trimMat);
    wg.add(vMullion);
    const hMullion = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.14), trimMat);
    wg.add(hMullion);

    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.1, 0.22), stoneMat);
    sill.position.set(0, -0.66, 0.04);
    wg.add(sill);

    if (withShutters) {
      for (const side of [-0.78, 0.78]) {
        const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.24, 0.06), shutterMat);
        shutter.position.set(side, 0, 0.02);
        wg.add(shutter);
      }
    }

    house.add(wg);
  };

  for (const wx of [-w * 0.32, w * 0.32]) {
    addWindow(wx, 1.98, d / 2 + 0.03, 0, true);
  }
  if (wallH > 4.1) {
    for (const wx of [-w * 0.28, 0, w * 0.28]) {
      addWindow(wx, 4.12, d / 2 + 0.03, 0, false);
    }
  }
  for (const sx of [-w / 2 - 0.03, w / 2 + 0.03]) {
    addWindow(sx, 1.98, 0, sx > 0 ? Math.PI / 2 : -Math.PI / 2, true);
  }

  return house;
}

export function buildCitySkyscrapers(
  scene: THREE.Scene,
  skipDefaultNorthTower: boolean,
  plazaMat: THREE.Material,
  skyWinTex: THREE.CanvasTexture,
  warmWinTex: THREE.CanvasTexture,
  addBoxCollider: (cx: number, cz: number, w: number, d: number, pad?: number) => void,
): void {
  const cityGlassMat = new THREE.MeshPhysicalMaterial({
    map: skyWinTex,
    roughness: 0.18,
    metalness: 0.45,
    clearcoat: 0.85,
    clearcoatRoughness: 0.1,
  });
  const citySlateMat = new THREE.MeshStandardMaterial({
    map: warmWinTex,
    color: 0xcbd5e1,
    roughness: 0.38,
    metalness: 0.25,
  });
  const podiumMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
  const finMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.65,
    roughness: 0.28,
  });
  const penthouseMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.42,
    metalness: 0.5,
  });

  const cityTowers: {
    x: number;
    z: number;
    w: number;
    d: number;
    h: number;
    glass: boolean;
    crown?: number;
  }[] = [
    { x: 0, z: -53, w: 12, d: 10, h: 36, glass: true, crown: 0x38bdf8 },
    { x: -17, z: -48, w: 9, d: 9, h: 24, glass: false },
    { x: -32, z: -50, w: 10, d: 9, h: 29, glass: true, crown: 0x818cf8 },
    { x: -48, z: -47, w: 11, d: 8, h: 19, glass: false },
    { x: 16, z: -49, w: 9.5, d: 9.5, h: 27, glass: true },
    { x: 31, z: -48, w: 10, d: 9, h: 22, glass: false, crown: 0x38bdf8 },
    { x: 47, z: -48, w: 11, d: 10, h: 31, glass: true },
    { x: 63, z: -47, w: 10, d: 9, h: 21, glass: false },
    { x: 50, z: -18, w: 10, d: 10, h: 24, glass: true, crown: 0x0ea5e9 },
    { x: 64, z: -18, w: 9, d: 9, h: 17, glass: false },
    { x: 52, z: -2, w: 11, d: 9, h: 20, glass: true },
  ];

  for (const b of cityTowers) {
    if (skipDefaultNorthTower && b.x === 0 && b.z === -53) continue;
    const bGroup = new THREE.Group();
    bGroup.position.set(b.x, 0, b.z);

    // Sidewalk Plinth + Ground-Floor Colonnade Podium
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(b.w + 3.4, 0.16, b.d + 3.4), plazaMat);
    plinth.position.y = 0.08;
    bGroup.add(plinth);

    const podiumH = 4.2;
    const podium = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.5, podiumH, b.d + 0.5), podiumMat);
    podium.position.y = podiumH / 2 + 0.1;
    bGroup.add(podium);

    // Lower Main Shaft & Upper Stepped Setback Tier
    const tier1H = b.h * 0.66;
    const tier2H = b.h - tier1H;
    const body1 = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, tier1H, b.d),
      b.glass ? cityGlassMat : citySlateMat,
    );
    body1.position.y = podiumH + tier1H / 2;
    bGroup.add(body1);

    const body2 = new THREE.Mesh(
      new THREE.BoxGeometry(b.w * 0.82, tier2H, b.d * 0.82),
      b.glass ? cityGlassMat : citySlateMat,
    );
    body2.position.y = podiumH + tier1H + tier2H / 2;
    bGroup.add(body2);

    // Architectural Setback Ledge & Vertical Facade Pilasters
    const ledge = new THREE.Mesh(
      new THREE.BoxGeometry(b.w + 0.35, 0.35, b.d + 0.35),
      finMat,
    );
    ledge.position.y = podiumH + tier1H;
    bGroup.add(ledge);

    for (const fx of [-b.w * 0.46, 0, b.w * 0.46]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.28, tier1H, b.d + 0.22), finMat);
      fin.position.set(fx, podiumH + tier1H / 2, 0);
      bGroup.add(fin);
    }

    // Rooftop Mechanical Penthouse, HVAC & Optional Spire
    const topY = podiumH + b.h;
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(b.w * 0.58, 1.8, b.d * 0.58),
      penthouseMat,
    );
    cap.position.y = topY + 0.9;
    bGroup.add(cap);

    if (b.crown) {
      const glowBand = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.84, 0.65, b.d * 0.84),
        new THREE.MeshStandardMaterial({ color: b.crown, emissive: b.crown, emissiveIntensity: 0.9 }),
      );
      glowBand.position.y = topY - 0.5;
      bGroup.add(glowBand);

      const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.55, 2.6, 8), finMat);
      spireBase.position.y = topY + 3.0;
      bGroup.add(spireBase);

      const spireRod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 5.2, 8), finMat);
      spireRod.position.y = topY + 6.4;
      bGroup.add(spireRod);

      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.0 }),
      );
      beacon.position.y = topY + 9.1;
      bGroup.add(beacon);
    }

    // Illuminated Entrance Canopy & Glass Double Doors
    const marquee = new THREE.Mesh(
      new THREE.BoxGeometry(b.w * 0.54, 0.26, 2.1),
      penthouseMat,
    );
    marquee.position.set(0, 3.35, b.d / 2 + 1.0);
    bGroup.add(marquee);

    const lobby = new THREE.Mesh(
      new THREE.BoxGeometry(b.w * 0.44, 3.0, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.45 }),
    );
    lobby.position.set(0, 1.55, b.d / 2 + 0.22);
    bGroup.add(lobby);

    bGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj !== plinth) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    plinth.receiveShadow = true;
    scene.add(bGroup);
    addBoxCollider(b.x, b.z, b.w, b.d);
  }
}

export function buildPlazaLandmarksAndProps(
  scene: THREE.Scene,
  plazaMat: THREE.Material,
  stoneMat: THREE.Material,
  woodMat: THREE.Material,
  addBoxCollider: (cx: number, cz: number, w: number, d: number, pad?: number) => void,
): { statuePhone: THREE.Group } {
  // 1. Sculpted Lathe-Carved Central Tiered Stone Fountain
  const fountainGroup = new THREE.Group();
  const outerRimGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(2.75, 0),
      new THREE.Vector2(3.45, 0),
      new THREE.Vector2(3.4, 0.72),
      new THREE.Vector2(3.55, 0.85),
      new THREE.Vector2(2.85, 0.85),
      new THREE.Vector2(2.8, 0.28),
      new THREE.Vector2(0, 0.28),
    ],
    32,
  );
  const outerBasin = new THREE.Mesh(outerRimGeo, stoneMat);
  outerBasin.castShadow = true;
  outerBasin.receiveShadow = true;
  fountainGroup.add(outerBasin);

  const fWaterMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    roughness: 0.08,
    metalness: 0.25,
    clearcoat: 1.0,
  });
  const lowerPool = new THREE.Mesh(new THREE.CylinderGeometry(2.82, 2.82, 0.14, 32), fWaterMat);
  lowerPool.position.y = 0.68;
  fountainGroup.add(lowerPool);

  const pedestalGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.75, 0.25),
      new THREE.Vector2(0.45, 0.95),
      new THREE.Vector2(0.38, 1.55),
      new THREE.Vector2(1.45, 1.85),
      new THREE.Vector2(1.52, 2.02),
      new THREE.Vector2(0.42, 1.92),
      new THREE.Vector2(0.28, 2.65),
      new THREE.Vector2(0.68, 2.85),
      new THREE.Vector2(0.18, 3.05),
      new THREE.Vector2(0.05, 3.35),
    ],
    24,
  );
  const centerColumn = new THREE.Mesh(pedestalGeo, stoneMat);
  centerColumn.castShadow = true;
  fountainGroup.add(centerColumn);

  const upperPool = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.36, 0.08, 24), fWaterMat);
  upperPool.position.y = 1.96;
  fountainGroup.add(upperPool);

  const sprayMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.25,
    transparent: true,
    opacity: 0.72,
  });
  const waterJet = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.18, 0.85, 10), sprayMat);
  waterJet.position.y = 3.72;
  fountainGroup.add(waterJet);
  scene.add(fountainGroup);

  // 2. Slatted Hardwood & Wrought-Iron Park Benches
  const benchIronMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.35 });
  const benchPositions: [number, number, number][] = [
    [-6.5, -5.5, Math.PI * 0.25],
    [6.5, -5.5, -Math.PI * 0.25],
    [-6.5, 5.5, Math.PI * 0.75],
    [6.5, 5.5, -Math.PI * 0.75],
  ];
  for (const [bx, bz, brot] of benchPositions) {
    const bg = new THREE.Group();
    bg.position.set(bx, 0, bz);
    bg.rotation.y = brot;

    for (const sz of [-0.16, 0, 0.16]) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.06, 0.13), woodMat);
      slat.position.set(0, 0.45, sz);
      slat.castShadow = true;
      bg.add(slat);
    }
    for (const by of [0.64, 0.8, 0.96]) {
      const bslat = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.11, 0.06), woodMat);
      bslat.position.set(0, by, -0.26 - (by - 0.64) * 0.18);
      bslat.rotation.x = -0.18;
      bslat.castShadow = true;
      bg.add(bslat);
    }
    for (const lx of [-0.88, 0.88]) {
      const legF = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.46, 0.08), benchIronMat);
      legF.position.set(lx, 0.23, 0.18);
      bg.add(legF);
      const legB = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.98, 0.08), benchIronMat);
      legB.position.set(lx, 0.49, -0.24);
      bg.add(legB);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.5), benchIronMat);
      arm.position.set(lx, 0.64, -0.02);
      bg.add(arm);
    }
    scene.add(bg);
  }

  // 3. Fluted Cast-Iron Streetlamps with Lantern Housings (Instanced)
  const lampCoords: [number, number][] = [
    [-28, -28],
    [-10, -28],
    [10, -28],
    [28, -28],
    [-32, -16],
    [-32, 4],
    [32, -16],
    [32, 4],
    [-26, 14],
    [26, 14],
  ];
  const ironLampMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
  const baseGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.65, 10);
  baseGeo.translate(0, 0.32, 0);
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.14, 3.8, 10);
  poleGeo.translate(0, 2.4, 0);
  const lanternFrameGeo = new THREE.CylinderGeometry(0.32, 0.2, 0.16, 8);
  lanternFrameGeo.translate(0, 4.72, 0);
  const bulbGeo = new THREE.SphereGeometry(0.24, 10, 10);
  bulbGeo.translate(0, 4.46, 0);

  const baseInst = new THREE.InstancedMesh(baseGeo, ironLampMat, lampCoords.length);
  const poleInst = new THREE.InstancedMesh(poleGeo, ironLampMat, lampCoords.length);
  const capInst = new THREE.InstancedMesh(lanternFrameGeo, ironLampMat, lampCoords.length);
  const bulbInst = new THREE.InstancedMesh(
    bulbGeo,
    new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfde047, emissiveIntensity: 0.9 }),
    lampCoords.length,
  );
  const dummy = new THREE.Object3D();
  lampCoords.forEach(([lx, lz], i) => {
    dummy.position.set(lx, 0, lz);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    baseInst.setMatrixAt(i, dummy.matrix);
    poleInst.setMatrixAt(i, dummy.matrix);
    capInst.setMatrixAt(i, dummy.matrix);
    bulbInst.setMatrixAt(i, dummy.matrix);
  });
  [baseInst, poleInst, capInst, bulbInst].forEach((inst) => {
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
    inst.castShadow = true;
  });
  scene.add(baseInst, poleInst, capInst, bulbInst);

  // 4. Stratified Multi-Lobe Coastal Rock Clusters along Shoreline
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.94 });
  const rockDarkMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.96 });
  const rockCoords: [number, number, number][] = [
    [-14, 20.6, 1.05],
    [-26, 20.8, 1.3],
    [-42, 20.5, 0.95],
    [14, 20.7, 1.15],
    [29, 20.8, 1.25],
    [46, 20.6, 1.0],
  ];
  for (const [rx, rz, rsc] of rockCoords) {
    const rg = new THREE.Group();
    rg.position.set(rx, 0, rz);
    const main = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75 * rsc, 1), rockMat);
    main.scale.set(1.35, 0.7, 1.0);
    main.position.y = 0.25 * rsc;
    main.rotation.set(0.3, rx, 0.2);
    rg.add(main);

    const sub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48 * rsc, 1), rockDarkMat);
    sub.scale.set(1.1, 0.65, 1.2);
    sub.position.set(0.65 * rsc, 0.16 * rsc, 0.25 * rsc);
    sub.rotation.set(-0.2, rz, 0.4);
    rg.add(sub);

    rg.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(rg);
  }

  // 5. OOTBLUE Flagship Pavilion (Stepped Marble Plinth + Canopy Ribs + OOTBLUE 1 Monument)
  const pavGroup = new THREE.Group();
  pavGroup.position.set(-12, 0, -18);
  const pavStep1 = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.16, 8.4), plazaMat);
  pavStep1.position.y = 0.08;
  pavGroup.add(pavStep1);
  const pavFloor = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.22, 7.4), plazaMat);
  pavFloor.position.y = 0.24;
  pavGroup.add(pavFloor);

  const pavRoof = new THREE.Mesh(
    new THREE.BoxGeometry(10.6, 0.36, 8.4),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.55, roughness: 0.28 }),
  );
  pavRoof.position.y = 4.45;
  pavGroup.add(pavRoof);

  const pavGlowTrim = new THREE.Mesh(
    new THREE.BoxGeometry(10.7, 0.12, 8.5),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.85 }),
  );
  pavGlowTrim.position.y = 4.26;
  pavGroup.add(pavGlowTrim);

  const pavSign = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 0.52, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.75 }),
  );
  pavSign.position.set(0, 4.48, 4.24);
  pavGroup.add(pavSign);

  const colMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.78, roughness: 0.2 });
  for (const px of [-4.2, 4.2]) {
    for (const pz of [-3.1, 3.1]) {
      const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.24, 0.54), colMat);
      colBase.position.set(px, 0.44, pz);
      pavGroup.add(colBase);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 4.0, 14), colMat);
      col.position.set(px, 2.35, pz);
      pavGroup.add(col);
    }
  }

  // Pedestal & Rotating Detailed OOTBLUE 1 Statue
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.65, 20), colMat);
  ped.position.set(0, 0.65, 0);
  pavGroup.add(ped);

  const statuePhone = new THREE.Group();
  statuePhone.position.set(0, 2.35, 0);
  const phoneBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 2.84, 0.18),
    new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, metalness: 0.52, roughness: 0.18, clearcoat: 1.0 }),
  );
  statuePhone.add(phoneBody);
  const screenFace = new THREE.Mesh(
    new THREE.BoxGeometry(1.26, 2.66, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x0ea5e9, emissiveIntensity: 0.35 }),
  );
  screenFace.position.z = 0.09;
  statuePhone.add(screenFace);
  const statuePill = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.24, 0.54, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.25 }),
  );
  statuePill.position.set(-0.34, 0.75, -0.1);
  statuePill.scale.set(1, 1, 0.3);
  statuePhone.add(statuePill);
  for (const ly of [0.98, 0.52]) {
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0x7c3aed, emissive: 0x4f46e5, emissiveIntensity: 0.45 }),
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(-0.34, ly, -0.13);
    statuePhone.add(lens);
  }
  pavGroup.add(statuePhone);
  pavGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj !== pavFloor && obj !== pavStep1) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  pavFloor.receiveShadow = true;
  pavStep1.receiveShadow = true;
  scene.add(pavGroup);
  addBoxCollider(-12, -18, 9.2, 7.2);

  // 6. Terrace Café with Striped Awning, Espresso Counter & Bistro Tables
  const cafeGroup = new THREE.Group();
  cafeGroup.position.set(-18, 0, 9);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.14, 5.2), plazaMat);
  deck.position.set(0, 0.07, 0.6);
  cafeGroup.add(deck);

  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 1.08, 1.45),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 }),
  );
  counter.position.set(0, 0.62, -0.4);
  cafeGroup.add(counter);

  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(5.0, 0.1, 1.65),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 }),
  );
  counterTop.position.set(0, 1.2, -0.4);
  cafeGroup.add(counterTop);

  // Espresso machine on counter
  const espresso = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.58, 0.55),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 }),
  );
  espresso.position.set(-1.1, 1.54, -0.4);
  cafeGroup.add(espresso);

  // Striped canopy awning
  const stripeColors = [0x10b981, 0xf8fafc];
  for (let s = 0; s < 6; s++) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.18, 4.1),
      new THREE.MeshStandardMaterial({ color: stripeColors[s % 2], roughness: 0.68 }),
    );
    strip.position.set(-2.5 + s * 1.0, 3.15, 0.35);
    strip.rotation.x = 0.14;
    cafeGroup.add(strip);
  }
  for (const cx of [-2.6, 2.6]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.95, 10), benchIronMat);
    pole.position.set(cx, 1.55, 2.1);
    cafeGroup.add(pole);
  }

  // Twin Outdoor Bistro Tables & Chairs
  for (const tx of [-1.5, 1.5]) {
    const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.22, 0.76, 10), benchIronMat);
    tLeg.position.set(tx, 0.45, 1.9);
    cafeGroup.add(tLeg);
    const tTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.06, 14),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }),
    );
    tTop.position.set(tx, 0.84, 1.9);
    cafeGroup.add(tTop);
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.055, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3 }),
    );
    cup.position.set(tx + 0.12, 0.93, 1.85);
    cafeGroup.add(cup);
  }

  cafeGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj !== deck) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  deck.receiveShadow = true;
  scene.add(cafeGroup);
  addBoxCollider(-18, 9, 5.2, 2.5);

  // 7. Neon Arcade Kiosk with Glass Facade & Glowing Arcade Cabinets
  const arcadeGroup = new THREE.Group();
  arcadeGroup.position.set(16, 0, -15);
  const kioskBase = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.18, 3.8), plazaMat);
  kioskBase.position.y = 0.09;
  arcadeGroup.add(kioskBase);

  const kioskBody = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 3.3, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.45, roughness: 0.35 }),
  );
  kioskBody.position.y = 1.75;
  arcadeGroup.add(kioskBody);

  const neonMarquee = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.55, 3.6),
    new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.8 }),
  );
  neonMarquee.position.y = 3.55;
  arcadeGroup.add(neonMarquee);

  const kioskScreen = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.65, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.75 }),
  );
  kioskScreen.position.set(0, 1.9, 1.62);
  arcadeGroup.add(kioskScreen);

  // Twin Outdoor Arcade Cabinets under Neon Canopy
  for (const ax of [-1.25, 1.25]) {
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 1.65, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 }),
    );
    cab.position.set(ax, 0.92, 1.95);
    arcadeGroup.add(cab);
    const crt = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.44, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.85 }),
    );
    crt.position.set(ax, 1.32, 2.28);
    crt.rotation.x = -0.22;
    arcadeGroup.add(crt);
  }

  arcadeGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj !== kioskBase) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  kioskBase.receiveShadow = true;
  scene.add(arcadeGroup);
  addBoxCollider(16, -15, 4.4, 3.6);

  return { statuePhone };
}
