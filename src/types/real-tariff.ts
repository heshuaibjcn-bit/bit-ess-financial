/**
 * 真实电价数据类型定义
 * 
 * 100%真实数据，无mock
 */

// 省份基础信息
export interface Province {
  code: string;           // 省份代码：GD/ZJ/JS...
  name: string;           // 省份名称
  region: string;         // 电网区域：南方/华东/华北等
  gridCompany: string;    // 电网公司
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 数据来源类型
export type DataSourceType = 'ndrc' | 'grid' | 'gov_open';

// 电价版本（政策文件维度）
export interface TariffVersion {
  id: string;
  provinceCode: string;
  version: string;        // 版本号：2026.01.01.0
  effectiveDate: string;  // 生效日期
  policyNumber: string;   // 政策文号：粤发改价格〔2025〕583号
  policyTitle: string;    // 政策标题
  policyUrl: string;      // 原文链接
  publishDate: string;    // 发布日期
  source: DataSourceType; // 数据来源
  verified: boolean;      // 是否人工验证
  verificationDate?: string;
  verifiedBy?: string;
  status: 'draft' | 'active' | 'expired';
  createdAt: string;
  updatedAt: string;
}

// 电价明细（电压等级维度）
export interface TariffDetail {
  id: string;
  versionId: string;
  provinceCode: string;
  voltageLevel: '0.4kV' | '10kV' | '35kV' | '110kV' | '220kV';
  tariffType: 'industrial' | 'commercial' | 'large_industrial' | 'residential';
  // 分时电价
  peakPrice: number;      // 峰时电价
  valleyPrice: number;    // 谷时电价
  flatPrice: number;      // 平时电价
  // 基本电价（大工业）
  basicFeeType?: 'capacity' | 'demand';  // 容量/需量
  basicFeePrice?: number;                // 基本电价 元/kW·月或元/kW
  // 功率因数
  powerFactorStandard?: number;          // 标准
  powerFactorRate?: number;              // 调整率
  // 政府性基金
  renewableEnergySurcharge: number;      // 可再生能源附加 元/kWh
  reservoirFund: number;                 // 国家重大水利基金 元/kWh
  ruralGridRepayment: number;            // 农网还贷资金 元/kWh
  createdAt: string;
  updatedAt: string;
}

// 时段配置
export interface TimePeriodConfig {
  id: string;
  versionId: string;
  provinceCode: string;
  peakHours: number[];     // 峰时段小时列表 [0-23]
  valleyHours: number[];   // 谷时段小时列表 [0-23]
  flatHours: number[];     // 平时段小时列表 [0-23]
  peakDescription: string;
  valleyDescription: string;
  flatDescription: string;
  // 季节性时段（如有）
  seasonalPeriods?: SeasonalPeriod[];
  createdAt: string;
  updatedAt: string;
}

// 季节性时段
export interface SeasonalPeriod {
  name: string;           // 季节名称：夏季/冬季
  months: number[];       // 月份 [6,7,8]
  peakHours: number[];
  valleyHours: number[];
  flatHours: number[];
}

// 数据审计日志
export interface DataAuditLog {
  id: string;
  provinceCode: string;
  versionId: string;
  action: 'create' | 'update' | 'verify' | 'expire';
  trigger: 'agent_crawl' | 'manual_update' | 'scheduled_check';
  source: string;          // 数据来源URL
  hash: string;           // 数据指纹（防篡改）
  beforeValue?: any;      // 变更前
  afterValue?: any;       // 变更后
  confidence: number;     // 置信度 0-1
  verified: boolean;      // 是否验证
  createdAt: string;
}

// 数据源配置
export interface DataSourceConfig {
  code: string;
  name: string;
  region: string;
  gridCompany: string;
  primaryUrl: string;
  backupUrl: string;
  encoding: 'utf-8' | 'gb2312' | 'gbk';
  isDynamic: boolean;
  selectors: {
    listPage: string;
    policyNumber: string;
    publishDate: string;
    effectiveDate: string;
    contentTable: string;
  };
}

// 爬虫结果
export interface CrawlResult {
  success: boolean;
  provinceCode: string;
  rawData: {
    html?: string;
    pdfUrl?: string;
    json?: any;
  };
  source: string;      // 实际抓取的URL
  timestamp: string;
  checksum: string;    // 内容hash
  error?: string;
}

// 解析结果
export interface ParseResult {
  success: boolean;
  provinceCode: string;
  policyNumber: string;
  policyTitle: string;
  effectiveDate: string;
  publishDate: string;
  tariffs: TariffDetail[];
  timePeriods: TimePeriodConfig;
  confidence: number;  // 解析置信度
  error?: string;
}

// 验证结果
export interface ValidationResult {
  valid: boolean;
  provinceCode: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
}

// 完整的电价数据
export interface CompleteTariffData {
  province: Province;
  version: TariffVersion;
  tariffs: TariffDetail[];
  timePeriods: TimePeriodConfig;
}
