/**
 * 服务端爬虫智能体
 * 
 * 职责：
 * 1. 从各省发改委官网抓取电价政策
 * 2. 解析HTML/PDF内容
 * 3. 返回结构化数据
 */

import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import crypto from 'crypto';
import { NATIONWIDE_DATA_SOURCES } from '../../../src/config/nationwide-data-sources';
import type { CrawlResult, ParseResult, DataSourceConfig } from '../../../src/types/real-tariff';

// 请求重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 5000,
  timeout: 30000,
};

/**
 * 爬虫智能体
 */
export class CrawlerAgent {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0';

  /**
   * 抓取单个省份
   */
  async crawlProvince(provinceCode: string): Promise<CrawlResult> {
    console.log(`[CrawlerAgent] Starting crawl for ${provinceCode}`);

    const config = NATIONWIDE_DATA_SOURCES.find(s => s.code === provinceCode);
    if (!config) {
      return {
        success: false,
        provinceCode,
        rawData: {},
        source: '',
        timestamp: new Date().toISOString(),
        checksum: '',
        error: `No data source config for ${provinceCode}`,
      };
    }

    try {
      // 尝试主数据源
      let result = await this.tryCrawl(config.primaryUrl, config);
      
      if (!result.success && config.backupUrl) {
        console.log(`[CrawlerAgent] Primary source failed, trying backup for ${provinceCode}`);
        result = await this.tryCrawl(config.backupUrl, config);
      }

      return {
        ...result,
        provinceCode,
      };
    } catch (error) {
      console.error(`[CrawlerAgent] Crawl failed for ${provinceCode}:`, error);
      return {
        success: false,
        provinceCode,
        rawData: {},
        source: config.primaryUrl,
        timestamp: new Date().toISOString(),
        checksum: '',
        error: (error as Error).message,
      };
    }
  }

  /**
   * 批量抓取多个省份
   */
  async crawlBatch(provinceCodes: string[]): Promise<Map<string, CrawlResult>> {
    console.log(`[CrawlerAgent] Starting batch crawl for ${provinceCodes.length} provinces`);
    
    const results = new Map<string, CrawlResult>();
    
    // 串行抓取，避免被封
    for (const code of provinceCodes) {
      const result = await this.crawlProvince(code);
      results.set(code, result);
      
      // 延迟5秒
      await this.sleep(5000);
    }

    return results;
  }

  /**
   * 抓取所有省份
   */
  async crawlAll(): Promise<Map<string, CrawlResult>> {
    const allCodes = NATIONWIDE_DATA_SOURCES.map(s => s.code);
    return this.crawlBatch(allCodes);
  }

  /**
   * 检查是否有更新
   */
  async checkUpdate(provinceCode: string, lastChecksum: string): Promise<{
    hasUpdate: boolean;
    newChecksum?: string;
    result?: CrawlResult;
  }> {
    const result = await this.crawlProvince(provinceCode);
    
    if (!result.success) {
      return { hasUpdate: false };
    }

    const hasUpdate = result.checksum !== lastChecksum;
    
    return {
      hasUpdate,
      newChecksum: result.checksum,
      result: hasUpdate ? result : undefined,
    };
  }

  /**
   * 尝试抓取指定URL
   */
  private async tryCrawl(url: string, config: DataSourceConfig): Promise<Omit<CrawlResult, 'provinceCode'>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`[CrawlerAgent] Attempt ${attempt}/${RETRY_CONFIG.maxRetries} for ${url}`);

        const response = await this.fetchWithRetry(url, config);
        const html = this.decodeResponse(response, config.encoding);
        
        // 计算内容hash
        const checksum = this.calculateChecksum(html);

        return {
          success: true,
          rawData: { html },
          source: url,
          timestamp: new Date().toISOString(),
          checksum,
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`[CrawlerAgent] Attempt ${attempt} failed:`, (error as Error).message);
        
        if (attempt < RETRY_CONFIG.maxRetries) {
          await this.sleep(RETRY_CONFIG.retryDelay * attempt);
        }
      }
    }

    return {
      success: false,
      rawData: {},
      source: url,
      timestamp: new Date().toISOString(),
      checksum: '',
      error: lastError?.message || 'Max retries exceeded',
    };
  }

  /**
   * 带重试的HTTP请求
   */
  private async fetchWithRetry(url: string, config: DataSourceConfig): Promise<AxiosResponse> {
    return axios.get(url, {
      timeout: RETRY_CONFIG.timeout,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      responseType: 'arraybuffer',
      maxRedirects: 5,
    });
  }

  /**
   * 解码响应内容
   */
  private decodeResponse(response: AxiosResponse, encoding: string): string {
    const buffer = Buffer.from(response.data);
    
    if (encoding === 'gb2312' || encoding === 'gbk') {
      return iconv.decode(buffer, encoding);
    }
    
    return buffer.toString('utf-8');
  }

  /**
   * 计算内容hash
   */
  private calculateChecksum(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * 延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 单例实例
let crawlerAgentInstance: CrawlerAgent | null = null;

export function getCrawlerAgent(): CrawlerAgent {
  if (!crawlerAgentInstance) {
    crawlerAgentInstance = new CrawlerAgent();
  }
  return crawlerAgentInstance;
}
