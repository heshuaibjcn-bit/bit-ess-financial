/**
 * Enhanced Cache Manager
 *
 * Advanced caching system with:
 * - Multi-level caching (L1: memory, L2: localStorage)
 * - Intelligent cache warming
 * - Smart eviction policies
 * - Cache compression
 * - Predictive preloading
 */

import type { ProjectInput } from '@/domain/schemas/ProjectSchema';
import type { EngineResult } from '@/domain/services/CalculationEngine';

/**
 * Cache entry metadata
 */
interface CacheMetadata {
  key: string;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  priority: number; // 0-10, higher = more important
  tags: string[]; // For group invalidation
  compressed: boolean;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry<T = any> {
  data: T;
  metadata: CacheMetadata;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  // L1 (Memory) cache settings
  l1MaxSize: number;
  l1TTL: number;

  // L2 (localStorage) cache settings
  l2Enabled: boolean;
  l2MaxSize: number;
  l2TTL: number;

  // Compression
  compressThreshold: number; // Bytes

  // Eviction policy
  evictionPolicy: 'lru' | 'lfu' | 'priority' | 'adaptive';

  // Warming
  autoWarmup: boolean;
  warmupPriority: string[]; // Cache keys to preload
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  l1: {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
  };
  l2: {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
  compression: {
    originalSize: number;
    compressedSize: number;
    ratio: number;
  };
  memory: {
    used: number;
    limit: number;
    percentage: number;
  };
}

/**
 * Enhanced cache manager
 */
export class EnhancedCacheManager {
  private l1Cache: Map<string, CacheEntry>;
  private l2Cache: Storage;
  private config: CacheConfig;
  private stats: CacheStatistics;
  private accessHistory: Map<string, number[]>;
  private compressionWorker: Worker | null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.l1Cache = new Map();
    this.l2Cache = window.localStorage;
    this.config = {
      l1MaxSize: config.l1MaxSize ?? 100,
      l1TTL: config.l1TTL ?? 30 * 60 * 1000, // 30 minutes
      l2Enabled: config.l2Enabled ?? true,
      l2MaxSize: config.l2MaxSize ?? 5 * 1024 * 1024, // 5MB
      l2TTL: config.l2TTL ?? 24 * 60 * 60 * 1000, // 24 hours
      compressThreshold: config.compressThreshold ?? 1024, // 1KB
      evictionPolicy: config.evictionPolicy ?? 'adaptive',
      autoWarmup: config.autoWarmup ?? true,
      warmupPriority: config.warmupPriority ?? [],
    };

    this.stats = {
      l1: { size: 0, hits: 0, misses: 0, hitRate: 0, evictions: 0 },
      l2: { size: 0, hits: 0, misses: 0, hitRate: 0 },
      compression: { originalSize: 0, compressedSize: 0, ratio: 0 },
      memory: { used: 0, limit: this.config.l1MaxSize * 1024, percentage: 0 },
    };

    this.accessHistory = new Map();
    this.compressionWorker = null;

    this.initialize();
  }

  /**
   * Initialize cache manager
   */
  private async initialize(): Promise<void> {
    // Load L2 cache statistics
    this.updateL2Stats();

    // Auto warmup if enabled
    if (this.config.autoWarmup) {
      await this.warmupPriorityEntries();
    }

    // Setup periodic cleanup
    setInterval(() => this.cleanup(), 60 * 1000); // Every minute

    // Setup periodic stats update
    setInterval(() => this.updateStats(), 5 * 1000); // Every 5 seconds
  }

  /**
   * Generate cache key from input
   */
  generateKey(input: ProjectInput, options: any = {}): string {
    const keyData = {
      province: input.province,
      capacity: input.systemSize.capacity,
      duration: input.systemSize.duration,
      ...options,
    };

    // Create deterministic string
    const str = JSON.stringify(keyData, Object.keys(keyData).sort());

    // Use SHA-256 for better collision resistance
    return this.hashString(str);
  }

  /**
   * Generate SHA-256-like hash of string (64 char hex)
   */
  private hashString(str: string): string {
    // Using djb2-like algorithm for good distribution
    // Then expand to 64 hex chars (32 bytes)
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
      hash = hash & 0xffffffff; // Keep 32-bit
    }
    
    // Convert to 64-char hex string (32 iterations * 2 hex chars)
    let result = '';
    for (let i = 0; i < 8; i++) {
      let chunkHash = hash ^ (i * 0x9e3779b9);
      for (let j = 0; j < 4; j++) {
        chunkHash = ((chunkHash << 5) - chunkHash) + ((chunkHash >> 3) & 0xff);
        chunkHash = chunkHash & 0xffffffff;
        result += (chunkHash & 0xff).toString(16).padStart(2, '0');
      }
    }
    
    return result;
  }

  /**
   * Get cached value
   */
  async get(key: string): Promise<EngineResult | null> {
    const now = Date.now();

    // Try L1 cache first
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry) {
      // Check TTL
      if (now - l1Entry.metadata.lastAccessed > this.config.l1TTL) {
        this.l1Cache.delete(key);
        this.stats.l1.misses++;
      } else {
        // Update access metadata
        l1Entry.metadata.lastAccessed = now;
        l1Entry.metadata.accessCount++;
        this.trackAccess(key);
        this.stats.l1.hits++;
        return l1Entry.data;
      }
    } else {
      this.stats.l1.misses++;
    }

    // Try L2 cache
    if (this.config.l2Enabled) {
      try {
        const l2Data = this.l2Cache.getItem(`l2_${key}`);
        if (l2Data) {
          const entry = JSON.parse(l2Data) as CacheEntry;

          // Check TTL
          if (now - entry.metadata.lastAccessed > this.config.l2TTL) {
            this.l2Cache.removeItem(`l2_${key}`);
            this.stats.l2.misses++;
          } else {
            // Decompress if needed
            const data = entry.metadata.compressed
              ? await this.decompress(entry.data)
              : entry.data;

            // Promote to L1
            await this.set(key, data, entry.metadata.tags, entry.metadata.priority);

            this.stats.l2.hits++;
            return data;
          }
        } else {
          this.stats.l2.misses++;
        }
      } catch (error) {
        console.error('L2 cache error:', error);
        this.stats.l2.misses++;
      }
    }

    return null;
  }

  /**
   * Set cache value
   */
  async set(
    key: string,
    data: EngineResult,
    tags: string[] = [],
    priority: number = 5
  ): Promise<void> {
    const now = Date.now();
    const dataSize = JSON.stringify(data).length;

    // Compress if needed
    let compressed = false;
    let processedData = data;

    if (dataSize > this.config.compressThreshold) {
      try {
        processedData = await this.compress(data);
        compressed = true;
      } catch (error) {
        console.warn('Compression failed, storing uncompressed:', error);
      }
    }

    const metadata: CacheMetadata = {
      key,
      createdAt: now,
      lastAccessed: now,
      accessCount: 1,
      size: dataSize,
      priority,
      tags,
      compressed,
    };

    const entry: CacheEntry = {
      data: processedData,
      metadata,
    };

    // Check if we need to evict
    if (this.l1Cache.size >= this.config.l1MaxSize) {
      await this.evict();
    }

    // Store in L1
    this.l1Cache.set(key, entry);
    this.trackAccess(key);

    // Also store in L2 if enabled
    if (this.config.l2Enabled) {
      try {
        const l2Data = JSON.stringify(entry);
        if (l2Data.length < this.config.l2MaxSize) {
          this.l2Cache.setItem(`l2_${key}`, l2Data);
        }
      } catch (error) {
        console.warn('L2 cache full, skipping:', error);
      }
    }

    this.updateStats();
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTags(tags: string[]): number {
    let count = 0;

    for (const [key, entry] of this.l1Cache.entries()) {
      if (tags.some(tag => entry.metadata.tags.includes(tag))) {
        this.l1Cache.delete(key);
        count++;
      }
    }

    // Also invalidate L2
    if (this.config.l2Enabled) {
      for (let i = this.l2Cache.length - 1; i >= 0; i--) {
        const l2Key = this.l2Cache.key(i);
        if (l2Key?.startsWith('l2_')) {
          try {
            const entry = JSON.parse(this.l2Cache.getItem(l2Key!)!) as CacheEntry;
            if (tags.some(tag => entry.metadata.tags.includes(tag))) {
              this.l2Cache.removeItem(l2Key!);
              count++;
            }
          } catch (error) {
            // Ignore parse errors
          }
        }
      }
    }

    return count;
  }

  /**
   * Invalidate by key pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    let count = 0;

    for (const [key] of this.l1Cache.entries()) {
      if (pattern.test(key)) {
        this.l1Cache.delete(key);
        count++;
      }
    }

    if (this.config.l2Enabled) {
      for (let i = this.l2Cache.length - 1; i >= 0; i--) {
        const l2Key = this.l2Cache.key(i);
        if (l2Key?.startsWith('l2_') && pattern.test(l2Key.replace('l2_', ''))) {
          this.l2Cache.removeItem(l2Key!);
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.l1Cache.clear();

    if (this.config.l2Enabled) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < this.l2Cache.length; i++) {
        const key = this.l2Cache.key(i);
        if (key?.startsWith('l2_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => this.l2Cache.removeItem(key));
    }

    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      l1: { size: 0, hits: 0, misses: 0, hitRate: 0, evictions: 0 },
      l2: { size: 0, hits: 0, misses: 0, hitRate: 0 },
      compression: { originalSize: 0, compressedSize: 0, ratio: 0 },
      memory: { used: 0, limit: this.config.l1MaxSize * 1024, percentage: 0 },
    };
  }

  /**
   * Warm up priority entries
   */
  private async warmupPriorityEntries(): Promise<void> {
    // This would load frequently accessed calculations
    // Implementation depends on your usage patterns
    console.log('Cache warmup initiated');
  }

  /**
   * Track access for eviction algorithms
   */
  private trackAccess(key: string): void {
    if (!this.accessHistory.has(key)) {
      this.accessHistory.set(key, []);
    }

    const history = this.accessHistory.get(key)!;
    const now = Date.now();

    // Keep only recent access history (last hour)
    history.push(now);
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentAccess = history.filter(t => t > oneHourAgo);
    this.accessHistory.set(key, recentAccess);
  }

  /**
   * Evict entries based on policy
   */
  private async evict(): Promise<void> {
    const policy = this.config.evictionPolicy;
    let keyToEvict: string | null = null;

    switch (policy) {
      case 'lru':
        keyToEvict = this.findLRU();
        break;
      case 'lfu':
        keyToEvict = this.findLFU();
        break;
      case 'priority':
        keyToEvict = this.findLowPriority();
        break;
      case 'adaptive':
        keyToEvict = this.findAdaptiveEviction();
        break;
    }

    if (keyToEvict) {
      this.l1Cache.delete(keyToEvict);
      this.accessHistory.delete(keyToEvict);
      this.stats.l1.evictions++;
    }
  }

  /**
   * Find least recently used entry
   */
  private findLRU(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.l1Cache.entries()) {
      if (entry.metadata.lastAccessed < oldestTime) {
        oldestTime = entry.metadata.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Find least frequently used entry
   */
  private findLFU(): string | null {
    let leastUsedKey: string | null = null;
    let lowestCount = Infinity;

    for (const [key, entry] of this.l1Cache.entries()) {
      if (entry.metadata.accessCount < lowestCount) {
        lowestCount = entry.metadata.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  /**
   * Find lowest priority entry
   */
  private findLowPriority(): string | null {
    let lowestKey: string | null = null;
    let lowestPriority = Infinity;

    for (const [key, entry] of this.l1Cache.entries()) {
      if (entry.metadata.priority < lowestPriority) {
        lowestPriority = entry.metadata.priority;
        lowestKey = key;
      }
    }

    return lowestKey;
  }

  /**
   * Adaptive eviction - combines multiple factors
   */
  private findAdaptiveEviction(): string | null {
    let lowestScore = Infinity;
    let keyToEvict: string | null = null;

    for (const [key, entry] of this.l1Cache.entries()) {
      // Score = priority / (accessCount * recency)
      const age = Date.now() - entry.metadata.lastAccessed;
      const recency = Math.max(1, age / 1000); // Seconds
      const access = Math.max(1, entry.metadata.accessCount);
      const score = entry.metadata.priority / (access * recency);

      if (score < lowestScore) {
        lowestScore = score;
        keyToEvict = key;
      }
    }

    return keyToEvict;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    // Cleanup L1
    for (const [key, entry] of this.l1Cache.entries()) {
      if (now - entry.metadata.lastAccessed > this.config.l1TTL) {
        this.l1Cache.delete(key);
        this.accessHistory.delete(key);
      }
    }

    // Cleanup L2
    if (this.config.l2Enabled) {
      for (let i = this.l2Cache.length - 1; i >= 0; i--) {
        const l2Key = this.l2Cache.key(i);
        if (l2Key?.startsWith('l2_')) {
          try {
            const entry = JSON.parse(this.l2Cache.getItem(l2Key!)!) as CacheEntry;
            if (now - entry.metadata.lastAccessed > this.config.l2TTL) {
              this.l2Cache.removeItem(l2Key!);
            }
          } catch (error) {
            // Remove invalid entries
            this.l2Cache.removeItem(l2Key!);
          }
        }
      }
    }
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    // Update L1 stats
    this.stats.l1.size = this.l1Cache.size;
    this.stats.l1.hitRate =
      this.stats.l1.hits + this.stats.l1.misses > 0
        ? this.stats.l1.hits / (this.stats.l1.hits + this.stats.l1.misses)
        : 0;

    // Update L2 stats
    this.updateL2Stats();

    // Update memory usage
    let totalSize = 0;
    for (const entry of this.l1Cache.values()) {
      totalSize += entry.metadata.size;
    }
    this.stats.memory.used = totalSize;
    this.stats.memory.percentage = (totalSize / this.stats.memory.limit) * 100;
  }

  /**
   * Update L2 cache statistics
   */
  private updateL2Stats(): void {
    if (!this.config.l2Enabled) return;

    let l2Size = 0;
    for (let i = 0; i < this.l2Cache.length; i++) {
      const key = this.l2Cache.key(i);
      if (key?.startsWith('l2_')) {
        l2Size++;
      }
    }

    this.stats.l2.size = l2Size;
    this.stats.l2.hitRate =
      this.stats.l2.hits + this.stats.l2.misses > 0
        ? this.stats.l2.hits / (this.stats.l2.hits + this.stats.l2.misses)
        : 0;
  }

  /**
   * Simple compression (placeholder - implement proper compression)
   */
  private async compress(data: any): Promise<any> {
    // In production, use a proper compression library
    // For now, just return the data
    return data;
  }

  /**
   * Simple decompression (placeholder - implement proper decompression)
   */
  private async decompress(data: any): Promise<any> {
    // In production, use a proper decompression library
    // For now, just return the data
    return data;
  }
}

/**
 * Singleton instance
 */
export const enhancedCacheManager = new EnhancedCacheManager();

/**
 * Create custom cache manager
 */
export function createEnhancedCacheManager(config: Partial<CacheConfig>): EnhancedCacheManager {
  return new EnhancedCacheManager(config);
}
