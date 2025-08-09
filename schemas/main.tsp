/**
 * MCP Configuration TypeSpec Schema
 * 
 * This file defines the complete schema for Model Context Protocol (MCP) 
 * configurations, including server definitions, environment variables,
 * and validation rules.
 */

import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@typespec/json-schema";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using TypeSpec.JsonSchema;

/**
 * MCP Configuration API Service Definition
 * 
 * Schema definitions for Model Context Protocol (MCP) configurations.
 * This includes server configurations, environment variables, and validation rules.
 */
@service({
  title: "MCP Configuration Schema",
})
namespace MCPConfig;

/**
 * Root MCP configuration structure
 */
@jsonSchema
model MCPConfiguration {
  /**
   * Collection of MCP servers to configure
   */
  @doc("Collection of MCP servers with their configurations")
  mcpServers: Record<MCPServer>;
  
  /**
   * Optional global configuration settings
   */
  @doc("Global configuration settings (optional)")
  global?: GlobalConfiguration;
  
  /**
   * Schema version for configuration format
   */
  @doc("Configuration schema version")
  version?: string = "1.0.0";
}

/**
 * Global MCP configuration settings
 */
@jsonSchema
model GlobalConfiguration {
  /**
   * Global timeout for server operations (milliseconds)
   */
  @doc("Timeout for server operations in milliseconds")
  @minValue(1000)
  @maxValue(300000)
  timeoutMs?: int32 = 30000;
  
  /**
   * Maximum number of concurrent server connections
   */
  @doc("Maximum concurrent server connections")
  @minValue(1)
  @maxValue(50)
  maxConcurrentServers?: int32 = 10;
  
  /**
   * Enable debug logging for all servers
   */
  @doc("Enable debug logging for all servers")
  debug?: boolean = false;
}

/**
 * MCP Server configuration
 * Can be either a stdio server (with command) or HTTP server (with serverUrl)
 */
@jsonSchema
@discriminator("type")
@doc("MCP Server configuration supporting both stdio and HTTP protocols")
union MCPServer {
  /**
   * Standard I/O based MCP server
   */
  @doc("Standard I/O based MCP server configuration")
  stdio: StdioMCPServer,
  
  /**
   * HTTP-based MCP server
   */
  @doc("HTTP-based MCP server configuration")
  http: HttpMCPServer,
}

/**
 * Standard I/O MCP Server Configuration
 * These servers run as child processes communicating via stdin/stdout
 */
@jsonSchema
model StdioMCPServer {
  /**
   * Server type discriminator
   */
  @doc("Server type identifier")
  type: "stdio";
  
  /**
   * Command to execute for the MCP server
   */
  @doc("Command to execute (e.g., 'bunx', 'node', 'python')")
  @minLength(1)
  command: string;
  
  /**
   * Command line arguments
   */
  @doc("Command line arguments for the server")
  args?: string[];
  
  /**
   * Environment variables for the server process
   */
  @doc("Environment variables for the server process")
  env?: Record<string>;
  
  /**
   * Working directory for the server process
   */
  @doc("Working directory for the server process")
  cwd?: string;
  
  /**
   * Server initialization timeout (milliseconds)
   */
  @doc("Server initialization timeout in milliseconds")
  @minValue(1000)
  @maxValue(60000)
  initTimeoutMs?: int32 = 10000;
  
  /**
   * Whether to restart the server on failure
   */
  @doc("Automatically restart server on failure")
  autoRestart?: boolean = false;
  
  /**
   * Maximum number of restart attempts
   */
  @doc("Maximum restart attempts (requires autoRestart: true)")
  @minValue(1)
  @maxValue(10)
  maxRestarts?: int32 = 3;
}

/**
 * HTTP MCP Server Configuration
 * These servers communicate via HTTP with SSE for streaming
 */
@jsonSchema
model HttpMCPServer {
  /**
   * Server type discriminator
   */
  @doc("Server type identifier")
  type: "http";
  
  /**
   * Server URL for HTTP communication
   */
  @doc("Server URL (must be valid HTTP/HTTPS URL)")
  @format("uri")
  @pattern("^https?://")
  serverUrl: url;
  
  /**
   * Optional authentication headers
   */
  @doc("Authentication headers for HTTP requests")
  headers?: Record<string>;
  
  /**
   * Connection timeout (milliseconds)
   */
  @doc("HTTP connection timeout in milliseconds")
  @minValue(1000)
  @maxValue(30000)
  connectTimeoutMs?: int32 = 5000;
  
  /**
   * Request timeout (milliseconds)
   */
  @doc("HTTP request timeout in milliseconds")
  @minValue(1000)
  @maxValue(60000)
  requestTimeoutMs?: int32 = 30000;
  
  /**
   * Whether to verify SSL certificates
   */
  @doc("Verify SSL certificates for HTTPS connections")
  verifySsl?: boolean = true;
  
  /**
   * Maximum number of connection retries
   */
  @doc("Maximum connection retry attempts")
  @minValue(0)
  @maxValue(10)
  maxRetries?: int32 = 3;
  
  /**
   * Retry delay (milliseconds)
   */
  @doc("Delay between retry attempts in milliseconds")
  @minValue(100)
  @maxValue(10000)
  retryDelayMs?: int32 = 1000;
}

/**
 * Environment Variable Configuration
 * Defines required and optional environment variables for MCP servers
 */
@jsonSchema
model EnvironmentConfig {
  /**
   * Environment variables required for server operation
   */
  @doc("Required environment variables that must be set")
  required: EnvironmentVariable[];
  
  /**
   * Optional environment variables with defaults
   */
  @doc("Optional environment variables with default values")
  optional?: EnvironmentVariable[];
}

/**
 * Individual environment variable definition
 */
@jsonSchema
model EnvironmentVariable {
  /**
   * Environment variable name
   */
  @doc("Environment variable name")
  @pattern("^[A-Z][A-Z0-9_]*$")
  name: string;
  
  /**
   * Human-readable description
   */
  @doc("Description of the environment variable's purpose")
  @minLength(10)
  description: string;
  
  /**
   * Example value (should not contain sensitive data)
   */
  @doc("Example value (use placeholders for sensitive data)")
  example?: string;
  
  /**
   * Default value (for optional variables only)
   */
  @doc("Default value if not provided")
  defaultValue?: string;
  
  /**
   * Whether this variable contains sensitive data
   */
  @doc("Indicates if variable contains sensitive information")
  sensitive?: boolean = false;
  
  /**
   * Validation pattern for the variable value
   */
  @doc("Regular expression pattern for value validation")
  pattern?: string;
  
  /**
   * Variable type/category
   */
  @doc("Variable type or category")
  type?: "api_key" | "url" | "path" | "boolean" | "number" | "string";
}

/**
 * Validation Result
 * Structure returned by validation operations
 */
@jsonSchema
model ValidationResult {
  /**
   * Overall validation status
   */
  @doc("Whether validation passed successfully")
  valid: boolean;
  
  /**
   * Validation errors that prevent operation
   */
  @doc("Critical errors that prevent server operation")
  errors: ValidationError[];
  
  /**
   * Validation warnings for potential issues
   */
  @doc("Non-critical warnings about configuration")
  warnings: ValidationWarning[];
  
  /**
   * Detailed validation results by category
   */
  @doc("Detailed results broken down by validation category")
  details: ValidationDetails;
  
  /**
   * Timestamp of validation
   */
  @doc("When the validation was performed")
  timestamp: utcDateTime;
}

/**
 * Validation error details
 */
@jsonSchema
model ValidationError {
  /**
   * Error code for programmatic handling
   */
  @doc("Machine-readable error code")
  code: string;
  
  /**
   * Human-readable error message
   */
  @doc("Human-readable error description")
  message: string;
  
  /**
   * Path to the problematic configuration element
   */
  @doc("JSON path to the configuration element causing the error")
  path?: string;
  
  /**
   * Suggested resolution
   */
  @doc("Suggested steps to resolve the error")
  resolution?: string;
}

/**
 * Validation warning details
 */
@jsonSchema
model ValidationWarning {
  /**
   * Warning code for programmatic handling
   */
  @doc("Machine-readable warning code")
  code: string;
  
  /**
   * Human-readable warning message
   */
  @doc("Human-readable warning description")
  message: string;
  
  /**
   * Path to the configuration element
   */
  @doc("JSON path to the configuration element")
  path?: string;
  
  /**
   * Recommended action
   */
  @doc("Recommended action to address the warning")
  recommendation?: string;
}

/**
 * Detailed validation results
 */
@jsonSchema
model ValidationDetails {
  /**
   * Configuration structure validation
   */
  @doc("Results of configuration structure validation")
  structure: ValidationCategory;
  
  /**
   * Server configuration validation
   */
  @doc("Results of individual server validation")
  servers: ValidationCategory;
  
  /**
   * Environment variable validation
   */
  @doc("Results of environment variable validation")
  environment: ValidationCategory;
  
  /**
   * Server connectivity validation
   */
  @doc("Results of server connectivity tests")
  connectivity: ValidationCategory;
}

/**
 * Validation results for a specific category
 */
@jsonSchema
model ValidationCategory {
  /**
   * Category validation status
   */
  @doc("Whether this category passed validation")
  valid: boolean;
  
  /**
   * Errors in this category
   */
  @doc("Errors specific to this validation category")
  errors: ValidationError[];
  
  /**
   * Warnings in this category
   */
  @doc("Warnings specific to this validation category")
  warnings: ValidationWarning[];
  
  /**
   * Additional category-specific metadata
   */
  @doc("Additional metadata specific to this category")
  metadata?: Record<unknown>;
}