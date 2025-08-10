#!/usr/bin/env node

/**
 * TypeSpec Schema Loader
 * 
 * Loads and compiles TypeSpec-generated JSON schemas for validation.
 * Converts YAML schema files to JavaScript objects and sets up Ajv validators.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Schema file paths
const SCHEMA_DIR = path.join(__dirname, '..', 'schemas', 'generated', 'json-schema');

/**
 * Schema cache to avoid reloading
 */
const schemaCache = new Map();

/**
 * Load a YAML schema file and convert to JavaScript object
 * @param {string} schemaName - Name of the schema file (without .yaml extension)
 * @returns {Object} Parsed schema object
 */
function loadSchema(schemaName) {
  // Check cache first
  if (schemaCache.has(schemaName)) {
    return schemaCache.get(schemaName);
  }

  const schemaPath = path.join(SCHEMA_DIR, `${schemaName}.yaml`);
  
  try {
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const yamlContent = fs.readFileSync(schemaPath, 'utf8');
    const schema = yaml.load(yamlContent);
    
    // Cache the loaded schema
    schemaCache.set(schemaName, schema);
    
    return schema;
  } catch (error) {
    throw new Error(`Failed to load schema ${schemaName}: ${error.message}`);
  }
}

/**
 * Create a simplified inline schema for MCP Configuration validation
 * This avoids complex reference resolution by inlining all necessary schemas
 * @returns {Object} Complete inline schema for MCP Configuration
 */
function createInlineMCPSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      mcpServers: {
        type: "object",
        patternProperties: {
          ".*": {
            oneOf: [
              {
                // Stdio Server
                type: "object",
                properties: {
                  type: { type: "string", const: "stdio" },
                  command: { type: "string", minLength: 1 },
                  args: { type: "array", items: { type: "string" } },
                  env: { 
                    type: "object",
                    patternProperties: { ".*": { type: "string" } }
                  },
                  cwd: { type: "string" },
                  initTimeoutMs: { 
                    type: "integer", 
                    minimum: 1000, 
                    maximum: 60000, 
                    default: 10000 
                  },
                  autoRestart: { type: "boolean", default: false },
                  maxRestarts: { 
                    type: "integer", 
                    minimum: 1, 
                    maximum: 10, 
                    default: 3 
                  }
                },
                required: ["command"],
                additionalProperties: false
              },
              {
                // HTTP Server  
                type: "object",
                properties: {
                  type: { type: "string", const: "http" },
                  serverUrl: { 
                    type: "string",
                    format: "uri",
                    pattern: "^https?://"
                  },
                  headers: {
                    type: "object",
                    patternProperties: { ".*": { type: "string" } }
                  },
                  connectTimeoutMs: {
                    type: "integer",
                    minimum: 1000,
                    maximum: 30000,
                    default: 5000
                  },
                  requestTimeoutMs: {
                    type: "integer", 
                    minimum: 1000,
                    maximum: 60000,
                    default: 30000
                  },
                  verifySsl: { type: "boolean", default: true },
                  maxRetries: {
                    type: "integer",
                    minimum: 0,
                    maximum: 10,
                    default: 3
                  },
                  retryDelayMs: {
                    type: "integer",
                    minimum: 100,
                    maximum: 10000,
                    default: 1000
                  }
                },
                required: ["serverUrl"],
                additionalProperties: false
              },
              {
                // Legacy format (no explicit type)
                type: "object",
                properties: {
                  command: { type: "string", minLength: 1 },
                  args: { type: "array", items: { type: "string" } },
                  env: { 
                    type: "object",
                    patternProperties: { ".*": { type: "string" } }
                  },
                  cwd: { type: "string" },
                  serverUrl: { 
                    type: "string",
                    format: "uri",
                    pattern: "^https?://"
                  },
                  headers: {
                    type: "object",
                    patternProperties: { ".*": { type: "string" } }
                  }
                },
                anyOf: [
                  { required: ["command"] },
                  { required: ["serverUrl"] }
                ],
                additionalProperties: false
              }
            ]
          }
        },
        minProperties: 1
      },
      global: {
        type: "object",
        properties: {
          timeoutMs: {
            type: "integer",
            minimum: 1000,
            maximum: 300000,
            default: 30000
          },
          maxConcurrentServers: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 10
          },
          debug: { type: "boolean", default: false }
        },
        additionalProperties: false
      },
      version: { type: "string", default: "1.0.0" }
    },
    required: ["mcpServers"],
    additionalProperties: false
  };
}

/**
 * Create an Ajv instance with the inline MCP schema
 * @returns {Ajv} Configured Ajv instance
 */
function createValidator() {
  const ajv = new Ajv({
    allErrors: true,           // Collect all errors, not just first
    verbose: true,             // Include schema path in errors
    strict: false,             // Allow additional schema properties
    removeAdditional: false    // Keep additional properties
  });

  // Add format validators (uri, date-time, etc.)
  addFormats(ajv);

  // Add the inline MCP configuration schema
  const mcpSchema = createInlineMCPSchema();
  ajv.addSchema(mcpSchema, 'MCPConfiguration');

  return ajv;
}

/**
 * Validate data against a specific schema
 * @param {Object} data - Data to validate
 * @param {string} schemaName - Name of the schema to validate against
 * @param {Ajv} [validator] - Optional pre-configured validator instance
 * @returns {Object} Validation result with {valid, errors, data}
 */
function validateAgainstSchema(data, schemaName, validator = null) {
  try {
    const ajv = validator || createValidator();
    const validate = ajv.getSchema(schemaName);
    
    if (!validate) {
      throw new Error(`Schema ${schemaName} not found or failed to compile`);
    }

    const valid = validate(data);
    
    return {
      valid,
      errors: validate.errors || [],
      data,
      schema: schemaName
    };
  } catch (error) {
    return {
      valid: false,
      errors: [{
        instancePath: '',
        schemaPath: '',
        keyword: 'system',
        message: error.message
      }],
      data,
      schema: schemaName
    };
  }
}

/**
 * Validate MCP configuration against the root schema
 * @param {Object} config - MCP configuration object
 * @param {Ajv} [validator] - Optional pre-configured validator instance
 * @returns {Object} Validation result
 */
function validateMCPConfiguration(config, validator = null) {
  return validateAgainstSchema(config, 'MCPConfiguration', validator);
}

/**
 * Validate an individual MCP server configuration
 * @param {Object} serverConfig - Server configuration object
 * @param {Ajv} [validator] - Optional pre-configured validator instance
 * @returns {Object} Validation result
 */
function validateMCPServer(serverConfig, validator = null) {
  return validateAgainstSchema(serverConfig, 'MCPServer', validator);
}

/**
 * Format validation errors for display
 * @param {Array} errors - Array of Ajv validation errors
 * @returns {Array} Formatted error messages
 */
function formatValidationErrors(errors) {
  return errors.map(error => {
    const path = error.instancePath || 'root';
    const message = error.message || 'Unknown error';
    const value = error.data !== undefined ? ` (got: ${JSON.stringify(error.data)})` : '';
    
    return `${path}: ${message}${value}`;
  });
}

/**
 * Get all available schema names
 * @returns {Array<string>} List of available schema names
 */
function getAvailableSchemas() {
  try {
    const files = fs.readdirSync(SCHEMA_DIR);
    return files
      .filter(file => file.endsWith('.yaml'))
      .map(file => file.replace('.yaml', ''))
      .sort();
  } catch (error) {
    return [];
  }
}

/**
 * Validate that all required schemas are available
 * @returns {Object} Validation result with missing schemas
 */
function validateSchemaAvailability() {
  const requiredSchemas = [
    'MCPConfiguration',
    'MCPServer',
    'StdioMCPServer', 
    'HttpMCPServer'
  ];

  const availableSchemas = getAvailableSchemas();
  const missingSchemas = requiredSchemas.filter(
    schema => !availableSchemas.includes(schema)
  );

  return {
    valid: missingSchemas.length === 0,
    missingSchemas,
    availableSchemas,
    requiredSchemas
  };
}

module.exports = {
  loadSchema,
  createValidator,
  validateAgainstSchema,
  validateMCPConfiguration,
  validateMCPServer,
  formatValidationErrors,
  getAvailableSchemas,
  validateSchemaAvailability
};

// CLI usage for testing
if (require.main === module) {
  console.log('🔧 Testing TypeSpec Schema Loader...');
  
  try {
    // Test schema availability
    const availability = validateSchemaAvailability();
    console.log(`📋 Schema availability check:`, availability);
    
    if (!availability.valid) {
      console.error(`❌ Missing schemas: ${availability.missingSchemas.join(', ')}`);
      process.exit(1);
    }

    // Test validator creation
    const validator = createValidator();
    console.log(`✅ Validator created successfully`);
    
    // List available schemas
    const schemas = getAvailableSchemas();
    console.log(`📚 Available schemas (${schemas.length}): ${schemas.join(', ')}`);
    
    // Test basic validation
    const testConfig = {
      mcpServers: {
        'test-server': {
          type: 'stdio',
          command: 'bunx'
        }
      }
    };

    const result = validateMCPConfiguration(testConfig, validator);
    console.log(`🧪 Test validation result:`, {
      valid: result.valid,
      errorCount: result.errors.length,
      errors: formatValidationErrors(result.errors).slice(0, 3) // Show first 3 errors
    });

  } catch (error) {
    console.error(`❌ Schema loader test failed:`, error.message);
    process.exit(1);
  }
}