

# Flui API - Hybrid Architecture Documentation

## Overview

The Flui API implements a **hybrid architecture** that combines:
1. **Global Automation Sandbox**: Manages workflow state and coordination
2. **Isolated MCP Sandboxes**: Per-MCP execution environments with isolated dependencies and resources

This architecture provides the best of both worlds:
- **Coordination**: Centralized workflow management and state
- **Isolation**: Complete environment separation for MCPs
- **Performance**: Resource pooling and reuse
- **Security**: Sandboxed execution with resource limits

## Architecture Components

### 1. Node Executors

Abstract interface for executing nodes in different environments.

**Interface**: `NodeExecutor`
- `execute(input: ExecutionInput): Promise<ExecutionResult>`
- `canExecute(nodeType: string): boolean`
- `getName(): string`

**Implementations**:
- **LocalNodeExecutor**: Executes nodes in the global automation sandbox
- **MCPNodeExecutor**: Executes nodes in isolated MCP sandboxes

### 2. MCP Sandbox Manager

Manages lifecycle of isolated sandboxes for MCPs.

**Features**:
- Sandbox creation and preparation
- Environment isolation (`.env`, dependencies)
- Resource pooling and reuse
- Health checks and garbage collection
- Resource limits (CPU, memory, disk, time)
- Network access control

**Lifecycle**:
```
Create → Prepare → Ready → Execute → Idle → Destroy
```

### 3. Execution Orchestrator

Coordinates node execution using appropriate executors.

**Responsibilities**:
- Executor selection (Local vs MCP)
- Workflow state management
- Resilience patterns (retry, circuit breaker)
- Observability hooks
- Feature flag evaluation

### 4. Compatibility Adapter

Provides backward compatibility with existing API.

**Features**:
- Transparent integration with existing endpoints
- Feature flag based rollout
- Workflow-specific enablement
- Percentage-based rollout
- Fallback to legacy behavior

### 5. Observability Provider

Comprehensive logging, tracing, and metrics.

**Capabilities**:
- Structured logging
- Distributed tracing (spans)
- Metrics collection and aggregation
- Execution lifecycle tracking

## Data Flow

```
API Request
    ↓
CompatibilityAdapter (feature flags)
    ↓
ExecutionOrchestrator (strategy selection)
    ↓
┌─────────────────────┬──────────────────────┐
│                     │                      │
LocalNodeExecutor     MCPNodeExecutor
│                     │
Global Sandbox        MCPSandboxManager
                      │
                  Isolated MCP Sandbox
                  (env, deps, limits)
```

## Feature Flags

Control rollout of hybrid architecture:

```typescript
{
  useHybridArchitecture: boolean;      // Enable/disable hybrid
  mcpSandboxEnabled: boolean;          // Enable MCP sandboxes
  sandboxPoolingEnabled: boolean;      // Enable pooling
  rolloutPercentage?: number;          // 0-100
  enabledForWorkflows?: string[];      // Workflow whitelist
  enabledForMCPs?: string[];          // MCP whitelist
}
```

**Environment Variables**:
```bash
USE_HYBRID_ARCHITECTURE=true
MCP_SANDBOX_ENABLED=true
SANDBOX_POOLING_ENABLED=true
HYBRID_ROLLOUT_PERCENTAGE=50
HYBRID_ENABLED_WORKFLOWS=workflow-1,workflow-2
```

## Resource Limits

Per-sandbox resource configuration:

```typescript
{
  maxCpu: 100,              // CPU percentage
  maxMemory: 512,           // MB
  maxDisk: 1024,           // MB
  maxExecutionTime: 30000, // ms
  networkAccess: 'restricted' | 'none' | 'full'
}
```

## Sandbox Pooling

**Configuration**:
```typescript
{
  minSize: 0,           // Minimum pool size
  maxSize: 10,          // Maximum pool size
  idleTimeout: 300000,  // 5 minutes
  warmupOnStartup: false
}
```

**Pool Strategy**:
- Sandboxes are pooled per MCP
- Idle sandboxes are reused for same MCP
- Sandboxes destroyed after idle timeout
- Errors trigger immediate destruction
- Health checks ensure sandbox validity

## Resilience Patterns

### Circuit Breaker

Prevents cascading failures:

```typescript
{
  failureThreshold: 5,    // Failures before opening
  successThreshold: 2,    // Successes to close
  timeout: 60000,        // Circuit open time
  resetTimeout: 30000    // Time before retry
}
```

**States**: CLOSED → OPEN → HALF_OPEN → CLOSED

### Retry Policy

Handles transient failures:

```typescript
{
  maxRetries: 2,
  initialDelay: 1000,        // ms
  maxDelay: 10000,           // ms
  backoffMultiplier: 2,
  retryableErrors: ['ETIMEDOUT', 'ECONNRESET']
}
```

## Security

### Sandbox Isolation

- Each MCP runs in isolated environment
- Separate `.env` files per MCP
- No cross-MCP environment access
- Process isolation
- Network restrictions

### Resource Quotas

- Per-sandbox CPU limits
- Memory limits
- Disk space limits
- Execution time limits
- Concurrent execution limits

### Secrets Management

- MCPs only access own secrets
- Environment variables isolated
- No secret leakage between MCPs
- Audit logging for secret access

## Observability

### Structured Logging

```json
{
  "timestamp": "2025-10-23T12:00:00.000Z",
  "level": "info",
  "message": "Execution started",
  "context": {
    "executionId": "exec-123",
    "traceId": "trace-456",
    "nodeId": "node-789",
    "automationId": "auto-abc"
  },
  "metadata": {}
}
```

### Distributed Tracing

```
Trace: workflow-execution
  Span: execute:node-1 (100ms)
    Span: mcp-sandbox:prepare (50ms)
    Span: mcp-sandbox:execute (30ms)
  Span: execute:node-2 (80ms)
```

### Metrics

```
execution.started{nodeId,automationId}
execution.completed{nodeId,success}
execution.duration{nodeId}
execution.error{nodeId,errorType}
span.duration{spanName}
sandbox.created{mcpId}
sandbox.reused{mcpId}
```

## API Integration

### Using Compatibility Adapter

```typescript
import { getCompatibilityAdapter } from './core/executors/CompatibilityAdapter.js';

const adapter = getCompatibilityAdapter();

// Execute node
const result = await adapter.execute({
  nodeId: 'node-1',
  nodeType: 'mcp:test-tool',
  config: { toolId: 'test-tool' },
  params: { input: 'test' },
  automationId: 'auto-1',
});

if (result.error === 'LEGACY_PATH') {
  // Use legacy execution logic
} else {
  // Use result from hybrid architecture
}
```

### Updating Feature Flags

```typescript
// Runtime update
adapter.updateFeatureFlags({
  useHybridArchitecture: true,
  rolloutPercentage: 25,
});

// Get current flags
const flags = adapter.getFeatureFlags();

// Get statistics
const stats = adapter.getStats();
```

## Testing

### Unit Tests

Located in `__tests__/architecture/executors.test.ts`:
- LocalNodeExecutor tests
- MCPNodeExecutor tests
- ExecutionOrchestrator tests
- ObservabilityProvider tests
- Circuit breaker tests
- Retry logic tests

### Integration Tests

Located in `__tests__/architecture/integration.test.ts`:
- CompatibilityAdapter integration
- Sandbox pooling tests
- Environment isolation tests
- End-to-end workflow tests
- Feature flag rollout tests

### Running Tests

```bash
# All architecture tests
npm test -- __tests__/architecture

# Unit tests only
npm test -- __tests__/architecture/executors.test.ts

# Integration tests only
npm test -- __tests__/architecture/integration.test.ts

# With coverage
npm test -- --coverage __tests__/architecture
```

## Deployment Strategy

### Phase 1: Preparation (Week 1)
- [x] Implement interfaces and executors
- [x] Implement MCPSandboxManager
- [x] Implement CompatibilityAdapter
- [x] Create test suite
- [x] Documentation

### Phase 2: Validation (Week 2)
- [ ] Deploy with `useHybridArchitecture=false` (monitoring only)
- [ ] Validate observability and metrics
- [ ] Load testing
- [ ] Security audit

### Phase 3: Canary Rollout (Week 3-4)
- [ ] Enable for 1% traffic (`rolloutPercentage=1`)
- [ ] Monitor errors, latency, resources
- [ ] Gradually increase to 5%, 10%, 25%
- [ ] Enable for specific workflows first

### Phase 4: Full Rollout (Week 5-6)
- [ ] Rollout to 50% traffic
- [ ] Monitor for 1 week
- [ ] Rollout to 100% if stable
- [ ] Remove legacy code paths

### Phase 5: Optimization (Week 7+)
- [ ] Fine-tune pool sizes
- [ ] Optimize resource limits
- [ ] Enable MCP sandboxing
- [ ] Performance tuning

## Rollback Plan

### Immediate Rollback

If critical errors occur:

```typescript
// Disable hybrid architecture
adapter.updateFeatureFlags({
  useHybridArchitecture: false,
});

// Or via environment
process.env.USE_HYBRID_ARCHITECTURE = 'false';
```

### Gradual Rollback

If issues with specific workflows:

```typescript
// Remove from whitelist
adapter.updateFeatureFlags({
  enabledForWorkflows: ['safe-workflow-1', 'safe-workflow-2'],
});

// Reduce rollout percentage
adapter.updateFeatureFlags({
  rolloutPercentage: 10, // From 25%
});
```

## Performance Considerations

### Sandbox Pooling

- **Cold Start**: ~500ms (sandbox creation)
- **Warm Start**: ~50ms (pool reuse)
- **Recommendation**: Keep pool warm for frequently used MCPs

### Resource Overhead

- **Per Sandbox**: ~50-100MB memory baseline
- **Max Concurrent**: Configurable (default: 10)
- **Recommendation**: Monitor and adjust based on load

### Network Latency

- **Local IPC**: ~1-5ms overhead
- **HTTP Loopback**: ~5-10ms overhead
- **Recommendation**: Use IPC for performance-critical paths

## Monitoring & Alerting

### Key Metrics

```
# Error Rate
execution.error > 5% (5min) → Alert

# Latency
P95(execution.duration) > 5s → Warning
P99(execution.duration) > 10s → Alert

# Circuit Breaker
circuit_breaker.state = OPEN → Alert

# Sandbox Pool
sandbox.pool_exhausted > 0 → Warning
```

### Dashboards

1. **Execution Overview**
   - Success rate
   - Throughput
   - Latency (P50, P95, P99)
   - Error breakdown

2. **Sandbox Health**
   - Pool utilization
   - Creation/reuse ratio
   - Idle sandboxes
   - Resource usage

3. **MCP Performance**
   - Per-MCP execution time
   - Per-MCP error rate
   - Per-MCP resource usage

## Troubleshooting

### Common Issues

**Issue**: High sandbox creation rate
- **Cause**: Pool size too small or high idle timeout
- **Solution**: Increase pool size or reduce idle timeout

**Issue**: Circuit breaker keeps opening
- **Cause**: Underlying MCP failures
- **Solution**: Check MCP health, increase timeout, fix MCP issues

**Issue**: Memory growth
- **Cause**: Sandbox leak or pool not cleaning up
- **Solution**: Check idle timeout, verify cleanup job running

**Issue**: Slow execution
- **Cause**: Cold starts or resource contention
- **Solution**: Warm up pool, increase resource limits

## Migration Checklist

- [ ] Review all MCPs and dependencies
- [ ] Configure resource limits per MCP
- [ ] Set up monitoring and alerts
- [ ] Create runbooks for operations team
- [ ] Train team on new architecture
- [ ] Plan rollout schedule
- [ ] Define rollback criteria
- [ ] Load test with production-like traffic
- [ ] Security audit sandboxing implementation
- [ ] Documentation review
- [ ] Stakeholder approval

## Future Enhancements

1. **Container-based Sandboxes**: Use Docker/Podman for stronger isolation
2. **Horizontal Scaling**: Distribute sandboxes across multiple nodes
3. **Snapshot/Restore**: Fast sandbox initialization from snapshots
4. **Auto-scaling**: Dynamic pool sizing based on load
5. **Advanced Scheduling**: Priority-based execution scheduling
6. **Cost Optimization**: Resource usage optimization and billing

## Support

For questions or issues:
- Check troubleshooting section above
- Review test examples in `__tests__/architecture/`
- Consult API documentation in `README.md`
- Open issue with full context and logs

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-23  
**Status**: Ready for Phase 2 Deployment
