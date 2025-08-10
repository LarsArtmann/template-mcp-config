#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class MCPServerTester {
    constructor() {
        this.projectRoot = path.dirname(__dirname);
        this.mcpConfigPath = path.join(this.projectRoot, '.mcp.json');
        this.envPath = path.join(this.projectRoot, '.env');
        this.results = {};
        this.testTimeout = 20000; // 20 seconds per test (increased)
        this.maxConcurrency = 5; // Maximum concurrent tests
    }

    log(message, type = 'info') {
        const prefix = {
            info: '📋',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            progress: '⏳'
        }[type];
        console.log(`${prefix} ${message}`);
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

    async testRemoteServer(serverName, config) {
        return new Promise((resolve) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.testTimeout);
            
            fetch(config.serverUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'text/event-stream',
                    'User-Agent': 'MCP-Test/1.0'
                }
            })
            .then(response => {
                clearTimeout(timeoutId);
                if (response.ok) {
                    resolve({
                        success: true,
                        message: `Connected (${response.status})`
                    });
                } else {
                    resolve({
                        success: false,
                        message: `HTTP ${response.status}: ${response.statusText}`
                    });
                }
            })
            .catch(error => {
                clearTimeout(timeoutId);
                resolve({
                    success: false,
                    message: error.message.includes('abort') ? 'Timeout' : error.message
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
                    message: 'Timeout - process killed'
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
                        message: 'Command accessible'
                    });
                } else if (output.includes('help') || output.includes('usage') || errorOutput.includes('help')) {
                    resolve({
                        success: true,
                        message: 'Command accessible (help shown)'
                    });
                } else {
                    resolve({
                        success: false,
                        message: `Exit code ${code}: ${errorOutput.trim() || 'Command failed'}`
                    });
                }
            });

            serverProcess.on('error', (error) => {
                clearTimeout(timeout);
                resolve({
                    success: false,
                    message: `Process error: ${error.message}`
                });
            });
        });
    }

    async testServerCapabilities(serverName, config) {
        // Special tests for specific servers
        const specialTests = {
            filesystem: () => this.testFilesystemServer(config),
            playwright: () => this.testPlaywrightServer(),
            github: () => this.testGithubServer(),
        };

        if (specialTests[serverName]) {
            return await specialTests[serverName]();
        }

        return { success: true, message: 'Basic test passed' };
    }

    async testFilesystemServer(config) {
        // Test if filesystem paths are accessible
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

    async testPlaywrightServer() {
        // Test if Playwright browsers are installed
        try {
            const { spawn } = require('child_process');
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

    async testGithubServer() {
        const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
        if (!token || token === 'your_token_here' || token.includes('xxxx')) {
            return { success: false, message: 'GitHub token not configured' };
        }
        
        if (!token.startsWith('ghp_')) {
            return { success: false, message: 'Invalid GitHub token format' };
        }
        
        return { success: true, message: 'GitHub token configured' };
    }

    async testAllServers() {
        const config = JSON.parse(fs.readFileSync(this.mcpConfigPath, 'utf8'));
        const servers = Object.entries(config.mcpServers);
        
        console.log(`🧪 Testing ${servers.length} MCP servers with ${this.maxConcurrency} concurrent tests...\n`);
        
        // Process servers in batches for controlled concurrency
        const batches = [];
        for (let i = 0; i < servers.length; i += this.maxConcurrency) {
            batches.push(servers.slice(i, i + this.maxConcurrency));
        }
        
        for (const batch of batches) {
            const batchPromises = batch.map(([serverName, serverConfig]) => 
                this.testSingleServer(serverName, serverConfig)
            );
            
            // Wait for current batch to complete before starting next
            await Promise.allSettled(batchPromises);
        }
    }

    async testSingleServer(serverName, serverConfig) {
        this.log(`Testing ${serverName}...`, 'progress');
        
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
            if (result.success) {
                const capabilityResult = await this.testServerCapabilities(serverName, serverConfig);
                if (!capabilityResult.success) {
                    result = capabilityResult;
                } else if (capabilityResult.message !== 'Basic test passed') {
                    result.message = capabilityResult.message;
                }
            }
            
            this.results[serverName] = result;
            
            if (result.success) {
                this.log(`${serverName}: ${result.message}`, 'success');
            } else {
                this.log(`${serverName}: ${result.message}`, 'error');
            }
            
        } catch (error) {
            this.results[serverName] = {
                success: false,
                message: `Test error: ${error.message}`
            };
            this.log(`${serverName}: ${error.message}`, 'error');
        }
    }

    displaySummary() {
        console.log('\n📊 Server Test Summary');
        console.log('======================');
        
        const total = Object.keys(this.results).length;
        const passed = Object.values(this.results).filter(r => r.success).length;
        const failed = total - passed;
        
        console.log(`Servers tested: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        
        if (failed > 0) {
            console.log('\n❌ Failed servers:');
            Object.entries(this.results)
                .filter(([_, result]) => !result.success)
                .forEach(([name, result]) => {
                    console.log(`   ${name}: ${result.message}`);
                });
        }
        
        if (passed > 0) {
            console.log('\n✅ Passed servers:');
            Object.entries(this.results)
                .filter(([_, result]) => result.success)
                .forEach(([name, result]) => {
                    console.log(`   ${name}: ${result.message}`);
                });
        }
        
        console.log('');
        
        if (failed === 0) {
            this.log('All servers are ready!', 'success');
        } else if (passed > 0) {
            this.log(`${passed} servers working, ${failed} need attention`, 'warning');
        } else {
            this.log('No servers are working - check configuration', 'error');
        }
    }

    displayTroubleshooting() {
        const failedServers = Object.entries(this.results)
            .filter(([_, result]) => !result.success);
            
        if (failedServers.length > 0) {
            console.log('\n🔧 Troubleshooting Tips:');
            
            failedServers.forEach(([name, result]) => {
                if (result.message.includes('Timeout')) {
                    console.log(`• ${name}: Try running "bunx ${name}" to install package`);
                } else if (result.message.includes('token')) {
                    console.log(`• ${name}: Configure required token in .env file`);
                } else if (result.message.includes('paths')) {
                    console.log(`• ${name}: Update filesystem paths in .mcp.json`);
                } else if (result.message.includes('browser')) {
                    console.log(`• ${name}: Run "bunx playwright install" to install browsers`);
                }
            });
            
            console.log('\nFor detailed help: just validate');
        }
    }

    async run() {
        try {
            // Load environment variables
            this.loadEnvironment();
            
            // Validate config exists
            if (!fs.existsSync(this.mcpConfigPath)) {
                throw new Error('.mcp.json not found - run "just setup" first');
            }
            
            await this.testAllServers();
            this.displaySummary();
            this.displayTroubleshooting();
            
            // Exit with error if any servers failed
            const failed = Object.values(this.results).filter(r => !r.success).length;
            if (failed > 0) {
                process.exit(1);
            }
            
        } catch (error) {
            this.log(`Testing failed: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new MCPServerTester();
    tester.run();
}

module.exports = MCPServerTester;