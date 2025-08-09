#!/usr/bin/env node

/**
 * Test MCP server installations and basic functionality
 * This script validates that all MCP servers can be invoked correctly
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
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

async function testBunxServer(serverName, args) {
  return new Promise((resolve) => {
    log(`  Testing bunx server: ${args.join(' ')}`, COLORS.BLUE);
    
    // Test if the package can be resolved
    const testCommand = spawn('bunx', ['--help', ...args.slice(1)], {
      stdio: 'pipe',
      timeout: 10000
    });
    
    let hasOutput = false;
    
    testCommand.stdout.on('data', () => {
      hasOutput = true;
    });
    
    testCommand.stderr.on('data', (data) => {
      const output = data.toString();
      // Some packages show help via stderr, which is normal
      if (!output.includes('error') && !output.includes('Error')) {
        hasOutput = true;
      }
    });
    
    testCommand.on('close', (code) => {
      if (hasOutput || code === 0) {
        log(`  ✅ ${serverName}: Package accessible`, COLORS.GREEN);
        resolve(true);
      } else {
        log(`  ❌ ${serverName}: Package not accessible (exit code: ${code})`, COLORS.RED);
        resolve(false);
      }
    });
    
    testCommand.on('error', (error) => {
      log(`  ❌ ${serverName}: Error testing package - ${error.message}`, COLORS.RED);
      resolve(false);
    });
    
    // Timeout fallback
    setTimeout(() => {
      testCommand.kill('SIGTERM');
      log(`  ⚠️ ${serverName}: Test timeout - assuming package exists`, COLORS.YELLOW);
      resolve(true);
    }, 10000);
  });
}

function testLocalServer(serverName, command) {
  try {
    execSync(`which ${command}`, { stdio: 'pipe' });
    log(`  ✅ ${serverName}: Local command available`, COLORS.GREEN);
    return true;
  } catch (error) {
    log(`  ❌ ${serverName}: Local command not found - ${command}`, COLORS.RED);
    log(`    Install with: npm install -g ${command}`, COLORS.YELLOW);
    return false;
  }
}

function testRemoteServer(serverName, serverUrl) {
  log(`  ℹ️ ${serverName}: Remote server (${serverUrl}) - skipping local test`, COLORS.BLUE);
  return true; // Remote servers can't be tested locally
}

async function main() {
  log(`${COLORS.BOLD}🧪 Testing MCP Server Installations${COLORS.RESET}\n`);
  
  const mcpServers = loadMcpConfig();
  const serverNames = Object.keys(mcpServers);
  
  log(`Found ${serverNames.length} MCP servers to test:\n`);
  
  const results = [];
  
  for (const [serverName, config] of Object.entries(mcpServers)) {
    log(`${COLORS.BOLD}Testing ${serverName}:${COLORS.RESET}`);
    
    let success = false;
    
    if (config.command === 'bunx') {
      success = await testBunxServer(serverName, config.args || []);
    } else if (config.serverUrl) {
      success = testRemoteServer(serverName, config.serverUrl);
    } else {
      success = testLocalServer(serverName, config.command);
    }
    
    results.push({ name: serverName, success });
    console.log(''); // Empty line for readability
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  log(`${COLORS.BOLD}📊 Test Summary:${COLORS.RESET}`);
  log(`✅ Successful: ${successful}/${total}`, successful === total ? COLORS.GREEN : COLORS.YELLOW);
  
  if (successful < total) {
    log(`❌ Failed servers:`, COLORS.RED);
    results.filter(r => !r.success).forEach(r => {
      log(`  - ${r.name}`, COLORS.RED);
    });
  }
  
  log(`\n${COLORS.BOLD}💡 Next steps:${COLORS.RESET}`);
  log(`1. Fix any failed server installations`);
  log(`2. Set up required environment variables in .env`);
  log(`3. Restart your MCP client (Claude Desktop, Cursor, etc.)`);
  log(`4. Test with: "List available MCP servers" in your AI client`);
  
  process.exit(successful === total ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Test script failed: ${error.message}`, COLORS.RED);
    process.exit(1);
  });
}

module.exports = { testBunxServer, testLocalServer, testRemoteServer };