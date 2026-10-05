import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ColorScheme, RepresentationType } from '../types';
import { getConservationColor } from '../services/pdbService';

interface NGLViewerProps {
  pdbContent: string;
  colorScheme: ColorScheme;
  representation: RepresentationType;
  showSideChains: boolean;
  showSurface: boolean;
  spin: boolean;
  colorByPlddt: boolean;
  plddtThreshold: number;
  conservationScores?: { resSeq: number, score: number }[];
}

export interface NGLViewerHandle {
  downloadScreenshot: () => void;
  resetView: () => void;
}

const NGLViewer = forwardRef<NGLViewerHandle, NGLViewerProps>(({
  pdbContent,
  colorScheme,
  representation,
  showSideChains,
  showSurface,
  spin,
  colorByPlddt,
  plddtThreshold,
  conservationScores
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const componentRef = useRef<any>(null);
  const spinIntervalRef = useRef<number | null>(null);

  // Global safety patch for NGL Signal to prevent _bindings undefined errors during disposal
  const ensureSignalPatched = () => {
    if (typeof window === 'undefined') return;
    const NGL = (window as any).NGL;
    if (!NGL || !NGL.Signal || !NGL.Signal.prototype) return;
    const p = NGL.Signal.prototype;
    if (p.__safePatched) return;
    p.__safePatched = true;

    const origDispatch = p.dispatch;
    p.dispatch = function (...args: any[]) {
      if (!this._bindings) return;
      try {
        return origDispatch.apply(this, args);
      } catch (e: any) {
        if (e && String(e.message).includes('_bindings')) return;
        console.warn("NGL Signal dispatch warning:", e);
      }
    };

    const origRemoveAll = p.removeAll;
    p.removeAll = function () {
      if (!this._bindings) return;
      return origRemoveAll.apply(this);
    };

    const origGetNum = p.getNumListeners;
    p.getNumListeners = function () {
      return this._bindings ? this._bindings.length : 0;
    };

    const origIndexOf = p._indexOfListener;
    p._indexOfListener = function (listener: any, context: any) {
      if (!this._bindings) return -1;
      return origIndexOf.call(this, listener, context);
    };
  };

  useImperativeHandle(ref, () => ({
    downloadScreenshot: () => {
      try {
        if (stageRef.current && typeof stageRef.current.makeImage === 'function') {
          stageRef.current.makeImage().then((blob: Blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "biostructure_ngl.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }).catch((err: any) => console.warn("NGL makeImage error:", err));
        }
      } catch (e) {
        console.warn("Screenshot capture error:", e);
      }
    },
    resetView: () => {
      try {
        if (stageRef.current) {
          stageRef.current.autoView(200);
          stageRef.current.viewer?.requestRender();
        }
      } catch (e) {
        console.warn("NGL autoView error:", e);
      }
    }
  }));

  const initStage = () => {
    if (!containerRef.current || !(window as any).NGL) return null;
    ensureSignalPatched();
    try {
      if (!stageRef.current) {
        const NGL = (window as any).NGL;
        const stage = new NGL.Stage(containerRef.current, { 
          backgroundColor: "black",
          quality: "high"
        });
        stageRef.current = stage;
        stage.handleResize();
        return stage;
      }
      return stageRef.current;
    } catch (e) {
      console.warn("Error creating NGL Stage:", e);
      return null;
    }
  };

  const loadPdbModel = (stage: any, content: string) => {
    if (!stage || !content) return;
    try {
      stage.removeAllComponents();
      componentRef.current = null;

      const blob = new Blob([content], { type: 'text/plain' });
      stage.loadFile(blob, { ext: 'pdb', defaultRepresentation: false })
        .then((component: any) => {
          if (!stageRef.current) return;
          componentRef.current = component;
          updateRepresentation(component);
          component.autoView(200);
          stage.handleResize();
          stage.viewer?.requestRender();
        })
        .catch((err: any) => {
          if (err && String(err.message || err).includes('_bindings')) return;
          console.warn("NGL loadFile error:", err);
        });
    } catch (err: any) {
      if (err && String(err.message || err).includes('_bindings')) return;
      console.warn("NGL loadFile outer error:", err);
    }
  };

  // Mount effect: initialize stage, observe container size, and load initial pdbContent
  useEffect(() => {
    let timer: any = null;
    let resizeObserver: ResizeObserver | null = null;

    const checkInit = () => {
      const stage = initStage();
      if (!stage) {
        timer = setTimeout(checkInit, 80);
      } else if (pdbContent) {
        loadPdbModel(stage, pdbContent);
      }
    };
    checkInit();

    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (stageRef.current) {
          try {
            stageRef.current.handleResize();
            stageRef.current.viewer?.requestRender();
          } catch (e) {
            // ignore
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    const handleWindowResize = () => {
      try {
        if (stageRef.current) {
          stageRef.current.handleResize();
          stageRef.current.viewer?.requestRender();
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      if (timer) clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
      }
      try {
        if (stageRef.current) {
          stageRef.current.removeAllComponents();
          stageRef.current.dispose();
          stageRef.current = null;
        }
        componentRef.current = null;
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // Update model when pdbContent changes after initial mount
  useEffect(() => {
    if (stageRef.current && pdbContent) {
      loadPdbModel(stageRef.current, pdbContent);
    }
  }, [pdbContent]);

  // Update representations when styling parameters change
  useEffect(() => {
    if (!componentRef.current) return;
    updateRepresentation(componentRef.current);
  }, [colorScheme, representation, showSideChains, showSurface, colorByPlddt, plddtThreshold, conservationScores]);

  // Spin rotation control
  useEffect(() => {
    if (!stageRef.current) return;
    if (spin) {
      const step = 0.5;
      spinIntervalRef.current = window.setInterval(() => {
        try {
          if (stageRef.current?.viewer?.controls) {
            stageRef.current.viewer.controls.spin({ x: 0, y: 1, z: 0 }, step * 0.01);
            stageRef.current.viewer.requestRender();
          }
        } catch (e) {
          // ignore
        }
      }, 20);
    } else {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
      }
    }
    return () => { 
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
      }
    };
  }, [spin]);

  const updateRepresentation = (component: any) => {
    if (!(window as any).NGL || !component || !stageRef.current) return;
    try {
      const NGL = (window as any).NGL;
      component.removeAllRepresentations();

      const style = representation === 'cartoon' ? 'cartoon' : 
                    representation === 'stick' ? 'licorice' :
                    representation === 'sphere' ? 'spacefill' : 'line';
      
      let nglColor = 'chainid';
      let schemeId = '';

      if (colorScheme.label === 'Spectrum') nglColor = 'residueindex';
      if (colorScheme.label === 'Confidence (pLDDT)') nglColor = 'bfactor';
      if (colorScheme.label === 'Hydrophobicity') nglColor = 'hydrophobicity';
      if (colorScheme.label === 'Residue Type') nglColor = 'resname';
      if (colorScheme.label === 'Secondary Structure') nglColor = 'sstruc';
      if (colorScheme.label === 'Element') nglColor = 'element';
      
      if (colorScheme.label === 'AlphaMissense Pathogenicity') {
        schemeId = `alphamissense-${Date.now()}`;
        const data: [string, string][] = [
          ['#ef4444', '175 or 245 or 248 or 249 or 273 or 282 or 110 or 132'],
          ['#0ea5e9', '*']
        ];
        try {
          NGL.ColormakerRegistry.addSelectionScheme(data, schemeId);
          nglColor = schemeId;
        } catch (e) {
          nglColor = 'residueindex';
        }
      }

      if (colorScheme.label === 'Evolutionary Conservation' && conservationScores && conservationScores.length > 0) {
        schemeId = `conservation-${Date.now()}`;
        const data: [string, string][] = conservationScores.map(s => [getConservationColor(s.score), s.resSeq.toString()]);
        try {
          NGL.ColormakerRegistry.addSelectionScheme(data, schemeId);
          nglColor = schemeId;
        } catch (e) {
          nglColor = 'chainid';
        }
      }

      const commonProps = {
        quality: 'high',
        aspectRatio: 1.0,
        radiusScale: 1.0
      };

      if (colorByPlddt) {
        component.addRepresentation(style, {
          ...commonProps,
          sele: `_B > ${plddtThreshold}`,
          color: nglColor,
          opacity: 1.0
        });
        component.addRepresentation(style, {
          ...commonProps,
          sele: `_B <= ${plddtThreshold}`,
          color: 'silver',
          opacity: 0.25
        });
      } else {
        component.addRepresentation(style, {
          ...commonProps,
          color: nglColor
        });
      }

      if (showSideChains) {
        component.addRepresentation('licorice', {
          sele: 'sidechainAttached',
          color: 'element',
          opacity: colorByPlddt ? 0.7 : 1.0,
          radiusScale: 0.7
        });
      }

      if (showSurface) {
        component.addRepresentation('surface', {
          sele: 'polymer',
          surfaceType: 'vws',
          opacity: 0.2,
          color: 'white',
          wireframe: false
        });
      }

      stageRef.current?.viewer?.requestRender();
    } catch (e) {
      console.warn("NGL updateRepresentation error:", e);
    }
  };

  return <div ref={containerRef} className="w-full h-full bg-black relative" />;
});

NGLViewer.displayName = 'NGLViewer';
export default NGLViewer;
