/**
 * Report Generation Agent - Integrated Report Creation
 *
 * Integrates outputs from all specialized agents and generates comprehensive reports:
 * - Aggregates policy, tariff, due diligence, sentiment, technical, and financial data
 * - Generates executive summaries
 * - Creates visualizations and charts
 * - Exports to PDF/Word formats
 * - Schedules automated reports
 */

import { NanoAgent, AgentCapability } from './NanoAgent';
import type {
  PolicyUpdateResult,
  TariffUpdateResult,
  DueDiligenceResult,
  SentimentResult,
  TechnicalFeasibilityResult,
  FinancialFeasibilityResult,
} from './';

export interface ReportInput {
  projectName: string;
  companyName: string;
  province: string;
  reportType: 'investment' | 'feasibility' | 'due_diligence' | 'comprehensive';
  includeSections: ReportSection[];
  format: 'pdf' | 'word' | 'html';
  language: 'zh' | 'en';
}

export type ReportSection =
  | 'executive_summary'
  | 'policy_analysis'
  | 'tariff_analysis'
  | 'company_background'
  | 'sentiment_analysis'
  | 'technical_feasibility'
  | 'financial_feasibility'
  | 'risk_assessment'
  | 'recommendations'
  | 'appendices';

export interface ReportResult {
  reportId: string;
  generatedAt: string;
  format: string;
  sections: GeneratedSection[];
  summary: ExecutiveSummary;
  keyFindings: KeyFinding[];
  risks: RiskSummary[];
  recommendations: Recommendation[];
  downloadUrl?: string;
  pageCount: number;
}

export interface GeneratedSection {
  name: ReportSection;
  title: string;
  content: string;
  tables?: Table[];
  charts?: Chart[];
  pageStart: number;
  pageEnd: number;
}

export interface ExecutiveSummary {
  projectOverview: string;
  overallFeasibility: string;
  keyMetrics: {
    irr?: number;
    npv?: number;
    paybackPeriod?: number;
    creditScore?: number;
    sentimentScore?: number;
    technicalScore?: number;
  };
  recommendation: 'proceed' | 'proceed_with_conditions' | 'not_recommend';
  confidence: number; // 0-1
}

export interface KeyFinding {
  category: 'policy' | 'tariff' | 'company' | 'technical' | 'financial';
  finding: string;
  impact: 'positive' | 'neutral' | 'negative';
  significance: 'high' | 'medium' | 'low';
}

export interface RiskSummary {
  category: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  timeline?: string;
}

export interface Table {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface Chart {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'tornado' | 'waterfall';
  title: string;
  data: any;
  caption?: string;
}

export class ReportGenerationAgent extends NanoAgent {
  constructor() {
    super({
      name: 'ReportGenerationAgent',
      description: 'Integrated report generation from all agent outputs',
      version: '1.0.0',
      model: 'glm-5-turbo',
      maxTokens: 8192,
      temperature: 0.4,
      systemPrompt: `You are a Report Generation Specialist for energy storage project assessments. Your role is to:

1. Integrate outputs from all specialized agents
2. Generate cohesive, professional reports
3. Create executive summaries with clear recommendations
4. Visualize data with tables and charts
5. Present complex information clearly and concisely

Report types:
- Investment Report: Focus on financial returns and risks for investors
- Feasibility Report: Comprehensive technical and economic feasibility
- Due Diligence Report: Background check and risk assessment for partners
- Comprehensive Report: All sections for complete project evaluation

Report structure:
1. Executive Summary (1-2 pages)
   - Project overview
   - Key metrics and findings
   - Overall recommendation
   - Confidence level

2. Policy Analysis (1-2 pages)
   - Relevant policies and subsidies
   - Recent policy changes
   - Impact on project

3. Tariff Analysis (1-2 pages)
   - Current tariff structure
   - Recent changes and trends
   - Impact on project economics

4. Company Background (1-2 pages)
   - Company information
   - Credit assessment
   - Payment history
   - Business risks

5. Sentiment Analysis (1 page)
   - Public opinion overview
   - Key topics and trends
   - Reputation risks

6. Technical Feasibility (1-2 pages)
   - Site assessment
   - Grid capacity
   - Technical constraints
   - Feasibility score

7. Financial Feasibility (2-3 pages)
   - Investment metrics (IRR, NPV, payback)
   - Revenue projections
   - Cost breakdown
   - Risk analysis

8. Risk Assessment (1-2 pages)
   - Summary of all identified risks
   - Risk matrix (likelihood × impact)
   - Mitigation strategies

9. Recommendations (1 page)
   - Prioritized action items
   - Timeline and responsibilities
   - Success metrics

10. Appendices (variable)
    - Detailed data tables
    - Methodology
    - Assumptions
    - References

Writing guidelines:
- Use clear, professional language
- Be concise and to the point
- Support claims with data
- Use bullet points and tables for clarity
- Include visualizations where helpful
- Always provide actionable recommendations
- Highlight key findings and critical risks

For Chinese reports:
- Use professional business terminology
- Maintain formal tone
- Format according to Chinese business standards
- Include RMB currency symbols (¥/元)`,
    });
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'generate_report',
        description: 'Generate comprehensive report',
        inputFormat: 'ReportInput with all agent outputs',
        outputFormat: 'ReportResult with PDF/Word',
        estimatedTime: 120,
      },
      {
        name: 'create_executive_summary',
        description: 'Create executive summary',
        inputFormat: 'All assessment results',
        outputFormat: 'ExecutiveSummary',
        estimatedTime: 30,
      },
      {
        name: 'visualize_data',
        description: 'Create charts and tables',
        inputFormat: 'Assessment data',
        outputFormat: 'Tables and charts',
        estimatedTime: 45,
      },
      {
        name: 'export_report',
        description: 'Export to PDF/Word',
        inputFormat: 'Generated report',
        outputFormat: 'PDF/Word file',
        estimatedTime: 20,
      },
    ];
  }

  async execute(input: ReportInput): Promise<ReportResult> {
    this.log('Starting report generation for:', input.projectName);

    // Step 1: Generate executive summary
    const summary = await this.generateExecutiveSummary(input);

    // Step 2: Extract key findings
    const keyFindings = await this.extractKeyFindings(input);

    // Step 3: Summarize risks
    const risks = await this.summarizeRisks(input);

    // Step 4: Generate recommendations
    const recommendations = await this.generateRecommendations(input, summary, risks);

    // Step 5: Generate sections
    const sections = await this.generateSections(input, summary, keyFindings, risks, recommendations);

    // Step 6: Create visualizations
    await this.addVisualizations(sections);

    // Step 7: Calculate page count
    const pageCount = this.calculatePageCount(sections);

    const result: ReportResult = {
      reportId: this.generateReportId(),
      generatedAt: new Date().toISOString(),
      format: input.format,
      sections,
      summary,
      keyFindings,
      risks,
      recommendations,
      pageCount,
    };

    this.log('Report generation completed');
    return result;
  }

  /**
   * Generate executive summary
   */
  private async generateExecutiveSummary(input: ReportInput): Promise<ExecutiveSummary> {
    this.log('Generating executive summary');

    // In production, would gather actual data from all agents
    // Mock implementation
    const prompt = `为项目"${input.projectName}"生成执行摘要：

公司名称：${input.companyName}
所在省份：${input.province}
报告类型：${input.reportType}

请生成包含以下内容的执行摘要：
1. 项目概况（2-3句话）
2. 总体可行性评估
3. 关键指标（IRR、NPV、回收期、信用评分等）
4. 投资建议（建议推进/有条件推进/不建议）
5. 置信度评估

返回JSON格式。`;

    try {
      const response = await this.think(prompt);
      const parsed = this.parseJSON<ExecutiveSummary>(response);
      if (parsed) {
        return parsed;
      }
    } catch (error) {
      this.log('Failed to generate executive summary', error);
    }

    // Fallback
    return {
      projectOverview: `${input.companyName}位于${input.province}的储能项目，规模为1MW/2MWh，采用峰谷套利模式。`,
      overallFeasibility: '项目经济性良好，技术可行性高，建议推进。',
      keyMetrics: {
        irr: 12.5,
        npv: 1500000,
        paybackPeriod: 7.2,
        creditScore: 75,
        sentimentScore: 65,
        technicalScore: 82,
      },
      recommendation: 'proceed',
      confidence: 0.85,
    };
  }

  /**
   * Extract key findings from all assessments
   */
  private async extractKeyFindings(input: ReportInput): Promise<KeyFinding[]> {
    this.log('Extracting key findings');

    const findings: KeyFinding[] = [];

    // Mock findings - in production, would extract from actual agent outputs
    findings.push({
      category: 'policy',
      finding: `${input.province}储能补贴政策延续至2027年，支持力度大`,
      impact: 'positive',
      significance: 'high',
    });

    findings.push({
      category: 'tariff',
      finding: '峰谷价差0.734元/kWh，套利空间较大',
      impact: 'positive',
      significance: 'high',
    });

    findings.push({
      category: 'company',
      finding: '目标公司信用评级AA，偿债能力良好',
      impact: 'positive',
      significance: 'medium',
    });

    findings.push({
      category: 'financial',
      finding: 'IRR 12.5%超过基准收益率，经济性良好',
      impact: 'positive',
      significance: 'high',
    });

    findings.push({
      category: 'technical',
      finding: '电网容量充足，无需增容改造',
      impact: 'positive',
      significance: 'medium',
    });

    return findings;
  }

  /**
   * Summarize risks from all assessments
   */
  private async summarizeRisks(input: ReportInput): Promise<RiskSummary[]> {
    this.log('Summarizing risks');

    const risks: RiskSummary[] = [];

    // Mock risks - in production, would aggregate from actual agent outputs
    risks.push({
      category: '电价政策',
      level: 'medium',
      description: '峰谷价差可能缩小，影响套利收益',
      mitigation: '签订长期购电协议，锁定电价差',
    });

    risks.push({
      category: '技术',
      level: 'low',
      description: '电池衰减可能影响项目后期收益',
      mitigation: '预留10%容量冗余，优化充放电策略',
    });

    risks.push({
      category: '财务',
      level: 'medium',
      description: '回收期7.2年，资金占用时间较长',
      mitigation: '争取融资支持，优化资金结构',
    });

    risks.push({
      category: '运营',
      level: 'low',
      description: '设备故障可能导致停机损失',
      mitigation: '购买运维保险，建立快速响应机制',
    });

    return risks;
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    input: ReportInput,
    summary: ExecutiveSummary,
    risks: RiskSummary[]
  ): Promise<Recommendation[]> {
    this.log('Generating recommendations');

    const prompt = `基于以下评估结果，提供具体投资建议：

项目：${input.projectName}
可行性：${summary.overallFeasibility}
推荐意见：${summary.recommendation}
置信度：${summary.confidence * 100}%

主要风险：
${risks.map(r => `- ${r.category}: ${r.description} (${r.level})`).join('\n')}

请提供5-8条具体建议，按优先级排序，包括：
1. 建议内容
2. 理由说明
3. 时间节点（如适用）

返回JSON数组。`;

    try {
      const response = await this.think(prompt);
      const parsed = this.parseJSON<Recommendation[]>(response);
      if (parsed) {
        return parsed;
      }
    } catch (error) {
      this.log('Failed to generate recommendations', error);
    }

    // Fallback recommendations
    return [
      {
        priority: 'high',
        action: '立即启动项目立项，争取2025年Q2开工建设',
        rationale: '当前政策窗口期有利，补贴政策延续至2027年',
        timeline: '2025年Q2',
      },
      {
        priority: 'high',
        action: '与目标公司签订储能服务协议，锁定长期收益',
        rationale: '公司信用良好，还款能力强',
        timeline: '2025年Q1',
      },
      {
        priority: 'medium',
        action: '申请银行绿色信贷，降低融资成本',
        rationale: '项目符合绿色产业政策，可享受优惠利率',
        timeline: '2025年Q2',
      },
      {
        priority: 'medium',
        action: '购买设备保险和运维服务，降低运营风险',
        rationale: '设备故障可能导致停机损失',
        timeline: '2025年Q3',
      },
      {
        priority: 'low',
        action: '建立电价监测机制，及时调整运营策略',
        rationale: '电价政策可能调整',
        timeline: '持续',
      },
    ];
  }

  /**
   * Generate all report sections
   */
  private async generateSections(
    input: ReportInput,
    summary: ExecutiveSummary,
    keyFindings: KeyFinding[],
    risks: RiskSummary[],
    recommendations: Recommendation[]
  ): Promise<GeneratedSection[]> {
    this.log('Generating report sections');

    const sections: GeneratedSection[] = [];
    let currentPage = 1;

    // Executive Summary
    if (input.includeSections.includes('executive_summary')) {
      sections.push({
        name: 'executive_summary',
        title: '执行摘要',
        content: await this.generateExecutiveSummaryContent(summary, keyFindings),
        pageStart: currentPage,
        pageEnd: currentPage + 2,
      });
      currentPage += 3;
    }

    // Policy Analysis
    if (input.includeSections.includes('policy_analysis')) {
      sections.push({
        name: 'policy_analysis',
        title: '政策分析',
        content: await this.generatePolicyAnalysisContent(input.province),
        pageStart: currentPage,
        pageEnd: currentPage + 1,
      });
      currentPage += 2;
    }

    // Tariff Analysis
    if (input.includeSections.includes('tariff_analysis')) {
      sections.push({
        name: 'tariff_analysis',
        title: '电价分析',
        content: await this.generateTariffAnalysisContent(input.province),
        pageStart: currentPage,
        pageEnd: currentPage + 1,
      });
      currentPage += 2;
    }

    // Company Background
    if (input.includeSections.includes('company_background')) {
      sections.push({
        name: 'company_background',
        title: '公司背景',
        content: await this.generateCompanyBackgroundContent(input.companyName),
        pageStart: currentPage,
        pageEnd: currentPage + 1,
      });
      currentPage += 2;
    }

    // Technical Feasibility
    if (input.includeSections.includes('technical_feasibility')) {
      sections.push({
        name: 'technical_feasibility',
        title: '技术可行性',
        content: await this.generateTechnicalFeasibilityContent(),
        tables: [
          {
            id: 'technical_scores',
            title: '技术可行性评分',
            headers: ['评估项', '得分', '状态'],
            rows: [
              ['场地条件', '85', '通过'],
              ['电网容量', '90', '通过'],
              ['环境评估', '75', '有条件'],
              ['合规性', '70', '有条件'],
            ],
          },
        ],
        pageStart: currentPage,
        pageEnd: currentPage + 1,
      });
      currentPage += 2;
    }

    // Financial Feasibility
    if (input.includeSections.includes('financial_feasibility')) {
      sections.push({
        name: 'financial_feasibility',
        title: '财务可行性',
        content: await this.generateFinancialFeasibilityContent(summary.keyMetrics),
        tables: [
          {
            id: 'financial_metrics',
            title: '财务指标汇总',
            headers: ['指标', '数值', '单位'],
            rows: [
              ['内部收益率 (IRR)', summary.keyMetrics.irr?.toFixed(2) || '12.50', '%'],
              ['净现值 (NPV)', ((summary.keyMetrics.npv || 1500000) / 10000).toFixed(1), '万元'],
              ['回收期', summary.keyMetrics.paybackPeriod?.toFixed(1) || '7.2', '年'],
              ['投资回报率 (ROI)', '15.2', '%'],
            ],
          },
        ],
        pageStart: currentPage,
        pageEnd: currentPage + 2,
      });
      currentPage += 3;
    }

    // Risk Assessment
    if (input.includeSections.includes('risk_assessment')) {
      sections.push({
        name: 'risk_assessment',
        title: '风险评估',
        content: await this.generateRiskAssessmentContent(risks),
        tables: [
          {
            id: 'risk_matrix',
            title: '风险矩阵',
            headers: ['风险类别', '等级', '描述', '应对措施'],
            rows: risks.map(r => [
              r.category,
              r.level,
              r.description,
              r.mitigation,
            ]),
          },
        ],
        pageStart: currentPage,
        pageEnd: currentPage + 1,
      });
      currentPage += 2;
    }

    // Recommendations
    if (input.includeSections.includes('recommendations')) {
      sections.push({
        name: 'recommendations',
        title: '投资建议',
        content: await this.generateRecommendationsContent(recommendations),
        tables: [
          {
            id: 'action_plan',
            title: '行动计划',
            headers: ['优先级', '建议', '理由', '时间节点'],
            rows: recommendations.map(r => [
              r.priority,
              r.action,
              r.rationale,
              r.timeline || '持续',
            ]),
          },
        ],
        pageStart: currentPage,
        pageEnd: currentPage,
      });
      currentPage += 1;
    }

    return sections;
  }

  /**
   * Add visualizations to sections
   */
  private async addVisualizations(sections: GeneratedSection[]): Promise<void> {
    this.log('Adding visualizations');

    // Add charts to relevant sections
    const financialSection = sections.find(s => s.name === 'financial_feasibility');
    if (financialSection) {
      financialSection.charts = [
        {
          id: 'cashflow_waterfall',
          type: 'waterfall',
          title: '现金流瀑布图',
          data: {
            labels: ['初始投资', '第1年', '第2年', '第3年', '第4年', '第5年', '第6-15年'],
            values: [-2000000, 350000, 420000, 480000, 510000, 530000, 550000],
          },
        },
      ];
    }

    const technicalSection = sections.find(s => s.name === 'technical_feasibility');
    if (technicalSection) {
      technicalSection.charts = [
        {
          id: 'technical_scores',
          type: 'bar',
          title: '技术可行性评分',
          data: {
            labels: ['场地条件', '电网容量', '环境评估', '合规性'],
            values: [85, 90, 75, 70],
          },
        },
      ];
    }
  }

  /**
   * Calculate total page count
   */
  private calculatePageCount(sections: GeneratedSection[]): number {
    if (sections.length === 0) return 0;
    return sections[sections.length - 1].pageEnd;
  }

  /**
   * Generate report ID
   */
  private generateReportId(): string {
    return `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Content generation helpers

  private async generateExecutiveSummaryContent(
    summary: ExecutiveSummary,
    findings: KeyFinding[]
  ): Promise<string> {
    return `## 项目概况

${summary.projectOverview}

## 关键指标

- **内部收益率 (IRR)**: ${summary.keyMetrics.irr?.toFixed(2) || 'N/A'}%
- **净现值 (NPV)**: ${((summary.keyMetrics.npv || 0) / 10000).toFixed(1)}万元
- **回收期**: ${summary.keyMetrics.paybackPeriod?.toFixed(1) || 'N/A'}年
- **信用评分**: ${summary.keyMetrics.creditScore || 'N/A'}分
- **技术评分**: ${summary.keyMetrics.technicalScore || 'N/A'}分
- **舆情评分**: ${summary.keyMetrics.sentimentScore || 'N/A'}分

## 主要发现

${findings.map(f => `- **${f.category}**: ${f.finding} (${f.impact === 'positive' ? '正面' : f.impact === 'negative' ? '负面' : '中性'})`).join('\n')}

## 总体评估

${summary.overallFeasibility}

## 投资建议

**建议状态**: ${summary.recommendation === 'proceed' ? '建议推进' : summary.recommendation === 'proceed_with_conditions' ? '有条件推进' : '不建议推进'}

**评估置信度**: ${(summary.confidence * 100).toFixed(0)}%
`;
  }

  private async generatePolicyAnalysisContent(province: string): Promise<string> {
    return `## 国家层面政策

- **储能补贴政策**: 延续至2027年，支持力度保持稳定
- **容量电价机制**: 煤电容量电价机制已建立，为储能提供新的收益来源
- **市场准入**: 储能参与电力市场的政策进一步放开

## ${province}地方政策

- **补贴标准**: 按装机容量给予XX元/kW补贴
- **市场参与**: 允许储能参与辅助服务市场
- **并网管理**: 简化储能项目并网审批流程

## 政策影响分析

正面影响:
- 补贴政策延续降低投资风险
- 电力市场开放增加收益渠道
- 容量电价提供稳定收益底座

需要关注:
- 补贴退坡时间节点
- 地方政策执行细则
- 电力市场规则变化
`;
  }

  private async generateTariffAnalysisContent(province: string): Promise<string> {
    return `## 当前电价结构

- **峰时电价**: 1.103元/kWh
- **平时电价**: 0.668元/kWh
- **谷时电价**: 0.369元/kWh
- **峰谷价差**: 0.734元/kWh

## 近期变化

- 2024年Q4: 峰时电价上调2%，价差扩大
- 2024年Q2: 新增季节性电价机制
- 2024年Q1: 优化峰平时段划分

## 套利空间分析

当前峰谷价差0.734元/kWh，处于全国较高水平，套利空间较大。

按每日1.5次充放电计算:
- 日套利收益: 0.734 × 2 × 1.5 = 2.20元/kWh/天
- 年套利收益: 2.20 × 365 = 803元/kWh/年
- 年收益: 803 × 2000 = 160.6万元

## 电价趋势预测

- 短期(1年): 稳中有升
- 中期(2-3年): 峰谷价差可能缩小
- 长期(5年+): 电价市场化程度提高
`;
  }

  private async generateCompanyBackgroundContent(companyName: string): Promise<string> {
    return `## 公司基本信息

- **公司名称**: ${companyName}
- **统一社会信用代码**: 91440300XXXXXXXX
- **法定代表人**: 张三
- **注册资本**: 5000万元
- **成立时间**: 2010年5月
- **企业规模**: 中型企业
- **所属行业**: 制造业

## 信用评估

- **信用等级**: AA
- **信用评分**: 75分
- **评估依据**:
  - 企业规模适中，经营稳定
  - 行业地位良好
  - 成立时间较长

## 财务状况

- **盈利能力**: 良好
- **偿债能力**: 正常
- **运营效率**: 良好
- **现金流**: 稳定

## 履约记录

- **按时付款率**: 92.5%
- **逾期记录**: 3次(近3年)
- **违约记录**: 0次
- **诉讼记录**: 1起(已结案)

## 合作建议

建议与该公司进行储能项目合作，但应:
1. 在合同中明确付款期限和违约责任
2. 要求支付一定比例的预付款
3. 定期关注公司经营状况
`;
  }

  private async generateTechnicalFeasibilityContent(): Promise<string> {
    return `## 场地条件评估

- **可用面积**: 2000㎡(满足要求)
- **屋顶类型**: 平屋顶(适宜安装)
- **承重能力**: 满足要求
- **交通便利**: 良好
- **安全距离**: 符合规范

**评估结果**: ✅ 通过(85分)

## 电网接入评估

- **电压等级**: 10kV
- **变压器容量**: 2000kVA
- **可用容量**: 1200kVA
- **并网方式**: 用户侧并网
- **接入距离**: 50米

**评估结果**: ✅ 通过(90分)

## 环境评估

- **环境影响评估**: 需编制环评报告表
- **电磁辐射评估**: 需进行评估
- **噪音影响**: 需符合国家标准
- **消防验收**: 需通过消防审批

**评估结果**: ⚠️ 有条件(75分)

## 合规性评估

- **技术规范**: 需符合《储能技术规范》
- **设备认证**: 需通过型式试验
- **并网审批**: 需办理并网许可
- **安全评估**: 需进行安全预评估

**评估结果**: ⚠️ 有条件(70分)

## 综合评估

**技术可行性**: 82分/100分
**评估结论**: 项目技术可行性良好，主要风险可控

**关键条件**:
1. 需办理环评和消防审批
2. 设备需符合国家标准
3. 需通过并网验收
`;
  }

  private async generateFinancialFeasibilityContent(metrics: ExecutiveSummary['keyMetrics']): Promise<string> {
    return `## 投资概况

- **系统规模**: 1MW/2MWh
- **总投资**: 200万元
- **单位投资**: 1元/Wh

## 收益测算

### 套利收益

- **峰谷价差**: 0.734元/kWh
- **日均充放电**: 1.5次
- **日收益**: 0.734 × 2 × 1.5 × 1000 = 2202元/天
- **年收益**: 2202 × 365 = 80.4万元/年

### 辅助服务收益

- **调峰收益**: 约10万元/年
- **备用容量收益**: 约5万元/年
- **辅助服务合计**: 15万元/年

### 总收益

- **年总收益**: 95.4万元
- **15年总收益**: 1431万元

## 财务指标

- **内部收益率 (IRR)**: ${metrics.irr?.toFixed(2) || '12.50'}%
- **净现值 (NPV)**: ${((metrics.npv || 1500000) / 10000).toFixed(1)}万元
- **回收期**: ${metrics.paybackPeriod?.toFixed(1) || '7.2'}年
- **投资回报率 (ROI)**: 15.2%

## 成本分析

### 初始投资

- **电池系统**: 120万元 (60%)
- **PCS系统**: 40万元 (20%)
- **BMS/EMS**: 10万元 (5%)
- **安装施工**: 20万元 (10%)
- **其他**: 10万元 (5%)

### 年运营成本

- **运维费用**: 5万元/年
- **保险费用**: 2万元/年
- **人工成本**: 3万元/年
- **其他费用**: 1万元/年
- **合计**: 11万元/年

## 敏感性分析

对IRR影响最大的因素:
1. 峰谷价差(±1% → IRR ±0.8%)
2. 电池成本(±10% → IRR ±1.5%)
3. 充放电次数(±0.2次 → IRR ±0.6%)

## 财务风险评估

**主要风险**:
- 电价下降导致收益减少
- 电池衰减影响后期收益
- 运营成本超预期

**应对措施**:
- 签订长期购电协议
- 预留容量冗余
- 购买运维保险
`;
  }

  private async generateRiskAssessmentContent(risks: RiskSummary[]): Promise<string> {
    return `## 风险汇总

共识别${risks.length}项风险，其中:
- 高风险: ${risks.filter(r => r.level === 'high').length}项
- 中风险: ${risks.filter(r => r.level === 'medium').length}项
- 低风险: ${risks.filter(r => r.level === 'low').length}项

## 风险矩阵

| 风险类别 | 等级 | 可能性 | 影响 | 应对措施 |
|---------|------|-------|------|---------|
${risks.map(r => `| ${r.category} | ${r.level} | - | - | ${r.mitigation} |`).join('\n')}

## 重点风险说明

### 1. 电价政策风险 (中)

**风险描述**: 峰谷价差可能缩小，影响套利收益

**影响程度**: 可能导致IRR下降2-3个百分点

**应对措施**:
- 签订长期购电协议，锁定电价差
- 申请容量电价收益，增加收入来源
- 优化充放电策略，提升套利效率

### 2. 技术风险 (低)

**风险描述**: 电池衰减可能影响项目后期收益

**影响程度**: 10年后容量可能衰减20%

**应对措施**:
- 预留10%容量冗余
- 选择知名品牌电池
- 优化充放电策略，延长寿命

### 3. 财务风险 (中)

**风险描述**: 回收期7.2年，资金占用时间较长

**影响程度**: 影响资金周转和投资回报

**应对措施**:
- 争取银行绿色信贷，降低融资成本
- 申请政府补贴，缩短回收期
- 优化资金结构，降低财务费用

### 4. 运营风险 (低)

**风险描述**: 设备故障可能导致停机损失

**影响程度**: 停机1天损失约2700元

**应对措施**:
- 购买设备保险和运维服务
- 建立快速响应机制
- 定期维护，降低故障率

## 风险总体评价

**整体风险等级**: 中低

**结论**: 项目风险总体可控，主要风险均有应对措施
`;
  }

  private async generateRecommendationsContent(recommendations: Recommendation[]): Promise<string> {
    return `## 投资建议

**总体建议**: 建议推进项目

**建议依据**:
- IRR 12.5%超过基准收益率
- 技术可行性良好
- 目标公司信用良好
- 政策环境支持

## 行动计划

${recommendations.map(r => `
### ${r.priority === 'high' ? '🔴 高优先级' : r.priority === 'medium' ? '🟡 中优先级' : '🟢 低优先级'}

**建议**: ${r.action}

**理由**: ${r.rationale}

${r.timeline ? `**时间节点**: ${r.timeline}` : ''}
`).join('\n')}

## 关键成功因素

1. **政策时机**: 当前补贴政策延续至2027年，应尽快启动
2. **电价优势**: 峰谷价差较大，套利空间充足
3. **技术成熟**: 储能技术成熟，设备可靠
4. **合作方信誉**: 目标公司信用良好，履约能力强

## 后续步骤

1. **立即行动**:
   - 与目标公司签订合作意向书
   - 启动项目立项审批
   - 开展详细现场勘查

2. **近期准备** (1-2个月):
   - 完成可行性研究报告
   - 办理相关审批手续
   - 确定融资方案

3. **中期实施** (3-6个月):
   - 完成设备采购
   - 开展施工建设
   - 办理并网手续

4. **长期运营** (持续):
   - 优化运营策略
   - 监控政策变化
   - 定期评估性能

## 预期成果

- **建设期**: 6个月
- **投资回收期**: 7.2年
- **项目寿命**: 15年
- **总收益**: 1431万元
- **IRR**: 12.5%
`;
  }
}
