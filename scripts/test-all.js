#!/usr/bin/env node

/**
 * UNIFIED MCP SERVER TEST SUITE
 * Consolidates all testing functionality into one comprehensive script
 * 
 * Features:
 * - Parallel execution for speed (from parallel-health-check.js)
 * - Comprehensive capability testing (from test-servers.js)  
 * - Environment variable validation (from comprehensive-test-servers.js)
 * - Server requirements definitions (from comprehensive-test-servers.js)
 * - Retry logic and proper error handling (from test-servers.js)
 * - Clean reporting and performance metrics (from parallel-health-check.js)
 * - Multiple output modes: summary, detailed, json
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class UnifiedMCPTester {
    constructor(options = {}) {
        this.projectRoot = path.dirname(__dirname);
        this.mcpConfigPath = path.join(this.projectRoot, '.mcp.json');
        this.envPath = path.join(this.projectRoot, '.env');
        this.results = {};
        
        // Configuration options
        this.testTimeout = options.timeout || 20000; // 20 seconds per test
        this.maxConcurrency = options.concurrency || 5; // Maximum concurrent tests
        this.retryCount = options.retries || 1; // Retry failed tests once
        this.outputMode = options.output || 'summary'; // summary, detailed, json
        this.fastMode = options.fast || false; // Skip capability tests in fast mode
        
        // Performance tracking
        this.startTime = Date.now();
        this.testStartTimes = {};
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',     // cyan
            success: '\x1b[32m',  // green  
            warning: '\x1b[33m',  // yellow
            error: '\x1b[31m',    // red
            progress: '\x1b[35m', // magenta
            reset: '\x1b[0m'      // reset
        };

        const prefixes = {
            info: '📋',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            progress: '⏳'
        };

        const color = colors[type] || colors.info;
        const prefix = prefixes[type] || prefixes.info;
        
        if (this.outputMode !== 'json') {
            console.log(`${color}${prefix} ${message}${colors.reset}`);
        }
    }

    // Server configuration requirements (from comprehensive-test-servers.js)
    getServerRequirements() {
        return {
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
                critical: true,
                testPaths: true
            },
            'playwright': { 
                envVars: [],
                description: 'Browser automation',
                critical: false,
                testBrowsers: true
            },
            'puppeteer': { 
                envVars: [],
                description: 'Browser automation alternative',
                critical: false
            },
            'memory': { 
                envVars: [],
                description: 'Persistent memory',
                critical: true,
                testStorage: true
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
                critical: false,
                testSSH: true
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
    }

    loadEnvironment() {
        if (fs.existsSync(this.envPath)) {
            const envContent = fs.readFileSync(this.envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const match = line.match(/^([^#=]+)=(.*)$/);
                if (match) {
                    process.env[match[1].trim()] = match[2].trim();
                }
            });
        }
    }

    checkEnvironmentVariables(serverName, requiredEnvVars, serverConfig) {
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

    async testRemoteServer(serverName, config) {
        return new Promise((resolve) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.testTimeout);
            
            fetch(config.serverUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'text/event-stream',
                    'User-Agent': 'MCP-Test-Suite/1.0'
                }
            })
            .then(response => {
                clearTimeout(timeoutId);
                if (response.ok) {
                    resolve({
                        success: true,
                        message: `Connected (${response.status})`,
                        statusCode: response.status
                    });
                } else {
                    resolve({
                        success: false,
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        statusCode: response.status
                    });
                }
            })
            .catch(error => {
                clearTimeout(timeoutId);
                resolve({
                    success: false,
                    message: error.message.includes('abort') ? 'Timeout' : error.message,
                    error: error.message
                });
            });
        });
    }

    async testLocalServer(serverName, config) {
        return new Promise((resolve) => {
            // Expand environment variables in command arguments
            const expandedArgs = config.args.map(arg => 
                arg.replace(/\$\{([^}]+)\}/g, (match, varName) => {
                    if (varName.includes(':-')) {
                        const [name, defaultValue] = varName.split(':-');
                        return process.env[name] || defaultValue;
                    }
                    return process.env[varName] || match;
                })
            );

            // Test with the full command including arguments but with --help
            const testArgs = [...expandedArgs, '--help'];
            const serverProcess = spawn(config.command, testArgs, {
                env: { ...process.env, ...config.env },
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let output = '';
            let errorOutput = '';
            
            const timeout = setTimeout(() => {
                serverProcess.kill('SIGKILL');
                resolve({
                    success: false,
                    message: 'Timeout - process killed',
                    error: 'timeout'
                });
            }, this.testTimeout);

            serverProcess.stdout?.on('data', (data) => {
                output += data.toString();
            });

            serverProcess.stderr?.on('data', (data) => {
                errorOutput += data.toString();
            });

            serverProcess.on('close', (code) => {
                clearTimeout(timeout);
                
                // Many MCP servers exit with code 0 when showing help
                if (code === 0) {
                    resolve({
                        success: true,
                        message: 'Command accessible',
                        exitCode: code
                    });
                } else if (output.includes('help') || output.includes('usage') || errorOutput.includes('help')) {
                    resolve({
                        success: true,
                        message: 'Command accessible (help shown)',
                        exitCode: code
                    });
                } else {
                    resolve({
                        success: false,
                        message: `Exit code ${code}: ${errorOutput.trim() || 'Command failed'}`,
                        exitCode: code,
                        stderr: errorOutput.slice(0, 200)
                    });
                }
            });

            serverProcess.on('error', (error) => {
                clearTimeout(timeout);
                resolve({
                    success: false,
                    message: `Process error: ${error.message}`,
                    error: error.message
                });
            });
        });
    }

    // Capability testing methods (from test-servers.js)
    async testServerCapabilities(serverName, config, requirements) {
        if (this.fastMode) {
            return { success: true, message: 'Skipped in fast mode' };
        }

        // Special capability tests based on server type
        if (requirements.testPaths && serverName === 'filesystem') {
            return this.testFilesystemPaths(config);
        }
        
        if (requirements.testBrowsers && serverName === 'playwright') {
            return this.testPlaywrightBrowsers();
        }
        
        if (requirements.testStorage && serverName === 'memory') {
            return this.testMemoryStorage(config);
        }
        
        if (requirements.testSSH && serverName === 'ssh') {
            return this.testSSHKeys();
        }
        
        if (serverName === 'github') {
            return this.testGithubToken();
        }
        
        if (serverName === 'turso') {
            return this.testTursoConfig();
        }

        return { success: true, message: 'Basic test passed' };
    }

    async testFilesystemPaths(config) {
        const paths = config.args.slice(2); // Skip bunx args
        let accessiblePaths = 0;
        
        for (const pathTemplate of paths) {
            const expandedPath = pathTemplate.replace(/\$\{HOME\}/g, require('os').homedir());
            if (fs.existsSync(expandedPath)) {
                accessiblePaths++;
            }
        }
        
        if (accessiblePaths === 0) {
            return { success: false, message: 'No accessible filesystem paths' };
        }
        
        return { 
            success: true, 
            message: `${accessiblePaths}/${paths.length} paths accessible` 
        };
    }

    async testPlaywrightBrowsers() {
        try {
            return new Promise((resolve) => {
                const proc = spawn('bunx', ['playwright', 'install', '--dry-run'], {
                    stdio: 'pipe'
                });
                
                let output = '';
                proc.stdout.on('data', (data) => output += data.toString());
                proc.stderr.on('data', (data) => output += data.toString());
                
                proc.on('close', (code) => {
                    if (output.includes('browsers are already installed') || code === 0) {
                        resolve({ success: true, message: 'Browsers available' });
                    } else {
                        resolve({ success: false, message: 'Browsers need installation' });
                    }
                });
                
                setTimeout(() => {
                    proc.kill();
                    resolve({ success: false, message: 'Browser check timeout' });
                }, 5000);
            });
        } catch (error) {
            return { success: false, message: 'Browser check failed' };
        }
    }

    async testMemoryStorage(config) {
        const memoryPath = config.env?.MEMORY_FILE_PATH?.replace(/\$\{HOME\}/g, require('os').homedir()) || 
                          path.join(require('os').homedir(), '.cache', 'mcp-memory.json');
        
        const cacheDir = path.dirname(memoryPath);
        try {
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            return { success: true, message: `Memory storage accessible at ${memoryPath}` };
        } catch (error) {
            return { success: false, message: `Memory storage not accessible: ${error.message}` };
        }
    }

    async testSSHKeys() {
        const sshDir = path.join(require('os').homedir(), '.ssh');
        const hasSSHKeys = fs.existsSync(sshDir) && 
                          (fs.existsSync(path.join(sshDir, 'id_rsa')) || 
                           fs.existsSync(path.join(sshDir, 'id_ed25519')));
        
        if (!hasSSHKeys) {
            return { success: true, message: 'SSH server ready (no keys found, but optional)' };
        }
        
        return { success: true, message: 'SSH server ready with available keys' };
    }

    async testGithubToken() {
        const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
        if (!token || token === 'your_token_here' || token.includes('xxxx')) {
            return { success: false, message: 'GitHub token not configured' };
        }
        
        if (!token.startsWith('ghp_')) {
            return { success: false, message: 'Invalid GitHub token format' };
        }
        
        return { success: true, message: 'GitHub token configured' };
    }

    async testTursoConfig() {
        const url = process.env.TURSO_DATABASE_URL;
        const token = process.env.TURSO_AUTH_TOKEN;
        
        if (!url || !token) {
            return { success: true, message: 'Turso configuration optional - not configured' };
        }
        
        if (url.includes('your-database-name') || token === 'your-auth-token-here') {
            return { success: false, message: 'Turso configuration contains placeholders' };
        }
        
        if (!url.startsWith('libsql://')) {
            return { success: false, message: 'Invalid Turso database URL format' };
        }
        
        return { success: true, message: 'Turso configuration valid' };
    }

    async testSingleServer(serverName, serverConfig, requirements, attempt = 1) {
        this.testStartTimes[serverName] = Date.now();
        
        try {
            let result;
            
            // Test server availability
            if (serverConfig.serverUrl) {
                // Remote SSE server
                result = await this.testRemoteServer(serverName, serverConfig);
            } else {
                // Local command server
                result = await this.testLocalServer(serverName, serverConfig);
            }
            
            // If basic test passed, run capability tests
            if (result.success && !this.fastMode) {
                const capabilityResult = await this.testServerCapabilities(serverName, serverConfig, requirements);
                if (!capabilityResult.success) {
                    result = capabilityResult;
                } else if (capabilityResult.message !== 'Basic test passed' && capabilityResult.message !== 'Skipped in fast mode') {
                    result.message = capabilityResult.message;
                }
            }
            
            // Add timing information
            const testDuration = Date.now() - this.testStartTimes[serverName];
            result.duration = testDuration;
            result.attempt = attempt;
            
            return result;
            
        } catch (error) {
            return {
                success: false,
                message: `Test error: ${error.message}`,
                error: error.message,
                attempt: attempt,
                duration: Date.now() - this.testStartTimes[serverName]
            };
        }
    }

    async testAllServers() {
        const config = JSON.parse(fs.readFileSync(this.mcpConfigPath, 'utf8'));
        const servers = Object.entries(config.mcpServers);
        const serverRequirements = this.getServerRequirements();
        
        this.log(`Testing ${servers.length} MCP servers with ${this.maxConcurrency} concurrent tests...`, 'info');
        
        // Process servers in batches for controlled concurrency
        const batches = [];
        for (let i = 0; i < servers.length; i += this.maxConcurrency) {
            batches.push(servers.slice(i, i + this.maxConcurrency));
        }
        
        for (const [batchIndex, batch] of batches.entries()) {
            this.log(`Processing batch ${batchIndex + 1}/${batches.length}...`, 'progress');
            
            const batchPromises = batch.map(async ([serverName, serverConfig]) => {
                const requirements = serverRequirements[serverName] || { envVars: [], description: 'Unknown', critical: false };
                
                // Environment variable checking
                const envCheck = this.checkEnvironmentVariables(serverName, requirements.envVars, serverConfig);
                
                // Test the server (with retry logic)
                let result = await this.testSingleServer(serverName, serverConfig, requirements, 1);
                
                // Retry failed tests if configured
                if (!result.success && this.retryCount > 0) {
                    this.log(`Retrying ${serverName}...`, 'warning');
                    result = await this.testSingleServer(serverName, serverConfig, requirements, 2);
                }
                
                // Store comprehensive result
                this.results[serverName] = {
                    ...result,
                    critical: requirements.critical,
                    description: requirements.description,
                    envVars: requirements.envVars,
                    envCheck,
                    config: serverConfig
                };
                
                // Log result
                if (result.success) {
                    this.log(`${serverName}: ${result.message} (${result.duration}ms)`, 'success');
                } else {
                    this.log(`${serverName}: ${result.message} (${result.duration}ms)`, 'error');
                }
                
                return this.results[serverName];
            });
            
            // Wait for current batch to complete before starting next
            await Promise.allSettled(batchPromises);
        }
    }

    generateSummaryReport() {
        const total = Object.keys(this.results).length;
        const successful = Object.values(this.results).filter(r => r.success);
        const failed = Object.values(this.results).filter(r => !r.success);
        const critical = Object.values(this.results).filter(r => r.critical);
        const criticalFailed = failed.filter(r => r.critical);
        
        const totalTime = Date.now() - this.startTime;
        const avgTime = total > 0 ? Math.round(totalTime / total) : 0;
        
        console.log('\n📊 UNIFIED MCP SERVER TEST SUMMARY');
        console.log('=====================================');
        console.log(`Total Servers: ${total}`);
        console.log(`✅ Successful: ${successful.length}/${total} (${Math.round(successful.length/total*100)}%)`);
        console.log(`❌ Failed: ${failed.length}/${total}`);
        console.log(`🔥 Critical: ${critical.length} (${criticalFailed.length} failed)`);
        console.log(`⏱️  Total Time: ${Math.round(totalTime/1000)}s`);
        console.log(`⚡ Avg per Server: ${avgTime}ms`);
        
        if (criticalFailed.length > 0) {
            console.log('\n🚨 CRITICAL FAILURES:');
            criticalFailed.forEach(server => {
                const name = Object.keys(this.results).find(k => this.results[k] === server);
                console.log(`   ❌ ${name}: ${server.message}`);
            });
        }
        
        if (failed.length > 0) {
            console.log('\n❌ Failed Servers:');
            failed.forEach(server => {
                const name = Object.keys(this.results).find(k => this.results[k] === server);
                console.log(`   ❌ ${name}: ${server.message}`);
            });
        }
        
        if (successful.length > 0) {
            console.log('\n✅ Working Servers:');
            successful.forEach(server => {
                const name = Object.keys(this.results).find(k => this.results[k] === server);
                const criticalTag = server.critical ? ' (CRITICAL)' : '';
                console.log(`   ✅ ${name}: ${server.message}${criticalTag}`);
            });
        }
        
        return {
            total,
            successful: successful.length,
            failed: failed.length,
            critical: critical.length,
            criticalFailed: criticalFailed.length,
            totalTime,
            avgTime
        };
    }

    generateDetailedReport() {
        // Save detailed JSON report
        const report = {
            timestamp: new Date().toISOString(),
            testConfig: {
                timeout: this.testTimeout,
                concurrency: this.maxConcurrency,
                retries: this.retryCount,
                fastMode: this.fastMode
            },
            summary: this.generateSummaryReport(),
            details: this.results
        };
        
        const reportPath = path.join(this.projectRoot, `test-results-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        this.log(`Detailed report saved: ${reportPath}`, 'info');
        return report;
    }

    async run() {
        try {
            // Load environment variables
            this.loadEnvironment();
            
            // Validate config exists
            if (!fs.existsSync(this.mcpConfigPath)) {
                throw new Error('.mcp.json not found - run "just setup" first');
            }
            
            // Run tests
            await this.testAllServers();
            
            // Generate reports
            if (this.outputMode === 'json') {
                const report = this.generateDetailedReport();
                console.log(JSON.stringify(report, null, 2));
            } else if (this.outputMode === 'detailed') {
                this.generateDetailedReport();
            } else {
                this.generateSummaryReport();
            }
            
            // Exit with error if any critical servers failed
            const criticalFailed = Object.values(this.results).filter(r => !r.success && r.critical).length;
            if (criticalFailed > 0) {
                process.exit(1);
            }
            
        } catch (error) {
            this.log(`Testing failed: ${error.message}`, 'error');
            if (this.outputMode !== 'json') {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }
}

// CLI handling
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        timeout: 20000,
        concurrency: 5,
        retries: 1,
        output: 'summary', // summary, detailed, json
        fast: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--timeout' && i + 1 < args.length) {
            options.timeout = parseInt(args[++i], 10) * 1000; // Convert seconds to ms
        } else if (arg === '--concurrency' && i + 1 < args.length) {
            options.concurrency = parseInt(args[++i], 10);
        } else if (arg === '--retries' && i + 1 < args.length) {
            options.retries = parseInt(args[++i], 10);
        } else if (arg === '--output' && i + 1 < args.length) {
            options.output = args[++i];
        } else if (arg === '--fast') {
            options.fast = true;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Unified MCP Server Test Suite

Usage: node test-all.js [options]

Options:
  --timeout <seconds>     Test timeout per server (default: 20)
  --concurrency <number>  Max concurrent tests (default: 5) 
  --retries <number>      Retry failed tests (default: 1)
  --output <mode>         Output mode: summary, detailed, json (default: summary)
  --fast                  Fast mode - skip capability tests
  --help, -h              Show this help message

Examples:
  node test-all.js                          # Basic test run
  node test-all.js --fast                   # Fast mode 
  node test-all.js --output detailed        # Save detailed report
  node test-all.js --output json            # JSON output only
  node test-all.js --timeout 30 --retries 2 # Custom timeout and retries
            `.trim());
            process.exit(0);
        }
    }
    
    return options;
}

// Run tests if called directly
if (require.main === module) {
    const options = parseArgs();
    const tester = new UnifiedMCPTester(options);
    tester.run();
}

module.exports = UnifiedMCPTester;