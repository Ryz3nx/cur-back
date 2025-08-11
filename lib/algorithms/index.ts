import { Algorithm, OptimizationRequest, AlgorithmResult } from '../types';
import { BeamSearchGuillotineAlgorithm } from './beam-search-guillotine';
import { HybridConstructiveLocalSearchAlgorithm } from './hybrid-constructive-local-search';
import { AdvancedGeneticAlgorithm } from './advanced-genetic-algorithm';
import { FirstFitDecreasingAlgorithm } from './first-fit-decreasing';

export class AlgorithmManager {
  private algorithms: Map<string, Algorithm> = new Map();
  private defaultAlgorithm = 'beam_search_guillotine';

  constructor() {
    this.registerAlgorithm(new BeamSearchGuillotineAlgorithm());
    this.registerAlgorithm(new HybridConstructiveLocalSearchAlgorithm());
    this.registerAlgorithm(new AdvancedGeneticAlgorithm());
    this.registerAlgorithm(new FirstFitDecreasingAlgorithm());
  }

  registerAlgorithm(algorithm: Algorithm): void {
    this.algorithms.set(algorithm.name, algorithm);
  }

  getAlgorithm(name: string): Algorithm | undefined {
    return this.algorithms.get(name);
  }

  getAvailableAlgorithms(): string[] {
    return Array.from(this.algorithms.keys());
  }

  getDefaultAlgorithm(): string {
    return this.defaultAlgorithm;
  }

  getAlgorithmDescriptions(): Record<string, string> {
    const descriptions: Record<string, string> = {};
    this.algorithms.forEach((algorithm, name) => {
      descriptions[name] = algorithm.description;
    });
    return descriptions;
  }

  async executeAlgorithm(
    algorithmName: string, 
    request: OptimizationRequest
  ): Promise<AlgorithmResult> {
    const algorithm = this.getAlgorithm(algorithmName);
    if (!algorithm) {
      throw new Error(`Algorithm '${algorithmName}' not found`);
    }

    // Validate algorithm compatibility with request
    this.validateAlgorithmCompatibility(algorithm, request);

    try {
      return await algorithm.execute(request.pieces, request.panels, request.settings);
    } catch (error) {
      throw new Error(`Algorithm execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateAlgorithmCompatibility(algorithm: Algorithm, request: OptimizationRequest): void {
    const { pieces, panels } = request;
  
    if (panels.length === 0) {
      throw new Error('No panels provided');
    }
    
    const panel = panels[0];
    if (!panel) {
      throw new Error('Invalid panel data');
    }
  


    // Check rotation support
    const hasRotationRequest = pieces.some(piece => piece.canRotate);
    if (hasRotationRequest && !algorithm.supportsRotation) {
      throw new Error(`Algorithm '${algorithm.name}' does not support piece rotation`);
    }

    // Check multi-sheet support
    const totalPieceArea = pieces.reduce((sum, piece) => sum + (piece.height * piece.width * piece.quantity), 0);
    const panelArea = panel.height * panel.width;
    const needsMultipleSheets = totalPieceArea > panelArea * 0.8; // Estimate if multiple sheets needed
    
    if (needsMultipleSheets && !algorithm.supportsMultiSheet) {
      throw new Error(`Algorithm '${algorithm.name}' does not support multiple sheets`);
    }
  }

  getAlgorithmPriority(): string[] {
    return [
      'beam_search_guillotine',
      'hybrid_constructive_local_search',
      'first_fit_decreasing'
    ];
  }

  async executeWithFallback(request: OptimizationRequest): Promise<AlgorithmResult> {
    const priorityOrder = this.getAlgorithmPriority();
    
    for (const algorithmName of priorityOrder) {
      try {
        return await this.executeAlgorithm(algorithmName, request);
      } catch (error) {
        console.warn(`Algorithm '${algorithmName}' failed, trying next: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }
    
    throw new Error('All algorithms failed to execute');
  }

  getAlgorithmMetadata(): Array<{
    name: string;
    description: string;
    supportsRotation: boolean;
    supportsMultiSheet: boolean;
    estimatedTime: number;
  }> {
    return Array.from(this.algorithms.values()).map(algorithm => ({
      name: algorithm.name,
      description: algorithm.description,
      supportsRotation: algorithm.supportsRotation,
      supportsMultiSheet: algorithm.supportsMultiSheet,
      estimatedTime: algorithm.estimatedTime
    }));
  }
}

// Export singleton instance
export const algorithmManager = new AlgorithmManager();