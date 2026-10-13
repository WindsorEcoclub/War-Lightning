export type NationId =
  | 'usa'
  | 'germany'
  | 'ussr'
  | 'uk'
  | 'japan'
  | 'china'
  | 'italy'
  | 'france'
  | 'sweden'
  | 'israel';

export type BranchId = 'army' | 'aviation' | 'helicopters' | 'fleet';

export type RankRoman = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII';

export type AmmoType = 'APFSDS' | 'HEAT-FS' | 'APHE' | 'APCR' | 'HE' | 'ATGM' | 'HESH' | 'AAM' | 'CANNON' | 'SAP';

export interface AmmoSpec {
  id: string;
  name: string;
  type: AmmoType;
  penetrationMm: number; // at 0 deg 100m
  velocityMs: number;
  explosiveMassKg: number;
  damageRating: number;
  description: string;
}

export interface VehicleSpec {
  id: string;
  name: string;
  shortName: string;
  nation: NationId;
  branch: BranchId;
  rank: RankRoman;
  rankNum: number; // 1-8
  column: number; // 0-4 in tech tree grid
  br: string; // e.g., "11.7", "5.7"
  role: string; // e.g., "Main Battle Tank", "Heavy Tank", "Jet Fighter", "Attack Helicopter", "Battleship"
  isPremium?: boolean;
  isSquadron?: boolean;
  year: number;
  crewCount: number;
  // Armament
  mainGunName: string;
  caliberMm: number;
  reloadSeconds: number;
  turretTraverseDegPerSec: number;
  depressionDeg: number;
  elevationDeg: number;
  stabilizer: 'None' | 'Vertical' | 'Two-Plane';
  hasLaserRangefinder: boolean;
  thermalGen: 'None' | 'NVG' | 'Gen 1' | 'Gen 2' | 'Gen 3';
  secondaryWeapons: string;
  ammoLoadout: AmmoSpec[];
  // Armor (in mm RHAe)
  armor: {
    hullFront: number;
    hullSide: number;
    hullRear: number;
    turretFront: number;
    turretSide: number;
    turretRear: number;
    composition: string;
  };
  // Mobility
  mobility: {
    maxSpeedForwardKmh: number;
    maxSpeedReverseKmh: number;
    horsepower: number;
    weightTons: number;
    powerToWeight: number;
    engineName: string;
  };
  // 3D Procedural Appearance Hints
  visual: {
    baseColor: string;
    accentColor: string;
    hullArchetype:
      | 'ww2_medium'
      | 'ww2_heavy'
      | 'modern_mbt_western'
      | 'modern_mbt_eastern'
      | 'light_ifv'
      | 'spaa_radar'
      | 'casemate_td'
      | 'wheeled_striker'
      | 'jet_swept'
      | 'jet_delta'
      | 'prop_fighter'
      | 'heli_attack'
      | 'heli_coaxial'
      | 'naval_battleship'
      | 'naval_cruiser';
    barrelCount: 1 | 2 | 4 | 9;
    hasERA: boolean;
    hasRadar: boolean;
    hasAutoloader: boolean;
    lengthScale: number;
    widthScale: number;
    heightScale: number;
  };
}

export interface NationInfo {
  id: NationId;
  name: string;
  code: string;
  flagColors: [string, string, string];
  motto: string;
}

export const NATIONS: NationInfo[] = [
  { id: 'usa', name: 'USA', code: 'US', flagColors: ['#1d4ed8', '#ffffff', '#dc2626'], motto: 'Combined Arms & Air Superiority' },
  { id: 'germany', name: 'Germany', code: 'DE', flagColors: ['#18181b', '#dc2626', '#eab308'], motto: 'Precision Optics & High-Velocity Armor' },
  { id: 'ussr', name: 'USSR / Russia', code: 'RU', flagColors: ['#dc2626', '#b91c1c', '#f59e0b'], motto: 'Low Silhouette, ERA & Relentless Firepower' },
  { id: 'uk', name: 'Great Britain', code: 'GB', flagColors: ['#1e3a8a', '#ffffff', '#dc2626'], motto: 'Chobham Composite & Royal Navy Dreadnoughts' },
  { id: 'japan', name: 'Japan', code: 'JP', flagColors: ['#ffffff', '#dc2626', '#f8fafc'], motto: 'Hydropneumatic Suspension & Rapid Autoloaders' },
  { id: 'china', name: 'China', code: 'CN', flagColors: ['#dc2626', '#facc15', '#b91c1c'], motto: 'Eastern & Western Hybrid Doctrine' },
  { id: 'italy', name: 'Italy', code: 'IT', flagColors: ['#16a34a', '#ffffff', '#dc2626'], motto: 'High-Speed Wheeled Tank Destroyers' },
  { id: 'france', name: 'France', code: 'FR', flagColors: ['#1d4ed8', '#ffffff', '#dc2626'], motto: 'Oscillating Turrets & High-Speed Flanking' },
  { id: 'sweden', name: 'Sweden', code: 'SE', flagColors: ['#0284c7', '#facc15', '#0369a1'], motto: 'Wedge Hulls, Fin-Stabilized Sabot & Gripen' },
  { id: 'israel', name: 'Israel', code: 'IL', flagColors: ['#ffffff', '#2563eb', '#ffffff'], motto: 'Front-Engine Crew Protection & Active Defense' },
];

export const BRANCHES: { id: BranchId; label: string; subtitle: string }[] = [
  { id: 'army', label: 'Army', subtitle: 'Tanks, IFVs, Tank Destroyers & SPAA' },
  { id: 'aviation', label: 'Aviation', subtitle: 'Prop Fighters, Supersonic Jets & Strike' },
  { id: 'helicopters', label: 'Helicopters', subtitle: 'Attack & Scout Rotorcraft' },
  { id: 'fleet', label: 'Bluewater Fleet', subtitle: 'Battleships, Cruisers & Destroyers' },
];

export const CAMOUFLAGES = [
  { id: 'standard', name: 'Standard Factory', primary: null, roughness: 0.72 },
  { id: 'nato_carc', name: 'NATO Three-Tone CARC', primary: '#44503B', roughness: 0.78 },
  { id: 'desert_storm', name: 'Sinai Desert Sand', primary: '#C2A878', roughness: 0.82 },
  { id: 'winter_arctic', name: 'Arctic Whitewash', primary: '#D8DEE9', roughness: 0.65 },
  { id: 'late_ambush', name: 'Late-War Ochre Ambush', primary: '#8C6D46', roughness: 0.75 },
  { id: 'parade_obsidian', name: 'Obsidian Proving Grounds', primary: '#262B33', roughness: 0.52 },
];

import { ADDITIONAL_TECH_TREE_TANKS } from './tanksCatalog';

const BASE_VEHICLES: VehicleSpec[] = [
  // ==========================================
  // USA - ARMY
  // ==========================================
  {
    id: 'us_m4a3e8_76w',
    name: 'M4A3 (76) W HVSS Sherman "Easy Eight"',
    shortName: 'M4A3 (76) W',
    nation: 'usa',
    branch: 'army',
    rank: 'III',
    rankNum: 3,
    column: 0,
    br: '5.7',
    role: 'Medium Tank',
    year: 1944,
    crewCount: 5,
    mainGunName: '76 mm M1A2 Cannon',
    caliberMm: 76,
    reloadSeconds: 5.9,
    turretTraverseDegPerSec: 24,
    depressionDeg: -10,
    elevationDeg: 25,
    stabilizer: 'Vertical',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '12.7 mm M2HB + 7.62 mm M1919A4',
    ammoLoadout: [
      { id: 'm62', name: 'M62 Shot (APCBC)', type: 'APHE', penetrationMm: 149, velocityMs: 792, explosiveMassKg: 0.065, damageRating: 82, description: 'Capped armor-piercing shell with explosive filler for lethal post-penetration spalling.' },
      { id: 'm93', name: 'M93 Shot (APCR)', type: 'APCR', penetrationMm: 190, velocityMs: 1036, explosiveMassKg: 0, damageRating: 58, description: 'High-velocity sub-caliber tungsten core for flat thick armor.' },
      { id: 'm42a1', name: 'M42A1 Shell (HE)', type: 'HE', penetrationMm: 10, velocityMs: 823, explosiveMassKg: 0.39, damageRating: 45, description: 'High-explosive fragmentation round for open-topped targets.' }
    ],
    armor: { hullFront: 63, hullSide: 38, hullRear: 38, turretFront: 89, turretSide: 63, turretRear: 63, composition: 'Rolled Homogeneous Armor (47° Glacis)' },
    mobility: { maxSpeedForwardKmh: 48, maxSpeedReverseKmh: -6, horsepower: 500, weightTons: 32.3, powerToWeight: 15.5, engineName: 'Ford GAA V8' },
    visual: { baseColor: '#4B5338', accentColor: '#2E3422', hullArchetype: 'ww2_medium', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 0.95, widthScale: 0.95, heightScale: 1.08 }
  },
  {
    id: 'us_m18_hellcat',
    name: 'M18 GMC "Hellcat"',
    shortName: 'M18 GMC',
    nation: 'usa',
    branch: 'army',
    rank: 'III',
    rankNum: 3,
    column: 2,
    br: '6.0',
    role: 'Tank Destroyer',
    year: 1943,
    crewCount: 5,
    mainGunName: '76 mm M1A2 Cannon',
    caliberMm: 76,
    reloadSeconds: 6.2,
    turretTraverseDegPerSec: 24,
    depressionDeg: -10,
    elevationDeg: 20,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '12.7 mm M2HB Roof AA',
    ammoLoadout: [
      { id: 'm62', name: 'M62 Shot (APCBC)', type: 'APHE', penetrationMm: 149, velocityMs: 792, explosiveMassKg: 0.065, damageRating: 82, description: 'Capped armor-piercing shell with explosive filler.' },
      { id: 'm93', name: 'M93 Shot (APCR)', type: 'APCR', penetrationMm: 190, velocityMs: 1036, explosiveMassKg: 0, damageRating: 58, description: 'High-velocity sub-caliber tungsten core.' }
    ],
    armor: { hullFront: 13, hullSide: 13, hullRear: 13, turretFront: 25, turretSide: 13, turretRear: 13, composition: 'Light Rolled Steel' },
    mobility: { maxSpeedForwardKmh: 80, maxSpeedReverseKmh: -23, horsepower: 460, weightTons: 17.7, powerToWeight: 26.0, engineName: 'Continental R-975 Radial' },
    visual: { baseColor: '#525A3C', accentColor: '#353A26', hullArchetype: 'light_ifv', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 0.9, widthScale: 0.9, heightScale: 0.92 }
  },
  {
    id: 'us_t34_heavy',
    name: 'Heavy Tank T34',
    shortName: 'T34',
    nation: 'usa',
    branch: 'army',
    rank: 'IV',
    rankNum: 4,
    column: 1,
    br: '6.7',
    role: 'Heavy Tank',
    year: 1945,
    crewCount: 6,
    mainGunName: '120 mm T53E1 Cannon',
    caliberMm: 120,
    reloadSeconds: 14.9,
    turretTraverseDegPerSec: 18,
    depressionDeg: -10,
    elevationDeg: 15,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '3 × 12.7 mm M2HB Heavy Machine Guns',
    ammoLoadout: [
      { id: 't14e3', name: 'T14E3 Shot (APBC)', type: 'APHE', penetrationMm: 283, velocityMs: 945, explosiveMassKg: 0, damageRating: 91, description: 'Massive 23 kg solid armor-piercing slug creating devastating spall cones.' },
      { id: 't17e1', name: 'T17E1 Shot (APCR)', type: 'APCR', penetrationMm: 322, velocityMs: 1143, explosiveMassKg: 0, damageRating: 65, description: 'Hyper-velocity tungsten core.' }
    ],
    armor: { hullFront: 102, hullSide: 76, hullRear: 51, turretFront: 203, turretSide: 152, turretRear: 203, composition: 'Cast & Rolled Heavy Steel (298mm Mantlet)' },
    mobility: { maxSpeedForwardKmh: 35, maxSpeedReverseKmh: -13, horsepower: 810, weightTons: 65.1, powerToWeight: 12.4, engineName: 'Continental AV-1790-3 V12' },
    visual: { baseColor: '#475038', accentColor: '#2B3122', hullArchetype: 'ww2_heavy', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 1.15, widthScale: 1.1, heightScale: 1.05 }
  },
  {
    id: 'us_m3a3_bradley',
    name: 'M3A3 Bradley CFV',
    shortName: 'M3A3 Bradley',
    nation: 'usa',
    branch: 'army',
    rank: 'VII',
    rankNum: 7,
    column: 2,
    br: '10.0',
    role: 'Light Tank / IFV',
    year: 2000,
    crewCount: 3,
    mainGunName: '25 mm M242 Bushmaster + Dual TOW-2B Launcher',
    caliberMm: 25,
    reloadSeconds: 0.3,
    turretTraverseDegPerSec: 48,
    depressionDeg: -9,
    elevationDeg: 59,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 2',
    secondaryWeapons: 'BGM-71F TOW-2B Top-Attack ATGM + 7.62 mm M240',
    ammoLoadout: [
      { id: 'm919', name: 'M919 (APFSDS-T)', type: 'APFSDS', penetrationMm: 101, velocityMs: 1385, explosiveMassKg: 0, damageRating: 48, description: 'Depleted uranium autocannon dart belt firing at 200 rpm.' },
      { id: 'tow2b', name: 'BGM-71F TOW-2B (Top-Attack ATGM)', type: 'ATGM', penetrationMm: 800, velocityMs: 329, explosiveMassKg: 6.14, damageRating: 96, description: 'Tandem-warhead wire/wireless guided missile.' }
    ],
    armor: { hullFront: 38, hullSide: 32, hullRear: 25, turretFront: 38, turretSide: 32, turretRear: 25, composition: 'Spaced Laminate Aluminum + Steel Appliqué' },
    mobility: { maxSpeedForwardKmh: 61, maxSpeedReverseKmh: -11, horsepower: 600, weightTons: 29.9, powerToWeight: 20.1, engineName: 'Cummins VTA-903T' },
    visual: { baseColor: '#C2A878', accentColor: '#8B7355', hullArchetype: 'light_ifv', barrelCount: 1, hasERA: true, hasRadar: false, hasAutoloader: true, lengthScale: 0.96, widthScale: 0.98, heightScale: 1.06 }
  },
  {
    id: 'us_adats',
    name: 'M113A3 ADATS (M998)',
    shortName: 'ADATS',
    nation: 'usa',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 4,
    br: '11.7',
    role: 'SPAA / Tank Destroyer',
    year: 1989,
    crewCount: 3,
    mainGunName: '8 × MIM-146 ADATS Laser-Beam Riding Missiles + 25 mm M242',
    caliberMm: 152,
    reloadSeconds: 1.5,
    turretTraverseDegPerSec: 85,
    depressionDeg: -5,
    elevationDeg: 85,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 2',
    secondaryWeapons: '25 mm Bushmaster Autocannon',
    ammoLoadout: [
      { id: 'mim146', name: 'MIM-146 ADATS (Dual-Purpose SAM/ATGM)', type: 'ATGM', penetrationMm: 900, velocityMs: 1027, explosiveMassKg: 7.75, damageRating: 98, description: 'Mach 3+ dual-purpose anti-tank and anti-aircraft missile with 900mm RHAe penetration.' },
      { id: 'm919_25', name: '25mm M919 APFSDS', type: 'APFSDS', penetrationMm: 101, velocityMs: 1385, explosiveMassKg: 0, damageRating: 48, description: 'Rapid-fire self-defense autocannon belt.' }
    ],
    armor: { hullFront: 38, hullSide: 44, hullRear: 38, turretFront: 25, turretSide: 25, turretRear: 25, composition: '5083 Aluminum Alloy' },
    mobility: { maxSpeedForwardKmh: 64, maxSpeedReverseKmh: -15, horsepower: 275, weightTons: 15.8, powerToWeight: 17.4, engineName: 'Detroit Diesel 6V53T' },
    visual: { baseColor: '#48523E', accentColor: '#2B3124', hullArchetype: 'spaa_radar', barrelCount: 2, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 0.9, widthScale: 0.92, heightScale: 1.15 }
  },
  {
    id: 'us_m1a2_sep_v2',
    name: 'M1A2 SEP V2 Abrams (TUSK II)',
    shortName: 'M1A2 SEP V2',
    nation: 'usa',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '12.0',
    role: 'Main Battle Tank',
    year: 2008,
    crewCount: 4,
    mainGunName: '120 mm M256 Smoothbore Cannon',
    caliberMm: 120,
    reloadSeconds: 5.0,
    turretTraverseDegPerSec: 40,
    depressionDeg: -10,
    elevationDeg: 20,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 2',
    secondaryWeapons: '2 × 12.7 mm M2HB CROWS + 2 × 7.62 mm M240',
    ammoLoadout: [
      { id: 'm829a2', name: 'M829A2 (APFSDS)', type: 'APFSDS', penetrationMm: 629, velocityMs: 1680, explosiveMassKg: 0, damageRating: 95, description: 'Long-rod depleted uranium kinetic penetrator capable of defeating heavy ERA and composite arrays.' },
      { id: 'm830a1', name: 'M830A1 (HEAT-MP-T VT)', type: 'HEAT-FS', penetrationMm: 480, velocityMs: 1410, explosiveMassKg: 1.3, damageRating: 80, description: 'Multi-purpose shaped charge with radio proximity fuse against helicopters and light vehicles.' }
    ],
    armor: { hullFront: 610, hullSide: 185, hullRear: 38, turretFront: 940, turretSide: 380, turretRear: 32, composition: '3rd-Gen Depleted Uranium Composite + ARAT-2 ERA Tiles' },
    mobility: { maxSpeedForwardKmh: 68, maxSpeedReverseKmh: -40, horsepower: 1500, weightTons: 64.6, powerToWeight: 23.2, engineName: 'Honeywell AGT1500 Gas Turbine' },
    visual: { baseColor: '#C2A878', accentColor: '#8B7355', hullArchetype: 'modern_mbt_western', barrelCount: 1, hasERA: true, hasRadar: false, hasAutoloader: false, lengthScale: 1.12, widthScale: 1.08, heightScale: 0.96 }
  },

  // ==========================================
  // USA - AVIATION / HELICOPTERS / FLEET
  // ==========================================
  {
    id: 'us_f16c_block50',
    name: 'F-16C Fighting Falcon (Block 50)',
    shortName: 'F-16C',
    nation: 'usa',
    branch: 'aviation',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '13.7',
    role: 'Multirole Jet Fighter',
    year: 1994,
    crewCount: 1,
    mainGunName: '20 mm M61A1 Vulcan 6-Barrel Rotary + AIM-120A AMRAAM',
    caliberMm: 20,
    reloadSeconds: 0.1,
    turretTraverseDegPerSec: 120,
    depressionDeg: -20,
    elevationDeg: 20,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '6 × AIM-120A AMRAAM + 6 × AGM-65D Maverick + LITENING II Pod',
    ammoLoadout: [
      { id: 'aim120a', name: 'AIM-120A AMRAAM / AGM-65D Maverick', type: 'AAM', penetrationMm: 830, velocityMs: 1360, explosiveMassKg: 39.0, damageRating: 99, description: 'Active radar homing missile + electro-optical air-to-surface guided munitions.' },
      { id: 'm61_vulcan', name: '20 mm PGU-28/B SAPHEI Vulcan Burst', type: 'CANNON', penetrationMm: 53, velocityMs: 1050, explosiveMassKg: 0.02, damageRating: 75, description: '6,000 RPM rotary cannon burst.' }
    ],
    armor: { hullFront: 15, hullSide: 10, hullRear: 10, turretFront: 20, turretSide: 10, turretRear: 10, composition: 'Aerospace Aluminum-Lithium & Titanium Airframe' },
    mobility: { maxSpeedForwardKmh: 2175, maxSpeedReverseKmh: 0, horsepower: 29000, weightTons: 12.1, powerToWeight: 239.6, engineName: 'General Electric F110-GE-129 Afterburning Turbofan' },
    visual: { baseColor: '#64748B', accentColor: '#334155', hullArchetype: 'jet_swept', barrelCount: 1, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 1.2, widthScale: 1.15, heightScale: 0.85 }
  },
  {
    id: 'us_ah64d_apache',
    name: 'AH-64D Apache Longbow',
    shortName: 'AH-64D',
    nation: 'usa',
    branch: 'helicopters',
    rank: 'VII',
    rankNum: 7,
    column: 0,
    br: '12.0',
    role: 'Attack Helicopter',
    year: 1997,
    crewCount: 2,
    mainGunName: '30 mm M230E1 Chain Gun + 16 × AGM-114K Hellfire II',
    caliberMm: 30,
    reloadSeconds: 0.2,
    turretTraverseDegPerSec: 90,
    depressionDeg: -60,
    elevationDeg: 11,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '16 × AGM-114K Hellfire II + 4 × AIM-92 Stinger + AN/APG-78 Longbow Radar',
    ammoLoadout: [
      { id: 'agm114k', name: 'AGM-114K Hellfire II (Laser ATGM)', type: 'ATGM', penetrationMm: 1100, velocityMs: 475, explosiveMassKg: 9.8, damageRating: 99, description: 'Top-attack tandem shaped-charge laser-guided missile.' },
      { id: 'm789_hedp', name: '30 mm M789 HEDP Chain Gun', type: 'HEAT-FS', penetrationMm: 51, velocityMs: 805, explosiveMassKg: 0.034, damageRating: 72, description: 'Helmet-tracked chin turret dual-purpose shaped-charge rounds.' }
    ],
    armor: { hullFront: 22, hullSide: 18, hullRear: 12, turretFront: 25, turretSide: 18, turretRear: 12, composition: 'Boron Carbide Armored Tub & Ballistic Glass' },
    mobility: { maxSpeedForwardKmh: 295, maxSpeedReverseKmh: -45, horsepower: 3780, weightTons: 8.0, powerToWeight: 47.2, engineName: '2 × General Electric T700-GE-701C Turboshaft' },
    visual: { baseColor: '#3B4232', accentColor: '#23281E', hullArchetype: 'heli_attack', barrelCount: 1, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 1.15, widthScale: 1.0, heightScale: 1.0 }
  },
  {
    id: 'us_uss_alaska',
    name: 'USS Alaska (CB-1)',
    shortName: 'USS Alaska',
    nation: 'usa',
    branch: 'fleet',
    rank: 'VI',
    rankNum: 6,
    column: 0,
    br: '7.0',
    role: 'Battlecruiser',
    year: 1944,
    crewCount: 1517,
    mainGunName: '9 × 12-inch/50 (305 mm) Mark 8 Triple Turrets',
    caliberMm: 305,
    reloadSeconds: 18.0,
    turretTraverseDegPerSec: 5.0,
    depressionDeg: -3,
    elevationDeg: 45,
    stabilizer: 'Vertical',
    hasLaserRangefinder: true,
    thermalGen: 'None',
    secondaryWeapons: '12 × 5-inch/38 Dual-Purpose + 56 × 40 mm Bofors AA',
    ammoLoadout: [
      { id: 'mk5_ap', name: '305 mm Mk.18 APC (Super-Heavy AP)', type: 'APHE', penetrationMm: 615, velocityMs: 762, explosiveMassKg: 7.7, damageRating: 99, description: '517 kg armor-piercing capped battleship shell for piercing citadel belts.' },
      { id: 'mk18_hc', name: '305 mm Mk.22 HC (High-Capacity HE)', type: 'HE', penetrationMm: 79, velocityMs: 808, explosiveMassKg: 36.5, damageRating: 90, description: 'Massive high-explosive broadside shell.' }
    ],
    armor: { hullFront: 229, hullSide: 229, hullRear: 102, turretFront: 325, turretSide: 152, turretRear: 190, composition: 'Class A Krupp Cemented Naval Belt Armor' },
    mobility: { maxSpeedForwardKmh: 61, maxSpeedReverseKmh: -22, horsepower: 150000, weightTons: 34253, powerToWeight: 4.4, engineName: '8 × Babcock & Wilcox Boilers + GE Steam Turbines' },
    visual: { baseColor: '#475569', accentColor: '#1E293B', hullArchetype: 'naval_battleship', barrelCount: 9, hasERA: false, hasRadar: true, hasAutoloader: false, lengthScale: 1.4, widthScale: 0.9, heightScale: 1.0 }
  },

  // ==========================================
  // GERMANY - ARMY / AVIATION / HELI / FLEET
  // ==========================================
  {
    id: 'de_tiger_h1',
    name: 'Pz.Kpfw. VI Tiger Ausf. H1',
    shortName: 'Tiger H1',
    nation: 'germany',
    branch: 'army',
    rank: 'III',
    rankNum: 3,
    column: 1,
    br: '5.7',
    role: 'Heavy Tank',
    year: 1942,
    crewCount: 5,
    mainGunName: '8.8 cm KwK 36 L/56 Cannon',
    caliberMm: 88,
    reloadSeconds: 7.4,
    turretTraverseDegPerSec: 12,
    depressionDeg: -8,
    elevationDeg: 15,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '2 × 7.92 mm MG 34',
    ammoLoadout: [
      { id: 'pzgr39_88', name: 'Pzgr. 39 (APCBC)', type: 'APHE', penetrationMm: 165, velocityMs: 773, explosiveMassKg: 0.11, damageRating: 93, description: 'Iconic 88mm armor-piercing shell with generous RDX/TNT explosive filler.' },
      { id: 'pzgr_patr', name: 'Pzgr. (APCBC Overpressure)', type: 'APHE', penetrationMm: 153, velocityMs: 810, explosiveMassKg: 0.215, damageRating: 97, description: 'Massive explosive filler round that triggers instant hull overpressure on penetration.' },
      { id: 'hlgr39', name: 'Hl.Gr 39 (HEAT)', type: 'HEAT-FS', penetrationMm: 110, velocityMs: 600, explosiveMassKg: 0.65, damageRating: 70, description: 'Shaped charge round.' }
    ],
    armor: { hullFront: 102, hullSide: 82, hullRear: 82, turretFront: 120, turretSide: 82, turretRear: 82, composition: 'Interlocking Rolled Homogeneous Nickel-Steel' },
    mobility: { maxSpeedForwardKmh: 45, maxSpeedReverseKmh: -8, horsepower: 650, weightTons: 57.0, powerToWeight: 11.4, engineName: 'Maybach HL210 P45 V12' },
    visual: { baseColor: '#8B7D5B', accentColor: '#564E38', hullArchetype: 'ww2_heavy', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 1.04, widthScale: 1.08, heightScale: 1.05 }
  },
  {
    id: 'de_panther_g',
    name: 'Pz.Kpfw. V Panther Ausf. G',
    shortName: 'Panther G',
    nation: 'germany',
    branch: 'army',
    rank: 'IV',
    rankNum: 4,
    column: 0,
    br: '6.0',
    role: 'Medium Tank',
    year: 1944,
    crewCount: 5,
    mainGunName: '7.5 cm KwK 42 L/70 High-Velocity Cannon',
    caliberMm: 75,
    reloadSeconds: 7.4,
    turretTraverseDegPerSec: 15,
    depressionDeg: -8,
    elevationDeg: 18,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '2 × 7.92 mm MG 34',
    ammoLoadout: [
      { id: 'pzgr39_42', name: 'Pzgr. 39/42 (APCBC)', type: 'APHE', penetrationMm: 192, velocityMs: 935, explosiveMassKg: 0.028, damageRating: 85, description: 'Long-barrel 75mm shell with flat trajectory and 192mm penetration.' },
      { id: 'pzgr40_42', name: 'Pzgr. 40/42 (APCR)', type: 'APCR', penetrationMm: 228, velocityMs: 1120, explosiveMassKg: 0, damageRating: 60, description: 'Sub-caliber tungsten core.' }
    ],
    armor: { hullFront: 80, hullSide: 50, hullRear: 40, turretFront: 110, turretSide: 45, turretRear: 45, composition: '55° Sloped Rolled Homogeneous Steel + Chin Mantlet' },
    mobility: { maxSpeedForwardKmh: 46, maxSpeedReverseKmh: -4, horsepower: 600, weightTons: 44.8, powerToWeight: 13.4, engineName: 'Maybach HL230 P30 V12' },
    visual: { baseColor: '#7C7052', accentColor: '#4A4331', hullArchetype: 'ww2_medium', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 1.06, widthScale: 1.02, heightScale: 1.06 }
  },
  {
    id: 'de_tiger_ii_h',
    name: 'Pz.Kpfw. VI Ausf. B Tiger II (H) "King Tiger"',
    shortName: 'Tiger II (H)',
    nation: 'germany',
    branch: 'army',
    rank: 'IV',
    rankNum: 4,
    column: 1,
    br: '6.7',
    role: 'Heavy Tank',
    year: 1944,
    crewCount: 5,
    mainGunName: '8.8 cm KwK 43 L/71 Cannon',
    caliberMm: 88,
    reloadSeconds: 7.5,
    turretTraverseDegPerSec: 19,
    depressionDeg: -8,
    elevationDeg: 15,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '2 × 7.92 mm MG 34',
    ammoLoadout: [
      { id: 'pzgr39_43', name: 'Pzgr. 39/43 (APCBC)', type: 'APHE', penetrationMm: 237, velocityMs: 1000, explosiveMassKg: 0.109, damageRating: 95, description: '1,000 m/s long 88mm shell capable of frontally penetrating almost any WWII tank.' },
      { id: 'pzgr40_43', name: 'Pzgr. 40/43 (APCR)', type: 'APCR', penetrationMm: 279, velocityMs: 1130, explosiveMassKg: 0, damageRating: 66, description: 'High-velocity sub-caliber core.' }
    ],
    armor: { hullFront: 150, hullSide: 80, hullRear: 80, turretFront: 185, turretSide: 80, turretRear: 80, composition: '50° Sloped 150mm Glacis (230mm+ Effective)' },
    mobility: { maxSpeedForwardKmh: 42, maxSpeedReverseKmh: -11, horsepower: 700, weightTons: 69.8, powerToWeight: 10.0, engineName: 'Maybach HL230 P30 V12' },
    visual: { baseColor: '#786D52', accentColor: '#484935', hullArchetype: 'ww2_heavy', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 1.16, widthScale: 1.1, heightScale: 1.08 }
  },
  {
    id: 'de_maus',
    name: 'Pz.Kpfw. VIII Maus (Super-Heavy Prototype)',
    shortName: 'Maus',
    nation: 'germany',
    branch: 'army',
    rank: 'V',
    rankNum: 5,
    column: 3,
    br: '7.7',
    role: 'Heavy Tank',
    isPremium: true,
    year: 1945,
    crewCount: 6,
    mainGunName: '12.8 cm KwK 44 L/55 + Coaxial 7.5 cm KwK 44 L/36',
    caliberMm: 128,
    reloadSeconds: 18.2,
    turretTraverseDegPerSec: 8,
    depressionDeg: -7,
    elevationDeg: 23,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: 'Coaxial 75 mm Cannon + 7.92 mm MG 34',
    ammoLoadout: [
      { id: 'pzgr43_128', name: '12.8cm Pzgr. 43 (APCBC)', type: 'APHE', penetrationMm: 272, velocityMs: 930, explosiveMassKg: 0.786, damageRating: 99, description: '28 kg Naval-derived shell with 786g explosive filler—one-shot obliteration.' },
      { id: 'pzgr39_ts', name: '12.8cm Pzgr.TS (APCBC-DS)', type: 'APHE', penetrationMm: 312, velocityMs: 1260, explosiveMassKg: 0.15, damageRating: 94, description: 'Sub-caliber sabot firing an 88mm APHE core at 1,260 m/s!' }
    ],
    armor: { hullFront: 200, hullSide: 185, hullRear: 150, turretFront: 232, turretSide: 205, turretRear: 205, composition: '188-Ton Krupp Cemented Super-Heavy Armor' },
    mobility: { maxSpeedForwardKmh: 21, maxSpeedReverseKmh: -21, horsepower: 1200, weightTons: 188.0, powerToWeight: 6.4, engineName: 'Daimler-Benz MB 517 Diesel-Electric' },
    visual: { baseColor: '#5B6256', accentColor: '#393E36', hullArchetype: 'ww2_heavy', barrelCount: 2, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 1.25, widthScale: 1.2, heightScale: 1.28 }
  },
  {
    id: 'de_gepard',
    name: 'Flakpanzer I Gepard',
    shortName: 'Gepard',
    nation: 'germany',
    branch: 'army',
    rank: 'VI',
    rankNum: 6,
    column: 4,
    br: '8.3',
    role: 'SPAA',
    year: 1976,
    crewCount: 3,
    mainGunName: '2 × 35 mm Oerlikon KDA Autocannons',
    caliberMm: 35,
    reloadSeconds: 0.15,
    turretTraverseDegPerSec: 90,
    depressionDeg: -10,
    elevationDeg: 85,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'NVG',
    secondaryWeapons: 'Search & Tracking Pulse-Doppler Radars',
    ammoLoadout: [
      { id: 'dm23_35', name: 'DM23 (APDS-T) / DM13 (APHEI)', type: 'APFSDS', penetrationMm: 127, velocityMs: 1385, explosiveMassKg: 0.022, damageRating: 78, description: 'Twin 35mm belt firing 1,100 RPM capable of shredding aircraft and medium tanks alike.' },
      { id: 'dm11a1', name: 'DM11A1 (HEI-T Mine Shell)', type: 'HE', penetrationMm: 6, velocityMs: 1175, explosiveMassKg: 0.12, damageRating: 65, description: 'High-explosive incendiary anti-aircraft belt.' }
    ],
    armor: { hullFront: 50, hullSide: 35, hullRear: 25, turretFront: 35, turretSide: 25, turretRear: 20, composition: 'Leopard 1 Welded Steel Hull' },
    mobility: { maxSpeedForwardKmh: 65, maxSpeedReverseKmh: -25, horsepower: 830, weightTons: 47.3, powerToWeight: 17.5, engineName: 'MTU MB 838 CaM 500 V10' },
    visual: { baseColor: '#48523E', accentColor: '#292F23', hullArchetype: 'spaa_radar', barrelCount: 2, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 1.02, widthScale: 1.0, heightScale: 1.12 }
  },
  {
    id: 'de_puma_vjtf',
    name: 'SPz Puma VJTF (Spike-LR)',
    shortName: 'PUMA VJTF',
    nation: 'germany',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 2,
    br: '11.0',
    role: 'Light Tank / IFV',
    year: 2021,
    crewCount: 3,
    mainGunName: '30 mm MK 30-2/ABM + MELLS Spike-LR II Launcher',
    caliberMm: 30,
    reloadSeconds: 0.3,
    turretTraverseDegPerSec: 60,
    depressionDeg: -10,
    elevationDeg: 45,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: 'Fire-and-Forget Spike-LR II ATGM + MUSS Soft-Kill APS',
    ammoLoadout: [
      { id: 'pmc287', name: 'PMC287 (APFSDS-T)', type: 'APFSDS', penetrationMm: 121, velocityMs: 1405, explosiveMassKg: 0, damageRating: 58, description: 'Unmanned turret 30mm fin-stabilized sabot belt.' },
      { id: 'spike_lr', name: 'MELLS Spike-LR (Fire & Forget Top-Attack)', type: 'ATGM', penetrationMm: 700, velocityMs: 180, explosiveMassKg: 2.9, damageRating: 92, description: 'Electro-optical top-attack anti-tank guided missile.' }
    ],
    armor: { hullFront: 140, hullSide: 220, hullRear: 30, turretFront: 45, turretSide: 30, turretRear: 20, composition: 'AMAP Composite + CLARA Heavy Side ERA Modules' },
    mobility: { maxSpeedForwardKmh: 70, maxSpeedReverseKmh: -30, horsepower: 1088, weightTons: 43.0, powerToWeight: 25.3, engineName: 'MTU V10 892 High-Power Density Diesel' },
    visual: { baseColor: '#44503B', accentColor: '#283023', hullArchetype: 'light_ifv', barrelCount: 1, hasERA: true, hasRadar: false, hasAutoloader: true, lengthScale: 1.05, widthScale: 1.06, heightScale: 0.96 }
  },
  {
    id: 'de_leopard_2a7v',
    name: 'Leopard 2A7V',
    shortName: 'Leopard 2A7V',
    nation: 'germany',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '12.0',
    role: 'Main Battle Tank',
    year: 2021,
    crewCount: 4,
    mainGunName: '120 mm Rheinmetall Rh-120 L/55A1 Smoothbore',
    caliberMm: 120,
    reloadSeconds: 6.0,
    turretTraverseDegPerSec: 40,
    depressionDeg: -9,
    elevationDeg: 20,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '2 × 7.62 mm MG3A1',
    ammoLoadout: [
      { id: 'dm53_l55', name: 'DM53 (APFSDS-T)', type: 'APFSDS', penetrationMm: 652, velocityMs: 1750, explosiveMassKg: 0, damageRating: 97, description: 'Highest-penetration kinetic dart in NATO service fired from the long L/55A1 barrel.' },
      { id: 'dm11_he', name: 'DM11 (Programmable HE-Frag-FS)', type: 'HE', penetrationMm: 38, velocityMs: 1100, explosiveMassKg: 3.0, damageRating: 82, description: 'Time-fuze high-explosive fragmentation round.' }
    ],
    armor: { hullFront: 780, hullSide: 120, hullRear: 40, turretFront: 1080, turretSide: 360, turretRear: 40, composition: 'D-Tech NERA Wedge Modules + Bow Add-On Armor Package' },
    mobility: { maxSpeedForwardKmh: 63, maxSpeedReverseKmh: -28, horsepower: 1500, weightTons: 66.5, powerToWeight: 22.6, engineName: 'MTU MB 873 Ka-501 V12 Twin-Turbo' },
    visual: { baseColor: '#44503B', accentColor: '#2B3325', hullArchetype: 'modern_mbt_western', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 1.15, widthScale: 1.08, heightScale: 0.96 }
  },
  {
    id: 'de_eurofighter_ef2000',
    name: 'EF-2000 Typhoon (Tranche 2)',
    shortName: 'EF-2000',
    nation: 'germany',
    branch: 'aviation',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '13.7',
    role: 'Air Superiority Delta-Canard Jet',
    year: 2008,
    crewCount: 1,
    mainGunName: '27 mm Mauser BK-27 Revolver Cannon + AIM-120B / IRIS-T',
    caliberMm: 27,
    reloadSeconds: 0.1,
    turretTraverseDegPerSec: 120,
    depressionDeg: -20,
    elevationDeg: 20,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '6 × AIM-120B AMRAAM + 2 × AIM-9M + Brimstone',
    ammoLoadout: [
      { id: 'aim120b_ef', name: 'AIM-120B AMRAAM / Brimstone Salvo', type: 'AAM', penetrationMm: 800, velocityMs: 1360, explosiveMassKg: 35.0, damageRating: 99, description: 'Beyond-visual-range radar missiles and millimeter-wave anti-armor missiles.' },
      { id: 'bk27_aphe', name: '27 mm Mauser BK-27 APHE/Mine Shell', type: 'CANNON', penetrationMm: 45, velocityMs: 1025, explosiveMassKg: 0.085, damageRating: 84, description: '1,700 RPM heavy revolver cannon.' }
    ],
    armor: { hullFront: 15, hullSide: 10, hullRear: 10, turretFront: 18, turretSide: 10, turretRear: 10, composition: 'Carbon-Fiber Composite Delta-Canard Airframe' },
    mobility: { maxSpeedForwardKmh: 2495, maxSpeedReverseKmh: 0, horsepower: 40000, weightTons: 11.0, powerToWeight: 363.6, engineName: '2 × Eurojet EJ200 Afterburning Turbofans' },
    visual: { baseColor: '#64748B', accentColor: '#475569', hullArchetype: 'jet_delta', barrelCount: 1, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 1.2, widthScale: 1.2, heightScale: 0.85 }
  },
  {
    id: 'de_tiger_uht',
    name: 'EC-665 Tiger UHT',
    shortName: 'Tiger UHT',
    nation: 'germany',
    branch: 'helicopters',
    rank: 'VII',
    rankNum: 7,
    column: 0,
    br: '12.0',
    role: 'Attack Helicopter',
    year: 2005,
    crewCount: 2,
    mainGunName: '8 × PARS 3 LR Fire-and-Forget ATGM + 12.7 mm FN HMP400',
    caliberMm: 159,
    reloadSeconds: 1.0,
    turretTraverseDegPerSec: 90,
    depressionDeg: -30,
    elevationDeg: 25,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '8 × PARS 3 LR + 4 × AIM-92 Stinger + Mast-Mounted Osiris Sight',
    ammoLoadout: [
      { id: 'pars3lr', name: 'PARS 3 LR (Fire-and-Forget Top-Attack)', type: 'ATGM', penetrationMm: 1000, velocityMs: 290, explosiveMassKg: 8.6, damageRating: 98, description: 'Infrared imaging fire-and-forget top-attack missile salvo.' },
      { id: 'hydra_apkws', name: '70 mm FZ49 HEAT Rockets + .50 Cal Pod', type: 'HEAT-FS', penetrationMm: 290, velocityMs: 700, explosiveMassKg: 1.2, damageRating: 75, description: 'High-velocity unguided rocket pods.' }
    ],
    armor: { hullFront: 18, hullSide: 15, hullRear: 10, turretFront: 18, turretSide: 15, turretRear: 10, composition: 'Kevlar/Carbon Composite Low-RCS Airframe' },
    mobility: { maxSpeedForwardKmh: 315, maxSpeedReverseKmh: -50, horsepower: 2570, weightTons: 6.0, powerToWeight: 42.8, engineName: '2 × MTU Turbomeca Rolls-Royce MTR390' },
    visual: { baseColor: '#3A4434', accentColor: '#22281E', hullArchetype: 'heli_attack', barrelCount: 2, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 1.1, widthScale: 0.95, heightScale: 1.05 }
  },
  {
    id: 'de_scharnhorst',
    name: 'KMS Scharnhorst (1943)',
    shortName: 'Scharnhorst',
    nation: 'germany',
    branch: 'fleet',
    rank: 'VI',
    rankNum: 6,
    column: 0,
    br: '7.0',
    role: 'Battleship / Battlecruiser',
    year: 1943,
    crewCount: 1968,
    mainGunName: '9 × 28 cm/54.5 SK C/34 Triple Turrets',
    caliberMm: 283,
    reloadSeconds: 17.6,
    turretTraverseDegPerSec: 7.2,
    depressionDeg: -8,
    elevationDeg: 40,
    stabilizer: 'Vertical',
    hasLaserRangefinder: true,
    thermalGen: 'None',
    secondaryWeapons: '12 × 15 cm SK C/28 + 14 × 10.5 cm Flak + 6 × 533 mm Torpedoes',
    ammoLoadout: [
      { id: '28cm_psgr', name: '28.3 cm Pzgr. L/4.4 (APCBC)', type: 'APHE', penetrationMm: 562, velocityMs: 890, explosiveMassKg: 7.84, damageRating: 98, description: 'High-velocity German naval armor-piercing shell.' },
      { id: '28cm_spgr', name: '28.3 cm Spgr. L/4.4 Bdz (SAPBC)', type: 'SAP', penetrationMm: 265, velocityMs: 890, explosiveMassKg: 16.0, damageRating: 95, description: 'Base-fuzed semi-armor-piercing shell with huge explosive charge.' }
    ],
    armor: { hullFront: 350, hullSide: 350, hullRear: 150, turretFront: 360, turretSide: 180, turretRear: 350, composition: '350mm Wotan Hart Main Belt + 105mm Turtleback Slope' },
    mobility: { maxSpeedForwardKmh: 58, maxSpeedReverseKmh: -22, horsepower: 160080, weightTons: 38100, powerToWeight: 4.2, engineName: '12 × Wagner Superheated Boilers + Brown-Boveri Turbines' },
    visual: { baseColor: '#525B66', accentColor: '#333A42', hullArchetype: 'naval_battleship', barrelCount: 9, hasERA: false, hasRadar: true, hasAutoloader: false, lengthScale: 1.45, widthScale: 0.92, heightScale: 1.0 }
  },

  // ==========================================
  // USSR / RUSSIA - ARMY / AVIATION / HELI / FLEET
  // ==========================================
  {
    id: 'ru_t34_85',
    name: 'T-34-85 (D-5T / ZiS-S-53)',
    shortName: 'T-34-85',
    nation: 'ussr',
    branch: 'army',
    rank: 'III',
    rankNum: 3,
    column: 0,
    br: '5.7',
    role: 'Medium Tank',
    year: 1944,
    crewCount: 5,
    mainGunName: '85 mm ZiS-S-53 Cannon',
    caliberMm: 85,
    reloadSeconds: 7.4,
    turretTraverseDegPerSec: 25,
    depressionDeg: -5,
    elevationDeg: 22,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '2 × 7.62 mm DT Machine Guns',
    ammoLoadout: [
      { id: 'br365a', name: 'BR-365A (APHEBC)', type: 'APHE', penetrationMm: 135, velocityMs: 792, explosiveMassKg: 0.164, damageRating: 94, description: 'Blunt-nose ballistic-cap shell with legendary slope normalization and 164g TNT.' },
      { id: 'br365k', name: 'BR-365K (APHE)', type: 'APHE', penetrationMm: 148, velocityMs: 792, explosiveMassKg: 0.074, damageRating: 84, description: 'Sharp-nose armor-piercing round for flat plates.' }
    ],
    armor: { hullFront: 45, hullSide: 45, hullRear: 45, turretFront: 90, turretSide: 75, turretRear: 52, composition: '60° Sloped High-Hardness Rolled Armor' },
    mobility: { maxSpeedForwardKmh: 55, maxSpeedReverseKmh: -8, horsepower: 500, weightTons: 32.0, powerToWeight: 15.6, engineName: 'V-2-34 V12 Diesel' },
    visual: { baseColor: '#4A5838', accentColor: '#2E3822', hullArchetype: 'ww2_medium', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 0.96, widthScale: 0.96, heightScale: 0.96 }
  },
  {
    id: 'ru_kv2_1939',
    name: 'KV-2 (1939) "Dreadnought"',
    shortName: 'KV-2 (1939)',
    nation: 'ussr',
    branch: 'army',
    rank: 'II',
    rankNum: 2,
    column: 1,
    br: '3.7',
    role: 'Heavy Tank',
    year: 1939,
    crewCount: 6,
    mainGunName: '152 mm M-10T Howitzer',
    caliberMm: 152,
    reloadSeconds: 33.3,
    turretTraverseDegPerSec: 6,
    depressionDeg: -5,
    elevationDeg: 12,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '2 × 7.62 mm DT',
    ammoLoadout: [
      { id: 'of530', name: 'OF-530 (152mm HE Overpressure)', type: 'HE', penetrationMm: 48, velocityMs: 530, explosiveMassKg: 5.83, damageRating: 100, description: '40 kg high-explosive shell with 5.83 kg TNT that overpressures any tank roof on impact.' },
      { id: 'g530', name: 'G-530 (Concrete-Piercing APHE)', type: 'APHE', penetrationMm: 95, velocityMs: 432, explosiveMassKg: 5.1, damageRating: 99, description: 'Bunker-busting armor-piercing shell.' }
    ],
    armor: { hullFront: 75, hullSide: 75, hullRear: 70, turretFront: 75, turretSide: 75, turretRear: 70, composition: 'Thick Rolled Steel Box Turret' },
    mobility: { maxSpeedForwardKmh: 26, maxSpeedReverseKmh: -6, horsepower: 500, weightTons: 52.0, powerToWeight: 9.6, engineName: 'V-2K V12 Diesel' },
    visual: { baseColor: '#435233', accentColor: '#2B3520', hullArchetype: 'ww2_heavy', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 1.04, widthScale: 1.04, heightScale: 1.32 }
  },
  {
    id: 'ru_is2_1944',
    name: 'IS-2 (1944) Iosif Stalin',
    shortName: 'IS-2 (1944)',
    nation: 'ussr',
    branch: 'army',
    rank: 'IV',
    rankNum: 4,
    column: 1,
    br: '6.7',
    role: 'Heavy Tank',
    year: 1944,
    crewCount: 4,
    mainGunName: '122 mm D-25T Cannon',
    caliberMm: 122,
    reloadSeconds: 20.8,
    turretTraverseDegPerSec: 12,
    depressionDeg: -3,
    elevationDeg: 20,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '12.7 mm DShK AA + 2 × 7.62 mm DT',
    ammoLoadout: [
      { id: 'br471b', name: 'BR-471B (APHEBC)', type: 'APHE', penetrationMm: 205, velocityMs: 795, explosiveMassKg: 0.246, damageRating: 98, description: '25 kg 122mm shell that punches straight through sloped Panther glacis plates.' },
      { id: 'of471', name: 'OF-471 (HE)', type: 'HE', penetrationMm: 37, velocityMs: 795, explosiveMassKg: 3.6, damageRating: 92, description: 'Heavy high-explosive fragmentation round.' }
    ],
    armor: { hullFront: 120, hullSide: 90, hullRear: 60, turretFront: 100, turretSide: 100, turretRear: 100, composition: '60° Sloped 120mm Cast Front Glacis' },
    mobility: { maxSpeedForwardKmh: 37, maxSpeedReverseKmh: -14, horsepower: 520, weightTons: 46.0, powerToWeight: 11.3, engineName: 'V-2-IS V12 Diesel' },
    visual: { baseColor: '#485637', accentColor: '#2D3622', hullArchetype: 'ww2_heavy', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 1.08, widthScale: 1.04, heightScale: 1.0 }
  },
  {
    id: 'ru_bmp2m_berezhok',
    name: 'BMP-2M "Berezhok"',
    shortName: 'BMP-2M',
    nation: 'ussr',
    branch: 'army',
    rank: 'VII',
    rankNum: 7,
    column: 2,
    br: '10.3',
    role: 'Light Tank / IFV',
    isSquadron: true,
    year: 2005,
    crewCount: 3,
    mainGunName: '30 mm 2A42 Autocannon + 4 × 9M133 Kornet ATGM',
    caliberMm: 30,
    reloadSeconds: 0.15,
    turretTraverseDegPerSec: 60,
    depressionDeg: -5,
    elevationDeg: 74,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 2',
    secondaryWeapons: '4 × 9M133 Kornet Laser-Beam Riding ATGM (Fire on the Move) + 30 mm AGS-30',
    ammoLoadout: [
      { id: '3ubr8', name: '3UBR8 (APDS) + 9M133 Kornet ATGM', type: 'ATGM', penetrationMm: 1200, velocityMs: 320, explosiveMassKg: 7.0, damageRating: 99, description: '1,200mm tandem HEAT Kornet missiles that can be ripple-fired on the move!' },
      { id: '3ubr8_belt', name: '30 mm 3UBR8 APDS Belt (550 RPM)', type: 'APFSDS', penetrationMm: 102, velocityMs: 1120, explosiveMassKg: 0, damageRating: 64, description: 'High-rate-of-fire sub-caliber autocannon belt.' }
    ],
    armor: { hullFront: 23, hullSide: 19, hullRear: 16, turretFront: 23, turretSide: 19, turretRear: 13, composition: 'Amphibious Ribbed High-Hardness Steel' },
    mobility: { maxSpeedForwardKmh: 65, maxSpeedReverseKmh: -11, horsepower: 360, weightTons: 16.0, powerToWeight: 22.5, engineName: 'UTD-23 Turbo Diesel' },
    visual: { baseColor: '#425236', accentColor: '#273120', hullArchetype: 'light_ifv', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: true, lengthScale: 0.98, widthScale: 0.96, heightScale: 0.88 }
  },
  {
    id: 'ru_2s38_derivatsiya',
    name: '2S38 "Derivatsiya-PVO"',
    shortName: '2S38',
    nation: 'ussr',
    branch: 'army',
    rank: 'VII',
    rankNum: 7,
    column: 3,
    br: '10.3',
    role: 'Light Tank / SPAA',
    isPremium: true,
    year: 2018,
    crewCount: 3,
    mainGunName: '57 mm 2A90 Automatic Cannon',
    caliberMm: 57,
    reloadSeconds: 0.5,
    turretTraverseDegPerSec: 60,
    depressionDeg: -5,
    elevationDeg: 75,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '7.62 mm PKTM + IRST Optical Target Tracker',
    ammoLoadout: [
      { id: '3ubm22', name: '3UBM22 (57mm APFSDS)', type: 'APFSDS', penetrationMm: 225, velocityMs: 1500, explosiveMassKg: 0, damageRating: 82, description: 'Rapid-fire 120 RPM 57mm fin-stabilized darts with 225mm penetration.' },
      { id: '3uo8_vt', name: '3UO8 (HE-VT Proximity Fuse) / BR-281U (APHE)', type: 'APHE', penetrationMm: 151, velocityMs: 1000, explosiveMassKg: 0.02, damageRating: 85, description: 'Radio-proximity anti-air shell and explosive armor-piercing round.' }
    ],
    armor: { hullFront: 43, hullSide: 22, hullRear: 20, turretFront: 30, turretSide: 25, turretRear: 20, composition: 'BMP-3 Aluminum Alloy Hull + Unmanned Crewless Turret' },
    mobility: { maxSpeedForwardKmh: 70, maxSpeedReverseKmh: -20, horsepower: 500, weightTons: 21.5, powerToWeight: 23.3, engineName: 'UTD-29 V10 Diesel' },
    visual: { baseColor: '#3E4D34', accentColor: '#252E1F', hullArchetype: 'light_ifv', barrelCount: 1, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 1.0, widthScale: 0.98, heightScale: 0.94 }
  },
  {
    id: 'ru_pantsir_s1',
    name: '96K6 Pantsir-S1 (KAMAZ-6560)',
    shortName: 'Pantsir-S1',
    nation: 'ussr',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 4,
    br: '12.0',
    role: 'SPAA',
    year: 2012,
    crewCount: 3,
    mainGunName: '12 × 95Ya6 SAMs + 2 × 30 mm 2A38M Twin Autocannons',
    caliberMm: 30,
    reloadSeconds: 0.12,
    turretTraverseDegPerSec: 100,
    depressionDeg: -5,
    elevationDeg: 85,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: 'Phased-Array Target Acquisition Radar (20 km Range)',
    ammoLoadout: [
      { id: '95ya6', name: '95Ya6 Hypersonic SAM + 30mm APDS Belt', type: 'AAM', penetrationMm: 82, velocityMs: 1300, explosiveMassKg: 20.0, damageRating: 96, description: '1,300 m/s command-guided missile + 5,000 RPM quad-barrel 30mm cannon storm.' },
      { id: '30mm_2a38', name: '30 mm 2A38M AP-T / HEFI Belt', type: 'APFSDS', penetrationMm: 82, velocityMs: 1120, explosiveMassKg: 0.04, damageRating: 78, description: '5,000 RPM combined rate of fire.' }
    ],
    armor: { hullFront: 10, hullSide: 10, hullRear: 10, turretFront: 15, turretSide: 12, turretRear: 10, composition: 'Armored 8x8 Truck Chassis' },
    mobility: { maxSpeedForwardKmh: 90, maxSpeedReverseKmh: -15, horsepower: 400, weightTons: 30.0, powerToWeight: 13.3, engineName: 'KAMAZ-740.35-400 Turbo Diesel' },
    visual: { baseColor: '#3F4E35', accentColor: '#262F20', hullArchetype: 'spaa_radar', barrelCount: 4, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 1.18, widthScale: 0.94, heightScale: 1.24 }
  },
  {
    id: 'ru_t90m_proryv',
    name: 'T-90M "Proryv-3"',
    shortName: 'T-90M',
    nation: 'ussr',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '12.0',
    role: 'Main Battle Tank',
    year: 2020,
    crewCount: 3,
    mainGunName: '125 mm 2A46M-5 Smoothbore + Autoloader',
    caliberMm: 125,
    reloadSeconds: 7.1,
    turretTraverseDegPerSec: 40,
    depressionDeg: -6,
    elevationDeg: 14,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '12.7 mm Kord RWS + 9M119M1 Invar-M Gun-Launched ATGM',
    ammoLoadout: [
      { id: '3bm60', name: '3BM60 "Svinets-2" (APFSDS)', type: 'APFSDS', penetrationMm: 580, velocityMs: 1660, explosiveMassKg: 0, damageRating: 94, description: 'Modern long-rod tungsten/DU kinetic penetrator for the 2A46M-5 cannon.' },
      { id: '9m119m1', name: '9M119M1 Invar-M (Tandem Laser ATGM)', type: 'ATGM', penetrationMm: 850, velocityMs: 350, explosiveMassKg: 4.58, damageRating: 92, description: 'Barrel-launched tandem-charge laser-guided missile.' },
      { id: '3of26', name: '3OF26 (125mm HE-Frag)', type: 'HE', penetrationMm: 42, velocityMs: 850, explosiveMassKg: 3.4, damageRating: 88, description: 'Heavy high-explosive fragmentation shell for roof overpressure.' }
    ],
    armor: { hullFront: 750, hullSide: 450, hullRear: 45, turretFront: 960, turretSide: 520, turretRear: 70, composition: 'Welded Proryv Turret + Relikt Heavy ERA + Spall Liner' },
    mobility: { maxSpeedForwardKmh: 60, maxSpeedReverseKmh: -4, horsepower: 1130, weightTons: 48.0, powerToWeight: 23.5, engineName: 'V-92S2F V12 Diesel' },
    visual: { baseColor: '#3B4A32', accentColor: '#252F1F', hullArchetype: 'modern_mbt_eastern', barrelCount: 1, hasERA: true, hasRadar: false, hasAutoloader: true, lengthScale: 1.06, widthScale: 1.05, heightScale: 0.88 }
  },
  {
    id: 'ru_t80bvm',
    name: 'T-80BVM (2023)',
    shortName: 'T-80BVM',
    nation: 'ussr',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 1,
    br: '12.0',
    role: 'Main Battle Tank',
    year: 2018,
    crewCount: 3,
    mainGunName: '125 mm 2A46M-4 Smoothbore + 6.5s Autoloader',
    caliberMm: 125,
    reloadSeconds: 6.5,
    turretTraverseDegPerSec: 40,
    depressionDeg: -5,
    elevationDeg: 15,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 2',
    secondaryWeapons: '12.7 mm NSVT + 7.62 mm PKT',
    ammoLoadout: [
      { id: '3bm60_bvm', name: '3BM60 "Svinets-2" (APFSDS)', type: 'APFSDS', penetrationMm: 580, velocityMs: 1660, explosiveMassKg: 0, damageRating: 94, description: 'Fast 6.5s vertical carousel autoloader firing 3BM60 darts.' },
      { id: '3of26_bvm', name: '3OF26 (HE-Frag)', type: 'HE', penetrationMm: 42, velocityMs: 850, explosiveMassKg: 3.4, damageRating: 88, description: 'High-explosive fragmentation round.' }
    ],
    armor: { hullFront: 720, hullSide: 500, hullRear: 50, turretFront: 890, turretSide: 480, turretRear: 65, composition: 'Composite Array + Full Relikt ERA Soft-Bag Side Skirts' },
    mobility: { maxSpeedForwardKmh: 70, maxSpeedReverseKmh: -11, horsepower: 1250, weightTons: 46.0, powerToWeight: 27.2, engineName: 'GTD-1250 Multi-Fuel Gas Turbine' },
    visual: { baseColor: '#36442E', accentColor: '#212A1C', hullArchetype: 'modern_mbt_eastern', barrelCount: 1, hasERA: true, hasRadar: false, hasAutoloader: true, lengthScale: 1.05, widthScale: 1.06, heightScale: 0.87 }
  },
  {
    id: 'ru_su27sm',
    name: 'Su-27SM "Flanker-B Mod.1"',
    shortName: 'Su-27SM',
    nation: 'ussr',
    branch: 'aviation',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '13.7',
    role: 'Air Superiority Heavy Fighter',
    year: 2003,
    crewCount: 1,
    mainGunName: '30 mm GSh-30-1 Cannon + R-77 / R-27ER / R-73',
    caliberMm: 30,
    reloadSeconds: 0.1,
    turretTraverseDegPerSec: 120,
    depressionDeg: -20,
    elevationDeg: 20,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 2',
    secondaryWeapons: '6 × R-77 Active Radar + 4 × R-73 Thrust-Vectoring IR + Kh-29TE',
    ammoLoadout: [
      { id: 'r77_kh29', name: 'R-77 / Kh-29TE TV-Guided Missile', type: 'AAM', penetrationMm: 900, velocityMs: 1380, explosiveMassKg: 116.0, damageRating: 99, description: 'Heavy air-to-air and 320kg warhead air-to-surface missiles.' },
      { id: 'gsh30_1', name: '30 mm GSh-30-1 AP-T / HEFI', type: 'CANNON', penetrationMm: 62, velocityMs: 860, explosiveMassKg: 0.049, damageRating: 82, description: '1,500 RPM heavy 30mm aircraft cannon.' }
    ],
    armor: { hullFront: 18, hullSide: 12, hullRear: 10, turretFront: 20, turretSide: 12, turretRear: 10, composition: 'Titanium-Aluminum Blended Wing-Body Airframe' },
    mobility: { maxSpeedForwardKmh: 2500, maxSpeedReverseKmh: 0, horsepower: 55000, weightTons: 16.3, powerToWeight: 337.4, engineName: '2 × Saturn AL-31FM1 Afterburning Turbofans' },
    visual: { baseColor: '#38BDF8', accentColor: '#1E3A8A', hullArchetype: 'jet_swept', barrelCount: 1, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 1.32, widthScale: 1.25, heightScale: 0.88 }
  },
  {
    id: 'ru_ka52_alligator',
    name: 'Ka-52 "Alligator"',
    shortName: 'Ka-52',
    nation: 'ussr',
    branch: 'helicopters',
    rank: 'VII',
    rankNum: 7,
    column: 0,
    br: '12.0',
    role: 'Coaxial Attack Helicopter',
    year: 2011,
    crewCount: 2,
    mainGunName: '30 mm 2A42 Cannon + 12 × 9K127 Vikhr Supersonic ATGM',
    caliberMm: 30,
    reloadSeconds: 0.15,
    turretTraverseDegPerSec: 70,
    depressionDeg: -37,
    elevationDeg: 3,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '12 × 9K127 Vikhr (Proximity + Tandem ATGM) + President-S DIRCM + S-13OF Rockets',
    ammoLoadout: [
      { id: 'vikhr_9k127', name: '9K127 Vikhr (Mach 1.8 Dual-Purpose ATGM)', type: 'ATGM', penetrationMm: 800, velocityMs: 610, explosiveMassKg: 4.9, damageRating: 98, description: 'Supersonic laser-beam riding missile with proximity fuse against both tanks and aircraft.' },
      { id: '2a42_heli', name: '30 mm 3UBR8 APDS Autocannon', type: 'APFSDS', penetrationMm: 102, velocityMs: 1120, explosiveMassKg: 0, damageRating: 72, description: 'Side-mounted 30mm high-velocity tank cannon.' }
    ],
    armor: { hullFront: 25, hullSide: 20, hullRear: 12, turretFront: 25, turretSide: 20, turretRear: 12, composition: 'Armored Side-by-Side Ejection Cockpit' },
    mobility: { maxSpeedForwardKmh: 310, maxSpeedReverseKmh: -90, horsepower: 4800, weightTons: 10.4, powerToWeight: 46.1, engineName: '2 × Klimov VK-2500 Turboshafts (Coaxial Rotors)' },
    visual: { baseColor: '#334155', accentColor: '#1E293B', hullArchetype: 'heli_coaxial', barrelCount: 1, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 1.15, widthScale: 1.05, heightScale: 1.12 }
  },
  {
    id: 'ru_kronshtadt',
    name: 'Project 69 Battlecruiser Kronshtadt',
    shortName: 'Kronshtadt',
    nation: 'ussr',
    branch: 'fleet',
    rank: 'VI',
    rankNum: 6,
    column: 0,
    br: '7.0',
    role: 'Battlecruiser',
    year: 1941,
    crewCount: 1123,
    mainGunName: '9 × 305 mm/55 B-50 Triple Turrets',
    caliberMm: 305,
    reloadSeconds: 20.0,
    turretTraverseDegPerSec: 6.0,
    depressionDeg: -3,
    elevationDeg: 45,
    stabilizer: 'Vertical',
    hasLaserRangefinder: true,
    thermalGen: 'None',
    secondaryWeapons: '8 × 152 mm B-38 + 8 × 100 mm B-34 + 28 × 37 mm 70-K AA',
    ammoLoadout: [
      { id: '305_b50_ap', name: '305 mm PB-42 (APCBC)', type: 'APHE', penetrationMm: 695, velocityMs: 900, explosiveMassKg: 10.5, damageRating: 99, description: '900 m/s flat-trajectory 305mm shell with 695mm belt penetration.' },
      { id: '305_b50_sap', name: '305 mm PB-42 SAPBC', type: 'SAP', penetrationMm: 420, velocityMs: 920, explosiveMassKg: 35.0, damageRating: 96, description: 'Semi-armor-piercing shell with massive 35 kg explosive charge.' }
    ],
    armor: { hullFront: 230, hullSide: 230, hullRear: 100, turretFront: 305, turretSide: 125, turretRear: 305, composition: '230mm Inclined Cemented Belt Armor' },
    mobility: { maxSpeedForwardKmh: 62, maxSpeedReverseKmh: -22, horsepower: 210000, weightTons: 38240, powerToWeight: 5.5, engineName: '12 × High-Pressure Boilers + 3 × Brown-Boveri Turbines' },
    visual: { baseColor: '#475569', accentColor: '#334155', hullArchetype: 'naval_battleship', barrelCount: 9, hasERA: false, hasRadar: true, hasAutoloader: false, lengthScale: 1.42, widthScale: 0.92, heightScale: 1.0 }
  },

  // ==========================================
  // GREAT BRITAIN - ARMY / AVIATION / HELI / FLEET
  // ==========================================
  {
    id: 'uk_sherman_firefly',
    name: 'Sherman IC "Firefly" (17-Pounder)',
    shortName: 'Sherman Firefly',
    nation: 'uk',
    branch: 'army',
    rank: 'III',
    rankNum: 3,
    column: 0,
    br: '4.7',
    role: 'Medium Tank',
    year: 1944,
    crewCount: 4,
    mainGunName: '76.2 mm QF 17-Pounder Cannon',
    caliberMm: 76,
    reloadSeconds: 6.3,
    turretTraverseDegPerSec: 20,
    depressionDeg: -5,
    elevationDeg: 25,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '12.7 mm M2HB + 7.62 mm Browning',
    ammoLoadout: [
      { id: 'shot_mk8', name: 'Shot Mk.8 (APCBC)', type: 'APHE', penetrationMm: 190, velocityMs: 884, explosiveMassKg: 0, damageRating: 82, description: 'High-velocity British 17-pounder solid armor-piercing round that punches through Tiger I armor at any combat range.' },
      { id: 'shell_mk1', name: 'Shell Mk.1 (HE)', type: 'HE', penetrationMm: 10, velocityMs: 876, explosiveMassKg: 0.58, damageRating: 48, description: 'High-explosive shell.' }
    ],
    armor: { hullFront: 51, hullSide: 38, hullRear: 38, turretFront: 89, turretSide: 51, turretRear: 63, composition: 'Welded & Cast Steel Hull' },
    mobility: { maxSpeedForwardKmh: 40, maxSpeedReverseKmh: -5, horsepower: 425, weightTons: 32.7, powerToWeight: 13.0, engineName: 'Chrysler A57 Multibank 30-Cylinder' },
    visual: { baseColor: '#4E573B', accentColor: '#313725', hullArchetype: 'ww2_medium', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 0.96, widthScale: 0.95, heightScale: 1.08 }
  },
  {
    id: 'uk_fv4005',
    name: 'FV4005 Stage II "Centaur Barn"',
    shortName: 'FV4005',
    nation: 'uk',
    branch: 'army',
    rank: 'IV',
    rankNum: 4,
    column: 3,
    br: '6.3',
    role: 'Tank Destroyer',
    year: 1955,
    crewCount: 4,
    mainGunName: '183 mm QF L4A1 Cannon',
    caliberMm: 183,
    reloadSeconds: 30.0,
    turretTraverseDegPerSec: 10,
    depressionDeg: -7,
    elevationDeg: 15,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '7.62 mm L3A1 Coaxial MG',
    ammoLoadout: [
      { id: '183_hesh', name: '183 mm Shell L1 (HESH — 21.8 kg TNT eq)', type: 'HESH', penetrationMm: 254, velocityMs: 716, explosiveMassKg: 21.76, damageRating: 100, description: 'Largest tank gun ever built: 72 kg High-Explosive Squash Head round with 21.76 kg explosive payload!' }
    ],
    armor: { hullFront: 76, hullSide: 51, hullRear: 38, turretFront: 14, turretSide: 14, turretRear: 14, composition: 'Centurion Mk.3 Hull + 14mm Splinter-Shield Barn Turret' },
    mobility: { maxSpeedForwardKmh: 29, maxSpeedReverseKmh: -10, horsepower: 650, weightTons: 50.8, powerToWeight: 12.8, engineName: 'Rolls-Royce Meteor V12' },
    visual: { baseColor: '#4A543C', accentColor: '#2E3425', hullArchetype: 'ww2_heavy', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 1.08, widthScale: 1.06, heightScale: 1.35 }
  },
  {
    id: 'uk_challenger_2_bn',
    name: 'Challenger 2 "Black Night" (Iron Fist APS)',
    shortName: 'Challenger 2 BN',
    nation: 'uk',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '12.0',
    role: 'Main Battle Tank',
    year: 2018,
    crewCount: 4,
    mainGunName: '120 mm L30A1 Rifled Tank Cannon',
    caliberMm: 120,
    reloadSeconds: 5.0,
    turretTraverseDegPerSec: 36,
    depressionDeg: -10,
    elevationDeg: 20,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: 'Iron Fist Hard-Kill Active Protection System + 2 × 7.62 mm',
    ammoLoadout: [
      { id: 'l27a1', name: 'L27A1 CHARM 3 (APFSDS)', type: 'APFSDS', penetrationMm: 564, velocityMs: 1650, explosiveMassKg: 0, damageRating: 93, description: 'Depleted uranium penetrator with 5.0s first-stage ready-rack reload.' },
      { id: 'l31a7', name: 'L31A7 (120mm HESH)', type: 'HESH', penetrationMm: 152, velocityMs: 670, explosiveMassKg: 4.13, damageRating: 85, description: 'High-Explosive Squash Head round unique to the British rifled 120mm cannon.' }
    ],
    armor: { hullFront: 580, hullSide: 150, hullRear: 40, turretFront: 980, turretSide: 350, turretRear: 45, composition: '2nd-Gen Dorchester Chobham Composite + Iron Fist Hard-Kill APS' },
    mobility: { maxSpeedForwardKmh: 59, maxSpeedReverseKmh: -37, horsepower: 1200, weightTons: 62.5, powerToWeight: 19.2, engineName: 'Perkins CV12-6A V12 Diesel' },
    visual: { baseColor: '#48523E', accentColor: '#24291F', hullArchetype: 'modern_mbt_western', barrelCount: 1, hasERA: false, hasRadar: true, hasAutoloader: false, lengthScale: 1.14, widthScale: 1.08, heightScale: 0.98 }
  },
  {
    id: 'uk_gripen_c',
    name: 'JAS39C Gripen (SAAF / RAF Eval)',
    shortName: 'JAS39C Gripen',
    nation: 'uk',
    branch: 'aviation',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '13.7',
    role: 'Multirole Delta-Canard Jet',
    year: 2008,
    crewCount: 1,
    mainGunName: '27 mm Mauser BK-27 + R-Darter / AIM-9M',
    caliberMm: 27,
    reloadSeconds: 0.1,
    turretTraverseDegPerSec: 120,
    depressionDeg: -20,
    elevationDeg: 20,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '4 × R-Darter Active Radar + 4 × AGM-65G Maverick + 720 Countermeasure BOL Pods',
    ammoLoadout: [
      { id: 'rdarter_maverick', name: 'R-Darter AAM + AGM-65G Heavy Maverick', type: 'AAM', penetrationMm: 830, velocityMs: 1320, explosiveMassKg: 136.0, damageRating: 99, description: 'Active radar missiles and 136kg heavy penetration warhead Mavericks.' },
      { id: 'bk27_uk', name: '27 mm Mauser BK-27 Revolver Cannon', type: 'CANNON', penetrationMm: 45, velocityMs: 1025, explosiveMassKg: 0.085, damageRating: 84, description: 'High-velocity 27mm aircraft cannon.' }
    ],
    armor: { hullFront: 15, hullSide: 10, hullRear: 10, turretFront: 16, turretSide: 10, turretRear: 10, composition: 'Lightweight Delta-Canard Composite Airframe' },
    mobility: { maxSpeedForwardKmh: 2200, maxSpeedReverseKmh: 0, horsepower: 22000, weightTons: 8.5, powerToWeight: 258.8, engineName: 'Volvo RM12 Afterburning Turbofan' },
    visual: { baseColor: '#64748B', accentColor: '#334155', hullArchetype: 'jet_delta', barrelCount: 1, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 1.12, widthScale: 1.1, heightScale: 0.84 }
  },
  {
    id: 'uk_hms_hood',
    name: 'HMS Hood (51) "The Mighty Hood"',
    shortName: 'HMS Hood',
    nation: 'uk',
    branch: 'fleet',
    rank: 'VI',
    rankNum: 6,
    column: 0,
    br: '7.0',
    role: 'Battlecruiser',
    year: 1941,
    crewCount: 1418,
    mainGunName: '8 × 15-inch/42 (381 mm) BL Mk I Twin Turrets',
    caliberMm: 381,
    reloadSeconds: 24.0,
    turretTraverseDegPerSec: 4.5,
    depressionDeg: -5,
    elevationDeg: 30,
    stabilizer: 'Vertical',
    hasLaserRangefinder: true,
    thermalGen: 'None',
    secondaryWeapons: '14 × 4-inch QF Mk XVI Dual-Purpose + UP AA Rocket Launchers',
    ammoLoadout: [
      { id: '381_mk17b', name: '381 mm Mk.XVIIb APC (879 kg Shell)', type: 'APHE', penetrationMm: 688, velocityMs: 749, explosiveMassKg: 22.0, damageRating: 100, description: 'Massive 15-inch Royal Navy armor-piercing shell with 22 kg Shellite filler.' },
      { id: '381_he', name: '381 mm HE High-Capacity', type: 'HE', penetrationMm: 95, velocityMs: 749, explosiveMassKg: 59.8, damageRating: 95, description: 'Devastating 60 kg explosive broadside.' }
    ],
    armor: { hullFront: 305, hullSide: 305, hullRear: 152, turretFront: 381, turretSide: 305, turretRear: 279, composition: '305mm Inclined Krupp Cemented Belt Armor' },
    mobility: { maxSpeedForwardKmh: 59, maxSpeedReverseKmh: -22, horsepower: 144000, weightTons: 47430, powerToWeight: 3.0, engineName: '24 × Yarrow Boilers + Brown-Curtis Geared Turbines' },
    visual: { baseColor: '#475569', accentColor: '#1E293B', hullArchetype: 'naval_battleship', barrelCount: 9, hasERA: false, hasRadar: true, hasAutoloader: false, lengthScale: 1.48, widthScale: 0.92, heightScale: 1.0 }
  },

  // ==========================================
  // JAPAN - ARMY / AVIATION / FLEET
  // ==========================================
  {
    id: 'jp_type_10',
    name: 'Type 10 Hitomaru (TKX)',
    shortName: 'Type 10',
    nation: 'japan',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '12.0',
    role: 'Main Battle Tank',
    year: 2012,
    crewCount: 3,
    mainGunName: '120 mm JSW L/44 Smoothbore + 4.0s Bustle Autoloader',
    caliberMm: 120,
    reloadSeconds: 4.0,
    turretTraverseDegPerSec: 40,
    depressionDeg: -12,
    elevationDeg: 15,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '12.7 mm M2HB + Hydropneumatic Active Suspension + LWS',
    ammoLoadout: [
      { id: 'type10_apfsds', name: 'Type 10 (APFSDS-T — 4.0s Reload!)', type: 'APFSDS', penetrationMm: 615, velocityMs: 1780, explosiveMassKg: 0, damageRating: 96, description: 'Ultra-fast 4.0-second autoloader firing a 615mm penetration self-sharpening dart!' },
      { id: 'jm12a1', name: 'JM12A1 (HEAT-FS)', type: 'HEAT-FS', penetrationMm: 480, velocityMs: 1140, explosiveMassKg: 1.66, damageRating: 78, description: 'High-explosive anti-tank fin-stabilized shell.' }
    ],
    armor: { hullFront: 590, hullSide: 80, hullRear: 35, turretFront: 820, turretSide: 220, turretRear: 40, composition: 'Nano-Crystal Steel & Modular Ceramic Composite' },
    mobility: { maxSpeedForwardKmh: 70, maxSpeedReverseKmh: -70, horsepower: 1200, weightTons: 44.4, powerToWeight: 27.0, engineName: 'Mitsubishi 8VA34WTK V8 + CVT Transmission (70 km/h Reverse!)' },
    visual: { baseColor: '#48543E', accentColor: '#5C4B3B', hullArchetype: 'modern_mbt_western', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: true, lengthScale: 1.06, widthScale: 1.02, heightScale: 0.92 }
  },
  {
    id: 'jp_type_90_fuji',
    name: 'Type 90B "Fuji" (JGSDF)',
    shortName: 'Type 90B "Fuji"',
    nation: 'japan',
    branch: 'army',
    rank: 'VII',
    rankNum: 7,
    column: 1,
    br: '11.3',
    role: 'Main Battle Tank',
    isPremium: true,
    year: 1992,
    crewCount: 3,
    mainGunName: '120 mm Rheinmetall L/44 + 4.0s Autoloader',
    caliberMm: 120,
    reloadSeconds: 4.0,
    turretTraverseDegPerSec: 40,
    depressionDeg: -12,
    elevationDeg: 15,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 1',
    secondaryWeapons: '12.7 mm M2HB + 7.62 mm Type 74',
    ammoLoadout: [
      { id: 'jm33', name: 'JM33 (APFSDS — 4.0s Reload)', type: 'APFSDS', penetrationMm: 481, velocityMs: 1650, explosiveMassKg: 0, damageRating: 91, description: '4.0-second autoloader + 30 HP/ton mobility.' },
      { id: 'jm12a1_90', name: 'JM12A1 (HEAT-FS)', type: 'HEAT-FS', penetrationMm: 480, velocityMs: 1140, explosiveMassKg: 1.66, damageRating: 78, description: 'Shaped charge shell.' }
    ],
    armor: { hullFront: 490, hullSide: 80, hullRear: 35, turretFront: 640, turretSide: 180, turretRear: 40, composition: 'Modular Ceramic Composite' },
    mobility: { maxSpeedForwardKmh: 73, maxSpeedReverseKmh: -34, horsepower: 1500, weightTons: 50.2, powerToWeight: 29.9, engineName: 'Mitsubishi 10ZG32WT 10-Cylinder Two-Stroke' },
    visual: { baseColor: '#48543E', accentColor: '#5C4B3B', hullArchetype: 'modern_mbt_western', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: true, lengthScale: 1.08, widthScale: 1.04, heightScale: 0.94 }
  },
  {
    id: 'jp_f15j_m',
    name: 'F-15J(M) Eagle (JASDF)',
    shortName: 'F-15J(M)',
    nation: 'japan',
    branch: 'aviation',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '13.7',
    role: 'Air Superiority Twin-Engine Fighter',
    year: 2004,
    crewCount: 1,
    mainGunName: '20 mm JM61A1 Vulcan + AAM-4 / AAM-3',
    caliberMm: 20,
    reloadSeconds: 0.1,
    turretTraverseDegPerSec: 120,
    depressionDeg: -20,
    elevationDeg: 20,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 2',
    secondaryWeapons: '4 × AAM-4 Active Radar + 4 × AAM-3 High-G IR Missiles',
    ammoLoadout: [
      { id: 'aam4', name: 'AAM-4 Active Radar + AAM-3 40G IR', type: 'AAM', penetrationMm: 600, velocityMs: 1450, explosiveMassKg: 42.0, damageRating: 98, description: 'Indigenous Japanese radar-guided and high-off-boresight dogfight missiles.' },
      { id: 'jm61_vulcan', name: '20 mm JM61A1 Vulcan 940-Round Drum', type: 'CANNON', penetrationMm: 53, velocityMs: 1050, explosiveMassKg: 0.02, damageRating: 78, description: '6,000 RPM rotary cannon.' }
    ],
    armor: { hullFront: 16, hullSide: 12, hullRear: 10, turretFront: 18, turretSide: 12, turretRear: 10, composition: 'Titanium-Aluminum Heavy Twin-Tail Airframe' },
    mobility: { maxSpeedForwardKmh: 2655, maxSpeedReverseKmh: 0, horsepower: 48000, weightTons: 14.3, powerToWeight: 335.6, engineName: '2 × IHI/Pratt & Whitney F100-IHI-220E' },
    visual: { baseColor: '#64748B', accentColor: '#334155', hullArchetype: 'jet_swept', barrelCount: 1, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 1.3, widthScale: 1.22, heightScale: 0.9 }
  },
  {
    id: 'jp_ijn_mutsu',
    name: 'IJN Mutsu (Nagato-Class Battleship)',
    shortName: 'IJN Mutsu',
    nation: 'japan',
    branch: 'fleet',
    rank: 'VI',
    rankNum: 6,
    column: 0,
    br: '7.0',
    role: 'Super-Dreadnought Battleship',
    year: 1921,
    crewCount: 1360,
    mainGunName: '8 × 410 mm/45 3rd Year Type Twin Turrets',
    caliberMm: 410,
    reloadSeconds: 21.5,
    turretTraverseDegPerSec: 4.0,
    depressionDeg: -3,
    elevationDeg: 43,
    stabilizer: 'Vertical',
    hasLaserRangefinder: true,
    thermalGen: 'None',
    secondaryWeapons: '20 × 140 mm/50 Casemates + 8 × 533 mm Torpedo Tubes',
    ammoLoadout: [
      { id: '410_type91', name: '410 mm Type 91 APC (1,020 kg Shell!)', type: 'APHE', penetrationMm: 745, velocityMs: 780, explosiveMassKg: 14.9, damageRating: 100, description: 'Colossal 16.1-inch diving armor-piercing battleship shell with 745mm belt penetration.' },
      { id: '410_type0', name: '410 mm Type 0 HE (61 kg Explosive)', type: 'HE', penetrationMm: 105, velocityMs: 790, explosiveMassKg: 61.1, damageRating: 97, description: 'Massive high-explosive broadside shell.' }
    ],
    armor: { hullFront: 305, hullSide: 305, hullRear: 203, turretFront: 356, turretSide: 230, turretRear: 190, composition: '305mm Vickers Cemented Naval Belt Armor' },
    mobility: { maxSpeedForwardKmh: 49, maxSpeedReverseKmh: -20, horsepower: 80000, weightTons: 39050, powerToWeight: 2.05, engineName: '21 × Kampon Boilers + 4 × Gihon Geared Turbines' },
    visual: { baseColor: '#475569', accentColor: '#1E293B', hullArchetype: 'naval_battleship', barrelCount: 9, hasERA: false, hasRadar: true, hasAutoloader: false, lengthScale: 1.46, widthScale: 0.94, heightScale: 1.05 }
  },

  // ==========================================
  // SWEDEN - ARMY / AVIATION
  // ==========================================
  {
    id: 'se_strv_103c',
    name: 'Stridsvagn 103C "S-Tank" (Wedge)',
    shortName: 'Strv 103C',
    nation: 'sweden',
    branch: 'army',
    rank: 'VI',
    rankNum: 6,
    column: 1,
    br: '8.7',
    role: 'Main Battle Tank (Turretless)',
    year: 1986,
    crewCount: 3,
    mainGunName: '105 mm Bofors L74 Rifled (4.0s Autoloader)',
    caliberMm: 105,
    reloadSeconds: 4.0,
    turretTraverseDegPerSec: 32,
    depressionDeg: -11,
    elevationDeg: 12,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'NVG',
    secondaryWeapons: '3 × 7.62 mm Ksp 58 + Hydropneumatic Hull-Aiming + Dozer Blade',
    ammoLoadout: [
      { id: 'slpprj_m80', name: 'slpprj m/80 (APFSDS)', type: 'APFSDS', penetrationMm: 353, velocityMs: 1455, explosiveMassKg: 0, damageRating: 88, description: '4.0-second autoloaded fin-stabilized sabot round.' },
      { id: 'slpprj_m66', name: 'slpprj m/66 (APDS)', type: 'APFSDS', penetrationMm: 358, velocityMs: 1500, explosiveMassKg: 0, damageRating: 78, description: 'High-velocity sub-caliber sabot.' }
    ],
    armor: { hullFront: 420, hullSide: 50, hullRear: 30, turretFront: 420, turretSide: 50, turretRear: 30, composition: '78° Extreme Slope Ribbed Glacis + Front Fuel/Slat Grille' },
    mobility: { maxSpeedForwardKmh: 50, maxSpeedReverseKmh: -50, horsepower: 780, weightTons: 42.5, powerToWeight: 18.4, engineName: 'Detroit Diesel 6V53T + Boeing 553 Gas Turbine' },
    visual: { baseColor: '#48523E', accentColor: '#2B3124', hullArchetype: 'casemate_td', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: true, lengthScale: 1.05, widthScale: 1.06, heightScale: 0.72 }
  },
  {
    id: 'se_strv_122b_plus',
    name: 'Stridsvagn 122B+ (Evolution)',
    shortName: 'Strv 122B+',
    nation: 'sweden',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '12.0',
    role: 'Main Battle Tank',
    year: 2010,
    crewCount: 4,
    mainGunName: '120 mm kan Strv 122 (Rh-120 L/44)',
    caliberMm: 120,
    reloadSeconds: 6.0,
    turretTraverseDegPerSec: 40,
    depressionDeg: -9,
    elevationDeg: 20,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 2',
    secondaryWeapons: '2 × 7.62 mm Ksp 94 + Roof Spall Liner',
    ammoLoadout: [
      { id: 'slpprj_m95', name: 'slpprj m/95 (APFSDS)', type: 'APFSDS', penetrationMm: 589, velocityMs: 1640, explosiveMassKg: 0, damageRating: 95, description: 'Heavy Israeli-Swedish tungsten kinetic penetrator.' },
      { id: 'slsgr_m95', name: 'slsgr m/95 (HE-FS)', type: 'HE', penetrationMm: 38, velocityMs: 950, explosiveMassKg: 3.1, damageRating: 82, description: 'High-explosive fragmentation round.' }
    ],
    armor: { hullFront: 810, hullSide: 240, hullRear: 40, turretFront: 1120, turretSide: 420, turretRear: 45, composition: 'AMAP-B Evolution Heavy Composite Armor + Internal Spall Liner' },
    mobility: { maxSpeedForwardKmh: 68, maxSpeedReverseKmh: -31, horsepower: 1500, weightTons: 64.5, powerToWeight: 23.3, engineName: 'MTU MB 873 Ka-501 V12' },
    visual: { baseColor: '#3E4C37', accentColor: '#242D20', hullArchetype: 'modern_mbt_western', barrelCount: 1, hasERA: true, hasRadar: false, hasAutoloader: false, lengthScale: 1.14, widthScale: 1.1, heightScale: 0.96 }
  },
  {
    id: 'se_cv90120',
    name: 'CV 90120-T "Ghost"',
    shortName: 'CV 90120',
    nation: 'sweden',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 2,
    br: '11.3',
    role: 'Light Tank',
    year: 2001,
    crewCount: 4,
    mainGunName: '120 mm CTG Compact Smoothbore (5.0s Autoloader)',
    caliberMm: 120,
    reloadSeconds: 5.0,
    turretTraverseDegPerSec: 40,
    depressionDeg: -8,
    elevationDeg: 22,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: 'UTAAS Acoustic & Laser Warning Active Defense Suite',
    ammoLoadout: [
      { id: 'slpprj_m95_cv', name: 'slpprj m/95 (120mm APFSDS — 5.0s Reload)', type: 'APFSDS', penetrationMm: 598, velocityMs: 1680, explosiveMassKg: 0, damageRating: 95, description: 'Full-caliber 120mm L/50 smoothbore cannon mounted on a nimble 27-ton chassis.' },
      { id: 'slsgr_m95_cv', name: 'slsgr m/95 (HE-FS)', type: 'HE', penetrationMm: 38, velocityMs: 950, explosiveMassKg: 3.1, damageRating: 82, description: 'High-explosive round.' }
    ],
    armor: { hullFront: 40, hullSide: 35, hullRear: 20, turretFront: 40, turretSide: 30, turretRear: 20, composition: 'High-Hardness Spaced Steel + AMAP Appliqué' },
    mobility: { maxSpeedForwardKmh: 70, maxSpeedReverseKmh: -40, horsepower: 670, weightTons: 27.7, powerToWeight: 24.2, engineName: 'Scania DS14 V8 Turbo Diesel' },
    visual: { baseColor: '#43523B', accentColor: '#2A3325', hullArchetype: 'light_ifv', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: true, lengthScale: 1.02, widthScale: 0.98, heightScale: 0.94 }
  },

  // ==========================================
  // FRANCE - ARMY / AVIATION
  // ==========================================
  {
    id: 'fr_amx13_75',
    name: 'AMX-13 (SA50 Oscillating Turret)',
    shortName: 'AMX-13',
    nation: 'france',
    branch: 'army',
    rank: 'IV',
    rankNum: 4,
    column: 2,
    br: '6.7',
    role: 'Light Tank',
    year: 1952,
    crewCount: 3,
    mainGunName: '75 mm SA50 L/57 + 12-Round Drum Autoloader',
    caliberMm: 75,
    reloadSeconds: 5.0,
    turretTraverseDegPerSec: 30,
    depressionDeg: -6,
    elevationDeg: 13,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '7.5 mm MAC 31 Coaxial MG',
    ammoLoadout: [
      { id: 'pot51a', name: 'POT-51A (APCBC)', type: 'APHE', penetrationMm: 202, velocityMs: 1000, explosiveMassKg: 0, damageRating: 83, description: '1,000 m/s French 75mm round fed by dual 6-round revolver drums.' }
    ],
    armor: { hullFront: 40, hullSide: 20, hullRear: 15, turretFront: 40, turretSide: 20, turretRear: 15, composition: 'Welded Steel FL-10 Oscillating Turret' },
    mobility: { maxSpeedForwardKmh: 61, maxSpeedReverseKmh: -7, horsepower: 250, weightTons: 14.7, powerToWeight: 17.0, engineName: 'SOFAM Model 8Gxb' },
    visual: { baseColor: '#4C5840', accentColor: '#2E3627', hullArchetype: 'light_ifv', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: true, lengthScale: 0.88, widthScale: 0.88, heightScale: 0.92 }
  },
  {
    id: 'fr_leclerc_sxxi',
    name: 'AMX-56 Leclerc Série XXI (SXXI)',
    shortName: 'Leclerc SXXI',
    nation: 'france',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '12.0',
    role: 'Main Battle Tank',
    year: 2003,
    crewCount: 3,
    mainGunName: '120 mm GIAT CN120-26 L/52 + 5.0s Autoloader',
    caliberMm: 120,
    reloadSeconds: 5.0,
    turretTraverseDegPerSec: 40,
    depressionDeg: -8,
    elevationDeg: 15,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '12.7 mm M2HB Coaxial Heavy Machine Gun + 7.62 mm AAN-F1',
    ammoLoadout: [
      { id: 'ofl120_f1', name: 'OFL 120 F1 (APFSDS — 5.0s Autoloader)', type: 'APFSDS', penetrationMm: 575, velocityMs: 1790, explosiveMassKg: 0, damageRating: 95, description: '1,790 m/s flat-trajectory French tungsten penetrator with 5.0s bustle autoloader.' },
      { id: 'oecc_120', name: 'OECC 120 F1 (HEAT-FS)', type: 'HEAT-FS', penetrationMm: 480, velocityMs: 1100, explosiveMassKg: 1.66, damageRating: 78, description: 'Multi-purpose shaped-charge shell.' }
    ],
    armor: { hullFront: 590, hullSide: 140, hullRear: 35, turretFront: 780, turretSide: 280, turretRear: 40, composition: 'Titanium-Tungsten Modular NERA Composite' },
    mobility: { maxSpeedForwardKmh: 71, maxSpeedReverseKmh: -38, horsepower: 1500, weightTons: 57.4, powerToWeight: 26.1, engineName: 'SACM V8X-1500 Hyperbar Diesel-Turbine' },
    visual: { baseColor: '#48543E', accentColor: '#2B3325', hullArchetype: 'modern_mbt_western', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: true, lengthScale: 1.1, widthScale: 1.06, heightScale: 0.94 }
  },
  {
    id: 'fr_mirage_2000_5f',
    name: 'Mirage 2000-5F',
    shortName: 'Mirage 2000-5F',
    nation: 'france',
    branch: 'aviation',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '13.7',
    role: 'Multirole Delta Jet Fighter',
    year: 1999,
    crewCount: 1,
    mainGunName: '2 × 30 mm DEFA 554 Revolver Cannons + MICA-EM',
    caliberMm: 30,
    reloadSeconds: 0.1,
    turretTraverseDegPerSec: 120,
    depressionDeg: -20,
    elevationDeg: 20,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '6 × MICA-EM Thrust-Vectoring Radar Missiles + AS-30L Laser AGM',
    ammoLoadout: [
      { id: 'mica_em', name: 'MICA-EM 50G Active Radar + AS-30L Laser AGM', type: 'AAM', penetrationMm: 800, velocityMs: 1400, explosiveMassKg: 120.0, damageRating: 99, description: '50G thrust-vectoring active radar missiles + supersonic laser-guided ground strike.' },
      { id: 'defa_554', name: '2 × 30 mm DEFA 554 (3,600 RPM Combined)', type: 'CANNON', penetrationMm: 52, velocityMs: 820, explosiveMassKg: 0.05, damageRating: 85, description: 'Twin 30mm revolver cannons.' }
    ],
    armor: { hullFront: 14, hullSide: 10, hullRear: 10, turretFront: 16, turretSide: 10, turretRear: 10, composition: 'Pure Tailless Delta Composite Airframe' },
    mobility: { maxSpeedForwardKmh: 2336, maxSpeedReverseKmh: 0, horsepower: 24000, weightTons: 9.5, powerToWeight: 252.6, engineName: 'SNECMA M53-P2 Afterburning Turbofan' },
    visual: { baseColor: '#64748B', accentColor: '#3B82F6', hullArchetype: 'jet_delta', barrelCount: 2, hasERA: false, hasRadar: true, hasAutoloader: true, lengthScale: 1.15, widthScale: 1.18, heightScale: 0.85 }
  },

  // ==========================================
  // ITALY - ARMY
  {
    id: 'it_r3_t106',
    name: 'R3 T106 FA-HS "Rat Tank" (Twin 105mm Recoilless Rifles)',
    shortName: 'R3 T106 (Twin 105mm)',
    nation: 'italy',
    branch: 'army',
    rank: 'IV',
    rankNum: 4,
    column: 1,
    br: '7.3',
    role: 'Wheeled Tank Destroyer',
    year: 1982,
    crewCount: 3,
    mainGunName: 'Twin 105 mm M40A1 Recoilless Rifles',
    caliberMm: 105,
    reloadSeconds: 4.5,
    turretTraverseDegPerSec: 42,
    depressionDeg: -10,
    elevationDeg: 15,
    stabilizer: 'None',
    hasLaserRangefinder: false,
    thermalGen: 'None',
    secondaryWeapons: '12.7 mm M80 Spotting Rifle + 7.62 mm Beretta MG 42/59',
    ammoLoadout: [
      {
        id: 'm344a1_heat',
        name: 'M344A1 (105mm HEAT-FS — 433mm Pen)',
        type: 'HEAT-FS',
        penetrationMm: 433,
        velocityMs: 503,
        explosiveMassKg: 1.27,
        damageRating: 94,
        description: 'Fin-stabilized shaped charge projectile capable of defeating 433 mm of armor at any combat distance.',
      },
      {
        id: 'm346a1_hesh',
        name: 'M346A1 (105mm HESH — 3.5kg Comp B)',
        type: 'HESH',
        penetrationMm: 152,
        velocityMs: 498,
        explosiveMassKg: 3.5,
        damageRating: 88,
        description: 'High-Explosive Squash Head round with 3.5 kg explosive filler that creates catastrophic spalling and overpressure.',
      },
      {
        id: 'm80_tracer',
        name: '12.7mm M80 Ball Tracer Spotting Round',
        type: 'APCR',
        penetrationMm: 24,
        velocityMs: 532,
        explosiveMassKg: 0.01,
        damageRating: 30,
        description: 'Ballistic trajectory-matching spotting round for zeroing target range before firing recoilless rifles.',
      },
    ],
    armor: {
      hullFront: 33,
      hullSide: 15,
      hullRear: 15,
      turretFront: 20,
      turretSide: 15,
      turretRear: 10,
      composition: 'Welded High-Hardness Aluminum Alloy (Ultra-Light 3.2-Ton Rat Chassis)',
    },
    mobility: {
      maxSpeedForwardKmh: 115,
      maxSpeedReverseKmh: -35,
      horsepower: 160,
      weightTons: 3.2,
      powerToWeight: 50.0,
      engineName: 'Fiat 8140.21 Turbodiesel (115 km/h Rat Mobility)',
    },
    visual: {
      baseColor: '#4f5942',
      accentColor: '#2d3326',
      hullArchetype: 'wheeled_striker',
      barrelCount: 2,
      hasERA: false,
      hasRadar: false,
      hasAutoloader: false,
      lengthScale: 0.62,
      widthScale: 0.68,
      heightScale: 0.66,
    },
  },
  {
    id: 'it_centauro_120',
    name: 'B1 Centauro I 120 (OMT)',
    shortName: 'Centauro I 120',
    nation: 'italy',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 2,
    br: '11.3',
    role: 'Wheeled Tank Destroyer',
    year: 2002,
    crewCount: 4,
    mainGunName: '120 mm OTO Breda L/45 High-Pressure Smoothbore',
    caliberMm: 120,
    reloadSeconds: 5.0,
    turretTraverseDegPerSec: 40,
    depressionDeg: -6,
    elevationDeg: 16,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 2',
    secondaryWeapons: '2 × 7.62 mm MG3 + 8×8 H-Drive Wheeled Steering',
    ammoLoadout: [
      { id: 'dm53_it', name: 'DM53 (120mm APFSDS)', type: 'APFSDS', penetrationMm: 623, velocityMs: 1670, explosiveMassKg: 0, damageRating: 95, description: '623mm penetration DM53 round on a 110 km/h 8x8 wheeled tank destroyer.' },
      { id: 'dm12a1_it', name: 'DM12A1 (HEAT-FS)', type: 'HEAT-FS', penetrationMm: 480, velocityMs: 1140, explosiveMassKg: 1.66, damageRating: 78, description: 'Multi-purpose HEAT round.' }
    ],
    armor: { hullFront: 40, hullSide: 25, hullRear: 20, turretFront: 45, turretSide: 30, turretRear: 20, composition: 'High-Hardness Welded Ballistic Steel + Composite Turret Appliqué' },
    mobility: { maxSpeedForwardKmh: 110, maxSpeedReverseKmh: -40, horsepower: 520, weightTons: 25.6, powerToWeight: 20.3, engineName: 'Iveco MTCA V6 Turbo Diesel' },
    visual: { baseColor: '#4E5B42', accentColor: '#2E3627', hullArchetype: 'wheeled_striker', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 1.08, widthScale: 0.96, heightScale: 0.98 }
  },
  {
    id: 'it_ariete_amv',
    name: 'C1 Ariete AMV PT1',
    shortName: 'Ariete AMV',
    nation: 'italy',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '11.7',
    role: 'Main Battle Tank',
    year: 2022,
    crewCount: 4,
    mainGunName: '120 mm OTO Breda L/44 Smoothbore',
    caliberMm: 120,
    reloadSeconds: 6.0,
    turretTraverseDegPerSec: 40,
    depressionDeg: -9,
    elevationDeg: 20,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: '12.7 mm M2HB + 7.62 mm MG3 + Laser Warning Receiver',
    ammoLoadout: [
      { id: 'dm53_ariete', name: 'DM53 (APFSDS)', type: 'APFSDS', penetrationMm: 623, velocityMs: 1670, explosiveMassKg: 0, damageRating: 95, description: 'Top-tier 120mm kinetic penetrator.' }
    ],
    armor: { hullFront: 450, hullSide: 100, hullRear: 35, turretFront: 580, turretSide: 220, turretRear: 35, composition: 'Spaced Steel/Composite Laminate' },
    mobility: { maxSpeedForwardKmh: 72, maxSpeedReverseKmh: -40, horsepower: 1500, weightTons: 55.0, powerToWeight: 27.3, engineName: 'Iveco V12 MTCA AMV 1500 HP' },
    visual: { baseColor: '#48543E', accentColor: '#2B3325', hullArchetype: 'modern_mbt_western', barrelCount: 1, hasERA: false, hasRadar: false, hasAutoloader: false, lengthScale: 1.1, widthScale: 1.04, heightScale: 0.96 }
  },

  // ==========================================
  // CHINA - ARMY
  // ==========================================
  {
    id: 'cn_ztz99a',
    name: 'ZTZ99A (Type 99A)',
    shortName: 'ZTZ99A',
    nation: 'china',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '12.0',
    role: 'Main Battle Tank',
    year: 2011,
    crewCount: 3,
    mainGunName: '125 mm ZPT-98 Smoothbore + Autoloader',
    caliberMm: 125,
    reloadSeconds: 7.1,
    turretTraverseDegPerSec: 40,
    depressionDeg: -7,
    elevationDeg: 15,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 2',
    secondaryWeapons: '12.7 mm QJC-88 + JD-3 Laser Active Defense Countermeasure',
    ammoLoadout: [
      { id: 'dtc10_125', name: 'DTC10-125 (APFSDS)', type: 'APFSDS', penetrationMm: 577, velocityMs: 1760, explosiveMassKg: 0, damageRating: 95, description: 'High-velocity 1,760 m/s 125mm long-rod tungsten dart.' },
      { id: 'gp125', name: 'GP125 (Tandem Laser ATGM)', type: 'ATGM', penetrationMm: 850, velocityMs: 350, explosiveMassKg: 4.5, damageRating: 91, description: 'Barrel-launched tandem anti-tank missile.' }
    ],
    armor: { hullFront: 730, hullSide: 180, hullRear: 45, turretFront: 920, turretSide: 360, turretRear: 60, composition: 'FY-4/FY-5 Heavy Explosive Reactive Armor + Composite' },
    mobility: { maxSpeedForwardKmh: 75, maxSpeedReverseKmh: -34, horsepower: 1500, weightTons: 55.0, powerToWeight: 27.3, engineName: '150HB-2 V12 Twin-Turbo Diesel (34 km/h Reverse!)' },
    visual: { baseColor: '#44523A', accentColor: '#293323', hullArchetype: 'modern_mbt_eastern', barrelCount: 1, hasERA: true, hasRadar: false, hasAutoloader: true, lengthScale: 1.12, widthScale: 1.06, heightScale: 0.92 }
  },

  // ==========================================
  // ISRAEL - ARMY
  // ==========================================
  {
    id: 'il_merkava_mk4m',
    name: 'Merkava Mk.4M "Windbreaker" (Trophy APS)',
    shortName: 'Merkava Mk.4M',
    nation: 'israel',
    branch: 'army',
    rank: 'VIII',
    rankNum: 8,
    column: 0,
    br: '12.0',
    role: 'Main Battle Tank',
    year: 2011,
    crewCount: 4,
    mainGunName: '120 mm IMI MG253 Smoothbore Cannon',
    caliberMm: 120,
    reloadSeconds: 6.0,
    turretTraverseDegPerSec: 40,
    depressionDeg: -8,
    elevationDeg: 20,
    stabilizer: 'Two-Plane',
    hasLaserRangefinder: true,
    thermalGen: 'Gen 3',
    secondaryWeapons: 'Rafael Trophy HV Hard-Kill APS + 12.7 mm M2HB + 60 mm Internal Mortar',
    ammoLoadout: [
      { id: 'm338', name: 'M338 (APFSDS)', type: 'APFSDS', penetrationMm: 611, velocityMs: 1680, explosiveMassKg: 0, damageRating: 95, description: 'Israeli high-density tungsten alloy penetrator with 611mm penetration.' },
      { id: 'm339', name: 'M339 (Programmable HE-TF)', type: 'HE', penetrationMm: 38, velocityMs: 900, explosiveMassKg: 2.9, damageRating: 82, description: 'Multi-purpose programmable high-explosive shell.' }
    ],
    armor: { hullFront: 580, hullSide: 140, hullRear: 50, turretFront: 820, turretSide: 380, turretRear: 100, composition: 'Front-Mounted Engine Block + Sloped Modular SLERA + Trophy APS' },
    mobility: { maxSpeedForwardKmh: 64, maxSpeedReverseKmh: -30, horsepower: 1500, weightTons: 65.0, powerToWeight: 23.1, engineName: 'General Dynamics GD883 V12 Diesel' },
    visual: { baseColor: '#7E7863', accentColor: '#545042', hullArchetype: 'modern_mbt_western', barrelCount: 1, hasERA: false, hasRadar: true, hasAutoloader: false, lengthScale: 1.15, widthScale: 1.1, heightScale: 1.0 }
  },
];

export const VEHICLES: VehicleSpec[] = (() => {
  const combined = [...ADDITIONAL_TECH_TREE_TANKS, ...BASE_VEHICLES];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const list: VehicleSpec[] = [];
  for (const v of combined) {
    const norm = v.name.toLowerCase().trim();
    if (!seenIds.has(v.id) && !seenNames.has(norm)) {
      seenIds.add(v.id);
      seenNames.add(norm);
      list.push(v);
    }
  }
  return list;
})();

// Additional quick-search / catalog presets so users can spawn ANY classic War Thunder vehicle by name!
export interface QuickSpawnPreset {
  name: string;
  nation: NationId;
  branch: BranchId;
  rank: RankRoman;
  br: string;
  role: string;
  caliberMm: number;
  reloadSeconds: number;
  penetrationMm: number;
  maxSpeedForwardKmh: number;
  hullArchetype: VehicleSpec['visual']['hullArchetype'];
}

export const EXTRA_WT_CATALOG: QuickSpawnPreset[] = [
  { name: 'M22 Locust', nation: 'usa', branch: 'army', rank: 'I', br: '2.0', role: 'Light Tank', caliberMm: 37, reloadSeconds: 3.7, penetrationMm: 87, maxSpeedForwardKmh: 64, hullArchetype: 'light_ifv' },
  { name: 'M26 Pershing', nation: 'usa', branch: 'army', rank: 'IV', br: '6.7', role: 'Medium Tank', caliberMm: 90, reloadSeconds: 8.6, penetrationMm: 185, maxSpeedForwardKmh: 48, hullArchetype: 'ww2_medium' },
  { name: 'T95 "Doom Turtle"', nation: 'usa', branch: 'army', rank: 'IV', br: '7.0', role: 'Tank Destroyer', caliberMm: 105, reloadSeconds: 15.2, penetrationMm: 278, maxSpeedForwardKmh: 13, hullArchetype: 'casemate_td' },
  { name: 'HSTV-L "Spookston Special"', nation: 'usa', branch: 'army', rank: 'VII', br: '11.3', role: 'Light Tank', caliberMm: 75, reloadSeconds: 1.5, penetrationMm: 276, maxSpeedForwardKmh: 84, hullArchetype: 'light_ifv' },
  { name: 'F-14B Tomcat', nation: 'usa', branch: 'aviation', rank: 'VIII', br: '13.0', role: 'Jet Fighter', caliberMm: 20, reloadSeconds: 0.1, penetrationMm: 600, maxSpeedForwardKmh: 2485, hullArchetype: 'jet_swept' },
  { name: 'A-10A Thunderbolt II "Warthog"', nation: 'usa', branch: 'aviation', rank: 'VI', br: '10.3', role: 'Strike Aircraft', caliberMm: 30, reloadSeconds: 0.08, penetrationMm: 102, maxSpeedForwardKmh: 706, hullArchetype: 'prop_fighter' },
  { name: '8,8 cm Flak 37 Sfl.', nation: 'germany', branch: 'army', rank: 'II', br: '4.0', role: 'Tank Destroyer / SPG', caliberMm: 88, reloadSeconds: 4.8, penetrationMm: 165, maxSpeedForwardKmh: 51, hullArchetype: 'casemate_td' },
  { name: 'Sturmtiger (38 cm Sturmmörser)', nation: 'germany', branch: 'army', rank: 'IV', br: '5.7', role: 'Tank Destroyer', caliberMm: 380, reloadSeconds: 40.0, penetrationMm: 350, maxSpeedForwardKmh: 38, hullArchetype: 'casemate_td' },
  { name: 'Jagdtiger (12.8 cm PaK 44)', nation: 'germany', branch: 'army', rank: 'IV', br: '6.7', role: 'Tank Destroyer', caliberMm: 128, reloadSeconds: 17.6, penetrationMm: 272, maxSpeedForwardKmh: 38, hullArchetype: 'casemate_td' },
  { name: 'Wiesel 1A4 (20mm Rh202)', nation: 'germany', branch: 'army', rank: 'V', br: '7.3', role: 'Light Tank / SPAA', caliberMm: 20, reloadSeconds: 0.15, penetrationMm: 66, maxSpeedForwardKmh: 79, hullArchetype: 'light_ifv' },
  { name: 'KMS Bismarck', nation: 'germany', branch: 'fleet', rank: 'VI', br: '7.3', role: 'Battleship', caliberMm: 380, reloadSeconds: 23.0, penetrationMm: 742, maxSpeedForwardKmh: 56, hullArchetype: 'naval_battleship' },
  { name: 'BT-7M', nation: 'ussr', branch: 'army', rank: 'II', br: '2.0', role: 'Light Tank', caliberMm: 45, reloadSeconds: 3.8, penetrationMm: 70, maxSpeedForwardKmh: 72, hullArchetype: 'light_ifv' },
  { name: 'Object 279 "Lunar Rover"', nation: 'ussr', branch: 'army', rank: 'VI', br: '9.0', role: 'Heavy Tank', caliberMm: 130, reloadSeconds: 8.5, penetrationMm: 363, maxSpeedForwardKmh: 55, hullArchetype: 'ww2_heavy' },
  { name: 'BTR-80A', nation: 'ussr', branch: 'army', rank: 'V', br: '7.3', role: 'Wheeled IFV', caliberMm: 30, reloadSeconds: 0.18, penetrationMm: 102, maxSpeedForwardKmh: 88, hullArchetype: 'wheeled_striker' },
  { name: 'MiG-29SMT "Fulcrum"', nation: 'ussr', branch: 'aviation', rank: 'VIII', br: '13.3', role: 'Jet Fighter', caliberMm: 30, reloadSeconds: 0.1, penetrationMm: 700, maxSpeedForwardKmh: 2450, hullArchetype: 'jet_swept' },
  { name: 'L3/33 CC (20mm Tankette)', nation: 'italy', branch: 'army', rank: 'I', br: '1.0', role: 'Tank Destroyer', caliberMm: 20, reloadSeconds: 1.5, penetrationMm: 38, maxSpeedForwardKmh: 42, hullArchetype: 'casemate_td' },
  { name: 'R3 T20 FA-HS', nation: 'italy', branch: 'army', rank: 'III', br: '5.7', role: 'Wheeled SPAA', caliberMm: 20, reloadSeconds: 0.12, penetrationMm: 57, maxSpeedForwardKmh: 115, hullArchetype: 'wheeled_striker' },
  { name: 'R3 T106 FA-HS "Rat Tank" (Twin 105mm Recoilless)', nation: 'italy', branch: 'army', rank: 'IV', br: '7.3', role: 'Wheeled Tank Destroyer', caliberMm: 105, reloadSeconds: 4.5, penetrationMm: 433, maxSpeedForwardKmh: 115, hullArchetype: 'wheeled_striker' },
  { name: 'IJN Yamato (460mm)', nation: 'japan', branch: 'fleet', rank: 'VI', br: '7.7', role: 'Super Battleship', caliberMm: 460, reloadSeconds: 26.0, penetrationMm: 864, maxSpeedForwardKmh: 50, hullArchetype: 'naval_battleship' },
];

export function buildVehicleFromPreset(preset: QuickSpawnPreset): VehicleSpec {
  const rankMap: Record<RankRoman, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };
  const isModern = parseFloat(preset.br) >= 8.0;
  const isAir = preset.branch === 'aviation';
  const isNaval = preset.branch === 'fleet';

  return {
    id: `custom_${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    name: preset.name,
    shortName: preset.name.split(' (')[0],
    nation: preset.nation,
    branch: preset.branch,
    rank: preset.rank,
    rankNum: rankMap[preset.rank] || 5,
    column: 1,
    br: preset.br,
    role: preset.role,
    isPremium: true,
    year: isModern ? 1995 : 1944,
    crewCount: isAir ? 1 : isNaval ? 1800 : 4,
    mainGunName: `${preset.caliberMm} mm Main Armament`,
    caliberMm: preset.caliberMm,
    reloadSeconds: preset.reloadSeconds,
    turretTraverseDegPerSec: isModern ? 40 : 20,
    depressionDeg: -8,
    elevationDeg: 20,
    stabilizer: isModern ? 'Two-Plane' : 'None',
    hasLaserRangefinder: isModern,
    thermalGen: isModern ? 'Gen 2' : 'None',
    secondaryWeapons: 'Coaxial & Roof Machine Guns',
    ammoLoadout: [
      {
        id: 'primary_shell',
        name: isAir
          ? 'Guided Missile / Rotary Cannon'
          : isModern
          ? `${preset.caliberMm} mm APFSDS-T`
          : `${preset.caliberMm} mm APCBC / HE`,
        type: isAir ? 'AAM' : isModern ? 'APFSDS' : preset.caliberMm >= 150 ? 'HE' : 'APHE',
        penetrationMm: preset.penetrationMm,
        velocityMs: isModern ? 1620 : 850,
        explosiveMassKg: preset.caliberMm >= 150 ? 25.0 : 0.15,
        damageRating: 92,
        description: 'Primary combat ammunition unlocked for free proving grounds testing.',
      },
      {
        id: 'secondary_shell',
        name: `${preset.caliberMm} mm High-Explosive / Multi-Purpose`,
        type: 'HE',
        penetrationMm: Math.max(25, Math.round(preset.penetrationMm * 0.25)),
        velocityMs: 820,
        explosiveMassKg: Math.max(1.2, preset.caliberMm * 0.04),
        damageRating: 78,
        description: 'High-explosive fragmentation round for soft targets and overpressure.',
      },
    ],
    armor: {
      hullFront: isNaval ? 360 : isModern ? 550 : preset.caliberMm >= 100 ? 150 : 45,
      hullSide: isNaval ? 300 : isModern ? 120 : 50,
      hullRear: 40,
      turretFront: isNaval ? 420 : isModern ? 780 : 120,
      turretSide: 100,
      turretRear: 50,
      composition: isModern ? 'Composite Laminate & Spaced Steel' : 'Rolled Homogeneous Armor',
    },
    mobility: {
      maxSpeedForwardKmh: preset.maxSpeedForwardKmh,
      maxSpeedReverseKmh: isAir ? 0 : -Math.round(preset.maxSpeedForwardKmh * 0.35),
      horsepower: isAir ? 32000 : isNaval ? 150000 : isModern ? 1200 : 550,
      weightTons: isNaval ? 45000 : isAir ? 13.5 : isModern ? 48.0 : 34.0,
      powerToWeight: 22.5,
      engineName: isAir ? 'Afterburning Turbofan' : 'Military Multi-Fuel Powerpack',
    },
    visual: {
      baseColor: '#48543E',
      accentColor: '#2A3224',
      hullArchetype: preset.hullArchetype,
      barrelCount: isNaval ? 9 : 1,
      hasERA: isModern && preset.nation === 'ussr',
      hasRadar: preset.role.includes('SPAA') || isAir,
      hasAutoloader: preset.reloadSeconds <= 5.0,
      lengthScale: preset.caliberMm <= 37 ? 0.72 : 1.08,
      widthScale: preset.caliberMm <= 37 ? 0.72 : 1.04,
      heightScale: preset.caliberMm <= 37 ? 0.72 : 1.0,
    },
  };
}
