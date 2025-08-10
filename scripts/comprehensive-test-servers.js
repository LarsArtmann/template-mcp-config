#!/usr/bin/env node

/**
 * COMPREHENSIVE MCP SERVER TESTING SUITE
 * Tests ALL 18 servers with proper configuration validation
 * Includes environment variable testing, package availability, and functionality checks
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function loadMcpConfig() {
  try {
    const configPath = path.join(process.cwd(), '.mcp.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.mcpServers || {};
  } catch (error) {
    log(`❌ Failed to load .mcp.json: ${error.message}`, COLORS.RED);
    process.exit(1);
  }
}

// Server configuration requirements
const SERVER_REQUIREMENTS = {
  'context7': { 
    envVars: [],
    description: 'Context management system',
    critical: true
  },
  'deepwiki': { 
    envVars: [],
    description: 'Remote wiki server',
    critical: false,
    remote: true,
    testUrl: 'https://mcp.deepwiki.com/sse'
  },
  'github': { 
    envVars: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    description: 'GitHub integration',
    critical: true
  },
  'filesystem': { 
    envVars: [],
    description: 'File system access',
    critical: true
  },
  'playwright': { 
    envVars: [],
    description: 'Browser automation',
    critical: false
  },
  'puppeteer': { 
    envVars: [],
    description: 'Browser automation alternative',
    critical: false
  },
  'memory': { 
    envVars: [],
    description: 'Persistent memory',
    critical: true
  },
  'sequential-thinking': { 
    envVars: [],
    description: 'Sequential reasoning',
    critical: false
  },
  'everything': { 
    envVars: [],
    description: 'Everything server',
    critical: false
  },
  'kubernetes': { 
    envVars: ['KUBECONFIG'],
    description: 'Kubernetes management',
    critical: false
  },
  'ssh': { 
    envVars: [],
    description: 'SSH connections',
    critical: false
  },
  'sqlite': { 
    envVars: [],
    description: 'SQLite database',
    critical: false
  },
  'turso': { 
    envVars: ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'],
    description: 'Turso database',
    critical: false
  },
  'terraform': { 
    envVars: [],
    description: 'Infrastructure as code',
    critical: false
  },
  'nixos': { 
    envVars: [],
    description: 'NixOS package management',
    critical: false
  },
  'prometheus': { 
    envVars: ['PROMETHEUS_URL'],
    description: 'Prometheus monitoring',
    critical: false
  },
  'helm': { 
    envVars: [],
    description: 'Helm chart management',
    critical: false
  },
  'fetch': { 
    envVars: [],
    description: 'HTTP fetch utility',
    critical: false
  },
  'youtube-transcript': { 
    envVars: [],
    description: 'YouTube transcript extraction',
    critical: false
  }
};

async function testRemoteServer(serverName, serverUrl) {
  return new Promise((resolve) => {
    log(`  Testing remote server: ${serverUrl}`, COLORS.BLUE);
    
    const protocol = serverUrl.startsWith('https:') ? https : http;
    const req = protocol.request(serverUrl, { 
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'MCP-Test-Suite/1.0'
      }
    }, (res) => {
      log(`  ✅ ${serverName}: Remote server accessible (status: ${res.statusCode})`, COLORS.GREEN);
      resolve({
        success: true,
        details: `Remote server responded with status ${res.statusCode}`,
        statusCode: res.statusCode
      });
    });
    
    req.on('error', (error) => {
      log(`  ❌ ${serverName}: Remote server error - ${error.message}`, COLORS.RED);
      resolve({
        success: false,
        details: `Remote server error: ${error.message}`,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      log(`  ⚠️ ${serverName}: Remote server timeout`, COLORS.YELLOW);
      resolve({
        success: false,
        details: 'Remote server timeout after 10s',
        error: 'timeout'
      });
    });
    
    req.end();
  });
}

async function testBunxServer(serverName, args, timeout = 15000) {
  return new Promise((resolve) => {
    log(`  Testing bunx server: ${args.join(' ')}`, COLORS.BLUE);
    
    // Try to run the package with --help or --version
    const testArgs = [...args, '--help'];
    const testCommand = spawn('bunx', testArgs, {
      stdio: 'pipe',
      timeout
    });
    
    let stdout = '';
    let stderr = '';
    let hasValidOutput = false;
    
    testCommand.stdout.on('data', (data) => {
      stdout += data.toString();
      const output = data.toString().toLowerCase();
      // Look for signs of a working MCP server
      if (output.includes('help') || output.includes('usage') || output.includes('mcp') || output.includes('options')) {
        hasValidOutput = true;
      }
    });
    
    testCommand.stderr.on('data', (data) => {
      stderr += data.toString();
      const output = data.toString().toLowerCase();
      // Some packages show help via stderr, which is normal
      if (output.includes('help') || output.includes('usage') || output.includes('options')) {
        hasValidOutput = true;
      }
      // Check for 404 errors specifically
      if (output.includes('404') || output.includes('not found') || output.includes('package not found')) {
        hasValidOutput = false;
      }
    });
    
    testCommand.on('close', (code) => {
      const success = hasValidOutput || code === 0;
      const details = success 
        ? 'Package accessible and responds to commands'
        : `Package test failed (exit code: ${code})`;
      
      if (success) {
        log(`  ✅ ${serverName}: Package accessible`, COLORS.GREEN);
      } else {
        log(`  ❌ ${serverName}: Package not accessible (exit code: ${code})`, COLORS.RED);
        if (stderr.includes('404')) {
          log(`    Package not found in registry`, COLORS.RED);
        }
      }
      
      resolve({
        success,
        details,
        exitCode: code,
        stdout: stdout.slice(0, 200),
        stderr: stderr.slice(0, 200)
      });
    });
    
    testCommand.on('error', (error) => {
      log(`  ❌ ${serverName}: Error testing package - ${error.message}`, COLORS.RED);
      resolve({
        success: false,
        details: `Error testing package: ${error.message}`,
        error: error.message
      });
    });
    
    // Timeout fallback
    setTimeout(() => {
      testCommand.kill('SIGTERM');
      log(`  ⚠️ ${serverName}: Test timeout after ${timeout}ms`, COLORS.YELLOW);
      resolve({
        success: false,
        details: `Test timeout after ${timeout}ms`,
        error: 'timeout'
      });
    }, timeout);
  });
}

function checkEnvironmentVariables(serverName, requiredEnvVars, serverConfig) {
  const results = {
    configured: [],
    missing: [],
    warnings: []
  };
  
  for (const envVar of requiredEnvVars) {
    // Check if it's configured in the server config
    const configuredInServer = serverConfig.env && serverConfig.env[envVar];
    
    if (configuredInServer) {
      results.configured.push(envVar);
      
      // Check if it has a default value or template
      const envValue = serverConfig.env[envVar];
      if (envValue.includes('${') && envValue.includes(':-}')) {
        results.warnings.push(`${envVar}: Optional (has default fallback)`);
      } else if (envValue.includes('${')) {
        results.warnings.push(`${envVar}: Uses environment substitution`);
      }
    } else {
      results.missing.push(envVar);
    }
  }
  
  return results;
}

async function testAllServers() {
  log(`${COLORS.BOLD}🧪 COMPREHENSIVE MCP SERVER TESTING SUITE${COLORS.RESET}\n`);
  
  const mcpServers = loadMcpConfig();
  const serverNames = Object.keys(mcpServers);
  
  log(`Found ${serverNames.length} MCP servers to test:\n`);
  
  const results = [];
  let testsCompleted = 0;
  
  // Test servers in parallel batches to avoid overwhelming the system
  const BATCH_SIZE = 5;
  const serverEntries = Object.entries(mcpServers);
  
  for (let i = 0; i < serverEntries.length; i += BATCH_SIZE) {
    const batch = serverEntries.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async ([serverName, config]) => {
      log(`${COLORS.BOLD}[${testsCompleted + 1}/${serverNames.length}] Testing ${serverName}:${COLORS.RESET}`);
      
      const requirements = SERVER_REQUIREMENTS[serverName] || { envVars: [], description: 'Unknown', critical: false };
      
      // Check environment variables
      const envCheck = checkEnvironmentVariables(serverName, requirements.envVars, config);
      
      // Log environment variable status
      if (requirements.envVars.length > 0) {
        log(`  Environment variables:`, COLORS.CYAN);
        envCheck.configured.forEach(env => log(`    ✅ ${env}: Configured`, COLORS.GREEN));
        envCheck.missing.forEach(env => log(`    ❌ ${env}: Missing configuration`, COLORS.RED));
        envCheck.warnings.forEach(warning => log(`    ⚠️ ${warning}`, COLORS.YELLOW));
      }
      
      let testResult;
      
      if (config.serverUrl) {
        // Remote server
        testResult = await testRemoteServer(serverName, config.serverUrl);
      } else if (config.command === 'bunx') {
        // Bunx-based server
        testResult = await testBunxServer(serverName, config.args || []);
      } else {
        // Local command
        try {
          execSync(`which ${config.command}`, { stdio: 'pipe' });
          testResult = {
            success: true,
            details: 'Local command available'
          };
          log(`  ✅ ${serverName}: Local command available`, COLORS.GREEN);
        } catch (error) {
          testResult = {
            success: false,
            details: `Local command not found: ${config.command}`,
            error: error.message
          };
          log(`  ❌ ${serverName}: Local command not found - ${config.command}`, COLORS.RED);
        }
      }
      
      testsCompleted++;
      
      const result = {
        name: serverName,
        ...testResult,
        critical: requirements.critical,
        description: requirements.description,
        envVars: requirements.envVars,
        envCheck,
        config
      };
      
      results.push(result);
      console.log(''); // Empty line for readability
      
      return result;
    });
    
    await Promise.all(batchPromises);
  }
  
  return results;
}

function generateReport(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const critical = results.filter(r => r.critical);
  const criticalFailed = failed.filter(r => r.critical);
  
  log(`${COLORS.BOLD}📊 COMPREHENSIVE TEST SUMMARY:${COLORS.RESET}`);
  log(`Total Servers: ${results.length}`);
  log(`✅ Working: ${successful.length}/${results.length} (${Math.round(successful.length/results.length*100)}%)`, 
      successful.length === results.length ? COLORS.GREEN : COLORS.YELLOW);
  log(`❌ Failed: ${failed.length}/${results.length}`, failed.length > 0 ? COLORS.RED : COLORS.GREEN);
  log(`🔥 Critical Servers: ${critical.length} (${criticalFailed.length} failed)`, 
      criticalFailed.length > 0 ? COLORS.RED : COLORS.GREEN);
  
  if (criticalFailed.length > 0) {
    log(`\n${COLORS.RED}🚨 CRITICAL FAILURES (System may not work properly):${COLORS.RESET}`, COLORS.RED);
    criticalFailed.forEach(server => {
      log(`  ❌ ${server.name}: ${server.details}`, COLORS.RED);
    });
  }
  
  if (successful.length > 0) {
    log(`\n${COLORS.GREEN}✅ WORKING SERVERS:${COLORS.RESET}`);
    successful.forEach(server => {
      const criticalTag = server.critical ? ' (CRITICAL)' : '';
      log(`  ✅ ${server.name}: ${server.description}${criticalTag}`, COLORS.GREEN);
    });
  }
  
  if (failed.length > 0) {
    log(`\n${COLORS.RED}❌ FAILED SERVERS:${COLORS.RESET}`);
    failed.forEach(server => {
      const criticalTag = server.critical ? ' (CRITICAL)' : '';
      log(`  ❌ ${server.name}: ${server.details}${criticalTag}`, COLORS.RED);
    });
  }
  
  // Environment variable summary
  const serversNeedingEnv = results.filter(r => r.envVars && r.envVars.length > 0);
  if (serversNeedingEnv.length > 0) {
    log(`\n${COLORS.CYAN}🔧 ENVIRONMENT VARIABLE REQUIREMENTS:${COLORS.RESET}`);
    serversNeedingEnv.forEach(server => {
      server.envVars.forEach(envVar => {
        const status = server.envCheck.configured.includes(envVar) ? '✅' : '❌';
        log(`  ${status} ${server.name}: ${envVar}`, 
            server.envCheck.configured.includes(envVar) ? COLORS.GREEN : COLORS.RED);
      });
    });
  }
  
  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    critical: critical.length,
    criticalFailed: criticalFailed.length,
    results
  };
}

async function main() {
  const startTime = Date.now();
  
  try {
    const results = await testAllServers();
    const summary = generateReport(results);
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    log(`\n${COLORS.BOLD}⏱️ Testing completed in ${duration} seconds${COLORS.RESET}`);
    
    // Save detailed results
    const detailedResults = {
      timestamp: new Date().toISOString(),
      summary,
      details: results,
      duration
    };
    
    fs.writeFileSync('test-results-detailed.json', JSON.stringify(detailedResults, null, 2));
    log(`📄 Detailed results saved to test-results-detailed.json`, COLORS.BLUE);
    
    // Exit with error if critical servers failed
    const exitCode = summary.criticalFailed > 0 ? 1 : 0;
    log(`\n${COLORS.BOLD}Exit code: ${exitCode}${COLORS.RESET}`);
    process.exit(exitCode);
    
  } catch (error) {
    log(`❌ Testing suite failed: ${error.message}`, COLORS.RED);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testAllServers, generateReport };