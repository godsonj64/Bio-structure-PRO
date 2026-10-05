
import { Prediction, UniProtResult, AlphaMissenseData } from '../types';

export const fetchAlphaFoldPrediction = async (accession: string): Promise<Prediction[]> => {
  const cleanId = accession.trim();
  
  // If it's a 4-letter alphanumeric string (e.g. 6M0J, 1TUP, 2HYY), try RCSB or AlphaFold
  const isPdbId = /^[0-9][a-zA-Z0-9]{3}$/i.test(cleanId);
  
  try {
    const url = `https://alphafold.ebi.ac.uk/api/prediction/${cleanId}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const mapItem = (item: any): Prediction => ({
        ...item,
        amUrl: item.amAnnotationsUrl || item.am_annotations_url || item.amUrl,
        amAnnotationsUrl: item.amAnnotationsUrl || item.am_annotations_url || item.amUrl,
        paeDocUrl: item.paeDocUrl,
        paeImageUrl: item.paeImageUrl,
        globalMetricValue: item.globalMetricValue,
        fractionPlddtVeryHigh: item.fractionPlddtVeryHigh,
        fractionPlddtConfident: item.fractionPlddtConfident,
        fractionPlddtLow: item.fractionPlddtLow,
        fractionPlddtVeryLow: item.fractionPlddtVeryLow,
        isComplex: item.isComplex || false,
      });

      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapItem);
      } else if (data && data.pdbUrl) {
        return [mapItem(data)];
      }
    }
  } catch (e) {
    // proceed to fallback
  }

  // Fallback: RCSB PDB Repository for multimers, complexes & benchmark assemblies
  const rcsbUrl = `https://files.rcsb.org/download/${cleanId.toUpperCase()}.pdb`;
  const rcsbCheck = await fetch(rcsbUrl);
  if (rcsbCheck.ok) {
    return [{
      entryId: cleanId.toUpperCase(),
      gene: cleanId.toUpperCase(),
      uniprotAccession: cleanId.toUpperCase(),
      uniprotId: cleanId.toUpperCase(),
      uniprotDescription: `${cleanId.toUpperCase()} Complex & Multimer Assembly`,
      taxId: 9606,
      organismScientificName: 'Biomolecular Complex',
      uniprotSequence: '',
      modelCreatedDate: new Date().toISOString().slice(0, 10),
      latestVersion: 1,
      allVersions: [1],
      cifUrl: '',
      bcifUrl: '',
      pdbUrl: rcsbUrl,
      paeImageUrl: '',
      paeDocUrl: '',
      amUrl: '',
      plddt: [],
      coverage: [],
      isComplex: true,
    }];
  }

  throw new Error(`No AlphaFold or PDB structural coordinates found for '${cleanId}'.`);
};

export const fetchPdbContent = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDB file: ${response.statusText}`);
  }
  return await response.text();
};

export const fetchAlphaFoldPAE = async (url: string): Promise<number[][] | null> => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const json = await response.json();
    if (Array.isArray(json) && json[0]?.predicted_aligned_error) {
      return json[0].predicted_aligned_error;
    }
    if (json.predicted_aligned_error) {
      return json.predicted_aligned_error;
    }
    if (json.distance) {
      return json.distance;
    }
    return null;
  } catch (e) {
    console.warn("Failed to fetch PAE matrix JSON", e);
    return null;
  }
};

export interface UniProtSearchResponse {
  results: UniProtResult[];
  nextCursor?: string;
}

export const searchUniProt = async (query: string, cursor?: string): Promise<UniProtSearchResponse> => {
  const baseUrl = `https://rest.uniprot.org/uniprotkb/search`;
  const params = new URLSearchParams({
    query,
    format: 'json',
    size: '50',
  });
  if (cursor) {
    params.append('cursor', cursor);
  }

  const response = await fetch(`${baseUrl}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`UniProt API request failed: ${response.status}`);
  }
  const data = await response.json();
  return {
    results: data.results || [],
    nextCursor: data.nextCursor
  };
};

export const fetchUniProtDetails = async (accession: string): Promise<UniProtResult> => {
  const response = await fetch(`https://rest.uniprot.org/uniprotkb/${accession.trim()}`);
  if (!response.ok) {
    throw new Error(`UniProt Details request failed: ${response.status}`);
  }
  return await response.json();
};

export const fetchAlphaMissenseData = async (url: string): Promise<AlphaMissenseData[]> => {
  if (!url) return [];
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const text = await response.text();
    const lines = text.split('\n');
    const data: AlphaMissenseData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length < 3) continue;

      let variant = '';
      let score = 0;
      let classification = '';

      if (parts.length === 3) {
        // Format: protein_variant,am_pathogenicity,am_class
        variant = parts[0];
        score = parseFloat(parts[1]);
        classification = parts[2];
      } else {
        // Format: uniprot_id,protein_variant,am_pathogenicity,am_class
        variant = parts[1];
        score = parseFloat(parts[2]);
        classification = parts[3];
      }

      const match = variant.match(/^([A-Z])(\d+)([A-Z])$/);
      if (match && !isNaN(score)) {
        let fullClass = classification;
        if (classification === 'LPath' || classification === 'likely_pathogenic') fullClass = 'Likely Pathogenic';
        else if (classification === 'LBen' || classification === 'likely_benign') fullClass = 'Likely Benign';
        else if (classification === 'Amb' || classification === 'ambiguous') fullClass = 'Ambiguous';

        data.push({
          variant,
          score,
          classification: fullClass,
          wildtype: match[1],
          position: parseInt(match[2]),
          mutation: match[3]
        });
      }
    }
    return data;
  } catch (e) {
    console.warn("Failed to fetch AlphaMissense data", e);
    return [];
  }
};
