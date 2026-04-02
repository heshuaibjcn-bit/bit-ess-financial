/**
 * PromptBuilder - Build structured prompts for AI analysis
 *
 * Creates system and user prompts for energy storage investment analysis
 */

import { formatContextAsText } from './ContextBuilder';
import type { ProjectAnalysisContext } from '@/types/ai';

/**
 * System prompt for AI assistant
 */
export function buildSystemPrompt(language: 'zh' | 'en' = 'zh'): string {
  const isZh = language === 'zh';

  if (isZh) {
    return `你是一位专业的工商业储能投资顾问AI助手。你的职责是帮助用户分析储能项目的投资价值。

## 你的能力
1. **投资分析**: 分析项目的财务指标（IRR、NPV、投资回收期等）
2. **风险评估**: 识别项目的技术、市场、政策风险
3. **优化建议**: 提供具体的参数优化建议来提升收益
4. **行业对比**: 与同类项目进行对比分析
5. **敏感度分析**: 识别影响收益的关键因素

## 回答原则
- **数据驱动**: 基于项目实际数据进行分析，不要凭空猜测
- **结构清晰**: 使用分段和列表让回答更易读
- **具体可行**: 给出可操作的具体建议
- **客观中立**: 客观陈述优势和风险，不夸大收益
- **专业准确**: 使用正确的专业术语和计算方法

## 输出格式
- 使用Markdown格式
- 重要数据使用加粗
- 使用表格对比数据
- 代码块展示计算过程

## 注意事项
- 如果IRR为负或很低，明确指出投资风险
- 考虑省份政策差异（峰谷价差、补贴政策等）
- 提醒用户注意技术衰减、运维成本等长期因素`;
  }

  return `You are a professional commercial and industrial energy storage investment advisor AI assistant. Your role is to help users analyze the investment value of energy storage projects.

## Your Capabilities
1. **Investment Analysis**: Analyze financial metrics (IRR, NPV, payback period, etc.)
2. **Risk Assessment**: Identify technical, market, and policy risks
3. **Optimization Suggestions**: Provide specific parameter optimization recommendations to improve returns
4. **Industry Comparison**: Compare with similar projects
5. **Sensitivity Analysis**: Identify key factors affecting returns

## Response Principles
- **Data-Driven**: Analyze based on actual project data, do not make assumptions
- **Clear Structure**: Use sections and lists for better readability
- **Actionable**: Provide practical and specific recommendations
- **Objective**: State advantages and risks objectively, do not exaggerate returns
- **Professional**: Use correct terminology and calculation methods

## Output Format
- Use Markdown format
- Bold important data
- Use tables for data comparison
- Use code blocks for calculations

## Important Notes
- If IRR is negative or very low, clearly state the investment risks
- Consider provincial policy differences (peak-valley price spread, subsidies, etc.)
- Remind users about long-term factors like degradation and O&M costs`;
}

/**
 * User prompt with project context
 */
export function buildUserPrompt(
  userQuestion: string,
  context: ProjectAnalysisContext,
  language: 'zh' | 'en' = 'zh'
): string {
  const isZh = language === 'zh';

  let prompt = isZh
    ? `# 储能项目投资分析\n\n`
    : `# Energy Storage Project Investment Analysis\n\n`;

  // Add formatted context
  prompt += formatContextAsText(context, language);

  // Add user question
  prompt += isZh ? `\n## 用户问题\n${userQuestion}\n\n` : `\n## User Question\n${userQuestion}\n\n`;

  // Add analysis guidance
  prompt += isZh
    ? `请基于以上项目数据回答用户问题。如果涉及计算，请展示计算过程。给出具体、可操作的建议。`
    : `Please answer the user's question based on the project data above. If calculations are involved, show the process. Provide specific, actionable recommendations.`;

  return prompt;
}

/**
 * Build quick prompt from template
 */
export function buildQuickPrompt(
  template: string,
  context: ProjectAnalysisContext,
  language: 'zh' | 'en' = 'zh'
): string {
  return buildUserPrompt(template, context, language);
}

/**
 * Build follow-up prompt
 */
export function buildFollowUpPrompt(
  conversationHistory: string,
  newQuestion: string,
  context: ProjectAnalysisContext,
  language: 'zh' | 'en' = 'zh'
): string {
  const isZh = language === 'zh';

  let prompt = isZh
    ? `# 继续对话\n\n`
    : `# Continuing Conversation\n\n`;

  prompt += isZh
    ? `以下是之前的对话历史和项目数据，请继续回答用户的新问题。\n\n`
    : `Below is the previous conversation history and project data. Please continue to answer the user's new question.\n\n`;

  // Add conversation history summary
  if (conversationHistory) {
    prompt += isZh ? `## 对话历史\n${conversationHistory}\n\n` : `## Conversation History\n${conversationHistory}\n\n`;
  }

  // Add project context (abbreviated)
  prompt += isZh ? `## 项目数据\n` : `## Project Data\n`;
  prompt += formatContextAsText(context, language);

  // Add new question
  prompt += isZh ? `\n## 新问题\n${newQuestion}\n\n` : `\n## New Question\n${newQuestion}\n\n`;

  return prompt;
}

/**
 * Extract conversation summary for context
 */
export function extractConversationSummary(messages: Array<{ role: string; content: string }>, language: 'zh' | 'en' = 'zh'): string {
  const isZh = language === 'zh';

  // Get last 5 exchanges (10 messages) for context
  const recentMessages = messages.slice(-10);

  if (recentMessages.length === 0) {
    return '';
  }

  let summary = isZh ? '最近的对话：\n' : 'Recent conversation:\n';

  recentMessages.forEach((msg) => {
    const role = msg.role === 'user' ? (isZh ? '用户' : 'User') : (isZh ? 'AI助手' : 'AI Assistant');
    // Truncate long messages
    const content = msg.content.length > 500 ? msg.content.substring(0, 500) + '...' : msg.content;
    summary += `${role}: ${content}\n\n`;
  });

  return summary;
}
