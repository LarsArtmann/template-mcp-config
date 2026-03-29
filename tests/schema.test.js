import { describe, it, expect } from 'vitest';
import {
  createValidator,
  validateMCPConfiguration,
  validateMCPServer,
  formatValidationErrors,
} from '../validation/schema-loader.js';

describe('Schema Validation', () => {
  const validator = createValidator();

  describe('createValidator', () => {
    it('should create a validator instance', () => {
      expect(validator).toBeDefined();
      expect(typeof validator.validate).toBe('function');
    });

    it('should have MCPConfiguration schema', () => {
      const schema = validator.getSchema('MCPConfiguration');
      expect(schema).toBeDefined();
    });

    it('should have MCPServer schema', () => {
      const schema = validator.getSchema('MCPServer');
      expect(schema).toBeDefined();
    });
  });

  describe('validateMCPConfiguration', () => {
    it('should validate a valid minimal config', () => {
      const config = {
        mcpServers: {
          'test-server': {
            command: 'bunx',
            args: ['-y', '@some/package'],
          },
        },
      };

      const result = validateMCPConfiguration(config, validator);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a config with multiple servers', () => {
      const config = {
        mcpServers: {
          server1: {
            command: 'bunx',
            args: ['-y', '@some/package1'],
          },
          server2: {
            command: 'npx',
            args: ['-y', '@some/package2'],
          },
          server3: {
            serverUrl: 'https://example.com/mcp',
          },
        },
      };

      const result = validateMCPConfiguration(config, validator);
      expect(result.valid).toBe(true);
    });

    it('should reject config without mcpServers', () => {
      const config = {
        version: '1.0.0',
      };

      const result = validateMCPConfiguration(config, validator);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate server with env variables', () => {
      const config = {
        mcpServers: {
          github: {
            command: 'bunx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: {
              GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_PERSONAL_ACCESS_TOKEN}',
            },
          },
        },
      };

      const result = validateMCPConfiguration(config, validator);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateMCPServer', () => {
    it('should validate a stdio server', () => {
      const serverConfig = {
        command: 'bunx',
        args: ['-y', '@some/package'],
      };

      const result = validateMCPServer(serverConfig, validator);
      expect(result.valid).toBe(true);
    });

    it('should validate an HTTP server', () => {
      const serverConfig = {
        serverUrl: 'https://example.com/mcp',
      };

      const result = validateMCPServer(serverConfig, validator);
      expect(result.valid).toBe(true);
    });

    it('should validate server with all optional fields', () => {
      const serverConfig = {
        command: 'bunx',
        args: ['-y', '@some/package'],
        env: {
          API_KEY: 'secret',
        },
        cwd: '/tmp',
        initTimeoutMs: 5000,
        autoRestart: true,
        maxRestarts: 5,
      };

      const result = validateMCPServer(serverConfig, validator);
      expect(result.valid).toBe(true);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format errors with instance path', () => {
      const errors = [
        {
          instancePath: '/mcpServers/test',
          message: 'must be string',
          data: 123,
        },
      ];

      const formatted = formatValidationErrors(errors);
      expect(formatted[0]).toContain('/mcpServers/test');
      expect(formatted[0]).toContain('must be string');
    });

    it('should handle empty errors array', () => {
      const formatted = formatValidationErrors([]);
      expect(formatted).toEqual([]);
    });

    it('should include data in error message when available', () => {
      const errors = [
        {
          instancePath: '/field',
          message: 'invalid type',
          data: { complex: 'object' },
        },
      ];

      const formatted = formatValidationErrors(errors);
      expect(formatted[0]).toContain('invalid type');
      expect(formatted[0]).toContain('complex');
    });
  });
});
