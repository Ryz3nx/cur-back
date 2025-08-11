import {
  OptimizationPiece,
  Rectangle
} from "../types";

/**
 * Expands pieces by their quantity
 * @param pieces
 * @returns
 */
export function expandPieces(pieces: OptimizationPiece[]): OptimizationPiece[] {
  const expanded: OptimizationPiece[] = [];
  for (const piece of pieces) {
    for (let i = 0; i < piece.quantity; i++) {
      expanded.push({ ...piece, quantity: 1 }); // Ensure quantity is 1 for expanded pieces
    }
  }
  return expanded;
}

/**
 * Sorts pieces by priority (descending) and then by area (descending)
 * @param pieces
 * @returns
 */
export function sortPiecesByPriority(pieces: OptimizationPiece[]): OptimizationPiece[] {
  return pieces.sort((a, b) => {
    // Primary sort by priority (higher priority first)
    if ((b.priority || 0) !== (a.priority || 0)) {
      return (b.priority || 0) - (a.priority || 0);
    }
    // Secondary sort by area (larger area first)
    return (b.width * b.height) - (a.width * b.height);
  });
}

/**
 * Splits an available space after a piece has been placed.
 * Generates two new rectangular spaces: one to the right and one above the placed piece.
 * @param currentSpaces The current list of available spaces.
 * @param usedSpace The space that was just used.
 * @param pieceWidth The width of the placed piece.
 * @param pieceHeight The height of the placed piece.
 * @param kerf The kerf (blade thickness) to account for.
 * @returns An array of new available spaces.
 */
export function splitSpace(
  availableSpaces: Rectangle[],
  usedSpace: Rectangle,
  _pieceWidth: number,
  _pieceHeight: number,
  kerf: number
): Rectangle[] {
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

/**
 * Calculates the area of a rectangle.
 * @param rect The rectangle.
 * @returns The area.
 */
export function calculateArea(rect: Rectangle): number {
  return rect.width * rect.height;
}

/**
 * Checks if two rectangles overlap.
 * @param rect1 The first rectangle.
 * @param rect2 The second rectangle.
 * @returns True if they overlap, false otherwise.
 */
export function rectanglesOverlap(rect1: Rectangle, rect2: Rectangle): boolean {
  return !(rect1.x + rect1.width <= rect2.x ||
           rect2.x + rect2.width <= rect1.x ||
           rect1.y + rect1.height <= rect2.y ||
           rect2.y + rect2.height <= rect1.y);
}

/**
 * Measures the execution time of an async function.
 * @param fn The async function to measure.
 * @returns An object containing the result and duration.
 */
export async function measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  const duration = endTime - startTime;
  return { result, duration };
}