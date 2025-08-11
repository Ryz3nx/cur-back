import { api } from "encore.dev/api";
import { 
  optimizationRateLimiter, 
  generalRateLimiter, 
  createAlgorithmRateLimiter,
  requestMetricsMiddleware,
  requestSizeMiddleware,
  securityHeadersMiddleware 
} from "./middleware/rate-limiter";

export const optimize = api(
  { method: "POST", path: "/optimize", expose: true },
  [
    securityHeadersMiddleware,
    requestSizeMiddleware,
    requestMetricsMiddleware,
    optimizationRateLimiter,
    optimizeHandler
  ]
);

export const algorithms = api(
  { method: "GET", path: "/algorithms", expose: true },
  [
    securityHeadersMiddleware,
    requestMetricsMiddleware,
    generalRateLimiter,
    algorithmsHandler
  ]
);

export const health = api(
  { method: "GET", path: "/health", expose: true },
  [
    securityHeadersMiddleware,
    requestMetricsMiddleware,
    generalRateLimiter,
    healthHandler
  ]
);

// Import handlers (will be implemented in api/ directory)
import { optimizeHandler } from "./api/optimize";
import { algorithmsHandler } from "./api/algorithms";
import { healthHandler } from "./api/health";