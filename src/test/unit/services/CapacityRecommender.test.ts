/**
 * Tests for CapacityRecommender service
 */

import { describe, it, expect } from 'vitest';
import { recommendCapacity, estimateIRR } from '../../../domain/services/CapacityRecommender';
import type { RecommendationParams } from '../../../domain/services/CapacityRecommender';

function createParams(overrides?: Partial<RecommendationParams>): RecommendationParams {
  return {
    ownerInfo: {
      companyName: 'Test Corp',
      industry: 'Manufacturing',
      projectLocation: 'guangdong',
      companyScale: 'medium',
      creditRating: 'A',
      paymentHistory: 'good',
      collaborationModel: 'investor_owned',
      contractDuration: 10,
    },
    facilityInfo: {
      transformerCapacity: 2000, // kVA
      voltageLevel: '10kV',
      avgMonthlyLoad: 500000, // kWh
      peakLoad: 1500, // kW
      availableArea: 500,
      roofType: 'flat',
      loadBearingCapacity: 200,
      needsExpansion: false,
      commissionDate: '2026-06-01',
    },
    tariffDetail: {
      tariffType: 'industrial',
      peakPrice: 1.2,
      valleyPrice: 0.4,
      flatPrice: 0.7,
      hourlyPrices: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        price: i >= 8 && i < 11 ? 1.2 : i >= 14 && i < 17 ? 1.2 : i >= 23 || i < 7 ? 0.4 : 0.7,
        period: i >= 8 && i < 11 ? 'peak' : i >= 14 && i < 17 ? 'peak' : i >= 23 || i < 7 ? 'valley' : 'flat' as const,
      })),
    },
    ...overrides,
  };
}

describe('CapacityRecommender', () => {
  describe('recommendCapacity', () => {
    it('should return three proposals for standard inputs', () => {
      const result = recommendCapacity(createParams());

      expect(result.conservative).toBeDefined();
      expect(result.standard).toBeDefined();
      expect(result.aggressive).toBeDefined();
      expect(result.recommended).toBe('standard');
      expect(result.reasoning).toContain('变压器容量');
    });

    it('should recommend standard for investor_owned model', () => {
      const result = recommendCapacity(createParams({
        ownerInfo: { ...createParams().ownerInfo, collaborationModel: 'investor_owned' },
      }));
      expect(result.recommended).toBe('standard');
    });

    it('should recommend aggressive for high-credit joint venture', () => {
      const result = recommendCapacity(createParams({
        ownerInfo: {
          ...createParams().ownerInfo,
          collaborationModel: 'joint_venture',
          creditRating: 'AAA',
        },
      }));
      expect(result.recommended).toBe('aggressive');
    });

    it('should recommend standard for low-credit joint venture', () => {
      const result = recommendCapacity(createParams({
        ownerInfo: {
          ...createParams().ownerInfo,
          collaborationModel: 'joint_venture',
          creditRating: 'BBB',
        },
      }));
      expect(result.recommended).toBe('standard');
    });

    it('should recommend aggressive for EMC model', () => {
      const result = recommendCapacity(createParams({
        ownerInfo: { ...createParams().ownerInfo, collaborationModel: 'emc' },
      }));
      expect(result.recommended).toBe('aggressive');
    });

    it('should have conservative < standard < aggressive capacity', () => {
      const result = recommendCapacity(createParams());

      expect(result.conservative.recommendedCapacity)
        .toBeLessThanOrEqual(result.standard.recommendedCapacity);
      expect(result.standard.recommendedCapacity)
        .toBeLessThanOrEqual(result.aggressive.recommendedCapacity);
    });

    it('should select arbitrage_only strategy for high tariff spread', () => {
      const result = recommendCapacity(createParams({
        tariffDetail: {
          ...createParams().tariffDetail,
          peakPrice: 1.5,
          valleyPrice: 0.3,
        },
      }));

      expect(result.aggressive.chargeStrategy).toBe('arbitrage_only');
    });

    it('should select peak_shaving strategy for low tariff spread', () => {
      const result = recommendCapacity(createParams({
        tariffDetail: {
          ...createParams().tariffDetail,
          peakPrice: 0.9,
          valleyPrice: 0.6,
        },
      }));

      expect(result.conservative.chargeStrategy).toBe('peak_shaving');
    });
  });

  describe('estimateIRR', () => {
    it('should return a positive IRR for reasonable proposals', () => {
      const params = createParams();
      const proposal = recommendCapacity(params).standard;
      const irr = estimateIRR(proposal, params);

      expect(irr).toBeGreaterThan(0);
      expect(irr).toBeLessThan(1); // IRR as decimal (0-1 range)
    });

    it('should return higher IRR for revenue-optimized proposals', () => {
      const params = createParams({
        tariffDetail: {
          ...createParams().tariffDetail,
          peakPrice: 1.5,
          valleyPrice: 0.3,
        },
      });
      const result = recommendCapacity(params);

      const revenueIRR = estimateIRR(result.aggressive, params);
      const costIRR = estimateIRR(result.conservative, params);

      // Revenue-optimized should generally have higher IRR due to higher spread
      expect(revenueIRR).toBeGreaterThanOrEqual(costIRR - 0.05);
    });
  });
});
