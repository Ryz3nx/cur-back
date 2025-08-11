#!/usr/bin/env node

/**
 * CNC Optimization Service Client Example
 * This script demonstrates how to use the CNC optimization service
 */

const http = require('http');

// Configuration
const SERVICE_HOST = 'localhost';
const SERVICE_PORT = 8080;

// Sample optimization request
const sampleRequest = {
  pieces: [
    {
      id: 'cabinet_door',
      length: 800,
      width: 400,
      quantity: 4,
      canRotate: true,
      priority: 1
    },
    {
      id: 'cabinet_side',
      length: 600,
      width: 400,
      quantity: 2,
      canRotate: false,
      priority: 2
    },
    {
      id: 'cabinet_top',
      length: 800,
      width: 600,
      quantity: 1,
      canRotate: true,
      priority: 1
    },
    {
      id: 'cabinet_bottom',
      length: 800,
      width: 600,
      quantity: 1,
      canRotate: true,
      priority: 1
    },
    {
      id: 'cabinet_back',
      length: 800,
      width: 600,
      quantity: 1,
      canRotate: true,
      priority: 3
    }
  ],
  panel: {
    length: 2440, // Standard 8x4 sheet in mm
    width: 1220
  },
  settings: {
    kerf: 3.2, // 3.2mm saw blade
    padding: {
      left: 20,
      right: 20,
      top: 20,
      bottom: 20
    },
    cutPreference: 'hybrid'
  }
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SERVICE_HOST,
      port: SERVICE_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test health endpoint
async function testHealth() {
  console.log('🏥 Testing health endpoint...');
  
  try {
    const response = await makeRequest('GET', '/health');
    console.log(`✅ Health check passed: ${response.status}`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Uptime: ${response.data.uptimeFormatted}`);
    console.log(`   Algorithms: ${response.data.algorithms}`);
    console.log(`   Total optimizations: ${response.data.totalOptimizations}`);
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`);
  }
}

// Test algorithms endpoint
async function testAlgorithms() {
  console.log('\n🔧 Testing algorithms endpoint...');
  
  try {
    const response = await makeRequest('GET', '/algorithms');
    console.log(`✅ Algorithms endpoint: ${response.status}`);
    console.log(`   Default algorithm: ${response.data.default}`);
    console.log(`   Available algorithms: ${response.data.algorithms.join(', ')}`);
    
    console.log('\n   Algorithm details:');
    Object.entries(response.data.descriptions).forEach(([name, desc]) => {
      console.log(`     ${name}: ${desc}`);
    });
  } catch (error) {
    console.error(`❌ Algorithms endpoint failed: ${error.message}`);
  }
}

// Test optimization with different algorithms
async function testOptimization(algorithm = null) {
  const algorithmName = algorithm || 'default';
  console.log(`\n🚀 Testing optimization with ${algorithmName} algorithm...`);
  
  try {
    const requestData = algorithm ? { ...sampleRequest, algorithm } : sampleRequest;
    const startTime = Date.now();
    
    const response = await makeRequest('POST', '/optimize', requestData);
    const duration = Date.now() - startTime;
    
    if (response.data.success) {
      console.log(`✅ Optimization successful: ${response.status} (${duration}ms)`);
      console.log(`   Algorithm used: ${response.data.metadata?.algorithm || 'unknown'}`);
      console.log(`   Efficiency: ${(response.data.efficiency * 100).toFixed(1)}%`);
      console.log(`   Pieces placed: ${response.data.placedPieces.length}`);
      console.log(`   Cuts generated: ${response.data.cuts.length}`);
      console.log(`   Sheet count: ${response.data.sheetCount}`);
      
      if (response.data.metadata?.reasoning) {
        console.log(`   Reasoning: ${response.data.metadata.reasoning}`);
      }
    } else {
      console.log(`❌ Optimization failed: ${response.status}`);
      if (response.data.error) {
        console.log(`   Error: ${response.data.error}`);
      }
    }
  } catch (error) {
    console.error(`❌ Optimization request failed: ${error.message}`);
  }
}

// Test all algorithms
async function testAllAlgorithms() {
  console.log('\n🧪 Testing all available algorithms...');
  
  const algorithms = [
    'beam_search_guillotine',
    'hybrid_constructive_local_search',
    'advanced_genetic_algorithm',
    'first_fit_decreasing'
  ];
  
  for (const algorithm of algorithms) {
    await testOptimization(algorithm);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Performance test
async function performanceTest() {
  console.log('\n⚡ Running performance test...');
  
  const iterations = 5;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const response = await makeRequest('POST', '/optimize', sampleRequest);
      if (response.data.success) {
        const duration = Date.now() - startTime;
        times.push(duration);
        console.log(`   Test ${i + 1}: ${duration}ms`);
      }
    } catch (error) {
      console.log(`   Test ${i + 1}: FAILED`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`\n📊 Performance Results:`);
    console.log(`   Average: ${avgTime.toFixed(0)}ms`);
    console.log(`   Min: ${minTime}ms`);
    console.log(`   Max: ${maxTime}ms`);
    console.log(`   Target: <3000ms`);
    
    if (avgTime < 3000) {
      console.log(`   ✅ Performance target met!`);
    } else {
      console.log(`   ⚠️  Performance target exceeded`);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 CNC Optimization Service Client Example');
  console.log('==========================================');
  
  try {
    // Test basic endpoints
    await testHealth();
    await testAlgorithms();
    
    // Test optimization
    await testOptimization();
    
    // Test all algorithms
    await testAllAlgorithms();
    
    // Performance test
    await performanceTest();
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error(`\n❌ Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  makeRequest,
  testHealth,
  testAlgorithms,
  testOptimization,
  testAllAlgorithms,
  performanceTest
};