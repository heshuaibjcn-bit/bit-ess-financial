/**
 * AI Investment Advisor Service
 *
 * Advanced AI-powered investment analysis using Claude 3.5:
 * - Investment recommendations
 * - Risk assessment and mitigation
 * - Market trend analysis
 * - Project optimization suggestions
 * - Portfolio optimization
 */

import Anthropic from '@anthropic-ai/sdk';
import { ProjectInput } from '@/domain/schemas/ProjectSchema';
import { EngineResult } from '@/domain/services/CalculationEngine';

/**
 * Investment recommendation
 */
export interface InvestmentRecommendation {
  overall_rating: 'excellent' | 'good' | 'fair' | 'poor';
  confidence_score: number; // 0-100
  key_strengths: string[];
  key_risks: string[];
  recommendations: Recommendation[];
  optimization_opportunities: Optimization[];
  market_outlook: MarketOutlook;
  risk_mitigation: RiskMitigation;
}

/**
 * Individual recommendation
 */
export interface Recommendation {
  category: 'cost' | 'revenue' | 'risk' | 'timing' | 'policy';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expected_impact: string;
  implementation_effort: string;
}

/**
 * Optimization opportunity
 */
export interface Optimization {
  area: string;
  current_value: number;
  optimized_value: number;
  improvement_percentage: number;
  action_required: string;
}

/**
 * Market outlook
 */
export interface MarketOutlook {
  electricity_price_trend: 'rising' | 'stable' | 'declining';
  demand_outlook: 'strong' | 'moderate' | 'weak';
  policy_environment: 'favorable' | 'neutral' | 'challenging';
  competition_level: 'high' | 'moderate' | 'low';
  time_horizon: string;
}

/**
 * Risk mitigation
 */
export interface RiskMitigation {
  identified_risks: Risk[];
  mitigation_strategies: MitigationStrategy[];
  contingency_plans: ContingencyPlan[];
}

/**
 * Risk
 */
export interface Risk {
  type: 'market' | 'policy' | 'technical' | 'financial' | 'operational';
  severity: 'high' | 'medium' | 'low';
  likelihood: number; // 0-100
  impact: number; // 0-100
  description: string;
}

/**
 * Mitigation strategy
 */
export interface MitigationStrategy {
  risk_type: string;
  strategy: string;
  effectiveness: 'high' | 'medium' | 'low';
  cost: 'high' | 'medium' | 'low';
}

/**
 * Contingency plan
 */
export interface ContingencyPlan {
  trigger_condition: string;
  actions: string[];
  expected_outcome: string;
}

/**
 * AI Advisor Configuration
 */
interface AIAdvisorConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * AI Investment Advisor Service
 */
export class AIInvestmentAdvisor {
  private anthropic: Anthropic;
  private config: Required<AIAdvisorConfig>;

  constructor(config: AIAdvisorConfig) {
    this.config = {
      model: 'claude-3-5-sonnet-20240620',
      maxTokens: 4096,
      temperature: 0.3,
      ...config,
    };

    this.anthropic = new Anthropic({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * Generate comprehensive investment recommendation
   */
  async generateRecommendation(
    projectInput: ProjectInput,
    calculationResult: EngineResult
  ): Promise<InvestmentRecommendation> {
    const prompt = this.buildAnalysisPrompt(projectInput, calculationResult);

    const message = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = message.content[0].text;
    return this.parseRecommendation(response);
  }

  /**
   * Build comprehensive analysis prompt
   */
  private buildAnalysisPrompt(
    projectInput: ProjectInput,
    calculationResult: EngineResult
  ): string {
    const metrics = calculationResult.metrics;
    const cashFlows = calculationResult.cashFlows;

    return `你是一位专业的储能投资顾问。请基于以下项目数据，提供详细的投资分析建议：

## 项目基本信息
- 省份：${projectInput.province}
- 容量：${projectInput.systemSize.capacity} kW
- 时长：${projectInput.systemSize.duration} 年
- 合作模式：${projectInput.collaborationModel}
- 行业：${projectInput.industry || '未知'}

## 财务指标
- 内部收益率(IRR)：${metrics.irr ? metrics.irr.toFixed(2) + '%' : 'N/A'}
- 净现值(NPV)：¥${metrics.npv ? metrics.npv.toLocaleString() : 'N/A'}
- 投资回收期：${calculationResult.paybackPeriod} 年
- LCOE：¥${metrics.lcoc ? metrics.lcoc.toFixed(2) : 'N/A'}/kWh
- 总投资：¥${calculationResult.totalInvestment?.toLocaleString() || 'N/A'}

## 现金流分析（前5年）
${cashFlows.slice(0, 5).map((cf, i) =>
  `第${i + 1}年：收入 ¥${cf.revenue?.toLocaleString() || 'N/A'}, 净现金流 ¥${cf.netCashFlow?.toLocaleString() || 'N/A'}`
).join('\n')}

## 成本结构
- 设备成本：¥${projectInput.costs?.equipmentCost?.toLocaleString() || 'N/A'}
- 安装成本：¥${projectInput.costs?.installationCost?.toLocaleString() || 'N/A'}
- 运维成本：¥${projectInput.operatingCosts?.maintenanceCostPerYear?.toLocaleString() || 'N/A'}/年

## 融资条件
- 贷款比例：${projectInput.financing?.loanRatio || 0}%
- 贷款利率：${projectInput.financing?.loanInterestRate || 0}%
- 贷款期限：${projectInput.financing?.loanTerm || 0} 年

请基于以上信息，提供结构化的投资分析，包括：

1. **整体评级**（excellent/good/fair/poor）和信心指数（0-100）
2. **核心优势**（3-5个关键点）
3. **主要风险**（3-5个风险点）
4. **具体建议**（5-8条可执行建议）
5. **优化机会**（通过调整参数可改善的方面）
6. **市场展望**（电价趋势、需求前景、政策环境）
7. **风险缓解**（识别的风险和应对策略）

请以JSON格式返回分析结果，格式如下：
\`\`\`json
{
  "overall_rating": "excellent|good|fair|poor",
  "confidence_score": 85,
  "key_strengths": ["优势1", "优势2"],
  "key_risks": ["风险1", "风险2"],
  "recommendations": [
    {
      "category": "cost|revenue|risk|timing|policy",
      "priority": "high|medium|low",
      "title": "建议标题",
      "description": "详细描述",
      "expected_impact": "预期影响",
      "implementation_effort": "实施难度"
    }
  ],
  "optimization_opportunities": [
    {
      "area": "优化领域",
      "current_value": 当前值,
      "optimized_value": 优化后值,
      "improvement_percentage": 改善百分比,
      "action_required": "所需行动"
    }
  ],
  "market_outlook": {
    "electricity_price_trend": "rising|stable|declining",
    "demand_outlook": "strong|moderate|weak",
    "policy_environment": "favorable|neutral|challenging",
    "competition_level": "high|moderate|low",
    "time_horizon": "未来3-5年展望"
  },
  "risk_mitigation": {
    "identified_risks": [
      {
        "type": "market|policy|technical|financial|operational",
        "severity": "high|medium|low",
        "likelihood": 75,
        "impact": 80,
        "description": "风险描述"
      }
    ],
    "mitigation_strategies": [
      {
        "risk_type": "风险类型",
        "strategy": "缓解策略",
        "effectiveness": "high|medium|low",
        "cost": "high|medium|low"
      }
    ],
    "contingency_plans": [
      {
        "trigger_condition": "触发条件",
        "actions": ["行动1", "行动2"],
        "expected_outcome": "预期结果"
      }
    ]
  }
}
\`\`\`

请确保分析专业、客观，并基于提供的数据给出具体的数字和百分比。`;
  }

  /**
   * Parse AI response into structured recommendation
   */
  private parseRecommendation(response: string): InvestmentRecommendation {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return this.validateRecommendation(parsed);
      }

      // Fallback: try to parse entire response as JSON
      return this.validateRecommendation(JSON.parse(response));
    } catch (error) {
      console.error('Failed to parse AI response:', error);

      // Return default recommendation
      return this.getDefaultRecommendation();
    }
  }

  /**
   * Validate recommendation data
   */
  private validateRecommendation(data: any): InvestmentRecommendation {
    // Ensure all required fields exist
    return {
      overall_rating: data.overall_rating || 'fair',
      confidence_score: Math.min(100, Math.max(0, data.confidence_score || 70)),
      key_strengths: Array.isArray(data.key_strengths) ? data.key_strengths : [],
      key_risks: Array.isArray(data.key_risks) ? data.key_risks : [],
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
      optimization_opportunities: Array.isArray(data.optimization_opportunities) ? data.optimization_opportunities : [],
      market_outlook: data.market_outlook || {
        electricity_price_trend: 'stable',
        demand_outlook: 'moderate',
        policy_environment: 'neutral',
        competition_level: 'moderate',
        time_horizon: '未来3-5年稳定发展'
      },
      risk_mitigation: data.risk_mitigation || {
        identified_risks: [],
        mitigation_strategies: [],
        contingency_plans: []
      }
    };
  }

  /**
   * Get default recommendation
   */
  private getDefaultRecommendation(): InvestmentRecommendation {
    return {
      overall_rating: 'fair',
      confidence_score: 60,
      key_strengths: ['项目结构完整', '数据计算准确'],
      key_risks: ['市场波动风险', '政策变化风险'],
      recommendations: [
        {
          category: 'risk',
          priority: 'medium',
          title: '建议进行敏感性分析',
          description: '通过敏感性分析评估不同市场条件下的项目表现',
          expected_impact: '提升决策信心',
          implementation_effort: '1-2天'
        }
      ],
      optimization_opportunities: [],
      market_outlook: {
        electricity_price_trend: 'stable',
        demand_outlook: 'moderate',
        policy_environment: 'neutral',
        competition_level: 'moderate',
        time_horizon: '未来3-5年稳定发展'
      },
      risk_mitigation: {
        identified_risks: [],
        mitigation_strategies: [],
        contingency_plans: []
      }
    };
  }

  /**
   * Quick investment score (simplified version)
   */
  async getQuickScore(projectInput: ProjectInput, calculationResult: EngineResult): Promise<{
    score: number;
    rating: string;
    summary: string;
  }> {
    const irr = calculationResult.metrics.irr || 0;
    const npv = calculationResult.metrics.npv || 0;
    const paybackPeriod = calculationResult.paybackPeriod;

    // Simple scoring algorithm
    let score = 50; // Base score

    // IRR scoring
    if (irr >= 15) score += 25;
    else if (irr >= 10) score += 15;
    else if (irr >= 6) score += 5;
    else score -= 10;

    // NPV scoring
    if (npv > 0) score += 10;
    else score -= 20;

    // Payback period scoring
    if (paybackPeriod <= 3) score += 10;
    else if (paybackPeriod <= 5) score += 5;
    else if (paybackPeriod > 8) score -= 10;

    // Cap score at 0-100
    score = Math.max(0, Math.min(100, score));

    let rating: string;
    if (score >= 85) rating = 'excellent';
    else if (score >= 70) rating = 'good';
    else if (score >= 50) rating = 'fair';
    else rating = 'poor';

    const summary = `基于当前项目参数，投资评级为${rating.toUpperCase()}（${score}分）。${rating === 'excellent' ? '项目指标优秀，建议投资。' : rating === 'good' ? '项目指标良好，可以考虑投资。' : rating === 'fair' ? '项目指标一般，建议谨慎评估。' : '项目风险较高，不建议投资。'}`;

    return { score, rating, summary };
  }

  /**
   * Optimize project parameters
   */
  async suggestOptimizations(
    projectInput: ProjectInput,
    calculationResult: EngineResult
  ): Promise<{
    suggestions: Array<{
      parameter: string;
      currentValue: number;
      suggestedValue: number;
      improvement: string;
    }>;
  }> {
    const irr = calculationResult.metrics.irr || 0;
    const suggestions = [];

    // Analyze capacity
    const currentCapacity = projectInput.systemSize.capacity;
    if (currentCapacity < 500) {
      const suggestedCapacity = Math.ceil(currentCapacity * 1.2 / 100) * 100;
      suggestions.push({
        parameter: 'systemSize.capacity',
        currentValue: currentCapacity,
        suggestedValue: suggestedCapacity,
        improvement: '适度扩大容量可能提升规模效应'
      });
    }

    // Analyze loan ratio
    const currentLoanRatio = projectInput.financing?.loanRatio || 0;
    if (currentLoanRatio < 0.7) {
      suggestions.push({
        parameter: 'financing.loanRatio',
        currentValue: currentLoanRatio * 100,
        suggestedValue: 70,
        improvement: '适度提高贷款比例可能提升资金使用效率'
      });
    }

    return { suggestions };
  }
}

/**
 * Factory function to create advisor instance
 */
export function createAIAdvisor(apiKey?: string): AIInvestmentAdvisor {
  const config: AIAdvisorConfig = {
    apiKey: apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_GLM_API_KEY || '',
  };

  if (!config.apiKey) {
    throw new Error('AI API key is required. Set VITE_ANTHROPIC_API_KEY or VITE_GLM_API_KEY environment variable.');
  }

  return new AIInvestmentAdvisor(config);
}

/**
 * Singleton instance (lazy loaded)
 */
let advisorInstance: AIInvestmentAdvisor | null = null;

export function getAIAdvisor(): AIInvestmentAdvisor {
  if (!advisorInstance) {
    advisorInstance = createAIAdvisor();
  }
  return advisorInstance;
}
