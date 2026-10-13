import * as THREE from 'three';
import { NationId } from '../data/vehicles';

export interface BuiltHangarEnvironment {
  group: THREE.Group;
  spotlights: THREE.SpotLight[];
  pointLights: THREE.PointLight[];
  dustParticles?: THREE.Points;
}

/**
 * Creates an authentic, cinematic underground military bunker / depot hangar
 * matching the realistic subterranean vault reference:
 * - Reinforced concrete arched vault tunnel with massive structural ribs and expansion panels
 * - Receding dark cavernous tunnel with heavy blast portal and distance warning beacons
 * - Heavy concrete depot floor with oil stains, wet puddle specularity, and expansion seams
 * - Steel railway tracks with wooden ties embedded in the concrete running through the depot center
 * - Recessed central maintenance inspection pit with diamond safety grates & hazard stripes
 * - Elevated industrial steel catwalk / mezzanine on the left with safety railings, stairs & columns
 * - Overhead traveling yellow gantry bridge crane with wire rope hoist, pulley block & heavy hook
 * - Twin adjustable yellow halogen work floodlights on tripods casting focused beams
 * - Heavy workshop tool chests, heavy timber workbench with vise & blueprints, welding cylinder cart
 * - Stacks of wooden artillery shell / ammo crates, pallets of 55-gallon oil drums, spare track links & roadwheels
 * - High-detail maintenance crew members (engineer with clipboard, technician with wrench)
 * - Atmospheric floating dust motes dancing in the spotlight cones
 * - National unit banner on the bunker wall matching the selected nation
 */
export function buildAuthenticHangarBase(
  scene: THREE.Scene,
  selectedNation: NationId
): BuiltHangarEnvironment {
  const baseGroup = new THREE.Group();
  scene.add(baseGroup);

  const spotlights: THREE.SpotLight[] = [];
  const pointLights: THREE.PointLight[] = [];

  // =========================================================================
  // 1. PROCEDURAL TEXTURES (Concrete, Hazard Stripes, Steel Plate, Wood)
  // =========================================================================

  // A. Concrete Floor Texture with Expansion Joints, Oil Stains & Grime
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 1024;
  floorCanvas.height = 1024;
  const fctx = floorCanvas.getContext('2d')!;

  // Base raw aged concrete
  fctx.fillStyle = '#22252a';
  fctx.fillRect(0, 0, 1024, 1024);

  // Concrete noise & aggregate speckling
  const fImg = fctx.getImageData(0, 0, 1024, 1024);
  const fPix = fImg.data;
  for (let i = 0; i < fPix.length; i += 4) {
    const n = (Math.random() - 0.5) * 24;
    fPix[i] = Math.min(255, Math.max(0, fPix[i] + n));
    fPix[i + 1] = Math.min(255, Math.max(0, fPix[i + 1] + n));
    fPix[i + 2] = Math.min(255, Math.max(0, fPix[i + 2] + n));
  }
  fctx.putImageData(fImg, 0, 0);

  // Expansion joint grid (large industrial concrete slabs)
  fctx.strokeStyle = '#121418';
  fctx.lineWidth = 4;
  for (let x = 0; x <= 1024; x += 128) {
    fctx.beginPath();
    fctx.moveTo(x, 0);
    fctx.lineTo(x, 1024);
    fctx.stroke();
  }
  for (let y = 0; y <= 1024; y += 128) {
    fctx.beginPath();
    fctx.moveTo(0, y);
    fctx.lineTo(1024, y);
    fctx.stroke();
  }

  // Dark industrial oil drip pools & greasy tire/track scuffs
  fctx.fillStyle = 'rgba(10, 12, 14, 0.72)';
  for (let s = 0; s < 18; s++) {
    fctx.beginPath();
    const ox = 300 + Math.random() * 424;
    const oy = 200 + Math.random() * 624;
    fctx.ellipse(ox, oy, 30 + Math.random() * 65, 18 + Math.random() * 40, Math.random() * Math.PI, 0, Math.PI * 2);
    fctx.fill();
  }

  // Yellow maintenance zone boundary markings
  fctx.strokeStyle = 'rgba(217, 140, 20, 0.65)';
  fctx.lineWidth = 6;
  fctx.strokeRect(260, 100, 504, 824);

  const floorTexture = new THREE.CanvasTexture(floorCanvas);
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(4, 8);

  const concreteFloorMat = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.68,
    metalness: 0.12,
  });

  // B. Arched Vault Concrete Texture (Formwork Panels & Damp Stains)
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 512;
  wallCanvas.height = 512;
  const wctx = wallCanvas.getContext('2d')!;
  wctx.fillStyle = '#26292f';
  wctx.fillRect(0, 0, 512, 512);

  // Formwork board lines
  wctx.strokeStyle = '#181b20';
  wctx.lineWidth = 3;
  for (let y = 0; y <= 512; y += 48) {
    wctx.beginPath();
    wctx.moveTo(0, y);
    wctx.lineTo(512, y);
    wctx.stroke();
  }
  // Vertical tie-rod holes
  wctx.fillStyle = '#111317';
  for (let y = 24; y < 512; y += 48) {
    for (let x = 32; x < 512; x += 64) {
      wctx.beginPath();
      wctx.arc(x, y, 3, 0, Math.PI * 2);
      wctx.fill();
    }
  }
  // Subtle water seepage runs
  wctx.fillStyle = 'rgba(15, 18, 22, 0.45)';
  for (let r = 0; r < 8; r++) {
    const rx = Math.random() * 512;
    wctx.fillRect(rx, 0, 8 + Math.random() * 12, 180 + Math.random() * 200);
  }

  const wallTexture = new THREE.CanvasTexture(wallCanvas);
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(6, 4);

  const vaultWallMat = new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 0.88,
    metalness: 0.08,
  });

  // C. Yellow/Black Diagonal Hazard Striping Texture
  const hazardCanvas = document.createElement('canvas');
  hazardCanvas.width = 256;
  hazardCanvas.height = 64;
  const hzctx = hazardCanvas.getContext('2d')!;
  hzctx.fillStyle = '#d97706'; // industrial amber
  hzctx.fillRect(0, 0, 256, 64);
  hzctx.fillStyle = '#18181b'; // dark slate black
  for (let i = -64; i < 320; i += 32) {
    hzctx.beginPath();
    hzctx.moveTo(i, 0);
    hzctx.lineTo(i + 24, 0);
    hzctx.lineTo(i - 8, 64);
    hzctx.lineTo(i - 32, 64);
    hzctx.closePath();
    hzctx.fill();
  }
  const hazardTexture = new THREE.CanvasTexture(hazardCanvas);
  hazardTexture.wrapS = THREE.RepeatWrapping;
  hazardTexture.wrapT = THREE.RepeatWrapping;
  hazardTexture.repeat.set(4, 1);
  const hazardMat = new THREE.MeshStandardMaterial({
    map: hazardTexture,
    roughness: 0.4,
    metalness: 0.2,
  });

  // Common Reusable Materials
  const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x272c35, roughness: 0.45, metalness: 0.82 });
  const polishedRailMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.22, metalness: 0.92 });
  const woodTieMat = new THREE.MeshStandardMaterial({ color: 0x33281c, roughness: 0.92, metalness: 0.05 });
  const yellowEquipmentMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.4 });
  const redCabinetMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4, metalness: 0.5 });
  const crateWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c482f, roughness: 0.86, metalness: 0.04 });
  const brassLampMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.35, metalness: 0.75 });
  const bulbGlowMat = new THREE.MeshBasicMaterial({ color: 0xfff1cf });

  // =========================================================================
  // 2. DEPOT FLOOR & RAILROAD TRACKS (Center Stage)
  // =========================================================================

  // A. Main Concrete Depot Floor (Spanning 42m wide x 110m deep)
  const floorGeo = new THREE.PlaneGeometry(44, 110, 8, 16);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMesh = new THREE.Mesh(floorGeo, concreteFloorMat);
  floorMesh.position.set(0, 0, -15);
  floorMesh.receiveShadow = true;
  baseGroup.add(floorMesh);

  // B. Recessed Central Maintenance Inspection Pit (Between rails from Z = -22 to Z = +14)
  const pitLength = 36;
  const pitWidth = 1.6;
  const pitDepth = 1.1;

  // Pit trench interior box
  const pitBoxGeo = new THREE.BoxGeometry(pitWidth, pitDepth, pitLength);
  const pitInteriorMat = new THREE.MeshStandardMaterial({ color: 0x14161b, roughness: 0.9 });
  const pitBox = new THREE.Mesh(pitBoxGeo, pitInteriorMat);
  pitBox.position.set(0, -pitDepth / 2, -4);
  pitBox.receiveShadow = true;
  baseGroup.add(pitBox);

  // Pit safety edging curb with hazard stripes on left and right
  const pitCurbGeo = new THREE.BoxGeometry(0.18, 0.06, pitLength);
  const leftCurb = new THREE.Mesh(pitCurbGeo, hazardMat);
  leftCurb.position.set(-pitWidth / 2 - 0.09, 0.03, -4);
  const rightCurb = new THREE.Mesh(pitCurbGeo, hazardMat);
  rightCurb.position.set(pitWidth / 2 + 0.09, 0.03, -4);
  baseGroup.add(leftCurb, rightCurb);

  // Pit steel walk gratings (open inspection sections with metal grates)
  const grateGeo = new THREE.BoxGeometry(pitWidth - 0.06, 0.04, 0.85);
  for (let z = -20; z <= 12; z += 3.2) {
    const grate = new THREE.Mesh(grateGeo, darkSteelMat);
    grate.position.set(0, 0.01, z);
    grate.castShadow = true;
    baseGroup.add(grate);
  }

  // C. Steel Railroad Tracks (Dual rails at X = -1.15 and X = +1.15)
  const trackLength = 100;
  const railGeo = new THREE.BoxGeometry(0.12, 0.18, trackLength);

  // Polished rail heads
  const leftRail = new THREE.Mesh(railGeo, polishedRailMat);
  leftRail.position.set(-1.18, 0.1, -15);
  leftRail.castShadow = true;
  leftRail.receiveShadow = true;

  const rightRail = new THREE.Mesh(railGeo, polishedRailMat);
  rightRail.position.set(1.18, 0.1, -15);
  rightRail.castShadow = true;
  rightRail.receiveShadow = true;
  baseGroup.add(leftRail, rightRail);

  // Wooden Railroad Ties (Sleepers) embedded in concrete
  const tieGeo = new THREE.BoxGeometry(2.9, 0.12, 0.28);
  for (let z = -62; z <= 34; z += 0.85) {
    // Leave the open pit area un-tied, ties appear before and after pit
    if (z >= -22 && z <= 14 && Math.abs(z % 3.4) < 1.2) continue;
    const tie = new THREE.Mesh(tieGeo, woodTieMat);
    tie.position.set(0, 0.03, z);
    tie.receiveShadow = true;
    baseGroup.add(tie);

    // Steel tie tie-plates under the rails
    const plateGeo = new THREE.BoxGeometry(0.24, 0.03, 0.26);
    const lp = new THREE.Mesh(plateGeo, darkSteelMat);
    lp.position.set(-1.18, 0.08, z);
    const rp = new THREE.Mesh(plateGeo, darkSteelMat);
    rp.position.set(1.18, 0.08, z);
    baseGroup.add(lp, rp);
  }

  // =========================================================================
  // 3. REINFORCED CONCRETE VAULT ARCHES & RECEDING TUNNEL
  // =========================================================================

  // A. Arched Ceiling Vault Shell (Cylinder slice from Y=0 to Y=13, radius 14m)
  const vaultRadius = 14.5;
  const vaultLength = 105;
  const vaultGeo = new THREE.CylinderGeometry(
    vaultRadius,
    vaultRadius,
    vaultLength,
    32,
    1,
    true,
    0,
    Math.PI
  );
  // Rotate cylinder to lie horizontally along Z-axis
  vaultGeo.rotateZ(Math.PI / 2);
  vaultGeo.rotateY(Math.PI / 2);

  const vaultMesh = new THREE.Mesh(vaultGeo, vaultWallMat);
  vaultMesh.position.set(0, 0, -15);
  vaultMesh.receiveShadow = true;
  baseGroup.add(vaultMesh);

  // B. Massive Reinforced Concrete Arch Ribs (Repeating structural arches along Z)
  const archZPositions = [28, 20, 12, 4, -4, -12, -20, -28, -36, -44, -52, -60];
  const archShape = new THREE.Shape();
  const innerR = 14.2;
  const outerR = 15.6;
  const ribWidth = 1.1;

  // Extrude 2D arch profile
  const ribCurveSegments = 24;
  archShape.absarc(0, 0, outerR, 0, Math.PI, false);
  archShape.lineTo(-innerR, 0);
  archShape.absarc(0, 0, innerR, Math.PI, 0, true);
  archShape.closePath();

  const ribExtrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: ribWidth,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 2,
    curveSegments: ribCurveSegments,
  };
  const ribGeo = new THREE.ExtrudeGeometry(archShape, ribExtrudeSettings);

  const ribMat = new THREE.MeshStandardMaterial({
    color: 0x303640,
    roughness: 0.85,
    metalness: 0.1,
  });

  archZPositions.forEach((zPos) => {
    const rib = new THREE.Mesh(ribGeo, ribMat);
    rib.position.set(0, 0, zPos);
    rib.castShadow = true;
    rib.receiveShadow = true;
    baseGroup.add(rib);

    // Structural steel tie gusset brackets at the springline (where arch meets floor)
    const gussetGeo = new THREE.BoxGeometry(0.8, 1.4, ribWidth + 0.2);
    const leftGusset = new THREE.Mesh(gussetGeo, darkSteelMat);
    leftGusset.position.set(-innerR + 0.3, 0.7, zPos + ribWidth / 2);
    const rightGusset = new THREE.Mesh(gussetGeo, darkSteelMat);
    rightGusset.position.set(innerR - 0.3, 0.7, zPos + ribWidth / 2);
    baseGroup.add(leftGusset, rightGusset);
  });

  // C. Deep Cavern Tunnel Blast Portal & Rear Bulkhead Wall (At Z = -66)
  const portalGroup = new THREE.Group();
  portalGroup.position.set(0, 0, -66);

  // Massive back bulkhead wall with large archway opening
  const backWallGeo = new THREE.BoxGeometry(32, 16, 2.5);
  const backWall = new THREE.Mesh(backWallGeo, ribMat);
  backWall.position.set(0, 8, 0);
  backWall.receiveShadow = true;
  portalGroup.add(backWall);

  // Receding deep tunnel interior (fading into the dark distance)
  const tunnelTunnelGeo = new THREE.CylinderGeometry(8.5, 8.5, 45, 16, 1, true, 0, Math.PI);
  tunnelTunnelGeo.rotateZ(Math.PI / 2);
  tunnelTunnelGeo.rotateY(Math.PI / 2);
  const deepTunnelMat = new THREE.MeshStandardMaterial({ color: 0x07090c, roughness: 0.95 });
  const deepTunnel = new THREE.Mesh(tunnelTunnelGeo, deepTunnelMat);
  deepTunnel.position.set(0, 0, -22);
  portalGroup.add(deepTunnel);

  // Heavy steel blast doors (half-open, heavy sliding hydraulic mechanism)
  const blastDoorGeo = new THREE.BoxGeometry(4.2, 8.0, 0.5);
  const blastDoorLeft = new THREE.Mesh(blastDoorGeo, darkSteelMat);
  blastDoorLeft.position.set(-5.6, 4.0, -0.6);
  const blastDoorRight = new THREE.Mesh(blastDoorGeo, darkSteelMat);
  blastDoorRight.position.set(5.6, 4.0, -0.6);
  portalGroup.add(blastDoorLeft, blastDoorRight);

  // Hazard warning chevrons over the portal arch
  const portalHeaderGeo = new THREE.BoxGeometry(9.0, 0.6, 0.2);
  const portalHeader = new THREE.Mesh(portalHeaderGeo, hazardMat);
  portalHeader.position.set(0, 8.4, 0.8);
  portalGroup.add(portalHeader);

  // Red & Amber tunnel safety warning beacon lamps
  const beaconGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.35, 12);
  const beaconRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const beaconAmberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const b1 = new THREE.Mesh(beaconGeo, beaconRedMat);
  b1.position.set(-4.5, 8.8, 1.2);
  const b2 = new THREE.Mesh(beaconGeo, beaconAmberMat);
  b2.position.set(4.5, 8.8, 1.2);
  portalGroup.add(b1, b2);

  baseGroup.add(portalGroup);

  // =========================================================================
  // 4. ELEVATED INDUSTRIAL STEEL CATWALK & STAIRCASE (Left Side, like image)
  // =========================================================================
  const catwalkGroup = new THREE.Group();
  catwalkGroup.position.set(-9.2, 0, -8);

  const catHeight = 3.6;
  const catLength = 38;
  const catWidth = 2.2;

  // Catwalk floor grating
  const catFloorGeo = new THREE.BoxGeometry(catWidth, 0.14, catLength);
  const catFloor = new THREE.Mesh(catFloorGeo, darkSteelMat);
  catFloor.position.set(0, catHeight, 0);
  catFloor.receiveShadow = true;
  catFloor.castShadow = true;
  catwalkGroup.add(catFloor);

  // Yellow kickplate / toe board along inner catwalk edge
  const kickGeo = new THREE.BoxGeometry(0.08, 0.22, catLength);
  const kickPlate = new THREE.Mesh(kickGeo, hazardMat);
  kickPlate.position.set(catWidth / 2 - 0.04, catHeight + 0.11, 0);
  catwalkGroup.add(kickPlate);

  // Supporting vertical steel I-beam columns anchored to the floor
  const columnGeo = new THREE.BoxGeometry(0.25, catHeight, 0.25);
  for (let cz = -catLength / 2 + 2; cz <= catLength / 2 - 2; cz += 5.5) {
    const colInner = new THREE.Mesh(columnGeo, darkSteelMat);
    colInner.position.set(catWidth / 2 - 0.15, catHeight / 2, cz);
    colInner.castShadow = true;

    const colOuter = new THREE.Mesh(columnGeo, darkSteelMat);
    colOuter.position.set(-catWidth / 2 + 0.15, catHeight / 2, cz);
    colOuter.castShadow = true;

    // Concrete footer footing pad
    const padGeo = new THREE.BoxGeometry(0.6, 0.2, 0.6);
    const pad1 = new THREE.Mesh(padGeo, ribMat);
    pad1.position.set(catWidth / 2 - 0.15, 0.1, cz);
    const pad2 = new THREE.Mesh(padGeo, ribMat);
    pad2.position.set(-catWidth / 2 + 0.15, 0.1, cz);

    catwalkGroup.add(colInner, colOuter, pad1, pad2);
  }

  // Safety handrails along the catwalk edge (top rail, mid rail, vertical stanchions)
  const railGeoTop = new THREE.BoxGeometry(0.06, 0.06, catLength);
  const topRail = new THREE.Mesh(railGeoTop, darkSteelMat);
  topRail.position.set(catWidth / 2 - 0.06, catHeight + 1.1, 0);

  const midRail = new THREE.Mesh(railGeoTop, darkSteelMat);
  midRail.position.set(catWidth / 2 - 0.06, catHeight + 0.6, 0);
  catwalkGroup.add(topRail, midRail);

  // Vertical handrail stanchions
  const stanchionGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8);
  for (let rz = -catLength / 2 + 0.5; rz <= catLength / 2 - 0.5; rz += 2.2) {
    const st = new THREE.Mesh(stanchionGeo, darkSteelMat);
    st.position.set(catWidth / 2 - 0.06, catHeight + 0.55, rz);
    catwalkGroup.add(st);
  }

  // Industrial steel staircase leading down from catwalk to floor (at Z = 6 to Z = 12)
  const numSteps = 14;
  const stairWidth = 1.4;
  const stepRise = catHeight / numSteps;
  const stepRun = 0.38;

  for (let s = 0; s < numSteps; s++) {
    const stepGeo = new THREE.BoxGeometry(stairWidth, 0.06, stepRun);
    const step = new THREE.Mesh(stepGeo, darkSteelMat);
    step.position.set(catWidth / 2 - stairWidth / 2, (s + 0.5) * stepRise, 10 - s * stepRun);
    step.castShadow = true;
    catwalkGroup.add(step);
  }

  // Stair handrails angled down
  const stringerLength = Math.hypot(catHeight, numSteps * stepRun);
  const stringerGeo = new THREE.BoxGeometry(0.08, 0.22, stringerLength);
  const stringerAngle = Math.atan2(catHeight, numSteps * stepRun);

  const leftStringer = new THREE.Mesh(stringerGeo, darkSteelMat);
  leftStringer.position.set(catWidth / 2 - 0.04, catHeight / 2 + 0.4, 10 - (numSteps * stepRun) / 2);
  leftStringer.rotation.x = stringerAngle;
  catwalkGroup.add(leftStringer);

  baseGroup.add(catwalkGroup);

  // =========================================================================
  // 5. OVERHEAD TRAVELING BRIDGE CRANE & HOIST (Yellow industrial girder)
  // =========================================================================
  const craneGroup = new THREE.Group();
  craneGroup.position.set(0, 9.8, -6);

  // Dual yellow crane box girders spanning the vault width
  const craneSpan = 22.5;
  const girderGeo = new THREE.BoxGeometry(craneSpan, 0.85, 0.45);

  const girder1 = new THREE.Mesh(girderGeo, yellowEquipmentMat);
  girder1.position.set(0, 0, -0.6);
  girder1.castShadow = true;

  const girder2 = new THREE.Mesh(girderGeo, yellowEquipmentMat);
  girder2.position.set(0, 0, 0.6);
  girder2.castShadow = true;

  // Hazard diagonal stripe bands on girder ends
  const craneHazardGeo = new THREE.BoxGeometry(2.5, 0.86, 0.47);
  const ch1 = new THREE.Mesh(craneHazardGeo, hazardMat);
  ch1.position.set(-craneSpan / 2 + 1.25, 0, -0.6);
  const ch2 = new THREE.Mesh(craneHazardGeo, hazardMat);
  ch2.position.set(craneSpan / 2 - 1.25, 0, -0.6);
  craneGroup.add(girder1, girder2, ch1, ch2);

  // Traveling Trolley Unit (Carriage on top of crane beams)
  const trolleyGeo = new THREE.BoxGeometry(1.8, 0.6, 2.0);
  const trolley = new THREE.Mesh(trolleyGeo, darkSteelMat);
  trolley.position.set(2.2, 0.55, 0);
  craneGroup.add(trolley);

  // Wire rope drum & electric hoist motor
  const drumGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 12);
  drumGeo.rotateZ(Math.PI / 2);
  const drum = new THREE.Mesh(drumGeo, darkSteelMat);
  drum.position.set(2.2, 0.95, 0);
  craneGroup.add(drum);

  // Suspended steel hoist cables
  const cableGeo = new THREE.CylinderGeometry(0.015, 0.015, 5.2, 8);
  const cable1 = new THREE.Mesh(cableGeo, darkSteelMat);
  cable1.position.set(2.0, -2.1, 0);
  const cable2 = new THREE.Mesh(cableGeo, darkSteelMat);
  cable2.position.set(2.4, -2.1, 0);
  craneGroup.add(cable1, cable2);

  // Lower Pulley Sheave Block & Heavy Forged Lifting Hook
  const blockGeo = new THREE.BoxGeometry(0.65, 0.8, 0.45);
  const block = new THREE.Mesh(blockGeo, yellowEquipmentMat);
  block.position.set(2.2, -4.8, 0);
  block.castShadow = true;

  // Hook torus geometry
  const hookGeo = new THREE.TorusGeometry(0.32, 0.09, 8, 16, Math.PI * 1.4);
  hookGeo.rotateZ(Math.PI / 2);
  const hook = new THREE.Mesh(hookGeo, darkSteelMat);
  hook.position.set(2.2, -5.4, 0);
  hook.castShadow = true;
  craneGroup.add(block, hook);

  baseGroup.add(craneGroup);

  // =========================================================================
  // 6. DUAL INDUSTRIAL TRIPOD HALOGEN WORK FLOODLIGHTS
  // =========================================================================

  function createTripodFloodlight(
    posX: number,
    posZ: number,
    rotY: number,
    targetPoint: THREE.Vector3
  ) {
    const tripodGroup = new THREE.Group();
    tripodGroup.position.set(posX, 0, posZ);
    tripodGroup.rotation.y = rotY;

    // 3 flared tripod legs
    const legGeo = new THREE.CylinderGeometry(0.03, 0.035, 2.1, 8);
    const legAngle = 0.35;
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(legGeo, yellowEquipmentMat);
      leg.position.set(Math.sin(angle) * 0.45, 0.95, Math.cos(angle) * 0.45);
      leg.rotation.z = Math.cos(angle) * legAngle;
      leg.rotation.x = -Math.sin(angle) * legAngle;
      leg.castShadow = true;
      tripodGroup.add(leg);
    }

    // Central mast pole
    const mastGeo = new THREE.CylinderGeometry(0.04, 0.045, 2.6, 8);
    const mast = new THREE.Mesh(mastGeo, darkSteelMat);
    mast.position.y = 1.3;
    tripodGroup.add(mast);

    // Crossbar T-piece
    const crossGeo = new THREE.BoxGeometry(0.85, 0.06, 0.06);
    const crossbar = new THREE.Mesh(crossGeo, yellowEquipmentMat);
    crossbar.position.y = 2.55;
    tripodGroup.add(crossbar);

    // Twin rectangular floodlight heads with wire guards & glowing lenses
    const headGeo = new THREE.BoxGeometry(0.32, 0.22, 0.22);
    const lensGeo = new THREE.PlaneGeometry(0.28, 0.18);
    lensGeo.rotateY(Math.PI / 2);

    [-0.26, 0.26].forEach((hx) => {
      const head = new THREE.Mesh(headGeo, yellowEquipmentMat);
      head.position.set(hx, 2.68, 0);
      head.rotation.x = 0.25; // angled down toward tank
      head.castShadow = true;

      const lens = new THREE.Mesh(lensGeo, bulbGlowMat);
      lens.position.set(hx, 2.68, 0.12);
      lens.rotation.x = 0.25;

      tripodGroup.add(head, lens);
    });

    // Trailing power cable on floor
    const cableFloorGeo = new THREE.CylinderGeometry(0.02, 0.02, 4.0, 6);
    cableFloorGeo.rotateZ(Math.PI / 2);
    cableFloorGeo.rotateY(0.4);
    const cMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.9 });
    const cable = new THREE.Mesh(cableFloorGeo, cMat);
    cable.position.set(1.2, 0.02, 1.2);
    tripodGroup.add(cable);

    baseGroup.add(tripodGroup);

    // Three.js High-Intensity Focused SpotLight originating from the floodlight (Bright & Clean)
    const spot = new THREE.SpotLight(0xfff8e8, 7.8);
    spot.position.set(posX, 2.7, posZ);
    spot.angle = 0.82;
    spot.penumbra = 0.5;
    spot.decay = 1.2;
    spot.distance = 55;
    spot.castShadow = true;
    spot.shadow.mapSize.width = 1024;
    spot.shadow.mapSize.height = 1024;
    spot.shadow.bias = -0.0006;
    spot.target.position.copy(targetPoint);
    scene.add(spot.target);
    scene.add(spot);
    spotlights.push(spot);
  }

  // Right-front work floodlight (casting crisp highlights on front-right glacis & turret)
  createTripodFloodlight(6.8, 6.5, -0.6, new THREE.Vector3(0, 1.2, 0));

  // Left-front work floodlight (casting beam on left tracks & side armor)
  createTripodFloodlight(-6.5, 5.2, 0.5, new THREE.Vector3(-0.5, 1.1, 0));

  // =========================================================================
  // 7. SUSPENDED OVERHEAD INDUSTRIAL DOME LAMPS
  // =========================================================================
  const lampZPositions = [16, 4, -8, -20, -32, -44];
  lampZPositions.forEach((lz, idx) => {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(0, 10.2, lz);

    // Hanging conduit pipe / chain
    const dropGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8);
    const drop = new THREE.Mesh(dropGeo, darkSteelMat);
    drop.position.y = -1.1;
    lampGroup.add(drop);

    // Green / black enamel industrial reflector shade
    const shadeGeo = new THREE.ConeGeometry(0.65, 0.4, 16, 1, true);
    shadeGeo.rotateX(Math.PI);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x1f2923, // deep British racing / industrial enamel green
      roughness: 0.35,
      metalness: 0.6,
      side: THREE.DoubleSide,
    });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.y = -2.2;
    shade.castShadow = true;
    lampGroup.add(shade);

    // Brass shade mounting cap
    const capGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.15, 12);
    const cap = new THREE.Mesh(capGeo, brassLampMat);
    cap.position.y = -2.0;
    lampGroup.add(cap);

    // Glowing incandescent / mercury bulb
    const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), bulbGlowMat);
    bulbMesh.position.y = -2.25;
    lampGroup.add(bulbMesh);

    baseGroup.add(lampGroup);

    // Add bright, warm-white Three.js PointLight under every lamp
    const pt = new THREE.PointLight(0xfff5e6, 3.8, 30, 1.4);
    pt.position.set(0, 7.8, lz);
    // Enable shadows on the two central lights directly above tank
    if (idx === 1 || idx === 2) {
      pt.castShadow = true;
      pt.shadow.mapSize.width = 1024;
      pt.shadow.mapSize.height = 1024;
      pt.shadow.bias = -0.001;
    }
    scene.add(pt);
    pointLights.push(pt);
  });

  // Central Top-Down Studio Directional Key Light (Ensures turret, mantlet, engine deck & glacis are fully lit)
  const highBayLight = new THREE.DirectionalLight(0xfffbf0, 2.4);
  highBayLight.position.set(3, 14, 5);
  highBayLight.target.position.set(0, 1.0, 0);
  scene.add(highBayLight.target);
  scene.add(highBayLight);

  // =========================================================================
  // 8. HIGH-DETAIL MAINTENANCE PROPS & WORKSHOP DRESSING
  // =========================================================================

  // A. Heavy Rolling Red Tool Cabinet (Snap-On style, near tank at X = 4.8, Z = -2.5)
  const toolChestGroup = new THREE.Group();
  toolChestGroup.position.set(4.8, 0, -2.5);
  toolChestGroup.rotation.y = -0.4;

  const chestBodyGeo = new THREE.BoxGeometry(1.4, 1.15, 0.7);
  const chestBody = new THREE.Mesh(chestBodyGeo, redCabinetMat);
  chestBody.position.y = 0.72;
  chestBody.castShadow = true;
  toolChestGroup.add(chestBody);

  // Black rubber top mat & drawer trim
  const topMatGeo = new THREE.BoxGeometry(1.42, 0.04, 0.72);
  const topMat = new THREE.Mesh(topMatGeo, darkSteelMat);
  topMat.position.y = 1.32;
  toolChestGroup.add(topMat);

  // Chrome drawer pull handles
  const handleGeo = new THREE.BoxGeometry(0.9, 0.03, 0.04);
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 });
  for (let dy = 0.35; dy < 1.25; dy += 0.22) {
    const handle = new THREE.Mesh(handleGeo, chromeMat);
    handle.position.set(0, dy, 0.37);
    toolChestGroup.add(handle);
  }

  // Caster wheels
  const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8);
  wheelGeo.rotateZ(Math.PI / 2);
  [-0.55, 0.55].forEach((cx) => {
    [-0.25, 0.25].forEach((cz) => {
      const cw = new THREE.Mesh(wheelGeo, darkSteelMat);
      cw.position.set(cx, 0.08, cz);
      toolChestGroup.add(cw);
    });
  });

  // Tools on top: oil squirt can & heavy spanner wrench
  const oilCanGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.2, 8);
  const oilCan = new THREE.Mesh(oilCanGeo, brassLampMat);
  oilCan.position.set(0.35, 1.44, 0.1);
  toolChestGroup.add(oilCan);

  baseGroup.add(toolChestGroup);

  // B. Heavy Timber Workshop Workbench with Steel Vise & Blueprints (Under catwalk at X = -7.5, Z = -4)
  const benchGroup = new THREE.Group();
  benchGroup.position.set(-7.5, 0, -4.0);
  benchGroup.rotation.y = 0.25;

  const benchTopGeo = new THREE.BoxGeometry(2.6, 0.14, 1.1);
  const benchTop = new THREE.Mesh(benchTopGeo, crateWoodMat);
  benchTop.position.y = 0.95;
  benchTop.castShadow = true;
  benchGroup.add(benchTop);

  // Heavy steel legs & lower shelf
  const benchLegGeo = new THREE.BoxGeometry(0.12, 0.95, 0.12);
  [-1.15, 1.15].forEach((bx) => {
    [-0.42, 0.42].forEach((bz) => {
      const leg = new THREE.Mesh(benchLegGeo, darkSteelMat);
      leg.position.set(bx, 0.48, bz);
      benchGroup.add(leg);
    });
  });

  // Steel machinist bench vise mounted on the front-left corner
  const viseGeo = new THREE.BoxGeometry(0.32, 0.24, 0.38);
  const vise = new THREE.Mesh(viseGeo, darkSteelMat);
  vise.position.set(-1.0, 1.14, 0.4);
  vise.castShadow = true;
  benchGroup.add(vise);

  // Blueprint paper rolled open on bench
  const bpGeo = new THREE.PlaneGeometry(0.9, 0.55);
  bpGeo.rotateX(-Math.PI / 2);
  const bpMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7 });
  const bp = new THREE.Mesh(bpGeo, bpMat);
  bp.position.set(0.2, 1.03, 0);
  benchGroup.add(bp);

  baseGroup.add(benchGroup);

  // C. Oxygen & Acetylene Mobile Welding Cart (X = 5.6, Z = 1.8)
  const weldGroup = new THREE.Group();
  weldGroup.position.set(5.6, 0, 1.8);
  weldGroup.rotation.y = -0.55;

  // Two-wheel steel hand cart frame
  const cartFrameGeo = new THREE.BoxGeometry(0.65, 0.08, 0.45);
  const cartBase = new THREE.Mesh(cartFrameGeo, darkSteelMat);
  cartBase.position.y = 0.2;
  weldGroup.add(cartBase);

  // Tall Green Oxygen Cylinder (Right)
  const oxyGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.45, 12);
  const oxyMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.45, metalness: 0.5 });
  const oxy = new THREE.Mesh(oxyGeo, oxyMat);
  oxy.position.set(0.16, 0.95, 0);
  oxy.castShadow = true;
  weldGroup.add(oxy);

  // Shorter Maroon Acetylene Cylinder (Left)
  const aceGeo = new THREE.CylinderGeometry(0.16, 0.16, 1.15, 12);
  const aceMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.45, metalness: 0.5 });
  const ace = new THREE.Mesh(aceGeo, aceMat);
  ace.position.set(-0.16, 0.8, 0);
  ace.castShadow = true;
  weldGroup.add(ace);

  // Twin rubber hoses looped on the side
  const hoseGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 12);
  const hoseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
  const hose = new THREE.Mesh(hoseGeo, hoseMat);
  hose.position.set(0, 1.15, 0.22);
  weldGroup.add(hose);

  baseGroup.add(weldGroup);

  // D. Stacks of Wooden Artillery & Ammo Shell Crates (X = 6.8, Z = -9.0)
  const crateStack = new THREE.Group();
  crateStack.position.set(6.8, 0, -9.0);

  const cr1Geo = new THREE.BoxGeometry(1.6, 0.65, 0.95);
  const cr2Geo = new THREE.BoxGeometry(1.3, 0.55, 0.85);

  const c1 = new THREE.Mesh(cr1Geo, crateWoodMat);
  c1.position.set(0, 0.33, 0);
  c1.castShadow = true;
  const c2 = new THREE.Mesh(cr1Geo, crateWoodMat);
  c2.position.set(0.1, 0.98, -0.05);
  c2.rotation.y = 0.08;
  c2.castShadow = true;
  const c3 = new THREE.Mesh(cr2Geo, crateWoodMat);
  c3.position.set(1.4, 0.28, 0.1);
  c3.castShadow = true;
  const c4 = new THREE.Mesh(cr2Geo, crateWoodMat);
  c4.position.set(1.35, 0.83, 0.12);
  c4.castShadow = true;

  crateStack.add(c1, c2, c3, c4);
  baseGroup.add(crateStack);

  // E. 55-Gallon Steel Oil Drums on Wooden Pallet (X = -5.8, Z = -11.0)
  const drumGroup = new THREE.Group();
  drumGroup.position.set(-5.8, 0, -11.0);

  // Wooden shipping pallet
  const palletGeo = new THREE.BoxGeometry(1.8, 0.14, 1.8);
  const pallet = new THREE.Mesh(palletGeo, crateWoodMat);
  pallet.position.y = 0.07;
  drumGroup.add(pallet);

  // 3 Steel Oil Drums with chimes & bung caps (olive drab, deep blue, worn red)
  const oilDrumGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.1, 14);
  const dMatGreen = new THREE.MeshStandardMaterial({ color: 0x3f4f34, roughness: 0.55, metalness: 0.45 });
  const dMatBlue = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.55, metalness: 0.45 });
  const dMatRed = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.55, metalness: 0.45 });

  const d1 = new THREE.Mesh(oilDrumGeo, dMatGreen);
  d1.position.set(-0.4, 0.69, -0.4);
  d1.castShadow = true;
  const d2 = new THREE.Mesh(oilDrumGeo, dMatBlue);
  d2.position.set(0.4, 0.69, -0.4);
  d2.castShadow = true;
  const d3 = new THREE.Mesh(oilDrumGeo, dMatRed);
  d3.position.set(0.0, 0.69, 0.42);
  d3.castShadow = true;

  drumGroup.add(d1, d2, d3);
  baseGroup.add(drumGroup);

  // F. Tank Spare Parts (Spare Track Links & Road Wheel on timber blocks)
  const partsGroup = new THREE.Group();
  partsGroup.position.set(4.2, 0, 3.2);

  // Segment of spare heavy track shoe links laid flat
  const trackLinkGeo = new THREE.BoxGeometry(0.85, 0.12, 1.6);
  const trackShoe = new THREE.Mesh(trackLinkGeo, darkSteelMat);
  trackShoe.position.set(0, 0.06, 0);
  trackShoe.castShadow = true;

  // Spare rubber-rimmed tank road wheel leaning against timber block
  const wheelRimGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.22, 16);
  wheelRimGeo.rotateX(Math.PI / 2);
  const wheelMesh = new THREE.Mesh(wheelRimGeo, darkSteelMat);
  wheelMesh.position.set(0.85, 0.45, 0.3);
  wheelMesh.rotation.y = 0.35;
  wheelMesh.castShadow = true;

  // Braided steel tow cable coiled on floor
  const cableCoilGeo = new THREE.TorusGeometry(0.55, 0.04, 8, 20);
  cableCoilGeo.rotateX(Math.PI / 2);
  const cableCoil = new THREE.Mesh(cableCoilGeo, darkSteelMat);
  cableCoil.position.set(0.4, 0.04, -0.8);
  cableCoil.castShadow = true;

  partsGroup.add(trackShoe, wheelMesh, cableCoil);
  baseGroup.add(partsGroup);

  // =========================================================================
  // 9. HIGH-DETAIL 3D MAINTENANCE CREW MEMBERS (Human Presence in Depot)
  // =========================================================================

  function createCrewMember(posX: number, posZ: number, rotY: number, hasClipboard: boolean) {
    const crew = new THREE.Group();
    crew.position.set(posX, 0, posZ);
    crew.rotation.y = rotY;

    const uniformMat = new THREE.MeshStandardMaterial({ color: 0x364032, roughness: 0.85 }); // military olive drab
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.6 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x272e24, roughness: 0.85 });

    // Boots
    const bootGeo = new THREE.BoxGeometry(0.14, 0.16, 0.28);
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.12, 0.08, 0.02);
    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.12, 0.08, 0.02);
    crew.add(leftBoot, rightBoot);

    // Legs / Pants
    const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.78, 8);
    const leftLeg = new THREE.Mesh(legGeo, uniformMat);
    leftLeg.position.set(-0.12, 0.52, 0);
    const rightLeg = new THREE.Mesh(legGeo, uniformMat);
    rightLeg.position.set(0.12, 0.52, 0);
    crew.add(leftLeg, rightLeg);

    // Torso / Fatigue Jacket
    const torsoGeo = new THREE.BoxGeometry(0.45, 0.65, 0.28);
    const torso = new THREE.Mesh(torsoGeo, uniformMat);
    torso.position.y = 1.18;
    torso.castShadow = true;
    crew.add(torso);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.55, 8);
    const leftArm = new THREE.Mesh(armGeo, uniformMat);
    leftArm.position.set(-0.28, 1.15, hasClipboard ? 0.12 : 0);
    leftArm.rotation.x = hasClipboard ? -0.4 : 0;

    const rightArm = new THREE.Mesh(armGeo, uniformMat);
    rightArm.position.set(0.28, 1.15, hasClipboard ? 0.12 : 0);
    rightArm.rotation.x = hasClipboard ? -0.4 : 0;
    crew.add(leftArm, rightArm);

    // Head
    const headGeo = new THREE.SphereGeometry(0.12, 10, 8);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.62;
    head.castShadow = true;
    crew.add(head);

    // Military Field Cap (Visor cap)
    const capGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.09, 10);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 1.71;
    const visorGeo = new THREE.BoxGeometry(0.18, 0.02, 0.12);
    const visor = new THREE.Mesh(visorGeo, capMat);
    visor.position.set(0, 1.68, 0.12);
    crew.add(cap, visor);

    // Clipboard or tool in hand
    if (hasClipboard) {
      const boardGeo = new THREE.BoxGeometry(0.22, 0.32, 0.02);
      const board = new THREE.Mesh(boardGeo, crateWoodMat);
      board.position.set(0, 1.18, 0.28);
      board.rotation.x = 0.5;
      crew.add(board);
    }

    baseGroup.add(crew);
  }

  // Chief Engineer standing near workbench checking maintenance checklist
  createCrewMember(-6.2, -3.5, 1.1, true);

  // Track specialist standing near the right track inspecting suspension
  createCrewMember(3.8, 0.8, -1.8, false);

  // =========================================================================
  // 10. NATIONAL UNIT INSIGNIA BANNER (Mounted on Arch Wall)
  // =========================================================================
  const flagCanvas = document.createElement('canvas');
  flagCanvas.width = 384;
  flagCanvas.height = 256;
  const flagCtx = flagCanvas.getContext('2d')!;

  switch (selectedNation) {
    case 'usa':
      flagCtx.fillStyle = '#b91c1c';
      flagCtx.fillRect(0, 0, 384, 256);
      flagCtx.fillStyle = '#ffffff';
      for (let i = 1; i < 13; i += 2) {
        flagCtx.fillRect(0, (i * 256) / 13, 384, 256 / 13);
      }
      flagCtx.fillStyle = '#1e3a8a';
      flagCtx.fillRect(0, 0, 160, (7 * 256) / 13);
      flagCtx.fillStyle = '#ffffff';
      flagCtx.font = 'bold 20px sans-serif';
      flagCtx.fillText('★ ★ ★', 25, 65);
      break;
    case 'germany':
      flagCtx.fillStyle = '#18181b'; flagCtx.fillRect(0, 0, 384, 85);
      flagCtx.fillStyle = '#dc2626'; flagCtx.fillRect(0, 85, 384, 85);
      flagCtx.fillStyle = '#eab308'; flagCtx.fillRect(0, 170, 384, 86);
      break;
    case 'ussr':
      flagCtx.fillStyle = '#b91c1c'; flagCtx.fillRect(0, 0, 384, 256);
      flagCtx.fillStyle = '#fbbf24';
      flagCtx.font = 'bold 52px sans-serif';
      flagCtx.fillText('★ ☭', 40, 75);
      break;
    case 'uk':
      flagCtx.fillStyle = '#1e3a8a'; flagCtx.fillRect(0, 0, 384, 256);
      flagCtx.strokeStyle = '#ffffff'; flagCtx.lineWidth = 42;
      flagCtx.beginPath();
      flagCtx.moveTo(0, 0); flagCtx.lineTo(384, 256);
      flagCtx.moveTo(384, 0); flagCtx.lineTo(0, 256);
      flagCtx.stroke();
      flagCtx.strokeStyle = '#dc2626'; flagCtx.lineWidth = 20;
      flagCtx.stroke();
      flagCtx.fillStyle = '#ffffff'; flagCtx.fillRect(162, 0, 60, 256); flagCtx.fillRect(0, 98, 384, 60);
      flagCtx.fillStyle = '#dc2626'; flagCtx.fillRect(174, 0, 36, 256); flagCtx.fillRect(0, 110, 384, 36);
      break;
    case 'japan':
      flagCtx.fillStyle = '#ffffff'; flagCtx.fillRect(0, 0, 384, 256);
      flagCtx.fillStyle = '#dc2626';
      flagCtx.beginPath();
      flagCtx.arc(192, 128, 65, 0, Math.PI * 2);
      flagCtx.fill();
      break;
    case 'france':
      flagCtx.fillStyle = '#1d4ed8'; flagCtx.fillRect(0, 0, 128, 256);
      flagCtx.fillStyle = '#ffffff'; flagCtx.fillRect(128, 0, 128, 256);
      flagCtx.fillStyle = '#dc2626'; flagCtx.fillRect(256, 0, 128, 256);
      break;
    case 'italy':
      flagCtx.fillStyle = '#16a34a'; flagCtx.fillRect(0, 0, 128, 256);
      flagCtx.fillStyle = '#ffffff'; flagCtx.fillRect(128, 0, 128, 256);
      flagCtx.fillStyle = '#dc2626'; flagCtx.fillRect(256, 0, 128, 256);
      break;
    case 'sweden':
      flagCtx.fillStyle = '#0284c7'; flagCtx.fillRect(0, 0, 384, 256);
      flagCtx.fillStyle = '#facc15';
      flagCtx.fillRect(110, 0, 45, 256);
      flagCtx.fillRect(0, 105, 384, 45);
      break;
    case 'china':
      flagCtx.fillStyle = '#dc2626'; flagCtx.fillRect(0, 0, 384, 256);
      flagCtx.fillStyle = '#facc15';
      flagCtx.font = 'bold 50px sans-serif';
      flagCtx.fillText('★', 40, 75);
      break;
    case 'israel':
      flagCtx.fillStyle = '#ffffff'; flagCtx.fillRect(0, 0, 384, 256);
      flagCtx.fillStyle = '#2563eb';
      flagCtx.fillRect(0, 35, 384, 35);
      flagCtx.fillRect(0, 186, 384, 35);
      flagCtx.font = 'bold 64px sans-serif';
      flagCtx.textAlign = 'center';
      flagCtx.fillText('✡', 192, 148);
      break;
  }

  const flagTexture = new THREE.CanvasTexture(flagCanvas);
  const flagMat = new THREE.MeshStandardMaterial({
    map: flagTexture,
    side: THREE.DoubleSide,
    roughness: 0.7,
  });

  // Mounted banner hung with steel cables from Arch Rib at Z = 4
  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.8), flagMat);
  bannerMesh.position.set(-11.5, 6.2, 4);
  bannerMesh.rotation.y = Math.PI / 2;
  bannerMesh.castShadow = true;
  baseGroup.add(bannerMesh);

  // Return clean, fully lit environment without floating particles
  return {
    group: baseGroup,
    spotlights,
    pointLights,
  };
}
