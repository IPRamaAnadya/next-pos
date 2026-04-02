// Service to handle application cleanup and prevent memory leaks

import { OrderServiceContainer } from '../container/OrderServiceContainer';
import { OrderPerformanceMonitor } from '../monitoring/OrderPerformanceMonitor';

export class ApplicationCleanupService {
  private static cleanupTimer: NodeJS.Timeout | null = null;
  private static isShuttingDown = false;

  /**
   * Initialize cleanup service with periodic cleanup
   */
  static initialize(): void {
    // Handle process termination signals
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGHUP', this.gracefulShutdown.bind(this));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.gracefulShutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown();
    });

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Start periodic cleanup to prevent memory leaks
   */
  private static startPeriodicCleanup(): void {
    if (this.cleanupTimer) return;

    // Run cleanup every 30 minutes
    this.cleanupTimer = setInterval(() => {
      this.performPeriodicCleanup();
    }, 30 * 60 * 1000);
  }

  /**
   * Perform periodic cleanup operations
   */
  private static performPeriodicCleanup(): void {
    try {
      console.log('Performing periodic cleanup...');
      
      // Clean up performance metrics older than 1 hour
      // (This is already handled by OrderPerformanceMonitor but we can force it)
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('Garbage collection performed');
      }
      
      console.log('Periodic cleanup completed');
    } catch (error) {
      console.error('Error during periodic cleanup:', error);
    }
  }

  /**
   * Graceful shutdown of the application
   */
  static async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log('Starting graceful shutdown...');

    try {
      // Stop periodic cleanup
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }

      // Clean up services
      OrderServiceContainer.cleanup();
      OrderPerformanceMonitor.shutdown();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      console.log('Graceful shutdown completed');
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
    }

    // Exit the process
    process.exit(0);
  }

  /**
   * Manual cleanup for testing purposes
   */
  static manualCleanup(): void {
    try {
      OrderServiceContainer.cleanup();
      OrderPerformanceMonitor.clearMetrics();
      
      if (global.gc) {
        global.gc();
      }
      
      console.log('Manual cleanup completed');
    } catch (error) {
      console.error('Error during manual cleanup:', error);
    }
  }

  /**
   * Get memory usage statistics
   */
  static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Log memory usage
   */
  static logMemoryUsage(): void {
    const memUsage = this.getMemoryUsage();
    console.log('Memory Usage:', {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
    });
  }
}