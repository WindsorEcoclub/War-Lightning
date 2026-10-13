import * as THREE from 'three';
import { VehicleSpec } from '../data/vehicles';
import { generateArmorPlateTexture, generateTrackTexture } from './textureGenerator';

export type InspectorMode = 'standard' | 'armor' | 'xray';

export interface BuiltVehicle3D {
  root: THREE.Group;
  hullGroup: THREE.Group;
  turretGroup: THREE.Group;
  gunGroup: THREE.Group;
  muzzlePoint: THREE.Object3D;
  exhaustPoint: THREE.Object3D;
  radarMesh?: THREE.Object3D;
  rotorGroup?: THREE.Object3D;
  coaxialRotorGroup?: THREE.Object3D;
  afterburnerMesh?: THREE.Mesh;
  internalGroup: THREE.Group;
  armorMeshes: THREE.Mesh[];
  wheelMeshes: THREE.Mesh[];
  trackMaterials?: THREE.MeshStandardMaterial[];
}

function getArmorColor(mm: number): number {
  if (mm >= 650) return 0xef4444; // Red (Heavy Composite / Relikt ERA)
  if (mm >= 350) return 0xf97316; // Orange (Composite NERA)
  if (mm >= 140) return 0xeab308; // Yellow (Cast/Rolled Steel)
  if (mm >= 60) return 0x22c55e;  // Green (Medium Armor)
  return 0x06b6d4;                // Cyan (Light Alloy / Sheet)
}

export function buildVehicle3D(
  spec: VehicleSpec,
  mode: InspectorMode = 'standard',
  camoColorOverride: string | null = null,
  camoRoughness: number = 0.68
): BuiltVehicle3D {
  const root = new THREE.Group();
  const hullGroup = new THREE.Group();
  const turretGroup = new THREE.Group();
  const gunGroup = new THREE.Group();
  const internalGroup = new THREE.Group();
  const muzzlePoint = new THREE.Object3D();
  const exhaustPoint = new THREE.Object3D();
  const armorMeshes: THREE.Mesh[] = [];
  const wheelMeshes: THREE.Mesh[] = [];
  const trackMaterials: THREE.MeshStandardMaterial[] = [];

  root.add(hullGroup);

  const isXray = mode === 'xray';
  const isArmor = mode === 'armor';

  // Generate procedural high-resolution armor texture & bump map
  const camoType =
    camoColorOverride?.includes('desert') ||
    spec.visual.baseColor.toLowerCase().includes('sand') ||
    spec.visual.baseColor.toLowerCase().includes('c8b488')
      ? 'desert'
      : spec.nation === 'germany' || spec.nation === 'usa' || spec.nation === 'france'
      ? 'camo'
      : 'green';

  const armorTexBundle = generateArmorPlateTexture(camoColorOverride || spec.visual.baseColor, camoType);
  armorTexBundle.map.repeat.set(2.5, 2.5);
  armorTexBundle.bumpMap.repeat.set(2.5, 2.5);
  armorTexBundle.roughnessMap.repeat.set(2.5, 2.5);

  const trackTexBundle = generateTrackTexture();
  trackTexBundle.map.repeat.set(1, 14);
  trackTexBundle.bumpMap.repeat.set(1, 14);

  const makeHullMat = (zoneName: string, thicknessMm: number, angleDeg: number, isAccent = false) => {
    if (isXray) {
      return new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
        roughness: 0.2,
        metalness: 0.1,
        depthWrite: false,
      });
    }
    if (isArmor) {
      return new THREE.MeshStandardMaterial({
        color: getArmorColor(thicknessMm),
        roughness: 0.45,
        metalness: 0.25,
      });
    }
    const baseColor = isAccent ? spec.visual.accentColor : (camoColorOverride || spec.visual.baseColor);
    return new THREE.MeshStandardMaterial({
      map: armorTexBundle.map,
      bumpMap: armorTexBundle.bumpMap,
      bumpScale: 0.04,
      roughnessMap: armorTexBundle.roughnessMap,
      color: new THREE.Color(baseColor),
      roughness: camoRoughness,
      metalness: 0.28,
    });
  };

  const registerArmorMesh = (
    mesh: THREE.Mesh,
    zoneName: string,
    thicknessMm: number,
    angleDeg: number
  ) => {
    mesh.castShadow = !isXray;
    mesh.receiveShadow = !isXray;
    mesh.userData = {
      zoneName,
      thicknessMm,
      angleDeg,
      composition: spec.armor.composition,
    };
    armorMeshes.push(mesh);
  };

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1f242c,
    roughness: 0.52,
    metalness: 0.72,
  });

  const trackMat = new THREE.MeshStandardMaterial({
    map: trackTexBundle.map,
    bumpMap: trackTexBundle.bumpMap,
    bumpScale: 0.08,
    roughness: 0.88,
    metalness: 0.45,
    color: 0x2b2e34,
  });
  trackMaterials.push(trackMat);

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    roughness: 0.94,
    metalness: 0.05,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x4a3622,
    roughness: 0.92,
    metalness: 0.05,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x60a5fa,
    transmission: 0.85,
    roughness: 0.1,
    ior: 1.5,
    transparent: true,
    opacity: 0.85,
  });

  const { lengthScale: ls, widthScale: ws, heightScale: hs } = spec.visual;

  let radarMesh: THREE.Object3D | undefined;
  let rotorGroup: THREE.Object3D | undefined;
  let coaxialRotorGroup: THREE.Object3D | undefined;
  let afterburnerMesh: THREE.Mesh | undefined;

  const isFlak37 = spec.id.includes('flak_37') || spec.name.includes('Flak 37');
  const isR3 = spec.id.includes('r3') || spec.name.includes('R3');
  const isMaus = spec.id.includes('maus') || spec.name.toLowerCase().includes('maus');
  const isTiger1 =
    (spec.id.includes('tiger_h1') || spec.id.includes('tiger_e') || (spec.name.includes('Tiger') && !spec.name.includes('Tiger II') && !spec.name.includes('King Tiger'))) && !isMaus;
  const isTiger2 = spec.id.includes('tiger_ii') || spec.name.includes('Tiger II') || spec.name.includes('King Tiger');
  const isPanther = spec.id.includes('panther') || spec.name.toLowerCase().includes('panther');
  const isSherman = spec.id.includes('sherman') || spec.id.includes('m4a') || spec.name.toLowerCase().includes('sherman');
  const isT34 = spec.id.includes('t34') || spec.id.includes('t_34') || spec.name.includes('T-34');
  const isIS2 = spec.id.includes('is2') || spec.id.includes('is_2') || spec.name.includes('IS-2');
  const isRussianMBT =
    (spec.id.includes('t90') || spec.id.includes('t80') || spec.id.includes('t72') || spec.id.includes('t64') || spec.name.includes('T-90') || spec.name.includes('T-80') || spec.name.includes('T-72')) && !isT34;
  const isAbrams = spec.id.includes('m1a') || spec.name.toLowerCase().includes('abrams');
  const isLeopard = spec.id.includes('leopard') || spec.name.toLowerCase().includes('leopard');

  const isWheeled = spec.visual.hullArchetype === 'wheeled_striker';
  const isCasemate = spec.visual.hullArchetype === 'casemate_td';
  const isWW2 =
    (spec.visual.hullArchetype === 'ww2_heavy' ||
    spec.visual.hullArchetype === 'ww2_medium' ||
    spec.year <= 1945) && !isMaus;

  // ==========================================================
  // BRANCH 1: AVIATION
  // ==========================================================
  if (spec.branch === 'aviation') {
    const fuselageGeo = new THREE.ConeGeometry(0.88 * ws, 8.8 * ls, 24);
    fuselageGeo.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuselageGeo, makeHullMat('Fuselage Structure', spec.armor.hullFront, 72));
    fuselage.position.set(0, 1.4, 0);
    registerArmorMesh(fuselage, 'Fuselage Structure', spec.armor.hullFront, 72);
    hullGroup.add(fuselage);

    const canopyGeo = new THREE.CapsuleGeometry(0.44, 1.85, 12, 16);
    canopyGeo.rotateX(Math.PI / 2);
    const canopy = new THREE.Mesh(canopyGeo, glassMat);
    canopy.position.set(0, 1.92, 1.15 * ls);
    hullGroup.add(canopy);

    const wingGeo = new THREE.BoxGeometry(7.8 * ws, 0.12, 2.9 * ls);
    const wings = new THREE.Mesh(wingGeo, makeHullMat('Wing Structure', spec.armor.hullSide, 15));
    wings.position.set(0, 1.35, -0.4 * ls);
    registerArmorMesh(wings, 'Wing Structure', spec.armor.hullSide, 15);
    hullGroup.add(wings);

    const tailGeo = new THREE.BoxGeometry(0.12, 1.65, 1.75);
    const tail = new THREE.Mesh(tailGeo, makeHullMat('Vertical Fin', 14, 15, true));
    tail.position.set(0, 2.18, -3.2 * ls);
    hullGroup.add(tail);

    turretGroup.position.set(0, 1.4, 0);
    gunGroup.position.set(0, 0, 4.4 * ls);
    muzzlePoint.position.set(0, -0.15, 0.5);
    hullGroup.add(turretGroup);
    turretGroup.add(gunGroup);
    gunGroup.add(muzzlePoint);

    exhaustPoint.position.set(0, 1.4, -4.4 * ls);
    hullGroup.add(exhaustPoint);

    if (spec.rankNum >= 5) {
      const abGeo = new THREE.CylinderGeometry(0.38 * ws, 0.44 * ws, 0.6, 16);
      abGeo.rotateX(Math.PI / 2);
      const abMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      afterburnerMesh = new THREE.Mesh(abGeo, abMat);
      afterburnerMesh.position.set(0, 1.4, -4.3 * ls);
      hullGroup.add(afterburnerMesh);
    }
  }
  // ==========================================================
  // BRANCH 2: HELICOPTERS
  // ==========================================================
  else if (spec.branch === 'helicopters') {
    const heliFuselage = new THREE.Mesh(
      new THREE.ConeGeometry(0.95 * ws, 7.8 * ls, 18),
      makeHullMat('Airframe Cabin', spec.armor.hullFront, 45)
    );
    heliFuselage.geometry.rotateX(Math.PI / 2);
    heliFuselage.position.set(0, 1.6, 0);
    registerArmorMesh(heliFuselage, 'Airframe Cabin', spec.armor.hullFront, 45);
    hullGroup.add(heliFuselage);

    rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, 2.7, 0.2);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 12), darkSteelMat);
    rotorGroup.add(mast);
    [-1, 1].forEach((dir) => {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 7.8 * ws), darkSteelMat);
      blade.position.set(0, 0.4, 0);
      blade.rotation.y = dir * (Math.PI / 4);
      rotorGroup!.add(blade);
    });
    hullGroup.add(rotorGroup);

    turretGroup.position.set(0, 1.2, 2.8 * ls);
    hullGroup.add(turretGroup);
    turretGroup.add(gunGroup);
    muzzlePoint.position.set(0, -0.3, 0.9);
    gunGroup.add(muzzlePoint);
    exhaustPoint.position.set(0, 2.1, -1.8);
    hullGroup.add(exhaustPoint);
  }
  // ==========================================================
  // BRANCH 3: FLEET
  // ==========================================================
  else if (spec.branch === 'fleet') {
    const shipHull = new THREE.Mesh(
      new THREE.BoxGeometry(2.8 * ws, 1.35 * hs, 11.5 * ls),
      makeHullMat('Main Belt', spec.armor.hullFront, 18)
    );
    shipHull.position.set(0, 0.72, 0);
    registerArmorMesh(shipHull, 'Main Belt', spec.armor.hullFront, 18);
    hullGroup.add(shipHull);

    turretGroup.position.set(0, 1.55, 3.2 * ls);
    hullGroup.add(turretGroup);
    const mainTurretBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.7, 1.9),
      makeHullMat('Main Turret', spec.armor.turretFront, 32)
    );
    turretGroup.add(mainTurretBox);
    turretGroup.add(gunGroup);
    muzzlePoint.position.set(0, 0.08, 2.6);
    gunGroup.add(muzzlePoint);
    exhaustPoint.position.set(0, 2.6, -0.7);
    hullGroup.add(exhaustPoint);
  }
  // ==========================================================
  // BRANCH 4: SPECIAL GERMAN 8,8 CM FLAK 37 HALF-TRACK ("FLAKBUS")
  // ==========================================================
  else if (isFlak37) {
    const truckW = 2.65 * ws;
    const truckH = 1.0 * hs;
    const truckL = 7.4 * ls;

    // 1. Front Steerable Truck Axle & Large Wheels
    const frontWheelRadius = 0.48 * hs;
    const frontWheelWidth = 0.28 * ws;
    const frontWheelGeo = new THREE.CylinderGeometry(frontWheelRadius, frontWheelRadius, frontWheelWidth, 24);
    frontWheelGeo.rotateZ(Math.PI / 2);
    const frontTireGeo = new THREE.TorusGeometry(frontWheelRadius * 0.95, frontWheelRadius * 0.2, 14, 24);
    frontTireGeo.rotateY(Math.PI / 2);

    [-truckW * 0.46, truckW * 0.46].forEach((sideX) => {
      const fwGroup = new THREE.Group();
      const rim = new THREE.Mesh(frontWheelGeo, darkSteelMat);
      const tire = new THREE.Mesh(frontTireGeo, rubberMat);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, frontWheelWidth * 1.15, 12), darkSteelMat);
      hub.rotateZ(Math.PI / 2);
      fwGroup.add(rim, tire, hub);
      fwGroup.position.set(sideX, frontWheelRadius, 2.85 * ls);
      fwGroup.castShadow = true;
      wheelMeshes.push(rim);
      hullGroup.add(fwGroup);
    });

    // Front leaf springs & bumper
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(truckW * 1.02, 0.2, 0.22), darkSteelMat);
    bumper.position.set(0, 0.55 * hs, 3.45 * ls);
    hullGroup.add(bumper);

    // 2. Rear Half-Track Assembly (Mid to Rear Chassis)
    const trackWidth = 0.52 * ws;
    const trackLength = 4.2 * ls;
    const trackH = 0.85 * hs;

    [-truckW * 0.44, truckW * 0.44].forEach((sideX) => {
      // 5 Interleaved German Roadwheels per side
      const wheelZ = [-2.4, -1.6, -0.8, 0.0, 0.8];
      wheelZ.forEach((wz) => {
        const rwheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38 * hs, 0.38 * hs, trackWidth * 0.8, 18), darkSteelMat);
        rwheel.rotateZ(Math.PI / 2);
        rwheel.position.set(sideX, 0.45 * hs, wz * ls);
        rwheel.castShadow = true;
        wheelMeshes.push(rwheel);
        hullGroup.add(rwheel);
      });

      // Track Belt
      const trk = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, trackH, trackLength), trackMat);
      trk.position.set(sideX, 0.48 * hs, -0.8 * ls);
      registerArmorMesh(trk, 'Track Assembly', 20, 0);
      hullGroup.add(trk);
    });

    // 3. Front Armored Engine Cowl (Bonnet) with Radiator Louvers
    const bonnetGeo = new THREE.BoxGeometry(truckW * 0.65, 0.95 * hs, 2.1 * ls);
    const bonnet = new THREE.Mesh(bonnetGeo, makeHullMat('Armored Engine Bonnet', 15, 20));
    bonnet.position.set(0, 1.1 * hs, 2.1 * ls);
    registerArmorMesh(bonnet, 'Armored Engine Bonnet', 15, 20);
    hullGroup.add(bonnet);

    // Front Radiator Grille & Notek Light
    const grille = new THREE.Mesh(new THREE.BoxGeometry(truckW * 0.55, 0.7 * hs, 0.08), darkSteelMat);
    grille.position.set(0, 1.0 * hs, 3.16 * ls);
    hullGroup.add(grille);

    const notekLight = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.18, 12), darkSteelMat);
    notekLight.position.set(-truckW * 0.28, 1.45 * hs, 2.9 * ls);
    hullGroup.add(notekLight);

    // 4. Armored Cab with Windshield Armor Visor Flaps
    const cabGeo = new THREE.BoxGeometry(truckW * 0.92, 1.25 * hs, 1.85 * ls);
    const cab = new THREE.Mesh(cabGeo, makeHullMat('Armored Driver Cab', 15, 10));
    cab.position.set(0, 1.55 * hs, 0.45 * ls);
    registerArmorMesh(cab, 'Armored Driver Cab', 15, 10);
    hullGroup.add(cab);

    // Cab windshield visor armor flap with vision slits
    const visorGeo = new THREE.BoxGeometry(truckW * 0.85, 0.38 * hs, 0.08);
    const visor = new THREE.Mesh(visorGeo, makeHullMat('Driver Vision Flap', 15, 25));
    visor.position.set(0, 1.82 * hs, 1.38 * ls);
    visor.rotation.x = -0.15;
    hullGroup.add(visor);

    // 5. Open Rear Timber/Steel Cargo Flatbed with Folded Lattice Drop Sides
    const bedGeo = new THREE.BoxGeometry(truckW * 1.06, 0.2, 4.4 * ls);
    const flatbed = new THREE.Mesh(bedGeo, woodMat);
    flatbed.position.set(0, 1.0 * hs, -1.4 * ls);
    registerArmorMesh(flatbed, 'Wooden Deck Flatbed', 10, 0);
    hullGroup.add(flatbed);

    // Folded Drop Sides (Railing grating folded down horizontally for 360 firing)
    const sideRailL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45 * hs, 4.3 * ls), darkSteelMat);
    sideRailL.position.set(-truckW * 0.54, 1.15 * hs, -1.4 * ls);
    sideRailL.rotation.z = -Math.PI / 4;
    const sideRailR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45 * hs, 4.3 * ls), darkSteelMat);
    sideRailR.position.set(truckW * 0.54, 1.15 * hs, -1.4 * ls);
    sideRailR.rotation.z = Math.PI / 4;
    hullGroup.add(sideRailL, sideRailR);

    // Lateral Stabilizer Outriggers with Jack Pads
    [-2.6, -0.6].forEach((oz) => {
      [-truckW * 0.58, truckW * 0.58].forEach((ox) => {
        const outrigger = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.14), darkSteelMat);
        outrigger.position.set(ox, 0.7 * hs, oz * ls);
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), darkSteelMat);
        pad.position.set(ox > 0 ? 0.2 : -0.2, -0.2, 0);
        outrigger.add(pad);
        hullGroup.add(outrigger);
      });
    });

    // Stacked 88mm Ammo Crates & Ready Shell Tubes on rear bed
    const ammoCrate1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.9), woodMat);
    ammoCrate1.position.set(-truckW * 0.32, 1.25 * hs, -3.1 * ls);
    const ammoCrate2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.9), woodMat);
    ammoCrate2.position.set(truckW * 0.32, 1.25 * hs, -3.1 * ls);
    hullGroup.add(ammoCrate1, ammoCrate2);

    // Exhaust Pipe
    exhaustPoint.position.set(truckW * 0.45, 0.5 * hs, -2.8 * ls);
    hullGroup.add(exhaustPoint);

    // 6. Central 360° Rotating 8.8 cm Flak 37 Pedestal Assembly
    turretGroup.position.set(0, 1.1 * hs, -1.2 * ls);
    hullGroup.add(turretGroup);

    // Conical Cast Flak Pedestal Mount
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 1.1 * hs, 20), darkSteelMat);
    pedestal.position.y = 0.55 * hs;
    turretGroup.add(pedestal);

    // Traversing Cradle Base Ring & Handwheels
    const handwheel1 = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 16), darkSteelMat);
    handwheel1.position.set(-0.52, 1.05 * hs, -0.15);
    handwheel1.rotation.y = Math.PI / 2;
    const handwheel2 = handwheel1.clone();
    handwheel2.position.set(0.52, 1.05 * hs, -0.15);
    turretGroup.add(handwheel1, handwheel2);

    // Gunner & Trainer Folding Metal Bucket Seats
    const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.35), darkSteelMat);
    seatL.position.set(-0.68, 0.85 * hs, -0.35);
    const seatR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.35), darkSteelMat);
    seatR.position.set(0.68, 0.85 * hs, -0.35);
    turretGroup.add(seatL, seatR);

    // Authentic 14.5mm Flak Gun Shield with Vision Cutout
    const shieldMat = makeHullMat('8.8 cm Flak Gun Shield', 14.5, 15);
    const shieldFront = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.45 * hs, 0.06), shieldMat);
    shieldFront.position.set(0, 1.35 * hs, 0.55);
    shieldFront.rotation.x = -0.12;
    registerArmorMesh(shieldFront, '8.8 cm Flak Gun Shield', 14.5, 15);

    const shieldLeftWing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.35 * hs, 0.85), shieldMat);
    shieldLeftWing.position.set(-1.18, 1.32 * hs, 0.2);
    shieldLeftWing.rotation.y = 0.32;

    const shieldRightWing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.35 * hs, 0.85), shieldMat);
    shieldRightWing.position.set(1.18, 1.32 * hs, 0.2);
    shieldRightWing.rotation.y = -0.32;
    turretGroup.add(shieldFront, shieldLeftWing, shieldRightWing);

    // 7. High-Elevation 8.8 cm Flak 37 Cannon Assembly
    gunGroup.position.set(0, 1.32 * hs, 0.55);
    turretGroup.add(gunGroup);

    // Heavy Breech Block & Horizontal Sliding Wedge
    const breech = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 1.25), darkSteelMat);
    breech.position.set(0, 0, -0.45);
    gunGroup.add(breech);

    // Long 8.8 cm Flak 37 L/56 Rifled Barrel
    const barrelLen = 5.6 * ls;
    const barrelRad = 0.105;
    const barrelGeo = new THREE.CylinderGeometry(barrelRad * 0.85, barrelRad, barrelLen, 24);
    barrelGeo.rotateX(Math.PI / 2);
    const flakBarrel = new THREE.Mesh(barrelGeo, darkSteelMat);
    flakBarrel.position.set(0, 0, barrelLen * 0.5 + 0.25);
    gunGroup.add(flakBarrel);

    // Twin Hydraulic Counter-Recoil / Equilibrator Cylinders on Top
    [-0.14, 0.14].forEach((rx) => {
      const recGeo = new THREE.CylinderGeometry(0.065, 0.065, 3.2, 16);
      recGeo.rotateX(Math.PI / 2);
      const rec = new THREE.Mesh(recGeo, darkSteelMat);
      rec.position.set(rx, 0.22, 1.6);
      gunGroup.add(rec);
    });

    // Muzzle Crown Ring
    const muzzleCrown = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 1.25, barrelRad * 1.25, 0.22, 18), darkSteelMat);
    muzzleCrown.rotation.x = Math.PI / 2;
    muzzleCrown.position.set(0, 0, barrelLen + 0.15);
    gunGroup.add(muzzleCrown);

    muzzlePoint.position.set(0, 0, barrelLen + 0.3);
    gunGroup.add(muzzlePoint);
  }
  // ==========================================================
  // BRANCH 5: GROUND FORCES (PHOTOREALISTIC REAL-LIFE LEVEL TANKS)
  // ==========================================================
  else {
    const hullW = 3.35 * ws;
    const hullH = 1.08 * hs;
    const hullL = 6.8 * ls;

    // 1. Running Gear & Suspension
    if (isWheeled) {
      // 4x4 for R3 rat car, 8x8 for heavy wheeled strikers (Centauro, Puma, Type 16)
      const tireRadius = (isR3 ? 0.44 : 0.52) * hs;
      const tireWidth = (isR3 ? 0.32 : 0.36) * ws;
      const wheelZPos = isR3 ? [-1.35, 1.35] : [-2.4, -0.8, 0.8, 2.4];

      [-hullW * 0.48, hullW * 0.48].forEach((sideX) => {
        wheelZPos.forEach((wz) => {
          const wheelGroup = new THREE.Group();
          const rim = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius * 0.6, tireRadius * 0.6, tireWidth, 18), makeHullMat('Wheel Rim', 30, 0, true));
          rim.rotateZ(Math.PI / 2);
          const tire = new THREE.Mesh(new THREE.TorusGeometry(tireRadius * 0.88, tireRadius * 0.28, 14, 24), rubberMat);
          tire.rotateY(Math.PI / 2);
          const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, tireWidth * 1.15, 12), darkSteelMat);
          hub.rotateZ(Math.PI / 2);
          wheelGroup.add(rim, tire, hub);
          wheelGroup.position.set(sideX, tireRadius, wz * ls);
          wheelGroup.castShadow = true;
          wheelMeshes.push(rim);
          hullGroup.add(wheelGroup);
        });
      });

      if (isR3) {
        // Spare off-road tire mounted on rear hull plate
        const spareTireGroup = new THREE.Group();
        const sRim = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius * 0.55, tireRadius * 0.55, tireWidth * 0.8, 16), darkSteelMat);
        sRim.rotateX(Math.PI / 2);
        const sTire = new THREE.Mesh(new THREE.TorusGeometry(tireRadius * 0.85, tireRadius * 0.26, 12, 20), rubberMat);
        spareTireGroup.add(sRim, sTire);
        spareTireGroup.position.set(0, 1.15 * hs, -hullL * 0.48);
        hullGroup.add(spareTireGroup);

        // Twin rear amphibious waterjet nozzles
        [-0.55 * ws, 0.55 * ws].forEach((jx) => {
          const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.35, 12), darkSteelMat);
          jet.rotateX(Math.PI / 2);
          jet.position.set(jx, 0.55 * hs, -hullL * 0.46);
          hullGroup.add(jet);
        });
      }
    } else {
      // Caterpillar Track Suspension
      const wheelRadius = (isMaus ? 0.36 : isT34 ? 0.44 : 0.38) * hs;
      const wheelWidth = (isMaus ? 0.36 : 0.28) * ws;
      const wheelRimGeo = new THREE.CylinderGeometry(wheelRadius * 0.92, wheelRadius, wheelWidth, 24);
      wheelRimGeo.rotateZ(Math.PI / 2);
      const wheelTireGeo = new THREE.TorusGeometry(wheelRadius * 0.96, wheelRadius * 0.16, 14, 28);
      wheelTireGeo.rotateY(Math.PI / 2);

      // Roadwheel Z positions
      // Maus has 12 dual-wheel bogie sets per side; T-34 has 5 large Christie roadwheels; Tigers have interleaved / 6-8 sets
      const wheelZPositions = isMaus
        ? [-2.85, -2.35, -1.85, -1.35, -0.85, -0.35, 0.15, 0.65, 1.15, 1.65, 2.15, 2.65]
        : isT34
        ? [-2.1, -1.1, -0.1, 0.9, 1.9]
        : isTiger2
        ? [-2.6, -1.9, -1.2, -0.5, 0.2, 0.9, 1.6, 2.3]
        : [-2.4, -1.45, -0.5, 0.45, 1.4, 2.35];

      [-hullW * 0.44, hullW * 0.44].forEach((sideX) => {
        wheelZPositions.forEach((wz) => {
          const wheelGroup = new THREE.Group();
          [-wheelWidth * 0.38, wheelWidth * 0.38].forEach((subX) => {
            const rim = new THREE.Mesh(wheelRimGeo, makeHullMat('Roadwheel Hub', 40, 0, true));
            rim.position.x = subX;
            const tire = new THREE.Mesh(wheelTireGeo, rubberMat);
            tire.position.x = subX;
            wheelGroup.add(rim, tire);
            wheelMeshes.push(rim);
          });

          const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, wheelWidth * 1.08, 14), darkSteelMat);
          hubCap.rotateZ(Math.PI / 2);
          wheelGroup.add(hubCap);

          const swingArm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.42), darkSteelMat);
          swingArm.position.set(sideX > 0 ? -0.15 : 0.15, 0.12 * hs, -0.15);
          swingArm.rotation.x = 0.35;
          wheelGroup.add(swingArm);

          wheelGroup.position.set(sideX, wheelRadius, wz * ls);
          wheelGroup.castShadow = true;
          hullGroup.add(wheelGroup);
        });

        // Raised Front Idler Wheel
        const idler = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * hs, 0.32 * hs, wheelWidth, 20), darkSteelMat);
        idler.rotateZ(Math.PI / 2);
        idler.position.set(sideX, 0.62 * hs, 3.1 * ls);
        hullGroup.add(idler);

        // Rear Drive Sprocket
        const sprocket = new THREE.Mesh(new THREE.CylinderGeometry(0.36 * hs, 0.36 * hs, wheelWidth, 18), darkSteelMat);
        sprocket.rotateZ(Math.PI / 2);
        sprocket.position.set(sideX, 0.65 * hs, -3.1 * ls);
        hullGroup.add(sprocket);

        // MAUS ICONIC FULL-LENGTH 200MM ENCLOSED SIDE SKIRTS (Schürzen)
        if (isMaus) {
          const skirtW = 0.22;
          const skirtH = 1.25 * hs;
          const skirtL = hullL * 0.96;
          const mausSkirtGeo = new THREE.BoxGeometry(skirtW, skirtH, skirtL);
          const mausSkirt = new THREE.Mesh(mausSkirtGeo, makeHullMat('200mm Heavy Side Skirt Armor', spec.armor.hullSide, 0));
          mausSkirt.position.set(sideX > 0 ? sideX + 0.38 * ws : sideX - 0.38 * ws, 0.76 * hs, 0);
          registerArmorMesh(mausSkirt, '200mm Heavy Side Skirt Armor', spec.armor.hullSide, 0);
          hullGroup.add(mausSkirt);

          // Lower beveled skirt edge
          const bevelGeo = new THREE.BoxGeometry(skirtW * 0.9, 0.28 * hs, skirtL);
          const skirtBevel = new THREE.Mesh(bevelGeo, darkSteelMat);
          skirtBevel.position.set(sideX > 0 ? sideX + 0.35 * ws : sideX - 0.35 * ws, 0.18 * hs, 0);
          skirtBevel.rotation.z = sideX > 0 ? 0.3 : -0.3;
          hullGroup.add(skirtBevel);
        }
      });

      // Track Belts (Maus has massive 1,100mm wide heavy double tracks)
      const trackWidth = (isMaus ? 0.98 : 0.68) * ws;
      const trackLength = hullL * 0.98;
      const trackHeight = (isMaus ? 1.05 : 0.94) * hs;
      const trackGeo = new THREE.BoxGeometry(trackWidth, trackHeight, trackLength);

      const leftTrack = new THREE.Mesh(trackGeo, trackMat);
      leftTrack.position.set(-hullW * 0.44, 0.49 * hs, 0);
      registerArmorMesh(leftTrack, 'Port Track Belt', 40, 0);

      const rightTrack = new THREE.Mesh(trackGeo, trackMat);
      rightTrack.position.set(hullW * 0.44, 0.49 * hs, 0);
      registerArmorMesh(rightTrack, 'Starboard Track Belt', 40, 0);
      hullGroup.add(leftTrack, rightTrack);
    }

    // 2. Lower Hull Tub & Glacis
    const lowerHullGeo = new THREE.BoxGeometry(hullW * (isMaus ? 0.86 : 0.74), hullH * 0.88, hullL * (isMaus ? 0.92 : 0.88));
    const lowerHull = new THREE.Mesh(lowerHullGeo, makeHullMat('Lower Glacis & Hull Tub', spec.armor.hullFront * 0.7, 45));
    lowerHull.position.set(0, 0.82 * hs, 0);
    registerArmorMesh(lowerHull, 'Lower Glacis & Hull Tub', spec.armor.hullFront * 0.7, 45);
    hullGroup.add(lowerHull);

    // Front Tow Shackles
    [-0.9, 0.9].forEach((tx) => {
      const shackle = new THREE.Mesh(new THREE.TorusGeometry(isMaus ? 0.18 : 0.12, isMaus ? 0.06 : 0.04, 8, 14), darkSteelMat);
      shackle.position.set(tx, 0.62 * hs, hullL * 0.44);
      hullGroup.add(shackle);
    });

    // Upper Front Glacis Plate
    // Maus: 200mm solid rolled plate at 55° (0.96 rad), clean monolithic front without ball MG
    // Tiger 1: Vertical flat 102mm front (0.14 rad)
    // King Tiger: 50° sloped 150mm glacis (0.87 rad)
    // Panther / T-34: 55°-60° sloped glacis
    const glacisSlope = isMaus
      ? 0.96
      : isTiger1
      ? 0.14
      : isTiger2
      ? 0.87
      : isPanther || isT34
      ? 1.02
      : isWW2
      ? 0.65
      : 0.6;

    const glacisGeo = new THREE.BoxGeometry(hullW * (isMaus ? 0.86 : 0.74), 0.28, (isMaus ? 2.4 : 2.0) * ls);
    const glacis = new THREE.Mesh(glacisGeo, makeHullMat('Upper Front Glacis Plate', spec.armor.hullFront, Math.round(glacisSlope * 57)));
    glacis.position.set(0, (isMaus ? 1.35 : 1.2) * hs, hullL * (isMaus ? 0.38 : 0.36));
    glacis.rotation.x = glacisSlope;
    registerArmorMesh(glacis, 'Upper Front Glacis Plate', spec.armor.hullFront, Math.round(glacisSlope * 57));
    hullGroup.add(glacis);

    // Distinctive Front Hull Details
    if (isMaus) {
      // Maus Central Raised Armored Cowl for Driver & Radio Operator Periscopes
      const doghouse = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.24 * hs, 0.52 * ls), makeHullMat('Driver Periscope Cowl', 100, 30));
      doghouse.position.set(0, 1.48 * hs, hullL * 0.32);
      hullGroup.add(doghouse);

      // Rotating periscope vision blocks
      [-0.22, 0.22].forEach((px) => {
        const peri = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.14, 12), darkSteelMat);
        peri.position.set(px, 1.62 * hs, hullL * 0.32);
        hullGroup.add(peri);
      });
    } else if (isTiger1) {
      // Tiger I Vertical Front Plate Visor Block & Kugelblende 38
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.14), darkSteelMat);
      visor.position.set(-0.48 * ws, 1.25 * hs, hullL * 0.39);
      hullGroup.add(visor);

      const ballMG = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), darkSteelMat);
      ballMG.position.set(0.48 * ws, 1.25 * hs, hullL * 0.38);
      const barrelMG = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 8), darkSteelMat);
      barrelMG.rotation.x = Math.PI / 2;
      barrelMG.position.set(0, 0, 0.16);
      ballMG.add(barrelMG);
      hullGroup.add(ballMG);

      // Spare Track Links strapped across lower glacis
      const spareTrack = new THREE.Mesh(new THREE.BoxGeometry(hullW * 0.62, 0.22, 0.14), darkSteelMat);
      spareTrack.position.set(0, 0.78 * hs, hullL * 0.42);
      hullGroup.add(spareTrack);
    } else if (isWW2) {
      const ballMG = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), darkSteelMat);
      ballMG.position.set(0.48 * ws, 1.25 * hs, hullL * 0.38);
      const barrelMG = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 8), darkSteelMat);
      barrelMG.rotation.x = Math.PI / 2;
      barrelMG.position.set(0, 0, 0.16);
      ballMG.add(barrelMG);
      hullGroup.add(ballMG);
    }

    // Engine Deck & Louvers
    // For Maus: Engine deck is in the CENTER of the hull (between hull center and rear-mounted turret)
    const engineDeckGeo = new THREE.BoxGeometry(hullW * (isMaus ? 0.86 : 0.74), 0.24, hullL * (isMaus ? 0.36 : 0.44));
    const engineDeck = new THREE.Mesh(engineDeckGeo, makeHullMat('Engine Deck', spec.armor.hullRear, 10, true));
    engineDeck.position.set(0, (isMaus ? 1.48 : 1.36) * hs, (isMaus ? 0.08 : -0.24) * hullL);
    registerArmorMesh(engineDeck, 'Engine Deck', spec.armor.hullRear, 10);
    hullGroup.add(engineDeck);

    // Louvers / Radiator Grilles
    [-0.45 * ws, 0.45 * ws].forEach((lx) => {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.55 * ws, 0.06, 0.9 * ls), darkSteelMat);
      louver.position.set(lx, (isMaus ? 1.62 : 1.48) * hs, (isMaus ? 0.08 : -0.24) * hullL);
      hullGroup.add(louver);
    });

    // Engine Exhaust Outlet & External Fuel Tanks
    if (isMaus) {
      // MAUS ICONIC 1,000-LITER EXTERNAL CYLINDRICAL FUEL DRUM on Rear Hull
      const drumRad = 0.46 * hs;
      const drumLen = hullW * 0.72;
      const drumGeo = new THREE.CylinderGeometry(drumRad, drumRad, drumLen, 24);
      drumGeo.rotateZ(Math.PI / 2);
      const fuelDrum = new THREE.Mesh(drumGeo, makeHullMat('1,000L External Fuel Drum', 25, 0));
      fuelDrum.position.set(0, 1.25 * hs, -hullL * 0.47);
      registerArmorMesh(fuelDrum, '1,000L External Fuel Drum', 25, 0);
      hullGroup.add(fuelDrum);

      // Steel mounting straps & fuel lines
      [-drumLen * 0.32, drumLen * 0.32].forEach((sx) => {
        const strap = new THREE.Mesh(new THREE.TorusGeometry(drumRad * 1.05, 0.035, 8, 20), darkSteelMat);
        strap.rotation.y = Math.PI / 2;
        strap.position.set(sx, 1.25 * hs, -hullL * 0.47);
        hullGroup.add(strap);

        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38 * hs, 0.32 * ls), darkSteelMat);
        bracket.position.set(sx, 0.95 * hs, -hullL * 0.45);
        hullGroup.add(bracket);
      });

      exhaustPoint.position.set(0, 1.55 * hs, -0.05 * hullL);
    } else if (isTiger1) {
      // Iconic Tiger I twin cylindrical exhausts with curved armored shrouds
      [-0.62, 0.62].forEach((tx) => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.95 * hs, 12), darkSteelMat);
        pipe.position.set(tx, 1.1 * hs, -hullL * 0.46);
        const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.7 * hs, 12), darkSteelMat);
        shroud.position.set(0, -0.1, 0.05);
        pipe.add(shroud);
        hullGroup.add(pipe);
      });
      exhaustPoint.position.set(0, 1.2 * hs, -hullL * 0.49);
    } else if (isTiger2) {
      // Tiger II King Tiger: Twin vertical bare exhaust pipes & circular fan covers
      [-0.58, 0.58].forEach((tx) => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.85 * hs, 14), darkSteelMat);
        pipe.position.set(tx, 1.15 * hs, -hullL * 0.47);
        hullGroup.add(pipe);
      });
      exhaustPoint.position.set(0, 1.15 * hs, -hullL * 0.49);
    } else if (isT34 || isIS2) {
      // Soviet T-34 & IS-2 Twin External Cylindrical Fuel Drums on Rear Sides
      [-hullW * 0.42, hullW * 0.42].forEach((fx) => {
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * hs, 0.24 * hs, 1.2 * ls, 16), darkSteelMat);
        drum.rotateX(Math.PI / 2);
        drum.position.set(fx, 1.35 * hs, -hullL * 0.32);
        hullGroup.add(drum);
      });
      exhaustPoint.position.set(0, 0.95 * hs, -hullL * 0.49);
    } else {
      const exhaustBox = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.48, 0.36), darkSteelMat);
      exhaustBox.position.set(0, 1.0 * hs, -hullL * 0.48);
      hullGroup.add(exhaustBox);
      exhaustPoint.position.set(0, 0.94 * hs, -hullL * 0.53);
    }
    hullGroup.add(exhaustPoint);

    // Side Skirts (Modern MBTs or tanks with ERA / Schürzen, excluding Maus which has built-in 200mm heavy skirts)
    if (!isWW2 && !isWheeled && !isMaus) {
      const skirtGeo = new THREE.BoxGeometry(0.18, 0.68 * hs, hullL * 0.9);
      const leftSkirt = new THREE.Mesh(skirtGeo, makeHullMat('Ballistic Side Skirts', spec.armor.hullSide, 15, true));
      leftSkirt.position.set(-hullW * 0.51, 0.9 * hs, 0);
      registerArmorMesh(leftSkirt, 'Ballistic Side Skirts', spec.armor.hullSide, 15);
      const rightSkirt = leftSkirt.clone();
      rightSkirt.position.set(hullW * 0.51, 0.9 * hs, 0);
      registerArmorMesh(rightSkirt, 'Ballistic Side Skirts', spec.armor.hullSide, 15);
      hullGroup.add(leftSkirt, rightSkirt);

      if (spec.visual.hasERA) {
        for (let s = -2.0; s <= 2.0; s += 0.8) {
          [-hullW * 0.53, hullW * 0.53].forEach((sx) => {
            const eraTile = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38 * hs, 0.65), darkSteelMat);
            eraTile.position.set(sx, 0.96 * hs, s * ls);
            hullGroup.add(eraTile);
          });
        }
      }
    }

    // 3. Fighting Compartment / Turret
    if (isCasemate) {
      // CASEMATE SUPERSTRUCTURE (Jagdpanther, Ferdinand, StuG, Strv 103)
      const caseW = hullW * 0.72;
      const caseH = 1.15 * hs;
      const caseL = 3.8 * ls;
      const caseGeo = new THREE.BoxGeometry(caseW, caseH, caseL);
      const casemate = new THREE.Mesh(caseGeo, makeHullMat('Casemate Superstructure Glacis', spec.armor.turretFront, 55));
      casemate.position.set(0, 1.62 * hs, 0.2 * ls);
      registerArmorMesh(casemate, 'Casemate Superstructure Glacis', spec.armor.turretFront, 55);
      hullGroup.add(casemate);

      // Gun traverses with turretGroup limited
      turretGroup.position.set(0, 1.55 * hs, 0.2 * ls);
      hullGroup.add(turretGroup);

      // Heavy Saukopf / Ball Gun Mantlet
      gunGroup.position.set(0, 0, caseL * 0.52);
      turretGroup.add(gunGroup);

      const saukopf = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16), darkSteelMat);
      saukopf.scale.set(1.1, 1.0, 1.4);
      registerArmorMesh(saukopf, 'Cast Saukopf Gun Mantlet', spec.armor.turretFront * 1.2, 50);
      gunGroup.add(saukopf);

      const barrelLen = 5.4 * ls;
      const barrelRad = 0.12;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 0.88, barrelRad, barrelLen, 20), darkSteelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0, barrelLen * 0.5);
      gunGroup.add(barrel);

      const muzzleCrown = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 1.5, barrelRad * 1.5, 0.45, 16), darkSteelMat);
      muzzleCrown.rotation.x = Math.PI / 2;
      muzzleCrown.position.set(0, 0, barrelLen);
      gunGroup.add(muzzleCrown);

      muzzlePoint.position.set(0, 0, barrelLen + 0.25);
      gunGroup.add(muzzlePoint);
    } else if (isR3 && spec.visual.barrelCount === 2) {
      // DUAL 105 MM RECOILLESS CANNONS (R3 T106 FA-HS RAT TANK)
      const turretW = hullW * 0.52;
      const turretH = 0.38 * hs;

      turretGroup.position.set(0, 1.36 * hs, 0.05 * ls);
      hullGroup.add(turretGroup);

      // Compact circular traverse pedestal with commander ring
      const pedestalGeo = new THREE.CylinderGeometry(turretW * 0.48, turretW * 0.52, turretH, 20);
      const pedestal = new THREE.Mesh(pedestalGeo, makeHullMat('Gun Mount Base', spec.armor.turretFront, 15));
      pedestal.position.y = turretH * 0.5;
      registerArmorMesh(pedestal, 'Gun Mount Base', spec.armor.turretFront, 15);
      turretGroup.add(pedestal);

      // Central elevating pivot trunnion cradle
      const cradle = new THREE.Mesh(new THREE.BoxGeometry(turretW * 0.58, 0.32 * hs, 0.65 * ls), darkSteelMat);
      cradle.position.set(0, turretH + 0.12 * hs, 0);
      turretGroup.add(cradle);

      // Gun elevating group
      gunGroup.position.set(0, turretH + 0.16 * hs, 0);
      turretGroup.add(gunGroup);

      // Crossbar connecting both recoil tubes
      const crossbar = new THREE.Mesh(new THREE.BoxGeometry(turretW * 0.88, 0.14 * hs, 0.3 * ls), darkSteelMat);
      gunGroup.add(crossbar);

      // Dual 105mm M40A1 Recoilless Rifles
      const barrelLen = 3.65 * ls;
      const barrelRad = 0.092;
      const barrelOffsets = [-turretW * 0.36, turretW * 0.36];

      barrelOffsets.forEach((bx) => {
        // Main rifled tube
        const bGeo = new THREE.CylinderGeometry(barrelRad * 0.9, barrelRad, barrelLen, 20);
        bGeo.rotateX(Math.PI / 2);
        const tube = new THREE.Mesh(bGeo, darkSteelMat);
        tube.position.set(bx, 0, barrelLen * 0.45);
        gunGroup.add(tube);

        // Rear Venturi Exhaust Nozzle (characteristic cone flare where backblast expels)
        const nozzleGeo = new THREE.CylinderGeometry(barrelRad * 1.85, barrelRad * 0.95, 0.65 * ls, 16);
        nozzleGeo.rotateX(Math.PI / 2);
        const nozzle = new THREE.Mesh(nozzleGeo, darkSteelMat);
        nozzle.position.set(bx, 0, -0.32 * ls);
        gunGroup.add(nozzle);

        // Breech hinge & chamber ring
        const breech = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 1.45, barrelRad * 1.45, 0.42 * ls, 16), darkSteelMat);
        breech.rotateX(Math.PI / 2);
        breech.position.set(bx, 0, 0.12 * ls);
        gunGroup.add(breech);

        // Muzzle crown ring
        const mRing = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 1.25, barrelRad * 1.25, 0.16, 16), darkSteelMat);
        mRing.rotateX(Math.PI / 2);
        mRing.position.set(bx, 0, barrelLen * 0.94);
        gunGroup.add(mRing);
      });

      // 12.7mm M80 Spotting Rifle mounted on top of the right recoilless barrel
      const spotGunGeo = new THREE.CylinderGeometry(0.026, 0.026, 1.85 * ls, 10);
      spotGunGeo.rotateX(Math.PI / 2);
      const spotGun = new THREE.Mesh(spotGunGeo, darkSteelMat);
      spotGun.position.set(turretW * 0.36, 0.16 * hs, barrelLen * 0.32);
      gunGroup.add(spotGun);

      // Central optical aiming scope (M92D telescope)
      const scopeGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.6 * ls, 14);
      scopeGeo.rotateX(Math.PI / 2);
      const scope = new THREE.Mesh(scopeGeo, darkSteelMat);
      scope.position.set(0, 0.22 * hs, 0.1 * ls);
      gunGroup.add(scope);

      muzzlePoint.position.set(0, 0, barrelLen + 0.18);
      gunGroup.add(muzzlePoint);
    } else if (isR3 && spec.visual.barrelCount === 1) {
      // SINGLE AUTOCANNON R3 (R3 T20 FA-HS 20mm)
      const turretW = hullW * 0.48;
      const turretH = 0.55 * hs;
      turretGroup.position.set(0, 1.38 * hs, 0.08 * ls);
      hullGroup.add(turretGroup);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(turretW * 0.48, 16, 14), makeHullMat('20mm Turret Dome', spec.armor.turretFront, 40));
      dome.scale.set(1, 0.75, 1.2);
      registerArmorMesh(dome, '20mm Turret Dome', spec.armor.turretFront, 40);
      turretGroup.add(dome);

      gunGroup.position.set(0, 0.15 * hs, turretW * 0.45);
      turretGroup.add(gunGroup);

      const bLen = 2.8 * ls;
      const bRad = 0.045;
      const autocannon = new THREE.Mesh(new THREE.CylinderGeometry(bRad * 0.8, bRad, bLen, 14), darkSteelMat);
      autocannon.rotateX(Math.PI / 2);
      autocannon.position.set(0, 0, bLen * 0.5);
      gunGroup.add(autocannon);

      muzzlePoint.position.set(0, 0, bLen + 0.1);
      gunGroup.add(muzzlePoint);
    } else if (isMaus) {
      // ============================================================
      // AUTHENTIC PANZER VIII MAUS (SUPER-HEAVY 188-TON TANK)
      // Real historical Maus: Turret mounted on the REAR third of the hull!
      // ============================================================
      const turretW = hullW * 0.78;
      const turretH = 1.05 * hs;
      const turretL = 4.3 * ls;

      turretGroup.position.set(0, 1.54 * hs, -0.92 * ls);
      hullGroup.add(turretGroup);

      // Main slab turret body (Vertical 205mm slab sides, 60mm roof)
      const turretBodyGeo = new THREE.BoxGeometry(turretW, turretH, turretL * 0.76);
      const turretBody = new THREE.Mesh(turretBodyGeo, makeHullMat('Maus Turret Body', spec.armor.turretFront, 15));
      turretBody.position.set(0, turretH * 0.5, -turretL * 0.08);
      registerArmorMesh(turretBody, 'Maus Turret Body', spec.armor.turretFront, 15);
      turretGroup.add(turretBody);

      // Iconic Curved Cast Cylindrical Front Face (240mm curved armor shield)
      const curvedFrontGeo = new THREE.CylinderGeometry(turretH * 0.56, turretH * 0.56, turretW * 0.98, 28, 1, false, 0, Math.PI);
      curvedFrontGeo.rotateZ(Math.PI / 2);
      curvedFrontGeo.rotateX(-Math.PI / 2);
      const curvedFront = new THREE.Mesh(curvedFrontGeo, makeHullMat('240mm Cast Cylindrical Face', spec.armor.turretFront, 35));
      curvedFront.position.set(0, turretH * 0.5, turretL * 0.28);
      registerArmorMesh(curvedFront, '240mm Cast Cylindrical Face', spec.armor.turretFront, 35);
      turretGroup.add(curvedFront);

      // Rear Undercut Beveled Plate & Spent Casing Ejection Hatch
      const rearBevel = new THREE.Mesh(new THREE.BoxGeometry(turretW * 0.96, 0.45 * hs, 0.85 * ls), makeHullMat('Turret Rear Undercut', spec.armor.turretRear, 35));
      rearBevel.position.set(0, turretH * 0.22, -turretL * 0.44);
      rearBevel.rotation.x = 0.45;
      turretGroup.add(rearBevel);

      const ejectionHatch = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16), darkSteelMat);
      ejectionHatch.rotateX(Math.PI / 2);
      ejectionHatch.position.set(0, turretH * 0.62, -turretL * 0.46);
      turretGroup.add(ejectionHatch);

      // Roof Details: Dual Rotating Commander & Loader Hatches, Central Mushroom Ventilator, Periscopes
      [-turretW * 0.26, turretW * 0.26].forEach((hx) => {
        const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.12, 16), darkSteelMat);
        hatch.position.set(hx, turretH + 0.06 * hs, -0.4 * ls);
        const lid = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), darkSteelMat);
        lid.position.y = 0.06;
        hatch.add(lid);
        turretGroup.add(hatch);
      });

      const mushroomVent = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.16, 16), darkSteelMat);
      mushroomVent.position.set(0, turretH + 0.08 * hs, 0.2 * ls);
      turretGroup.add(mushroomVent);

      // Rangefinder Armored Blister Hoods on Left & Right
      [-turretW * 0.51, turretW * 0.51].forEach((bx) => {
        const blister = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), darkSteelMat);
        blister.scale.set(0.6, 1.0, 1.4);
        blister.position.set(bx, turretH * 0.82, 0.4 * ls);
        turretGroup.add(blister);
      });

      // Turret Gun Mount & Mantlet
      gunGroup.position.set(0, turretH * 0.5, turretL * 0.38);
      turretGroup.add(gunGroup);

      // Heavy Walzenblende Cast Mantlet covering both guns
      const mantletGeo = new THREE.CylinderGeometry(0.55, 0.6, 1.45, 20);
      mantletGeo.rotateZ(Math.PI / 2);
      const mantlet = new THREE.Mesh(mantletGeo, makeHullMat('Walzenblende Gun Mantlet', spec.armor.turretFront * 1.1, 40, true));
      registerArmorMesh(mantlet, 'Walzenblende Gun Mantlet', spec.armor.turretFront * 1.1, 40);
      gunGroup.add(mantlet);

      // 1. PRIMARY: 12.8 cm KwK 44 L/55 Heavy Anti-Tank Cannon
      const mainOffset = -0.15 * ws;
      const barrelLen = 6.4 * ls;
      const barrelRad = 0.145;
      const mainBarrelGeo = new THREE.CylinderGeometry(barrelRad * 0.86, barrelRad, barrelLen, 24);
      mainBarrelGeo.rotateX(Math.PI / 2);
      const mainBarrel = new THREE.Mesh(mainBarrelGeo, darkSteelMat);
      mainBarrel.position.set(mainOffset, 0, barrelLen * 0.5);
      gunGroup.add(mainBarrel);

      // Heavy reinforced chamber sleeve collar
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 1.35, barrelRad * 1.35, 1.45 * ls, 20), darkSteelMat);
      collar.rotateX(Math.PI / 2);
      collar.position.set(mainOffset, 0, 0.72 * ls);
      gunGroup.add(collar);

      // Stepped Muzzle Crown Ring (Maus 12.8cm had no muzzle brake!)
      const mCrown = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 1.25, barrelRad * 1.25, 0.24, 18), darkSteelMat);
      mCrown.rotateX(Math.PI / 2);
      mCrown.position.set(mainOffset, 0, barrelLen);
      gunGroup.add(mCrown);

      // 2. COAXIAL SECONDARY: 7.5 cm KwK 44 L/36.5 Cannon (Mounted directly right of 128mm)
      const secOffset = 0.28 * ws;
      const secLen = 3.65 * ls;
      const secRad = 0.088;
      const secBarrelGeo = new THREE.CylinderGeometry(secRad * 0.85, secRad, secLen, 18);
      secBarrelGeo.rotateX(Math.PI / 2);
      const secBarrel = new THREE.Mesh(secBarrelGeo, darkSteelMat);
      secBarrel.position.set(secOffset, 0, secLen * 0.5);
      gunGroup.add(secBarrel);

      const secCrown = new THREE.Mesh(new THREE.CylinderGeometry(secRad * 1.2, secRad * 1.2, 0.18, 16), darkSteelMat);
      secCrown.rotateX(Math.PI / 2);
      secCrown.position.set(secOffset, 0, secLen);
      gunGroup.add(secCrown);

      // 3. Coaxial 7.92mm MG 34 port
      const mgPort = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.45 * ls, 10), darkSteelMat);
      mgPort.rotateX(Math.PI / 2);
      mgPort.position.set(secOffset, 0.22 * hs, 0.45 * ls);
      gunGroup.add(mgPort);

      muzzlePoint.position.set(mainOffset, 0, barrelLen + 0.25);
      gunGroup.add(muzzlePoint);
    } else if (isTiger1) {
      // ============================================================
      // AUTHENTIC PANZERKAMPFWAGEN VI TIGER I (AUSF. H1 / E)
      // Iconic horseshoe turret, Rommelkiste rear bustle bin, spare tracks, 8.8 cm KwK 36
      // ============================================================
      const turretW = hullW * 0.72;
      const turretH = 0.84 * hs;
      const turretL = 3.3 * ls;

      turretGroup.position.set(0, 1.48 * hs, 0.05 * ls);
      hullGroup.add(turretGroup);

      // Horseshoe Curved/Rolled Turret Body
      const turretBaseGeo = new THREE.CylinderGeometry(turretW * 0.5, turretW * 0.54, turretH, 24);
      const turretBase = new THREE.Mesh(turretBaseGeo, makeHullMat('Tiger I Turret Armor', spec.armor.turretFront, 15));
      turretBase.position.set(0, turretH * 0.5, 0);
      registerArmorMesh(turretBase, 'Tiger I Turret Armor', spec.armor.turretFront, 15);
      turretGroup.add(turretBase);

      // Cylindrical Commander's Cupola with 5 Vision Slits
      const cupolaGeo = new THREE.CylinderGeometry(0.34, 0.36, 0.42 * hs, 16);
      const cupola = new THREE.Mesh(cupolaGeo, darkSteelMat);
      cupola.position.set(-turretW * 0.28, turretH + 0.18 * hs, -0.32 * ls);
      turretGroup.add(cupola);

      // Spare Track Links hung along turret sides
      [-turretW * 0.52, turretW * 0.52].forEach((sx) => {
        for (let t = -0.45; t <= 0.45; t += 0.35) {
          const trackLink = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.24), darkSteelMat);
          trackLink.position.set(sx, turretH * 0.5, t * ls);
          turretGroup.add(trackLink);
        }
      });

      // Turret Stowage Rommelkiste (Rear bustle bin)
      const bustle = new THREE.Mesh(new THREE.BoxGeometry(turretW * 0.65, 0.48 * hs, 0.85 * ls), darkSteelMat);
      bustle.position.set(0, turretH * 0.48, -turretL * 0.48);
      turretGroup.add(bustle);

      // Gun Mantlet & 8.8 cm KwK 36 L/56 Cannon
      gunGroup.position.set(0, turretH * 0.5, turretW * 0.5);
      turretGroup.add(gunGroup);

      const mantletGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.98, 18);
      mantletGeo.rotateZ(Math.PI / 2);
      const mantlet = new THREE.Mesh(mantletGeo, makeHullMat('Cast Gun Mantlet', spec.armor.turretFront, 30, true));
      registerArmorMesh(mantlet, 'Cast Gun Mantlet', spec.armor.turretFront, 30);
      gunGroup.add(mantlet);

      const barrelLen = 5.3 * ls;
      const barrelRad = 0.11;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 0.88, barrelRad, barrelLen, 20), darkSteelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0, barrelLen * 0.5);
      gunGroup.add(barrel);

      // Iconic Double-Baffle Muzzle Brake
      const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 1.6, barrelRad * 1.6, 0.44, 16), darkSteelMat);
      muzzleBrake.rotation.x = Math.PI / 2;
      muzzleBrake.position.set(0, 0, barrelLen);
      gunGroup.add(muzzleBrake);

      muzzlePoint.position.set(0, 0, barrelLen + 0.24);
      gunGroup.add(muzzlePoint);
    } else if (isTiger2) {
      // ============================================================
      // AUTHENTIC TIGER II (HENSCHEL KING TIGER)
      // Sloped front plate, 25° sloped sides, long rear overhang bustle, 8.8 cm KwK 43 L/71
      // ============================================================
      const turretW = hullW * 0.72;
      const turretH = 0.86 * hs;
      const turretL = 4.1 * ls;

      turretGroup.position.set(0, 1.48 * hs, 0.02 * ls);
      hullGroup.add(turretGroup);

      // Long Henschel Turret Body with 25° Sloped Sides
      const bodyGeo = new THREE.BoxGeometry(turretW, turretH, turretL * 0.75);
      const body = new THREE.Mesh(bodyGeo, makeHullMat('Tiger II Henschel Turret', spec.armor.turretFront, 25));
      body.position.set(0, turretH * 0.5, -turretL * 0.08);
      registerArmorMesh(body, 'Tiger II Henschel Turret', spec.armor.turretFront, 25);
      turretGroup.add(body);

      // Sloped Front Plate (185mm armor at 10°)
      const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(turretW * 0.95, turretH * 0.95, 0.65 * ls), makeHullMat('185mm Front Armor', 185, 10));
      frontPlate.position.set(0, turretH * 0.5, turretL * 0.28);
      registerArmorMesh(frontPlate, '185mm Front Armor', 185, 10);
      turretGroup.add(frontPlate);

      // Rear Bustle Overhang with Circular Loading/Escape Hatch
      const rearHatch = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16), darkSteelMat);
      rearHatch.rotateX(Math.PI / 2);
      rearHatch.position.set(0, turretH * 0.52, -turretL * 0.44);
      turretGroup.add(rearHatch);

      // Track Link Hangers along both turret sides
      [-turretW * 0.51, turretW * 0.51].forEach((sx) => {
        for (let t = -0.55; t <= 0.45; t += 0.35) {
          const trackLink = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.26), darkSteelMat);
          trackLink.position.set(sx, turretH * 0.52, t * ls);
          turretGroup.add(trackLink);
        }
      });

      // Gun Mantlet & Long 8.8 cm KwK 43 L/71
      gunGroup.position.set(0, turretH * 0.5, turretL * 0.38);
      turretGroup.add(gunGroup);

      const mantlet = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.98, 18), makeHullMat('Saukopf Mantlet', spec.armor.turretFront, 40, true));
      mantlet.rotateZ(Math.PI / 2);
      registerArmorMesh(mantlet, 'Saukopf Mantlet', spec.armor.turretFront, 40);
      gunGroup.add(mantlet);

      const barrelLen = 6.2 * ls;
      const barrelRad = 0.115;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 0.85, barrelRad, barrelLen, 22), darkSteelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0, barrelLen * 0.5);
      gunGroup.add(barrel);

      const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 1.6, barrelRad * 1.6, 0.46, 16), darkSteelMat);
      muzzleBrake.rotation.x = Math.PI / 2;
      muzzleBrake.position.set(0, 0, barrelLen);
      gunGroup.add(muzzleBrake);

      muzzlePoint.position.set(0, 0, barrelLen + 0.25);
      gunGroup.add(muzzlePoint);
    } else if (isPanther) {
      // ============================================================
      // AUTHENTIC PANZER V PANTHER (AUSF. G)
      // Hexagonal turret, iconic "chin" mantlet to prevent shot traps, long 7.5 cm KwK 42
      // ============================================================
      const turretW = hullW * 0.65;
      const turretH = 0.8 * hs;
      const turretL = 3.2 * ls;

      turretGroup.position.set(0, 1.48 * hs, 0.08 * ls);
      hullGroup.add(turretGroup);

      const bodyGeo = new THREE.BoxGeometry(turretW * 0.92, turretH, turretL * 0.8);
      const body = new THREE.Mesh(bodyGeo, makeHullMat('Panther Turret Body', spec.armor.turretFront, 25));
      body.position.set(0, turretH * 0.5, -turretL * 0.08);
      turretGroup.add(body);

      // Sloped cheeks
      [-turretW * 0.35, turretW * 0.35].forEach((cx) => {
        const cheek = new THREE.Mesh(new THREE.BoxGeometry(turretW * 0.42, turretH * 0.95, 1.2 * ls), makeHullMat('Sloped Cheek', 100, 30));
        cheek.position.set(cx, turretH * 0.5, turretL * 0.22);
        cheek.rotation.y = cx > 0 ? -0.28 : 0.28;
        turretGroup.add(cheek);
      });

      // Gun Mantlet with Ausf. G "Chin" flange
      gunGroup.position.set(0, turretH * 0.5, turretL * 0.32);
      turretGroup.add(gunGroup);

      const mantlet = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.48, 0.92, 18), makeHullMat('Panther Chin Mantlet', 110, 35, true));
      mantlet.rotateZ(Math.PI / 2);
      registerArmorMesh(mantlet, 'Panther Chin Mantlet', 110, 35);
      gunGroup.add(mantlet);

      // Chin projection plate on lower mantlet
      const chin = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16 * hs, 0.22 * ls), darkSteelMat);
      chin.position.set(0, -0.28 * hs, 0.15);
      gunGroup.add(chin);

      const barrelLen = 5.6 * ls;
      const barrelRad = 0.098;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 0.88, barrelRad, barrelLen, 20), darkSteelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0, barrelLen * 0.5);
      gunGroup.add(barrel);

      const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 1.5, barrelRad * 1.5, 0.4, 16), darkSteelMat);
      muzzleBrake.rotation.x = Math.PI / 2;
      muzzleBrake.position.set(0, 0, barrelLen);
      gunGroup.add(muzzleBrake);

      muzzlePoint.position.set(0, 0, barrelLen + 0.22);
      gunGroup.add(muzzlePoint);
    } else if (isT34) {
      // ============================================================
      // AUTHENTIC SOVIET T-34-85
      // Rounded cast dome / nut turret with smooth contours, 85mm ZiS-S-53 cannon
      // ============================================================
      const turretW = hullW * 0.64;
      const turretH = 0.74 * hs;
      const turretL = 3.0 * ls;

      turretGroup.position.set(0, 1.44 * hs, 0.12 * ls);
      hullGroup.add(turretGroup);

      // Rounded Cast "Nut-Shaped" Turret Dome
      const domeGeo = new THREE.SphereGeometry(turretW * 0.52, 22, 18);
      domeGeo.scale(1.0, 0.78, 1.25);
      const dome = new THREE.Mesh(domeGeo, makeHullMat('Cast T-34-85 Turret Dome', spec.armor.turretFront, 45));
      dome.position.set(0, turretH * 0.45, 0);
      registerArmorMesh(dome, 'Cast T-34-85 Turret Dome', spec.armor.turretFront, 45);
      turretGroup.add(dome);

      // Commander's Cupola Dome on Left
      const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.34 * hs, 16), darkSteelMat);
      cupola.position.set(-turretW * 0.28, turretH + 0.12 * hs, -0.15 * ls);
      turretGroup.add(cupola);

      // Ventilator Domes on Roof
      [0.22, -0.22].forEach((vx) => {
        const vent = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), darkSteelMat);
        vent.position.set(vx, turretH + 0.1 * hs, -0.32 * ls);
        turretGroup.add(vent);
      });

      // Gun Mantlet & 85mm ZiS-S-53 Cannon
      gunGroup.position.set(0, turretH * 0.44, turretW * 0.54);
      turretGroup.add(gunGroup);

      const mantlet = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), makeHullMat('Cast Gun Mantlet', 90, 40, true));
      mantlet.scale.set(1.2, 0.9, 1.1);
      registerArmorMesh(mantlet, 'Cast Gun Mantlet', 90, 40);
      gunGroup.add(mantlet);

      const barrelLen = 4.8 * ls;
      const barrelRad = 0.095;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 0.88, barrelRad, barrelLen, 20), darkSteelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0, barrelLen * 0.5);
      gunGroup.add(barrel);

      // Barrel reinforcement collar ring (no muzzle brake on T-34-85!)
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 1.35, barrelRad * 1.35, 0.32 * ls, 16), darkSteelMat);
      collar.rotateX(Math.PI / 2);
      collar.position.set(0, 0, 0.65 * ls);
      gunGroup.add(collar);

      muzzlePoint.position.set(0, 0, barrelLen + 0.18);
      gunGroup.add(muzzlePoint);
    } else if (isIS2) {
      // ============================================================
      // AUTHENTIC SOVIET IS-2 (1944)
      // Heavy bulbous cast rounded turret, rear ball MG blister, massive 122mm D-25T
      // ============================================================
      const turretW = hullW * 0.68;
      const turretH = 0.78 * hs;
      const turretL = 3.4 * ls;

      turretGroup.position.set(0, 1.48 * hs, 0.08 * ls);
      hullGroup.add(turretGroup);

      const bulbGeo = new THREE.SphereGeometry(turretW * 0.52, 22, 18);
      bulbGeo.scale(1.05, 0.82, 1.3);
      const bulb = new THREE.Mesh(bulbGeo, makeHullMat('IS-2 Cast Turret', spec.armor.turretFront, 45));
      bulb.position.set(0, turretH * 0.45, 0);
      registerArmorMesh(bulb, 'IS-2 Cast Turret', spec.armor.turretFront, 45);
      turretGroup.add(bulb);

      // Rear Ball Mount for Degtyaryov DT Machine Gun
      const rearBall = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), darkSteelMat);
      rearBall.position.set(0, turretH * 0.45, -turretL * 0.48);
      turretGroup.add(rearBall);

      // Giant 122mm D-25T Cannon with massive double-baffle muzzle brake
      gunGroup.position.set(0, turretH * 0.46, turretW * 0.56);
      turretGroup.add(gunGroup);

      const mantlet = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.95, 18), makeHullMat('IS-2 Mantlet', 100, 35, true));
      mantlet.rotateZ(Math.PI / 2);
      gunGroup.add(mantlet);

      const barrelLen = 5.8 * ls;
      const barrelRad = 0.135;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 0.88, barrelRad, barrelLen, 22), darkSteelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0, barrelLen * 0.5);
      gunGroup.add(barrel);

      const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 1.85, barrelRad * 1.85, 0.55, 18), darkSteelMat);
      muzzleBrake.rotation.x = Math.PI / 2;
      muzzleBrake.position.set(0, 0, barrelLen);
      gunGroup.add(muzzleBrake);

      muzzlePoint.position.set(0, 0, barrelLen + 0.28);
      gunGroup.add(muzzlePoint);
    } else if (isSherman) {
      // ============================================================
      // AUTHENTIC AMERICAN M4 SHERMAN (M4A1 / M4A3E8)
      // Cast oval turret, rotor shield, roof pintle .50 cal Browning M2HB
      // ============================================================
      const turretW = hullW * 0.62;
      const turretH = 0.8 * hs;
      const turretL = 2.9 * ls;

      turretGroup.position.set(0, 1.48 * hs, 0.06 * ls);
      hullGroup.add(turretGroup);

      const bodyGeo = new THREE.CylinderGeometry(turretW * 0.48, turretW * 0.52, turretH, 20);
      const body = new THREE.Mesh(bodyGeo, makeHullMat('Sherman Cast Turret', spec.armor.turretFront, 30));
      body.position.set(0, turretH * 0.5, 0);
      turretGroup.add(body);

      // Roof Pintle-Mounted .50 cal Browning M2HB Heavy Machine Gun
      const cal50Group = new THREE.Group();
      cal50Group.position.set(0.24 * ws, turretH + 0.22 * hs, -0.22 * ls);
      const m2Receiver = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.55), darkSteelMat);
      const m2Barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.65, 10), darkSteelMat);
      m2Barrel.rotateX(Math.PI / 2);
      m2Barrel.position.set(0, 0, 0.5);
      const ammoBox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.18), darkSteelMat);
      ammoBox.position.set(-0.14, 0, 0.05);
      cal50Group.add(m2Receiver, m2Barrel, ammoBox);
      turretGroup.add(cal50Group);

      // Gun Rotor Shield & Cannon
      gunGroup.position.set(0, turretH * 0.5, turretW * 0.5);
      turretGroup.add(gunGroup);

      const mantlet = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.52 * hs, 0.35 * ls), makeHullMat('M34A1 Rotor Shield', spec.armor.turretFront, 35));
      gunGroup.add(mantlet);

      const barrelLen = (spec.caliberMm >= 76 ? 4.8 : 4.0) * ls;
      const barrelRad = 0.092;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 0.88, barrelRad, barrelLen, 18), darkSteelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0, barrelLen * 0.5);
      gunGroup.add(barrel);

      muzzlePoint.position.set(0, 0, barrelLen + 0.2);
      gunGroup.add(muzzlePoint);
    } else if (isWW2) {
      // Historical fallback for other WW2 tanks
      const turretW = hullW * 0.66;
      const turretH = 0.82 * hs;
      const turretL = 3.2 * ls;

      turretGroup.position.set(0, 1.48 * hs, 0.1 * ls);
      hullGroup.add(turretGroup);

      const turretBaseGeo = new THREE.CylinderGeometry(turretW * 0.5, turretW * 0.54, turretH, 20);
      const turretBase = new THREE.Mesh(turretBaseGeo, makeHullMat('Turret Armor', spec.armor.turretFront, 15));
      turretBase.position.set(0, turretH * 0.5, 0);
      registerArmorMesh(turretBase, 'Turret Armor', spec.armor.turretFront, 15);
      turretGroup.add(turretBase);

      gunGroup.position.set(0, turretH * 0.5, turretW * 0.5);
      turretGroup.add(gunGroup);

      const mantlet = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.95, 18), makeHullMat('Cast Gun Mantlet', spec.armor.turretFront, 30, true));
      mantlet.rotateZ(Math.PI / 2);
      gunGroup.add(mantlet);

      const barrelLen = 4.6 * ls;
      const barrelRad = 0.098;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 0.88, barrelRad, barrelLen, 20), darkSteelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0, barrelLen * 0.5);
      gunGroup.add(barrel);

      muzzlePoint.position.set(0, 0, barrelLen + 0.2);
      gunGroup.add(muzzlePoint);
    } else {
      // MODERN MBT TURRET (Leopard 2 / Abrams / T-90M / Challenger)
      const turretW = hullW * 0.72;
      const turretH = 0.84 * hs;
      const turretL = 3.6 * ls;

      turretGroup.position.set(0, 1.5 * hs, 0.12 * ls);
      hullGroup.add(turretGroup);

      const turretBaseGeo = new THREE.CylinderGeometry(turretW * 0.52, turretW * 0.58, turretH, 24);
      const turretBase = new THREE.Mesh(turretBaseGeo, makeHullMat('Turret Front & Cheeks', spec.armor.turretFront, 65));
      turretBase.position.set(0, turretH * 0.5, 0);
      registerArmorMesh(turretBase, 'Turret Front & Cheeks', spec.armor.turretFront, 65);
      turretGroup.add(turretBase);

      // Sloped Wedge Cheeks (Arrowhead for Leopard 2 / Chisel for Abrams)
      const cheekGeo = new THREE.BoxGeometry(turretW * 0.46, turretH * 0.92, 1.45 * ls);
      const leftCheek = new THREE.Mesh(cheekGeo, makeHullMat('Left NERA Cheek', spec.armor.turretFront, 68));
      leftCheek.position.set(-turretW * 0.28, turretH * 0.5, turretL * 0.42);
      leftCheek.rotation.y = isLeopard ? 0.46 : 0.36;
      registerArmorMesh(leftCheek, 'Left NERA Cheek', spec.armor.turretFront, 68);

      const rightCheek = new THREE.Mesh(cheekGeo, makeHullMat('Right NERA Cheek', spec.armor.turretFront, 68));
      rightCheek.position.set(turretW * 0.28, turretH * 0.5, turretL * 0.42);
      rightCheek.rotation.y = isLeopard ? -0.46 : -0.36;
      registerArmorMesh(rightCheek, 'Right NERA Cheek', spec.armor.turretFront, 68);
      turretGroup.add(leftCheek, rightCheek);

      if (isAbrams) {
        // Deep Bustle Storage Baskets on Sides & Rear
        [-turretW * 0.48, turretW * 0.48].forEach((bx) => {
          const basket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36 * hs, 1.4 * ls), darkSteelMat);
          basket.position.set(bx, turretH * 0.5, -turretL * 0.28);
          turretGroup.add(basket);
        });

        // APU Box on Rear Right
        const apu = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32 * hs, 0.45 * ls), darkSteelMat);
        apu.position.set(turretW * 0.36, turretH * 0.5, -turretL * 0.48);
        turretGroup.add(apu);
      }

      if (spec.visual.hasERA || isRussianMBT) {
        for (let c = -1; c <= 1; c += 2) {
          for (let b = 0; b < 3; b++) {
            const eraBrick = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.48), darkSteelMat);
            eraBrick.position.set(c * (turretW * 0.38), turretH * 0.28 + b * 0.22, turretL * 0.34 + b * 0.16);
            eraBrick.rotation.y = c * 0.36;
            turretGroup.add(eraBrick);
          }
        }
      }

      // CITV & Commander Panoramic Sight
      const citv = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.48, 16), darkSteelMat);
      citv.position.set(-0.58, turretH + 0.26, -0.38);
      turretGroup.add(citv);

      const gpsHouse = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.42), darkSteelMat);
      gpsHouse.position.set(0.62, turretH + 0.14, 0.32);
      turretGroup.add(gpsHouse);

      // Modern Gun Mantlet & Smoothbore Cannon with Bore Evacuator
      gunGroup.position.set(0, turretH * 0.52, turretW * 0.52);
      turretGroup.add(gunGroup);

      const mantlet = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.88, 16), makeHullMat('Gun Mantlet', spec.armor.turretFront, 45, true));
      mantlet.rotateZ(Math.PI / 2);
      registerArmorMesh(mantlet, 'Gun Mantlet', spec.armor.turretFront, 45);
      gunGroup.add(mantlet);

      const barrelLen = 5.2 * ls;
      const barrelRad = 0.115;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 0.88, barrelRad, barrelLen, 20), darkSteelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0, barrelLen * 0.5);
      gunGroup.add(barrel);

      const evac = new THREE.Mesh(new THREE.CylinderGeometry(barrelRad * 1.55, barrelRad * 1.55, 0.9, 20), darkSteelMat);
      evac.rotation.x = Math.PI / 2;
      evac.position.set(0, 0, barrelLen * 0.52);
      gunGroup.add(evac);

      muzzlePoint.position.set(0, 0, barrelLen + 0.2);
      gunGroup.add(muzzlePoint);
    }
  }

  // Internal X-Ray Modules
  internalGroup.visible = isXray;
  hullGroup.add(internalGroup);

  const engineMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.6 });
  const engineMesh = new THREE.Mesh(
    new THREE.BoxGeometry(
      isMaus ? 1.75 : isR3 ? 0.95 : 1.35,
      isMaus ? 0.95 : isR3 ? 0.55 : 0.75,
      isMaus ? 2.2 : isR3 ? 1.1 : 1.6
    ),
    engineMat
  );
  // Real Maus had engine located in the CENTER of the hull!
  engineMesh.position.set(0, (isMaus ? 0.95 : 0.86) * hs, (isMaus ? 0.15 : isR3 ? -1.2 : -1.85) * ls);
  armorMeshes.push(engineMesh);
  internalGroup.add(engineMesh);

  // Maus Electric Drive Motors in Rear Hull
  if (isMaus) {
    const motorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.75 * hs, 1.25 * ls), engineMat);
    motorMesh.position.set(0, 0.8 * hs, -2.1 * ls);
    armorMeshes.push(motorMesh);
    internalGroup.add(motorMesh);
  }

  const ammoMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.6 });
  const ammoRackMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      isMaus ? 0.92 : isR3 ? 0.45 : 0.72,
      isMaus ? 0.92 : isR3 ? 0.45 : 0.72,
      isMaus ? 0.55 : isR3 ? 0.32 : 0.42,
      16
    ),
    ammoMat
  );
  ammoRackMesh.position.set(0, 0.55 * hs, (isMaus ? -0.92 : isR3 ? 0.1 : 0.2) * ls);
  armorMeshes.push(ammoRackMesh);
  internalGroup.add(ammoRackMesh);

  const crewMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0284c7, emissiveIntensity: 0.5 });
  const driverMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(isR3 ? 0.18 : 0.24, isR3 ? 0.45 : 0.65, 8, 12),
    crewMat
  );
  driverMesh.position.set(isMaus ? -0.32 : isR3 ? -0.28 : 0, 0.95 * hs, (isMaus ? 1.85 : isR3 ? 0.95 : 1.8) * ls);

  const gunnerMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(isR3 ? 0.18 : 0.24, isR3 ? 0.45 : 0.65, 8, 12),
    crewMat
  );
  gunnerMesh.position.set(isMaus ? 0.52 : isR3 ? 0.28 : 0.55, 1.25 * hs, (isMaus ? -0.92 : isR3 ? 0.0 : 0.1) * ls);

  const commanderMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(isR3 ? 0.18 : 0.24, isR3 ? 0.45 : 0.65, 8, 12),
    crewMat
  );
  commanderMesh.position.set(isMaus ? -0.52 : isR3 ? -0.28 : -0.55, 1.25 * hs, (isMaus ? -1.15 : isR3 ? -0.3 : -0.2) * ls);
  internalGroup.add(driverMesh, gunnerMesh, commanderMesh);

  return {
    root,
    hullGroup,
    turretGroup,
    gunGroup,
    muzzlePoint,
    exhaustPoint,
    radarMesh,
    rotorGroup,
    coaxialRotorGroup,
    afterburnerMesh,
    internalGroup,
    armorMeshes,
    wheelMeshes,
    trackMaterials,
  };
}
