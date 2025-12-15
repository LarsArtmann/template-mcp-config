# MCP Server Caching Strategy

This document outlines the caching strategy for MCP servers to improve startup performance and reduce network dependency.

## Overview

MCP servers in this template are run via `bunx`, which downloads and caches packages dynamically. This approach offers flexibility but can introduce latency during first runs. This caching strategy optimizes for development and production scenarios.

## Caching Mechanisms

### 1. Bunx Package Cache

Bunx automatically caches packages in `~/.bun/install/cache/`. The cache warming script pre-downloads MCP server packages to improve startup times.

```bash
# Warm the cache for all MCP servers
bun run cache:warm

# Or manually warm specific packages
bunx --help @modelcontextprotocol/server-filesystem
```

### 2. Local Development Cache

For development environments, cache warming provides several benefits:

- **Faster server startup** - Packages are already downloaded
- **Offline development** - Cached packages work without internet
- **Consistent versions** - Reduces version drift across environments
- **CI/CD optimization** - Pre-cached containers start faster

### 3. Production Considerations

For production deployments, consider these caching strategies:

#### Container Images

```dockerfile
# Pre-cache MCP packages during image build
RUN bunx --help @upstash/context7-mcp@latest
RUN bunx --help @modelcontextprotocol/server-github
# ... other packages
```

#### Docker Compose

```yaml
services:
  mcp-app:
    build: .
    volumes:
      - bun_cache:/root/.bun/install/cache
volumes:
  bun_cache:
```

## Cache Management Scripts

### Warm Cache

```bash
bun run cache:warm
```

Proactively downloads all MCP server packages referenced in `.mcp.json`.

### Test Servers

```bash
bun run test-servers
```

Validates that all MCP servers can be accessed and started correctly.

### Validate Environment

```bash
bun run validate:env
```

Checks environment variables and configuration before starting servers.

## Cache Locations

| Runtime | Cache Location          |
| ------- | ----------------------- |
| Bun     | `~/.bun/install/cache/` |
| Node.js | `~/.npm/_cacache/`      |
| Global  | `/tmp/bunx-cache-*`     |

## Performance Optimization

### Development Workflow

1. **Initial setup**: Run cache warming after cloning

   ```bash
   git clone <repo>
   cd <repo>
   bun install
   bun run cache:warm
   ```

2. **Regular updates**: Re-warm cache after `.mcp.json` changes
   ```bash
   bun run cache:warm
   ```

### CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
- name: Cache Bun packages
  uses: actions/cache@v3
  with:
    path: ~/.bun/install/cache
    key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}

- name: Warm MCP cache
  run: bun run cache:warm
```

## Troubleshooting Cache Issues

### Clear Cache

```bash
# Clear all Bun caches
rm -rf ~/.bun/install/cache/

# Re-warm cache
bun run cache:warm
```

### Verify Cache Status

```bash
# Check cache size
du -sh ~/.bun/install/cache/

# List cached packages
ls -la ~/.bun/install/cache/
```

### Network Issues

If bunx fails to download packages:

1. Check network connectivity
2. Verify package names in `.mcp.json`
3. Check npm registry status
4. Try manual package installation

## Best Practices

### For Development Teams

1. **Document cache warming** in README setup instructions
2. **Include cache scripts** in package.json for easy access
3. **Version lock** critical MCP servers when stability is needed
4. **Test cache behavior** in different network conditions

### For Production Deployments

1. **Pre-cache in Docker images** to avoid runtime downloads
2. **Monitor cache hit rates** and package download failures
3. **Implement fallback strategies** for cache misses
4. **Use persistent volumes** for cache storage in containers

### For CI/CD

1. **Cache between builds** to improve pipeline performance
2. **Validate cache integrity** as part of testing
3. **Handle cache misses gracefully** in automated environments
4. **Monitor cache size** to prevent storage issues

## Security Considerations

- Cached packages should be from trusted sources only
- Regularly update cached packages to get security fixes
- Monitor for package compromises in the supply chain
- Use package-lock equivalents where possible for reproducibility

## Monitoring and Metrics

Track these metrics to optimize caching performance:

- Cache hit/miss ratios
- Server startup times
- Package download failures
- Cache storage usage
- Network bandwidth savings

## Implementation Details

The cache warming script (`scripts/warm-cache.js`) implements:

- Parallel package downloading for efficiency
- Error handling for network failures
- Progress reporting for long operations
- Timeout management for stuck downloads
- Verification of successful caching

This ensures reliable MCP server performance across different environments and network conditions.
