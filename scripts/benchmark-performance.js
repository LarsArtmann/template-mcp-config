#!/usr/bin/env node

/**
 * Performance Benchmark Script
 * Measures startup times, memory usage, and identifies bottlenecks for MCP servers
 */

const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const COLORS = {
  GREEN: "\x1b[32m",
  RED: "\x1b[31m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  CYAN: "\x1b[36m",
  MAGENTA: "\x1b[35m",
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
  DIM: "\x1b[2m",
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function formatTime(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

class PerformanceBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      system: this.getSystemInfo(),
      benchmarks: {},
    };
  }

  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      nodeVersion: process.version,
      bunVersion: null, // Will be filled later
    };
  }

  async getBunVersion() {
    return new Promise((resolve) => {
      exec("bunx --version", (error, stdout) => {
        resolve(error ? "Not available" : stdout.trim());
      });
    });
  }

  loadMcpConfig() {
    try {
      const configPath = path.join(process.cwd(), ".mcp.json");
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      return config.mcpServers || {};
    } catch (error) {
      log(`❌ Failed to load .mcp.json: ${error.message}`, COLORS.RED);
      return {};
    }
  }

  async benchmarkCommand(command, args, description, timeout = 30000) {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    return new Promise((resolve) => {
      log(`  🔍 ${description}...`, COLORS.BLUE);

      const child = spawn(command, args, {
        stdio: "pipe",
      });

      let stdout = "";
      let stderr = "";
      let completed = false;

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      const finishBenchmark = (exitCode, killed = false) => {
        if (completed) return;
        completed = true;

        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        const result = {
          command: `${command} ${args.join(" ")}`,
          description,
          duration,
          exitCode,
          killed,
          memoryDelta: {
            rss: endMemory.rss - startMemory.rss,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          },
          output: {
            stdout: stdout.length,
            stderr: stderr.length,
          },
        };

        if (exitCode === 0 && !killed) {
          log(`    ✅ ${formatTime(duration)}`, COLORS.GREEN);
        } else if (killed) {
          log(`    ⏰ Timeout after ${formatTime(duration)}`, COLORS.YELLOW);
        } else {
          log(`    ❌ Failed (${exitCode}) after ${formatTime(duration)}`, COLORS.RED);
        }

        resolve(result);
      };

      child.on("close", (code) => {
        finishBenchmark(code);
      });

      child.on("error", (error) => {
        finishBenchmark(1);
      });

      // Timeout
      setTimeout(() => {
        if (!completed) {
          child.kill("SIGTERM");
          finishBenchmark(null, true);
        }
      }, timeout);
    });
  }

  async benchmarkMcpServerCheck(serverName, config) {
    if (config.command === "bunx" && config.args) {
      // Extract package name (skip -y flag)
      const packageName = config.args.find((arg) => !arg.startsWith("-"));
      if (packageName) {
        return await this.benchmarkCommand(
          "bunx",
          ["--help", packageName],
          `Check ${serverName} package availability`,
          10000,
        );
      }
    }
    return null;
  }

  async benchmarkValidation() {
    log(`${COLORS.BOLD}📊 Validation Benchmarks${COLORS.RESET}`);

    const benchmarks = {};

    // JSON validation
    benchmarks.jsonValidation = await this.benchmarkCommand(
      "node",
      [
        "-e",
        'JSON.parse(require("fs").readFileSync(".mcp.json", "utf8")); console.log("Valid JSON")',
      ],
      "JSON syntax validation",
    );

    // Full validation
    benchmarks.fullValidation = await this.benchmarkCommand(
      "node",
      ["scripts/validate-config.js"],
      "Full configuration validation",
      15000,
    );

    return benchmarks;
  }

  async benchmarkPackageAccess() {
    log(`${COLORS.BOLD}📦 Package Access Benchmarks${COLORS.RESET}`);

    const mcpServers = this.loadMcpConfig();
    const benchmarks = {};

    for (const [serverName, config] of Object.entries(mcpServers)) {
      if (config.command === "bunx") {
        benchmarks[serverName] = await this.benchmarkMcpServerCheck(serverName, config);
      }
    }

    return benchmarks;
  }

  async benchmarkScripts() {
    log(`${COLORS.BOLD}⚡ Script Execution Benchmarks${COLORS.RESET}`);

    const benchmarks = {};

    // Warm cache script
    if (fs.existsSync("scripts/warm-cache.js")) {
      benchmarks.warmCache = await this.benchmarkCommand(
        "node",
        ["scripts/warm-cache.js"],
        "Cache warming script",
        60000,
      );
    }

    // Health check script
    if (fs.existsSync("scripts/health-check.js")) {
      benchmarks.healthCheck = await this.benchmarkCommand(
        "node",
        ["scripts/health-check.js"],
        "Health check script",
        30000,
      );
    }

    return benchmarks;
  }

  async benchmarkJustCommands() {
    log(`${COLORS.BOLD}🔧 Just Command Benchmarks${COLORS.RESET}`);

    const benchmarks = {};

    // Test just info command
    benchmarks.justInfo = await this.benchmarkCommand(
      "just",
      ["info"],
      "System information gathering",
    );

    return benchmarks;
  }

  generateReport() {
    const totalServers = Object.keys(this.loadMcpConfig()).length;
    const validationTime = this.results.benchmarks.validation?.fullValidation?.duration || 0;
    const packageChecks = this.results.benchmarks.packageAccess || {};

    const packageCheckTimes = Object.values(packageChecks)
      .filter((result) => result && result.duration)
      .map((result) => result.duration);

    const avgPackageCheck =
      packageCheckTimes.length > 0
        ? packageCheckTimes.reduce((a, b) => a + b, 0) / packageCheckTimes.length
        : 0;

    log(`\n${COLORS.BOLD}📊 PERFORMANCE ANALYSIS REPORT${COLORS.RESET}`);
    log(`${"=".repeat(50)}`);

    log(`\n${COLORS.BOLD}System Information:${COLORS.RESET}`);
    log(`  Platform: ${this.results.system.platform} ${this.results.system.arch}`);
    log(`  CPUs: ${this.results.system.cpus}`);
    log(
      `  Memory: ${formatBytes(this.results.system.totalMemory)} total, ${formatBytes(this.results.system.freeMemory)} free`,
    );
    log(`  Node.js: ${this.results.system.nodeVersion}`);
    log(`  Bun: ${this.results.system.bunVersion}`);

    log(`\n${COLORS.BOLD}MCP Configuration:${COLORS.RESET}`);
    log(`  Total servers: ${totalServers}`);
    log(`  Bunx servers: ${Object.keys(packageChecks).length}`);

    log(`\n${COLORS.BOLD}Performance Metrics:${COLORS.RESET}`);
    log(
      `  Full validation: ${formatTime(validationTime)}`,
      validationTime > 2000 ? COLORS.RED : validationTime > 1000 ? COLORS.YELLOW : COLORS.GREEN,
    );
    log(
      `  Avg package check: ${formatTime(avgPackageCheck)}`,
      avgPackageCheck > 5000 ? COLORS.RED : avgPackageCheck > 2000 ? COLORS.YELLOW : COLORS.GREEN,
    );

    // Performance issues identified
    const issues = [];

    if (validationTime > 2000) {
      issues.push("Validation takes > 2 seconds - consider optimization");
    }

    if (avgPackageCheck > 3000) {
      issues.push("Package checks slow - bunx -y downloads every time");
    }

    const bunxServers = Object.entries(this.loadMcpConfig()).filter(
      ([_, config]) => config.command === "bunx" && config.args?.includes("-y"),
    ).length;

    if (bunxServers > 0) {
      issues.push(`${bunxServers} servers use bunx -y (downloads every startup)`);
    }

    if (issues.length > 0) {
      log(`\n${COLORS.BOLD}🚨 Performance Issues Identified:${COLORS.RESET}`);
      issues.forEach((issue) => {
        log(`  - ${issue}`, COLORS.RED);
      });
    }

    // Recommendations
    log(`\n${COLORS.BOLD}💡 Optimization Recommendations:${COLORS.RESET}`);
    log(`  1. Replace bunx -y with local node_modules dependencies`, COLORS.GREEN);
    log(`  2. Use npm/bun install for package management`, COLORS.GREEN);
    log(`  3. Implement package caching strategy`, COLORS.GREEN);
    log(`  4. Use parallel execution for independent operations`, COLORS.GREEN);
    log(`  5. Consider lazy loading for optional servers`, COLORS.GREEN);

    return this.results;
  }

  async run() {
    log(`${COLORS.BOLD}🏎️ MCP Performance Benchmark Starting...${COLORS.RESET}\n`);

    // Get system info
    this.results.system.bunVersion = await this.getBunVersion();

    // Run benchmarks
    this.results.benchmarks.validation = await this.benchmarkValidation();
    this.results.benchmarks.packageAccess = await this.benchmarkPackageAccess();
    this.results.benchmarks.scripts = await this.benchmarkScripts();
    this.results.benchmarks.justCommands = await this.benchmarkJustCommands();

    // Generate and save report
    const report = this.generateReport();

    const reportPath = path.join(process.cwd(), "reports", `performance-${Date.now()}.json`);
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\n📁 Detailed report saved to: ${reportPath}`, COLORS.BLUE);

    log(`\n🏁 Benchmark complete!`, COLORS.BOLD);
  }
}

async function main() {
  const benchmark = new PerformanceBenchmark();
  await benchmark.run();
}

if (require.main === module) {
  main().catch((error) => {
    log(`❌ Benchmark failed: ${error.message}`, COLORS.RED);
    process.exit(1);
  });
}

module.exports = { PerformanceBenchmark };
