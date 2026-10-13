import * as THREE from 'three';
import { AmmoSpec, AmmoType } from '../data/vehicles';

export type ComponentHealth = 'intact' | 'damaged' | 'destroyed' | 'unconscious';

export interface InternalComponentDef {
  id: string;
  name: string;
  type: 'crew' | 'module';
  center: THREE.Vector3;
  size?: THREE.Vector3; // For box collision
  radius?: number;      // For sphere collision
}

export interface TargetDamageState {
  driver: ComponentHealth;
  gunner: ComponentHealth;
  commander: ComponentHealth;
  loader: ComponentHealth;
  engine: ComponentHealth;
  transmission: ComponentHealth;
  gunBreech: ComponentHealth;
  turretRing: ComponentHealth;
  ammoRack: ComponentHealth;
  fuelTank: ComponentHealth;
}

export function createDefaultDamageState(): TargetDamageState {
  return {
    driver: 'intact',
    gunner: 'intact',
    commander: 'intact',
    loader: 'intact',
    engine: 'intact',
    transmission: 'intact',
    gunBreech: 'intact',
    turretRing: 'intact',
    ammoRack: 'intact',
    fuelTank: 'intact',
  };
}

// Standard internal component layout for tanks (local coords: +Z forward, +Y up, +X right)
export const TANK_INTERNAL_COMPONENTS: InternalComponentDef[] = [
  // Crew members
  { id: 'driver', name: 'Driver', type: 'crew', center: new THREE.Vector3(0.0, 0.95, 1.65), radius: 0.36 },
  { id: 'gunner', name: 'Gunner', type: 'crew', center: new THREE.Vector3(-0.52, 1.48, 0.15), radius: 0.36 },
  { id: 'commander', name: 'Commander', type: 'crew', center: new THREE.Vector3(-0.52, 1.72, -0.45), radius: 0.36 },
  { id: 'loader', name: 'Loader', type: 'crew', center: new THREE.Vector3(0.52, 1.52, 0.1), radius: 0.36 },

  // Internal Modules
  { id: 'ammoRack', name: 'Ammo Stowage', type: 'module', center: new THREE.Vector3(0.0, 0.62, -0.15), size: new THREE.Vector3(1.3, 0.48, 1.2) },
  { id: 'engine', name: 'Engine Block', type: 'module', center: new THREE.Vector3(0.0, 0.92, -1.82), size: new THREE.Vector3(1.25, 0.78, 1.5) },
  { id: 'transmission', name: 'Transmission', type: 'module', center: new THREE.Vector3(0.0, 0.58, 2.25), size: new THREE.Vector3(1.15, 0.52, 0.75) },
  { id: 'fuelTank', name: 'Fuel Tanks', type: 'module', center: new THREE.Vector3(1.08, 0.82, -0.65), size: new THREE.Vector3(0.48, 0.62, 1.85) },
  { id: 'gunBreech', name: 'Gun Breech', type: 'module', center: new THREE.Vector3(0.0, 1.62, 0.75), size: new THREE.Vector3(0.65, 0.55, 0.88) },
  { id: 'turretRing', name: 'Turret Traverse Ring', type: 'module', center: new THREE.Vector3(0.0, 1.25, 0.15), size: new THREE.Vector3(1.85, 0.22, 1.85) },
];

export interface SpallRay {
  start: [number, number, number];
  end: [number, number, number];
  hitComponentId?: string;
  isJet?: boolean;
}

export interface DamagedComponentReport {
  id: string;
  name: string;
  type: 'crew' | 'module';
  previousState: ComponentHealth;
  newState: ComponentHealth;
}

export interface SimulatedShotResult {
  id: number;
  targetName: string;
  targetRole: string;
  distanceM: number;
  ammoName: string;
  ammoType: AmmoType;
  impactAngleDeg: number;
  penetrationMm: number;
  effectiveArmorMm: number;
  penetrated: boolean;
  isRicochet: boolean;
  destroyed: boolean;
  statusTitle: string;
  verdictType: 'destroyed_ammo' | 'destroyed_crew' | 'destroyed_fire' | 'critical' | 'hit' | 'ricochet' | 'non_pen';
  damagedModules: string[];
  crewKnockedOut: string[];
  survivingCrewCount: number;
  totalCrewCount: number;
  targetHpRemaining: number;

  // 3D Visual Playback Payload for Hit Cam
  localImpactPoint: [number, number, number];
  localIncomingDir: [number, number, number];
  detonationPoint?: [number, number, number];
  spallRays: SpallRay[];
  hitComponents: DamagedComponentReport[];
  initialDamageState: TargetDamageState;
  finalDamageState: TargetDamageState;
}

/**
 * Checks ray intersection with a sphere (crew member)
 */
function rayIntersectsSphere(rayOrigin: THREE.Vector3, rayDir: THREE.Vector3, sphereCenter: THREE.Vector3, radius: number): { hit: boolean; dist: number } {
  const oc = rayOrigin.clone().sub(sphereCenter);
  const a = rayDir.dot(rayDir);
  const b = 2.0 * oc.dot(rayDir);
  const c = oc.dot(oc) - radius * radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return { hit: false, dist: 0 };
  const t = (-b - Math.sqrt(discriminant)) / (2.0 * a);
  if (t > 0) return { hit: true, dist: t };
  const t2 = (-b + Math.sqrt(discriminant)) / (2.0 * a);
  if (t2 > 0) return { hit: true, dist: t2 };
  return { hit: false, dist: 0 };
}

/**
 * Checks ray intersection with an Axis-Aligned Box (internal module)
 */
function rayIntersectsBox(rayOrigin: THREE.Vector3, rayDir: THREE.Vector3, boxCenter: THREE.Vector3, boxSize: THREE.Vector3): { hit: boolean; dist: number } {
  const min = boxCenter.clone().sub(boxSize.clone().multiplyScalar(0.5));
  const max = boxCenter.clone().add(boxSize.clone().multiplyScalar(0.5));

  let tmin = -Infinity;
  let tmax = Infinity;

  const axes = ['x', 'y', 'z'] as const;
  for (const axis of axes) {
    const dir = rayDir[axis];
    const orig = rayOrigin[axis];
    if (Math.abs(dir) < 1e-6) {
      if (orig < min[axis] || orig > max[axis]) return { hit: false, dist: 0 };
    } else {
      let t1 = (min[axis] - orig) / dir;
      let t2 = (max[axis] - orig) / dir;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax || tmax < 0) return { hit: false, dist: 0 };
    }
  }

  return { hit: tmax > 0, dist: Math.max(0, tmin) };
}

/**
 * Simulates a realistic shot like War Thunder:
 * - Calculates exact impact angle, Line-of-Sight armor, and penetration.
 * - Traces projectile into interior and simulates post-penetration effects (spall cone, APHE fuse detonation, HEAT jet).
 * - Collides fragments against crew and modules.
 * - Enforces realistic kill conditions:
 *   - Destroyed only if ammo detonates or < 2 crew survive.
 *   - Otherwise: Critical Hit or Hit, with specific component damage!
 */
export function simulateShot({
  targetName,
  targetRole,
  distanceM,
  ammo,
  worldImpactPoint,
  worldProjectileVelocity,
  targetCenter,
  targetRotationY,
  nominalFrontArmorMm,
  nominalSideArmorMm,
  currentDamageState,
  currentHp,
}: {
  targetName: string;
  targetRole: string;
  distanceM: number;
  ammo: AmmoSpec;
  worldImpactPoint: THREE.Vector3;
  worldProjectileVelocity: THREE.Vector3;
  targetCenter: THREE.Vector3;
  targetRotationY: number;
  nominalFrontArmorMm: number;
  nominalSideArmorMm: number;
  currentDamageState: TargetDamageState;
  currentHp: number;
}): SimulatedShotResult {
  const id = Date.now();

  // 1. Transform World to Target Local Coordinate Space
  const localImpact = worldImpactPoint.clone().sub(targetCenter).applyAxisAngle(new THREE.Vector3(0, 1, 0), -targetRotationY);
  const localIncomingDir = worldProjectileVelocity.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), -targetRotationY);

  // Approximate surface normal based on impact location
  const surfaceNormal = new THREE.Vector3();
  let baseNominalMm = nominalFrontArmorMm;

  if (localImpact.z > 1.2) {
    // Front Glacis / Lower Plate
    surfaceNormal.set(0, 0.45, 0.89).normalize();
    baseNominalMm = nominalFrontArmorMm;
  } else if (localImpact.z < -1.6) {
    // Rear Plate
    surfaceNormal.set(0, 0.1, -0.99).normalize();
    baseNominalMm = Math.max(30, Math.round(nominalSideArmorMm * 0.55));
  } else if (Math.abs(localImpact.x) > 1.25) {
    // Side Hull / Skirts
    surfaceNormal.set(Math.sign(localImpact.x), 0, 0).normalize();
    baseNominalMm = nominalSideArmorMm;
  } else {
    // Turret Front / Cheeks / Roof
    surfaceNormal.set(localImpact.x * 0.3, 0.3, localImpact.z * 0.3 + 0.6).normalize();
    baseNominalMm = Math.round((nominalFrontArmorMm + nominalSideArmorMm) * 0.5);
  }

  // Calculate True Impact Angle
  const cosAngle = Math.abs(localIncomingDir.dot(surfaceNormal));
  const impactAngleDeg = Math.round(Math.acos(Math.min(1, Math.max(0.08, cosAngle))) * (180 / Math.PI));

  // Oblique Ricochet Check: angles >= 68° glance off (except HEAT and HE)
  const isRicochet =
    impactAngleDeg >= 68 &&
    ammo.type !== 'HEAT-FS' &&
    ammo.type !== 'HE' &&
    ammo.type !== 'HESH' &&
    ammo.type !== 'ATGM';

  const effectiveArmorMm = Math.round(baseNominalMm / Math.max(0.18, cosAngle));
  const penetrated =
    !isRicochet &&
    (ammo.penetrationMm >= effectiveArmorMm ||
      (ammo.type === 'HE' && ammo.explosiveMassKg >= 2.8) ||
      ammo.type === 'HESH');

  const initialDamage = { ...currentDamageState };
  const updatedDamage = { ...currentDamageState };

  const hitComponents: DamagedComponentReport[] = [];
  const spallRays: SpallRay[] = [];
  let detonationPoint: [number, number, number] | undefined;

  let destroyed = false;
  let statusTitle = 'NON-PENETRATION';
  let verdictType: SimulatedShotResult['verdictType'] = 'non_pen';
  let targetHpRemaining = currentHp;

  if (isRicochet) {
    statusTitle = `RICOCHET (${impactAngleDeg}°)`;
    verdictType = 'ricochet';
  } else if (!penetrated) {
    statusTitle = `NON-PENETRATION (${ammo.penetrationMm}mm < ${effectiveArmorMm}mm)`;
    verdictType = 'non_pen';
    targetHpRemaining = Math.max(1, currentHp - 2);
  } else {
    // ========================================================
    // PENETRATION OCCURRED: RUN INTERIOR BALLISTIC SIMULATION
    // ========================================================
    const penDir = localIncomingDir.clone();

    // 1. Terminal Ballistics Setup
    let travelDist = 0.8;
    const raySpreadCount = ammo.type === 'APHE' ? 24 : ammo.type === 'APFSDS' ? 18 : ammo.type === 'HEAT-FS' ? 14 : 20;

    if (ammo.type === 'APHE') {
      // APHE travels ~0.75m inside then detonates in a spherical shrapnel explosion
      travelDist = THREE.MathUtils.clamp(0.65 + Math.random() * 0.35, 0.4, 1.4);
      const detPos = localImpact.clone().add(penDir.clone().multiplyScalar(travelDist));
      detonationPoint = [detPos.x, detPos.y, detPos.z];

      // Spherical fragment cloud (360 degrees)
      for (let i = 0; i < raySpreadCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const rDir = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        ).normalize();
        const rayLen = 1.6 + Math.random() * 1.5;
        const rayEnd = detPos.clone().add(rDir.clone().multiplyScalar(rayLen));
        spallRays.push({
          start: [detPos.x, detPos.y, detPos.z],
          end: [rayEnd.x, rayEnd.y, rayEnd.z],
        });
      }
    } else if (ammo.type === 'HEAT-FS' || ammo.type === 'ATGM') {
      // Shaped charge superheated metal jet: Focused piercing beam through the tank
      const jetOrigin = localImpact.clone();
      const jetLength = 3.6;
      const jetEnd = jetOrigin.clone().add(penDir.clone().multiplyScalar(jetLength));
      spallRays.push({
        start: [jetOrigin.x, jetOrigin.y, jetOrigin.z],
        end: [jetEnd.x, jetEnd.y, jetEnd.z],
        isJet: true,
      });

      // Secondary spall cone around jet
      for (let i = 0; i < raySpreadCount; i++) {
        const angle = (Math.random() - 0.5) * 0.38;
        const pitch = (Math.random() - 0.5) * 0.38;
        const rDir = penDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch).normalize();
        const rayLen = 2.0 + Math.random() * 1.2;
        const rayEnd = jetOrigin.clone().add(rDir.multiplyScalar(rayLen));
        spallRays.push({
          start: [jetOrigin.x, jetOrigin.y, jetOrigin.z],
          end: [rayEnd.x, rayEnd.y, rayEnd.z],
        });
      }
    } else {
      // APFSDS / AP / APCR: Kinetic penetrator rod + forward conical spall cone
      const entryOrigin = localImpact.clone();
      const coreLength = 3.2;
      const coreEnd = entryOrigin.clone().add(penDir.clone().multiplyScalar(coreLength));
      spallRays.push({
        start: [entryOrigin.x, entryOrigin.y, entryOrigin.z],
        end: [coreEnd.x, coreEnd.y, coreEnd.z],
        isJet: true,
      });

      // Forward cone (~35 degree cone)
      for (let i = 0; i < raySpreadCount; i++) {
        const spreadX = (Math.random() - 0.5) * 0.62;
        const spreadY = (Math.random() - 0.5) * 0.52;
        const rDir = penDir.clone().add(new THREE.Vector3(spreadX, spreadY, 0)).normalize();
        const rayLen = 1.8 + Math.random() * 1.6;
        const rayEnd = entryOrigin.clone().add(rDir.multiplyScalar(rayLen));
        spallRays.push({
          start: [entryOrigin.x, entryOrigin.y, entryOrigin.z],
          end: [rayEnd.x, rayEnd.y, rayEnd.z],
        });
      }
    }

    // 2. Test Collision of Each Ray Against Internal Components
    const hitsCount: Record<string, number> = {};

    spallRays.forEach((ray) => {
      const rStart = new THREE.Vector3(...ray.start);
      const rEnd = new THREE.Vector3(...ray.end);
      const rDir = rEnd.clone().sub(rStart).normalize();
      const maxDist = rStart.distanceTo(rEnd);

      let closestComp: InternalComponentDef | null = null;
      let closestDist = maxDist;

      for (const comp of TANK_INTERNAL_COMPONENTS) {
        if (comp.type === 'crew' && comp.radius) {
          const res = rayIntersectsSphere(rStart, rDir, comp.center, comp.radius);
          if (res.hit && res.dist < closestDist) {
            closestDist = res.dist;
            closestComp = comp;
          }
        } else if (comp.type === 'module' && comp.size) {
          const res = rayIntersectsBox(rStart, rDir, comp.center, comp.size);
          if (res.hit && res.dist < closestDist) {
            closestDist = res.dist;
            closestComp = comp;
          }
        }
      }

      if (closestComp) {
        ray.hitComponentId = closestComp.id;
        hitsCount[closestComp.id] = (hitsCount[closestComp.id] || 0) + 1;
        // Truncate ray visually at collision point
        const impactVec = rStart.clone().add(rDir.multiplyScalar(closestDist));
        ray.end = [impactVec.x, impactVec.y, impactVec.z];
      }
    });

    // 3. Resolve Damage State & Casualties
    let ammoDetonated = false;
    let fuelFireStarted = false;

    for (const comp of TANK_INTERNAL_COMPONENTS) {
      const hits = hitsCount[comp.id] || 0;
      if (hits <= 0) continue;

      const compKey = comp.id as keyof TargetDamageState;
      const prev = updatedDamage[compKey];

      if (comp.type === 'crew') {
        if (prev !== 'unconscious') {
          // Direct hit by fragments/dart causes crew knockout
          updatedDamage[compKey] = 'unconscious';
          hitComponents.push({
            id: comp.id,
            name: comp.name,
            type: 'crew',
            previousState: prev,
            newState: 'unconscious',
          });
        }
      } else {
        // Module damage
        if (comp.id === 'ammoRack') {
          // Ammo rack detonation roll:
          // APHE: 85% chance if hit, APFSDS: 55% chance, HEAT: 80% chance
          const detChance = ammo.type === 'APHE' ? 0.85 : ammo.type === 'HEAT-FS' ? 0.8 : 0.55;
          if (Math.random() < detChance) {
            ammoDetonated = true;
            updatedDamage.ammoRack = 'destroyed';
            hitComponents.push({
              id: comp.id,
              name: 'Ammo Rack (Detonated)',
              type: 'module',
              previousState: prev,
              newState: 'destroyed',
            });
          } else {
            updatedDamage.ammoRack = 'damaged';
            hitComponents.push({
              id: comp.id,
              name: 'Ammo Rack (Damaged)',
              type: 'module',
              previousState: prev,
              newState: 'damaged',
            });
          }
        } else if (comp.id === 'fuelTank') {
          fuelFireStarted = Math.random() < 0.65;
          updatedDamage.fuelTank = fuelFireStarted ? 'destroyed' : 'damaged';
          hitComponents.push({
            id: comp.id,
            name: fuelFireStarted ? 'Fuel Tank (Fire Started)' : 'Fuel Tank (Ruptured)',
            type: 'module',
            previousState: prev,
            newState: fuelFireStarted ? 'destroyed' : 'damaged',
          });
        } else {
          updatedDamage[compKey] = 'destroyed';
          hitComponents.push({
            id: comp.id,
            name: comp.name,
            type: 'module',
            previousState: prev,
            newState: 'destroyed',
          });
        }
      }
    }

    // Fallback: If penetration occurred in an empty zone (e.g. upper turret or track),
    // ensure at least 1 module/crew is scratched if shot passed near center
    if (hitComponents.length === 0) {
      if (Math.random() < 0.6) {
        updatedDamage.gunBreech = 'damaged';
        hitComponents.push({
          id: 'gunBreech',
          name: 'Gun Breech (Damaged)',
          type: 'module',
          previousState: initialDamage.gunBreech,
          newState: 'damaged',
        });
      } else {
        updatedDamage.turretRing = 'damaged';
        hitComponents.push({
          id: 'turretRing',
          name: 'Turret Ring (Jammed)',
          type: 'module',
          previousState: initialDamage.turretRing,
          newState: 'damaged',
        });
      }
    }

    // 4. Calculate Surviving Crew Count
    const crewMembers: (keyof TargetDamageState)[] = ['driver', 'gunner', 'commander', 'loader'];
    const survivingCrew = crewMembers.filter((c) => updatedDamage[c] !== 'unconscious').length;

    // 5. Authentic Real-Game Kill Conditions (DOES NOT KILL OUTRIGHT ON PEN!)
    // Target is destroyed ONLY IF:
    // a) Ammo rack detonated
    // b) Surviving crew < 2 (cannot operate tank with only 1 or 0 crew)
    if (ammoDetonated) {
      destroyed = true;
      verdictType = 'destroyed_ammo';
      statusTitle = 'AMMO RACK DETONATION · TARGET DESTROYED';
      targetHpRemaining = 0;
    } else if (survivingCrew < 2) {
      destroyed = true;
      verdictType = 'destroyed_crew';
      statusTitle = `CREW KNOCKED OUT (${survivingCrew}/4 LEFT) · TARGET DESTROYED`;
      targetHpRemaining = 0;
    } else {
      // TARGET IS NOT DESTROYED OUTRIGHT!
      // This is a CRITICAL HIT or HIT with real sustained damage!
      destroyed = false;
      verdictType = 'critical';

      const knockedCrewNames = hitComponents.filter((c) => c.type === 'crew').map((c) => c.name);
      if (knockedCrewNames.length > 0) {
        statusTitle = `CRITICAL HIT: ${knockedCrewNames.join(' & ').toUpperCase()} KNOCKED OUT`;
      } else if (updatedDamage.engine === 'destroyed') {
        statusTitle = 'CRITICAL HIT: ENGINE DESTROYED (IMMOBILIZED)';
      } else if (updatedDamage.gunBreech === 'destroyed') {
        statusTitle = 'CRITICAL HIT: GUN BREECH DESTROYED';
      } else if (fuelFireStarted) {
        statusTitle = 'CRITICAL HIT: FUEL FIRE STARTED';
      } else {
        statusTitle = 'CRITICAL HIT: INTERIOR SPALL DAMAGE';
      }

      // Decrement HP based on damage sustained, but clamp to at least 15% HP so target survives
      const damagePoints = Math.round(ammo.damageRating * 0.45 + hitComponents.length * 15);
      targetHpRemaining = Math.max(15, currentHp - damagePoints);
    }
  }

  // Compile Damaged Modules & Crew Lists for HUD Badges
  const damagedModules = hitComponents.map((c) =>
    c.type === 'crew' ? `${c.name} knocked out` : `${c.name} ${c.newState}`
  );
  if (damagedModules.length === 0) {
    damagedModules.push(isRicochet ? 'Armor deflected incoming shell' : 'Armor absorbed kinetic impact');
  }

  const crewKnockedOut = hitComponents
    .filter((c) => c.type === 'crew')
    .map((c) => c.name);

  const finalSurvivingCrew = ['driver', 'gunner', 'commander', 'loader'].filter(
    (c) => updatedDamage[c as keyof TargetDamageState] !== 'unconscious'
  ).length;

  return {
    id,
    targetName,
    targetRole,
    distanceM,
    ammoName: ammo.name,
    ammoType: ammo.type,
    impactAngleDeg,
    penetrationMm: ammo.penetrationMm,
    effectiveArmorMm,
    penetrated,
    isRicochet,
    destroyed,
    statusTitle,
    verdictType,
    damagedModules,
    crewKnockedOut,
    survivingCrewCount: finalSurvivingCrew,
    totalCrewCount: 4,
    targetHpRemaining,
    localImpactPoint: [localImpact.x, localImpact.y, localImpact.z],
    localIncomingDir: [localIncomingDir.x, localIncomingDir.y, localIncomingDir.z],
    detonationPoint,
    spallRays,
    hitComponents,
    initialDamageState: initialDamage,
    finalDamageState: updatedDamage,
  };
}
