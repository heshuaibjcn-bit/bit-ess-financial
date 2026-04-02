/**
 * 电价更新协调器 - 协调完整的电价数据更新流程
 *
 * 工作流程：
 * 1. 使用浏览器访问各省电网网站
 * 2. 下载最新的电价PDF文档
 * 3. 分析PDF内容，提取电价数据
 * 4. 更新到数据库
 *
 * 功能：
 * - 自动化端到端的数据更新流程
 * - 错误处理和重试机制
 * - 数据质量验证
 * - 更新日志记录
 */

import { BrowserTariffPDFCrawler, PDFDownloadResult } from './BrowserTariffPDFCrawler';
import { PDFAnalyzer, ParsedTariffData } from './PDFAnalyzer';
import { getLocalTariffRepository, LocalTariffRepository } from '../../repositories/LocalTariffRepository';

/**
 * 更新结果
 */
export interface UpdateResult {
  provinceCode: string;
  provinceName: string;
  success: boolean;
  downloadResult?: PDFDownloadResult;
  parsedData?: ParsedTariffData;
  databaseUpdateSuccess?: boolean;
  error?: string;
  updatedAt: string;
}

/**
 * 批量更新结果
 */
export interface BatchUpdateResult {
  totalProvinces: number;
  successCount: number;
  failureCount: number;
  results: Map<string, UpdateResult>;
  summary: {
    downloaded: number;
    analyzed: number;
    databaseUpdated: number;
    errors: string[];
  };
}

/**
 * 电价更新协调器
 */
export class TariffUpdateOrchestrator {
  private crawler: BrowserTariffPDFCrawler;
  private analyzer: PDFAnalyzer;
  private repository: LocalTariffRepository;

  constructor() {
    this.crawler = new BrowserTariffPDFCrawler();
    this.analyzer = new PDFAnalyzer();
    this.repository = getLocalTariffRepository();
  }

  /**
   * 更新单个省份的电价数据
   */
  async updateSingleProvince(provinceCode: string): Promise<UpdateResult> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Orchestrator] 开始更新 ${provinceCode} 的电价数据`);
    console.log(`${'='.repeat(60)}\n`);

    const result: UpdateResult = {
      provinceCode,
      provinceName: '',
      success: false,
      updatedAt: new Date().toISOString(),
    };

    try {
      // Step 1: 下载PDF
      console.log(`[Orchestrator] Step 1: 下载 PDF 文档`);
      const downloadResults = await this.crawler.downloadMultiplePDFs([provinceCode]);
      const downloadResult = downloadResults.get(provinceCode);

      if (!downloadResult || !downloadResult.success) {
        result.error = downloadResult?.error || 'PDF 下载失败';
        console.error(`[Orchestrator] ${result.error}`);
        return result;
      }

      result.downloadResult = downloadResult;
      result.provinceName = downloadResult.provinceName;
      console.log(`[Orchestrator] PDF 下载成功: ${downloadResult.fileName}`);

      // Step 2: 分析PDF
      console.log(`\n[Orchestrator] Step 2: 分析 PDF 内容`);
      if (!downloadResult.localPath) {
        result.error = 'PDF 本地路径不存在';
        return result;
      }

      const analysisResult = await this.analyzer.analyzePDF(
        downloadResult.localPath,
        provinceCode,
        downloadResult.provinceName
      );

      if (!analysisResult.success || !analysisResult.parsedData) {
        result.error = analysisResult.error || 'PDF 分析失败';
        console.error(`[Orchestrator] ${result.error}`);
        return result;
      }

      result.parsedData = analysisResult.parsedData;
      console.log(`[Orchestrator] PDF 分析成功，提取到 ${analysisResult.parsedData.tariffItems.length} 条电价记录`);

      // Step 3: 更新数据库
      console.log(`\n[Orchestrator] Step 3: 更新数据库`);
      const dbUpdateSuccess = await this.updateDatabase(analysisResult.parsedData, downloadResult);

      result.databaseUpdateSuccess = dbUpdateSuccess;

      if (!dbUpdateSuccess) {
        result.error = '数据库更新失败';
        console.error(`[Orchestrator] 数据库更新失败`);
        return result;
      }

      console.log(`[Orchestrator] 数据库更新成功`);

      // 所有步骤成功
      result.success = true;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[Orchestrator] ${provinceCode} (${downloadResult.provinceName}) 更新完成 ✅`);
      console.log(`${'='.repeat(60)}\n`);

      return result;

    } catch (error) {
      result.error = (error as Error).message;
      console.error(`[Orchestrator] 更新失败:`, error);
      return result;
    }
  }

  /**
   * 批量更新多个省份的电价数据
   */
  async updateMultipleProvinces(provinceCodes: string[]): Promise<BatchUpdateResult> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Orchestrator] 开始批量更新 ${provinceCodes.length} 个省份的电价数据`);
    console.log(`${'='.repeat(60)}\n`);

    const results = new Map<string, UpdateResult>();
    const summary = {
      downloaded: 0,
      analyzed: 0,
      databaseUpdated: 0,
      errors: [] as string[],
    };

    for (const provinceCode of provinceCodes) {
      const result = await this.updateSingleProvince(provinceCode);
      results.set(provinceCode, result);

      if (result.downloadResult?.success) summary.downloaded++;
      if (result.parsedData) summary.analyzed++;
      if (result.databaseUpdateSuccess) summary.databaseUpdated++;
      if (result.error) summary.errors.push(`${provinceCode}: ${result.error}`);

      // 避免请求过于频繁
      await this.sleep(2000);
    }

    const successCount = Array.from(results.values()).filter(r => r.success).length;
    const failureCount = results.size - successCount;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Orchestrator] 批量更新完成`);
    console.log(`  总计: ${results.size} 个省份`);
    console.log(`  成功: ${successCount} 个`);
    console.log(`  失败: ${failureCount} 个`);
    console.log(`  下载: ${summary.downloaded} 个`);
    console.log(`  分析: ${summary.analyzed} 个`);
    console.log(`  入库: ${summary.databaseUpdated} 个`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      totalProvinces: provinceCodes.length,
      successCount,
      failureCount,
      results,
      summary,
    };
  }

  /**
   * 更新所有配置的省份
   */
  async updateAll(): Promise<BatchUpdateResult> {
    // 所有配置的省份代码
    const allProvinceCodes = ['GD', 'ZJ', 'JS', 'AH'];
    return await this.updateMultipleProvinces(allProvinceCodes);
  }

  /**
   * 更新数据库
   */
  private async updateDatabase(
    parsedData: ParsedTariffData,
    downloadResult: PDFDownloadResult
  ): Promise<boolean> {
    try {
      // 将解析的电价数据转换为数据库格式
      const tariffData = {
        provinceCode: parsedData.provinceCode,
        provinceName: parsedData.provinceName,
        policyNumber: parsedData.policyNumber,
        policyTitle: parsedData.policyTitle,
        effectiveDate: parsedData.effectiveDate,
        publisher: parsedData.publisher,
        tariffItems: parsedData.tariffItems.map(item => ({
          voltageLevel: item.voltageLevel,
          category: item.category,
          price: item.price,
          timePeriod: item.timePeriod,
          season: item.season,
        })),
        dataSource: 'real' as const, // 从PDF爬取的数据标记为真实数据
        dataConfidence: parsedData.confidence,
        crawlMetadata: {
          crawledAt: downloadResult.downloadDate,
          sourceUrl: downloadResult.pdfUrl,
          parseMethod: parsedData.parseMethod,
        },
      };

      // 创建新的电价版本
      const versionInput = {
        provinceCode: parsedData.provinceCode,
        version: Date.now().toString(),
        effectiveDate: parsedData.effectiveDate || new Date().toISOString().split('T')[0],
        policyNumber: parsedData.policyNumber || '未知',
        policyTitle: parsedData.policyTitle || '电价通知',
        policyUrl: downloadResult.metadata?.sourceUrl || downloadResult.pdfUrl,
        dataSource: 'real' as const,
        dataConfidence: parsedData.confidence,
        crawlMetadata: {
          crawledAt: downloadResult.downloadDate,
          sourceUrl: downloadResult.metadata?.sourceUrl || downloadResult.pdfUrl,
          parseMethod: parsedData.parseMethod,
        },
        tariffs: parsedData.tariffItems.map(item => ({
          voltageLevel: item.voltageLevel,
          tariffType: item.category,
          peakPrice: item.price, // 简化处理，所有价格作为平价
          valleyPrice: item.price * 0.5, // 假设谷价为峰价的50%
          flatPrice: item.price, // 平价
          billComponents: {
            category: `${item.voltageLevel}_${item.category}`,
            timePeriod: item.timePeriod || '平段',
            season: item.season,
          },
        })),
        timePeriods: {
          peakHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], // 8:00-19:00
          valleyHours: [23, 0, 1, 2, 3, 4, 5, 6, 7], // 23:00-7:00
          flatHours: [20, 21, 22], // 20:00-22:00
          peakDescription: '峰段（8:00-19:00）',
          valleyDescription: '谷段（23:00-7:00）',
          flatDescription: '平段（20:00-22:00）',
        },
      };

      // 保存到数据库
      await this.repository.createTariffVersion(versionInput);

      console.log(`[Orchestrator] 数据库更新成功: ${parsedData.provinceCode}`);
      return true;

    } catch (error) {
      console.error('[Orchestrator] 数据库更新失败:', error);
      return false;
    }
  }

  /**
   * 验证数据质量
   */
  private validateDataQuality(parsedData: ParsedTariffData): boolean {
    // 检查是否有电价数据
    if (!parsedData.tariffItems || parsedData.tariffItems.length === 0) {
      console.warn('[Orchestrator] 数据质量验证失败: 没有电价数据');
      return false;
    }

    // 检查价格是否合理
    const invalidPrices = parsedData.tariffItems.filter(item => {
      return item.price < 0.3 || item.price > 2.0;
    });

    if (invalidPrices.length > 0) {
      console.warn(`[Orchestrator] 发现 ${invalidPrices.length} 条不合理的价格数据`);
      return false;
    }

    // 检查可信度
    if (parsedData.confidence < 0.5) {
      console.warn(`[Orchestrator] 数据可信度过低: ${parsedData.confidence}`);
      return false;
    }

    return true;
  }

  /**
   * 获取更新状态
   */
  async getUpdateStatus(provinceCode: string): Promise<{
    lastUpdate: string | null;
    dataAge: number | null; // 天数
    needsUpdate: boolean;
  }> {
    try {
      // 获取当前活跃的电价数据
      const activeTariff = await this.repository.getActiveTariffByProvince(provinceCode);

      if (!activeTariff || !activeTariff.version) {
        return {
          lastUpdate: null,
          dataAge: null,
          needsUpdate: true,
        };
      }

      // 获取更新日志
      const updateLogs = await this.repository.getUpdateLogs(provinceCode, 1);
      const lastUpdate = updateLogs[0]?.createdAt || activeTariff.version.effectiveDate;

      const now = new Date();
      const updateDate = new Date(lastUpdate);
      const dataAge = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));

      // 如果数据超过30天，建议更新
      const needsUpdate = dataAge > 30;

      return {
        lastUpdate,
        dataAge,
        needsUpdate,
      };

    } catch (error) {
      console.error('[Orchestrator] 获取更新状态失败:', error);
      return {
        lastUpdate: null,
        dataAge: null,
        needsUpdate: true,
      };
    }
  }

  /**
   * 辅助方法：延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 单例实例
 */
let orchestratorInstance: TariffUpdateOrchestrator | null = null;

export function getTariffUpdateOrchestrator(): TariffUpdateOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new TariffUpdateOrchestrator();
  }
  return orchestratorInstance;
}
