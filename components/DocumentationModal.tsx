import React from 'react';
import { X, BookOpen, Cpu, Activity, Database, FileText, Zap } from 'lucide-react';

interface DocumentationModalProps {
  onClose: () => void;
}

const DocumentationModal: React.FC<DocumentationModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-[#161b22] border border-neutral-800 w-full max-w-4xl h-[85vh] rounded shadow-2xl flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-[#12161c] shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">System Methodology & Architectural Documentation</h2>
              <div className="text-[11px] text-neutral-400">
                AlphaFold v4 Monomer Pipeline · In-Silico Biophysics & Topology Algorithms
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 text-neutral-300 text-xs leading-relaxed">
          {/* Executive Summary */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <h3>System Overview</h3>
            </div>
            <p className="text-neutral-400">
              BioStructure Pro is a high-density structural bioinformatics workstation designed for structural biologists, genomicists, and biophysicists. 
              By connecting to the DeepMind AlphaFold Protein Structure Database v4 and UniProt KnowledgeBase, the application parses raw PDB atomic coordinates directly into client-side analytical models.
            </p>
          </section>

          {/* Mathematical Foundations */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <h3>Biophysical & Topological Equations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-3 bg-[#0d1117] rounded border border-neutral-800 space-y-1">
                <span className="text-white font-semibold font-sans block text-xs">Radius of Gyration (Rg)</span>
                <p className="text-neutral-400 font-mono">Rg = sqrt( (1 / N) * sum( ||r_i - r_mean||^2 ) )</p>
                <p className="text-[10px] text-neutral-500 font-sans">
                  Calculates structural compactness of all alpha carbons (CA) relative to the center of mass.
                </p>
              </div>

              <div className="p-3 bg-[#0d1117] rounded border border-neutral-800 space-y-1">
                <span className="text-white font-semibold font-sans block text-xs">Backbone Dihedrals (φ, ψ)</span>
                <p className="text-neutral-400 font-mono">φ: C(i-1)-N(i)-CA(i)-C(i) | ψ: N(i)-CA(i)-C(i)-N(i+1)</p>
                <p className="text-[10px] text-neutral-500 font-sans">
                  Evaluates torsion angle stereochemistry mapped against Ramachandran core allowed basins.
                </p>
              </div>

              <div className="p-3 bg-[#0d1117] rounded border border-neutral-800 space-y-1">
                <span className="text-white font-semibold font-sans block text-xs">Isoelectric Point (pI)</span>
                <p className="text-neutral-400 font-mono">sum( positive_charges ) = sum( negative_charges )</p>
                <p className="text-[10px] text-neutral-500 font-sans">
                  Bisection search across pH 0.0 to 14.0 using standard pKa values (Asp, Glu, His, Cys, Tyr, Lys, Arg).
                </p>
              </div>

              <div className="p-3 bg-[#0d1117] rounded border border-neutral-800 space-y-1">
                <span className="text-white font-semibold font-sans block text-xs">Moment of Inertia Tensor</span>
                <p className="text-neutral-400 font-mono">I_xx = sum( y^2 + z^2 ), I_xy = -sum( x * y )</p>
                <p className="text-[10px] text-neutral-500 font-sans">
                  Diagonalization yields principal axes of inertia to classify molecular shape (prolate, oblate, spherical).
                </p>
              </div>
            </div>
          </section>

          {/* Platform Foundations */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <h3>Integrated Data Foundations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#12161c] rounded border border-neutral-800">
                <span className="text-xs font-semibold text-neutral-200 block mb-1">AlphaFold DB v4</span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Full coordinate streams, per-residue pLDDT confidence factors stored in PDB B-factor columns, and predicted aligned error (PAE).
                </p>
              </div>
              <div className="p-3 bg-[#12161c] rounded border border-neutral-800">
                <span className="text-xs font-semibold text-neutral-200 block mb-1">AlphaMissense</span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  DeepMind 71M missense variant pathogenicity classifications categorized into likely pathogenic, ambiguous, or likely benign.
                </p>
              </div>
              <div className="p-3 bg-[#12161c] rounded border border-neutral-800">
                <span className="text-xs font-semibold text-neutral-200 block mb-1">Dual WebGL Engines</span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Instant toggling between 3Dmol.js (high-compatibility shader pipeline) and NGL (high-performance WebGL scene graph).
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-[#12161c] flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <span>BioStructure Pro · Structural Genomics Workstation</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-sky-600 text-white font-medium text-xs hover:bg-sky-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;
