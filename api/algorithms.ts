import { Request, Response } from "express";
import { AlgorithmManager } from "../lib/algorithms/algorithm-manager";

export async function algorithmsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const algorithms = AlgorithmManager.getInstance().getAllAlgorithms();
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      success: true,
      algorithms: algorithms.map(alg => ({
        name: alg.name,
        description: alg.description,
        supportsRotation: alg.supportsRotation,
        supportsMultiSheet: alg.supportsMultiSheet,
        estimatedTime: alg.estimatedTime
      }))
    });
  } catch (error) {
    console.error("Error fetching algorithms:", error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({
      success: false,
      error: "Failed to fetch algorithms"
    });
  }
}