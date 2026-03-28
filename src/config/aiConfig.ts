/**
 * AI 助手配置
 *
 * 安全管理 API Key 和相关配置
 */

export const AI_CONFIG = {
  // API Key 配置
  apiKey: {
    // 从环境变量读取（生产环境推荐）
    env: import.meta.env.VITE_ANTHROPIC_API_KEY,

    // 从 localStorage 读取（用户自定义）
    localStorageKey: 'anthropic_api_key',

    // 检查是否有可用的 API Key
    isAvailable(): boolean {
      return !!(
        this.env ||
        localStorage.getItem(this.localStorageKey)
      );
    },

    // 获取 API Key
    get(): string | undefined {
      return this.env || localStorage.getItem(this.localStorageKey) || undefined;
    },

    // 设置用户 API Key
    set(key: string): void {
      localStorage.setItem(this.localStorageKey, key);
    },

    // 清除用户 API Key
    clear(): void {
      localStorage.removeItem(this.localStorageKey);
    }
  },

  // 模型配置
  model: {
    // 主模型（用于复杂问题）
    primary: 'claude-3-haiku-20240307',

    // 备选模型（用于快速回答）
    fast: 'claude-3-haiku-20240307',

    // 最大 tokens
    maxTokens: 1024,

    // 温度（控制创造性）
    temperature: 0.3
  },

  // 功能开关
  features: {
    // 电价问答
    tariffQA: true,

    // 储能方案建议
    storageSuggestion: true,

    // 数据分析解释
    analysisExplanation: true,

    // 多轮对话
    multiTurn: true,

    // 历史记录
    historyEnabled: true,

    // 最大历史记录数
    maxHistoryLength: 10
  },

  // UI 配置
  ui: {
    // 默认展开
    defaultExpanded: false,

    // 显示位置
    position: 'right', // 'left' | 'right'

    // 主题
    theme: 'light' as const
  },

  // 提示词模板
  prompts: {
    // 电价政策专家
    tariffExpert: `你是电价政策专家，熟悉中国工商业电价体系。
包括：峰谷电价、基本电费（容量/需量）、功率因数调整、政府性基金等。
请用简洁专业的语言回答问题。`,

    // 储能技术专家
    storageExpert: `你是储能技术专家，了解电池储能系统的各个组成部分。
包括：电池类型（磷酸铁锂、三元等）、PCS、BMS、集装箱设计、安全规范等。
请提供实用的技术建议。`,

    // 经济分析师
    economicExpert: `你是储能项目经济分析师，擅长评估项目的投资价值。
包括：ROI、回收期、IRR、NPV 等指标的计算和解读。
请用数据支持你的分析。`
  },

  // 常见问题（快速回答）
  quickQuestions: [
    '什么是峰谷电价？',
    '基本电费如何计算？',
    '10kV 和 0.4kV 有什么区别？',
    '储能项目的 ROI 一般是多少？',
    '如何选择储能系统容量？'
  ],

  // 预设的储能项目场景
  scenarios: {
    industrial: '工商业储能（峰谷套利为主）',
    largeIndustrial: '大工业储能（容量电价优化）',
    commercial: '商业储能（电费管理）',
    agricultural: '农业储能（不推荐）',
    residential: '居民储能（暂不支持）'
  }
};

/**
 * API Key 验证
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const testClient = new (await import('@anthropic-ai/sdk')).Anthropic({ apiKey });
    await testClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });
    return true;
  } catch (error) {
    console.error('API Key 验证失败:', error);
    return false;
  }
}
