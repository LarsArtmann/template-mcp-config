import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

describe('MCP Configuration Validation', () => {
  describe('.mcp.json', () => {
    it('should be valid JSON', () => {
      const configPath = path.join(rootDir, '.mcp.json');
      const content = fs.readFileSync(configPath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should have mcpServers property', () => {
      const configPath = path.join(rootDir, '.mcp.json');
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      expect(config).toHaveProperty('mcpServers');
      expect(typeof config.mcpServers).toBe('object');
    });

    it('should have at least one server configured', () => {
      const configPath = path.join(rootDir, '.mcp.json');
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      const serverCount = Object.keys(config.mcpServers).length;
      expect(serverCount).toBeGreaterThan(0);
    });

    it('should include expected core servers', () => {
      const configPath = path.join(rootDir, '.mcp.json');
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      const servers = Object.keys(config.mcpServers);

      const coreServers = ['context7', 'github', 'filesystem', 'playwright'];
      const missingCore = coreServers.filter(s => !servers.includes(s));
      expect(missingCore).toHaveLength(0);
    });
  });

  describe('Server Configuration', () => {
    it('should have either command or serverUrl for each server', () => {
      const configPath = path.join(rootDir, '.mcp.json');
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      for (const serverConfig of Object.values(config.mcpServers)) {
        const hasCommand = !!serverConfig.command;
        const hasServerUrl = !!serverConfig.serverUrl;
        expect(hasCommand || hasServerUrl).toBe(true);
      }
    });

    it('should use bunx command for stdio servers', () => {
      const configPath = path.join(rootDir, '.mcp.json');
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      for (const serverConfig of Object.values(config.mcpServers)) {
        if (serverConfig.command) {
          expect(serverConfig.command).toMatch(/^(bunx|npx)$/);
        }
      }
    });

    it('should have args array for stdio servers', () => {
      const configPath = path.join(rootDir, '.mcp.json');
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      for (const serverConfig of Object.values(config.mcpServers)) {
        if (serverConfig.command) {
          expect(Array.isArray(serverConfig.args)).toBe(true);
          expect(serverConfig.args.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Environment Variables', () => {
    it('should extract required env vars correctly', () => {
      const configPath = path.join(rootDir, '.mcp.json');
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      const envVars = new Set();
      for (const serverConfig of Object.values(config.mcpServers)) {
        if (serverConfig.env) {
          for (const [key, value] of Object.entries(serverConfig.env)) {
            if (value.includes('${') && !value.includes(':-')) {
              envVars.add(key);
            }
          }
        }
      }

      // GITHUB_PERSONAL_ACCESS_TOKEN should be required
      expect(envVars.has('GITHUB_PERSONAL_ACCESS_TOKEN')).toBe(true);
    });
  });
});
