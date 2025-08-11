import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.'
    });
  }
});

// Request size limiting middleware
export const requestSizeMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    res.status(413).json({
      error: 'Request entity too large. Maximum size is 10MB.'
    });
    return;
  }
  
  next();
};

// Security headers middleware
export const securityHeadersMiddleware = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};

// Metrics tracking
let optimizationRequestCount = 0;
let lastOptimizationTime: Date | null = null;

export const requestMetricsMiddleware = (_req: Request, _res: Response, next: NextFunction): void => {
  optimizationRequestCount++;
  lastOptimizationTime = new Date();
  next();
};

export const getOptimizationMetrics = () => ({
  requestCount: optimizationRequestCount,
  lastRequestTime: lastOptimizationTime
});

export const updateOptimizationMetrics = (): void => {
  optimizationRequestCount++;
  lastOptimizationTime = new Date();
};