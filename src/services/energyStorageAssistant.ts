/**
 * 储能项目 AI 助手服务
 *
 * 基于 NanoClaw 设计理念：
 * - 轻量级（核心代码 < 500 行）
 * - 安全（API key 本地管理）
 * - 针对储能项目优化
 */

import Anthropic from '@anthropic-ai/sdk';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
}

/**
 * 储能项目助手类
 *
 * 功能：
 * - 电价政策问答
 * - 储能方案建议
 * - 数据分析解释
 * - 经济性分析
 */
export class EnergyStorageAssistant {
  private client: Anthropic | null = null;
  private conversationHistory: Message[] = [];
  private model: string;
  private maxTokens: number;

  constructor(config: AssistantConfig = {}) {
    const apiKey = config.apiKey || this.getApiKey();

    if (apiKey) {
      this.client = new Anthropic({ 
        apiKey,
        dangerouslyAllowBrowser: true 
      });
    }

    this.model = config.model || 'claude-3-haiku-20240307';
    this.maxTokens = config.maxTokens || 1024;
  }

  /**
   * 获取 API Key
   * 优先级：环境变量 > 用户提供的 key
   */
  private getApiKey(): string | undefined {
    // 1. 从环境变量读取
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
      return import.meta.env.VITE_ANTHROPIC_API_KEY;
    }

    // 2. 从 localStorage 读取用户提供的 key
    const userKey = localStorage.getItem('anthropic_api_key');
    if (userKey) {
      return userKey;
    }

    return undefined;
  }

  /**
   * 检查助手是否可用
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * 设置用户 API Key
   */
  static setUserApiKey(apiKey: string): void {
    localStorage.setItem('anthropic_api_key', apiKey);
  }

  /**
   * 清除用户 API Key
   */
  static clearUserApiKey(): void {
    localStorage.removeItem('anthropic_api_key');
  }

  /**
   * 回答问题
   */
  async ask(question: string): Promise<string> {
    if (!this.client) {
      throw new Error('AI 助手未配置 API Key，请在设置中添加');
    }

    // 添加用户消息到历史
    this.conversationHistory.push({
      role: 'user',
      content: question
    });

    // 构建系统提示词
    const systemPrompt = this.buildSystemPrompt();

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: this.conversationHistory
      });

      const answer = response.content[0].type === 'text'
        ? response.content[0].text
        : '抱歉，我无法回答这个问题。';

      // 添加助手回答到历史
      this.conversationHistory.push({
        role: 'assistant',
        content: answer
      });

      // 保持历史记录在合理范围内（最近 10 条）
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      return answer;
    } catch (error) {
      console.error('AI 助手错误:', error);
      throw new Error('AI 助手暂时无法回答，请稍后重试');
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(): string {
    return `你是一个专业的储能项目咨询助手，专门帮助用户理解和评估储能项目的投资价值。

你的专业领域包括：
1. 电价政策：峰谷电价、基本电费、政府性基金等
2. 储能技术：电池类型、PCS、BMS、集装箱等
3. 经济分析：ROI、回收期、IRR、NPV 等指标
4. 政策法规：补贴政策、并网要求、安全规范

回答要求：
- 简洁明了，通常控制在 200 字以内
- 使用专业但易懂的语言
- 必要时提供数据支持和计算过程
- 如果信息不足，主动询问相关细节
- 对于超出专业范围的问题，诚实告知

当前日期：${new Date().toLocaleDateString('zh-CN')}`;
  }

  /**
   * 回答电价相关问题
   */
  async answerTariffQuestion(province: string, voltage: string, question: string): Promise<string> {
    const enhancedQuestion = `关于${province}${voltage}的电价：${question}`;
    return this.ask(enhancedQuestion);
  }

  /**
   * 储能方案建议
   */
  async suggestStorageProject(params: {
    province: string;
    voltage: string;
    monthlyUsage: number;
    peakLoad: number;
  }): Promise<string> {
    const prompt = `基于以下信息提供储能方案建议：
- 省份：${params.province}
- 电压等级：${params.voltage}
- 月用电量：${params.monthlyUsage} kWh
- 峰值负荷：${params.peakLoad} kW

请分析：
1. 是否适合安装储能系统
2. 推荐的储能配置（容量、功率）
3. 预期的经济效益
4. 需要注意的事项`;

    return this.ask(prompt);
  }

  /**
   * 解释数据分析结果
   */
  async explainAnalysis(data: {
    roi?: number;
    paybackPeriod?: number;
    monthlySavings?: number;
    annualSavings?: number;
  }): Promise<string> {
    const prompt = `请解释以下储能项目经济分析结果：
${data.roi ? `- ROI：${(data.roi * 100).toFixed(1)}%` : ''}
${data.paybackPeriod ? `- 回收期：${data.paybackPeriod.toFixed(1)} 年` : ''}
${data.monthlySavings ? `- 月节省：¥${data.monthlySavings.toFixed(2)}` : ''}
${data.annualSavings ? `- 年节省：¥${data.annualSavings.toFixed(2)}` : ''}

请解释：
1. 这些指标的含义
2. 项目是否值得投资
3. 有哪些改善空间`;

    return this.ask(prompt);
  }

  /**
   * 清空对话历史
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * 获取对话历史
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }
}

/**
 * 全局助手实例（单例模式）
 */
let assistantInstance: EnergyStorageAssistant | null = null;

export function getEnergyAssistant(): EnergyStorageAssistant {
  if (!assistantInstance) {
    assistantInstance = new EnergyStorageAssistant();
  }
  return assistantInstance;
}

export function resetEnergyAssistant(): void {
  if (assistantInstance) {
    assistantInstance.clearHistory();
  }
}
