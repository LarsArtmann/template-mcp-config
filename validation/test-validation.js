#!/usr/bin/env node

/**
 * Test Script for MCP Configuration Validation
 * 
 * Tests the validation system against real MCP configurations
 * and validates that schemas work correctly.
 */

const fs = require('fs');
const path = require('path');
const { validateMCPConfig } = require('./validate-config.js');

async function runValidationTests() {
  console.log('🧪 Running MCP Configuration Validation Tests');
  console.log('=' .repeat(60));

  const testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Valid configuration (current .mcp.json)
  console.log('\n🔍 Test 1: Valid configuration (.mcp.json)');
  try {
    const result = await validateMCPConfig('.mcp.json');
    const testResult = {
      name: 'Valid configuration',
      passed: result.valid,
      errors: result.errors,
      warnings: result.warnings
    };
    
    testResults.tests.push(testResult);
    if (testResult.passed) {
      testResults.passed++;
      console.log('✅ PASSED');
    } else {
      testResults.failed++;
      console.log('❌ FAILED');
      console.log(`  Errors: ${testResult.errors.join(', ')}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name: 'Valid configuration',
      passed: false,
      errors: [error.message],
      warnings: []
    });
    console.log('❌ FAILED - Exception:', error.message);
  }

  // Test 2: Missing file
  console.log('\n🔍 Test 2: Missing configuration file');
  try {
    const result = await validateMCPConfig('nonexistent.json');
    const testResult = {
      name: 'Missing file',
      passed: !result.valid && result.errors.some(e => e.includes('not found')),
      errors: result.errors,
      warnings: result.warnings
    };
    
    testResults.tests.push(testResult);
    if (testResult.passed) {
      testResults.passed++;
      console.log('✅ PASSED - Correctly detected missing file');
    } else {
      testResults.failed++;
      console.log('❌ FAILED - Should have detected missing file');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name: 'Missing file',
      passed: false,
      errors: [error.message],
      warnings: []
    });
    console.log('❌ FAILED - Unexpected exception:', error.message);
  }

  // Test 3: Invalid JSON
  console.log('\n🔍 Test 3: Invalid JSON syntax');
  const invalidJsonPath = 'test-invalid.json';
  fs.writeFileSync(invalidJsonPath, '{ invalid json }');
  
  try {
    const result = await validateMCPConfig(invalidJsonPath);
    const testResult = {
      name: 'Invalid JSON',
      passed: !result.valid && result.errors.some(e => e.includes('Invalid JSON')),
      errors: result.errors,
      warnings: result.warnings
    };
    
    testResults.tests.push(testResult);
    if (testResult.passed) {
      testResults.passed++;
      console.log('✅ PASSED - Correctly detected invalid JSON');
    } else {
      testResults.failed++;
      console.log('❌ FAILED - Should have detected invalid JSON');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name: 'Invalid JSON',
      passed: false,
      errors: [error.message],
      warnings: []
    });
    console.log('❌ FAILED - Unexpected exception:', error.message);
  } finally {
    // Clean up test file
    try {
      fs.unlinkSync(invalidJsonPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Test 4: Missing mcpServers property
  console.log('\n🔍 Test 4: Missing mcpServers property');
  const missingServersPath = 'test-missing-servers.json';
  fs.writeFileSync(missingServersPath, '{"version": "1.0.0"}');
  
  try {
    const result = await validateMCPConfig(missingServersPath);
    const testResult = {
      name: 'Missing mcpServers',
      passed: !result.valid && result.errors.some(e => e.includes('mcpServers')),
      errors: result.errors,
      warnings: result.warnings
    };
    
    testResults.tests.push(testResult);
    if (testResult.passed) {
      testResults.passed++;
      console.log('✅ PASSED - Correctly detected missing mcpServers');
    } else {
      testResults.failed++;
      console.log('❌ FAILED - Should have detected missing mcpServers');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name: 'Missing mcpServers',
      passed: false,
      errors: [error.message],
      warnings: []
    });
    console.log('❌ FAILED - Unexpected exception:', error.message);
  } finally {
    // Clean up test file
    try {
      fs.unlinkSync(missingServersPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Test 5: Empty servers object
  console.log('\n🔍 Test 5: Empty servers object');
  const emptyServersPath = 'test-empty-servers.json';
  fs.writeFileSync(emptyServersPath, '{"mcpServers": {}}');
  
  try {
    const result = await validateMCPConfig(emptyServersPath);
    const testResult = {
      name: 'Empty servers',
      passed: !result.valid && result.errors.some(e => e.includes('No MCP servers')),
      errors: result.errors,
      warnings: result.warnings
    };
    
    testResults.tests.push(testResult);
    if (testResult.passed) {
      testResults.passed++;
      console.log('✅ PASSED - Correctly detected empty servers');
    } else {
      testResults.failed++;
      console.log('❌ FAILED - Should have detected empty servers');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name: 'Empty servers',
      passed: false,
      errors: [error.message],
      warnings: []
    });
    console.log('❌ FAILED - Unexpected exception:', error.message);
  } finally {
    // Clean up test file
    try {
      fs.unlinkSync(emptyServersPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Test 6: Invalid server configuration
  console.log('\n🔍 Test 6: Invalid server configuration');
  const invalidServerPath = 'test-invalid-server.json';
  fs.writeFileSync(invalidServerPath, JSON.stringify({
    "mcpServers": {
      "test-server": {
        // Missing both command and serverUrl
        "env": {}
      }
    }
  }, null, 2));
  
  try {
    const result = await validateMCPConfig(invalidServerPath);
    const testResult = {
      name: 'Invalid server config',
      passed: !result.valid && result.errors.some(e => e.includes('Missing required')),
      errors: result.errors,
      warnings: result.warnings
    };
    
    testResults.tests.push(testResult);
    if (testResult.passed) {
      testResults.passed++;
      console.log('✅ PASSED - Correctly detected invalid server config');
    } else {
      testResults.failed++;
      console.log('❌ FAILED - Should have detected invalid server config');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name: 'Invalid server config',
      passed: false,
      errors: [error.message],
      warnings: []
    });
    console.log('❌ FAILED - Unexpected exception:', error.message);
  } finally {
    // Clean up test file
    try {
      fs.unlinkSync(invalidServerPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Test 7: Valid HTTP server configuration
  console.log('\n🔍 Test 7: Valid HTTP server configuration');
  const httpServerPath = 'test-http-server.json';
  fs.writeFileSync(httpServerPath, JSON.stringify({
    "mcpServers": {
      "http-server": {
        "serverUrl": "https://example.com/mcp"
      }
    }
  }, null, 2));
  
  try {
    const result = await validateMCPConfig(httpServerPath);
    const testResult = {
      name: 'Valid HTTP server',
      passed: result.valid,
      errors: result.errors,
      warnings: result.warnings
    };
    
    testResults.tests.push(testResult);
    if (testResult.passed) {
      testResults.passed++;
      console.log('✅ PASSED - Valid HTTP server config');
    } else {
      testResults.failed++;
      console.log('❌ FAILED - Should have accepted valid HTTP server');
      console.log(`  Errors: ${testResult.errors.join(', ')}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name: 'Valid HTTP server',
      passed: false,
      errors: [error.message],
      warnings: []
    });
    console.log('❌ FAILED - Unexpected exception:', error.message);
  } finally {
    // Clean up test file
    try {
      fs.unlinkSync(httpServerPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Test 8: Schema validation with TypeSpec generated schemas
  console.log('\n🔍 Test 8: TypeSpec schema validation');
  try {
    // Check if generated schemas exist
    const schemaDir = path.join(__dirname, 'schemas', 'generated', 'json-schema');
    const mainSchemaPath = path.join(schemaDir, 'MCPConfiguration.yaml');
    
    if (fs.existsSync(mainSchemaPath)) {
      const schemaContent = fs.readFileSync(mainSchemaPath, 'utf8');
      const testResult = {
        name: 'TypeSpec schema generation',
        passed: schemaContent.includes('mcpServers') && schemaContent.includes('$schema'),
        errors: [],
        warnings: []
      };
      
      testResults.tests.push(testResult);
      if (testResult.passed) {
        testResults.passed++;
        console.log('✅ PASSED - TypeSpec schemas generated successfully');
      } else {
        testResults.failed++;
        console.log('❌ FAILED - Generated schema appears invalid');
      }
    } else {
      testResults.failed++;
      testResults.tests.push({
        name: 'TypeSpec schema generation',
        passed: false,
        errors: ['Schema files not found'],
        warnings: []
      });
      console.log('❌ FAILED - Schema files not found');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name: 'TypeSpec schema generation',
      passed: false,
      errors: [error.message],
      warnings: []
    });
    console.log('❌ FAILED - Exception:', error.message);
  }

  // Display final results
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Tests Passed: ${testResults.passed}`);
  console.log(`❌ Tests Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach((test, index) => {
        console.log(`  ${index + 1}. ${test.name}`);
        if (test.errors.length > 0) {
          console.log(`     Errors: ${test.errors.join(', ')}`);
        }
      });
  }

  console.log('\n🎯 Validation system test completed!');
  return testResults.failed === 0;
}

// Run tests if called directly
if (require.main === module) {
  runValidationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runValidationTests };