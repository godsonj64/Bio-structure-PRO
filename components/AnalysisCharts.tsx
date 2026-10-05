
import React, { useEffect, useRef } from 'react';
import { Dihedral, ContactMapData, CompositionData, AlphaMissenseData } from '../types';

const safeRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: number | number[]
) => {
  if (typeof (ctx as any).roundRect === 'function') {
    try {
      (ctx as any).roundRect(x, y, w, h, radii);
      return;
    } catch (e) {
      // Fallback
    }
  }
  ctx.rect(x, y, w, h);
};

export const ConservationPlot: React.FC<{ data: { resSeq: number, score: number }[] }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const w = 800, h = 200;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0,0,w,h);
        
        const step = w / (data.length || 1);
        ctx.beginPath();
        data.forEach((d, i) => {
            const x = i * step;
            const y = h - (d.score * h * 0.8) - 20; // Scale 80% height, offset 20px
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        const grad = ctx.createLinearGradient(0,0,0,h);
        grad.addColorStop(0, '#f59e0b'); // Gold
        grad.addColorStop(1, '#6366f1'); // Indigo
        ctx.strokeStyle = grad; ctx.lineWidth = 4; ctx.stroke();
    }, [data]);
    return <canvas ref={canvasRef} style={{ width: '100%', height: '100px' }} className="rounded-2xl bg-black/20" />;
};

export const PocketSizeChart: React.FC<{ data: { center: [number, number, number], volume: number }[] }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = 800, h = 200;
        canvas.width = w; canvas.height = h;
        ctx.clearRect(0,0,w,h);
        
        const maxV = Math.max(...data.map(d => d.volume)) || 1;
        const barW = (w / data.length) - 10;
        data.forEach((d, i) => {
            const barH = (d.volume / maxV) * h * 0.8;
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            safeRoundRect(ctx, i * (barW + 10), h - barH, barW, barH, [8,8,0,0]);
            ctx.fill();
        });
    }, [data]);
    return <canvas ref={canvasRef} style={{ width: '100%', height: '100px' }} className="rounded-2xl bg-black/20" />;
};

export const CompositionChart: React.FC<{ data: CompositionData[] }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;
        
        const dpr = window.devicePixelRatio || 1;
        const width = 800;
        const height = 320;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);

        const padding = 50;
        const chartW = width - padding * 2;
        const chartH = height - padding * 2;
        const barW = chartW / data.length;

        const maxVal = Math.max(...data.map(d => d.percentage));

        data.forEach((d, i) => {
            const h = (d.percentage / (maxVal || 1)) * chartH;
            const x = padding + i * barW;
            const y = height - padding - h;

            let color = '#94a3b8';
            if (d.category === 'Acidic') color = '#f43f5e';
            if (d.category === 'Basic') color = '#3b82f6';
            if (d.category === 'Polar') color = '#10b981';
            if (d.category === 'Non-polar') color = '#f59e0b';

            ctx.fillStyle = color;
            ctx.beginPath();
            const radius = 6;
            safeRoundRect(ctx, x + 4, y, barW - 8, h, [radius, radius, 0, 0]);
            ctx.fill();

            ctx.save();
            ctx.translate(x + barW / 2, height - padding + 15);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = '#94a3b8'; // Slate-400 for text
            ctx.font = 'bold 10px Inter';
            ctx.fillText(d.label, 0, 0);
            ctx.restore();
        });
    }, [data]);

    return (
        <div className="w-full">
            <canvas ref={canvasRef} style={{ width: '100%', height: '160px' }} className="rounded-2xl" />
            <div className="flex flex-wrap gap-6 mt-6 justify-center">
                {['Non-polar', 'Polar', 'Acidic', 'Basic'].map(cat => (
                    <div key={cat} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <div className={`w-3 h-3 rounded-md ${cat === 'Acidic' ? 'bg-rose-500' : cat === 'Basic' ? 'bg-blue-500' : cat === 'Polar' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {cat}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ShapeAnisotropyPlot: React.FC<{ evals: number[] }> = ({ evals }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const w = 400, h = 400;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0,0,w,h);
        
        const center = 200;
        const maxE = Math.max(...evals);
        const lengths = evals.map(e => (e / maxE) * 150);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.arc(center, center, 150, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);

        const colors = ['#3b82f6', '#10b981', '#f59e0b'];
        const labels = ['Axis X', 'Axis Y', 'Axis Z'];
        [[1,0], [0,1], [-0.7, -0.7]].forEach((dir, i) => {
            ctx.strokeStyle = colors[i]; ctx.lineWidth = 4; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(center, center);
            ctx.lineTo(center + dir[0]*lengths[i], center + dir[1]*lengths[i]);
            ctx.stroke();
            ctx.fillStyle = colors[i]; ctx.font = 'bold 10px Inter';
            ctx.fillText(labels[i], center + dir[0]*lengths[i] + 5, center + dir[1]*lengths[i] + 5);
        });

        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; ctx.beginPath();
        ctx.ellipse(center, center, lengths[0], lengths[1], 0, 0, Math.PI*2); ctx.fill();
    }, [evals]);
    return <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: '1/1' }} className="bg-white/5 rounded-3xl" />;
};

export const PairDistributionPlot: React.FC<{ data: { distance: number, frequency: number }[] }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const w = 1000, h = 300;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0,0,w,h);
        const maxF = Math.max(...data.map(d => d.frequency)) || 1;
        const step = w / data.length;
        ctx.beginPath(); ctx.moveTo(0, h);
        data.forEach((d, i) => ctx.lineTo(i * step, h - (d.frequency / maxF) * (h-20)));
        ctx.lineTo(w, h); ctx.closePath();
        const grad = ctx.createLinearGradient(0,0,0,h); grad.addColorStop(0, 'rgba(16, 185, 129, 0.3)'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.fill();
        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3; ctx.stroke();
    }, [data]);
    return <canvas ref={canvasRef} style={{ width: '100%', height: '120px' }} />;
};

export const SASAProfileChart: React.FC<{ data: { resSeq: number, score: number }[] }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const dpr = window.devicePixelRatio || 1;
        const width = 1000;
        const height = 200;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.beginPath();
        const step = width / (data.length || 1);
        data.forEach((d, i) => {
            const x = i * step;
            const y = height - (d.score / 15) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        data.forEach((d, i) => {
            const x = i * step;
            const y = height - (d.score / 15) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }, [data]);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100px' }} className="bg-white/5 rounded-2xl border border-white/5" />;
};

export const PackingDensityPlot: React.FC<{ data: { resSeq: number, count: number }[] }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = 1000, h = 200;
        canvas.width = w; canvas.height = h;
        ctx.clearRect(0,0,w,h);
        const maxC = Math.max(...data.map(d => d.count)) || 1;
        const step = w / data.length;
        ctx.fillStyle = '#6366f1';
        data.forEach((d, i) => {
            const bh = (d.count / maxC) * h;
            ctx.fillRect(i * step, h - bh, step - 0.5, bh);
        });
    }, [data]);
    return <canvas ref={canvasRef} style={{ width: '100%', height: '80px' }} className="bg-white/5 rounded-xl" />;
};

export const FlexibilityProfilePlot: React.FC<{ data: { resSeq: number, zScore: number }[] }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = 1000, h = 200;
        canvas.width = w; canvas.height = h;
        ctx.clearRect(0,0,w,h);
        const midY = h / 2;
        const step = w / data.length;
        ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((d, i) => {
            const y = midY - (d.zScore * 30);
            if (i === 0) ctx.moveTo(i * step, y);
            else ctx.lineTo(i * step, y);
        });
        ctx.stroke();
        ctx.setLineDash([2, 2]); ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke();
        ctx.setLineDash([]);
    }, [data]);
    return <canvas ref={canvasRef} style={{ width: '100%', height: '80px' }} className="bg-white/5 rounded-xl" />;
};

export const RamachandranPlot: React.FC<{ data: Dihedral[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const width = 600;
    canvas.width = width * dpr;
    canvas.height = width * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, width);
    // Removed white background
    
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for(let i=0; i<=8; i++) {
        const pos = i * (width/8);
        ctx.moveTo(pos, 0); ctx.lineTo(pos, width);
        ctx.moveTo(0, pos); ctx.lineTo(width, pos);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width/2, 0); ctx.lineTo(width/2, width);
    ctx.moveTo(0, width/2); ctx.lineTo(width, width/2);
    ctx.stroke();

    data.forEach(d => {
      if (d.phi !== null && d.psi !== null) {
        const x = ((d.phi + 180) / 360) * width;
        const y = width - ((d.psi + 180) / 360) * width;
        
        let color = 'rgba(59, 130, 246, 0.6)';
        if (d.phi < 0 && d.psi > 90) color = 'rgba(16, 185, 129, 0.6)';
        if (d.phi < 0 && d.psi < 0 && d.psi > -100) color = 'rgba(244, 63, 94, 0.6)';
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [data]);
  return <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: '1/1' }} className="rounded-2xl shadow-inner border border-white/5 bg-black/40" />;
};

export const ContactMap: React.FC<{ data: ContactMapData }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data.matrix.length) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const size = data.matrix.length;
        const width = 600;
        canvas.width = width;
        canvas.height = width;
        const pixelSize = width / size;
        
        ctx.clearRect(0,0,width,width);

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const dist = data.matrix[i][j];
                if (dist < 12) {
                    const intensity = 1 - (dist / 12); 
                    ctx.fillStyle = `rgba(59, 130, 246, ${intensity})`;
                    ctx.fillRect(i * pixelSize, j * pixelSize, pixelSize + 0.5, pixelSize + 0.5); 
                }
            }
        }
    }, [data]);
    return <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: '1/1' }} className="rounded-2xl shadow-inner border border-white/5 bg-black/40" />;
}

export const HydrophobicityPlot: React.FC<{ data: any[] }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const width = 800;
        const height = 240;
        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);
        const zeroY = height / 2;
        
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.moveTo(0, zeroY); ctx.lineTo(width, zeroY); ctx.stroke();
        
        const barW = width / (data.length || 1);
        data.forEach((d, i) => {
            const h = (d.val / 4.5) * (height / 2);
            ctx.fillStyle = d.val > 0 ? '#f43f5e' : '#3b82f6';
            ctx.beginPath();
            safeRoundRect(ctx, i * barW + 1, zeroY - h, Math.max(1, barW - 1), h, 2);
            ctx.fill();
        });
    }, [data]);
    return <canvas ref={canvasRef} style={{ width: '100%', height: '120px' }} className="rounded-2xl bg-white/5" />;
}

export const AlphaMissenseHeatmap: React.FC<{ data: AlphaMissenseData[] }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Amino Acid Axis (Grouped by properties roughly)
    const aminoAcids = ['G','P','A','V','L','I','M','C','F','Y','W','H','K','R','Q','N','E','D','S','T'];
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = 300;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        
        ctx.clearRect(0,0,width,height);
        
        // Margins for labels
        const marginLeft = 25;
        const graphW = width - marginLeft;
        
        const maxPos = Math.max(...data.map(d => d.position));
        const cellW = graphW / maxPos;
        const cellH = (height) / 20;

        // Draw Heatmap
        data.forEach(d => {
            const x = marginLeft + (d.position - 1) * cellW;
            const yIndex = aminoAcids.indexOf(d.mutation);
            if (yIndex === -1) return;
            const y = yIndex * cellH;

            // Gradient: Cyan (0) to Rose (1)
            const score = d.score;
            // Adjusted color ranges for dark theme vibrancy
            const r = 34 + (244 - 34) * score;
            const g = 211 + (63 - 211) * score;
            const b = 238 + (94 - 238) * score;
            ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

            ctx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
        });
        
        // Y-Axis Labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px Inter';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        aminoAcids.forEach((aa, i) => {
            ctx.fillText(aa, marginLeft - 6, i * cellH + cellH/2);
        });

    }, [data, aminoAcids]);

    if (data.length === 0) return null;

    return (
        <div className="relative w-full">
            <canvas ref={canvasRef} style={{ width: '100%', height: '300px' }} className="rounded-xl bg-black/40" />
            <div className="flex justify-between mt-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                <span>POS 1</span>
                <span>AMINO ACID MUTATION LANDSCAPE</span>
                <span>POS {Math.max(...data.map(d => d.position) || [0])}</span>
            </div>
             <div className="flex gap-4 mt-3 justify-center">
                 <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-cyan-400 rounded-sm"></div> <span className="text-[9px] font-bold text-slate-500">Likely Benign (0.0)</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="w-20 h-2 bg-gradient-to-r from-cyan-400 to-rose-500 rounded-full"></div>
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-rose-500 rounded-sm"></div> <span className="text-[9px] font-bold text-slate-500">Likely Pathogenic (1.0)</span>
                 </div>
             </div>
        </div>
    );
};
