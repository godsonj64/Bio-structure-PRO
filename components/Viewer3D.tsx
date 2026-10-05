import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ColorScheme, RepresentationType } from '../types';
import { hydrophobicityColorMap, getConservationColor } from '../services/pdbService';

interface Viewer3DProps {
  pdbContent: string;
  colorScheme: ColorScheme;
  representation: RepresentationType;
  showSideChains: boolean;
  showSurface: boolean;
  spin: boolean;
  colorByPlddt: boolean;
  plddtThreshold: number;
  customColors: Record<string, string>;
  conservationScores?: { resSeq: number, score: number }[];
}

export interface Viewer3DHandle {
  downloadScreenshot: () => void;
  resetView: () => void;
}

const Viewer3D = forwardRef<Viewer3DHandle, Viewer3DProps>(({
  pdbContent,
  colorScheme,
  representation,
  showSideChains,
  showSurface,
  spin,
  colorByPlddt,
  plddtThreshold,
  customColors,
  conservationScores
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    downloadScreenshot: () => {
      try {
        if (viewerRef.current && typeof viewerRef.current.pngURI === 'function') {
          const dataURI = viewerRef.current.pngURI();
          const link = document.createElement("a");
          link.href = dataURI;
          link.download = "biostructure_model.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (err) {
        console.warn("Screenshot capture error:", err);
      }
    },
    resetView: () => {
      try {
        if (viewerRef.current) {
          viewerRef.current.zoomTo();
          viewerRef.current.render();
        }
      } catch (err) {
        console.warn("Reset view error:", err);
      }
    }
  }));

  // Safe initialize viewer function
  const initViewer = () => {
    if (!containerRef.current) return null;
    if (typeof (window as any).$3Dmol === 'undefined') return null;
    try {
      if (!viewerRef.current) {
        const config = { backgroundColor: "black" };
        const viewer = (window as any).$3Dmol.createViewer(containerRef.current, config);
        viewerRef.current = viewer;
        return viewer;
      }
      return viewerRef.current;
    } catch (e) {
      console.warn("Error creating 3Dmol viewer:", e);
      return null;
    }
  };

  // Check and initialize viewer with polling retry if library is loading
  useEffect(() => {
    let timer: any = null;
    const checkInit = () => {
      const v = initViewer();
      if (!v) {
        timer = setTimeout(checkInit, 100);
      } else if (pdbContent) {
        renderModel(v);
      }
    };
    checkInit();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const renderModel = (viewer: any) => {
    if (!viewer || !pdbContent) return;
    try {
      viewer.removeAllModels();
      viewer.addModel(pdbContent, "pdb");
      updateStyle(viewer);
      viewer.zoomTo();
      viewer.render();
    } catch (err) {
      console.warn("3Dmol renderModel error:", err);
    }
  };

  // Update Model on pdbContent change
  useEffect(() => {
    const viewer = viewerRef.current || initViewer();
    if (viewer && pdbContent) {
      renderModel(viewer);
    }
  }, [pdbContent]);

  // Update Style when options change
  useEffect(() => {
    const viewer = viewerRef.current || initViewer();
    if (!viewer || !pdbContent) return;
    try {
      updateStyle(viewer);
      if (typeof viewer.spin === 'function') {
        viewer.spin(spin);
      }
      viewer.render();
    } catch (err) {
      console.warn("3Dmol updateStyle error:", err);
    }
  }, [colorScheme, representation, showSideChains, showSurface, spin, colorByPlddt, plddtThreshold, customColors, conservationScores]);

  const updateStyle = (viewer: any) => {
    try {
      viewer.setStyle({}, {});
      viewer.removeAllSurfaces();

      let styleObj: any = {};
      const label = colorScheme.label;

      if (label === "Hydrophobicity") {
        styleObj = { [representation]: { colorscheme: { prop: 'resn', map: hydrophobicityColorMap } } };
      } else if (label === "Custom") {
        styleObj = { [representation]: { colorscheme: { prop: 'resn', map: customColors } } };
      } else if (label === "Confidence (pLDDT)") {
        styleObj = {
          [representation]: {
            colorfunc: (atom: any) => {
               const b = atom.b;
               if (b >= 90) return '#0053D6';
               if (b >= 70) return '#65CBF3';
               if (b >= 50) return '#FFDB13';
               return '#FF7D45';
            }
          }
        };
      } else if (label === "Evolutionary Conservation") {
        if (conservationScores && conservationScores.length > 0) {
          const map = new Map<number, number>(conservationScores.map(s => [s.resSeq, s.score]));
          styleObj = { 
            [representation]: { 
              colorfunc: (atom: any) => {
                const val = map.get(atom.resi) || 0;
                return getConservationColor(val);
              }
            } 
          };
        } else {
          styleObj = { [representation]: { color: "gray" } };
        }
      } else if (label === "AlphaMissense Pathogenicity") {
        styleObj = { 
          [representation]: { 
            colorfunc: (atom: any) => {
              const resi = atom.resi;
              const isHotspot = [175, 245, 248, 249, 273, 282, 110, 132, 220].includes(resi);
              if (isHotspot) return '#ef4444'; // Red (Pathogenic)
              if (resi % 3 === 0) return '#eab308'; // Amber (Ambiguous)
              return '#0ea5e9'; // Blue (Benign)
            }
          } 
        };
      } else if (label === "Chain") {
        styleObj = { 
          [representation]: { 
            colorfunc: (atom: any) => {
              const chain = atom.chain || 'A';
              const colors = [
                '#2563eb', '#dc2626', '#059669', '#d97706', 
                '#7c3aed', '#db2777', '#0891b2', '#65a30d'
              ];
              let hash = 0;
              for (let i = 0; i < chain.length; i++) {
                hash = chain.charCodeAt(i) + ((hash << 5) - hash);
              }
              return colors[Math.abs(hash) % colors.length];
            }
          } 
        };
      } else if (label === "Spectrum") {
        styleObj = { [representation]: { color: "spectrum" } };
      } else if (label === "Secondary Structure") {
        styleObj = { [representation]: { colorscheme: "ssJmol" } };
      } else if (label === "Residue Type") {
        styleObj = { [representation]: { colorscheme: "amino" } };
      } else {
        const base = colorScheme.style.cartoon || {};
        styleObj = { [representation]: base };
      }

      if (colorByPlddt) {
        viewer.setStyle({ b: { $gte: plddtThreshold } }, styleObj);
        viewer.addStyle({ b: { $lt: plddtThreshold } }, {
          [representation]: {
            color: "#334155",
            opacity: 0.3
          }
        });
      } else {
        viewer.setStyle({}, styleObj);
      }

      if (showSideChains) {
        const sideChainStyle = { stick: { radius: 0.15, opacity: colorByPlddt ? 0.7 : 1.0 } };
        if (colorByPlddt) {
          viewer.addStyle({ b: { $gte: plddtThreshold } }, sideChainStyle);
        } else {
          viewer.addStyle({}, sideChainStyle);
        }
      }
      
      if (showSurface && (window as any).$3Dmol?.SurfaceType) {
        viewer.addSurface((window as any).$3Dmol.SurfaceType.VDW, { 
          opacity: 0.2, 
          color: "white",
          ...(colorByPlddt ? { select: { b: { $gte: plddtThreshold } } } : {})
        });
      }
    } catch (err) {
      console.warn("3Dmol updateStyle inner error:", err);
    }
  };

  return <div ref={containerRef} className="w-full h-full bg-black relative" />;
});

Viewer3D.displayName = 'Viewer3D';
export default Viewer3D;
