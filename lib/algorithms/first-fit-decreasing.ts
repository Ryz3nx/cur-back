import { Algorithm, AlgorithmResult, OptimizationPiece, OptimizationPanel, OptimizationSettings, PlacedPiece, CutInstruction, Rectangle } from '../types';
import { expandPieces, sortPiecesByPriority } from '../utils';

interface Sheet {
  placedPieces: PlacedPiece[];
  availableSpace: Rectangle[];
}

export class FirstFitDecreasingAlgorithm implements Algorithm {
  public readonly name = "first_fit_decreasing";
  public readonly description = "Fast first-fit decreasing algorithm without rotation support";
  public readonly supportsRotation = false;
  public readonly supportsMultiSheet = true;
  public readonly estimatedTime = 100; // ms

  public async execute(pieces: OptimizationPiece[], panels: OptimizationPanel[], settings: OptimizationSettings): Promise<AlgorithmResult> {
    const startTime = Date.now();
    
    if (panels.length === 0) {
      throw new Error('No panels provided');
    }
    
    const panel = panels[0];
    if (!panel) {
      throw new Error('Invalid panel data');
    }

    const expandedPieces = expandPieces(pieces);
    const sortedPieces = sortPiecesByPriority(expandedPieces);
    
    const result = this.runOptimization(sortedPieces, panel, settings);
    
    return {
      ...result,
      executionTime: Date.now() - startTime,
      algorithm: this.name
    };
  }

  private runOptimization(pieces: OptimizationPiece[], panel: OptimizationPanel, settings: OptimizationSettings): Omit<AlgorithmResult, 'executionTime' | 'algorithm'> {
    const sortedPieces = [...pieces].sort((a, b) => (b.width * b.height) - (a.width * a.height));
    const sheets: Sheet[] = [{
      placedPieces: [],
      availableSpace: [{ x: 0, y: 0, width: panel.width, height: panel.height }]
    }];
    
    for (const piece of sortedPieces) {
      let placed = false;
      
      // Try to place on existing sheets
      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        if (!sheet) continue;
        
        const bestFit = this.findBestFit(piece, sheet.availableSpace, false);
        
        if (bestFit) {
          const placedPiece: PlacedPiece = {
            id: piece.id,
            x: bestFit.x,
            y: bestFit.y,
            width: bestFit.width,
            height: bestFit.height,
            rotated: false,
            sheetNumber: i
          };
          
          if (piece.label !== undefined) {
            placedPiece.label = piece.label;
          }
          
          sheet.placedPieces.push(placedPiece);
          sheet.availableSpace = this.splitSpace(sheet.availableSpace, bestFit, piece.width, piece.height, settings.kerf);
          placed = true;
          break;
        }
        
        // Try with rotation if supported
        if (piece.canRotate) {
          const bestFitRotated = this.findBestFit(piece, sheet.availableSpace, true);
          
          if (bestFitRotated) {
            const placedPiece: PlacedPiece = {
              id: piece.id,
              x: bestFitRotated.x,
              y: bestFitRotated.y,
              width: bestFitRotated.width,
              height: bestFitRotated.height,
              rotated: true,
              sheetNumber: i
            };
            
            if (piece.label !== undefined) {
              placedPiece.label = piece.label;
            }
            
            sheet.placedPieces.push(placedPiece);
            sheet.availableSpace = this.splitSpace(sheet.availableSpace, bestFitRotated, piece.height, piece.width, settings.kerf);
            placed = true;
            break;
          }
        }
      }
      
      // If piece couldn't be placed, create new sheet
      if (!placed) {
        const newSheet: Sheet = {
          placedPieces: [],
          availableSpace: [{ x: 0, y: 0, width: panel.width, height: panel.height }]
        };
        
        const bestFit = this.findBestFit(piece, newSheet.availableSpace, false);
        
        if (bestFit) {
          const placedPiece: PlacedPiece = {
            id: piece.id,
            x: bestFit.x,
            y: bestFit.y,
            width: bestFit.width,
            height: bestFit.height,
            rotated: false,
            sheetNumber: sheets.length
          };
          
          if (piece.label !== undefined) {
            placedPiece.label = piece.label;
          }
          
          newSheet.placedPieces.push(placedPiece);
          newSheet.availableSpace = this.splitSpace(newSheet.availableSpace, bestFit, piece.width, piece.height, settings.kerf);
          sheets.push(newSheet);
        }
      }
    }
    
    const allPlacedPieces = sheets.flatMap(sheet => sheet.placedPieces);
    const unusedPieces = pieces.filter(piece => 
      !allPlacedPieces.some(placed => placed.id === piece.id)
    );
    
    const totalArea = panel.width * panel.height * sheets.length;
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
      sheetCount: sheets.length
    };
  }

  private findBestFit(
    piece: OptimizationPiece,
    availableSpaces: Rectangle[],
    rotated: boolean
  ): Rectangle | null {
    let bestFit: Rectangle | null = null;
    let bestWaste = Infinity;

    for (const space of availableSpaces) {
      if (!space) continue;
      
      // Try without rotation
      if (!rotated && piece.width <= space.width && piece.height <= space.height) {
        const waste = (space.width - piece.width) * (space.height - piece.height);
        if (waste < bestWaste) {
          bestWaste = waste;
          bestFit = {
            x: space.x,
            y: space.y,
            width: piece.width,
            height: piece.height
          };
        }
      }

      // Try with rotation
      if (rotated && piece.height <= space.width && piece.width <= space.height) {
        const waste = (space.width - piece.height) * (space.height - piece.width);
        if (waste < bestWaste) {
          bestWaste = waste;
          bestFit = {
            x: space.x,
            y: space.y,
            width: piece.height,
            height: piece.width
          };
        }
      }
    }

    return bestFit;
  }

  private splitSpace(
    availableSpaces: Rectangle[],
    placedPiece: Rectangle,
    _originalWidth: number,
    _originalHeight: number,
    _kerf: number
  ): Rectangle[] {
    const newSpaces: Rectangle[] = [];
    for (const space of availableSpaces) {
      if (!space) continue;
      
      if (placedPiece.x < space.x + space.width && placedPiece.x + placedPiece.width > space.x) {
        // Horizontal split
        if (placedPiece.y > space.y) {
          newSpaces.push({ x: space.x, y: space.y, width: space.width, height: placedPiece.y - space.y });
        }
        if (placedPiece.y + placedPiece.height < space.y + space.height) {
          newSpaces.push({ x: space.x, y: placedPiece.y + placedPiece.height, width: space.width, height: space.y + space.height - (placedPiece.y + placedPiece.height) });
        }
      } else if (placedPiece.y < space.y + space.height && placedPiece.y + placedPiece.height > space.y) {
        // Vertical split
        if (placedPiece.x > space.x) {
          newSpaces.push({ x: space.x, y: space.y, width: placedPiece.x - space.x, height: space.height });
        }
        if (placedPiece.x + placedPiece.width < space.x + space.width) {
          newSpaces.push({ x: placedPiece.x + placedPiece.width, y: space.y, width: space.x + space.width - (placedPiece.x + placedPiece.width), height: space.height });
        }
      } else {
        // No overlap, keep the space
        newSpaces.push(space);
      }
    }
    return newSpaces;
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