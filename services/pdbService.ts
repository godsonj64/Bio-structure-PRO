
import { Atom, ParsedPDB, Dihedral, ContactMapData, AdvancedStats, CompositionData, PCAData } from '../types';

export const parsePDB = (pdbContent: string): ParsedPDB => {
  const lines = pdbContent.split("\n");
  const header = lines.filter((line) => line.startsWith("HEADER") || line.startsWith("TITLE"));
  const atoms = lines.filter((line) => line.startsWith("ATOM"));
  const helices = lines.filter((line) => line.startsWith("HELIX"));
  const sheets = lines.filter((line) => line.startsWith("SHEET"));
  const remarks = lines.filter((line) => line.startsWith("REMARK"));
  const connections = lines.filter((line) => line.startsWith("CONECT"));
  const seqres = lines.filter((line) => line.startsWith("SEQRES"));

  const parseAtom = (line: string): Atom => ({
    serial: line.slice(6, 11).trim(),
    name: line.slice(12, 16).trim(),
    altLoc: line.slice(16, 17).trim(),
    resName: line.slice(17, 20).trim(),
    chainID: line.slice(21, 22).trim(),
    resSeq: line.slice(22, 26).trim(),
    iCode: line.slice(26, 27).trim(),
    x: parseFloat(line.slice(30, 38)),
    y: parseFloat(line.slice(38, 46)),
    z: parseFloat(line.slice(46, 54)),
    occupancy: parseFloat(line.slice(54, 60)),
    tempFactor: parseFloat(line.slice(60, 66)),
    element: line.slice(76, 78).trim(),
    charge: line.slice(78, 80).trim(),
  });

  return {
    header,
    atoms: atoms.map(parseAtom),
    helices,
    sheets,
    remarks,
    connections,
    seqres,
  };
};

export const parseSSRanges = (parsedPDB: ParsedPDB) => {
    const helices: { start: number, end: number, chain: string, type: string }[] = [];
    const sheets: { start: number, end: number, chain: string, type: string }[] = [];

    parsedPDB.helices.forEach(line => {
        try {
            const start = parseInt(line.slice(21, 25).trim());
            const end = parseInt(line.slice(33, 37).trim());
            const chain = line.slice(19, 20).trim();
            if (!isNaN(start) && !isNaN(end)) {
                helices.push({ start, end, chain, type: 'helix' });
            }
        } catch (e) {}
    });

    parsedPDB.sheets.forEach(line => {
        try {
            const start = parseInt(line.slice(22, 26).trim());
            const end = parseInt(line.slice(33, 37).trim());
            const chain = line.slice(21, 22).trim();
            if (!isNaN(start) && !isNaN(end)) {
                sheets.push({ start, end, chain, type: 'sheet' });
            }
        } catch (e) {}
    });

    return { helices, sheets };
};

export const hydrophobicityScale: Record<string, number> = {
  ALA: 1.8, ARG: -4.5, ASN: -3.5, ASP: -3.5, CYS: 2.5, GLN: -3.5, GLU: -3.5,
  GLY: -0.4, HIS: -3.2, ILE: 4.5, LEU: 3.8, LYS: -3.9, MET: 1.9, PHE: 2.8,
  PRO: -1.6, SER: -0.8, THR: -0.7, TRP: -0.9, TYR: -1.3, VAL: 4.2, MSE: 1.9,
};

const atomicMasses: Record<string, number> = {
  C: 12.011, H: 1.008, N: 14.007, O: 15.999, S: 32.06, P: 30.974, MG: 24.305, CA: 40.078, FE: 55.845
};

export const defaultCustomColorMap: Record<string, string> = {
  ALA: '#8CFF8C', ARG: '#00007C', ASN: '#FF7C70', ASP: '#A00042',
  CYS: '#FFFF70', GLN: '#FF4C4C', GLU: '#660000', GLY: '#FFFFFF',
  HIS: '#7070FF', ILE: '#004C00', LEU: '#455E45', LYS: '#4747B8',
  MET: '#B8A042', PHE: '#534C52', PRO: '#525252', SER: '#FF7042',
  THR: '#B84C00', TRP: '#4F4600', TYR: '#8C704C', VAL: '#FF8CFF'
};

const aaCategories: Record<string, 'Non-polar' | 'Polar' | 'Acidic' | 'Basic'> = {
  ALA: 'Non-polar', VAL: 'Non-polar', LEU: 'Non-polar', ILE: 'Non-polar', PRO: 'Non-polar', PHE: 'Non-polar', TRP: 'Non-polar', MET: 'Non-polar',
  GLY: 'Polar', SER: 'Polar', THR: 'Polar', CYS: 'Polar', TYR: 'Polar', ASN: 'Polar', GLN: 'Polar',
  ASP: 'Acidic', GLU: 'Acidic',
  LYS: 'Basic', ARG: 'Basic', HIS: 'Basic'
};

const pKaValues: Record<string, number> = {
  'N-term': 8.0, 'C-term': 3.1,
  ASP: 4.1, GLU: 4.1, HIS: 6.0, CYS: 8.3, TYR: 10.1, LYS: 10.8, ARG: 12.5
};

export const calculateAdvancedStats = (atoms: Atom[]): AdvancedStats => {
  const caAtoms = atoms.filter(a => a.name === 'CA');
  const n = caAtoms.length || 1;
  
  let meanX = 0, meanY = 0, meanZ = 0;
  atoms.forEach(a => { meanX += a.x; meanY += a.y; meanZ += a.z; });
  const totalAtoms = atoms.length || 1;
  meanX /= totalAtoms; meanY /= totalAtoms; meanZ /= totalAtoms;
  
  let sqDistSum = 0;
  caAtoms.forEach(a => {
    sqDistSum += Math.pow(a.x - meanX, 2) + Math.pow(a.y - meanY, 2) + Math.pow(a.z - meanZ, 2);
  });
  const radiusOfGyration = Math.sqrt(sqDistSum / n);

  const pca = calculatePCA(caAtoms, meanX, meanY, meanZ);
  const molecularWeight = atoms.reduce((acc, atom) => acc + (atomicMasses[atom.element] || 12.0), 0);

  const counts: Record<string, number> = {};
  caAtoms.forEach(a => counts[a.resName] = (counts[a.resName] || 0) + 1);
  const composition: CompositionData[] = Object.entries(counts).map(([res, count]) => ({
    label: res,
    count,
    percentage: (count / n) * 100,
    category: aaCategories[res] || 'Polar'
  })).sort((a,b) => b.count - a.count);

  const sumPlddt = caAtoms.reduce((acc, atom) => acc + atom.tempFactor, 0);
  const avgPlddt = sumPlddt / n;

  const getNetCharge = (pH: number) => {
    let charge = 0;
    charge += 1 / (1 + Math.pow(10, pH - pKaValues['N-term']));
    charge -= 1 / (1 + Math.pow(10, pKaValues['C-term'] - pH));
    caAtoms.forEach(a => {
      const pka = pKaValues[a.resName];
      if (!pka) return;
      if (['ASP', 'GLU', 'CYS', 'TYR'].includes(a.resName)) charge -= 1 / (1 + Math.pow(10, pka - pH));
      else if (['LYS', 'ARG', 'HIS'].includes(a.resName)) charge += 1 / (1 + Math.pow(10, pH - pka));
    });
    return charge;
  };
  let low = 0, high = 14, pI = 7;
  for (let i = 0; i < 15; i++) {
    pI = (low + high) / 2;
    if (getNetCharge(pI) > 0) low = pI;
    else high = pI;
  }

  const pairDistribution = calculatePairDistribution(caAtoms);
  const ssPropensity = calculateSSPropensity(caAtoms);
  const hBondCount = estimateHBonds(atoms);

  const packingDensity = caAtoms.map((a, i) => {
    let count = 0;
    caAtoms.forEach((b, j) => {
        if (i === j) return;
        const d = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
        if (d < 8.0) count++;
    });
    return { resSeq: parseInt(a.resSeq), count };
  });

  const bFactors = caAtoms.map(a => a.tempFactor);
  const avgB = bFactors.reduce((a, b) => a + b, 0) / bFactors.length;
  const stdB = Math.sqrt(bFactors.reduce((a, b) => a + Math.pow(b - avgB, 2), 0) / bFactors.length) || 1;
  const flexibilityIndex = caAtoms.map(a => ({
    resSeq: parseInt(a.resSeq),
    zScore: (a.tempFactor - avgB) / stdB
  }));

  const planarityDeviations = calculatePlanarity(atoms);

  // New Algorithms
  const conservationScores = calculateConservationScores(caAtoms);
  const pockets = detectPockets(caAtoms, meanX, meanY, meanZ);

  return {
    radiusOfGyration,
    isoelectricPoint: pI,
    netCharge: getNetCharge(7.4),
    avgPlddt,
    molecularWeight,
    pca,
    composition,
    pairDistribution,
    ssPropensity,
    hBondCount,
    packingDensity,
    flexibilityIndex,
    planarityDeviations,
    conservationScores,
    pockets,
    inertiaMoments: pca.eigenvalues,
    shapeClassification: pca.shapeType,
    sasaProfile: caAtoms.map((a, i) => {
      let neighbors = 0;
      caAtoms.forEach((b, j) => {
        if (i === j) return;
        const d = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
        if (d < 10) neighbors++;
      });
      return { resSeq: parseInt(a.resSeq), score: Math.max(0, 15 - neighbors) };
    }),
    chargeProfile: caAtoms.map(a => {
        let c = 0;
        if (['ARG', 'LYS'].includes(a.resName)) c = 1;
        if (['HIS'].includes(a.resName)) c = 0.1;
        if (['ASP', 'GLU'].includes(a.resName)) c = -1;
        return { resSeq: parseInt(a.resSeq), charge: c };
    })
  };
};

const calculateConservationScores = (caAtoms: Atom[]): { resSeq: number, score: number }[] => {
  // First pass: find max neighbors to normalize
  let maxNeighbors = 0;
  const neighborCounts = caAtoms.map((a, i) => {
    let neighbors = 0;
    caAtoms.forEach((b, j) => {
      if (i === j) return;
      const dSq = Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2);
      if (dSq < 64) neighbors++; // 8 Angstrom squared
    });
    if (neighbors > maxNeighbors) maxNeighbors = neighbors;
    return { atom: a, neighbors };
  });

  return neighborCounts.map(({ atom, neighbors }) => {
    // Normalize density 0-1
    let score = neighbors / (maxNeighbors || 1);
    
    // Propensity bonus for conserved residues
    if (['CYS', 'GLY', 'PRO', 'HIS', 'TRP'].includes(atom.resName)) {
      score = Math.min(1.0, score + 0.2);
    }
    
    return { resSeq: parseInt(atom.resSeq), score };
  });
};

const detectPockets = (atoms: Atom[], mx: number, my: number, mz: number): { center: [number, number, number], volume: number }[] => {
  const pockets = [];
  const gridSize = 3.0;
  const range = 25; // Check 25A around center
  
  for (let x = mx - range; x < mx + range; x += gridSize) {
    for (let y = my - range; y < my + range; y += gridSize) {
      for (let z = mz - range; z < mz + range; z += gridSize) {
        let nearbyAtoms = 0;
        let minDist = 999;
        
        atoms.forEach(a => {
           const d = Math.sqrt(Math.pow(x - a.x, 2) + Math.pow(y - a.y, 2) + Math.pow(z - a.z, 2));
           if (d < minDist) minDist = d;
           if (d < 8.0) nearbyAtoms++;
        });

        // A pocket point is void (minDist > 2.0) but surrounded (nearbyAtoms > threshold)
        if (minDist > 2.0 && nearbyAtoms > 5 && nearbyAtoms < 20) {
           pockets.push({ center: [x, y, z] as [number, number, number], volume: gridSize * gridSize * gridSize });
        }
      }
    }
  }
  
  // Aggregate adjacent pocket points (Simplified for brevity: just return points as small volumes)
  // In a full implementation, we would cluster these points.
  return pockets.slice(0, 50); // Limit return for performance
};

export const getConservationColor = (score: number): string => {
  // Smooth gradient from Deep Purple (Low) to Gold (High)
  // Low score = Variable/Exposed = Purple
  // High score = Conserved/Buried = Gold
  
  // Start: #301934 (Deep Purple) -> rgb(48, 25, 52)
  // Mid:   #b91c1c (Red)         -> rgb(185, 28, 28)
  // End:   #FFD700 (Gold)        -> rgb(255, 215, 0)
  
  let r, g, b;
  
  if (score < 0.5) {
      const t = score * 2; // 0 to 1
      r = 48 + (185 - 48) * t;
      g = 25 + (28 - 25) * t;
      b = 52 + (28 - 52) * t;
  } else {
      const t = (score - 0.5) * 2; // 0 to 1
      r = 185 + (255 - 185) * t;
      g = 28 + (215 - 28) * t;
      b = 28 + (0 - 28) * t;
  }
  
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};

const estimateHBonds = (atoms: Atom[]): number => {
    const polarAtoms = atoms.filter(a => a.element === 'N' || a.element === 'O');
    let count = 0;
    for (let i = 0; i < polarAtoms.length; i++) {
        for (let j = i + 1; j < polarAtoms.length; j++) {
            const a1 = polarAtoms[i];
            const a2 = polarAtoms[j];
            if (a1.resSeq === a2.resSeq) continue;
            const distSq = Math.pow(a1.x - a2.x, 2) + Math.pow(a1.y - a2.y, 2) + Math.pow(a1.z - a2.z, 2);
            if (distSq > 6.25 && distSq < 12.25) count++;
        }
    }
    return count;
};

const calculatePlanarity = (atoms: Atom[]): { resSeq: number, angle: number }[] => {
    const caAtoms = atoms.filter(a => a.name === 'CA');
    const results = [];
    for (let i = 1; i < caAtoms.length - 1; i++) {
        const v1 = { x: caAtoms[i].x - caAtoms[i-1].x, y: caAtoms[i].y - caAtoms[i-1].y, z: caAtoms[i].z - caAtoms[i-1].z };
        const v2 = { x: caAtoms[i+1].x - caAtoms[i].x, y: caAtoms[i+1].y - caAtoms[i].y, z: caAtoms[i+1].z - caAtoms[i].z };
        const dot = v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
        const mag1 = Math.sqrt(v1.x*v1.x + v1.y*v1.y + v1.z*v1.z);
        const mag2 = Math.sqrt(v2.x*v2.x + v2.y*v2.y + v2.z*v2.z);
        const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
        results.push({ resSeq: parseInt(caAtoms[i].resSeq), angle });
    }
    return results;
};

const calculatePCA = (atoms: Atom[], mx: number, my: number, mz: number): PCAData => {
  let ixx = 0, iyy = 0, izz = 0, ixy = 0, ixz = 0, iyz = 0;
  atoms.forEach(a => {
    const dx = a.x - mx, dy = a.y - my, dz = a.z - mz;
    ixx += dy * dy + dz * dz;
    iyy += dx * dx + dz * dz;
    izz += dx * dx + dy * dy;
    ixy -= dx * dy;
    ixz -= dx * dz;
    iyz -= dy * dz;
  });
  
  const evals = [ixx, iyy, izz].sort((a, b) => b - a);
  const anisotropy = (evals[0] - evals[2]) / (evals[0] + evals[1] + evals[2]);
  
  let shape: any = 'Spherical';
  const r1 = evals[0] / evals[1], r2 = evals[1] / evals[2];
  if (r1 > 2 && r2 < 1.5) shape = 'Prolate';
  else if (r1 < 1.5 && r2 > 2) shape = 'Oblate';
  else if (r1 > 3) shape = 'Elongated';

  return { eigenvalues: evals, anisotropy, shapeType: shape };
};

const calculatePairDistribution = (atoms: Atom[]) => {
  const bins = 50;
  const maxDist = 60;
  const hist = new Array(bins).fill(0);
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const d = Math.sqrt(Math.pow(atoms[i].x - atoms[j].x, 2) + Math.pow(atoms[i].y - atoms[j].y, 2) + Math.pow(atoms[i].z - atoms[j].z, 2));
      const bin = Math.floor((d / maxDist) * bins);
      if (bin < bins) hist[bin]++;
    }
  }
  return hist.map((f, i) => ({ distance: (i / bins) * maxDist, frequency: f }));
};

const calculateSSPropensity = (caAtoms: Atom[]) => {
    let alpha = 0, beta = 0, coil = 0;
    for (let i = 2; i < caAtoms.length - 2; i++) {
        const d13 = Math.sqrt(Math.pow(caAtoms[i-2].x - caAtoms[i].x, 2) + Math.pow(caAtoms[i-2].y - caAtoms[i].y, 2) + Math.pow(caAtoms[i-2].z - caAtoms[i].z, 2));
        const d14 = Math.sqrt(Math.pow(caAtoms[i-2].x - caAtoms[i+1].x, 2) + Math.pow(caAtoms[i-2].y - caAtoms[i+1].y, 2) + Math.pow(caAtoms[i-2].z - caAtoms[i+1].z, 2));
        if (d13 > 5 && d13 < 6.5 && d14 > 5 && d14 < 7) alpha++;
        else if (d13 > 6.5 && d13 < 9) beta++;
        else coil++;
    }
    const total = (alpha + beta + coil) || 1;
    return { alpha: (alpha/total)*100, beta: (beta/total)*100, coil: (coil/total)*100 };
};

export const calculateDihedrals = (atoms: Atom[]): Dihedral[] => {
  const residues = new Map<number, { N?: Atom, CA?: Atom, C?: Atom, resName: string }>();
  atoms.forEach(atom => {
    const resSeq = parseInt(atom.resSeq);
    if (!residues.has(resSeq)) residues.set(resSeq, { resName: atom.resName });
    const res = residues.get(resSeq)!;
    if (atom.name === 'N') res.N = atom;
    if (atom.name === 'CA') res.CA = atom;
    if (atom.name === 'C') res.C = atom;
  });
  const sortedSeq = Array.from(residues.keys()).sort((a, b) => a - b);
  const result: Dihedral[] = [];
  for (let i = 0; i < sortedSeq.length; i++) {
    const seq = sortedSeq[i];
    const curr = residues.get(seq)!;
    const prev = residues.get(seq - 1);
    const next = residues.get(seq + 1);
    let phi: number | null = null, psi: number | null = null;
    if (prev?.C && curr.N && curr.CA && curr.C) phi = calculateTorsion(prev.C, curr.N, curr.CA, curr.C);
    if (curr.N && curr.CA && curr.C && next?.N) psi = calculateTorsion(curr.N, curr.CA, curr.C, next.N);
    result.push({ resSeq: seq, resName: curr.resName, phi, psi });
  }
  return result;
};

export const calculateContactMap = (atoms: Atom[]): ContactMapData => {
  const caAtoms = atoms.filter(a => a.name === 'CA').sort((a, b) => parseInt(a.resSeq) - parseInt(b.resSeq));
  const size = caAtoms.length;
  const matrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  const labels = caAtoms.map(a => `${a.resName}${a.resSeq}`);
  for (let i = 0; i < size; i++) {
    for (let j = i; j < size; j++) {
      const d = Math.sqrt(Math.pow(caAtoms[i].x - caAtoms[j].x, 2) + Math.pow(caAtoms[i].y - caAtoms[j].y, 2) + Math.pow(caAtoms[i].z - caAtoms[j].z, 2));
      matrix[i][j] = d; matrix[j][i] = d;
    }
  }
  return { matrix, labels, limit: 12 };
};

const calculateTorsion = (a: {x:number,y:number,z:number}, b: {x:number,y:number,z:number}, c: {x:number,y:number,z:number}, d: {x:number,y:number,z:number}): number => {
  const b1 = { x: b.x-a.x, y: b.y-a.y, z: b.z-a.z };
  const b2 = { x: c.x-b.x, y: c.y-b.y, z: c.z-b.z };
  const b3 = { x: d.x-c.x, y: d.y-c.y, z: d.z-c.z };
  const n1 = normalize(cross(b1, b2));
  const n2 = normalize(cross(b2, b3));
  const m1 = cross(n1, normalize(b2));
  const x = n1.x * n2.x + n1.y * n2.y + n1.z * n2.z;
  const y = m1.x * n2.x + m1.y * n2.y + m1.z * n2.z;
  return -Math.atan2(y, x) * (180 / Math.PI);
};

const cross = (v1: any, v2: any) => ({ x: v1.y * v2.z - v1.z * v2.y, y: v1.z * v2.x - v1.x * v2.z, z: v1.x * v2.y - v1.y * v2.x });
const normalize = (v: any) => { const l = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z); return { x: v.x/l, y: v.y/l, z: v.z/l }; };

export const getSequenceHydrophobicity = (atoms: Atom[], windowSize: number = 7): { resSeq: number, val: number, resName: string }[] => {
    const rawData = Array.from(new Map(atoms.filter(a => a.name === 'CA').map(a => [parseInt(a.resSeq), { resName: a.resName, seq: parseInt(a.resSeq) }])).entries())
        .sort((a, b) => a[0] - b[0])
        .map(([seq, data]) => ({ resSeq: seq, resName: data.resName, rawVal: hydrophobicityScale[data.resName] || 0 }));
    
    return rawData.map((d, i) => {
        let sum = 0, count = 0;
        for (let j = i - Math.floor(windowSize/2); j <= i + Math.floor(windowSize/2); j++) {
            if (rawData[j]) { sum += rawData[j].rawVal; count++; }
        }
        return { resSeq: d.resSeq, resName: d.resName, val: sum / count };
    });
};

export const getHydrophobicityColor = (resName: string): string => {
  const value = hydrophobicityScale[resName] || 0;
  const normalized = (value + 4.5) / 9.0;
  const clamped = Math.max(0, Math.min(1, normalized));
  const r = Math.round(clamped * 255);
  const b = Math.round((1 - clamped) * 255);
  return `rgb(${r}, 0, ${b})`;
};

export const hydrophobicityColorMap: Record<string, string> = {};
Object.keys(hydrophobicityScale).forEach(res => { hydrophobicityColorMap[res] = getHydrophobicityColor(res); });
