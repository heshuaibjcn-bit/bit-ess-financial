/**
 * CalculationEngine - End-to-end project analysis
 *
 * Integrates all calculation services:
 * - ProvinceDataRepository - Load province data
 * - RevenueCalculator - Calculate revenue streams
 * - CashFlowCalculator - Generate cash flows
 * - FinancialCalculator - Compute investment metrics
 */

import { provinceDataRepository } from '../repositories/ProvinceDataRepository';
import { RevenueCalculator } from './RevenueCalculator';
import { EnhancedCashFlowCalculator } from './EnhancedCashFlowCalculator';
import { FinancialCalculator } from './FinancialCalculator';
import { cacheService } from './CacheService';
import type { ProvinceData } from '../schemas/ProvinceSchema';
import type { ProjectInput, OwnerInfo, CollaborationModel } from '../schemas/ProjectSchema';
import type { CalculationResult } from '../models/Project';

/**
 * Calculation engine options
 */
export interface CalculationOptions {
  discountRate?: number; // Default: 8%
  projectLifetime?: number; // Default: 10 years
  validateInputs?: boolean; // Default: true
}

/**
 * Revenue share breakdown for collaboration models
 */
export interface RevenueShareBreakdown {
  investorAnnualRevenue: number; // Investor's annual revenue after split
  ownerAnnualRevenue: number; // Owner's annual revenue after split
  investorTotalRevenue: number; // Total investor revenue over project lifetime
  ownerTotalRevenue: number; // Total owner revenue over project lifetime
  investorIrr: number; // Investor IRR
  ownerIrr: number; // Owner IRR (if applicable)
  splitRatio: number; // Revenue split ratio (0-100 for investor)
  collaborationModel: CollaborationModel;
}

/**
 * Calculation engine result with validation
 */
export interface EngineResult extends CalculationResult {
  validation: {
    valid: boolean;
    issues: string[];
  };
  metrics: {
    irr: number | null;
    npv: number;
    roi: number;
    lcoc: number;
    profitMargin: number;
  };
  // NEW: Revenue sharing breakdown
  revenueShare?: RevenueShareBreakdown;
}

/**
 * Main calculation engine for energy storage project analysis
 */
export class CalculationEngine {
  private revenueCalculator: RevenueCalculator;
  private cashFlowCalculator: EnhancedCashFlowCalculator;
  private financialCalculator: FinancialCalculator;
  private cache: typeof cacheService;

  constructor() {
    this.revenueCalculator = new RevenueCalculator();
    this.cashFlowCalculator = new EnhancedCashFlowCalculator();
    this.financialCalculator = new FinancialCalculator();
    this.cache = cacheService;
  }

  /**
   * Generate cache key from input parameters (using CacheService)
   *
   * @param input - Project input
   * @param options - Calculation options
   * @returns Cache key
   */
  private generateCacheKey(input: ProjectInput, options: CalculationOptions): string {
    return this.cache.generateKey(input, options);
  }

  /**
   * Calculate complete project analysis
   *
   * @param input - Project input parameters
   * @param options - Calculation options
   * @returns Complete calculation result
   */
  async calculateProject(
    input: ProjectInput,
    options: CalculationOptions = {}
  ): Promise<EngineResult> {
    // Check cache first
    const cacheKey = this.generateCacheKey(input, options);
    const cachedResult = await this.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const discountRate = options.discountRate ?? 0.08;
    const projectLifetime = options.projectLifetime ?? 10;

    try {
      // Step 1: Load province data
      const provinceData = await provinceDataRepository.getProvince(input.province);
      if (!provinceData) {
        throw new Error(`Province data not found for: ${input.province}`);
      }

      // Convert units from schema to calculator format
      // Schema: capacity (MW), duration (hours)
      // Calculator: capacity (kWh), power (kW)
      const capacityKWh = input.systemSize.capacity * 1000; // MW to kWh
      const powerKw = capacityKWh / input.systemSize.duration; // kWh / hours = kW

      // Step 2: Calculate revenue
      const revenueResult = this.revenueCalculator.calculateLifetimeRevenue(
        provinceData,
        capacityKWh,
        powerKw,
        input.operatingParams.systemEfficiency,
        input.operatingParams.depthOfDischarge,
        input.operatingParams.cyclesPerDay,
        input.operatingParams.degradationRate,
        projectLifetime
      );

      // Step 3: Calculate cash flows with real business costs
      const cashFlowResult = this.cashFlowCalculator.calculateCashFlows(
        input,
        provinceData,
        projectLifetime
      );

      // Step 4: Calculate financial metrics
      const financialMetrics = this.financialCalculator.calculateAllMetrics(
        cashFlowResult,
        input.systemSize.capacity,
        input.operatingParams.depthOfDischarge,
        input.operatingParams.cyclesPerDay,
        discountRate
      );

      // Step 5: Validate results
      const validation = this.financialCalculator.validateMetrics(financialMetrics);

      // Step 6: Build result
      const result: EngineResult = {
        projectId: 'temp', // Will be set by caller
        irr: financialMetrics.irr ?? 0,
        npv: financialMetrics.npv,
        paybackPeriod: cashFlowResult.paybackPeriod,
        annualCashFlows: cashFlowResult.annualCashFlows,
        revenueBreakdown: {
          peakValleyArbitrage: revenueResult.firstYearBreakdown.peakValleyArbitrage,
          capacityCompensation: revenueResult.firstYearBreakdown.capacityCompensation,
          demandResponse: revenueResult.firstYearBreakdown.demandResponse,
          auxiliaryServices: revenueResult.firstYearBreakdown.auxiliaryServices,
        },
        costBreakdown: {
          initialInvestment: cashFlowResult.totalInvestment,
          annualOpeex: cashFlowResult.totalOpex / Math.max(1, projectLifetime - 1), // Average per year
          annualFinancing: cashFlowResult.totalFinancing / Math.max(1, projectLifetime - 1), // Average per year
        },
        totalInvestment: cashFlowResult.totalInvestment,
        levelizedCost: financialMetrics.lcoc,
        capacityFactor: (input.operatingParams.cyclesPerDay * 2 * 365) / (8760), // Approximate
        calculatedAt: new Date(),
        calculationVersion: '1.0.0',
        validation,
        metrics: {
          irr: financialMetrics.irr,
          npv: financialMetrics.npv,
          roi: financialMetrics.roi,
          lcoc: financialMetrics.lcoc,
          profitMargin: financialMetrics.profitMargin,
        },
        // NEW: Calculate revenue sharing if owner info is available
        revenueShare: this.calculateRevenueShare(
          {
            projectId: 'temp',
            irr: financialMetrics.irr ?? 0,
            npv: financialMetrics.npv,
            paybackPeriod: cashFlowResult.paybackPeriod,
            annualCashFlows: cashFlowResult.annualCashFlows,
            revenueBreakdown: {
              peakValleyArbitrage: revenueResult.firstYearBreakdown.peakValleyArbitrage,
              capacityCompensation: revenueResult.firstYearBreakdown.capacityCompensation,
              demandResponse: revenueResult.firstYearBreakdown.demandResponse,
              auxiliaryServices: revenueResult.firstYearBreakdown.auxiliaryServices,
            },
            costBreakdown: {
              initialInvestment: cashFlowResult.totalInvestment,
              annualOpeex: cashFlowResult.totalOpex / Math.max(1, projectLifetime - 1),
              annualFinancing: cashFlowResult.totalFinancing / Math.max(1, projectLifetime - 1),
            },
            totalInvestment: cashFlowResult.totalInvestment,
            levelizedCost: financialMetrics.lcoc,
            capacityFactor: (input.operatingParams.cyclesPerDay * 2 * 365) / (8760),
            calculatedAt: new Date(),
            calculationVersion: '1.0.0',
            validation,
            metrics: {
              irr: financialMetrics.irr,
              npv: financialMetrics.npv,
              roi: financialMetrics.roi,
              lcoc: financialMetrics.lcoc,
              profitMargin: financialMetrics.profitMargin,
            },
          },
          input.ownerInfo,
          projectLifetime
        ),
      };

      // Cache the result with province for invalidation
      await this.cache.set(cacheKey, result, input.province);

      return result;
    } catch (error) {
      // Return error result
      const errorResult: EngineResult = {
        projectId: 'error',
        irr: 0,
        npv: 0,
        paybackPeriod: -1,
        annualCashFlows: [],
        revenueBreakdown: {
          peakValleyArbitrage: 0,
          capacityCompensation: 0,
          demandResponse: 0,
          auxiliaryServices: 0,
        },
        costBreakdown: {
          initialInvestment: 0,
          annualOpeex: 0,
          annualFinancing: 0,
        },
        totalInvestment: 0,
        levelizedCost: 0,
        capacityFactor: 0,
        calculatedAt: new Date(),
        calculationVersion: '1.0.0',
        validation: {
          valid: false,
          issues: [error instanceof Error ? error.message : 'Unknown error'],
        },
        metrics: {
          irr: null,
          npv: 0,
          roi: 0,
          lcoc: 0,
          profitMargin: 0,
        },
      };

      return errorResult;
    }
  }

  /**
   * Calculate multiple projects in parallel
   *
   * @param inputs - Array of project inputs
   * @param options - Calculation options
   * @returns Array of calculation results
   */
  async calculateProjects(
    inputs: ProjectInput[],
    options: CalculationOptions = {}
  ): Promise<EngineResult[]> {
    const results = await Promise.all(
      inputs.map(input => this.calculateProject(input, options))
    );

    return results;
  }

  /**
   * Clear calculation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   *
   * @returns Cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get detailed cache debug information
   */
  getCacheDebugInfo() {
    return this.cache.getDebugInfo();
  }

  /**
   * Invalidate cache for a specific province
   *
   * Call this when province data is updated
   *
   * @param province - Province slug
   * @returns Number of invalidated entries
   */
  invalidateProvinceCache(province: string): number {
    return this.cache.invalidateProvince(province);
  }

  /**
   * Preload provinces for better performance
   *
   * @param provinces - Array of province slugs to preload
   */
  async preloadProvinces(provinces: string[]): Promise<void> {
    await provinceDataRepository.preload(provinces);
  }

  /**
   * Validate project inputs before calculation
   *
   * @param input - Project input
   * @returns Validation result
   */
  validateInput(input: ProjectInput): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Validate system size
    if (input.systemSize.capacity <= 0) {
      issues.push('System capacity must be positive');
    }
    if (input.systemSize.duration <= 0) {
      issues.push('System duration must be positive');
    }

    // Validate operating parameters
    if (input.operatingParams.systemEfficiency <= 0 || input.operatingParams.systemEfficiency > 1) {
      issues.push('System efficiency must be between 0 and 1');
    }
    if (input.operatingParams.depthOfDischarge <= 0 || input.operatingParams.depthOfDischarge > 1) {
      issues.push('Depth of discharge must be between 0 and 1');
    }
    if (input.operatingParams.depthOfDischarge > input.operatingParams.systemEfficiency) {
      issues.push('Depth of discharge should not exceed system efficiency');
    }
    if (input.operatingParams.cyclesPerDay < 0.1 || input.operatingParams.cyclesPerDay > 4) {
      issues.push('Cycles per day should be between 0.1 and 4');
    }
    if (input.operatingParams.degradationRate < 0 || input.operatingParams.degradationRate > 0.1) {
      issues.push('Degradation rate seems unusual (should be 0-10%)');
    }
    if (input.operatingParams.availabilityPercent < 0 || input.operatingParams.availabilityPercent > 1) {
      issues.push('Availability must be between 0 and 1');
    }

    // Validate financing
    if (input.financing) {
      if (input.financing.loanRatio !== undefined && (input.financing.loanRatio < 0 || input.financing.loanRatio > 0.9)) {
        issues.push('Loan ratio should be between 0 and 90%');
      }
      if (input.financing.interestRate !== undefined && (input.financing.interestRate < 0 || input.financing.interestRate > 0.2)) {
        issues.push('Interest rate should be between 0 and 20%');
      }
      if (input.financing.loanTerm !== undefined && (input.financing.loanTerm < 1 || input.financing.loanTerm > 20)) {
        issues.push('Loan term should be between 1 and 20 years');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get investment recommendation based on metrics
   *
   * @param result - Calculation result
   * @returns Investment recommendation (1-5 scale)
   */
  getRecommendation(result: EngineResult): {
    rating: 1 | 2 | 3 | 4 | 5;
    label: string;
    description: string;
  } {
    const { irr, npv, paybackPeriod } = result;

    // Rating criteria
    if (!result.validation.valid) {
      return {
        rating: 1,
        label: '不推荐 (Not Recommended)',
        description: '计算结果存在异常，请检查输入参数',
      };
    }

    if (irr === null || irr < 0) {
      return {
        rating: 1,
        label: '不推荐 (Not Recommended)',
        description: '项目内部收益率为负，投资将亏损',
      };
    }

    if (irr < 6) {
      return {
        rating: 2,
        label: '较差 (Poor)',
        description: '内部收益率低于6%，投资回报较低',
      };
    }

    if (irr < 10) {
      return {
        rating: 3,
        label: '一般 (Fair)',
        description: '内部收益率6-10%，投资回报一般',
      };
    }

    if (irr < 15) {
      return {
        rating: 4,
        label: '良好 (Good)',
        description: '内部收益率10-15%，投资回报良好',
      };
    }

    return {
      rating: 5,
      label: '优秀 (Excellent)',
      description: '内部收益率超过15%，投资回报优秀',
    };
  }

  /**
   * Calculate revenue share breakdown for collaboration models
   *
   * @param result - Calculation result
   * @param ownerInfo - Owner information
   * @param projectLifetime - Project lifetime in years
   * @returns Revenue share breakdown
   */
  calculateRevenueShare(
    result: EngineResult,
    ownerInfo: OwnerInfo | undefined,
    projectLifetime: number = 10
  ): RevenueShareBreakdown | undefined {
    if (!ownerInfo) {
      return undefined;
    }

    const collaborationModel = ownerInfo.collaborationModel;
    const annualProfit = result.annualCashFlows[0] || 0; // Use first year cash flow as proxy

    let investorAnnualRevenue = 0;
    let ownerAnnualRevenue = 0;
    let splitRatio = 0;

    switch (collaborationModel) {
      case 'investor_owned':
        // Investor owns 100% of revenue
        investorAnnualRevenue = annualProfit;
        ownerAnnualRevenue = 0;
        splitRatio = 100;
        break;

      case 'joint_venture':
        // Revenue split based on agreed ratio
        splitRatio = ownerInfo.revenueShareRatio || 50;
        investorAnnualRevenue = annualProfit * (splitRatio / 100);
        ownerAnnualRevenue = annualProfit * ((100 - splitRatio) / 100);
        break;

      case 'emc':
        // EMC mode: Investor gets 80% for first 5 years, then 60%
        // Simplified: using 70% average
        splitRatio = 70;
        investorAnnualRevenue = annualProfit * 0.7;
        ownerAnnualRevenue = annualProfit * 0.3;
        break;
    }

    const investorTotalRevenue = investorAnnualRevenue * projectLifetime;
    const ownerTotalRevenue = ownerAnnualRevenue * projectLifetime;

    // Calculate investor IRR (simplified)
    const investorInvestment = result.totalInvestment * (result.metrics.irr ? 0.01 : 0);
    const investorIrr = investorInvestment > 0 ? (investorAnnualRevenue / investorInvestment) : 0;

    // Owner IRR (only applicable if owner has revenue)
    const ownerIrr = ownerAnnualRevenue > 0 ? (ownerAnnualRevenue / result.totalInvestment) * 0.5 : 0;

    return {
      investorAnnualRevenue,
      ownerAnnualRevenue,
      investorTotalRevenue,
      ownerTotalRevenue,
      investorIrr,
      ownerIrr,
      splitRatio,
      collaborationModel,
    };
  }
}

// Singleton instance
export const calculationEngine = new CalculationEngine();
