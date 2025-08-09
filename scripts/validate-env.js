#!/usr/bin/env node

/**
 * Validate environment configuration for MCP servers
 * This script checks that required environment variables are set
 */

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

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    log(`❌ Failed to read .env file: ${error.message}`, COLORS.RED);
    return null;
  }
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

function extractRequiredEnvVars(mcpServers) {
  const required = [];
  const optional = [];
  
  for (const [serverName, config] of Object.entries(mcpServers)) {
    if (config.env) {
      for (const [envVar, defaultValue] of Object.entries(config.env)) {
        const info = {
          server: serverName,
          variable: envVar,
          hasDefault: defaultValue !== undefined && defaultValue !== ''
        };
        
        // Check if it's a required variable (no default or empty default)
        if (!info.hasDefault || defaultValue === '${' + envVar + ':-}') {
          required.push(info);
        } else {
          optional.push(info);
        }
      }
    }
  }
  
  return { required, optional };
}

function validateEnvironment() {
  log(`${COLORS.BOLD}🔍 Validating Environment Configuration${COLORS.RESET}\n`);
  
  const mcpServers = loadMcpConfig();
  const { required, optional } = extractRequiredEnvVars(mcpServers);
  const envFile = loadEnvFile();
  const processEnv = process.env;
  
  // Check if .env file exists
  if (!envFile) {
    log(`⚠️ No .env file found. Copy .env.example to .env and configure:`, COLORS.YELLOW);
    log(`   cp .env.example .env`, COLORS.BLUE);
    console.log('');
  } else {
    log(`✅ .env file found`, COLORS.GREEN);
  }
  
  // Validate required environment variables
  let allRequired = true;
  
  if (required.length > 0) {
    log(`${COLORS.BOLD}Required Environment Variables:${COLORS.RESET}`);
    
    for (const { server, variable } of required) {
      const envValue = processEnv[variable] || (envFile && envFile[variable]);
      
      if (envValue && envValue.trim() && !envValue.includes('${')) {
        log(`  ✅ ${variable} (${server}): Set`, COLORS.GREEN);
      } else {
        log(`  ❌ ${variable} (${server}): Not set or empty`, COLORS.RED);
        allRequired = false;
      }
    }
    console.log('');
  } else {
    log(`✅ No required environment variables`, COLORS.GREEN);
    console.log('');
  }
  
  // Show optional environment variables
  if (optional.length > 0) {
    log(`${COLORS.BOLD}Optional Environment Variables:${COLORS.RESET}`);
    
    for (const { server, variable } of optional) {
      const envValue = processEnv[variable] || (envFile && envFile[variable]);
      
      if (envValue && envValue.trim() && !envValue.includes('${')) {
        log(`  ✅ ${variable} (${server}): Set`, COLORS.GREEN);
      } else {
        log(`  ⚪ ${variable} (${server}): Using default`, COLORS.BLUE);
      }
    }
    console.log('');
  }
  
  // Provide guidance
  log(`${COLORS.BOLD}💡 Configuration Guide:${COLORS.RESET}`);
  
  if (!allRequired) {
    log(`1. Set missing required variables in .env file`, COLORS.YELLOW);
    log(`2. Restart your MCP client after updating .env`, COLORS.YELLOW);
  } else {
    log(`1. All required variables are configured ✅`, COLORS.GREEN);
  }
  
  log(`2. See README.md for detailed environment setup instructions`);
  log(`3. Optional variables provide enhanced functionality when configured`);
  
  return allRequired;
}

function main() {
  const isValid = validateEnvironment();
  process.exit(isValid ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { validateEnvironment, loadEnvFile, extractRequiredEnvVars };