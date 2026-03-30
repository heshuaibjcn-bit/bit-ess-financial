/**
 * 增强型电价更新智能体 - Enhanced Tariff Update Agent
 *
 * 功能升级：
 * - 集成数据库存储
 * - 自动解析电价通知文件
 * - 智能数据验证
 * - 版本控制
 * - 审批流程
 * - 变更通知
 */

import { NanoAgent, AgentCapability } from './NanoAgent';
import { getTariffRepository, CreateTariffVersionInput } from '@/repositories/TariffRepository';
import { getTariffService } from '../tariffDataService';

/**
 * 解析结果
 */
export interface ParsedTariffNotice {
  province_code: string;
  province_name: string;
  version: string;
  effective_date: string;
  policy_number: string;
  policy_title?: string;
  policy_url?: string;
  notes?: string;

  tariffs: Array<{
    voltage_level: string;
    tariff_type: string;
    peak_price: number;
    valley_price: number;
    flat_price: number;
    bill_components: any;
  }>;

  time_periods: {
    peak_hours: number[];
    valley_hours: number[];
    flat_hours: number[];
    peak_description?: string;
    valley_description?: string;
    flat_description?: string;
  };

  confidence: number; // 解析置信度 0-1
  source_urls: string[];
  parse_duration_ms: number;
}

/**
 * 智能体配置
 */
export interface AgentConfig {
  auto_check_interval_hours?: number; // 自动检查间隔（小时）
  enable_auto_approval?: boolean; // 是否启用自动审批（低置信度更新）
  notification_threshold_percent?: number; // 价格变化通知阈值
  max_retries?: number; // 最大重试次数
  sources?: {
    ndrc?: string; // 国家发改委
    grid_companies?: string[]; // 电网公司官网
  };
}

/**
 * 更新结果
 */
export interface EnhancedUpdateResult {
  success: boolean;
  province_code: string;
  province_name: string;
  version_id?: string;
  requires_approval: boolean;
  validation_result: any;
  changes: {
    previous_version?: string;
    new_version: string;
    price_changes: Array<{
      voltage_level: string;
      field: string;
      old_value: number;
      new_value: number;
      change_percent: number;
    }>;
  };
  alerts: Array<{
    severity: 'info' | 'warning' | 'urgent';
    message: string;
    recommendation: string;
  }>;
  parse_info?: {
    confidence: number;
    source_urls: string[];
    parse_duration_ms: number;
  };
}

export class TariffUpdateAgentEnhanced extends NanoAgent {
  private config: AgentConfig;
  private repository = getTariffRepository();

  constructor(config: AgentConfig = {}) {
    super({
      name: 'TariffUpdateAgentEnhanced',
      description: 'Enhanced tariff monitoring and update agent with database integration',
      version: '2.0.0',
      model: 'glm-5-turbo',
      maxTokens: 8192,
      temperature: 0.2,
      systemPrompt: `You are an Enhanced Tariff Update Specialist for Chinese electricity tariffs. Your capabilities include:

1. **Intelligent Document Parsing**
   - Parse PDF/Excel/HTML tariff notices from government websites
   - Extract structured tariff data with high accuracy
   - Handle various document formats and layouts
   - Validate extracted data against business rules

2. **Data Validation**
   - Check price reasonability (peak > valley, all > 0)
   - Validate time period coverage (24 hours, no overlap)
   - Verify policy number format
   - Cross-reference with historical data

3. **Change Analysis**
   - Calculate price change percentages
   - Identify significant changes (>5%)
   - Assess impact on energy storage economics
   - Generate actionable recommendations

4. **Version Management**
   - Maintain version history
   - Compare versions
   - Track change lineage
   - Support rollback if needed

5. **Database Integration**
   - Store parsed data in database
   - Maintain audit trail
   - Support approval workflow
   - Generate change reports

**Data Quality Standards:**
- Confidence score > 0.8 for auto-approval
- All prices must be positive numbers
- Peak price must be > valley price
- Time periods must cover 24 hours exactly
- Policy numbers must follow format: [省简称]发改价格〔年份〕文号

**Alert Thresholds:**
- Urgent: >20% price change
- Warning: >10% price change
- Info: >5% price change

Provide structured, validated output with clear confidence scores.`,
    });

    this.config = {
      auto_check_interval_hours: 24,
      enable_auto_approval: false,
      notification_threshold_percent: 5,
      max_retries: 3,
      sources: {
        ndrc: 'https://www.ndrc.gov.cn',
        grid_companies: [
          'https://www.csg.cn', // 南方电网
          'www.sgcc.com.cn', // 国家电网
        ],
      },
      ...config,
    };
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'parse_notice',
        description: 'Parse tariff notice from URL or file',
        inputFormat: 'URL or file path to tariff notice',
        outputFormat: 'ParsedTariffNotice',
        estimatedTime: 30,
      },
      {
        name: 'validate_and_store',
        description: 'Validate and store parsed tariff data',
        inputFormat: 'ParsedTariffNotice',
        outputFormat: 'EnhancedUpdateResult',
        estimatedTime: 15,
      },
      {
        name: 'batch_check_provinces',
        description: 'Check multiple provinces for updates',
        inputFormat: 'List of province codes',
        outputFormat: 'Array of EnhancedUpdateResult',
        estimatedTime: 300,
      },
      {
        name: 'compare_versions',
        description: 'Compare two tariff versions',
        inputFormat: 'Two version IDs',
        outputFormat: 'Comparison report',
        estimatedTime: 10,
      },
      {
        name: 'generate_report',
        description: 'Generate tariff change report',
        inputFormat: 'Province and date range',
        outputFormat: 'Formatted report',
        estimatedTime: 20,
      },
    ];
  }

  /**
   * 解析电价通知
   */
  async parseNotice(noticeUrl: string): Promise<ParsedTariffNotice | null> {
    this.log(`Parsing notice: ${noticeUrl}`);
    const startTime = Date.now();

    try {
      // 构建解析提示词
      const prompt = `请仔细解析以下电价调整通知，提取结构化数据：

通知URL: ${noticeUrl}

请提取以下信息（以JSON格式返回）：
{
  "province_code": "省份代码（如 GD、ZJ）",
  "province_name": "省份全称",
  "version": "版本号（格式：x.y.z）",
  "effective_date": "生效日期（YYYY-MM-DD）",
  "policy_number": "政策文号",
  "policy_title": "政策标题",
  "tariffs": [
    {
      "voltage_level": "电压等级（0.4kV/10kV/35kV）",
      "tariff_type": "电价类型（industrial/large_industrial/commercial）",
      "peak_price": 峰时电价（数字）,
      "valley_price": 谷时电价（数字）,
      "flat_price": 平时电价（数字）,
      "bill_components": {
        "energyFee": { "peak": 峰时, "valley": 谷时, "flat": 平时 },
        "governmentSurcharges": { "renewableEnergy": 可再生能源, "reservoirFund": 水库基金, "ruralGridRepayment": 农网还贷, "total": 总计 }
      }
    }
  ],
  "time_periods": {
    "peak_hours": [峰时段小时列表],
    "valley_hours": [谷时段小时列表],
    "flat_hours": [平时段小时列表]
  },
  "confidence": 0.95,
  "notes": "备注说明"
}

注意：
1. 所有价格必须是数字
2. 小时列表必须是 0-23 的整数数组
3. confidence 是解析置信度（0-1）
4. 如果某些信息找不到，使用 null 或默认值`;

      const response = await this.think(prompt);

      // 尝试解析JSON
      let parsed: any;
      try {
        // 提取JSON部分（可能在markdown代码块中）
        const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                          response.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          parsed = JSON.parse(response);
        }
      } catch (e) {
        this.log('Failed to parse JSON response', e);
        return null;
      }

      const parseDuration = Date.now() - startTime;

      return {
        ...parsed,
        source_urls: [noticeUrl],
        parse_duration_ms: parseDuration,
        confidence: parsed.confidence || 0.8,
      };
    } catch (error) {
      this.log(`Failed to parse notice: ${noticeUrl}`, error);
      return null;
    }
  }

  /**
   * 验证并存储解析的电价数据
   */
  async validateAndStore(
    parsed: ParsedTariffNotice,
    userId?: string
  ): Promise<EnhancedUpdateResult> {
    this.log(`Validating and storing tariff data for ${parsed.province_code}`);

    try {
      // 1. 准备输入数据
      const input: CreateTariffVersionInput = {
        province_code: parsed.province_code,
        version: parsed.version,
        effective_date: parsed.effective_date,
        policy_number: parsed.policy_number,
        policy_title: parsed.policy_title,
        policy_url: parsed.policy_url,
        notes: parsed.notes,
        tariffs: parsed.tariffs,
        time_periods: parsed.time_periods,
        trigger_type: 'agent',
        agent_info: {
          agent_name: this.name,
          agent_version: this.version,
          confidence: parsed.confidence,
          source_urls: parsed.source_urls,
          parse_duration_ms: parsed.parse_duration_ms,
        },
      };

      // 2. 获取之前版本以计算变化
      const history = await this.repository.getVersionHistory(parsed.province_code);
      const previousVersion = history.find(v => v.status === 'active');

      // 3. 存储到数据库
      const result = await this.repository.createTariffVersion(input, userId);

      if (!result.success) {
        return {
          success: false,
          province_code: parsed.province_code,
          province_name: parsed.province_name,
          requires_approval: false,
          validation_result: result.validation_result,
          changes: {
            new_version: parsed.version,
            price_changes: [],
          },
          alerts: [{
            severity: 'urgent',
            message: '数据验证失败',
            recommendation: result.validation_result.errors.join('; '),
          }],
        };
      }

      // 4. 计算价格变化
      let priceChanges: any[] = [];
      if (previousVersion && result.version_id) {
        const comparison = await this.repository.compareVersions(
          previousVersion.id,
          result.version_id
        );
        if (comparison) {
          priceChanges = comparison.changes;
        }
      }

      // 5. 生成告警
      const alerts = this.generateAlerts(parsed, priceChanges);

      return {
        success: true,
        province_code: parsed.province_code,
        province_name: parsed.province_name,
        version_id: result.version_id,
        requires_approval: result.requires_approval,
        validation_result: result.validation_result,
        changes: {
          previous_version: previousVersion?.version,
          new_version: parsed.version,
          price_changes: priceChanges,
        },
        alerts,
        parse_info: {
          confidence: parsed.confidence,
          source_urls: parsed.source_urls,
          parse_duration_ms: parsed.parse_duration_ms,
        },
      };
    } catch (error: any) {
      this.log('Failed to validate and store tariff data', error);
      return {
        success: false,
        province_code: parsed.province_code,
        province_name: parsed.province_name,
        requires_approval: false,
        validation_result: {
          is_valid: false,
          errors: [error.message],
          warnings: [],
        },
        changes: {
          new_version: parsed.version,
          price_changes: [],
        },
        alerts: [{
          severity: 'urgent',
          message: '存储失败',
          recommendation: error.message,
        }],
      };
    }
  }

  /**
   * 生成价格变化告警
   */
  private generateAlerts(
    parsed: ParsedTariffNotice,
    priceChanges: any[]
  ): Array<{ severity: 'info' | 'warning' | 'urgent'; message: string; recommendation: string }> {
    const alerts: Array<{ severity: 'info' | 'warning' | 'urgent'; message: string; recommendation: string }> = [];

    // 基于置信度生成告警
    if (parsed.confidence < 0.7) {
      alerts.push({
        severity: 'warning',
        message: '解析置信度较低',
        recommendation: '建议人工审核确认数据准确性',
      });
    }

    // 基于价格变化生成告警
    for (const change of priceChanges) {
      const absChange = Math.abs(change.change_percent);

      if (absChange > 20) {
        alerts.push({
          severity: 'urgent',
          message: `${change.voltage_level} ${change.field}变化${change.change_percent.toFixed(1)}%`,
          recommendation: '电价大幅变化，建议立即重新评估项目可行性',
        });
      } else if (absChange > 10) {
        alerts.push({
          severity: 'warning',
          message: `${change.voltage_level} ${change.field}变化${change.change_percent.toFixed(1)}%`,
          recommendation: '电价变化较大，建议更新项目测算模型',
        });
      } else if (absChange > 5) {
        alerts.push({
          severity: 'info',
          message: `${change.voltage_level} ${change.field}变化${change.change_percent.toFixed(1)}%`,
          recommendation: '电价小幅波动，关注后续变化',
        });
      }
    }

    return alerts;
  }

  /**
   * 批量检查省份更新
   */
  async batchCheckProvinces(provinceCodes: string[]): Promise<EnhancedUpdateResult[]> {
    this.log(`Batch checking ${provinceCodes.length} provinces`);
    const results: EnhancedUpdateResult[] = [];

    for (const code of provinceCodes) {
      try {
        // 这里应该有实际的URL获取逻辑
        // 目前使用模拟URL
        const mockUrl = `https://example.com/tariff/${code}/latest-notice`;

        const parsed = await this.parseNotice(mockUrl);

        if (parsed) {
          const result = await this.validateAndStore(parsed);
          results.push(result);
        }
      } catch (error) {
        this.log(`Failed to check province ${code}`, error);
      }
    }

    return results;
  }

  /**
   * 自动检查并更新（定时任务）
   */
  async autoCheckAndUpdate(): Promise<{
    checked: number;
    updated: number;
    failed: number;
    results: EnhancedUpdateResult[];
  }> {
    this.log('Starting auto check and update');

    // 获取所有省份
    const provinces = await this.repository.getProvinces();
    const provinceCodes = provinces.map(p => p.code);

    // 批量检查
    const results = await this.batchCheckProvinces(provinceCodes);

    const updated = results.filter(r => r.success && r.version_id).length;
    const failed = results.filter(r => !r.success).length;

    this.log(`Auto check completed: ${results.length} checked, ${updated} updated, ${failed} failed`);

    return {
      checked: results.length,
      updated,
      failed,
      results,
    };
  }

  /**
   * 比较两个版本
   */
  async compareVersions(versionId1: string, versionId2: string): Promise<string> {
    const comparison = await this.repository.compareVersions(versionId1, versionId2);

    if (!comparison) {
      return '无法比较指定的版本';
    }

    const prompt = `请生成以下电价版本对比的易读报告：

版本1: ${comparison.version1.version} (${comparison.version1.effective_date})
版本2: ${comparison.version2.version} (${comparison.version2.effective_date})

价格变化：
${comparison.changes.map(c =>
  `- ${c.voltage_level} ${c.field}: ${c.old_value} → ${c.new_value} (${c.change_percent > 0 ? '+' : ''}${c.change_percent.toFixed(2)}%)`
).join('\n')}

请分析这些变化对储能项目的潜在影响。`;

    try {
      return await this.think(prompt);
    } catch (error) {
      return `比较完成，发现 ${comparison.changes.length} 处变化`;
    }
  }

  /**
   * 生成变化报告
   */
  async generateReport(provinceCode: string, startDate: string, endDate: string): Promise<string> {
    const logs = await this.repository.getUpdateLogs(provinceCode, 100);

    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.created_at).toISOString().split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });

    const prompt = `请生成以下电价更新活动的报告：

省份: ${provinceCode}
时间范围: ${startDate} 至 ${endDate}
更新次数: ${filteredLogs.length}

更新记录：
${filteredLogs.map((log, i) =>
  `${i + 1}. ${new Date(log.created_at).toLocaleDateString('zh-CN')} - ${log.update_type} (${log.status})`
).join('\n')}

请总结：
1. 更新频率和趋势
2. 主要变化类型
3. 对储能项目的整体影响
4. 建议关注的事项`;

    try {
      return await this.think(prompt);
    } catch (error) {
      return `报告生成失败：${error}`;
    }
  }

  /**
   * 导入历史数据
   */
  async importHistoricalData(): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    this.log('Starting historical data import');
    const errors: string[] = [];
    let imported = 0;

    try {
      // 从本地tariffData.json导入
      const tariffService = getTariffService();
      const metadata = tariffService.getMetadata();

      // 获取所有省份
      const provinces = await this.repository.getProvinces();

      for (const province of provinces) {
        try {
          const provinceData = (tariffService as any).tariffData.provinces[province.code.toLowerCase()];
          if (!provinceData) continue;

          const input: CreateTariffVersionInput = {
            province_code: province.code,
            version: metadata.version,
            effective_date: metadata.lastUpdated,
            policy_number: '历史数据导入',
            notes: '从本地tariffData.json导入',
            tariffs: [],
            time_periods: {
              peak_hours: provinceData.timePeriods.peak.hours,
              valley_hours: provinceData.timePeriods.valley.hours,
              flat_hours: provinceData.timePeriods.flat.hours,
              peak_description: provinceData.timePeriods.peak.description,
              valley_description: provinceData.timePeriods.valley.description,
              flat_description: provinceData.timePeriods.flat.description,
            },
            trigger_type: 'manual',
          };

          // 转换电价数据
          for (const [voltageLevel, tariff] of Object.entries(provinceData.tariffs)) {
            const t = tariff as any;
            input.tariffs.push({
              voltage_level: voltageLevel,
              tariff_type: t.tariffType,
              peak_price: t.peakPrice,
              valley_price: t.valleyPrice,
              flat_price: t.flatPrice,
              bill_components: t.billComponents,
            });
          }

          const result = await this.repository.createTariffVersion(input);
          if (result.success) {
            imported++;
          } else {
            errors.push(`${province.name}: ${result.validation_result.errors.join(', ')}`);
          }
        } catch (error: any) {
          errors.push(`${province.name}: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`导入失败: ${error.message}`);
    }

    this.log(`Historical data import completed: ${imported} imported, ${errors.length} failed`);

    return {
      imported,
      failed: errors.length,
      errors,
    };
  }
}

/**
 * 单例实例
 */
let agentInstance: TariffUpdateAgentEnhanced | null = null;

export function getTariffUpdateAgent(config?: AgentConfig): TariffUpdateAgentEnhanced {
  if (!agentInstance) {
    agentInstance = new TariffUpdateAgentEnhanced(config);
  }
  return agentInstance;
}
