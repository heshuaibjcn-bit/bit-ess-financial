/**
 * Risk Assessment Agent - Comprehensive Project Risk Evaluation
 *
 * Synthesizes risks from all dimensions and generates comprehensive assessment:
 * - Due diligence risks (owner credit, financial health)
 * - Policy risks (tariff changes, regulatory shifts)
 * - Technical risks (equipment performance, degradation)
 * - Financial risks (IRR sensitivity, cost overruns)
 * - Operational risks (maintenance, staffing)
 *
 * Generates:
 * - Risk matrix (low/medium/high/critical)
 * - Detailed risk assessments with scores
 * - Mitigation strategies
 * - Contingency plans
 */

import { NanoAgent } from './NanoAgent';
import type { DueDiligenceResult } from './DueDiligenceAgent';
import type { PolicyAnalysisResult } from './PolicyAnalysisAgent';
import type { TechnicalProposalResult } from './TechnicalProposalAgent';
import type { Project } from '@/domain/models/Project';
import type { FinancialMetrics } from '@/domain/services/FinancialCalculator';

export type RiskAssessmentInput = {
  dueDiligenceReport?: DueDiligenceResult;
  policyAnalysisReport?: PolicyAnalysisResult;
  technicalProposal?: TechnicalProposalResult;
  projectInfo: Project;
  financialMetrics?: FinancialMetrics;
};

export type RiskAssessmentResult = {
  // Risk matrix
  riskMatrix: {
    low: string[];
    medium: string[];
    high: string[];
    critical: string[];
  };

  // Detailed risks
  risks: Array<{
    category: 'financial' | 'technical' | 'policy' | 'credit' | 'operational';
    source: string; // Which agent/module identified this risk
    description: string;
    likelihood: number; // 0-1
    impact: number; // 0-1
    score: number; // 0-100 (likelihood * impact * 100)
    level: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string;
  }>;

  // Overall rating
  overallRating: {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-1
  };

  // Mitigation strategies
  mitigationStrategies: Array<{
    aspect: string;
    strategy: string;
    effectiveness: 'high' | 'medium' | 'low';
    cost: 'high' | 'medium' | 'low';
  }>;

  // Contingency plans
  contingencyPlans: Array<{
    trigger: string;
    actions: string[];
    expectedOutcome: string;
  }>;

  // Metadata
  metadata: {
    dataSource: string;
    reportGenerated: Date;
    totalRisks: number;
    riskDistribution: Record<string, number>;
  };
};

// Risk scoring thresholds
const RISK_THRESHOLDS = {
  low: { min: 0, max: 25 },
  medium: { min: 26, max: 50 },
  high: { min: 51, max: 75 },
  critical: { min: 76, max: 100 },
};

export class RiskAssessmentAgent extends NanoAgent {
  constructor() {
    super({
      name: 'RiskAssessmentAgent',
      description: 'Comprehensive risk assessment and mitigation planning agent',
      version: '1.0.0',
      model: 'glm-4-flash',
      maxTokens: 6144,
      temperature: 0.3,
      systemPrompt: `You are a Risk Assessment Specialist for energy storage investment projects. Your role is to:

1. Collect and synthesize risks from all dimensions
2. Calculate risk scores using a consistent methodology
3. Generate a comprehensive risk matrix
4. Develop mitigation strategies for each risk
5. Create contingency plans for critical scenarios

Risk assessment methodology:
- **Risk Score** = Likelihood × Impact × Weight
- **Likelihood**: 0-1 (0% to 100% probability)
- **Impact**: 0-1 (negligible to catastrophic)
- **Weight**: Category importance multiplier (default: 1.0)

Risk levels:
- **Low** (0-25): Acceptable with monitoring
- **Medium** (26-50): Requires mitigation measures
- **High** (51-75): Significant concern, requires strong mitigation
- **Critical** (76-100): Project viability threatened, may reconsider

Risk categories:
1. **Credit Risk**: Owner payment capability, financial health
2. **Policy Risk**: Tariff changes, regulatory shifts
3. **Technical Risk**: Equipment performance, degradation, failure
4. **Financial Risk**: IRR sensitivity, cost overruns, revenue shortfall
5. **Operational Risk**: Maintenance, staffing, accidents

For each risk, provide:
- Clear description and source
- Quantified likelihood and impact
- Specific mitigation strategy
- Responsible party for implementation

Provide structured, actionable risk assessments with:
- Prioritized risk matrix (by score)
- Cross-cutting mitigation strategies
- Trigger-based contingency plans
- Clear risk ownership and accountability

Use professional risk management language. Base assessments on evidence from due diligence, policy analysis, and technical evaluation.`,
    });
  }

  /**
   * Main assessment method
   */
  async assessRisks(input: RiskAssessmentInput): Promise<RiskAssessmentResult> {
    this.log('Starting comprehensive risk assessment');

    // Step 1: Collect risks from all sources
    const risks = await this.collectAllRisks(input);

    // Step 2: Calculate risk scores
    const scoredRisks = await this.calculateRiskScores(risks);

    // Step 3: Generate risk matrix
    const riskMatrix = this.generateRiskMatrix(scoredRisks);

    // Step 4: Calculate overall rating
    const overallRating = this.calculateOverallRating(scoredRisks);

    // Step 5: Generate mitigation strategies
    const mitigationStrategies = await this.generateMitigationStrategies(
      scoredRisks,
      overallRating
    );

    // Step 6: Create contingency plans
    const contingencyPlans = await this.createContingencyPlans(scoredRisks);

    // Risk distribution
    const riskDistribution = this.calculateRiskDistribution(scoredRisks);

    return {
      riskMatrix,
      risks: scoredRisks,
      overallRating,
      mitigationStrategies,
      contingencyPlans,
      metadata: {
        dataSource: 'All agents + financial analysis',
        reportGenerated: new Date(),
        totalRisks: scoredRisks.length,
        riskDistribution,
      },
    };
  }

  /**
   * Collect risks from all sources
   */
  private async collectAllRisks(
    input: RiskAssessmentInput
  ): Promise<Array<RiskAssessmentResult['risks'][0]>> {
    this.log('Collecting risks from all sources');

    const risks: Array<RiskAssessmentResult['risks'][0]> = [];

    // 1. Credit risks from due diligence
    if (input.dueDiligenceReport) {
      const creditRisks = this.extractCreditRisks(input.dueDiligenceReport);
      risks.push(...creditRisks);
    }

    // 2. Policy risks from policy analysis
    if (input.policyAnalysisReport) {
      const policyRisks = this.extractPolicyRisks(input.policyAnalysisReport);
      risks.push(...policyRisks);
    }

    // 3. Technical risks from technical proposal
    if (input.technicalProposal) {
      const technicalRisks = this.extractTechnicalRisks(input.technicalProposal);
      risks.push(...technicalRisks);
    }

    // 4. Financial risks from financial metrics
    if (input.financialMetrics) {
      const financialRisks = this.extractFinancialRisks(input.financialMetrics);
      risks.push(...financialRisks);
    }

    // 5. Operational risks (always assessed)
    const operationalRisks = this.extractOperationalRisks(input.projectInfo);
    risks.push(...operationalRisks);

    return risks;
  }

  /**
   * Extract credit risks from due diligence report
   */
  private extractCreditRisks(
    report: DueDiligenceResult
  ): Array<RiskAssessmentResult['risks'][0]> {
    const risks: Array<RiskAssessmentResult['risks'][0]> = [];

    // Payment history risk
    if (report.paymentHistory.latePayments > 3) {
      risks.push({
        category: 'credit',
        source: '业主尽调',
        description: `存在${report.paymentHistory.latePayments}次逾期付款记录`,
        likelihood: Math.min(0.5, report.paymentHistory.latePayments / 10),
        impact: 0.7, // High impact on cash flow
        score: 0,
        level: 'medium',
        mitigation: '合同严格付款条款，收取20%预付款，建立专用账户监管',
      });
    }

    // Credit rating risk
    if (report.creditRating.score < 60) {
      risks.push({
        category: 'credit',
        source: '业主尽调',
        description: `信用评分较低（${report.creditRating.score}分）`,
        likelihood: 0.4,
        impact: 0.8,
        score: 0,
        level: 'high',
        mitigation: '要求提供担保或抵押，缩短付款周期，加强催收管理',
      });
    }

    // Litigation risk
    if (report.paymentHistory.litigation > 2) {
      risks.push({
        category: 'credit',
        source: '业主尽调',
        description: `涉及${report.paymentHistory.litigation}起诉讼`,
        likelihood: 0.3,
        impact: 0.5,
        score: 0,
        level: 'medium',
        mitigation: '合作前确认诉讼状态，评估潜在影响',
      });
    }

    return risks;
  }

  /**
   * Extract policy risks from policy analysis report
   */
  private extractPolicyRisks(
    report: PolicyAnalysisResult
  ): Array<RiskAssessmentResult['risks'][0]> {
    const risks: Array<RiskAssessmentResult['risks'][0]> = [];

    for (const risk of report.risks) {
      const likelihood = risk.level === 'high' ? 0.6 : risk.level === 'medium' ? 0.4 : 0.2;
      const impact = risk.level === 'high' ? 0.8 : risk.level === 'medium' ? 0.5 : 0.3;

      risks.push({
        category: 'policy',
        source: '政策分析',
        description: risk.description,
        likelihood,
        impact,
        score: 0,
        level: risk.level,
        mitigation: risk.response,
      });
    }

    return risks;
  }

  /**
   * Extract technical risks from technical proposal
   */
  private extractTechnicalRisks(
    proposal: TechnicalProposalResult
  ): Array<RiskAssessmentResult['risks'][0]> {
    const risks: Array<RiskAssessmentResult['risks'][0]> = [];

    for (const riskDesc of proposal.risks) {
      // Parse risk description to estimate likelihood and impact
      let likelihood = 0.3;
      let impact = 0.5;

      if (riskDesc.includes('衰减')) {
        likelihood = 0.8; // Degradation is certain
        impact = 0.6;
      } else if (riskDesc.includes('质量')) {
        likelihood = 0.4;
        impact = 0.7;
      } else if (riskDesc.includes('并网')) {
        likelihood = 0.5;
        impact = 0.6;
      } else if (riskDesc.includes('安全')) {
        likelihood = 0.2;
        impact = 0.9; // Safety issues have high impact
      } else if (riskDesc.includes('技术')) {
        likelihood = 0.3;
        impact = 0.5;
      }

      risks.push({
        category: 'technical',
        source: '技术方案',
        description: riskDesc,
        likelihood,
        impact,
        score: 0,
        level: 'medium',
        mitigation: '选择可靠品牌和供应商，建立质量监控体系',
      });
    }

    return risks;
  }

  /**
   * Extract financial risks from financial metrics
   */
  private extractFinancialRisks(
    metrics: FinancialMetrics
  ): Array<RiskAssessmentResult['risks'][0]> {
    const risks: Array<RiskAssessmentResult['risks'][0]> = [];

    // IRR risk
    if (metrics.irr !== null) {
      if (metrics.irr < 6) {
        risks.push({
          category: 'financial',
          source: '财务分析',
          description: `IRR较低（${metrics.irr.toFixed(1)}%），投资回报期长`,
          likelihood: 0.5,
          impact: 0.7,
          score: 0,
          level: 'high',
          mitigation: '优化系统配置，降低投资成本，寻找更高收益场景',
        });
      } else if (metrics.irr > 15) {
        risks.push({
          category: 'financial',
          source: '财务分析',
          description: `IRR异常高（${metrics.irr.toFixed(1)}%），可能存在假设乐观`,
          likelihood: 0.3,
          impact: 0.5,
          score: 0,
          level: 'low',
          mitigation: '使用保守假设进行敏感性分析，验证结果合理性',
        });
      }
    }

    // NPV risk
    if (metrics.npv < 0) {
      risks.push({
        category: 'financial',
        source: '财务分析',
        description: `NPV为负（${metrics.npv.toFixed(0)}元），项目 destroys value`,
        likelihood: 0.6,
        impact: 0.9,
        score: 0,
        level: 'critical',
        mitigation: '重新评估项目可行性，考虑降低投资或寻找更高收益场景',
      });
    }

    return risks;
  }

  /**
   * Extract operational risks
   */
  private extractOperationalRisks(
    project: Project
  ): Array<RiskAssessmentResult['risks'][0]> {
    const risks: Array<RiskAssessmentResult['risks'][0]> = [];

    // Maintenance risk
    risks.push({
      category: 'operational',
      source: '运营分析',
      description: '设备故障或维护不当导致停机损失',
      likelihood: 0.4,
      impact: 0.5,
      score: 0,
      level: 'medium',
      mitigation: '建立预防性维护计划，签订长期运维服务协议',
    });

    // Staffing risk
    risks.push({
      category: 'operational',
      source: '运营分析',
      description: '运维人员专业能力不足',
      likelihood: 0.3,
      impact: 0.4,
      score: 0,
      level: 'low',
      mitigation: '委托专业运维公司，加强人员培训',
    });

    // Safety risk
    risks.push({
      category: 'operational',
      source: '运营分析',
      description: '安全事故（火灾、触电等）',
      likelihood: 0.1,
      impact: 0.9,
      score: 0,
      level: 'medium',
      mitigation: '完善消防系统，定期安全检查，购买相关保险',
    });

    return risks;
  }

  /**
   * Calculate risk scores for all risks
   */
  private async calculateRiskScores(
    risks: Array<RiskAssessmentResult['risks'][0]>
  ): Promise<Array<RiskAssessmentResult['risks'][0]>> {
    return risks.map(risk => {
      const score = Math.round(risk.likelihood * risk.impact * 100);

      // Determine level based on score
      let level: 'low' | 'medium' | 'high' | 'critical';
      if (score <= RISK_THRESHOLDS.low.max) {
        level = 'low';
      } else if (score <= RISK_THRESHOLDS.medium.max) {
        level = 'medium';
      } else if (score <= RISK_THRESHOLDS.high.max) {
        level = 'high';
      } else {
        level = 'critical';
      }

      return {
        ...risk,
        score,
        level,
      };
    });
  }

  /**
   * Generate risk matrix
   */
  private generateRiskMatrix(
    risks: Array<RiskAssessmentResult['risks'][0]>
  ): RiskAssessmentResult['riskMatrix'] {
    const matrix: RiskAssessmentResult['riskMatrix'] = {
      low: [],
      medium: [],
      high: [],
      critical: [],
    };

    for (const risk of risks) {
      matrix[risk.level].push(`${risk.source}: ${risk.description}`);
    }

    return matrix;
  }

  /**
   * Calculate overall risk rating
   */
  private calculateOverallRating(
    risks: Array<RiskAssessmentResult['risks'][0]>
  ): RiskAssessmentResult['overallRating'] {
    if (risks.length === 0) {
      return {
        score: 0,
        level: 'low',
        confidence: 1.0,
      };
    }

    // Weighted average score
    const totalScore = risks.reduce((sum, risk) => sum + risk.score, 0);
    const avgScore = totalScore / risks.length;

    // Determine level
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (avgScore <= 25) {
      level = 'low';
    } else if (avgScore <= 50) {
      level = 'medium';
    } else if (avgScore <= 75) {
      level = 'high';
    } else {
      level = 'critical';
    }

    // Confidence based on number of risks
    const confidence = Math.min(1.0, risks.length / 10);

    return {
      score: Math.round(avgScore),
      level,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * Calculate risk distribution by category
   */
  private calculateRiskDistribution(
    risks: Array<RiskAssessmentResult['risks'][0]>
  ): Record<string, number> {
    const distribution: Record<string, number> = {
      financial: 0,
      technical: 0,
      policy: 0,
      credit: 0,
      operational: 0,
    };

    for (const risk of risks) {
      distribution[risk.category]++;
    }

    return distribution;
  }

  /**
   * Generate mitigation strategies
   */
  private async generateMitigationStrategies(
    risks: Array<RiskAssessmentResult['risks'][0]>,
    overallRating: RiskAssessmentResult['overallRating']
  ): Promise<RiskAssessmentResult['mitigationStrategies']> {
    this.log('Generating mitigation strategies');

    const strategies: RiskAssessmentResult['mitigationStrategies'] = [];

    // Contract-level strategies
    strategies.push({
      aspect: '合同层面',
      strategy: '设置分阶段付款条款，严格违约责任和担保措施',
      effectiveness: 'high',
      cost: 'low',
    });

    // Technical-level strategies
    strategies.push({
      aspect: '技术层面',
      strategy: '选择可靠品牌设备，预留容量冗余，建立健康监测',
      effectiveness: 'high',
      cost: 'medium',
    });

    // Financial-level strategies
    strategies.push({
      aspect: '财务层面',
      strategy: '建立专用账户监管，收取预付款，购买相关保险',
      effectiveness: 'high',
      cost: 'low',
    });

    // Operational-level strategies
    strategies.push({
      aspect: '运营层面',
      strategy: '委托专业运维，建立应急预案，定期培训演练',
      effectiveness: 'medium',
      cost: 'medium',
    });

    return strategies;
  }

  /**
   * Create contingency plans
   */
  private async createContingencyPlans(
    risks: Array<RiskAssessmentResult['risks'][0]>
  ): Promise<RiskAssessmentResult['contingencyPlans']> {
    this.log('Creating contingency plans');

    const plans: RiskAssessmentResult['contingencyPlans'] = [];

    // Find high and critical risks
    const severeRisks = risks.filter(r => r.level === 'high' || r.level === 'critical');

    for (const risk of severeRisks.slice(0, 3)) {
      plans.push({
        trigger: risk.description,
        actions: [
          '立即评估影响范围和程度',
          '启动应急响应小组',
          '实施预先制定的应对措施',
          '通知相关利益方',
        ],
        expectedOutcome: '最大程度减少损失，保护投资安全',
      });
    }

    // Generic contingency plan
    if (severeRisks.length === 0) {
      plans.push({
        trigger: '任何风险事件发生',
        actions: [
          '评估事件严重性',
          '根据预案采取相应措施',
          '记录事件和应对过程',
          '事后总结和改进',
        ],
        expectedOutcome: '快速响应，有效控制',
      });
    }

    return plans;
  }
}
