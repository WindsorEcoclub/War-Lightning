import React, { useState, useMemo } from 'react';
import {
  BRANCHES,
  BranchId,
  buildVehicleFromPreset,
  EXTRA_WT_CATALOG,
  NATIONS,
  NationId,
  RankRoman,
  VEHICLES,
  VehicleSpec,
} from '../data/vehicles';
import { Search, X, Play, Eye, Sliders, Award, Shield, Crosshair } from 'lucide-react';

interface ResearchTreeModalProps {
  selectedNation: NationId;
  selectedBranch: BranchId;
  currentVehicle: VehicleSpec;
  onSelectNation: (n: NationId) => void;
  onSelectBranch: (b: BranchId) => void;
  onSelectVehicleForHangar: (v: VehicleSpec) => void;
  onLaunchTestDrive: (v: VehicleSpec) => void;
  onClose: () => void;
}

export const ResearchTreeModal: React.FC<ResearchTreeModalProps> = ({
  selectedNation,
  selectedBranch,
  currentVehicle,
  onSelectNation,
  onSelectBranch,
  onSelectVehicleForHangar,
  onLaunchTestDrive,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomSpawner, setShowCustomSpawner] = useState(false);

  // Custom Any-Vehicle Spawner
  const [customName, setCustomName] = useState('Object 195 "T-95" Prototype');
  const [customBranch, setCustomBranch] = useState<BranchId>('army');
  const [customBr, setCustomBr] = useState('12.7');
  const [customCaliber, setCustomCaliber] = useState(152);
  const [customReload, setCustomReload] = useState(5.5);
  const [customPen, setCustomPen] = useState(820);
  const [customSpeed, setCustomSpeed] = useState(75);

  const allVehiclesCombined = useMemo(() => {
    const extraSpecs = EXTRA_WT_CATALOG.map((p) => buildVehicleFromPreset(p));
    const combined = [...VEHICLES, ...extraSpecs];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const result: VehicleSpec[] = [];

    for (const v of combined) {
      const normName = v.name.toLowerCase().trim();
      if (!seenIds.has(v.id) && !seenNames.has(normName)) {
        seenIds.add(v.id);
        seenNames.add(normName);
        result.push(v);
      }
    }
    return result;
  }, []);

  const filteredVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length > 0) {
      return allVehiclesCombined.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.shortName.toLowerCase().includes(q) ||
          v.role.toLowerCase().includes(q) ||
          v.mainGunName.toLowerCase().includes(q) ||
          v.nation.toLowerCase().includes(q)
      );
    }
    return allVehiclesCombined.filter(
      (v) => v.nation === selectedNation && v.branch === selectedBranch
    );
  }, [allVehiclesCombined, searchQuery, selectedNation, selectedBranch]);

  const ranksToDisplay: RankRoman[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  const handleSpawnCustomVehicle = (launchImmediately: boolean) => {
    if (!customName.trim()) return;
    const customSpec = buildVehicleFromPreset({
      name: customName.trim(),
      nation: selectedNation,
      branch: customBranch,
      rank: 'VIII',
      br: customBr,
      role:
        customBranch === 'aviation'
          ? 'Custom Jet Fighter'
          : customBranch === 'helicopters'
          ? 'Custom Attack Helicopter'
          : customBranch === 'fleet'
          ? 'Custom Capital Warship'
          : 'Custom Proving Grounds Tank',
      caliberMm: Number(customCaliber) || 120,
      reloadSeconds: Number(customReload) || 5.0,
      penetrationMm: Number(customPen) || 600,
      maxSpeedForwardKmh: Number(customSpeed) || 70,
      hullArchetype:
        customBranch === 'aviation'
          ? 'jet_swept'
          : customBranch === 'helicopters'
          ? 'heli_attack'
          : customBranch === 'fleet'
          ? 'naval_battleship'
          : 'modern_mbt_western',
    });

    if (launchImmediately) {
      onLaunchTestDrive(customSpec);
    } else {
      onSelectVehicleForHangar(customSpec);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-7xl h-[92vh] bg-[#12161f] border border-slate-700/80 rounded-lg flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header: War Thunder Research Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-gradient-to-r from-[#171c26] to-[#0f131a] border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display font-bold uppercase tracking-wider text-amber-400">
              RESEARCH TREE · ALL VEHICLES UNLOCKED
            </h2>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
              FREE TEST DRIVE
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64 md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any vehicle (e.g. Leopard, Maus, F-16)..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={() => setShowCustomSpawner((s) => !s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                showCustomSpawner
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-amber-400'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Custom Spawner
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 10 Nation Flags Bar */}
        <div className="px-6 py-2.5 bg-[#0e1219] border-b border-slate-800 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {NATIONS.map((n) => {
              const active = selectedNation === n.id && !searchQuery;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    setSearchQuery('');
                    onSelectNation(n.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold tracking-wide uppercase transition-colors shrink-0 ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-3" style={{ backgroundColor: n.flagColors[0] }} />
                    <span className="w-1 h-3" style={{ backgroundColor: n.flagColors[1] }} />
                    <span className="w-1 h-3" style={{ backgroundColor: n.flagColors[2] }} />
                  </span>
                  <span>{n.name}</span>
                </button>
              );
            })}
          </div>

          {/* 4 Branches Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 shrink-0">
            {BRANCHES.map((b) => {
              const active = selectedBranch === b.id && !searchQuery;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setSearchQuery('');
                    onSelectBranch(b.id);
                  }}
                  className={`px-3 py-1 rounded text-xs font-semibold uppercase transition-colors ${
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

        {/* Custom Vehicle Spawner Drawer */}
        {showCustomSpawner && (
          <div className="px-6 py-3.5 bg-slate-950 border-b border-amber-500/40">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
              <div className="col-span-2">
                <label className="block text-[11px] text-amber-400 font-semibold uppercase mb-1">Vehicle Designation</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 uppercase mb-1">Branch</label>
                <select
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value as BranchId)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white"
                >
                  <option value="army">Army (Ground)</option>
                  <option value="aviation">Aviation (Jet)</option>
                  <option value="helicopters">Helicopters</option>
                  <option value="fleet">Bluewater Fleet</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 uppercase mb-1">Caliber (mm)</label>
                <input
                  type="number"
                  value={customCaliber}
                  onChange={(e) => setCustomCaliber(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 uppercase mb-1">Penetration (mm)</label>
                <input
                  type="number"
                  value={customPen}
                  onChange={(e) => setCustomPen(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSpawnCustomVehicle(false)}
                  className="flex-1 px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
                >
                  Inspect
                </button>
                <button
                  onClick={() => handleSpawnCustomVehicle(true)}
                  className="flex-1 px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition-colors"
                >
                  Test Drive
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tree Vehicle Cards Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-slate-300">
                No direct branch match for "{searchQuery || selectedBranch}" in {selectedNation.toUpperCase()}.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  onSelectBranch('army');
                }}
                className="px-4 py-2 text-xs font-bold uppercase bg-amber-500 text-slate-950 rounded hover:bg-amber-400"
              >
                View {selectedNation.toUpperCase()} Army Forces
              </button>
            </div>
          ) : (
            ranksToDisplay.map((rankRoman) => {
              const rankVehicles = filteredVehicles.filter((v) => v.rank === rankRoman);
              if (rankVehicles.length === 0) return null;

              return (
                <div key={rankRoman} className="border-b border-slate-800 pb-6 last:border-b-0">
                  <div className="flex items-center justify-between mb-3 border-l-4 border-amber-500 pl-3">
                    <span className="text-sm font-display font-bold uppercase tracking-wider text-slate-200">
                      RANK {rankRoman}
                    </span>
                    <span className="text-xs text-emerald-400 font-mono font-semibold">
                      STATUS: SPADED / UNLOCKED
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rankVehicles.map((v) => (
                      <WarThunderTechCard
                        key={v.id}
                        vehicle={v}
                        isSelected={v.id === currentVehicle.id}
                        onInspect={() => {
                          onSelectVehicleForHangar(v);
                          onClose();
                        }}
                        onTestDrive={() => onLaunchTestDrive(v)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

interface WarThunderTechCardProps {
  vehicle: VehicleSpec;
  isSelected: boolean;
  onInspect: () => void;
  onTestDrive: () => void;
}

const WarThunderTechCard: React.FC<WarThunderTechCardProps> = ({
  vehicle,
  isSelected,
  onInspect,
  onTestDrive,
}) => {
  const topShell = vehicle.ammoLoadout[0];

  return (
    <div
      className={`relative rounded border transition-colors flex flex-col justify-between overflow-hidden ${
        isSelected
          ? 'bg-gradient-to-b from-[#242c3d] to-[#151a24] border-amber-400 shadow-lg'
          : vehicle.isPremium
          ? 'bg-gradient-to-b from-[#2a2318] to-[#1a150e] border-amber-500/50 hover:border-amber-400'
          : 'bg-gradient-to-b from-[#1b222d] to-[#10141b] border-slate-700/70 hover:border-slate-500'
      }`}
    >
      {/* Top Banner: BR Badge + Spade Mastery Icon */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-[11px] font-mono font-bold text-amber-300">
            BR {vehicle.br}
          </span>
          <span className="text-[11px] text-slate-400 uppercase font-semibold">
            {vehicle.role}
          </span>
        </div>
        <div className="flex items-center gap-1" title="Spaded & Maxed Out">
          <Award className="w-4 h-4 text-amber-400" />
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-display font-bold text-white truncate uppercase tracking-wide">
          {vehicle.name}
        </h3>
        <p className="text-xs text-slate-400 truncate mt-0.5">{vehicle.mainGunName}</p>

        {/* Key Stats Bar */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-white/10 text-xs font-mono tabular-nums">
          <div>
            <span className="text-[10px] text-slate-500 block">PENETRATION</span>
            <span className="text-amber-400 font-bold">{topShell ? `${topShell.penetrationMm} mm` : 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">RELOAD</span>
            <span className="text-slate-200">{vehicle.reloadSeconds} s</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">MAX SPEED</span>
            <span className="text-slate-200">{vehicle.mobility.maxSpeedForwardKmh} km/h</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-black/30 border-t border-white/10">
        <button
          onClick={onInspect}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Inspect
        </button>
        <button
          onClick={onTestDrive}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded transition-colors uppercase"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Test Drive
        </button>
      </div>
    </div>
  );
};
