/**
 * AI模型配置
 *
 * 统一管理项目中使用的所有AI模型
 * 支持快速切换和版本管理
 */

// ==================== GLM 模型配置 ====================

/**
 * GLM模型类型定义
 */
export type GLMModelType =
  | 'glm-5-turbo'      // GLM-5 Turbo (最新推荐)
  | 'glm-4-plus'       // GLM-4 Plus
  | 'glm-4'            // GLM-4 基础版
  | 'glm-3-turbo'      // GLM-3 Turbo
  | 'glm-3';           // GLM-3 基础版

/**
 * 默认模型配置
 */
export const DEFAULT_GLM_MODEL: GLMModelType = 'glm-5-turbo';

/**
 * 可用的GLM模型列表
 */
export const AVAILABLE_GLM_MODELS: GLMModelType[] = [
  'glm-5-turbo',
  'glm-4-plus',
  'glm-4',
  'glm-3-turbo',
  'glm-3'
];

/**
 * 模型显示名称
 */
export const GLM_MODEL_NAMES: Record<GLMModelType, string> = {
  'glm-5-turbo': 'GLM-5 Turbo (最新推荐)',
  'glm-4-plus': 'GLM-4 Plus',
  'glm-4': 'GLM-4',
  'glm-3-turbo': 'GLM-3 Turbo',
  'glm-3': 'GLM-3'
};

/**
 * 模型参数配置
 */
export const GLM_MODEL_CONFIGS: Record<GLMModelType, {
  maxTokens: number;
  temperature: number;
  description: string;
}> = {
  'glm-5-turbo': {
    maxTokens: 8192,
    temperature: 0.7,
    description: 'GLM-5 Turbo - 最新版本，性能最优'
  },
  'glm-4-plus': {
    maxTokens: 4096,
    temperature: 0.7,
    description: 'GLM-4 Plus - 增强版本'
  },
  'glm-4': {
    maxTokens: 4096,
    temperature: 0.7,
    description: 'GLM-4 - 标准版本'
  },
  'glm-3-turbo': {
    maxTokens: 2048,
    temperature: 0.7,
    description: 'GLM-3 Turbo - 性价比高'
  },
  'glm-3': {
    maxTokens: 2048,
    temperature: 0.7,
    description: 'GLM-3 - 基础版本'
  }
};

/**
 * 智能体专用模型配置
 * 不同智能体可以使用不同的模型以优化成本和性能
 */
export const AGENT_MODEL_CONFIGS: Record<string, GLMModelType> = {
  // 政策分析 - 需要高准确性
  'PolicyUpdateAgent': 'glm-5-turbo',

  // 电价更新 - 需要数据处理能力
  'TariffUpdateAgent': 'glm-5-turbo',

  // 尽职调查 - 需要深入分析
  'DueDiligenceAgent': 'glm-5-turbo',

  // 舆情分析 - 需要语义理解
  'SentimentAnalysisAgent': 'glm-5-turbo',

  // 技术可行性 - 需要专业知识
  'TechnicalFeasibilityAgent': 'glm-5-turbo',

  // 财务可行性 - 需要计算能力
  'FinancialFeasibilityAgent': 'glm-5-turbo',

  // 报告生成 - 需要长文本生成
  'ReportGenerationAgent': 'glm-5-turbo'
};

/**
 * 获取智能体使用的模型
 */
export function getAgentModel(agentName: string): GLMModelType {
  return AGENT_MODEL_CONFIGS[agentName] || DEFAULT_GLM_MODEL;
}

/**
 * 获取模型配置
 */
export function getModelConfig(model: GLMModelType) {
  return GLM_MODEL_CONFIGS[model];
}

/**
 * 验证模型是否可用
 */
export function isValidModel(model: string): model is GLMModelType {
  return AVAILABLE_GLM_MODELS.includes(model as GLMModelType);
}

/**
 * 获取当前使用的模型（支持动态切换）
 */
export function getCurrentModel(): GLMModelType {
  // 优先从环境变量读取
  if (import.meta.env.VITE_GLM_MODEL) {
    const envModel = import.meta.env.VITE_GLM_MODEL as GLMModelType;
    if (isValidModel(envModel)) {
      return envModel;
    }
  }

  // 其次从localStorage读取
  const storedModel = localStorage.getItem('glm_model') as GLMModelType;
  if (storedModel && isValidModel(storedModel)) {
    return storedModel;
  }

  // 最后使用默认模型
  return DEFAULT_GLM_MODEL;
}

/**
 * 设置当前使用的模型
 */
export function setCurrentModel(model: GLMModelType): void {
  if (isValidModel(model)) {
    localStorage.setItem('glm_model', model);
    console.log(`✅ 模型已切换到: ${GLM_MODEL_NAMES[model]}`);
  } else {
    console.error(`❌ 无效的模型: ${model}`);
    throw new Error(`Invalid model: ${model}`);
  }
}

/**
 * 获取所有可用模型的列表（用于UI选择）
 */
export function getAvailableModels(): Array<{value: GLMModelType; label: string}> {
  return AVAILABLE_GLM_MODELS.map(model => ({
    value: model,
    label: GLM_MODEL_NAMES[model]
  }));
}
