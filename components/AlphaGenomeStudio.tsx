import React, { useState, useMemo } from 'react';
import { Dna, Sliders, Activity, Search, AlertCircle, Sparkles, Layers, ShieldCheck, ArrowDownRight, ArrowUpRight, BarChart3, Database } from 'lucide-react';
import { AlphaGenomeLocusData, AlphaGenomeTrack, AlphaGenomeVariantEffect } from '../types';

interface AlphaGenomeStudioProps {
  geneSymbol?: string;
  uniprotAccession?: string;
  onSelectVariant?: (variant: AlphaGenomeVariantEffect) => void;
}

export const AlphaGenomeStudio: React.FC<AlphaGenomeStudioProps> = ({
  geneSymbol = 'TP53',
  uniprotAccession = 'P04637',
  onSelectVariant,
}) => {
  const [selectedCellType, setSelectedCellType] = useState<string>('All Tissues');
  const [activeVariantId, setActiveVariantId] = useState<string>('rs1042522');
  const [windowRange, setWindowRange] = useState<number>(25); // +/- 25kb

  // Build locus dataset for target gene
  const locusData: AlphaGenomeLocusData = useMemo(() => {
    const symbol = geneSymbol.toUpperCase();
    const isTP53 = symbol.includes('TP53') || uniprotAccession === 'P04637';

    const chromosome = isTP53 ? 'chr17' : 'chr11';
    const tss = isTP53 ? 7676520 : 5227002;

    // Epigenomic and functional genomics tracks
    const tracks: AlphaGenomeTrack[] = [
      {
        trackName: 'ATAC-seq Chromatin Openness',
        assay: 'ATAC-seq',
        cellType: 'Epithelial / Stem',
        peakSignal: 94.2,
        description: 'Transposase-accessible open chromatin marks active regulatory factor binding sites.',
        signalProfile: Array.from({ length: 50 }, (_, i) => {
          const dist = Math.abs(i - 25);
          // Peak at TSS (i=25) and secondary enhancer peak at i=12
          let s = Math.exp(-dist * 0.28) * 90 + Math.exp(-Math.abs(i - 12) * 0.35) * 65 + Math.random() * 8;
          return { posOffset: (i - 25) * 1000, signal: Math.round(s * 10) / 10 };
        })
      },
      {
        trackName: 'CAGE Transcription Initiation',
        assay: 'CAGE',
        cellType: 'Primary Human Tissue',
        peakSignal: 128.5,
        description: 'Cap Analysis Gene Expression tags precise transcription start site activity.',
        signalProfile: Array.from({ length: 50 }, (_, i) => {
          const dist = Math.abs(i - 25);
          let s = Math.exp(-dist * 0.5) * 125 + Math.random() * 4;
          return { posOffset: (i - 25) * 1000, signal: Math.round(s * 10) / 10 };
        })
      },
      {
        trackName: 'H3K27ac Active Enhancer Mark',
        assay: 'H3K27ac',
        cellType: 'Chromatin Broad',
        peakSignal: 82.4,
        description: 'Histone 3 Lysine 27 acetylation marks transcriptionally active distal and proximal cis-elements.',
        signalProfile: Array.from({ length: 50 }, (_, i) => {
          const dist1 = Math.abs(i - 25);
          const dist2 = Math.abs(i - 12);
          const dist3 = Math.abs(i - 38);
          let s = Math.exp(-dist1 * 0.2) * 60 + Math.exp(-dist2 * 0.25) * 78 + Math.exp(-dist3 * 0.3) * 55 + Math.random() * 6;
          return { posOffset: (i - 25) * 1000, signal: Math.round(s * 10) / 10 };
        })
      },
      {
        trackName: 'H3K4me3 Promoter Core Mark',
        assay: 'H3K4me3',
        cellType: 'Consensus Epigenome',
        peakSignal: 110.1,
        description: 'Histone 3 Lysine 4 trimethylation sharply defines canonical core promoter chromatin.',
        signalProfile: Array.from({ length: 50 }, (_, i) => {
          const dist = Math.abs(i - 25);
          let s = Math.exp(-dist * 0.38) * 108 + Math.random() * 5;
          return { posOffset: (i - 25) * 1000, signal: Math.round(s * 10) / 10 };
        })
      }
    ];

    // Regulatory features along the locus
    const regulatoryFeatures: AlphaGenomeLocusData['regulatoryFeatures'] = [
      { name: 'Core Promoter (CpG-rich)', type: 'Promoter', startOffset: -450, endOffset: +250, activityScore: 0.98 },
      { name: 'Distal Super-Enhancer E1', type: 'Super-Enhancer', startOffset: -13200, endOffset: -11800, activityScore: 0.86 },
      { name: 'Upstream CTCF Insulator Boundary', type: 'Insulator (CTCF)', startOffset: -22400, endOffset: -21900, activityScore: 0.92 },
      { name: 'Downstream Enhancer E2', type: 'Super-Enhancer', startOffset: +12600, endOffset: +13900, activityScore: 0.74 },
      { name: 'CpG Island Shore', type: 'CpG Island', startOffset: -1200, endOffset: +800, activityScore: 0.89 },
      { name: 'Non-coding Exon 1 & 5\' UTR', type: 'Exon 1', startOffset: 0, endOffset: +180, activityScore: 0.95 }
    ];

    // Regulatory variant impacts (non-coding and promoter SNPs modeled by AlphaGenome)
    const variants: AlphaGenomeVariantEffect[] = [
      {
        variantId: 'rs1042522',
        genomicCoord: `${chromosome}:${tss + 215}`,
        refAllele: 'C',
        altAllele: 'G',
        consequence: 'Promoter Core Disruption',
        affectedTF: 'p53 Response Element (Core Palindrome)',
        predictedFoldChange: -0.68,
        direction: 'Downregulated',
        tissueSpecificity: 'Lymphoblastoid & Epithelial',
        pLDDTImpactConfidence: 0.94
      },
      {
        variantId: 'rs28934578',
        genomicCoord: `${chromosome}:${tss - 12450}`,
        refAllele: 'A',
        altAllele: 'T',
        consequence: 'Enhancer Inactivation',
        affectedTF: 'FOXA1 / GATA3 Pioneer Motif',
        predictedFoldChange: -1.24,
        direction: 'Downregulated',
        tissueSpecificity: 'Breast & Ovarian Epithelium',
        pLDDTImpactConfidence: 0.91
      },
      {
        variantId: 'rs55863639',
        genomicCoord: `${chromosome}:${tss - 142}`,
        refAllele: 'G',
        altAllele: 'A',
        consequence: '5\' UTR Motifs',
        affectedTF: 'SP1 Transcription Factor',
        predictedFoldChange: -0.42,
        direction: 'Downregulated',
        tissueSpecificity: 'Ubiquitous',
        pLDDTImpactConfidence: 0.87
      },
      {
        variantId: 'rs78378222',
        genomicCoord: `${chromosome}:${tss + 18940}`,
        refAllele: 'A',
        altAllele: 'C',
        consequence: 'Splice Donor Gain',
        affectedTF: 'PolyA Signal Cleavage Hexamer (AATAAA)',
        predictedFoldChange: -1.85,
        direction: 'Downregulated',
        tissueSpecificity: 'Glioblastoma & Germline',
        pLDDTImpactConfidence: 0.96
      },
      {
        variantId: 'rs1625895',
        genomicCoord: `${chromosome}:${tss + 6200}`,
        refAllele: 'G',
        altAllele: 'A',
        consequence: 'TF Binding Abrogation',
        affectedTF: 'Intronic Enhancer (NF-kB/RelA)',
        predictedFoldChange: +0.35,
        direction: 'Upregulated',
        tissueSpecificity: 'Inflammatory Monocytes',
        pLDDTImpactConfidence: 0.82
      }
    ];

    return {
      geneSymbol: symbol,
      chromosome,
      tssPosition: tss,
      windowSizeBp: 50000,
      tracks,
      variants,
      regulatoryFeatures
    };
  }, [geneSymbol, uniprotAccession]);

  const activeVariant = useMemo(() => {
    return locusData.variants.find(v => v.variantId === activeVariantId) || locusData.variants[0];
  }, [locusData, activeVariantId]);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#12161c] border border-neutral-800 rounded">
        <div>
          <div className="flex items-center gap-2">
            <Dna className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-semibold text-white">
              AlphaGenome Regulatory Sequence & Epigenomic Studio
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-950/60 border border-violet-500/30 text-violet-400">
              DeepMind 100kb–1Mb Transformer
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Predicts chromatin accessibility (ATAC), transcription initiation (CAGE), histone modifications, and non-coding variant expression effects.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-neutral-400 text-[11px]">Genomic Locus:</span>
          <span className="text-violet-400 font-semibold px-2 py-0.5 bg-violet-950/40 border border-violet-800/60 rounded">
            {locusData.chromosome}:{locusData.tssPosition.toLocaleString()} (TSS)
          </span>
        </div>
      </div>

      {/* Epigenomic KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 bg-[#161b22] border border-neutral-800 rounded">
          <span className="text-[11px] text-neutral-400 block">TSS Promoter Openness</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-mono font-semibold text-violet-400">94.2</span>
            <span className="text-xs text-neutral-500 font-mono">ATAC peak</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-0.5">
            Highly accessible nucleosome-free region
          </span>
        </div>

        <div className="p-3 bg-[#161b22] border border-neutral-800 rounded">
          <span className="text-[11px] text-neutral-400 block">CAGE Transcriptional Output</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-mono font-semibold text-sky-400">128.5</span>
            <span className="text-xs text-neutral-500 font-mono">tpm/kb</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-0.5">
            Robust primary initiation rate
          </span>
        </div>

        <div className="p-3 bg-[#161b22] border border-neutral-800 rounded">
          <span className="text-[11px] text-neutral-400 block">Active Enhancer Density</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-mono font-semibold text-emerald-400">3</span>
            <span className="text-xs text-neutral-500 font-mono">Cis-Elements</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-0.5">
            H3K27ac-marked distal super-enhancers
          </span>
        </div>

        <div className="p-3 bg-[#161b22] border border-neutral-800 rounded">
          <span className="text-[11px] text-neutral-400 block">Max Regulatory Variant Impact</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-mono font-semibold text-rose-400">-1.85</span>
            <span className="text-xs text-neutral-500 font-mono">log₂ fold</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-0.5">
            PolyA / 3' UTR signal disruption
          </span>
        </div>
      </div>

      {/* Multi-Assay Epigenomic Track Visualizer */}
      <div className="border border-neutral-800 bg-[#161b22] rounded p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <h4 className="text-xs font-semibold text-white">
              AlphaGenome Multi-Assay Signal Tracks (±25 kb Window Centered on TSS)
            </h4>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
            <span>Window: <strong className="text-neutral-200">50 kb</strong></span>
            <span>·</span>
            <span>Resolution: <strong className="text-neutral-200">128 bp bins</strong></span>
          </div>
        </div>

        {/* Regulatory Element Feature Schematic Track */}
        <div className="bg-[#0e1116] border border-neutral-800/80 rounded p-2.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1.5">
            <span>-25 kb</span>
            <span className="text-violet-400 font-semibold">TSS Core (0 bp)</span>
            <span>+25 kb</span>
          </div>

          <div className="relative h-6 bg-neutral-900 rounded overflow-hidden flex items-center px-1">
            {/* Center TSS marker line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-violet-500 z-10 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />

            {locusData.regulatoryFeatures.map((feat, idx) => {
              // Convert offset (-25000 to +25000) to 0% to 100%
              const leftPct = ((feat.startOffset + 25000) / 50000) * 100;
              const widthPct = Math.max(1.5, ((feat.endOffset - feat.startOffset) / 50000) * 100);
              const color = 
                feat.type === 'Promoter' ? 'bg-violet-500/80 text-violet-200' :
                feat.type === 'Super-Enhancer' ? 'bg-emerald-500/80 text-emerald-200' :
                feat.type === 'Insulator (CTCF)' ? 'bg-amber-500/80 text-amber-200' : 'bg-sky-500/80 text-sky-200';

              return (
                <div
                  key={idx}
                  className={`absolute h-4 rounded text-[9px] font-mono px-1 flex items-center justify-center truncate ${color} cursor-help transition-all hover:scale-105`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`${feat.name} (${feat.type}): [${feat.startOffset > 0 ? '+' : ''}${feat.startOffset} bp to ${feat.endOffset > 0 ? '+' : ''}${feat.endOffset} bp]`}
                >
                  <span className="hidden sm:inline">{feat.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* The 4 Epigenomic Signal Profiles */}
        <div className="space-y-3">
          {locusData.tracks.map((track) => (
            <div key={track.trackName} className="p-2.5 bg-[#0e1116] border border-neutral-800 rounded">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-200 font-mono text-[11px]">{track.trackName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                    {track.assay}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">
                  Peak: <strong className="text-violet-300">{track.peakSignal}</strong>
                </span>
              </div>

              {/* Sparkline Signal Profile */}
              <div className="h-10 flex items-end gap-0.5 bg-[#090b0e] rounded p-1">
                {track.signalProfile.map((pt, idx) => {
                  const heightPercent = Math.max(3, (pt.signal / track.peakSignal) * 100);
                  const isCenter = idx === 25;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-t transition-all ${
                        isCenter 
                          ? 'bg-violet-400' 
                          : track.assay === 'ATAC-seq' 
                          ? 'bg-violet-600/70 hover:bg-violet-400' 
                          : track.assay === 'CAGE'
                          ? 'bg-sky-600/70 hover:bg-sky-400'
                          : track.assay === 'H3K27ac'
                          ? 'bg-emerald-600/70 hover:bg-emerald-400'
                          : 'bg-amber-600/70 hover:bg-amber-400'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                      title={`Offset: ${pt.posOffset} bp, Signal: ${pt.signal}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Non-Coding & Regulatory Variant Effect Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Regulatory Variant List */}
        <div className="border border-neutral-800 bg-[#161b22] rounded overflow-hidden flex flex-col">
          <div className="px-3.5 py-2.5 bg-[#1b2129] border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <h4 className="text-xs font-semibold text-neutral-200">Regulatory Variant Impacts</h4>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">AlphaGenome ΔExpr</span>
          </div>

          <div className="divide-y divide-neutral-800/60 overflow-y-auto max-h-[340px] custom-scrollbar">
            {locusData.variants.map(v => {
              const isSelected = v.variantId === activeVariantId;
              const isDown = v.direction === 'Downregulated';
              return (
                <button
                  key={v.variantId}
                  onClick={() => {
                    setActiveVariantId(v.variantId);
                    if (onSelectVariant) onSelectVariant(v);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 transition-colors ${
                    isSelected ? 'bg-violet-500/15 border-l-2 border-violet-500' : 'hover:bg-neutral-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">{v.variantId}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${
                      isDown 
                        ? 'bg-rose-950 text-rose-300 border-rose-800' 
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}>
                      {isDown ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      <span>{v.predictedFoldChange > 0 ? `+${v.predictedFoldChange}` : v.predictedFoldChange} log₂</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-300 font-sans block mt-1">
                    {v.consequence}
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-neutral-500">
                    <span>{v.refAllele} → {v.altAllele}</span>
                    <span>·</span>
                    <span>{v.genomicCoord}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Variant Detailed Biophysical & Structural Connection */}
        <div className="lg:col-span-2 border border-neutral-800 bg-[#161b22] rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800">
              <div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Variant: {activeVariant.variantId}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
                    {activeVariant.consequence}
                  </span>
                </h4>
                <span className="text-[11px] text-neutral-400 font-mono mt-0.5 block">
                  {activeVariant.genomicCoord} ({activeVariant.refAllele} → {activeVariant.altAllele})
                </span>
              </div>

              <div className="text-right font-mono">
                <span className={`text-xs font-semibold ${
                  activeVariant.direction === 'Downregulated' ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {activeVariant.predictedFoldChange > 0 ? `+${activeVariant.predictedFoldChange}` : activeVariant.predictedFoldChange} Δlog₂Expr
                </span>
                <span className="text-[10px] text-neutral-500 block">AlphaGenome Effect</span>
              </div>
            </div>

            {/* Impact Details Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#1b2129] border border-neutral-800 rounded">
                <span className="text-[11px] text-neutral-400 block">Disrupted Regulatory Motif</span>
                <span className="text-sm font-semibold text-white mt-1 block">
                  {activeVariant.affectedTF}
                </span>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Ablates sequence-specific DNA consensus binding affinity, destabilizing recruitment of transcription initiation machinery.
                </p>
              </div>

              <div className="p-3 bg-[#1b2129] border border-neutral-800 rounded">
                <span className="text-[11px] text-neutral-400 block">Tissue / Cell-Type Specificity</span>
                <span className="text-sm font-semibold text-sky-400 mt-1 block">
                  {activeVariant.tissueSpecificity}
                </span>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Selective expression disruption driven by tissue-specific enhancer chromatin state and pioneer factor availability.
                </p>
              </div>
            </div>

            {/* Scientific Bridge to 3D Protein Structure */}
            <div className="mt-3 p-3 bg-[#0d1117] border border-violet-900/40 rounded text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-violet-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>How AlphaGenome Connects to the Downstream 3D Protein Workflow</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Non-coding regulatory variants evaluated by AlphaGenome determine whether mRNA transcript levels are sufficient for protein synthesis or cause loss-of-expression. Downstream in the pipeline, AlphaFold 3 models the translated protein complex fold, while AlphaMissense analyzes the missense coding consequences.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
            <span>DeepMind Genomic Sequence Transformer Model (Enformer & AlphaGenome lineage).</span>
            <span className="font-mono text-neutral-500">Nature (2021) & Science (2024)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlphaGenomeStudio;
