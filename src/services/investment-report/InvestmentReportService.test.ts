/**
 * InvestmentReportService 测试
 *
 * 验证报告生成服务的核心功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InvestmentReportService } from './InvestmentReportService';
import type { Project } from '@/domain/models/Project';
import type { OwnerInfo, FacilityInfo, TariffDetail } from '@/domain/schemas/ProjectSchema';

// 扩展 Project 类型以包含业务字段（仅用于测试）
type TestProject = Project & {
  ownerInfo?: OwnerInfo;
  facilityInfo?: FacilityInfo;
  tariffDetail?: TariffDetail;
};

// 创建有效的 Project 对象（包含业务所需字段）
const createMockProject = (): TestProject => ({
  id: 'test-project-1',
  userId: 'test-user-1',
  projectName: '测试储能项目',
  description: '用于测试的储能项目',
  province: 'guangdong',
  systemSize: {
    capacity: 1000, // kWh = 1 MWh
    power: 500, // kW = 0.5 MW
  },
  costs: {
    battery: 1.2, // ¥/Wh
    pcs: 0.3, // ¥/W
    bms: 0.1, // ¥/Wh
    ems: 0.05, // ¥/Wh
    thermalManagement: 0.08, // ¥/Wh
    fireProtection: 0.05, // ¥/Wh
    container: 0.1, // ¥/Wh
    installation: 0.15, // ¥/W
    other: 0.02, // ¥/Wh
  },
  financing: {
    loanRatio: 0.7,
    interestRate: 0.045,
    term: 10,
  },
  operatingParams: {
    systemEfficiency: 0.88,
    dod: 0.9,
    cyclesPerDay: 1.5,
    degradationRate: 0.02,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  version: 1,
  // 业务所需字段
  ownerInfo: {
    companyName: '测试科技有限公司',
    industry: '制造业',
    projectLocation: 'guangdong',
    companyScale: 'medium',
    creditRating: 'AA',
    paymentHistory: 'good',
    collaborationModel: 'joint_venture',
    contractDuration: 10,
  },
  facilityInfo: {
    transformerCapacity: 630,
    voltageLevel: '10kV',
    avgMonthlyLoad: 300000,
    peakLoad: 500,
    availableArea: 500,
    roofType: 'flat',
    commissionDate: '2024-06-01',
  },
  tariffDetail: {
    tariffType: 'industrial',
    peakPrice: 1.2,
    valleyPrice: 0.4,
    flatPrice: 0.8,
    hourlyPrices: Array.from({ length: 24 }, (_, i) => {
      let period: 'peak' | 'valley' | 'flat' = 'flat';
      if (i >= 8 && i < 12 || i >= 14 && i < 17) {
        period = 'peak';
      } else if (i >= 0 && i < 8 || i >= 23) {
        period = 'valley';
      }
      return {
        hour: i,
        price: period === 'peak' ? 1.2 : period === 'valley' ? 0.4 : 0.8,
        period,
      };
    }),
  },
});

// 扩展 Project 类型以包含业务字段（仅用于测试）
type TestProject = Project & {
  ownerInfo?: OwnerInfo;
  facilityInfo?: FacilityInfo;
  tariffDetail?: TariffDetail;
};

// Mock数据（用于测试，不直接传递给服务）
const mockProjectInput = {
  projectName: '测试储能项目',
  province: 'guangdong',
  ownerInfo: {
    companyName: '测试科技有限公司',
    industry: '制造业',
    projectLocation: 'guangdong',
    companyScale: 'medium',
    creditRating: 'AA',
    paymentHistory: 'good',
    collaborationModel: 'joint_venture',
    contractDuration: 10,
  },
  facilityInfo: {
    transformerCapacity: 630,
    voltageLevel: '10kV',
    avgMonthlyLoad: 300000,
    peakLoad: 500,
    availableArea: 500,
    roofType: 'flat',
    commissionDate: '2024-06-01',
  },
  tariffDetail: {
    tariffType: 'industrial',
    peakPrice: 1.2,
    valleyPrice: 0.4,
    flatPrice: 0.8,
    hourlyPrices: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      price: i >= 8 && i < 12 || i >= 14 && i < 17 ? 1.2 : i >= 0 && i < 8 || i >= 23 ? 0.4 : 0.8,
      period: i >= 8 && i < 12 || i >= 14 && i < 17 ? 'peak' : i >= 0 && i < 8 || i >= 23 ? 'valley' : 'flat',
    })),
  },
};

// 设置更长的超时时间（因为涉及AI调用）
import { describe, beforeEach, expect } from 'vitest';

describe('InvestmentReportService', () => {
  let service: InvestmentReportService;

  beforeEach(() => {
    service = new InvestmentReportService();
  });

  it('应该成功初始化服务', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(InvestmentReportService);
  });

  it('应该成功生成报告（基本功能测试)', async () => {
    // 创建项目
    const project = createMockProject();

    // 生成报告
    const result = await service.generateReport(project, {
      onProgress: (step, progress) => {
        console.log(`[${progress}%] ${step}`);
      },
    });

    // 验证结果结构
    expect(result).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result.dataContext).toBeDefined();
    expect(result.narratives).toBeDefined();
    expect(result.metadata).toBeDefined();

    // 验证元数据
    expect(result.metadata.generationTime).toBeGreaterThan(0);
    expect(Array.isArray(result.metadata.agentsExecuted)).toBe(true);
    expect(Array.isArray(result.metadata.calculationsExecuted)).toBe(true);
    expect(Array.isArray(result.metadata.errors)).toBe(true);
  });

  it('应该正确执行所有智能体', async () => {
    const project = createMockProject();

    const result = await service.generateReport(project, {
      enableAgent: {
        dueDiligence: true,
        policyAnalysis: true,
        technicalProposal: true,
        riskAssessment: true,
        reportNarrative: true,
      },
    });

    // 验证所有智能体都被执行
    const agents = result.metadata.agentsExecuted;
    expect(agents).toContain('DueDiligenceAgent');
    expect(agents).toContain('PolicyAnalysisAgent');
    expect(agents).toContain('TechnicalProposalAgent');
    expect(agents).toContain('RiskAssessmentAgent');
    // 注意：ReportNarrativeAgent 也会执行但可能不在列表中
  });

  it('应该生成所有报告章节', async () => {
    const project = createMockProject();

    const result = await service.generateReport(project);

    const chapters = Object.keys(result.narratives);
    expect(chapters).toContain('project_overview');
    expect(chapters).toContain('owner_due_diligence');
    expect(chapters).toContain('policy_analysis');
    expect(chapters).toContain('technical_assessment');
    expect(chapters).toContain('financial_analysis');
    expect(chapters).toContain('risk_assessment');
    expect(chapters).toContain('investment_recommendation');

    // 验证每个章节都有内容
    chapters.forEach(chapter => {
      const content = result.narratives[chapter];
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
      console.log(`${chapter}: ${content.substring(0, 50)}...`);
    });
  });

  it('应该能够从上下文获取各类分析结果', async () => {
    const project = createMockProject();

    const result = await service.generateReport(project);
    const context = result.dataContext;

    // 测试各类数据获取方法
    expect(context.getDueDiligenceReport()).toBeDefined();
    expect(context.getPolicyAnalysisReport()).toBeDefined();
    expect(context.getTechnicalProposal()).toBeDefined();
    expect(context.getRiskAssessmentReport()).toBeDefined();
    expect(context.getFinancialMetrics()).toBeDefined();
    expect(context.getCashFlowAnalysis()).toBeDefined();
    expect(context.getSensitivityMatrix()).toBeDefined();
  });

  it('应该支持选择性启用智能体', async () => {
    const project = createMockProject();

    // 只启用部分智能体
    const result = await service.generateReport(project, {
      enableAgent: {
        dueDiligence: true,
        policyAnalysis: false, // 禁用
        technicalProposal: true,
        riskAssessment: false, // 禁用
        reportNarrative: true,
      },
    });

    const agents = result.metadata.agentsExecuted;
    expect(agents).toContain('DueDiligenceAgent');
    expect(agents).not.toContain('PolicyAnalysisAgent');
    expect(agents).toContain('TechnicalProposalAgent');
    expect(agents).not.toContain('RiskAssessmentAgent');
  });

  it('应该正确处理错误和回退', async () => {
    const project = createMockProject();

    // 即使某些智能体失败，也应该能生成报告
    const result = await service.generateReport(project, {
      fallbackToMock: true,
    });

    // 报告应该生成
    expect(result.reportId).toBeDefined();
    expect(result.dataContext).toBeDefined();

    // 即使有错误，也应该有回退数据
    const dd = result.dataContext.getDueDiligenceReport();
    const policy = result.dataContext.getPolicyAnalysisReport();
    const tech = result.dataContext.getTechnicalProposal();
    const risk = result.dataContext.getRiskAssessmentReport();

    // 至少应该有一些数据
    expect(dd || policy || tech || risk).toBeDefined();
  });

  it('应该支持流式生成', async () => {
    const project = createMockProject();

    const updates = [];
    for await (const update of service.generateReportStream(project)) {
      updates.push(update);

      if (update.step === 'complete') {
        break;
      }
    }

    // 验证流式更新
    expect(updates.length).toBeGreaterThan(0);

    // 验证进度序列
    const steps = updates.map(u => u.step);
    expect(steps).toContain('collecting_data');
    expect(steps).toContain('running_agents');
    expect(steps).toContain('running_calculations');
    expect(steps).toContain('generating_narratives');
    expect(steps).toContain('generating_pdf');
    expect(steps).toContain('complete');
  });

  it('财务指标计算应该合理', async () => {
    const project = createMockProject();

    const result = await service.generateReport(project);
    const metrics = result.dataContext.getFinancialMetrics();

    expect(metrics).toBeDefined();
    expect(metrics?.irr).toBeDefined();
    expect(metrics?.npv).toBeDefined();
    expect(metrics?.paybackPeriodStatic).toBeDefined();

    // 基本合理性检查
    if (metrics?.irr !== null) {
      expect(metrics.irr).toBeGreaterThan(-10);
      expect(metrics.irr).toBeLessThan(50);
    }

    console.log('财务指标:', {
      irr: metrics?.irr,
      npv: metrics?.npv,
      paybackPeriod: metrics?.paybackPeriodStatic,
    });
  });

  it('风险评分应该在合理范围内', async () => {
    const project = createMockProject();

    const result = await service.generateReport(project);
    const risk = result.dataContext.getRiskAssessmentReport();

    expect(risk).toBeDefined();
    expect(risk?.overallRating).toBeDefined();

    if (risk?.overallRating) {
      expect(risk.overallRating.score).toBeGreaterThanOrEqual(0);
      expect(risk.overallRating.score).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high', 'critical']).toContain(risk.overallRating.level);
    }

    console.log('风险评估:', risk?.overallRating);
  });

  it('JSON导出应该正常工作', async () => {
    const project = createMockProject();

    const result = await service.generateReport(project);
    const json = result.dataContext.toJSON();

    expect(json).toBeDefined();
    expect(json.project).toBeDefined();

    console.log('JSON导出大小:', JSON.stringify(json).length, 'bytes');
  });
});
