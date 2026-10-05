
import React, { useMemo, useState } from 'react';
import { ParsedPDB, UniProtResult, AdvancedStats } from '../types';
import { parseSSRanges, hydrophobicityScale, getSequenceHydrophobicity } from '../services/pdbService';

interface SequenceAnnotationPanelProps {
  parsedPDB: ParsedPDB;
  advancedStats: AdvancedStats;
  uniprotData?: UniProtResult | null;
}

export const SequenceAnnotationPanel: React.FC<SequenceAnnotationPanelProps> = ({ parsedPDB, advancedStats, uniprotData }) => {
  const [hoveredResidue, setHoveredResidue] = useState<{ seq: number, info: string } | null>(null);

  // 1. Prepare Main Sequence Data
  const sequenceData = useMemo(() => {
    // Group atoms by residue to get unique residues
    const residues = new Map<number, { resName: string, chain: string }>();
    parsedPDB.atoms.filter(a => a.name === 'CA').forEach(a => {
        const seq = parseInt(a.resSeq);
        residues.set(seq, { resName: a.resName, chain: a.chainID });
    });
    
    // Sort and convert to array
    return Array.from(residues.entries()).sort((a, b) => a[0] - b[0]).map(([seq, data]) => ({
        seq,
        ...data
    }));
  }, [parsedPDB]);

  // 2. Prepare Metrics
  const ssRanges = useMemo(() => parseSSRanges(parsedPDB), [parsedPDB]);
  
  // Hydrophobicity calculated in parent (advancedStats) or helper? 
  // advancedStats has sasaProfile but not raw hydrophobicity profile passed directly. 
  // Let's recalculate it or use what's available. `getSequenceHydrophobicity` is fast.
  const hydroProfile = useMemo(() => getSequenceHydrophobicity(parsedPDB.atoms), [parsedPDB]);
  const hydroMap = new Map<number, number>(hydroProfile.map(h => [h.resSeq, h.val]));

  const disorderMap = new Map<number, number>((advancedStats?.flexibilityIndex || []).map(f => [f.resSeq, f.zScore]));
  const plddtMap = new Map<number, number>(); // We need pLDDT per residue. AdvancedStats gives avgPlddt.
  // Let's extract per-residue pLDDT from CA atoms
  parsedPDB.atoms.filter(a => a.name === 'CA').forEach(a => {
      plddtMap.set(parseInt(a.resSeq), a.tempFactor);
  });

  const conservationMap = new Map<number, number>((advancedStats?.conservationScores || []).map(c => [c.resSeq, c.score]));
  const buriedMap = new Map<number, number>((advancedStats?.sasaProfile || []).map(s => [s.resSeq, s.score])); // Score is 15 - neighbors (approx exposure)

  // 3. Render Constants
  const pxPerRes = 14;
  const trackHeight = 30;
  const labelWidth = 160;
  const totalWidth = sequenceData.length * pxPerRes;
  const rowGap = 8;

  // Helpers
  const aaMap: Record<string, string> = {
      ALA:'A', ARG:'R', ASN:'N', ASP:'D', CYS:'C', GLN:'Q', GLU:'E', GLY:'G', HIS:'H', 
      ILE:'I', LEU:'L', LYS:'K', MET:'M', PHE:'F', PRO:'P', SER:'S', THR:'T', TRP:'W', 
      TYR:'Y', VAL:'V'
  };

  const tracks = [
      { id: 'seq', label: `Chain ${sequenceData[0]?.chain || 'A'} Sequence`, height: 20 },
      { id: 'ss', label: 'Secondary Structure', height: 20 },
      { id: 'hydro', label: 'Hydropathy (Kyte-Doolittle)', height: 40 },
      { id: 'disorder', label: 'Disorder (pLDDT Inv)', height: 40 },
      { id: 'buried', label: 'Buried Residues', height: 20 },
      { id: 'conservation', label: 'Conservation', height: 40 },
      { id: 'variants', label: 'Genome Variants', height: 20 },
  ];

  return (
    <div className="glass-panel rounded-[2.5rem] border border-white/10 shadow-sm flex flex-col h-full bg-white/5 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-md flex justify-between items-center z-10 shrink-0">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                Sequence Annotation Tracks
            </h3>
            {hoveredResidue && (
                <div className="text-[10px] font-mono text-blue-400 font-bold animate-in fade-in">
                    RES {hoveredResidue.seq}: {hoveredResidue.info}
                </div>
            )}
        </div>

        {/* Scrollable Tracks */}
        <div className="flex-1 overflow-auto custom-scrollbar relative bg-black/40">
            <div style={{ minWidth: totalWidth + labelWidth + 40, padding: '20px' }}>
                
                {tracks.map((track) => (
                    <div key={track.id} className="flex mb-2 group">
                        {/* Label */}
                        <div style={{ width: labelWidth }} className="shrink-0 flex items-center justify-end pr-4 border-r border-white/10">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-right group-hover:text-blue-400 transition-colors">
                                {track.label}
                            </span>
                        </div>

                        {/* Track Content */}
                        <div style={{ width: totalWidth, height: track.height }} className="relative ml-4">
                            
                            {/* Sequence Track */}
                            {track.id === 'seq' && sequenceData.map((res, i) => (
                                <div 
                                    key={res.seq} 
                                    style={{ left: i * pxPerRes, width: pxPerRes }} 
                                    className="absolute top-0 bottom-0 flex items-center justify-center text-[9px] font-mono font-bold text-slate-400 hover:text-white hover:bg-white/10 cursor-crosshair transition-colors rounded"
                                    onMouseEnter={() => setHoveredResidue({ seq: res.seq, info: `${res.resName} (${aaMap[res.resName] || '?'})` })}
                                    onMouseLeave={() => setHoveredResidue(null)}
                                >
                                    {aaMap[res.resName] || '?'}
                                </div>
                            ))}

                            {/* Secondary Structure */}
                            {track.id === 'ss' && (
                                <>
                                    {ssRanges.helices.map((h, i) => {
                                        const startIndex = sequenceData.findIndex(s => s.seq === h.start);
                                        const endIndex = sequenceData.findIndex(s => s.seq === h.end);
                                        if (startIndex === -1) return null;
                                        const w = ((endIndex === -1 ? sequenceData.length : endIndex) - startIndex + 1) * pxPerRes;
                                        return (
                                            <div 
                                                key={`h-${i}`} 
                                                style={{ left: startIndex * pxPerRes, width: w - 2 }} 
                                                className="absolute top-1 bottom-1 bg-rose-500/80 rounded-sm shadow-[0_0_10px_rgba(244,63,94,0.4)] border border-rose-400/50"
                                                title={`Helix ${h.start}-${h.end}`}
                                            ></div>
                                        );
                                    })}
                                    {ssRanges.sheets.map((s, i) => {
                                        const startIndex = sequenceData.findIndex(sq => sq.seq === s.start);
                                        const endIndex = sequenceData.findIndex(sq => sq.seq === s.end);
                                        if (startIndex === -1) return null;
                                        const w = ((endIndex === -1 ? sequenceData.length : endIndex) - startIndex + 1) * pxPerRes;
                                        return (
                                            <div 
                                                key={`s-${i}`} 
                                                style={{ left: startIndex * pxPerRes, width: w - 2 }} 
                                                className="absolute top-1 bottom-1 bg-amber-500/80 rounded-sm shadow-[0_0_10px_rgba(245,158,11,0.4)] border border-amber-400/50"
                                                title={`Sheet ${s.start}-${s.end}`}
                                            ></div>
                                        );
                                    })}
                                </>
                            )}

                            {/* Hydrophobicity */}
                            {track.id === 'hydro' && (
                                <div className="absolute inset-0 flex items-center">
                                    <div className="absolute w-full h-px bg-white/10 top-1/2"></div>
                                    {sequenceData.map((res, i) => {
                                        const val = hydroMap.get(res.seq) || 0;
                                        const h = Math.min(20, Math.abs(val) * 5); // Scale
                                        const color = val > 0 ? 'bg-rose-500' : 'bg-blue-500';
                                        return (
                                            <div 
                                                key={res.seq}
                                                style={{ left: i * pxPerRes, width: pxPerRes - 1, height: h, top: val > 0 ? '50%' : undefined, bottom: val <= 0 ? '50%' : undefined }}
                                                className={`absolute ${color} opacity-80`}
                                                onMouseEnter={() => setHoveredResidue({ seq: res.seq, info: `Hydro: ${val.toFixed(2)}` })}
                                            ></div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Disorder (Inverted pLDDT) */}
                            {track.id === 'disorder' && (
                                <div className="absolute inset-0 flex items-end">
                                    {sequenceData.map((res, i) => {
                                        const plddt = plddtMap.get(res.seq) || 0;
                                        // Disorder implies low pLDDT. High bar = High Disorder = Low pLDDT.
                                        // pLDDT 100 -> 0 height. pLDDT 0 -> 100% height.
                                        const hPercent = Math.max(0, 100 - plddt);
                                        const color = plddt < 50 ? 'bg-purple-500' : plddt < 70 ? 'bg-purple-400/50' : 'bg-transparent';
                                        return (
                                            <div 
                                                key={res.seq}
                                                style={{ left: i * pxPerRes, width: pxPerRes, height: `${hPercent}%` }}
                                                className={`absolute bottom-0 ${color} transition-all`}
                                                onMouseEnter={() => setHoveredResidue({ seq: res.seq, info: `pLDDT: ${plddt.toFixed(1)}` })}
                                            ></div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Buried Residues */}
                            {track.id === 'buried' && sequenceData.map((res, i) => {
                                const exposure = buriedMap.get(res.seq) || 0; // 0 (exposed) to 15 (buried)
                                const isBuried = exposure > 10; // Threshold
                                if (!isBuried) return null;
                                return (
                                    <div 
                                        key={res.seq}
                                        style={{ left: i * pxPerRes, width: pxPerRes - 2 }}
                                        className="absolute top-1 bottom-1 bg-emerald-600 rounded-sm"
                                        onMouseEnter={() => setHoveredResidue({ seq: res.seq, info: `Buried (Pack Score: ${exposure})` })}
                                    ></div>
                                );
                            })}

                            {/* Conservation */}
                            {track.id === 'conservation' && (
                                <div className="absolute inset-0 flex items-end">
                                    {sequenceData.map((res, i) => {
                                        const score = conservationMap.get(res.seq) || 0;
                                        const hPercent = score * 100;
                                        return (
                                            <div 
                                                key={res.seq}
                                                style={{ left: i * pxPerRes, width: pxPerRes - 1, height: `${hPercent}%` }}
                                                className={`absolute bottom-0 bg-gradient-to-t from-transparent to-amber-500 opacity-80`}
                                                onMouseEnter={() => setHoveredResidue({ seq: res.seq, info: `Conserved: ${(score*100).toFixed(0)}%` })}
                                            ></div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Variants */}
                            {track.id === 'variants' && uniprotData?.features?.filter(f => f.type === 'VARIANT').map((v, idx) => {
                                const startSeq = parseInt(v.begin);
                                const index = sequenceData.findIndex(s => s.seq === startSeq);
                                if (index === -1) return null;
                                return (
                                    <div 
                                        key={idx}
                                        style={{ left: index * pxPerRes, width: pxPerRes }}
                                        className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-red-500 border border-black shadow-[0_0_5px_rgba(239,68,68,0.8)] cursor-help z-10"
                                        title={`${v.wildType} -> ${v.alternativeSequence}: ${v.description}`}
                                        onMouseEnter={() => setHoveredResidue({ seq: startSeq, info: `VAR: ${v.wildType}->${v.alternativeSequence}` })}
                                    ></div>
                                )
                            })}

                        </div>
                    </div>
                ))}
                
                {/* Vertical Cursor/Ruler Lines (every 10 res) */}
                <div className="absolute inset-0 pointer-events-none" style={{ left: labelWidth + 20 + 20 }}> {/* offset padding */}
                     {sequenceData.map((res, i) => {
                         if (res.seq % 10 === 0) return (
                             <div key={i} style={{ left: i * pxPerRes }} className="absolute top-0 bottom-0 w-px bg-white/5 flex flex-col justify-end pb-1">
                                 <span className="text-[7px] text-slate-600 font-mono -ml-2 mb-full">{res.seq}</span>
                             </div>
                         );
                         return null;
                     })}
                </div>

            </div>
        </div>
    </div>
  );
};
