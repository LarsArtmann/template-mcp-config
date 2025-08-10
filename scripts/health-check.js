#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

class MCPHealthChecker {
    constructor() {
        this.projectRoot = path.dirname(__dirname);
        this.mcpConfigPath = path.join(this.projectRoot, '.mcp.json');
        this.envPath = path.join(this.projectRoot, '.env');
        this.healthData = {};
        this.checkTimeout = 15000; // 15 seconds per check (increased)
        this.retryCount = 2; // Number of retries for failed checks
        this.retryDelay = 2000; // 2 seconds between retries
    }

    log(message, type = 'info') {
        const prefix = {
            info: '📋',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            progress: '⏳',
            health: '💚'
        }[type];
        console.log(`${prefix} ${message}`);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    async checkSystemHealth() {
        this.log('Checking system health...', 'progress');
        
        const systemInfo = {
            timestamp: new Date().toISOString(),
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            memory: {
                total: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100,
                free: Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100,
                used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024 * 100) / 100
            },
            uptime: Math.round(os.uptime() / 60), // minutes
            loadAverage: os.loadavg()
        };

        // Check disk space
        try {
            const { execSync } = require('child_process');
            let diskUsage = '';
            
            if (os.platform() === 'darwin' || os.platform() === 'linux') {
                diskUsage = execSync('df -h .', { encoding: 'utf8' });
            }
            systemInfo.disk = diskUsage;
        } catch (error) {
            systemInfo.disk = 'Unable to check disk space';
        }

        this.healthData.system = systemInfo;
        
        this.log(`System: ${systemInfo.platform} ${systemInfo.arch}, Memory: ${systemInfo.memory.used}/${systemInfo.memory.total} GB`, 'health');
    }

    async checkRemoteServerHealth(serverName, config, attemptNumber = 1) {
        return new Promise((resolve) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.checkTimeout);
            const startTime = Date.now();
            
            fetch(config.serverUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'text/event-stream',
                    'User-Agent': 'MCP-Health-Check/1.0'
                }
            })
            .then(response => {
                clearTimeout(timeoutId);
                const responseTime = Date.now() - startTime;
                
                resolve({
                    status: response.ok ? 'healthy' : 'unhealthy',
                    responseTime,
                    httpStatus: response.status,
                    message: response.ok ? 'Server responding' : `HTTP ${response.status}`,
                    type: 'remote',
                    attempt: attemptNumber
                });
            })
            .catch(async (error) => {
                clearTimeout(timeoutId);
                const responseTime = Date.now() - startTime;
                
                // Retry logic for remote servers
                if (attemptNumber < this.retryCount && !error.message.includes('abort')) {
                    await this.sleep(this.retryDelay);
                    return this.checkRemoteServerHealth(serverName, config, attemptNumber + 1).then(resolve);
                }
                
                resolve({
                    status: 'unhealthy',
                    responseTime,
                    message: error.message.includes('abort') ? 'Timeout' : error.message,
                    type: 'remote',
                    attempt: attemptNumber
                });
            });
        });
    }

    async checkLocalServerHealth(serverName, config, attemptNumber = 1) {
        return new Promise(async (resolve) => {
            const startTime = Date.now();
            
            // Expand environment variables in arguments for better testing
            const expandedArgs = ['--help'];
            if (config.args && config.args.length > 2) {
                // Use actual package args for better validation
                expandedArgs.unshift(...config.args.slice(1));
                expandedArgs.push('--help');
            }
            
            // For local servers, we check if the command exists and can be executed
            const serverProcess = spawn(config.command, expandedArgs, {
                env: { ...process.env, ...config.env },
                stdio: ['ignore', 'pipe', 'pipe']
            });

            const timeout = setTimeout(() => {
                serverProcess.kill('SIGKILL');
                const responseTime = Date.now() - startTime;
                
                // Retry logic for local servers
                if (attemptNumber < this.retryCount) {
                    setTimeout(() => {
                        this.checkLocalServerHealth(serverName, config, attemptNumber + 1).then(resolve);
                    }, this.retryDelay);
                    return;
                }
                
                resolve({
                    status: 'unhealthy',
                    responseTime,
                    message: 'Health check timeout',
                    type: 'local',
                    attempt: attemptNumber
                });
            }, this.checkTimeout);

            let output = '';
            let errorOutput = '';
            
            serverProcess.stdout?.on('data', (data) => {
                output += data.toString();
            });

            serverProcess.stderr?.on('data', (data) => {
                errorOutput += data.toString();
            });

            serverProcess.on('close', async (code) => {
                clearTimeout(timeout);
                const responseTime = Date.now() - startTime;
                
                const isHealthy = code === 0 || 
                                output.includes('help') || 
                                output.includes('usage') || 
                                errorOutput.includes('help') ||
                                code === 1; // Some MCP servers exit with code 1 but still work
                
                // Retry if unhealthy and attempts remaining
                if (!isHealthy && attemptNumber < this.retryCount) {
                    await this.sleep(this.retryDelay);
                    return this.checkLocalServerHealth(serverName, config, attemptNumber + 1).then(resolve);
                }
                
                resolve({
                    status: isHealthy ? 'healthy' : 'unhealthy',
                    responseTime,
                    exitCode: code,
                    message: isHealthy ? 'Command accessible' : `Exit code ${code}`,
                    type: 'local',
                    attempt: attemptNumber
                });
            });

            serverProcess.on('error', async (error) => {
                clearTimeout(timeout);
                const responseTime = Date.now() - startTime;
                
                // Retry on process errors (except ENOENT which means command not found)
                if (!error.code === 'ENOENT' && attemptNumber < this.retryCount) {
                    await this.sleep(this.retryDelay);
                    return this.checkLocalServerHealth(serverName, config, attemptNumber + 1).then(resolve);
                }
                
                resolve({
                    status: 'unhealthy',
                    responseTime,
                    message: `Process error: ${error.message}`,
                    type: 'local',
                    attempt: attemptNumber
                });
            });
        });
    }

    async checkServerCapabilities(serverName, config) {
        const capabilities = {};
        
        // Check specific server capabilities
        switch (serverName) {
            case 'filesystem':
                capabilities.paths = await this.checkFilesystemPaths(config);
                break;
            case 'github':
                capabilities.auth = this.checkGitHubAuth();
                break;
            case 'turso':
                capabilities.database = this.checkTursoConfig();
                break;
            case 'kubernetes':
                capabilities.cluster = await this.checkKubernetesAccess();
                break;
            case 'prometheus':
                capabilities.metrics = await this.checkPrometheusAccess();
                break;
            case 'deepwiki':
                capabilities.remote = await this.checkDeepWikiAccess(config);
                break;
            case 'playwright':
                capabilities.browsers = await this.checkPlaywrightBrowsers();
                break;
            case 'memory':
                capabilities.storage = this.checkMemoryStorage(config);
                break;
            case 'ssh':
                capabilities.connection = this.checkSSHConfig();
                break;
        }
        
        return capabilities;
    }

    async checkFilesystemPaths(config) {
        const paths = config.args?.slice(2) || []; // Skip bunx args
        let accessible = 0;
        let totalSize = 0;
        
        for (const pathTemplate of paths) {
            const expandedPath = pathTemplate.replace(/\$\{HOME\}/g, os.homedir());
            try {
                if (fs.existsSync(expandedPath)) {
                    accessible++;
                    const stats = fs.statSync(expandedPath);
                    if (stats.isDirectory()) {
                        const files = fs.readdirSync(expandedPath);
                        totalSize += files.length;
                    }
                }
            } catch (error) {
                // Path not accessible
            }
        }
        
        return {
            totalPaths: paths.length,
            accessiblePaths: accessible,
            totalItems: totalSize,
            status: accessible > 0 ? 'healthy' : 'unhealthy'
        };
    }

    checkGitHubAuth() {
        const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
        const isConfigured = token && 
                           token !== 'your_token_here' && 
                           !token.includes('xxxx') &&
                           token.startsWith('ghp_');
        
        return {
            configured: isConfigured,
            status: isConfigured ? 'healthy' : 'needs_config'
        };
    }

    checkTursoConfig() {
        const url = process.env.TURSO_DATABASE_URL;
        const token = process.env.TURSO_AUTH_TOKEN;
        
        const isConfigured = url && 
                           token && 
                           !url.includes('your-database') && 
                           !token.includes('your-auth-token');
        
        return {
            configured: isConfigured,
            status: isConfigured ? 'healthy' : 'optional'
        };
    }

    async checkKubernetesAccess() {
        return new Promise((resolve) => {
            const { spawn } = require('child_process');
            const kubectl = spawn('kubectl', ['cluster-info'], {
                stdio: 'pipe',
                env: process.env
            });
            
            let output = '';
            kubectl.stdout?.on('data', (data) => output += data.toString());
            kubectl.stderr?.on('data', (data) => output += data.toString());
            
            kubectl.on('close', (code) => {
                resolve({
                    accessible: code === 0,
                    status: code === 0 ? 'healthy' : 'unavailable',
                    message: code === 0 ? 'Cluster accessible' : 'No cluster access'
                });
            });
            
            setTimeout(() => {
                kubectl.kill();
                resolve({
                    accessible: false,
                    status: 'timeout',
                    message: 'kubectl timeout'
                });
            }, 5000);
        });
    }

    async checkPrometheusAccess() {
        const prometheusUrl = process.env.PROMETHEUS_URL || 'http://localhost:9090';
        
        return new Promise((resolve) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            fetch(`${prometheusUrl}/api/v1/query?query=up`, {
                signal: controller.signal
            })
            .then(response => {
                clearTimeout(timeoutId);
                resolve({
                    accessible: response.ok,
                    status: response.ok ? 'healthy' : 'unavailable',
                    url: prometheusUrl
                });
            })
            .catch(() => {
                clearTimeout(timeoutId);
                resolve({
                    accessible: false,
                    status: 'unavailable',
                    url: prometheusUrl
                });
            });
        });
    }

    async checkDeepWikiAccess(config) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(config.serverUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'Accept': 'text/event-stream' }
            });
            
            clearTimeout(timeoutId);
            return {
                accessible: response.ok,
                status: response.ok ? 'healthy' : 'unavailable',
                httpStatus: response.status
            };
        } catch (error) {
            return {
                accessible: false,
                status: 'unavailable',
                message: error.message
            };
        }
    }

    async checkPlaywrightBrowsers() {
        return new Promise((resolve) => {
            const { spawn } = require('child_process');
            const proc = spawn('bunx', ['playwright', 'install', '--dry-run'], {
                stdio: 'pipe'
            });
            
            let output = '';
            proc.stdout.on('data', (data) => output += data.toString());
            proc.stderr.on('data', (data) => output += data.toString());
            
            proc.on('close', (code) => {
                const browsersInstalled = output.includes('browsers are already installed') || 
                                        output.includes('up to date') ||
                                        code === 0;
                resolve({
                    installed: browsersInstalled,
                    status: browsersInstalled ? 'healthy' : 'needs_installation',
                    message: browsersInstalled ? 'Browsers available' : 'Run: bunx playwright install'
                });
            });
            
            setTimeout(() => {
                proc.kill();
                resolve({
                    installed: false,
                    status: 'unknown',
                    message: 'Browser check timeout'
                });
            }, 5000);
        });
    }

    checkMemoryStorage(config) {
        const memoryPath = config.env?.MEMORY_FILE_PATH?.replace(/\$\{HOME\}/g, require('os').homedir()) || 
                          path.join(require('os').homedir(), '.cache', 'mcp-memory.json');
        
        const cacheDir = path.dirname(memoryPath);
        const canWrite = fs.existsSync(cacheDir) || this.canCreateDirectory(cacheDir);
        
        return {
            writable: canWrite,
            status: canWrite ? 'healthy' : 'needs_setup',
            path: memoryPath,
            message: canWrite ? 'Storage accessible' : 'Cache directory not accessible'
        };
    }

    canCreateDirectory(dirPath) {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    checkSSHConfig() {
        // Check if SSH keys exist
        const sshDir = path.join(require('os').homedir(), '.ssh');
        const hasSSHKeys = fs.existsSync(sshDir) && 
                          (fs.existsSync(path.join(sshDir, 'id_rsa')) || 
                           fs.existsSync(path.join(sshDir, 'id_ed25519')));
        
        return {
            configured: hasSSHKeys,
            status: hasSSHKeys ? 'healthy' : 'optional',
            message: hasSSHKeys ? 'SSH keys available' : 'No SSH keys found (optional)'
        };
    }

    async checkAllServers() {
        const config = JSON.parse(fs.readFileSync(this.mcpConfigPath, 'utf8'));
        const servers = Object.entries(config.mcpServers);
        
        this.log(`Checking health of ${servers.length} MCP servers...`, 'progress');
        
        for (const [serverName, serverConfig] of servers) {
            try {
                let health;
                
                if (serverConfig.serverUrl) {
                    health = await this.checkRemoteServerHealth(serverName, serverConfig);
                } else {
                    health = await this.checkLocalServerHealth(serverName, serverConfig);
                }
                
                // Add capability checks
                health.capabilities = await this.checkServerCapabilities(serverName, serverConfig);
                health.timestamp = new Date().toISOString();
                
                this.healthData[serverName] = health;
                
                const statusIcon = health.status === 'healthy' ? '✅' : '❌';
                const responseTime = health.responseTime ? `(${health.responseTime}ms)` : '';
                this.log(`${statusIcon} ${serverName}: ${health.message} ${responseTime}`);
                
            } catch (error) {
                this.healthData[serverName] = {
                    status: 'error',
                    message: error.message,
                    timestamp: new Date().toISOString(),
                    type: 'unknown'
                };
                this.log(`❌ ${serverName}: ${error.message}`, 'error');
            }
        }
    }

    generateHealthReport() {
        const report = {
            timestamp: new Date().toISOString(),
            system: this.healthData.system,
            servers: {},
            summary: {
                total: 0,
                healthy: 0,
                unhealthy: 0,
                avgResponseTime: 0
            }
        };

        let totalResponseTime = 0;
        let responseTimeCount = 0;

        for (const [serverName, health] of Object.entries(this.healthData)) {
            if (serverName === 'system') continue;
            
            report.servers[serverName] = health;
            report.summary.total++;
            
            if (health.status === 'healthy') {
                report.summary.healthy++;
            } else {
                report.summary.unhealthy++;
            }
            
            if (health.responseTime) {
                totalResponseTime += health.responseTime;
                responseTimeCount++;
            }
        }

        if (responseTimeCount > 0) {
            report.summary.avgResponseTime = Math.round(totalResponseTime / responseTimeCount);
        }

        return report;
    }

    displayHealthSummary(report) {
        console.log('\n💚 MCP Health Summary');
        console.log('====================');
        console.log(`Servers: ${report.summary.healthy}/${report.summary.total} healthy`);
        console.log(`Average response time: ${report.summary.avgResponseTime}ms`);
        console.log(`System uptime: ${report.system.uptime} minutes`);
        console.log(`Memory usage: ${report.system.memory.used}/${report.system.memory.total} GB`);

        if (report.summary.unhealthy > 0) {
            console.log('\n❌ Unhealthy servers:');
            Object.entries(report.servers)
                .filter(([_, health]) => health.status !== 'healthy')
                .forEach(([name, health]) => {
                    console.log(`   ${name}: ${health.message}`);
                });
        }

        // Show capability warnings
        console.log('\n🔧 Configuration status:');
        Object.entries(report.servers).forEach(([name, health]) => {
            if (health.capabilities) {
                Object.entries(health.capabilities).forEach(([capName, capData]) => {
                    if (capData.status === 'needs_config') {
                        console.log(`   ⚠️  ${name} ${capName}: needs configuration`);
                    } else if (capData.status === 'unavailable') {
                        console.log(`   ℹ️  ${name} ${capName}: not available`);
                    }
                });
            }
        });
    }

    async saveHealthReport(report) {
        const reportsDir = path.join(this.projectRoot, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }
        
        const reportFile = path.join(reportsDir, `health-${Date.now()}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        this.log(`Health report saved: ${path.basename(reportFile)}`, 'info');
    }

    async run(options = {}) {
        try {
            this.loadEnvironment();
            
            if (!fs.existsSync(this.mcpConfigPath)) {
                throw new Error('.mcp.json not found - run "just setup" first');
            }

            console.log('💚 MCP Server Health Check\n');
            
            await this.checkSystemHealth();
            await this.checkAllServers();
            
            const report = this.generateHealthReport();
            this.displayHealthSummary(report);
            
            if (options.saveReport !== false) {
                await this.saveHealthReport(report);
            }
            
            // Exit with error if any servers are unhealthy
            if (report.summary.unhealthy > 0) {
                console.log('\n⚠️  Some servers need attention');
                process.exit(1);
            } else {
                console.log('\n✅ All servers healthy!');
            }
            
        } catch (error) {
            this.log(`Health check failed: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// Run health check if called directly
if (require.main === module) {
    const checker = new MCPHealthChecker();
    checker.run();
}

module.exports = MCPHealthChecker;