import React, { useState, useMemo, useEffect } from 'react';
import {
  BRANCHES,
  BranchId,
  CAMOUFLAGES,
  NATIONS,
  NationId,
  VEHICLES,
  VehicleSpec,
} from './data/vehicles';
import { HangarViewport } from './components/HangarViewport';
import { InspectorMode } from './utils/vehicleModelBuilder';
import { TestDriveSimulator, RangeBiome } from './components/TestDriveSimulator';
import { ResearchTreeModal } from './components/ResearchTreeModal';
import {
  Play,
  Layers,
  Shield,
  Cpu,
  Grid,
  Award,
  Users,
  Settings,
  Flame,
  ChevronDown,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';

const TEST_SHELL_OPTIONS = [
  { name: '120mm DM53 APFSDS', penMm: 652 },
  { name: '120mm M829A2 APFSDS', penMm: 629 },
  { name: '125mm 3BM60 Svinets-2', penMm: 580 },
  { name: '105mm DM33 APFSDS', penMm: 420 },
  { name: '88mm Pzgr. 39/43 (King Tiger)', penMm: 237 },
  { name: '85mm BR-365A (T-34-85)', penMm: 135 },
  { name: '152mm 9M133 Kornet ATGM', penMm: 1200 },
];

const CAPTCHA_POOL = ['Aegis', 'Vanta', 'Harbor', 'Drift', 'Raven', 'Violet', 'Orchid', 'Signal', 'Talon', 'Nimbus', 'Hollow', 'Quill'];

function generateCaptchaVisual(phrase: string) {
  return phrase.split('').map((char, index) => ({
    char,
    rotate: (Math.random() - 0.5) * 24,
    offsetX: (Math.random() - 0.5) * 10,
    offsetY: (Math.random() - 0.5) * 10,
    color: ['#fbbf24', '#7dd3fc', '#a78bfa', '#f472b6', '#34d399'][index % 5],
    ghostColor: ['#1e293b', '#0f172a', '#334155'][index % 3],
    scale: 0.9 + (Math.random() * 0.22),
  }));
}

interface FullscreenControlProps {
  isFullscreen: boolean;
  error: string;
  onToggle: () => void;
}

function FullscreenControl({ isFullscreen, error, onToggle }: FullscreenControlProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        className="flex shrink-0 items-center gap-2 rounded border border-white/15 bg-slate-900/80 p-2 text-slate-200 transition-colors hover:border-amber-400/60 hover:text-amber-300"
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        <span className="hidden text-xs font-semibold sm:inline">
          {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        </span>
      </button>
      {error && <span role="alert" className="max-w-48 text-xs text-rose-300">{error}</span>}
    </div>
  );
}

export default function App() {
  const [selectedNation, setSelectedNation] = useState<NationId>('germany');
  const [selectedBranch, setSelectedBranch] = useState<BranchId>('army');
  const [currentVehicle, setCurrentVehicle] = useState<VehicleSpec>(
    () => VEHICLES.find((v) => v.id === 'de_leopard_2a7v') || VEHICLES[0]
  );

  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('standard');
  const [selectedCamoId, setSelectedCamoId] = useState<string>('standard');
  const [testShellIdx, setTestShellIdx] = useState<number>(0);
  const [selectedBiome, setSelectedBiome] = useState<RangeBiome>('kursk');
  const [battleMode, setBattleMode] = useState('Realistic Battles');

  const [isTestDriving, setIsTestDriving] = useState<boolean>(false);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState<boolean>(false);
  const [captchaChallenge, setCaptchaChallenge] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');

  useEffect(() => {
    document.title = 'Arbour - Home';
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  const handleFullscreenToggle = async () => {
    setFullscreenError('');
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      setFullscreenError(
        error instanceof Error ? error.message : 'Unable to change fullscreen mode.'
      );
    }
  };

  useEffect(() => {
    const challenge = CAPTCHA_POOL[Math.floor(Math.random() * CAPTCHA_POOL.length)];
    setCaptchaChallenge(challenge);
    setCaptchaInput('');
    setCaptchaError(false);
  }, []);

  const handleCaptchaSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (captchaInput.trim().toLowerCase() === captchaChallenge.trim().toLowerCase()) {
      setIsUnlocked(true);
      return;
    }

    setCaptchaError(true);
    setCaptchaInput('');
    const nextChallenge = CAPTCHA_POOL[Math.floor(Math.random() * CAPTCHA_POOL.length)];
    setCaptchaChallenge(nextChallenge);
  };

  const currentCamo = useMemo(
    () => CAMOUFLAGES.find((c) => c.id === selectedCamoId) || CAMOUFLAGES[0],
    [selectedCamoId]
  );

  const nationLineup = useMemo(() => {
    const matches = VEHICLES.filter(
      (v) => v.nation === selectedNation && v.branch === selectedBranch
    );
    if (matches.length > 0) return matches;
    return VEHICLES.filter((v) => v.nation === selectedNation);
  }, [selectedNation, selectedBranch]);

  const handleNationChange = (nation: NationId) => {
    setSelectedNation(nation);
    const firstMatch =
      VEHICLES.find((v) => v.nation === nation && v.branch === selectedBranch) ||
      VEHICLES.find((v) => v.nation === nation);
    if (firstMatch) {
      setCurrentVehicle(firstMatch);
      setSelectedBranch(firstMatch.branch);
    }
  };

  const handleBranchChange = (branch: BranchId) => {
    setSelectedBranch(branch);
    const firstMatch =
      VEHICLES.find((v) => v.nation === selectedNation && v.branch === branch) ||
      VEHICLES.find((v) => v.branch === branch);
    if (firstMatch) {
      setCurrentVehicle(firstMatch);
      setSelectedNation(firstMatch.nation);
    }
  };

  if (!isUnlocked) {
    const distortions = generateCaptchaVisual(captchaChallenge || 'Aegis');

    return (
      <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#070b12] text-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.18),_transparent_38%),radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_30%)]" />
        <div className="fixed right-4 top-4 z-50">
          <FullscreenControl
            isFullscreen={isFullscreen}
            error={fullscreenError}
            onToggle={handleFullscreenToggle}
          />
        </div>
        <div className="relative w-full max-w-xl rounded-2xl border border-slate-700/80 bg-slate-950/90 p-6 shadow-[0_0_40px_rgba(14,165,233,0.2)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between text-[10px] uppercase tracking-[0.32em] text-slate-400">
            <span>Arbour Access</span>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-300">relay verified</span>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-inner shadow-slate-900/70">
            <p className="mb-4 text-xs uppercase tracking-[0.28em] text-slate-400">secure route validation</p>
            <div className="relative flex min-h-[98px] items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-[linear-gradient(135deg,#0f172a_0%,#111827_44%,#0f172a_100%)]">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,0.08) 0%, transparent 22%, rgba(34,211,238,0.15) 38%, transparent 52%, rgba(251,191,36,0.15) 70%, transparent 100%)' }} />
              <div className="relative flex select-none items-center justify-center gap-[2px] font-black tracking-[0.24em] uppercase" style={{ fontFamily: 'monospace' }}>
                {distortions.map((piece, index) => (
                  <span
                    key={`${piece.char}-${index}`}
                    className="relative inline-block"
                    style={{
                      transform: `translate(${piece.offsetX}px, ${piece.offsetY}px) rotate(${piece.rotate}deg) scale(${piece.scale})`,
                      color: piece.color,
                      textShadow: `-2px 0 ${piece.ghostColor}, 2px 0 rgba(255,255,255,0.15), 0 0 10px ${piece.color}`,
                      opacity: 0.82,
                    }}
                  >
                    <span className="absolute inset-0 opacity-25" style={{ color: piece.ghostColor, transform: 'translate(-2px, 2px)' }}>
                      {piece.char}
                    </span>
                    {piece.char}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleCaptchaSubmit} className="mt-5 space-y-4">
            <label className="block text-[11px] uppercase tracking-[0.22em] text-slate-400">
              Type the verification phrase
            </label>
            <input
              value={captchaInput}
              onChange={(e) => {
                setCaptchaInput(e.target.value);
                setCaptchaError(false);
              }}
              autoFocus
              className="w-full rounded-md border border-slate-700 bg-slate-900/90 px-3 py-2.5 text-base text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              placeholder="Enter the text above"
              aria-label="Captcha input"
            />

            <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.28em] text-slate-400">
              <span>packet flow masked</span>
              <span className="text-amber-300">origin: arbour.local</span>
            </div>

            {captchaError && (
              <p className="text-sm text-rose-300">Verification failed. Route rejected. Try again.</p>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 px-4 py-2.5 text-sm font-bold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-110"
            >
              Confirm access
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isTestDriving) {
    return (
      <>
        <div className="fixed right-4 top-4 z-[100]">
          <FullscreenControl
            isFullscreen={isFullscreen}
            error={fullscreenError}
            onToggle={handleFullscreenToggle}
          />
        </div>
        <TestDriveSimulator
          vehicle={currentVehicle}
          camoColor={currentCamo.primary}
          camoRoughness={currentCamo.roughness}
          initialBiome={selectedBiome}
          onExitToHangar={() => setIsTestDriving(false)}
          onOpenVehicleSwitcher={() => setIsTreeModalOpen(true)}
        />
        {isTreeModalOpen && (
          <ResearchTreeModal
            selectedNation={selectedNation}
            selectedBranch={selectedBranch}
            currentVehicle={currentVehicle}
            onSelectNation={setSelectedNation}
            onSelectBranch={setSelectedBranch}
            onSelectVehicleForHangar={(v) => {
              setCurrentVehicle(v);
              setSelectedNation(v.nation);
              setSelectedBranch(v.branch);
            }}
            onLaunchTestDrive={(v) => {
              setCurrentVehicle(v);
              setSelectedNation(v.nation);
              setSelectedBranch(v.branch);
              setIsTreeModalOpen(false);
              setIsTestDriving(true);
            }}
            onClose={() => setIsTreeModalOpen(false)}
          />
        )}
      </>
    );
  }

  const primaryShell = currentVehicle.ammoLoadout[0];
  const activeTestShell = TEST_SHELL_OPTIONS[testShellIdx] || TEST_SHELL_OPTIONS[0];

  return (
    <div className="relative h-dvh min-h-0 w-full overflow-hidden bg-[#0A0D12] text-slate-100 flex flex-col font-sans select-none">
      {/* ==========================================================
          AUTHENTIC WAR THUNDER TOP HEADER (PROFILE, TO BATTLE, CURRENCY)
         ========================================================== */}
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-2 px-2 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#141923] via-[#1a212e] to-[#141923] border-b border-white/10 shadow-lg">
        {/* Left: Player Profile Card */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded border-2 border-amber-400 bg-slate-800 shadow-md sm:h-10 sm:w-10">
            <span className="text-sm font-display font-bold text-amber-300">100</span>
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-wide">Commander</span>
              <span className="text-xs font-mono text-amber-400 font-bold">[PROV]</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">PREMIUM: 365d</span>
              <span>·</span>
              <span>Level 100 Ace</span>
            </div>
          </div>
        </div>

        {/* Center: The Iconic "TO BATTLE!" Large Button */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <button
              onClick={() => setIsTestDriving(true)}
              className="group relative flex items-center justify-center gap-2 rounded border border-amber-300/40 bg-gradient-to-r from-red-700 via-red-600 to-amber-600 px-2 py-2 text-sm font-extrabold uppercase tracking-wider text-white shadow-2xl transition-all hover:from-red-600 hover:to-amber-500 active:scale-95 sm:gap-3 sm:px-12 sm:text-base sm:tracking-widest"
            >
              <Flame className="w-5 h-5 fill-current text-amber-300 group-hover:scale-110 transition-transform" />
              <span>TEST DRIVE</span>
              <span className="hidden text-xs font-mono text-amber-200 sm:inline">[{currentVehicle.shortName}]</span>
            </button>
            <div className="flex items-center gap-1 text-[11px] text-slate-300 mt-0.5">
              <span>Mode:</span>
              <select
                value={battleMode}
                onChange={(e) => setBattleMode(e.target.value)}
                className="bg-transparent text-amber-400 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Realistic Battles" className="bg-slate-900 text-white">Realistic Battles</option>
                <option value="Arcade Battles" className="bg-slate-900 text-white">Arcade Battles</option>
                <option value="Simulator Battles" className="bg-slate-900 text-white">Simulator Battles</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Currencies & Online Server Status */}
        <div className="hidden items-center gap-5 font-mono text-xs xl:flex">
          {/* Silver Lions */}
          <div className="flex items-center gap-1.5" title="Silver Lions">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block shadow-sm" />
            <span className="text-slate-100 font-bold">24,850,210</span>
            <span className="text-slate-400 text-[10px]">SL</span>
          </div>

          {/* Golden Eagles */}
          <div className="flex items-center gap-1.5" title="Golden Eagles">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm" />
            <span className="text-amber-400 font-bold">15,400</span>
            <span className="text-amber-300 text-[10px]">GE</span>
          </div>

          {/* Free Research Points */}
          <div className="flex items-center gap-1.5" title="Convertible Free RP">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shadow-sm" />
            <span className="text-sky-300 font-bold">4,820,000</span>
            <span className="text-sky-400 text-[10px]">RP</span>
          </div>

          {/* Online status */}
          <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-[11px] border-l border-white/10 pl-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>142,518 Online</span>
          </div>
        </div>
      </header>

      {/* ==========================================================
          SUB-HEADER: WAR THUNDER MAIN NAVIGATION TABS
         ========================================================== */}
      <nav className="relative z-20 flex shrink-0 items-center justify-between gap-4 overflow-x-auto px-3 py-1.5 bg-[#0f141d]/90 border-b border-white/10 text-xs sm:px-6">
        <div className="flex shrink-0 items-center gap-4 sm:gap-6">
          <button
            onClick={() => setInspectorMode('standard')}
            className={`font-semibold uppercase tracking-wider transition-colors pb-1 border-b-2 ${
              inspectorMode === 'standard' && !isTreeModalOpen
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            HANGAR
          </button>
          <button
            onClick={() => setIsTreeModalOpen(true)}
            className="font-semibold uppercase tracking-wider text-slate-400 border-b-2 border-transparent hover:text-white transition-colors pb-1 flex items-center gap-1"
          >
            <span>RESEARCH TREE</span>
            <span className="px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[10px] font-mono">ALL UNLOCKED</span>
          </button>
          <button
            onClick={() => setInspectorMode(inspectorMode === 'armor' ? 'standard' : 'armor')}
            className={`font-semibold uppercase tracking-wider transition-colors pb-1 border-b-2 ${
              inspectorMode === 'armor'
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            PROTECTION ANALYSIS
          </button>
          <button
            onClick={() => setInspectorMode(inspectorMode === 'xray' ? 'standard' : 'xray')}
            className={`font-semibold uppercase tracking-wider transition-colors pb-1 border-b-2 ${
              inspectorMode === 'xray'
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            X-RAY VIEW
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <FullscreenControl
            isFullscreen={isFullscreen}
            error={fullscreenError}
            onToggle={handleFullscreenToggle}
          />
          <button
            onClick={() => setIsTreeModalOpen(true)}
            className="hidden items-center gap-1.5 rounded border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/30 sm:flex"
          >
            <Grid className="w-3.5 h-3.5" />
            Any-Vehicle Tree / Spawner
          </button>
        </div>
      </nav>

      {/* ==========================================================
          MAIN HANGAR 3D VIEWPORT & AUTHENTIC UI
         ========================================================== */}
      <main className="relative flex-1 w-full overflow-hidden">
        {/* 3D Military Airbase / Hangar Viewport */}
        <HangarViewport
          vehicle={currentVehicle}
          inspectorMode={inspectorMode}
          camoColor={currentCamo.primary}
          camoRoughness={currentCamo.roughness}
          testShellPenMm={activeTestShell.penMm}
          testShellName={activeTestShell.name}
        />

        {/* Left Side: Authentic War Thunder Vehicle Stat Card */}
        <aside className="pointer-events-auto absolute left-2 top-2 z-10 w-[min(20rem,calc(100%-1rem))] max-h-[calc(100%-10rem)] overflow-y-auto rounded-md border border-white/15 bg-slate-950/85 p-3 shadow-2xl backdrop-blur-md sm:left-6 sm:top-4 sm:w-80 sm:p-4 md:w-88 space-y-3">
          {/* Header Banner: Nation + Rank + BR */}
          <div className="border-b border-white/10 pb-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-0.5">
              <span>{currentVehicle.nation.toUpperCase()} · RANK {currentVehicle.rank}</span>
              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-amber-400 font-bold">
                BR {currentVehicle.br}
              </span>
            </div>

            <h1 className="text-lg font-display font-extrabold text-white tracking-wide uppercase">
              {currentVehicle.name}
            </h1>
            <p className="text-xs text-slate-400 uppercase font-semibold mt-0.5">
              {currentVehicle.role}
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded border border-white/10">
            <button
              onClick={() => setInspectorMode('standard')}
              className={`flex items-center justify-center gap-1 py-1.5 text-xs font-bold uppercase rounded transition-colors ${
                inspectorMode === 'standard'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Exterior
            </button>
            <button
              onClick={() => setInspectorMode('armor')}
              className={`flex items-center justify-center gap-1 py-1.5 text-xs font-bold uppercase rounded transition-colors ${
                inspectorMode === 'armor'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Armor
            </button>
            <button
              onClick={() => setInspectorMode('xray')}
              className={`flex items-center justify-center gap-1 py-1.5 text-xs font-bold uppercase rounded transition-colors ${
                inspectorMode === 'xray'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              X-Ray
            </button>
          </div>

          {/* Protection Threat Shell Dropdown */}
          {inspectorMode !== 'standard' && (
            <div className="p-2 bg-slate-900/90 border border-amber-500/30 rounded text-xs space-y-1">
              <label className="block text-amber-400 font-bold uppercase text-[10px]">
                Simulate Threat Shell Against Hull:
              </label>
              <select
                value={testShellIdx}
                onChange={(e) => setTestShellIdx(Number(e.target.value))}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              >
                {TEST_SHELL_OPTIONS.map((s, idx) => (
                  <option key={s.name} value={idx}>
                    {s.name} ({s.penMm} mm @ 0°)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Firepower Stats */}
          <div className="space-y-1.5 border-t border-white/10 pt-2 text-xs">
            <div className="flex items-center justify-between text-amber-400 font-display font-bold uppercase">
              <span>Main Armament</span>
              <span className="font-mono text-slate-200">{currentVehicle.caliberMm} mm</span>
            </div>
            <p className="text-slate-300 truncate">{currentVehicle.mainGunName}</p>

            <div className="grid grid-cols-2 gap-y-1 text-xs font-mono tabular-nums text-slate-300">
              <div className="flex justify-between pr-2">
                <span className="text-slate-500">Reload:</span>
                <span>{currentVehicle.reloadSeconds} s</span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-slate-500">Traverse:</span>
                <span>{currentVehicle.turretTraverseDegPerSec}°/s</span>
              </div>
              <div className="flex justify-between pr-2">
                <span className="text-slate-500">Guidance:</span>
                <span>{currentVehicle.depressionDeg}°/+{currentVehicle.elevationDeg}°</span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-slate-500">Top Dart:</span>
                <span className="text-amber-400">{primaryShell ? `${primaryShell.penetrationMm}mm` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Armor Stats */}
          <div className="space-y-1.5 border-t border-white/10 pt-2 text-xs">
            <div className="text-amber-400 font-display font-bold uppercase">Armor Profile</div>
            <div className="grid grid-cols-2 gap-y-1 text-xs font-mono tabular-nums text-slate-300">
              <div className="flex justify-between pr-2">
                <span className="text-slate-500">Hull Front:</span>
                <span>{currentVehicle.armor.hullFront} mm</span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-slate-500">Turret Front:</span>
                <span>{currentVehicle.armor.turretFront} mm</span>
              </div>
              <div className="flex justify-between pr-2">
                <span className="text-slate-500">Hull Side:</span>
                <span>{currentVehicle.armor.hullSide} mm</span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-slate-500">Crew:</span>
                <span>{currentVehicle.crewCount}</span>
              </div>
            </div>
          </div>

          {/* Mobility Stats */}
          <div className="space-y-1.5 border-t border-white/10 pt-2 text-xs">
            <div className="text-amber-400 font-display font-bold uppercase">Mobility</div>
            <div className="grid grid-cols-2 gap-y-1 text-xs font-mono tabular-nums text-slate-300">
              <div className="flex justify-between pr-2">
                <span className="text-slate-500">Max Speed:</span>
                <span>{currentVehicle.mobility.maxSpeedForwardKmh} km/h</span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-slate-500">Reverse:</span>
                <span>{Math.abs(currentVehicle.mobility.maxSpeedReverseKmh)} km/h</span>
              </div>
              <div className="flex justify-between pr-2">
                <span className="text-slate-500">Engine:</span>
                <span>{currentVehicle.mobility.horsepower} HP</span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-slate-500">Mass:</span>
                <span>{currentVehicle.mobility.weightTons} t</span>
              </div>
            </div>
          </div>

          {/* Camouflage Selector */}
          <div className="border-t border-white/10 pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Camouflage:</span>
            <select
              value={selectedCamoId}
              onChange={(e) => setSelectedCamoId(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs"
            >
              {CAMOUFLAGES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => setIsTestDriving(true)}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-extrabold text-sm uppercase rounded shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            TEST DRIVE ON PROVING GROUND
          </button>
        </aside>

        {/* ==========================================================
            BOTTOM WAR THUNDER CREW PRESETS BAR
           ========================================================== */}
        <section className="pointer-events-auto absolute bottom-0 inset-x-0 z-10 border-t border-white/15 bg-[#0c1017]/95 px-2 py-2 backdrop-blur-md sm:px-6 sm:py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col gap-2">
            {/* Row 1: 10 Nation Flags + 4 Branches */}
            <div className="flex items-center justify-between gap-2">
              {/* 10 Nations */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {NATIONS.map((n) => {
                  const active = selectedNation === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNationChange(n.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase transition-colors shrink-0 ${
                        active
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-0.5">
                        <span className="w-1 h-2.5" style={{ backgroundColor: n.flagColors[0] }} />
                        <span className="w-1 h-2.5" style={{ backgroundColor: n.flagColors[1] }} />
                        <span className="w-1 h-2.5" style={{ backgroundColor: n.flagColors[2] }} />
                      </span>
                      <span>{n.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* 4 Branches */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 shrink-0">
                {BRANCHES.map((b) => {
                  const active = selectedBranch === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => handleBranchChange(b.id)}
                      className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
                        active
                          ? 'bg-slate-800 text-amber-400 border border-amber-400/50'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Crew Lineup Cards */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {nationLineup.slice(0, 18).map((v, idx) => {
                const isSelected = v.id === currentVehicle.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setCurrentVehicle(v)}
                    className={`relative group flex flex-col justify-between min-w-[190px] max-w-[210px] p-2 rounded border text-left transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#263145] to-[#161d29] border-amber-400 shadow-lg'
                        : 'bg-gradient-to-b from-[#161c26] to-[#0e1218] border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 w-full mb-1">
                      <span className="font-mono text-emerald-400">CREW #{idx + 1} · ACE</span>
                      <span className="font-mono font-bold text-amber-400">BR {v.br}</span>
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <div className="text-xs font-display font-bold text-white uppercase truncate">
                        {v.shortName}
                      </div>
                      <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-white/10 w-full">
                      <span>Rank {v.rank}</span>
                      <span className="text-emerald-400 font-semibold">TEST READY</span>
                    </div>
                  </button>
                );
              })}

              {/* Open Full Tree Button in Crew Bar */}
              <button
                onClick={() => setIsTreeModalOpen(true)}
                className="flex flex-col items-center justify-center min-w-[170px] p-2 rounded border border-dashed border-amber-400/50 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-300 transition-colors uppercase shrink-0"
              >
                <span>+ ALL 100+ VEHICLES</span>
                <span className="text-[10px] text-slate-400 lowercase font-normal">Open Full Research Tree</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ==========================================================
          RESEARCH TREE & ANY-VEHICLE SPAWNER MODAL
         ========================================================== */}
      {isTreeModalOpen && (
        <ResearchTreeModal
          selectedNation={selectedNation}
          selectedBranch={selectedBranch}
          currentVehicle={currentVehicle}
          onSelectNation={setSelectedNation}
          onSelectBranch={setSelectedBranch}
          onSelectVehicleForHangar={(v) => {
            setCurrentVehicle(v);
            setSelectedNation(v.nation);
            setSelectedBranch(v.branch);
          }}
          onLaunchTestDrive={(v) => {
            setCurrentVehicle(v);
            setSelectedNation(v.nation);
            setSelectedBranch(v.branch);
            setIsTreeModalOpen(false);
            setIsTestDriving(true);
          }}
          onClose={() => setIsTreeModalOpen(false)}
        />
      )}
    </div>
  );
}
