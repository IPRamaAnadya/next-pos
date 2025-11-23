// Performance monitoring utility for Order API v2

export interface PerformanceMetrics {
  operation: string;
  tenantId: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export class OrderPerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly MAX_METRICS = 500; // Reduced to prevent memory leaks
  private static readonly CLEANUP_INTERVAL = 60000; // Clean up every minute
  private static cleanupTimer: NodeJS.Timeout | null = null;

  static startOperation(operation: string, tenantId: string, metadata?: Record<string, any>): number {
    return performance.now();
  }

  static endOperation(
    operation: string,
    tenantId: string,
    startTime: number,
    success: boolean,
    error?: string,
    metadata?: Record<string, any>
  ): PerformanceMetrics {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetrics = {
      operation,
      tenantId,
      startTime,
      endTime,
      duration,
      success,
      error,
      metadata
    };

    this.addMetric(metric);
    this.logMetric(metric);

    return metric;
  }

  private static addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the latest metrics to prevent memory leaks
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Start automatic cleanup timer if not already running
    this.startCleanupTimer();
  }

  private static startCleanupTimer(): void {
    if (!this.cleanupTimer) {
      this.cleanupTimer = setInterval(() => {
        this.cleanupOldMetrics();
      }, this.CLEANUP_INTERVAL);
    }
  }

  private static cleanupOldMetrics(): void {
    const oneHourAgo = performance.now() - (60 * 60 * 1000); // 1 hour ago
    
    // Remove metrics older than 1 hour
    this.metrics = this.metrics.filter(metric => metric.startTime > oneHourAgo);
    
    // If no metrics left, stop the cleanup timer
    if (this.metrics.length === 0) {
      this.stopCleanupTimer();
    }
  }

  private static stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private static logMetric(metric: PerformanceMetrics): void {
    const logLevel = metric.success ? 'info' : 'error';
    const message = `Order API Performance: ${metric.operation} took ${metric.duration.toFixed(2)}ms`;
    
    console[logLevel]({
      message,
      operation: metric.operation,
      tenantId: metric.tenantId,
      duration: metric.duration,
      success: metric.success,
      error: metric.error,
      metadata: metric.metadata
    });

    // Alert on slow operations (>5 seconds)
    if (metric.duration > 5000) {
      console.warn(`SLOW OPERATION DETECTED: ${message}`, {
        tenantId: metric.tenantId,
        duration: metric.duration,
        metadata: metric.metadata
      });
    }
  }

  static getMetrics(filters?: {
    operation?: string;
    tenantId?: string;
    success?: boolean;
    minDuration?: number;
    maxDuration?: number;
    since?: number;
  }): PerformanceMetrics[] {
    let filtered = [...this.metrics];

    if (filters) {
      if (filters.operation) {
        filtered = filtered.filter(m => m.operation === filters.operation);
      }
      if (filters.tenantId) {
        filtered = filtered.filter(m => m.tenantId === filters.tenantId);
      }
      if (filters.success !== undefined) {
        filtered = filtered.filter(m => m.success === filters.success);
      }
      if (filters.minDuration !== undefined) {
        filtered = filtered.filter(m => m.duration >= filters.minDuration!);
      }
      if (filters.maxDuration !== undefined) {
        filtered = filtered.filter(m => m.duration <= filters.maxDuration!);
      }
      if (filters.since !== undefined) {
        filtered = filtered.filter(m => m.startTime >= filters.since!);
      }
    }

    return filtered;
  }

  static getAverageResponseTime(operation?: string, tenantId?: string): number {
    const metrics = this.getMetrics({ operation, tenantId, success: true });
    if (metrics.length === 0) return 0;

    const totalDuration = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalDuration / metrics.length;
  }

  static getErrorRate(operation?: string, tenantId?: string): number {
    const metrics = this.getMetrics({ operation, tenantId });
    if (metrics.length === 0) return 0;

    const errorCount = metrics.filter(m => !m.success).length;
    return (errorCount / metrics.length) * 100;
  }

  static clearMetrics(): void {
    this.metrics = [];
    this.stopCleanupTimer();
  }

  // Clean shutdown method to prevent memory leaks
  static shutdown(): void {
    this.clearMetrics();
    this.stopCleanupTimer();
  }

  // Decorator function for automatic performance monitoring
  static monitor(operation: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        // Try to extract tenantId from arguments or use 'unknown'
        const tenantId = (args.find((arg: any) => typeof arg === 'string' && arg.includes('-')) as string) || 'unknown';
        const startTime = OrderPerformanceMonitor.startOperation(operation, tenantId);

        try {
          const result = await method.apply(this, args);
          OrderPerformanceMonitor.endOperation(operation, tenantId, startTime, true);
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          OrderPerformanceMonitor.endOperation(operation, tenantId, startTime, false, errorMessage);
          throw error;
        }
      };
    };
  }
}