/**
 * AIChatService - Main AI chat service
 *
 * Handles communication with AI providers (Anthropic, OpenAI, or Mock)
 */

import type {
  AIServiceConfig,
  AIServiceResponse,
  StreamEvent,
  ChatMessage,
  ProjectAnalysisContext,
} from '@/types/ai';
import { parseSSEStream, createMockStream } from './StreamHandler';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AIServiceConfig = {
  provider: (import.meta.env.VITE_AI_PROVIDER as any) || 'glm',
  maxTokens: 2000,
  temperature: 0.7,
  streamEnabled: true,
};

/**
 * AI Chat Service
 */
export class AIChatService {
  private config: AIServiceConfig;

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      // 如果提供了 apiKey，覆盖默认值
      apiKey: config.apiKey || import.meta.env.VITE_GLM_API_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send message and get response (non-streaming)
   */
  async sendMessage(
    systemPrompt: string,
    userPrompt: string
  ): Promise<AIServiceResponse> {
    const { provider } = this.config;

    switch (provider) {
      case 'anthropic':
        return this.sendAnthropicMessage(systemPrompt, userPrompt);
      case 'openai':
        return this.sendOpenAIMessage(systemPrompt, userPrompt);
      case 'mock':
        return this.sendMockMessage(systemPrompt, userPrompt);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Send message with streaming response
   */
  async *sendMessageStream(
    systemPrompt: string,
    userPrompt: string,
    signal?: AbortSignal
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const { provider } = this.config;

    switch (provider) {
      case 'anthropic':
        yield* this.sendAnthropicStream(systemPrompt, userPrompt, signal);
        break;
      case 'openai':
        yield* this.sendOpenAIStream(systemPrompt, userPrompt, signal);
        break;
      case 'mock':
        yield* this.sendMockStream(systemPrompt, userPrompt, signal);
        break;
      default:
        yield { type: 'error', error: `Unsupported provider: ${provider}` };
    }
  }

  /**
   * Anthropic Claude API - Non-streaming
   */
  private async sendAnthropicMessage(
    systemPrompt: string,
    userPrompt: string
  ): Promise<AIServiceResponse> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: this.config.maxTokens || 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      finishReason: data.stop_reason,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }

  /**
   * Anthropic Claude API - Streaming
   */
  private async *sendAnthropicStream(
    systemPrompt: string,
    userPrompt: string,
    signal?: AbortSignal
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      yield { type: 'error', error: 'Anthropic API key is required' };
      return;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-sonnet-20240229',
          max_tokens: this.config.maxTokens || 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        yield { type: 'error', error: `Anthropic API error: ${response.status}` };
        return;
      }

      yield* parseSSEStream(response);
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * OpenAI API - Non-streaming
   */
  private async sendOpenAIMessage(
    systemPrompt: string,
    userPrompt: string
  ): Promise<AIServiceResponse> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: this.config.maxTokens || 2000,
        temperature: this.config.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      finishReason: data.choices[0].finish_reason,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  /**
   * OpenAI API - Streaming
   */
  private async *sendOpenAIStream(
    systemPrompt: string,
    userPrompt: string,
    signal?: AbortSignal
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      yield { type: 'error', error: 'OpenAI API key is required' };
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: this.config.maxTokens || 2000,
          temperature: this.config.temperature ?? 0.7,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        yield { type: 'error', error: `OpenAI API error: ${response.status}` };
        return;
      }

      yield* parseSSEStream(response);
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Mock implementation for testing/demo
   */
  private async sendMockMessage(
    systemPrompt: string,
    userPrompt: string
  ): Promise<AIServiceResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockResponse = this.generateMockResponse(userPrompt);

    return {
      content: mockResponse,
      finishReason: 'stop',
      usage: {
        promptTokens: systemPrompt.length + userPrompt.length,
        completionTokens: mockResponse.length,
        totalTokens: systemPrompt.length + userPrompt.length + mockResponse.length,
      },
    };
  }

  /**
   * Mock streaming implementation
   */
  private async *sendMockStream(
    systemPrompt: string,
    userPrompt: string,
    signal?: AbortSignal
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const mockResponse = this.generateMockResponse(userPrompt);
    yield* createMockStream(mockResponse, 20, signal);
  }

  /**
   * Generate mock response based on question
   */
  private generateMockResponse(question: string): string {
    const q = question.toLowerCase();

    if (q.includes('风险') || q.includes('risk')) {
      return `## 投资风险分析

基于当前项目数据，以下是主要风险因素：

### 1. 电价政策风险 ⚠️
- **风险等级**: 中等
- **说明**: 峰谷电价政策可能随电力市场改革调整，套利空间存在不确定性
- **建议**: 关注当地电力市场化改革进展，预留电价波动缓冲

### 2. 技术衰减风险 🔋
- **风险等级**: 中等
- **说明**: 电池容量年衰减率2%，10年后续航能力降至约82%
- **建议**: 选择高品质电池品牌，预留15%容量冗余

### 3. 运维成本上升 📈
- **风险等级**: 较低
- **说明**: 随设备老化，年运维成本可能上升10-20%
- **建议**: 建立运维成本储备金

### 总体评估
当前项目**风险可控**，建议重点关注电价政策变化和技术性能保证。`;
    }

    if (q.includes('优化') || q.includes('optimiz') || q.includes('improve')) {
      return `## 优化建议

基于当前参数分析，以下3项优化措施可显著提升IRR：

### 1. 增加日循环次数 🔄
- **当前**: 2次/天
- **建议**: 提升至2.5-3次/天
- **预期效果**: IRR提升约**2-3个百分点**
- **实施**: 增加峰谷套利时段，参与需求响应

### 2. 降低系统成本 💰
- **当前**: 电池成本0.5元/kWh
- **建议**: 通过集采降至0.45元/kWh以下
- **预期效果**: 初始投资降低10%，IRR提升约**1.5个百分点**
- **实施**: 与头部供应商洽谈批量采购

### 3. 提高系统效率 ⚡
- **当前**: 90%
- **建议**: 选用高效PCS和BMS，提升至92%
- **预期效果**: 年收入增加约2.2%
- **实施**: 选择Tier-1设备品牌

### 优先级排序
1. **立即实施**: 增加日循环次数（无额外成本）
2. **中期优化**: 系统成本谈判（采购阶段）
3. **持续改进**: 系统效率监控（运维阶段）`;
    }

    if (q.includes('对比') || q.includes('compare') || q.includes('benchmark')) {
      return `## 行业对比分析

### 与同类项目对比

| 指标 | 您的项目 | 行业平均 | 评价 |
|------|---------|---------|------|
| IRR | **8.5%** | 7.5% | ✅ 高于平均 |
| 投资回收期 | 8.2年 | 9.5年 | ✅ 回收更快 |
| 单位造价 | ¥1.45/Wh | ¥1.50/Wh | ✅ 成本控制良好 |

### 核心优势 🌟

1. **成本控制优秀**: 通过优化供应链，单位造价低于行业3.3%
2. **选址合理**: 该省份峰谷价差较大，套利空间充足
3. **运行策略**: 日循环次数设置合理，充分利用价差

### 潜在改进空间

1. **容量补偿收入**: 当前为0，可探索参与电力辅助服务市场
2. **需求响应**: 尚未接入，年可增加收入约5-10万元

### 结论
您的项目**优于行业平均水平**，建议重点关注电力辅助服务市场机会。`;
    }

    if (q.includes('敏感') || q.includes('sensitivity')) {
      return `## 敏感性分析结果

### 最敏感参数排名

1. **⚡ 峰谷电价差** - 影响程度: **高**
   - ±10%价差变化 → IRR变化约±3.5个百分点
   - 说明: 电价是收益的核心驱动因素
   - 风险: 电价政策调整可能显著影响收益

2. **🔋 电池成本** - 影响程度: **高**
   - ±10%成本变化 → IRR变化约±2个百分点
   - 说明: 初始投资占比较大，成本影响显著
   - 对策: 批量采购、设备租赁降低成本压力

3. **📊 系统效率** - 影响程度: **中**
   - ±5%效率变化 → IRR变化约±1个百分点
   - 说明: 效率影响充放电收益
   - 对策: 选用高效设备，定期维护

### 关键建议

**最敏感参数是峰谷电价差**，建议：
- 优先选择峰谷价差大且稳定的省份
- 签订长期电价协议（如可能）
- 参与电力辅助服务增加收入来源

`;
    }

    // Default response
    return `## 分析结果

感谢您的提问。基于当前项目数据：

### 项目概况
- **省份**: ${['广东', '江苏', '浙江', '山东'][Math.floor(Math.random() * 4)]}
- **系统规模**: 2MWh / 500kW
- **内部收益率**: 8.5%
- **投资回收期**: 8.2年

### 主要优势
1. 选址合理，峰谷价差充足
2. 成本控制良好，低于行业平均
3. 运行参数设置科学

### 建议
- 关注电力辅助服务市场机会
- 探索需求响应收益模式
- 建立电价监控机制

如需更详细的分析，请提出具体问题。`;
  }
}

/**
 * Create singleton instance
 */
export const aiChatService = new AIChatService();

/**
 * Initialize service with config
 */
export function initializeAIChat(config: Partial<AIServiceConfig>): void {
  aiChatService.updateConfig(config);
}
