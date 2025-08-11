import { algorithmManager } from '../lib/algorithms';
import { OptimizationRequest } from '../lib/types';

describe('CNC Optimization Service', () => {
  const sampleRequest: OptimizationRequest = {
    pieces: [
      {
        id: 'rect1',
        length: 100,
        width: 50,
        quantity: 2,
        canRotate: true,
        priority: 1
      },
      {
        id: 'rect2',
        length: 75,
        width: 60,
        quantity: 1,
        canRotate: false,
        priority: 2
      },
      {
        id: 'rect3',
        length: 120,
        width: 40,
        quantity: 1,
        canRotate: true,
        priority: 3
      }
    ],
    panel: {
      length: 500,
      width: 300
    },
    settings: {
      kerf: 3.2,
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      },
      cutPreference: 'hybrid'
    }
  };

  describe('Algorithm Manager', () => {
    test('should register all algorithms', () => {
      const algorithms = algorithmManager.getAvailableAlgorithms();
      expect(algorithms).toContain('beam_search_guillotine');
      expect(algorithms).toContain('hybrid_constructive_local_search');
      expect(algorithms).toContain('first_fit_decreasing');
      expect(algorithms).toHaveLength(3);
    });

    test('should return default algorithm', () => {
      const defaultAlgo = algorithmManager.getDefaultAlgorithm();
      expect(defaultAlgo).toBe('beam_search_guillotine');
    });

    test('should provide algorithm descriptions', () => {
      const descriptions = algorithmManager.getAlgorithmDescriptions();
      expect(descriptions['beam_search_guillotine']).toContain('Advanced beam search');
      expect(descriptions['hybrid_constructive_local_search']).toContain('Bottom-left-fill');
      expect(descriptions['first_fit_decreasing']).toContain('Simple');
    });
  });

  describe('Beam Search Guillotine Algorithm', () => {
    test('should execute optimization successfully', async () => {
      const result = await algorithmManager.executeAlgorithm('beam_search_guillotine', sampleRequest);
      
      expect(result.success).toBe(true);
      expect(result.placedPieces.length).toBeGreaterThan(0);
      expect(result.efficiency).toBeGreaterThan(0);
      expect(result.efficiency).toBeLessThanOrEqual(1);
      expect(result.sheetCount).toBeGreaterThan(0);
      expect(result.cuts.length).toBeGreaterThan(0);
    }, 10000);

    test('should handle rotation correctly', async () => {
      const result = await algorithmManager.executeAlgorithm('beam_search_guillotine', sampleRequest);
      
      const rotatedPieces = result.placedPieces.filter(p => p.rotated);
      expect(rotatedPieces.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Hybrid Constructive Local Search Algorithm', () => {
    test('should execute optimization successfully', async () => {
      const result = await algorithmManager.executeAlgorithm('hybrid_constructive_local_search', sampleRequest);
      
      expect(result.success).toBe(true);
      expect(result.placedPieces.length).toBeGreaterThan(0);
      expect(result.efficiency).toBeGreaterThan(0);
      expect(result.efficiency).toBeLessThanOrEqual(1);
      expect(result.sheetCount).toBeGreaterThan(0);
    }, 5000);

    test('should complete within expected time', async () => {
      const start = Date.now();
      await algorithmManager.executeAlgorithm('hybrid_constructive_local_search', sampleRequest);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('First Fit Decreasing Algorithm', () => {
    test('should execute optimization successfully', async () => {
      const result = await algorithmManager.executeAlgorithm('first_fit_decreasing', sampleRequest);
      
      expect(result.success).toBe(true);
      expect(result.placedPieces.length).toBeGreaterThan(0);
      expect(result.efficiency).toBeGreaterThan(0);
      expect(result.efficiency).toBeLessThanOrEqual(1);
      expect(result.sheetCount).toBeGreaterThan(0);
    }, 2000);

    test('should complete very quickly', async () => {
      const start = Date.now();
      await algorithmManager.executeAlgorithm('first_fit_decreasing', sampleRequest);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('Fallback Execution', () => {
    test('should execute with fallback strategy', async () => {
      const result = await algorithmManager.executeWithFallback(sampleRequest);
      
      expect(result.success).toBe(true);
      expect(result.placedPieces.length).toBeGreaterThan(0);
      expect(result.efficiency).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Performance Characteristics', () => {
    test('should maintain efficiency across algorithms', async () => {
      const results = await Promise.all([
        algorithmManager.executeAlgorithm('beam_search_guillotine', sampleRequest),
        algorithmManager.executeAlgorithm('hybrid_constructive_local_search', sampleRequest),
        algorithmManager.executeAlgorithm('first_fit_decreasing', sampleRequest)
      ]);

      const efficiencies = results.map(r => r.efficiency);
      const avgEfficiency = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
      
      expect(avgEfficiency).toBeGreaterThan(0.6); // Should maintain reasonable efficiency
    }, 20000);
  });
});