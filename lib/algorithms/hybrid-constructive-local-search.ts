import { AlgorithmResult, OptimizationPiece, OptimizationPanel, OptimizationSettings, PlacedPiece, CutInstruction, Rectangle } from '../types';
import { splitSpace } from '../utils';

interface Sheet {
  placedPieces: PlacedPiece[];
  availableSpace: Rectangle[];
}

interface OptimizationState {
  sheets: Sheet[];
  currentSheet: number;
  placedPieces: PlacedPiece[];
}

export class HybridConstructiveLocalSearchAlgorithm {
  public readonly name = 'hybrid_constructive_local_search';
  public readonly description = 'Combines constructive placement with local search improvement';
  public readonly supportsRotation = true;
  public readonly supportsMultiSheet = true;
  public readonly estimatedTime = 5000;

  public async execute(pieces: OptimizationPiece[], panels: OptimizationPanel[], settings: OptimizationSettings): Promise<AlgorithmResult> {
    const startTime = Date.now();
    
    if (panels.length === 0) {
      throw new Error('No panels provided');
    }
    
    const panel = panels[0];
    if (!panel) {
      throw new Error('Invalid panel data');
    }
    
    const result = this.runOptimization(pieces, panel, settings);
    const executionTime = Date.now() - startTime;
    
    return {
      ...result,
      executionTime,
      algorithm: this.name
    };
  }

  private runOptimization(pieces: OptimizationPiece[], panel: OptimizationPanel, settings: OptimizationSettings): Omit<AlgorithmResult, 'executionTime' | 'algorithm'> {
    const state: OptimizationState = {
      sheets: [{
        placedPieces: [],
        availableSpace: [{ x: 0, y: 0, width: panel.width, height: panel.height }]
      }],
      currentSheet: 0,
      placedPieces: []
    };

    // Constructive placement phase
    this.constructivePlacement(state, pieces, panel);

    // Local search improvement phase
    this.localSearchImprovement(state, panel);

    const allPlacedPieces = state.sheets.flatMap(sheet => sheet.placedPieces);
    const unusedPieces = pieces.filter(piece => 
      !allPlacedPieces.some(placed => placed.id === piece.id)
    );

    const totalArea = panel.width * panel.height * state.sheets.length;
    const usedArea = allPlacedPieces.reduce((sum, piece) => sum + (piece.width * piece.height), 0);
    const efficiency = usedArea / totalArea;
    const wastedArea = totalArea - usedArea;

    const cuts = this.generateCuts(allPlacedPieces, [panel], settings);

    return {
      placedPieces: allPlacedPieces,
      unusedPieces,
      efficiency,
      totalArea,
      usedArea,
      wastedArea,
      cuts,
      sheetCount: state.sheets.length
    };
  }

  private constructivePlacement(state: OptimizationState, pieces: OptimizationPiece[], panel: OptimizationPanel): void {
    for (const piece of pieces) {
      let placed = false;
      
      // Try to place on current sheet
      if (state.currentSheet < state.sheets.length) {
        const currentSheet = state.sheets[state.currentSheet];
        if (!currentSheet || currentSheet.availableSpace.length === 0 || !currentSheet.availableSpace[0]) continue;
        
        if (this.canPlacePiece(piece, currentSheet.availableSpace[0], false)) {
          const placement = this.placePiece(piece, currentSheet.availableSpace[0], false, state.currentSheet);
          currentSheet.placedPieces.push(placement);
          currentSheet.availableSpace = splitSpace(
            currentSheet.availableSpace,
            currentSheet.availableSpace[0],
            piece.width,
            piece.height,
            0
          );
          placed = true;
        } else if (piece.canRotate && this.canPlacePiece(piece, currentSheet.availableSpace[0], true)) {
          const placement = this.placePiece(piece, currentSheet.availableSpace[0], true, state.currentSheet);
          currentSheet.placedPieces.push(placement);
          currentSheet.availableSpace = splitSpace(
            currentSheet.availableSpace,
            currentSheet.availableSpace[0],
            piece.height,
            piece.width,
            0
          );
          placed = true;
        }
      }
      
      // Try to place on existing sheets
      if (!placed) {
        for (let i = 0; i < state.sheets.length; i++) {
          const sheet = state.sheets[i];
          if (!sheet || sheet.availableSpace.length === 0 || !sheet.availableSpace[0]) continue;
          
          if (this.canPlacePiece(piece, sheet.availableSpace[0], false)) {
            const placement = this.placePiece(piece, sheet.availableSpace[0], false, i);
            sheet.placedPieces.push(placement);
            sheet.availableSpace = splitSpace(
              sheet.availableSpace,
              sheet.availableSpace[0],
              piece.width,
              piece.height,
              0
            );
            placed = true;
            break;
          } else if (piece.canRotate && this.canPlacePiece(piece, sheet.availableSpace[0], true)) {
            const placement = this.placePiece(piece, sheet.availableSpace[0], true, i);
            sheet.placedPieces.push(placement);
            sheet.availableSpace = splitSpace(
              sheet.availableSpace,
              sheet.availableSpace[0],
              piece.height,
              piece.width,
              0
            );
            placed = true;
            break;
          }
        }
      }
      
      // Create new sheet if piece can't be placed
      if (!placed) {
        const newSheet: Sheet = {
          placedPieces: [],
          availableSpace: [{ x: 0, y: 0, width: panel.width, height: panel.height }]
        };
        
        if (newSheet.availableSpace[0] && this.canPlacePiece(piece, newSheet.availableSpace[0], false)) {
          const placement = this.placePiece(piece, newSheet.availableSpace[0], false, state.sheets.length);
          newSheet.placedPieces.push(placement);
          newSheet.availableSpace = splitSpace(
            newSheet.availableSpace,
            newSheet.availableSpace[0],
            piece.width,
            piece.height,
            0
          );
          state.sheets.push(newSheet);
        }
      }
    }
  }

  private localSearchImprovement(state: OptimizationState, panel: OptimizationPanel): void {
    let improved = true;
    let iterations = 0;
    const maxIterations = 100;
    
    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;
      
      // Try to swap pieces between sheets for better efficiency
      for (let i = 0; i < state.sheets.length; i++) {
        for (let j = i + 1; j < state.sheets.length; j++) {
          const sheet1 = state.sheets[i];
          const sheet2 = state.sheets[j];
          
          if (!sheet1 || !sheet2) continue;
          
          for (let k = 0; k < sheet1.placedPieces.length; k++) {
            for (let l = 0; l < sheet2.placedPieces.length; l++) {
              const piece1 = sheet1.placedPieces[k];
              const piece2 = sheet2.placedPieces[l];
              
              if (!piece1 || !piece2) continue;
              
              // Calculate current efficiency
              const currentEfficiency = this.calculateEfficiency([sheet1, sheet2], panel);
              
              // Try swapping
              const newPlacements = [...sheet1.placedPieces, ...sheet2.placedPieces];
              const piece1Index = k;
              const piece2Index = k + sheet1.placedPieces.length;
              
              if (newPlacements[piece1Index] && newPlacements[piece2Index]) {
                [newPlacements[piece1Index].x, newPlacements[piece1Index].y] = [newPlacements[piece2Index].x, newPlacements[piece2Index].y];
                [newPlacements[piece2Index].x, newPlacements[piece2Index].y] = [newPlacements[piece1Index].x, newPlacements[piece1Index].y];
              }
              
              // Check if swap improves efficiency
              const newEfficiency = this.calculateEfficiency([
                { ...sheet1, placedPieces: newPlacements.slice(0, sheet1.placedPieces.length) },
                { ...sheet2, placedPieces: newPlacements.slice(sheet1.placedPieces.length) }
              ], panel);
              
              if (newEfficiency > currentEfficiency) {
                // Apply swap
                [piece1.x, piece1.y] = [piece2.x, piece2.y];
                [piece2.x, piece2.y] = [piece1.x, piece1.y];
                improved = true;
              }
            }
          }
        }
      }
    }
  }

  private canPlacePiece(piece: OptimizationPiece, space: Rectangle, rotated: boolean): boolean {
    if (!space) return false;
    
    const width = rotated ? piece.height : piece.width;
    const height = rotated ? piece.width : piece.height;
    
    return width <= space.width && height <= space.height;
  }

  private placePiece(piece: OptimizationPiece, space: Rectangle, rotated: boolean, sheetNumber: number): PlacedPiece {
    const width = rotated ? piece.height : piece.width;
    const height = rotated ? piece.width : piece.height;
    
    const result: PlacedPiece = {
      id: piece.id,
      x: space.x,
      y: space.y,
      width,
      height,
      rotated,
      sheetNumber
    };
    
    if (piece.label !== undefined) {
      result.label = piece.label;
    }
    
    return result;
  }

  private calculateEfficiency(sheets: Sheet[], panel: OptimizationPanel): number {
    if (sheets.length === 0) return 0;
    
    const totalArea = panel.width * panel.height * sheets.length;
    const usedArea = sheets.reduce((sum, sheet) => 
      sum + sheet.placedPieces.reduce((sheetSum, piece) => sheetSum + (piece.width * piece.height), 0), 0
    );
    
    return usedArea / totalArea;
  }

  private generateCuts(placedPieces: PlacedPiece[], _panels: OptimizationPanel[], settings: OptimizationSettings): CutInstruction[] {
    if (placedPieces.length === 0) return [];
    
    const cuts: CutInstruction[] = [];
    const xPositions = new Set<number>();
    const yPositions = new Set<number>();
    
    // Collect all x and y positions
    for (const piece of placedPieces) {
      xPositions.add(piece.x);
      xPositions.add(piece.x + piece.width);
      yPositions.add(piece.y);
      yPositions.add(piece.y + piece.height);
    }
    
    // Sort positions
    const sortedX = Array.from(xPositions).sort((a, b) => a - b);
    const sortedY = Array.from(yPositions).sort((a, b) => a - b);
    
    // Generate vertical cuts
    for (let i = 1; i < sortedX.length - 1; i++) {
      const current = sortedX[i];
      const previous = sortedX[i - 1];
      if (current !== undefined && previous !== undefined && current - previous > settings.kerf) {
        cuts.push({
          type: 'vertical',
          position: current
        });
      }
    }
    
    // Generate horizontal cuts
    for (let i = 1; i < sortedY.length - 1; i++) {
      const current = sortedY[i];
      const previous = sortedY[i - 1];
      if (current !== undefined && previous !== undefined && current - previous > settings.kerf) {
        cuts.push({
          type: 'horizontal',
          position: current
        });
      }
    }
    
    return cuts;
  }
}