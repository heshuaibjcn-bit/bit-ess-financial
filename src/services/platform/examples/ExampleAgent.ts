/**
 * 示例：使用平台通用服务创建智能体
 *
 * 演示如何使用 AgentBase 和 AIClient 快速开发新智能体
 */

import {
  AgentBase,
  AgentConfig,
  InputValidator,
  getAIClient,
  getCache
} from '../index';

/**
 * 示例：文本摘要智能体
 */
interface SummaryInput {
  text: string;
  maxLength?: number;
  style?: 'bullet' | 'paragraph';
}

interface SummaryOutput {
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
}

class SummaryAgent extends AgentBase<SummaryInput, SummaryOutput> {
  protected config: AgentConfig = {
    name: 'summary-agent',
    version: '1.0.0',
    description: '智能文本摘要生成',
    category: 'text-processing',
    cacheEnabled: true,
    cacheTTL: 1800000 // 30 minutes
  };

  protected validateInput(input: SummaryInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.text || typeof input.text !== 'string') {
      errors.push('text must be a non-empty string');
    }

    if (input.text.length < 50) {
      errors.push('text is too short to summarize (minimum 50 characters)');
    }

    if (input.maxLength && input.maxLength < 10) {
      errors.push('maxLength must be at least 10');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  protected async process(input: SummaryInput): Promise<SummaryOutput> {
    const systemPrompt = `你是一个专业的文本摘要专家。
请根据用户的要求生成简洁准确的摘要。`;

    const userPrompt = this.createPrompt(
      `请为以下文本生成摘要：

要求：
- 最大长度：{{maxLength}} 字
- 风格：{{style}}

文本内容：
{{text}}

请只返回摘要内容，不要有其他解释。`,
      {
        maxLength: input.maxLength || 200,
        style: input.style || 'paragraph',
        text: input.text.substring(0, 2000) // 限制输入长度
      }
    );

    const response = await this.callAI({
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
      maxTokens: 1024
    });

    return {
      summary: response.trim(),
      originalLength: input.text.length,
      summaryLength: response.length,
      compressionRatio: response.length / input.text.length
    };
  }
}

/**
 * 示例：情感分析智能体
 */
interface SentimentInput {
  text: string;
  language?: 'zh' | 'en';
}

interface SentimentOutput {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  keywords: string[];
}

class SentimentAgent extends AgentBase<SentimentInput, SentimentOutput> {
  protected config: AgentConfig = {
    name: 'sentiment-agent',
    version: '1.0.0',
    description: '智能情感分析',
    category: 'analysis',
    cacheEnabled: true,
    cacheTTL: 3600000 // 1 hour
  };

  protected validateInput(input: SentimentInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.text || typeof input.text !== 'string') {
      errors.push('text must be a non-empty string');
    }

    if (input.text.length > 5000) {
      errors.push('text is too long (maximum 5000 characters)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  protected async process(input: SentimentInput): Promise<SentimentOutput> {
    const systemPrompt = `你是一个专业的情感分析专家。
请分析文本的情感倾向，返回 JSON 格式结果。`;

    const userPrompt = `请分析以下文本的情感：

文本：${input.text}

请返回 JSON 格式：
{
  "sentiment": "positive/neutral/negative",
  "confidence": 0.0-1.0,
  "keywords": ["关键词1", "关键词2"]
}`;

    const response = await this.callAI({
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
      maxTokens: 512
    });

    const result = this.parseJSONResponse(response);

    return {
      sentiment: result.sentiment || 'neutral',
      confidence: result.confidence || 0.5,
      keywords: result.keywords || []
    };
  }
}

/**
 * 示例：数据转换智能体
 */
interface TransformInput {
  data: any[];
  operation: 'filter' | 'map' | 'aggregate' | 'sort';
  config?: Record<string, any>;
}

interface TransformOutput {
  result: any[];
  count: number;
  operation: string;
}

class DataTransformAgent extends AgentBase<TransformInput, TransformOutput> {
  protected config: AgentConfig = {
    name: 'data-transform-agent',
    version: '1.0.0',
    description: '智能数据转换',
    category: 'data-processing',
    cacheEnabled: false // 数据转换通常不缓存
  };

  protected validateInput(input: TransformInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(input.data)) {
      errors.push('data must be an array');
    }

    if (!['filter', 'map', 'aggregate', 'sort'].includes(input.operation)) {
      errors.push('operation must be one of: filter, map, aggregate, sort');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  protected async process(input: TransformInput): Promise<TransformOutput> {
    // 对于数据转换，我们可能不需要 AI，直接使用代码处理
    // 但这里演示如何使用 AI 来理解转换需求

    if (input.operation === 'filter') {
      const result = input.data.filter(item => {
        // 使用 AI 配置来决定过滤逻辑
        if (input.config?.condition) {
          return this.evaluateCondition(item, input.config.condition);
        }
        return true;
      });

      return {
        result,
        count: result.length,
        operation: 'filter'
      };
    }

    if (input.operation === 'sort') {
      const result = [...input.data].sort((a, b) => {
        if (input.config?.field && typeof a === 'object' && typeof b === 'object') {
          const aVal = (a as any)[input.config.field];
          const bVal = (b as any)[input.config.field];
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
        return 0;
      });

      return {
        result,
        count: result.length,
        operation: 'sort'
      };
    }

    // 其他操作的实现...
    return {
      result: input.data,
      count: input.data.length,
      operation: input.operation
    };
  }

  private evaluateCondition(item: any, condition: string): boolean {
    // 简化的条件评估
    // 实际应用中可以使用更复杂的表达式解析器
    try {
      const func = new Function('item', `return ${condition}`);
      return func(item);
    } catch {
      return false;
    }
  }
}

/**
 * 使用示例
 */
export async function exampleUsage() {
  // 1. 创建智能体实例
  const summaryAgent = new SummaryAgent();
  const sentimentAgent = new SentimentAgent();
  const transformAgent = new DataTransformAgent();

  // 2. 执行智能体任务
  const summaryResult = await summaryAgent.execute({
    text: '这是一段很长的文本，需要生成摘要...',
    maxLength: 100,
    style: 'bullet'
  });

  console.log('Summary Result:', summaryResult);

  // 3. 批量执行
  const sentimentResults = await sentimentAgent.executeBatch([
    { text: '这个产品很棒！' },
    { text: '质量一般，不太推荐' },
    { text: '服务态度很差，失望！' }
  ]);

  console.log('Sentiment Results:', sentimentResults);

  // 4. 数据转换
  const transformResult = await transformAgent.execute({
    data: [
      { name: 'Alice', score: 85 },
      { name: 'Bob', score: 92 },
      { name: 'Charlie', score: 78 }
    ],
    operation: 'sort',
    config: { field: 'score' }
  });

  console.log('Transform Result:', transformResult);

  // 5. 查看智能体状态
  console.log('Agent Status:', summaryAgent.getStatus());

  return {
    summary: summaryResult,
    sentiments: sentimentResults,
    transform: transformResult
  };
}

// 导出智能体类
export { SummaryAgent, SentimentAgent, DataTransformAgent };
