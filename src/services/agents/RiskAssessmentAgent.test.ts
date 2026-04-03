/**
 * RiskAssessmentAgent 测试
 *
 * 验证风险评估智能体的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RiskAssessmentAgent } from './RiskAssessmentAgent';
import type { RiskAssessmentInput, RiskAssessmentResult } from './RiskAssessmentAgent';
import type { DueDiligenceResult } from './DueDiligenceAgent';
import type { PolicyAnalysisResult } from './PolicyAnalysisAgent';
import type { TechnicalProposalResult } from './TechnicalProposalAgent';
import type { Project } from '@/domain/models/Project';
import type { FinancialMetrics } from '@/domain/services/FinancialCalculator';

// 创建测试用的Project
const createMockProject = (): Project => ({
  id: 'project-1',
  projectName: '测试储能项目',
  ownerName: '测试公司',
  facilityInfo: {
    transformerCapacity: 630,
    voltageLevel: '10kV',
    avgMonthlyLoad: 300000,
    peakLoad: 500,
    availableArea: 500,
    roofType: 'flat',
    commissionDate: '2024-06-01',
  },
  tariffInfo: {
    tariffType: 'industrial',
    peakPrice: 1.2,
    valleyPrice: 0.4,
    flatPrice: 0.8,
    hourlyPrices: [],
  },
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
  systemConfiguration: {
    capacity: 1,
    power: 0.5,
    duration: 2,
    technology: 'Lithium-ion (LiFePO4)',
    brands: ['宁德时代 (CATL)', '比亚迪 (BYD)'],
    chargeStrategy: 'Peak-valley arbitrage',
  },
  investmentAnalysis: {
    upfrontCost: 1000000,
    annualRevenue: 300000,
    annualCost: 50000,
    irr: 8.5,
    npv: 1500000,
    paybackPeriod: 5,
  },
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 创建测试用的DueDiligenceResult
const createMockDueDiligenceResult = (): DueDiligenceResult => ({
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
  financialHealth: {
    revenue: 50000000,
    profit: 5000000,
    debtRatio: 0.3,
    liquidityRatio: 1.5,
    growthRate: 0.1,
    stability: 'stable',
  },
  creditRating: {
    score: 75,
    level: 'AA',
    factors: ['财务健康', '行业领先'],
  },
  paymentHistory: {
    onTimePayments: 95,
    latePayments: 5,
    litigation: 3,
    notes: '整体付款记录良好',
  },
  overallAssessment: {
    rating: 'recommended',
    confidence: 0.85,
    keyFindings: ['财务稳定', '信用良好'],
    risks: [],
    recommendations: ['建议合作'],
  },
  metadata: {
    dataSource: '企业征信',
    reportGenerated: new Date(),
    completeness: 0.9,
  },
});

// 创建测试用的PolicyAnalysisResult
const createMockPolicyAnalysisResult = (): PolicyAnalysisResult => ({
  currentTariff: {
    tariffType: 'industrial',
    peakPrice: 1.2,
    valleyPrice: 0.4,
    flatPrice: 0.8,
    hourlyPrices: [],
  },
  policyTrends: {
    direction: 'stable',
    timeframe: '未来1-2年',
    keyChanges: ['分时电价政策稳定'],
  },
  risks: [
    {
      description: '峰谷价差可能缩小',
      level: 'medium',
      impact: 'moderate',
      response: '签订长期购电协议锁定价格',
    },
    {
      description: '补贴政策可能调整',
      level: 'low',
      impact: 'minor',
      response: '关注政策动向，及时调整策略',
    },
  ],
  opportunities: [
    '需求响应市场逐步扩大',
    '容量补偿机制可能引入',
  ],
  recommendations: [
    '建议签订长期购电协议',
    '关注需求响应市场机会',
  ],
  metadata: {
    dataSource: '政策数据库 + AI分析',
    reportGenerated: new Date(),
    confidence: 0.8,
  },
});

// 创建测试用的TechnicalProposalResult
const createMockTechnicalProposalResult = (): TechnicalProposalResult => ({
  recommended: {
    capacity: 1,
    power: 0.5,
    duration: 2,
    technology: 'Lithium-ion (LiFePO4)',
    brands: ['宁德时代 (CATL)', '比亚迪 (BYD)'],
    chargeStrategy: 'Peak-valley arbitrage with demand response',
  },
  alternatives: [],
  expectedPerformance: {
    annualThroughput: 492.75,
    systemEfficiency: 0.9,
    availability: 0.97,
    year10Capacity: 0.817,
  },
  implementation: {
    phases: [],
    totalTimeline: '10周',
    criticalPath: [],
  },
  technologySelection: {
    battery: {
      type: 'Lithium-ion',
      chemistry: 'LiFePO4 (磷酸铁锂)',
      rationale: '安全性高',
    },
    pcs: {
      type: 'Grid-following PCS',
      efficiency: '≥92%',
      rationale: '高效率',
    },
    bms: {
      type: 'Distributed BMS',
      features: ['电芯级监控'],
      rationale: '三级架构',
    },
  },
  risks: [
    '电池容量随时间衰减（约2%/年），影响第8-10年收益',
    '设备质量差异可能导致实际性能偏离标称值',
    '并网接入流程复杂，可能影响项目进度',
    '安全风险',
  ],
  recommendations: [],
  metadata: {
    dataSource: 'CapacityRecommender + AI analysis',
    reportGenerated: new Date(),
    confidence: 0.85,
  },
});

// 创建测试用的FinancialMetrics
const createMockFinancialMetrics = (): FinancialMetrics => ({
  upfrontCost: 1000000,
  annualRevenue: 300000,
  annualCost: 50000,
  irr: 5.5,  // 低于6%，触发财务风险
  npv: 1500000,
  paybackPeriod: 5,
  sensitivity: {
    irr: {
      capacity: 0.5,
      power: -0.3,
      electricityPrice: 0.8,
    },
    npv: {
      capacity: 0.5,
      power: -0.3,
      electricityPrice: 0.8,
    },
  },
});

describe('RiskAssessmentAgent', () => {
  let agent: RiskAssessmentAgent;

  beforeEach(() => {
    agent = new RiskAssessmentAgent();
  });

  it('应该成功初始化', () => {
    expect(agent).toBeDefined();
    expect(agent).toBeInstanceOf(RiskAssessmentAgent);
  });

  describe('assessRisks - 主风险评估方法', () => {
    it('应该成功生成完整的风险评估', async () => {
      const input: RiskAssessmentInput = {
        dueDiligenceReport: createMockDueDiligenceResult(),
        policyAnalysisReport: createMockPolicyAnalysisResult(),
        technicalProposal: createMockTechnicalProposalResult(),
        projectInfo: createMockProject(),
        financialMetrics: createMockFinancialMetrics(),
      };

      const result = await agent.assessRisks(input);

      // 验证结果结构
      expect(result).toBeDefined();
      expect(result.riskMatrix).toBeDefined();
      expect(result.risks).toBeDefined();
      expect(result.overallRating).toBeDefined();
      expect(result.mitigationStrategies).toBeDefined();
      expect(result.contingencyPlans).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('应该正确处理最小输入（仅projectInfo）', async () => {
      const input: RiskAssessmentInput = {
        projectInfo: createMockProject(),
      };

      const result = await agent.assessRisks(input);

      expect(result.risks).toBeDefined();
      expect(result.risks.length).toBeGreaterThan(0); // 至少有运营风险
      expect(result.overallRating.level).toBeDefined();
    });
  });

  describe('collectAllRisks - 风险收集', () => {
    it('应该从所有来源收集风险', async () => {
      const input: RiskAssessmentInput = {
        dueDiligenceReport: createMockDueDiligenceResult(),
        policyAnalysisReport: createMockPolicyAnalysisResult(),
        technicalProposal: createMockTechnicalProposalResult(),
        projectInfo: createMockProject(),
        financialMetrics: createMockFinancialMetrics(),
      };

      const risks = await (agent as any).collectAllRisks(input);

      // 应该包含各类风险
      const categories = new Set(risks.map(r => r.category));
      expect(categories.has('credit')).toBe(true);
      expect(categories.has('policy')).toBe(true);
      expect(categories.has('technical')).toBe(true);
      expect(categories.has('financial')).toBe(true);
      expect(categories.has('operational')).toBe(true);
    });

    it('应该在没有某些输入时跳过对应风险', async () => {
      const input: RiskAssessmentInput = {
        projectInfo: createMockProject(),
      };

      const risks = await (agent as any).collectAllRisks(input);

      // 应该只有运营风险
      expect(risks.every(r => r.category === 'operational')).toBe(true);
    });
  });

  describe('extractCreditRisks - 信用风险提取', () => {
    it('应该从逾期记录中识别信用风险', async () => {
      const report: DueDiligenceResult = {
        ...createMockDueDiligenceResult(),
        paymentHistory: {
          onTimePayments: 90,
          latePayments: 5,
          litigation: 3,  // 触发诉讼风险
          notes: '存在多次逾期',
        },
      };

      const risks = await (agent as any).extractCreditRisks(report);

      expect(risks.length).toBe(2); // 逾期风险 + 诉讼风险
      expect(risks[0].category).toBe('credit');
      expect(risks[0].description).toContain('5次逾期付款记录');
    });

    it('应该从低信用评分中识别风险', async () => {
      const report: DueDiligenceResult = {
        ...createMockDueDiligenceResult(),
        creditRating: {
          score: 55,
          level: 'BBB',
          factors: ['财务不稳定'],
        },
      };

      const risks = await (agent as any).extractCreditRisks(report);

      const lowScoreRisk = risks.find(r => r.description.includes('信用评分较低'));
      expect(lowScoreRisk).toBeDefined();
      expect(lowScoreRisk.level).toBe('high');
    });

    it('应该从诉讼记录中识别风险', async () => {
      const report: DueDiligenceResult = {
        ...createMockDueDiligenceResult(),
        paymentHistory: {
          onTimePayments: 85,
          latePayments: 2,
          litigation: 3,
          notes: '涉及多起诉讼',
        },
      };

      const risks = await (agent as any).extractCreditRisks(report);

      const litigationRisk = risks.find(r => r.description.includes('诉讼'));
      expect(litigationRisk).toBeDefined();
    });
  });

  describe('extractPolicyRisks - 政策风险提取', () => {
    it('应该正确映射政策风险等级', async () => {
      const report: PolicyAnalysisResult = {
        ...createMockPolicyAnalysisResult(),
        risks: [
          {
            description: '峰谷价差可能大幅缩小',
            level: 'high',
            impact: 'significant',
            response: '签订长期协议锁定价格',
          },
          {
            description: '补贴政策可能取消',
            level: 'low',
            impact: 'minor',
            response: '关注政策动态',
          },
        ],
      };

      const risks = await (agent as any).extractPolicyRisks(report);

      expect(risks.length).toBe(2);

      const highRisk = risks.find(r => r.level === 'high');
      expect(highRisk?.likelihood).toBe(0.6);
      expect(highRisk?.impact).toBe(0.8);

      const lowRisk = risks.find(r => r.level === 'low');
      expect(lowRisk?.likelihood).toBe(0.2);
      expect(lowRisk?.impact).toBe(0.3);
    });
  });

  describe('extractTechnicalRisks - 技术风险提取', () => {
    it('应该从风险描述中识别衰减风险', async () => {
      const proposal: TechnicalProposalResult = {
        ...createMockTechnicalProposalResult(),
        risks: [
          '电池容量随时间衰减（约2%/年），影响第8-10年收益',
        '并网接入流程复杂',
        '储能技术快速迭代',
        '安全风险',
      ],
      };

      const risks = await (agent as any).extractTechnicalRisks(proposal);

      const degradationRisk = risks.find(r => r.description.includes('衰减'));
      expect(degradationRisk?.likelihood).toBe(0.8);
      expect(degradationRisk?.impact).toBe(0.6);
    });

    it('应该从风险描述中识别安全风险', async () => {
      const proposal: TechnicalProposalResult = {
        ...createMockTechnicalProposalResult(),
        risks: ['电池热失控安全风险，需要完善消防和监控系统'],
      };

      const risks = await (agent as any).extractTechnicalRisks(proposal);

      const safetyRisk = risks.find(r => r.description.includes('安全'));
      expect(safetyRisk?.impact).toBe(0.9); // 安全风险影响高
    });
  });

  describe('extractFinancialRisks - 财务风险提取', () => {
    it('应该从低IRR中识别财务风险', async () => {
      const metrics: FinancialMetrics = {
        ...createMockFinancialMetrics(),
        irr: 5.5, // 低于6%
      };

      const risks = await (agent as any).extractFinancialRisks(metrics);

      const lowIRR = risks.find(r => r.category === 'financial' && r.description.includes('IRR较低'));
      expect(lowIRR).toBeDefined();
      expect(lowIRR?.level).toBe('high');
    });

    it('应该从异常高IRR中识别风险', async () => {
      const metrics: FinancialMetrics = {
        ...createMockFinancialMetrics(),
        irr: 18, // 高于15%
      };

      const risks = await (agent as any).extractFinancialRisks(metrics);

      const highIRR = risks.find(r => r.category === 'financial' && r.description.includes('IRR异常高'));
      expect(highIRR).toBeDefined();
      expect(highIRR?.level).toBe('low');
    });

    it('应该从负NPV中识别critical风险', async () => {
      const metrics: FinancialMetrics = {
        ...createMockFinancialMetrics(),
        npv: -100000, // 负NPV
      };

      const risks = await (agent as any).extractFinancialRisks(metrics);

      const negativeNPV = risks.find(r => r.description.includes('NPV为负'));
      expect(negativeNPV).toBeDefined();
      expect(negativeNPV?.level).toBe('critical');
    });
  });

  describe('extractOperationalRisks - 运营风险提取', () => {
    it('应该返回所有基础运营风险', async () => {
      const project = createMockProject();

      const risks = await (agent as any).extractOperationalRisks(project);

      expect(risks.length).toBe(3); // 维护、人员、安全

      const riskTypes = risks.map(r => r.description);
      expect(riskTypes.some(t => t.includes('设备故障'))).toBe(true);
      expect(riskTypes.some(t => t.includes('运维人员'))).toBe(true);
      expect(riskTypes.some(t => t.includes('安全事故'))).toBe(true);
    });
  });

  describe('calculateRiskScores - 风险评分', () => {
    it('应该正确计算风险得分', async () => {
      const risks = [
        {
          category: 'credit' as const,
          source: 'test',
          description: 'Test risk',
          likelihood: 0.5,
          impact: 0.8,
          score: 0,
          level: 'medium' as const,
          mitigation: 'Test mitigation',
        },
      ];

      const scoredRisks = await (agent as any).calculateRiskScores(risks);

      expect(scoredRisks[0].score).toBe(40); // 0.5 * 0.8 * 100
      expect(scoredRisks[0].level).toBe('medium');
    });

    it('应该正确分类风险等级', async () => {
      const testCases = [
        { likelihood: 0.1, impact: 0.1, expectedLevel: 'low' }, // score: 1
        { likelihood: 0.5, impact: 0.8, expectedLevel: 'medium' }, // score: 40
        { likelihood: 0.8, impact: 0.8, expectedLevel: 'high' }, // score: 64
        { likelihood: 0.9, impact: 0.9, expectedLevel: 'critical' }, // score: 81
      ];

      for (const tc of testCases) {
        const risks = [
          {
            category: 'test' as const,
            source: 'test',
            description: 'Test',
            likelihood: tc.likelihood,
            impact: tc.impact,
            score: 0,
            level: 'low' as const,
            mitigation: 'Test',
          },
        ];

        const scoredRisks = await (agent as any).calculateRiskScores(risks);
        expect(scoredRisks[0].level).toBe(tc.expectedLevel);
      }
    });
  });

  describe('generateRiskMatrix - 风险矩阵', () => {
    it('应该正确分类风险到矩阵', async () => {
      const risks = [
        { category: 'test' as const, source: 'low', description: 'Low risk', likelihood: 0.1, impact: 0.1, score: 1, level: 'low' as const, mitigation: 'Test' },
        { category: 'test' as const, source: 'medium', description: 'Medium risk', likelihood: 0.5, impact: 0.5, score: 25, level: 'medium' as const, mitigation: 'Test' },
        { category: 'test' as const, source: 'high', description: 'High risk', likelihood: 0.8, impact: 0.8, score: 64, level: 'high' as const, mitigation: 'Test' },
        { category: 'test' as const, source: 'critical', description: 'Critical risk', likelihood: 0.9, impact: 0.9, score: 81, level: 'critical' as const, mitigation: 'Test' },
      ];

      const matrix = await (agent as any).generateRiskMatrix(risks);

      expect(matrix.low).toHaveLength(1);
      expect(matrix.medium).toHaveLength(1);
      expect(matrix.high).toHaveLength(1);
      expect(matrix.critical).toHaveLength(1);
    });
  });

  describe('calculateOverallRating - 整体评级', () => {
    it('应该正确计算整体风险评分', async () => {
      const risks = [
        { category: 'test' as const, source: 'test', description: 'Risk 1', likelihood: 0.5, impact: 0.5, score: 25, level: 'medium' as const, mitigation: 'Test' },
        { category: 'test' as const, source: 'test', description: 'Risk 2', likelihood: 0.5, impact: 0.5, score: 25, level: 'medium' as const, mitigation: 'Test' },
      ];

      const rating = await (agent as any).calculateOverallRating(risks);

      expect(rating.score).toBe(25); // (25 + 25) / 2
      expect(rating.level).toBe('low');
      expect(rating.confidence).toBe(0.2); // 2 / 10
    });

    it('应该处理空风险列表', async () => {
      const rating = await (agent as any).calculateOverallRating([]);

      expect(rating.score).toBe(0);
      expect(rating.level).toBe('low');
      expect(rating.confidence).toBe(1.0);
    });

    it('应该正确分类整体等级', async () => {
      const testCases = [
        { avgScore: 10, expectedLevel: 'low' },
        { avgScore: 40, expectedLevel: 'medium' },
        { avgScore: 60, expectedLevel: 'high' },
        { avgScore: 80, expectedLevel: 'critical' },
      ];

      for (const tc of testCases) {
        const risks = [
          { category: 'test' as const, source: 'test', description: 'Risk', likelihood: 0.5, impact: 0.5, score: Math.round(tc.avgScore), level: 'low' as const, mitigation: 'Test' },
        ];

        const rating = await (agent as any).calculateOverallRating(risks);
        expect(rating.level).toBe(tc.expectedLevel);
      }
    });
  });

  describe('calculateRiskDistribution - 风险分布', () => {
    it('应该正确统计各类风险数量', async () => {
      const risks = [
        { category: 'financial' as const, source: 'test', description: 'Risk 1', likelihood: 0.5, impact: 0.5, score: 25, level: 'medium' as const, mitigation: 'Test' },
        { category: 'financial' as const, source: 'test', description: 'Risk 2', likelihood: 0.5, impact: 0.5, score: 25, level: 'medium' as const, mitigation: 'Test' },
        { category: 'technical' as const, source: 'test', description: 'Risk 3', likelihood: 0.5, impact: 0.5, score: 25, level: 'medium' as const, mitigation: 'Test' },
        { category: 'policy' as const, source: 'test', description: 'Risk 4', likelihood: 0.5, impact: 0.5, score: 25, level: 'medium' as const, mitigation: 'Test' },
        { category: 'credit' as const, source: 'test', description: 'Risk 5', likelihood: 0.5, impact: 0.5, score: 25, level: 'medium' as const, mitigation: 'Test' },
        { category: 'operational' as const, source: 'test', description: 'Risk 6', likelihood: 0.5, impact: 0.5, score: 25, level: 'medium' as const, mitigation: 'Test' },
      ];

      const distribution = await (agent as any).calculateRiskDistribution(risks);

      expect(distribution.financial).toBe(2);
      expect(distribution.technical).toBe(1);
      expect(distribution.policy).toBe(1);
      expect(distribution.credit).toBe(1);
      expect(distribution.operational).toBe(1);
    });
  });

  describe('generateMitigationStrategies - 缓解策略', () => {
    it('应该生成标准缓解策略', async () => {
      const risks = [
        { category: 'test' as const, source: 'test', description: 'Test risk', likelihood: 0.5, impact: 0.5, score: 25, level: 'medium' as const, mitigation: 'Test mitigation' },
      ];

      const rating = {
        score: 25,
        level: 'medium' as const,
        confidence: 0.8,
      };

      const strategies = await (agent as any).generateMitigationStrategies(risks, rating);

      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies.length).toBe(4); // 合同、技术、财务、运营

      const aspects = strategies.map(s => s.aspect);
      expect(aspects).toContain('合同层面');
      expect(aspects).toContain('技术层面');
      expect(aspects).toContain('财务层面');
      expect(aspects).toContain('运营层面');
    });
  });

  describe('createContingencyPlans - 应急计划', () => {
    it('应该为严重风险创建应急计划', async () => {
      const risks = [
        { category: 'test' as const, source: 'test', description: 'Critical risk 1', likelihood: 0.8, impact: 0.8, score: 64, level: 'high' as const, mitigation: 'Mitigation 1' },
        { category: 'test' as const, source: 'test', description: 'Critical risk 2', likelihood: 0.9, impact: 0.9, score: 81, level: 'critical' as const, mitigation: 'Mitigation 2' },
        { category: 'test' as const, source: 'test', description: 'Critical risk 3', likelihood: 0.7, impact: 0.8, score: 56, level: 'high' as const, mitigation: 'Mitigation 3' },
        { category: 'test' as const, source: 'test', description: 'Low risk', likelihood: 0.1, impact: 0.1, score: 1, level: 'low' as const, mitigation: 'Mitigation 4' },
      ];

      const plans = await (agent as any).createContingencyPlans(risks);

      // 应该为前3个严重风险创建计划
      expect(plans.length).toBe(3);

      // 验证计划结构
      expect(plans[0].trigger).toBeDefined();
      expect(plans[0].actions).toBeInstanceOf(Array);
      expect(plans[0].expectedOutcome).toBeDefined();
    });

    it('应该在没有严重风险时创建通用应急计划', async () => {
      const risks = [
        { category: 'test' as const, source: 'test', description: 'Low risk', likelihood: 0.1, impact: 0.1, score: 1, level: 'low' as const, mitigation: 'Mitigation' },
      ];

      const plans = await (agent as any).createContingencyPlans(risks);

      expect(plans.length).toBe(1);
      expect(plans[0].trigger).toBe('任何风险事件发生');
      expect(plans[0].actions.length).toBeGreaterThan(0);
    });
  });

  describe('metadata - 元数据', () => {
    it('应该正确填充元数据', async () => {
      const input: RiskAssessmentInput = {
        dueDiligenceReport: createMockDueDiligenceResult(),
        policyAnalysisReport: createMockPolicyAnalysisResult(),
        technicalProposal: createMockTechnicalProposalResult(),
        projectInfo: createMockProject(),
        financialMetrics: createMockFinancialMetrics(),
      };

      const result = await agent.assessRisks(input);

      expect(result.metadata.dataSource).toBe('All agents + financial analysis');
      expect(result.metadata.totalRisks).toBe(result.risks.length);
      expect(result.metadata.riskDistribution).toBeDefined();
      expect(result.metadata.reportGenerated).toBeInstanceOf(Date);
    });
  });

  describe('边缘情况', () => {
    it('应该处理空的dueDiligenceReport', async () => {
      const input: RiskAssessmentInput = {
        dueDiligenceReport: undefined,
        projectInfo: createMockProject(),
      };

      const result = await agent.assessRisks(input);

      expect(result.risks).toBeDefined();
    });

    it('应该处理空的policyAnalysisReport', async () => {
      const input: RiskAssessmentInput = {
        policyAnalysisReport: undefined,
        projectInfo: createMockProject(),
      };

      const result = await agent.assessRisks(input);

      expect(result.risks).toBeDefined();
    });

    it('应该处理空的technicalProposal', async () => {
      const input: RiskAssessmentInput = {
        technicalProposal: undefined,
        projectInfo: createMockProject(),
      };

      const result = await agent.assessRisks(input);

      expect(result.risks).toBeDefined();
    });

    it('应该处理空的financialMetrics', async () => {
      const input: RiskAssessmentInput = {
        financialMetrics: undefined,
        projectInfo: createMockProject(),
      };

      const result = await agent.assessRisks(input);

      expect(result.risks).toBeDefined();
    });

    it('应该处理空的risks数组', async () => {
      const report: PolicyAnalysisResult = {
        ...createMockPolicyAnalysisResult(),
        risks: [],
      };

      const risks = await (agent as any).extractPolicyRisks(report);

      expect(risks).toEqual([]);
    });

    it('应该处理null的IRR', async () => {
      const metrics: FinancialMetrics = {
        ...createMockFinancialMetrics(),
        irr: null,
      };

      const risks = await (agent as any).extractFinancialRisks(metrics);

      // 不应该添加IRR相关风险
      const irrRisks = risks.filter(r => r.description.includes('IRR'));
      expect(irrRisks).toEqual([]);
    });
  });
});
