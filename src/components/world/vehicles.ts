import * as THREE from 'three';

export interface VehicleRig {
  group: THREE.Group;
  wheels: THREE.Group[];
  frontWheelPivots: THREE.Group[];
  steeringWheel: THREE.Group;
  seatMount: THREE.Group;
}

export interface BoatRig {
  group: THREE.Group;
  wakeMesh: THREE.Mesh;
  steeringWheel: THREE.Group;
  seatMount: THREE.Group;
}

function makeExtrudedSideSection(
  points: [number, number][],
  width: number,
  bevel = 0.04,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();

  const innerW = Math.max(0.05, width - bevel * 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: innerW,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -innerW / 2);
  // Map +X_shape -> +Z (forward) and +Z_extrude -> -X (centered width)
  geo.rotateY(-Math.PI / 2);
  return geo;
}

function buildWheelAssembly(wheelR: number, tireWidth: number, isLeft: boolean): THREE.Group {
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.88 });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.88,
    roughness: 0.18,
  });
  const rotorMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.82,
    roughness: 0.3,
  });
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.4,
    roughness: 0.35,
  });
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.7,
    roughness: 0.3,
  });

  const wheel = new THREE.Group();

  // Tire tread & beveled shoulder ring
  const tireGeo = new THREE.CylinderGeometry(wheelR, wheelR, tireWidth, 24);
  tireGeo.rotateZ(Math.PI / 2);
  wheel.add(new THREE.Mesh(tireGeo, tireMat));

  // Inner barrel & ventilated brake rotor
  const barrelGeo = new THREE.CylinderGeometry(wheelR * 0.65, wheelR * 0.65, tireWidth * 0.85, 18);
  barrelGeo.rotateZ(Math.PI / 2);
  wheel.add(new THREE.Mesh(barrelGeo, hubMat));

  const rotorGeo = new THREE.CylinderGeometry(wheelR * 0.48, wheelR * 0.48, tireWidth * 0.3, 16);
  rotorGeo.rotateZ(Math.PI / 2);
  const rotor = new THREE.Mesh(rotorGeo, rotorMat);
  wheel.add(rotor);

  const caliper = new THREE.Mesh(
    new THREE.BoxGeometry(tireWidth * 0.34, wheelR * 0.34, wheelR * 0.22),
    caliperMat,
  );
  caliper.position.set(isLeft ? tireWidth * 0.1 : -tireWidth * 0.1, wheelR * 0.18, -wheelR * 0.28);
  wheel.add(caliper);

  // 5-spoke sculpted metallic alloy rim on outer face
  const faceX = isLeft ? tireWidth * 0.46 : -tireWidth * 0.46;
  const lipRing = new THREE.Mesh(
    new THREE.TorusGeometry(wheelR * 0.64, wheelR * 0.045, 8, 22),
    rimMat,
  );
  lipRing.rotation.y = Math.PI / 2;
  lipRing.position.x = faceX;
  wheel.add(lipRing);

  const spokeGeo = new THREE.BoxGeometry(0.032, wheelR * 1.18, wheelR * 0.13);
  for (let s = 0; s < 5; s++) {
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.position.x = faceX;
    spoke.rotation.x = (s / 5) * Math.PI;
    wheel.add(spoke);
  }

  const centerCap = new THREE.Mesh(
    new THREE.CylinderGeometry(wheelR * 0.16, wheelR * 0.16, 0.045, 12),
    rimMat,
  );
  centerCap.rotation.z = Math.PI / 2;
  centerCap.position.x = faceX;
  wheel.add(centerCap);

  return wheel;
}

function buildSteeringWheelGroup(): THREE.Group {
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.45,
    metalness: 0.25,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.8,
    roughness: 0.25,
  });

  const sw = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 8, 20), wheelMat);
  sw.add(rim);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 12), wheelMat);
  hub.rotation.x = Math.PI / 2;
  sw.add(hub);

  const barH = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.028, 0.02), trimMat);
  sw.add(barH);

  const barV = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.16, 0.02), trimMat);
  barV.position.y = -0.08;
  sw.add(barV);

  return sw;
}

function buildBucketSeat(seatMat: THREE.Material, trimMat: THREE.Material): THREE.Group {
  const seat = new THREE.Group();
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, 0.52), seatMat);
  cushion.position.set(0, 0.07, 0);
  seat.add(cushion);

  // Side bolsters
  for (const bx of [-0.24, 0.24]) {
    const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.48), trimMat);
    bolster.position.set(bx, 0.1, 0);
    seat.add(bolster);
  }

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.13), seatMat);
  backrest.position.set(0, 0.36, -0.22);
  backrest.rotation.x = -0.22;
  seat.add(backrest);

  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.11), trimMat);
  headrest.position.set(0, 0.74, -0.31);
  headrest.rotation.x = -0.15;
  seat.add(headrest);

  return seat;
}

export function createRealisticVehicleMesh(
  style: 'roadster' | 'suv' | 'sedan' | 'bus' | 'van',
  bodyColor: number,
): VehicleRig {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    metalness: 0.48,
    roughness: 0.24,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
  });
  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.58,
    metalness: 0.28,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.16,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.72,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    metalness: 0.35,
    roughness: 0.06,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const opaqueGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.72,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: 0xfef08a,
    emissiveIntensity: 0.95,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.8,
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.4,
  });

  const isBus = style === 'bus';
  const isVan = style === 'van';
  const isSuv = style === 'suv';
  const isRoadster = style === 'roadster';

  const len = isBus ? 7.2 : isVan ? 4.9 : isSuv ? 4.65 : isRoadster ? 4.35 : 4.45;
  const wid = isBus ? 2.35 : isSuv ? 2.08 : 2.0;
  const wheelR = isBus ? 0.46 : isSuv ? 0.43 : 0.36;
  const tireW = isBus ? 0.3 : 0.26;
  const groundClear = wheelR * 0.62;

  const steeringWheel = buildSteeringWheelGroup();
  const seatMount = new THREE.Group();
  group.add(seatMount);

  if (isRoadster) {
    const hoodGeo = makeExtrudedSideSection(
      [
        [0.42, groundClear],
        [2.16, groundClear + 0.04],
        [2.18, 0.68],
        [1.92, 0.86],
        [0.52, 0.96],
        [0.42, 0.44],
      ],
      wid,
      0.05,
    );
    group.add(new THREE.Mesh(hoodGeo, bodyMat));

    const rearGeo = makeExtrudedSideSection(
      [
        [-2.15, groundClear + 0.05],
        [-0.9, groundClear],
        [-0.9, 0.96],
        [-2.02, 0.98],
        [-2.18, 0.72],
      ],
      wid,
      0.05,
    );
    group.add(new THREE.Mesh(rearGeo, bodyMat));

    const floorPan = new THREE.Mesh(
      new THREE.BoxGeometry(wid - 0.16, 0.14, 1.55),
      darkTrimMat,
    );
    floorPan.position.set(0, groundClear + 0.07, -0.22);
    group.add(floorPan);

    for (const sx of [-(wid / 2 - 0.11), wid / 2 - 0.11]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.64, 1.48), bodyMat);
      door.position.set(sx, groundClear + 0.36, -0.22);
      group.add(door);

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.045, 0.22), chromeMat);
      handle.position.set(sx + Math.sign(sx) * 0.1, 0.8, -0.45);
      group.add(handle);

      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.11, 0.14), bodyMat);
      mirror.position.set(sx + Math.sign(sx) * 0.14, 1.02, 0.48);
      group.add(mirror);
    }

    const consoleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 1.35), leatherMat);
    consoleMesh.position.set(0, groundClear + 0.25, -0.18);
    group.add(consoleMesh);

    const dash = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.28, 0.32, 0.38), leatherMat);
    dash.position.set(0, 0.84, 0.42);
    group.add(dash);

    for (const sx of [0.38, -0.38]) {
      const seat = buildBucketSeat(leatherMat, bodyMat);
      seat.position.set(sx, groundClear + 0.14, -0.34);
      group.add(seat);
    }

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.26, 0.56, 0.04), glassMat);
    windshield.position.set(0, 1.15, 0.45);
    windshield.rotation.x = -0.58;
    group.add(windshield);

    for (const ax of [-(wid / 2 - 0.14), wid / 2 - 0.14]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.58, 0.06), chromeMat);
      pillar.position.set(ax, 1.15, 0.45);
      pillar.rotation.x = -0.58;
      group.add(pillar);
    }

    const windshieldHeader = new THREE.Mesh(
      new THREE.BoxGeometry(wid - 0.22, 0.06, 0.07),
      chromeMat,
    );
    windshieldHeader.position.set(0, 1.38, 0.3);
    group.add(windshieldHeader);

    for (const rx of [0.38, -0.38]) {
      const hoop = new THREE.Mesh(
        new THREE.TorusGeometry(0.16, 0.032, 8, 14, Math.PI),
        chromeMat,
      );
      hoop.position.set(rx, 1.0, -0.82);
      group.add(hoop);
    }

    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.2, 0.06, 0.22), darkTrimMat);
    spoiler.position.set(0, 1.04, -2.02);
    group.add(spoiler);

    for (const ex of [-0.52, 0.52]) {
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.2, 10), chromeMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(ex, groundClear + 0.08, -2.18);
      group.add(tip);
    }

    steeringWheel.position.set(0.38, 0.94, 0.22);
    steeringWheel.rotation.x = -0.38;
    group.add(steeringWheel);

    seatMount.position.set(0.38, groundClear + 0.12, -0.28);
  } else if (isSuv) {
    const hoodGeo = makeExtrudedSideSection(
      [
        [0.52, groundClear],
        [2.28, groundClear + 0.06],
        [2.3, 0.88],
        [2.05, 1.14],
        [0.62, 1.18],
        [0.52, 0.52],
      ],
      wid,
      0.05,
    );
    group.add(new THREE.Mesh(hoodGeo, bodyMat));

    const rearGeo = makeExtrudedSideSection(
      [
        [-2.28, groundClear + 0.06],
        [-0.95, groundClear],
        [-0.95, 1.18],
        [-2.26, 1.18],
        [-2.3, 0.72],
      ],
      wid,
      0.05,
    );
    group.add(new THREE.Mesh(rearGeo, bodyMat));

    const floorPan = new THREE.Mesh(
      new THREE.BoxGeometry(wid - 0.14, 0.16, 1.65),
      darkTrimMat,
    );
    floorPan.position.set(0, groundClear + 0.08, -0.2);
    group.add(floorPan);

    for (const sx of [-(wid / 2 - 0.1), wid / 2 - 0.1]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.76, 1.62), bodyMat);
      door.position.set(sx, groundClear + 0.46, -0.2);
      group.add(door);

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.24), chromeMat);
      handle.position.set(sx + Math.sign(sx) * 0.09, 1.0, -0.45);
      group.add(handle);

      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.16), darkTrimMat);
      mirror.position.set(sx + Math.sign(sx) * 0.15, 1.24, 0.5);
      group.add(mirror);
    }

    const dash = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.3, 0.36, 0.4), leatherMat);
    dash.position.set(0, 1.0, 0.45);
    group.add(dash);

    for (const sx of [0.39, -0.39]) {
      const seat = buildBucketSeat(leatherMat, bodyMat);
      seat.position.set(sx, groundClear + 0.16, -0.3);
      group.add(seat);
    }

    const roofY = 1.88;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.18, 0.12, 2.38), bodyMat);
    roof.position.set(0, roofY, -0.82);
    group.add(roof);

    for (const rx of [-0.72, 0.72]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 2.15), chromeMat);
      rail.position.set(rx, roofY + 0.09, -0.85);
      group.add(rail);
    }

    for (const sx of [-(wid / 2 - 0.12), wid / 2 - 0.12]) {
      const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.09), darkTrimMat);
      aPillar.position.set(sx, 1.5, 0.46);
      aPillar.rotation.x = -0.35;
      group.add(aPillar);

      const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.12), darkTrimMat);
      bPillar.position.set(sx, 1.5, -0.68);
      group.add(bPillar);

      const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.28), bodyMat);
      cPillar.position.set(sx, 1.5, -1.96);
      group.add(cPillar);
    }

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.28, 0.76, 0.04), glassMat);
    windshield.position.set(0, 1.5, 0.47);
    windshield.rotation.x = -0.35;
    group.add(windshield);

    const sideWinGeo = new THREE.BoxGeometry(0.03, 0.62, 2.1);
    for (const sx of [-(wid / 2 - 0.11), wid / 2 - 0.11]) {
      const sw = new THREE.Mesh(sideWinGeo, glassMat);
      sw.position.set(sx, 1.5, -0.78);
      group.add(sw);
    }

    const spareTire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.22, 16),
      darkTrimMat,
    );
    spareTire.rotation.x = Math.PI / 2;
    spareTire.position.set(0, 1.05, -2.38);
    group.add(spareTire);

    steeringWheel.position.set(0.39, 1.12, 0.24);
    steeringWheel.rotation.x = -0.36;
    group.add(steeringWheel);

    seatMount.position.set(0.39, groundClear + 0.15, -0.24);
  } else if (isBus) {
    const busGeo = makeExtrudedSideSection(
      [
        [-len / 2, groundClear],
        [len / 2, groundClear],
        [len / 2 + 0.08, 1.05],
        [len / 2 - 0.15, 2.65],
        [-len / 2, 2.65],
      ],
      wid,
      0.06,
    );
    group.add(new THREE.Mesh(busGeo, bodyMat));

    const winBand = new THREE.Mesh(
      new THREE.BoxGeometry(wid + 0.03, 0.92, len - 0.52),
      opaqueGlassMat,
    );
    winBand.position.set(0, 1.92, 0.05);
    group.add(winBand);

    // Window mullions along bus sides + rooftop HVAC pods
    for (let mz = -2.4; mz <= 2.4; mz += 1.2) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(wid + 0.06, 0.94, 0.08), darkTrimMat);
      mullion.position.set(0, 1.92, mz);
      group.add(mullion);
    }
    for (const az of [-1.8, 1.0]) {
      const hvac = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.24, 1.3), chromeMat);
      hvac.position.set(0, 2.78, az);
      group.add(hvac);
    }

    const destSign = new THREE.Mesh(
      new THREE.BoxGeometry(wid * 0.65, 0.24, 0.08),
      headlightMat,
    );
    destSign.position.set(0, 2.46, len / 2 - 0.06);
    group.add(destSign);
  } else if (isVan) {
    const vanGeo = makeExtrudedSideSection(
      [
        [-len / 2, groundClear],
        [len / 2, groundClear],
        [len / 2 + 0.06, 0.86],
        [len / 2 - 0.45, 1.65],
        [len / 2 - 0.85, 2.02],
        [-len / 2, 2.02],
      ],
      wid,
      0.05,
    );
    group.add(new THREE.Mesh(vanGeo, bodyMat));

    const win = new THREE.Mesh(
      new THREE.BoxGeometry(wid - 0.14, 0.58, 1.15),
      opaqueGlassMat,
    );
    win.position.set(0, 1.56, len * 0.22);
    group.add(win);

    const roofRack = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.72, 0.07, 2.4), darkTrimMat);
    roofRack.position.set(0, 2.06, -0.5);
    group.add(roofRack);
  } else {
    const sedanGeo = makeExtrudedSideSection(
      [
        [-len / 2, groundClear],
        [len / 2, groundClear],
        [len / 2 + 0.05, 0.72],
        [len / 2 - 0.35, 0.94],
        [0.75, 1.02],
        [0.12, 1.48],
        [-1.08, 1.48],
        [-1.78, 1.04],
        [-len / 2, 0.94],
      ],
      wid,
      0.05,
    );
    group.add(new THREE.Mesh(sedanGeo, bodyMat));

    const cabinGlass = new THREE.Mesh(
      new THREE.BoxGeometry(wid - 0.14, 0.42, 1.85),
      opaqueGlassMat,
    );
    cabinGlass.position.set(0, 1.24, -0.45);
    group.add(cabinGlass);

    const bPillar = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.1, 0.44, 0.12), darkTrimMat);
    bPillar.position.set(0, 1.24, -0.42);
    group.add(bPillar);

    for (const sx of [-(wid / 2 + 0.02), wid / 2 + 0.02]) {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.14), bodyMat);
      mirror.position.set(sx + Math.sign(sx) * 0.06, 1.04, 0.45);
      group.add(mirror);
    }
  }

  // Front Splitter, Grille Slats, License Plates, Bumpers, Headlights & Taillights
  const frontZ = len / 2 + 0.02;
  const rearZ = -len / 2 - 0.02;

  const frontBumper = new THREE.Mesh(
    new THREE.BoxGeometry(wid + 0.06, 0.22, 0.18),
    darkTrimMat,
  );
  frontBumper.position.set(0, groundClear + 0.11, frontZ);
  group.add(frontBumper);

  const grilleFrame = new THREE.Mesh(
    new THREE.BoxGeometry(wid * 0.5, 0.24, 0.08),
    darkTrimMat,
  );
  grilleFrame.position.set(0, groundClear + 0.36, frontZ + 0.01);
  group.add(grilleFrame);

  for (const gy of [-0.06, 0, 0.06]) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.46, 0.025, 0.095), chromeMat);
    slat.position.set(0, groundClear + 0.36 + gy, frontZ + 0.015);
    group.add(slat);
  }

  const rearBumper = new THREE.Mesh(
    new THREE.BoxGeometry(wid + 0.06, 0.22, 0.18),
    darkTrimMat,
  );
  rearBumper.position.set(0, groundClear + 0.11, rearZ);
  group.add(rearBumper);

  const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.04), plateMat);
  rearPlate.position.set(0, groundClear + 0.34, rearZ - 0.04);
  group.add(rearPlate);

  // Side rocker skirts
  for (const sx of [-(wid / 2 - 0.02), wid / 2 - 0.02]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, len * 0.54), darkTrimMat);
    skirt.position.set(sx, groundClear + 0.05, 0);
    group.add(skirt);
  }

  for (const hx of [-wid * 0.34, wid * 0.34]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.15, 0.08), headlightMat);
    hl.position.set(hx, groundClear + 0.42, frontZ);
    group.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.15, 0.08), tailMat);
    tl.position.set(hx, groundClear + 0.44, rearZ);
    group.add(tl);
  }

  // 4 Articulated Wheels + Sculpted Wheel Arch Moldings
  const wheels: THREE.Group[] = [];
  const frontWheelPivots: THREE.Group[] = [];
  const zOffset = len * 0.32;
  const xOffset = wid / 2 - 0.02;

  for (const [wx, wz, isFront] of [
    [-xOffset, zOffset, true],
    [xOffset, zOffset, true],
    [-xOffset, -zOffset, false],
    [xOffset, -zOffset, false],
  ] as [number, number, boolean][]) {
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(wheelR + 0.08, 0.055, 8, 16, Math.PI),
      darkTrimMat,
    );
    arch.rotation.y = Math.PI / 2;
    arch.position.set(wx + Math.sign(wx) * 0.03, wheelR, wz);
    group.add(arch);

    const steerPivot = new THREE.Group();
    steerPivot.position.set(wx, wheelR, wz);
    const wheel = buildWheelAssembly(wheelR, tireW, wx > 0);
    steerPivot.add(wheel);
    group.add(steerPivot);
    wheels.push(wheel);
    if (isFront) frontWheelPivots.push(steerPivot);
  }

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material !== glassMat) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return { group, wheels, frontWheelPivots, steeringWheel, seatMount };
}

function buildCurvedHullGeometry(len: number, wid: number, depth: number): THREE.ExtrudeGeometry {
  const hw = wid / 2;
  const halfLen = len / 2;
  const shape = new THREE.Shape();
  // Planform in XY (X = width, Y = length forward -> rotated so +Y becomes +Z bow!)
  shape.moveTo(-hw * 0.78, -halfLen);
  shape.lineTo(hw * 0.78, -halfLen);
  shape.quadraticCurveTo(hw * 1.04, -halfLen * 0.2, hw * 0.96, halfLen * 0.35);
  shape.quadraticCurveTo(hw * 0.68, halfLen * 0.85, 0, halfLen * 1.06);
  shape.quadraticCurveTo(-hw * 0.68, halfLen * 0.85, -hw * 0.96, halfLen * 0.35);
  shape.quadraticCurveTo(-hw * 1.04, -halfLen * 0.2, -hw * 0.78, -halfLen);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 2,
  });
  // Extruded along +Z -> rotate -90 deg on X so shape +Y points +Z (bow) and depth goes up +Y!
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function createRealisticBoatMesh(
  kind: 'sailboat' | 'yacht' | 'speedboat',
  hullColor: number,
  accentColor: number,
): BoatRig {
  const group = new THREE.Group();
  const hullMat = new THREE.MeshPhysicalMaterial({
    color: hullColor,
    roughness: 0.22,
    metalness: 0.18,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
  const teakMat = new THREE.MeshStandardMaterial({ color: 0xb47b48, roughness: 0.68 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.32 });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.88,
    roughness: 0.16,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    metalness: 0.4,
    roughness: 0.08,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65 });

  const len = kind === 'yacht' ? 8.4 : kind === 'sailboat' ? 6.4 : 5.5;
  const wid = kind === 'yacht' ? 2.85 : kind === 'sailboat' ? 2.25 : 2.15;
  const hullDepth = kind === 'yacht' ? 0.92 : 0.66;

  // Sculpted Curved Marine Hull + Tapered Keel + Gunwale Rub-Rail
  const lowerHullGeo = buildCurvedHullGeometry(len * 0.94, wid * 0.88, hullDepth * 0.58);
  const lowerHull = new THREE.Mesh(lowerHullGeo, hullMat);
  lowerHull.position.y = -0.05;
  group.add(lowerHull);

  const upperHullGeo = buildCurvedHullGeometry(len, wid, hullDepth * 0.5);
  const upperHull = new THREE.Mesh(upperHullGeo, hullMat);
  upperHull.position.y = hullDepth * 0.46;
  group.add(upperHull);

  // Contrasting Gunwale Sheer Stripe & Teak Cockpit Deck
  const rubRailGeo = buildCurvedHullGeometry(len + 0.06, wid + 0.06, 0.09);
  const rubRail = new THREE.Mesh(rubRailGeo, accentMat);
  rubRail.position.y = hullDepth * 0.92;
  group.add(rubRail);

  const teakDeckGeo = buildCurvedHullGeometry(len * 0.86, wid * 0.78, 0.08);
  const teakDeck = new THREE.Mesh(teakDeckGeo, teakMat);
  teakDeck.position.y = hullDepth * 0.98;
  group.add(teakDeck);

  // Port & Starboard Bow Navigation Lights + Chrome Cleats
  const portLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.8 }),
  );
  portLight.position.set(wid * 0.36, hullDepth + 0.14, len * 0.25);
  group.add(portLight);
  const stbdLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.8 }),
  );
  stbdLight.position.set(-wid * 0.36, hullDepth + 0.14, len * 0.25);
  group.add(stbdLight);

  // Bow Pulpit Stainless Railing
  const pulpitCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-wid * 0.32, hullDepth + 0.18, len * 0.2),
    new THREE.Vector3(-wid * 0.22, hullDepth + 0.34, len * 0.44),
    new THREE.Vector3(0, hullDepth + 0.38, len * 0.51),
    new THREE.Vector3(wid * 0.22, hullDepth + 0.34, len * 0.44),
    new THREE.Vector3(wid * 0.32, hullDepth + 0.18, len * 0.2),
  ]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(pulpitCurve, 16, 0.025, 6, false), chromeMat));

  const steeringWheel = buildSteeringWheelGroup();
  const seatMount = new THREE.Group();
  group.add(seatMount);

  if (kind === 'sailboat') {
    // Coachroof cabin
    const coach = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.58, 0.42, len * 0.36), deckMat);
    coach.position.set(0, hullDepth + 0.24, 0.15);
    group.add(coach);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.105, 7.1, 10),
      chromeMat,
    );
    mast.position.set(0, 4.2, 0.22);
    group.add(mast);

    // Horizontal Boom + Rigging Stays
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.95, 8), chromeMat);
    boom.rotation.x = Math.PI / 2;
    boom.position.set(0, 1.55, -1.25);
    group.add(boom);

    for (const sx of [-wid * 0.42, wid * 0.42]) {
      const shroudCurve = new THREE.LineCurve3(
        new THREE.Vector3(sx, hullDepth + 0.08, 0.15),
        new THREE.Vector3(0, 6.8, 0.22),
      );
      group.add(new THREE.Mesh(new THREE.TubeGeometry(shroudCurve, 4, 0.014, 4, false), chromeMat));
    }

    const sailShape = new THREE.Shape();
    sailShape.moveTo(0, 0);
    sailShape.lineTo(0, 5.5);
    sailShape.quadraticCurveTo(-1.35, 3.1, -2.75, 0.25);
    sailShape.closePath();
    const sail = new THREE.Mesh(
      new THREE.ShapeGeometry(sailShape),
      new THREE.MeshStandardMaterial({ color: accentColor, side: THREE.DoubleSide, roughness: 0.58 }),
    );
    sail.rotation.y = Math.PI / 2;
    sail.position.set(0, 1.58, 0.14);
    group.add(sail);

    const jibShape = new THREE.Shape();
    jibShape.moveTo(0, 0);
    jibShape.lineTo(0, 4.4);
    jibShape.quadraticCurveTo(0.85, 2.0, 1.85, 0.18);
    jibShape.closePath();
    const jib = new THREE.Mesh(
      new THREE.ShapeGeometry(jibShape),
      new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.58 }),
    );
    jib.rotation.y = Math.PI / 2;
    jib.position.set(0, 1.5, 0.36);
    group.add(jib);
  } else if (kind === 'yacht') {
    // Sleek 2-Deck Luxury Motor Yacht
    const saloon = new THREE.Mesh(
      makeExtrudedSideSection(
        [
          [-2.35, 0],
          [1.45, 0],
          [0.95, 1.05],
          [-2.2, 1.05],
        ],
        wid * 0.76,
        0.04,
      ),
      deckMat,
    );
    saloon.position.y = hullDepth + 0.08;
    group.add(saloon);

    const saloonGlass = new THREE.Mesh(
      makeExtrudedSideSection(
        [
          [-2.0, 0.22],
          [1.36, 0.22],
          [0.92, 0.92],
          [-1.95, 0.92],
        ],
        wid * 0.78,
        0.02,
      ),
      glassMat,
    );
    saloonGlass.position.y = hullDepth + 0.08;
    group.add(saloonGlass);

    // Flybridge upper helm + radar arch + satdome
    const flybridge = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.62, 0.45, 2.2), accentMat);
    flybridge.position.set(0, hullDepth + 1.32, -0.75);
    group.add(flybridge);

    const radarArch = new THREE.Mesh(
      new THREE.TorusGeometry(wid * 0.36, 0.08, 8, 16, Math.PI),
      deckMat,
    );
    radarArch.position.set(0, hullDepth + 1.55, -1.2);
    group.add(radarArch);

    const satDome = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), deckMat);
    satDome.scale.set(1, 0.78, 1);
    satDome.position.set(0, hullDepth + 2.55, -1.2);
    group.add(satDome);

    // Aft swim platform
    const swimDeck = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.78, 0.14, 0.65), teakMat);
    swimDeck.position.set(0, 0.25, -len * 0.49);
    group.add(swimDeck);
  } else {
    // High-Detail Open Speedboat with Wraparound Framed Windshield, Helm, Twin Captain Seats & Outboard Engine
    const consoleBody = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.72, 0.42, 0.56), deckMat);
    consoleBody.position.set(0, hullDepth + 0.24, 0.36);
    group.add(consoleBody);

    const helmDash = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.68, 0.28, 0.32), seatMat);
    helmDash.position.set(0, hullDepth + 0.36, 0.22);
    group.add(helmDash);

    // Wraparound Windshield + Chrome Frame
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.76, 0.46, 0.045), glassMat);
    windshield.position.set(0, hullDepth + 0.6, 0.56);
    windshield.rotation.x = -0.52;
    group.add(windshield);

    const wsFrameTop = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.78, 0.045, 0.06), chromeMat);
    wsFrameTop.position.set(0, hullDepth + 0.78, 0.44);
    group.add(wsFrameTop);

    for (const sx of [-(wid * 0.38), wid * 0.38]) {
      const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.62), glassMat);
      sideGlass.position.set(sx, hullDepth + 0.56, 0.18);
      group.add(sideGlass);
    }

    for (const sx of [0.35, -0.35]) {
      const seat = buildBucketSeat(seatMat, accentMat);
      seat.scale.setScalar(0.88);
      seat.position.set(sx, hullDepth + 0.14, -0.5);
      group.add(seat);
    }

    // Rear bench sunpad
    const sunpad = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.72, 0.26, 0.72), deckMat);
    sunpad.position.set(0, hullDepth + 0.2, -1.52);
    group.add(sunpad);

    // Sculpted Outboard Motor + Lower Unit + Brass Propeller
    const cowling = new THREE.Mesh(
      makeExtrudedSideSection(
        [
          [-0.36, 0.35],
          [0.24, 0.35],
          [0.28, 0.85],
          [-0.18, 0.96],
          [-0.42, 0.72],
        ],
        0.44,
        0.04,
      ),
      seatMat,
    );
    cowling.position.set(0, hullDepth - 0.15, -len * 0.48);
    group.add(cowling);

    const motorSkeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.68, 0.32), chromeMat);
    motorSkeg.position.set(0, 0.18, -len * 0.49);
    group.add(motorSkeg);

    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.05), chromeMat);
    prop.position.set(0, 0.0, -len * 0.54);
    group.add(prop);

    steeringWheel.position.set(0.35, hullDepth + 0.48, 0.08);
    steeringWheel.rotation.x = -0.35;
    group.add(steeringWheel);

    seatMount.position.set(0.35, hullDepth + 0.08, -0.44);
  }

  // Water wake foam behind stern
  const wakeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(wid * 0.9, 3.6),
    new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    }),
  );
  wakeMesh.rotation.x = -Math.PI / 2;
  wakeMesh.position.set(0, 0.04, -len * 0.65);
  group.add(wakeMesh);

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj !== wakeMesh && obj.material !== glassMat) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return { group, wakeMesh, steeringWheel, seatMount };
}
