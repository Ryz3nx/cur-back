import { Request, Response } from 'express';
import { OptimizationRequest, OptimizationResponse } from '../lib/types';
import { AlgorithmManager } from '../lib/algorithms/algorithm-manager';

export async function optimizeHandler(req: Request, _res: Response): Promise<OptimizationResponse> {
  try {
    const request: OptimizationRequest = req.body;
    
    if (!request.pieces || !request.panels || !request.settings) {
      throw new Error('Missing required fields: pieces, panels, or settings');
    }
    
    if (request.pieces.length === 0) {
      throw new Error('No pieces provided');
    }
    
    if (request.panels.length === 0) {
      throw new Error('No panels provided');
    }
    
    const algorithmManager = AlgorithmManager.getInstance();
    const result = await algorithmManager.executeWithFallback(request);
    
    return {
      success: true,
      placedPieces: result.placedPieces,
      unusedPieces: result.unusedPieces,
      efficiency: result.efficiency,
      totalArea: result.totalArea,
      usedArea: result.usedArea,
      wastedArea: result.wastedArea,
      cuts: result.cuts,
      metadata: {
        algorithm: result.algorithm,
        duration: result.executionTime,
        reasoning: `Optimization completed using ${result.algorithm} algorithm`,
        sheetCount: result.sheetCount
      }
    };
  } catch (error) {
    return {
      success: false,
      placedPieces: [],
      unusedPieces: [],
      efficiency: 0,
      totalArea: 0,
      usedArea: 0,
      wastedArea: 0,
      metadata: {
        algorithm: 'unknown',
        duration: 0,
        reasoning: 'Optimization failed'
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function optionsHandler(_req: Request, res: Response): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(200).end();
}