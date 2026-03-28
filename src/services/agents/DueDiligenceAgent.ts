/**
 * Due Diligence Agent - Automated Company Background Research
 *
 * Performs comprehensive due diligence on company owners:
 * - Researches company background
 * - Analyzes credit reports
 * - Assesses payment history
 * - Evaluates business risks
 * - Generates due diligence report
 */

import { NanoAgent, AgentCapability } from './NanoAgent';

export interface CompanyInfo {
  name: string;
  registrationNumber?: string;
  legalRepresentative?: string;
  registeredCapital?: number;
  establishmentDate?: string;
  businessScope?: string[];
  address?: string;
  industry?: string;
  scale?: 'large' | 'medium' | 'small' | 'micro';
}

export interface DueDiligenceInput {
  companyName: string;
  taxNumber?: string;
  unifiedSocialCreditCode?: string;
  searchDepth?: 'basic' | 'standard' | 'comprehensive';
}

export interface DueDiligenceResult {
  companyInfo: CompanyInfo;
  creditRating: {
    level: string;
    score: number;
    factors: string[];
  };
  financialHealth: {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    indicators: {
      profitability: string;
      liquidity: string;
      solvency: string;
      efficiency: string;
    };
  };
  paymentHistory: {
    onTimeRate: number;
    latePayments: number;
    defaults: number;
    litigation: number;
  };
  businessRisks: RiskFactor[];
  recommendations: string[];
  confidence: number;
  reportGenerated: string;
}

export interface RiskFactor {
  category: 'legal' | 'financial' | 'operational' | 'reputational';
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  mitigation: string;
}

export class DueDiligenceAgent extends NanoAgent {
  constructor() {
    super({
      name: 'DueDiligenceAgent',
      description: 'Automated company due diligence and background research agent',
      version: '1.0.0',
      model: 'glm-5-turbo',
      maxTokens: 4096,
      temperature: 0.3,
      systemPrompt: `You are a Due Diligence Specialist for Chinese companies. Your role is to:

1. Research company background and registration information
2. Analyze credit standing and financial health
3. Assess payment history and reputation
4. Identify business risks and red flags
5. Generate actionable recommendations

Key assessment areas:
- Company registration and legal status
- Credit rating and financial indicators
- Payment behavior and history
- Litigation and disputes
- Industry position and competitiveness
- Management and governance
- Related parties and transactions

For energy storage project due diligence, focus on:
- Payment capability (can they afford storage investment?)
- Creditworthiness (are they a reliable partner?)
- Business stability (will they be operating long-term?)
- Risk factors (could affect project returns?)

Sources to reference (simulate access):
- National Enterprise Credit Information Publicity System
- Industry and Commerce registries
- Court judgment databases
- Tax administration records
- Customs credit records
- Social security records

Provide structured, evidence-based assessments with:
- Clear risk ratings (low/medium/high/critical)
- Specific risk factors with mitigation strategies
- Actionable recommendations for project partnership

Use professional, objective language. Avoid speculation - clearly state when information is unavailable or estimated.`,
    });
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'company_research',
        description: 'Research company background',
        inputFormat: 'Company name or registration number',
        outputFormat: 'CompanyInfo',
        estimatedTime: 30,
      },
      {
        name: 'credit_analysis',
        description: 'Analyze credit standing',
        inputFormat: 'CompanyInfo',
        outputFormat: 'Credit rating and score',
        estimatedTime: 45,
      },
      {
        name: 'payment_history',
        description: 'Assess payment history',
        inputFormat: 'CompanyInfo',
        outputFormat: 'Payment behavior analysis',
        estimatedTime: 30,
      },
      {
        name: 'risk_assessment',
        description: 'Identify business risks',
        inputFormat: 'CompanyInfo',
        outputFormat: 'RiskFactor list',
        estimatedTime: 40,
      },
    ];
  }

  async execute(input: DueDiligenceInput): Promise<DueDiligenceResult> {
    this.log('Starting due diligence for:', input.companyName);

    // Step 1: Research company
    const companyInfo = await this.researchCompany(input);

    // Step 2: Analyze credit
    const creditRating = await this.analyzeCredit(companyInfo);

    // Step 3: Assess financial health
    const financialHealth = await this.assessFinancialHealth(companyInfo);

    // Step 4: Check payment history
    const paymentHistory = await this.checkPaymentHistory(companyInfo);

    // Step 5: Identify risks
    const businessRisks = await this.identifyRisks(companyInfo, creditRating, paymentHistory);

    // Step 6: Generate recommendations
    const recommendations = await this.generateRecommendations(
      companyInfo,
      creditRating,
      businessRisks
    );

    const result: DueDiligenceResult = {
      companyInfo,
      creditRating,
      financialHealth,
      paymentHistory,
      businessRisks,
      recommendations,
      confidence: 0.75, // Base confidence
      reportGenerated: new Date().toISOString(),
    };

    this.log('Due diligence completed for:', input.companyName);
    return result;
  }

  /**
   * Research company background
   */
  private async researchCompany(input: DueDiligenceInput): Promise<CompanyInfo> {
    this.log('Researching company background');

    // In production, would query:
    // - National Enterprise Credit Information Publicity System
    // - Industry and Commerce registries
    // - Business registration databases

    // Mock implementation
    const prompt = `根据公司名称"${input.companyName}"生成以下尽调信息（模拟）：

返回JSON格式：
{
  "name": "${input.companyName}",
  "registrationNumber": "91440300XXXXXXXX",
  "legalRepresentative": "张三",
  "registeredCapital": 50000000,
  "establishmentDate": "2010-05-15",
  "businessScope": ["制造业", "销售"],
  "address": "广东省XX市XX区",
  "industry": "制造业",
  "scale": "medium"
}`;

    try {
      const response = await this.think(prompt);
      const parsed = this.parseJSON<CompanyInfo>(response);
      if (parsed) {
        return parsed;
      }
    } catch (error) {
      this.log('Failed to parse company research', error);
    }

    // Fallback mock data
    return {
      name: input.companyName,
      scale: 'medium',
      industry: '制造业',
      businessScope: ['生产制造'],
    };
  }

  /**
   * Analyze credit rating
   */
  private async analyzeCredit(companyInfo: CompanyInfo): Promise<DueDiligenceResult['creditRating']> {
    this.log('Analyzing credit rating');

    // In production, would query:
    // - Credit rating agencies
    // - Banking systems
    // - Public credit records

    // Mock analysis based on company scale
    const scoreMap = { large: 85, medium: 75, small: 65, micro: 55 };
    const baseScore = scoreMap[companyInfo.scale || 'medium'];

    const level = baseScore >= 90 ? 'AAA' : baseScore >= 80 ? 'AA' : baseScore >= 70 ? 'A' : 'BBB';

    return {
      level,
      score: baseScore,
      factors: [
        '企业规模适中',
        '行业稳定',
        '经营年限较长',
      ],
    };
  }

  /**
   * Assess financial health
   */
  private async assessFinancialHealth(companyInfo: CompanyInfo): Promise<DueDiligenceResult['financialHealth']> {
    this.log('Assessing financial health');

    // Mock assessment
    return {
      status: 'good',
      indicators: {
        profitability: '良好',
        liquidity: '正常',
        solvency: '稳健',
        efficiency: '良好',
      },
    };
  }

  /**
   * Check payment history
   */
  private async checkPaymentHistory(companyInfo: CompanyInfo): Promise<DueDiligenceResult['paymentHistory']> {
    this.log('Checking payment history');

    // In production, would query:
    // - Tax payment records
    // - Social security payment records
    // - Court judgments
    // - Supplier disputes

    // Mock data
    return {
      onTimeRate: 92.5, // 92.5% on-time
      latePayments: 3, // 3 late payments in past 3 years
      defaults: 0, // No defaults
      litigation: 1, // 1 litigation case
    };
  }

  /**
   * Identify business risks
   */
  private async identifyRisks(
    companyInfo: CompanyInfo,
    creditRating: DueDiligenceResult['creditRating'],
    paymentHistory: DueDiligenceResult['paymentHistory']
  ): Promise<RiskFactor[]> {
    this.log('Identifying business risks');

    const risks: RiskFactor[] = [];

    // Analyze payment history for risks
    if (paymentHistory.latePayments > 5) {
      risks.push({
        category: 'financial',
        level: 'medium',
        description: `存在${paymentHistory.latePayments}次逾期付款记录`,
        impact: '可能影响储能项目回款',
        mitigation: '建议在合同中设置严格的付款条款和担保措施',
      });
    }

    if (paymentHistory.litigation > 0) {
      risks.push({
        category: 'legal',
        level: 'low',
        description: `涉及${paymentHistory.litigation}起诉讼`,
        impact: '法律风险较低，但需关注诉讼进展',
        mitigation: '建议在合作前确认诉讼状态和潜在影响',
      });
    }

    // Check credit rating
    if (creditRating.score < 60) {
      risks.push({
        category: 'financial',
        level: 'high',
        description: '信用评分较低',
        impact: '存在较高的违约风险',
        mitigation: '建议要求提供担保或预付款',
      });
    }

    return risks;
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    companyInfo: CompanyInfo,
    creditRating: DueDiligenceResult['creditRating'],
    risks: RiskFactor[]
  ): Promise<string[]> {
    this.log('Generating recommendations');

    const prompt = `基于以下尽调信息提供投资建议：

公司：${companyInfo.name}
规模：${companyInfo.scale}
信用等级：${creditRating.level} (${creditRating.score}分)
风险数量：${risks.length}

主要风险：
${risks.map(r => `- ${r.level}: ${r.description}`).join('\n')}

针对储能项目投资，请提供3-5条具体建议，包括：
1. 是否建议合作
2. 风险控制措施
3. 合同条款建议
4. 后续监控要求

请以列表形式返回建议。`;

    try {
      const response = await this.think(prompt);
      // Parse recommendations from response
      const lines = response.split('\n').filter(line => line.trim().length > 0);
      return lines.slice(0, 5);
    } catch (error) {
      // Fallback recommendations
      return [
        '建议与该公司进行储能项目合作',
        '合同中约定明确的付款期限和违约责任',
        '项目启动前收取一定比例的预付款',
        '定期关注公司经营状况',
        '建立项目专用账户进行资金监管',
      ];
    }
  }
}
