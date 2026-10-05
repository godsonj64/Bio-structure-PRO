import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Layers, Sliders, Eye, Maximize2, AlertCircle, Info, Download, Sparkles } from 'lucide-react';
import { PAEMatrixData } from '../types';

interface PAEViewerProps {
  paeData: number[][] | null;
  sequenceLength: number;
  geneName?: string;
  onSelectResiduePair?: (res1: number, res2: number) => void;
}

export const PAEViewer: React.FC<PAEViewerProps> = ({
  paeData,
  sequenceLength,
  geneName,
  onSelectResiduePair
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; pae: number } | null>(null);
  const [selectedResidue, setSelectedResidue] = useState<number>(1);
  const [paeCutoff, setPaeCutoff] = useState<number>(31.75);
  const [showDomainBorders, setShowDomainBorders] = useState<boolean>(true);

  // Generate synthetic fallback PAE matrix if API hasn't loaded or doesn't provide one
  const matrix: number[][] = useMemo(() => {
    if (paeData && paeData.length > 0) return paeData;
    const n = Math.min(sequenceLength || 200, 300);
    const m: number[][] = [];
    for (let i = 0; i < n; i++) {
      m[i] = [];
      for (let j = 0; j < n; j++) {
        const d = Math.abs(i - j);
        // Realistic simulated PAE: low along diagonal and domain blocks, high at ends
        let val = Math.min(31.75, Math.pow(d, 0.65) * 1.5);
        if (i > 80 && i < 260 && j > 80 && j < 260) {
          // Stable structured domain core
          val = Math.min(val, 3 + Math.abs(i - j) * 0.08);
        }
        m[i][j] = Math.round(val * 10) / 10;
      }
    }
    return m;
  }, [paeData, sequenceLength]);

  const matrixSize = matrix.length;

  // Render 2D PAE Heatmap on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || matrixSize === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cellSize = width / matrixSize;

    // DeepMind PAE Color Palette:
    // Low PAE (0-5 A) -> Dark Blue/Teal (#0c2c84 to #225ea8)
    // Moderate PAE (5-15 A) -> Cyan/Green (#41b6c4 to #7fcdbb)
    // High PAE (15-25 A) -> Yellow/Orange (#c7e9b4 to #edf8b1)
    // Very High (>25 A) -> Light Off-White (#ffffd9)
    const getColor = (pae: number) => {
      if (pae > paeCutoff) return '#161b22'; // Filtered out
      if (pae <= 4) return '#08306b'; // Highly confident relative position
      if (pae <= 8) return '#2171b5';
      if (pae <= 12) return '#4292c6';
      if (pae <= 16) return '#6baed6';
      if (pae <= 20) return '#9ecae1';
      if (pae <= 24) return '#c6dbef';
      if (pae <= 28) return '#deebf7';
      return '#f7fbff';
    };

    // Draw cells
    for (let i = 0; i < matrixSize; i++) {
      for (let j = 0; j < matrixSize; j++) {
        const pae = matrix[i][j];
        ctx.fillStyle = getColor(pae);
        ctx.fillRect(j * cellSize, i * cellSize, Math.ceil(cellSize), Math.ceil(cellSize));
      }
    }

    // Highlight selected residue crosshair
    if (selectedResidue > 0 && selectedResidue <= matrixSize) {
      const idx = selectedResidue - 1;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, idx * cellSize, width, cellSize);
      ctx.strokeRect(idx * cellSize, 0, cellSize, height);
    }

    // Highlight hovered cell
    if (hoveredCell) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.strokeRect(hoveredCell.x * cellSize, hoveredCell.y * cellSize, cellSize * 2, cellSize * 2);
    }
  }, [matrix, matrixSize, paeCutoff, selectedResidue, hoveredCell]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || matrixSize === 0) return;
    const rect = canvas.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;

    const xIndex = Math.min(matrixSize - 1, Math.max(0, Math.floor(xRatio * matrixSize)));
    const yIndex = Math.min(matrixSize - 1, Math.max(0, Math.floor(yRatio * matrixSize)));

    const paeVal = matrix[yIndex]?.[xIndex] ?? 0;
    setHoveredCell({ x: xIndex, y: yIndex, pae: paeVal });
  };

  const handleCanvasClick = () => {
    if (hoveredCell) {
      setSelectedResidue(hoveredCell.y + 1);
      if (onSelectResiduePair) {
        onSelectResiduePair(hoveredCell.y + 1, hoveredCell.x + 1);
      }
    }
  };

  // 1D Cross section slice for selected residue
  const sliceData = useMemo(() => {
    const idx = Math.min(matrixSize - 1, Math.max(0, selectedResidue - 1));
    return matrix[idx] || [];
  }, [matrix, selectedResidue, matrixSize]);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-[#12161c] border border-neutral-800 rounded">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-white">
              Predicted Aligned Error (PAE) 2D Interactive Matrix
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-400">
              DeepMind AlphaFold DB v4/v6
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Measures positional error (Å) of residue <span className="text-neutral-200 font-mono">y</span> when true and predicted structures are aligned on residue <span className="text-neutral-200 font-mono">x</span>.
          </p>
        </div>

        {/* Threshold Slider */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-mono">
          <span className="text-neutral-400 text-[11px]">Filter Cutoff:</span>
          <input
            type="range"
            min="5"
            max="31.75"
            step="0.5"
            value={paeCutoff}
            onChange={e => setPaeCutoff(parseFloat(e.target.value))}
            className="w-24 h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-sky-500"
          />
          <span className="text-sky-400 font-semibold text-[11px] min-w-[40px] text-right">
            {paeCutoff.toFixed(1)} Å
          </span>
        </div>
      </div>

      {/* Main Grid: 2D Heatmap & 1D Slice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 2D Heatmap Viewport */}
        <div className="lg:col-span-2 border border-neutral-800 bg-[#161b22] rounded p-4 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 text-xs">
            <span className="text-neutral-400 font-mono text-[11px]">
              Aligned Residue (X-axis) vs Scored Residue (Y-axis) · {matrixSize}×{matrixSize}
            </span>
            {hoveredCell && (
              <span className="font-mono text-[11px] text-sky-400 font-semibold bg-[#12161c] px-2 py-0.5 rounded border border-neutral-800">
                Res {hoveredCell.y + 1} → Res {hoveredCell.x + 1}: {hoveredCell.pae.toFixed(1)} Å
              </span>
            )}
          </div>

          <div className="relative border border-neutral-800 rounded overflow-hidden bg-black aspect-square max-w-[420px] w-full cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={420}
              height={420}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredCell(null)}
              onClick={handleCanvasClick}
              className="w-full h-full block"
            />
          </div>

          {/* Color Scale Legend */}
          <div className="w-full mt-3 flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span className="text-sky-400 font-semibold">0 Å (High Confidence / Rigid)</span>
            <div className="h-2 flex-1 mx-3 rounded overflow-hidden flex">
              <span className="flex-1 bg-[#08306b]"></span>
              <span className="flex-1 bg-[#2171b5]"></span>
              <span className="flex-1 bg-[#4292c6]"></span>
              <span className="flex-1 bg-[#6baed6]"></span>
              <span className="flex-1 bg-[#9ecae1]"></span>
              <span className="flex-1 bg-[#c6dbef]"></span>
              <span className="flex-1 bg-[#deebf7]"></span>
              <span className="flex-1 bg-[#f7fbff]"></span>
            </div>
            <span className="text-neutral-500 font-semibold">&gt;30 Å (Mobile / Disordered)</span>
          </div>
        </div>

        {/* 1D Slice & Interpretation */}
        <div className="space-y-4">
          {/* Residue Slice Inspector */}
          <div className="border border-neutral-800 bg-[#161b22] rounded p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800 text-xs">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>1D Profile: Res #{selectedResidue}</span>
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max={matrixSize}
                  value={selectedResidue}
                  onChange={e => setSelectedResidue(Math.max(1, Math.min(matrixSize, parseInt(e.target.value) || 1)))}
                  className="w-14 bg-[#12161c] border border-neutral-800 rounded px-1.5 py-0.5 text-xs font-mono text-sky-400 text-center outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Sparkline Canvas for 1D Slice */}
            <div className="h-28 flex items-end gap-px bg-[#12161c] rounded p-1 border border-neutral-800/80">
              {sliceData.filter((_, idx) => idx % Math.ceil(matrixSize / 60) === 0).map((pae, idx) => {
                const heightPercent = Math.max(4, Math.min(100, (1 - pae / 31.75) * 100));
                const isConf = pae < 5;
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t transition-all ${
                      isConf ? 'bg-sky-500 hover:bg-sky-400' : 'bg-neutral-700 hover:bg-neutral-500'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`PAE: ${pae.toFixed(1)} Å`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1">
              <span>N-term (Res 1)</span>
              <span>C-term (Res {matrixSize})</span>
            </div>
          </div>

          {/* DeepMind Domain Structural Guide */}
          <div className="border border-neutral-800 bg-[#161b22] rounded p-4 space-y-2.5 text-xs">
            <h4 className="font-semibold text-neutral-200 pb-1 border-b border-neutral-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Interpreting AlphaFold PAE</span>
            </h4>
            <div className="space-y-2 text-[11px] text-neutral-400 leading-relaxed">
              <div className="p-2 bg-[#12161c] rounded border border-neutral-800/60">
                <span className="text-sky-400 font-semibold block">Diagonal Solid Squares:</span>
                Indicates well-packed, rigid globular domains with fixed inter-residue spatial orientation.
              </div>
              <div className="p-2 bg-[#12161c] rounded border border-neutral-800/60">
                <span className="text-amber-400 font-semibold block">Off-Diagonal Pale Fields:</span>
                Indicates inter-domain mobility or flexible linkers where relative domain orientation is uncertain.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PAEViewer;
