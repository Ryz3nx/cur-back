// Test setup and configuration
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock process.memoryUsage for consistent testing
Object.defineProperty(process, 'memoryUsage', {
  value: jest.fn(() => ({
    rss: 1024 * 1024 * 50, // 50MB
    heapTotal: 1024 * 1024 * 30, // 30MB
    heapUsed: 1024 * 1024 * 20, // 20MB
    external: 1024 * 1024 * 5, // 5MB
  })),
  writable: true,
});

// Test timeout configuration
jest.setTimeout(30000);

// Global test data
export const testPieces = [
  {
    id: 'test1',
    length: 100,
    width: 50,
    quantity: 2,
    canRotate: true,
    priority: 1
  },
  {
    id: 'test2',
    length: 75,
    width: 60,
    quantity: 1,
    canRotate: false,
    priority: 2
  }
];

export const testPanel = {
  length: 500,
  width: 300
};

export const testSettings = {
  kerf: 3.2,
  padding: {
    left: 10,
    right: 10,
    top: 10,
    bottom: 10
  },
  cutPreference: 'hybrid' as const
};

// Helper function to create test requests
export const createTestRequest = (pieces = testPieces, panel = testPanel, settings = testSettings) => ({
  pieces,
  panel,
  settings,
  algorithm: undefined
});

// Helper function to wait for async operations
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to create mock response
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

// Helper function to create mock request
export const createMockRequest = (body: any = {}) => ({
  body,
  method: 'POST',
  headers: {},
  path: '/optimize'
});