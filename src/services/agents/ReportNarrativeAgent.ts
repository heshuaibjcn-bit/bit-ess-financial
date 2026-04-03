/**
 * Report Narrative Agent - Professional Report Content Generation
 *
 * Converts structured data into professional narrative text for investment reports:
 * - Project overview chapter
 * - Owner due diligence chapter
 * - Policy analysis chapter
 * - Technical assessment chapter
 * - Financial analysis chapter
 * - Risk assessment chapter
 * - Investment recommendation chapter
 *
 * Each chapter includes:
 * - Clear headings and structure
 * - Professional business language
 * - Data tables and metrics
 * - Executive summary
 * - Actionable recommendations
 */

import { NanoAgent } from './NanoAgent';
import { ReportDataContext } from '../investment-report/ReportDataContext';
import type { ChapterType } from '../investment-report/ReportDataContext';

export type NarrativeInput = {
  chapter: ChapterType;
  context: ReportDataContext;
  targetAudience?: 'investor' | 'bank' | 'internal';
  language?: 'zh' | 'en';
};

export type NarrativeResult = {
  title: string;
  content: string; // Markdown format
  summary: string;
};

export class ReportNarrativeAgent extends NanoAgent {
  constructor() {
    super({
      name: 'ReportNarrativeAgent',
      description: 'Professional investment report narrative generation agent',
      version: '1.0.0',
      model: 'glm-4-plus', // Use more capable model for narrative generation
      maxTokens: 8192,
      temperature: 0.5, // Slightly higher temperature for more natural language
      systemPrompt: `You are a Professional Investment Report Writer specializing in energy storage projects. Your role is to:

1. Convert structured data into professional narrative text
2. Create clear, well-organized report chapters
3. Use professional business language
4. Present data in tables and metrics
5. Generate actionable recommendations

**CRITICAL LANGUAGE STYLE REQUIREMENTS:**

You must strictly follow the language style guide at src/services/investment-report/language-style-guide.md
and the terminology at src/services/investment-report/terminology.json

**Terminology Rules:**
- ONLY use standard terms from terminology.json
- NEVER use synonyms or alternative expressions
- First mention: Chinese full name (English abbreviation)
- Example: "内部收益率 (Internal Rate of Return, IRR)"
- Subsequent mentions: Can use IRR or 内部收益率

**Forbidden Vocabulary:**
NEVER use these colloquial terms:
- 非常好, 特别, 挺好, 差不多, 可能, 应该, 大概, 很多, 做一些, 搞
- Instead use: 优秀/表现突出, 尤其/显著, 良好, 接近, 预计, 预期, 约/大约, 众多/多个, 采取/实施, 进行/开展

**Number Formatting:**
- Percentages: 12.5% (no space)
- Amounts: 230 万元, 1.5 亿元 (1 decimal place)
- Electricity: 1,000 kWh, 2.5 MWh (comma separator for thousands)
- Power: 500 kW, 2.5 MW

**Sentence Structure:**
- Length: 15-25 characters recommended, maximum 35 characters
- One idea per sentence
- Be concise and direct
- Avoid long sentences with multiple clauses

**Paragraph Structure:**
- One topic per paragraph
- 3-5 sentences per paragraph
- Use clear transitions

**Writing Style:**
- **Professional**: Use formal business language, avoid colloquialisms
- **Clear**: Logical structure with clear headings and transitions
- **Concise**: Get to the point, respect the reader's time
- **Data-driven**: Support claims with specific numbers and data
- **Balanced**: Present both strengths and risks objectively
- **Actionable**: End each section with clear recommendations

Report structure:
- Executive summary (key findings in 3-5 bullets)
- Main content (structured with headings)
- Data tables (for metrics and comparisons)
- Conclusions and recommendations

For each chapter:
1. Start with a clear overview
2. Present data in tables for readability
3. Analyze key findings
4. Identify risks and opportunities
5. End with actionable recommendations

Use markdown formatting:
- Use ## for main headings, ### for subheadings
- Use tables for structured data
- Use bullet points for lists (use • or -)
- Use **bold** for emphasis
- Use > for blockquotes (warnings/notes)

Generate content that is:
- Professional and credible
- Easy to understand for investors
- Data-driven and evidence-based
- Actionable and specific`,
    });
  }

  /**
   * Generate a single chapter
   */
  async generateChapter(
    chapter: ChapterType,
    context: ReportDataContext,
    targetAudience: NarrativeInput['targetAudience'] = 'investor',
    language: NarrativeInput['language'] = 'zh'
  ): Promise<string> {
    this.log(`Generating chapter: ${chapter}`);

    const input: NarrativeInput = {
      chapter,
      context,
      targetAudience,
      language,
    };

    // Get chapter template based on type
    const template = this.getChapterTemplate(chapter, context);

    // Fill template with data using AI
    const content = await this.fillTemplate(template, input);

    return content;
  }

  /**
   * Get chapter template（新的 6 节结构）
   */
  private getChapterTemplate(chapter: ChapterType, context: ReportDataContext): string {
    const project = context.project;
    const fm = context.getFinancialMetrics();
    const policy = context.getPolicyAnalysisReport();
    const dd = context.getDueDiligenceReport();
    const tech = context.getTechnicalProposal();

    switch (chapter) {
      case 'executive_summary':
        return `## 执行摘要

### 核心结论
[AI生成: 基于所有分析的综合结论，150-200字]

### 关键指标
- **内部收益率 (IRR)**: ${fm?.irr?.toFixed(2) || 'N/A'}%
- **净现值 (NPV)**: ¥${fm?.npv?.toFixed(0) || 'N/A'}万
- **投资回收期**: ${fm?.paybackPeriodStatic?.toFixed(1) || 'N/A'}年
- **储能平准化成本 (LCOS)**: ¥${fm?.lcoc?.toFixed(2) || 'N/A'}/kWh

### 主要优势
[AI生成: 3-5个关键优势，每条不超过15字]

### 投资建议
[AI生成: 一句话明确建议：推荐/谨慎推荐/不推荐]`;

      case 'project_overview':
        // 合并了业主背景调查
        return `## 项目概况

### 业主信息
- **企业名称**: ${dd?.companyInfo.name || (project as any).ownerInfo?.companyName || '待定'}
- **企业类型**: ${dd?.companyInfo.industry || '待定'}
- **行业经验**: ${dd?.companyInfo.industry || '待评估'}
- **财务状况**: ${dd?.financialHealth.profitability || '待评估'}
- **信用等级**: ${dd?.creditRating.level || 'N/A'} (${dd?.creditRating.score || 0}分)

### 项目地点
- **省份/城市**: ${project.province || '待定'}
- **具体地址**: ${(project as any).facilityInfo?.address || (project as any).ownerInfo?.address || '待定'}
- **地理优势**: [AI生成: 基于项目地点的地理优势描述]

### 系统配置
- **系统容量**: ${tech?.recommended.capacity || 'N/A'} MWh
- **储能设备**: ${tech?.recommended.technology || '待定'}
- **系统架构**: 并网型储能系统

### 技术参数
- **额定功率**: ${tech?.recommended.power || 'N/A'} MW
- **储能时长**: ${tech?.recommended.duration || 'N/A'} h
- **充放电策略**: ${tech?.recommended.chargeStrategy || '峰谷套利'}
- **预期年放电量**: ${tech?.expectedPerformance.annualThroughput || 'N/A'} MWh`;

      case 'financial_analysis':
        return `## 财务分析

### 关键财务指标
- **内部收益率（IRR）**: ${fm?.irr?.toFixed(2) || 'N/A'}%
- **净现值（NPV）**: ¥${fm?.npv?.toFixed(0) || 'N/A'}万
- **投资回收期**: ${fm?.paybackPeriodStatic?.toFixed(1) || 'N/A'}年
- **储能平准化成本（LCOS）**: ¥${fm?.lcoc?.toFixed(2) || 'N/A'}/kWh
- **投资利润率**: ${fm?.roi ? (fm.roi * 100).toFixed(1) : 'N/A'}%

### 现金流分析
[AI生成: 基于cashFlowResult的25年现金流分析]
- 25年累计现金流: [AI生成]
- 盈亏平衡年份: 第 [AI生成] 年

### 敏感性分析
[AI生成: 基于sensitivityResult的敏感性分析]
- IRR对初始投资的敏感性: ±[AI生成]%
- IRR对电价的敏感性: ±[AI生成]%
- IRR对年利用时长的敏感性: ±[AI生成]%
- 最敏感因素: [AI生成]`;

      case 'policy_environment':
        return `## 政策环境

### 适用政策

#### 国家政策
[AI生成: 相关的国家层面储能支持政策]

#### 省级政策
- **补贴标准**: [AI生成: 基于province的省级补贴政策]
- **适用条件**: [AI生成]

#### 电力市场
- **市场类型**: ${policy?.currentPolicy.tariffType || '待定'}
- **交易规则**: [AI生成: 基于province的电力市场交易规则]

### 补贴机制
- **容量补贴**: [AI生成: 基于province的容量补贴标准]
- **电量补贴**: [AI生成: 基于province的电量补贴标准]
- **投资补贴**: [AI生成: 基于province的投资补贴标准]
- **年度补贴总收入**: [AI生成: 计算预期年度补贴收入]

### 合规性检查
- **政策符合性**: [AI生成: 评估项目是否符合政策要求]
- **审批要求**: [AI生成: 列出需要的审批或备案]
- **合规风险**: [AI生成: 潜在的合规风险]`;

      case 'risk_assessment':
        return `## 风险评估

### 风险矩阵

#### 技术风险
[AI生成: 基于technicalProposal的技术风险分析]

#### 市场风险
[AI生成: 基于policyAnalysis的市场风险分析]

#### 政策风险
[AI生成: 基于policyAnalysis的政策风险分析]

#### 运营风险
[AI生成: 基于dueDiligence的运营风险分析]

### 关键风险
[AI生成: 选择3-5个最重要的风险，详细描述]

### 缓解策略
[AI生成: 针对每个关键风险的缓解策略]`;

      case 'investment_recommendation':
        return `## 投资建议

### 综合评分
[AI生成: 多维度评分（财务、政策、风险、市场）]
- 财务维度: [AI生成] /100
- 政策维度: [AI生成] /100
- 风险维度: [AI生成] /100
- 市场维度: [AI生成] /100
- 加权总分: [AI生成] /100
- 评级: [AI生成: 优秀/良好/一般/较差]

### 投资建议
**[AI生成: 推荐/谨慎推荐/不推荐]**

#### 建议理由
[AI生成: 基于以上分析的综合理由]

#### 核心论据
- IRR [AI生成] % [高于/低于]行业平均水平
- NPV [AI生成] 万元 [表明价值创造/价值损失]
- 政策支持 [稳定/不稳定]，预计补贴收入 [AI生成] 万元/年
- 主要风险 [可控/不可控]

### 行动建议

#### 立即行动
[AI生成: 如适用的立即行动项]

#### 后续调研
[AI生成: 如适用的后续调研项]

#### 条件件
[AI生成: 如适用的条件件建议]

### 免责声明
本投资建议基于当前可获得的信息做出。实际投资决策应考虑更详细的尽职调查和市场调研。`;

      default:
        return `## ${chapter}
[AI生成: 该章节内容]`;
    }
  }

  /**
   * Fill template with data using AI
   */
  private async fillTemplate(
    template: string,
    input: NarrativeInput
  ): Promise<string> {
    const { chapter, context, targetAudience, language: _language } = input;

    // Prepare context for AI
    const contextSummary = this.prepareContextSummary(context, chapter);
    const audienceGuidance = this.getAudienceGuidance(targetAudience);

    const prompt = `基于以下结构化数据，生成${this.getChapterName(chapter)}章节的专业叙述：

${template}

${contextSummary}

${audienceGuidance}

要求：
1. 保持专业报告风格
2. 使用markdown格式
3. 数据准确，逻辑清晰
4. 客观呈现优势和风险
5. 章节末尾给出具体建议

请返回完整的markdown内容。`;

    try {
      const response = await this.think(prompt);
      return response;
    } catch (error) {
      this.log('Failed to generate narrative, using template fallback', error);
      return template;
    }
  }

  /**
   * Prepare context summary for AI
   */
  private prepareContextSummary(context: ReportDataContext, chapter: ChapterType): string {
    const summaries: string[] = [];

    // Project info
    summaries.push(`项目: ${context.project.projectName || '未命名项目'}`);
    summaries.push(`省份: ${context.project.province || '未指定'}`);

    // Due diligence
    if (chapter === 'project_overview' || chapter === 'risk_assessment') {
      const dd = context.getDueDiligenceReport();
      if (dd) {
        summaries.push(`业主: ${dd.companyInfo.name}`);
        summaries.push(`信用等级: ${dd.creditRating.level} (${dd.creditRating.score}分)`);
      }
    }

    // Policy analysis
    if (chapter === 'policy_environment' || chapter === 'risk_assessment') {
      const policy = context.getPolicyAnalysisReport();
      if (policy) {
        summaries.push(`价差: ${policy.currentPolicy.priceSpread} 元/kWh`);
        summaries.push(`政策稳定性: ${policy.stability.rating}`);
      }
    }

    // Financial metrics
    if (chapter === 'financial_analysis') {
      const fm = context.getFinancialMetrics();
      if (fm) {
        summaries.push(`IRR: ${fm.irr?.toFixed(2) || 'N/A'}%`);
        summaries.push(`NPV: ¥${fm.npv?.toFixed(0) || 'N/A'}`);
      }
    }

    return `\n**数据摘要**:\n${summaries.join('\n')}\n`;
  }

  /**
   * Get audience-specific guidance
   */
  private getAudienceGuidance(targetAudience: NarrativeInput['targetAudience']): string {
    switch (targetAudience) {
      case 'investor':
        return '**目标读者**: 投资者\n**关注点**: 收益率、风险、退出策略\n**语言**: 简洁有力，突出投资亮点';
      case 'bank':
        return '**目标读者**: 银行信贷审批\n**关注点**: 还款能力、抵押物、风险控制\n**语言**: 保守严谨，强调安全性';
      case 'internal':
        return '**目标读者**: 内部决策团队\n**关注点**: 全面分析、风险揭示、行动建议\n**语言**: 详细完整，包含所有数据';
      default:
        return '**目标读者**: 通用\n**关注点**: 专业性、完整性';
    }
  }

  /**
   * Get chapter name（新的 6 节结构）
   */
  private getChapterName(chapter: ChapterType): string {
    const names: Record<ChapterType, string> = {
      executive_summary: '执行摘要',
      project_overview: '项目概况',
      financial_analysis: '财务分析',
      policy_environment: '政策环境',
      risk_assessment: '风险评估',
      investment_recommendation: '投资建议',
    };
    return names[chapter] || chapter;
  }

}
