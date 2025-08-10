#!/usr/bin/env node

/**
 * Parallel Health Check - Fast concurrent testing of all MCP servers
 * Uses Promise.all for maximum performance and parallel execution
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m'
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
    return {};
  }
}

async function testServerHealth(serverName, config, timeout = 5000) {
  const startTime = process.hrtime.bigint();
  
  return new Promise((resolve) => {
    if (!config.command) {
      resolve({
        server: serverName,
        status: 'skipped',
        type: config.serverUrl ? 'sse' : 'unknown',
        duration: 0,
        error: 'No command specified'
      });
      return;
    }

    const testProcess = spawn(config.command, config.args || [], {
      stdio: 'pipe',
      env: { ...process.env, ...config.env }
    });

    let stdout = '';
    let stderr = '';
    let resolved = false;

    const finish = (status, error = null) => {
      if (resolved) return;
      resolved = true;
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to ms
      
      resolve({
        server: serverName,
        status,
        type: 'stdio',
        duration,
        error,
        hasOutput: stdout.length > 0 || stderr.length > 0
      });
    };

    testProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      // If the server starts responding, it's healthy
      if (stdout.includes('MCP') || stdout.includes('server')) {
        testProcess.kill('SIGTERM');
        finish('healthy');
      }
    });

    testProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      // Some servers log startup info to stderr
      if (stderr.includes('listening') || stderr.includes('started')) {
        testProcess.kill('SIGTERM');
        finish('healthy');
      }
    });

    testProcess.on('close', (code) => {
      if (!resolved) {
        if (code === 0) {
          finish('healthy');
        } else if (stderr.includes('ENOENT')) {
          finish('missing');
        } else {
          finish('error', `Exit code: ${code}`);
        }
      }
    });

    testProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        finish('missing', 'Package not found');
      } else {
        finish('error', error.message);
      }
    });

    // Timeout
    setTimeout(() => {
      if (!resolved) {
        testProcess.kill('SIGTERM');
        finish('timeout', 'Server took too long to respond');
      }
    }, timeout);
  });
}

async function main() {
  const startTime = Date.now();
  
  log(`${COLORS.BOLD}🚀 Parallel MCP Server Health Check${COLORS.RESET}\n`);
  
  const mcpServers = loadMcpConfig();
  const serverNames = Object.keys(mcpServers);
  
  if (serverNames.length === 0) {
    log('❌ No MCP servers configured', COLORS.RED);
    process.exit(1);
  }
  
  log(`Testing ${serverNames.length} servers in parallel...`, COLORS.BLUE);
  console.log('');
  
  // Test all servers in parallel
  const healthPromises = serverNames.map(serverName => 
    testServerHealth(serverName, mcpServers[serverName])
  );
  
  const results = await Promise.all(healthPromises);
  const totalTime = Date.now() - startTime;
  
  // Display results
  log(`${COLORS.BOLD}📊 Health Check Results:${COLORS.RESET}`);
  console.log('');
  
  const healthy = results.filter(r => r.status === 'healthy');
  const errors = results.filter(r => r.status === 'error');
  const missing = results.filter(r => r.status === 'missing');
  const timeouts = results.filter(r => r.status === 'timeout');
  const skipped = results.filter(r => r.status === 'skipped');
  
  results.forEach(result => {
    const statusColor = {
      'healthy': COLORS.GREEN,
      'error': COLORS.RED,
      'missing': COLORS.RED,
      'timeout': COLORS.YELLOW,
      'skipped': COLORS.BLUE
    }[result.status] || COLORS.RESET;
    
    const statusIcon = {
      'healthy': '✅',
      'error': '❌',
      'missing': '📦',
      'timeout': '⏰',
      'skipped': '⏭️'
    }[result.status] || '❓';
    
    const durationStr = result.duration > 0 ? ` (${Math.round(result.duration)}ms)` : '';
    const errorStr = result.error ? ` - ${result.error}` : '';
    
    log(`  ${statusIcon} ${result.server}${durationStr}${errorStr}`, statusColor);
  });
  
  console.log('');
  log(`${COLORS.BOLD}Summary:${COLORS.RESET}`);
  log(`✅ Healthy: ${healthy.length}`, healthy.length > 0 ? COLORS.GREEN : COLORS.DIM);
  log(`❌ Errors: ${errors.length}`, errors.length > 0 ? COLORS.RED : COLORS.DIM);
  log(`📦 Missing: ${missing.length}`, missing.length > 0 ? COLORS.RED : COLORS.DIM);
  log(`⏰ Timeouts: ${timeouts.length}`, timeouts.length > 0 ? COLORS.YELLOW : COLORS.DIM);
  log(`⏭️ Skipped: ${skipped.length}`, skipped.length > 0 ? COLORS.BLUE : COLORS.DIM);
  
  console.log('');
  log(`🏎️ Total time: ${totalTime}ms (parallel execution)`, COLORS.CYAN);
  log(`⚡ Average per server: ${Math.round(totalTime / serverNames.length)}ms`, COLORS.CYAN);
  
  const overallHealth = (healthy.length / serverNames.length) * 100;
  const healthColor = overallHealth >= 80 ? COLORS.GREEN : 
                     overallHealth >= 60 ? COLORS.YELLOW : COLORS.RED;
  
  log(`📊 Overall health: ${overallHealth.toFixed(1)}%`, healthColor);
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    totalTime,
    totalServers: serverNames.length,
    results: results.map(r => ({
      server: r.server,
      status: r.status,
      duration: r.duration,
      error: r.error
    }))
  };
  
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = path.join(reportsDir, `health-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`\n📁 Detailed report saved: ${reportPath}`, COLORS.BLUE);
  
  // Exit with appropriate code
  const hasErrors = errors.length > 0 || missing.length > 0;
  process.exit(hasErrors ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Health check failed: ${error.message}`, COLORS.RED);
    process.exit(1);
  });
}

module.exports = { testServerHealth };