/**
 * Tests for Enhanced Province Schema Validation
 *
 * Tests all aspects of province data validation including:
 * - Basic schema validation
 * - Cross-field validation
 * - Edge cases and error handling
 * - Real-world data examples
 */

import { describe, it, expect } from 'vitest';
import {
  ProvinceDataSchemaEnhanced,
  ProvinceDataSchemaRefined,
  ProvinceDataFileSchemaEnhanced,
  TimePeriodSchema,
  PricingSchema,
  CapacityCompensationSchema,
  DemandResponseSchema,
  AuxiliaryServicesSchema,
  TaxSubsidySchema,
  GridConnectionSchema,
  MarketEligibilitySchema,
  GeographySchema,
  DataMetadataSchema,
} from '@/domain/schemas/ProvinceSchema.enhanced';
import type {
  ProvinceDataEnhanced,
  ProvinceDataFileEnhanced,
} from '@/domain/schemas/ProvinceSchema.enhanced';

describe('Province Schema - Time Period Validation', () => {
  const validTimePeriod = {
    start: '08:00',
    end: '12:00',
  };

  it('should validate valid time periods', () => {
    const result = TimePeriodSchema.safeParse(validTimePeriod);
    expect(result.success).toBe(true);
  });

  it('should reject invalid time format', () => {
    const result = TimePeriodSchema.safeParse({ start: '25:00', end: '12:00' });
    expect(result.success).toBe(false);
  });

  it('should accept single-digit hours (H:MM format)', () => {
    const result = TimePeriodSchema.safeParse({ start: '8:00', end: '12:00' });
    expect(result.success).toBe(true);
  });

  it('should accept double-digit hours (HH:MM format)', () => {
    const result = TimePeriodSchema.safeParse({ start: '08:00', end: '17:30' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid hours', () => {
    const result = TimePeriodSchema.safeParse({ start: '25:00', end: '12:00' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid minutes', () => {
    const result = TimePeriodSchema.safeParse({ start: '08:60', end: '12:00' });
    expect(result.success).toBe(false);
  });
});

describe('Province Schema - Pricing Validation', () => {
  const validPricing = {
    peakPrice: 1.45,
    valleyPrice: 0.32,
    peakPeriods: [{ start: '08:00', end: '12:00' }],
    valleyPeriods: [{ start: '22:00', end: '06:00' }],
  };

  it('should validate valid pricing data', () => {
    const result = PricingSchema.safeParse(validPricing);
    expect(result.success).toBe(true);
  });

  it('should reject peak price higher than 3', () => {
    const result = PricingSchema.safeParse({
      ...validPricing,
      peakPrice: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative valley price', () => {
    const result = PricingSchema.safeParse({
      ...validPricing,
      valleyPrice: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it('should require at least one peak period', () => {
    const result = PricingSchema.safeParse({
      ...validPricing,
      peakPeriods: [],
    });
    expect(result.success).toBe(false);
  });

  it('should require at least one valley period', () => {
    const result = PricingSchema.safeParse({
      ...validPricing,
      valleyPeriods: [],
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional shoulder price', () => {
    const result = PricingSchema.safeParse({
      ...validPricing,
      shoulderPrice: 0.65,
    });
    expect(result.success).toBe(true);
  });
});

describe('Province Schema - Capacity Compensation Validation', () => {
  const validCapacityComp = {
    available: true,
    type: 'discharge-based' as const,
    dischargeRate: 0.35,
  };

  it('should validate valid capacity compensation', () => {
    const result = CapacityCompensationSchema.safeParse(validCapacityComp);
    expect(result.success).toBe(true);
  });

  it('should accept all compensation types', () => {
    const types = [
      'none',
      'discharge-based',
      'capacity-based',
      'availability-based',
      'performance-based',
    ] as const;

    types.forEach((type) => {
      const result = CapacityCompensationSchema.safeParse({
        available: type !== 'none',
        type,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject negative rates', () => {
    const result = CapacityCompensationSchema.safeParse({
      ...validCapacityComp,
      dischargeRate: -0.1,
    });
    expect(result.success).toBe(false);
  });
});

describe('Province Schema - Demand Response Validation', () => {
  const validDemandResponse = {
    available: true,
    peakCompensation: 2.5,
  };

  it('should validate valid demand response', () => {
    const result = DemandResponseSchema.safeParse(validDemandResponse);
    expect(result.success).toBe(true);
  });

  it('should accept program type enum', () => {
    const types = ['voluntary', 'mandatory', 'market-based'] as const;

    types.forEach((type) => {
      const result = DemandResponseSchema.safeParse({
        ...validDemandResponse,
        programType: type,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Province Schema - Auxiliary Services Validation', () => {
  const validAuxiliaryServices = {
    available: true,
    frequencyRegulation: {
      available: true,
      priceUp: 80,
      priceDown: 60,
      performanceScore: 1.2,
    },
  };

  it('should validate valid auxiliary services', () => {
    const result = AuxiliaryServicesSchema.safeParse(validAuxiliaryServices);
    expect(result.success).toBe(true);
  });

  it('should reject performance score outside 0-2 range', () => {
    const result = AuxiliaryServicesSchema.safeParse({
      ...validAuxiliaryServices,
      frequencyRegulation: {
        ...validAuxiliaryServices.frequencyRegulation!,
        performanceScore: 2.5,
      },
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative prices', () => {
    const result = AuxiliaryServicesSchema.safeParse({
      ...validAuxiliaryServices,
      frequencyRegulation: {
        ...validAuxiliaryServices.frequencyRegulation!,
        priceUp: -10,
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('Province Schema - Geography Validation', () => {
  const validGeography = {
    region: 'East' as const,
    coastal: true,
    gridType: 'provincial' as const,
    gridStability: 'stable' as const,
    gdpPerCapita: 98000,
    industrialShare: 0.39,
    renewableShare: 0.28,
    storageTargetBy2030: 3.5,
  };

  it('should validate valid geography', () => {
    const result = GeographySchema.safeParse(validGeography);
    expect(result.success).toBe(true);
  });

  it('should accept all region enums', () => {
    const regions = [
      'North',
      'Northeast',
      'East',
      'South',
      'Central',
      'Northwest',
      'Southwest',
    ] as const;

    regions.forEach((region) => {
      const result = GeographySchema.safeParse({
        ...validGeography,
        region,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject industrial share outside 0-1 range', () => {
    const result = GeographySchema.safeParse({
      ...validGeography,
      industrialShare: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject renewable share outside 0-1 range', () => {
    const result = GeographySchema.safeParse({
      ...validGeography,
      renewableShare: -0.1,
    });
    expect(result.success).toBe(false);
  });
});

describe('Province Schema - Tax and Subsidy Validation', () => {
  const validTaxSubsidy = {
    vatRate: 0.13,
    investmentSubsidy: {
      available: true,
      rate: 0.1,
      maxAmount: 5000000,
    },
  };

  it('should validate valid tax subsidy', () => {
    const result = TaxSubsidySchema.safeParse(validTaxSubsidy);
    expect(result.success).toBe(true);
  });

  it('should reject VAT rate outside 0-1 range', () => {
    const result = TaxSubsidySchema.safeParse({
      ...validTaxSubsidy,
      vatRate: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject subsidy rate outside 0-1 range', () => {
    const result = TaxSubsidySchema.safeParse({
      ...validTaxSubsidy,
      investmentSubsidy: {
        ...validTaxSubsidy.investmentSubsidy!,
        rate: 1.2,
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('Province Schema - Market Eligibility Validation', () => {
  const validMarketEligibility = {
    spotMarket: {
      eligible: true,
      minCapacity: 10,
      marketTypes: ['day-ahead', 'real-time'],
    },
  };

  it('should validate valid market eligibility', () => {
    const result = MarketEligibilitySchema.safeParse(validMarketEligibility);
    expect(result.success).toBe(true);
  });

  it('should reject negative minimum capacity', () => {
    const result = MarketEligibilitySchema.safeParse({
      ...validMarketEligibility,
      spotMarket: {
        ...validMarketEligibility.spotMarket!,
        minCapacity: -5,
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('Province Schema - Metadata Validation', () => {
  const validMetadata = {
    dataSource: 'Official Government Document',
    sourceUrl: 'https://example.com',
    sourceType: 'official' as const,
    validationStatus: 'verified' as const,
    lastVerified: '2026-03-15',
    confidenceLevels: {
      pricing: 0.95,
      compensation: 0.90,
      policies: 0.85,
    },
    notes: ['Test note'],
  };

  it('should validate valid metadata', () => {
    const result = DataMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    const result = DataMetadataSchema.safeParse({
      ...validMetadata,
      sourceUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('should reject confidence levels outside 0-1 range', () => {
    const result = DataMetadataSchema.safeParse({
      ...validMetadata,
      confidenceLevels: {
        pricing: 1.5,
        compensation: 0.9,
        policies: 0.85,
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('Province Schema - Complete Province Data Validation', () => {
  const validProvinceData: ProvinceDataEnhanced = {
    code: 'GD',
    name: '广东省',
    nameEn: 'Guangdong',
    abbreviation: '粤',
    geography: {
      region: 'South',
      coastal: true,
      gridType: 'provincial',
      gridStability: 'congested',
      gdpPerCapita: 98000,
      industrialShare: 0.39,
      renewableShare: 0.28,
      storageTargetBy2030: 3.5,
    },
    pricing: {
      peakPrice: 1.45,
      valleyPrice: 0.32,
      flatPrice: 0.68,
      peakPeriods: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
        { start: '19:00', end: '21:00' },
      ],
      valleyPeriods: [{ start: '23:00', end: '07:00' }],
      shoulderPeriods: [
        { start: '07:00', end: '09:00' },
        { start: '12:00', end: '14:00' },
      ],
      policyName: 'Guangdong TOU Pricing 2024',
      effectiveDate: '2024-01-01',
      voltageLevel: '110kV',
    },
    capacityCompensation: {
      available: true,
      type: 'discharge-based',
      dischargeRate: 0.35,
      requirements: {
        minDischargeDuration: 1,
        maxDischargeDuration: 4,
        minCapacity: 0.5,
        availabilityThreshold: 80,
      },
      policyName: 'Guangdong Storage Compensation',
    },
    demandResponse: {
      available: true,
      peakCompensation: 2.5,
      valleyCompensation: 0.8,
    },
    auxiliaryServices: {
      available: true,
      frequencyRegulation: {
        available: true,
        priceUp: 80,
        priceDown: 60,
        performanceScore: 1.2,
      },
    },
    taxSubsidy: {
      vatRate: 0.13,
    },
    metadata: {
      dataSource: 'Test',
      validationStatus: 'verified',
      confidenceLevels: {
        pricing: 0.95,
        compensation: 0.90,
        policies: 0.85,
      },
    },
    lastUpdated: '2026-03-15',
    dataVersion: '1.0.0',
  };

  it('should validate complete province data', () => {
    const result = ProvinceDataSchemaEnhanced.safeParse(validProvinceData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid province code format', () => {
    const result = ProvinceDataSchemaEnhanced.safeParse({
      ...validProvinceData,
      code: 'G1', // Contains number
    });
    expect(result.success).toBe(false);
  });

  it('should reject province code with wrong length', () => {
    const result = ProvinceDataSchemaEnhanced.safeParse({
      ...validProvinceData,
      code: 'GUANGDONG', // Too long
    });
    expect(result.success).toBe(false);
  });

  it('should reject lowercase province code', () => {
    const result = ProvinceDataSchemaEnhanced.safeParse({
      ...validProvinceData,
      code: 'gd', // Lowercase
    });
    expect(result.success).toBe(false);
  });
});

describe('Province Schema - Cross-field Validation', () => {
  const validProvinceData: ProvinceDataEnhanced = {
    code: 'JS',
    name: '江苏省',
    pricing: {
      peakPrice: 1.42,
      valleyPrice: 0.35,
      peakPeriods: [{ start: '08:00', end: '11:00' }],
      valleyPeriods: [{ start: '22:00', end: '07:00' }],
    },
    capacityCompensation: {
      available: true,
      type: 'discharge-based',
      dischargeRate: 0.42,
    },
    demandResponse: {
      available: true,
      peakCompensation: 2.8,
    },
    auxiliaryServices: {
      available: true,
    },
  };

  it('should reject peak price lower than valley price', () => {
    const result = ProvinceDataSchemaRefined.safeParse({
      ...validProvinceData,
      pricing: {
        ...validProvinceData.pricing,
        peakPrice: 0.3,
        valleyPrice: 0.5,
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        'Peak price must be higher than valley price'
      );
    }
  });

  it('should reject capacity compensation with type "none" when available is true', () => {
    const result = ProvinceDataSchemaRefined.safeParse({
      ...validProvinceData,
      capacityCompensation: {
        available: true,
        type: 'none',
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot be "none"');
    }
  });

  it('should reject discharge-based type without discharge rate', () => {
    const result = ProvinceDataSchemaRefined.safeParse({
      ...validProvinceData,
      capacityCompensation: {
        available: true,
        type: 'discharge-based',
        // dischargeRate is missing
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Compensation rate');
    }
  });

  it('should reject capacity-based type without capacity rate', () => {
    const result = ProvinceDataSchemaRefined.safeParse({
      ...validProvinceData,
      capacityCompensation: {
        available: true,
        type: 'capacity-based',
        // capacityRate is missing
      },
    });
    expect(result.success).toBe(false);
  });

  it('should reject shoulder price outside peak-valley range', () => {
    const result = ProvinceDataSchemaRefined.safeParse({
      ...validProvinceData,
      pricing: {
        ...validProvinceData.pricing,
        peakPrice: 1.5,
        valleyPrice: 0.3,
        shoulderPrice: 1.6, // Higher than peak
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('between valley and peak');
    }
  });

  it('should reject expiry date before effective date', () => {
    const result = ProvinceDataSchemaRefined.safeParse({
      ...validProvinceData,
      capacityCompensation: {
        ...validProvinceData.capacityCompensation,
        effectiveDate: '2024-06-01',
        expiryDate: '2023-01-01', // Before effective date
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Effective date must be before');
    }
  });
});

describe('Province Schema - Province Data File Validation', () => {
  const validProvinceDataFile: ProvinceDataFileEnhanced = {
    version: '1.0.0',
    lastUpdated: '2026-03-27T00:00:00Z',
    dataSource: 'Test Data Source',
    dataQuality: {
      verifiedProvinces: 31,
      estimatedProvinces: 0,
      missingProvinces: 0,
    },
    provinces: [
      {
        code: 'GD',
        name: '广东省',
        pricing: {
          peakPrice: 1.45,
          valleyPrice: 0.32,
          peakPeriods: [{ start: '09:00', end: '12:00' }],
          valleyPeriods: [{ start: '23:00', end: '07:00' }],
        },
        capacityCompensation: {
          available: true,
          type: 'discharge-based',
          dischargeRate: 0.35,
        },
        demandResponse: {
          available: true,
          peakCompensation: 2.5,
        },
        auxiliaryServices: {
          available: true,
        },
      },
    ],
  };

  it('should validate valid province data file', () => {
    const result = ProvinceDataFileSchemaEnhanced.safeParse(validProvinceDataFile);
    expect(result.success).toBe(true);
  });

  it('should require at least one province', () => {
    const result = ProvinceDataFileSchemaEnhanced.safeParse({
      ...validProvinceDataFile,
      provinces: [],
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid semver version', () => {
    const result = ProvinceDataFileSchemaEnhanced.safeParse({
      ...validProvinceDataFile,
      version: '1.0',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid datetime format', () => {
    const result = ProvinceDataFileSchemaEnhanced.safeParse({
      ...validProvinceDataFile,
      lastUpdated: '2026-03-27', // Missing time
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative province counts', () => {
    const result = ProvinceDataFileSchemaEnhanced.safeParse({
      ...validProvinceDataFile,
      dataQuality: {
        verifiedProvinces: -1,
        estimatedProvinces: 0,
        missingProvinces: 0,
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('Province Schema - Edge Cases', () => {
  const minimalValidData: ProvinceDataEnhanced = {
    code: 'XY',
    name: 'Test Province',
    pricing: {
      peakPrice: 1.0,
      valleyPrice: 0.3,
      peakPeriods: [{ start: '08:00', end: '12:00' }],
      valleyPeriods: [{ start: '22:00', end: '06:00' }],
    },
    capacityCompensation: {
      available: false,
      type: 'none',
    },
    demandResponse: {
      available: false,
    },
    auxiliaryServices: {
      available: false,
    },
  };

  it('should validate minimal province data', () => {
    const result = ProvinceDataSchemaEnhanced.safeParse(minimalValidData);
    expect(result.success).toBe(true);
  });

  it('should handle zero valley price', () => {
    const result = ProvinceDataSchemaEnhanced.safeParse({
      ...minimalValidData,
      pricing: {
        ...minimalValidData.pricing,
        valleyPrice: 0,
      },
    });
    expect(result.success).toBe(true);
  });

  it('should handle zero compensation rates', () => {
    const result = ProvinceDataSchemaEnhanced.safeParse({
      ...minimalValidData,
      capacityCompensation: {
        available: true,
        type: 'discharge-based',
        dischargeRate: 0,
      },
    });
    expect(result.success).toBe(true);
  });
});

describe('Province Schema - China 31 Provinces Validation', () => {
  // List of all 31 province-level administrative divisions in China
  const allProvinceCodes = [
    'BJ', // Beijing (北京市)
    'TJ', // Tianjin (天津市)
    'HE', // Hebei (河北省)
    'SX', // Shanxi (山西省)
    'NM', // Inner Mongolia (内蒙古自治区)
    'LN', // Liaoning (辽宁省)
    'JL', // Jilin (吉林省)
    'HL', // Heilongjiang (黑龙江省)
    'SH', // Shanghai (上海市)
    'JS', // Jiangsu (江苏省)
    'ZJ', // Zhejiang (浙江省)
    'AH', // Anhui (安徽省)
    'FJ', // Fujian (福建省)
    'JX', // Jiangxi (江西省)
    'SD', // Shandong (山东省)
    'HA', // Henan (河南省)
    'HB', // Hubei (湖北省)
    'HN', // Hunan (湖南省)
    'GD', // Guangdong (广东省)
    'GX', // Guangxi (广西壮族自治区)
    'HI', // Hainan (海南省)
    'CQ', // Chongqing (重庆市)
    'SC', // Sichuan (四川省)
    'GZ', // Guizhou (贵州省)
    'YN', // Yunnan (云南省)
    'XZ', // Tibet (西藏自治区)
    'SN', // Shaanxi (陕西省)
    'GS', // Gansu (甘肃省)
    'QH', // Qinghai (青海省)
    'NX', // Ningxia (宁夏回族自治区)
    'XJ', // Xinjiang (新疆维吾尔自治区)
    // Note: TW (Taiwan), HK (Hong Kong), MO (Macau) are excluded
  ];

  it('should have exactly 31 provinces', () => {
    expect(allProvinceCodes).toHaveLength(31);
  });

  it('should validate all province code formats', () => {
    allProvinceCodes.forEach((code) => {
      const result = ProvinceDataSchemaEnhanced.safeParse({
        code,
        name: `Test ${code}`,
        pricing: {
          peakPrice: 1.0,
          valleyPrice: 0.3,
          peakPeriods: [{ start: '08:00', end: '12:00' }],
          valleyPeriods: [{ start: '22:00', end: '06:00' }],
        },
        capacityCompensation: {
          available: false,
          type: 'none',
        },
        demandResponse: {
          available: false,
        },
        auxiliaryServices: {
          available: false,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  it('should support all 7 geographic regions', () => {
    const regions = [
      'North',
      'Northeast',
      'East',
      'South',
      'Central',
      'Northwest',
      'Southwest',
    ] as const;

    regions.forEach((region) => {
      const result = GeographySchema.safeParse({
        region,
        gdpPerCapita: 50000,
        industrialShare: 0.4,
        renewableShare: 0.3,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Province Schema - Real-world Scenarios', () => {
  it('should validate typical coastal developed province (Guangdong)', () => {
    const result = ProvinceDataSchemaEnhanced.safeParse({
      code: 'GD',
      name: '广东省',
      nameEn: 'Guangdong',
      geography: {
        region: 'South',
        coastal: true,
        gridType: 'provincial',
        gridStability: 'congested',
        gdpPerCapita: 98000,
        industrialShare: 0.39,
        renewableShare: 0.28,
      },
      pricing: {
        peakPrice: 1.45,
        valleyPrice: 0.32,
        flatPrice: 0.68,
        peakPeriods: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '17:00' },
        ],
        valleyPeriods: [{ start: '23:00', end: '07:00' }],
      },
      capacityCompensation: {
        available: true,
        type: 'discharge-based',
        dischargeRate: 0.35,
      },
      demandResponse: {
        available: true,
        peakCompensation: 2.5,
      },
      auxiliaryServices: {
        available: true,
        frequencyRegulation: {
          available: true,
          priceUp: 80,
          priceDown: 60,
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it('should validate typical inland renewable province (Inner Mongolia)', () => {
    const result = ProvinceDataSchemaEnhanced.safeParse({
      code: 'NM',
      name: '内蒙古自治区',
      geography: {
        region: 'North',
        coastal: false,
        gridType: 'regional',
        gridStability: 'congested',
        gdpPerCapita: 72000,
        industrialShare: 0.48,
        renewableShare: 0.38,
      },
      pricing: {
        peakPrice: 1.15,
        valleyPrice: 0.22,
        flatPrice: 0.55,
        peakPeriods: [{ start: '08:00', end: '11:00' }],
        valleyPeriods: [{ start: '22:00', end: '06:00' }],
      },
      capacityCompensation: {
        available: true,
        type: 'discharge-based',
        dischargeRate: 0.25,
      },
      demandResponse: {
        available: true,
        peakCompensation: 1.5,
      },
      auxiliaryServices: {
        available: true,
        frequencyRegulation: {
          available: true,
          priceUp: 55,
          priceDown: 40,
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it('should validate early-stage storage market province (no compensation)', () => {
    const result = ProvinceDataSchemaEnhanced.safeParse({
      code: 'NX',
      name: '宁夏回族自治区',
      geography: {
        region: 'Northwest',
        coastal: false,
        gridType: 'regional',
        gridStability: 'stable',
        gdpPerCapita: 48000,
        industrialShare: 0.52,
        renewableShare: 0.35,
      },
      pricing: {
        peakPrice: 1.05,
        valleyPrice: 0.28,
        peakPeriods: [{ start: '08:00', end: '12:00' }],
        valleyPeriods: [{ start: '22:00', end: '06:00' }],
      },
      capacityCompensation: {
        available: false,
        type: 'none',
      },
      demandResponse: {
        available: false,
      },
      auxiliaryServices: {
        available: false,
      },
    });
    expect(result.success).toBe(true);
  });
});
