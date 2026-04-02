/**
 * Enhanced Province Data Schema
 *
 * Comprehensive validation for all 31 Chinese provinces' energy storage policies.
 * Includes pricing structures, compensation mechanisms, and regulatory information.
 */

import { z } from 'zod';

/**
 * Time period definition (24-hour format)
 */
export const TimePeriodSchema = z.object({
  start: z.string().regex(/^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use H:MM or HH:MM)'),
  end: z.string().regex(/^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use H:MM or HH:MM)'),
});

export type TimePeriod = z.infer<typeof TimePeriodSchema>;

/**
 * Season definition
 */
export const SeasonSchema = z.object({
  name: z.string(),
  months: z.array(z.number().min(1).max(12)).min(1).max(12),
});

export type Season = z.infer<typeof SeasonSchema>;

/**
 * Peak-valley pricing structure with enhanced validation
 */
export const PricingSchema = z.object({
  // Basic pricing
  peakPrice: z.number()
    .positive('Peak price must be positive (¥/kWh)')
    .max(3, 'Peak price seems unreasonably high (>¥3/kWh)'),
  valleyPrice: z.number()
    .nonnegative('Valley price must be non-negative (¥/kWh)')
    .max(2, 'Valley price seems unreasonably high (>¥2/kWh)'),
  flatPrice: z.number().nonnegative().optional(),
  shoulderPrice: z.number().nonnegative().optional(),

  // Time periods
  peakPeriods: z.array(TimePeriodSchema).min(1, 'At least one peak period required'),
  valleyPeriods: z.array(TimePeriodSchema).min(1, 'At least one valley period required'),
  shoulderPeriods: z.array(TimePeriodSchema).optional(),

  // Seasonal variations
  seasons: z.array(SeasonSchema).optional(),

  // Peak/valley spread validation (computed at runtime)
  minSpread: z.number().optional(),
  maxSpread: z.number().optional(),
  avgSpread: z.number().optional(),

  // Policy metadata
  policyName: z.string().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  voltageLevel: z.enum(['110kV', '35kV', '1-10kV', '<1kV', 'all']).optional(),
});

export type Pricing = z.infer<typeof PricingSchema>;

/**
 * Capacity compensation policy with detailed options
 */
export const CapacityCompensationSchema = z.object({
  available: z.boolean(),

  // Compensation type
  type: z.enum([
    'none',
    'discharge-based',    // ¥/kWh for actual discharge
    'capacity-based',     // ¥/kW/year for installed capacity
    'availability-based', // ¥/kW/day for being available
    'performance-based',  // Based on response performance
  ]),

  // Compensation rates
  dischargeRate: z.number().nonnegative().optional(), // ¥/kWh
  capacityRate: z.number().nonnegative().optional(), // ¥/kW/year
  dailyRate: z.number().nonnegative().optional(), // ¥/kW/day

  // Requirements
  requirements: z.object({
    minDischargeDuration: z.number().positive().optional(), // hours
    maxDischargeDuration: z.number().positive().optional(), // hours
    minCapacity: z.number().positive().optional(), // MW
    availabilityThreshold: z.number().min(0).max(100).optional(), // % of time
    responseTime: z.number().positive().optional(), // minutes
    performanceScore: z.number().min(0).max(1).optional(), // 0-1 scale
  }).optional(),

  // Policy details
  policyName: z.string().optional(),
  policyNumber: z.string().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  implementingAgency: z.string().optional(),

  // Compensation caps
  maxAnnualCompensation: z.number().positive().optional(), // ¥/year
  maxCompensationPerMW: z.number().positive().optional(), // ¥/MW/year
});

export type CapacityCompensation = z.infer<typeof CapacityCompensationSchema>;

/**
 * Demand response compensation
 */
export const DemandResponseSchema = z.object({
  available: z.boolean(),

  // Compensation structure
  peakCompensation: z.number().nonnegative().optional(), // ¥/kWh
  valleyCompensation: z.number().nonnegative().optional(), // ¥/kWh
  shoulderCompensation: z.number().nonnegative().optional(), // ¥/kWh

  // Program requirements
  requirements: z.object({
    minResponseSize: z.number().positive().optional(), // MW
    maxResponseSize: z.number().positive().optional(), // MW
    minResponseDuration: z.number().positive().optional(), // hours
    maxResponseDuration: z.number().positive().optional(), // hours
    responseTime: z.number().positive().optional(), // minutes
    maxAnnualCalls: z.number().int().nonnegative().optional(), // times per year
    minAdvanceNotice: z.number().int().nonnegative().optional(), // hours
  }).optional(),

  // Program details
  programName: z.string().optional(),
  programType: z.enum(['voluntary', 'mandatory', 'market-based']).optional(),
  effectiveDate: z.string().optional(),
  operatingAgency: z.string().optional(),
});

export type DemandResponse = z.infer<typeof DemandResponseSchema>;

/**
 * Auxiliary services (frequency regulation, peaking, reactive power, etc.)
 */
export const AuxiliaryServicesSchema = z.object({
  available: z.boolean(),

  // Frequency regulation
  frequencyRegulation: z.object({
    available: z.boolean().optional(),
    priceUp: z.number().nonnegative().optional(), // ¥/MW for raising
    priceDown: z.number().nonnegative().optional(), // ¥/MW for lowering
    performanceScore: z.number().min(0).max(2).optional(), // K-value or mileage ratio
    minBidSize: z.number().positive().optional(), // MW
    maxBidSize: z.number().positive().optional(), // MW
    marketType: z.enum(['co-optimized', 'standalone', 'contract']).optional(),
  }).optional(),

  // Peaking capacity
  peaking: z.object({
    available: z.boolean().optional(),
    price: z.number().nonnegative().optional(), // ¥/kW/day or ¥/kW/year
    availableHours: z.number().positive().optional(), // hours per year
    reliabilityRating: z.number().min(0).max(1).optional(), // 0-1 scale
  }).optional(),

  // Reactive power support
  reactivePower: z.object({
    available: z.boolean().optional(),
    price: z.number().nonnegative().optional(), // ¥/kVar
    requiredCapacity: z.number().positive().optional(), // kVar
  }).optional(),

  // Voltage support
  voltageSupport: z.object({
    available: z.boolean().optional(),
    price: z.number().nonnegative().optional(),
  }).optional(),

  // Black start capability
  blackStart: z.object({
    available: z.boolean().optional(),
    premium: z.number().nonnegative().optional(), // ¥/kW
  }).optional(),
});

export type AuxiliaryServices = z.infer<typeof AuxiliaryServicesSchema>;

/**
 * Tax and subsidy policies
 */
export const TaxSubsidySchema = z.object({
  // VAT policy
  vatRate: z.number().min(0).max(1).optional(), // 0-1 (e.g., 0.13 for 13%)

  // Subsidies
  investmentSubsidy: z.object({
    available: z.boolean().optional(),
    rate: z.number().min(0).max(1).optional(), // 0-1 (e.g., 0.1 for 10%)
    maxAmount: z.number().positive().optional(), // ¥
    policyName: z.string().optional(),
    expiryDate: z.string().optional(),
  }).optional(),

  // Feed-in tariffs (if applicable)
  feedInTariff: z.object({
    available: z.boolean().optional(),
    rate: z.number().nonnegative().optional(), // ¥/kWh
    policyName: z.string().optional(),
  }).optional(),
});

export type TaxSubsidy = z.infer<typeof TaxSubsidySchema>;

/**
 * Grid connection policies
 */
export const GridConnectionSchema = z.object({
  // Connection fees
  connectionFee: z.object({
    available: z.boolean().optional(),
    feePerMW: z.number().nonnegative().optional(), // ¥/MW
    fixedFee: z.number().nonnegative().optional(), // ¥
  }).optional(),

  // Interconnection requirements
  requirements: z.object({
    minTransformerCapacity: z.number().positive().optional(), // MVA
    maxDistanceToGrid: z.number().positive().optional(), // km
    requiredProtectionSystems: z.array(z.string()).optional(),
    requiredCommunicationSystems: z.array(z.string()).optional(),
  }).optional(),

  // Approval timeline
  approvalTimeline: z.object({
    applicationDays: z.number().int().positive().optional(), // business days
    reviewDays: z.number().int().positive().optional(),
    constructionDays: z.number().int().positive().optional(),
  }).optional(),
});

export type GridConnection = z.infer<typeof GridConnectionSchema>;

/**
 * Market participation eligibility
 */
export const MarketEligibilitySchema = z.object({
  // Spot market
  spotMarket: z.object({
    eligible: z.boolean().optional(),
    minCapacity: z.number().positive().optional(), // MW
    marketTypes: z.array(z.string()).optional(), // ['day-ahead', 'real-time', 'ancillary']
  }).optional(),

  // Ancillary services market
  ancillaryServicesMarket: z.object({
    eligible: z.boolean().optional(),
    qualifiedServices: z.array(z.string()).optional(), // ['frequency-regulation', 'spinning-reserve']
  }).optional(),

  // Peak shaving market
  peakShavingMarket: z.object({
    eligible: z.boolean().optional(),
    programName: z.string().optional(),
  }).optional(),
});

export type MarketEligibility = z.infer<typeof MarketEligibilitySchema>;

/**
 * Geographic and economic context
 */
export const GeographySchema = z.object({
  // Location
  region: z.enum(['North', 'Northeast', 'East', 'South', 'Central', 'Northwest', 'Southwest']),
  coastal: z.boolean().optional(),

  // Grid characteristics
  gridType: z.enum(['national', 'regional', 'provincial', 'microgrid']).optional(),
  gridStability: z.enum(['stable', 'congested', 'islanded']).optional(),

  // Economic indicators
  gdpPerCapita: z.number().positive().optional(), // ¥/person/year
  industrialShare: z.number().min(0).max(1).optional(), // 0-1 (e.g., 0.4 for 40%)

  // Renewable penetration
  renewableShare: z.number().min(0).max(1).optional(), // 0-1
  storageTargetBy2030: z.number().positive().optional(), // GW
});

export type Geography = z.infer<typeof GeographySchema>;

/**
 * Data quality and validation metadata
 */
export const DataMetadataSchema = z.object({
  // Data source
  dataSource: z.string().optional(), // Where data came from
  sourceUrl: z.string().regex(/^https?:\/\/.+/, 'Invalid url').optional(), // URL to source document
  sourceType: z.enum(['official', 'industry-report', 'news', 'estimated']).optional(),

  // Validation status
  validationStatus: z.enum(['verified', 'provisional', 'estimated', 'outdated']).optional(),
  lastVerified: z.string().optional(), // ISO date string
  verifiedBy: z.string().optional(), // Person or organization

  // Confidence levels
  confidenceLevels: z.object({
    pricing: z.number().min(0).max(1).optional(),
    compensation: z.number().min(0).max(1).optional(),
    policies: z.number().min(0).max(1).optional(),
  }).optional(),

  // Notes
  notes: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional(),
});

export type DataMetadata = z.infer<typeof DataMetadataSchema>;

/**
 * Complete province data schema (enhanced)
 */
export const ProvinceDataSchemaEnhanced = z.object({
  // Identification
  code: z.string()
    .length(2, 'Province code must be 2 characters (e.g., GD, SD)')
    .regex(/^[A-Z]{2}$/, 'Province code must be 2 uppercase letters'),
  name: z.string().min(2, 'Province name required'),
  nameEn: z.string().optional(),
  abbreviation: z.string().length(1).optional(), // Single character abbreviation

  // Pricing structure
  pricing: PricingSchema,

  // Compensation mechanisms
  capacityCompensation: CapacityCompensationSchema,
  demandResponse: DemandResponseSchema,
  auxiliaryServices: AuxiliaryServicesSchema,

  // Financial policies
  taxSubsidy: TaxSubsidySchema.optional(),

  // Grid policies
  gridConnection: GridConnectionSchema.optional(),

  // Market eligibility
  marketEligibility: MarketEligibilitySchema.optional(),

  // Geographic context
  geography: GeographySchema.optional(),

  // Metadata
  metadata: DataMetadataSchema.optional(),

  // Versioning
  lastUpdated: z.string().optional(),
  dataVersion: z.string().optional(),
});

export type ProvinceDataEnhanced = z.infer<typeof ProvinceDataSchemaEnhanced>;

/**
 * Cross-field validation for province data
 */
export const ProvinceDataSchemaRefined = ProvinceDataSchemaEnhanced
  .refine((data) => {
    // Peak price must be higher than valley price
    return data.pricing.peakPrice > data.pricing.valleyPrice;
  }, {
    message: 'Peak price must be higher than valley price',
    path: ['pricing', 'peakPrice'],
  })
  .refine((data) => {
    // If capacity compensation is available, type must not be 'none'
    if (data.capacityCompensation.available) {
      return data.capacityCompensation.type !== 'none';
    }
    return true;
  }, {
    message: 'Capacity compensation type cannot be "none" when available is true',
    path: ['capacityCompensation', 'type'],
  })
  .refine((data) => {
    // If compensation type requires a rate, that rate must be provided
    const cc = data.capacityCompensation;
    if (!cc.available || cc.type === 'none') return true;

    if (cc.type === 'discharge-based' && !cc.dischargeRate) return false;
    if (cc.type === 'capacity-based' && !cc.capacityRate) return false;
    if (cc.type === 'availability-based' && !cc.dailyRate) return true; // Optional

    return true;
  }, {
    message: 'Compensation rate must match the compensation type',
    path: ['capacityCompensation'],
  })
  .refine((data) => {
    // Shoulder price (if present) must be between peak and valley
    const { peakPrice, valleyPrice, shoulderPrice } = data.pricing;
    if (shoulderPrice === undefined) return true;
    return shoulderPrice > valleyPrice && shoulderPrice < peakPrice;
  }, {
    message: 'Shoulder price must be between valley and peak price',
    path: ['pricing', 'shoulderPrice'],
  })
  .refine((data) => {
    // Policy dates must be valid (effective before expiry)
    const cc = data.capacityCompensation;
    if (cc.effectiveDate && cc.expiryDate) {
      return new Date(cc.effectiveDate) < new Date(cc.expiryDate);
    }
    return true;
  }, {
    message: 'Effective date must be before expiry date',
    path: ['capacityCompensation'],
  });

export type ProvinceDataValidated = z.infer<typeof ProvinceDataSchemaRefined>;

/**
 * Schema for province data file
 */
export const ProvinceDataFileSchemaEnhanced = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (e.g., 1.0.0)'),
  lastUpdated: z.string().datetime('Last updated must be ISO datetime'),
  dataSource: z.string().optional(),
  dataQuality: z.object({
    verifiedProvinces: z.number().int().nonnegative(),
    estimatedProvinces: z.number().int().nonnegative(),
    missingProvinces: z.number().int().nonnegative(),
  }).optional(),
  provinces: z.array(ProvinceDataSchemaRefined).min(1, 'At least one province required'),
});

export type ProvinceDataFileEnhanced = z.infer<typeof ProvinceDataFileSchemaEnhanced>;

// Re-export for backward compatibility and convenience
export const ProvinceDataSchema = ProvinceDataSchemaEnhanced;
export type ProvinceData = ProvinceDataEnhanced;

// ProvinceDataFile needs to use the schema directly
export const ProvinceDataFileSchema = ProvinceDataFileSchemaEnhanced;
export type ProvinceDataFile = z.infer<typeof ProvinceDataFileSchema>;
