
# BioStructure Pro: Integrated In-Silico Platform for Structural Genomics

## Abstract
**BioStructure Pro** is a high-performance, integrated web environment designed for the interactive visualization and computational analysis of protein tertiary structures. By synthesizing AlphaFold v2.0 predicted models, UniProtKB biological metadata, and real-time biophysical algorithms, the platform bridges the gap between raw atomic coordinates and functional genomic insight, offering researchers a comprehensive in-silico analytical pipeline.

---

## 1. System Architecture

The application is built on a modern reactive stack ensuring low-latency performance for complex molecular rendering:
*   **Frontend Kernel**: React 19 + TypeScript 5.8.
*   **Visualization Engine**: WebGL-accelerated rendering via `3Dmol.js` and `NGL.js`.
*   **Styling**: Tailwind CSS with a custom "Midnight Clinical" design system.
*   **Data Sources**: 
    *   **AlphaFold DB API**: For predicted PDB structures and PAE metrics.
    *   **UniProtKB REST API**: For sequence features, variants (SNPs), and taxonomy.

---

## 2. Computational Methodology

BioStructure Pro implements several heuristic algorithms directly in the browser to estimate physicochemical properties without requiring backend simulation servers.

### 2.1 Evolutionary Conservation Simulation
Functional hotspots are approximated using a structural packing heuristic that simulates evolutionary constraint.
*   **Logic**: Residues buried in the core or involved in dense packing networks are statistically more likely to be conserved than solvent-exposed loops.
*   **Heuristic Equation**:
    $$S_i = \min\left(1.0, \frac{N_{neighbors}}{20} + \delta_{type}\right)$$
    *   $N_{neighbors}$: Count of $C\alpha$ atoms within a Euclidean distance of $8.0\AA$.
    *   $\delta_{type}$: Propensity bias ($+0.3$) applied to residues historically critical for folding (CYS, GLY, PRO, HIS, TRP).
*   **Visualization**: Mapped to a Deep Purple ($S \approx 0$) to Gold ($S \approx 1$) gradient on the 3D structure.

### 2.2 Molecular Topography (Cavity Detection)
Solvent-accessible binding pockets are identified using a grid-based voxel probe search.
*   **Algorithm**:
    1.  Define a $3.0\AA$ resolution grid centered on the molecule's geometric centroid ($R = 25\AA$).
    2.  For each voxel $V(x,y,z)$, calculate distance $d_{min}$ to the nearest atomic center.
    3.  **Void Condition**: $d_{min} > 2.0\AA$ (Voxel is not clashing with atoms).
    4.  **Enclosure Condition**: $5 < N_{surrounding\_atoms} < 20$ (Voxel is surrounded by atoms within $8\AA$).
*   **Output**: Aggregated volumes ($\AA^3$) displayed in the *Genomics* module.

### 2.3 Morphological Anisotropy (PCA)
Global shape classification is derived via Principal Component Analysis (PCA) of the atomic gyration tensor.
*   **Covariance Matrix**: Computed from centered atomic coordinates.
*   **Eigen-Decomposition**: Yields eigenvalues $\lambda_1 \ge \lambda_2 \ge \lambda_3$ representing the principal axes of inertia.
*   **Relative Anisotropy ($\kappa^2$)**:
    $$\kappa^2 = \frac{\lambda_1 - \lambda_3}{\lambda_1 + \lambda_2 + \lambda_3}$$
*   **Shape Class**: Derived from eigen-ratios (e.g., $\lambda_1/\lambda_2 > 2 \rightarrow$ Prolate).

### 2.4 Electrostatics & Biophysics
*   **Net Charge**: Calculated using the Henderson-Hasselbalch equation at physiological pH (7.4) summing partial charges of ionizable groups (ASP, GLU, LYS, ARG, HIS, CYS, TYR, N-term, C-term).
*   **Hydrophobicity**: Kyte-Doolittle scale mapped via a 7-residue sliding window smoothing function.

---

## 3. Feature Suite

### 3.1 Interactive 3D Visualization
*   **Representations**: Cartoon (Ribbon), Stick (Bonds), Sphere (Space-filling), Line (Wireframe).
*   **Smart Coloring**:
    *   **pLDDT Confidence**: Applies AlphaFold confidence scores (Blue >90 to Orange <50). Includes thresholding logic to desaturate/ghost low-confidence regions.
    *   **Evolutionary Conservation**: The computed heuristic described in §2.1.
    *   **Hydrophobicity**: Color-coded residue properties.
*   **Overlays**: Real-time Side-Chain toggle and VDW Surface mesh generation.

### 3.2 Analytical Dashboard Modules
1.  **Overview**: Basic stats (Atom count, H-Bonds, Helices) and metadata registry.
2.  **Biophysics**: $R_g$, Molecular Weight ($kDa$), Isoelectric Point (pI), Composition charts.
3.  **Genomics & Variants**:
    *   **Evolutionary Conservation**: Residue packing constraint scoring.
    *   **AlphaMissense Landscape**: DeepMind variant pathogenicity classification.
    *   **Variant Registry**: Maps UniProt natural SNP and mutagenesis data to sequence positions.
    *   **Topography**: Pocket volume distribution and cavity detection.
4.  **Morphology**: PCA Eigen-value maps, Shape Anisotropy, Pair Distribution Function $g(r)$.
5.  **Topology**: Ramachandran Plots ($\phi/\psi$), Contact Maps ($N \times N$ distance matrix), Packing Density profiles.
6.  **Proteomics**: Primary sequence scanning with interactive hydrophobicity plots.

---

## 4. Installation

### Prerequisites
*   Node.js v16.0.0 or higher.
*   NPM or Yarn package manager.

### Local Development Setup
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/godsonj64/biostructure-pro.git
    cd biostructure-pro
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Configuration**:
    Create a `.env` file in the root directory to enable AI features:
    ```env
    API_KEY=your_google_genai_api_key
    ```

4.  **Launch Application**:
    ```bash
    npm start
    ```
    Access the platform at `http://localhost:3000`.

## License
Distributed under the MIT License. See `LICENSE` for more information.
