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

Writing style:
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

Key terms (Chinese):
- IRR: 内部收益率
- NPV: 净现值
- LCOS: 平准化度电成本
- Payback period: 投资回收期
- Peak-valley spread: 峰谷价差
- Capacity compensation: 容量补偿
- Demand response: 需求响应
- Due diligence: 尽职调查

For each chapter:
1. Start with a clear overview
2. Present data in tables for readability
3. Analyze key findings
4. Identify risks and opportunities
5. End with actionable recommendations

Use markdown formatting:
- Use ## for main headings, ### for subheadings
- Use tables for structured data
- Use bullet points for lists
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
   * Get chapter template
   */
  private getChapterTemplate(chapter: ChapterType, context: ReportDataContext): string {
    const project = context.project;

    switch (chapter) {
      case 'project_overview':
        return `## 1. 项目概况

### 1.1 基本信息
- **项目名称**: ${project.name || '待定'}
- **项目地点**: ${project.province || '待定'}
- **投资主体**: ${project.ownerInfo?.companyName || '待定'}
- **项目规模**: 待根据技术方案确定
- **预计投运**: 待根据实施计划确定

### 1.2 项目背景
[AI生成: 基于用电需求和电价政策的项目背景描述]

### 1.3 场地条件
[AI生成: 基于facilityInfo的场地条件描述]`;

      case 'owner_due_diligence':
        const dd = context.getDueDiligenceReport();
        return `## 2. 业主背景调查

### 2.1 企业基本信息
[AI生成: 基于尽调报告的企业信息表格]

### 2.2 信用评估
- **信用等级**: ${dd?.creditRating.level || 'N/A'} (${dd?.creditRating.score || 0}分)
- **付款历史**: ${dd?.paymentHistory.onTimeRate || 0}%按时付款率
[AI生成: 详细信用评估分析]

### 2.3 财务健康度
[AI生成: 财务健康度评估]

### 2.4 业务风险
[AI生成: 风险因素和缓解措施]`;

      case 'policy_analysis':
        const policy = context.getPolicyAnalysisReport();
        return `## 3. 电价政策分析

### 3.1 当前电价结构
- **峰时电价**: ${policy?.currentPolicy.peakPrice || 'N/A'} 元/kWh
- **谷时电价**: ${policy?.currentPolicy.valleyPrice || 'N/A'} 元/kWh
- **峰谷价差**: ${policy?.currentPolicy.priceSpread || 'N/A'} 元/kWh
[AI生成: 详细电价结构分析]

### 3.2 政策稳定性
- **稳定性评级**: ${policy?.stability.rating || 'N/A'}
- **置信度**: ${Math.round((policy?.stability.confidence || 0) * 100)}%
[AI生成: 政策稳定性分析]

### 3.3 政策影响
- **对IRR影响**: ${policy?.impact.onIRR || 0}%
[AI生成: 详细影响分析]`;

      case 'technical_assessment':
        const tech = context.getTechnicalProposal();
        return `## 4. 技术方案评估

### 4.1 推荐配置
- **系统容量**: ${tech?.recommended.capacity || 'N/A'} MWh
- **系统功率**: ${tech?.recommended.power || 'N/A'} MW
- **充放电时长**: ${tech?.recommended.duration || 'N/A'} 小时
- **技术路线**: ${tech?.recommended.technology || 'N/A'}
[AI生成: 详细配置说明]

### 4.2 备选方案
[AI生成: 保守方案和激进方案对比]

### 4.3 预期性能
- **年吞吐量**: ${tech?.expectedPerformance.annualThroughput || 'N/A'} MWh
- **系统效率**: ${Math.round((tech?.expectedPerformance.systemEfficiency || 0) * 100)}%
- **第10年容量保持率**: ${Math.round((tech?.expectedPerformance.year10Capacity || 0) * 100)}%
[AI生成: 性能预测和衰减曲线]`;

      case 'financial_analysis':
        const fm = context.getFinancialMetrics();
        const cf = context.getCashFlowAnalysis();
        return `## 5. 财务分析

### 5.1 投资估算
[AI生成: 基于cashFlowResult的投资估算表格]

### 5.2 收入预测
[AI生成: 10年收入预测表格]

### 5.3 财务指标
| 指标 | 数值 | 评级 |
|------|------|------|
| **内部收益率 (IRR)** | ${fm?.irr?.toFixed(2) || 'N/A'}% | ⭐⭐⭐⭐ |
| **净现值 (NPV, 8%)** | ¥${fm?.npv?.toFixed(0) || 'N/A'}万 | ⭐⭐⭐⭐ |
| **投资回收期** | ${fm?.paybackPeriodStatic?.toFixed(1) || 'N/A'}年 | ⭐⭐⭐ |
| **平准化度电成本 (LCOE)** | ¥${fm?.lcoc?.toFixed(2) || 'N/A'}/kWh | ⭐⭐⭐ |

### 5.4 敏感性分析
[AI生成: 基于sensitivityResult的敏感性分析]`;

      case 'risk_assessment':
        const ra = context.getRiskAssessmentReport();
        const lowRisks = (ra?.riskMatrix.low || []).map(r => `| 低 | ${r} |`).join('\n') || '无低风险';
        const mediumRisks = (ra?.riskMatrix.medium || []).map(r => `| 中 | ${r} |`).join('\n') || '无中风险';
        const highRisks = (ra?.riskMatrix.high || []).map(r => `| 高 | ${r} |`).join('\n') || '无高风险';
        const criticalRisks = (ra?.riskMatrix.critical || []).map(r => `| 极高 | ${r} |`).join('\n') || '无极高风险';

        return `## 6. 风险评估

### 6.1 风险矩阵
| 风险类别 | 风险等级 | 描述 |
|---------|---------|------|
${lowRisks}
${mediumRisks}
${highRisks}
${criticalRisks}

### 6.2 整体评级
- **风险评分**: ${ra?.overallRating.score || 0}/100
- **风险等级**: ${ra?.overallRating.level || 'N/A'}
- **置信度**: ${Math.round((ra?.overallRating.confidence || 0) * 100)}%

### 6.3 风险缓释策略
[AI生成: 基于mitigationStrategies的详细策略]`;

      case 'investment_recommendation':
        return `## 7. 投资建议

### 7.1 总体评估
[AI生成: 基于所有分析的综合评估]

### 7.2 投资建议
**【推荐投资 / 谨慎投资 / 不推荐投资】**

[AI生成: 一句话总结]

### 7.3 核心优势
[AI生成: 3-5条核心优势]

### 7.4 关键成功因素
[AI生成: 3-5条成功因素]

### 7.5 实施建议
[AI生成: 前期、建设、运营阶段建议]

### 7.6 后续监控要求
[AI生成: 监控计划和频率]`;

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
    const { chapter, context, targetAudience, language } = input;

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
    summaries.push(`项目: ${context.project.name || '未命名项目'}`);
    summaries.push(`省份: ${context.project.province || '未指定'}`);

    // Due diligence
    if (chapter === 'owner_due_diligence' || chapter === 'risk_assessment') {
      const dd = context.getDueDiligenceReport();
      if (dd) {
        summaries.push(`业主: ${dd.companyInfo.name}`);
        summaries.push(`信用等级: ${dd.creditRating.level} (${dd.creditRating.score}分)`);
      }
    }

    // Policy analysis
    if (chapter === 'policy_analysis' || chapter === 'risk_assessment') {
      const policy = context.getPolicyAnalysisReport();
      if (policy) {
        summaries.push(`价差: ${policy.currentPolicy.priceSpread} 元/kWh`);
        summaries.push(`政策稳定性: ${policy.stability.rating}`);
      }
    }

    // Technical proposal
    if (chapter === 'technical_assessment') {
      const tech = context.getTechnicalProposal();
      if (tech) {
        summaries.push(`推荐容量: ${tech.recommended.capacity} MWh`);
        summaries.push(`推荐功率: ${tech.recommended.power} MW`);
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
   * Get chapter name
   */
  private getChapterName(chapter: ChapterType): string {
    const names: Record<ChapterType, string> = {
      project_overview: '项目概况',
      owner_due_diligence: '业主背景调查',
      policy_analysis: '电价政策分析',
      technical_assessment: '技术方案评估',
      financial_analysis: '财务分析',
      risk_assessment: '风险评估',
      investment_recommendation: '投资建议',
    };
    return names[chapter] || chapter;
  }
}
