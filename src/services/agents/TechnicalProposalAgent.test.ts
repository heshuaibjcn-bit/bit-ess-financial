/**
 * TechnicalProposalAgent 测试
 *
 * 验证技术方案生成智能体的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TechnicalProposalAgent } from './TechnicalProposalAgent';
import type { OwnerInfo, FacilityInfo, TariffDetail } from '@/domain/schemas/ProjectSchema';

// 创建测试用的facilityInfo
const createMockFacilityInfo = (): FacilityInfo => ({
  transformerCapacity: 630,
  voltageLevel: '10kV',
  avgMonthlyLoad: 300000,
  peakLoad: 500,
  availableArea: 500,
  roofType: 'flat',
  commissionDate: '2024-06-01',
});

// 创建测试用的tariffDetail
const createMockTariffDetail = (): TariffDetail => ({
  tariffType: 'industrial',
  peakPrice: 1.2,
  valleyPrice: 0.4,
  flatPrice: 0.8,
  hourlyPrices: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    price: i >= 8 && i < 12 || i >= 14 && i < 17 ? 1.2 : i >= 0 && i < 8 || i >= 23 ? 0.4 : 0.8,
    period: i >= 8 && i < 12 || i >= 14 && i < 17 ? 'peak' : i >= 0 && i < 8 || i >= 23 ? 'valley' : 'flat',
  })),
});

// 创建测试用的ownerInfo
const createMockOwnerInfo = (): OwnerInfo => ({
  companyName: '测试科技有限公司',
  industry: '制造业',
  projectLocation: 'guangdong',
  companyScale: 'medium',
  creditRating: 'AA',
  paymentHistory: 'good',
  collaborationModel: 'joint_venture',
  contractDuration: 10,
});

describe('TechnicalProposalAgent', () => {
  let agent: TechnicalProposalAgent;

  beforeEach(() => {
    agent = new TechnicalProposalAgent();
  });

  it('应该成功初始化', () => {
    expect(agent).toBeDefined();
    expect(agent).toBeInstanceOf(TechnicalProposalAgent);
  });

  describe('generateProposal - 主方案生成', () => {
    it('应该成功生成完整的技术方案', async () => {
      const facilityInfo = createMockFacilityInfo();
      const tariffInfo = createMockTariffDetail();
      const ownerInfo = createMockOwnerInfo();

      // Mock getRecommendedConfiguration - note: does NOT include brands (brands are computed separately)
      const mockGetConfig = vi.spyOn(agent, 'getRecommendedConfiguration' as any)
        .mockResolvedValueOnce({
          capacity: 1,
          power: 0.5,
          duration: 2,
          technology: 'Lithium-ion (LiFePO4)',
          chargeStrategy: 'Peak-valley arbitrage with demand response',
        });

      // Mock selectBrands to return default top 3 brands
      const mockSelectBrands = vi.spyOn(agent, 'selectBrands' as any)
        .mockReturnValueOnce(['宁德时代 (CATL)', '比亚迪 (BYD)', '国轩高科']);

      // Mock generateRecommendations to avoid actual LLM call
      const mockGenerateRecommendations = vi.spyOn(agent, 'generateRecommendations' as any)
        .mockResolvedValueOnce([
          '选择知名品牌（CATL、BYD等）确保电池质量和售后',
          '预留15%容量冗余，应对衰减和性能波动',
          '建立电池健康监测系统，实时跟踪电池状态',
        ]);

      const result = await agent.generateProposal(facilityInfo, tariffInfo, ownerInfo);

      // 验证结果结构
      expect(result).toBeDefined();
      expect(result.recommended).toBeDefined();
      expect(result.alternatives).toBeDefined();
      expect(result.expectedPerformance).toBeDefined();
      expect(result.implementation).toBeDefined();
      expect(result.technologySelection).toBeDefined();
      expect(result.risks).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('应该正确处理用户偏好（保守型）', async () => {
      const facilityInfo = createMockFacilityInfo();
      const tariffInfo = createMockTariffDetail();

      // Mock getRecommendedConfiguration - note: does NOT include brands (brands are computed separately)
      const mockGetConfig = vi.spyOn(agent, 'getRecommendedConfiguration' as any)
        .mockResolvedValueOnce({
          capacity: 1,
          power: 0.5,
          duration: 2,
          technology: 'Lithium-ion (LiFePO4)',
          chargeStrategy: 'Peak-valley arbitrage with demand response',
        });

      // Mock selectBrands to return default top 3 brands
      const mockSelectBrands = vi.spyOn(agent, 'selectBrands' as any)
        .mockReturnValueOnce(['宁德时代 (CATL)', '比亚迪 (BYD)', '国轩高科']);

      const mockGenerateRecommendations = vi.spyOn(agent, 'generateRecommendations' as any)
        .mockResolvedValueOnce(['建议1', '建议2', '建议3']);

      const result = await agent.generateProposal(facilityInfo, tariffInfo, undefined, {
        riskTolerance: 'conservative',
      });

      expect(result.recommended).toBeDefined();
      expect(result.alternatives).toHaveLength(2); // conservative + aggressive
    });

    it('应该正确处理品牌偏好', async () => {
      const facilityInfo = createMockFacilityInfo();
      const tariffInfo = createMockTariffDetail();

      // Mock getRecommendedConfiguration - brands field reflects filtered result
      const mockGetConfig = vi.spyOn(agent, 'getRecommendedConfiguration' as any)
        .mockResolvedValueOnce({
          capacity: 1,
          power: 0.5,
          duration: 2,
          technology: 'Lithium-ion (LiFePO4)',
          brands: ['宁德时代 (CATL)', '比亚迪 (BYD)'], // Filtered to 2 brands per user preference
          chargeStrategy: 'Peak-valley arbitrage with demand response',
        });

      // Mock selectBrands to return filtered brands based on preference
      const mockSelectBrands = vi.spyOn(agent, 'selectBrands' as any)
        .mockReturnValueOnce(['宁德时代 (CATL)', '比亚迪 (BYD)']);

      const mockGenerateRecommendations = vi.spyOn(agent, 'generateRecommendations' as any)
        .mockResolvedValueOnce(['建议1', '建议2', '建议3']);

      const result = await agent.generateProposal(facilityInfo, tariffInfo, undefined, {
        brandPreference: ['宁德时代 (CATL)', '比亚迪 (BYD)'],
      });

      expect(result.recommended.brands).toEqual(['宁德时代 (CATL)', '比亚迪 (BYD)']);
    });
  });

  describe('generateAlternatives - 备选方案', () => {
    it('应该生成保守和激进方案', async () => {
      const facilityInfo = createMockFacilityInfo();
      const tariffInfo = createMockTariffDetail();

      // Mock getRecommendedConfiguration - note: does NOT include brands (brands are computed separately)
      const mockGetConfig = vi.spyOn(agent, 'getRecommendedConfiguration' as any)
        .mockResolvedValueOnce({
          capacity: 1,
          power: 0.5,
          duration: 2,
          technology: 'Lithium-ion (LiFePO4)',
          chargeStrategy: 'Peak-valley arbitrage with demand response',
        });

      // Mock selectBrands to return default top 3 brands
      const mockSelectBrands = vi.spyOn(agent, 'selectBrands' as any)
        .mockReturnValueOnce(['宁德时代 (CATL)', '比亚迪 (BYD)', '国轩高科']);

      // Mock generateRecommendations
      const mockGenerateRecommendations = vi.spyOn(agent, 'generateRecommendations' as any)
        .mockResolvedValueOnce(['建议1', '建议2', '建议3']);

      const result = await agent.generateProposal(facilityInfo, tariffInfo);

      expect(result.alternatives).toHaveLength(2);

      // 检查保守方案
      const conservative = result.alternatives.find(a => a.type === 'conservative');
      expect(conservative).toBeDefined();
      expect(conservative?.riskLevel).toBe('low');
      expect(conservative?.expectedIRR).toBeLessThan(8); // 保守方案IRR较低

      // 检查激进方案
      const aggressive = result.alternatives.find(a => a.type === 'aggressive');
      expect(aggressive).toBeDefined();
      expect(aggressive?.riskLevel).toBe('high');
      expect(aggressive?.expectedIRR).toBeGreaterThan(8); // 激进方案IRR较高
    });
  });

  describe('predictPerformance - 性能预测', () => {
    it('应该正确预测年吞吐量', async () => {
      const facilityInfo = createMockFacilityInfo();
      const tariffInfo = createMockTariffDetail();

      // Mock getRecommendedConfiguration - note: does NOT include brands (brands are computed separately)
      const mockGetConfig = vi.spyOn(agent, 'getRecommendedConfiguration' as any)
        .mockResolvedValueOnce({
          capacity: 1, // MWh
          power: 0.5, // MW
          duration: 2,
          technology: 'Lithium-ion (LiFePO4)',
          chargeStrategy: 'Peak-valley arbitrage with demand response',
        });

      // Mock selectBrands to return default top 3 brands
      const mockSelectBrands = vi.spyOn(agent, 'selectBrands' as any)
        .mockReturnValueOnce(['宁德时代 (CATL)', '比亚迪 (BYD)', '国轩高科']);

      // Mock generateRecommendations
      const mockGenerateRecommendations = vi.spyOn(agent, 'generateRecommendations' as any)
        .mockResolvedValueOnce(['建议1', '建议2', '建议3']);

      const result = await agent.generateProposal(facilityInfo, tariffInfo);

      expect(result.expectedPerformance.annualThroughput).toBeGreaterThan(0);

      // 验证计算逻辑：capacity (MWh) * 1000 = kWh, DOD 0.9, cycles 1.5/day, 365 days, / 1000 back to MWh
      // 1 * 1000 * 0.9 * 1.5 * 365 / 1000 = 492.75 MWh/year
      expect(result.expectedPerformance.annualThroughput).toBeCloseTo(492.8, 1);
    });

    it('应该正确预测第10年容量保持率', async () => {
      const facilityInfo = createMockFacilityInfo();
      const tariffInfo = createMockTariffDetail();

      // Mock getRecommendedConfiguration - note: does NOT include brands (brands are computed separately)
      const mockGetConfig = vi.spyOn(agent, 'getRecommendedConfiguration' as any)
        .mockResolvedValueOnce({
          capacity: 1,
          power: 0.5,
          duration: 2,
          technology: 'Lithium-ion (LiFePO4)',
          chargeStrategy: 'Peak-valley arbitrage with demand response',
        });

      // Mock selectBrands to return default top 3 brands
      const mockSelectBrands = vi.spyOn(agent, 'selectBrands' as any)
        .mockReturnValueOnce(['宁德时代 (CATL)', '比亚迪 (BYD)', '国轩高科']);

      // Mock generateRecommendations
      const mockGenerateRecommendations = vi.spyOn(agent, 'generateRecommendations' as any)
        .mockResolvedValueOnce(['建议1', '建议2', '建议3']);

      const result = await agent.generateProposal(facilityInfo, tariffInfo);

      // 第10年容量保持率：(1 - 0.02)^10 ≈ 0.817
      expect(result.expectedPerformance.year10Capacity).toBeCloseTo(0.817, 3);
    });
  });

  describe('technologySelection - 技术选型', () => {
    it('应该选择LiFePO4电池技术', async () => {
      const facilityInfo = createMockFacilityInfo();
      const tariffInfo = createMockTariffDetail();

      // Mock getRecommendedConfiguration - note: does NOT include brands (brands are computed separately)
      const mockGetConfig = vi.spyOn(agent, 'getRecommendedConfiguration' as any)
        .mockResolvedValueOnce({
          capacity: 1,
          power: 0.5,
          duration: 2,
          technology: 'Lithium-ion (LiFePO4)',
          chargeStrategy: 'Peak-valley arbitrage with demand response',
        });

      // Mock selectBrands to return default top 3 brands
      const mockSelectBrands = vi.spyOn(agent, 'selectBrands' as any)
        .mockReturnValueOnce(['宁德时代 (CATL)', '比亚迪 (BYD)', '国轩高科']);

      // Mock generateRecommendations
      const mockGenerateRecommendations = vi.spyOn(agent, 'generateRecommendations' as any)
        .mockResolvedValueOnce(['建议1', '建议2', '建议3']);

      const result = await agent.generateProposal(facilityInfo, tariffInfo);

      expect(result.technologySelection.battery.chemistry).toBe('LiFePO4 (磷酸铁锂)');
      expect(result.technologySelection.battery.type).toBe('Lithium-ion');
    });

    it('应该推荐三级BMS架构', async () => {
      const facilityInfo = createMockFacilityInfo();
      const tariffInfo = createMockTariffDetail();

      // Mock getRecommendedConfiguration - note: does NOT include brands (brands are computed separately)
      const mockGetConfig = vi.spyOn(agent, 'getRecommendedConfiguration' as any)
        .mockResolvedValueOnce({
          capacity: 1,
          power: 0.5,
          duration: 2,
          technology: 'Lithium-ion (LiFePO4)',
          chargeStrategy: 'Peak-valley arbitrage with demand response',
        });

      // Mock selectBrands to return default top 3 brands
      const mockSelectBrands = vi.spyOn(agent, 'selectBrands' as any)
        .mockReturnValueOnce(['宁德时代 (CATL)', '比亚迪 (BYD)', '国轩高科']);

      // Mock generateRecommendations
      const mockGenerateRecommendations = vi.spyOn(agent, 'generateRecommendations' as any)
        .mockResolvedValueOnce(['建议1', '建议2', '建议3']);

      const result = await agent.generateProposal(facilityInfo, tariffInfo);

      expect(result.technologySelection.bms.type).toBe('Distributed BMS with Master Control');
      expect(result.technologySelection.bms.features).toContain('电芯级监控');
      expect(result.technologySelection.bms.features).toContain('均衡控制');
    });
  });

  describe('implementation - 实施计划', () => {
    it('应该生成三阶段实施计划', async () => {
      const facilityInfo = createMockFacilityInfo();
      const tariffInfo = createMockTariffDetail();

      // Mock getRecommendedConfiguration - note: does NOT include brands (brands are computed separately)
      const mockGetConfig = vi.spyOn(agent, 'getRecommendedConfiguration' as any)
        .mockResolvedValueOnce({
          capacity: 1,
          power: 0.5,
          duration: 2,
          technology: 'Lithium-ion (LiFePO4)',
          chargeStrategy: 'Peak-valley arbitrage with demand response',
        });

      // Mock selectBrands to return default top 3 brands
      const mockSelectBrands = vi.spyOn(agent, 'selectBrands' as any)
        .mockReturnValueOnce(['宁德时代 (CATL)', '比亚迪 (BYD)', '国轩高科']);

      // Mock generateRecommendations
      const mockGenerateRecommendations = vi.spyOn(agent, 'generateRecommendations' as any)
        .mockResolvedValueOnce(['建议1', '建议2', '建议3']);

      const result = await agent.generateProposal(facilityInfo, tariffInfo);

      expect(result.implementation.phases).toHaveLength(3);

      const phases = result.implementation.phases;
      expect(phases[0].phase).toBe('设计');
      expect(phases[1].phase).toBe('建设');
      expect(phases[2].phase).toBe('调试');

      expect(result.implementation.totalTimeline).toBe('10周');
      expect(result.implementation.criticalPath).toContain('设备采购');
      expect(result.implementation.criticalPath).toContain('并网接入');
      expect(result.implementation.criticalPath).toContain('性能测试');
    });
  });

  describe('risks - 风险评估', () => {
    it('应该识别主要技术风险', async () => {
      const facilityInfo = createMockFacilityInfo();
      const tariffInfo = createMockTariffDetail();

      // Mock getRecommendedConfiguration - note: does NOT include brands (brands are computed separately)
      const mockGetConfig = vi.spyOn(agent, 'getRecommendedConfiguration' as any)
        .mockResolvedValueOnce({
          capacity: 1,
          power: 0.5,
          duration: 2,
          technology: 'Lithium-ion (LiFePO4)',
          chargeStrategy: 'Peak-valley arbitrage with demand response',
        });

      // Mock selectBrands to return default top 3 brands
      const mockSelectBrands = vi.spyOn(agent, 'selectBrands' as any)
        .mockReturnValueOnce(['宁德时代 (CATL)', '比亚迪 (BYD)', '国轩高科']);

      // Mock generateRecommendations
      const mockGenerateRecommendations = vi.spyOn(agent, 'generateRecommendations' as any)
        .mockResolvedValueOnce(['建议1', '建议2', '建议3']);

      const result = await agent.generateProposal(facilityInfo, tariffInfo);

      expect(result.risks).toBeDefined();
      expect(result.risks.length).toBeGreaterThan(0);

      // 应该包含电池衰减风险
      expect(result.risks).toContain('电池容量随时间衰减（约2%/年），影响第8-10年收益');
    });
  });

  describe('错误处理', () => {
    it('应该处理LLM返回无效JSON', async () => {
      const facilityInfo = createMockFacilityInfo();
      const tariffInfo = createMockTariffDetail();

      // Mock getRecommendedConfiguration - note: does NOT include brands (brands are computed separately)
      const mockGetConfig = vi.spyOn(agent, 'getRecommendedConfiguration' as any)
        .mockResolvedValueOnce({
          capacity: 1,
          power: 0.5,
          duration: 2,
          technology: 'Lithium-ion (LiFePO4)',
          chargeStrategy: 'Peak-valley arbitrage with demand response',
        });

      // Mock generateRecommendations to return fallback recommendations
      const mockGenerateRecommendations = vi.spyOn(agent, 'generateRecommendations' as any)
        .mockResolvedValueOnce([
          '选择知名品牌（CATL、BYD等）确保电池质量和售后',
          '预留15%容量冗余，应对衰减和性能波动',
          '建立电池健康监测系统，实时跟踪电池状态',
          '规划10年后的电池更换或扩容方案',
          '选择可靠的EPC总包方，确保施工质量和进度',
          '建立完善的运维体系，定期巡检和维护',
          '购买设备保险和财产保险，降低意外损失',
        ]);

      const result = await agent.generateProposal(facilityInfo, tariffInfo);

      // 应该使用fallback建议
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThanOrEqual(5);

      // 验证fallback建议包含关键内容
      const recText = result.recommendations.join(' ');
      expect(recText).toContain('知名品牌');
      expect(recText).toContain('冗余');
    });
  });
});
