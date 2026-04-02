/**
 * 代理IP池服务
 * 
 * 功能：
 * 1. 管理多个代理IP
 * 2. 自动轮询和故障切换
 * 3. 代理健康检查
 */

import axios from 'axios';

export interface Proxy {
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks5';
  username?: string;
  password?: string;
  weight: number;      // 权重
  failCount: number;   // 连续失败次数
  lastUsed: number;    // 最后使用时间
  isHealthy: boolean;  // 健康状态
}

/**
 * 代理池管理器
 */
export class ProxyPool {
  private proxies: Proxy[] = [];
  private currentIndex = 0;
  private maxFailCount = 3;
  private healthCheckInterval = 60000; // 60秒健康检查

  constructor() {
    this.initializeDefaultProxies();
    this.startHealthCheck();
  }

  /**
   * 初始化默认代理（免费代理示例）
   */
  private initializeDefaultProxies(): void {
    // 注意：这里使用示例代理，实际使用时需要替换为有效代理
    // 可以从代理服务商获取或自建代理池
    this.proxies = [
      // 示例：直接连接（无代理）
      {
        host: 'direct',
        port: 0,
        protocol: 'http',
        weight: 10,
        failCount: 0,
        lastUsed: 0,
        isHealthy: true,
      },
    ];
  }

  /**
   * 添加代理
   */
  addProxy(proxy: Omit<Proxy, 'failCount' | 'lastUsed' | 'isHealthy'>): void {
    this.proxies.push({
      ...proxy,
      failCount: 0,
      lastUsed: 0,
      isHealthy: true,
    });
  }

  /**
   * 获取下一个可用代理
   */
  getNextProxy(): Proxy | null {
    const healthyProxies = this.proxies.filter(p => p.isHealthy);
    
    if (healthyProxies.length === 0) {
      // 所有代理都不可用，重置失败计数
      this.proxies.forEach(p => {
        p.failCount = 0;
        p.isHealthy = true;
      });
      return this.proxies[0] || null;
    }

    // 按权重选择
    const totalWeight = healthyProxies.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const proxy of healthyProxies) {
      random -= proxy.weight;
      if (random <= 0) {
        proxy.lastUsed = Date.now();
        return proxy;
      }
    }

    return healthyProxies[0];
  }

  /**
   * 标记代理失败
   */
  markProxyFailed(proxy: Proxy): void {
    const found = this.proxies.find(p => p.host === proxy.host && p.port === proxy.port);
    if (found) {
      found.failCount++;
      if (found.failCount >= this.maxFailCount) {
        found.isHealthy = false;
        console.warn(`[ProxyPool] Proxy ${found.host}:${found.port} marked as unhealthy`);
      }
    }
  }

  /**
   * 标记代理成功
   */
  markProxySuccess(proxy: Proxy): void {
    const found = this.proxies.find(p => p.host === proxy.host && p.port === proxy.port);
    if (found) {
      found.failCount = 0;
      found.isHealthy = true;
    }
  }

  /**
   * 获取代理配置用于axios
   */
  getAxiosProxyConfig(proxy: Proxy): any {
    if (proxy.host === 'direct') {
      return undefined;
    }

    const proxyUrl = proxy.username && proxy.password
      ? `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
      : `${proxy.protocol}://${proxy.host}:${proxy.port}`;

    return {
      proxy: false, // 使用自定义agent
      httpAgent: proxyUrl,
      httpsAgent: proxyUrl,
    };
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    setInterval(async () => {
      await this.checkProxiesHealth();
    }, this.healthCheckInterval);
  }

  /**
   * 检查代理健康状态
   */
  private async checkProxiesHealth(): Promise<void> {
    for (const proxy of this.proxies) {
      if (proxy.host === 'direct') continue;

      try {
        const start = Date.now();
        await axios.get('http://httpbin.org/ip', {
          timeout: 10000,
          proxy: proxy.host !== 'direct' ? {
            host: proxy.host,
            port: proxy.port,
            protocol: proxy.protocol,
          } : false,
        });
        
        const latency = Date.now() - start;
        proxy.isHealthy = true;
        proxy.failCount = 0;
        
        // 根据延迟调整权重
        proxy.weight = Math.max(1, 10 - Math.floor(latency / 100));
      } catch (error) {
        proxy.failCount++;
        if (proxy.failCount >= this.maxFailCount) {
          proxy.isHealthy = false;
        }
      }
    }
  }

  /**
   * 获取代理池状态
   */
  getStatus(): {
    total: number;
    healthy: number;
    unhealthy: number;
  } {
    return {
      total: this.proxies.length,
      healthy: this.proxies.filter(p => p.isHealthy).length,
      unhealthy: this.proxies.filter(p => !p.isHealthy).length,
    };
  }
}

// 单例实例
let proxyPoolInstance: ProxyPool | null = null;

export function getProxyPool(): ProxyPool {
  if (!proxyPoolInstance) {
    proxyPoolInstance = new ProxyPool();
  }
  return proxyPoolInstance;
}
