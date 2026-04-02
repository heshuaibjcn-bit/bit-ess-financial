/**
 * 验证智能体
 * 
 * 职责：
 * 1. 验证数据完整性
 * 2. 检测异常数据
 * 3. 多源交叉验证
 */

import type { 
  ValidationResult, 
  TariffVersion, 
  TariffDetail, 
  TimePeriodConfig,
  DataAuditLog,
} from '../../../src/types/real-tariff';

/**
 * 验证智能体
 */
export class ValidatorAgent {
  /**
   * 验证完整数据
   */
  async validate(
    version: TariffVersion,
    details: TariffDetail[],
    timePeriods: TimePeriodConfig,
    historicalData?: TariffDetail[]
  ): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // 1. 基础字段验证
    this.validateBasicFields(version, errors);

    // 2. 电价数据验证
    this.validateTariffData(details, errors, warnings);

    // 3. 时段配置验证
    this.validateTimePeriods(timePeriods, errors);

    // 4. 历史对比验证
    if (historicalData) {
      this.validateAgainstHistory(details, historicalData, warnings);
    }

    // 5. 跨省对比验证
    await this.validateAgainstNeighbors(version.provinceCode, details, warnings);

    return {
      valid: errors.length === 0,
      provinceCode: version.provinceCode,
      errors,
      warnings,
    };
  }

  /**
   * 基础字段验证
   */
  private validateBasicFields(version: TariffVersion, errors: ValidationResult['errors']): void {
    // 必填字段
    if (!version.policyNumber || version.policyNumber.length < 5) {
      errors.push({
        field: 'policyNumber',
        message: '政策文号不能为空且长度应大于5',
        severity: 'critical',
      });
    }

    if (!version.policyTitle || version.policyTitle.length < 5) {
      errors.push({
        field: 'policyTitle',
        message: '政策标题不能为空且长度应大于5',
        severity: 'critical',
      });
    }

    if (!version.effectiveDate) {
      errors.push({
        field: 'effectiveDate',
        message: '生效日期不能为空',
        severity: 'critical',
      });
    } else {
      const date = new Date(version.effectiveDate);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'effectiveDate',
          message: '生效日期格式不正确',
          severity: 'critical',
        });
      }
    }

    if (!version.policyUrl) {
      errors.push({
        field: 'policyUrl',
        message: '政策原文链接不能为空',
        severity: 'error',
      });
    }
  }

  /**
   * 电价数据验证
   */
  private validateTariffData(
    details: TariffDetail[],
    errors: ValidationResult['errors'],
    warnings: ValidationResult['warnings']
  ): void {
    if (details.length === 0) {
      errors.push({
        field: 'tariffs',
        message: '至少需要一条电价数据',
        severity: 'critical',
      });
      return;
    }

    for (const detail of details) {
      // 价格必须为正数
      if (detail.peakPrice <= 0 || detail.valleyPrice <= 0 || detail.flatPrice <= 0) {
        errors.push({
          field: `tariff.${detail.voltageLevel}.price`,
          message: `${detail.voltageLevel}电价必须为正数`,
          severity: 'critical',
        });
        continue;
      }

      // 峰谷电价关系：峰 > 平 > 谷
      if (detail.peakPrice <= detail.flatPrice || detail.flatPrice <= detail.valleyPrice) {
        errors.push({
          field: `tariff.${detail.voltageLevel}.relation`,
          message: `${detail.voltageLevel}峰谷电价关系不正确（应满足：峰 > 平 > 谷）`,
          severity: 'critical',
        });
      }

      // 价格合理范围检查
      if (detail.peakPrice > 5 || detail.valleyPrice > 3) {
        warnings.push({
          field: `tariff.${detail.voltageLevel}.range`,
          message: `${detail.voltageLevel}电价超出正常范围，请确认`,
        });
      }

      // 峰谷价差检查（通常2-4倍）
      const ratio = detail.peakPrice / detail.valleyPrice;
      if (ratio < 1.5 || ratio > 5) {
        warnings.push({
          field: `tariff.${detail.voltageLevel}.ratio`,
          message: `${detail.voltageLevel}峰谷价差比(${ratio.toFixed(2)})异常，正常范围为1.5-5倍`,
        });
      }

      // 政府性基金检查
      const totalSurcharge = detail.renewableEnergySurcharge + 
                            detail.reservoirFund + 
                            detail.ruralGridRepayment;
      if (totalSurcharge < 0.03 || totalSurcharge > 0.1) {
        warnings.push({
          field: `tariff.${detail.voltageLevel}.surcharge`,
          message: `${detail.voltageLevel}政府性基金附加费(${totalSurcharge.toFixed(4)})异常`,
        });
      }
    }
  }

  /**
   * 时段配置验证
   */
  private validateTimePeriods(timePeriods: TimePeriodConfig, errors: ValidationResult['errors']): void {
    // 检查时段覆盖
    const allHours = new Set([
      ...timePeriods.peakHours,
      ...timePeriods.valleyHours,
      ...timePeriods.flatHours,
    ]);

    if (allHours.size !== 24) {
      errors.push({
        field: 'timePeriods.coverage',
        message: `时段配置未覆盖全部24小时（当前覆盖${allHours.size}小时）`,
        severity: 'critical',
      });
    }

    // 检查时段是否有重叠
    const peakSet = new Set(timePeriods.peakHours);
    const valleySet = new Set(timePeriods.valleyHours);
    const flatSet = new Set(timePeriods.flatHours);

    for (const hour of peakSet) {
      if (valleySet.has(hour) || flatSet.has(hour)) {
        errors.push({
          field: 'timePeriods.overlap',
          message: `时段配置存在重叠：小时${hour}同时属于多个时段`,
          severity: 'critical',
        });
      }
    }

    // 检查小时值范围
    const allHoursList = [...timePeriods.peakHours, ...timePeriods.valleyHours, ...timePeriods.flatHours];
    for (const hour of allHoursList) {
      if (hour < 0 || hour > 23) {
        errors.push({
          field: 'timePeriods.range',
          message: `时段配置小时值${hour}超出范围（应为0-23）`,
          severity: 'critical',
        });
      }
    }
  }

  /**
   * 与历史数据对比验证
   */
  private validateAgainstHistory(
    current: TariffDetail[],
    historical: TariffDetail[],
    warnings: ValidationResult['warnings']
  ): void {
    for (const curr of current) {
      const hist = historical.find(h => h.voltageLevel === curr.voltageLevel);
      if (!hist) continue;

      // 计算变化幅度
      const changeRatio = Math.abs(curr.flatPrice - hist.flatPrice) / hist.flatPrice;
      
      if (changeRatio > 0.3) {
        warnings.push({
          field: `tariff.${curr.voltageLevel}.history`,
          message: `${curr.voltageLevel}电价比上一版本变化${(changeRatio * 100).toFixed(1)}%，超过30%阈值`,
        });
      }
    }
  }

  /**
   * 与相邻省份对比验证
   */
  private async validateAgainstNeighbors(
    provinceCode: string,
    details: TariffDetail[],
    warnings: ValidationResult['warnings']
  ): Promise<void> {
    // 相邻省份映射（简化版）
    const neighborMap: Record<string, string[]> = {
      'GD': ['GX', 'HN', 'JX', 'FJ'],
      'JS': ['ZJ', 'AH', 'SD'],
      'ZJ': ['JS', 'AH', 'FJ'],
      'AH': ['JS', 'ZJ', 'HB', 'HA'],
      // ... 其他省份
    };

    const neighbors = neighborMap[provinceCode];
    if (!neighbors || neighbors.length === 0) return;

    // 这里应该查询相邻省份的电价数据进行对比
    // 简化处理，仅记录需要检查
    warnings.push({
      field: 'crossProvince',
      message: `建议人工验证与相邻省份(${neighbors.join(', ')})的电价差异`,
    });
  }

  /**
   * 检测异常数据
   */
  async detectAnomaly(detail: TariffDetail): Promise<{
    isAnomaly: boolean;
    reason?: string;
    confidence: number;
  }> {
    const checks = [
      // 价格异常高
      { condition: detail.peakPrice > 3, reason: '峰时电价过高' },
      // 价格异常低
      { condition: detail.valleyPrice < 0.1, reason: '谷时电价过低' },
      // 峰谷差过大
      { condition: detail.peakPrice / detail.valleyPrice > 6, reason: '峰谷价差过大' },
      // 峰谷差过小
      { condition: detail.peakPrice / detail.valleyPrice < 1.3, reason: '峰谷价差过小' },
    ];

    for (const check of checks) {
      if (check.condition) {
        return {
          isAnomaly: true,
          reason: check.reason,
          confidence: 0.8,
        };
      }
    }

    return {
      isAnomaly: false,
      confidence: 0.9,
    };
  }

  /**
   * 计算数据质量评分
   */
  calculateQualityScore(validation: ValidationResult): number {
    const criticalErrors = validation.errors.filter(e => e.severity === 'critical').length;
    const normalErrors = validation.errors.filter(e => e.severity === 'error').length;
    const warnings = validation.warnings.length;

    if (criticalErrors > 0) return 0;
    
    let score = 100;
    score -= normalErrors * 10;
    score -= warnings * 2;
    
    return Math.max(0, score);
  }
}

// 单例实例
let validatorAgentInstance: ValidatorAgent | null = null;

export function getValidatorAgent(): ValidatorAgent {
  if (!validatorAgentInstance) {
    validatorAgentInstance = new ValidatorAgent();
  }
  return validatorAgentInstance;
}
