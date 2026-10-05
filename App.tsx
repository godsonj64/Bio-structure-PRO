import React, { useState, useEffect, useRef } from 'react';
import { 
  Dna, Menu, X, Search, Download, Maximize2, Minimize2, 
  RotateCw, Layers, Box, Settings, BookOpen, ChevronDown, 
  Camera, Loader2, Eye, Layout, Columns, Database, Sparkles,
  Sliders, ShieldCheck, Check, ArrowRight, ExternalLink
} from 'lucide-react';
import Viewer3D, { Viewer3DHandle } from './components/Viewer3D';
import NGLViewer, { NGLViewerHandle } from './components/NGLViewer';
import InfoPanel from './components/InfoPanel';
import DocumentationModal from './components/DocumentationModal';
import { 
  colorSchemes, 
  defaultCustomColorMap, 
  RepresentationType, 
  ColorScheme, 
  Prediction, 
  ParsedPDB, 
  AdvancedStats, 
  UniProtResult 
} from './types';
import { fetchAlphaFoldPrediction, fetchPdbContent, fetchUniProtDetails, searchUniProt, fetchAlphaFoldPAE } from './services/apiService';
import { parsePDB, calculateAdvancedStats } from './services/pdbService';

// Curated benchmark targets across DeepMind AlphaFold 3, AlphaProteo, and AlphaMissense
const curatedTargets = [
  // AlphaFold 3 Multimers & Complexes
  { id: "6M0J", symbol: "SPIKE-ACE2", name: "SARS-CoV-2 Spike RBD + ACE2 Complex", organism: "Viral / Human", category: "AF3 Multimer" },
  { id: "1TUP", symbol: "TP53-DNA", name: "p53 Core Domain + DNA Helix Complex", organism: "Homo sapiens", category: "AF3 Protein-DNA" },
  { id: "2HYY", symbol: "ABL1-STI", name: "Abl Kinase + Imatinib / ATP Ligand", organism: "Homo sapiens", category: "AF3 Ligand Complex" },
  { id: "4OO8", symbol: "CAS9-RNA", name: "CRISPR-Cas9 + sgRNA + Target DNA", organism: "S. pyogenes", category: "AF3 Ribonucleoprotein" },
  
  // AlphaProteo Generative De Novo Binder Targets (DeepMind Sept 2024)
  { id: "P0DTC2", symbol: "SPIKE", name: "SARS-CoV-2 Spike (AlphaProteo AP-Spike-01)", organism: "SARS-CoV-2", category: "AlphaProteo Target" },
  { id: "P15692", symbol: "VEGF-A", name: "Vascular Endothelial Growth Factor A", organism: "Homo sapiens", category: "AlphaProteo Target" },
  { id: "Q16552", symbol: "IL-17A", name: "Interleukin-17A Cytokine Target", organism: "Homo sapiens", category: "AlphaProteo Target" },
  { id: "P04629", symbol: "TRKA", name: "High Affinity Nerve Growth Factor Receptor", organism: "Homo sapiens", category: "AlphaProteo Target" },

  // AlphaMissense Mutational Hotspots (DeepMind 71M Catalog)
  { id: "P04637", symbol: "TP53", name: "Cellular Tumor Antigen p53", organism: "Homo sapiens", category: "AlphaMissense Hotspot" },
  { id: "P38398", symbol: "BRCA1", name: "Breast Cancer Type 1 Susceptibility", organism: "Homo sapiens", category: "AlphaMissense Hotspot" },
  { id: "P13569", symbol: "CFTR", name: "Cystic Fibrosis Transmembrane Conductance", organism: "Homo sapiens", category: "AlphaMissense Hotspot" },
  { id: "P68871", symbol: "HBB", name: "Hemoglobin Subunit Beta (Sickle Cell)", organism: "Homo sapiens", category: "AlphaMissense Hotspot" },
  { id: "P42212", symbol: "GFP", name: "Green Fluorescent Protein", organism: "A. victoria", category: "Bioluminescent Marker" },
  { id: "P08100", symbol: "RHO", name: "Rhodopsin GPCR", organism: "Homo sapiens", category: "Photoreceptor" },
];

export default function App() {
  const [accession, setAccession] = useState("P04637");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [pdbContent, setPdbContent] = useState("");
  const [parsedPDB, setParsedPDB] = useState<ParsedPDB | null>(null);
  const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);
  const [uniprotDetails, setUniprotDetails] = useState<UniProtResult | null>(null);
  const [paeData, setPaeData] = useState<number[][] | null>(null);

  // Viewport display parameters
  const [selectedColorScheme, setSelectedColorScheme] = useState(colorSchemes[0]); 
  const [representationType, setRepresentationType] = useState<RepresentationType>("cartoon");
  const [showSideChains, setShowSideChains] = useState(false);
  const [showSurface, setShowSurface] = useState(false);
  const [spin, setSpin] = useState(false);
  const [colorByPlddt, setColorByPlddt] = useState(false);
  const [plddtThreshold, setPlddtThreshold] = useState(70);
  const [rendererEngine, setRendererEngine] = useState<'3dmol' | 'ngl'>('3dmol');
  const [customColors] = useState<Record<string, string>>(defaultCustomColorMap);

  // Workstation layout mode: split | viewport | inspector
  const [layoutMode, setLayoutMode] = useState<'split' | 'viewport' | 'inspector'>('split');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSettingsCard, setShowSettingsCard] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  // Target Library Sidebar
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uniProtQuery, setUniProtQuery] = useState("reviewed:true AND organism_id:9606");
  const [uniProtResults, setUniProtResults] = useState<UniProtResult[]>([]);
  const [uniProtLoading, setUniProtLoading] = useState(false);

  // Unified ref for 3D viewers
  const viewerRef = useRef<any>(null);

  // Initial load
  useEffect(() => {
    handleAnalyze("P04637");
  }, []);

  const handleAnalyze = async (targetId?: string) => {
    const idToFetch = (targetId || accession).trim();
    if (!idToFetch) return;
    setLoading(true);
    setError("");
    try {
      const preds = await fetchAlphaFoldPrediction(idToFetch);
      if (!preds || preds.length === 0) {
        throw new Error(`No AlphaFold prediction records located for '${idToFetch}'.`);
      }
      setPredictions(preds);
      const firstPred = preds[0];
      setSelectedPrediction(firstPred);
      
      const pdbText = await fetchPdbContent(firstPred.pdbUrl);
      setPdbContent(pdbText);
      const parsed = parsePDB(pdbText);
      setParsedPDB(parsed);
      setAdvancedStats(calculateAdvancedStats(parsed.atoms));

      // Fetch DeepMind AlphaFold PAE Matrix if available
      if (firstPred.paeDocUrl) {
        fetchAlphaFoldPAE(firstPred.paeDocUrl).then(data => {
          setPaeData(data);
        }).catch(() => setPaeData(null));
      } else {
        setPaeData(null);
      }

      // Fetch UniProt Details for Variants
      try {
        const upDetails = await fetchUniProtDetails(idToFetch);
        setUniprotDetails(upDetails);
      } catch (e) {
        console.warn("UniProt details unavailable", e);
        setUniprotDetails(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve protein coordinates.");
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = async (index: number) => {
    const pred = predictions[index];
    setSelectedPrediction(pred);
    setLoading(true);
    try {
      const pdbText = await fetchPdbContent(pred.pdbUrl);
      setPdbContent(pdbText);
      const parsed = parsePDB(pdbText);
      setParsedPDB(parsed);
      setAdvancedStats(calculateAdvancedStats(parsed.atoms));

      if (pred.paeDocUrl) {
        fetchAlphaFoldPAE(pred.paeDocUrl).then(data => {
          setPaeData(data);
        }).catch(() => setPaeData(null));
      } else {
        setPaeData(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUniProtSearch = async () => {
    if (!uniProtQuery.trim()) return;
    setUniProtLoading(true);
    try {
      const data = await searchUniProt(uniProtQuery);
      setUniProtResults(data.results || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setUniProtLoading(false);
    }
  };

  const handleSelectPreset = (id: string) => {
    setAccession(id);
    handleAnalyze(id);
    setDrawerOpen(false);
  };

  const handleDownloadPdb = () => {
    if (!pdbContent) return;
    const blob = new Blob([pdbContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedPrediction?.entryId || 'structure'}.pdb`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentResidueCount = parsedPDB ? new Set(parsedPDB.atoms.map(a => a.resSeq)).size : 0;

  return (
    <div className="flex h-screen w-screen bg-[#0d1117] text-neutral-200 font-sans overflow-hidden select-none">
      
      {/* Target Library Drawer (Collapsible) */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#161b22] border-r border-neutral-800 flex flex-col shrink-0 transition-transform duration-200 ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-2xl`}
      >
        {/* Drawer Header */}
        <div className="h-11 px-4 flex items-center justify-between border-b border-neutral-800 bg-[#12161c] shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <h2 className="font-semibold text-xs text-white">Target Library & Reference Models</h2>
          </div>
          <button 
            onClick={() => setDrawerOpen(false)} 
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
          {/* Curated Reference Proteins */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block px-1">
              Curated Reference Structures
            </span>
            <div className="space-y-1">
              {curatedTargets.map(target => {
                const isSelected = (selectedPrediction?.uniprotAccession || accession) === target.id;
                return (
                  <button
                    key={target.id}
                    onClick={() => handleSelectPreset(target.id)}
                    className={`w-full text-left p-2.5 rounded border transition-colors flex flex-col gap-0.5 ${
                      isSelected
                        ? 'bg-sky-950/40 border-sky-500/60 text-white'
                        : 'bg-[#12161c] border-neutral-800/80 text-neutral-300 hover:bg-neutral-800/40 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{target.symbol}</span>
                      <span className="font-mono text-[11px] text-sky-400">{target.id}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">{target.name}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-0.5">
                      <span>{target.organism}</span>
                      <span>·</span>
                      <span>{target.category}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* UniProt Database Search */}
          <div className="pt-2 border-t border-neutral-800 space-y-2">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block px-1">
              Query UniProtKB Archive
            </span>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={uniProtQuery}
                onChange={e => setUniProtQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUniProtSearch()}
                placeholder="Query (e.g. insulin, TP53, kinase)..."
                className="flex-1 bg-[#12161c] border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-200 placeholder-neutral-500 font-mono outline-none focus:border-sky-500"
              />
              <button
                onClick={handleUniProtSearch}
                disabled={uniProtLoading}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded text-xs transition-colors shrink-0 disabled:opacity-50"
              >
                {uniProtLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
              </button>
            </div>

            {uniProtResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pt-1">
                {uniProtResults.map(r => (
                  <div
                    key={r.primaryAccession}
                    onClick={() => handleSelectPreset(r.primaryAccession)}
                    className="p-2 bg-[#12161c] rounded border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sky-400 font-mono font-semibold text-xs">{r.primaryAccession}</span>
                      <span className="text-[10px] text-neutral-500">{r.organism?.scientificName}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {r.proteinDescription?.recommendedName?.fullName?.value || 'Protein entity'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-neutral-800 bg-[#12161c] flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
          <button 
            onClick={() => { setShowDocs(true); setDrawerOpen(false); }}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Methodology Documentation</span>
          </button>
          <span className="font-mono text-neutral-500">v4.2</span>
        </div>
      </aside>

      {/* Main Workstation Root */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117] overflow-hidden relative">
        
        {/* Top Unified Command Ribbon (Height: 44px) */}
        <header className="h-11 bg-[#161b22] border-b border-neutral-800 px-3 flex items-center justify-between gap-3 shrink-0 z-30">
          
          {/* Left Zone: Brand Mark & Protein Metadata */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setDrawerOpen(true)}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded text-xs flex items-center gap-1.5 transition-colors"
              title="Open Target Library"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Targets</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-white tracking-tight flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5 text-sky-400" />
                <span>BioStructure Pro</span>
              </span>
              <span className="text-neutral-600 hidden md:inline">|</span>
              
              {/* Unboxed Protein Metadata */}
              <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400">
                <span className="font-mono font-semibold text-white">{selectedPrediction?.uniprotAccession || accession}</span>
                <span>·</span>
                <span className="text-neutral-300 truncate max-w-[180px]">
                  {selectedPrediction?.gene || selectedPrediction?.uniprotDescription || 'Tumor protein p53'}
                </span>
                <span>·</span>
                <span className="font-mono tabular-nums text-neutral-400">{currentResidueCount} aa</span>
                <span>·</span>
                <span className="text-neutral-500">{selectedPrediction?.organismScientificName || 'Homo sapiens'}</span>
              </div>
            </div>
          </div>

          {/* Center Zone: Quick UniProt Search & Presets */}
          <div className="flex items-center gap-2 max-w-sm flex-1 mx-2">
            <div className="relative flex items-center w-full bg-[#0d1117] rounded border border-neutral-800 focus-within:border-sky-500 px-2.5 py-1">
              <Search className="w-3.5 h-3.5 text-neutral-500 mr-1.5 shrink-0" />
              <input 
                type="text"
                placeholder="UniProt ID (e.g. P04637, P0DTC2)..."
                value={accession}
                onChange={e => setAccession(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                className="w-full bg-transparent text-xs text-neutral-200 placeholder-neutral-500 outline-none font-mono"
              />
              {accession && (
                <button 
                  onClick={() => setAccession("")}
                  className="p-0.5 text-neutral-500 hover:text-neutral-300 rounded shrink-0 mr-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => handleAnalyze()}
                disabled={loading}
                className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-medium rounded transition-colors shrink-0 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Load'}
              </button>
            </div>
          </div>

          {/* Right Zone: Viewport Engine, Layout Switcher & Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Engine Selector */}
            <div className="hidden sm:flex items-center bg-[#0d1117] border border-neutral-800 rounded p-0.5 text-xs font-mono">
              <button
                onClick={() => setRendererEngine('3dmol')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  rendererEngine === '3dmol' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Use 3Dmol.js WebGL Shader Pipeline"
              >
                3Dmol
              </button>
              <button
                onClick={() => setRendererEngine('ngl')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  rendererEngine === 'ngl' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Use NGL WebGL Scene Graph Engine"
              >
                NGL
              </button>
            </div>

            {/* Layout Mode Segmented Switcher (Desktop) */}
            <div className="hidden lg:flex items-center bg-[#0d1117] border border-neutral-800 rounded p-0.5 text-xs font-sans">
              <button
                onClick={() => setLayoutMode('split')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  layoutMode === 'split' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Side-by-side Dual Workstation View"
              >
                <Columns className="w-3 h-3 text-sky-400" />
                <span>Split</span>
              </button>
              <button
                onClick={() => setLayoutMode('viewport')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  layoutMode === 'viewport' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Maximize 3D Molecular Viewport"
              >
                <Box className="w-3 h-3 text-emerald-400" />
                <span>Stage</span>
              </button>
              <button
                onClick={() => setLayoutMode('inspector')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  layoutMode === 'inspector' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Maximize Scientific Data Inspector"
              >
                <Layout className="w-3 h-3 text-indigo-400" />
                <span>Inspector</span>
              </button>
            </div>

            <div className="w-px h-3.5 bg-neutral-800 mx-0.5 hidden sm:block"></div>

            {/* Snapshot PNG */}
            <button 
              onClick={() => viewerRef.current?.downloadScreenshot()}
              disabled={!parsedPDB}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-40"
              title="Export Publication Snapshot (PNG)"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {/* Download PDB */}
            <button 
              onClick={handleDownloadPdb}
              disabled={!parsedPDB}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-40"
              title="Download Atomic PDB File"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Docs Modal */}
            <button 
              onClick={() => setShowDocs(true)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
              title="Methodology Guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Mode */}
            <button 
              onClick={() => setIsFullScreen(true)}
              disabled={!parsedPDB}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-40"
              title="Fullscreen Zen Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Error Notification Banner if any */}
        {error && (
          <div className="bg-rose-950/80 text-rose-300 px-4 py-2 text-xs flex items-center justify-between border-b border-rose-800/60 shrink-0">
            <span>{error}</span>
            <button onClick={() => setError("")} className="p-1 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Workstation Body: Split or Toggleable */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
          
          {/* LEFT / MAIN PANE: 3D MOLECULAR VIEWPORT */}
          <div 
            className={`relative bg-black flex flex-col min-h-0 ${
              layoutMode === 'split' 
                ? 'w-full lg:w-[54%] h-[45vh] lg:h-full border-b lg:border-b-0 lg:border-r border-neutral-800 shrink-0' 
                : layoutMode === 'viewport' 
                  ? 'w-full h-full' 
                  : 'hidden'
            }`}
          >
            {/* WebGL Canvas */}
            <div className="flex-1 w-full h-full relative overflow-hidden">
              {rendererEngine === '3dmol' ? (
                <Viewer3D 
                  ref={viewerRef}
                  pdbContent={pdbContent}
                  colorScheme={selectedColorScheme}
                  representation={representationType}
                  showSideChains={showSideChains}
                  showSurface={showSurface}
                  spin={spin}
                  colorByPlddt={colorByPlddt}
                  plddtThreshold={plddtThreshold}
                  customColors={customColors}
                  conservationScores={advancedStats?.conservationScores}
                />
              ) : (
                <NGLViewer
                  ref={viewerRef}
                  pdbContent={pdbContent}
                  colorScheme={selectedColorScheme}
                  representation={representationType}
                  showSideChains={showSideChains}
                  showSurface={showSurface}
                  spin={spin}
                  colorByPlddt={colorByPlddt}
                  plddtThreshold={plddtThreshold}
                  conservationScores={advancedStats?.conservationScores}
                />
              )}

              {/* Viewport Floating HUD Control Strip (Docked Bottom Center) */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-[#161b22]/95 backdrop-blur-md rounded border border-neutral-800 text-xs shadow-lg">
                
                {/* Reset Camera */}
                <button
                  onClick={() => viewerRef.current?.resetView()}
                  className="px-2 py-1 rounded text-[11px] font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1"
                  title="Reset Camera Center"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Center</span>
                </button>

                <div className="w-px h-3.5 bg-neutral-800 mx-0.5"></div>

                {/* Representation Style */}
                <div className="flex items-center bg-[#0d1117] rounded border border-neutral-800 p-0.5 text-[11px]">
                  {(['cartoon', 'stick', 'sphere', 'line'] as RepresentationType[]).map(rep => (
                    <button
                      key={rep}
                      onClick={() => setRepresentationType(rep)}
                      className={`px-1.5 py-0.5 rounded capitalize transition-colors ${
                        representationType === rep ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {rep}
                    </button>
                  ))}
                </div>

                <div className="w-px h-3.5 bg-neutral-800 mx-0.5"></div>

                {/* Color Scheme Dropdown */}
                <select
                  value={selectedColorScheme.label}
                  onChange={e => setSelectedColorScheme(colorSchemes.find(s => s.label === e.target.value) || colorSchemes[0])}
                  className="bg-[#0d1117] border border-neutral-800 rounded px-2 py-0.5 text-[11px] text-neutral-200 outline-none focus:border-sky-500 cursor-pointer"
                  title="Select Color Palette"
                >
                  {colorSchemes.map(s => (
                    <option key={s.label} value={s.label} className="bg-[#161b22] text-white">
                      {s.label}
                    </option>
                  ))}
                </select>

                <div className="w-px h-3.5 bg-neutral-800 mx-0.5"></div>

                {/* Surface Toggle */}
                <button
                  onClick={() => setShowSurface(!showSurface)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    showSurface ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  title="Toggle Solvent Surface"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Surface</span>
                </button>

                {/* Sidechains Toggle */}
                <button
                  onClick={() => setShowSideChains(!showSideChains)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    showSideChains ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-500/40' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  title="Toggle Amino Acid Sidechains"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sidechains</span>
                </button>

                {/* Spin Rotation */}
                <button
                  onClick={() => setSpin(!spin)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    spin ? 'bg-sky-900/60 text-sky-300 border border-sky-500/40' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  title="Auto-rotate Molecule"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${spin ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Spin</span>
                </button>

                {/* Visual Settings Drawer */}
                <button
                  onClick={() => setShowSettingsCard(!showSettingsCard)}
                  className={`p-1 rounded transition-colors ${
                    showSettingsCard ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  title="Confidence Thresholding & Shaders"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Visual Tuning Popover */}
              {showSettingsCard && (
                <div className="absolute top-3 right-3 z-20 w-72 bg-[#161b22]/95 backdrop-blur-md p-3.5 rounded border border-neutral-800 shadow-xl text-xs space-y-3 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-sky-400" />
                      <span>Shading & Confidence Threshold</span>
                    </span>
                    <button 
                      onClick={() => setShowSettingsCard(false)}
                      className="p-0.5 text-neutral-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* pLDDT Ghosting Toggle */}
                  <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-neutral-300">Ghost Low-Confidence Regions</span>
                      <input 
                        type="checkbox" 
                        checked={colorByPlddt} 
                        onChange={e => setColorByPlddt(e.target.checked)}
                        className="rounded bg-neutral-800 border-neutral-700 text-sky-600 focus:ring-0 cursor-pointer"
                      />
                    </label>

                    {colorByPlddt && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                          <span>Threshold Cutoff:</span>
                          <span className="text-sky-400 font-semibold">{plddtThreshold} pLDDT</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" 
                          value={plddtThreshold} 
                          onChange={e => setPlddtThreshold(parseInt(e.target.value))}
                          className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-sky-500" 
                        />
                        <span className="text-[10px] text-neutral-500 block leading-tight">
                          Residues below this score are rendered semi-transparent silver.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Confidence Scale Key (Bottom Left) */}
              {selectedColorScheme.label === "Confidence (pLDDT)" && (
                <div className="absolute bottom-3 left-3 z-10 bg-[#161b22]/90 backdrop-blur-md px-2.5 py-1.5 rounded border border-neutral-800 text-[10px] font-mono shadow-md">
                  <div className="text-[9px] font-sans font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                    Confidence (pLDDT)
                  </div>
                  <div className="flex items-center gap-2.5">
                    {[
                      { label: '>90', color: 'bg-[#0053D6]' },
                      { label: '70-90', color: 'bg-[#65CBF3]' },
                      { label: '50-70', color: 'bg-[#FFDB13]' },
                      { label: '<50', color: 'bg-[#FF7D45]' }
                    ].map(tier => (
                      <div key={tier.label} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${tier.color} shrink-0`}></span>
                        <span className="text-neutral-300">{tier.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs z-30 flex items-center justify-center">
                  <div className="bg-[#161b22] px-4 py-3 rounded border border-neutral-800 shadow-xl flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                    <span className="text-xs text-neutral-200 font-mono">Fetching AlphaFold Coordinates...</span>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!pdbContent && !loading && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="p-6 bg-[#161b22] border border-neutral-800 rounded max-w-sm text-center space-y-3">
                    <Dna className="w-8 h-8 text-sky-400 mx-auto" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">No Molecular Target Active</h3>
                      <p className="text-xs text-neutral-400 mt-1">Select a benchmark structure or enter a UniProt accession.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1 pt-1">
                      {curatedTargets.slice(0, 4).map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleSelectPreset(t.id)}
                          className="px-2 py-1 bg-[#12161c] hover:bg-neutral-800 border border-neutral-800 rounded text-[11px] font-mono text-neutral-300 transition-colors"
                        >
                          {t.symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: SCIENTIFIC DATA & METRICS INSPECTOR */}
          <div 
            className={`min-h-0 flex flex-col bg-[#12161c] ${
              layoutMode === 'split' 
                ? 'w-full lg:w-[46%] h-[55vh] lg:h-full' 
                : layoutMode === 'inspector' 
                  ? 'w-full h-full' 
                  : 'hidden'
            }`}
          >
            {parsedPDB ? (
              <InfoPanel 
                parsedPDB={parsedPDB} 
                predictionInfo={selectedPrediction} 
                uniprotData={uniprotDetails} 
                paeData={paeData}
                onSetColorScheme={label => {
                  const scheme = colorSchemes.find(s => s.label === label);
                  if (scheme) setSelectedColorScheme(scheme);
                }}
                onLoadBenchmark={id => {
                  setAccession(id);
                  handleAnalyze(id);
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-neutral-500 font-mono">
                Awaiting structural data stream...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL SCREEN IMMERSIVE WORKSTATION MODAL */}
      {isFullScreen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-100">
          <header className="h-10 bg-[#161b22] border-b border-neutral-800 px-4 flex items-center justify-between shrink-0 text-xs">
            <div className="flex items-center gap-2">
              <Dna className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-white">
                {selectedPrediction?.entryId || 'Model View'}
              </span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-400 font-mono">{currentResidueCount} residues</span>
            </div>
            <button
              onClick={() => setIsFullScreen(false)}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors flex items-center gap-1"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
            </button>
          </header>

          <div className="flex-1 relative w-full h-full">
            {rendererEngine === '3dmol' ? (
              <Viewer3D 
                pdbContent={pdbContent}
                colorScheme={selectedColorScheme}
                representation={representationType}
                showSideChains={showSideChains}
                showSurface={showSurface}
                spin={spin}
                colorByPlddt={colorByPlddt}
                plddtThreshold={plddtThreshold}
                customColors={customColors}
                conservationScores={advancedStats?.conservationScores}
              />
            ) : (
              <NGLViewer
                pdbContent={pdbContent}
                colorScheme={selectedColorScheme}
                representation={representationType}
                showSideChains={showSideChains}
                showSurface={showSurface}
                spin={spin}
                colorByPlddt={colorByPlddt}
                plddtThreshold={plddtThreshold}
                conservationScores={advancedStats?.conservationScores}
              />
            )}
          </div>
        </div>
      )}

      {/* DOCUMENTATION MODAL */}
      {showDocs && <DocumentationModal onClose={() => setShowDocs(false)} />}
    </div>
  );
}
