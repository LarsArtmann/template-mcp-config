#!/usr/bin/env node

/**
 * Warm the bunx cache by pre-downloading MCP server packages
 * This improves MCP server startup times by ensuring packages are cached locally
 */

const { spawn } = require('child_process');
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

async function warmPackageCache(packageName) {
  return new Promise((resolve) => {
    log(`  📦 Warming cache for: ${packageName}`, COLORS.BLUE);
    
    const warmCommand = spawn('bunx', ['--help', packageName], {
      stdio: 'pipe',
      timeout: 30000
    });
    
    let hasOutput = false;
    let errorOutput = '';
    
    warmCommand.stdout.on('data', () => {
      hasOutput = true;
    });
    
    warmCommand.stderr.on('data', (data) => {
      const output = data.toString();
      errorOutput += output;
      // Some packages show help via stderr, which is normal
      if (!output.includes('error') && !output.includes('Error')) {
        hasOutput = true;
      }
    });
    
    warmCommand.on('close', (code) => {
      if (hasOutput || code === 0) {
        log(`    ✅ Cached: ${packageName}`, COLORS.GREEN);
        resolve(true);
      } else {
        log(`    ❌ Failed to cache: ${packageName}`, COLORS.RED);
        if (errorOutput) {
          log(`    Error: ${errorOutput.trim()}`, COLORS.RED);
        }
        resolve(false);
      }
    });
    
    warmCommand.on('error', (error) => {
      log(`    ❌ Error caching ${packageName}: ${error.message}`, COLORS.RED);
      resolve(false);
    });
    
    // Timeout fallback
    setTimeout(() => {
      warmCommand.kill('SIGTERM');
      log(`    ⚠️ Timeout caching ${packageName} - may still be downloading`, COLORS.YELLOW);
      resolve(true);
    }, 30000);
  });
}

async function main() {
  log(`${COLORS.BOLD}🔥 Warming MCP Server Package Cache${COLORS.RESET}\n`);
  
  const mcpServers = loadMcpConfig();
  const bunxPackages = [];
  
  // Extract bunx packages from MCP configuration
  for (const [serverName, config] of Object.entries(mcpServers)) {
    if (config.command === 'bunx' && config.args && config.args.length > 0) {
      // Skip the '-y' flag and get the package name
      const packageName = config.args.find(arg => !arg.startsWith('-'));
      if (packageName) {
        bunxPackages.push({
          server: serverName,
          package: packageName
        });
      }
    }
  }
  
  if (bunxPackages.length === 0) {
    log(`⚠️ No bunx packages found in MCP configuration`, COLORS.YELLOW);
    return;
  }
  
  log(`Found ${bunxPackages.length} bunx packages to cache:`);
  bunxPackages.forEach(({ server, package: pkg }) => {
    log(`  - ${pkg} (${server})`);
  });
  console.log('');
  
  // Warm cache for each package
  const results = [];
  for (const { server, package: pkg } of bunxPackages) {
    log(`${COLORS.BOLD}Caching ${server}:${COLORS.RESET}`);
    const success = await warmPackageCache(pkg);
    results.push({ server, package: pkg, success });
    console.log(''); // Empty line for readability
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  log(`${COLORS.BOLD}📊 Cache Warming Summary:${COLORS.RESET}`);
  log(`✅ Successfully cached: ${successful}/${total}`, successful === total ? COLORS.GREEN : COLORS.YELLOW);
  
  if (successful < total) {
    log(`❌ Failed to cache:`, COLORS.RED);
    results.filter(r => !r.success).forEach(r => {
      log(`  - ${r.package} (${r.server})`, COLORS.RED);
    });
  }
  
  log(`\n${COLORS.BOLD}💡 Benefits of cached packages:${COLORS.RESET}`);
  log(`1. Faster MCP server startup times`);
  log(`2. Reliable offline access to packages`);
  log(`3. Reduced network dependency during development`);
  log(`4. Better performance in containerized environments`);
  
  if (successful === total) {
    log(`\n🎉 All packages cached successfully! Your MCP servers should start faster.`, COLORS.GREEN);
  } else {
    log(`\n⚠️ Some packages failed to cache. MCP servers may take longer to start.`, COLORS.YELLOW);
  }
  
  process.exit(successful === total ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Cache warming script failed: ${error.message}`, COLORS.RED);
    process.exit(1);
  });
}

module.exports = { warmPackageCache };