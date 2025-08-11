# CNC Cut Optimization Microservice

A high-performance microservice for optimizing 2D cutting patterns on CNC machines, built with Encore.ts and TypeScript.

## 🚀 Features

- **Multiple Optimization Algorithms**: Four different algorithms for various use cases
- **High Performance**: Optimized for speed and efficiency
- **Flexible Configuration**: Supports piece rotation, multi-sheet operations, and custom cutting preferences
- **Production Ready**: Includes rate limiting, security headers, and comprehensive error handling
- **Containerized**: Docker support with health checks and monitoring
- **Comprehensive Testing**: Full test suite with Jest

## 🏗️ Architecture

### Core Components

- **Algorithm Manager**: Centralized algorithm selection and fallback mechanism
- **Optimization Engine**: Core logic for piece placement and cut generation
- **API Layer**: RESTful endpoints with CORS and validation
- **Middleware**: Rate limiting, security, and request tracking

### Algorithms

1. **Beam Search Guillotine** (`beam_search_guillotine`)
   - Best balance of speed and quality
   - Supports piece rotation and multi-sheet operations
   - Estimated time: 1-2 seconds

2. **Hybrid Constructive Local Search** (`hybrid_constructive_local_search`)
   - Combines constructive placement with local optimization
   - Good balance between speed and solution quality
   - Estimated time: 2-3 seconds

3. **Advanced Genetic Algorithm** (`advanced_genetic_algorithm`)
   - Highest quality solutions
   - Longer processing time for maximum efficiency
   - Estimated time: 3-5 seconds

4. **First Fit Decreasing** (`first_fit_decreasing`)
   - Fast baseline option
   - Does not support piece rotation
   - Estimated time: <1 second

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd cnc-optimization-service

# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🚀 Quick Start

### 1. Start the Service

```bash
npm run dev
```

The service will be available at `http://localhost:8080`

### 2. Test the Health Endpoint

```bash
curl http://localhost:8080/health
```

### 3. View Available Algorithms

```bash
curl http://localhost:8080/algorithms
```

### 4. Run an Optimization

```bash
curl -X POST http://localhost:8080/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "pieces": [
      {
        "id": "rect1",
        "length": 100,
        "width": 50,
        "quantity": 2,
        "canRotate": true,
        "priority": 1
      }
    ],
    "panel": {
      "length": 500,
      "width": 300
    },
    "settings": {
      "kerf": 3.2,
      "padding": {
        "left": 10,
        "right": 10,
        "top": 10,
        "bottom": 10
      },
      "cutPreference": "hybrid"
    }
  }'
```

## 📚 API Reference

### POST /optimize

Optimizes piece placement on cutting panels.

**Request Body:**
```typescript
{
  pieces: Array<{
    id: string;
    length: number;
    width: number;
    quantity: number;
    canRotate: boolean;
    priority: number;
    mustFollowGrain?: boolean;
  }>;
  panel: {
    length: number;
    width: number;
  };
  settings: {
    kerf: number;
    padding: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
    cutPreference: 'minimize_cuts' | 'minimize_waste' | 'hybrid';
    timeout?: number;
  };
  algorithm?: string; // Optional: specify algorithm to use
}
```

**Response:**
```typescript
{
  success: true;
  result: {
    placements: Array<{
      pieceId: string;
      x: number;
      y: number;
      rotated: boolean;
      sheetIndex: number;
    }>;
    cuts: Array<{
      type: 'horizontal' | 'vertical';
      position: number;
      sheetIndex: number;
    }>;
    efficiency: number;
    wastePercentage: number;
    sheetsUsed: number;
    totalCuts: number;
  };
  metadata: {
    algorithm: string;
    duration: number;
    reasoning: string;
  };
}
```

### GET /algorithms

Returns information about available optimization algorithms.

**Response:**
```typescript
{
  algorithms: string[];
  default: string;
  descriptions: Record<string, string>;
  metadata: Record<string, {
    supportsRotation: boolean;
    supportsMultiSheet: boolean;
    estimatedTime: number;
  }>;
  count: number;
}
```

### GET /health

Returns service health and status information.

**Response:**
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  algorithms: number;
  lastOptimization: number | undefined;
  totalOptimizations: number;
  version: string;
  timestamp: string;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptimeFormatted: string;
}
```

## ⚙️ Configuration

### Environment Variables

- `NODE_ENV`: Environment (development/production)
- `PORT`: Service port (default: 8080)
- `LOG_LEVEL`: Logging level (default: info)

### Rate Limiting

- **Optimization endpoint**: 50 requests per 15 minutes
- **General endpoints**: 200 requests per 15 minutes
- **Algorithm-specific limits**: Varies by algorithm complexity

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test Files

```bash
npm test -- --testPathPattern=algorithms
```

### Performance Testing

```bash
# Start the service first
npm run dev

# Run performance tests
./scripts/performance-test.sh
```

## 🐳 Docker

### Build Image

```bash
docker build -t cnc-optimization-service .
```

### Run Container

```bash
docker run -p 8080:8080 cnc-optimization-service
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f cnc-optimization-service

# Scale service
docker-compose up -d --scale cnc-optimization-service=3
```

## 📊 Monitoring

### Health Checks

The service includes built-in health checks:

- **Container health check**: Docker-level health monitoring
- **Application health endpoint**: `/health` for service status
- **Performance metrics**: Response times and throughput

### Prometheus Integration

Prometheus configuration is included for metrics collection:

```yaml
# monitoring/prometheus.yml
scrape_configs:
  - job_name: 'cnc-optimization-service'
    static_configs:
      - targets: ['cnc-optimization-service:8080']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

## 🚀 Deployment

### Automated Deployment

Use the included deployment script:

```bash
./scripts/deploy.sh
```

This script will:
1. Install dependencies
2. Run tests and linting
3. Build the application
4. Build Docker image
5. Deploy with Docker Compose
6. Run health checks
7. Perform smoke tests

### Manual Deployment

```bash
# Build and test
npm ci
npm test
npm run build

# Deploy
docker-compose up -d

# Verify deployment
curl http://localhost:8080/health
```

## 🔧 Development

### Project Structure

```
├── api/                    # API endpoint handlers
├── lib/                    # Core library code
│   ├── algorithms/        # Optimization algorithms
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── middleware/            # Express middleware
├── test/                  # Test files
├── scripts/               # Build and deployment scripts
├── monitoring/            # Monitoring configuration
├── client/                # Example client
├── encore.app            # Encore.ts configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── Dockerfile            # Docker configuration
└── docker-compose.yml    # Service orchestration
```

### Adding New Algorithms

1. Create a new algorithm class in `lib/algorithms/`
2. Implement the `Algorithm` interface
3. Register the algorithm in `lib/algorithms/index.ts`
4. Add tests in `test/`
5. Update rate limiting configuration if needed

### Code Quality

- **ESLint**: TypeScript-aware linting rules
- **Prettier**: Code formatting (configured via ESLint)
- **TypeScript**: Strict type checking enabled
- **Jest**: Comprehensive testing framework

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the `/health` endpoint for service status
- Review logs for detailed error information
- Use the `/algorithms` endpoint to verify algorithm availability

## 🔮 Roadmap

- [ ] Grain direction optimization
- [ ] Advanced priority system
- [ ] Machine-specific cutting constraints
- [ ] Real-time optimization progress
- [ ] WebSocket support for long-running jobs
- [ ] Advanced analytics and reporting
- [ ] Integration with CAD software
- [ ] Machine learning-based optimization