/**
 * 电价数据源配置
 *
 * 提供真实数据源和模拟数据的配置选项
 */

export interface DataSourceConfig {
  useRealData: boolean;
  enabledSources: string[];
  fallbackToMock: boolean;
  crawlTimeout: number; // 毫秒
  retryAttempts: number;
}

export const DEFAULT_CONFIG: DataSourceConfig = {
  useRealData: false, // 默认关闭真实数据抓取
  enabledSources: ['GD', 'ZJ', 'JS'],
  fallbackToMock: true, // 真实抓取失败时回退到模拟数据
  crawlTimeout: 10000, // 10秒超时
  retryAttempts: 2, // 重试2次
};

/**
 * 数据源状态说明
 */
export const DATA_SOURCE_INFO = {
  realData: {
    name: '真实数据抓取',
    description: '从政府网站实时抓取最新电价政策',
    advantages: [
      '获取最新、最准确的电价数据',
      '自动更新，无需手动维护',
      '支持PDF和HTML格式解析',
    ],
    limitations: [
      '依赖政府网站可用性',
      '网站结构变化可能导致解析失败',
      '需要CORS代理或后端服务支持',
      '抓取速度较慢（10-30秒）',
    ],
    requirements: [
      '需要配置CORS代理或后端API服务',
      '政府网站需要允许访问',
      '稳定的网络连接',
    ],
  },
  mockData: {
    name: '模拟数据',
    description: '使用预设的模拟电价数据进行演示和测试',
    advantages: [
      '快速稳定，不受外部限制',
      '适合演示和测试',
      '无需网络请求',
    ],
    limitations: [
      '数据不是真实的',
      '无法获取最新政策',
      '仅用于演示目的',
    ],
  },
  productionMode: {
    name: '生产模式建议',
    description: '在生产环境中的最佳实践',
    recommendations: [
      '使用后端API服务处理爬虫请求',
      '建立定时任务（如每天凌晨）自动抓取',
      '实现数据验证和审批流程',
      '添加错误监控和告警',
      '提供手动覆盖和紧急更新功能',
    ],
    architecture: [
      'Browser → Backend API → Crawler → Government Websites',
      'Backend API处理CORS和认证问题',
      '使用Redis缓存避免频繁请求',
      '使用消息队列处理异步任务',
    ],
  },
};

/**
 * 获取配置
 */
export function getDataSourceConfig(): DataSourceConfig {
  const stored = localStorage.getItem('tariff_data_source_config');
  if (stored) {
    return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  }
  return DEFAULT_CONFIG;
}

/**
 * 保存配置
 */
export function saveDataSourceConfig(config: Partial<DataSourceConfig>): void {
  const current = getDataSourceConfig();
  const updated = { ...current, ...config };
  localStorage.setItem('tariff_data_source_config', JSON.stringify(updated));
}

/**
 * 重置配置
 */
export function resetDataSourceConfig(): void {
  localStorage.removeItem('tariff_data_source_config');
}
