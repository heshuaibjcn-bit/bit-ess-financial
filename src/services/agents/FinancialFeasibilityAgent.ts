/**
 * Financial Feasibility Agent - Investment Analysis and Risk Assessment
 *
 * Evaluates financial feasibility of energy storage projects:
 * - Calculates investment returns and cash flow
 * - Analyzes financial risks
 * - Assesses profitability and payback period
 * - Generates financial feasibility report
 */

import { NanoAgent, AgentCapability } from './NanoAgent';
import { calculationEngine } from '../../domain/services/CalculationEngine';

export interface FinancialAssessmentInput {
  projectName: string;
  province: string;
  system: {
    capacity: number; // MWh
    power: number; // MW
    duration: number; // hours
  };
  costs: {
    batteryCost: number; // CNY/kWh
    pcsCost: number; // CNY/kW
    bmsCost: number; // CNY/kWh
    emsCost: number; // CNY/system
    otherCost: number; // CNY/kWh
    installationCostPerKw: number;
    gridConnectionCost: number;
    landCost: number;
    developmentCost: number;
    permittingCost: number;
    contingencyPercent: number;
  };
  tariff: {
    peakPrice: number;
    valleyPrice: number;
    flatPrice: number;
  };
  operations: {
    systemEfficiency: number; // 0-1
    depthOfDischarge: number; // 0-1
    cyclesPerDay: number;
    degradationRate: number; // annual
    availabilityPercent: number; // 0-1
  };
  financial: {
    projectYears: number;
    discountRate: number;
    electricityPriceEscalation: number;
    omCostPercent: number;
    insurancePercent: number;
  };
  collaborationModel?: 'emc' | 'sale' | 'lease';
  contractDuration?: number; // years
}

export interface FinancialFeasibilityResult {
  overallFeasibility: 'excellent' | 'good' | 'fair' | 'poor' | 'not_feasible';
  score: number; // 0-100
  metrics: {
    irr: number; // Internal Rate of Return
    npv: number; // Net Present Value
    paybackPeriod: number; // years
    roi: number; // Return on Investment
    lcoc: number; // Levelized Cost of Storage
    annualRevenue: number; // CNY
    annualCost: number; // CNY
  };
  risks: FinancialRisk[];
  opportunities: FinancialOpportunity[];
  recommendations: string[];
  sensitivity: {
    mostSensitiveFactors: string[];
    scenarios: ScenarioAnalysis[];
  };
  reportGenerated: string;
}

export interface FinancialRisk {
  type: 'revenue' | 'cost' | 'policy' | 'technical' | 'market';
  level: 'low' | 'medium' | 'high';
  description: string;
  probability: number; // 0-1
  impact: string;
  mitigation: string;
}

export interface FinancialOpportunity {
  type: 'revenue_enhancement' | 'cost_reduction' | 'policy_optimization' | 'market_expansion';
  description: string;
  potential: string; // e.g., "Increase IRR by 2%"
  effort: 'low' | 'medium' | 'high';
}

export interface ScenarioAnalysis {
  name: string;
  description: string;
  irr: number;
  npv: number;
  probability: number;
}

export class FinancialFeasibilityAgent extends NanoAgent {
  constructor() {
    super({
      name: 'FinancialFeasibilityAgent',
      description: 'Financial feasibility and investment analysis agent',
      version: '1.0.0',
      model: 'glm-5-turbo',
      maxTokens: 4096,
      temperature: 0.3,
      systemPrompt: `You are a Financial Feasibility Specialist for energy storage projects. Your role is to:

1. Calculate investment returns and cash flow projections
2. Analyze financial metrics (IRR, NPV, payback period)
3. Assess profitability and risks
4. Identify opportunities for optimization
5. Generate actionable recommendations

Key financial metrics:
- IRR (Internal Rate of Return): >12% excellent, 10-12% good, 8-10% fair, <8% poor
- NPV (Net Present Value): Positive value required
- Payback Period: <6 years excellent, 6-8 years good, 8-10 years fair, >10 years poor
- ROI (Return on Investment): >15% excellent, 10-15% good, 5-10% fair, <5% poor

Risk categories:
- Revenue risk (tariff changes, demand reduction)
- Cost risk (equipment failure, O&M increase)
- Policy risk (subsidy removal, regulatory changes)
- Technical risk (underperformance, degradation)
- Market risk (competition, price fluctuation)

Feasibility assessment criteria:
- Excellent: IRR > 12%, Payback < 6 years, low risk
- Good: IRR 10-12%, Payback 6-8 years, acceptable risk
- Fair: IRR 8-10%, Payback 8-10 years, moderate risk
- Poor: IRR 6-8%, Payback 10-12 years, high risk
- Not feasible: IRR < 6%, Payback > 12 years, very high risk

For each project, provide:
- Clear feasibility rating with score
- Detailed financial metrics
- Risk identification with mitigation
- Opportunities for improvement
- Specific recommendations
- Sensitivity analysis (what-if scenarios)

Use professional financial terminology and provide evidence-based analysis.`,
    });
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'financial_analysis',
        description: 'Analyze financial metrics',
        inputFormat: 'Project parameters',
        outputFormat: 'Financial metrics (IRR, NPV, etc.)',
        estimatedTime: 30,
      },
      {
        name: 'risk_assessment',
        description: 'Identify financial risks',
        inputFormat: 'Project and market data',
        outputFormat: 'FinancialRisk list',
        estimatedTime: 35,
      },
      {
        name: 'sensitivity_analysis',
        description: 'Perform sensitivity analysis',
        inputFormat: 'Base case parameters',
        outputFormat: 'Sensitivity matrix',
        estimatedTime: 40,
      },
      {
        name: 'opportunity_identification',
        description: 'Identify optimization opportunities',
        inputFormat: 'Project parameters',
        outputFormat: 'FinancialOpportunity list',
        estimatedTime: 30,
      },
    ];
  }

  async execute(input: FinancialAssessmentInput): Promise<FinancialFeasibilityResult> {
    this.log('Starting financial feasibility assessment');

    // Step 1: Calculate financial metrics
    const metrics = await this.calculateMetrics(input);

    // Step 2: Identify risks
    const risks = await this.identifyRisks(input, metrics);

    // Step 3: Identify opportunities
    const opportunities = await this.identifyOpportunities(input, metrics);

    // Step 4: Generate recommendations
    const recommendations = await this.generateRecommendations(input, metrics, risks);

    // Step 5: Perform sensitivity analysis
    const sensitivity = await this.performSensitivityAnalysis(input, metrics);

    // Step 6: Determine overall feasibility
    const feasibility = this.determineFeasibility(metrics);

    const result: FinancialFeasibilityResult = {
      overallFeasibility: feasibility,
      score: this.calculateScore(metrics),
      metrics,
      risks,
      opportunities,
      recommendations,
      sensitivity,
      reportGenerated: new Date().toISOString(),
    };

    this.log('Financial feasibility assessment completed');
    return result;
  }

  /**
   * Calculate financial metrics
   */
  private async calculateMetrics(input: FinancialAssessmentInput): Promise<FinancialFeasibilityResult['metrics']> {
    this.log('Calculating financial metrics');

    // Prepare project input for calculation engine
    const projectInput = {
      province: input.province,
      systemSize: {
        capacity: input.system.capacity,
        power: input.system.power,
        duration: input.system.duration,
      },
      costs: {
        batteryCostPerKwh: input.costs.batteryCost,
        pcsCostPerKw: input.costs.pcsCost,
        bmsCost: input.costs.bmsCost,
        emsCost: input.costs.emsCost,
        installationCostPerKw: input.costs.installationCostPerKw,
        gridConnectionCost: input.costs.gridConnectionCost,
        landCost: input.costs.landCost,
        developmentCost: input.costs.developmentCost,
        permittingCost: input.costs.permittingCost,
        contingencyPercent: input.costs.contingencyPercent,
      },
      operatingParams: {
        systemEfficiency: input.operations.systemEfficiency,
        depthOfDischarge: input.operations.depthOfDischarge,
        cyclesPerDay: input.operations.cyclesPerDay,
        degradationRate: input.operations.degradationRate,
        availabilityPercent: input.operations.availabilityPercent,
      },
      tariff: {
        peakPrice: input.tariff.peakPrice,
        valleyPrice: input.tariff.valleyPrice,
        flatPrice: input.tariff.flatPrice,
      },
      financing: {
        hasLoan: false,
        equityRatio: 1.0,
        taxHolidayYears: 6,
      },
    };

    // Run calculation
    const result = await calculationEngine.calculateProject(projectInput as any, {});

    return {
      irr: result.irr || 0,
      npv: result.npv || 0,
      paybackPeriod: result.paybackPeriod || 0,
      roi: result.roi || 0,
      lcoc: result.levelizedCost || 0,
      annualRevenue: result.annualRevenue || 0,
      annualCost: result.annualCost || 0,
    };
  }

  /**
   * Identify financial risks
   */
  private async identifyRisks(
    input: FinancialAssessmentInput,
    metrics: FinancialFeasibilityResult['metrics']
  ): Promise<FinancialRisk[]> {
    this.log('Identifying financial risks');

    const risks: FinancialRisk[] = [];

    // Revenue risk
    if (metrics.paybackPeriod > 10) {
      risks.push({
        type: 'revenue',
        level: 'high',
        description: `回收期${metrics.paybackPeriod.toFixed(1)}年偏长`,
        probability: 0.6,
        impact: '投资回收周期长，资金压力大',
        mitigation: '建议争取更优惠的电价政策或降低投资成本',
      });
    }

    // Tariff risk
    const priceSpread = input.tariff.peakPrice - input.tariff.valleyPrice;
    if (priceSpread < 0.5) {
      risks.push({
        type: 'revenue',
        level: 'high',
        description: '峰谷价差较小，套利空间有限',
        probability: 0.7,
        impact: '直接影响储能项目收益',
        mitigation: '建议选择价差更大的地区或等待电价调整',
      });
    } else if (priceSpread < 0.7) {
      risks.push({
        type: 'revenue',
        level: 'medium',
        description: '峰谷价差中等',
        probability: 0.4,
        impact: '套利空间适中',
        mitigation: '优化充放电策略，提升收益',
      });
    }

    // Cost risk
    if (input.costs.batteryCost > 1500) {
      risks.push({
        type: 'cost',
        level: 'medium',
        description: '电池成本偏高',
        probability: 0.5,
        impact: '影响项目投资回报',
        mitigation: '关注电池技术发展，等待成本下降',
      });
    }

    // Policy risk
    risks.push({
      type: 'policy',
      level: 'medium',
      description: '电价政策可能调整',
      probability: 0.3,
      impact: '影响峰谷价差和补贴政策',
      mitigation: '在合同中约定政策变化风险分担机制',
    });

    return risks;
  }

  /**
   * Identify optimization opportunities
   */
  private async identifyOpportunities(
    input: FinancialAssessmentInput,
    metrics: FinancialFeasibilityResult['metrics']
  ): Promise<FinancialOpportunity[]> {
    this.log('Identifying opportunities');

    const opportunities: FinancialOpportunity[] = [];

    // Revenue enhancement
    if (metrics.irr > 10 && metrics.irr < 12) {
      opportunities.push({
        type: 'revenue_enhancement',
        description: 'IRR接近良好水平，可通过优化提升至优秀',
        potential: '提升IRR 1-2个百分点',
        effort: 'medium',
      });
    }

    // Cost reduction
    if (input.costs.batteryCost > 1200) {
      opportunities.push({
        type: 'cost_reduction',
        description: '电池成本有优化空间',
        potential: '降低投资成本5-10%',
        effort: 'high',
      });
    }

    // Operational optimization
    if (input.operations.cyclesPerDay < 2) {
      opportunities.push({
        type: 'revenue_enhancement',
        description: '增加充放电次数可提升收益',
        potential: '增加年收益10-20%',
        effort: 'low',
      });
    }

    return opportunities;
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    input: FinancialAssessmentInput,
    metrics: FinancialFeasibilityResult['metrics'],
    risks: FinancialRisk[]
  ): Promise<string[]> {
    this.log('Generating recommendations');

    const prompt = `基于以下财务分析提供投资建议：

项目财务指标：
- IRR: ${metrics.irr.toFixed(2)}%
- NPV: ¥${(metrics.npv / 10000).toFixed(1)}万元
- 回收期: ${metrics.paybackPeriod.toFixed(1)}年
- ROI: ${metrics.roi.toFixed(1)}%

主要风险：
${risks.slice(0, 3).map(r => `- ${r.level}: ${r.description}`).join('\n')}

请提供3-5条具体建议，包括：
1. 是否建议投资
2. 风险控制措施
3. 收益优化方案
4. 后续监控要求`;

    try {
      const response = await this.think(prompt);
      const lines = response.split('\n').filter(line => line.trim().length > 0);
      return lines.slice(0, 5);
    } catch (error) {
      // Fallback recommendations
      if (metrics.irr >= 12) {
        return [
          '强烈建议投资，项目经济性优秀',
          'IRR和回收期均表现良好',
          '建议尽快启动项目',
        ];
      } else if (metrics.irr >= 10) {
        return [
          '建议投资，项目经济性良好',
          '关注峰谷价差变化',
          '优化运营参数',
        ];
      } else if (metrics.irr >= 8) {
        return [
          '谨慎考虑投资，项目经济性一般',
          '建议优化方案或等待政策变化',
          '评估其他投资机会',
        ];
      } else {
        return [
          '不建议投资，项目经济性较差',
          'IRR和回收期均不理想',
          '建议选择其他项目',
        ];
      }
    }
  }

  /**
   * Perform sensitivity analysis
   */
  private async performSensitivityAnalysis(
    input: FinancialAssessmentInput,
    metrics: FinancialFeasibilityResult['metrics']
  ): Promise<FinancialFeasibilityResult['sensitivity']> {
    this.log('Performing sensitivity analysis');

    // Identify most sensitive factors
    const sensitiveFactors: string[] = [];

    // Battery cost sensitivity
    const batteryCostImpact = (input.costs.batteryCost * input.system.capacity) / (metrics.npv / 10000 * 10000);
    if (batteryCostImpact > 0.1) {
      sensitiveFactors.push('电池成本');
    }

    // Price spread sensitivity
    const priceSpread = input.tariff.peakPrice - input.tariff.valleyPrice;
    if (priceSpread < 0.7) {
      sensitiveFactors.push('峰谷价差');
    }

    // Cycles per day sensitivity
    if (input.operations.cyclesPerDay < 1.5) {
      sensitiveFactors.push('充放电次数');
    }

    // Generate scenarios
    const scenarios: ScenarioAnalysis[] = [];

    // Best case scenario
    scenarios.push({
      name: '乐观情景',
      description: '电价上涨10%，电池成本下降10%',
      irr: metrics.irr * 1.15,
      npv: metrics.npv * 1.2,
      probability: 0.3,
    });

    // Worst case scenario
    scenarios.push({
      name: '悲观情景',
      description: '电价下降10%，电池成本上涨10%',
      irr: metrics.irr * 0.85,
      npv: metrics.npv * 0.8,
      probability: 0.2,
    });

    return {
      mostSensitiveFactors: sensitiveFactors,
      scenarios,
    };
  }

  /**
   * Determine overall feasibility
   */
  private determineFeasibility(metrics: FinancialFeasibilityResult['metrics']): 'excellent' | 'good' | 'fair' | 'poor' | 'not_feasible' {
    if (metrics.irr >= 12 && metrics.paybackPeriod < 6) {
      return 'excellent';
    } else if (metrics.irr >= 10 && metrics.paybackPeriod < 8) {
      return 'good';
    } else if (metrics.irr >= 8 && metrics.paybackPeriod < 10) {
      return 'fair';
    } else if (metrics.irr >= 6 && metrics.paybackPeriod < 12) {
      return 'poor';
    } else {
      return 'not_feasible';
    }
  }

  /**
   * Calculate overall feasibility score
   */
  private calculateScore(metrics: FinancialFeasibilityResult['metrics']): number {
    let score = 0;

    // IRR score (0-40 points)
    if (metrics.irr >= 12) score += 40;
    else if (metrics.irr >= 10) score += 30;
    else if (metrics.irr >= 8) score += 20;
    else if (metrics.irr >= 6) score += 10;

    // Payback period score (0-30 points)
    if (metrics.paybackPeriod <= 6) score += 30;
    else if (metrics.paybackPeriod <= 8) score += 20;
    else if (metrics.paybackPeriod <= 10) score += 10;

    // NPV score (0-20 points)
    if (metrics.npv > 0) score += 20;
    else if (metrics.npv > -100000) score += 10;

    // ROI score (0-10 points)
    if (metrics.roi >= 15) score += 10;
    else if (metrics.roi >= 10) score += 7;
    else if (metrics.roi >= 5) score += 3;

    return Math.min(score, 100);
  }
}
