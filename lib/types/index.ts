// Core optimization interfaces
export interface OptimizationRequest {
  pieces: OptimizationPiece[];
  panels: OptimizationPanel[]; // Changed from panel to panels array
  settings: OptimizationSettings;
  algorithm?: string; // Default: 'beam_search_guillotine'
}

export interface OptimizationPiece {
  id: string;
  width: number;
  height: number; // Changed from length to height
  quantity: number;
  label?: string;
  canRotate?: boolean;
  mustFollowGrain?: boolean;
  priority?: number;
}

export interface OptimizationPanel {
  width: number;
  height: number; // Changed from length to height
  grainDirection?: 'horizontal' | 'vertical';
}

export interface OptimizationSettings {
  kerf: number; // Blade thickness
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  cutPreference: 'long' | 'short' | 'hybrid' | 'minimize_cuts';
  timeout?: number; // Max processing time (default: 30000ms)
  algorithm?: string; // Added algorithm property
}

export interface OptimizationResponse {
  success: boolean;
  placedPieces: PlacedPiece[];
  unusedPieces: OptimizationPiece[];
  efficiency: number; // 0-1 (percentage of material used)
  totalArea: number;
  usedArea: number;
  wastedArea: number;
  cuts?: CutInstruction[];
  metadata: {
    algorithm: string;
    duration: number; // Processing time in ms
    reasoning?: string;
    sheetCount?: number;
  };
  error?: string;
}

export interface PlacedPiece {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number; // Changed from length to height
  rotated: boolean;
  sheetNumber?: number;
  color?: string;
  label?: string;
}

export interface CutInstruction {
  type: 'horizontal' | 'vertical';
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  position?: number; // For guillotine cuts
  sheetNumber?: number;
}

// Algorithm interfaces
export interface AlgorithmResult {
  placedPieces: PlacedPiece[];
  unusedPieces: OptimizationPiece[];
  efficiency: number;
  totalArea: number;
  usedArea: number;
  wastedArea: number;
  cuts: CutInstruction[];
  sheetCount: number;
  executionTime: number; // Added executionTime property
  algorithm: string; // Added algorithm property
  metadata?: {
    algorithm: string;
    duration: number;
    reasoning?: string;
  };
}

export interface Algorithm {
  name: string;
  description: string;
  execute: (pieces: OptimizationPiece[], panels: OptimizationPanel[], settings: OptimizationSettings) => Promise<AlgorithmResult>;
  supportsRotation: boolean;
  supportsMultiSheet: boolean;
  estimatedTime: number; // ms
}

// Internal optimization state
export interface OptimizationState {
  pieces: OptimizationPiece[];
  settings: OptimizationSettings;
  sheets: Sheet[];
  placedPieces: PlacedPiece[];
  unusedPieces: OptimizationPiece[];
  currentSheet: number;
}

export interface Sheet {
  id: number;
  width: number;
  height: number; // Changed from length to height
  placedPieces: PlacedPiece[];
  availableSpace: Rectangle[];
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number; // Changed from length to height
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  algorithms: number;
  lastOptimization?: number;
}

export interface AlgorithmsResponse {
  algorithms: string[];
  default: string;
  descriptions: Record<string, string>;
}

export interface OptimizationError {
  code: string;
  message: string;
  details?: any;
}

// Utility types
export type Point = { x: number; y: number };
export type Dimension = { length: number; width: number };
export type Placement = { x: number; y: number; rotated: boolean };