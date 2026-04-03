/**
 * FinancialCalculator - Calculate investment metrics for energy storage projects
 *
 * This service calculates:
 * - IRR (Internal Rate of Return)
 * - NPV (Net Present Value)
 * - LCOS (Levelized Cost of Storage)
 * - ROI (Return on Investment)
 */

import { computeIrr } from '@8hobbies/irr';
import type { CashFlowResult } from './CashFlowCalculator';

/**
 * Financial metrics result
 */
export interface FinancialMetrics {
  irr: number | null; // Internal Rate of Return (%), null if unsolvable
  npv: number; // Net Present Value (¥)
  roi: number; // Return on Investment (%)
  lcoc: number; // Levelized Cost of Storage (¥/kWh)
  profitMargin: number; // (Total Revenue - Total Cost) / Total Revenue (%)
  // Additional metrics from verified model
  equityIrr: number | null; // IRR on equity investment (%)
  paybackPeriodStatic: number; // Static payback period (years)
  paybackPeriodDynamic: number; // Dynamic payback period at discount rate (years)
  roe: number; // Return on Equity (%)
  cumulativeNetProfit: number; // Cumulative net profit over lifetime (¥)
  avgAnnualNetProfit: number; // Average annual net profit (¥/year)
  threeYearNetProfit: number; // Net profit in first 3 years (¥)
}

/**
 * Calculator for financial investment metrics
 */
export class FinancialCalculator {
  /**
   * Calculate Internal Rate of Return (IRR)
   *
   * Uses the @8hobbies/irr library which handles multiple IRRs
   * and edge cases.
   *
   * @param cashFlows - Array of cash flows (first element is initial investment, negative)
   * @returns IRR as a percentage (e.g., 8.14 for 8.14%), or null if unsolvable
   */
  calculateIRR(cashFlows: number[]): number | null {
    if (!cashFlows || cashFlows.length === 0) {
      return null;
    }

    // Check if all cash flows are negative or zero
    const hasPositiveFlow = cashFlows.some(cf => cf > 0);
    if (!hasPositiveFlow) {
      return null; // No positive cash flows, IRR is undefined
    }

    try {
      const irrResults = computeIrr(cashFlows);

      if (irrResults.length === 0) {
        return null; // No valid IRR found
      }

      // Return the first (usually the most relevant) IRR
      // Convert from decimal to percentage
      const irrDecimal = irrResults[0];

      // Sanity check: IRR should be between -100% and 1000%
      if (irrDecimal < -1 || irrDecimal > 10) {
        return null;
      }

      const irrPercentage = irrDecimal * 100;
      return irrPercentage; // Return as percentage
    } catch (error) {
      console.error('❌ Error calculating IRR:', error);
      return null;
    }
  }

  /**
   * Calculate Net Present Value (NPV)
   *
   * Formula: NPV = Σ(CFt / (1 + r)^t)
   * Where CFt is cash flow at time t, r is discount rate
   *
   * @param cashFlows - Array of cash flows
   * @param discountRate - Annual discount rate (e.g., 0.08 for 8%)
   * @returns NPV in currency units (¥)
   */
  calculateNPV(cashFlows: number[], discountRate: number): number {
    if (!cashFlows || cashFlows.length === 0) {
      return 0;
    }

    let npv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + discountRate, t);
    }

    return npv;
  }

  /**
   * Calculate Return on Investment (ROI)
   *
   * Formula: ROI = (Total Revenue - Total Cost) / Total Cost
   *
   * @param totalRevenue - Total revenue over project lifetime
   * @param totalInvestment - Initial investment
   * @param totalOperatingCost - Total operating costs
   * @returns ROI as a percentage
   */
  calculateROI(
    totalRevenue: number,
    totalInvestment: number,
    totalOperatingCost: number
  ): number {
    const totalCost = totalInvestment + totalOperatingCost;

    if (totalCost === 0) {
      return 0; // Avoid division by zero
    }

    const roi = ((totalRevenue - totalCost) / totalCost) * 100;
    return roi;
  }

  /**
   * Calculate Levelized Cost of Storage (LCOS)
   *
   * Formula: LCOS = Total Present Value of Costs / Total Present Value of Energy
   *
   * @param cashFlowResult - Cash flow calculation result
   * @param systemCapacity - System capacity (kWh)
   * @param dod - Depth of discharge (0-1)
   * @param cyclesPerDay - Charge/discharge cycles per day
   * @param discountRate - Annual discount rate
   * @param years - Project lifetime in years
   * @returns LCOS in ¥/kWh
   */
  calculateLCOS(
    cashFlowResult: CashFlowResult,
    systemCapacity: number,
    dod: number,
    cyclesPerDay: number,
    discountRate: number,
    years: number
  ): number {
    let totalCostPV = 0; // Present value of costs
    let totalEnergyPV = 0; // Present value of energy discharged

    for (let year = 0; year < years; year++) {
      const discountFactor = 1 / Math.pow(1 + discountRate, year);

      // Cost for this year
      const yearlyCashFlow = cashFlowResult.yearlyCashFlows[year];
      const yearlyCost = yearlyCashFlow.costs.initialInvestment +
                         yearlyCashFlow.costs.annualOpex +
                         yearlyCashFlow.costs.financing;

      totalCostPV += yearlyCost * discountFactor;

      // Energy discharged this year (kWh)
      // Year 0 has no energy discharge (construction)
      if (year > 0) {
        // Apply degradation: capacity decreases each year
        const degradationRate = 0.02; // Default 2% per year
        const degradedCapacity = systemCapacity * Math.pow(1 - degradationRate, year - 1);

        const energyPerYear = degradedCapacity * dod * cyclesPerDay * 365;
        totalEnergyPV += energyPerYear * discountFactor;
      }
    }

    if (totalEnergyPV === 0) {
      return 0; // Avoid division by zero
    }

    return totalCostPV / totalEnergyPV;
  }

  /**
   * Calculate profit margin
   *
   * Formula: (Total Revenue - Total Cost) / Total Revenue
   *
   * @param totalRevenue - Total revenue over project lifetime
   * @param totalCost - Total cost (investment + operating + financing)
   * @returns Profit margin as a percentage
   */
  calculateProfitMargin(totalRevenue: number, totalCost: number): number {
    if (totalRevenue === 0) {
      return 0; // Avoid division by zero
    }

    const profitMargin = ((totalRevenue - totalCost) / totalRevenue) * 100;
    return profitMargin;
  }

  /**
   * Calculate static payback period
   *
   * @param cashFlowResult - Cash flow result
   * @returns Years to recover investment (static, not discounted)
   */
  calculateStaticPaybackPeriod(cashFlowResult: CashFlowResult): number {
    // Use the existing payback period from cash flow result
    return cashFlowResult.paybackPeriod;
  }

  /**
   * Calculate dynamic payback period (discounted)
   *
   * @param cashFlows - Annual cash flows
   * @param discountRate - Discount rate
   * @returns Years to recover investment (discounted), or -1 if never
   */
  calculateDynamicPaybackPeriod(
    cashFlows: number[],
    discountRate: number
  ): number {
    let cumulativePV = 0;

    for (let year = 0; year < cashFlows.length; year++) {
      const discountedCF = cashFlows[year] / Math.pow(1 + discountRate, year);
      cumulativePV += discountedCF;

      if (cumulativePV >= 0) {
        return year;
      }
    }

    return -1; // Never pays back
  }

  /**
   * Calculate cumulative net profit over project lifetime
   *
   * @param cashFlowResult - Cash flow result
   * @returns Total net profit (¥)
   */
  calculateCumulativeNetProfit(cashFlowResult: CashFlowResult): number {
    return cashFlowResult.totalRevenue - (
      cashFlowResult.totalInvestment +
      cashFlowResult.totalOpex +
      cashFlowResult.totalFinancing +
      cashFlowResult.totalTaxes
    );
  }

  /**
   * Calculate net profit in first 3 years
   *
   * @param cashFlowResult - Cash flow result
   * @returns Net profit in years 1-3 (¥)
   */
  calculateThreeYearNetProfit(cashFlowResult: CashFlowResult): number {
    let threeYearProfit = 0;

    // Sum profits for years 1, 2, 3 (index 1, 2, 3 in array)
    for (let year = 1; year <= 3 && year < cashFlowResult.yearlyCashFlows.length; year++) {
      const ycf = cashFlowResult.yearlyCashFlows[year];
      threeYearProfit += ycf.revenue - ycf.costs.total;
    }

    return threeYearProfit;
  }

  /**
   * Calculate equity IRR for leveraged projects
   *
   * @param cashFlows - Total project cash flows
   * @param equityRatio - Percentage of equity (0-1)
   * @param loanAmount - Total loan amount
   * @param loanPayments - Annual loan payments
   * @returns IRR on equity investment (%)
   */
  calculateEquityIRR(
    cashFlows: number[],
    equityRatio: number,
    loanAmount: number,
    loanPayments: number[]
  ): number | null {
    // Calculate equity cash flows
    // Year 0: negative equity investment
    const equityInvestment = cashFlows[0] * equityRatio;
    const equityCashFlows: number[] = [equityInvestment];

    // Years 1+: cash flow minus debt service
    for (let year = 1; year < cashFlows.length; year++) {
      const debtService = loanPayments[year - 1] || 0;
      equityCashFlows.push(cashFlows[year] - debtService);
    }

    return this.calculateIRR(equityCashFlows);
  }

  /**
   * Calculate all financial metrics from cash flow result
   *
   * @param cashFlowResult - Cash flow calculation result
   * @param systemCapacity - System capacity (kWh)
   * @param dod - Depth of discharge (0-1)
   * @param cyclesPerDay - Charge/discharge cycles per day
   * @param discountRate - Annual discount rate (default: 8%)
   * @returns All financial metrics
   */
  calculateAllMetrics(
    cashFlowResult: CashFlowResult,
    systemCapacity: number,
    dod: number,
    cyclesPerDay: number,
    discountRate: number = 0.08
  ): FinancialMetrics {
    // Calculate IRR
    const irr = this.calculateIRR(cashFlowResult.annualCashFlows);

    // Calculate NPV
    const npv = this.calculateNPV(cashFlowResult.annualCashFlows, discountRate);

    // Calculate ROI
    const totalCost = cashFlowResult.totalInvestment +
                     cashFlowResult.totalOpex +
                     cashFlowResult.totalFinancing;
    const roi = this.calculateROI(
      cashFlowResult.totalRevenue,
      cashFlowResult.totalInvestment,
      cashFlowResult.totalOpex + cashFlowResult.totalFinancing
    );

    // Calculate LCOS
    const lcoc = this.calculateLCOS(
      cashFlowResult,
      systemCapacity,
      dod,
      cyclesPerDay,
      discountRate,
      cashFlowResult.yearlyCashFlows.length
    );

    // Calculate profit margin
    const profitMargin = this.calculateProfitMargin(
      cashFlowResult.totalRevenue,
      totalCost
    );

    // Calculate additional metrics from verified model
    // Payback periods
    const paybackPeriodStatic = this.calculateStaticPaybackPeriod(cashFlowResult);
    const paybackPeriodDynamic = this.calculateDynamicPaybackPeriod(
      cashFlowResult.annualCashFlows,
      discountRate
    );

    // ROE (Return on Equity) - requires equity investment info
    // For 100% self-funded: ROE = ROI
    // For leveraged: ROE > ROI
    const equityIrr = irr; // Will be different for leveraged projects

    // Cumulative metrics
    const cumulativeNetProfit = this.calculateCumulativeNetProfit(cashFlowResult);
    const avgAnnualNetProfit = cumulativeNetProfit / cashFlowResult.yearlyCashFlows.length;
    const threeYearNetProfit = this.calculateThreeYearNetProfit(cashFlowResult);

    // ROE calculation (net profit / equity investment)
    const equityInvestment = cashFlowResult.totalInvestment; // Will be adjusted for leveraged
    const totalNetProfit = cashFlowResult.totalRevenue - totalCost;
    const roe = equityInvestment > 0 ? (totalNetProfit / equityInvestment) * 100 : 0;

    return {
      irr,
      npv,
      roi,
      lcoc,
      profitMargin,
      equityIrr,
      paybackPeriodStatic,
      paybackPeriodDynamic,
      roe,
      cumulativeNetProfit,
      avgAnnualNetProfit,
      threeYearNetProfit,
    };
  }

  /**
   * Validate financial metrics are in reasonable ranges
   *
   * @param metrics - Financial metrics to validate
   * @returns Validation result with any issues found
   */
  validateMetrics(metrics: FinancialMetrics): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check IRR
    if (metrics.irr !== null) {
      if (metrics.irr < 0) {
        issues.push('IRR is negative, indicating a loss-making investment');
      }
      if (metrics.irr > 100) {
        issues.push('IRR seems unrealistically high (>100%)');
      }
    } else {
      issues.push('IRR could not be calculated (may be all negative cash flows)');
    }

    // Check NPV
    if (metrics.npv < 0) {
      issues.push('NPV is negative, project destroys value');
    }

    // Check ROI
    if (metrics.roi < 0) {
      issues.push('ROI is negative, investment loses money');
    }

    // Check LCOS
    if (metrics.lcoc <= 0) {
      issues.push('LCOS is invalid (zero or negative)');
    }
    if (metrics.lcoc > 2) {
      issues.push('LCOS seems high (>2 ¥/kWh), verify cost assumptions');
    }

    // Check profit margin
    if (metrics.profitMargin < -50) {
      issues.push('Profit margin is very negative, verify inputs');
    }
    if (metrics.profitMargin > 90) {
      issues.push('Profit margin seems unrealistically high');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

// Singleton instance
export const financialCalculator = new FinancialCalculator();
