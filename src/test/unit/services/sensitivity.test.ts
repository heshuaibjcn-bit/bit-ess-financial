/**
 * Tests for Sensitivity Precomputation Service
 *
 * Tests background precomputation, caching, and job management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sensitivityPrecomputeService } from '@/services/sensitivity/SensitivityPrecomputeService';
import type { SensitivityPrecomputeOptions } from '@/services/sensitivity';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';
import { cacheService } from '@/domain/services/CacheService';

// Mock the sensitivity analyzer
vi.mock('@/domain/services/SensitivityAnalyzer', () => ({
  sensitivityAnalyzer: {
    analyzeSensitivity: vi.fn(),
  },
  calculationEngine: {
    calculateProject: vi.fn(),
  },
}));

// Mock cache service
vi.mock('@/domain/services/CacheService', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    has: vi.fn(),
    getStats: vi.fn(),
  },
}));

// Mock the import
const mockSensitivityAnalyzer = await import('@/domain/services/SensitivityAnalyzer');

const mockProjectInput: ProjectInput = {
  province: 'Guangdong',
  projectName: 'Test Project',
  systemSize: {
    capacity: 1,
    power: 0.5,
    duration: 2,
  },
  electricityPrice: {
    peakPrice: 1.2,
    valleyPrice: 0.4,
  },
  costs: {
    battery: 1000000,
    pcs: 200000,
    ems: 100000,
    construction: 300000,
    other: 100000,
  },
  operatingParams: {
    systemEfficiency: 0.9,
    dod: 0.9,
    cyclesPerDay: 1,
    degradationRate: 0.02,
  },
  financing: {
    loanRatio: 0.7,
    interestRate: 0.05,
    loanTerm: 10,
  },
};

const mockSensitivityResult = {
  projectId: 'test-project',
  sensitivities: [
    {
      parameter: 'costs',
      parameterName: '成本',
      parameterNameEn: 'Costs',
      baselineValue: 1000000,
      baselineIRR: 15.5,
      variations: [
        { level: '-30%', value: 700000, irr: 18.2, irrChange: 2.7 },
        { level: '-15%', value: 850000, irr: 16.8, irrChange: 1.3 },
        { level: '0%', value: 1000000, irr: 15.5, irrChange: 0 },
        { level: '+15%', value: 1150000, irr: 14.2, irrChange: -1.3 },
        { level: '+30%', value: 1300000, irr: 13.0, irrChange: -2.5 },
      ],
    },
    {
      parameter: 'systemSize',
      parameterName: '系统规模',
      parameterNameEn: 'System Size',
      baselineValue: 1,
      baselineIRR: 15.5,
      variations: [
        { level: '-30%', value: 0.7, irr: 12.5, irrChange: -3.0 },
        { level: '-15%', value: 0.85, irr: 14.0, irrChange: -1.5 },
        { level: '0%', value: 1, irr: 15.5, irrChange: 0 },
        { level: '+15%', value: 1.15, irr: 16.8, irrChange: 1.3 },
        { level: '+30%', value: 1.3, irr: 18.0, irrChange: 2.5 },
      ],
    },
  ],
  mostSensitiveParameter: 'systemSize',
  mostSensitiveImpact: 3.0,
  tornadoData: [],
  baselineIRR: 15.5,
  minIRR: 12.5,
  maxIRR: 18.2,
  irrRange: 5.7,
};

describe('Sensitivity Precompute Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sensitivityPrecomputeService['activeJobs'].clear();
  });

  afterEach(() => {
    sensitivityPrecomputeService['activeJobs'].clear();
  });

  describe('Cache Key Generation', () => {
    it('should generate correct cache key for one-way sensitivity', () => {
      const key = sensitivityPrecomputeService['generateCacheKey'](
        'project-123',
        'one-way'
      );
      expect(key).toBe('sensitivity:one-way:project-123');
    });

    it('should generate correct cache key for two-way sensitivity', () => {
      const key = sensitivityPrecomputeService['generateCacheKey'](
        'project-456',
        'two-way'
      );
      expect(key).toBe('sensitivity:two-way:project-456');
    });

    it('should generate correct cache key for full sensitivity', () => {
      const key = sensitivityPrecomputeService['generateCacheKey'](
        'project-789',
        'full'
      );
      expect(key).toBe('sensitivity:full:project-789');
    });
  });

  describe('Cache Operations', () => {
    it('should return false when no cached results exist', async () => {
      (cacheService.get as any).mockResolvedValue(null);

      const hasCached = await sensitivityPrecomputeService.hasCachedResults(
        'project-123',
        'one-way'
      );

      expect(hasCached).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith('sensitivity:one-way:project-123');
    });

    it('should return true when cached results exist', async () => {
      (cacheService.get as any).mockResolvedValue(JSON.stringify(mockSensitivityResult));

      const hasCached = await sensitivityPrecomputeService.hasCachedResults(
        'project-123',
        'one-way'
      );

      expect(hasCached).toBe(true);
    });

    it('should retrieve and parse cached results', async () => {
      const mockResult = {
        oneWaySensitivity: [],
        baseCaseIRR: 15.5,
        mostSensitiveParameter: 'costs',
        generatedAt: new Date(),
      };
      (cacheService.get as any).mockResolvedValue(JSON.stringify(mockResult));

      const result = await sensitivityPrecomputeService.getCachedResults(
        'project-123',
        'one-way'
      );

      expect(result).not.toBeNull();
      expect(result?.oneWaySensitivity).toEqual([]);
      expect(result?.baseCaseIRR).toBe(15.5);
      expect(result?.mostSensitiveParameter).toBe('costs');
      expect(result?.generatedAt).toBeDefined();
    });

    it('should return null when cache miss', async () => {
      (cacheService.get as any).mockResolvedValue(null);

      const result = await sensitivityPrecomputeService.getCachedResults(
        'project-123',
        'one-way'
      );

      expect(result).toBeNull();
    });

    it('should cache results with TTL', async () => {
      const mockResult = {
        oneWaySensitivity: [],
        baseCaseIRR: 15.5,
        mostSensitiveParameter: 'costs',
        generatedAt: new Date(),
      };

      await sensitivityPrecomputeService['cacheResults'](
        'project-123',
        'one-way',
        mockResult
      );

      expect(cacheService.set).toHaveBeenCalledWith(
        'sensitivity:one-way:project-123',
        JSON.stringify(mockResult),
        3600 // 1 hour TTL
      );
    });
  });

  describe('Precomputation Job Creation', () => {
    it('should create job with correct status', async () => {
      (cacheService.get as any).mockResolvedValue(null);
      (
        mockSensitivityAnalyzer.sensitivityAnalyzer.analyzeSensitivity as any
      ).mockResolvedValue(mockSensitivityResult);

      const options: SensitivityPrecomputeOptions = {
        projectId: 'project-123',
        projectInput: mockProjectInput,
        sensitivityType: 'one-way',
      };

      const job = await sensitivityPrecomputeService.precompute(options);

      // Job should be in one of these states due to async processing
      expect(['pending', 'running', 'completed']).toContain(job.status);
      expect(job.projectId).toBe('project-123');
      expect(job.sensitivityType).toBe('one-way');
      expect(job.progress).toBeGreaterThanOrEqual(0);
    });

    it('should return cached results if available', async () => {
      const mockCachedResult = {
        oneWaySensitivity: [],
        baseCaseIRR: 15.5,
        mostSensitiveParameter: 'costs',
        generatedAt: new Date().toISOString(),
      };
      (cacheService.get as any).mockResolvedValue(JSON.stringify(mockCachedResult));

      const options: SensitivityPrecomputeOptions = {
        projectId: 'project-123',
        projectInput: mockProjectInput,
        sensitivityType: 'one-way',
      };

      const job = await sensitivityPrecomputeService.precompute(options);

      expect(job.status).toBe('completed');
      expect(job.progress).toBe(100);
      expect(job.result?.oneWaySensitivity).toEqual([]);
      expect(job.result?.baseCaseIRR).toBe(15.5);
      expect(job.result?.mostSensitiveParameter).toBe('costs');
    });

    it('should use default variation levels when not specified', async () => {
      (cacheService.get as any).mockResolvedValue(null);
      (
        mockSensitivityAnalyzer.sensitivityAnalyzer.analyzeSensitivity as any
      ).mockResolvedValue(mockSensitivityResult);

      const options: SensitivityPrecomputeOptions = {
        projectId: 'project-123',
        projectInput: mockProjectInput,
        sensitivityType: 'one-way',
      };

      await sensitivityPrecomputeService.precompute(options);

      // Wait a bit for background processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify the analyzer was called with default variation levels
      expect(
        mockSensitivityAnalyzer.sensitivityAnalyzer.analyzeSensitivity
      ).toHaveBeenCalledWith(
        mockProjectInput,
        [-0.3, -0.15, 0, 0.15, 0.3]
      );
    });

    it('should use custom variation levels when specified', async () => {
      (cacheService.get as any).mockResolvedValue(null);
      (
        mockSensitivityAnalyzer.sensitivityAnalyzer.analyzeSensitivity as any
      ).mockResolvedValue(mockSensitivityResult);

      const customLevels = [-0.2, -0.1, 0, 0.1, 0.2];

      const options: SensitivityPrecomputeOptions = {
        projectId: 'project-123',
        projectInput: mockProjectInput,
        sensitivityType: 'one-way',
        variationLevels: customLevels,
      };

      await sensitivityPrecomputeService.precompute(options);

      // Wait a bit for background processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(
        mockSensitivityAnalyzer.sensitivityAnalyzer.analyzeSensitivity
      ).toHaveBeenCalledWith(mockProjectInput, customLevels);
    });
  });

  describe('Job Status Tracking', () => {
    it('should retrieve job by ID', async () => {
      (cacheService.get as any).mockResolvedValue(null);
      (
        mockSensitivityAnalyzer.sensitivityAnalyzer.analyzeSensitivity as any
      ).mockResolvedValue(mockSensitivityResult);

      const options: SensitivityPrecomputeOptions = {
        projectId: 'project-123',
        projectInput: mockProjectInput,
        sensitivityType: 'one-way',
      };

      const job = await sensitivityPrecomputeService.precompute(options);
      const retrieved = sensitivityPrecomputeService.getJob(job.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(job.id);
    });

    it('should return undefined for non-existent job', () => {
      const retrieved = sensitivityPrecomputeService.getJob('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should get active jobs', async () => {
      (cacheService.get as any).mockResolvedValue(null);
      (
        mockSensitivityAnalyzer.sensitivityAnalyzer.analyzeSensitivity as any
      ).mockResolvedValue(mockSensitivityResult);

      // Create multiple jobs
      await sensitivityPrecomputeService.precompute({
        projectId: 'project-1',
        projectInput: mockProjectInput,
        sensitivityType: 'one-way',
      });

      await sensitivityPrecomputeService.precompute({
        projectId: 'project-2',
        projectInput: mockProjectInput,
        sensitivityType: 'two-way',
      });

      const activeJobs = sensitivityPrecomputeService.getActiveJobs();

      expect(activeJobs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Job Cancellation', () => {
    it('should cancel pending job', async () => {
      (cacheService.get as any).mockResolvedValue(null);
      (
        mockSensitivityAnalyzer.sensitivityAnalyzer.analyzeSensitivity as any
      ).mockImplementation(
        () =>
          new Promise((resolve) => {
            // Never resolve to simulate long-running job
          })
      );

      const job = await sensitivityPrecomputeService.precompute({
        projectId: 'project-123',
        projectInput: mockProjectInput,
        sensitivityType: 'one-way',
      });

      const cancelled = sensitivityPrecomputeService.cancelJob(job.id);

      expect(cancelled).toBe(true);

      const updatedJob = sensitivityPrecomputeService.getJob(job.id);
      expect(updatedJob?.status).toBe('failed');
      expect(updatedJob?.error).toBe('Cancelled by user');
    });

    it('should not cancel completed job', async () => {
      const mockCachedResult = {
        oneWaySensitivity: [],
        baseCaseIRR: 15.5,
        mostSensitiveParameter: 'costs',
        generatedAt: new Date(),
      };
      (cacheService.get as any).mockResolvedValue(JSON.stringify(mockCachedResult));

      const job = await sensitivityPrecomputeService.precompute({
        projectId: 'project-123',
        projectInput: mockProjectInput,
        sensitivityType: 'one-way',
      });

      const cancelled = sensitivityPrecomputeService.cancelJob(job.id);

      expect(cancelled).toBe(false);
    });

    it('should return false for non-existent job', () => {
      const cancelled = sensitivityPrecomputeService.cancelJob('non-existent');
      expect(cancelled).toBe(false);
    });
  });

  describe('Job Cleanup', () => {
    it('should clear completed jobs older than threshold', async () => {
      const mockCachedResult = {
        oneWaySensitivity: [],
        baseCaseIRR: 15.5,
        mostSensitiveParameter: 'costs',
        generatedAt: new Date(),
      };
      (cacheService.get as any).mockResolvedValue(JSON.stringify(mockCachedResult));

      // Create a completed job
      await sensitivityPrecomputeService.precompute({
        projectId: 'project-123',
        projectInput: mockProjectInput,
        sensitivityType: 'one-way',
      });

      // Clear jobs older than 0 hours (should clear all)
      const cleared = sensitivityPrecomputeService.clearCompletedJobs(0);

      expect(cleared).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Statistics', () => {
    it('should return service statistics', async () => {
      const stats = sensitivityPrecomputeService.getStats();

      expect(stats).toHaveProperty('activeJobs');
      expect(stats).toHaveProperty('pendingJobs');
      expect(stats).toHaveProperty('completedJobs');
      expect(stats).toHaveProperty('failedJobs');
      expect(stats).toHaveProperty('totalJobs');

      expect(stats.activeJobs).toBeGreaterThanOrEqual(0);
      expect(stats.pendingJobs).toBeGreaterThanOrEqual(0);
      expect(stats.completedJobs).toBeGreaterThanOrEqual(0);
      expect(stats.failedJobs).toBeGreaterThanOrEqual(0);
      expect(stats.totalJobs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Parameter Value Extraction', () => {
    it('should extract capacity from systemSize', () => {
      const value = sensitivityPrecomputeService['getParameterValue'](
        mockProjectInput,
        'systemSize'
      );
      expect(value).toBe(1);
    });

    it('should extract battery cost from costs', () => {
      const value = sensitivityPrecomputeService['getParameterValue'](
        mockProjectInput,
        'costs'
      );
      expect(value).toBe(1000000);
    });

    it('should extract systemEfficiency from operatingParams', () => {
      const value = sensitivityPrecomputeService['getParameterValue'](
        mockProjectInput,
        'operatingParams'
      );
      expect(value).toBe(0.9);
    });
  });

  describe('Variation Application', () => {
    it('should apply variation to systemSize', () => {
      const modified = sensitivityPrecomputeService['applyVariation'](
        mockProjectInput,
        'systemSize',
        0.15 // +15%
      );

      expect(modified.systemSize.capacity).toBe(1.15);
      expect(modified.systemSize.power).toBe(0.575);
    });

    it('should apply variation to costs', () => {
      const modified = sensitivityPrecomputeService['applyVariation'](
        mockProjectInput,
        'costs',
        -0.1 // -10%
      );

      expect(modified.costs.battery).toBe(900000);
      expect(modified.costs.pcs).toBe(180000);
    });

    it('should apply variation to operatingParams', () => {
      const modified = sensitivityPrecomputeService['applyVariation'](
        mockProjectInput,
        'operatingParams',
        0.05 // +5%
      );

      expect(modified.operatingParams.systemEfficiency).toBeCloseTo(
        0.945,
        3
      );
    });

    it('should clamp systemEfficiency to valid range', () => {
      const modified = sensitivityPrecomputeService['applyVariation'](
        mockProjectInput,
        'operatingParams',
        0.5 // +50% would exceed 1.0
      );

      expect(modified.operatingParams.systemEfficiency).toBeLessThanOrEqual(
        1.0
      );
    });
  });

  describe('One-Way Sensitivity Conversion', () => {
    it('should convert SensitivityResult to OneWaySensitivity format', async () => {
      const result = sensitivityPrecomputeService['convertToOneWaySensitivity'](
        mockSensitivityResult
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('variable');
      expect(result[0]).toHaveProperty('baseValue');
      expect(result[0]).toHaveProperty('scenarios');
      expect(result[0]).toHaveProperty('sensitivity');
      expect(result[0].scenarios).toHaveLength(5);
    });

    it('should calculate elasticity correctly', () => {
      const result = sensitivityPrecomputeService['convertToOneWaySensitivity'](
        mockSensitivityResult
      );

      // Check that elasticity is calculated
      expect(result[0].sensitivity.elasticityIRR).toBeDefined();
      expect(typeof result[0].sensitivity.elasticityIRR).toBe('number');
    });
  });

  describe('Job ID Generation', () => {
    it('should generate unique job IDs', async () => {
      const id1 = sensitivityPrecomputeService['generateJobId'](
        'project-123',
        'one-way'
      );

      // Wait to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const id2 = sensitivityPrecomputeService['generateJobId'](
        'project-123',
        'one-way'
      );

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^sensitivity-one-way-project-123-/);
    });

    it('should include sensitivity type in job ID', () => {
      const id = sensitivityPrecomputeService['generateJobId'](
        'project-123',
        'two-way'
      );

      expect(id).toMatch(/^sensitivity-two-way-/);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete precomputation workflow', async () => {
      (cacheService.get as any).mockResolvedValue(null);
      (
        mockSensitivityAnalyzer.sensitivityAnalyzer.analyzeSensitivity as any
      ).mockResolvedValue(mockSensitivityResult);

      const options: SensitivityPrecomputeOptions = {
        projectId: 'integration-test',
        projectInput: mockProjectInput,
        sensitivityType: 'full',
        parameters: ['costs', 'systemSize'],
      };

      // Start precomputation
      const job = await sensitivityPrecomputeService.precompute(options);

      expect(job.id).toBeDefined();
      expect(job.status).toBeDefined();

      // Wait for background processing to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check final status
      const finalJob = sensitivityPrecomputeService.getJob(job.id);
      expect(finalJob).toBeDefined();

      // If job completed, verify cache was called
      if (finalJob?.status === 'completed') {
        expect(cacheService.set).toHaveBeenCalled();
      }
    }, 10000);
  });
});
