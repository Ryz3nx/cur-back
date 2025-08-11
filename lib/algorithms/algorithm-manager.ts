import { Algorithm, OptimizationRequest, AlgorithmResult } from "../types";
import { BeamSearchGuillotineAlgorithm } from "./beam-search-guillotine";
import { HybridConstructiveLocalSearchAlgorithm } from "./hybrid-constructive-local-search";
import { FirstFitDecreasingAlgorithm } from "./first-fit-decreasing";
import { AdvancedGeneticAlgorithm } from "./advanced-genetic-algorithm";

export class AlgorithmManager {
  private static instance: AlgorithmManager;
  private algorithms: Map<string, Algorithm> = new Map();
  private algorithmPriority: string[] = [];

  private constructor() {
    this.registerDefaultAlgorithms();
  }

  public static getInstance(): AlgorithmManager {
    if (!AlgorithmManager.instance) {
      AlgorithmManager.instance = new AlgorithmManager();
    }
    return AlgorithmManager.instance;
  }

  private registerDefaultAlgorithms(): void {
    // Register algorithms in priority order
    const beamSearch = new BeamSearchGuillotineAlgorithm();
    const hybrid = new HybridConstructiveLocalSearchAlgorithm();
    const firstFit = new FirstFitDecreasingAlgorithm();
    const genetic = new AdvancedGeneticAlgorithm();

    this.algorithms.set(beamSearch.name, beamSearch);
    this.algorithms.set(hybrid.name, hybrid);
    this.algorithms.set(firstFit.name, firstFit);
    this.algorithms.set(genetic.name, genetic);

    // Set priority order for fallback
    this.algorithmPriority = [
      beamSearch.name,
      hybrid.name,
      firstFit.name,
      genetic.name
    ];
  }

  public getAlgorithm(name: string): Algorithm | undefined {
    return this.algorithms.get(name);
  }

  public getAllAlgorithms(): Algorithm[] {
    return Array.from(this.algorithms.values());
  }

  public getDefaultAlgorithm(): Algorithm | undefined {
    if (this.algorithmPriority.length === 0) {
      return undefined;
    }
    
    const defaultName = this.algorithmPriority[0];
    if (!defaultName) {
      return undefined;
    }
    
    return this.algorithms.get(defaultName);
  }

  public async executeWithFallback(
    request: OptimizationRequest,
    preferredAlgorithm?: string
  ): Promise<AlgorithmResult> {
    let algorithm: Algorithm | undefined;
    
    if (preferredAlgorithm) {
      algorithm = this.algorithms.get(preferredAlgorithm);
    }
    
    if (!algorithm) {
      algorithm = this.getDefaultAlgorithm();
    }
    
    if (!algorithm) {
      throw new Error('No algorithms available');
    }
    
    try {
      return await algorithm.execute(request.pieces, request.panels, request.settings);
    } catch (error) {
      // Try fallback algorithms
      for (const fallbackName of this.algorithmPriority.slice(1)) {
        if (!fallbackName) continue;
        
        const fallbackAlgorithm = this.algorithms.get(fallbackName);
        if (fallbackAlgorithm) {
          try {
            return await fallbackAlgorithm.execute(request.pieces, request.panels, request.settings);
          } catch (fallbackError) {
            console.warn(`Fallback algorithm ${fallbackName} failed:`, fallbackError);
            continue;
          }
        }
      }
      
      throw new Error(`All algorithms failed. Last error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public getAlgorithmMetadata(): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    for (const [name, algorithm] of this.algorithms) {
      metadata[name] = {
        supportsRotation: algorithm.supportsRotation,
        supportsMultiSheet: algorithm.supportsMultiSheet,
        estimatedTime: algorithm.estimatedTime,
        description: algorithm.description
      };
    }
    
    return metadata;
  }
}