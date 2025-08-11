import { Algorithm, AlgorithmResult, OptimizationPiece, OptimizationPanel, OptimizationSettings, PlacedPiece, CutInstruction, Rectangle } from "../types";
import { expandPieces, sortPiecesByPriority } from "../utils";

interface BeamNode {
  placedPieces: PlacedPiece[];
  availableSpaces: Rectangle[];
  pieces: OptimizationPiece[];
  score: number;
}

export class BeamSearchGuillotineAlgorithm implements Algorithm {
  public readonly name = "beam_search_guillotine";
  public readonly description = "Beam search guillotine algorithm balancing speed and quality";
  public readonly supportsRotation = true;
  public readonly supportsMultiSheet = true;
  public readonly estimatedTime = 500; // ms

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
    const beamWidth = 10;
    const maxDepth = pieces.length;
    
    // Initialize beam with empty state
    const initialNode: BeamNode = {
      placedPieces: [],
      availableSpaces: [{ x: 0, y: 0, width: panel.width, height: panel.height }],
      pieces: [...pieces],
      score: 0
    };
    
    let beam: BeamNode[] = [initialNode];
    
    for (let depth = 0; depth < maxDepth && beam.length > 0; depth++) {
      const newBeam: BeamNode[] = [];
      
      for (const node of beam) {
        if (node.pieces.length === 0) continue;
        
        const piece = node.pieces[0];
        if (!piece) continue;
        
        const unplacedPieces = node.pieces.slice(1);
        
        // Try to place the piece in available spaces
        for (const space of node.availableSpaces) {
          // Try without rotation
          if (this.canPlacePiece(piece, space, false)) {
            const placement = this.placePiece(piece, space, false, 0);
            const newSpaces = this.splitSpace(node.availableSpaces, space, piece.width, piece.height, settings.kerf);
            
            newBeam.push({
              placedPieces: [...node.placedPieces, placement],
              availableSpaces: newSpaces,
              pieces: unplacedPieces,
              score: node.score + this.calculateEfficiency(placement)
            });
          }
          
          // Try with rotation if supported
          if (piece.canRotate && this.canPlacePiece(piece, space, true)) {
            const placement = this.placePiece(piece, space, true, 0);
            const newSpaces = this.splitSpace(node.availableSpaces, space, piece.height, piece.width, settings.kerf);
            
            newBeam.push({
              placedPieces: [...node.placedPieces, placement],
              availableSpaces: newSpaces,
              pieces: unplacedPieces,
              score: node.score + this.calculateEfficiency(placement)
            });
          }
        }
        
        // If piece can't be placed, add to unplaced pieces
        if (node.pieces.length > 0 && node.pieces[0]) {
          unplacedPieces.push(node.pieces[0]);
        }
      }
      
      // Keep only the best beamWidth nodes
      beam = newBeam
        .sort((a, b) => b.score - a.score)
        .slice(0, beamWidth);
    }
    
    // Get best solution
    const bestNode = beam[0];
    if (!bestNode) {
      throw new Error('No valid solution found');
    }
    
    const placedPieces = bestNode.placedPieces;
    const unusedPieces = bestNode.pieces;
    
    const totalArea = panel.width * panel.height;
    const usedArea = placedPieces.reduce((sum, piece) => sum + (piece.width * piece.height), 0);
    const efficiency = usedArea / totalArea;
    const wastedArea = totalArea - usedArea;
    
    const cuts = this.generateCuts(placedPieces, [panel], settings);
    
    return {
      placedPieces,
      unusedPieces,
      efficiency,
      totalArea,
      usedArea,
      wastedArea,
      cuts,
      sheetCount: 1
    };
  }

  private splitSpace(availableSpaces: Rectangle[], usedSpace: Rectangle, _pieceWidth: number, _pieceHeight: number, kerf: number): Rectangle[] {
    const newSpaces: Rectangle[] = [];
    
    for (const space of availableSpaces) {
      if (!space) continue;
      
      // Check if there's any overlap
      if (usedSpace.x < space.x + space.width && usedSpace.x + usedSpace.width > space.x &&
          usedSpace.y < space.y + space.height && usedSpace.y + usedSpace.height > space.y) {
        
        // Horizontal split
        if (usedSpace.y > space.y) {
          newSpaces.push({
            x: space.x,
            y: space.y,
            width: space.width,
            height: usedSpace.y - space.y
          });
        }
        
        if (usedSpace.y + usedSpace.height < space.y + space.height) {
          newSpaces.push({
            x: space.x,
            y: usedSpace.y + usedSpace.height,
            width: space.width,
            height: space.y + space.height - (usedSpace.y + usedSpace.height)
          });
        }
        
        // Vertical split
        if (usedSpace.x > space.x) {
          newSpaces.push({
            x: space.x,
            y: space.y,
            width: usedSpace.x - space.x,
            height: space.height
          });
        }
        
        if (usedSpace.x + usedSpace.width < space.x + space.width) {
          newSpaces.push({
            x: usedSpace.x + usedSpace.width,
            y: space.y,
            width: space.x + space.width - (usedSpace.x + usedSpace.width),
            height: space.height
          });
        }
      } else {
        // No overlap, keep the space
        newSpaces.push(space);
      }
    }
    
    return newSpaces.filter(space => space.width > kerf && space.height > kerf);
  }

  private placePiece(piece: OptimizationPiece, space: Rectangle, rotated: boolean, sheetNumber: number): PlacedPiece {
    const result: PlacedPiece = {
      id: piece.id,
      x: space.x,
      y: space.y,
      width: rotated ? piece.height : piece.width,
      height: rotated ? piece.width : piece.height,
      rotated,
      sheetNumber
    };
    
    if (piece.label !== undefined) {
      result.label = piece.label;
    }
    
    return result;
  }

  private canPlacePiece(piece: OptimizationPiece, space: Rectangle, rotated: boolean): boolean {
    const pieceWidth = rotated ? piece.height : piece.width;
    const pieceHeight = rotated ? piece.width : piece.height;
    
    return pieceWidth <= space.width && pieceHeight <= space.height;
  }

  private calculateEfficiency(placedPiece: PlacedPiece): number {
    return placedPiece.width * placedPiece.height;
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