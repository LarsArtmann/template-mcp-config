#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class MCPValidator {
  constructor() {
    this.projectRoot = path.dirname(__dirname);
    this.mcpConfigPath = path.join(this.projectRoot, ".mcp.json");
    this.envPath = path.join(this.projectRoot, ".env");
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
    this.total = 0;
  }

  log(message, type = "info") {
    const prefix = {
      info: "📋",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      progress: "⏳",
    }[type];
    console.log(`${prefix} ${message}`);
  }

  exec(command, options = {}) {
    try {
      const result = execSync(command, {
        stdio: "pipe",
        encoding: "utf8",
        ...options,
      });
      return result.trim();
    } catch (error) {
      return null;
    }
  }

  test(name, testFn) {
    this.total++;
    try {
      const result = testFn();
      if (result === true || result === undefined) {
        this.log(`${name}`, "success");
        this.passed++;
      } else {
        this.warnings.push(`${name}: ${result}`);
        this.log(`${name}: ${result}`, "warning");
      }
    } catch (error) {
      this.errors.push(`${name}: ${error.message}`);
      this.log(`${name}: ${error.message}`, "error");
    }
  }

  validateFileExists() {
    this.test("MCP configuration file exists", () => {
      if (!fs.existsSync(this.mcpConfigPath)) {
        throw new Error(".mcp.json not found");
      }
    });
  }

  validateJSONSyntax() {
    this.test("MCP configuration JSON syntax", () => {
      try {
        const content = fs.readFileSync(this.mcpConfigPath, "utf8");
        JSON.parse(content);
      } catch (error) {
        throw new Error(`Invalid JSON syntax: ${error.message}`);
      }
    });
  }

  validateMCPStructure() {
    this.test("MCP configuration structure", () => {
      const config = JSON.parse(fs.readFileSync(this.mcpConfigPath, "utf8"));

      if (!config.mcpServers) {
        throw new Error("Missing mcpServers object");
      }

      const serverCount = Object.keys(config.mcpServers).length;
      if (serverCount === 0) {
        throw new Error("No MCP servers configured");
      }

      return `${serverCount} servers configured`;
    });
  }

  validateServerConfigurations() {
    const config = JSON.parse(fs.readFileSync(this.mcpConfigPath, "utf8"));

    for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
      this.test(`Server config: ${serverName}`, () => {
        // Remote servers (SSE endpoints)
        if (serverConfig.serverUrl) {
          if (!serverConfig.serverUrl.startsWith("http")) {
            throw new Error("serverUrl must start with http/https");
          }
          return "Remote SSE server";
        }

        // Local command-based servers
        if (!serverConfig.command) {
          throw new Error("Missing command field");
        }

        if (!Array.isArray(serverConfig.args)) {
          throw new Error("args must be an array");
        }

        if (serverConfig.env && typeof serverConfig.env !== "object") {
          throw new Error("env must be an object");
        }

        return "Local command server";
      });
    }
  }

  validateEnvironmentFile() {
    this.test("Environment file exists", () => {
      if (!fs.existsSync(this.envPath)) {
        return '.env file not found - use "just setup" to create one';
      }
    });
  }

  validateEnvironmentVariables() {
    if (!fs.existsSync(this.envPath)) {
      this.warnings.push("Skipping environment validation - .env file not found");
      return;
    }

    const config = JSON.parse(fs.readFileSync(this.mcpConfigPath, "utf8"));
    const envContent = fs.readFileSync(this.envPath, "utf8");

    // Parse .env file
    const envVars = {};
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        envVars[match[1].trim()] = match[2].trim();
      }
    });

    this.test("GitHub token configuration", () => {
      const hasGitHubServer = config.mcpServers.github;
      const hasToken =
        envVars.GITHUB_PERSONAL_ACCESS_TOKEN &&
        envVars.GITHUB_PERSONAL_ACCESS_TOKEN !== "your_token_here" &&
        envVars.GITHUB_PERSONAL_ACCESS_TOKEN !== "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

      if (hasGitHubServer && !hasToken) {
        throw new Error("GitHub server configured but GITHUB_PERSONAL_ACCESS_TOKEN not set");
      }

      if (hasToken && !hasToken.startsWith("ghp_")) {
        return "GitHub token format may be incorrect (should start with ghp_)";
      }
    });

    this.test("Turso configuration", () => {
      const hasTursoServer = config.mcpServers.turso;
      const hasUrl =
        envVars.TURSO_DATABASE_URL && !envVars.TURSO_DATABASE_URL.includes("your-database");
      const hasToken =
        envVars.TURSO_AUTH_TOKEN && !envVars.TURSO_AUTH_TOKEN.includes("your-auth-token");

      if (hasTursoServer && (!hasUrl || !hasToken)) {
        return "Turso server configured but credentials incomplete (optional)";
      }
    });
  }

  validateSystemDependencies() {
    this.test("Node.js version", () => {
      const nodeVersion = this.exec("node --version");
      if (!nodeVersion) {
        throw new Error("Node.js not found");
      }

      const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);
      if (majorVersion < 16) {
        throw new Error(`Node.js v16+ required, found ${nodeVersion}`);
      }

      return nodeVersion;
    });

    this.test("Bun runtime", () => {
      const bunVersion = this.exec("bunx --version");
      if (!bunVersion) {
        return 'Bun not found - run "just install-deps" to install';
      }
      return bunVersion;
    });

    this.test("Git availability", () => {
      const gitVersion = this.exec("git --version");
      if (!gitVersion) {
        return "Git not found (recommended for version control)";
      }
      return gitVersion.split(" ")[2];
    });
  }

  validateServerAccessibility() {
    const config = JSON.parse(fs.readFileSync(this.mcpConfigPath, "utf8"));

    // Test a few key servers for package accessibility
    const testServers = [
      { name: "context7", package: "@upstash/context7-mcp" },
      { name: "github", package: "@modelcontextprotocol/server-github" },
      {
        name: "filesystem",
        package: "@modelcontextprotocol/server-filesystem",
      },
    ];

    for (const server of testServers) {
      if (config.mcpServers[server.name]) {
        this.test(`Package access: ${server.name}`, () => {
          const result = this.exec(`bunx ${server.package} --help`, {
            timeout: 15000,
          });
          if (result === null) {
            return "Package may need installation on first use";
          }
          return "Accessible";
        });
      }
    }
  }

  validateFilesystemPaths() {
    const config = JSON.parse(fs.readFileSync(this.mcpConfigPath, "utf8"));

    if (config.mcpServers.filesystem && config.mcpServers.filesystem.args) {
      this.test("Filesystem server paths", () => {
        const paths = config.mcpServers.filesystem.args.slice(2); // Skip bunx args
        const invalidPaths = [];
        const validPaths = [];

        paths.forEach((pathTemplate) => {
          // Expand environment variables
          let expandedPath = pathTemplate.replace(/\$\{HOME\}/g, require("os").homedir());

          if (fs.existsSync(expandedPath)) {
            validPaths.push(expandedPath);
          } else {
            invalidPaths.push(expandedPath);
          }
        });

        if (invalidPaths.length > 0) {
          return `${validPaths.length} valid paths, ${invalidPaths.length} not found: ${invalidPaths.join(", ")}`;
        }

        return `All ${validPaths.length} paths accessible`;
      });
    }
  }

  displaySummary() {
    console.log("\n📊 Validation Summary");
    console.log("=====================");
    console.log(`Tests passed: ${this.passed}/${this.total}`);

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach((warning) => console.log(`   ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):`);
      this.errors.forEach((error) => console.log(`   ${error}`));
    }

    console.log("");

    if (this.errors.length === 0) {
      if (this.warnings.length === 0) {
        this.log("Configuration is valid and ready to use!", "success");
      } else {
        this.log("Configuration is valid with minor issues", "warning");
      }
    } else {
      this.log("Configuration has errors that need to be fixed", "error");
    }
  }

  run() {
    console.log("🔍 Validating MCP Configuration\n");

    try {
      // Core validation
      this.validateFileExists();
      this.validateJSONSyntax();
      this.validateMCPStructure();
      this.validateServerConfigurations();

      // Environment validation
      this.validateEnvironmentFile();
      this.validateEnvironmentVariables();

      // System validation
      this.validateSystemDependencies();

      // Server validation
      this.validateServerAccessibility();
      this.validateFilesystemPaths();
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, "error");
    }

    this.displaySummary();

    // Exit with error code if validation failed
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new MCPValidator();
  validator.run();
}

module.exports = MCPValidator;
