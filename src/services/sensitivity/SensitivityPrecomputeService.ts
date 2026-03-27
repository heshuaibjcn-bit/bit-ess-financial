/**
 * Sensitivity Analysis Precomputation Service
 *
 * Performs background precomputation of sensitivity analysis grids.
 * Prevents UI blocking by running calculations asynchronously.
 */

import { sensitivityAnalyzer } from '@/domain/services/SensitivityAnalyzer';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';
import type { SensitivityResult, OneWaySensitivity, TwoWaySensitivity } from '@/domain/models/Scenario';
import { cacheService } from '@/domain/services/CacheService';

export type SensitivityType = 'one-way' | 'two-way' | 'full';

export interface SensitivityPrecomputeOptions {
  projectId: string;
  projectInput: ProjectInput;
  sensitivityType: SensitivityType;
  variationLevels?: number[]; // Default: [-0.3, -0.15, 0, 0.15, 0.3]
  parameters?: Array<keyof ProjectInput>; // Parameters to analyze
}

export interface SensitivityPrecomputeJob {
  id: string;
  projectId: string;
  sensitivityType: SensitivityType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  result?: SensitivityPrecomputeResult;
  error?: string;
}

export interface SensitivityPrecomputeResult {
  oneWaySensitivity: OneWaySensitivity[];
  twoWaySensitivity?: TwoWaySensitivity[];
  baseCaseIRR: number;
  mostSensitiveParameter: string;
  generatedAt: Date;
}

export interface SensitivityGrid {
  projectId: string;
  parameter: string;
  variation: number;
  irr: number;
  npv: number;
  computedAt: Date;
}

/**
 * Sensitivity Analysis Precomputation Service
 *
 * Handles background computation of sensitivity analysis to prevent UI blocking.
 */
class SensitivityPrecomputeService {
  private activeJobs: Map<string, SensitivityPrecomputeJob> = new Map();

  /**
   * Generate cache key for sensitivity results
   */
  private generateCacheKey(projectId: string, sensitivityType: SensitivityType): string {
    return `sensitivity:${sensitivityType}:${projectId}`;
  }

  /**
   * Check if precomputed results exist in cache
   */
  async hasCachedResults(
    projectId: string,
    sensitivityType: SensitivityType
  ): Promise<boolean> {
    const cacheKey = this.generateCacheKey(projectId, sensitivityType);
    const cached = await cacheService.get(cacheKey);
    return cached !== null;
  }

  /**
   * Get cached sensitivity results
   */
  async getCachedResults(
    projectId: string,
    sensitivityType: SensitivityType
  ): Promise<SensitivityPrecomputeResult | null> {
    const cacheKey = this.generateCacheKey(projectId, sensitivityType);
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as SensitivityPrecomputeResult;
    }

    return null;
  }

  /**
   * Cache sensitivity results
   */
  private async cacheResults(
    projectId: string,
    sensitivityType: SensitivityType,
    result: SensitivityPrecomputeResult
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(projectId, sensitivityType);
    const value = JSON.stringify(result);
    await cacheService.set(cacheKey, value, 3600); // Cache for 1 hour
  }

  /**
   * Precompute sensitivity analysis in background
   */
  async precompute(
    options: SensitivityPrecomputeOptions
  ): Promise<SensitivityPrecomputeJob> {
    const jobId = this.generateJobId(options.projectId, options.sensitivityType);

    // Check cache first
    const cached = await this.getCachedResults(options.projectId, options.sensitivityType);
    if (cached) {
      return {
        id: jobId,
        projectId: options.projectId,
        sensitivityType: options.sensitivityType,
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        result: cached,
      };
    }

    // Create job
    const job: SensitivityPrecomputeJob = {
      id: jobId,
      projectId: options.projectId,
      sensitivityType: options.sensitivityType,
      status: 'pending',
      progress: 0,
    };

    this.activeJobs.set(jobId, job);

    // Start background computation
    this.runPrecomputation(job, options).catch((error) => {
      console.error(`Sensitivity precomputation failed for job ${jobId}:`, error);
    });

    return job;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): SensitivityPrecomputeJob | undefined {
    return this.activeJobs.get(jobId);
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): SensitivityPrecomputeJob[] {
    return Array.from(this.activeJobs.values()).filter(
      (job) => job.status === 'pending' || job.status === 'running'
    );
  }

  /**
   * Cancel job
   */
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (!job || (job.status !== 'pending' && job.status !== 'running')) {
      return false;
    }

    job.status = 'failed';
    job.error = 'Cancelled by user';
    job.completedAt = new Date();

    return true;
  }

  /**
   * Clear completed jobs
   */
  clearCompletedJobs(olderThanHours: number = 1): number {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleared = 0;

    for (const [jobId, job] of this.activeJobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        job.completedAt < cutoff
      ) {
        this.activeJobs.delete(jobId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Run precomputation in background
   */
  private async runPrecomputation(
    job: SensitivityPrecomputeJob,
    options: SensitivityPrecomputeOptions
  ): Promise<void> {
    try {
      // Update job status
      job.status = 'running';
      job.startedAt = new Date();
      job.progress = 10;

      // Determine parameters to analyze
      const parameters =
        options.parameters ||
        (['costs', 'systemSize', 'operatingParams'] as Array<keyof ProjectInput>);

      // Determine variation levels
      const variationLevels = options.variationLevels || [-0.3, -0.15, 0, 0.15, 0.3];

      job.progress = 20;

      // Perform sensitivity analysis
      const sensitivityResult = await sensitivityAnalyzer.analyzeSensitivity(
        options.projectInput,
        variationLevels
      );

      job.progress = 60;

      // Convert to precompute result format
      const result: SensitivityPrecomputeResult = {
        oneWaySensitivity: this.convertToOneWaySensitivity(sensitivityResult),
        baseCaseIRR: sensitivityResult.baselineIRR,
        mostSensitiveParameter: sensitivityResult.mostSensitiveParameter,
        generatedAt: new Date(),
      };

      // Add two-way sensitivity if requested
      if (options.sensitivityType === 'two-way' || options.sensitivityType === 'full') {
        result.twoWaySensitivity = await this.computeTwoWaySensitivity(
          options.projectInput,
          variationLevels,
          parameters
        );
      }

      job.progress = 90;

      // Cache results
      await this.cacheResults(options.projectId, options.sensitivityType, result);

      // Update job
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();
      job.result = result;

      // Clean up old job after delay
      setTimeout(() => {
        this.activeJobs.delete(job.id);
      }, 5 * 60 * 1000); // Keep for 5 minutes
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * Convert SensitivityResult to OneWaySensitivity format
   */
  private convertToOneWaySensitivity(
    result: SensitivityResult
  ): OneWaySensitivity[] {
    return result.sensitivities.map((sensitivity) => {
      // Calculate elasticity
      const baselineVariation = sensitivity.variations.find((v) => v.level === '0%');
      const posVariation = sensitivity.variations.find((v) => v.level === '+15%');
      const negVariation = sensitivity.variations.find((v) => v.level === '-15%');

      const elasticityIRR =
        posVariation && negVariation
          ? (posVariation.irrChange - negVariation.irrChange) / 0.3 / 100
          : 0;

      return {
        variable: sensitivity.parameter as any,
        baseValue: sensitivity.baselineValue,
        baseResult: {
          irr: sensitivity.baselineIRR,
          npv: 0, // Not available in SensitivityResult
        },
        scenarios: sensitivity.variations.map((v) => ({
          change: parseFloat(v.level) / 100,
          value: v.value,
          irr: v.irr,
          npv: 0, // Would need additional calculation
          irrChange: v.irrChange,
          npvChange: 0,
        })),
        sensitivity: {
          elasticityIRR,
          elasticityNPV: 0,
          mostSensitive: sensitivity.parameter === result.mostSensitiveParameter,
        },
      };
    });
  }

  /**
   * Compute two-way sensitivity matrix
   */
  private async computeTwoWaySensitivity(
    input: ProjectInput,
    variationLevels: number[],
    parameters: Array<keyof ProjectInput>
  ): Promise<TwoWaySensitivity[]> {
    const result: TwoWaySensitivity[] = [];

    // Only compute top 2 parameter combinations to avoid excessive computation
    const topParameters = parameters.slice(0, 2);

    for (let i = 0; i < topParameters.length - 1; i++) {
      for (let j = i + 1; j < topParameters.length; j++) {
        const primaryParam = topParameters[i];
        const secondaryParam = topParameters[j];

        const irrMatrix = await this.computeIRRMatrix(
          input,
          primaryParam,
          secondaryParam,
          variationLevels
        );

        // Find best and worst cases
        let bestCase = { irr: -Infinity, primaryValue: 0, secondaryValue: 0 };
        let worstCase = { irr: Infinity, primaryValue: 0, secondaryValue: 0 };

        for (const row of irrMatrix) {
          for (const cell of row.secondaryValues) {
            if (cell.irr > bestCase.irr) {
              bestCase = {
                irr: cell.irr,
                primaryValue: row.primaryValue,
                secondaryValue: cell.secondaryValue,
              };
            }
            if (cell.irr < worstCase.irr) {
              worstCase = {
                irr: cell.irr,
                primaryValue: row.primaryValue,
                secondaryValue: cell.secondaryValue,
              };
            }
          }
        }

        result.push({
          primaryVariable: primaryParam as any,
          secondaryVariable: secondaryParam as any,
          irrMatrix,
          analysis: {
            bestCase,
            worstCase,
            correlation: 0, // Would require statistical calculation
          },
        });
      }
    }

    return result;
  }

  /**
   * Compute IRR matrix for two-way sensitivity
   */
  private async computeIRRMatrix(
    input: ProjectInput,
    primaryParam: keyof ProjectInput,
    secondaryParam: keyof ProjectInput,
    variationLevels: number[]
  ): Promise<
    Array<{
      primaryValue: number;
      secondaryValues: Array<{
        secondaryValue: number;
        irr: number;
      }>;
    }>
  > {
    const matrix: Array<{
      primaryValue: number;
      secondaryValues: Array<{
        secondaryValue: number;
        irr: number;
      }>;
    }> = [];

    // Get base values
    const basePrimaryValue = this.getParameterValue(input, primaryParam);
    const baseSecondaryValue = this.getParameterValue(input, secondaryParam);

    // Compute for each primary variation
    for (const primaryVariation of variationLevels) {
      const primaryInput = this.applyVariation(input, primaryParam, primaryVariation);
      const primaryValue = this.getParameterValue(primaryInput, primaryParam);

      const secondaryValues: Array<{
        secondaryValue: number;
        irr: number;
      }> = [];

      // Compute for each secondary variation
      for (const secondaryVariation of variationLevels) {
        const combinedInput = this.applyVariation(primaryInput, secondaryParam, secondaryVariation);
        const secondaryValue = this.getParameterValue(combinedInput, secondaryParam);

        // Calculate IRR
        const calcResult = await sensitivityAnalyzer['calculationEngine'].calculateProject(
          combinedInput,
          {}
        );
        const irr = calcResult.irr || 0;

        secondaryValues.push({
          secondaryValue,
          irr,
        });
      }

      matrix.push({
        primaryValue,
        secondaryValues,
      });
    }

    return matrix;
  }

  /**
   * Get parameter value from input
   */
  private getParameterValue(input: ProjectInput, parameter: keyof ProjectInput): number {
    const value = input[parameter];

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      if ('capacity' in value) return (value as { capacity: number }).capacity;
      if ('battery' in value) return (value as { battery: number }).battery;
      if ('systemEfficiency' in value) return (value as { systemEfficiency: number }).systemEfficiency;
    }

    return 0;
  }

  /**
   * Apply variation to input
   */
  private applyVariation(
    input: ProjectInput,
    parameter: keyof ProjectInput,
    variation: number
  ): ProjectInput {
    const modifiedInput = { ...input };

    if (parameter === 'systemSize') {
      const baseCapacity = input.systemSize.capacity;
      const basePower = input.systemSize.power;

      modifiedInput.systemSize = {
        capacity: baseCapacity * (1 + variation),
        power: basePower * (1 + variation),
      };
    } else if (parameter === 'costs') {
      const baseCosts = { ...input.costs };
      Object.keys(baseCosts).forEach((key) => {
        baseCosts[key as keyof typeof baseCosts] *= 1 + variation;
      });
      modifiedInput.costs = baseCosts;
    } else if (parameter === 'operatingParams') {
      const baseParams = { ...input.operatingParams };
      if (baseParams.systemEfficiency !== undefined) {
        baseParams.systemEfficiency = Math.min(
          1,
          Math.max(0, baseParams.systemEfficiency * (1 + variation))
        );
      }
      modifiedInput.operatingParams = baseParams;
    }

    return modifiedInput;
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(projectId: string, sensitivityType: SensitivityType): string {
    return `sensitivity-${sensitivityType}-${projectId}-${Date.now()}`;
  }

  /**
   * Get service statistics
   */
  getStats() {
    const jobs = Array.from(this.activeJobs.values());

    return {
      activeJobs: jobs.filter((j) => j.status === 'running').length,
      pendingJobs: jobs.filter((j) => j.status === 'pending').length,
      completedJobs: jobs.filter((j) => j.status === 'completed').length,
      failedJobs: jobs.filter((j) => j.status === 'failed').length,
      totalJobs: jobs.length,
    };
  }
}

// Singleton instance
export const sensitivityPrecomputeService = new SensitivityPrecomputeService();
