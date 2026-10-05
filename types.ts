
export interface Atom {
  serial: string;
  name: string;
  altLoc: string;
  resName: string;
  chainID: string;
  resSeq: string;
  iCode: string;
  x: number;
  y: number;
  z: number;
  occupancy: number;
  tempFactor: number;
  element: string;
  charge: string;
}

export interface ParsedPDB {
  header: string[];
  atoms: Atom[];
  helices: string[];
  sheets: string[];
  remarks: string[];
  connections: string[];
  seqres: string[];
}

export interface Prediction {
  entryId: string;
  gene: string;
  uniprotAccession: string;
  uniprotId: string;
  uniprotDescription: string;
  taxId: number;
  organismScientificName: string;
  uniprotSequence: string;
  modelCreatedDate: string;
  latestVersion: number;
  allVersions: number[];
  cifUrl: string;
  bcifUrl: string;
  pdbUrl: string;
  paeImageUrl: string;
  paeDocUrl: string;
  amUrl: string;
  amAnnotationsUrl?: string;
  globalMetricValue?: number;
  fractionPlddtVeryHigh?: number;
  fractionPlddtConfident?: number;
  fractionPlddtLow?: number;
  fractionPlddtVeryLow?: number;
  isComplex?: boolean;
  plddt: number[];
  coverage: any[]; 
}

export interface UniProtFeature {
  type: string;
  category: string;
  description: string;
  begin: string;
  end: string;
  wildType?: string;
  alternativeSequence?: string;
  clinicalSignificances?: string;
}

export interface UniProtResult {
  primaryAccession: string;
  uniProtkbId: string;
  proteinDescription?: {
    recommendedName?: {
      fullName?: {
        value: string;
      };
    };
  };
  organism?: {
    scientificName?: string;
  };
  features?: UniProtFeature[];
  comments?: any[];
}

export type RepresentationType = 'cartoon' | 'stick' | 'sphere' | 'line';

export interface ColorScheme {
  label: string;
  style: {
    cartoon?: { 
      color?: string;
      colorscheme?: string | object;
    };
  };
}

export interface Dihedral {
  resSeq: number;
  resName: string;
  phi: number | null;
  psi: number | null;
}

export interface ContactMapData {
  matrix: number[][];
  labels: string[];
  limit: number;
}

export interface CompositionData {
  label: string;
  count: number;
  percentage: number;
  category: 'Non-polar' | 'Polar' | 'Acidic' | 'Basic';
}

export interface PCAData {
  eigenvalues: number[];
  anisotropy: number;
  shapeType: 'Spherical' | 'Prolate' | 'Oblate' | 'Elongated';
}

export interface AdvancedStats {
  radiusOfGyration: number;
  isoelectricPoint: number;
  netCharge: number;
  avgPlddt: number;
  molecularWeight: number;
  pca: PCAData;
  composition: CompositionData[];
  sasaProfile: { resSeq: number, score: number }[];
  chargeProfile: { resSeq: number, charge: number }[];
  pairDistribution: { distance: number, frequency: number }[];
  ssPropensity: { alpha: number, beta: number, coil: number };
  hBondCount: number;
  packingDensity: { resSeq: number, count: number }[];
  flexibilityIndex: { resSeq: number, zScore: number }[];
  planarityDeviations: { resSeq: number, angle: number }[];
  // New Algorithms
  conservationScores: { resSeq: number, score: number }[];
  pockets: { center: [number, number, number], volume: number }[];
  inertiaMoments?: number[];
  shapeClassification?: string;
}

export interface AlphaMissenseData {
  variant: string;
  score: number;
  classification: string;
  position: number;
  wildtype: string;
  mutation: string;
}

export interface PAEMatrixData {
  matrix: number[][];
  maxPae: number;
  residueCount: number;
}

export interface AlphaProteoDesign {
  id: string;
  targetName: string;
  epitopeResidues: string[];
  scaffoldType: 'Triple Helical Bundle' | 'Beta-Hairpin Clamp' | 'Knottin Mini-Protein' | 'De Novo Dimer';
  shapeComplementarity: number; // Sc 0 to 1
  deltaSasa: number; // Angstrom^2 buried
  deltaG: number; // kcal/mol
  predictedKd: string; // e.g. "12 nM"
  interfaceHBonds: number;
  interfaceSaltBridges: number;
  binderSequence: string;
  status: 'Experimental Nanomolar' | 'Validated In-Silico' | 'Candidate Lead';
}

export interface AlphaGenomeTrack {
  trackName: string;
  assay: 'ATAC-seq' | 'CAGE' | 'H3K27ac' | 'H3K4me3' | 'DNase I';
  cellType: string;
  peakSignal: number;
  signalProfile: { posOffset: number; signal: number }[];
  description: string;
}

export interface AlphaGenomeVariantEffect {
  variantId: string;
  genomicCoord: string;
  refAllele: string;
  altAllele: string;
  consequence: 'Promoter Core Disruption' | 'Enhancer Inactivation' | 'Splice Donor Gain' | '5\' UTR Motifs' | 'TF Binding Abrogation';
  affectedTF: string;
  predictedFoldChange: number; // log2 fold change
  direction: 'Downregulated' | 'Upregulated' | 'Neutral';
  tissueSpecificity: string;
  pLDDTImpactConfidence: number;
}

export interface AlphaGenomeLocusData {
  geneSymbol: string;
  chromosome: string;
  tssPosition: number;
  windowSizeBp: number;
  tracks: AlphaGenomeTrack[];
  variants: AlphaGenomeVariantEffect[];
  regulatoryFeatures: {
    name: string;
    type: 'Promoter' | 'Super-Enhancer' | 'Insulator (CTCF)' | 'Exon 1' | 'CpG Island';
    startOffset: number;
    endOffset: number;
    activityScore: number;
  }[];
}

export interface AF3ComplexData {
  isComplex: boolean;
  ipTM: number;
  pTM: number;
  rankingScore: number;
  entities: {
    id: string;
    name: string;
    type: 'Protein' | 'DNA' | 'RNA' | 'Ligand' | 'Ion';
    chain: string;
    details: string;
    confidence: number;
  }[];
  interfaceContacts: {
    entityA: string;
    entityB: string;
    contactResidues: number;
    interfaceArea: number;
    avgPae: number;
  }[];
  coordinationSites: {
    ligandName: string;
    pocketVolume: number;
    bindingAffinityEst: string;
    coordinatingResidues: { resSeq: number; resName: string; atom: string; distance: number }[];
  }[];
}

export const defaultCustomColorMap: Record<string, string> = {
  ALA: '#C8C8C8', ARG: '#145AFF', ASN: '#00DCDC', ASP: '#E60A0A',
  CYS: '#E6E600', GLN: '#00DCDC', GLU: '#E60A0A', GLY: '#EBEBEB',
  HIS: '#8282D2', ILE: '#0F820F', LEU: '#0F820F', LYS: '#145AFF',
  MET: '#E6E600', PHE: '#3232AA', PRO: '#DC9682', SER: '#FA9600',
  THR: '#FA9600', TRP: '#B45AB4', TYR: '#3232AA', VAL: '#0F820F',
};

export const colorSchemes: ColorScheme[] = [
  {
    label: "Confidence (pLDDT)",
    style: {
      cartoon: {
        colorscheme: {
          prop: "b",
          gradient: "rwb",
          min: 50,
          max: 90,
        },
      },
    },
  },
  {
    label: "Secondary Structure",
    style: {
      cartoon: {
        color: "ssJmol",
      },
    },
  },
  {
    label: "Residue Type",
    style: {
      cartoon: {
        color: "amino",
      },
    },
  },
  {
    label: "Hydrophobicity",
    style: {
      cartoon: {
        colorscheme: "hydrophobicity",
      },
    },
  },
  {
    label: "Spectrum",
    style: {
      cartoon: {
        color: "spectrum",
      },
    },
  },
  {
    label: "Chain",
    style: {
      cartoon: {
        color: "chain",
      },
    },
  },
  {
    label: "Element",
    style: {
      cartoon: {
        colorscheme: "element",
      },
    },
  },
  {
    label: "Evolutionary Conservation",
    style: {
      cartoon: {
        color: "spectrum",
      },
    },
  },
  {
    label: "AlphaMissense Pathogenicity",
    style: {
      cartoon: {
        color: "spectrum",
      },
    },
  },
];
