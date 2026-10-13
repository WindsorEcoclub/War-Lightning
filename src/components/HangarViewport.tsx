import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VehicleSpec } from '../data/vehicles';
import { buildVehicle3D, BuiltVehicle3D, InspectorMode } from '../utils/vehicleModelBuilder';
import { buildAuthenticHangarBase, BuiltHangarEnvironment } from '../utils/hangarBaseBuilder';
import { soundEngine } from '../utils/soundEngine';
import { HitCamera } from './HitCamera';
import {
  simulateShot,
  SimulatedShotResult,
  createDefaultDamageState,
} from '../utils/damageSimulator';

interface HangarViewportProps {
  vehicle: VehicleSpec;
  inspectorMode: InspectorMode;
  camoColor: string | null;
  camoRoughness: number;
  testShellPenMm: number;
  testShellName: string;
}

export interface HoveredArmorInfo {
  zoneName: string;
  baseThicknessMm: number;
  angleDeg: number;
  effectiveMm: number;
  composition: string;
  canPenetrate: boolean;
}

export const HangarViewport: React.FC<HangarViewportProps> = ({
  vehicle,
  inspectorMode,
  camoColor,
  camoRoughness,
  testShellPenMm,
  testShellName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredInfo, setHoveredInfo] = useState<HoveredArmorInfo | null>(null);
  const [hangarHitReport, setHangarHitReport] = useState<SimulatedShotResult | null>(null);
  const [shotResult, setShotResult] = useState<{
    zone: string;
    effectiveMm: number;
    penetrated: boolean;
    timestamp: number;
  } | null>(null);
  const [webglLost, setWebglLost] = useState(false);

  // Orbit camera spherical coordinates
  const orbitRef = useRef({
    theta: 0.52,
    phi: 1.25,
    radius: 11.5,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    targetTheta: 0.52,
    targetPhi: 1.25,
    targetRadius: 11.5,
  });

  const builtVehicleRef = useRef<BuiltVehicle3D | null>(null);
  const hangarBaseRef = useRef<BuiltHangarEnvironment | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    // Authentic, Bright Military Depot Hangar
    // Bright, clear ambient illumination with minimal subtle depth haze
    scene.background = new THREE.Color(0x1e2633);
    scene.fog = new THREE.FogExp2(0x1e2633, 0.002);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 800);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.75;
    } catch {
      setWebglLost(true);
      return;
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const handleContextRestored = () => {
      setWebglLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // Multi-Directional High-Clarity Studio Lighting:
    // Bright ceiling bounce + clean floor bounce
    const hemiLight = new THREE.HemisphereLight(0xf1f5f9, 0x64748b, 1.85);
    scene.add(hemiLight);

    // High-angle Sunlight / Overhead Bay Key Light
    const mainKeyLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    mainKeyLight.position.set(12, 20, 14);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    mainKeyLight.shadow.bias = -0.0005;
    scene.add(mainKeyLight);

    // Front-Left Fill Light (eliminates dark shadowy faces)
    const frontFillLight = new THREE.DirectionalLight(0xe2e8f0, 1.6);
    frontFillLight.position.set(-14, 12, 16);
    scene.add(frontFillLight);

    // Rear Silhouette & Rim Light
    const rimLight = new THREE.DirectionalLight(0x94a3b8, 1.6);
    rimLight.position.set(-15, 14, -26);
    scene.add(rimLight);

    // Build the authentic underground bunker depot environment
    const hangarEnv = buildAuthenticHangarBase(scene, vehicle.nation);
    hangarEnv.group.userData = { nation: vehicle.nation };
    hangarBaseRef.current = hangarEnv;

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      const orb = orbitRef.current;
      if (!orb.isDragging && inspectorMode === 'standard') {
        orb.targetTheta += dt * 0.08;
      }

      orb.theta += (orb.targetTheta - orb.theta) * 0.12;
      orb.phi += (orb.targetPhi - orb.phi) * 0.12;
      orb.radius += (orb.targetRadius - orb.radius) * 0.12;

      const x = orb.radius * Math.sin(orb.phi) * Math.sin(orb.theta);
      const y = orb.radius * Math.cos(orb.phi);
      const z = orb.radius * Math.sin(orb.phi) * Math.cos(orb.theta);

      camera.position.set(x, Math.max(0.6, y), z);
      camera.lookAt(0, 1.25, 0);

      // Animate vehicle rotors / radar / afterburner
      const bv = builtVehicleRef.current;
      if (bv) {
        if (bv.radarMesh) {
          bv.radarMesh.rotation.y = elapsed * 2.8;
        }
        if (bv.rotorGroup) {
          bv.rotorGroup.rotation.y = elapsed * 15.0;
        }
        if (bv.coaxialRotorGroup) {
          bv.coaxialRotorGroup.rotation.y = -elapsed * 15.0;
        }
        if (bv.afterburnerMesh) {
          const pulse = 0.85 + Math.sin(elapsed * 22) * 0.15;
          bv.afterburnerMesh.scale.set(1, 1, pulse);
        }
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
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      if (hangarBaseRef.current) {
        scene.remove(hangarBaseRef.current.group);
        hangarBaseRef.current.spotlights.forEach((s) => {
          scene.remove(s.target);
          scene.remove(s);
        });
        hangarBaseRef.current.pointLights.forEach((p) => scene.remove(p));
      }
      renderer.dispose();
    };
  }, []);

  // Rebuild 3D vehicle & update nation flag whenever selection or mode changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (builtVehicleRef.current) {
      scene.remove(builtVehicleRef.current.root);
    }

    const built = buildVehicle3D(vehicle, inspectorMode, camoColor, camoRoughness);
    builtVehicleRef.current = built;
    scene.add(built.root);

    // Update hangar base if nation changes
    const curNation = hangarBaseRef.current?.group.userData?.nation;
    if (hangarBaseRef.current && curNation !== vehicle.nation) {
      scene.remove(hangarBaseRef.current.group);
      hangarBaseRef.current.spotlights.forEach((s) => {
        scene.remove(s.target);
        scene.remove(s);
      });
      hangarBaseRef.current.pointLights.forEach((p) => scene.remove(p));
      const newEnv = buildAuthenticHangarBase(scene, vehicle.nation);
      newEnv.group.userData = { nation: vehicle.nation };
      hangarBaseRef.current = newEnv;
    }

    // Adjust camera radius for naval battleships vs ground vehicles
    orbitRef.current.targetRadius =
      vehicle.branch === 'fleet' ? 16.5 : vehicle.branch === 'aviation' ? 13.5 : 11.2;
    setHoveredInfo(null);
    setShotResult(null);
  }, [vehicle, inspectorMode, camoColor, camoRoughness]);

  // Pointer interaction for Orbit + Armor Protection Raycasting
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    orbitRef.current.isDragging = true;
    orbitRef.current.lastX = e.clientX;
    orbitRef.current.lastY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const orb = orbitRef.current;
    if (orb.isDragging) {
      const dx = e.clientX - orb.lastX;
      const dy = e.clientY - orb.lastY;
      orb.targetTheta -= dx * 0.0075;
      orb.targetPhi = Math.max(0.18, Math.min(1.48, orb.targetPhi - dy * 0.0065));
      orb.lastX = e.clientX;
      orb.lastY = e.clientY;
    }

    // Raycast Armor or X-Ray modules
    if (inspectorMode !== 'standard' && containerRef.current && cameraRef.current && builtVehicleRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(builtVehicleRef.current.armorMeshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const data = hit.object.userData;
        const baseMm = data.thicknessMm || 50;
        let losAngleDeg = data.angleDeg || 30;
        if (hit.face) {
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
          const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
          const dot = Math.abs(worldNormal.dot(raycaster.ray.direction));
          const computedAngle = Math.round(Math.acos(Math.min(1, Math.max(0.15, dot))) * (180 / Math.PI));
          losAngleDeg = Math.min(82, Math.max(data.angleDeg || 0, computedAngle));
        }
        const cosAngle = Math.cos((losAngleDeg * Math.PI) / 180);
        const effectiveMm = Math.round(baseMm / Math.max(0.22, cosAngle));

        setHoveredInfo({
          zoneName: data.zoneName || 'Hull Plate',
          baseThicknessMm: baseMm,
          angleDeg: losAngleDeg,
          effectiveMm,
          composition: data.composition || vehicle.armor.composition,
          canPenetrate: testShellPenMm >= effectiveMm,
        });
      } else {
        setHoveredInfo(null);
      }
    } else if (hoveredInfo) {
      setHoveredInfo(null);
    }
  };

  const handlePointerUp = () => {
    orbitRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    orbitRef.current.targetRadius = Math.max(
      6.0,
      Math.min(24.0, orbitRef.current.targetRadius + e.deltaY * 0.008)
    );
  };

  const handleSimulatedShot = () => {
    if (inspectorMode === 'standard' || !hoveredInfo) return;

    // Simulate authentic terminal ballistics & internal damage
    const isSabot = testShellName.toUpperCase().includes('APFSDS') || testShellName.toUpperCase().includes('DART');
    const isHeat = testShellName.toUpperCase().includes('HEAT') || testShellName.toUpperCase().includes('CHARGE');
    const shellType = isSabot ? 'APFSDS' : isHeat ? 'HEAT-FS' : 'APHE';

    const shot = simulateShot({
      targetName: vehicle.name,
      targetRole: vehicle.role,
      distanceM: 100,
      ammo: {
        id: 'test_shell',
        name: testShellName,
        type: shellType,
        penetrationMm: testShellPenMm,
        velocityMs: isSabot ? 1650 : isHeat ? 1050 : 880,
        explosiveMassKg: shellType === 'APHE' ? 0.75 : 0,
        damageRating: 75,
        description: 'Protection Analysis Test Projectile',
      },
      worldImpactPoint: new THREE.Vector3(0, 1.35, 1.6),
      worldProjectileVelocity: new THREE.Vector3(0, -0.08, -1.0).multiplyScalar(1200),
      targetCenter: new THREE.Vector3(0, 0, 0),
      targetRotationY: 0,
      nominalFrontArmorMm: hoveredInfo.baseThicknessMm,
      nominalSideArmorMm: hoveredInfo.baseThicknessMm * 0.7,
      currentDamageState: createDefaultDamageState(),
      currentHp: 100,
    });

    soundEngine.playImpact(shot.penetrated, shot.destroyed);
    setHangarHitReport(shot);
    setShotResult({
      zone: hoveredInfo.zoneName,
      effectiveMm: hoveredInfo.effectiveMm,
      penetrated: shot.penetrated,
      timestamp: Date.now(),
    });
  };

  return (
    <div
      className="relative w-full h-full select-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onClick={handleSimulatedShot}
    >
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {webglLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0B0E14] text-slate-300 p-8 text-center">
          <div className="max-w-md space-y-2">
            <p className="text-lg font-display font-semibold text-white">3D Hangar Standby View</p>
            <p className="text-sm text-slate-400">
              {vehicle.name} ({vehicle.mainGunName}) ready for proving grounds deployment.
            </p>
          </div>
        </div>
      )}

      {/* Authentic 3D Hit Camera in Hangar Protection Analysis Mode */}
      <HitCamera
        report={hangarHitReport}
        onClose={() => setHangarHitReport(null)}
        autoCloseDurationMs={4600}
      />

      {/* Protection Analysis Live Hover Telemetry Card */}
      {inspectorMode !== 'standard' && hoveredInfo && (
        <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-slate-950/92 backdrop-blur-md border border-white/20 rounded-lg px-5 py-3.5 shadow-2xl min-w-[340px]">
          <div className="text-[11px] text-amber-400 font-semibold tracking-wide uppercase mb-1">
            {inspectorMode === 'armor' ? 'Protection Analysis · Click Plate to Test Shell' : 'Internal Module X-Ray Inspector'}
          </div>
          <div className="text-sm font-semibold text-white mb-2">{hoveredInfo.zoneName}</div>
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-2 text-xs font-mono tabular-nums">
            <div>
              <span className="text-slate-400 block text-[10px]">Thickness</span>
              <span className="text-slate-100 font-semibold">{hoveredInfo.baseThicknessMm} mm</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Impact Angle</span>
              <span className="text-slate-100 font-semibold">{hoveredInfo.angleDeg}°</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Effective Protection</span>
              <span className="text-amber-400 font-bold">{hoveredInfo.effectiveMm} mm RHAe</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">vs {testShellName} ({testShellPenMm} mm)</span>
            <span className={`font-bold ${hoveredInfo.canPenetrate ? 'text-emerald-400' : 'text-rose-400'}`}>
              {hoveredInfo.canPenetrate ? 'Penetration Likely' : 'Ricochet / Non-Penetration'}
            </span>
          </div>
        </div>
      )}

      {/* Protection Analysis Simulated Shot Result Toast */}
      {shotResult && !hangarHitReport && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 z-20 bg-slate-950/95 border border-white/20 rounded-lg px-6 py-3 shadow-2xl text-center">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Simulated Ballistic Impact</p>
          <p className={`text-base font-display font-bold mt-0.5 ${shotResult.penetrated ? 'text-emerald-400' : 'text-rose-400'}`}>
            {shotResult.penetrated
              ? `Target Penetrated (${testShellPenMm} mm > ${shotResult.effectiveMm} mm Effective)`
              : `Armor Deflected Shot (${testShellPenMm} mm < ${shotResult.effectiveMm} mm Effective)`}
          </p>
          <p className="text-xs text-slate-300 mt-0.5">{shotResult.zone}</p>
        </div>
      )}
    </div>
  );
};
