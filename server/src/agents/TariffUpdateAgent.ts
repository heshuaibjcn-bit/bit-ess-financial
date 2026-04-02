/**
 * 电价更新智能体
 * 
 * 职责：
 * 1. 调度爬虫、解析、验证智能体
 * 2. 执行完整的数据更新工作流
 * 3. 处理异常和重试
 */

import { getCrawlerAgent } from './CrawlerAgent';
import { getParserAgent } from './ParserAgent';
import { getValidatorAgent } from './ValidatorAgent';
import type { CrawlResult, ParseResult, ValidationResult } from '../../../src/types/real-tariff';

export interface UpdateTask {
  provinceCode: string;
  priority: 'high' | 'medium' | 'low';
}

export interface UpdateResult {
  success: boolean;
  provinceCode: string;
  versionId?: string;
  crawlResult?: CrawlResult;
  parseResult?: ParseResult;
  validationResult?: ValidationResult;
  error?: string;
  timestamp: string;
}

/**
 * 电价更新智能体
 */
export class TariffUpdateAgent {
  private crawler = getCrawlerAgent();
  private parser = getParserAgent();
  private validator = getValidatorAgent();

  /**
   * 执行单个省份更新
   */
  async updateProvince(provinceCode: string): Promise<UpdateResult> {
    console.log(`[TariffUpdateAgent] Starting update for ${provinceCode}`);
    const timestamp = new Date().toISOString();

    try {
      // Step 1: 抓取数据
      const crawlResult = await this.crawler.crawlProvince(provinceCode);
      if (!crawlResult.success) {
        return {
          success: false,
          provinceCode,
          crawlResult,
          error: crawlResult.error || 'Crawl failed',
          timestamp,
        };
      }

      // Step 2: 解析内容
      const html = crawlResult.rawData.html;
      if (!html) {
        return {
          success: false,
          provinceCode,
          crawlResult,
          error: 'No HTML content to parse',
          timestamp,
        };
      }

      const parseResult = await this.parser.parseHTML(html, provinceCode);
      if (!parseResult.success) {
        return {
          success: false,
          provinceCode,
          crawlResult,
          parseResult,
          error: parseResult.error || 'Parse failed',
          timestamp,
        };
      }

      // Step 3: 验证数据
      const version = {
        id: '',
        provinceCode,
        version: this.generateVersion(parseResult.effectiveDate),
        effectiveDate: parseResult.effectiveDate,
        policyNumber: parseResult.policyNumber,
        policyTitle: parseResult.policyTitle,
        policyUrl: crawlResult.source,
        publishDate: parseResult.publishDate,
        source: 'ndrc',
        verified: false,
        status: 'draft',
        createdAt: timestamp,
        updatedAt: timestamp,
      } as any;

      const validationResult = await this.validator.validate(
        version,
        parseResult.tariffs,
        parseResult.timePeriods
      );

      if (!validationResult.valid) {
        const criticalErrors = validationResult.errors.filter(e => e.severity === 'critical');
        if (criticalErrors.length > 0) {
          return {
            success: false,
            provinceCode,
            crawlResult,
            parseResult,
            validationResult,
            error: `Validation failed: ${criticalErrors.map(e => e.message).join(', ')}`,
            timestamp,
          };
        }
      }

      // 计算质量评分
      const qualityScore = this.validator.calculateQualityScore(validationResult);
      console.log(`[TariffUpdateAgent] Quality score for ${provinceCode}: ${qualityScore}`);

      return {
        success: true,
        provinceCode,
        crawlResult,
        parseResult,
        validationResult,
        timestamp,
      };
    } catch (error) {
      console.error(`[TariffUpdateAgent] Update failed for ${provinceCode}:`, error);
      return {
        success: false,
        provinceCode,
        error: (error as Error).message,
        timestamp,
      };
    }
  }

  /**
   * 批量更新
   */
  async updateBatch(provinceCodes: string[]): Promise<UpdateResult[]> {
    console.log(`[TariffUpdateAgent] Starting batch update for ${provinceCodes.length} provinces`);
    
    const results: UpdateResult[] = [];
    
    for (const code of provinceCodes) {
      const result = await this.updateProvince(code);
      results.push(result);
      
      // 延迟避免请求过快
      await this.sleep(3000);
    }

    return results;
  }

  /**
   * 更新所有省份
   */
  async updateAll(): Promise<UpdateResult[]> {
    const { NATIONWIDE_DATA_SOURCES } = await import('../../../src/config/nationwide-data-sources');
    const allCodes = NATIONWIDE_DATA_SOURCES.map(s => s.code);
    return this.updateBatch(allCodes);
  }

  /**
   * 检查更新
   */
  async checkUpdates(provinceCodes: string[]): Promise<{
    code: string;
    hasUpdate: boolean;
    newChecksum?: string;
  }[]> {
    const results = [];
    
    for (const code of provinceCodes) {
      // 这里需要获取上一次的checksum进行对比
      // 简化处理，直接返回需要更新
      results.push({
        code,
        hasUpdate: true,
      });
      
      await this.sleep(2000);
    }

    return results;
  }

  /**
   * 生成版本号
   */
  private generateVersion(effectiveDate: string): string {
    const date = new Date(effectiveDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}.0`;
  }

  /**
   * 延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 单例实例
let updateAgentInstance: TariffUpdateAgent | null = null;

export function getTariffUpdateAgent(): TariffUpdateAgent {
  if (!updateAgentInstance) {
    updateAgentInstance = new TariffUpdateAgent();
  }
  return updateAgentInstance;
}
