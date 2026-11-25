import * as THREE from 'three';

export interface HumanAppearanceOptions {
  shirtColor: number;
  pantsColor?: number;
  hairColor: number;
  skinColor?: number;
  shoeColor?: number;
  eyeColor?: number;
  hairStyle?: 'short' | 'swept' | 'bob' | 'cap';
  capColor?: number;
  hasBackpack?: boolean;
  hasJacket?: boolean;
  jacketColor?: number;
  hasBadge?: boolean;
}

export interface RealisticHumanRig {
  group: THREE.Group;
  contactShadow: THREE.Mesh;
  hips: THREE.Group;
  torso: THREE.Group;
  headGroup: THREE.Group;
  leftLeg: THREE.Group;
  leftShin: THREE.Group;
  leftFoot: THREE.Group;
  rightLeg: THREE.Group;
  rightShin: THREE.Group;
  rightFoot: THREE.Group;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  eyelids: THREE.Mesh[];
  state: {
    idleSeconds: number;
    nextBlinkAt: number;
  };
}

export const AVATAR_STORAGE_KEY = 'ootblue_avatar_v1';

export const DEFAULT_PLAYER_AVATAR: HumanAppearanceOptions = {
  shirtColor: 0x0284c7,
  pantsColor: 0x1e293b,
  hairColor: 0x0f172a,
  skinColor: 0xedc09a,
  shoeColor: 0x0284c7,
  eyeColor: 0x3b4d63,
  hairStyle: 'swept',
  capColor: 0x0284c7,
  hasJacket: true,
  jacketColor: 0x0ea5e9,
  hasBackpack: true,
  hasBadge: false,
};

export const AVATAR_PRESETS: { name: string; opts: HumanAppearanceOptions }[] = [
  { name: 'Sky Explorer', opts: DEFAULT_PLAYER_AVATAR },
  {
    name: 'Street Racer',
    opts: {
      shirtColor: 0xf8fafc,
      pantsColor: 0x111827,
      hairColor: 0x451a03,
      skinColor: 0xdca57d,
      shoeColor: 0xef4444,
      eyeColor: 0x3b4d63,
      hairStyle: 'cap',
      capColor: 0xdc2626,
      hasJacket: true,
      jacketColor: 0x1e293b,
      hasBackpack: false,
      hasBadge: false,
    },
  },
  {
    name: 'City Stylist',
    opts: {
      shirtColor: 0xf472b6,
      pantsColor: 0x334155,
      hairColor: 0x3b2314,
      skinColor: 0xf4ccb0,
      shoeColor: 0xf8fafc,
      eyeColor: 0x15803d,
      hairStyle: 'bob',
      capColor: 0xec4899,
      hasJacket: true,
      jacketColor: 0xf8fafc,
      hasBackpack: true,
      hasBadge: false,
    },
  },
  {
    name: 'Harbor Captain',
    opts: {
      shirtColor: 0xf8fafc,
      pantsColor: 0x1e3a8a,
      hairColor: 0xe2e8f0,
      skinColor: 0xc6885c,
      shoeColor: 0x3b2314,
      eyeColor: 0x0284c7,
      hairStyle: 'cap',
      capColor: 0x0f172a,
      hasJacket: true,
      jacketColor: 0x1e3a8a,
      hasBackpack: false,
      hasBadge: true,
    },
  },
  {
    name: 'Emerald Casual',
    opts: {
      shirtColor: 0x10b981,
      pantsColor: 0x263142,
      hairColor: 0x0f172a,
      skinColor: 0x8d5524,
      shoeColor: 0xf8fafc,
      eyeColor: 0x1e293b,
      hairStyle: 'short',
      capColor: 0x059669,
      hasJacket: false,
      jacketColor: 0x059669,
      hasBackpack: true,
      hasBadge: false,
    },
  },
];

export const SKIN_SWATCHES = [0xf7d8c0, 0xedc09a, 0xdca57d, 0xc6885c, 0x9c6137, 0x6f4324];
export const HAIR_SWATCHES = [0x0f172a, 0x451a03, 0x7c2d12, 0xd97706, 0xe2e8f0, 0x7c3aed];
export const OUTFIT_SWATCHES = [0x0ea5e9, 0xef4444, 0x10b981, 0x8b5cf6, 0xf59e0b, 0x1e293b, 0xf8fafc];
export const PANTS_SWATCHES = [0x1e293b, 0x0f172a, 0x334155, 0x1e3a8a, 0x3f2e21, 0x475569];
export const EYE_SWATCHES = [0x3b4d63, 0x451a03, 0x15803d, 0x0284c7, 0x0f172a];

export function loadSavedAvatar(): HumanAppearanceOptions {
  try {
    const raw = window.localStorage.getItem(AVATAR_STORAGE_KEY);
    if (!raw) return DEFAULT_PLAYER_AVATAR;
    const parsed = JSON.parse(raw) as Partial<HumanAppearanceOptions>;
    return { ...DEFAULT_PLAYER_AVATAR, ...parsed };
  } catch {
    return DEFAULT_PLAYER_AVATAR;
  }
}

export function saveAvatar(opts: HumanAppearanceOptions): void {
  try {
    window.localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(opts));
  } catch {
    // Ignore storage quota errors
  }
}

let cachedShadowTex: THREE.CanvasTexture | null = null;

function getContactShadowTexture(): THREE.CanvasTexture {
  if (cachedShadowTex) return cachedShadowTex;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.16)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedShadowTex = tex;
  return tex;
}

export function createRealisticHumanMesh(
  opts: HumanAppearanceOptions,
): RealisticHumanRig {
  const group = new THREE.Group();

  const baseSkin = new THREE.Color(opts.skinColor ?? 0xe8b896);
  const lipColor = baseSkin.clone().lerp(new THREE.Color(0xa6534d), 0.38);
  const noseSkin = baseSkin.clone().multiplyScalar(0.96);

  const skinMat = new THREE.MeshStandardMaterial({
    color: baseSkin,
    roughness: 0.48,
    metalness: 0.02,
  });
  const lipMat = new THREE.MeshStandardMaterial({
    color: lipColor,
    roughness: 0.42,
    metalness: 0.02,
  });
  const noseMat = new THREE.MeshStandardMaterial({
    color: noseSkin,
    roughness: 0.48,
    metalness: 0.02,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: opts.shirtColor,
    roughness: 0.72,
    metalness: 0.04,
  });
  const jacketMat = opts.hasJacket
    ? new THREE.MeshStandardMaterial({
        color: opts.jacketColor ?? 0x1e293b,
        roughness: 0.56,
        metalness: 0.08,
      })
    : shirtMat;
  const jacketTrimMat = opts.hasJacket
    ? new THREE.MeshStandardMaterial({
        color: new THREE.Color(opts.jacketColor ?? 0x1e293b).multiplyScalar(0.76),
        roughness: 0.65,
      })
    : shirtMat;
  const pantsMat = new THREE.MeshStandardMaterial({
    color: opts.pantsColor ?? 0x263142,
    roughness: 0.78,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: opts.hairColor,
    roughness: 0.62,
    metalness: 0.08,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: opts.shoeColor ?? 0x1e293b,
    roughness: 0.42,
    metalness: 0.1,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.72,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x3b2314,
    roughness: 0.48,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.85,
    roughness: 0.2,
  });

  // Soft ground contact shadow directly under feet
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.94, 0.94),
    new THREE.MeshBasicMaterial({
      map: getContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.76,
    }),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.008;
  group.add(contactShadow);

  // Pelvis / Hips Group (y = 0.865m -> sneaker soles sit flush at y = +0.01m)
  const hips = new THREE.Group();
  hips.position.y = 0.865;
  group.add(hips);

  const pelvisProfile = [
    new THREE.Vector2(0.142, -0.05),
    new THREE.Vector2(0.172, 0.02),
    new THREE.Vector2(0.168, 0.095),
    new THREE.Vector2(0.15, 0.135),
  ];
  const pelvisGeo = new THREE.LatheGeometry(pelvisProfile, 18);
  pelvisGeo.scale(1.06, 1.0, 0.74);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
  hips.add(pelvisMesh);

  // Belt & brushed metallic buckle
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.171, 0.173, 0.045, 18),
    leatherMat,
  );
  belt.scale.set(1.06, 1, 0.75);
  belt.position.y = 0.092;
  hips.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.048, 0.024), metalMat);
  buckle.position.set(0, 0.092, 0.128);
  hips.add(buckle);

  // Contoured Thigh & Calf Geometries
  const thighProfile = [
    new THREE.Vector2(0.06, -0.39),
    new THREE.Vector2(0.07, -0.26),
    new THREE.Vector2(0.086, -0.1),
    new THREE.Vector2(0.089, 0.0),
  ];
  const thighGeo = new THREE.LatheGeometry(thighProfile, 14);

  const calfProfile = [
    new THREE.Vector2(0.046, -0.365),
    new THREE.Vector2(0.054, -0.245),
    new THREE.Vector2(0.068, -0.115),
    new THREE.Vector2(0.062, 0.0),
  ];
  const calfGeo = new THREE.LatheGeometry(calfProfile, 14);

  // Articulated Legs (Hip -> Thigh -> Knee -> Shin -> Ankle -> Sneaker)
  const buildLeg = (side: -1 | 1) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.104, -0.02, 0);
    hips.add(legPivot);

    const thigh = new THREE.Mesh(thighGeo, pantsMat);
    thigh.scale.set(1.0, 1.0, 1.05);
    legPivot.add(thigh);

    // Knee Pivot at y = -0.395 from hip
    const shinPivot = new THREE.Group();
    shinPivot.position.set(0, -0.395, 0);
    legPivot.add(shinPivot);

    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), pantsMat);
    shinPivot.add(kneeCap);

    const calf = new THREE.Mesh(calfGeo, pantsMat);
    calf.scale.set(1.0, 1.0, 1.05);
    shinPivot.add(calf);

    const cuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.011, 8, 14),
      pantsMat,
    );
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.35;
    shinPivot.add(cuff);

    // Ankle & Sneaker Pivot at y = -0.395 (world y = 0.055)
    const footPivot = new THREE.Group();
    footPivot.position.set(0, -0.395, 0);
    shinPivot.add(footPivot);

    const sock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.041, 0.042, 0.06, 12),
      soleMat,
    );
    sock.position.y = 0.016;
    footPivot.add(sock);

    const outsole = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.049, 0.145, 6, 12),
      soleMat,
    );
    outsole.rotation.x = Math.PI / 2;
    outsole.scale.set(1.08, 1.0, 0.42);
    outsole.position.set(0, -0.024, 0.04);
    footPivot.add(outsole);

    const heelCup = new THREE.Mesh(new THREE.SphereGeometry(0.053, 12, 10), shoeMat);
    heelCup.scale.set(0.96, 1.02, 1.18);
    heelCup.position.set(0, 0.012, -0.014);
    footPivot.add(heelCup);

    const vamp = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, 0.105, 6, 12),
      shoeMat,
    );
    vamp.rotation.x = Math.PI / 2;
    vamp.scale.set(1.06, 1.0, 0.64);
    vamp.position.set(0, -0.002, 0.052);
    footPivot.add(vamp);

    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.022, 0.08), soleMat);
    tongue.position.set(0, 0.026, 0.046);
    tongue.rotation.x = 0.28;
    footPivot.add(tongue);

    return { legPivot, shinPivot, footPivot };
  };

  const leftLegBuilt = buildLeg(-1);
  const rightLegBuilt = buildLeg(1);

  // Sculpted Anatomical Torso
  const torso = new THREE.Group();
  torso.position.y = 0.1;
  hips.add(torso);

  const torsoProfile = [
    new THREE.Vector2(0.148, -0.02),
    new THREE.Vector2(0.142, 0.08),
    new THREE.Vector2(0.138, 0.165),
    new THREE.Vector2(0.16, 0.275),
    new THREE.Vector2(0.184, 0.385),
    new THREE.Vector2(0.196, 0.46),
    new THREE.Vector2(0.162, 0.52),
    new THREE.Vector2(0.092, 0.55),
    new THREE.Vector2(0.058, 0.565),
  ];
  const chestGeo = new THREE.LatheGeometry(torsoProfile, 20);
  chestGeo.scale(1.12, 1.0, 0.68);
  const chestMesh = new THREE.Mesh(chestGeo, jacketMat);
  torso.add(chestMesh);

  if (opts.hasJacket) {
    const undershirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.078, 0.064, 0.33, 12),
      shirtMat,
    );
    undershirt.scale.set(1.05, 1.0, 0.58);
    undershirt.position.set(0, 0.38, 0.09);
    torso.add(undershirt);

    for (const side of [-1, 1]) {
      const lapel = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.27, 0.022),
        jacketTrimMat,
      );
      lapel.position.set(side * 0.066, 0.39, 0.125);
      lapel.rotation.z = side * 0.16;
      lapel.rotation.y = side * 0.25;
      torso.add(lapel);
    }

    const hemBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.152, 0.154, 0.048, 18),
      jacketTrimMat,
    );
    hemBand.scale.set(1.12, 1.0, 0.69);
    hemBand.position.y = 0.018;
    torso.add(hemBand);
  }

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.068, 0.017, 10, 18),
    opts.hasJacket ? jacketTrimMat : shirtMat,
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.548;
  torso.add(collar);

  if (opts.hasBadge) {
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.064, 0.042, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.88, roughness: 0.18 }),
    );
    badge.position.set(-0.088, 0.4, 0.13);
    torso.add(badge);
  }

  if (opts.hasBackpack) {
    const packMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
    const packAccentMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.58 });

    const packGroup = new THREE.Group();
    packGroup.position.set(0, 0.29, -0.162);

    const packBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 0.17, 8, 14),
      packMat,
    );
    packBody.scale.set(1.2, 1.0, 0.62);
    packGroup.add(packBody);

    const frontPouch = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.084, 0.075, 6, 12),
      packAccentMat,
    );
    frontPouch.scale.set(1.22, 1.0, 0.45);
    frontPouch.position.set(0, -0.052, -0.062);
    packGroup.add(frontPouch);

    const handleLoop = new THREE.Mesh(
      new THREE.TorusGeometry(0.038, 0.009, 6, 12, Math.PI),
      packAccentMat,
    );
    handleLoop.position.set(0, 0.2, 0);
    packGroup.add(handleLoop);
    torso.add(packGroup);

    for (const sx of [-0.112, 0.112]) {
      const strap = new THREE.Mesh(
        new THREE.TorusGeometry(0.134, 0.016, 6, 14, Math.PI * 1.05),
        packAccentMat,
      );
      strap.rotation.y = Math.PI / 2;
      strap.scale.set(1.05, 1.32, 1.0);
      strap.position.set(sx, 0.37, 0);
      torso.add(strap);
    }
  }

  // Articulated Arms
  const bicepGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.042, -0.245),
      new THREE.Vector2(0.05, -0.135),
      new THREE.Vector2(0.056, -0.05),
      new THREE.Vector2(0.05, 0.0),
    ],
    12,
  );
  const forearmGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.031, -0.225),
      new THREE.Vector2(0.037, -0.135),
      new THREE.Vector2(0.043, -0.04),
      new THREE.Vector2(0.041, 0.0),
    ],
    12,
  );

  const buildArm = (side: -1 | 1) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.232, 0.472, 0);
    torso.add(armPivot);

    const shoulderDeltoid = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 12, 10),
      jacketMat,
    );
    shoulderDeltoid.scale.set(1.0, 1.06, 0.94);
    armPivot.add(shoulderDeltoid);

    const upperArm = new THREE.Mesh(bicepGeo, jacketMat);
    armPivot.add(upperArm);

    const forearmPivot = new THREE.Group();
    forearmPivot.position.set(0, -0.245, 0);
    armPivot.add(forearmPivot);

    const elbow = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 10, 8),
      opts.hasJacket ? jacketMat : skinMat,
    );
    forearmPivot.add(elbow);

    const forearm = new THREE.Mesh(
      forearmGeo,
      opts.hasJacket ? jacketMat : skinMat,
    );
    forearmPivot.add(forearm);

    if (opts.hasJacket) {
      const sleeveCuff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.034, 0.032, 12),
        jacketTrimMat,
      );
      sleeveCuff.position.y = -0.205;
      forearmPivot.add(sleeveCuff);
    }

    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.242, 0.008);
    forearmPivot.add(handGroup);

    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), skinMat);
    palm.scale.set(0.68, 1.04, 0.94);
    handGroup.add(palm);

    const fingers = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.02, 0.036, 4, 8),
      skinMat,
    );
    fingers.scale.set(0.65, 1.0, 1.22);
    fingers.position.set(0, -0.036, 0.006);
    handGroup.add(fingers);

    const thumb = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.011, 0.022, 4, 6),
      skinMat,
    );
    thumb.position.set(-side * 0.019, -0.014, 0.024);
    thumb.rotation.x = 0.45;
    thumb.rotation.z = side * 0.35;
    handGroup.add(thumb);

    return { armPivot, forearmPivot };
  };

  const leftArmBuilt = buildArm(-1);
  const rightArmBuilt = buildArm(1);

  // Neck & Cleanly Proportioned Head (No detached chin bump, eyes well clear of hairline!)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.548, 0);
  torso.add(headGroup);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.105, 14),
    skinMat,
  );
  neck.position.y = 0.048;
  headGroup.add(neck);

  // Smooth oval cranium & integrated tapered lower jaw (smooth transition, no extra chin sphere)
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.118, 22, 18), skinMat);
  cranium.scale.set(0.9, 1.12, 0.96);
  cranium.position.set(0, 0.215, 0);
  headGroup.add(cranium);

  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.084, 18, 14), skinMat);
  jaw.scale.set(0.84, 0.88, 0.92);
  jaw.position.set(0, 0.145, 0.008);
  headGroup.add(jaw);

  // Ears
  for (const ex of [-0.106, 0.106]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), skinMat);
    ear.scale.set(0.45, 1.12, 0.75);
    ear.position.set(ex, 0.205, -0.004);
    ear.rotation.z = ex < 0 ? 0.14 : -0.14;
    headGroup.add(ear);
  }

  // Sculpted Nose
  const noseBridge = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.01, 0.026, 4, 8),
    noseMat,
  );
  noseBridge.position.set(0, 0.202, 0.112);
  noseBridge.rotation.x = -0.22;
  headGroup.add(noseBridge);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 8), noseMat);
  noseTip.scale.set(1.02, 0.8, 0.95);
  noseTip.position.set(0, 0.184, 0.121);
  headGroup.add(noseTip);

  // Subtle Mouth
  const mouth = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.0065, 0.03, 4, 8),
    lipMat,
  );
  mouth.rotation.z = Math.PI / 2;
  mouth.scale.set(0.75, 1.0, 0.6);
  mouth.position.set(0, 0.144, 0.101);
  headGroup.add(mouth);

  // Expressive Eyes positioned cleanly on the open upper-mid face (y = 0.212), far below hairline (y >= 0.29)
  const scleraMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const irisMat = new THREE.MeshBasicMaterial({ color: opts.eyeColor ?? 0x3b4d63 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyelids: THREE.Mesh[] = [];

  for (const ex of [-0.039, 0.039]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.0175, 12, 10), scleraMat);
    sclera.scale.set(1.12, 0.84, 0.56);
    sclera.position.set(ex, 0.212, 0.104);
    headGroup.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0108, 10, 8), irisMat);
    iris.scale.set(1.0, 1.0, 0.55);
    iris.position.set(ex, 0.212, 0.111);
    headGroup.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), pupilMat);
    pupil.scale.set(1.0, 1.0, 0.55);
    pupil.position.set(ex, 0.212, 0.115);
    headGroup.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 6, 6), highlightMat);
    glint.position.set(ex + 0.004, 0.216, 0.118);
    headGroup.add(glint);

    // Upper Eyelid for natural blinking
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), skinMat);
    lid.scale.set(1.14, 0.12, 0.62);
    lid.position.set(ex, 0.223, 0.105);
    headGroup.add(lid);
    eyelids.push(lid);

    // Eyebrow cleanly above eye at y = 0.237
    const brow = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.0045, 0.026, 4, 6),
      hairMat,
    );
    brow.rotation.z = Math.PI / 2 + (ex < 0 ? 0.08 : -0.08);
    brow.position.set(ex, 0.237, 0.108);
    headGroup.add(brow);
  }

  // Sculpted Hair / Cap Styles — all front edges stay high at y >= 0.29 so eyes/brows are 100% clear!
  const style = opts.hairStyle ?? 'short';
  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.123, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.42),
    hairMat,
  );
  hairCrown.scale.set(0.93, 1.08, 0.99);
  hairCrown.position.set(0, 0.244, -0.014);
  hairCrown.rotation.x = -0.34;
  headGroup.add(hairCrown);

  // Back nape hair (strictly on the back half of head)
  const napeHair = new THREE.Mesh(
    new THREE.CylinderGeometry(0.102, 0.09, 0.085, 14, 1, false, Math.PI * 0.65, Math.PI * 0.7),
    hairMat,
  );
  napeHair.position.set(0, 0.175, -0.026);
  headGroup.add(napeHair);

  if (style === 'short') {
    const frontCut = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.024, 0.095, 4, 8),
      hairMat,
    );
    frontCut.rotation.z = Math.PI / 2;
    frontCut.scale.set(0.7, 1.0, 0.65);
    frontCut.position.set(0, 0.308, 0.056);
    headGroup.add(frontCut);
  } else if (style === 'swept') {
    const swoopMain = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 10), hairMat);
    swoopMain.scale.set(1.38, 0.58, 1.08);
    swoopMain.position.set(0.012, 0.322, 0.036);
    swoopMain.rotation.z = -0.14;
    headGroup.add(swoopMain);

    const sideLock = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.055, 4, 8), hairMat);
    sideLock.position.set(0.092, 0.258, -0.005);
    sideLock.rotation.z = -0.22;
    headGroup.add(sideLock);
  } else if (style === 'bob') {
    const backBob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.112, 0.128, 0.165, 16, 1, false, Math.PI * 0.45, Math.PI * 1.1),
      hairMat,
    );
    backBob.position.set(0, 0.178, -0.022);
    headGroup.add(backBob);

    for (const bx of [-0.088, 0.088]) {
      const sideFraming = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.024, 0.115, 4, 8),
        hairMat,
      );
      sideFraming.position.set(bx, 0.2, 0.012);
      sideFraming.rotation.z = bx < 0 ? 0.1 : -0.1;
      headGroup.add(sideFraming);
    }
  } else if (style === 'cap') {
    const capMat = new THREE.MeshStandardMaterial({
      color: opts.capColor ?? 0x1e3a8a,
      roughness: 0.52,
    });
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(0.123, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.48),
      capMat,
    );
    crown.scale.set(0.96, 0.85, 1.02);
    crown.position.set(0, 0.275, -0.005);
    headGroup.add(crown);

    const capBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.121, 0.121, 0.032, 18),
      capMat,
    );
    capBand.position.set(0, 0.286, -0.004);
    headGroup.add(capBand);

    const visor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.122, 0.124, 0.014, 16, 1, false, -Math.PI * 0.34, Math.PI * 0.68),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }),
    );
    visor.position.set(0, 0.276, 0.068);
    visor.rotation.x = 0.08;
    headGroup.add(visor);

    if (opts.hasBadge) {
      const capEmblem = new THREE.Mesh(
        new THREE.BoxGeometry(0.034, 0.026, 0.014),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 }),
      );
      capEmblem.position.set(0, 0.312, 0.118);
      headGroup.add(capEmblem);
    }
  }

  // Enable shadow casting across all character meshes (except contact shadow plane)
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj !== contactShadow) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return {
    group,
    contactShadow,
    hips,
    torso,
    headGroup,
    leftLeg: leftLegBuilt.legPivot,
    leftShin: leftLegBuilt.shinPivot,
    leftFoot: leftLegBuilt.footPivot,
    rightLeg: rightLegBuilt.legPivot,
    rightShin: rightLegBuilt.shinPivot,
    rightFoot: rightLegBuilt.footPivot,
    leftArm: leftArmBuilt.armPivot,
    leftForearm: leftArmBuilt.forearmPivot,
    rightArm: rightArmBuilt.armPivot,
    rightForearm: rightArmBuilt.forearmPivot,
    eyelids,
    state: {
      idleSeconds: 0,
      nextBlinkAt: 1.5 + Math.random() * 2.5,
    },
  };
}

export function animateHumanRig(
  rig: RealisticHumanRig,
  moving: boolean,
  sprintAmount: number,
  walkPhase: number,
  elapsedTime: number,
  dt: number,
  idleOffset = 0,
  airborne = false,
  verticalVel = 0,
  driving?: { active: boolean; steer: number; speedRatio: number },
): void {
  // Natural Eyelid Blink Cycle
  let lidScaleY = 0.12;
  if (elapsedTime >= rig.state.nextBlinkAt) {
    const blinkProgress = (elapsedTime - rig.state.nextBlinkAt) / 0.14;
    if (blinkProgress < 1) {
      lidScaleY = 0.12 + Math.sin(blinkProgress * Math.PI) * 1.15;
    } else {
      rig.state.nextBlinkAt = elapsedTime + 2.8 + ((elapsedTime * 1.7 + idleOffset) % 2.4);
    }
  }
  for (const lid of rig.eyelids) {
    lid.scale.y = lidScaleY;
  }

  if (driving?.active) {
    rig.state.idleSeconds = 0;
    rig.contactShadow.visible = false;
    const steer = THREE.MathUtils.clamp(driving.steer, -1, 1);
    const spd = THREE.MathUtils.clamp(driving.speedRatio, 0, 1);

    // Seated driving posture inside car / boat cockpit
    rig.hips.position.set(0, 0.23, 0);
    rig.hips.rotation.set(0, 0, 0);

    // Thighs extend forward (+Z) along seat cushion, knees bend smoothly down to pedals
    rig.leftLeg.rotation.x = -1.42;
    rig.rightLeg.rotation.x = -1.42;
    rig.leftShin.rotation.x = 1.28;
    rig.rightShin.rotation.x = 1.24;
    rig.leftFoot.rotation.x = -0.18;
    rig.rightFoot.rotation.x = 0.05 + spd * 0.22;

    // Slight comfortable recline into bucket seat & subtle cornering lean
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, -0.18, 12, dt);
    rig.torso.rotation.y = THREE.MathUtils.damp(rig.torso.rotation.y, -steer * 0.08, 10, dt);
    rig.torso.rotation.z = THREE.MathUtils.damp(rig.torso.rotation.z, -steer * 0.05, 10, dt);

    // Hands gripping and turning the steering wheel
    rig.leftArm.rotation.x = THREE.MathUtils.damp(rig.leftArm.rotation.x, -0.95 - steer * 0.12, 14, dt);
    rig.rightArm.rotation.x = THREE.MathUtils.damp(rig.rightArm.rotation.x, -0.95 + steer * 0.12, 14, dt);
    rig.leftArm.rotation.z = THREE.MathUtils.damp(rig.leftArm.rotation.z, 0.12, 12, dt);
    rig.rightArm.rotation.z = THREE.MathUtils.damp(rig.rightArm.rotation.z, -0.12, 12, dt);
    rig.leftForearm.rotation.x = THREE.MathUtils.damp(rig.leftForearm.rotation.x, -0.56 + steer * 0.16, 14, dt);
    rig.rightForearm.rotation.x = THREE.MathUtils.damp(rig.rightForearm.rotation.x, -0.56 - steer * 0.16, 14, dt);

    // Driver looks naturally into turns
    rig.headGroup.rotation.y = THREE.MathUtils.damp(rig.headGroup.rotation.y, -steer * 0.28, 8, dt);
    rig.headGroup.rotation.x = THREE.MathUtils.damp(rig.headGroup.rotation.x, 0.14, 10, dt);
    rig.headGroup.rotation.z = THREE.MathUtils.damp(rig.headGroup.rotation.z, 0, 10, dt);
    return;
  }

  rig.contactShadow.visible = true;

  if (airborne) {
    rig.state.idleSeconds = 0;
    const rise = THREE.MathUtils.clamp(verticalVel / 7, -1, 1);

    // Note: in Three.js right-handed coords, negative X rotation swings legs/arms FORWARD (+Z),
    // while positive X rotation flexes knees BACKWARD (-Z) and swings legs/arms BACKWARD (-Z)!
    rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, -0.46 + rise * 0.1, 10, dt);
    rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, 0.24 - rise * 0.1, 10, dt);
    rig.leftShin.rotation.x = THREE.MathUtils.damp(rig.leftShin.rotation.x, 0.78, 10, dt);
    rig.rightShin.rotation.x = THREE.MathUtils.damp(rig.rightShin.rotation.x, 0.36, 10, dt);
    rig.leftFoot.rotation.x = THREE.MathUtils.damp(rig.leftFoot.rotation.x, 0.25, 10, dt);
    rig.rightFoot.rotation.x = THREE.MathUtils.damp(rig.rightFoot.rotation.x, 0.2, 10, dt);

    rig.leftArm.rotation.x = THREE.MathUtils.damp(rig.leftArm.rotation.x, -0.58 - rise * 0.32, 10, dt);
    rig.rightArm.rotation.x = THREE.MathUtils.damp(rig.rightArm.rotation.x, -0.45 - rise * 0.32, 10, dt);
    rig.leftArm.rotation.z = THREE.MathUtils.damp(rig.leftArm.rotation.z, -0.35, 10, dt);
    rig.rightArm.rotation.z = THREE.MathUtils.damp(rig.rightArm.rotation.z, 0.35, 10, dt);
    rig.leftForearm.rotation.x = THREE.MathUtils.damp(rig.leftForearm.rotation.x, -0.68, 10, dt);
    rig.rightForearm.rotation.x = THREE.MathUtils.damp(rig.rightForearm.rotation.x, -0.68, 10, dt);

    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, 0.14, 10, dt);
    rig.torso.rotation.y = THREE.MathUtils.damp(rig.torso.rotation.y, 0, 10, dt);
    rig.headGroup.rotation.y = THREE.MathUtils.damp(rig.headGroup.rotation.y, 0, 10, dt);
    rig.headGroup.rotation.x = THREE.MathUtils.damp(rig.headGroup.rotation.x, -0.06, 10, dt);
    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, 0.865, 10, dt);
    rig.hips.position.x = THREE.MathUtils.damp(rig.hips.position.x, 0, 10, dt);
    rig.hips.rotation.z = THREE.MathUtils.damp(rig.hips.rotation.z, 0, 10, dt);
    return;
  }

  if (moving) {
    rig.state.idleSeconds = 0;

    // Anatomically accurate gait biomechanics:
    // - Negative hip X rotation = leg swings FORWARD (+Z)
    // - Positive hip X rotation = leg pushes BACKWARD (-Z)
    // - Knee bends positively (+X) during SWING-THROUGH (when cos(phase) > 0, i.e. swinging forward from back!)
    const strideAmp = 0.52 + sprintAmount * 0.28;
    const lPhase = walkPhase;
    const rPhase = walkPhase + Math.PI;

    const lHipRot = -Math.sin(lPhase) * strideAmp;
    const rHipRot = -Math.sin(rPhase) * strideAmp;

    // Knee bends smoothly while leg swings forward (cos > 0), straightens for heel strike (sin > 0 -> cos = 0),
    // and softens slightly to absorb weight at mid-stance
    const computeKnee = (p: number) => {
      const swingLift = Math.max(0, Math.cos(p)) * (0.78 + sprintAmount * 0.34);
      const stanceAbsorb = Math.max(0, -Math.cos(p)) * (0.14 + sprintAmount * 0.08);
      return 0.04 + swingLift + stanceAbsorb;
    };

    // Ankle dorsiflexion (negative X = toes UP for heel strike) and plantarflexion (positive X = toes DOWN push-off)
    const computeAnkle = (p: number) => {
      return -Math.sin(p) * 0.16 - Math.cos(p) * 0.14;
    };

    rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, lHipRot, 18, dt);
    rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, rHipRot, 18, dt);
    rig.leftShin.rotation.x = THREE.MathUtils.damp(rig.leftShin.rotation.x, computeKnee(lPhase), 18, dt);
    rig.rightShin.rotation.x = THREE.MathUtils.damp(rig.rightShin.rotation.x, computeKnee(rPhase), 18, dt);
    rig.leftFoot.rotation.x = THREE.MathUtils.damp(rig.leftFoot.rotation.x, computeAnkle(lPhase), 16, dt);
    rig.rightFoot.rotation.x = THREE.MathUtils.damp(rig.rightFoot.rotation.x, computeAnkle(rPhase), 16, dt);

    // Opposite arm swings forward (-X) when left leg goes back (+X), and vice versa!
    const armAmp = 0.44 + sprintAmount * 0.34;
    const lArmTarget = Math.sin(lPhase) * armAmp;
    const rArmTarget = Math.sin(rPhase) * armAmp;
    rig.leftArm.rotation.x = THREE.MathUtils.damp(rig.leftArm.rotation.x, lArmTarget, 16, dt);
    rig.rightArm.rotation.x = THREE.MathUtils.damp(rig.rightArm.rotation.x, rArmTarget, 16, dt);
    rig.leftArm.rotation.z = THREE.MathUtils.damp(rig.leftArm.rotation.z, -0.085, 12, dt);
    rig.rightArm.rotation.z = THREE.MathUtils.damp(rig.rightArm.rotation.z, 0.085, 12, dt);

    // Forearms flex forward (-X) naturally on the forward arm swing
    const lElbowTarget = -0.22 - Math.max(0, -lArmTarget) * (0.58 + sprintAmount * 0.35);
    const rElbowTarget = -0.22 - Math.max(0, -rArmTarget) * (0.58 + sprintAmount * 0.35);
    rig.leftForearm.rotation.x = THREE.MathUtils.damp(rig.leftForearm.rotation.x, lElbowTarget, 16, dt);
    rig.rightForearm.rotation.x = THREE.MathUtils.damp(rig.rightForearm.rotation.x, rElbowTarget, 16, dt);

    // Real inverted-pendulum vertical hip arc:
    // HIGHEST at mid-stance (cos^2 near 1, leg upright), LOWEST at double-support (sin^2 near 1, stride wide)
    const verticalBob = (Math.cos(lPhase) * Math.cos(lPhase) - 0.5) * (0.045 + sprintAmount * 0.032);
    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, 0.865 + verticalBob, 18, dt);

    // Lateral weight shift over whichever stance leg is supporting the body
    rig.hips.position.x = THREE.MathUtils.damp(rig.hips.position.x, Math.sin(lPhase) * -0.02, 14, dt);
    rig.hips.rotation.z = THREE.MathUtils.damp(rig.hips.rotation.z, Math.sin(lPhase) * 0.032, 14, dt);

    // Pelvis rotates with the advancing leg, while upper chest/shoulders counter-rotate smoothly
    const hipTwist = Math.sin(lPhase) * 0.065;
    rig.hips.rotation.y = THREE.MathUtils.damp(rig.hips.rotation.y, hipTwist, 16, dt);
    rig.torso.rotation.y = THREE.MathUtils.damp(rig.torso.rotation.y, -hipTwist * 2.1, 16, dt);
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, 0.055 + sprintAmount * 0.11, 12, dt);

    // Head stays steady on horizon (stabilizing gaze while body twists beneath)
    rig.headGroup.rotation.y = THREE.MathUtils.damp(rig.headGroup.rotation.y, hipTwist * 1.1, 14, dt);
    rig.headGroup.rotation.x = THREE.MathUtils.damp(rig.headGroup.rotation.x, -0.025, 10, dt);
    rig.headGroup.rotation.z = THREE.MathUtils.damp(rig.headGroup.rotation.z, 0, 10, dt);
  } else {
    rig.state.idleSeconds += dt;
    const idleTime = rig.state.idleSeconds;

    // Subtle natural standing weight shift between legs
    const shift = Math.sin(elapsedTime * 0.55 + idleOffset);
    rig.hips.position.x = THREE.MathUtils.damp(rig.hips.position.x, shift * 0.018, 4.5, dt);
    rig.hips.rotation.z = THREE.MathUtils.damp(rig.hips.rotation.z, -shift * 0.026, 4.5, dt);
    rig.hips.rotation.y = THREE.MathUtils.damp(rig.hips.rotation.y, shift * 0.03, 4.5, dt);

    // Asymmetric relaxed knees (off-weight leg softens slightly)
    const lKneeIdle = 0.04 + Math.max(0, shift) * 0.06;
    const rKneeIdle = 0.04 + Math.max(0, -shift) * 0.06;
    rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, -Math.max(0, shift) * 0.03, 8, dt);
    rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, -Math.max(0, -shift) * 0.03, 8, dt);
    rig.leftShin.rotation.x = THREE.MathUtils.damp(rig.leftShin.rotation.x, lKneeIdle, 8, dt);
    rig.rightShin.rotation.x = THREE.MathUtils.damp(rig.rightShin.rotation.x, rKneeIdle, 8, dt);
    rig.leftFoot.rotation.x = THREE.MathUtils.damp(rig.leftFoot.rotation.x, 0, 8, dt);
    rig.rightFoot.rotation.x = THREE.MathUtils.damp(rig.rightFoot.rotation.x, 0, 8, dt);

    // Breathing & relaxed arms
    const breath = Math.sin(elapsedTime * 1.9 + idleOffset);
    rig.leftArm.rotation.x = THREE.MathUtils.damp(rig.leftArm.rotation.x, breath * 0.022, 8, dt);
    rig.rightArm.rotation.x = THREE.MathUtils.damp(rig.rightArm.rotation.x, -breath * 0.022, 8, dt);
    rig.leftArm.rotation.z = THREE.MathUtils.damp(rig.leftArm.rotation.z, -0.075 - breath * 0.01, 8, dt);
    rig.rightArm.rotation.z = THREE.MathUtils.damp(rig.rightArm.rotation.z, 0.075 + breath * 0.01, 8, dt);
    rig.leftForearm.rotation.x = THREE.MathUtils.damp(rig.leftForearm.rotation.x, -0.18, 8, dt);
    rig.rightForearm.rotation.x = THREE.MathUtils.damp(rig.rightForearm.rotation.x, -0.18, 8, dt);
    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, 0.865 + breath * 0.005, 8, dt);

    // After standing still for 5 seconds -> smooth, expressive look side to side!
    let targetHeadYaw = Math.sin(elapsedTime * 0.7 + idleOffset) * 0.04;
    let targetHeadPitch = breath * 0.014;
    let targetHeadRoll = 0;
    let targetTorsoYaw = -shift * 0.03;

    if (idleTime >= 5.0) {
      const cycle = (idleTime - 5.0) % 7.2;
      if (cycle < 1.3) {
        const u = THREE.MathUtils.smoothstep(cycle, 0, 0.85);
        targetHeadYaw = u * 0.66;
        targetTorsoYaw = u * 0.18;
        targetHeadPitch = u * -0.045;
        targetHeadRoll = u * -0.04;
      } else if (cycle < 2.2) {
        targetHeadYaw = 0.66;
        targetTorsoYaw = 0.18;
        targetHeadPitch = -0.045;
        targetHeadRoll = -0.04;
      } else if (cycle < 3.9) {
        const u = THREE.MathUtils.smoothstep(cycle, 2.2, 3.6);
        targetHeadYaw = THREE.MathUtils.lerp(0.66, -0.66, u);
        targetTorsoYaw = THREE.MathUtils.lerp(0.18, -0.18, u);
        targetHeadPitch = Math.sin(u * Math.PI) * 0.04 - 0.04;
        targetHeadRoll = THREE.MathUtils.lerp(-0.04, 0.04, u);
      } else if (cycle < 4.9) {
        targetHeadYaw = -0.66;
        targetTorsoYaw = -0.18;
        targetHeadPitch = -0.04;
        targetHeadRoll = 0.04;
      } else if (cycle < 6.0) {
        const u = THREE.MathUtils.smoothstep(cycle, 4.9, 5.85);
        targetHeadYaw = THREE.MathUtils.lerp(-0.66, 0, u);
        targetTorsoYaw = THREE.MathUtils.lerp(-0.18, 0, u);
        targetHeadPitch = THREE.MathUtils.lerp(-0.04, breath * 0.014, u);
        targetHeadRoll = THREE.MathUtils.lerp(0.04, 0, u);
      }
    }

    rig.torso.rotation.y = THREE.MathUtils.damp(rig.torso.rotation.y, targetTorsoYaw, 6.5, dt);
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, breath * 0.012, 8, dt);
    rig.headGroup.rotation.y = THREE.MathUtils.damp(rig.headGroup.rotation.y, targetHeadYaw, 7.5, dt);
    rig.headGroup.rotation.x = THREE.MathUtils.damp(rig.headGroup.rotation.x, targetHeadPitch, 7.5, dt);
    rig.headGroup.rotation.z = THREE.MathUtils.damp(rig.headGroup.rotation.z, targetHeadRoll, 7.5, dt);
  }
}
