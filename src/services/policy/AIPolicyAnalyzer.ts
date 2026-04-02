/**
 * AI Policy Analyzer - Intelligent Policy Analysis Service
 *
 * Uses AI to analyze and summarize energy storage policies:
 * - Extract key information from policy documents
 * - Generate concise summaries
 * - Analyze impact on energy storage projects
 * - Provide actionable recommendations
 */

import Anthropic from '@anthropic-ai/sdk';
import { getEnergyAssistant } from '../energyStorageAssistant';
import type {
  PolicySummary,
  PolicyCategory,
  PolicyLevel,
} from '../../domain/schemas/PolicySchema';

export interface PolicyAnalysisInput {
  title: string;
  category: PolicyCategory;
  level: PolicyLevel;
  fullText?: string;
  source: string;
  sourceAgency: string;
  province?: string;
}

export interface PolicyAnalysisResult {
  summary: PolicySummary;
  confidence: number;
  processingTime: number;
}

/**
 * AI Policy Analyzer Class
 */
export class AIPolicyAnalyzer {
  private client: Anthropic | null = null;
  private model: string = 'claude-3-haiku-20240307';
  private maxTokens: number = 4096;

  constructor() {
    // Use existing API key from energy storage assistant
    const assistant = getEnergyAssistant();
    if (assistant.isAvailable()) {
      // Access private client through reflection or create new instance
      const apiKey = this.getApiKey();
      if (apiKey) {
        this.client = new Anthropic({ 
          apiKey,
          dangerouslyAllowBrowser: true 
        });
      }
    }
  }

  /**
   * Get API key from localStorage or environment
   */
  private getApiKey(): string | undefined {
    // Try localStorage first
    const userKey = localStorage.getItem('anthropic_api_key');
    if (userKey) {
      return userKey;
    }

    // Try environment variable
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
      return import.meta.env.VITE_ANTHROPIC_API_KEY;
    }

    return undefined;
  }

  /**
   * Check if analyzer is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Analyze a policy document
   */
  async analyzePolicy(input: PolicyAnalysisInput): Promise<PolicyAnalysisResult> {
    if (!this.client) {
      throw new Error('AI analyzer not available - please configure API key');
    }

    const startTime = Date.now();

    try {
      const prompt = this.buildAnalysisPrompt(input);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      // Parse the AI response
      const result = this.parseAnalysisResponse(text);
      const processingTime = Date.now() - startTime;

      return {
        summary: result,
        confidence: 0.85, // Base confidence, can be adjusted based on response quality
        processingTime,
      };
    } catch (error) {
      console.error('Policy analysis failed:', error);
      throw new Error(`Failed to analyze policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the analysis prompt
   */
  private buildAnalysisPrompt(input: PolicyAnalysisInput): string {
    const { title, category, level, fullText, source, sourceAgency, province } = input;

    return `你是储能政策分析专家。请分析以下政策文件：

【政策基本信息】
标题：${title}
类别：${this.getCategoryName(category)}
级别：${this.getLevelName(level)}
来源：${source}
发布机构：${sourceAgency}
${province ? `适用省份：${province}` : ''}

【政策正文】
${fullText || '（暂无全文）'}

请按照以下JSON格式返回分析结果：

{
  "title": "${title}",
  "summary": "政策摘要，100-200字，突出核心内容",
  "keyPoints": [
    "关键要点1",
    "关键要点2",
    "关键要点3",
    "关键要点4",
    "关键要点5"
  ],
  "impact": "对该地区储能项目的具体影响，包括投资回报、市场机会等",
  "recommendation": "给投资者的具体建议，包括是否适合投资、注意事项等",
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"],
  "confidence": 0.9
}

要求：
1. 摘要要简明扼要，突出核心信息
2. 关键要点要具体，包含数字和时间
3. 影响分析要专业，结合储能项目实际情况
4. 建议要具有可操作性
5. 标签要准确反映政策主题
6. 只返回JSON，不要包含其他文字`;
  }

  /**
   * Parse AI response into PolicySummary
   */
  private parseAnalysisResponse(text: string): PolicySummary {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        title: parsed.title || '',
        summary: parsed.summary || '',
        keyPoints: parsed.keyPoints || [],
        impact: parsed.impact || '',
        recommendation: parsed.recommendation || '',
        tags: parsed.tags || [],
        confidence: parsed.confidence || 0.7,
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);

      // Return fallback summary
      return {
        title: '政策分析',
        summary: 'AI分析暂不可用，请查看原文',
        keyPoints: ['分析失败'],
        impact: '无法分析影响',
        recommendation: '建议人工审核政策内容',
        tags: ['需人工审核'],
        confidence: 0,
      };
    }
  }

  /**
   * Batch analyze multiple policies
   */
  async analyzeBatch(inputs: PolicyAnalysisInput[]): Promise<PolicyAnalysisResult[]> {
    const results: PolicyAnalysisResult[] = [];

    for (const input of inputs) {
      try {
        const result = await this.analyzePolicy(input);
        results.push(result);
      } catch (error) {
        console.error(`Failed to analyze policy: ${input.title}`, error);
        // Add fallback result
        results.push({
          summary: {
            title: input.title,
            summary: '分析失败',
            keyPoints: [],
            impact: '未知',
            recommendation: '请人工审核',
            tags: ['分析失败'],
            confidence: 0,
          },
          confidence: 0,
          processingTime: 0,
        });
      }
    }

    return results;
  }

  /**
   * Get policy category name in Chinese
   */
  private getCategoryName(category: PolicyCategory): string {
    const names: Record<PolicyCategory, string> = {
      tariff: '电价政策',
      subsidy: '补贴政策',
      technical: '技术标准',
      market: '市场政策',
      grid: '并网政策',
      planning: '规划政策',
      tax: '税收政策',
    };
    return names[category] || category;
  }

  /**
   * Get policy level name in Chinese
   */
  private getLevelName(level: PolicyLevel): string {
    const names: Record<PolicyLevel, string> = {
      national: '国家级',
      provincial: '省级',
      municipal: '市级',
      regional: '区域级',
    };
    return names[level] || level;
  }

  /**
   * Extract policy metadata from text
   */
  async extractMetadata(fullText: string): Promise<{
    documentNumber?: string;
    effectiveDate?: string;
    expiryDate?: string;
    commentDeadline?: string;
    relatedDocuments?: string[];
  }> {
    if (!this.client) {
      return {};
    }

    try {
      const prompt = `从以下政策文本中提取关键元数据：

${fullText}

请以JSON格式返回：
{
  "documentNumber": "文号（如有）",
  "effectiveDate": "生效日期（ISO 8601格式）",
  "expiryDate": "失效日期（ISO 8601格式，如有）",
  "commentDeadline": "征求意见截止日期（ISO 8601格式，如有）",
  "relatedDocuments": ["相关文档1", "相关文档2"]
}

只返回JSON，不要其他文字。`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {};
    } catch (error) {
      console.error('Failed to extract metadata:', error);
      return {};
    }
  }
}

// Singleton instance
let analyzerInstance: AIPolicyAnalyzer | null = null;

export function getPolicyAnalyzer(): AIPolicyAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new AIPolicyAnalyzer();
  }
  return analyzerInstance;
}
