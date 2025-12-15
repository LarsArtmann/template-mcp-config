# MCP Transport Protocols Guide

This document explains the different transport protocols used by Model Context Protocol (MCP) servers in this template configuration.

## Overview

MCP servers can communicate through different transport mechanisms. This template uses two distinct protocols:

- **STDIO Transport**: Used by 14 out of 15 servers
- **SSE Transport**: Used exclusively by DeepWiki server

## STDIO Transport (Standard I/O)

### Description

STDIO transport is the standard communication method for MCP servers. It uses stdin (standard input) and stdout (standard output) for bidirectional communication between the client and server.

### How It Works

1. Client launches server process using `command` and `args`
2. Server runs as a child process of the MCP client
3. Communication flows through stdin/stdout pipes
4. Server lifecycle is managed by the client process

### Configuration Pattern

```json
{
  "server-name": {
    "command": "bunx",
    "args": ["-y", "@package/server-name"],
    "env": {
      "VARIABLE": "${VARIABLE:-default}"
    }
  }
}
```

### Used By These Servers (17/18)

- context7: `bunx -y @upstash/context7-mcp@latest`
- github: `bunx -y @modelcontextprotocol/server-github`
- filesystem: `bunx -y @modelcontextprotocol/server-filesystem`
- playwright: `bunx -y @playwright/mcp`
- puppeteer: `bunx -y @modelcontextprotocol/server-puppeteer`
- memory: `mcp-server-memory` (legacy pattern)
- sequential-thinking: `bunx -y @modelcontextprotocol/server-sequential-thinking`
- everything: `bunx -y @modelcontextprotocol/server-everything`
- kubernetes: `bunx -y mcp-server-kubernetes`
- ssh: `bunx -y @modelcontextprotocol/server-ssh`
- sqlite: `bunx -y @modelcontextprotocol/server-sqlite`
- turso: `bunx -y @modelcontextprotocol/server-turso`
- terraform: `bunx -y @modelcontextprotocol/server-terraform`
- nixos: `bunx -y @modelcontextprotocol/server-nixos`
- prometheus: `bunx -y @modelcontextprotocol/server-prometheus`
- helm: `bunx -y @modelcontextprotocol/server-helm`
- fetch: `bunx -y @modelcontextprotocol/server-fetch`
- youtube-transcript: `bunx -y @modelcontextprotocol/server-youtube-transcript`

### Advantages

- **Process isolation**: Each server runs in its own process
- **Resource management**: Client can monitor and control server resources
- **Error isolation**: Server crashes don't affect other servers
- **Development simplicity**: Standard input/output is universally supported
- **Local execution**: No network overhead or security concerns

### Best For

- Local development environments
- Desktop applications (Claude Desktop, Cursor, VS Code)
- Servers requiring file system access
- Development tools and automation scripts

## SSE Transport (Server-Sent Events)

### Description

SSE transport uses HTTP Server-Sent Events for communication. Instead of launching a local process, the client connects to a remote HTTP endpoint that streams MCP protocol messages.

### How It Works

1. Client connects to the specified `serverUrl` endpoint
2. Server streams MCP protocol messages via HTTP SSE
3. Bidirectional communication over HTTP connection
4. Server runs independently of client process

### Configuration Pattern

```json
{
  "server-name": {
    "serverUrl": "https://example.com/sse"
  }
}
```

### Used By These Servers (1/18)

- deepwiki: `https://mcp.deepwiki.com/sse`

### Advantages

- **Remote execution**: Server can run anywhere with HTTP access
- **Web integration**: Perfect for browser-based applications
- **Scalability**: Server can handle multiple clients
- **No local installation**: No need to install server packages locally
- **Cross-platform**: Works in any environment with HTTP support

### Considerations

- **Network dependency**: Requires stable internet connection
- **Latency**: Network round-trip time affects performance
- **Security**: Relies on HTTPS and server authentication
- **Availability**: Dependent on remote server uptime

### Best For

- Web-based MCP clients
- Remote or cloud-based services
- Shared services across multiple users
- Services requiring specialized infrastructure

## When to Use Each Protocol

### Choose STDIO Transport When:

- Building for desktop applications
- Need direct file system access
- Want process isolation and resource control
- Developing local development tools
- Security requirements favor local execution
- Need to work offline

### Choose SSE Transport When:

- Building web-based applications
- Need to share services across multiple users
- Server requires specialized cloud infrastructure
- Want to avoid local installation complexity
- Building browser-based integrations
- Need centralized service management

## Implementation Examples

### Adding a New STDIO Server

```json
{
  "my-new-server": {
    "command": "bunx",
    "args": ["-y", "@my-org/mcp-server-name"],
    "env": {
      "API_KEY": "${MY_API_KEY:-}",
      "CONFIG_PATH": "${HOME}/.config/my-server"
    }
  }
}
```

### Adding a New SSE Server

```json
{
  "my-remote-server": {
    "serverUrl": "https://my-service.com/mcp/sse",
    "headers": {
      "Authorization": "Bearer ${MY_TOKEN:-}"
    }
  }
}
```

## Security Considerations

### STDIO Transport Security

- Servers run with client process permissions
- Environment variables passed to server process
- File system access limited by server implementation
- Process isolation provides security boundaries

### SSE Transport Security

- Communication over HTTPS recommended
- Authentication typically via headers or URL parameters
- Server certificate validation by HTTP client
- Network traffic visible to intermediaries

## Troubleshooting

### STDIO Transport Issues

- **Server not starting**: Check command path and permissions
- **Communication errors**: Verify stdin/stdout are not being used by other code
- **Environment variables**: Ensure all required variables are set
- **Process crashes**: Check server logs and resource usage

### SSE Transport Issues

- **Connection failures**: Verify URL accessibility and network connectivity
- **Authentication errors**: Check headers and credentials
- **Protocol errors**: Ensure server implements MCP over SSE correctly
- **Timeout issues**: Consider network latency and keep-alive settings

## Migration Between Protocols

### STDIO to SSE

1. Deploy server to cloud infrastructure
2. Implement SSE endpoint for MCP protocol
3. Update configuration to use `serverUrl`
4. Remove `command`, `args`, and local `env` settings

### SSE to STDIO

1. Package server as installable npm package
2. Implement STDIO transport in server
3. Update configuration to use `command` and `args`
4. Remove `serverUrl` and remote settings

This transport protocol guide ensures you can make informed decisions about which communication method best fits your specific use case and deployment requirements.
