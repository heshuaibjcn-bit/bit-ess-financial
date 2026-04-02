/**
 * 数据质量监控服务
 * 
 * 监控电价数据的质量，检测异常情况
 * 功能：
 * 1. 数据完整性检查
 * 2. 价格合理性检查
 * 3. 异常值检测
 * 4. 趋势分析
 * 5. 告警触发
 */

import { ParsedTariffData, TariffItem } from '../agents/PDFAnalyzer';

/**
 * 数据质量检查结果
 */
export interface DataQualityResult {
  overallScore: number;  // 0-100
  status: 'excellent' | 'good' | 'warning' | 'critical';
  checks: QualityCheckItem[];
  timestamp: string;
}

/**
 * 质量检查项
 */
export interface QualityCheckItem {
  name: string;
  passed: boolean;
  score: number;  // 0-100
  message: string;
  details?: string[];
  severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * 异常检测结果
 */
export interface AnomalyDetectionResult {
  hasAnomaly: boolean;
  anomalies: AnomalyItem[];
  confidence: number;
}

export interface AnomalyItem {
  type: 'price_spike' | 'price_drop' | 'missing_data' | 'outlier' | 'inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedItems: TariffItem[];
  expectedRange?: { min: number; max: number };
  actualValue?: number;
}

/**
 * 告警规则
 */
export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notificationChannels: string[];
  cooldownMinutes: number;
  lastTriggered?: string;
}

export interface AlertCondition {
  type: 'price_change' | 'missing_data' | 'quality_score' | 'anomaly_count';
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  threshold: number;
  provinceFilter?: string[];
}

/**
 * 告警事件
 */
export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

/**
 * 历史价格数据点
 */
interface PriceHistoryPoint {
  date: string;
  price: number;
  provinceCode: string;
  voltageLevel: string;
  category: string;
}

/**
 * 数据质量监控器
 */
export class DataQualityMonitor {
  private alertRules: Map<string, AlertRule> = new Map();
  private alertHistory: AlertEvent[] = [];
  private priceHistory: Map<string, PriceHistoryPoint[]> = new Map();
  
  constructor() {
    this.initializeDefaultRules();
  }
  
  /**
   * 初始化默认告警规则
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'rule-001',
        name: '价格异常上涨',
        condition: {
          type: 'price_change',
          operator: 'gt',
          threshold: 0.2, // 20%涨幅
        },
        severity: 'high',
        enabled: true,
        notificationChannels: ['email', 'webhook'],
        cooldownMinutes: 60,
      },
      {
        id: 'rule-002',
        name: '价格异常下跌',
        condition: {
          type: 'price_change',
          operator: 'lt',
          threshold: -0.2, // 20%跌幅
        },
        severity: 'high',
        enabled: true,
        notificationChannels: ['email', 'webhook'],
        cooldownMinutes: 60,
      },
      {
        id: 'rule-003',
        name: '数据质量分数过低',
        condition: {
          type: 'quality_score',
          operator: 'lt',
          threshold: 50,
        },
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email', 'sms', 'webhook'],
        cooldownMinutes: 30,
      },
      {
        id: 'rule-004',
        name: '数据缺失严重',
        condition: {
          type: 'missing_data',
          operator: 'gt',
          threshold: 0.3, // 30%缺失
        },
        severity: 'medium',
        enabled: true,
        notificationChannels: ['email'],
        cooldownMinutes: 120,
      },
      {
        id: 'rule-005',
        name: '异常值过多',
        condition: {
          type: 'anomaly_count',
          operator: 'gt',
          threshold: 5,
        },
        severity: 'medium',
        enabled: true,
        notificationChannels: ['email', 'webhook'],
        cooldownMinutes: 60,
      },
    ];
    
    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }
  
  /**
   * 执行数据质量检查
   */
  async checkDataQuality(data: ParsedTariffData): Promise<DataQualityResult> {
    const checks: QualityCheckItem[] = [];
    
    // 1. 数据完整性检查
    checks.push(this.checkDataCompleteness(data));
    
    // 2. 价格合理性检查
    checks.push(this.checkPriceValidity(data));
    
    // 3. 电压等级覆盖检查
    checks.push(this.checkVoltageLevelCoverage(data));
    
    // 4. 用电类别覆盖检查
    checks.push(this.checkCategoryCoverage(data));
    
    // 5. 元数据完整性检查
    checks.push(this.checkMetadataCompleteness(data));
    
    // 6. 时段配置检查
    checks.push(this.checkTimePeriodConfig(data));
    
    // 计算总分
    const totalScore = checks.reduce((sum, check) => sum + check.score, 0) / checks.length;
    
    // 确定状态
    let status: DataQualityResult['status'];
    if (totalScore >= 90) status = 'excellent';
    else if (totalScore >= 70) status = 'good';
    else if (totalScore >= 50) status = 'warning';
    else status = 'critical';
    
    return {
      overallScore: Math.round(totalScore),
      status,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 数据完整性检查
   */
  private checkDataCompleteness(data: ParsedTariffData): QualityCheckItem {
    const issues: string[] = [];
    let score = 100;
    
    // 检查是否有电价数据
    if (!data.tariffItems || data.tariffItems.length === 0) {
      issues.push('没有电价数据');
      score -= 50;
    } else if (data.tariffItems.length < 5) {
      issues.push(`电价数据较少（${data.tariffItems.length}条）`);
      score -= 20;
    }
    
    // 检查数据字段完整性
    const incompleteItems = data.tariffItems.filter(
      item => !item.voltageLevel || !item.category || item.price === undefined
    );
    if (incompleteItems.length > 0) {
      issues.push(`${incompleteItems.length}条数据字段不完整`);
      score -= incompleteItems.length * 5;
    }
    
    return {
      name: '数据完整性',
      passed: score >= 70,
      score: Math.max(0, score),
      message: issues.length === 0 ? '数据完整' : `发现${issues.length}个问题`,
      details: issues,
      severity: score < 50 ? 'error' : score < 70 ? 'warning' : 'info',
    };
  }
  
  /**
   * 价格合理性检查
   */
  private checkPriceValidity(data: ParsedTariffData): QualityCheckItem {
    const issues: string[] = [];
    let score = 100;
    
    const validRange = { min: 0.2, max: 2.0 };
    
    const invalidPrices = data.tariffItems.filter(
      item => item.price < validRange.min || item.price > validRange.max
    );
    
    if (invalidPrices.length > 0) {
      issues.push(`${invalidPrices.length}条价格超出合理范围（${validRange.min}-${validRange.max}元/kWh）`);
      score -= invalidPrices.length * 10;
      
      // 特别检查极端价格
      const extremePrices = invalidPrices.filter(
        item => item.price < 0.1 || item.price > 3.0
      );
      if (extremePrices.length > 0) {
        issues.push(`${extremePrices.length}条价格处于极端值`);
        score -= extremePrices.length * 10;
      }
    }
    
    // 检查价格梯度合理性
    const voltageLevels = [...new Set(data.tariffItems.map(item => item.voltageLevel))];
    for (const level of voltageLevels) {
      const levelPrices = data.tariffItems
        .filter(item => item.voltageLevel === level)
        .map(item => item.price);
      
      if (levelPrices.length > 1) {
        const avgPrice = levelPrices.reduce((a, b) => a + b, 0) / levelPrices.length;
        const variance = levelPrices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / levelPrices.length;
        
        // 如果方差过大，可能存在数据问题
        if (variance > 0.1) {
          issues.push(`${level}电压等级下价格差异过大`);
          score -= 5;
        }
      }
    }
    
    return {
      name: '价格合理性',
      passed: score >= 70,
      score: Math.max(0, score),
      message: issues.length === 0 ? '价格合理' : `发现${issues.length}个问题`,
      details: issues,
      severity: score < 50 ? 'error' : score < 70 ? 'warning' : 'info',
    };
  }
  
  /**
   * 电压等级覆盖检查
   */
  private checkVoltageLevelCoverage(data: ParsedTariffData): QualityCheckItem {
    const expectedLevels = ['不满1千伏', '1-10千伏', '35千伏', '110千伏'];
    const actualLevels = [...new Set(data.tariffItems.map(item => item.voltageLevel))];
    
    const missingLevels = expectedLevels.filter(
      level => !actualLevels.some(actual => actual.includes(level))
    );
    
    const coverage = (actualLevels.length / expectedLevels.length) * 100;
    
    return {
      name: '电压等级覆盖',
      passed: coverage >= 75,
      score: coverage,
      message: `覆盖 ${actualLevels.length}/${expectedLevels.length} 个电压等级`,
      details: missingLevels.length > 0 ? [`缺失: ${missingLevels.join(', ')}`] : undefined,
      severity: coverage < 50 ? 'warning' : 'info',
    };
  }
  
  /**
   * 用电类别覆盖检查
   */
  private checkCategoryCoverage(data: ParsedTariffData): QualityCheckItem {
    const expectedCategories = ['大工业', '一般工商业', '居民', '农业'];
    const actualCategories = [...new Set(data.tariffItems.map(item => item.category))];
    
    const coverage = expectedCategories.filter(
      cat => actualCategories.some(actual => actual.includes(cat))
    ).length;
    
    const coveragePercent = (coverage / expectedCategories.length) * 100;
    
    return {
      name: '用电类别覆盖',
      passed: coveragePercent >= 50,
      score: coveragePercent,
      message: `覆盖 ${coverage}/${expectedCategories.length} 个用电类别`,
      severity: coveragePercent < 50 ? 'warning' : 'info',
    };
  }
  
  /**
   * 元数据完整性检查
   */
  private checkMetadataCompleteness(data: ParsedTariffData): QualityCheckItem {
    const issues: string[] = [];
    let score = 100;
    
    if (!data.policyNumber) {
      issues.push('缺少政策文号');
      score -= 15;
    }
    if (!data.policyTitle) {
      issues.push('缺少政策标题');
      score -= 10;
    }
    if (!data.effectiveDate) {
      issues.push('缺少生效日期');
      score -= 15;
    }
    if (!data.publisher) {
      issues.push('缺少发文单位');
      score -= 10;
    }
    
    return {
      name: '元数据完整性',
      passed: score >= 70,
      score,
      message: issues.length === 0 ? '元数据完整' : `缺少${issues.length}个字段`,
      details: issues,
      severity: score < 70 ? 'warning' : 'info',
    };
  }
  
  /**
   * 时段配置检查
   */
  private checkTimePeriodConfig(data: ParsedTariffData): QualityCheckItem {
    // 检查时段配置是否存在
    const hasTimePeriods = data.tariffItems.some(item => item.timePeriod);
    
    if (!hasTimePeriods) {
      return {
        name: '时段配置',
        passed: true,
        score: 80,
        message: '无分时电价数据',
        severity: 'info',
      };
    }
    
    // 检查时段分布
    const timePeriods = [...new Set(
      data.tariffItems.map(item => item.timePeriod).filter(Boolean)
    )];
    
    const expectedPeriods = ['峰', '平', '谷'];
    const hasExpectedPeriods = expectedPeriods.some(
      period => timePeriods.some(tp => tp?.includes(period))
    );
    
    return {
      name: '时段配置',
      passed: hasExpectedPeriods,
      score: hasExpectedPeriods ? 100 : 70,
      message: `时段类型: ${timePeriods.join(', ')}`,
      severity: hasExpectedPeriods ? 'info' : 'warning',
    };
  }
  
  /**
   * 异常检测
   */
  async detectAnomalies(
    currentData: ParsedTariffData,
    historicalData?: PriceHistoryPoint[]
  ): Promise<AnomalyDetectionResult> {
    const anomalies: AnomalyItem[] = [];
    
    // 1. 价格突变检测
    if (historicalData && historicalData.length > 0) {
      const priceAnomalies = this.detectPriceAnomalies(currentData, historicalData);
      anomalies.push(...priceAnomalies);
    }
    
    // 2. 缺失数据检测
    const missingAnomalies = this.detectMissingDataAnomalies(currentData);
    anomalies.push(...missingAnomalies);
    
    // 3. 离群值检测
    const outlierAnomalies = this.detectOutliers(currentData);
    anomalies.push(...outlierAnomalies);
    
    // 4. 一致性检测
    const consistencyAnomalies = this.detectInconsistencies(currentData);
    anomalies.push(...consistencyAnomalies);
    
    // 计算置信度
    const confidence = anomalies.length === 0 ? 1.0 : Math.max(0, 1 - anomalies.length * 0.1);
    
    return {
      hasAnomaly: anomalies.length > 0,
      anomalies,
      confidence,
    };
  }
  
  /**
   * 检测价格异常
   */
  private detectPriceAnomalies(
    currentData: ParsedTariffData,
    historicalData: PriceHistoryPoint[]
  ): AnomalyItem[] {
    const anomalies: AnomalyItem[] = [];
    
    for (const item of currentData.tariffItems) {
      const history = historicalData.filter(
        h => h.provinceCode === currentData.provinceCode &&
             h.voltageLevel === item.voltageLevel &&
             h.category === item.category
      );
      
      if (history.length >= 3) {
        const prices = history.map(h => h.price);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const stdDev = Math.sqrt(
          prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length
        );
        
        // Z-score 检测
        const zScore = Math.abs((item.price - avgPrice) / (stdDev || 1));
        
        if (zScore > 2) {
          const changePercent = ((item.price - avgPrice) / avgPrice) * 100;
          anomalies.push({
            type: changePercent > 0 ? 'price_spike' : 'price_drop',
            severity: zScore > 3 ? 'critical' : zScore > 2.5 ? 'high' : 'medium',
            message: `${item.voltageLevel} ${item.category} 价格${changePercent > 0 ? '上涨' : '下跌'} ${Math.abs(changePercent).toFixed(2)}%`,
            affectedItems: [item],
            expectedRange: {
              min: avgPrice - 2 * stdDev,
              max: avgPrice + 2 * stdDev,
            },
            actualValue: item.price,
          });
        }
      }
    }
    
    return anomalies;
  }
  
  /**
   * 检测缺失数据异常
   */
  private detectMissingDataAnomalies(data: ParsedTariffData): AnomalyItem[] {
    const anomalies: AnomalyItem[] = [];
    
    // 检查关键电压等级是否缺失
    const criticalLevels = ['不满1千伏', '1-10千伏'];
    const existingLevels = new Set(data.tariffItems.map(item => item.voltageLevel));
    
    for (const level of criticalLevels) {
      if (!Array.from(existingLevels).some(el => el.includes(level))) {
        anomalies.push({
          type: 'missing_data',
          severity: 'high',
          message: `缺少关键电压等级: ${level}`,
          affectedItems: [],
        });
      }
    }
    
    return anomalies;
  }
  
  /**
   * 检测离群值
   */
  private detectOutliers(data: ParsedTariffData): AnomalyItem[] {
    const anomalies: AnomalyItem[] = [];
    
    const prices = data.tariffItems.map(item => item.price);
    const q1 = this.calculatePercentile(prices, 25);
    const q3 = this.calculatePercentile(prices, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outliers = data.tariffItems.filter(
      item => item.price < lowerBound || item.price > upperBound
    );
    
    if (outliers.length > 0) {
      anomalies.push({
        type: 'outlier',
        severity: 'medium',
        message: `发现 ${outliers.length} 个价格离群值`,
        affectedItems: outliers,
        expectedRange: { min: lowerBound, max: upperBound },
      });
    }
    
    return anomalies;
  }
  
  /**
   * 检测不一致性
   */
  private detectInconsistencies(data: ParsedTariffData): AnomalyItem[] {
    const anomalies: AnomalyItem[] = [];
    
    // 检查同一电压等级下价格是否单调（通常高压电价低于低压）
    const voltageOrder = ['不满1千伏', '1-10千伏', '35千伏', '110千伏', '220千伏'];
    
    for (const category of [...new Set(data.tariffItems.map(item => item.category))]) {
      const categoryItems = data.tariffItems.filter(item => item.category === category);
      const sortedByVoltage = categoryItems.sort((a, b) => {
        const indexA = voltageOrder.findIndex(v => a.voltageLevel.includes(v));
        const indexB = voltageOrder.findIndex(v => b.voltageLevel.includes(v));
        return indexA - indexB;
      });
      
      // 检查价格是否随着电压等级升高而降低
      for (let i = 1; i < sortedByVoltage.length; i++) {
        if (sortedByVoltage[i].price > sortedByVoltage[i - 1].price) {
          anomalies.push({
            type: 'inconsistency',
            severity: 'low',
            message: `${category} 电价未随电压等级升高而降低`,
            affectedItems: [sortedByVoltage[i - 1], sortedByVoltage[i]],
          });
        }
      }
    }
    
    return anomalies;
  }
  
  /**
   * 计算百分位数
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    if (upper >= sorted.length) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
  
  /**
   * 评估告警规则
   */
  async evaluateAlertRules(
    data: ParsedTariffData,
    qualityResult: DataQualityResult,
    anomalyResult: AnomalyDetectionResult
  ): Promise<AlertEvent[]> {
    const triggeredAlerts: AlertEvent[] = [];
    
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;
      
      // 检查冷却时间
      if (rule.lastTriggered) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        const lastTriggeredMs = new Date(rule.lastTriggered).getTime();
        if (Date.now() - lastTriggeredMs < cooldownMs) {
          continue;
        }
      }
      
      // 评估条件
      const triggered = this.evaluateCondition(
        rule.condition,
        data,
        qualityResult,
        anomalyResult
      );
      
      if (triggered) {
        const event: AlertEvent = {
          id: `alert-${Date.now()}-${rule.id}`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          message: this.generateAlertMessage(rule, data, qualityResult, anomalyResult),
          details: {
            provinceCode: data.provinceCode,
            provinceName: data.provinceName,
            qualityScore: qualityResult.overallScore,
            anomalyCount: anomalyResult.anomalies.length,
          },
          triggeredAt: new Date().toISOString(),
          acknowledged: false,
        };
        
        triggeredAlerts.push(event);
        this.alertHistory.push(event);
        
        // 更新规则最后触发时间
        rule.lastTriggered = event.triggeredAt;
      }
    }
    
    return triggeredAlerts;
  }
  
  /**
   * 评估单个条件
   */
  private evaluateCondition(
    condition: AlertCondition,
    data: ParsedTariffData,
    qualityResult: DataQualityResult,
    anomalyResult: AnomalyDetectionResult
  ): boolean {
    // 省份过滤
    if (condition.provinceFilter && !condition.provinceFilter.includes(data.provinceCode)) {
      return false;
    }
    
    let value: number;
    
    switch (condition.type) {
      case 'price_change':
        // 简化处理，实际应该计算与历史数据的变化
        value = 0;
        break;
      case 'missing_data':
        const incompleteItems = data.tariffItems.filter(
          item => !item.voltageLevel || !item.category || item.price === undefined
        );
        value = incompleteItems.length / (data.tariffItems.length || 1);
        break;
      case 'quality_score':
        value = qualityResult.overallScore;
        break;
      case 'anomaly_count':
        value = anomalyResult.anomalies.length;
        break;
      default:
        return false;
    }
    
    switch (condition.operator) {
      case 'gt': return value > condition.threshold;
      case 'lt': return value < condition.threshold;
      case 'gte': return value >= condition.threshold;
      case 'lte': return value <= condition.threshold;
      case 'eq': return value === condition.threshold;
      default: return false;
    }
  }
  
  /**
   * 生成告警消息
   */
  private generateAlertMessage(
    rule: AlertRule,
    data: ParsedTariffData,
    qualityResult: DataQualityResult,
    anomalyResult: AnomalyDetectionResult
  ): string {
    return `${data.provinceName}: ${rule.name}`;
  }
  
  /**
   * 添加告警规则
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }
  
  /**
   * 删除告警规则
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
  }
  
  /**
   * 获取所有告警规则
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }
  
  /**
   * 获取告警历史
   */
  getAlertHistory(limit: number = 100): AlertEvent[] {
    return this.alertHistory.slice(-limit).reverse();
  }
  
  /**
   * 确认告警
   */
  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date().toISOString();
      return true;
    }
    return false;
  }
}

// 导出单例
let monitorInstance: DataQualityMonitor | null = null;

export function getDataQualityMonitor(): DataQualityMonitor {
  if (!monitorInstance) {
    monitorInstance = new DataQualityMonitor();
  }
  return monitorInstance;
}
