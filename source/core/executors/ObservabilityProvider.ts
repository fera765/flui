/**
 * Observability Provider
 * 
 * Provides logging, tracing, and metrics for execution monitoring
 * Implements structured logging and distributed tracing
 */

import { ExecutionContext, ExecutionResult, ExecutionObserver } from './types.js';
import { nanoid } from 'nanoid';

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: ExecutionContext;
  metadata?: Record<string, any>;
}

export interface Span {
  id: string;
  name: string;
  parentId?: string;
  startTime: number;
  endTime?: number;
  tags?: Record<string, string>;
  logs?: LogEntry[];
}

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram';
}

export class ObservabilityProvider implements ExecutionObserver {
  private spans: Map<string, Span> = new Map();
  private metrics: Metric[] = [];
  private logs: LogEntry[] = [];
  private maxStoredMetrics = 10000;
  private maxStoredLogs = 10000;

  /**
   * Create a new span for tracing
   */
  createSpan(name: string, parentSpan?: string): string {
    const span: Span = {
      id: nanoid(),
      name,
      parentId: parentSpan,
      startTime: Date.now(),
      tags: {},
      logs: [],
    };

    this.spans.set(span.id, span);
    
    this.log('debug', `Span started: ${name}`, undefined, {
      spanId: span.id,
      parentSpanId: parentSpan,
    });

    return span.id;
  }

  /**
   * End a span
   */
  endSpan(spanId: string): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    const duration = span.endTime - span.startTime;

    this.log('debug', `Span ended: ${span.name}`, undefined, {
      spanId,
      duration,
    });

    // Record span duration as metric
    this.recordMetric(`span.duration.${span.name}`, duration, {
      spanId,
      parentSpanId: span.parentId || 'none',
    });
  }

  /**
   * Add tag to span
   */
  addSpanTag(spanId: string, key: string, value: string): void {
    const span = this.spans.get(spanId);
    if (span && span.tags) {
      span.tags[key] = value;
    }
  }

  /**
   * Log to span
   */
  logToSpan(spanId: string, level: LogEntry['level'], message: string, metadata?: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (span) {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        metadata,
      };
      span.logs?.push(logEntry);
    }
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: this.inferMetricType(name),
    };

    this.metrics.push(metric);

    // Trim old metrics if exceeding limit
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.maxStoredMetrics);
    }

    this.log('debug', `Metric recorded: ${name} = ${value}`, undefined, { tags });
  }

  /**
   * Infer metric type from name
   */
  private inferMetricType(name: string): Metric['type'] {
    if (name.includes('.count') || name.includes('.total')) {
      return 'counter';
    }
    if (name.includes('.duration') || name.includes('.latency')) {
      return 'histogram';
    }
    return 'gauge';
  }

  /**
   * Log execution start
   */
  onExecutionStart(context: ExecutionContext): void {
    this.log('info', `Execution started: ${context.nodeId}`, context, {
      executionId: context.executionId,
      traceId: context.traceId,
      automationId: context.automationId,
    });

    this.recordMetric('execution.started', 1, {
      nodeId: context.nodeId,
      automationId: context.automationId,
    });
  }

  /**
   * Log execution completion
   */
  onExecutionComplete(context: ExecutionContext, result: ExecutionResult): void {
    this.log('info', `Execution completed: ${context.nodeId}`, context, {
      success: result.success,
      duration: result.duration,
      executionId: context.executionId,
    });

    this.recordMetric('execution.completed', 1, {
      nodeId: context.nodeId,
      automationId: context.automationId,
      success: result.success.toString(),
    });

    this.recordMetric('execution.duration', result.duration, {
      nodeId: context.nodeId,
      automationId: context.automationId,
    });
  }

  /**
   * Log execution error
   */
  onExecutionError(context: ExecutionContext, error: Error): void {
    this.log('error', `Execution error: ${error.message}`, context, {
      executionId: context.executionId,
      error: error.message,
      stack: error.stack,
    });

    this.recordMetric('execution.error', 1, {
      nodeId: context.nodeId,
      automationId: context.automationId,
      errorType: error.name,
    });
  }

  /**
   * General logging method
   */
  private log(
    level: LogEntry['level'],
    message: string,
    context?: ExecutionContext,
    metadata?: Record<string, any>
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
    };

    this.logs.push(logEntry);

    // Trim old logs if exceeding limit
    if (this.logs.length > this.maxStoredLogs) {
      this.logs = this.logs.slice(-this.maxStoredLogs);
    }

    // Also log to console with structured format
    const logData = {
      ...logEntry,
      service: 'flui-api',
      component: 'execution',
    };

    switch (level) {
      case 'error':
        console.error(JSON.stringify(logData));
        break;
      case 'warn':
        console.warn(JSON.stringify(logData));
        break;
      case 'info':
        console.log(JSON.stringify(logData));
        break;
      case 'debug':
        if (process.env.DEBUG === 'true') {
          console.log(JSON.stringify(logData));
        }
        break;
    }
  }

  /**
   * Get all spans
   */
  getSpans(filter?: { traceId?: string; parentId?: string }): Span[] {
    let spans = Array.from(this.spans.values());

    if (filter?.traceId) {
      spans = spans.filter(s => 
        s.tags?.traceId === filter.traceId
      );
    }

    if (filter?.parentId) {
      spans = spans.filter(s => s.parentId === filter.parentId);
    }

    return spans;
  }

  /**
   * Get metrics
   */
  getMetrics(filter?: {
    name?: string;
    since?: number;
    tags?: Record<string, string>;
  }): Metric[] {
    let metrics = [...this.metrics];

    if (filter?.name) {
      metrics = metrics.filter(m => m.name === filter.name);
    }

    if (filter?.since) {
      metrics = metrics.filter(m => m.timestamp >= filter.since);
    }

    if (filter?.tags) {
      metrics = metrics.filter(m => {
        if (!m.tags) return false;
        return Object.entries(filter.tags!).every(
          ([key, value]) => m.tags?.[key] === value
        );
      });
    }

    return metrics;
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(name: string, aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count'): number {
    const metrics = this.getMetrics({ name });
    
    if (metrics.length === 0) return 0;

    switch (aggregation) {
      case 'sum':
        return metrics.reduce((sum, m) => sum + m.value, 0);
      case 'avg':
        return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
      case 'min':
        return Math.min(...metrics.map(m => m.value));
      case 'max':
        return Math.max(...metrics.map(m => m.value));
      case 'count':
        return metrics.length;
      default:
        return 0;
    }
  }

  /**
   * Get logs
   */
  getLogs(filter?: {
    level?: LogEntry['level'];
    since?: string;
    executionId?: string;
  }): LogEntry[] {
    let logs = [...this.logs];

    if (filter?.level) {
      logs = logs.filter(l => l.level === filter.level);
    }

    if (filter?.since) {
      logs = logs.filter(l => l.timestamp >= filter.since!);
    }

    if (filter?.executionId) {
      logs = logs.filter(l => 
        l.context?.executionId === filter.executionId
      );
    }

    return logs;
  }

  /**
   * Clear old data
   */
  clearOldData(olderThan: number): void {
    const cutoff = Date.now() - olderThan;

    // Clear old metrics
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);

    // Clear old spans
    for (const [id, span] of this.spans.entries()) {
      if (span.endTime && span.endTime < cutoff) {
        this.spans.delete(id);
      }
    }

    // Clear old logs
    const cutoffDate = new Date(Date.now() - olderThan).toISOString();
    this.logs = this.logs.filter(l => l.timestamp >= cutoffDate);
  }

  /**
   * Get statistics
   */
  getStats(): {
    spans: {
      total: number;
      active: number;
      completed: number;
    };
    metrics: {
      total: number;
      byType: Record<string, number>;
    };
    logs: {
      total: number;
      byLevel: Record<string, number>;
    };
  } {
    const spans = Array.from(this.spans.values());
    
    return {
      spans: {
        total: spans.length,
        active: spans.filter(s => !s.endTime).length,
        completed: spans.filter(s => s.endTime).length,
      },
      metrics: {
        total: this.metrics.length,
        byType: this.metrics.reduce((acc, m) => {
          acc[m.type] = (acc[m.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      logs: {
        total: this.logs.length,
        byLevel: this.logs.reduce((acc, l) => {
          acc[l.level] = (acc[l.level] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    };
  }
}

// Global singleton instance
let globalObserver: ObservabilityProvider | null = null;

/**
 * Get or create global observability provider
 */
export function getObservabilityProvider(): ObservabilityProvider {
  if (!globalObserver) {
    globalObserver = new ObservabilityProvider();
  }
  return globalObserver;
}
