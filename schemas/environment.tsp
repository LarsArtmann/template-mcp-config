/**
 * Environment Variable Schema Definitions for MCP Configuration
 * 
 * This file defines schemas for environment variable validation,
 * including definitions for common MCP server environment variables.
 */

import "@typespec/json-schema";
import "./main.tsp";

using TypeSpec.JsonSchema;
using MCPConfig;

namespace MCPConfig.Environment;

/**
 * Predefined environment configurations for common MCP servers
 */
@jsonSchema
model KnownEnvironmentConfigs {
  /**
   * GitHub MCP Server environment variables
   */
  @doc("Environment configuration for GitHub MCP server")
  github: GitHubEnvironmentConfig;
  
  /**
   * Turso Database MCP Server environment variables
   */
  @doc("Environment configuration for Turso database server")
  turso: TursoEnvironmentConfig;
  
  /**
   * Kubernetes MCP Server environment variables
   */
  @doc("Environment configuration for Kubernetes server")
  kubernetes: KubernetesEnvironmentConfig;
  
  /**
   * Prometheus MCP Server environment variables
   */
  @doc("Environment configuration for Prometheus server")
  prometheus: PrometheusEnvironmentConfig;
  
  /**
   * SSH MCP Server environment variables
   */
  @doc("Environment configuration for SSH server")
  ssh: SshEnvironmentConfig;
  
  /**
   * Context7 MCP Server environment variables
   */
  @doc("Environment configuration for Context7 documentation server")
  context7: Context7EnvironmentConfig;
}

/**
 * GitHub MCP Server Environment Configuration
 */
@jsonSchema
model GitHubEnvironmentConfig {
  /**
   * GitHub Personal Access Token (required)
   */
  @doc("GitHub Personal Access Token for API authentication")
  GITHUB_PERSONAL_ACCESS_TOKEN: GitHubTokenVariable;
  
  /**
   * GitHub API Base URL (optional)
   */
  @doc("Custom GitHub API base URL (for GitHub Enterprise)")
  GITHUB_API_BASE_URL?: GitHubUrlVariable;
}

/**
 * Turso Database Environment Configuration
 */
@jsonSchema
model TursoEnvironmentConfig {
  /**
   * Turso Database URL (required when using Turso)
   */
  @doc("Turso database connection URL")
  TURSO_DATABASE_URL?: TursoUrlVariable;
  
  /**
   * Turso Authentication Token (required when using Turso)
   */
  @doc("Turso authentication token")
  TURSO_AUTH_TOKEN?: TursoTokenVariable;
}

/**
 * Kubernetes Environment Configuration
 */
@jsonSchema
model KubernetesEnvironmentConfig {
  /**
   * Kubernetes configuration file path
   */
  @doc("Path to Kubernetes configuration file")
  KUBECONFIG?: KubeConfigPathVariable;
  
  /**
   * Default Kubernetes namespace
   */
  @doc("Default Kubernetes namespace to use")
  KUBE_NAMESPACE?: KubeNamespaceVariable;
  
  /**
   * Kubernetes context to use
   */
  @doc("Kubernetes context name to use")
  KUBE_CONTEXT?: KubeContextVariable;
}

/**
 * Prometheus Environment Configuration
 */
@jsonSchema
model PrometheusEnvironmentConfig {
  /**
   * Prometheus server URL
   */
  @doc("Prometheus server URL for metrics queries")
  PROMETHEUS_URL?: PrometheusUrlVariable;
  
  /**
   * Prometheus authentication token
   */
  @doc("Authentication token for Prometheus (if required)")
  PROMETHEUS_AUTH_TOKEN?: PrometheusTokenVariable;
}

/**
 * SSH Environment Configuration
 */
@jsonSchema
model SshEnvironmentConfig {
  /**
   * SSH private key path
   */
  @doc("Path to SSH private key file")
  SSH_PRIVATE_KEY_PATH?: SshKeyPathVariable;
  
  /**
   * SSH known hosts file path
   */
  @doc("Path to SSH known hosts file")
  SSH_KNOWN_HOSTS_PATH?: SshKnownHostsVariable;
  
  /**
   * Default SSH user
   */
  @doc("Default SSH username")
  SSH_DEFAULT_USER?: SshUserVariable;
}

/**
 * Context7 Environment Configuration
 */
@jsonSchema
model Context7EnvironmentConfig {
  /**
   * Context7 API key (optional for rate limiting improvements)
   */
  @doc("Context7 API key for enhanced rate limits")
  CONTEXT7_API_KEY?: Context7ApiKeyVariable;
}

// Individual environment variable definitions with validation

/**
 * GitHub Personal Access Token
 */
@jsonSchema
model GitHubTokenVariable extends EnvironmentVariable {
  name: "GITHUB_PERSONAL_ACCESS_TOKEN";
  description: "GitHub Personal Access Token for repository and organization access. Create at: https://github.com/settings/tokens";
  example: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  sensitive: true;
  pattern: "^ghp_[a-zA-Z0-9]{36}$";
  type: "api_key";
}

/**
 * GitHub API Base URL
 */
@jsonSchema
model GitHubUrlVariable extends EnvironmentVariable {
  name: "GITHUB_API_BASE_URL";
  description: "Custom GitHub API base URL for GitHub Enterprise installations";
  example: "https://api.github.enterprise.com";
  defaultValue: "https://api.github.com";
  pattern: "^https://[a-zA-Z0-9.-]+(/.*)?$";
  type: "url";
}

/**
 * Turso Database URL
 */
@jsonSchema
model TursoUrlVariable extends EnvironmentVariable {
  name: "TURSO_DATABASE_URL";
  description: "Turso database connection URL with libsql protocol";
  example: "libsql://my-database.turso.io";
  pattern: "^libsql://[a-zA-Z0-9.-]+\\.turso\\.io$";
  type: "url";
}

/**
 * Turso Authentication Token
 */
@jsonSchema
model TursoTokenVariable extends EnvironmentVariable {
  name: "TURSO_AUTH_TOKEN";
  description: "Turso authentication token for database access";
  example: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...";
  sensitive: true;
  pattern: "^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$";
  type: "api_key";
}

/**
 * Kubernetes Config Path
 */
@jsonSchema
model KubeConfigPathVariable extends EnvironmentVariable {
  name: "KUBECONFIG";
  description: "Path to Kubernetes configuration file";
  example: "${HOME}/.kube/config";
  defaultValue: "${HOME}/.kube/config";
  pattern: "^[^\\0]+$"; // Any non-null path
  type: "path";
}

/**
 * Kubernetes Namespace
 */
@jsonSchema
model KubeNamespaceVariable extends EnvironmentVariable {
  name: "KUBE_NAMESPACE";
  description: "Default Kubernetes namespace for operations";
  example: "default";
  defaultValue: "default";
  pattern: "^[a-z0-9]([a-z0-9-]*[a-z0-9])?$";
  type: "string";
}

/**
 * Kubernetes Context
 */
@jsonSchema
model KubeContextVariable extends EnvironmentVariable {
  name: "KUBE_CONTEXT";
  description: "Kubernetes context name to use from kubeconfig";
  example: "my-cluster-context";
  pattern: "^[a-zA-Z0-9_.-]+$";
  type: "string";
}

/**
 * Prometheus Server URL
 */
@jsonSchema
model PrometheusUrlVariable extends EnvironmentVariable {
  name: "PROMETHEUS_URL";
  description: "Prometheus server URL for metrics queries";
  example: "http://localhost:9090";
  defaultValue: "http://localhost:9090";
  pattern: "^https?://[a-zA-Z0-9.-]+(:[0-9]+)?(/.*)?$";
  type: "url";
}

/**
 * Prometheus Authentication Token
 */
@jsonSchema
model PrometheusTokenVariable extends EnvironmentVariable {
  name: "PROMETHEUS_AUTH_TOKEN";
  description: "Authentication token for Prometheus access";
  example: "Bearer token123456789";
  sensitive: true;
  pattern: "^[A-Za-z0-9+/=_-]+$";
  type: "api_key";
}

/**
 * SSH Private Key Path
 */
@jsonSchema
model SshKeyPathVariable extends EnvironmentVariable {
  name: "SSH_PRIVATE_KEY_PATH";
  description: "Path to SSH private key file for authentication";
  example: "${HOME}/.ssh/id_rsa";
  defaultValue: "${HOME}/.ssh/id_rsa";
  pattern: "^[^\\0]+$";
  type: "path";
}

/**
 * SSH Known Hosts Path
 */
@jsonSchema
model SshKnownHostsVariable extends EnvironmentVariable {
  name: "SSH_KNOWN_HOSTS_PATH";
  description: "Path to SSH known hosts file";
  example: "${HOME}/.ssh/known_hosts";
  defaultValue: "${HOME}/.ssh/known_hosts";
  pattern: "^[^\\0]+$";
  type: "path";
}

/**
 * SSH Default User
 */
@jsonSchema
model SshUserVariable extends EnvironmentVariable {
  name: "SSH_DEFAULT_USER";
  description: "Default SSH username for connections";
  example: "ubuntu";
  pattern: "^[a-zA-Z0-9_-]+$";
  type: "string";
}

/**
 * Context7 API Key
 */
@jsonSchema
model Context7ApiKeyVariable extends EnvironmentVariable {
  name: "CONTEXT7_API_KEY";
  description: "Context7 API key for enhanced documentation access and rate limits";
  example: "ctx7_xxxxxxxxxxxxxxxxxxxx";
  sensitive: true;
  pattern: "^ctx7_[a-zA-Z0-9]{20,}$";
  type: "api_key";
}

/**
 * Environment variable validation patterns
 */
@jsonSchema
model ValidationPatterns {
  /**
   * Common patterns for environment variable validation
   */
  @doc("Predefined validation patterns for common variable types")
  patterns: {
    /**
     * GitHub token pattern (classic)
     */
    githubToken: "^ghp_[a-zA-Z0-9]{36}$",
    
    /**
     * GitHub token pattern (fine-grained)
     */
    githubTokenFineGrained: "^github_pat_[a-zA-Z0-9_]{82}$",
    
    /**
     * JWT token pattern
     */
    jwtToken: "^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$",
    
    /**
     * HTTP/HTTPS URL pattern
     */
    httpUrl: "^https?://[a-zA-Z0-9.-]+(:[0-9]+)?(/.*)?$",
    
    /**
     * File path pattern (Unix-style)
     */
    unixPath: "^(/[^/\\0]+)+/?$",
    
    /**
     * Environment variable name pattern
     */
    envVarName: "^[A-Z][A-Z0-9_]*$",
    
    /**
     * Kubernetes resource name pattern
     */
    kubernetesName: "^[a-z0-9]([a-z0-9-]*[a-z0-9])?$",
    
    /**
     * Base64 encoded data pattern
     */
    base64: "^[A-Za-z0-9+/=]+$",
    
    /**
     * Turso database URL pattern
     */
    tursoUrl: "^libsql://[a-zA-Z0-9.-]+\\.turso\\.io$"
  };
}