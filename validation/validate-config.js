#!/usr/bin/env node

/**
 * MCP Configuration Validation Script
 * 
 * Validates .mcp.json structure, environment variables, and server connectivity
 * for Model Context Protocol configurations.
 * 
 * Usage:
 *   node validate-config.js [config-path]
 *   ./validate-config.js [config-path]
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { promisify } = require('util');

// Configuration constants
const DEFAULT_CONFIG_PATH = '.mcp.json';
const ENV_FILE_PATH = '.env';
const TIMEOUT_MS = 10000; // 10 seconds for server connectivity tests

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string[]} errors - List of validation errors
 * @property {string[]} warnings - List of validation warnings
 * @property {Object} details - Detailed validation results by category
 */

/**
 * MCP Server configuration structure
 * @typedef {Object} MCPServer
 * @property {string} [command] - Command to execute (for stdio servers)
 * @property {string[]} [args] - Command arguments
 * @property {Object} [env] - Environment variables
 * @property {string} [serverUrl] - Server URL (for HTTP servers)
 */

/**
 * Main validation function
 * @param {string} configPath - Path to .mcp.json file
 * @returns {Promise<ValidationResult>}
 */
async function validateMCPConfig(configPath = DEFAULT_CONFIG_PATH) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    details: {
      structure: { valid: true, errors: [] },
      servers: { valid: true, errors: [], warnings: [] },
      environment: { valid: true, errors: [], warnings: [] },
      connectivity: { valid: true, errors: [], warnings: [] }
    }
  };

  console.log(`🔍 Validating MCP configuration: ${configPath}`);
  
  try {
    // 1. Validate file structure and JSON schema
    const config = await validateStructure(configPath, result.details.structure);
    if (!result.details.structure.valid) {
      result.valid = false;
      result.errors.push(...result.details.structure.errors);
      return result;
    }

    // 2. Validate individual server configurations
    await validateServers(config.mcpServers, result.details.servers);
    if (!result.details.servers.valid) {
      result.valid = false;
      result.errors.push(...result.details.servers.errors);
    }
    result.warnings.push(...result.details.servers.warnings);

    // 3. Validate environment variables
    await validateEnvironment(config.mcpServers, result.details.environment);
    if (!result.details.environment.valid) {
      result.valid = false;
      result.errors.push(...result.details.environment.errors);
    }
    result.warnings.push(...result.details.environment.warnings);

    // 4. Test server connectivity (optional, non-blocking)
    try {
      await validateConnectivity(config.mcpServers, result.details.connectivity);
    } catch (error) {
      result.details.connectivity.warnings.push(`Connectivity tests failed: ${error.message}`);
    }
    result.warnings.push(...result.details.connectivity.warnings);

    console.log(`✅ Validation completed. Valid: ${result.valid}`);
    if (result.errors.length > 0) {
      console.log(`❌ Errors: ${result.errors.length}`);
    }
    if (result.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${result.warnings.length}`);
    }

  } catch (error) {
    result.valid = false;
    result.errors.push(`Validation failed: ${error.message}`);
    console.error(`❌ Validation failed:`, error.message);
  }

  return result;
}

/**
 * Validate JSON structure and schema
 * @param {string} configPath 
 * @param {Object} result 
 * @returns {Promise<Object>}
 */
async function validateStructure(configPath, result) {
  try {
    // Check if file exists
    if (!fs.existsSync(configPath)) {
      result.valid = false;
      result.errors.push(`Configuration file not found: ${configPath}`);
      return null;
    }

    // Read and parse JSON
    const configContent = fs.readFileSync(configPath, 'utf8');
    let config;
    try {
      config = JSON.parse(configContent);
    } catch (parseError) {
      result.valid = false;
      result.errors.push(`Invalid JSON format: ${parseError.message}`);
      return null;
    }

    // Validate required structure
    if (!config.mcpServers) {
      result.valid = false;
      result.errors.push('Missing required "mcpServers" property');
      return null;
    }

    if (typeof config.mcpServers !== 'object' || Array.isArray(config.mcpServers)) {
      result.valid = false;
      result.errors.push('"mcpServers" must be an object');
      return null;
    }

    // Validate server count
    const serverCount = Object.keys(config.mcpServers).length;
    if (serverCount === 0) {
      result.valid = false;
      result.errors.push('No MCP servers configured');
      return null;
    }

    // Expected server names (19 servers as of current configuration)
    const expectedServers = [
      'context7', 'deepwiki', 'github', 'filesystem', 'playwright', 'puppeteer',
      'memory', 'sequential-thinking', 'everything', 'kubernetes', 'ssh',
      'sqlite', 'turso', 'terraform', 'nixos', 'prometheus', 'helm',
      'fetch', 'youtube-transcript'
    ];
    
    // Check for missing or unexpected servers
    const configuredServers = Object.keys(config.mcpServers);
    const missingServers = expectedServers.filter(server => !configuredServers.includes(server));
    const unexpectedServers = configuredServers.filter(server => !expectedServers.includes(server));
    
    if (missingServers.length > 0) {
      result.errors.push(`Missing expected servers: ${missingServers.join(', ')}`);
    }
    
    if (unexpectedServers.length > 0) {
      console.log(`⚠️ Unexpected servers found: ${unexpectedServers.join(', ')}`);
    }

    console.log(`📋 Found ${serverCount} configured servers (expected ${expectedServers.length})`);
    return config;

  } catch (error) {
    result.valid = false;
    result.errors.push(`Structure validation failed: ${error.message}`);
    return null;
  }
}

/**
 * Validate individual server configurations
 * @param {Object} servers 
 * @param {Object} result 
 */
async function validateServers(servers, result) {
  const validationPromises = [];

  for (const [serverName, serverConfig] of Object.entries(servers)) {
    validationPromises.push(validateSingleServer(serverName, serverConfig, result));
  }

  await Promise.all(validationPromises);
}

/**
 * Validate a single server configuration
 * @param {string} serverName 
 * @param {MCPServer} serverConfig 
 * @param {Object} result 
 */
async function validateSingleServer(serverName, serverConfig, result) {
  try {
    // Check for required properties based on server type
    const isHttpServer = !!serverConfig.serverUrl;
    const isStdioServer = !!serverConfig.command;

    if (!isHttpServer && !isStdioServer) {
      result.valid = false;
      result.errors.push(`Server "${serverName}": Missing required "command" or "serverUrl" property`);
      return;
    }

    if (isHttpServer && isStdioServer) {
      result.warnings.push(`Server "${serverName}": Has both "command" and "serverUrl", will use serverUrl`);
    }

    // Validate HTTP server configuration
    if (isHttpServer) {
      try {
        new URL(serverConfig.serverUrl);
        
        // Special validation for SSE servers
        if (serverName === 'deepwiki' && !serverConfig.serverUrl.includes('sse')) {
          result.warnings.push(`Server "${serverName}": URL should include 'sse' for Server-Sent Events`);
        }
      } catch {
        result.valid = false;
        result.errors.push(`Server "${serverName}": Invalid serverUrl format`);
      }
    }

    // Validate stdio server configuration
    if (isStdioServer) {
      if (typeof serverConfig.command !== 'string' || serverConfig.command.trim() === '') {
        result.valid = false;
        result.errors.push(`Server "${serverName}": "command" must be a non-empty string`);
      }

      if (serverConfig.args && !Array.isArray(serverConfig.args)) {
        result.valid = false;
        result.errors.push(`Server "${serverName}": "args" must be an array`);
      }

      // Validate server-specific package names
      const expectedPackages = {
        'context7': '@upstash/context7-mcp',
        'github': '@modelcontextprotocol/server-github',
        'filesystem': '@modelcontextprotocol/server-filesystem',
        'playwright': '@playwright/mcp',
        'puppeteer': '@modelcontextprotocol/server-puppeteer',
        'memory': '@modelcontextprotocol/server-memory',
        'sequential-thinking': '@modelcontextprotocol/server-sequential-thinking',
        'everything': '@modelcontextprotocol/server-everything',
        'kubernetes': 'mcp-server-kubernetes',
        'ssh': '@modelcontextprotocol/server-ssh',
        'sqlite': '@modelcontextprotocol/server-sqlite',
        'turso': '@modelcontextprotocol/server-turso',
        'terraform': '@modelcontextprotocol/server-terraform',
        'nixos': '@modelcontextprotocol/server-nixos',
        'prometheus': '@modelcontextprotocol/server-prometheus',
        'helm': '@modelcontextprotocol/server-helm',
        'fetch': '@modelcontextprotocol/server-fetch',
        'youtube-transcript': '@modelcontextprotocol/server-youtube-transcript'
      };

      if (expectedPackages[serverName] && serverConfig.args) {
        const expectedPackage = expectedPackages[serverName];
        const hasCorrectPackage = serverConfig.args.some(arg => arg.includes(expectedPackage));
        if (!hasCorrectPackage) {
          result.warnings.push(`Server "${serverName}": Expected package "${expectedPackage}" in args`);
        }
      }

      // Validate command exists
      if (serverConfig.command && !serverConfig.command.includes('/')) {
        // Check if command is available in PATH
        try {
          await checkCommandExists(serverConfig.command);
        } catch (error) {
          result.warnings.push(`Server "${serverName}": Command "${serverConfig.command}" may not be available in PATH`);
        }
      }
    }

    // Validate environment variables
    if (serverConfig.env && typeof serverConfig.env !== 'object') {
      result.valid = false;
      result.errors.push(`Server "${serverName}": "env" must be an object`);
    }

  } catch (error) {
    result.valid = false;
    result.errors.push(`Server "${serverName}": Validation failed - ${error.message}`);
  }
}

/**
 * Check if a command exists in PATH
 * @param {string} command 
 * @returns {Promise<boolean>}
 */
function checkCommandExists(command) {
  return new Promise((resolve, reject) => {
    const child = spawn('which', [command], { stdio: 'pipe' });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`Command not found: ${command}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Validate environment variables
 * @param {Object} servers 
 * @param {Object} result 
 */
async function validateEnvironment(servers, result) {
  const requiredEnvVars = new Set();
  const optionalEnvVars = new Set();
  
  // Extract environment variables from server configurations
  for (const [serverName, serverConfig] of Object.entries(servers)) {
    if (serverConfig.env) {
      for (const [envVar, envValue] of Object.entries(serverConfig.env)) {
        if (typeof envValue === 'string' && envValue.includes('${')) {
          // Parse environment variable references
          const matches = envValue.match(/\$\{([^}]+)\}/g);
          if (matches) {
            matches.forEach(match => {
              const varName = match.slice(2, -1); // Remove ${ and }
              const [varKey, defaultValue] = varName.split(':-');
              
              if (defaultValue !== undefined) {
                optionalEnvVars.add(varKey);
              } else {
                requiredEnvVars.add(varKey);
              }
            });
          }
        }
      }
    }
  }

  // Check required environment variables
  const missingRequired = [];
  const missingOptional = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingRequired.push(envVar);
    }
  }

  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      missingOptional.push(envVar);
    }
  }

  if (missingRequired.length > 0) {
    result.valid = false;
    result.errors.push(`Missing required environment variables: ${missingRequired.join(', ')}`);
  }

  if (missingOptional.length > 0) {
    result.warnings.push(`Missing optional environment variables: ${missingOptional.join(', ')}`);
  }

  // Check for .env file if environment variables are missing
  if ((missingRequired.length > 0 || missingOptional.length > 0) && fs.existsSync(ENV_FILE_PATH)) {
    result.warnings.push('Found .env file - make sure to load it before running MCP servers');
  }

  // Additional validation for specific environment variables
  validateSpecificEnvVars(result);

  console.log(`🌍 Environment validation: ${requiredEnvVars.size} required, ${optionalEnvVars.size} optional`);
}

/**
 * Validate specific environment variables with format checks
 * @param {Object} result 
 */
function validateSpecificEnvVars(result) {
  // GitHub token validation
  const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (githubToken) {
    if (githubToken === 'your_token_here' || githubToken.includes('xxxx') || githubToken === 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      result.warnings.push('GITHUB_PERSONAL_ACCESS_TOKEN appears to be a placeholder - update with real token');
    } else if (!githubToken.startsWith('ghp_')) {
      result.warnings.push('GITHUB_PERSONAL_ACCESS_TOKEN should start with "ghp_" for personal access tokens');
    } else if (githubToken.length !== 40) {
      result.warnings.push('GITHUB_PERSONAL_ACCESS_TOKEN should be 40 characters long');
    }
  }

  // Turso database validation
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    if (tursoUrl.includes('your-database-name') || tursoUrl === 'libsql://your-database-name.turso.io') {
      result.warnings.push('TURSO_DATABASE_URL appears to be a placeholder - update with real database URL');
    } else if (!tursoUrl.startsWith('libsql://')) {
      result.warnings.push('TURSO_DATABASE_URL should start with "libsql://"');
    } else if (!tursoUrl.includes('.turso.io')) {
      result.warnings.push('TURSO_DATABASE_URL should include ".turso.io" domain');
    }
  }

  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  if (tursoToken) {
    if (tursoToken === 'your-auth-token-here') {
      result.warnings.push('TURSO_AUTH_TOKEN appears to be a placeholder - update with real token');
    }
  }

  // Prometheus URL validation
  const prometheusUrl = process.env.PROMETHEUS_URL;
  if (prometheusUrl) {
    try {
      new URL(prometheusUrl);
    } catch {
      result.warnings.push('PROMETHEUS_URL is not a valid URL format');
    }
  }

  // Kubernetes config validation
  const kubeconfig = process.env.KUBECONFIG;
  if (kubeconfig) {
    const expandedPath = kubeconfig.replace(/\$\{HOME\}/g, require('os').homedir());
    if (!require('fs').existsSync(expandedPath)) {
      result.warnings.push(`KUBECONFIG file not found: ${expandedPath}`);
    }
  }
}

/**
 * Test server connectivity
 * @param {Object} servers 
 * @param {Object} result 
 */
async function validateConnectivity(servers, result) {
  console.log('🔗 Testing server connectivity...');
  
  const connectivityTests = [];

  for (const [serverName, serverConfig] of Object.entries(servers)) {
    if (serverConfig.serverUrl) {
      // Test HTTP server connectivity
      connectivityTests.push(testHttpServer(serverName, serverConfig.serverUrl, result));
    } else if (serverConfig.command) {
      // Test stdio server command availability
      connectivityTests.push(testStdioServer(serverName, serverConfig, result));
    }
  }

  const results = await Promise.allSettled(connectivityTests);
  
  let successCount = 0;
  results.forEach((testResult, index) => {
    if (testResult.status === 'fulfilled') {
      successCount++;
    }
  });

  console.log(`🔗 Connectivity tests: ${successCount}/${results.length} servers reachable`);
}

/**
 * Test HTTP server connectivity
 * @param {string} serverName 
 * @param {string} serverUrl 
 * @param {Object} result 
 */
async function testHttpServer(serverName, serverUrl, result) {
  try {
    const url = new URL(serverUrl);
    const https = url.protocol === 'https:' ? require('https') : require('http');
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'HEAD',
        timeout: TIMEOUT_MS
      };

      const req = https.request(options, (res) => {
        if (res.statusCode < 400) {
          resolve();
        } else {
          result.warnings.push(`Server "${serverName}": HTTP ${res.statusCode} from ${serverUrl}`);
          resolve();
        }
      });

      req.on('error', (error) => {
        result.warnings.push(`Server "${serverName}": Connection failed - ${error.message}`);
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        result.warnings.push(`Server "${serverName}": Connection timeout`);
        resolve();
      });

      req.end();
    });

  } catch (error) {
    result.warnings.push(`Server "${serverName}": Connectivity test failed - ${error.message}`);
  }
}

/**
 * Test stdio server command availability
 * @param {string} serverName 
 * @param {MCPServer} serverConfig 
 * @param {Object} result 
 */
async function testStdioServer(serverName, serverConfig, result) {
  try {
    await checkCommandExists(serverConfig.command);
  } catch (error) {
    result.warnings.push(`Server "${serverName}": ${error.message}`);
  }
}

/**
 * Format and display validation results
 * @param {ValidationResult} result 
 */
function displayResults(result) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION RESULTS');
  console.log('='.repeat(60));

  if (result.valid) {
    console.log('✅ Overall Status: VALID');
  } else {
    console.log('❌ Overall Status: INVALID');
  }

  // Display errors
  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  // Display warnings
  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }

  // Display detailed results
  console.log('\n📋 DETAILED RESULTS:');
  Object.entries(result.details).forEach(([category, details]) => {
    const status = details.valid ? '✅' : '❌';
    const errorCount = details.errors ? details.errors.length : 0;
    const warningCount = details.warnings ? details.warnings.length : 0;
    
    console.log(`  ${status} ${category.toUpperCase()}: ${errorCount} errors, ${warningCount} warnings`);
  });

  console.log('\n' + '='.repeat(60));
}

// CLI execution
if (require.main === module) {
  const configPath = process.argv[2] || DEFAULT_CONFIG_PATH;
  
  validateMCPConfig(configPath)
    .then(result => {
      displayResults(result);
      process.exit(result.valid ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation script failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  validateMCPConfig,
  validateStructure,
  validateServers,
  validateEnvironment,
  validateConnectivity
};