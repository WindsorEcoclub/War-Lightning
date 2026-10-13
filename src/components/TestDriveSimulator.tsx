import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AmmoSpec, VehicleSpec } from '../data/vehicles';
import { buildVehicle3D } from '../utils/vehicleModelBuilder';
import { buildProvingGroundScenery } from '../utils/provingGroundBuilder';
import { soundEngine } from '../utils/soundEngine';
import {
  generateExplosionParticleTexture,
  generateImpactCraterTexture,
  generateTrackTexture,
} from '../utils/textureGenerator';
import {
  Crosshair,
  ShieldAlert,
  Volume2,
  VolumeX,
  ArrowLeft,
  PlusCircle,
  Flame,
  Zap,
} from 'lucide-react';

import { HitCamera } from './HitCamera';
import {
  simulateShot,
  SimulatedShotResult,
  createDefaultDamageState,
  TargetDamageState,
} from '../utils/damageSimulator';

export type RangeBiome = 'kursk' | 'sinai' | 'arctic';

interface TestDriveSimulatorProps {
  vehicle: VehicleSpec;
  camoColor: string | null;
  camoRoughness: number;
  initialBiome?: RangeBiome;
  onExitToHangar: () => void;
  onOpenVehicleSwitcher: () => void;
}

interface RangeTarget {
  id: string;
  name: string;
  role: string;
  armorFrontMm: number;
  armorSideMm: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  respawnTimer: number;
  isMoving: boolean;
  isAirborne: boolean;
  moveSpeed: number;
  moveOriginZ: number;
  moveOriginX: number;
  meshGroup: THREE.Group;
  turretGroup?: THREE.Group;
  barrelMesh?: THREE.Mesh;
  hitBox: THREE.Mesh;
  isBurning: boolean;
  burnTimer: number;
  fireGroup?: THREE.Group;
  trackBroken: boolean;
  turretDetached?: boolean;
  turretVelocity?: THREE.Vector3;
  turretRotVelocity?: THREE.Vector3;
  damageState: TargetDamageState;
}

interface Projectile {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  ammo: AmmoSpec;
  isGuided: boolean;
  isMG: boolean;
  age: number;
  startPos: THREE.Vector3;
}

interface VisualParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  age: number;
  maxAge: number;
  scaleGrowth: number;
  opacityFade: boolean;
}

export const TestDriveSimulator: React.FC<TestDriveSimulatorProps> = ({
  vehicle,
  camoColor,
  camoRoughness,
  initialBiome = 'kursk',
  onExitToHangar,
  onOpenVehicleSwitcher,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const [biome, setBiome] = useState<RangeBiome>(initialBiome);
  const [selectedAmmoIdx, setSelectedAmmoIdx] = useState(0);
  const [sniperMode, setSniperMode] = useState(false);
  const [zoomHigh, setZoomHigh] = useState(false);
  const [thermalMode, setThermalMode] = useState(false);
  const [muted, setMuted] = useState(soundEngine.muted);

  // Live In-Game HUD Telemetry State
  const [speedKmh, setSpeedKmh] = useState(0);
  const [gearLabel, setGearLabel] = useState('N');
  const [rpmPct, setRpmPct] = useState(850);
  const [altitudeM, setAltitudeM] = useState(0);
  const [compassHeading, setCompassHeading] = useState(90);
  const [reloadProgress, setReloadProgress] = useState(1);
  const [reloadRemainingSec, setReloadRemainingSec] = useState(0);
  const [measuredRangeM, setMeasuredRangeM] = useState<number | null>(null);
  const [smokeGrenadesCount, setSmokeGrenadesCount] = useState(12);
  const [essCount, setEssCount] = useState(3);
  const [fpeCount, setFpeCount] = useState(2);
  const [simulatedShot, setSimulatedShot] = useState<SimulatedShotResult | null>(null);
  const [isFiringMG, setIsFiringMG] = useState(false);

  // Mouse Aim screen offsets
  const [aimScreenOffset, setAimScreenOffset] = useState({ x: 0, y: 0 });
  const [gunScreenOffset, setGunScreenOffset] = useState({ x: 0, y: 0 });

  // Pointer drag state for Drag-to-Aim vs Tap-to-Shoot
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startTime: 0,
    totalDistance: 0,
  });

  const barrelToggleRef = useRef(0);

  const stateRef = useRef({
    pos: new THREE.Vector3(0, vehicle.branch === 'aviation' ? 65 : vehicle.branch === 'helicopters' ? 22 : 0, 0),
    hullYaw: 0,
    hullPitch: 0,
    hullRoll: 0,
    speedMs: vehicle.branch === 'aviation' ? 120 : 0,
    throttle: vehicle.branch === 'aviation' ? 0.75 : 0,
    turretYawRel: 0,
    gunPitchRel: 0,
    targetYawWorld: 0,
    targetPitchWorld: 0.015,
    reloadTimer: 0,
    mgCooldown: 0,
    recoilImpulse: 0,
    recoilSuspensionPitch: 0,
    trackAnimOffset: 0,
    sniper: false,
    zoomHigh: false,
    thermal: false,
    ammoIdx: 0,
    keys: {} as Record<string, boolean>,
  });

  const targetsRef = useRef<RangeTarget[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<VisualParticle[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    stateRef.current.sniper = sniperMode;
  }, [sniperMode]);
  useEffect(() => {
    stateRef.current.zoomHigh = zoomHigh;
  }, [zoomHigh]);
  useEffect(() => {
    stateRef.current.thermal = thermalMode;
  }, [thermalMode]);
  useEffect(() => {
    stateRef.current.ammoIdx = Math.min(selectedAmmoIdx, vehicle.ammoLoadout.length - 1);
  }, [selectedAmmoIdx, vehicle]);

  // Auto-dismiss Hit Camera after 4.6 seconds
  useEffect(() => {
    if (!simulatedShot) return;
    const timer = setTimeout(() => {
      setSimulatedShot(null);
    }, 4600);
    return () => clearTimeout(timer);
  }, [simulatedShot]);

  // Create Highly Detailed Realistic Target Tanks (Non-Blocky, Realistic Shapes)
  const createDetailedTargetTank = useCallback(
    (name: string, role: string, armorFrontMm: number, isAir: boolean, isThermal: boolean) => {
      const group = new THREE.Group();
      const colorHex = isThermal
        ? 0xf8fafc
        : armorFrontMm >= 600
        ? 0x3d4a36 // Modern Russian/NATO Forest Green
        : armorFrontMm >= 200
        ? 0x6e634b // Panzer Dunkelgelb
        : 0x475141; // WWII Olive Drab

      const tankMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: isThermal ? 0xffffff : 0x000000,
        emissiveIntensity: isThermal ? 0.85 : 0,
        roughness: 0.65,
        metalness: 0.35,
      });

      const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.8, metalness: 0.6 });
      const rubberMat = new THREE.MeshStandardMaterial({ color: 0x121417, roughness: 0.95 });

      let turretGroup: THREE.Group | undefined;
      let barrelMesh: THREE.Mesh | undefined;

      if (isAir) {
        // Detailed Aircraft / Drone Target
        const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.9, 9.2, 16), tankMat);
        fuselage.rotation.x = Math.PI / 2;
        const wings = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.14, 2.4), tankMat);
        wings.position.set(0, 0, -0.6);
        const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 1.5), tankMat);
        tailFin.position.set(0, 1.0, -3.8);
        group.add(fuselage, wings, tailFin);
      } else {
        // Authentic Tank Hull
        const hullGroup = new THREE.Group();
        group.add(hullGroup);

        // Sloped Upper & Lower Glacis (Chiseled bevels)
        const lowerHull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.85, 6.2), tankMat);
        lowerHull.position.y = 0.78;
        lowerHull.castShadow = true;
        lowerHull.receiveShadow = true;
        hullGroup.add(lowerHull);

        const glacis = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.22, 1.9), tankMat);
        glacis.position.set(0, 1.15, 2.2);
        glacis.rotation.x = 0.58;
        hullGroup.add(glacis);

        // 6 Roadwheels per side with hub caps
        [-1.6, 1.6].forEach((sideX) => {
          for (let z = -2.2; z <= 2.2; z += 0.88) {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 16), darkMat);
            wheel.rotateZ(Math.PI / 2);
            wheel.position.set(sideX, 0.36, z);
            const tire = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.08, 8, 16), rubberMat);
            tire.rotateY(Math.PI / 2);
            tire.position.set(sideX, 0.36, z);
            hullGroup.add(wheel, tire);
          }
          // Idler & Sprocket
          const idler = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.25, 14), darkMat);
          idler.rotateZ(Math.PI / 2);
          idler.position.set(sideX, 0.58, 2.85);
          hullGroup.add(idler);

          const sprocket = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.25, 14), darkMat);
          sprocket.rotateZ(Math.PI / 2);
          sprocket.position.set(sideX, 0.62, -2.85);
          hullGroup.add(sprocket);
        });

        // Track Belts
        const trackGeo = new THREE.BoxGeometry(0.62, 0.82, 6.4);
        const lTrack = new THREE.Mesh(trackGeo, darkMat);
        lTrack.position.set(-1.6, 0.45, 0);
        const rTrack = new THREE.Mesh(trackGeo, darkMat);
        rTrack.position.set(1.6, 0.45, 0);
        hullGroup.add(lTrack, rTrack);

        // Side Skirts
        const skirtGeo = new THREE.BoxGeometry(0.12, 0.55, 5.8);
        const lSkirt = new THREE.Mesh(skirtGeo, tankMat);
        lSkirt.position.set(-1.82, 0.82, 0);
        const rSkirt = new THREE.Mesh(skirtGeo, tankMat);
        rSkirt.position.set(1.82, 0.82, 0);
        hullGroup.add(lSkirt, rSkirt);

        // Realistic Turret with Cast/Beveled Cheeks
        turretGroup = new THREE.Group();
        turretGroup.position.set(0, 1.45, 0.2);
        group.add(turretGroup);

        const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.8, 18), tankMat);
        turretBase.position.y = 0.4;
        turretBase.castShadow = true;
        turretGroup.add(turretBase);

        // Sloped Cheeks Wedge
        const leftCheek = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.72, 1.3), tankMat);
        leftCheek.position.set(-0.65, 0.4, 0.85);
        leftCheek.rotation.y = 0.32;
        const rightCheek = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.72, 1.3), tankMat);
        rightCheek.position.set(0.65, 0.4, 0.85);
        rightCheek.rotation.y = -0.32;
        turretGroup.add(leftCheek, rightCheek);

        // Gun Mantlet
        const mantlet = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.75, 14), darkMat);
        mantlet.rotateZ(Math.PI / 2);
        mantlet.position.set(0, 0.42, 1.35);
        turretGroup.add(mantlet);

        // Gun Barrel with Bore Evacuator
        const barrelLen = 4.8;
        barrelMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, barrelLen, 16), darkMat);
        barrelMesh.rotation.x = Math.PI / 2;
        barrelMesh.position.set(0, 0.42, 1.35 + barrelLen * 0.5);
        barrelMesh.castShadow = true;
        turretGroup.add(barrelMesh);

        // Fume extractor
        const evac = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.75, 14), darkMat);
        evac.rotation.x = Math.PI / 2;
        evac.position.set(0, 0.42, 1.35 + barrelLen * 0.55);
        turretGroup.add(evac);
      }

      // Invisible Precision Hitbox for Ballistics Collision
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(isAir ? 9.6 : 3.8, isAir ? 2.8 : 2.7, isAir ? 9.6 : 6.8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.y = isAir ? 0 : 1.35;
      group.add(hitBox);

      return { group, turretGroup, barrelMesh, hitBox };
    },
    []
  );

  const spawnCustomTargetAhead = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const st = stateRef.current;
    const forward = new THREE.Vector3(Math.sin(st.hullYaw), 0, Math.cos(st.hullYaw));
    const spawnPos = st.pos.clone().add(forward.multiplyScalar(140));
    spawnPos.y = 0;

    const presets = [
      { name: 'T-90M Proryv Target', role: 'Main Battle Tank', front: 680, side: 180 },
      { name: 'Tiger II (H) Target', role: 'Heavy Tank', front: 237, side: 80 },
      { name: 'Leopard 2A7V Target', role: 'Main Battle Tank', front: 720, side: 120 },
      { name: 'Pz.VIII Maus Super-Heavy', role: 'Super-Heavy Tank', front: 280, side: 185 },
      { name: 'BMP-2M IFV Target', role: 'Light IFV', front: 38, side: 20 },
    ];
    const p = presets[Math.floor(Math.random() * presets.length)];
    const { group, turretGroup, barrelMesh, hitBox } = createDetailedTargetTank(p.name, p.role, p.front, false, st.thermal);
    group.position.copy(spawnPos);
    group.rotation.y = st.hullYaw + Math.PI * 0.88;
    scene.add(group);

    targetsRef.current.push({
      id: `custom_${Date.now()}`,
      name: p.name,
      role: p.role,
      armorFrontMm: p.front,
      armorSideMm: p.side,
      hp: 100,
      maxHp: 100,
      alive: true,
      respawnTimer: 0,
      isMoving: false,
      isAirborne: false,
      moveSpeed: 0,
      moveOriginX: spawnPos.x,
      moveOriginZ: spawnPos.z,
      meshGroup: group,
      turretGroup,
      barrelMesh,
      hitBox,
      isBurning: false,
      burnTimer: 0,
      trackBroken: false,
      damageState: createDefaultDamageState(),
    });
  }, [createDetailedTargetTank]);

  // Main Cannon Firing (Tap to shoot or Mouse Click)
  const fireMainWeapon = useCallback(() => {
    const st = stateRef.current;
    if (st.reloadTimer > 0) return;
    const scene = sceneRef.current;
    if (!scene) return;

    const ammo = vehicle.ammoLoadout[st.ammoIdx] || vehicle.ammoLoadout[0];
    const isGuided = ammo.type === 'ATGM' || ammo.type === 'AAM';
    soundEngine.playCannonFire(vehicle.caliberMm, isGuided);

    st.reloadTimer = vehicle.reloadSeconds;
    setReloadProgress(0);
    setReloadRemainingSec(vehicle.reloadSeconds);

    const isRecoilless = vehicle.mainGunName.includes('Recoilless') || vehicle.name.includes('Recoilless');
    const isTwinBarrels = vehicle.visual.barrelCount === 2;
    const isR3 = vehicle.id.includes('r3') || vehicle.name.includes('R3');

    // Realistic Hull Recoil & Suspension Rocking Physics (recoilless cannons have almost zero recoil!)
    st.recoilImpulse = isRecoilless ? 0.05 : Math.min(0.65, vehicle.caliberMm / 210);
    st.recoilSuspensionPitch = isRecoilless ? 0.006 : Math.min(0.08, vehicle.caliberMm / 1600);

    const totalYaw = st.hullYaw + st.turretYawRel;
    const totalPitch = st.hullPitch + st.gunPitchRel;
    const dir = new THREE.Vector3(
      Math.sin(totalYaw) * Math.cos(totalPitch),
      Math.sin(totalPitch),
      Math.cos(totalYaw) * Math.cos(totalPitch)
    ).normalize();

    // Twin barrel alternating offset (left/right)
    const barrelSide = isTwinBarrels ? (barrelToggleRef.current++ % 2 === 0 ? -1 : 1) : 0;
    const rightVec = new THREE.Vector3(Math.cos(totalYaw), 0, -Math.sin(totalYaw)).normalize();
    const barrelOffset = rightVec.clone().multiplyScalar(barrelSide * 0.36 * (vehicle.visual.widthScale || 1));

    const startPos = st.pos
      .clone()
      .add(new THREE.Vector3(0, vehicle.branch === 'aviation' ? 0 : isR3 ? 1.48 : 1.82, 0))
      .add(barrelOffset)
      .add(dir.clone().multiplyScalar(isR3 ? 2.5 : 4.2));

    // Dynamic Muzzle Blast Flash Light (Illuminates Tank and Ground!)
    const flashLight = new THREE.PointLight(0xffedd5, 14, 38, 2);
    flashLight.position.copy(startPos);
    scene.add(flashLight);
    setTimeout(() => scene.remove(flashLight), 65);

    // Expanding Muzzle Fireball Particle
    const pTex = generateExplosionParticleTexture();
    const blastMat = new THREE.SpriteMaterial({ map: pTex, blending: THREE.AdditiveBlending });
    const blastSprite = new THREE.Sprite(blastMat);
    blastSprite.position.copy(startPos);
    blastSprite.scale.set(3.2, 3.2, 3.2);
    scene.add(blastSprite);
    particlesRef.current.push({
      mesh: blastSprite as unknown as THREE.Mesh,
      velocity: dir.clone().multiplyScalar(6),
      age: 0,
      maxAge: 0.18,
      scaleGrowth: 4.5,
      opacityFade: true,
    });

    // Realistic Recoilless Rifle Rear Venturi Backblast
    if (isRecoilless) {
      const rearPos = st.pos
        .clone()
        .add(new THREE.Vector3(0, 1.45, 0))
        .add(barrelOffset)
        .add(dir.clone().multiplyScalar(-1.1));

      const rearFlash = new THREE.PointLight(0xffedd5, 10, 26, 2);
      rearFlash.position.copy(rearPos);
      scene.add(rearFlash);
      setTimeout(() => scene.remove(rearFlash), 55);

      const rearBlastSprite = new THREE.Sprite(blastMat);
      rearBlastSprite.position.copy(rearPos);
      rearBlastSprite.scale.set(3.2, 3.2, 3.2);
      scene.add(rearBlastSprite);
      particlesRef.current.push({
        mesh: rearBlastSprite as unknown as THREE.Mesh,
        velocity: dir.clone().multiplyScalar(-7),
        age: 0,
        maxAge: 0.16,
        scaleGrowth: 4.5,
        opacityFade: true,
      });
    }

    // Muzzle Smoke Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.3, 1.2, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(startPos);
    ring.lookAt(startPos.clone().add(dir));
    scene.add(ring);
    particlesRef.current.push({
      mesh: ring,
      velocity: dir.clone().multiplyScalar(4),
      age: 0,
      maxAge: 0.12,
      scaleGrowth: 8,
      opacityFade: true,
    });

    // High-Velocity Tracer Projectile
    const tracerGeo = new THREE.SphereGeometry(isGuided ? 0.28 : 0.15, 8, 8);
    const tracerMat = new THREE.MeshBasicMaterial({
      color: isGuided ? 0xf97316 : ammo.type === 'APFSDS' ? 0x67e8f9 : 0xfde047,
    });
    const tracerMesh = new THREE.Mesh(tracerGeo, tracerMat);
    tracerMesh.position.copy(startPos);
    scene.add(tracerMesh);

    const visualSpeed = isGuided ? 155 : Math.min(380, Math.max(180, ammo.velocityMs * 0.24));
    projectilesRef.current.push({
      mesh: tracerMesh,
      position: startPos.clone(),
      velocity: dir.multiplyScalar(visualSpeed),
      ammo,
      isGuided,
      isMG: false,
      age: 0,
      startPos: startPos.clone(),
    });
  }, [vehicle]);

  // Deploy Smoke Grenades
  const deploySmokeGrenades = useCallback(() => {
    if (smokeGrenadesCount <= 0) return;
    const scene = sceneRef.current;
    if (!scene) return;
    setSmokeGrenadesCount((c) => Math.max(0, c - 2));
    soundEngine.playSmokeDischarge();

    const st = stateRef.current;
    const totalYaw = st.hullYaw + st.turretYawRel;
    const forward = new THREE.Vector3(Math.sin(totalYaw), 0, Math.cos(totalYaw));
    for (let i = -2; i <= 2; i++) {
      const smokeGeo = new THREE.SphereGeometry(4.2 + Math.abs(i) * 0.5, 12, 12);
      const smokeMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.85,
        roughness: 1,
      });
      const cloud = new THREE.Mesh(smokeGeo, smokeMat);
      const side = new THREE.Vector3(Math.cos(totalYaw), 0, -Math.sin(totalYaw)).multiplyScalar(i * 3.8);
      cloud.position
        .copy(st.pos)
        .add(forward.clone().multiplyScalar(19))
        .add(side);
      cloud.position.y = 2.4;
      scene.add(cloud);
    }
  }, [smokeGrenadesCount]);

  // Laser Rangefinder
  const triggerLaserRangefinder = useCallback(() => {
    soundEngine.playRangefinderBeep();
    const st = stateRef.current;
    const totalYaw = st.hullYaw + st.turretYawRel;
    const totalPitch = st.hullPitch + st.gunPitchRel;
    const rayDir = new THREE.Vector3(
      Math.sin(totalYaw) * Math.cos(totalPitch),
      Math.sin(totalPitch),
      Math.cos(totalYaw) * Math.cos(totalPitch)
    ).normalize();

    const origin = st.pos.clone().add(new THREE.Vector3(0, 1.82, 0));
    const raycaster = new THREE.Raycaster(origin, rayDir, 1, 2500);
    const hitBoxes = targetsRef.current.filter((t) => t.alive).map((t) => t.hitBox);
    const hits = raycaster.intersectObjects(hitBoxes, false);
    if (hits.length > 0) {
      setMeasuredRangeM(Math.round(hits[0].distance * 2.5));
    } else {
      const groundDist = Math.min(1850, Math.max(120, Math.round(280 / Math.max(0.05, Math.abs(rayDir.y)))));
      setMeasuredRangeM(groundDist);
    }
  }, []);

  // Main Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // High-Clarity Sunlit Proving Ground Sky & Low Ambient Haze
    scene.background = new THREE.Color(thermalMode ? 0x090d12 : 0x98c5ed);
    scene.fog = new THREE.FogExp2(thermalMode ? 0x090d12 : 0x98c5ed, 0.00015);

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.2, 2800);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.68;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // High-Intensity Multi-Directional Sun & Sky Lighting (Crystal Clear & Crisp)
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x64748b, thermalMode ? 0.75 : 2.2);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, thermalMode ? 1.0 : 4.2);
    sunLight.position.set(190, 280, 130);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 1600;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    sunLight.shadow.bias = -0.00035;
    scene.add(sunLight);

    // Opposite High Fill Light (eliminates muddy shadows on vehicle hulls & targets)
    const fillLight = new THREE.DirectionalLight(0xdbeafe, thermalMode ? 0.5 : 1.8);
    fillLight.position.set(-150, 160, -90);
    scene.add(fillLight);

    // Build the authentic War Thunder Test Drive scenery
    buildProvingGroundScenery(scene, biome);

    // Build Player Vehicle 3D Model with PBR Materials & High Detail
    const builtPlayer = buildVehicle3D(vehicle, 'standard', camoColor, camoRoughness);
    scene.add(builtPlayer.root);

    // Exhaust Smoke Material & Shared Geometry
    const exhaustGeo = new THREE.SphereGeometry(0.44, 8, 8);
    const exhaustMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.35,
      roughness: 0.95,
      depthWrite: false,
    });

    // Populate Detailed Range Targets (Matching Real War Thunder Proving Ground)
    const rangeTargetsData = [
      { name: 'Pz.Kpfw. II C (Light 100m Range Target)', role: 'Light Tank', front: 35, side: 15, x: -6, z: 100, moving: false, air: false },
      { name: 'T-34-85 (Medium 200m Range Target)', role: 'Medium Tank', front: 135, side: 75, x: 7, z: 200, moving: false, air: false },
      { name: 'Tiger II (H) (Heavy 400m Range Target)', role: 'Heavy Tank', front: 237, side: 80, x: -8, z: 400, moving: false, air: false },
      { name: 'T-72B3 (Modern 600m Range Target)', role: 'Main Battle Tank', front: 560, side: 90, x: 8, z: 600, moving: false, air: false },
      { name: 'Pz.VIII Maus (Super-Heavy 800m Target)', role: 'Super-Heavy Tank', front: 280, side: 185, x: -9, z: 800, moving: false, air: false },
      { name: 'Leopard 2A7V (Extreme 1000m Target)', role: 'Main Battle Tank', front: 720, side: 120, x: 9, z: 1000, moving: false, air: false },
      { name: 'M1A2 Abrams (Extreme 1200m Target)', role: 'Main Battle Tank', front: 680, side: 100, x: -9, z: 1200, moving: false, air: false },
      { name: 'T-26 Patrol Target (Moving Lateral Road)', role: 'Patrol Tank', front: 25, side: 15, x: 0, z: 210, moving: true, air: false },
      { name: 'MiG-15 Target Drone (Airborne Orbit)', role: 'Target Aircraft', front: 20, side: 15, x: 0, z: 280, moving: true, air: true },
    ];

    targetsRef.current = rangeTargetsData.map((td, idx) => {
      const { group, turretGroup, barrelMesh, hitBox } = createDetailedTargetTank(td.name, td.role, td.front, td.air, thermalMode);
      group.position.set(td.x, td.air ? 75 : 0, td.z);
      group.rotation.y = td.moving ? Math.PI * 0.5 : Math.PI * 0.92;
      scene.add(group);
      return {
        id: `target_${idx}`,
        name: td.name,
        role: td.role,
        armorFrontMm: td.front,
        armorSideMm: td.side,
        hp: 100,
        maxHp: 100,
        alive: true,
        respawnTimer: 0,
        isMoving: td.moving,
        isAirborne: td.air,
        moveSpeed: td.air ? 32 : 10,
        moveOriginX: td.x,
        moveOriginZ: td.z,
        meshGroup: group,
        turretGroup,
        barrelMesh,
        hitBox,
        isBurning: false,
        burnTimer: 0,
        trackBroken: false,
        damageState: createDefaultDamageState(),
      };
    });

    // Keyboard controls handler: WASD to move, Space for machine gun
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      stateRef.current.keys[k] = true;

      if (k === ' ') {
        setIsFiringMG(true);
      } else if (e.key === 'Shift') {
        setSniperMode((s) => !s);
      } else if (k === 'z' || (k === 'v' && sniperMode)) {
        setZoomHigh((z) => !z);
      } else if (k === 'n') {
        setThermalMode((t) => !t);
      } else if (k === 'r') {
        triggerLaserRangefinder();
      } else if (k === 'g') {
        deploySmokeGrenades();
      } else if (k === 'h') {
        setEssCount((c) => Math.max(0, c - 1));
      } else if (k === 'u') {
        spawnCustomTargetAhead();
      } else if (k === '7') {
        setFpeCount((c) => Math.max(0, c - 1));
      } else if (k === '1' && vehicle.ammoLoadout.length >= 1) {
        setSelectedAmmoIdx(0);
      } else if (k === '6' && vehicle.ammoLoadout.length >= 2) {
        setSelectedAmmoIdx(1);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      stateRef.current.keys[k] = false;
      if (k === ' ') {
        setIsFiringMG(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Simulation Loop
    let animId = 0;
    const clock = new THREE.Clock();
    let uiSyncAccumulator = 0;
    let exhaustSpawnAccumulator = 0;
    let dustSpawnAccumulator = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, clock.getDelta());
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      if (st.reloadTimer > 0) {
        st.reloadTimer = Math.max(0, st.reloadTimer - dt);
      }

      // 1. WASD Vehicle Movement Physics & Realistic Acceleration
      const maxFwdMs = (vehicle.mobility.maxSpeedForwardKmh / 3.6) * 0.58;
      const maxRevMs = (Math.abs(vehicle.mobility.maxSpeedReverseKmh) / 3.6) * 0.58;

      if (vehicle.branch === 'aviation') {
        if (st.keys['w']) st.throttle = Math.min(1.1, st.throttle + dt * 0.35);
        if (st.keys['s']) st.throttle = Math.max(0.2, st.throttle - dt * 0.35);
        const targetSpeedMs = st.throttle * maxFwdMs;
        st.speedMs += (targetSpeedMs - st.speedMs) * dt * 1.5;

        const yawDiff = st.targetYawWorld - st.hullYaw;
        st.hullYaw += yawDiff * dt * 1.8;
        st.hullRoll = THREE.MathUtils.clamp(-yawDiff * 0.85, -0.75, 0.75);
        st.hullPitch += (st.targetPitchWorld - st.hullPitch) * dt * 2.2;

        const moveVec = new THREE.Vector3(
          Math.sin(st.hullYaw) * Math.cos(st.hullPitch),
          Math.sin(st.hullPitch),
          Math.cos(st.hullYaw) * Math.cos(st.hullPitch)
        ).multiplyScalar(st.speedMs * dt);

        st.pos.add(moveVec);
        st.pos.y = Math.max(12, st.pos.y);
        st.turretYawRel = 0;
        st.gunPitchRel = 0;
      } else {
        // Ground Tanks: WASD Steering & Throttle
        const accel = 20.0;
        if (st.keys['w']) {
          st.speedMs = Math.min(maxFwdMs, st.speedMs + accel * dt);
          st.throttle = 1;
        } else if (st.keys['s']) {
          st.speedMs = Math.max(-maxRevMs, st.speedMs - accel * dt);
          st.throttle = -1;
        } else {
          st.speedMs *= Math.pow(0.25, dt);
          if (Math.abs(st.speedMs) < 0.15) st.speedMs = 0;
          st.throttle = 0;
        }

        // Differential Track Steering: A and D to turn
        const turnRate = 1.15;
        if (st.keys['a']) st.hullYaw += turnRate * dt;
        if (st.keys['d']) st.hullYaw -= turnRate * dt;

        st.pos.x += Math.sin(st.hullYaw) * st.speedMs * dt;
        st.pos.z += Math.cos(st.hullYaw) * st.speedMs * dt;
        st.pos.y = 0;

        // Roll wheels and animate track texture
        st.trackAnimOffset += (st.speedMs * dt) * 0.8;
        builtPlayer.wheelMeshes.forEach((w) => {
          w.rotation.x -= (st.speedMs * dt) * 2.6;
        });
      }

      // Update Engine Audio
      soundEngine.updateEngineSound((st.speedMs / 0.58) * 3.6, st.throttle);

      // 2. Drag to Aim: Smooth Turret Traverse & Elevation Toward Camera Aim
      if (vehicle.branch !== 'aviation') {
        const desiredRelYaw = st.targetYawWorld - st.hullYaw;
        const maxTraverseRad = THREE.MathUtils.degToRad(vehicle.turretTraverseDegPerSec * 1.5) * dt;
        const yawDelta = THREE.MathUtils.clamp(desiredRelYaw - st.turretYawRel, -maxTraverseRad, maxTraverseRad);
        st.turretYawRel += yawDelta;

        const minPitch = THREE.MathUtils.degToRad(vehicle.depressionDeg);
        const maxPitch = THREE.MathUtils.degToRad(vehicle.elevationDeg);
        const desiredPitch = THREE.MathUtils.clamp(st.targetPitchWorld, minPitch, maxPitch);
        const maxElevRad = THREE.MathUtils.degToRad(32) * dt;
        st.gunPitchRel += THREE.MathUtils.clamp(desiredPitch - st.gunPitchRel, -maxElevRad, maxElevRad);
      }

      // 3. Spacebar Machine Gun Continuous Fire
      st.mgCooldown = Math.max(0, st.mgCooldown - dt);
      if (st.keys[' '] && st.mgCooldown <= 0) {
        st.mgCooldown = 0.082; // ~730 rounds/min
        soundEngine.playMachineGun();
        const totalYaw = st.hullYaw + st.turretYawRel;
        const totalPitch = st.hullPitch + st.gunPitchRel;
        const dir = new THREE.Vector3(
          Math.sin(totalYaw) * Math.cos(totalPitch) + (Math.random() - 0.5) * 0.015,
          Math.sin(totalPitch) + (Math.random() - 0.5) * 0.015,
          Math.cos(totalYaw) * Math.cos(totalPitch)
        ).normalize();
        const startPos = st.pos.clone().add(new THREE.Vector3(0, 1.88, 0)).add(dir.clone().multiplyScalar(3.2));
        const mgMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
        mgMesh.position.copy(startPos);
        scene.add(mgMesh);
        projectilesRef.current.push({
          mesh: mgMesh,
          position: startPos,
          velocity: dir.multiplyScalar(260),
          ammo: {
            id: 'mg_tracer',
            name: '7.62mm/12.7mm MG',
            type: 'CANNON',
            penetrationMm: 32,
            velocityMs: 890,
            explosiveMassKg: 0,
            damageRating: 15,
            description: 'Armor piercing machine gun tracer',
          },
          isGuided: false,
          isMG: true,
          age: 0,
          startPos: startPos.clone(),
        });
      }

      // 4. Recoil Recovery & Suspension Settling Physics
      if (st.recoilImpulse > 0) {
        st.recoilImpulse = Math.max(0, st.recoilImpulse - dt * 2.5);
      }
      if (st.recoilSuspensionPitch > 0) {
        st.recoilSuspensionPitch = Math.max(0, st.recoilSuspensionPitch - dt * 1.8);
      }

      // Update Player Mesh Transforms
      builtPlayer.root.position.copy(st.pos);
      builtPlayer.root.rotation.set(st.hullPitch + st.recoilSuspensionPitch, st.hullYaw, st.hullRoll);
      builtPlayer.turretGroup.rotation.y = st.turretYawRel;
      builtPlayer.gunGroup.rotation.x = -st.gunPitchRel;
      builtPlayer.gunGroup.position.z = 1.4 - st.recoilImpulse;
      builtPlayer.root.visible = !st.sniper;

      // Clean view without ground dust billows or exhaust smoke particles

      // Update Visual Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.age += dt;
        pt.mesh.position.addScaledVector(pt.velocity, dt);
        const progress = pt.age / pt.maxAge;
        const scale = 1.0 + progress * pt.scaleGrowth;
        pt.mesh.scale.set(scale, scale, scale);

        if (pt.opacityFade && 'opacity' in (pt.mesh.material as THREE.Material)) {
          (pt.mesh.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.45 * (1 - progress));
        }

        if (pt.age >= pt.maxAge) {
          scene.remove(pt.mesh);
          particlesRef.current.splice(i, 1);
        }
      }

      // 7. Chase Camera Matching Screenshot IMG_1728.jpeg
      const camYaw = st.hullYaw + st.turretYawRel;
      const camPitch = st.targetPitchWorld;

      if (st.sniper) {
        camera.fov = st.zoomHigh ? 10 : 24;
        camera.updateProjectionMatrix();
        const sniperOrigin = st.pos.clone().add(new THREE.Vector3(0, 2.15, 0));
        camera.position.copy(sniperOrigin);
        const lookTarget = sniperOrigin.clone().add(
          new THREE.Vector3(
            Math.sin(camYaw) * Math.cos(camPitch),
            Math.sin(camPitch),
            Math.cos(camYaw) * Math.cos(camPitch)
          ).multiplyScalar(100)
        );
        camera.lookAt(lookTarget);
      } else {
        camera.fov = 54;
        camera.updateProjectionMatrix();

        const camDist = 8.2;
        const camHeight = 3.3;
        const desiredCamPos = new THREE.Vector3(
          st.pos.x - Math.sin(camYaw) * camDist,
          st.pos.y + camHeight - Math.sin(camPitch) * 2.8,
          st.pos.z - Math.cos(camYaw) * camDist
        );
        camera.position.lerp(desiredCamPos, 0.35);

        const lookPoint = new THREE.Vector3(
          st.pos.x + Math.sin(camYaw) * 45,
          st.pos.y + 1.85 + Math.sin(camPitch) * 45,
          st.pos.z + Math.cos(camYaw) * 45
        );
        camera.lookAt(lookPoint);
      }

      // 8. Update Range Targets, Moving Patrol, Burning Fire, and Turret Toss Physics
      targetsRef.current.forEach((t) => {
        if (!t.alive) {
          t.respawnTimer -= dt;
          if (t.respawnTimer <= 0) {
            t.alive = true;
            t.hp = t.maxHp;
            t.trackBroken = false;
            t.isBurning = false;
            t.turretDetached = false;
            t.damageState = createDefaultDamageState();
            t.meshGroup.visible = true;
            if (t.turretGroup) {
              t.turretGroup.position.set(0, 1.45, 0.2);
              t.turretGroup.rotation.set(0, 0, 0);
            }
          }

          // Turret Toss Physics: Tumbling in the air!
          if (t.turretDetached && t.turretGroup && t.turretVelocity && t.turretRotVelocity) {
            t.turretVelocity.y -= 14.0 * dt; // Gravity
            t.turretGroup.position.addScaledVector(t.turretVelocity, dt);
            t.turretGroup.rotation.x += t.turretRotVelocity.x * dt;
            t.turretGroup.rotation.y += t.turretRotVelocity.y * dt;
            t.turretGroup.rotation.z += t.turretRotVelocity.z * dt;

            if (t.turretGroup.position.y <= 0.6) {
              t.turretGroup.position.y = 0.6;
              t.turretVelocity.set(0, 0, 0);
              t.turretRotVelocity.set(0, 0, 0);
            }
          }
          return;
        }

        // Patrol tank movement (unless tracks broken)
        if (t.isMoving && !t.trackBroken) {
          if (t.isAirborne) {
            t.meshGroup.position.x = t.moveOriginX + Math.sin(elapsed * 0.45) * 150;
            t.meshGroup.position.z = t.moveOriginZ + Math.cos(elapsed * 0.45) * 95;
            t.meshGroup.rotation.y = elapsed * 0.45 + Math.PI * 0.5;
          } else {
            t.meshGroup.position.x = t.moveOriginX + Math.sin(elapsed * 0.35) * 60;
          }
        }
      });

      // 9. Realistic Ballistics & Penetration Hit Physics
      for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const p = projectilesRef.current[i];
        p.age += dt;

        if (p.isGuided) {
          const guideYaw = st.hullYaw + st.turretYawRel;
          const guidePitch = st.hullPitch + st.gunPitchRel;
          const desiredDir = new THREE.Vector3(
            Math.sin(guideYaw) * Math.cos(guidePitch),
            Math.sin(guidePitch),
            Math.cos(guideYaw) * Math.cos(guidePitch)
          ).normalize();
          p.velocity.lerp(desiredDir.multiplyScalar(p.velocity.length()), dt * 6.5);
        } else if (!p.isMG) {
          // Ballistic gravity drop
          p.velocity.y -= (p.ammo.type === 'APFSDS' ? 2.5 : p.ammo.type === 'HEAT-FS' ? 5.5 : 8.0) * dt;
        }

        const nextPos = p.position.clone().add(p.velocity.clone().multiplyScalar(dt));

        let hitSomething = false;
        for (const t of targetsRef.current) {
          if (!t.alive) continue;
          const targetCenter = t.meshGroup.position.clone().add(new THREE.Vector3(0, t.isAirborne ? 0 : 1.35, 0));
          const hitRadius = t.isAirborne ? 5.2 : 3.5;

          if (nextPos.distanceTo(targetCenter) <= hitRadius) {
            hitSomething = true;
            const distM = Math.round(p.startPos.distanceTo(targetCenter) * 2.5);

            // Realistic Terminal Ballistics Simulation (Post-Penetration Spall, Internal Modules & Crew Knockout)
            const shotResult = simulateShot({
              targetName: t.name,
              targetRole: t.role,
              distanceM: distM,
              ammo: p.ammo,
              worldImpactPoint: nextPos,
              worldProjectileVelocity: p.velocity,
              targetCenter,
              targetRotationY: t.meshGroup.rotation.y,
              nominalFrontArmorMm: t.armorFrontMm,
              nominalSideArmorMm: t.armorSideMm,
              currentDamageState: t.damageState || createDefaultDamageState(),
              currentHp: t.hp,
            });

            t.damageState = shotResult.finalDamageState;
            t.hp = shotResult.targetHpRemaining;

            if (shotResult.isRicochet) {
              soundEngine.playRicochet();
            } else if (shotResult.destroyed) {
              t.alive = false;
              t.respawnTimer = 7.0;

              if (shotResult.verdictType === 'destroyed_ammo' && t.turretGroup) {
                // Catastrophic Ammo Carousel Detonation: Turret Toss!
                soundEngine.playAmmoDetonation();
                t.turretDetached = true;
                t.turretVelocity = new THREE.Vector3((Math.random() - 0.5) * 4, 16.5, (Math.random() - 0.5) * 4);
                t.turretRotVelocity = new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5);
              } else {
                soundEngine.playImpact(true, true);
              }
            } else if (shotResult.penetrated) {
              // Non-lethal Penetration / Critical Hit!
              // Tank survives, but sustained internal module / crew casualties!
              soundEngine.playImpact(true, false);

              // Check if mobility or weapon compromised
              if (
                shotResult.finalDamageState.engine === 'destroyed' ||
                shotResult.finalDamageState.transmission === 'destroyed'
              ) {
                t.trackBroken = true;
              }
              if (shotResult.finalDamageState.fuelTank === 'destroyed') {
                t.isBurning = true;
              }
            } else {
              // Non-penetration / absorbed
              soundEngine.playImpact(false, false);
            }

            if (!p.isMG) {
              setSimulatedShot(shotResult);
            } else {
              // Machine Gun hit sparks & sound
              if (Math.random() < 0.25) {
                soundEngine.playRicochet();
              }
            }
            break;
          }
        }

        // Ground / Obstacle Impact
        if (hitSomething || nextPos.y <= 0.05 || p.age > 5.5) {
          if (!hitSomething && nextPos.y <= 0.05 && !p.isMG) {
            // Spawn scorched ground crater decal
            const craterTex = generateImpactCraterTexture();
            const craterGeo = new THREE.PlaneGeometry(3.2, 3.2);
            craterGeo.rotateX(-Math.PI / 2);
            const craterMat = new THREE.MeshBasicMaterial({ map: craterTex, transparent: true, opacity: 0.85, depthWrite: false });
            const crater = new THREE.Mesh(craterGeo, craterMat);
            crater.position.set(nextPos.x, 0.09, nextPos.z);
            scene.add(crater);
            setTimeout(() => scene.remove(crater), 12000);

          }

          scene.remove(p.mesh);
          projectilesRef.current.splice(i, 1);
        } else {
          p.position.copy(nextPos);
          p.mesh.position.copy(nextPos);
        }
      }

      // 10. Throttle React HUD Updates
      uiSyncAccumulator += dt;
      if (uiSyncAccumulator > 0.065) {
        uiSyncAccumulator = 0;
        const displayKmh = Math.round((st.speedMs / 0.58) * 3.6);
        setSpeedKmh(displayKmh);
        setAltitudeM(Math.round(st.pos.y * 3.5));

        const headingDeg = Math.round(((st.hullYaw * (180 / Math.PI)) % 360 + 360) % 360);
        setCompassHeading(headingDeg);

        if (displayKmh === 0) setGearLabel('N');
        else if (displayKmh < 0) setGearLabel(displayKmh < -18 ? 'R2' : 'R1');
        else setGearLabel(String(Math.min(8, Math.max(1, Math.ceil(displayKmh / 10)))));

        setRpmPct(
          displayKmh === 0
            ? 850
            : Math.min(2650, 950 + Math.round(((Math.abs(displayKmh) % 14) / 14) * 1600))
        );

        const reloadProg =
          vehicle.reloadSeconds > 0
            ? Math.min(1, 1 - st.reloadTimer / vehicle.reloadSeconds)
            : 1;
        setReloadProgress(reloadProg);
        setReloadRemainingSec(Number(st.reloadTimer.toFixed(1)));

        const yawLag = THREE.MathUtils.clamp((st.hullYaw + st.turretYawRel - st.targetYawWorld) * 45, -28, 28);
        const pitchLag = THREE.MathUtils.clamp((st.gunPitchRel - st.targetPitchWorld) * 45, -28, 28);
        setGunScreenOffset({ x: -yawLag, y: pitchLag });
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [
    vehicle,
    camoColor,
    camoRoughness,
    biome,
    thermalMode,
    createDetailedTargetTank,
    deploySmokeGrenades,
    spawnCustomTargetAhead,
    triggerLaserRangefinder,
  ]);

  // Pointer Handlers: Drag to look / Drag to aim, Tap to shoot
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input')) {
      return;
    }

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      startTime: Date.now(),
      totalDistance: 0,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.isDragging) return;

    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    drag.totalDistance += Math.hypot(dx, dy);
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;

    // Drag-to-Aim Sensitivity (Smooth 360-degree look)
    const sensitivity = sniperMode ? (zoomHigh ? 0.0012 : 0.0025) : 0.0055;
    stateRef.current.targetYawWorld -= dx * sensitivity;
    stateRef.current.targetPitchWorld = THREE.MathUtils.clamp(
      stateRef.current.targetPitchWorld - dy * (sensitivity * 0.75),
      -0.24,
      0.55
    );

    setAimScreenOffset((prev) => ({
      x: THREE.MathUtils.clamp(prev.x + dx * 0.45, -60, 60),
      y: THREE.MathUtils.clamp(prev.y + dy * 0.45, -45, 45),
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const target = e.target as HTMLElement;
    const elapsedMs = Date.now() - drag.startTime;

    // Tap to Shoot: If user tapped with minimal movement (< 12px) and didn't click HUD controls, FIRE!
    if (drag.isDragging && drag.totalDistance < 12 && elapsedMs < 400 && !target.closest('button')) {
      fireMainWeapon();
    }

    dragRef.current.isDragging = false;
    setAimScreenOffset({ x: 0, y: 0 });
  };

  const handlePointerCancel = () => {
    dragRef.current.isDragging = false;
    setAimScreenOffset({ x: 0, y: 0 });
  };

  const toggleMute = () => {
    soundEngine.muted = !muted;
    setMuted(soundEngine.muted);
  };

  return (
    <div
      className={`relative w-full h-screen overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none ${
        thermalMode ? 'contrast-125 grayscale' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
    >
      {/* 3D Proving Grounds Canvas */}
      <div ref={mountRef} className="w-full h-full" />

      {/* ==========================================================
          TOP COMPASS TAPE (DYNAMIC 360 AZIMUTH AS YOU DRAG TO AIM)
         ========================================================== */}
      <div className="pointer-events-none absolute top-2 inset-x-0 z-20 flex justify-center">
        <div className="relative flex flex-col items-center">
          <div className="flex items-center gap-9 text-xs font-mono font-bold text-white/90 drop-shadow-md">
            {[-10, -5, 0, 5, 10].map((offset) => {
              const deg = (Math.round((compassHeading + offset) / 5) * 5 + 360) % 360;
              const cardinal = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : String(deg);
              const isCenter = offset === 0;
              return (
                <span
                  key={offset}
                  className={isCenter ? 'text-sm font-extrabold text-amber-300' : 'text-slate-300'}
                >
                  {cardinal}
                </span>
              );
            })}
          </div>
          <div className="w-0.5 h-3 bg-white shadow-sm mt-0.5" />
          <div className="text-[10px] font-mono text-slate-300 mt-0.5 drop-shadow bg-black/40 px-2 py-0.5 rounded">
            WASD: Move · Drag: Look/Aim · Tap: Shoot · Space: Machine Gun
          </div>
        </div>
      </div>

      {/* ==========================================================
          AUTHENTIC WAR THUNDER MOUSE AIM CURSOR (CENTER OF SCREEN)
         ========================================================== */}
      {!sniperMode && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          {/* Outer Aim Circle ( ) with Center Dot */}
          <div
            className="w-10 h-10 rounded-full border border-white/85 flex items-center justify-center transition-transform duration-75 shadow-sm"
            style={{
              transform: `translate(${aimScreenOffset.x}px, ${aimScreenOffset.y}px)`,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>

          {/* Gun Bore Crosshair Ring (Tracks Gun Alignment) */}
          <div
            className="absolute flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${aimScreenOffset.x + gunScreenOffset.x}px, ${aimScreenOffset.y + gunScreenOffset.y}px)`,
            }}
          >
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2.5"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke={reloadProgress >= 1 ? '#22c55e' : '#f59e0b'}
                strokeWidth="2.5"
                strokeDasharray="88"
                strokeDashoffset={88 * (1 - reloadProgress)}
              />
            </svg>
            <div className="absolute w-2 h-2 border border-white rounded-full bg-amber-400" />
          </div>
        </div>
      )}

      {/* ==========================================================
          SNIPER SIGHT OPTICS OVERLAY (SHIFT)
         ========================================================== */}
      {sniperMode && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at center, transparent 38%, rgba(2, 4, 8, 0.96) 55%)',
            }}
          ></div>
          <svg className="w-[560px] h-[560px] text-emerald-400" viewBox="0 0 400 400">
            <line x1="30" y1="200" x2="185" y2="200" stroke="currentColor" strokeWidth="1.2" />
            <line x1="215" y1="200" x2="370" y2="200" stroke="currentColor" strokeWidth="1.2" />
            <line x1="200" y1="40" x2="200" y2="185" stroke="currentColor" strokeWidth="1.2" />
            <line x1="200" y1="215" x2="200" y2="370" stroke="currentColor" strokeWidth="1.2" />
            <polyline points="193,205 200,198 207,205" fill="none" stroke="currentColor" strokeWidth="1.8" />
            {[215, 235, 255, 275, 295, 320].map((y, idx) => (
              <g key={y}>
                <line x1="190" y1={y} x2="210" y2={y} stroke="currentColor" strokeWidth="1.2" />
                <text x="216" y={y + 3.5} fill="currentColor" fontSize="10" fontFamily="monospace">
                  {(idx + 1) * 2}
                </text>
              </g>
            ))}
          </svg>
          <div className="absolute top-[20%] text-center font-mono text-xs text-emerald-400 space-y-1">
            <div className="text-sm font-bold">
              {measuredRangeM ? `RANGE: ${measuredRangeM} m` : 'PRESS [R] FOR LASER RANGEFINDER'}
            </div>
            <div>ZOOM: {zoomHigh ? '12.0x' : '3.5x'} · {thermalMode ? 'FLIR WHITE-HOT' : 'OPTICAL'}</div>
          </div>
        </div>
      )}

      {/* ==========================================================
          TOP-RIGHT CONTROLS: HANGAR RETURN & SPAWN BUTTONS
         ========================================================== */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onExitToHangar}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase bg-slate-950/85 hover:bg-slate-900 border border-white/20 text-white rounded transition-colors shadow-lg cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Hangar
        </button>
        <button
          onClick={onOpenVehicleSwitcher}
          className="px-3 py-1.5 text-xs font-bold uppercase bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition-colors shadow-lg cursor-pointer"
        >
          Vehicle ({vehicle.shortName})
        </button>
        <button
          onClick={spawnCustomTargetAhead}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 border border-amber-400/40 text-amber-300 rounded transition-colors shadow-lg cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Spawn Target (U)
        </button>
        <button
          onClick={toggleMute}
          className="p-1.5 bg-slate-900/90 border border-white/20 text-slate-300 hover:text-white rounded cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ==========================================================
          MOBILE / TOUCH QUICK SHOOT TRIGGER (TAP TO SHOOT)
         ========================================================== */}
      <div className="absolute right-6 bottom-28 z-20 pointer-events-auto flex flex-col items-center gap-2">
        <button
          onClick={fireMainWeapon}
          className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-500 active:scale-95 border-2 border-red-400 text-white flex flex-col items-center justify-center shadow-2xl transition-transform cursor-pointer"
          title="Tap to Shoot (or tap anywhere on screen)"
        >
          <Crosshair className="w-6 h-6" />
          <span className="text-[9px] font-bold tracking-wider mt-0.5">FIRE</span>
        </button>
        <button
          onPointerDown={() => {
            stateRef.current.keys[' '] = true;
            setIsFiringMG(true);
          }}
          onPointerUp={() => {
            stateRef.current.keys[' '] = false;
            setIsFiringMG(false);
          }}
          onPointerLeave={() => {
            stateRef.current.keys[' '] = false;
            setIsFiringMG(false);
          }}
          className={`w-14 h-14 rounded-full border border-amber-400 text-white flex flex-col items-center justify-center shadow-lg transition-transform cursor-pointer ${
            isFiringMG ? 'bg-amber-600 scale-95' : 'bg-slate-900/80 hover:bg-slate-800'
          }`}
          title="Hold for Machine Gun (Space)"
        >
          <Zap className="w-5 h-5 text-amber-300" />
          <span className="text-[8px] font-bold mt-0.5">MG</span>
        </button>
      </div>

      {/* ==========================================================
          AUTHENTIC 3D HIT CAMERA PIP (TOP RIGHT)
          Shows full simulated shot slow-motion playback with X-Ray
         ========================================================== */}
      <HitCamera
        report={simulatedShot}
        onClose={() => setSimulatedShot(null)}
        autoCloseDurationMs={4600}
      />

      {/* ==========================================================
          BOTTOM ACTION BAR (EXACT 1-TO-1 MATCH TO IMG_1728.jpeg)
         ========================================================== */}
      <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
        {/* Top Mini Strip: Cannon ammo bar, MG ammo bar, View indicator */}
        <div className="w-full flex items-center justify-between px-2 mb-1 text-[11px] font-mono text-slate-300 drop-shadow">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-1.5 bg-amber-400 rounded-xs inline-block" />
              <span>2 ||||||||||||||||||||</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1 bg-slate-300 rounded-xs inline-block" />
              <span>4 ||||||||||||||||||||</span>
            </div>
          </div>
          <div className="text-slate-400">/ ⌕</div>
        </div>

        {/* 8 War Thunder Action Boxes Exactly Matching Screenshot */}
        <div className="flex items-center gap-1 bg-[#141820]/95 border border-slate-700/80 p-1 rounded shadow-2xl">
          {/* Box 1: Num 1 · APFSDS Dart with Sabot Petals */}
          <button
            onClick={() => setSelectedAmmoIdx(0)}
            className={`relative w-16 h-18 bg-[#181d26] border flex flex-col justify-between p-1 rounded-xs transition-colors cursor-pointer ${
              selectedAmmoIdx === 0 ? 'border-amber-400 bg-[#252f40]' : 'border-slate-700 hover:border-slate-500'
            }`}
          >
            <span className="text-[10px] font-mono font-bold text-slate-300">Num 1</span>
            <div className="flex items-center justify-center my-0.5">
              <svg className="w-7 h-7 text-amber-300" viewBox="0 0 32 32">
                <path d="M16 2 L18 8 L18 26 L16 30 L14 26 L14 8 Z" fill="currentColor" />
                <path d="M12 14 L8 22 L14 20 Z" fill="currentColor" opacity="0.7" />
                <path d="M20 14 L24 22 L18 20 Z" fill="currentColor" opacity="0.7" />
              </svg>
            </div>
            <span className="text-[10px] font-mono font-bold text-white self-end">15</span>
          </button>

          {/* Box 2: G · Smoke Grenades Dischargers (2/12) */}
          <button
            onClick={deploySmokeGrenades}
            className="relative w-16 h-18 bg-[#181d26] border border-slate-700 hover:border-slate-500 flex flex-col justify-between p-1 rounded-xs transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-mono font-bold text-slate-300">G</span>
            <div className="flex items-center justify-center my-0.5">
              <svg className="w-6 h-6 text-slate-200" viewBox="0 0 24 24">
                <rect x="6" y="8" width="6" height="12" rx="1" fill="currentColor" />
                <path d="M14 6 C16 4, 20 6, 20 10 C20 14, 16 16, 14 16 Z" fill="currentColor" opacity="0.6" />
              </svg>
            </div>
            <span className="text-[10px] font-mono font-bold text-white self-end">
              {smokeGrenadesCount > 0 ? `2/${smokeGrenadesCount}` : '0/0'}
            </span>
          </button>

          {/* Box 3: H · Engine Smoke System (ESS) */}
          <button
            onClick={() => setEssCount((c) => Math.max(0, c - 1))}
            className="relative w-16 h-18 bg-[#181d26] border border-slate-700 hover:border-slate-500 flex flex-col justify-between p-1 rounded-xs transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-mono font-bold text-slate-300">H</span>
            <div className="flex items-center justify-center my-0.5">
              <ShieldAlert className="w-6 h-6 text-slate-300" />
            </div>
            <span className="text-[10px] font-mono font-bold text-white self-end">{essCount}</span>
          </button>

          {/* Box 4: 6 · Secondary Ammunition (18) */}
          <button
            onClick={() => setSelectedAmmoIdx(1)}
            className={`relative w-16 h-18 bg-[#181d26] border flex flex-col justify-between p-1 rounded-xs transition-colors cursor-pointer ${
              selectedAmmoIdx === 1 ? 'border-amber-400 bg-[#252f40]' : 'border-slate-700 hover:border-slate-500'
            }`}
          >
            <span className="text-[10px] font-mono font-bold text-slate-300">6</span>
            <div className="flex items-center justify-center my-0.5">
              <Flame className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-[10px] font-mono font-bold text-white self-end">18</span>
          </button>

          {/* Box 5: 7 · Fire Extinguisher (FPE) Bottles */}
          <button
            onClick={() => setFpeCount((c) => Math.max(0, c - 1))}
            className="relative w-16 h-18 bg-[#181d26] border border-slate-700 hover:border-slate-500 flex flex-col justify-between p-1 rounded-xs transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-mono font-bold text-slate-300">7</span>
            <div className="flex items-center justify-center my-0.5">
              <Flame className="w-6 h-6 text-red-500" />
            </div>
            <span className="text-[10px] font-mono font-bold text-white self-end">{fpeCount}</span>
          </button>

          {/* Box 6: 1 · Tow Cable Steel Hook */}
          <button className="relative w-16 h-18 bg-[#181d26] border border-slate-700 hover:border-slate-500 flex flex-col justify-between p-1 rounded-xs transition-colors cursor-pointer">
            <span className="text-[10px] font-mono font-bold text-slate-300">1</span>
            <div className="flex items-center justify-center my-0.5">
              <svg className="w-6 h-6 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="7" r="4" />
                <path d="M12 11 v6 a4 4 0 0 0 8 0" />
              </svg>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 self-end">0</span>
          </button>

          {/* Box 7: Num 6 · Crew Medical Replenishment */}
          <button className="relative w-16 h-18 bg-[#181d26] border border-slate-700 hover:border-slate-500 flex flex-col justify-between p-1 rounded-xs transition-colors cursor-pointer">
            <span className="text-[10px] font-mono font-bold text-slate-300">Num 6</span>
            <div className="flex items-center justify-center my-0.5">
              <div className="relative">
                <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center">
                  <span className="text-[10px]">👤</span>
                </div>
                <span className="absolute -bottom-1 -right-1 text-[10px] text-emerald-400 font-bold">+</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-white self-end">1</span>
          </button>

          {/* Box 8: Num 7 · Entrenching Dozer Blade / Field Repair */}
          <button className="relative w-16 h-18 bg-[#181d26] border border-slate-700 hover:border-slate-500 flex flex-col justify-between p-1 rounded-xs transition-colors cursor-pointer">
            <span className="text-[10px] font-mono font-bold text-slate-300">Num 7</span>
            <div className="flex items-center justify-center my-0.5">
              <svg className="w-6 h-6 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 18 L22 18 L20 14 L4 14 Z" />
                <rect x="6" y="8" width="12" height="6" />
              </svg>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 self-end">RDY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
