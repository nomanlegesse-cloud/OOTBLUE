import * as THREE from 'three';
import { CountryDestination } from '../../os/countries';

export function createAirplaneMesh(
  fuselageColor: number,
  accentColor: number,
): THREE.Group {
  const plane = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: fuselageColor,
    metalness: 0.32,
    roughness: 0.22,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.45,
    roughness: 0.3,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    metalness: 0.3,
    roughness: 0.28,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.78,
    roughness: 0.08,
    clearcoat: 1.0,
  });
  const engineMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.65,
    roughness: 0.3,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.16,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.88 });

  // 1. Sculpted Lathe Fuselage (+Z forward, y=2.15)
  const fusePts = [
    new THREE.Vector2(0.01, -9.2),
    new THREE.Vector2(0.32, -8.2),
    new THREE.Vector2(0.85, -6.2),
    new THREE.Vector2(1.16, -3.5),
    new THREE.Vector2(1.18, 3.8),
    new THREE.Vector2(1.02, 5.4),
    new THREE.Vector2(0.68, 6.6),
    new THREE.Vector2(0.28, 7.4),
    new THREE.Vector2(0.01, 7.68),
  ];
  const fuselageGeo = new THREE.LatheGeometry(fusePts, 24);
  fuselageGeo.rotateX(Math.PI / 2);
  const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
  fuselage.position.set(0, 2.15, 0);
  plane.add(fuselage);

  // 2. Wraparound Multi-Pane Cockpit Windshield & Cabin Windows Strip
  const visor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.86, 1.02, 0.52, 16, 1, false, -0.95, 1.9),
    glassMat,
  );
  visor.position.set(0, 2.58, 5.62);
  visor.rotation.x = 0.28;
  plane.add(visor);

  for (const side of [-1, 1]) {
    const winStrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 8.2), glassMat);
    winStrip.position.set(side * 1.16, 2.42, 0.2);
    plane.add(winStrip);
  }

  // 3. Belly Fairing & Livery Cheatline
  const belly = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.55, 4.6), wingMat);
  belly.position.set(0, 1.25, 0.1);
  plane.add(belly);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.18, 10.4), accentMat);
  stripe.position.set(0, 2.16, 0.1);
  plane.add(stripe);

  // 4. Swept Extruded Airfoil Main Wings + Flap Fairings + Winglets + High-Bypass Turbofans
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 1.8);
  wingShape.lineTo(7.4, -1.65);
  wingShape.lineTo(7.4, -2.55);
  wingShape.lineTo(0, -1.2);
  wingShape.closePath();
  const singleWingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  singleWingGeo.rotateX(-Math.PI / 2);

  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(singleWingGeo, wingMat);
    wing.scale.x = side;
    wing.position.set(side * 0.75, 1.65, 0.25);
    wing.rotation.z = side * 0.045;
    plane.add(wing);

    const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.9), accentMat);
    winglet.position.set(side * 8.1, 2.52, -1.85);
    winglet.rotation.z = side * -0.24;
    plane.add(winglet);

    // Flap Track Fairing Pods under wing
    for (const fx of [2.4, 4.9]) {
      const fair = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 1.2, 4, 8), wingMat);
      fair.rotation.x = Math.PI / 2;
      fair.position.set(side * fx, 1.56, -0.95 - fx * 0.14);
      plane.add(fair);
    }

    // Turbofan Pylon, Lathe Nacelle Cowling, Chrome Lip, & Spinner Cone
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 1.35), wingMat);
    pylon.position.set(side * 3.1, 1.48, 0.55);
    plane.add(pylon);

    const nacPts = [
      new THREE.Vector2(0.32, -1.05),
      new THREE.Vector2(0.46, -0.55),
      new THREE.Vector2(0.52, 0.45),
      new THREE.Vector2(0.47, 1.05),
      new THREE.Vector2(0.38, 1.05),
    ];
    const nacGeo = new THREE.LatheGeometry(nacPts, 18);
    nacGeo.rotateX(Math.PI / 2);
    const nacelle = new THREE.Mesh(nacGeo, engineMat);
    nacelle.position.set(side * 3.1, 1.15, 0.95);
    plane.add(nacelle);

    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.055, 8, 18), chromeMat);
    lip.position.set(side * 3.1, 1.15, 1.98);
    plane.add(lip);

    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 12), chromeMat);
    spinner.rotation.x = Math.PI / 2;
    spinner.position.set(side * 3.1, 1.15, 1.9);
    plane.add(spinner);
  }

  // 5. Swept Vertical Tail Fin & Horizontal Stabilizers
  const vTailShape = new THREE.Shape();
  vTailShape.moveTo(0, 0);
  vTailShape.lineTo(2.6, 0);
  vTailShape.lineTo(0.95, 3.3);
  vTailShape.lineTo(-0.35, 3.3);
  vTailShape.closePath();
  const vTailGeo = new THREE.ExtrudeGeometry(vTailShape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 1,
  });
  vTailGeo.translate(0, 0, -0.09);
  vTailGeo.rotateY(Math.PI / 2);
  const vTail = new THREE.Mesh(vTailGeo, accentMat);
  vTail.position.set(0, 2.7, -6.4);
  plane.add(vTail);

  const hStabShape = new THREE.Shape();
  hStabShape.moveTo(0, 0.7);
  hStabShape.lineTo(2.7, -0.55);
  hStabShape.lineTo(2.7, -1.05);
  hStabShape.lineTo(0, -0.65);
  hStabShape.closePath();
  const hStabGeo = new THREE.ExtrudeGeometry(hStabShape, { depth: 0.1, bevelEnabled: false });
  hStabGeo.rotateX(-Math.PI / 2);
  for (const side of [-1, 1]) {
    const hStab = new THREE.Mesh(hStabGeo, wingMat);
    hStab.scale.x = side;
    hStab.position.set(side * 0.25, 2.38, -7.2);
    plane.add(hStab);
  }

  // 6. Twin-Wheel Nose & Main Landing Gear Bogies
  const strutGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.15, 8);
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.17, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const [gx, gz] of [
    [0, 4.9],
    [-1.45, -0.3],
    [1.45, -0.3],
  ]) {
    const strut = new THREE.Mesh(strutGeo, chromeMat);
    strut.position.set(gx, 0.72, gz);
    plane.add(strut);
    for (const wx of [-0.14, 0.14]) {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(gx + wx, 0.28, gz);
      plane.add(wheel);
    }
  }

  plane.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return plane;
}

function createAirportSignTexture(
  code: string,
  airportName: string,
  accentHex: string,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 46px "Plus Jakarta Sans", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(code, 28, 64);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(airportName.toUpperCase().slice(0, 26), 146, 48);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('INTERNATIONAL DEPARTURES · GATE', 146, 84);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildAirportComplex(
  scene: THREE.Scene,
  country: CountryDestination,
  addBoxCollider: (cx: number, cz: number, w: number, d: number, pad?: number) => void,
  plazaMat: THREE.Material,
  asphaltMat: THREE.Material,
  whitePaintMat: THREE.Material,
  stripeMat: THREE.Material,
): {
  atcRadar: THREE.Group;
  gatePadRing: THREE.Mesh;
  signTex: THREE.CanvasTexture;
} {
  const accent = country.palette.accentColor;
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.72, roughness: 0.25 });
  const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.55, roughness: 0.3 });

  // 1. Modern Gull-Wing Airport Terminal Concourse at (88, 0, -18)
  const termGroup = new THREE.Group();
  termGroup.position.set(88, 0, -18);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.16, 25.6), plazaMat);
  plinth.position.y = 0.08;
  termGroup.add(plinth);

  const hall = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 5.8, 21.2),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.2 }),
  );
  hall.position.y = 2.95;
  termGroup.add(hall);

  // Mullioned Glass Curtain-Wall Facade facing West
  const glassFacade = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 4.6, 18.2),
    new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.32,
      metalness: 0.65,
      roughness: 0.1,
      clearcoat: 1.0,
    }),
  );
  glassFacade.position.set(-5.15, 2.65, 0);
  termGroup.add(glassFacade);

  for (let mz = -8; mz <= 8; mz += 2.0) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.7, 0.12), steelMat);
    mullion.position.set(-5.18, 2.65, mz);
    termGroup.add(mullion);
  }

  // Curved Gull-Wing Airport Canopy Roof + V-Columns
  const wingRoofShape = new THREE.Shape();
  wingRoofShape.moveTo(-7.8, 0.65);
  wingRoofShape.quadraticCurveTo(-1.0, 1.35, 6.2, 0.25);
  wingRoofShape.lineTo(6.2, -0.15);
  wingRoofShape.quadraticCurveTo(-1.0, 0.9, -7.8, 0.25);
  wingRoofShape.closePath();
  const wingRoofGeo = new THREE.ExtrudeGeometry(wingRoofShape, {
    depth: 23.8,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  wingRoofGeo.translate(0, 0, -11.9);
  const canopy = new THREE.Mesh(wingRoofGeo, darkSteelMat);
  canopy.position.set(0, 5.95, 0);
  termGroup.add(canopy);

  for (const vz of [-9, -3, 3, 9]) {
    const vCol1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6.4, 8), steelMat);
    vCol1.position.set(-6.4, 3.2, vz);
    vCol1.rotation.z = -0.12;
    termGroup.add(vCol1);
  }

  const signTex = createAirportSignTexture(
    country.airportCode,
    country.airportName,
    country.accentHex,
  );
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 1.85, 8.8),
    new THREE.MeshStandardMaterial({
      map: signTex,
      emissive: 0xffffff,
      emissiveMap: signTex,
      emissiveIntensity: 0.45,
      roughness: 0.3,
    }),
  );
  signBoard.position.set(-5.45, 5.1, 0);
  termGroup.add(signBoard);

  // Articulated Accordion Jetway Bridge + Support Bogie Strut
  const jetwayTube = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 1.75, 1.85),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.38 }),
  );
  jetwayTube.position.set(7.4, 2.75, 7.5);
  termGroup.add(jetwayTube);
  for (let jx = 5.4; jx <= 9.6; jx += 1.05) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.85, 1.95), darkSteelMat);
    rib.position.set(jx, 2.75, 7.5);
    termGroup.add(rib);
  }
  const jStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.4, 10), steelMat);
  jStrut.position.set(9.4, 1.2, 7.5);
  termGroup.add(jStrut);

  termGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj !== plinth) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  plinth.receiveShadow = true;
  scene.add(termGroup);
  addBoxCollider(88, -18, 10.8, 21.4);

  // Passport & Ticket Control Booth right beside Airport Gate (x=79.5, z=-14.6)
  const deskGroup = new THREE.Group();
  deskGroup.position.set(79.5, 0, -14.6);
  const deskCounter = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.15, 2.2),
    darkSteelMat,
  );
  deskCounter.position.y = 0.58;
  deskGroup.add(deskCounter);
  const deskGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 1.05, 2.0),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
    }),
  );
  deskGlass.position.set(-0.55, 1.65, 0);
  deskGroup.add(deskGlass);
  const deskRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.24, 2.55),
    new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.28 }),
  );
  deskRoof.position.y = 2.28;
  deskGroup.add(deskRoof);
  deskGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(deskGroup);
  addBoxCollider(79.5, -14.6, 1.5, 2.3);

  const gatePadRing = new THREE.Mesh(
    new THREE.RingGeometry(1.45, 2.05, 28),
    new THREE.MeshBasicMaterial({
      color: accent,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    }),
  );
  gatePadRing.rotation.x = -Math.PI / 2;
  gatePadRing.position.set(80.8, 0.1, -18);
  scene.add(gatePadRing);

  // 2. Detailed Air Traffic Control (ATC) Tower with Catwalk & Angled Cab at (88, 0, -37)
  const atcGroup = new THREE.Group();
  atcGroup.position.set(88, 0, -37);
  const shaftGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(2.15, 0),
      new THREE.Vector2(1.72, 3.5),
      new THREE.Vector2(1.42, 12.0),
      new THREE.Vector2(1.6, 15.6),
      new THREE.Vector2(3.35, 16.0),
      new THREE.Vector2(3.35, 16.25),
    ],
    16,
  );
  const shaft = new THREE.Mesh(
    shaftGeo,
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.48 }),
  );
  atcGroup.add(shaft);

  const catwalkRail = new THREE.Mesh(new THREE.TorusGeometry(3.25, 0.06, 6, 20), darkSteelMat);
  catwalkRail.rotation.x = Math.PI / 2;
  catwalkRail.position.y = 16.7;
  atcGroup.add(catwalkRail);

  const cab = new THREE.Mesh(
    new THREE.CylinderGeometry(3.15, 2.15, 2.7, 12),
    new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
      metalness: 0.7,
      roughness: 0.1,
      clearcoat: 1.0,
    }),
  );
  cab.position.y = 17.5;
  atcGroup.add(cab);

  const cabRoof = new THREE.Mesh(new THREE.CylinderGeometry(3.45, 3.45, 0.48, 12), darkSteelMat);
  cabRoof.position.y = 19.05;
  atcGroup.add(cabRoof);

  const atcRadar = new THREE.Group();
  atcRadar.position.y = 19.85;
  const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.3, 8), steelMat);
  atcRadar.add(radarMast);
  const radarDish = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.65, 0.22),
    new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.5 }),
  );
  radarDish.position.y = 0.65;
  atcRadar.add(radarDish);
  atcGroup.add(atcRadar);
  atcGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(atcGroup);
  addBoxCollider(88, -37, 4.2, 4.2);

  // 3. Tarmac Apron & Main Asphalt Runway (x=110, z=-21)
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(30, 0.04, 76),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 }),
  );
  apron.position.set(108, 0.02, -21);
  apron.receiveShadow = true;
  scene.add(apron);

  const runway = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.04, 74), asphaltMat);
  runway.position.set(113, 0.045, -21);
  runway.receiveShadow = true;
  scene.add(runway);

  for (let rz = -52; rz <= 10; rz += 5.2) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.015, 2.8), whitePaintMat);
    dash.position.set(113, 0.072, rz);
    scene.add(dash);
  }
  for (const tz of [-54.5, 12.5]) {
    for (let tx = -4.2; tx <= 4.2; tx += 1.4) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.015, 3.2), whitePaintMat);
      bar.position.set(113 + tx, 0.072, tz);
      scene.add(bar);
    }
  }
  const taxi = new THREE.Mesh(new THREE.BoxGeometry(11, 0.015, 0.25), stripeMat);
  taxi.position.set(104, 0.068, -2);
  scene.add(taxi);

  const edgePositions: [number, number][] = [];
  for (let lz = -56; lz <= 14; lz += 7) {
    edgePositions.push([106.5, lz], [119.5, lz]);
  }
  const edgeGeo = new THREE.SphereGeometry(0.22, 8, 8);
  edgeGeo.translate(0, 0.22, 0);
  const edgeLights = new THREE.InstancedMesh(
    edgeGeo,
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
    edgePositions.length,
  );
  const dummy = new THREE.Object3D();
  edgePositions.forEach(([lx, lz], i) => {
    dummy.position.set(lx, 0.04, lz);
    dummy.updateMatrix();
    edgeLights.setMatrixAt(i, dummy.matrix);
  });
  edgeLights.instanceMatrix.needsUpdate = true;
  edgeLights.computeBoundingSphere();
  scene.add(edgeLights);

  const parkedPlane = createAirplaneMesh(0xf8fafc, accent);
  parkedPlane.position.set(99, 0, -10);
  parkedPlane.rotation.y = Math.PI * 0.14;
  scene.add(parkedPlane);
  addBoxCollider(99, -10, 6.5, 9.5);

  return { atcRadar, gatePadRing, signTex };
}

function createHouseSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('YOUR HOUSE', 256, 48);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('WALK IN · RECHARGE OOTBLUE 1', 256, 92);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildPlayerHouse(
  scene: THREE.Scene,
  addBoxCollider: (cx: number, cz: number, w: number, d: number, pad?: number) => void,
  plazaMat: THREE.Material,
  lawnMat: THREE.Material,
): { welcomeRing: THREE.Mesh; houseSignTex: THREE.CanvasTexture } {
  const hx = 28;
  const hz = -7;
  const w = 8.4;
  const d = 7.0;
  const wallH = 3.8;

  const homeGroup = new THREE.Group();
  homeGroup.position.set(hx, 0, hz);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 });
  const accentWallMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.45 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.48, metalness: 0.3 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xb47b48, roughness: 0.68 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x0284c7,
    emissiveIntensity: 0.3,
    roughness: 0.12,
  });

  const yard = new THREE.Mesh(new THREE.BoxGeometry(w + 3.4, 0.06, d + 4.8), lawnMat);
  yard.position.set(0, 0.015, 0.8);
  homeGroup.add(yard);

  const walkway = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 4.2), plazaMat);
  walkway.position.set(0, 0.03, d / 2 + 2.0);
  homeGroup.add(walkway);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, d), floorMat);
  floor.position.set(0, 0.09, 0);
  homeGroup.add(floor);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 0.35), wallMat);
  backWall.position.set(0, 0.18 + wallH / 2, -d / 2 + 0.17);
  homeGroup.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, wallH, d), wallMat);
  leftWall.position.set(-w / 2 + 0.17, 0.18 + wallH / 2, 0);
  homeGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, wallH, d), wallMat);
  rightWall.position.set(w / 2 - 0.17, 0.18 + wallH / 2, 0);
  homeGroup.add(rightWall);

  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(2.9, wallH, 0.35), wallMat);
  frontLeft.position.set(-2.75, 0.18 + wallH / 2, d / 2 - 0.17);
  homeGroup.add(frontLeft);

  const frontRight = new THREE.Mesh(new THREE.BoxGeometry(2.9, wallH, 0.35), wallMat);
  frontRight.position.set(2.75, 0.18 + wallH / 2, d / 2 - 0.17);
  homeGroup.add(frontRight);

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.15, 0.36), accentWallMat);
  lintel.position.set(0, 0.18 + wallH - 0.58, d / 2 - 0.17);
  homeGroup.add(lintel);

  // Framed Mullioned Front & Side Windows + Porch Lanterns + Columns
  for (const wx of [-2.75, 2.75]) {
    const fFrame = new THREE.Mesh(new THREE.BoxGeometry(1.66, 1.5, 0.44), trimMat);
    fFrame.position.set(wx, 1.85, d / 2 - 0.17);
    homeGroup.add(fFrame);
    const fWin = new THREE.Mesh(new THREE.BoxGeometry(1.46, 1.3, 0.48), glassMat);
    fWin.position.set(wx, 1.85, d / 2 - 0.17);
    homeGroup.add(fWin);
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.32, 0.5), trimMat);
    mullion.position.set(wx, 1.85, d / 2 - 0.17);
    homeGroup.add(mullion);
  }

  for (const sx of [-w / 2 + 0.17, w / 2 - 0.17]) {
    const sFrame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.45, 1.65), trimMat);
    sFrame.position.set(sx, 1.9, 0);
    homeGroup.add(sFrame);
    const sWin = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.25, 1.45), glassMat);
    sWin.position.set(sx, 1.9, 0);
    homeGroup.add(sWin);
  }

  // Modern Pitched Roof with Overhanging Eaves, Ridge Trim & Brick Chimney
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-(w / 2 + 0.65), -0.08);
  roofShape.lineTo(w / 2 + 0.65, -0.08);
  roofShape.lineTo(0, 2.25);
  roofShape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: d + 1.05,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 1,
  });
  roofGeo.translate(0, 0, -(d + 1.05) / 2);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 0.18 + wallH;
  homeGroup.add(roof);

  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 1.8, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.85 }),
  );
  chimney.position.set(-2.6, 0.18 + wallH + 1.2, -1.6);
  homeGroup.add(chimney);

  const porchCanopy = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.24, 1.85), roofMat);
  porchCanopy.position.set(0, 3.08, d / 2 + 0.85);
  homeGroup.add(porchCanopy);

  for (const px of [-1.85, 1.85]) {
    const pBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.28), stoneMat);
    pBase.position.set(px, 0.2, d / 2 + 1.6);
    homeGroup.add(pBase);
    const pCol = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.72, 10), trimMat);
    pCol.position.set(px, 1.68, d / 2 + 1.6);
    homeGroup.add(pCol);
  }

  const houseSignTex = createHouseSignTexture();
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.82, 0.12),
    new THREE.MeshStandardMaterial({
      map: houseSignTex,
      emissive: 0xffffff,
      emissiveMap: houseSignTex,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    }),
  );
  signMesh.position.set(0, 3.65, d / 2 + 1.68);
  homeGroup.add(signMesh);

  const mbPost = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 8), roofMat);
  mbPost.position.set(2.4, 0.5, d / 2 + 1.4);
  homeGroup.add(mbPost);
  const mbBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.55), accentWallMat);
  mbBox.position.set(2.4, 1.05, d / 2 + 1.4);
  homeGroup.add(mbBox);

  // Detailed Interior Furniture
  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.04, 2.7),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.9 }),
  );
  rug.position.set(0, 0.2, 0.1);
  homeGroup.add(rug);

  // Slatted Wooden Headboard Bed + Nightstand + Lamp
  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.42, 2.55), darkWoodMat);
  bedFrame.position.set(-2.6, 0.39, -1.8);
  homeGroup.add(bedFrame);
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.05, 0.14), darkWoodMat);
  headboard.position.set(-2.6, 0.9, -3.05);
  homeGroup.add(headboard);
  const duvet = new THREE.Mesh(
    new THREE.BoxGeometry(1.98, 0.22, 1.85),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.85 }),
  );
  duvet.position.set(-2.6, 0.64, -1.48);
  homeGroup.add(duvet);
  const pillow = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.18, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 }),
  );
  pillow.position.set(-2.6, 0.68, -2.68);
  homeGroup.add(pillow);

  const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.55), darkWoodMat);
  nightstand.position.set(-1.05, 0.46, -2.75);
  homeGroup.add(nightstand);
  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.22, 0.24, 12),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 0.75 }),
  );
  lampShade.position.set(-1.05, 0.98, -2.75);
  homeGroup.add(lampShade);

  // Desk + Wide Curved Monitor + Keyboard + Chair
  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.08, 0.92),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45 }),
  );
  desk.position.set(2.55, 0.9, -2.6);
  homeGroup.add(desk);
  for (const dlx of [1.62, 3.48]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.8), roofMat);
    leg.position.set(dlx, 0.52, -2.6);
    homeGroup.add(leg);
  }
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, 0.68, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.78 }),
  );
  monitor.position.set(2.55, 1.38, -2.82);
  homeGroup.add(monitor);
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.22), roofMat);
  keyboard.position.set(2.55, 0.96, -2.42);
  homeGroup.add(keyboard);

  // Sofa + Cushions + Coffee Table
  const sofaMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.48, 2.45), sofaMat);
  sofaBase.position.set(3.15, 0.42, 0.6);
  homeGroup.add(sofaBase);
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 2.45), sofaMat);
  sofaBack.position.set(3.55, 0.78, 0.6);
  homeGroup.add(sofaBack);
  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.36, 1.4), darkWoodMat);
  coffeeTable.position.set(1.5, 0.36, 0.6);
  homeGroup.add(coffeeTable);

  // Pendant Ceiling Chandelier
  const chord = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8), roofMat);
  chord.position.set(0, wallH - 0.12, 0);
  homeGroup.add(chord);
  const lampOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 0.95 }),
  );
  lampOrb.position.set(0, wallH - 0.55, 0);
  homeGroup.add(lampOrb);

  homeGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      if (obj === yard || obj === walkway) {
        obj.receiveShadow = true;
      } else {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    }
  });

  scene.add(homeGroup);

  addBoxCollider(hx, hz - d / 2 + 0.17, w, 0.45, 0.25);
  addBoxCollider(hx - w / 2 + 0.17, hz, 0.45, d, 0.25);
  addBoxCollider(hx + w / 2 - 0.17, hz, 0.45, d, 0.25);
  addBoxCollider(hx - 2.75, hz + d / 2 - 0.17, 2.9, 0.45, 0.22);
  addBoxCollider(hx + 2.75, hz + d / 2 - 0.17, 2.9, 0.45, 0.22);

  const welcomeRing = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.48, 28),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    }),
  );
  welcomeRing.rotation.x = -Math.PI / 2;
  welcomeRing.position.set(hx, 0.1, hz + d / 2 + 1.3);
  scene.add(welcomeRing);

  return { welcomeRing, houseSignTex };
}

export function buildCountryLandmarks(
  scene: THREE.Scene,
  country: CountryDestination,
  woodMat: THREE.Material,
  stoneMat: THREE.Material,
): { skipDefaultNorthTower: boolean } {
  const kind = country.palette.landmarkKind;

  // JAPAN: Concave Lathe Mount Fuji + Curved-Lintel Torii Gate + Upturned-Eave 5-Tier Pagoda
  if (kind === 'torii_pagoda') {
    const fuji = new THREE.Group();
    fuji.position.set(0, 0, -112);
    const fujiGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(48, 0),
        new THREE.Vector2(36, 9),
        new THREE.Vector2(25, 21),
        new THREE.Vector2(15, 34),
        new THREE.Vector2(7.5, 44),
        new THREE.Vector2(4.2, 43.2),
        new THREE.Vector2(0, 42.5),
      ],
      28,
    );
    fuji.add(
      new THREE.Mesh(
        fujiGeo,
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 }),
      ),
    );
    const snowGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(18.5, 30),
        new THREE.Vector2(15.2, 34.2),
        new THREE.Vector2(7.6, 44.1),
        new THREE.Vector2(4.2, 43.3),
        new THREE.Vector2(0, 42.6),
      ],
      28,
    );
    fuji.add(
      new THREE.Mesh(
        snowGeo,
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 }),
      ),
    );
    scene.add(fuji);

    // Authentic Curved-Kasagi Crimson Torii Gate (0, 0, 11)
    const torii = new THREE.Group();
    torii.position.set(0, 0, 11);
    const vermilion = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.44 });
    const darkBase = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.25 });

    for (const px of [-2.4, 2.4]) {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.95, 14), darkBase);
      base.position.set(px, 0.48, 0);
      torii.add(base);
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 5.4, 14), vermilion);
      pillar.position.set(px, 3.1, 0);
      pillar.rotation.z = px > 0 ? 0.04 : -0.04;
      torii.add(pillar);
    }
    const lowerBeam = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.36, 0.34), vermilion);
    lowerBeam.position.set(0, 4.6, 0);
    torii.add(lowerBeam);

    // Curved upturned Kasagi lintel
    const kasagiShape = new THREE.Shape();
    kasagiShape.moveTo(-4.3, 0.42);
    kasagiShape.quadraticCurveTo(0, -0.08, 4.3, 0.42);
    kasagiShape.lineTo(4.1, 0.05);
    kasagiShape.quadraticCurveTo(0, -0.42, -4.1, 0.05);
    kasagiShape.closePath();
    const kasagiGeo = new THREE.ExtrudeGeometry(kasagiShape, { depth: 0.62, bevelEnabled: false });
    kasagiGeo.translate(0, 0, -0.31);
    const kasagi = new THREE.Mesh(kasagiGeo, darkBase);
    kasagi.position.set(0, 5.95, 0);
    torii.add(kasagi);

    const shimaki = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.38, 0.52), vermilion);
    shimaki.position.set(0, 5.65, 0);
    torii.add(shimaki);

    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.42), darkBase);
    plaque.position.set(0, 5.1, 0);
    torii.add(plaque);
    const plaqueFrame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.46), goldMat);
    plaqueFrame.position.set(0, 5.1, 0);
    torii.add(plaqueFrame);
    scene.add(torii);

    // 5-Tier Harbor Pagoda with Flared Eaves & Ringed Sorin Spire
    const pagoda = new THREE.Group();
    pagoda.position.set(0, 0.35, 42);
    const slateRoof = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    for (let tier = 0; tier < 5; tier++) {
      const scale = 1 - tier * 0.135;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.5 * scale, 1.38, 2.5 * scale),
        vermilion,
      );
      body.position.y = tier * 1.82 + 0.69;
      pagoda.add(body);

      const balcony = new THREE.Mesh(
        new THREE.BoxGeometry(3.05 * scale, 0.14, 3.05 * scale),
        darkBase,
      );
      balcony.position.y = tier * 1.82 + 0.08;
      pagoda.add(balcony);

      const eaveLower = new THREE.Mesh(
        new THREE.ConeGeometry(2.85 * scale, 0.62, 4),
        slateRoof,
      );
      eaveLower.rotation.y = Math.PI / 4;
      eaveLower.position.y = tier * 1.82 + 1.56;
      pagoda.add(eaveLower);

      const eaveUpper = new THREE.Mesh(
        new THREE.ConeGeometry(2.3 * scale, 0.52, 4),
        slateRoof,
      );
      eaveUpper.rotation.y = Math.PI / 4;
      eaveUpper.position.y = tier * 1.82 + 1.84;
      pagoda.add(eaveUpper);
    }
    const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.16, 2.6, 10), goldMat);
    finial.position.y = 10.6;
    pagoda.add(finial);
    for (let r = 0; r < 5; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24 - r * 0.025, 0.03, 6, 12), goldMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 9.75 + r * 0.32;
      pagoda.add(ring);
    }
    scene.add(pagoda);
    return { skipDefaultNorthTower: false };
  }

  // EGYPT: Stepped-Masonry Pyramids of Giza + Sculpted Great Sphinx + Luxor Obelisk
  if (kind === 'pyramids') {
    const sandStone = new THREE.MeshStandardMaterial({ color: 0xd9a05b, roughness: 0.84 });
    const darkStone = new THREE.MeshStandardMaterial({ color: 0xb68144, roughness: 0.88 });
    const nemesMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.52 });
    const goldTip = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.8,
      roughness: 0.18,
    });
    const pyramidCoords: [number, number, number, number][] = [
      [-55, -76, 26, 26],
      [0, -86, 34, 34],
      [54, -76, 22, 22],
    ];
    for (const [px, pz, r, h] of pyramidCoords) {
      const pyr = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), sandStone);
      pyr.rotation.y = Math.PI / 4;
      pyr.position.set(px, h / 2 - 0.3, pz);
      scene.add(pyr);

      // Stepped limestone masonry tiers near base
      for (let t = 0; t < 4; t++) {
        const tierFrac = 1 - t * 0.18;
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(r * 1.42 * tierFrac, 1.15, r * 1.42 * tierFrac),
          t % 2 === 0 ? sandStone : darkStone,
        );
        step.position.set(px, t * 1.15 + 0.4, pz);
        scene.add(step);
      }

      const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.14, h * 0.14, 4), goldTip);
      cap.rotation.y = Math.PI / 4;
      cap.position.set(px, h - (h * 0.14) / 2 - 0.25, pz);
      scene.add(cap);
    }

    // Sculpted Great Sphinx of Giza (-20, 0, -40)
    const sphinx = new THREE.Group();
    sphinx.position.set(-20, 0, -40);
    const spBase = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.7, 11.8), darkStone);
    spBase.position.y = 0.35;
    sphinx.add(spBase);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(1.75, 4.4, 8, 14), sandStone);
    torso.rotation.x = Math.PI / 2;
    torso.scale.set(1.08, 1.0, 0.86);
    torso.position.set(0, 2.0, -1.0);
    sphinx.add(torso);

    for (const px of [-1.25, 1.25]) {
      const haunch = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), sandStone);
      haunch.scale.set(0.85, 0.9, 1.35);
      haunch.position.set(px * 1.1, 1.4, -3.2);
      sphinx.add(haunch);

      const paw = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 3.6, 6, 10), sandStone);
      paw.rotation.x = Math.PI / 2;
      paw.position.set(px, 1.05, 3.3);
      sphinx.add(paw);
    }

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 1.8, 12), sandStone);
    neck.position.set(0, 3.3, 1.9);
    sphinx.add(neck);

    const spHead = new THREE.Mesh(new THREE.SphereGeometry(1.18, 16, 14), sandStone);
    spHead.scale.set(0.92, 1.15, 1.02);
    spHead.position.set(0, 4.65, 2.2);
    sphinx.add(spHead);

    // Flared Nemes Headdress Wings & Gold Uraeus Cobra
    for (const side of [-1, 1]) {
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 2.1, 1.35), nemesMat);
      flap.position.set(side * 1.15, 4.25, 2.05);
      flap.rotation.z = side * -0.18;
      sphinx.add(flap);
    }
    const nemesCrown = new THREE.Mesh(new THREE.SphereGeometry(1.32, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), nemesMat);
    nemesCrown.position.set(0, 4.8, 2.0);
    sphinx.add(nemesCrown);

    const cobra = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.85, 8), goldTip);
    cobra.position.set(0, 5.75, 2.95);
    cobra.rotation.x = 0.25;
    sphinx.add(cobra);

    const beard = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.14, 1.1, 8), goldTip);
    beard.position.set(0, 3.35, 2.95);
    beard.rotation.x = -0.2;
    sphinx.add(beard);
    scene.add(sphinx);

    const obelisk = new THREE.Group();
    obelisk.position.set(0, 0.35, 42);
    const obPlinth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 2.4), darkStone);
    obPlinth.position.y = 0.45;
    obelisk.add(obPlinth);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.95, 7.6, 4), sandStone);
    shaft.rotation.y = Math.PI / 4;
    shaft.position.y = 4.6;
    obelisk.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.3, 4), goldTip);
    tip.rotation.y = Math.PI / 4;
    tip.position.y = 9.05;
    obelisk.add(tip);
    scene.add(obelisk);
    return { skipDefaultNorthTower: false };
  }

  // Standard Coastal Lighthouse at Pier End (used by Ootblue, France, Brazil)
  const lighthouseGroup = new THREE.Group();
  lighthouseGroup.position.set(0, 0.35, 42);
  const lhStone = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
  const lhWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.48 });
  const lhAccent = new THREE.MeshStandardMaterial({ color: country.palette.accentColor, roughness: 0.38 });
  const lhIron = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });

  const lhPlinth = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.95, 1.2, 16), lhStone);
  lhPlinth.position.y = 0.6;
  lighthouseGroup.add(lhPlinth);

  const lhTowerGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(1.6, 1.2),
      new THREE.Vector2(1.22, 5.2),
      new THREE.Vector2(1.05, 7.5),
      new THREE.Vector2(1.42, 7.7),
      new THREE.Vector2(1.42, 8.0),
    ],
    20,
  );
  lighthouseGroup.add(new THREE.Mesh(lhTowerGeo, lhWhite));

  const lhStripe = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.38, 1.9, 20), lhAccent);
  lhStripe.position.y = 4.6;
  lighthouseGroup.add(lhStripe);

  const galleryRail = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.055, 6, 20), lhIron);
  galleryRail.rotation.x = Math.PI / 2;
  galleryRail.position.y = 8.45;
  lighthouseGroup.add(galleryRail);

  const lhLantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 0.88, 1.25, 14),
    new THREE.MeshStandardMaterial({
      color: country.palette.accentColor,
      emissive: country.palette.accentColor,
      emissiveIntensity: 0.85,
    }),
  );
  lhLantern.position.y = 8.65;
  lighthouseGroup.add(lhLantern);

  const lhCupola = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.95, 14), lhIron);
  lhCupola.position.y = 9.75;
  lighthouseGroup.add(lhCupola);
  scene.add(lighthouseGroup);

  // OOTBLUE REPUBLIC: Sweeping Tube-Arch Coastal Monument (0, 0, 12.5)
  if (kind === 'ootblue_tower') {
    const obArch = new THREE.Group();
    obArch.position.set(0, 0, 12.5);
    const titanium = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.65, roughness: 0.2 });
    const skyGlow = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
    });

    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.3, 0, 0),
      new THREE.Vector3(-3.0, 4.4, 0),
      new THREE.Vector3(-1.6, 6.9, 0),
      new THREE.Vector3(0, 7.6, 0),
      new THREE.Vector3(1.6, 6.9, 0),
      new THREE.Vector3(3.0, 4.4, 0),
      new THREE.Vector3(3.3, 0, 0),
    ]);
    obArch.add(new THREE.Mesh(new THREE.TubeGeometry(archCurve, 32, 0.36, 12, false), titanium));
    obArch.add(new THREE.Mesh(new THREE.TubeGeometry(archCurve, 32, 0.14, 8, false), skyGlow));

    for (const px of [-3.3, 3.3]) {
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.82, 0.65, 12), titanium);
      plinth.position.set(px, 0.32, 0);
      obArch.add(plinth);
    }

    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), skyGlow);
    orb.position.set(0, 8.75, 0);
    obArch.add(orb);
    scene.add(obArch);
  }

  // FRANCE: Iconic Curved-Leg Lattice Eiffel Tower + Hollowed Arch Arc de Triomphe
  if (kind === 'eiffel') {
    const eiffel = new THREE.Group();
    eiffel.position.set(0, 0, -53);
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.7,
      roughness: 0.32,
    });
    const deckGlow = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.55,
    });

    // 4 Gracefully Curved Legs from ground to 1st & 2nd observation decks
    const legShape = new THREE.Shape();
    legShape.moveTo(4.8, 0);
    legShape.quadraticCurveTo(3.4, 8.5, 1.9, 17.5);
    legShape.lineTo(0.85, 17.5);
    legShape.quadraticCurveTo(2.0, 8.5, 3.2, 0);
    legShape.closePath();
    const legGeo = new THREE.ExtrudeGeometry(legShape, { depth: 1.0, bevelEnabled: false });
    legGeo.translate(0, 0, -0.5);

    for (let c = 0; c < 4; c++) {
      const leg = new THREE.Mesh(legGeo, ironMat);
      leg.rotation.y = (c * Math.PI) / 2 + Math.PI / 4;
      eiffel.add(leg);
    }

    // Semicircular Iron Portal Arches at Base on all 4 sides
    for (let side = 0; side < 4; side++) {
      const portal = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.24, 8, 18, Math.PI), ironMat);
      portal.position.set(
        Math.sin((side * Math.PI) / 2) * 3.1,
        1.2,
        Math.cos((side * Math.PI) / 2) * 3.1,
      );
      portal.rotation.y = (side * Math.PI) / 2;
      eiffel.add(portal);
    }

    // 1st & 2nd Observation Decks with Guardrail Rings
    const deck1 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.85, 6.8), ironMat);
    deck1.position.y = 10.6;
    eiffel.add(deck1);

    const deck2 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.78, 4.4), deckGlow);
    deck2.position.y = 17.6;
    eiffel.add(deck2);

    // Tapered Upper Iron Shaft + Gallery + Antenna Spire
    const upperShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.55, 18.5, 4), ironMat);
    upperShaft.rotation.y = Math.PI / 4;
    upperShaft.position.y = 27.0;
    eiffel.add(upperShaft);

    const topGallery = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.75, 1.75), deckGlow);
    topGallery.position.y = 36.2;
    eiffel.add(topGallery);

    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.24, 5.2, 8), ironMat);
    spire.position.y = 39.2;
    eiffel.add(spire);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 12), deckGlow);
    beacon.position.y = 42.0;
    eiffel.add(beacon);

    scene.add(eiffel);

    // Hollowed Arc de Triomphe with True Arched Vault Cutout (0, 0, -22)
    const arc = new THREE.Group();
    arc.position.set(0, 0, -22);
    const limestone = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.72 });
    const frieze = new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.78 });

    const arcShape = new THREE.Shape();
    arcShape.moveTo(-4.1, 0);
    arcShape.lineTo(-1.85, 0);
    arcShape.lineTo(-1.85, 3.6);
    arcShape.absarc(0, 3.6, 1.85, Math.PI, 0, true);
    arcShape.lineTo(1.85, 0);
    arcShape.lineTo(4.1, 0);
    arcShape.lineTo(4.1, 7.2);
    arcShape.lineTo(-4.1, 7.2);
    arcShape.closePath();

    const arcGeo = new THREE.ExtrudeGeometry(arcShape, {
      depth: 3.1,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 1,
    });
    arcGeo.translate(0, 0, -1.55);
    arc.add(new THREE.Mesh(arcGeo, limestone));

    const cornice = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.55, 3.55), frieze);
    cornice.position.set(0, 7.45, 0);
    arc.add(cornice);
    const attic = new THREE.Mesh(new THREE.BoxGeometry(8.3, 1.15, 3.2), limestone);
    attic.position.set(0, 8.25, 0);
    arc.add(attic);
    scene.add(arc);

    return { skipDefaultNorthTower: true };
  }

  // BRAZIL: Sculpted Corcovado Peak + Draped Lathe Christ the Redeemer + Sugarloaf Monolith
  if (kind === 'sugarloaf') {
    const corcovado = new THREE.Group();
    corcovado.position.set(0, 0, -96);
    const mtnGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(30, 0),
        new THREE.Vector2(21, 9),
        new THREE.Vector2(13, 18),
        new THREE.Vector2(6.5, 25),
        new THREE.Vector2(4.2, 27.5),
        new THREE.Vector2(0, 27.5),
      ],
      18,
    );
    corcovado.add(
      new THREE.Mesh(
        mtnGeo,
        new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 }),
      ),
    );

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 3.2, 5.4, 14),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.68 }),
    );
    pedestal.position.y = 29.8;
    corcovado.add(pedestal);

    const statueMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.44 });
    const robeGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(1.75, 0),
        new THREE.Vector2(1.45, 3.5),
        new THREE.Vector2(1.25, 7.2),
        new THREE.Vector2(1.55, 9.6),
        new THREE.Vector2(0.85, 10.6),
        new THREE.Vector2(0.55, 11.2),
      ],
      18,
    );
    const robe = new THREE.Mesh(robeGeo, statueMat);
    robe.position.y = 32.3;
    corcovado.add(robe);

    // Tapered Outstretched Arms + Sleeves + Sculpted Head
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.72, 6.8, 10), statueMat);
      arm.rotation.z = side * (Math.PI / 2);
      arm.position.set(side * 4.2, 41.2, 0);
      corcovado.add(arm);
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 14), statueMat);
    head.scale.set(0.92, 1.15, 0.96);
    head.position.y = 44.3;
    corcovado.add(head);
    scene.add(corcovado);

    // Sugarloaf Monolithic Granite Peak across harbor (-66, 0, 62)
    const granite = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    const sugarGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(22, 0),
        new THREE.Vector2(19, 8),
        new THREE.Vector2(16, 18),
        new THREE.Vector2(12, 28),
        new THREE.Vector2(6, 34),
        new THREE.Vector2(0, 35.5),
      ],
      20,
    );
    const peak = new THREE.Mesh(sugarGeo, granite);
    peak.scale.set(1.12, 1.0, 0.94);
    peak.position.set(-66, 0, 62);
    scene.add(peak);

    const tropBase = new THREE.Mesh(
      new THREE.CylinderGeometry(21, 26, 5, 16),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 }),
    );
    tropBase.position.set(-66, 2.2, 62);
    scene.add(tropBase);
  }

  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.position.y > 0.2) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  void woodMat;
  void stoneMat;
  return { skipDefaultNorthTower: false };
}

export function buildBiomeTrees(
  scene: THREE.Scene,
  treePositions: [number, number, number][],
  treeKind: CountryDestination['palette']['treeKind'],
): void {
  if (treePositions.length === 0) return;
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  if (treeKind === 'palm') {
    // Segmented Curved Palm Trunks + Coconut Cluster + 7 Arched Multi-Segment Fronds
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.22, 1.6, 0.05),
      new THREE.Vector3(0.55, 3.2, 0.12),
      new THREE.Vector3(0.75, 4.6, 0.15),
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 10, 0.24, 8, false);
    const trunkMesh = new THREE.InstancedMesh(
      trunkGeo,
      new THREE.MeshStandardMaterial({ color: 0x9a6b3e, roughness: 0.9 }),
      treePositions.length,
    );
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;

    const frondShape = new THREE.Shape();
    frondShape.moveTo(0, 0);
    frondShape.quadraticCurveTo(1.1, 0.42, 2.25, -0.35);
    frondShape.quadraticCurveTo(1.1, 0.26, 0, -0.08);
    frondShape.closePath();
    const frondGeo = new THREE.ExtrudeGeometry(frondShape, { depth: 0.36, bevelEnabled: false });
    frondGeo.translate(0, 0, -0.18);
    frondGeo.rotateY(-Math.PI / 2);

    const bladesPerTree = 7;
    const frondMesh = new THREE.InstancedMesh(
      frondGeo,
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.76 }),
      treePositions.length * bladesPerTree,
    );
    frondMesh.castShadow = true;
    frondMesh.receiveShadow = true;

    const baseGreen = new THREE.Color(0x16a34a);
    let fIdx = 0;
    treePositions.forEach(([tx, tz, sc], idx) => {
      const yaw = idx * 1.1;
      dummy.position.set(tx, 0, tz);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(idx, dummy.matrix);

      // Crown top offset in local space rotated by yaw
      const crownX = tx + (Math.cos(-yaw) * 0.75 - Math.sin(-yaw) * 0.15) * sc;
      const crownZ = tz + (Math.sin(-yaw) * 0.75 + Math.cos(-yaw) * 0.15) * sc;

      for (let b = 0; b < bladesPerTree; b++) {
        const ang = (b / bladesPerTree) * Math.PI * 2 + idx * 0.5;
        dummy.position.set(crownX, 4.55 * sc, crownZ);
        dummy.rotation.set(0.08 + (b % 2) * 0.12, ang, 0);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        frondMesh.setMatrixAt(fIdx, dummy.matrix);
        tint.copy(baseGreen).offsetHSL(((idx + b) % 5) * 0.012 - 0.025, 0, ((b % 3) - 1) * 0.04);
        frondMesh.setColorAt(fIdx, tint);
        fIdx++;
      }
    });
    trunkMesh.instanceMatrix.needsUpdate = true;
    frondMesh.instanceMatrix.needsUpdate = true;
    if (frondMesh.instanceColor) frondMesh.instanceColor.needsUpdate = true;
    trunkMesh.computeBoundingSphere();
    frondMesh.computeBoundingSphere();
    scene.add(trunkMesh, frondMesh);
    return;
  }

  // Flared Buttress Trunk + Multi-Cluster Foliage
  const trunkGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.42, 0),
      new THREE.Vector2(0.28, 0.55),
      new THREE.Vector2(0.23, 1.4),
      new THREE.Vector2(0.18, 2.35),
    ],
    10,
  );
  const trunkMesh = new THREE.InstancedMesh(
    trunkGeo,
    new THREE.MeshStandardMaterial({
      color: treeKind === 'sakura' ? 0x451a03 : 0x5c3a21,
      roughness: 0.9,
    }),
    treePositions.length,
  );
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;

  const clustersPerTree = treeKind === 'cypress' ? 2 : 3;
  const leafGeo =
    treeKind === 'sakura'
      ? new THREE.IcosahedronGeometry(1.38, 2)
      : treeKind === 'cypress'
        ? new THREE.ConeGeometry(1.05, 3.8, 12)
        : new THREE.ConeGeometry(1.55, 2.9, 12);

  const baseLeafColor = new THREE.Color(
    treeKind === 'sakura'
      ? 0xf472b6
      : treeKind === 'cypress'
        ? 0x2d5a3f
        : 0x2d6a4f,
  );

  const leafMesh = new THREE.InstancedMesh(
    leafGeo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 }),
    treePositions.length * clustersPerTree,
  );
  leafMesh.castShadow = true;
  leafMesh.receiveShadow = true;

  let lIdx = 0;
  treePositions.forEach(([tx, tz, sc], idx) => {
    dummy.position.set(tx, 0, tz);
    dummy.rotation.set(0, idx * 0.6, 0);
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(idx, dummy.matrix);

    if (treeKind === 'sakura') {
      const offsets: [number, number, number, number][] = [
        [0, 3.6, 0, 1.15],
        [-0.75, 3.0, 0.45, 0.88],
        [0.72, 3.15, -0.4, 0.92],
      ];
      for (let c = 0; c < offsets.length; c++) {
        const [ox, oy, oz, cs] = offsets[c];
        dummy.position.set(tx + ox * sc, oy * sc, tz + oz * sc);
        dummy.rotation.set(c * 0.4, idx + c, 0);
        dummy.scale.setScalar(sc * cs);
        dummy.updateMatrix();
        leafMesh.setMatrixAt(lIdx, dummy.matrix);
        tint.copy(baseLeafColor).offsetHSL(0, 0, ((idx + c) % 4) * 0.035 - 0.04);
        leafMesh.setColorAt(lIdx, tint);
        lIdx++;
      }
    } else if (treeKind === 'cypress') {
      const tiers: [number, number][] = [
        [3.1, 1.0],
        [5.0, 0.72],
      ];
      for (let c = 0; c < tiers.length; c++) {
        const [oy, cs] = tiers[c];
        dummy.position.set(tx, oy * sc, tz);
        dummy.rotation.set(0, idx + c * 0.5, 0);
        dummy.scale.setScalar(sc * cs);
        dummy.updateMatrix();
        leafMesh.setMatrixAt(lIdx, dummy.matrix);
        tint.copy(baseLeafColor).offsetHSL(((idx + c) % 3) * 0.015 - 0.015, 0, c * 0.03);
        leafMesh.setColorAt(lIdx, tint);
        lIdx++;
      }
    } else {
      const tiers: [number, number][] = [
        [2.7, 1.08],
        [4.0, 0.85],
        [5.1, 0.62],
      ];
      for (let c = 0; c < tiers.length; c++) {
        const [oy, cs] = tiers[c];
        dummy.position.set(tx, oy * sc, tz);
        dummy.rotation.set(0, idx + c * 0.7, 0);
        dummy.scale.setScalar(sc * cs);
        dummy.updateMatrix();
        leafMesh.setMatrixAt(lIdx, dummy.matrix);
        tint.copy(baseLeafColor).offsetHSL(((idx + c) % 4) * 0.01 - 0.02, 0, (c - 1) * 0.035);
        leafMesh.setColorAt(lIdx, tint);
        lIdx++;
      }
    }
  });

  trunkMesh.instanceMatrix.needsUpdate = true;
  leafMesh.instanceMatrix.needsUpdate = true;
  if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
  trunkMesh.computeBoundingSphere();
  leafMesh.computeBoundingSphere();
  scene.add(trunkMesh, leafMesh);
}
