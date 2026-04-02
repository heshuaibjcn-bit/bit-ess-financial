/**
 * Policy Analysis Agent - Electricity Price Policy Analysis
 *
 * Analyzes electricity price policies and their impact on energy storage projects:
 * - Current policy structure analysis
 * - Policy stability assessment
 * - Policy trend prediction
 * - Impact on project IRR
 * - Risk and opportunity identification
 */

import { NanoAgent } from './NanoAgent';

export type PolicyAnalysisInput = {
  province: string;
  tariffType: 'industrial' | 'commercial' | 'residential';
  peakPrice: number;
  valleyPrice: number;
  priceSpread: number;
  hourlyPrices?: number[]; // 24-hour prices
  capacityCompensation?: number;
  demandResponseAvailable?: boolean;
};

export type PolicyAnalysisResult = {
  // Current policy
  currentPolicy: {
    tariffType: string;
    peakPrice: number;
    valleyPrice: number;
    priceSpread: number;
    capacityCompensation?: number;
    demandResponseAvailable: boolean;
  };

  // Policy stability
  stability: {
    rating: 'stable' | 'moderate' | 'unstable';
    confidence: number;
    factors: string[];
  };

  // Policy trend
  trend: {
    direction: 'stable' | 'improving' | 'declining';
    timeframe: string;
    keyChanges: string[];
  };

  // Impact on IRR
  impact: {
    onIRR: number; // percentage
    scenarios: Array<{
      scenario: string;
      irr: number;
    }>;
  };

  // Risks and opportunities
  risks: Array<{
    type: string;
    level: 'low' | 'medium' | 'high';
    description: string;
    response: string;
  }>;

  opportunities: Array<{
    type: string;
    description: string;
    potential: string;
  }>;

  // Recommendations
  recommendations: string[];

  // Metadata
  metadata: {
    dataSource: string;
    reportGenerated: Date;
    confidence: number;
  };
};

export class PolicyAnalysisAgent extends NanoAgent {
  constructor() {
    super({
      name: 'PolicyAnalysisAgent',
      description: 'Electricity price policy analysis and trend assessment agent',
      version: '1.0.0',
      model: 'glm-4-flash', // 使用更快的模型
      maxTokens: 6144,
      temperature: 0.3,
      systemPrompt: `You are an Electricity Price Policy Analyst for Chinese energy storage projects. Your role is to:

1. Analyze current electricity price policies
2. Assess policy stability and trends
3. Evaluate impact on project IRR
4. Identify policy risks and opportunities
5. Generate actionable recommendations

Key policy areas:
- Peak-valley price arbitrage policies
- Capacity compensation mechanisms
- Demand response programs
- Ancillary service markets
- Time-of-use (TOU) pricing structures
- Market-oriented reforms

Analysis dimensions:
1. **Policy Stability**: How stable is the current policy? What changes are likely?
2. **Trend Prediction**: Where is policy heading? Market reform direction?
3. **Impact Assessment**: How do policy changes affect project returns?
4. **Risk Factors**: What could go wrong? What are the mitigation strategies?
5. **Opportunities**: What new revenue streams might open?

For each province, consider:
- Current price spread and arbitrage potential
- Compensation mechanisms and their sustainability
- Regulatory environment and reform pace
- Grid company policies and implementation
- Market competition and pricing pressure

Provide structured, evidence-based analysis with:
- Clear stability ratings (stable/moderate/unstable)
- Quantified impact on IRR
- Specific risk factors with response strategies
- Actionable recommendations for project design

Use professional, objective language. Base analysis on real policy trends and market dynamics.`,
    });
  }

  /**
   * Main analysis method
   */
  async analyze(input: PolicyAnalysisInput): Promise<PolicyAnalysisResult> {
    this.log('Starting policy analysis for province:', input.province);

    // Step 1: Analyze current policy
    const currentPolicy = this.analyzeCurrentPolicy(input);

    // Step 2: Assess stability
    const stability = await this.assessStability(input);

    // Step 3: Predict trends
    const trend = await this.predictTrend(input);

    // Step 4: Calculate impact on IRR
    const impact = await this.calculateImpact(input);

    // Step 5: Identify risks
    const risks = await this.identifyRisks(input, stability, trend);

    // Step 6: Identify opportunities
    const opportunities = await this.identifyOpportunities(input, trend);

    // Step 7: Generate recommendations
    const recommendations = await this.generateRecommendations(
      input,
      stability,
      trend,
      risks,
      opportunities
    );

    return {
      currentPolicy,
      stability,
      trend,
      impact,
      risks,
      opportunities,
      recommendations,
      metadata: {
        dataSource: 'Policy database + AI analysis',
        reportGenerated: new Date(),
        confidence: stability.confidence,
      },
    };
  }

  /**
   * Analyze current policy structure
   */
  private analyzeCurrentPolicy(input: PolicyAnalysisInput): PolicyAnalysisResult['currentPolicy'] {
    this.log('Analyzing current policy structure');

    return {
      tariffType: input.tariffType,
      peakPrice: input.peakPrice,
      valleyPrice: input.valleyPrice,
      priceSpread: input.priceSpread,
      capacityCompensation: input.capacityCompensation,
      demandResponseAvailable: input.demandResponseAvailable || false,
    };
  }

  /**
   * Assess policy stability
   */
  private async assessStability(
    input: PolicyAnalysisInput
  ): Promise<PolicyAnalysisResult['stability']> {
    this.log('Assessing policy stability');

    // Rule-based stability assessment
    const priceSpread = input.priceSpread;
    const hasCompensation = !!input.capacityCompensation;

    let rating: 'stable' | 'moderate' | 'unstable';
    const factors: string[] = [];
    let confidence = 0.75;

    // High price spread indicates stable arbitrage opportunity
    if (priceSpread >= 0.7) {
      factors.push('峰谷价差较大（≥0.7元/kWh），套利空间稳定');
    } else if (priceSpread >= 0.5) {
      factors.push('峰谷价差适中（0.5-0.7元/kWh），套利空间尚可');
      rating = 'moderate';
    } else {
      factors.push('峰谷价差较小（<0.5元/kWh），套利空间有限');
      rating = 'moderate';
    }

    // Capacity compensation adds stability
    if (hasCompensation) {
      factors.push(`容量补偿政策存在（${input.capacityCompensation}元/kW），增加收益稳定性`);
      confidence += 0.1;
    } else {
      factors.push('容量补偿政策缺失，收益来源单一');
      rating = rating === 'stable' ? 'moderate' : rating;
    }

    // Demand response availability
    if (input.demandResponseAvailable) {
      factors.push('需求响应政策开放，增加收益渠道');
      confidence += 0.05;
    }

    // Province-specific factors
    const provinceFactors = this.getProvinceStabilityFactors(input.province);
    factors.push(...provinceFactors.factors);
    confidence = Math.min(0.95, confidence * provinceFactors.multiplier);

    return {
      rating: rating as 'stable' | 'moderate' | 'unstable',
      confidence: Math.round(confidence * 100) / 100,
      factors,
    };
  }

  /**
   * Get province-specific stability factors
   */
  private getProvinceStabilityFactors(province: string): {
    factors: string[];
    multiplier: number;
  } {
    // Province-specific policy stability assessment
    const stableProvinces = ['guangdong', 'jiangsu', 'zhejiang', 'shandong'];
    const reformingProvinces = ['henan', 'hubei', 'hunan', 'anhui'];

    if (stableProvinces.includes(province)) {
      return {
        factors: [
          `${province}电力市场化改革相对成熟`,
          '政策调整频率较低',
          '监管环境稳定',
        ],
        multiplier: 1.1,
      };
    } else if (reformingProvinces.includes(province)) {
      return {
        factors: [
          `${province}正在推进电力市场化改革`,
          '政策调整可能性中等',
          '需密切关注改革进展',
        ],
        multiplier: 0.9,
      };
    }

    return {
      factors: [`${province}政策信息有限，建议持续关注`],
      multiplier: 0.8,
    };
  }

  /**
   * Predict policy trends
   */
  private async predictTrend(
    input: PolicyAnalysisInput
  ): Promise<PolicyAnalysisResult['trend']> {
    this.log('Predicting policy trends');

    const prompt = `基于以下信息分析${input.province}省的电价政策趋势：

当前情况：
- 峰时电价：${input.peakPrice}元/kWh
- 谷时电价：${input.valleyPrice}元/kWh
- 价差：${input.priceSpread}元/kWh
- 容量补偿：${input.capacityCompensation || '无'}元/kW
- 需求响应：${input.demandResponseAvailable ? '支持' : '不支持'}

请分析：
1. 政策方向（稳定/改善/下降）
2. 时间框架（未来1-2年/3-5年）
3. 关键变化（可能的政策调整）

以JSON格式返回：
{
  "direction": "stable|improving|declining",
  "timeframe": "时间范围描述",
  "keyChanges": ["变化1", "变化2", "变化3"]
}`;

    try {
      const response = await this.think(prompt);
      const parsed = this.parseJSON<{ direction: string; timeframe: string; keyChanges: string[] }>(response);

      if (parsed) {
        return {
          direction: parsed.direction as 'stable' | 'improving' | 'declining',
          timeframe: parsed.timeframe,
          keyChanges: parsed.keyChanges,
        };
      }
    } catch (error) {
      this.log('Failed to parse trend prediction, using fallback', error);
    }

    // Fallback
    return {
      direction: 'stable',
      timeframe: '未来1-2年',
      keyChanges: [
        '分时电价政策保持相对稳定',
        '市场化改革稳步推进',
        '容量补偿标准可能微调',
      ],
    };
  }

  /**
   * Calculate impact on IRR
   */
  private async calculateImpact(
    input: PolicyAnalysisInput
  ): Promise<PolicyAnalysisResult['impact']> {
    this.log('Calculating impact on IRR');

    // Base IRR assumption for current policy
    const baseIRR = 8.0; // 8% baseline

    // Scenario analysis
    const scenarios = [
      { scenario: '价差-10%', priceSpread: input.priceSpread * 0.9 },
      { scenario: '政策不变', priceSpread: input.priceSpread },
      { scenario: '价差+10%', priceSpread: input.priceSpread * 1.1 },
    ];

    const impact = scenarios.map(scenario => {
      // Rough IRR estimation: IRR scales with price spread
      // This is a simplified calculation - real calculation would use the full financial model
      const irrChange = ((scenario.priceSpread - input.priceSpread) / input.priceSpread) * 5; // 5% IRR change per 10% price spread change
      return {
        scenario: scenario.scenario,
        irr: Math.max(0, baseIRR + irrChange),
      };
    });

    // Calculate overall impact
    const onIRR = impact[2].irr - impact[0].irr; // Range from worst to best

    return {
      onIRR: Math.round(onIRR * 10) / 10,
      scenarios: impact,
    };
  }

  /**
   * Identify policy risks
   */
  private async identifyRisks(
    input: PolicyAnalysisInput,
    stability: PolicyAnalysisResult['stability'],
    trend: PolicyAnalysisResult['trend']
  ): Promise<PolicyAnalysisResult['risks']> {
    this.log('Identifying policy risks');

    const risks: PolicyAnalysisResult['risks'] = [];

    // Price spread compression risk
    if (trend.direction === 'declining') {
      risks.push({
        type: '价差收窄',
        level: 'high',
        description: '峰谷价差可能缩小，直接影响套利收益',
        response: '建议签订长期电价协议，多元化收益来源（参与辅助服务）',
      });
    } else if (stability.rating === 'moderate') {
      risks.push({
        type: '价差调整',
        level: 'medium',
        description: '峰谷价差存在调整可能',
        response: '建立灵活的充放电策略调整机制',
      });
    }

    // Capacity compensation risk
    if (input.capacityCompensation) {
      risks.push({
        type: '补偿政策变化',
        level: 'medium',
        description: '容量补偿标准可能下降或取消',
        response: '不过度依赖补偿收益，主要依靠峰谷套利',
      });
    }

    // Policy stability risk
    if (stability.rating === 'unstable') {
      risks.push({
        type: '政策不稳定',
        level: 'high',
        description: '政策环境不稳定，投资风险较高',
        response: '建议采用更保守的投资策略，或等待政策明朗',
      });
    }

    return risks;
  }

  /**
   * Identify policy opportunities
   */
  private async identifyOpportunities(
    input: PolicyAnalysisInput,
    trend: PolicyAnalysisResult['trend']
  ): Promise<PolicyAnalysisResult['opportunities']> {
    this.log('Identifying policy opportunities');

    const opportunities: PolicyAnalysisResult['opportunities'] = [];

    // Demand response opportunity
    if (!input.demandResponseAvailable) {
      opportunities.push({
        type: '需求响应开放',
        description: '未来可能开放需求响应市场，增加收益渠道',
        potential: '预计可增加10-20%收益',
      });
    } else {
      opportunities.push({
        type: '需求响应深化',
        description: '需求响应政策可能深化，提高补偿标准',
        potential: '现有收益基础上有提升空间',
      });
    }

    // Ancillary services opportunity
    opportunities.push({
      type: '辅助服务市场',
      description: '电力辅助服务市场逐步开放，提供调频、备用等服务',
      potential: '长期发展潜力大，需要技术储备',
    });

    // Market reform opportunity
    if (trend.direction === 'improving') {
      opportunities.push({
        type: '政策改善',
        description: '政策环境改善，新的支持政策可能出台',
        potential: '降低政策风险，提高项目可行性',
      });
    }

    return opportunities;
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    input: PolicyAnalysisInput,
    stability: PolicyAnalysisResult['stability'],
    trend: PolicyAnalysisResult['trend'],
    risks: PolicyAnalysisResult['risks'],
    opportunities: PolicyAnalysisResult['opportunities']
  ): Promise<string[]> {
    this.log('Generating recommendations');

    const prompt = `基于以下政策分析提供投资建议：

省份：${input.province}
政策稳定性：${stability.rating}（${stability.confidence}置信度）
政策趋势：${trend.direction}
主要风险：${risks.map(r => r.type).join('、')}
机会：${opportunities.map(o => o.type).join('、')}

针对储能项目投资，请提供3-5条具体建议，包括：
1. 投资时机建议
2. 风险控制措施
3. 策略调整建议
4. 长期规划考虑

请以列表形式返回建议。`;

    try {
      const response = await this.think(prompt);
      const lines = response.split('\n').filter(line => line.trim().length > 0);
      return lines.slice(0, 5);
    } catch (error) {
      // Fallback recommendations
      return [
        '建议在政策稳定期（现在）投资，抓住当前价差优势',
        '建立政策监控机制，及时调整运营策略',
        '设计灵活的系统架构，适应政策变化',
        '多元化收益来源，降低对单一政策的依赖',
        '定期评估政策影响，必要时调整投资策略',
      ];
    }
  }
}
