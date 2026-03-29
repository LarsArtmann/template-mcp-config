import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..', '..');

describe('Package Configuration', () => {
  const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));

  describe('package.json', () => {
    it('should be valid JSON', () => {
      expect(() => JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'))).not.toThrow();
    });

    it('should have required fields', () => {
      expect(packageJson.name).toBeDefined();
      expect(packageJson.version).toBeDefined();
      expect(packageJson.license).toBeDefined();
    });

    it('should have ES module type', () => {
      expect(packageJson.type).toBe('module');
    });

    it('should have scripts', () => {
      expect(packageJson.scripts).toBeDefined();
      expect(typeof packageJson.scripts).toBe('object');
    });

    it('should have required scripts', () => {
      const requiredScripts = ['install-all', 'test', 'lint', 'validate:json'];
      for (const script of requiredScripts) {
        expect(packageJson.scripts[script]).toBeDefined();
      }
    });

    it('should have engines specification', () => {
      expect(packageJson.engines).toBeDefined();
      expect(packageJson.engines.node).toBeDefined();
      expect(packageJson.engines.bun).toBeDefined();
    });
  });

  describe('Dependencies', () => {
    it('should have dependencies', () => {
      expect(packageJson.dependencies).toBeDefined();
      expect(Object.keys(packageJson.dependencies).length).toBeGreaterThan(0);
    });

    it('should have MCP server dependencies', () => {
      const deps = Object.keys(packageJson.dependencies);
      const mcpServers = [
        '@modelcontextprotocol/server-filesystem',
        '@modelcontextprotocol/server-github',
        '@modelcontextprotocol/server-memory',
        '@upstash/context7-mcp',
        '@playwright/mcp',
      ];

      for (const server of mcpServers) {
        expect(deps).toContain(server);
      }
    });

    it('should have validation dependencies', () => {
      expect(packageJson.dependencies.ajv).toBeDefined();
      expect(packageJson.dependencies['ajv-formats']).toBeDefined();
    });
  });

  describe('Dev Dependencies', () => {
    it('should have devDependencies', () => {
      expect(packageJson.devDependencies).toBeDefined();
    });

    it('should have testing framework', () => {
      expect(packageJson.devDependencies.vitest).toBeDefined();
    });

    it('should have linting tools', () => {
      expect(packageJson.devDependencies.eslint).toBeDefined();
      expect(packageJson.devDependencies.prettier).toBeDefined();
    });

    it('should have TypeSpec tools', () => {
      expect(packageJson.devDependencies['@typespec/compiler']).toBeDefined();
    });
  });
});
