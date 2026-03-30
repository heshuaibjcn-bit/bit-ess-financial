/**
 * Unified API Client
 *
 * Centralized API client with:
 * - Request deduplication
 * - Request batching
 * - Offline support
 * - Automatic retries
 * - Caching
 * - Error handling
 */

import { enhancedCacheManager } from '@/services/cache/EnhancedCacheManager';

/**
 * API Request configuration
 */
export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  cache?: boolean | number; // false, true, or TTL in ms
  retry?: number | boolean;
  timeout?: number;
  deduplication?: boolean;
}

/**
 * API Response
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  cached: boolean;
}

/**
 * API Error
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Pending request for deduplication
 */
interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
  abortController: AbortController;
}

/**
 * Batched requests
 */
interface BatchedRequest {
  requests: Array<{
    key: string;
    config: ApiRequestConfig;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>;
  timeout: NodeJS.Timeout;
}

/**
 * Unified API Client
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private pendingRequests: Map<string, PendingRequest>;
  private batchedRequests: Map<string, BatchedRequest>;
  private requestQueue: Array<{ key: string; config: ApiRequestConfig }>;
  private isOnline: boolean;
  private offlineQueue: Array<{ key: string; config: ApiRequestConfig }>;
  private batchDelay: number;
  private maxBatchSize: number;

  constructor(config: {
    baseUrl?: string;
    defaultHeaders?: Record<string, string>;
    defaultTimeout?: number;
    batchDelay?: number;
    maxBatchSize?: number;
  } = {}) {
    this.baseUrl = config.baseUrl || '';
    this.defaultHeaders = config.defaultHeaders || {
      'Content-Type': 'application/json',
    };
    this.defaultTimeout = config.defaultTimeout || 30000;
    this.batchDelay = config.batchDelay || 100;
    this.maxBatchSize = config.maxBatchSize || 10;
    this.pendingRequests = new Map();
    this.batchedRequests = new Map();
    this.requestQueue = [];
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for online/offline detection
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Generate request key for deduplication
   */
  private generateRequestKey(url: string, config: ApiRequestConfig): string {
    const { method = 'GET', params, body } = config;
    const paramsStr = params ? JSON.stringify(params) : '';
    const bodyStr = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${paramsStr}:${bodyStr}`;
  }

  /**
   * Make API request
   */
  async request<T = any>(
    url: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = this.buildUrl(url, config.params);
    const requestKey = this.generateRequestKey(fullUrl, config);

    // Check cache first
    if (config.cache !== false) {
      const cached = await this.getFromCache<T>(requestKey, config.cache);
      if (cached) {
        return cached;
      }
    }

    // Check for deduplication
    if (config.deduplication !== false) {
      const pending = this.pendingRequests.get(requestKey);
      if (pending) {
        return pending.promise;
      }
    }

    // Check offline status
    if (!this.isOnline) {
      return this.handleOfflineRequest<T>(url, config);
    }

    // Create abort controller for timeout
    const abortController = new AbortController();
    const timeout = config.timeout || this.defaultTimeout;

    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);

    try {
      const promise = this.fetchWithRetry<T>(fullUrl, {
        ...config,
        signal: abortController.signal,
      });

      // Store pending request for deduplication
      if (config.deduplication !== false) {
        this.pendingRequests.set(requestKey, {
          promise,
          timestamp: Date.now(),
          abortController,
        });
      }

      const response = await promise;
      clearTimeout(timeoutId);

      // Cache response if enabled
      if (config.cache !== false && response.ok) {
        await this.setToCache(requestKey, response, config.cache);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Fetch with automatic retry
   */
  private async fetchWithRetry<T>(
    url: string,
    config: ApiRequestConfig & { signal?: AbortSignal },
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    const maxRetries = config.retry === true ? 3 : config.retry || 0;

    try {
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers: { ...this.defaultHeaders, ...config.headers },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: config.signal,
      });

      if (!response.ok) {
        throw new ApiError(
          response.statusText,
          response.status,
          response.status.toString(),
          await response.json().catch(() => undefined)
        );
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        cached: false,
      };
    } catch (error) {
      // Retry on network errors or 5xx errors
      if (
        attempt < maxRetries &&
        (error instanceof TypeError || error instanceof ApiError) &&
        (error instanceof ApiError ? error.status >= 500 : true)
      ) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, config, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Build full URL with params
   */
  private buildUrl(url: string, params?: Record<string, any>): string {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    if (!params) {
      return fullUrl;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }

  /**
   * Handle offline request
   */
  private async handleOfflineRequest<T>(
    url: string,
    config: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    // For GET requests, try to return cached data
    if (config.method === 'GET' || !config.method) {
      const cached = await this.getFromCache<T>(url, true);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    // Queue request for when online
    this.offlineQueue.push({
      key: this.generateRequestKey(url, config),
      config,
    });

    throw new ApiError(
      'Offline - request queued',
      0,
      'OFFLINE',
      { message: 'You are currently offline. The request will be retried when you are back online.' }
    );
  }

  /**
   * Process offline queue
   */
  private async processOfflineQueue(): Promise<void> {
    while (this.offlineQueue.length > 0) {
      const { key, config } = this.offlineQueue.shift()!;

      try {
        await this.request(key, config);
      } catch (error) {
        console.error('Failed to process offline request:', error);
      }
    }
  }

  /**
   * Get from cache
   */
  private async getFromCache<T>(
    key: string,
    cache: boolean | number = true
  ): Promise<ApiResponse<T> | null> {
    if (cache === false) return null;

    try {
      const cached = await enhancedCacheManager.get(key);
      if (cached) {
        return {
          data: cached as T,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          cached: true,
        };
      }
    } catch (error) {
      console.warn('Cache get failed:', error);
    }

    return null;
  }

  /**
   * Set to cache
   */
  private async setToCache(
    key: string,
    response: ApiResponse,
    cache: boolean | number = true
  ): Promise<void> {
    if (cache === false) return;

    try {
      const ttl = typeof cache === 'number' ? cache : 300000; // 5 minutes default
      await enhancedCacheManager.set(key, response.data, ['api'], 5);
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  /**
   * Handle error
   */
  private handleError(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error.name === 'AbortError') {
      return new ApiError('Request timeout', 408, 'TIMEOUT');
    }

    if (error instanceof TypeError) {
      return new ApiError('Network error', 0, 'NETWORK_ERROR');
    }

    return new ApiError(
      error.message || 'Unknown error',
      0,
      'UNKNOWN_ERROR',
      error
    );
  }

  /**
   * Batch requests
   */
  async batch<T = any>(
    requests: Array<{ url: string; config?: ApiRequestConfig }>
  ): Promise<ApiResponse<T>[]> {
    const batchSize = Math.min(requests.length, this.maxBatchSize);
    const batchedPromises = requests.slice(0, batchSize).map(({ url, config }) =>
      this.request<T>(url, config)
    );

    return Promise.all(batchedPromises);
  }

  /**
   * Cancel pending request
   */
  cancelRequest(url: string, config: ApiRequestConfig = {}): boolean {
    const key = this.generateRequestKey(url, config);
    const pending = this.pendingRequests.get(key);

    if (pending) {
      pending.abortController.abort();
      this.pendingRequests.delete(key);
      return true;
    }

    return false;
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    this.pendingRequests.forEach((pending) => {
      pending.abortController.abort();
    });
    this.pendingRequests.clear();
  }

  /**
   * Clear offline queue
   */
  clearOfflineQueue(): void {
    this.offlineQueue = [];
  }

  /**
   * Get status
   */
  getStatus(): {
    isOnline: boolean;
    pendingRequests: number;
    offlineQueue: number;
  } {
    return {
      isOnline: this.isOnline,
      pendingRequests: this.pendingRequests.size,
      offlineQueue: this.offlineQueue.length,
    };
  }

  /**
   * Convenience methods
   */
  get<T = any>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  post<T = any>(url: string, body?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  put<T = any>(url: string, body?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  patch<T = any>(url: string, body?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body });
  }

  delete<T = any>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient({
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create custom API client
 */
export function createApiClient(config: {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  defaultTimeout?: number;
}): ApiClient {
  return new ApiClient(config);
}
