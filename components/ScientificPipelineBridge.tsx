import React, { useState } from 'react';
import { 
  Network, 
  GitBranch, 
  ArrowRight, 
  Dna, 
  Cpu, 
  Layers, 
  Atom, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  Activity, 
  Sliders, 
  HelpCircle,
  Compass
} from 'lucide-react';

interface ScientificPipelineBridgeProps {
  onSelectWorkflow: (track: 'classical' | 'ai', subTab?: string) => void;
}

export const ScientificPipelineBridge: React.FC<ScientificPipelineBridgeProps> = ({
  onSelectWorkflow,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const pipelineSteps = [
    {
      step: 1,
      name: 'AlphaGenome',
      tier: 'Genomic & Regulatory Level',
      badge: 'DeepMind Epigenome',
      color: 'text-violet-400 border-violet-500/40 bg-violet-950/40',
      tagColor: 'bg-violet-950 text-violet-300 border-violet-800',
      icon: Dna,
      question: 'Is the gene transcribed, and how do non-coding variants alter tissue expression?',
      classicalWorkflow: 'Classical workflow begins strictly after mRNA is already transcribed, translated, and crystallized. Classical PDB is completely blind to upstream chromatin and non-coding genome regulation.',
      aiWorkflow: 'AlphaGenome reads 100kb–1Mb genomic DNA windows with axial attention transformers, predicting ATAC-seq accessibility, CAGE transcription initiation, histone marks (H3K27ac), and promoter/enhancer SNP impacts.',
      scientificConnection: 'Provides the biological prerequisite for protein expression: if a promoter or enhancer variant ablates expression, the downstream protein fold and biophysical active sites never materialize in vivo.',
      targetTab: 'alphagenome',
      targetTrack: 'ai' as const,
    },
    {
      step: 2,
      name: 'AlphaFold 3',
      tier: 'Multimodal 3D Coordinate Generation',
      badge: 'Nature 2024 Diffusion',
      color: 'text-sky-400 border-sky-500/40 bg-sky-950/40',
      tagColor: 'bg-sky-950 text-sky-300 border-sky-800',
      icon: Cpu,
      question: 'What is the full joint 3D structure of the protein, its multimers, DNA/RNA, and drug ligands?',
      classicalWorkflow: 'Required years of wet-lab protein purification, crystallization screens, or cryogenic electron microscopy (Cryo-EM) to obtain static atomic coordinates in PDB format.',
      aiWorkflow: 'AlphaFold 3 uses an end-to-end Pairformer and Diffusion Module to simultaneously model proteins, double-stranded DNA, RNA guides, metal ions (Zn²⁺/Mg²⁺), and small-molecule drug ligands directly into Cartesian (X, Y, Z) space.',
      scientificConnection: 'Outputs the foundational atomic coordinates that feed all classical biophysical analyzers (Ramachandran, SASA, pocket cavities, and secondary structure).',
      targetTab: 'af3',
      targetTrack: 'ai' as const,
    },
    {
      step: 3,
      name: 'PAE (Predicted Aligned Error)',
      tier: 'Inter-Domain Positional Confidence',
      badge: 'AlphaFold DB Metric',
      color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
      tagColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
      icon: Layers,
      question: 'Are domains rigidly packed relative to each other, or connected by flexible linkers?',
      classicalWorkflow: 'Classical PDB files only record isotropic crystallographic B-factors (Debye-Waller factors), which measure local atomic thermal vibrations but cannot evaluate relative multi-domain uncertainty.',
      aiWorkflow: 'AlphaFold computes an N×N matrix predicting the expected positional error (in Ångströms) of residue y when true and predicted structures are aligned on residue x.',
      scientificConnection: 'Prevents biophysicists from misinterpreting flexible domain-domain interfaces or inter-domain clefts as stable binding pockets when their relative position is actually uncertain.',
      targetTab: 'pae',
      targetTrack: 'ai' as const,
    },
    {
      step: 4,
      name: 'Classical Biophysics & Topology',
      tier: 'Physical & Stereochemical Invariants',
      badge: 'Ground-Truth Physics',
      color: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
      tagColor: 'bg-amber-950 text-amber-300 border-amber-800',
      icon: Atom,
      question: 'Are steric angles, solvent accessibility, cavities, and charge distributions physically plausible?',
      classicalWorkflow: 'The original foundational biophysical toolkit: Ramachandran dihedral distribution (φ, ψ), DSSP secondary structure helicity/sheets, Shrake-Rupley SASA, cavity Voronoi pocket detection, and PCA inertial axes.',
      aiWorkflow: 'Acts as the physical validator for AI predictions. Verifies that predicted coordinates obey steric non-overlap (Pauli exclusion), favorable hydrogen bonding, and standard rotameric states.',
      scientificConnection: 'Bridges raw predicted 3D coordinates to physical properties (pocket volume, hydrophobic surface area, net charge) needed to evaluate biological function and druggability.',
      targetTab: 'biophysics',
      targetTrack: 'classical' as const,
    },
    {
      step: 5,
      name: 'AlphaMissense',
      tier: 'Deep Mutagenesis & Functional Fitness',
      badge: '71M DeepMind Catalog',
      color: 'text-rose-400 border-rose-500/40 bg-rose-950/40',
      tagColor: 'bg-rose-950 text-rose-300 border-rose-800',
      icon: ShieldAlert,
      question: 'Which residues are evolutionary intolerant to mutation, and will a missense variant cause disease?',
      classicalWorkflow: 'Classical biophysics can calculate if a residue is buried or in an active pocket, but cannot predict whether a specific amino acid substitution destroys cellular fitness or causes human pathology.',
      aiWorkflow: 'Trained on evolutionary multi-sequence alignments and AlphaFold structural contexts to predict pathogenicity scores (0.0 to 1.0) for all 71 million possible human missense variants.',
      scientificConnection: 'Maps the biophysical pockets and core residues directly to functional vulnerability: buried catalytic residues light up as pathogenic hotspots (>0.56), while surface loops remain benign.',
      targetTab: 'alphamissense',
      targetTrack: 'ai' as const,
    },
    {
      step: 6,
      name: 'AlphaProteo',
      tier: 'Generative De Novo Binder Design',
      badge: 'Nature Science 2024',
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
      tagColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      icon: Sparkles,
      question: 'Can we generatively design a bespoke mini-protein that binds the target with nanomolar affinity?',
      classicalWorkflow: 'Required animal immunization, hybridomas, or directed evolution phage display over 6–12 months, followed by crystallographic docking.',
      aiWorkflow: 'Generative AI system directly designs high-affinity protein binders targeting viral RBDs, cytokine receptors, or oncogenic kinases from scratch using custom structural scaffolds.',
      scientificConnection: 'Consumes the target’s biophysical surface contours (pockets, SASA, hydrogen-bond donors/acceptors) and generates complementary shape and electrostatic binders with sub-nanomolar dissociation constants.',
      targetTab: 'alphaproteo',
      targetTrack: 'ai' as const,
    },
  ];

  const current = pipelineSteps[activeStep - 1];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 bg-[#12161c] border border-neutral-800 rounded">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-semibold text-white">
                Scientific Workflow Continuity: Classical Structural Biology vs. DeepMind Frontier AI
              </h3>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-4xl leading-relaxed">
              How classical biophysical invariants (Ramachandran, SASA, Cavity Pockets, Coordinates) scientifically connect to Google DeepMind’s generative AI ecosystem (AlphaGenome → AlphaFold 3 → PAE → AlphaMissense → AlphaProteo).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelectWorkflow('classical')}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded text-xs font-medium transition-colors"
            >
              Open Classical Track
            </button>
            <button
              onClick={() => onSelectWorkflow('ai')}
              className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded text-xs font-medium transition-colors"
            >
              Open DeepMind AI Track
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Stepper Visualization */}
      <div className="p-3 bg-[#161b22] border border-neutral-800 rounded">
        <span className="text-[11px] font-semibold text-neutral-300 block mb-2 px-1">
          The 6-Stage Scientific Information Cascade (Click a node to inspect its scientific connection):
        </span>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {pipelineSteps.map(s => {
            const isSelected = s.step === activeStep;
            const Icon = s.icon;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`p-2.5 rounded text-left transition-all border flex flex-col justify-between ${
                  isSelected 
                    ? `${s.color} border-l-4 shadow-lg scale-[1.02]` 
                    : 'bg-[#12161c] border-neutral-800 hover:border-neutral-700 text-neutral-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-500">Stage {s.step}</span>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-white block mt-1">{s.name}</span>
                  <span className="text-[10px] font-sans text-neutral-400 block line-clamp-1 mt-0.5">
                    {s.tier}
                  </span>
                </div>

                <div className="mt-2 pt-1 border-t border-neutral-800/40">
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded border ${s.tagColor}`}>
                    {s.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Comparative Inspection Panel for Active Stage */}
      <div className="border border-neutral-800 bg-[#161b22] rounded p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-sky-400 font-semibold">Stage {current.step} of 6</span>
              <span className="text-neutral-500">·</span>
              <h4 className="text-sm font-semibold text-white">{current.name}: {current.tier}</h4>
            </div>
            <p className="text-xs text-neutral-300 mt-1 italic">
              "{current.question}"
            </p>
          </div>

          <button
            onClick={() => onSelectWorkflow(current.targetTrack, current.targetTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12161c] hover:bg-neutral-800 border border-neutral-700 hover:border-sky-500 rounded text-xs font-semibold text-sky-400 transition-colors shrink-0"
          >
            <span>Launch {current.name} Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3-Column Comparative Scientific Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Classical Workflow */}
          <div className="p-3 bg-[#12161c] border border-neutral-800 rounded space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-400 font-semibold text-xs">
              <Atom className="w-3.5 h-3.5 text-amber-400" />
              <span>Classical ("Old") Workflow</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              {current.classicalWorkflow}
            </p>
          </div>

          {/* DeepMind AI Workflow */}
          <div className="p-3 bg-[#12161c] border border-neutral-800 rounded space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-400 font-semibold text-xs">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>DeepMind AI Solution</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              {current.aiWorkflow}
            </p>
          </div>

          {/* Scientific Bridge & Continuity */}
          <div className="p-3 bg-[#12161c] border border-sky-900/40 rounded space-y-1.5">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-xs">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Scientific Connection & Synergy</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              {current.scientificConnection}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScientificPipelineBridge;
