import React, { useState, useMemo, useEffect } from 'react';
import { ParsedPDB, Prediction, AdvancedStats, UniProtResult, AlphaMissenseData } from '../types';
import { 
  Search, Info, Database, Layers, Hash, Activity, AlignLeft, 
  FileText, Zap, FlaskConical, TrendingUp, ShieldAlert, Cpu, 
  ShieldCheck, Box, Binary, Scale, Link2, Microscope, 
  Globe, AlertTriangle, Dna, ArrowUpDown, Filter, Download,
  Network, Sparkles, GitBranch, Atom
} from 'lucide-react';
import { calculateDihedrals, calculateContactMap, getSequenceHydrophobicity, calculateAdvancedStats } from '../services/pdbService';
import { fetchAlphaMissenseData } from '../services/apiService';
import { 
  RamachandranPlot, ContactMap, CompositionChart, 
  ShapeAnisotropyPlot, PairDistributionPlot, PackingDensityPlot, 
  FlexibilityProfilePlot, ConservationPlot, PocketSizeChart, AlphaMissenseHeatmap 
} from './AnalysisCharts';
import { SequenceAnnotationPanel } from './SequenceAnnotationPanel';
import { PAEViewer } from './PAEViewer';
import { AlphaMissenseStudio } from './AlphaMissenseStudio';
import { AF3ComplexViewer } from './AF3ComplexViewer';
import { AlphaProteoStudio } from './AlphaProteoStudio';
import { AlphaGenomeStudio } from './AlphaGenomeStudio';
import { ScientificPipelineBridge } from './ScientificPipelineBridge';

interface InfoPanelProps {
  parsedPDB: ParsedPDB;
  predictionInfo: Prediction | null;
  uniprotData?: UniProtResult | null;
  paeData?: number[][] | null;
  onSetColorScheme?: (label: string) => void;
  onLoadBenchmark?: (id: string) => void;
}

type WorkflowTrack = 'ai' | 'classical' | 'bridge';
type Tab = 'spec' | 'biophysics' | 'morphology' | 'sequence' | 'coordinates' | 'genomics' | 'alphagenome' | 'af3' | 'pae' | 'alphamissense' | 'alphaproteo' | 'bridge';

const InfoPanel: React.FC<InfoPanelProps> = ({ 
  parsedPDB, 
  predictionInfo, 
  uniprotData,
  paeData,
  onSetColorScheme,
  onLoadBenchmark
}) => {
  const [workflowTrack, setWorkflowTrack] = useState<WorkflowTrack>('ai');
  const [activeTab, setActiveTab] = useState<Tab>('alphagenome');
  const [atomFilter, setAtomFilter] = useState('');
  const [variantFilter, setVariantFilter] = useState('');
  const [amData, setAmData] = useState<AlphaMissenseData[]>([]);

  const dihedrals = useMemo(() => calculateDihedrals(parsedPDB.atoms), [parsedPDB]);
  const contactMap = useMemo(() => calculateContactMap(parsedPDB.atoms), [parsedPDB]);
  const advancedStats = useMemo(() => calculateAdvancedStats(parsedPDB.atoms), [parsedPDB]);

  useEffect(() => {
    if (predictionInfo && predictionInfo.amUrl) {
      fetchAlphaMissenseData(predictionInfo.amUrl).then(setAmData);
    } else {
      setAmData([]);
    }
  }, [predictionInfo]);

  const stats = {
    atoms: parsedPDB.atoms.length,
    residues: new Set(parsedPDB.atoms.map(a => a.resSeq)).size,
    chains: new Set(parsedPDB.atoms.map(a => a.chainID)).size,
  };

  const variants = useMemo(() => {
    if (!uniprotData?.features) return [];
    return uniprotData.features
      .filter(f => f.type === 'VARIANT' || f.type === 'MUTAGEN')
      .map(f => ({
        ...f,
        begin: parseInt(f.begin),
        end: parseInt(f.end)
      }));
  }, [uniprotData]);

  const filteredVariants = useMemo(() => {
    if (!variantFilter.trim()) return variants;
    const q = variantFilter.toLowerCase();
    return variants.filter(v => 
      v.begin.toString().includes(q) ||
      (v.wildType && v.wildType.toLowerCase().includes(q)) ||
      (v.alternativeSequence && v.alternativeSequence.toLowerCase().includes(q)) ||
      (v.description && v.description.toLowerCase().includes(q))
    );
  }, [variants, variantFilter]);

  // DeepMind Frontier AI Suite Tabs
  const aiTabs: { id: Tab; label: string; count?: string | number; badge?: string }[] = [
    { id: 'alphagenome', label: 'AlphaGenome Studio', badge: 'Regulatory AI' },
    { id: 'af3', label: 'AlphaFold 3 Multimer', badge: 'Nature 2024' },
    { id: 'pae', label: 'PAE Matrix', badge: 'AlphaFold DB' },
    { id: 'alphamissense', label: 'AlphaMissense', badge: '71M Catalog' },
    { id: 'alphaproteo', label: 'AlphaProteo Design', badge: 'De Novo' },
  ];

  // Classical Structural Biophysics & Topology Tabs (The "Old" Workflow)
  const classicalTabs: { id: Tab; label: string; count?: string | number; badge?: string }[] = [
    { id: 'spec', label: 'Spec Sheet & Stoichiometry' },
    { id: 'biophysics', label: 'Biophysics & Topology' },
    { id: 'morphology', label: 'Morphology & Pockets', count: advancedStats.pockets.length },
    { id: 'sequence', label: 'Sequence Track' },
    { id: 'coordinates', label: 'PDB Coordinates', count: stats.atoms },
    { id: 'genomics', label: 'ClinVar & UniProt Variants', count: variants.length },
  ];

  const currentTabs = workflowTrack === 'ai' ? aiTabs : workflowTrack === 'classical' ? classicalTabs : [];

  return (
    <div className="flex flex-col h-full bg-[#12161c] text-neutral-200 select-text">
      {/* Top-Level Primary Workflow Track Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-3 py-2 bg-[#0a0d12] border-b border-neutral-800 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5 p-0.5 bg-[#12161c] border border-neutral-800 rounded-lg">
          <button
            onClick={() => {
              setWorkflowTrack('ai');
              if (!aiTabs.some(t => t.id === activeTab)) setActiveTab('alphagenome');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              workflowTrack === 'ai'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>DeepMind Frontier AI Suite</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
              5 AI Systems
            </span>
          </button>

          <button
            onClick={() => {
              setWorkflowTrack('classical');
              if (!classicalTabs.some(t => t.id === activeTab)) setActiveTab('spec');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              workflowTrack === 'classical'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Atom className="w-3.5 h-3.5 text-amber-400" />
            <span>Classical Biophysics Workflow</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
              Foundational
            </span>
          </button>

          <button
            onClick={() => {
              setWorkflowTrack('bridge');
              setActiveTab('bridge');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              workflowTrack === 'bridge'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-violet-400" />
            <span>Scientific Continuity & Pipeline</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-950 text-violet-300 border border-violet-800">
              6 Stages
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500 justify-end">
          <span className="text-neutral-300 font-semibold">{predictionInfo?.gene || 'TP53'}</span>
          <span>·</span>
          <span>{predictionInfo?.uniprotAccession || 'P04637'}</span>
          <span>·</span>
          <span>{stats.residues} residues</span>
        </div>
      </div>

      {/* Sub-Navigation Tab Bar for the Active Track */}
      {workflowTrack !== 'bridge' && (
        <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0e1116] px-3 pt-1 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1">
            {currentTabs.map(t => {
              const isActive = activeTab === t.id;
              const activeColor = workflowTrack === 'ai' 
                ? 'border-sky-500 text-sky-400 bg-neutral-900/60 font-semibold'
                : 'border-amber-500 text-amber-400 bg-neutral-900/60 font-semibold';
              const badgeActiveColor = workflowTrack === 'ai'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30';

              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive 
                      ? activeColor 
                      : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
                  }`}
                >
                  <span>{t.label}</span>
                  {t.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? badgeActiveColor : 'bg-neutral-800/80 text-neutral-400'
                    }`}>
                      {t.badge}
                    </span>
                  )}
                  {t.count !== undefined && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? badgeActiveColor : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-neutral-500 pr-2">
            <span className={workflowTrack === 'ai' ? 'text-sky-400' : 'text-amber-400'}>
              {workflowTrack === 'ai' ? 'AI Sequence Track' : 'Physical Invariants Track'}
            </span>
          </div>
        </div>
      )}

      {/* Tab Contents Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        
        {/* TAB: SCIENTIFIC CONTINUITY & PIPELINE BRIDGE */}
        {activeTab === 'bridge' && (
          <div className="max-w-7xl mx-auto">
            <ScientificPipelineBridge 
              onSelectWorkflow={(track, subTab) => {
                setWorkflowTrack(track);
                if (subTab) {
                  setActiveTab(subTab as Tab);
                } else {
                  setActiveTab(track === 'ai' ? 'alphagenome' : 'spec');
                }
              }} 
            />
          </div>
        )}

        {/* TAB: ALPHAGENOME REGULATORY EPIGENOMICS (DEEPMIND) */}
        {activeTab === 'alphagenome' && (
          <div className="max-w-7xl mx-auto">
            <AlphaGenomeStudio 
              geneSymbol={predictionInfo?.gene || 'TP53'}
              uniprotAccession={predictionInfo?.uniprotAccession || 'P04637'}
            />
          </div>
        )}

        {/* TAB 1: SPEC SHEET / SUMMARY */}
        {activeTab === 'spec' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 bg-[#161b22] border border-neutral-800 rounded">
                <span className="text-[11px] text-neutral-400 block">Residue Length</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-mono font-semibold text-white tabular-nums">{stats.residues.toLocaleString()}</span>
                  <span className="text-xs text-neutral-500">aa</span>
                </div>
              </div>
              <div className="p-3 bg-[#161b22] border border-neutral-800 rounded">
                <span className="text-[11px] text-neutral-400 block">Atomic Coordinates</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-mono font-semibold text-white tabular-nums">{stats.atoms.toLocaleString()}</span>
                  <span className="text-xs text-neutral-500">atoms</span>
                </div>
              </div>
              <div className="p-3 bg-[#161b22] border border-neutral-800 rounded">
                <span className="text-[11px] text-neutral-400 block">Mean Model Confidence</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-mono font-semibold text-emerald-400 tabular-nums">{advancedStats.avgPlddt.toFixed(1)}%</span>
                  <span className="text-xs text-neutral-500">pLDDT</span>
                </div>
              </div>
              <div className="p-3 bg-[#161b22] border border-neutral-800 rounded">
                <span className="text-[11px] text-neutral-400 block">Theoretical pI</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-mono font-semibold text-sky-400 tabular-nums">{advancedStats.isoelectricPoint.toFixed(2)}</span>
                  <span className="text-xs text-neutral-500">pH</span>
                </div>
              </div>
            </div>

            {/* Protein Spec Sheet Table & Secondary Structure */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Biophysical Property Matrix */}
              <div className="lg:col-span-2 border border-neutral-800 bg-[#161b22] rounded overflow-hidden">
                <div className="px-3.5 py-2.5 bg-[#1b2129] border-b border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-sky-400" />
                    <h3 className="text-xs font-semibold text-neutral-200">Biophysical Property Specification</h3>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">PDB & AlphaFold Invariants</span>
                </div>

                <table className="w-full text-left text-xs font-mono divide-y divide-neutral-800">
                  <tbody className="divide-y divide-neutral-800/60">
                    <tr className="hover:bg-neutral-800/20">
                      <td className="py-2 px-3.5 text-neutral-400 font-sans text-xs w-1/3">Target Accession / Gene</td>
                      <td className="py-2 px-3.5 text-white font-semibold">{predictionInfo?.gene || 'Target'} ({predictionInfo?.uniprotAccession || 'P04637'})</td>
                      <td className="py-2 px-3.5 text-neutral-500 text-[11px]">UniProt KnowledgeBase Primary Entry</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/20">
                      <td className="py-2 px-3.5 text-neutral-400 font-sans text-xs">Organism & Taxonomy</td>
                      <td className="py-2 px-3.5 text-neutral-200">{predictionInfo?.organismScientificName || 'Homo sapiens'} (TaxID: {predictionInfo?.taxId || 9606})</td>
                      <td className="py-2 px-3.5 text-neutral-500 text-[11px]">NCBI Taxonomy Database</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/20">
                      <td className="py-2 px-3.5 text-neutral-400 font-sans text-xs">Molecular Weight</td>
                      <td className="py-2 px-3.5 text-neutral-200">{(advancedStats.molecularWeight / 1000).toFixed(2)} kDa</td>
                      <td className="py-2 px-3.5 text-neutral-500 text-[11px]">Calculated anhydrous polypeptide mass</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/20">
                      <td className="py-2 px-3.5 text-neutral-400 font-sans text-xs">Net Charge at pH 7.0</td>
                      <td className="py-2 px-3.5 text-neutral-200">{(advancedStats.netCharge > 0 ? '+' : '') + advancedStats.netCharge.toFixed(1)} e</td>
                      <td className="py-2 px-3.5 text-neutral-500 text-[11px]">Henderson-Hasselbalch estimation</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/20">
                      <td className="py-2 px-3.5 text-neutral-400 font-sans text-xs">Radius of Gyration (Rg)</td>
                      <td className="py-2 px-3.5 text-neutral-200">{advancedStats.radiusOfGyration.toFixed(2)} Å</td>
                      <td className="py-2 px-3.5 text-neutral-500 text-[11px]">Mass-weighted root-mean-square distance</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/20">
                      <td className="py-2 px-3.5 text-neutral-400 font-sans text-xs">Hydrogen Bond Network</td>
                      <td className="py-2 px-3.5 text-neutral-200">{advancedStats.hBondCount.toLocaleString()} bonds</td>
                      <td className="py-2 px-3.5 text-neutral-500 text-[11px]">Geometric distance/angle criteria (&lt;3.5 Å)</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/20">
                      <td className="py-2 px-3.5 text-neutral-400 font-sans text-xs">Secondary Elements</td>
                      <td className="py-2 px-3.5 text-neutral-200">{parsedPDB.helices.length} Helices, {parsedPDB.sheets.length} Sheets</td>
                      <td className="py-2 px-3.5 text-neutral-500 text-[11px]">PDB HELIX and SHEET record count</td>
                    </tr>
                    <tr className="hover:bg-neutral-800/20">
                      <td className="py-2 px-3.5 text-neutral-400 font-sans text-xs">Binding Pockets / Voids</td>
                      <td className="py-2 px-3.5 text-neutral-200">{advancedStats.pockets.length} detected ({advancedStats.pockets.reduce((a, b) => a + b.volume, 0).toFixed(0)} Å³)</td>
                      <td className="py-2 px-3.5 text-neutral-500 text-[11px]">Alpha-shape solvent exclusion cavities</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Secondary Structure & Confidence Scale */}
              <div className="space-y-4">
                {/* Secondary Structure Propensity */}
                <div className="border border-neutral-800 bg-[#161b22] rounded p-3.5">
                  <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-neutral-800 text-xs font-semibold text-neutral-200">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Secondary Structure Propensity</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Alpha Helix', val: advancedStats.ssPropensity.alpha, color: 'bg-indigo-500' },
                      { label: 'Beta Sheet', val: advancedStats.ssPropensity.beta, color: 'bg-emerald-500' },
                      { label: 'Loop / Random Coil', val: advancedStats.ssPropensity.coil, color: 'bg-neutral-500' }
                    ].map(item => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-400">{item.label}</span>
                          <span className="font-mono text-neutral-200 font-medium">{item.val.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-800 rounded overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AlphaFold Confidence Calibration */}
                <div className="border border-neutral-800 bg-[#161b22] rounded p-3.5">
                  <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-neutral-800 text-xs font-semibold text-neutral-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>AlphaFold pLDDT Tiers</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    {[
                      { label: 'Very High', range: '> 90', color: 'bg-[#0053D6]', desc: 'High backbone & sidechain fidelity' },
                      { label: 'Confident', range: '70-90', color: 'bg-[#65CBF3]', desc: 'Reliable tertiary fold' },
                      { label: 'Low', range: '50-70', color: 'bg-[#FFDB13]', desc: 'Potential flexible loop' },
                      { label: 'Very Low', range: '< 50', color: 'bg-[#FF7D45]', desc: 'Intrinsically disordered region' }
                    ].map(tier => (
                      <div key={tier.label} className="flex items-center justify-between py-1 border-b border-neutral-800/40 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${tier.color} shrink-0`}></span>
                          <span className="text-neutral-300 font-sans text-xs">{tier.label}</span>
                        </div>
                        <span className="text-neutral-400 text-[11px]">{tier.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PDB Stream Remarks Inspector */}
            <div className="border border-neutral-800 bg-[#161b22] rounded overflow-hidden">
              <div className="px-3.5 py-2 bg-[#1b2129] border-b border-neutral-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  <span>PDB Header Record (AlphaFold v4 Repository Stream)</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-500">FORMAT: REMARK/HELIX/SHEET</span>
              </div>
              <div className="p-3 bg-[#0d1117] max-h-36 overflow-y-auto custom-scrollbar font-mono text-[11px] text-neutral-400 leading-relaxed">
                {parsedPDB.header.length > 0 
                  ? parsedPDB.header.slice(0, 20).join('\n') 
                  : "HEADER    ALPHAFOLD MONOMER PREDICTION"}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAE 2D MATRIX (ALPHAFOLD DB) */}
        {activeTab === 'pae' && (
          <div className="max-w-7xl mx-auto">
            <PAEViewer 
              paeData={paeData || null} 
              sequenceLength={stats.residues} 
              geneName={predictionInfo?.gene}
            />
          </div>
        )}

        {/* TAB: ALPHAMISSENSE IN-SILICO MUTAGENESIS (DEEPMIND) */}
        {activeTab === 'alphamissense' && (
          <div className="max-w-7xl mx-auto">
            <AlphaMissenseStudio 
              amData={amData} 
              sequenceLength={stats.residues}
              geneName={predictionInfo?.gene}
              onSetColorScheme={onSetColorScheme}
            />
          </div>
        )}

        {/* TAB: ALPHAFOLD 3 MULTIMER & LIGANDS (DEEPMIND NATURE 2024) */}
        {activeTab === 'af3' && (
          <div className="max-w-7xl mx-auto">
            <AF3ComplexViewer 
              parsedPDB={parsedPDB} 
              geneName={predictionInfo?.gene}
              onLoadBenchmark={onLoadBenchmark}
            />
          </div>
        )}

        {/* TAB: ALPHAPROTEO DE NOVO BINDER DESIGN (DEEPMIND SEPT 2024) */}
        {activeTab === 'alphaproteo' && (
          <div className="max-w-7xl mx-auto">
            <AlphaProteoStudio 
              geneName={predictionInfo?.gene}
              sequenceLength={stats.residues}
            />
          </div>
        )}

        {/* TAB 2: BIOPHYSICS & TOPOLOGY */}
        {activeTab === 'biophysics' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Ramachandran & Quadrant Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 border border-neutral-800 bg-[#161b22] rounded p-4">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <div>
                      <h3 className="text-xs font-semibold text-neutral-200">Ramachandran Dihedral Distribution</h3>
                      <span className="text-[11px] text-neutral-400">Phi (φ) vs Psi (ψ) backbone conformational angles</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">{dihedrals.length} residues evaluated</span>
                </div>
                <RamachandranPlot data={dihedrals} />
              </div>

              {/* Quadrant Statistical Specs */}
              <div className="border border-neutral-800 bg-[#161b22] rounded p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-200 pb-2 mb-3 border-b border-neutral-800">
                    Conformational Basins
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 bg-[#1b2129] border border-neutral-800 rounded">
                      <span className="text-[11px] text-neutral-400 block">Alpha-Helix Basin (φ ≈ -60°, ψ ≈ -45°)</span>
                      <span className="text-sm font-mono font-semibold text-indigo-400">
                        {dihedrals.filter(d => d.phi < 0 && d.psi < 0).length} residues
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#1b2129] border border-neutral-800 rounded">
                      <span className="text-[11px] text-neutral-400 block">Beta-Sheet Basin (φ ≈ -120°, ψ ≈ +130°)</span>
                      <span className="text-sm font-mono font-semibold text-emerald-400">
                        {dihedrals.filter(d => d.phi < 0 && d.psi > 0).length} residues
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#1b2129] border border-neutral-800 rounded">
                      <span className="text-[11px] text-neutral-400 block">Left-Handed Helix (φ ≈ +60°, ψ ≈ +45°)</span>
                      <span className="text-sm font-mono font-semibold text-amber-400">
                        {dihedrals.filter(d => d.phi > 0 && d.psi > 0).length} residues
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 mt-4 leading-relaxed">
                  Ramachandran validation checks whether backbone dihedral torsion angles occupy energetically allowed conformations without steric clash.
                </p>
              </div>
            </div>

            {/* Residue Composition & Contact Map */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-neutral-800 bg-[#161b22] rounded p-4">
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-neutral-800">
                  <FlaskConical className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold text-neutral-200">Amino Acid Composition</h3>
                </div>
                <CompositionChart data={advancedStats.composition} />
              </div>

              <div className="border border-neutral-800 bg-[#161b22] rounded p-4">
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-neutral-800">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-semibold text-neutral-200">Residue Distance Contact Matrix</h3>
                </div>
                <ContactMap data={contactMap} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GENOMICS & VARIANTS */}
        {activeTab === 'genomics' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* AlphaMissense & Conservation Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-neutral-800 bg-[#161b22] rounded p-4">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-400" />
                    <div>
                      <h3 className="text-xs font-semibold text-neutral-200">AlphaMissense Pathogenicity</h3>
                      <span className="text-[11px] text-neutral-400">DeepMind missense variant score classifications</span>
                    </div>
                  </div>
                </div>
                {amData.length > 0 ? (
                  <AlphaMissenseHeatmap data={amData} />
                ) : (
                  <div className="py-10 text-center text-xs text-neutral-500 font-mono">
                    AlphaMissense prediction track unavailable for non-human or unreviewed isoforms.
                  </div>
                )}
              </div>

              <div className="border border-neutral-800 bg-[#161b22] rounded p-4">
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-neutral-800">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-200">Evolutionary Conservation Profile</h3>
                    <span className="text-[11px] text-neutral-400">Heuristic structural substitution propensity</span>
                  </div>
                </div>
                <ConservationPlot data={advancedStats.conservationScores} />
              </div>
            </div>

            {/* UniProt Variant Registry Table */}
            <div className="border border-neutral-800 bg-[#161b22] rounded overflow-hidden">
              <div className="px-3.5 py-2.5 bg-[#1b2129] border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <h3 className="text-xs font-semibold text-neutral-200">UniProt Curated Missense & Natural Polymorphisms</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">{filteredVariants.length} recorded</span>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search position or mutation..."
                    value={variantFilter}
                    onChange={e => setVariantFilter(e.target.value)}
                    className="w-full bg-[#12161c] border border-neutral-800 rounded pl-8 pr-3 py-1 text-xs text-neutral-200 placeholder-neutral-500 font-mono outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-72 custom-scrollbar">
                <table className="w-full text-left text-xs font-mono divide-y divide-neutral-800">
                  <thead className="bg-[#181e26] sticky top-0 text-neutral-400 text-[11px]">
                    <tr>
                      <th className="py-2 px-3.5">Residue</th>
                      <th className="py-2 px-3.5">Substitution</th>
                      <th className="py-2 px-3.5">Clinical / Functional Annotation</th>
                      <th className="py-2 px-3.5">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredVariants.length > 0 ? (
                      filteredVariants.map((v, i) => (
                        <tr key={i} className="hover:bg-neutral-800/20">
                          <td className="py-2 px-3.5 text-amber-400 font-semibold">Pos {v.begin}</td>
                          <td className="py-2 px-3.5 text-white">{v.wildType} → {v.alternativeSequence || '?'}</td>
                          <td className="py-2 px-3.5 text-neutral-300 font-sans text-xs">{v.description || 'Natural variant'}</td>
                          <td className="py-2 px-3.5 text-neutral-500 text-[11px]">{v.type}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-neutral-500 font-sans text-xs">
                          No variant annotations found matching filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MORPHOLOGY & POCKETS */}
        {activeTab === 'morphology' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Pockets & Geometric Classification */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Pocket List Table */}
              <div className="lg:col-span-2 border border-neutral-800 bg-[#161b22] rounded overflow-hidden">
                <div className="px-3.5 py-2.5 bg-[#1b2129] border-b border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="w-3.5 h-3.5 text-emerald-400" />
                    <h3 className="text-xs font-semibold text-neutral-200">Cavity & Void Identification Table</h3>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">Total Voids: {advancedStats.pockets.length}</span>
                </div>

                <div className="overflow-x-auto max-h-64 custom-scrollbar">
                  <table className="w-full text-left text-xs font-mono divide-y divide-neutral-800">
                    <thead className="bg-[#181e26] sticky top-0 text-neutral-400 text-[11px]">
                      <tr>
                        <th className="py-2 px-3.5">Pocket ID</th>
                        <th className="py-2 px-3.5">Volume (Å³)</th>
                        <th className="py-2 px-3.5">Center Coordinates (X, Y, Z)</th>
                        <th className="py-2 px-3.5">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {advancedStats.pockets.length > 0 ? (
                        advancedStats.pockets.map((p, idx) => (
                          <tr key={idx} className="hover:bg-neutral-800/20">
                            <td className="py-2 px-3.5 text-sky-400 font-semibold">#PCK-{idx + 1}</td>
                            <td className="py-2 px-3.5 text-white font-semibold">{p.volume.toFixed(1)}</td>
                            <td className="py-2 px-3.5 text-neutral-400">
                              [{p.center[0].toFixed(1)}, {p.center[1].toFixed(1)}, {p.center[2].toFixed(1)}]
                            </td>
                            <td className="py-2 px-3.5 text-emerald-400 text-[11px]">
                              {p.volume > 300 ? 'Putative Drug Binding' : 'Small Surface Crevice'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-neutral-500 font-sans text-xs">
                            No significant solvent-excluded pockets detected.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Morphology Specs */}
              <div className="border border-neutral-800 bg-[#161b22] rounded p-4">
                <h4 className="text-xs font-semibold text-neutral-200 pb-2 mb-3 border-b border-neutral-800">
                  Principal Axes of Inertia
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-neutral-800/40">
                    <span className="text-neutral-400">Major Axis (I₁)</span>
                    <span className="text-white font-semibold">
                      {((advancedStats.inertiaMoments?.[0] ?? advancedStats.pca?.eigenvalues?.[0]) ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/40">
                    <span className="text-neutral-400">Medium Axis (I₂)</span>
                    <span className="text-white font-semibold">
                      {((advancedStats.inertiaMoments?.[1] ?? advancedStats.pca?.eigenvalues?.[1]) ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/40">
                    <span className="text-neutral-400">Minor Axis (I₃)</span>
                    <span className="text-white font-semibold">
                      {((advancedStats.inertiaMoments?.[2] ?? advancedStats.pca?.eigenvalues?.[2]) ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 pt-2">
                    <span className="text-neutral-400">Global Shape</span>
                    <span className="text-sky-400 font-semibold">
                      {advancedStats.shapeClassification || advancedStats.pca?.shapeType || 'Spherical'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pair Distribution & Packing Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-neutral-800 bg-[#161b22] rounded p-4">
                <h4 className="text-xs font-semibold text-neutral-200 pb-2 mb-3 border-b border-neutral-800">
                  Pair Distance Distribution Function P(r)
                </h4>
                <PairDistributionPlot data={advancedStats.pairDistribution} />
              </div>
              <div className="border border-neutral-800 bg-[#161b22] rounded p-4">
                <h4 className="text-xs font-semibold text-neutral-200 pb-2 mb-3 border-b border-neutral-800">
                  Atomic Packing Density Profile
                </h4>
                <PackingDensityPlot data={advancedStats.packingDensity} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SEQUENCE TRACK */}
        {activeTab === 'sequence' && (
          <div className="max-w-7xl mx-auto border border-neutral-800 bg-[#161b22] rounded p-4">
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-semibold text-neutral-200">Interactive Proteomics & Sequence Track</h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">Ruler Resolution: 1 residue/tick</span>
            </div>
            <SequenceAnnotationPanel 
              parsedPDB={parsedPDB} 
              advancedStats={advancedStats} 
              uniprotData={uniprotData} 
            />
          </div>
        )}

        {/* TAB 6: ATOMIC COORDINATES SPREADSHEET */}
        {activeTab === 'coordinates' && (
          <div className="border border-neutral-800 bg-[#161b22] rounded overflow-hidden max-w-7xl mx-auto">
            <div className="px-3.5 py-2.5 bg-[#1b2129] border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold text-neutral-200">Atomic Coordinate Register (PDB ATOM Records)</h3>
                <span className="text-[11px] font-mono text-neutral-400">
                  Showing {Math.min(500, parsedPDB.atoms.length)} of {parsedPDB.atoms.length} atoms
                </span>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Filter by atom, residue (e.g. CA, GLU)..."
                  value={atomFilter}
                  onChange={e => setAtomFilter(e.target.value)}
                  className="w-full bg-[#12161c] border border-neutral-800 rounded pl-8 pr-3 py-1 text-xs text-neutral-200 placeholder-neutral-500 font-mono outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-left text-xs font-mono divide-y divide-neutral-800">
                <thead className="bg-[#181e26] sticky top-0 text-neutral-400 text-[11px]">
                  <tr>
                    <th className="py-2 px-3.5">Serial</th>
                    <th className="py-2 px-3.5">Atom</th>
                    <th className="py-2 px-3.5">Residue</th>
                    <th className="py-2 px-3.5">Chain</th>
                    <th className="py-2 px-3.5">Seq #</th>
                    <th className="py-2 px-3.5">X (Å)</th>
                    <th className="py-2 px-3.5">Y (Å)</th>
                    <th className="py-2 px-3.5">Z (Å)</th>
                    <th className="py-2 px-3.5">Occupancy</th>
                    <th className="py-2 px-3.5">B-Factor (pLDDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {parsedPDB.atoms
                    .filter(a => 
                      !atomFilter.trim() || 
                      a.name.toUpperCase().includes(atomFilter.toUpperCase()) ||
                      a.resName.toUpperCase().includes(atomFilter.toUpperCase()) ||
                      a.resSeq.includes(atomFilter)
                    )
                    .slice(0, 500)
                    .map((a, i) => (
                      <tr key={i} className="hover:bg-neutral-800/20">
                        <td className="py-1.5 px-3.5 text-neutral-500">#{a.serial.padStart(5, '0')}</td>
                        <td className="py-1.5 px-3.5 text-white font-semibold">{a.name}</td>
                        <td className="py-1.5 px-3.5 text-sky-400">{a.resName}</td>
                        <td className="py-1.5 px-3.5 text-neutral-400">{a.chainID}</td>
                        <td className="py-1.5 px-3.5 text-neutral-300">{a.resSeq}</td>
                        <td className="py-1.5 px-3.5 text-neutral-300">{a.x.toFixed(3)}</td>
                        <td className="py-1.5 px-3.5 text-neutral-300">{a.y.toFixed(3)}</td>
                        <td className="py-1.5 px-3.5 text-neutral-300">{a.z.toFixed(3)}</td>
                        <td className="py-1.5 px-3.5 text-neutral-500">{a.occupancy.toFixed(2)}</td>
                        <td className="py-1.5 px-3.5">
                          <span className={`font-semibold ${a.tempFactor > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {a.tempFactor.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default InfoPanel;
