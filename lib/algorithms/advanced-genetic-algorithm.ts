import { Algorithm, AlgorithmResult, PlacedPiece, CutInstruction, Rectangle, OptimizationPiece, OptimizationPanel, OptimizationSettings } from '../types';
import { splitSpace, expandPieces, sortPiecesByPriority } from '../utils';

interface GeneticIndividual {
  placements: PlacedPiece[];
  fitness: number;
  sheetCount: number;
  efficiency: number;
}

export class AdvancedGeneticAlgorithm implements Algorithm {
  name = 'advanced_genetic_algorithm';
  description = 'Genetic algorithm for best quality optimization, longer processing time for maximum efficiency';
  supportsRotation = true;
  supportsMultiSheet = true;
  estimatedTime = 5000;

  private populationSize = 50;
  private generations = 100;


  async execute(pieces: OptimizationPiece[], panels: OptimizationPanel[], settings: OptimizationSettings): Promise<AlgorithmResult> {
    const startTime = Date.now();
    
    try {
      const result = this.runOptimization(pieces, panels, settings);
      const executionTime = Date.now() - startTime;
      
      return {
        ...result,
        executionTime,
        algorithm: this.name
      };
    } catch (error) {
      throw new Error(`Advanced Genetic Algorithm failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private runOptimization(
    pieces: OptimizationPiece[],
    panels: OptimizationPanel[],
    settings: OptimizationSettings
  ): Omit<AlgorithmResult, 'executionTime' | 'algorithm'> {
    if (panels.length === 0) {
      throw new Error('No panels provided for optimization');
    }
    
    const panel = panels[0];
    if (!panel) {
      throw new Error('Invalid panel data');
    }
    const expandedPieces = expandPieces(pieces);
    const sortedPieces = sortPiecesByPriority(expandedPieces);

    // Initialize population
    let population = this.initializePopulation(sortedPieces, panel, settings);

    // Evolution loop
    for (let generation = 0; generation < this.generations; generation++) {
      // Evaluate fitness
      population.forEach(individual => {
        individual.fitness = this.evaluateIndividual(individual.placements, panel).fitness;
      });

      // Sort by fitness
      population.sort((a, b) => b.fitness - a.fitness);

      // Check for convergence
      const bestIndividual = population[0];
      if (bestIndividual && bestIndividual.efficiency > 0.95) {
        break;
      }

      // Evolve population
      population = this.evolvePopulation(population, panel);
    }

    // Get best solution
    const bestSolution = population[0];
    if (!bestSolution) {
      throw new Error('Failed to generate valid solution');
    }

    const cuts = this.generateCuts(bestSolution.placements, panel, settings);

    return {
      placedPieces: bestSolution.placements,
      unusedPieces: [],
      efficiency: bestSolution.efficiency,
      totalArea: panel.height * panel.width,
      usedArea: bestSolution.placements.reduce((sum, piece) => sum + piece.height * piece.width, 0),
      wastedArea: (panel.height * panel.width) - bestSolution.placements.reduce((sum, piece) => sum + piece.height * piece.width, 0),
      cuts,
      sheetCount: bestSolution.sheetCount
    };
  }

  private initializePopulation(pieces: OptimizationPiece[], panel: OptimizationPanel, settings: OptimizationSettings): GeneticIndividual[] {
    const population: GeneticIndividual[] = [];
    
    for (let i = 0; i < this.populationSize; i++) {
      const placements = this.createRandomPlacement(pieces, panel, settings);
      const individual = this.evaluateIndividual(placements, panel);
      population.push(individual);
    }
    
    return population;
  }

  private createRandomPlacement(pieces: OptimizationPiece[], panel: OptimizationPanel, settings: OptimizationSettings): PlacedPiece[] {
    const placements: PlacedPiece[] = [];
    const availableSpaces: Rectangle[] = [{ x: 0, y: 0, height: panel.height, width: panel.width }];

    for (const piece of pieces) {
      let placed = false;
      let spaceIndex = 0;

      while (!placed && spaceIndex < availableSpaces.length) {
        const space = availableSpaces[spaceIndex];
        if (!space) continue;

        // Try to place piece
        if (piece.canRotate && Math.random() > 0.5) {
          placed = this.tryPlacePiece(piece, space, true, settings, placements, availableSpaces, spaceIndex);
        } else {
          placed = this.tryPlacePiece(piece, space, false, settings, placements, availableSpaces, spaceIndex);
        }

        if (!placed) {
          spaceIndex++;
        }
      }

      if (!placed) {
        // Create new sheet if needed
        const newSheet: Rectangle = { x: 0, y: 0, height: panel.height, width: panel.width };
        this.tryPlacePiece(piece, newSheet, false, settings, placements, availableSpaces, availableSpaces.length);
      }
    }

    return placements;
  }

  private tryPlacePiece(
    piece: OptimizationPiece,
    space: Rectangle,
    rotated: boolean,
    settings: OptimizationSettings,
    placements: PlacedPiece[],
    availableSpaces: Rectangle[],
    spaceIndex: number
  ): boolean {
            const pieceHeight = rotated ? piece.width : piece.height;
        const pieceWidth = rotated ? piece.height : piece.width;

          if (pieceHeight <= space.height && pieceWidth <= space.width) {
              const placedPiece: PlacedPiece = {
          id: piece.id,
          x: space.x,
          y: space.y,
          height: pieceHeight,
          width: pieceWidth,
          rotated,
          sheetNumber: 0
        };

      placements.push(placedPiece);

              // Split remaining space
        const newSpaces = splitSpace([space], space, pieceWidth, pieceHeight, settings.kerf);
      availableSpaces.splice(spaceIndex, 1, ...newSpaces);

      return true;
    }

    return false;
  }



  private evaluateIndividual(placements: PlacedPiece[], panel: OptimizationPanel): GeneticIndividual {
    if (placements.length === 0) {
      return { placements: [], fitness: 0, sheetCount: 0, efficiency: 0 };
    }

    const totalArea = panel.height * panel.width;
            const usedArea = placements.reduce((sum, piece) => sum + piece.height * piece.width, 0);
    const efficiency = usedArea / totalArea;

    // Calculate sheet count (simplified)
    const sheetCount = Math.ceil(usedArea / totalArea);

    // Fitness function: balance between efficiency and sheet count
    const fitness = efficiency * 0.8 + (1 / sheetCount) * 0.2;

    return { placements, fitness, sheetCount, efficiency };
  }

  private evolvePopulation(population: GeneticIndividual[], panel: OptimizationPanel): GeneticIndividual[] {
    const newPopulation: GeneticIndividual[] = [];
    
    // Elitism: keep the best individual
    const bestIndividual = population.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );
    newPopulation.push({ ...bestIndividual });
    
    // Generate new individuals through crossover and mutation
    while (newPopulation.length < population.length) {
      const parent1 = this.selectParent(population);
      const parent2 = this.selectParent(population);
      
      if (parent1 && parent2) {
        const child = this.crossover(parent1, parent2, panel);
        this.mutate(child, panel);
        newPopulation.push(child);
      }
    }
    
    return newPopulation;
  }

  private selectParent(population: GeneticIndividual[]): GeneticIndividual {
    // Tournament selection
    const tournamentSize = 3;
    let best: GeneticIndividual | null = null;

    for (let i = 0; i < tournamentSize; i++) {
      const candidate = population[Math.floor(Math.random() * population.length)];
      if (candidate && (!best || candidate.fitness > best.fitness)) {
        best = candidate;
      }
    }

    if (!best) {
      throw new Error('Failed to select parent');
    }

    return best;
  }

  private crossover(parent1: GeneticIndividual, parent2: GeneticIndividual, panel: OptimizationPanel): GeneticIndividual {
    const crossoverPoint = Math.floor(Math.random() * parent1.placements.length);
    
    const childPlacements = [
      ...parent1.placements.slice(0, crossoverPoint),
      ...parent2.placements.slice(crossoverPoint)
    ];

    // Remove duplicates and validate
    const uniquePlacements = this.removeDuplicatePlacements(childPlacements);
    const validPlacements = this.validatePlacements(uniquePlacements, panel);

    return this.evaluateIndividual(validPlacements, panel);
  }

  private mutate(individual: GeneticIndividual, panel: OptimizationPanel): void {
    const placements = individual.placements;
    
    // Swap mutation
    if (placements.length > 1 && Math.random() < 0.3) {
      const i = Math.floor(Math.random() * placements.length);
      const j = Math.floor(Math.random() * placements.length);
      if (i !== j && placements[i] && placements[j]) {
        [placements[i], placements[j]] = [placements[j], placements[i]];
      }
    }

    // Rotation mutation
    for (const piece of placements) {
      if (piece && Math.random() < 0.1) {
        if (piece.rotated !== undefined) {
          piece.rotated = !piece.rotated;
          [piece.height, piece.width] = [piece.width, piece.height];
        }
      }
    }

    // Position mutation
    for (const piece of placements) {
      if (piece && Math.random() < 0.05) {
        piece.x = Math.max(0, piece.x + (Math.random() - 0.5) * 10);
        piece.y = Math.max(0, piece.y + (Math.random() - 0.5) * 10);
      }
    }

    // Re-evaluate after mutation
    const newEvaluation = this.evaluateIndividual(placements, panel);
    individual.fitness = newEvaluation.fitness;
    individual.efficiency = newEvaluation.efficiency;
    individual.sheetCount = newEvaluation.sheetCount;
  }

  private removeDuplicatePlacements(placements: PlacedPiece[]): PlacedPiece[] {
    const seen = new Set<string>();
    return placements.filter(piece => {
      if (!piece) return false;
      const key = `${piece.id}-${piece.x}-${piece.y}-${piece.rotated}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private validatePlacements(placements: PlacedPiece[], panel: OptimizationPanel): PlacedPiece[] {
    const validPlacements: PlacedPiece[] = [];

    for (const piece of placements) {
      if (!piece) continue;

      // Check bounds
      if (piece.x < 0 || piece.y < 0 || 
          piece.x + piece.width > panel.width || 
          piece.y + piece.width > panel.width) {
        continue;
      }

      // Check overlap with other pieces
      let hasOverlap = false;
      for (const other of validPlacements) {
        if (this.piecesOverlap(piece, other)) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        validPlacements.push(piece);
      }
    }

    return validPlacements;
  }

  private piecesOverlap(piece1: PlacedPiece, piece2: PlacedPiece): boolean {
    return !(piece1.x + piece1.width <= piece2.x ||
             piece2.x + piece2.width <= piece1.x ||
             piece1.y + piece1.height <= piece2.y ||
             piece2.y + piece2.height <= piece1.y);
  }

  private generateCuts(placements: PlacedPiece[], panel: OptimizationPanel, settings: OptimizationSettings): CutInstruction[] {
    const cuts: CutInstruction[] = [];

    // Generate horizontal cuts
    const yPositions = new Set<number>();
    yPositions.add(0);
    yPositions.add(panel.height);

    for (const piece of placements) {
      if (piece) {
        yPositions.add(piece.y);
        yPositions.add(piece.y + piece.height);
      }
    }

    const sortedY = Array.from(yPositions).sort((a, b) => a - b);
    for (let i = 1; i < sortedY.length; i++) {
      const current = sortedY[i];
      const previous = sortedY[i - 1];
      if (current !== undefined && previous !== undefined && current - previous > settings.kerf) {
        cuts.push({
          type: 'horizontal',
          position: previous + (current - previous) / 2,
          sheetNumber: 0
        });
      }
    }

    // Generate vertical cuts
    const xPositions = new Set<number>();
    xPositions.add(0);
          xPositions.add(panel.width);

    for (const piece of placements) {
      if (piece) {
        xPositions.add(piece.x);
        xPositions.add(piece.x + piece.width);
      }
    }

    const sortedX = Array.from(xPositions).sort((a, b) => a - b);
    for (let i = 1; i < sortedX.length; i++) {
      const current = sortedX[i];
      const previous = sortedX[i - 1];
      if (current !== undefined && previous !== undefined && current - previous > settings.kerf) {
        cuts.push({
          type: 'vertical',
          position: previous + (current - previous) / 2,
          sheetNumber: 0
        });
      }
    }

    return cuts;
  }
}