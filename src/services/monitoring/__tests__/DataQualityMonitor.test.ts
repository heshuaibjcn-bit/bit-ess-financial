/**
 * 数据质量监控服务测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DataQualityMonitor, getDataQualityMonitor } from '../DataQualityMonitor';
import { ParsedTariffData } from '../../agents/PDFAnalyzer';

describe('DataQualityMonitor', () => {
  let monitor: DataQualityMonitor;

  const mockParsedData: ParsedTariffData = {
    provinceCode: 'GD',
    provinceName: '广东省',
    policyNumber: '粤发改价格〔2024〕123号',
    policyTitle: '电价通知',
    effectiveDate: '2024-01-01',
    publisher: '广东省发改委',
    tariffItems: [
      { voltageLevel: '不满1千伏', category: '一般工商业', price: 0.6543 },
      { voltageLevel: '1-10千伏', category: '大工业', price: 0.6234 },
      { voltageLevel: '35千伏', category: '大工业', price: 0.5987 },
      { voltageLevel: '110千伏', category: '大工业', price: 0.5734, timePeriod: '平段' },
    ],
    parseMethod: 'pdf-text',
    confidence: 0.85,
    parseWarnings: [],
  };

  beforeEach(() => {
    monitor = new DataQualityMonitor();
  });

  describe('数据质量检查', () => {
    it('应该正确计算数据质量评分', async () => {
      const result = await monitor.checkDataQuality(mockParsedData);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.status).toBeDefined();
      expect(['excellent', 'good', 'warning', 'critical']).toContain(result.status);
      expect(Array.isArray(result.checks)).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('应该执行所有质量检查项', async () => {
      const result = await monitor.checkDataQuality(mockParsedData);

      const checkNames = result.checks.map(check => check.name);
      expect(checkNames).toContain('数据完整性');
      expect(checkNames).toContain('价格合理性');
      expect(checkNames).toContain('电压等级覆盖');
      expect(checkNames).toContain('用电类别覆盖');
      expect(checkNames).toContain('元数据完整性');
      expect(checkNames).toContain('时段配置');
    });

    it('应该检测到价格不合理的项', async () => {
      const invalidData: ParsedTariffData = {
        ...mockParsedData,
        tariffItems: [
          ...mockParsedData.tariffItems,
          { voltageLevel: '220千伏', category: '大工业', price: 5.0 }, // 价格过高
          { voltageLevel: '220千伏', category: '大工业', price: 0.05 }, // 价格过低
        ],
      };

      const result = await monitor.checkDataQuality(invalidData);
      const priceCheck = result.checks.find(check => check.name === '价格合理性');

      expect(priceCheck).toBeDefined();
      expect(priceCheck!.passed).toBe(false);
      expect(priceCheck!.details?.length).toBeGreaterThan(0);
    });

    it('应该检测到缺失的关键数据', async () => {
      const incompleteData: ParsedTariffData = {
        ...mockParsedData,
        policyNumber: undefined,
        policyTitle: undefined,
        effectiveDate: undefined,
        publisher: undefined,
      };

      const result = await monitor.checkDataQuality(incompleteData);
      const metadataCheck = result.checks.find(check => check.name === '元数据完整性');

      expect(metadataCheck).toBeDefined();
      expect(metadataCheck!.passed).toBe(false);
      expect(metadataCheck!.score).toBeLessThan(70);
    });

    it('应该检测到低质量数据的critical状态', async () => {
      const poorQualityData: ParsedTariffData = {
        ...mockParsedData,
        tariffItems: [], // 空数据
        policyNumber: undefined,
        policyTitle: undefined,
        effectiveDate: undefined,
        publisher: undefined,
      };

      const result = await monitor.checkDataQuality(poorQualityData);
      // 空数据应该导致低分
      expect(result.overallScore).toBeLessThan(50);
      expect(['critical', 'warning']).toContain(result.status);
    });
  });

  describe('异常检测', () => {
    it('应该检测到价格突变', async () => {
      // 历史数据需要有变化才能计算标准差
      const history = [
        { date: '2023-12-01', price: 0.65, provinceCode: 'GD', voltageLevel: '不满1千伏', category: '一般工商业' },
        { date: '2023-11-01', price: 0.64, provinceCode: 'GD', voltageLevel: '不满1千伏', category: '一般工商业' },
        { date: '2023-10-01', price: 0.66, provinceCode: 'GD', voltageLevel: '不满1千伏', category: '一般工商业' },
      ];

      const currentData: ParsedTariffData = {
        ...mockParsedData,
        tariffItems: [
          { voltageLevel: '不满1千伏', category: '一般工商业', price: 0.95 }, // 价格上涨约50%
        ],
      };

      const result = await monitor.detectAnomalies(currentData, history);

      expect(result).toBeDefined();
      expect(result.hasAnomaly).toBe(true);
      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.anomalies.some(a => a.type === 'price_spike')).toBe(true);
    });

    it('应该检测到离群值', async () => {
      const dataWithOutliers: ParsedTariffData = {
        ...mockParsedData,
        tariffItems: [
          { voltageLevel: '不满1千伏', category: '一般工商业', price: 0.6543 },
          { voltageLevel: '1-10千伏', category: '大工业', price: 0.6234 },
          { voltageLevel: '35千伏', category: '大工业', price: 0.5987 },
          { voltageLevel: '测试', category: '测试', price: 10.0 }, // 离群值
        ],
      };

      const result = await monitor.detectAnomalies(dataWithOutliers);

      expect(result.hasAnomaly).toBe(true);
      expect(result.anomalies.some(a => a.type === 'outlier')).toBe(true);
    });

    it('应该检测到缺失的关键电压等级', async () => {
      const incompleteData: ParsedTariffData = {
        ...mockParsedData,
        tariffItems: [
          { voltageLevel: '220千伏', category: '大工业', price: 0.5 },
        ], // 缺少关键电压等级
      };

      const result = await monitor.detectAnomalies(incompleteData);

      expect(result.hasAnomaly).toBe(true);
      expect(result.anomalies.some(a => a.type === 'missing_data')).toBe(true);
    });

    it('应该检测到价格梯度不一致', async () => {
      const inconsistentData: ParsedTariffData = {
        ...mockParsedData,
        tariffItems: [
          { voltageLevel: '不满1千伏', category: '大工业', price: 0.5 },
          { voltageLevel: '1-10千伏', category: '大工业', price: 0.6 }, // 高压电价反而更高
          { voltageLevel: '35千伏', category: '大工业', price: 0.7 },
        ],
      };

      const result = await monitor.detectAnomalies(inconsistentData);

      expect(result.anomalies.some(a => a.type === 'inconsistency')).toBe(true);
    });
  });

  describe('告警规则', () => {
    it('应该返回默认告警规则', () => {
      const rules = monitor.getAlertRules();

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some(r => r.name === '价格异常上涨')).toBe(true);
      expect(rules.some(r => r.name === '价格异常下跌')).toBe(true);
      expect(rules.some(r => r.name === '数据质量分数过低')).toBe(true);
    });

    it('应该能添加和删除告警规则', () => {
      const newRule = {
        id: 'test-rule',
        name: '测试规则',
        condition: {
          type: 'quality_score' as const,
          operator: 'lt' as const,
          threshold: 30,
        },
        severity: 'critical' as const,
        enabled: true,
        notificationChannels: ['email'],
        cooldownMinutes: 60,
      };

      monitor.addAlertRule(newRule);
      expect(monitor.getAlertRules().some(r => r.id === 'test-rule')).toBe(true);

      monitor.removeAlertRule('test-rule');
      expect(monitor.getAlertRules().some(r => r.id === 'test-rule')).toBe(false);
    });

    it('应该根据规则触发告警', async () => {
      // 创建新的monitor实例以避免冷却时间影响
      const testMonitor = new (await import('../DataQualityMonitor')).DataQualityMonitor();
      
      const poorQualityData: ParsedTariffData = {
        ...mockParsedData,
        tariffItems: [], // 空数据，质量分数会很低
        policyNumber: undefined,
        policyTitle: undefined,
        effectiveDate: undefined,
        publisher: undefined,
      };

      const qualityResult = await testMonitor.checkDataQuality(poorQualityData);
      
      // 确保质量分数低于50
      expect(qualityResult.overallScore).toBeLessThan(50);
      
      const anomalyResult = await testMonitor.detectAnomalies(poorQualityData);

      const alerts = await testMonitor.evaluateAlertRules(poorQualityData, qualityResult, anomalyResult);

      // 应该触发告警（可能是数据质量或数据缺失）
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('应该正确处理告警确认', async () => {
      // 创建新的monitor实例
      const testMonitor = new (await import('../DataQualityMonitor')).DataQualityMonitor();
      
      // 先触发一个告警
      const poorQualityData: ParsedTariffData = {
        ...mockParsedData,
        tariffItems: [],
        policyNumber: undefined,
        policyTitle: undefined,
        effectiveDate: undefined,
        publisher: undefined,
      };

      const qualityResult = await testMonitor.checkDataQuality(poorQualityData);
      const anomalyResult = await testMonitor.detectAnomalies(poorQualityData);
      const triggeredAlerts = await testMonitor.evaluateAlertRules(poorQualityData, qualityResult, anomalyResult);

      // 直接检查触发的告警
      expect(triggeredAlerts.length).toBeGreaterThan(0);

      const alert = triggeredAlerts[0];
      expect(alert.acknowledged).toBe(false);

      const success = testMonitor.acknowledgeAlert(alert.id, 'test-user');
      expect(success).toBe(true);

      const updatedAlert = testMonitor.getAlertHistory().find(a => a.id === alert.id);
      expect(updatedAlert?.acknowledged).toBe(true);
      expect(updatedAlert?.acknowledgedBy).toBe('test-user');
    });
  });

  describe('单例模式', () => {
    it('应该返回相同的实例', () => {
      const instance1 = getDataQualityMonitor();
      const instance2 = getDataQualityMonitor();

      expect(instance1).toBe(instance2);
    });
  });
});

describe('数据质量监控性能', () => {
  const monitor = new DataQualityMonitor();
  
  const performanceTestData: ParsedTariffData = {
    provinceCode: 'GD',
    provinceName: '广东省',
    policyNumber: '粤发改价格〔2024〕123号',
    policyTitle: '电价通知',
    effectiveDate: '2024-01-01',
    publisher: '广东省发改委',
    tariffItems: [
      { voltageLevel: '不满1千伏', category: '一般工商业', price: 0.6543 },
      { voltageLevel: '1-10千伏', category: '大工业', price: 0.6234 },
      { voltageLevel: '35千伏', category: '大工业', price: 0.5987 },
      { voltageLevel: '110千伏', category: '大工业', price: 0.5734 },
    ],
    parseMethod: 'pdf-text',
    confidence: 0.85,
    parseWarnings: [],
  };

  it('应该在合理时间内完成质量检查', async () => {
    const startTime = Date.now();
    await monitor.checkDataQuality(performanceTestData);
    const endTime = Date.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(1000); // 应该在1秒内完成
  });

  it('应该在合理时间内完成异常检测', async () => {
    const startTime = Date.now();
    await monitor.detectAnomalies(performanceTestData);
    const endTime = Date.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(1000);
  });
});
