/**
 * Performance Monitoring System
 *
 * Comprehensive performance tracking with:
 * - Web Vitals monitoring (CLS, FID, LCP, FCP, TTFB)
 * - Custom metrics tracking
 * - Performance marks and measures
 * - Resource timing analysis
 * - Memory usage monitoring
 * - Performance reporting
 */

/**
 * Performance metric types
 */
export enum MetricType {
  // Web Vitals
  LCP = 'largest_contentful_paint',
  FID = 'first_input_delay',
  CLS = 'cumulative_layout_shift',
  FCP = 'first_contentful_paint',
  TTFB = 'time_to_first_byte',
  // Custom
  NAVIGATION = 'navigation',
  RESOURCE = 'resource',
  PAINT = 'paint',
  MARK = 'mark',
  MEASURE = 'measure',
  MEMORY = 'memory',
}

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  type: MetricType;
  timestamp: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  metadata?: Record<string, any>;
}

/**
 * Performance data point
 */
interface PerformanceData {
  metrics: PerformanceMetric[];
  resources: PerformanceResourceTiming[];
  navigation: PerformanceNavigationTiming | null;
  memory: PerformanceMemoryData | null;
}

/**
 * Memory usage data
 */
interface PerformanceMemoryData {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Performance rating thresholds
 */
const RATING_THRESHOLDS = {
  [MetricType.LCP]: { good: 2500, poor: 4000 },
  [MetricType.FID]: { good: 100, poor: 300 },
  [MetricType.CLS]: { good: 0.1, poor: 0.25 },
  [MetricType.FCP]: { good: 1800, poor: 3000 },
  [MetricType.TTFB]: { good: 800, poor: 1800 },
};

/**
 * Performance monitor configuration
 */
export interface PerformanceMonitorConfig {
  enableWebVitals: boolean;
  enableResourceTiming: boolean;
  enableMemoryMonitoring: boolean;
  enableNavigationTiming: boolean;
  sampleRate: number; // 0-1
  maxMetrics: number;
  reportingUrl?: string;
  onMetric?: (metric: PerformanceMetric) => void;
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private metrics: PerformanceMetric[] = [];
  private observer?: PerformanceObserver;
  private memoryInterval?: NodeJS.Timeout;

  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = {
      enableWebVitals: true,
      enableResourceTiming: true,
      enableMemoryMonitoring: true,
      enableNavigationTiming: true,
      sampleRate: 1.0,
      maxMetrics: 1000,
      ...config,
    };

    this.initialize();
  }

  /**
   * Initialize performance monitoring
   */
  private initialize(): void {
    if (!this.isPerformanceAPIAvailable()) {
      console.warn('Performance API not available');
      return;
    }

    // Apply sampling
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // Initialize Web Vitals monitoring
    if (this.config.enableWebVitals) {
      this.initWebVitals();
    }

    // Initialize resource timing
    if (this.config.enableResourceTiming) {
      this.initResourceTiming();
    }

    // Initialize memory monitoring
    if (this.config.enableMemoryMonitoring) {
      this.initMemoryMonitoring();
    }

    // Initialize navigation timing
    if (this.config.enableNavigationTiming) {
      this.initNavigationTiming();
    }

    // Track initial page load
    this.trackPageLoad();
  }

  /**
   * Check if Performance API is available
   */
  private isPerformanceAPIAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      'performance' in window &&
      !!window.performance
    );
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initWebVitals(): void {
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processWebVitalEntry(entry as PerformanceEntry);
        }
      });

      this.observer.observe({
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint'],
      });
    } catch (error) {
      console.warn('Failed to initialize PerformanceObserver:', error);
    }
  }

  /**
   * Process Web Vitals entry
   */
  private processWebVitalEntry(entry: PerformanceEntry): void {
    let metric: PerformanceMetric | null = null;

    switch (entry.entryType) {
      case 'largest-contentful-paint':
        metric = this.createMetric(
          MetricType.LCP,
          entry.startTime,
          {
            element: (entry as any).element?.tagName,
            url: (entry as any).url,
          }
        );
        break;

      case 'first-input':
        metric = this.createMetric(
          MetricType.FID,
          (entry as any).processingStart - entry.startTime,
          {
            eventType: (entry as any).name,
          }
        );
        break;

      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          metric = this.createMetric(
            MetricType.CLS,
            (entry as any).value,
            {
              sources: (entry as any).sources?.length || 0,
            }
          );
        }
        break;

      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          metric = this.createMetric(MetricType.FCP, entry.startTime);
        }
        break;
    }

    if (metric) {
      this.addMetric(metric);
    }
  }

  /**
   * Initialize resource timing
   */
  private initResourceTiming(): void {
    // Collect existing resources
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    this.analyzeResources(resources);

    // Observe new resources
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        this.analyzeResources(entries);
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Failed to initialize resource observer:', error);
    }
  }

  /**
   * Analyze resource timing
   */
  private analyzeResources(resources: PerformanceResourceTiming[]): void {
    resources.forEach((resource) => {
      // Track slow resources
      const duration = resource.responseEnd - resource.startTime;
      if (duration > 1000) {
        this.addMetric(
          this.createMetric(MetricType.RESOURCE, duration, {
            name: resource.name,
            type: resource.initiatorType,
            size: resource.transferSize,
            duration: resource.duration,
          })
        );
      }
    });
  }

  /**
   * Initialize memory monitoring
   */
  private initMemoryMonitoring(): void {
    if (!('memory' in performance)) {
      return;
    }

    // Collect memory metrics every 10 seconds
    this.memoryInterval = setInterval(() => {
      const memory = (performance as any).memory as PerformanceMemoryData;

      this.addMetric(
        this.createMetric(MetricType.MEMORY, memory.usedJSHeapSize, {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        })
      );
    }, 10000);
  }

  /**
   * Initialize navigation timing
   */
  private initNavigationTiming(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      // Track TTFB
      this.addMetric(
        this.createMetric(MetricType.TTFB, navigation.responseStart - navigation.requestStart, {
          domainLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpConnection: navigation.connectEnd - navigation.connectStart,
          tlsNegotiation: navigation.secureConnectionStart > 0
            ? navigation.connectEnd - navigation.secureConnectionStart
            : 0,
        })
      );

      // Track page load time
      this.addMetric(
        this.createMetric(MetricType.NAVIGATION, navigation.loadEventEnd - navigation.startTime, {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          domComplete: navigation.domComplete - navigation.startTime,
        })
      );
    }
  }

  /**
   * Track page load
   */
  private trackPageLoad(): void {
    if (document.readyState === 'complete') {
      this.recordPageLoadMetrics();
    } else {
      window.addEventListener('load', () => this.recordPageLoadMetrics());
    }
  }

  /**
   * Record page load metrics
   */
  private recordPageLoadMetrics(): void {
    setTimeout(() => {
      const timing = performance.timing;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;

      this.addMetric(
        this.createMetric('page_load_time', pageLoadTime, {
          domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
          domInteractive: timing.domInteractive - timing.navigationStart,
        })
      );
    }, 0);
  }

  /**
   * Create performance metric
   */
  private createMetric(
    type: MetricType | string,
    value: number,
    metadata?: Record<string, any>
  ): PerformanceMetric {
    const metricType = typeof type === 'string' ? type as MetricType : type;

    return {
      name: metricType,
      value,
      type: metricType,
      timestamp: Date.now(),
      rating: this.calculateRating(metricType, value),
      metadata,
    };
  }

  /**
   * Calculate performance rating
   */
  private calculateRating(type: MetricType, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = RATING_THRESHOLDS[type];

    if (!thresholds) {
      return 'good';
    }

    if (value <= thresholds.good) {
      return 'good';
    } else if (value <= thresholds.poor) {
      return 'needs-improvement';
    } else {
      return 'poor';
    }
  }

  /**
   * Add metric to collection
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Trim metrics if needed
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics);
    }

    // Call metric callback
    this.config.onMetric?.(metric);

    // Log metric
    console.log('Performance metric:', metric);
  }

  /**
   * Mark performance point
   */
  mark(name: string): void {
    if (this.isPerformanceAPIAvailable()) {
      performance.mark(name);
      this.addMetric(
        this.createMetric(MetricType.MARK, performance.now(), { markName: name })
      );
    }
  }

  /**
   * Measure performance between marks
   */
  measure(name: string, startMark: string, endMark?: string): void {
    if (this.isPerformanceAPIAvailable()) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          this.addMetric(
            this.createMetric(MetricType.MEASURE, measure.duration, {
              measureName: name,
              startMark,
              endMark,
            })
          );
        }
      } catch (error) {
        console.warn('Failed to create performance measure:', error);
      }
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(filters?: {
    type?: MetricType;
    rating?: 'good' | 'needs-improvement' | 'poor';
    limit?: number;
  }): PerformanceMetric[] {
    let metrics = [...this.metrics];

    if (filters?.type) {
      metrics = metrics.filter((m) => m.type === filters.type);
    }

    if (filters?.rating) {
      metrics = metrics.filter((m) => m.rating === filters.rating);
    }

    if (filters?.limit) {
      metrics = metrics.slice(-filters.limit);
    }

    return metrics;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    webVitals: Partial<Record<MetricType, PerformanceMetric>>;
    customMetrics: PerformanceMetric[];
    overallRating: 'good' | 'needs-improvement' | 'poor';
  } {
    const webVitals: Partial<Record<MetricType, PerformanceMetric>> = {};
    const customMetrics: PerformanceMetric[] = [];

    this.metrics.forEach((metric) => {
      if ([MetricType.LCP, MetricType.FID, MetricType.CLS, MetricType.FCP, MetricType.TTFB].includes(metric.type)) {
        // Keep the most recent value for web vitals
        webVitals[metric.type] = metric;
      } else {
        customMetrics.push(metric);
      }
    });

    // Calculate overall rating
    const vitalRatings = Object.values(webVitals).map((m) => m.rating);
    const overallRating = this.calculateOverallRating(vitalRatings);

    return {
      webVitals,
      customMetrics,
      overallRating,
    };
  }

  /**
   * Calculate overall performance rating
   */
  private calculateOverallRating(ratings: string[]): 'good' | 'needs-improvement' | 'poor' {
    if (ratings.length === 0) return 'good';

    const poorCount = ratings.filter((r) => r === 'poor').length;
    const needsImprovementCount = ratings.filter((r) => r === 'needs-improvement').length;

    if (poorCount > 0) {
      return 'poor';
    } else if (needsImprovementCount > 0) {
      return 'needs-improvement';
    } else {
      return 'good';
    }
  }

  /**
   * Get performance data
   */
  getPerformanceData(): PerformanceData {
    return {
      metrics: this.metrics,
      resources: performance.getEntriesByType('resource') as PerformanceResourceTiming[],
      navigation: performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | null,
      memory: (performance as any).memory || null,
    };
  }

  /**
   * Export performance data
   */
  exportData(): string {
    return JSON.stringify(this.getPerformanceData(), null, 2);
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Destroy performance monitor
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }

    this.clearMetrics();
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Convenience function to mark performance
 */
export function markPerformance(name: string): void {
  performanceMonitor.mark(name);
}

/**
 * Convenience function to measure performance
 */
export function measurePerformance(name: string, startMark: string, endMark?: string): void {
  performanceMonitor.measure(name, startMark, endMark);
}

/**
 * Convenience function to get performance summary
 */
export function getPerformanceSummary() {
  return performanceMonitor.getSummary();
}
