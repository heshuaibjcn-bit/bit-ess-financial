import { z } from 'zod';

/**
 * 31 Chinese provinces/regions for energy storage policy data
 */
export const PROVINCES = [
  'guangdong', 'shandong', 'shanghai', 'zhejiang', 'jiangsu', 'anhui', 'hunan',
  'hubei', 'henan', 'jiangxi', 'beijing', 'tianjin', 'hebei', 'shanxi',
  'neimenggu', 'liaoning', 'jilin', 'heilongjiang', 'shaanxi', 'gansu', 'qinghai',
  'ningxia', 'xinjiang', 'sichuan', 'chongqing', 'yunnan', 'guizhou', 'xizang',
  'guangxi', 'hainan', 'fujian',
] as const;

export type Province = (typeof PROVINCES)[number];

/**
 * Chinese names for provinces
 */
export const PROVINCE_NAMES: Record<Province, string> = {
  guangdong: '广东省',
  shandong: '山东省',
  shanghai: '上海市',
  zhejiang: '浙江省',
  jiangsu: '江苏省',
  anhui: '安徽省',
  hunan: '湖南省',
  hubei: '湖北省',
  henan: '河南省',
  jiangxi: '江西省',
  beijing: '北京市',
  tianjin: '天津市',
  hebei: '河北省',
  shanxi: '山西省',
  neimenggu: '内蒙古自治区',
  liaoning: '辽宁省',
  jilin: '吉林省',
  heilongjiang: '黑龙江省',
  shaanxi: '陕西省',
  gansu: '甘肃省',
  qinghai: '青海省',
  ningxia: '宁夏回族自治区',
  xinjiang: '新疆维吾尔自治区',
  sichuan: '四川省',
  chongqing: '重庆市',
  yunnan: '云南省',
  guizhou: '贵州省',
  xizang: '西藏自治区',
  guangxi: '广西壮族自治区',
  hainan: '海南省',
  fujian: '福建省',
};

// ============================================================================
// NEW BUSINESS-DRIVEN SCHEMAS
// ============================================================================

/**
 * Collaboration model types
 */
export const COLLABORATION_MODELS = ['investor_owned', 'joint_venture', 'emc'] as const;
export type CollaborationModel = (typeof COLLABORATION_MODELS)[number];

/**
 * Company scale types
 */
export const COMPANY_SCALES = ['small', 'medium', 'large'] as const;
export type CompanyScale = (typeof COMPANY_SCALES)[number];

/**
 * Credit rating types
 */
export const CREDIT_RATINGS = ['AAA', 'AA', 'A', 'BBB', 'unknown'] as const;
export type CreditRating = (typeof CREDIT_RATINGS)[number];

/**
 * Payment history types
 */
export const PAYMENT_HISTORIES = ['excellent', 'good', 'fair', 'poor'] as const;
export type PaymentHistory = (typeof PAYMENT_HISTORIES)[number];

/**
 * Voltage level types
 */
export const VOLTAGE_LEVELS = ['0.4kV', '10kV', '35kV'] as const;
export type VoltageLevel = (typeof VOLTAGE_LEVELS)[number];

/**
 * Roof type types
 */
export const ROOF_TYPES = ['flat', 'sloped', 'ground'] as const;
export type RoofType = (typeof ROOF_TYPES)[number];

/**
 * Tariff type types
 */
export const TARIFF_TYPES = ['industrial', 'commercial', 'large_industrial'] as const;
export type TariffType = (typeof TARIFF_TYPES)[number];

/**
 * Price period types
 */
export const PRICE_PERIODS = ['peak', 'valley', 'flat'] as const;
export type PricePeriod = (typeof PRICE_PERIODS)[number];

/**
 * Charge strategy types
 */
export const CHARGE_STRATEGIES = ['arbitrage_only', 'peak_shaving', 'mixed'] as const;
export type ChargeStrategy = (typeof CHARGE_STRATEGIES)[number];

/**
 * Optimization target types
 */
export const OPTIMIZATION_TARGETS = ['cost', 'revenue', 'balanced'] as const;
export type OptimizationTarget = (typeof OPTIMIZATION_TARGETS)[number];

/**
 * Owner Information Schema (业主信息)
 */
export const OwnerInfoSchema = z.object({
  // 业主基本信息
  companyName: z.string()
    .min(1, '请输入公司名称')
    .max(200, '公司名称过长'),
  industry: z.string()
    .min(1, '请输入所属行业')
    .max(100, '行业描述过长'),

  // 项目所在地
  projectLocation: z.enum(PROVINCES, {
    required_error: '请选择项目所在地',
    invalid_type_error: '无效的项目所在地',
  }),

  // 背调信息
  companyScale: z.enum(COMPANY_SCALES),
  creditRating: z.enum(CREDIT_RATINGS),
  paymentHistory: z.enum(PAYMENT_HISTORIES),

  // 合作模式
  collaborationModel: z.enum(COLLABORATION_MODELS),
  revenueShareRatio: z.number()
    .min(0, '分成比例不能小于0')
    .max(100, '分成比例不能大于100')
    .optional(), // 投资方分成比例（合资/EMC模式）
  ownerShareRatio: z.number()
    .min(0, '分成比例不能小于0')
    .max(100, '分成比例不能大于100')
    .optional(), // 业主分成比例（EMC模式）
  contractDuration: z.number()
    .int('合作年限必须是整数')
    .min(1, '合作年限至少1年')
    .max(30, '合作年限不超过30年'),
});

export type OwnerInfo = z.infer<typeof OwnerInfoSchema>;

/**
 * Facility Information Schema (电力设施信息)
 */
export const FacilityInfoSchema = z.object({
  // 变压器和电力设施
  transformerCapacity: z.number()
    .positive('变压器容量必须大于0')
    .max(100000, '变压器容量过大'), // kVA
  voltageLevel: z.enum(VOLTAGE_LEVELS),
  avgMonthlyLoad: z.number()
    .nonnegative('平均月用电量不能为负'), // kWh
  peakLoad: z.number()
    .nonnegative('峰值负荷不能为负'), // kW

  // 场地信息
  availableArea: z.number()
    .nonnegative('可用面积不能为负'), // 平方米
  roofType: z.enum(ROOF_TYPES),
  loadBearingCapacity: z.number()
    .positive('承重能力必须大于0')
    .optional(), // kg/m²
  needsExpansion: z.boolean()
    .default(false),

  // 时间计划
  commissionDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '请使用YYYY-MM-DD格式'),
});

export type FacilityInfo = z.infer<typeof FacilityInfoSchema>;

/**
 * Hourly Price Schema
 */
export const HourlyPriceSchema = z.object({
  hour: z.number()
    .int('小时必须是整数')
    .min(0, '小时必须在0-23之间')
    .max(23, '小时必须在0-23之间'),
  price: z.number()
    .nonnegative('电价不能为负'),
  period: z.enum(PRICE_PERIODS),
});

export type HourlyPrice = z.infer<typeof HourlyPriceSchema>;

/**
 * Seasonal Adjustment Schema
 */
export const SeasonalAdjustmentSchema = z.object({
  season: z.string()
    .min(1, '季节名称不能为空'),
  adjustmentFactor: z.number()
    .min(-0.5, '调整系数不能小于-0.5')
    .max(0.5, '调整系数不能大于0.5'),
});

export type SeasonalAdjustment = z.infer<typeof SeasonalAdjustmentSchema>;

/**
 * Tariff Detail Schema (电价详细信息)
 */
export const TariffDetailSchema = z.object({
  // 基础电价信息
  tariffType: z.enum(TARIFF_TYPES),
  peakPrice: z.number()
    .nonnegative('峰时电价不能为负'),
  valleyPrice: z.number()
    .nonnegative('谷时电价不能为负'),
  flatPrice: z.number()
    .nonnegative('平时电价不能为负'),

  // 24小时电价分布
  hourlyPrices: z.array(HourlyPriceSchema)
    .min(24, '需要完整的24小时电价数据')
    .max(24, '只需要24小时电价数据'),

  // 季节性调整（可选）
  seasonalAdjustments: z.array(SeasonalAdjustmentSchema)
    .optional(),
});

export type TariffDetail = z.infer<typeof TariffDetailSchema>;

/**
 * Technical Proposal Schema (技术方案)
 */
export const TechnicalProposalSchema = z.object({
  // 推荐的系统配置
  recommendedCapacity: z.number()
    .positive('推荐容量必须大于0'), // MWh
  recommendedPower: z.number()
    .positive('推荐功率必须大于0'), // MW
  capacityPowerRatio: z.number()
    .positive('时长比例必须大于0'),

  // 充放电策略
  chargeStrategy: z.enum(CHARGE_STRATEGIES),
  cycleLife: z.number()
    .int('循环寿命必须是整数')
    .positive('循环寿命必须大于0'),
  expectedThroughput: z.number()
    .nonnegative('预期吞吐量不能为负'),

  // 优化目标
  optimizedFor: z.enum(OPTIMIZATION_TARGETS),
});

export type TechnicalProposal = z.infer<typeof TechnicalProposalSchema>;

/**
 * Technology types for energy storage systems
 */
export const TECHNOLOGY_TYPES = ['lithium-ion', 'lead-acid', 'flow-battery', 'sodium-ion'] as const;
export type TechnologyType = (typeof TECHNOLOGY_TYPES)[number];

/**
 * Application types (customer categories)
 */
export const APPLICATION_TYPES = ['industrial', 'commercial', 'data-center', 'charging-station', 'zero-carbon-park'] as const;
export type ApplicationType = (typeof APPLICATION_TYPES)[number];

/**
 * System size configuration
 */
export const SystemSizeSchema = z.object({
  capacity: z.number()
    .positive('Capacity must be positive (MW)')
    .max(100, 'Capacity cannot exceed 100 MW')
    .default(2.0),
  duration: z.number()
    .positive('Duration must be positive (hours)')
    .max(8, 'Duration cannot exceed 8 hours')
    .default(2),
});

export type SystemSize = z.infer<typeof SystemSizeSchema>;

/**
 * Cost breakdown structure
 */
export const CostsSchema = z.object({
  batteryCostPerKwh: z.number()
    .positive('Battery cost must be positive (¥/kWh)')
    .max(5000, 'Battery cost seems too high (>5000 ¥/kWh)')
    .default(1200),
  pcsCostPerKw: z.number()
    .positive('PCS cost must be positive (¥/kW)')
    .max(1000, 'PCS cost seems too high (>1000 ¥/kW)')
    .default(300),
  emsCost: z.number()
    .nonnegative('EMS cost cannot be negative (¥)')
    .max(1000000, 'EMS cost seems too high')
    .default(100000),
  installationCostPerKw: z.number()
    .nonnegative('Installation cost cannot be negative (¥/kW)')
    .max(500, 'Installation cost seems too high (>500 ¥/kW)')
    .default(150),
  gridConnectionCost: z.number()
    .nonnegative('Grid connection cost cannot be negative (¥)')
    .max(1000000, 'Grid connection cost seems too high')
    .default(200000),
  landCost: z.number()
    .nonnegative('Land cost cannot be negative (¥)')
    .default(0),
  developmentCost: z.number()
    .nonnegative('Development cost cannot be negative (¥)')
    .max(1000000, 'Development cost seems too high')
    .default(150000),
  permittingCost: z.number()
    .nonnegative('Permitting cost cannot be negative (¥)')
    .max(500000, 'Permitting cost seems too high')
    .default(50000),
  contingencyPercent: z.number()
    .min(0, 'Contingency cannot be negative')
    .max(0.3, 'Contingency seems too high (>30%)')
    .default(0.05),
});

export type Costs = z.infer<typeof CostsSchema>;

/**
 * Financing structure
 */
export const FinancingSchema = z.object({
  hasLoan: z.boolean()
    .default(false),
  // Equity ratio (0-100%) - percentage of self-funded investment
  equityRatio: z.number()
    .min(0, 'Equity ratio cannot be negative')
    .max(1, 'Equity ratio cannot exceed 100%')
    .default(1.0), // Default: 100% self-funded
  loanRatio: z.number()
    .min(0, 'Loan ratio cannot be negative')
    .max(0.9, 'Loan ratio cannot exceed 90%')
    .default(0.7)
    .optional(),
  interestRate: z.number()
    .min(0, 'Interest rate cannot be negative')
    .max(0.2, 'Interest rate cannot exceed 20% APR')
    .default(0.045)
    .optional(),
  loanTerm: z.number()
    .int('Loan term must be integer (years)')
    .min(1, 'Loan term must be at least 1 year')
    .max(20, 'Loan term cannot exceed 20 years')
    .default(10)
    .optional(),
  // Tax holiday: years before VAT/surcharges start (default: 6 years = start in year 7)
  taxHolidayYears: z.number()
    .int('Tax holiday years must be integer')
    .min(0, 'Tax holiday cannot be negative')
    .max(10, 'Tax holiday cannot exceed 10 years')
    .default(6),
});

export type Financing = z.infer<typeof FinancingSchema>;

/**
 * Operating parameters
 */
export const OperatingParamsSchema = z.object({
  systemEfficiency: z.number()
    .min(0, 'System efficiency cannot be negative')
    .max(1, 'System efficiency cannot exceed 100%')
    .default(0.88),
  depthOfDischarge: z.number()
    .min(0, 'DOD cannot be negative')
    .max(1, 'DOD cannot exceed 100% of battery capacity')
    .default(0.9),
  cyclesPerDay: z.number()
    .min(0.1, 'At least 0.1 cycles per day')
    .max(4, 'Cannot exceed 4 cycles per day')
    .default(1.5),
  degradationRate: z.number()
    .min(0, 'Degradation rate cannot be negative')
    .max(0.1, 'Degradation rate seems too high (>10% per year)')
    .default(0.02),
  availabilityPercent: z.number()
    .min(0, 'Availability cannot be negative')
    .max(1, 'Availability cannot exceed 100%')
    .default(0.97),
});

export type OperatingParams = z.infer<typeof OperatingParamsSchema>;

/**
 * Operating costs - Real business operation expenses
 * Annual recurring costs for running the储能project
 */
export const OperatingCostsSchema = z.object({
  // 人力成本
  operationsStaffCost: z.number()
    .nonnegative('Operations staff cost cannot be negative')
    .max(5000000, 'Operations staff cost seems too high (>500万/年)')
    .default(500000), // ¥50万/年 - 2名运维人员

  managementCost: z.number()
    .nonnegative('Management cost cannot be negative')
    .max(3000000, 'Management cost seems too high (>300万/年)')
    .default(300000), // ¥30万/年 - 兼职管理

  technicalSupportCost: z.number()
    .nonnegative('Technical support cost cannot be negative')
    .max(2000000, 'Technical support cost seems too high (>200万/年)')
    .default(200000), // ¥20万/年 - 技术支持

  // 办公成本
  officeRent: z.number()
    .nonnegative('Office rent cannot be negative')
    .max(1000000, 'Office rent seems too high (>100万/年)')
    .default(100000), // ¥10万/年

  officeExpenses: z.number()
    .nonnegative('Office expenses cannot be negative')
    .max(500000, 'Office expenses seem too high (>50万/年)')
    .default(50000), // ¥5万/年 - 办公用品、差旅等

  // 维护成本
  regularMaintenanceCost: z.number()
    .nonnegative('Regular maintenance cost cannot be negative')
    .max(1000000, 'Regular maintenance seems too high (>100万/年)')
    .default(200000), // ¥20万/年 - 定期检修

  preventiveMaintenanceCost: z.number()
    .nonnegative('Preventive maintenance cost cannot be negative')
    .max(500000, 'Preventive maintenance seems too high (>50万/年)')
    .default(80000), // ¥8万/年 - 预防性维护

  // 保险费用
  equipmentInsurance: z.number()
    .nonnegative('Equipment insurance cannot be negative')
    .max(500000, 'Equipment insurance seems too high (>50万/年)')
    .default(100000), // ¥10万/年 - 设备保险

  liabilityInsurance: z.number()
    .nonnegative('Liability insurance cannot be negative')
    .max(300000, 'Liability insurance seems too high (>30万/年)')
    .default(50000), // ¥5万/年 - 责任保险

  propertyInsurance: z.number()
    .nonnegative('Property insurance cannot be negative')
    .max(200000, 'Property insurance seems too high (>20万/年)')
    .default(30000), // ¥3万/年 - 财产保险

  // 其他运营费用
  licenseFee: z.number()
    .nonnegative('License fee cannot be negative')
    .max(200000, 'License fee seems too high (>20万/年)')
    .default(50000), // ¥5万/年 - 许可证年费

  regulatoryFee: z.number()
    .nonnegative('Regulatory fee cannot be negative')
    .max(100000, 'Regulatory fee seems too high (>10万/年)')
    .default(20000), // ¥2万/年 - 监管费用

  trainingCost: z.number()
    .nonnegative('Training cost cannot be negative')
    .max(200000, 'Training cost seems too high (>20万/年)')
    .default(30000), // ¥3万/年 - 培训

  utilitiesCost: z.number()
    .nonnegative('Utilities cost cannot be negative')
    .max(200000, 'Utilities cost seems too high (>20万/年)')
    .default(20000), // ¥2万/年 - 水电通讯

  // 税费（按年收入百分比或固定金额）
  vatRate: z.number()
    .min(0, 'VAT rate cannot be negative')
    .max(0.13, 'VAT rate cannot exceed 13%')
    .default(0.06), // 6% 增值税率（现代服务业）

  surtaxRate: z.number()
    .min(0, 'Surtax rate cannot be negative')
    .max(0.15, 'Surtax rate cannot exceed 15%')
    .default(0.12), // 12% 城建税及教育费附加

  corporateTaxRate: z.number()
    .min(0, 'Corporate tax rate cannot be negative')
    .max(0.25, 'Corporate tax rate cannot exceed 25%')
    .default(0.25), // 25% 企业所得税

  // 销售费用 - Fixed annual operating costs (from verified model)
  salesExpenses: z.number()
    .nonnegative('Sales expenses cannot be negative')
    .max(500000, 'Sales expenses seem too high (>50万/年)')
    .default(303818), // ¥30.38万/年 - 销售费用

  landLeaseCost: z.number()
    .nonnegative('Land lease cost cannot be negative')
    .max(2000000, 'Land lease seems too high (>200万/年)')
    .default(100000), // ¥10万/年 - 土地租金（如果未一次性购买）
});

export type OperatingCosts = z.infer<typeof OperatingCostsSchema>;

/**
 * Complete project input schema
 * Updated to support business-driven workflow
 */
export const ProjectInputSchema = z.object({
  // Existing fields (for backward compatibility)
  province: z.enum(PROVINCES, {
    errorMap: () => ({ message: 'Invalid province. Must be one of the 31 supported regions.' }),
  }),
  systemSize: SystemSizeSchema,
  costs: CostsSchema,
  financing: FinancingSchema.optional().default({}),
  operatingParams: OperatingParamsSchema,
  operatingCosts: OperatingCostsSchema.optional().default({}),
  projectName: z.string()
    .min(1, 'Project name is required')
    .max(200, 'Project name is too long')
    .optional(),
  description: z.string()
    .max(1000, 'Description is too long')
    .optional(),

  // NEW: Business-driven fields
  ownerInfo: OwnerInfoSchema.optional(),
  facilityInfo: FacilityInfoSchema.optional(),
  tariffDetail: TariffDetailSchema.optional(),
  technicalProposal: TechnicalProposalSchema.optional(),
});

export type ProjectInput = z.infer<typeof ProjectInputSchema>;

/**
 * Scenario parameter for sensitivity analysis
 */
export const ScenarioInputSchema = z.object({
  variable: z.enum([
    'batteryCost',
    'pcsCost',
    'systemEfficiency',
    'peakPrice',
    'valleyPrice',
    'compensationRate',
  ]),
  change: z.number()
    .min(-0.5, 'Change cannot be less than -50%')
    .max(0.5, 'Change cannot exceed +50%')
    .default(0.1),
});

export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;

/**
 * Cross-field validation: Ensure total installed cost doesn't exceed reasonable bounds
 */
export const ProjectInputSchemaRefined = ProjectInputSchema.refine((data) => {
  // Calculate total installed cost per Wh
  const costs = data.costs;
  const totalCostPerWh =
    costs.batteryCostPerKwh +
    costs.pcsCostPerKw +
    costs.emsCost +
    costs.installationCostPerKw +
    costs.gridConnectionCost +
    costs.landCost +
    costs.developmentCost +
    costs.permittingCost +
    (costs.contingencyPercent * 1000); // Approximate

  // Check if total cost is within reasonable bounds (0.5 - 5 ¥/Wh)
  if (totalCostPerWh < 0.3) {
    return false;
  }
  if (totalCostPerWh > 8) {
    return false;
  }

  // Check if DOD is reasonable relative to system efficiency
  // Support both old (dod) and new (depthOfDischarge) field names
  const dod = 'depthOfDischarge' in data.operatingParams
    ? data.operatingParams.depthOfDischarge
    : (data.operatingParams as any).dod;

  if (dod > data.operatingParams.systemEfficiency) {
    return false;
  }

  return true;
}, {
  message: 'Project configuration is invalid',
  path: ['costs', 'operatingParams'],
});

export type ProjectInputRefined = z.infer<typeof ProjectInputSchemaRefined>;
