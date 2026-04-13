/**
 * Tests for ProvinceDataRepository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProvinceDataRepository } from '@/domain/repositories/ProvinceDataRepository';
import { ProvinceDataSchema } from '@/domain/schemas/ProvinceSchema';

// Mock fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('ProvinceDataRepository', () => {
  let repository: ProvinceDataRepository;

  beforeEach(() => {
    repository = new ProvinceDataRepository();
    mockFetch.mockClear();
  });

  describe('loadProvince', () => {
    it('should load and validate Guangdong province data', async () => {
      const mockGuangdongData = {
        code: 'GD',
        name: '广东省',
        nameEn: 'Guangdong',
        pricing: {
          peakPrice: 1.15,
          valleyPrice: 0.35,
          flatPrice: 0.75,
          peakHours: ['10:00-12:00', '14:00-19:00'],
          valleyHours: ['00:00-08:00', '12:00-14:00'],
          peakMonths: [1, 2, 6, 7, 8, 9, 12],
          spread: 0.8,
        },
        capacityCompensation: {
          available: true,
          type: 'none',
          policyName: '广东省暂无容量补偿政策',
          effectiveDate: '2026-01-01',
        },
        demandResponse: {
          available: true,
          peakCompensation: 4.0,
          valleyCompensation: 1.5,
          minResponseSize: 0.5,
          maxAnnualCalls: 50,
        },
        auxiliaryServices: {
          available: false,
        },
        lastUpdated: '2026-03-27',
        dataVersion: '2026-Q1',
        dataSource: '广东省发改委 2026年第一季度政策',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGuangdongData,
      });

      const result = await repository.loadProvince('guangdong');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('广东省');
      expect(result?.code).toBe('GD');
      expect(result?.pricing.spread).toBe(0.8);
      expect(result?.capacityCompensation.available).toBe(true);
      expect(result?.demandResponse.peakCompensation).toBe(4.0);
    });

    it('should load and validate Shandong province data', async () => {
      const mockShandongData = {
        code: 'SD',
        name: '山东省',
        nameEn: 'Shandong',
        pricing: {
          peakPrice: 1.0,
          valleyPrice: 0.4,
          flatPrice: 0.65,
          peakHours: ['08:00-11:00', '16:00-21:00'],
          valleyHours: ['00:00-06:00', '11:00-14:00'],
          peakMonths: [1, 2, 7, 8, 12],
          spread: 0.6,
        },
        capacityCompensation: {
          available: true,
          type: 'capacity-based',
          rate: 100,
          requirements: {
            minDischargeDuration: 2,
            availabilityThreshold: 90,
          },
          policyName: '山东省容量补偿试点政策',
          effectiveDate: '2025-01-01',
        },
        demandResponse: {
          available: true,
          peakCompensation: 3.0,
          valleyCompensation: 1.0,
          minResponseSize: 0.5,
          maxAnnualCalls: 45,
        },
        auxiliaryServices: {
          available: true,
          peaking: {
            price: 0.6,
            availableHours: 800,
          },
        },
        lastUpdated: '2026-03-27',
        dataVersion: '2026-Q1',
        dataSource: '山东省发改委 2026年1月政策',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockShandongData,
      });

      const result = await repository.loadProvince('shandong');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('山东省');
      expect(result?.code).toBe('SD');
      expect(result?.pricing.spread).toBe(0.6);
      expect(result?.capacityCompensation.type).toBe('capacity-based');
      expect(result?.capacityCompensation.rate).toBe(100);
      expect(result?.auxiliaryServices.available).toBe(true);
    });

    it('should handle unknown province with fallback data', async () => {
      const result = await repository.loadProvince('unknown-province');

      // Unknown provinces get default/fallback data instead of null
      expect(result).not.toBeNull();
      expect(result?._source).toBe('default');
      expect(result?.region).toBe('east'); // default region
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await repository.loadProvince('guangdong');

      // Known provinces with fetch errors fall back to default data
      expect(result).not.toBeNull();
      expect(result?._source).toBe('default');
    });

    it('should cache loaded data', async () => {
      const mockData = {
        code: 'GD',
        name: '广东省',
        nameEn: 'Guangdong',
        pricing: {
          peakPrice: 1.15,
          valleyPrice: 0.35,
          peakHours: ['10:00-12:00'],
          valleyHours: ['00:00-08:00'],
          spread: 0.8,
        },
        capacityCompensation: {
          available: true,
          type: 'none',
        },
        demandResponse: {
          available: true,
        },
        auxiliaryServices: {
          available: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // First call
      await repository.loadProvince('guangdong');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await repository.loadProvince('guangdong');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should validate data against schema', async () => {
      const invalidData = {
        code: 'GD',
        name: '广东省',
        pricing: {
          peakPrice: -1, // Invalid: negative price
          valleyPrice: 0.35,
          peakHours: ['10:00-12:00'],
          valleyHours: ['00:00-08:00'],
        },
        capacityCompensation: {
          available: true,
          type: 'none',
        },
        demandResponse: {
          available: true,
        },
        auxiliaryServices: {
          available: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidData,
      });

      const result = await repository.loadProvince('guangdong');

      // Validation failures fall back to default data (not null)
      expect(result).not.toBeNull();
      expect(result?._source).toBe('default');
    });
  });

  describe('getProvince', () => {
    it('should be an alias for loadProvince', async () => {
      const mockData = {
        code: 'GD',
        name: '广东省',
        nameEn: 'Guangdong',
        pricing: {
          peakPrice: 1.15,
          valleyPrice: 0.35,
          peakHours: ['10:00-12:00'],
          valleyHours: ['00:00-08:00'],
          spread: 0.8,
        },
        capacityCompensation: {
          available: true,
          type: 'none',
        },
        demandResponse: {
          available: true,
        },
        auxiliaryServices: {
          available: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await repository.getProvince('guangdong');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('广东省');
    });
  });

  describe('getProvinces', () => {
    it('should load multiple provinces in parallel', async () => {
      const mockGuangdong = {
        code: 'GD',
        name: '广东省',
        nameEn: 'Guangdong',
        pricing: {
          peakPrice: 1.15,
          valleyPrice: 0.35,
          peakHours: ['10:00-12:00'],
          valleyHours: ['00:00-08:00'],
          spread: 0.8,
        },
        capacityCompensation: { available: true, type: 'none' },
        demandResponse: { available: true },
        auxiliaryServices: { available: false },
      };

      const mockShandong = {
        code: 'SD',
        name: '山东省',
        nameEn: 'Shandong',
        pricing: {
          peakPrice: 1.0,
          valleyPrice: 0.4,
          peakHours: ['08:00-11:00'],
          valleyHours: ['00:00-06:00'],
          spread: 0.6,
        },
        capacityCompensation: { available: true, type: 'capacity-based', rate: 100 },
        demandResponse: { available: true },
        auxiliaryServices: { available: false },
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockGuangdong })
        .mockResolvedValueOnce({ ok: true, json: async () => mockShandong });

      const results = await repository.getProvinces(['guangdong', 'shandong']);

      expect(results.size).toBe(2);
      expect(results.get('guangdong')?.name).toBe('广东省');
      expect(results.get('shandong')?.name).toBe('山东省');
    });

    it('should skip invalid provinces', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 'GD',
          name: '广东省',
          nameEn: 'Guangdong',
          pricing: { peakPrice: 1.15, valleyPrice: 0.35, peakHours: ['10:00-12:00'], valleyHours: ['00:00-08:00'] },
          capacityCompensation: { available: true, type: 'none' },
          demandResponse: { available: true },
          auxiliaryServices: { available: false },
        }),
      });

      const results = await repository.getProvinces(['guangdong', 'unknown-province']);

      // Both provinces return data (unknown gets fallback)
      expect(results.size).toBe(2);
      expect(results.get('guangdong')?.name).toBe('广东省');
      expect(results.get('unknown-province')?._source).toBe('default');
    });
  });

  describe('cache management', () => {
    it('should return all cached provinces', async () => {
      const mockData = {
        code: 'GD',
        name: '广东省',
        nameEn: 'Guangdong',
        pricing: {
          peakPrice: 1.15,
          valleyPrice: 0.35,
          peakHours: ['10:00-12:00'],
          valleyHours: ['00:00-08:00'],
          spread: 0.8,
        },
        capacityCompensation: { available: true, type: 'none' },
        demandResponse: { available: true },
        auxiliaryServices: { available: false },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await repository.loadProvince('guangdong');
      const cached = repository.getAllCached();

      expect(cached.size).toBe(1);
      expect(cached.get('guangdong')?.name).toBe('广东省');
    });

    it('should clear cache', async () => {
      const mockData = {
        code: 'GD',
        name: '广东省',
        nameEn: 'Guangdong',
        pricing: {
          peakPrice: 1.15,
          valleyPrice: 0.35,
          peakHours: ['10:00-12:00'],
          valleyHours: ['00:00-08:00'],
          spread: 0.8,
        },
        capacityCompensation: { available: true, type: 'none' },
        demandResponse: { available: true },
        auxiliaryServices: { available: false },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await repository.loadProvince('guangdong');
      expect(repository.getAllCached().size).toBe(1);

      repository.clearCache();
      expect(repository.getAllCached().size).toBe(0);
    });
  });

  describe('preload', () => {
    it('should preload multiple provinces', async () => {
      const mockGuangdong = {
        code: 'GD',
        name: '广东省',
        nameEn: 'Guangdong',
        pricing: {
          peakPrice: 1.15,
          valleyPrice: 0.35,
          peakHours: ['10:00-12:00'],
          valleyHours: ['00:00-08:00'],
          spread: 0.8,
        },
        capacityCompensation: { available: true, type: 'none' },
        demandResponse: { available: true },
        auxiliaryServices: { available: false },
      };

      const mockShandong = {
        code: 'SD',
        name: '山东省',
        nameEn: 'Shandong',
        pricing: {
          peakPrice: 1.0,
          valleyPrice: 0.4,
          peakHours: ['08:00-11:00'],
          valleyHours: ['00:00-06:00'],
          spread: 0.6,
        },
        capacityCompensation: { available: true, type: 'capacity-based', rate: 100 },
        demandResponse: { available: true },
        auxiliaryServices: { available: false },
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockGuangdong })
        .mockResolvedValueOnce({ ok: true, json: async () => mockShandong });

      await repository.preload(['guangdong', 'shandong']);

      expect(repository.getAllCached().size).toBe(2);
      expect(repository.getAllCached().get('guangdong')?.name).toBe('广东省');
      expect(repository.getAllCached().get('shandong')?.name).toBe('山东省');
    });
  });

  describe('utility methods', () => {
    it('should check if province is supported', () => {
      expect(repository.isSupported('guangdong')).toBe(true);
      expect(repository.isSupported('shandong')).toBe(true);
      expect(repository.isSupported('unknown-province')).toBe(false);
    });

    it('should return all supported provinces', () => {
      const provinces = repository.getSupportedProvinces();

      expect(provinces.length).toBeGreaterThan(0);
      expect(provinces).toContain('guangdong');
      expect(provinces).toContain('shandong');
      expect(provinces).toContain('zhejiang');
    });

    it('should get province code from slug', () => {
      expect(repository.getCode('guangdong')).toBe('GD');
      expect(repository.getCode('shandong')).toBe('SD');
      expect(repository.getCode('zhejiang')).toBe('ZJ');
      expect(repository.getCode('unknown')).toBeUndefined();
    });
  });
});
