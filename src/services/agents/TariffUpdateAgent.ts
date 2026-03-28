/**
 * Tariff Update Agent - Automated Tariff Monitoring & Updates
 *
 * Monitors electricity tariff changes across 31 provinces:
 * - Parses tariff notices (PDF/Excel)
 * - Detects price adjustments
 * - Updates tariff database
 * - Generates comparison reports
 */

import { NanoAgent, AgentCapability } from './NanoAgent';
import { getTariffService } from '../tariffDataService';
import type { TariffInfo, HourlyPrice } from '../../domain/schemas/ProjectSchema';

interface TariffUpdateInput {
  provinces: string[];
  checkLatest?: boolean;
  compareWithPrevious?: boolean;
}

interface TariffUpdateResult {
  provincesChecked: number;
  provincesUpdated: number;
  tariffChanges: TariffChange[];
  summary: string;
  alerts: TariffAlert[];
}

interface TariffChange {
  province: string;
  provinceName: string;
  type: 'peak' | 'valley' | 'flat' | 'structure';
  oldValue: number | string;
  newValue: number | string;
  changeAmount: number;
  changePercent: number;
  effectiveDate: string;
  impact: string;
}

interface TariffAlert {
  severity: 'info' | 'warning' | 'urgent';
  province: string;
  message: string;
  recommendation: string;
}

export class TariffUpdateAgent extends NanoAgent {
  constructor() {
    super({
      name: 'TariffUpdateAgent',
      description: 'Automated tariff monitoring and update agent',
      version: '1.0.0',
      model: 'glm-5-turbo',
      maxTokens: 4096,
      temperature: 0.3,
      systemPrompt: `You are a Tariff Update Specialist for Chinese electricity tariffs. Your role is to:

1. Monitor tariff notices from 31 provinces and regions
2. Parse tariff documents (PDF, Excel, web pages)
3. Detect price changes and structural adjustments
4. Calculate impact on energy storage projects
5. Generate alerts for significant changes

Key tariff components to monitor:
- Peak/valley/flat pricing (time-of-use)
- Basic fees (capacity/demand pricing)
- Seasonal variations
- Policy adjustments
- New province or region additions

For each change, assess:
- Magnitude of change (percentage)
- Direction (increase/decrease)
- Impact on storage project economics
- Affected customer types (industrial, commercial)
- Recommended actions

Pay special attention to:
- Peak-valley spread changes (critical for arbitrage)
- Capacity pricing changes (affects sizing decisions)
- New market opening policies
- Seasonal pricing adjustments

Provide structured analysis with clear, actionable recommendations.`,
    });
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'tariff_check',
        description: 'Check for tariff updates',
        inputFormat: 'List of provinces to check',
        outputFormat: 'TariffUpdateResult',
        estimatedTime: 45,
      },
      {
        name: 'tariff_parse',
        description: 'Parse tariff notice document',
        inputFormat: 'Tariff notice URL or file',
        outputFormat: 'Structured tariff data',
        estimatedTime: 20,
      },
      {
        name: 'tariff_compare',
        description: 'Compare old vs new tariffs',
        inputFormat: 'Previous and current tariff data',
        outputFormat: 'Comparison report',
        estimatedTime: 15,
      },
      {
        name: 'impact_analyze',
        description: 'Analyze impact on storage projects',
        inputFormat: 'Tariff changes',
        outputFormat: 'Impact assessment',
        estimatedTime: 25,
      },
    ];
  }

  async execute(input: TariffUpdateInput): Promise<TariffUpdateResult> {
    this.log('Starting tariff update check');

    const tariffChanges: TariffChange[] = [];
    const alerts: TariffAlert[] = [];
    let provincesUpdated = 0;

    for (const province of input.provinces) {
      this.log(`Checking province: ${province}`);

      try {
        const provinceChanges = await this.checkProvince(province);
        tariffChanges.push(...provinceChanges);

        if (provinceChanges.length > 0) {
          provincesUpdated++;
        }

        // Generate alerts for significant changes
        const significantChanges = provinceChanges.filter(
          c => Math.abs(c.changePercent) > 5 // More than 5% change
        );

        alerts.push(...significantChanges.map(c => this.createAlert(c)));
      } catch (error) {
        this.log(`Failed to check province ${province}`, error);
      }
    }

    // Generate summary
    const summary = await this.generateSummary(tariffChanges);

    const result: TariffUpdateResult = {
      provincesChecked: input.provinces.length,
      provincesUpdated,
      tariffChanges,
      summary,
      alerts,
    };

    this.log('Tariff update check completed', result);
    return result;
  }

  /**
   * Check a single province for tariff changes
   */
  private async checkProvince(province: string): Promise<TariffChange[]> {
    const changes: TariffChange[] = [];

    // Get current tariff from database
    const tariffService = getTariffService();
    const currentTariff = tariffService.getTariffByProvince(province as any, '10kV');

    if (!currentTariff) {
      this.log(`No tariff data for ${province}`);
      return changes;
    }

    // Simulate checking for updates (in production, would fetch latest notice)
    // Mock change for demonstration
    const mockChange: TariffChange = {
      province,
      provinceName: this.getProvinceName(province),
      type: 'peak',
      oldValue: currentTariff.peakPrice,
      newValue: currentTariff.peakPrice * 1.02, // 2% increase
      changeAmount: currentTariff.peakPrice * 0.02,
      changePercent: 2,
      effectiveDate: new Date().toISOString().split('T')[0],
      impact: '峰时电价上涨2%，峰谷价差扩大，有利于储能套利收益提升',
    };

    changes.push(mockChange);
    return changes;
  }

  /**
   * Create alert for significant change
   */
  private createAlert(change: TariffChange): TariffAlert {
    let severity: TariffAlert['severity'] = 'info';
    let recommendation = '';

    if (Math.abs(change.changePercent) > 20) {
      severity = 'urgent';
      recommendation = '电价变化显著，建议立即重新评估项目可行性。';
    } else if (Math.abs(change.changePercent) > 10) {
      severity = 'warning';
      recommendation = '电价变化较大，建议更新项目测算模型。';
    } else {
      recommendation = '电价小幅波动，关注后续变化。';
    }

    return {
      severity,
      province: change.province,
      message: `${change.provinceName}${change.type === 'peak' ? '峰时' : change.type === 'valley' ? '谷时' : '平时'}电价${change.changePercent > 0 ? '上涨' : '下降'}${Math.abs(change.changePercent).toFixed(1)}%`,
      recommendation,
    };
  }

  /**
   * Generate summary of tariff changes
   */
  private async generateSummary(changes: TariffChange[]): Promise<string> {
    if (changes.length === 0) {
      return '本次检查未发现电价变化。';
    }

    const provinces = [...new Set(changes.map(c => c.province))];
    const avgChange = changes.reduce((sum, c) => sum + c.changePercent, 0) / changes.length;

    const prompt = `总结以下电价变化：

${changes.map(c => `- ${c.provinceName}: ${c.type === 'peak' ? '峰时' : '谷时'}电价${c.changePercent > 0 ? '上涨' : '下降'}${Math.abs(c.changePercent).toFixed(1)}%`).join('\n')}

影响省份：${provinces.join('、')}
平均变化：${avgChange.toFixed(1)}%

请用100-200字分析这些变化对储能项目的整体影响。`;

    try {
      const summary = await this.think(prompt);
      return summary;
    } catch (error) {
      return `${provinces.length} 个省份电价发生变化，平均变化幅度${avgChange.toFixed(1)}%。`;
    }
  }

  /**
   * Get province name
   */
  private getProvinceName(province: string): string {
    const names: Record<string, string> = {
      guangdong: '广东省',
      zhejiang: '浙江省',
      jiangsu: '江苏省',
      shandong: '山东省',
      beijing: '北京市',
      shanghai: '上海市',
      // ... add all 31 provinces
    };
    return names[province] || province;
  }

  /**
   * Parse tariff notice from URL
   */
  async parseNotice(noticeUrl: string): Promise<{
    title: string;
    province: string;
    effectiveDate: string;
    prices: {
      peak?: number;
      valley?: number;
      flat?: number;
    };
  } | null> {
    this.log(`Parsing notice: ${noticeUrl}`);

    // In production, would:
    // 1. Fetch URL
    // 2. Detect file type (PDF, Excel, HTML)
    // 3. Extract tariff data
    // 4. Validate and return

    // Mock implementation
    return {
      title: '示例电价调整通知',
      province: 'guangdong',
      effectiveDate: '2025-04-01',
      prices: {
        peak: 1.103,
        valley: 0.369,
        flat: 0.668,
      },
    };
  }
}
