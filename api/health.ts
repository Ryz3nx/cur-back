import { Request, Response } from "express";
import { HealthResponse } from "../lib/types";
import { AlgorithmManager } from "../lib/algorithms/algorithm-manager";
import { getOptimizationMetrics } from "../middleware/rate-limiter";

export async function healthHandler(_req: Request, res: Response): Promise<void> {
  try {
    const metrics = getOptimizationMetrics();
    const algorithms = AlgorithmManager.getInstance().getAllAlgorithms();
    
    const healthResponse: HealthResponse = {
      status: "healthy",
      uptime: process.uptime(),
      algorithms: algorithms.length,
      lastOptimization: metrics.lastRequestTime ? metrics.lastRequestTime.getTime() : 0
    };
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(healthResponse);
  } catch (error) {
    console.error("Health check error:", error);
    
    const healthResponse: HealthResponse = {
      status: "unhealthy",
      uptime: process.uptime(),
      algorithms: 0,
      lastOptimization: 0
    };
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    res.status(500).json(healthResponse);
  }
}