import React, { useState, useMemo } from 'react';
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

  if (isTestDriving) {
    return (
      <>
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
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A0D12] text-slate-100 flex flex-col font-sans select-none">
      {/* ==========================================================
          AUTHENTIC WAR THUNDER TOP HEADER (PROFILE, TO BATTLE, CURRENCY)
         ========================================================== */}
      <header className="relative z-20 flex items-center justify-between px-5 py-2.5 bg-gradient-to-r from-[#141923] via-[#1a212e] to-[#141923] border-b border-white/10 shadow-lg">
        {/* Left: Player Profile Card */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded border-2 border-amber-400 bg-slate-800 flex items-center justify-center overflow-hidden shadow-md">
            <span className="text-sm font-display font-bold text-amber-300">100</span>
          </div>
          <div className="leading-tight">
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
              className="group relative flex items-center justify-center gap-3 px-12 py-2 bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-display font-extrabold text-base tracking-widest uppercase rounded shadow-2xl transition-all border border-amber-300/40 active:scale-95"
            >
              <Flame className="w-5 h-5 fill-current text-amber-300 group-hover:scale-110 transition-transform" />
              <span>TEST DRIVE</span>
              <span className="text-xs font-mono text-amber-200">[{currentVehicle.shortName}]</span>
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
        <div className="flex items-center gap-5 font-mono text-xs">
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
      <nav className="relative z-20 flex items-center justify-between px-6 py-1.5 bg-[#0f141d]/90 border-b border-white/10 text-xs">
        <div className="flex items-center gap-6">
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTreeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/50 hover:bg-amber-500/30 text-amber-300 font-semibold rounded text-xs transition-colors"
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
        <aside className="pointer-events-auto absolute top-4 left-6 z-10 w-80 md:w-88 max-h-[calc(100%-11.5rem)] overflow-y-auto bg-slate-950/85 backdrop-blur-md border border-white/15 rounded-md p-4 shadow-2xl space-y-3">
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
        <section className="pointer-events-auto absolute bottom-0 inset-x-0 z-10 bg-[#0c1017]/95 backdrop-blur-md border-t border-white/15 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col gap-2">
            {/* Row 1: 10 Nation Flags + 4 Branches */}
            <div className="flex items-center justify-between gap-4">
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
