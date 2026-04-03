/**
 * 报告结构定义
 *
 * 定义 AI 投资报告的 6 个核心章节结构、内容要求和输出格式
 */

import type { ChapterType } from '../ReportDataContext';

export interface ReportSection {
  id: ChapterType;
  title: string;
  titleEn: string;
  order: number;
  required: boolean;
  templatePath: string;
}

export interface SectionTemplate {
  sectionId: string;
  template: string;
  requiredFields: string[];
  outputFormat: string;
}

/**
 * 报告章节结构定义
 *
 * 6 个核心章节：
 * 1. 执行摘要（Executive Summary）
 * 2. 项目概况（Project Overview）
 * 3. 财务分析（Financial Analysis）
 * 4. 政策环境（Policy Environment）
 * 5. 风险评估（Risk Assessment）
 * 6. 投资建议（Investment Recommendation）
 */
export const REPORT_STRUCTURE: ReportSection[] = [
  {
    id: 'executive_summary',
    title: '执行摘要',
    titleEn: 'Executive Summary',
    order: 1,
    required: true,
    templatePath: './templates/executive-summary.md',
  },
  {
    id: 'project_overview',
    title: '项目概况',
    titleEn: 'Project Overview',
    order: 2,
    required: true,
    templatePath: './templates/project-overview.md',
  },
  {
    id: 'financial_analysis',
    title: '财务分析',
    titleEn: 'Financial Analysis',
    order: 3,
    required: true,
    templatePath: './templates/financial-analysis.md',
  },
  {
    id: 'policy_environment',
    title: '政策环境',
    titleEn: 'Policy Environment',
    order: 4,
    required: true,
    templatePath: './templates/policy-environment.md',
  },
  {
    id: 'risk_assessment',
    title: '风险评估',
    titleEn: 'Risk Assessment',
    order: 5,
    required: true,
    templatePath: './templates/risk-assessment.md',
  },
  {
    id: 'investment_recommendation',
    title: '投资建议',
    titleEn: 'Investment Recommendation',
    order: 6,
    required: true,
    templatePath: './templates/investment-recommendation.md',
  },
];

/**
 * 章节之间的逻辑连接词模板
 *
 * 用于在章节之间添加过渡性语言，明确逻辑关系
 */
export const TRANSITION_TEMPLATES = {
  after_executive_summary: [
    '基于以上核心结论，我们将进一步分析项目的具体细节。',
    '以下章节将对项目进行全面的技术、财务、政策和风险评估。',
  ],
  after_project_overview: [
    '基于项目概况，我们首先分析其财务表现。',
    '财务分析将揭示项目的投资价值和盈利能力。',
  ],
  after_financial_analysis: [
    '基于以上财务分析结果，我们评估项目所在地的政策环境。',
    '政策环境将影响项目的合规性和收益水平。',
  ],
  after_policy_environment: [
    '考虑到项目所在地的政策环境，我们需要识别潜在风险。',
    '风险评估将帮助制定风险缓解策略。',
  ],
  after_risk_assessment: [
    '综合以上技术、财务、政策和风险分析，我们提出投资建议。',
    '投资建议将指导后续的决策和行动。',
  ],
};

/**
 * 获取章节之间的逻辑连接词
 *
 * @param fromSectionId 源章节 ID
 * @param toSectionId 目标章节 ID
 * @returns 逻辑连接词数组
 */
export function getTransitionText(fromSectionId: string, toSectionId: string): string[] {
  const key = `${fromSectionId}_to_${toSectionId}`;
  // 根据章节顺序返回适当的连接词
  if (toSectionId === 'project_overview') {
    return TRANSITION_TEMPLATES.after_executive_summary;
  }
  if (toSectionId === 'financial_analysis') {
    return TRANSITION_TEMPLATES.after_project_overview;
  }
  if (toSectionId === 'policy_environment') {
    return TRANSITION_TEMPLATES.after_financial_analysis;
  }
  if (toSectionId === 'risk_assessment') {
    return TRANSITION_TEMPLATES.after_policy_environment;
  }
  if (toSectionId === 'investment_recommendation') {
    return TRANSITION_TEMPLATES.after_risk_assessment;
  }
  return [];
}
