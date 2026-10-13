import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SimulatedShotResult } from '../utils/damageSimulator';
import { RotateCcw, X, ShieldAlert, Crosshair } from 'lucide-react';

interface HitCameraProps {
  report: SimulatedShotResult | null;
  onClose: () => void;
  autoCloseDurationMs?: number;
}

export const HitCamera: React.FC<HitCameraProps> = ({
  report,
  onClose,
  autoCloseDurationMs = 4600,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [animProgress, setAnimProgress] = useState(0); // 0 to 1
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 1.0>(1.0);
  const animTimeRef = useRef(0);
  const isHoveredRef = useRef(false);
  const closeTimerRef = useRef<number>(0);
  const [timeLeftSec, setTimeLeftSec] = useState(autoCloseDurationMs / 1000);

  // Auto close timer with hover pause
  useEffect(() => {
    if (!report) return;
    const totalMs = autoCloseDurationMs;
    const startTime = Date.now();
    let intervalId: number;

    const tick = () => {
      if (!isHoveredRef.current) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalMs - elapsed);
        setTimeLeftSec(Number((remaining / 1000).toFixed(1)));
        if (remaining <= 0) {
          onClose();
          return;
        }
      }
      intervalId = window.requestAnimationFrame(tick);
    };

    intervalId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(intervalId);
    };
  }, [report, onClose, autoCloseDurationMs]);

  // 3D X-Ray Simulated Shot Visualizer
  useEffect(() => {
    if (!report || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const width = 340;
    const height = 195;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06090e); // Dark tactical PIP background

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    // Position camera to get a clear perspective view of the impact side
    const impactDir = new THREE.Vector3(...report.localIncomingDir).normalize();
    const impactPos = new THREE.Vector3(...report.localImpactPoint);

    // Orbit camera towards the side of entry
    const camOffset = new THREE.Vector3(
      impactPos.x * 0.7 - impactDir.x * 2.5,
      impactPos.y + 1.6 - impactDir.y * 1.5,
      impactPos.z * 0.7 - impactDir.z * 2.5
    ).normalize().multiplyScalar(4.8);

    camera.position.set(camOffset.x, Math.max(1.4, camOffset.y), camOffset.z);
    camera.lookAt(new THREE.Vector3(0, 0.95, 0));

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;

    // Ambient & Tactical Rim Lights (Bright & High-Clarity)
    const ambLight = new THREE.AmbientLight(0xa0aec0, 1.35);
    scene.add(ambLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.4);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.6);
    dirLight2.position.set(-5, -2, -5);
    scene.add(dirLight2);

    // Dynamic Flash Light at Impact
    const flashLight = new THREE.PointLight(0xffedd5, 0, 10);
    flashLight.position.set(...report.localImpactPoint);
    scene.add(flashLight);

    // Secondary Fireball Light (for APHE detonation)
    const detLight = new THREE.PointLight(0xf97316, 0, 8);
    if (report.detonationPoint) {
      detLight.position.set(...report.detonationPoint);
    }
    scene.add(detLight);

    // ========================================================
    // BUILD 3D X-RAY TANK SILHOUETTE & INTERNAL MODULES
    // ========================================================
    const vehicleGroup = new THREE.Group();
    scene.add(vehicleGroup);

    // Semi-transparent ghost hull & turret
    const xrayHullMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.18,
      roughness: 0.3,
      metalness: 0.2,
      depthWrite: false,
    });

    const xrayEdgeMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
    });

    // Hull geometry & wireframe edge
    const hullGeo = new THREE.BoxGeometry(3.1, 0.95, 5.8);
    const hullMesh = new THREE.Mesh(hullGeo, xrayHullMat);
    hullMesh.position.set(0, 0.85, 0);
    const hullEdges = new THREE.LineSegments(new THREE.EdgesGeometry(hullGeo), xrayEdgeMat);
    hullEdges.position.copy(hullMesh.position);
    vehicleGroup.add(hullMesh, hullEdges);

    // Turret geometry & wireframe edge
    const turretGeo = new THREE.CylinderGeometry(1.2, 1.35, 0.75, 16);
    const turretMesh = new THREE.Mesh(turretGeo, xrayHullMat);
    turretMesh.position.set(0, 1.62, 0.2);
    const turretEdges = new THREE.LineSegments(new THREE.EdgesGeometry(turretGeo), xrayEdgeMat);
    turretEdges.position.copy(turretMesh.position);
    vehicleGroup.add(turretMesh, turretEdges);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.08, 0.09, 3.8, 12);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMesh = new THREE.Mesh(barrelGeo, xrayHullMat);
    barrelMesh.position.set(0, 1.68, 3.2);
    vehicleGroup.add(barrelMesh);

    // Tracks outline
    [-1.5, 1.5].forEach((tx) => {
      const trackGeo = new THREE.BoxGeometry(0.55, 0.75, 5.8);
      const trackMesh = new THREE.Mesh(trackGeo, xrayHullMat);
      trackMesh.position.set(tx, 0.45, 0);
      vehicleGroup.add(trackMesh);
    });

    // Internal components map
    const componentMeshes: Record<string, { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; type: 'crew' | 'module' }> = {};

    // 1. Crew Figures (Driver, Gunner, Commander, Loader)
    const createCrewMemberMesh = (id: string, name: string, x: number, y: number, z: number) => {
      const isUnconscious = report.finalDamageState[id as keyof typeof report.finalDamageState] === 'unconscious';
      const cMat = new THREE.MeshStandardMaterial({
        color: isUnconscious ? 0xef4444 : 0x06b6d4,
        emissive: isUnconscious ? 0xb91c1c : 0x0284c7,
        emissiveIntensity: 0.6,
        roughness: 0.4,
      });

      const crewGroup = new THREE.Group();
      // Torso & Helmet
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.38, 8, 12), cMat);
      torso.position.y = 0.22;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), cMat);
      head.position.y = 0.52;
      const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.08, 12), cMat);
      helmet.position.y = 0.56;
      crewGroup.add(torso, head, helmet);

      crewGroup.position.set(x, y, z);
      vehicleGroup.add(crewGroup);

      componentMeshes[id] = { mesh: torso, mat: cMat, type: 'crew' };
    };

    createCrewMemberMesh('driver', 'Driver', 0.0, 0.75, 1.65);
    createCrewMemberMesh('gunner', 'Gunner', -0.52, 1.35, 0.15);
    createCrewMemberMesh('commander', 'Commander', -0.52, 1.55, -0.45);
    createCrewMemberMesh('loader', 'Loader', 0.52, 1.38, 0.1);

    // 2. Engine Block (Rear)
    const engineState = report.finalDamageState.engine;
    const engineMat = new THREE.MeshStandardMaterial({
      color: engineState === 'destroyed' ? 0xef4444 : engineState === 'damaged' ? 0xf59e0b : 0x10b981,
      emissive: engineState === 'destroyed' ? 0xb91c1c : engineState === 'damaged' ? 0xd97706 : 0x059669,
      emissiveIntensity: 0.5,
      roughness: 0.5,
    });
    const engineMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.72, 1.45), engineMat);
    engineMesh.position.set(0.0, 0.92, -1.82);
    vehicleGroup.add(engineMesh);
    componentMeshes['engine'] = { mesh: engineMesh, mat: engineMat, type: 'module' };

    // 3. Ammo Rack / Carousel (Center)
    const ammoState = report.finalDamageState.ammoRack;
    const ammoMat = new THREE.MeshStandardMaterial({
      color: ammoState === 'destroyed' ? 0xef4444 : ammoState === 'damaged' ? 0xf59e0b : 0xef4444,
      emissive: ammoState === 'destroyed' ? 0xf87171 : 0xb91c1c,
      emissiveIntensity: ammoState === 'destroyed' ? 1.0 : 0.6,
      roughness: 0.4,
    });
    const ammoRackMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.38, 16), ammoMat);
    ammoRackMesh.position.set(0.0, 0.62, -0.15);
    vehicleGroup.add(ammoRackMesh);
    componentMeshes['ammoRack'] = { mesh: ammoRackMesh, mat: ammoMat, type: 'module' };

    // 4. Transmission (Front)
    const transMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
      roughness: 0.6,
    });
    const transMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.48, 0.7), transMat);
    transMesh.position.set(0.0, 0.58, 2.25);
    vehicleGroup.add(transMesh);
    componentMeshes['transmission'] = { mesh: transMesh, mat: transMat, type: 'module' };

    // 5. Gun Breech (Turret center)
    const breechState = report.finalDamageState.gunBreech;
    const breechMat = new THREE.MeshStandardMaterial({
      color: breechState === 'destroyed' ? 0xef4444 : breechState === 'damaged' ? 0xf59e0b : 0x64748b,
      emissive: breechState === 'destroyed' ? 0xb91c1c : 0x334155,
      emissiveIntensity: 0.5,
    });
    const breechMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.82), breechMat);
    breechMesh.position.set(0.0, 1.62, 0.75);
    vehicleGroup.add(breechMesh);
    componentMeshes['gunBreech'] = { mesh: breechMesh, mat: breechMat, type: 'module' };

    // 6. Fuel Tank (Side)
    const fuelState = report.finalDamageState.fuelTank;
    const fuelMat = new THREE.MeshStandardMaterial({
      color: fuelState === 'destroyed' ? 0xef4444 : fuelState === 'damaged' ? 0xf59e0b : 0xeab308,
      emissive: fuelState === 'destroyed' ? 0xb91c1c : 0xca8a04,
      emissiveIntensity: 0.5,
    });
    const fuelMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 1.75), fuelMat);
    fuelMesh.position.set(1.08, 0.82, -0.65);
    vehicleGroup.add(fuelMesh);
    componentMeshes['fuelTank'] = { mesh: fuelMesh, mat: fuelMat, type: 'module' };

    // ========================================================
    // SIMULATED INCOMING PROJECTILE & SHOT TRACER
    // ========================================================
    const isSabot = report.ammoType === 'APFSDS';
    const projGeo = isSabot
      ? new THREE.CylinderGeometry(0.04, 0.04, 0.72, 8)
      : new THREE.CylinderGeometry(0.07, 0.08, 0.52, 10);
    projGeo.rotateX(Math.PI / 2);

    const projMat = new THREE.MeshBasicMaterial({
      color: isSabot ? 0x67e8f9 : 0xfde047,
    });
    const projectileMesh = new THREE.Mesh(projGeo, projMat);

    // Calculate projectile incoming trajectory
    const impactPt = new THREE.Vector3(...report.localImpactPoint);
    const incDir = new THREE.Vector3(...report.localIncomingDir).normalize();
    const flightDist = 4.2;
    const projStart = impactPt.clone().sub(incDir.clone().multiplyScalar(flightDist));

    projectileMesh.position.copy(projStart);
    projectileMesh.lookAt(projStart.clone().add(incDir));
    scene.add(projectileMesh);

    // Penetration Hole Decal Ring
    const holeRing = new THREE.Mesh(
      new THREE.RingGeometry(0.04, 0.14, 16),
      new THREE.MeshBasicMaterial({
        color: report.penetrated ? 0xf97316 : 0xef4444,
        side: THREE.DoubleSide,
      })
    );
    holeRing.position.copy(impactPt);
    holeRing.lookAt(impactPt.clone().sub(incDir));
    holeRing.visible = false;
    scene.add(holeRing);

    // ========================================================
    // SPALL RAYS & INTERNAL FRAGMENT TRACES
    // ========================================================
    const rayLinesGroup = new THREE.Group();
    scene.add(rayLinesGroup);

    report.spallRays.forEach((ray) => {
      const pts = [new THREE.Vector3(...ray.start), new THREE.Vector3(...ray.end)];
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: ray.isJet ? 0xffffff : 0xf97316,
        linewidth: ray.isJet ? 3 : 1.5,
        transparent: true,
        opacity: 0,
      });
      const line = new THREE.Line(geom, lineMat);
      rayLinesGroup.add(line);
    });

    // Detonation Fireball Sphere (for APHE)
    let detSphere: THREE.Mesh | undefined;
    if (report.detonationPoint) {
      detSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0,
        })
      );
      detSphere.position.set(...report.detonationPoint);
      scene.add(detSphere);
    }

    // ========================================================
    // ANIMATION & SLOW-MOTION PLAYBACK LOOP
    // ========================================================
    let animId = 0;
    const clock = new THREE.Clock();
    animTimeRef.current = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta() * playbackSpeed;
      animTimeRef.current += dt;
      const t = animTimeRef.current;

      // Normalize animation progress (total sequence ~2.4s)
      const totalAnimSec = 2.4;
      const progress = Math.min(1.0, t / totalAnimSec);
      setAnimProgress(progress);

      // Phase 1: Incoming Projectile (0.0s to 0.45s)
      const tImpact = 0.45;
      if (t < tImpact) {
        const flightFraction = t / tImpact;
        projectileMesh.position.lerpVectors(projStart, impactPt, flightFraction);
        projectileMesh.visible = true;
        flashLight.intensity = 0;
        holeRing.visible = false;
      } else {
        projectileMesh.visible = false;
        holeRing.visible = true;

        // Phase 2: Impact Flash & Sparks (0.45s to 0.75s)
        const flashProgress = (t - tImpact) / 0.3;
        if (flashProgress <= 1.0) {
          flashLight.intensity = Math.max(0, 16 * (1.0 - flashProgress));
        } else {
          flashLight.intensity = 0;
        }

        // Phase 3: Interior Penetration & Spall Spray (0.55s to 1.4s)
        if (report.penetrated) {
          const spallProg = Math.min(1.0, (t - 0.52) / 0.45);
          rayLinesGroup.children.forEach((child) => {
            const line = child as THREE.Line;
            const mat = line.material as THREE.LineBasicMaterial;
            mat.opacity = spallProg * 0.95;
          });

          // APHE Detonation Fireball Flash
          if (detSphere && detLight) {
            const detT = (t - 0.6) / 0.35;
            if (detT >= 0 && detT <= 1.0) {
              const detScale = 0.5 + detT * 2.2;
              detSphere.scale.set(detScale, detScale, detScale);
              (detSphere.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1.0 - detT));
              detLight.intensity = Math.max(0, 12 * (1.0 - detT));
            } else {
              (detSphere.material as THREE.MeshBasicMaterial).opacity = 0;
              detLight.intensity = 0;
            }
          }

          // Phase 4: Hit Components flash hot then reveal final damage color
          const compFlashProg = THREE.MathUtils.clamp((t - 0.7) / 0.5, 0, 1);
          report.hitComponents.forEach((hc) => {
            const comp = componentMeshes[hc.id];
            if (comp) {
              if (compFlashProg < 0.4) {
                // Flash white hot
                comp.mat.color.setHex(0xffffff);
                comp.mat.emissive.setHex(0xffffff);
                comp.mat.emissiveIntensity = 1.0;
              } else {
                // Turn final red / amber state
                const isKill = hc.newState === 'destroyed' || hc.newState === 'unconscious';
                comp.mat.color.setHex(isKill ? 0xef4444 : 0xf59e0b);
                comp.mat.emissive.setHex(isKill ? 0xb91c1c : 0xd97706);
                comp.mat.emissiveIntensity = 0.8;
              }
            }
          });
        }
      }

      // Slow cinematic camera orbit around impact point to inspect the internal damage
      if (t > tImpact) {
        const orbitSpeed = 0.22;
        const orbitAngle = (t - tImpact) * orbitSpeed;
        const radius = camera.position.distanceTo(new THREE.Vector3(0, 0.95, 0));
        camera.position.x = Math.sin(orbitAngle + 0.4) * radius;
        camera.position.z = Math.cos(orbitAngle + 0.4) * radius;
        camera.lookAt(new THREE.Vector3(0, 0.95, 0));
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      scene.clear();
    };
  }, [report, playbackSpeed]);

  const handleReplay = useCallback(() => {
    animTimeRef.current = 0;
  }, []);

  if (!report) return null;

  const isLethal = report.destroyed;
  const isCrit = !report.destroyed && report.penetrated;
  const isRicochet = report.isRicochet;
  const isNonPen = !report.penetrated && !report.isRicochet;

  const headerBadgeColor = isLethal
    ? 'text-red-400 bg-red-950/80 border-red-500/50'
    : isCrit
    ? 'text-amber-400 bg-amber-950/80 border-amber-500/50'
    : isRicochet
    ? 'text-cyan-400 bg-cyan-950/80 border-cyan-500/50'
    : 'text-slate-400 bg-slate-900/80 border-slate-600/50';

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
      className="pointer-events-auto absolute top-16 right-4 z-30 w-[350px] bg-slate-950/96 backdrop-blur-md border border-slate-600/50 rounded-lg shadow-2xl overflow-hidden text-white font-sans select-none animate-in fade-in duration-150"
    >
      {/* 1. Header Bar: War Thunder Authentic Hit Cam Layout */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-slate-900/90">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-semibold">
            HIT CAMERA · {report.distanceM}m
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
            {report.ammoType}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleReplay}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Replay Simulated Shot (Slow-Mo)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPlaybackSpeed((s) => (s === 1.0 ? 0.5 : 1.0))}
            className="px-1.5 py-0.5 text-[9px] font-mono text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Playback Speed"
          >
            {playbackSpeed}x
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Dismiss Hit Camera"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Title */}
      <div className="px-3 pt-2 pb-1 flex items-center justify-between">
        <div>
          <div className="text-xs font-display font-bold text-white tracking-wide truncate max-w-[210px]">
            {report.targetName}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">{report.targetRole}</div>
        </div>
        <div className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border uppercase ${headerBadgeColor}`}>
          {isLethal ? 'DESTROYED' : isCrit ? 'CRITICAL HIT' : isRicochet ? 'RICOCHET' : 'NON-PEN'}
        </div>
      </div>

      {/* 2. 3D X-Ray Simulated Shot Viewport Canvas */}
      <div className="relative w-full h-[195px] bg-[#06090e] border-y border-white/10 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Live Simulation Phase Watermark */}
        <div className="pointer-events-none absolute bottom-1 left-2 text-[9px] font-mono text-slate-400/80 uppercase">
          X-RAY BALLISTIC SIMULATION · {playbackSpeed === 0.5 ? 'SLOW-MO 0.5X' : 'REAL-TIME'}
        </div>

        {/* Surviving Crew Counter Overlay */}
        {report.penetrated && (
          <div className="pointer-events-none absolute top-2 right-2 bg-slate-950/80 border border-white/15 px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1.5">
            <span className="text-slate-400">Crew:</span>
            <span
              className={`font-bold ${
                report.survivingCrewCount < 2 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {report.survivingCrewCount}/{report.totalCrewCount}
            </span>
          </div>
        )}
      </div>

      {/* 3. Terminal Ballistic Telemetry Grid */}
      <div className="grid grid-cols-3 gap-1 px-3 py-2 border-b border-white/10 bg-slate-900/60 text-xs font-mono tabular-nums text-slate-300">
        <div>
          <span className="text-[9px] text-slate-400 uppercase block">Impact Angle</span>
          <span className="font-semibold text-white">{report.impactAngleDeg}°</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 uppercase block">Penetration</span>
          <span className="font-semibold text-white">{report.penetrationMm} mm</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 uppercase block">Line-of-Sight</span>
          <span className={`font-semibold ${report.penetrated ? 'text-emerald-400' : 'text-rose-400'}`}>
            {report.effectiveArmorMm} mm
          </span>
        </div>
      </div>

      {/* 4. Verdict Title & Damaged Modules Ticker */}
      <div className="p-3 bg-slate-950/90 space-y-1.5">
        <div
          className={`text-xs font-display font-bold tracking-wide uppercase ${
            isLethal
              ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]'
              : isCrit
              ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]'
              : isRicochet
              ? 'text-cyan-400'
              : 'text-slate-400'
          }`}
        >
          {report.statusTitle}
        </div>

        {/* Real-time Casualties & Damaged Modules */}
        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
          {report.damagedModules.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[11px] font-mono">
              <span
                className={
                  report.penetrated
                    ? item.includes('knocked out') || item.includes('detonated') || item.includes('destroyed')
                      ? 'text-rose-400 font-bold'
                      : 'text-amber-400'
                    : 'text-slate-400'
                }
              >
                {report.penetrated ? '✕' : '●'}
              </span>
              <span className="text-slate-200 truncate">{item}</span>
            </div>
          ))}
        </div>

        {/* 5. Auto-closing countdown timer indicator */}
        <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Auto-closing in {timeLeftSec}s</span>
          <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-100"
              style={{
                width: `${Math.max(0, Math.min(100, (timeLeftSec / (autoCloseDurationMs / 1000)) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
