/**
 * CashFlowCalculator - Calculate project cash flows over lifetime
 *
 * This service generates annual cash flow projections including:
 * - Revenue from energy storage operations
 * - Initial investment costs
 * - Annual operating costs (OPEX)
 * - Financing costs (if applicable)
 */

import type { ProvinceData } from '../schemas/ProvinceSchema';
import type { ProjectInput } from '../schemas/ProjectSchema';
import { RevenueCalculator, type RevenueResult } from './RevenueCalculator';

/**
 * Cost breakdown for a single year
 */
export interface YearlyCosts {
  initialInvestment: number; // Only in year 0 (¥)
  annualOpex: number; // Annual operating cost (¥/year)
  financing: number; // Annual loan payment (¥/year)
  taxes: number; // Annual taxes (VAT, surtax, corporate tax)
  total: number; // Total cost for the year (¥)
}

/**
 * Cash flow breakdown for a single year
 */
export interface YearlyCashFlow {
  revenue: number; // Total revenue (¥/year)
  costs: YearlyCosts; // Cost breakdown
  netCashFlow: number; // Revenue - Costs (¥/year)
  cumulativeCashFlow: number; // Running total (¥)
}

/**
 * Cash flow calculation result
 */
export interface CashFlowResult {
  yearlyCashFlows: YearlyCashFlow[]; // Year-by-year breakdown
  annualCashFlows: number[]; // Simple array for IRR calculation
  totalInvestment: number; // Initial investment (¥)
  totalRevenue: number; // Total lifetime revenue (¥)
  totalOpex: number; // Total lifetime OPEX (¥)
  totalFinancing: number; // Total lifetime financing cost (¥)
  paybackPeriod: number; // Years to recover investment (or -1 if never)
}

/**
 * Calculator for project cash flows
 */
export class CashFlowCalculator {
  private revenueCalculator: RevenueCalculator;

  constructor() {
    this.revenueCalculator = new RevenueCalculator();
  }

  /**
   * Calculate initial investment from project input
   *
   * @param input - Project input
   * @returns Initial investment (¥)
   */
  calculateInitialInvestment(input: ProjectInput): number {
    const { systemSize, costs } = input;

    // Check if using new schema (with batteryCostPerKwh) or old schema (with battery)
    const isNewSchema = 'batteryCostPerKwh' in costs;

    if (isNewSchema) {
      // New schema: capacity (kWh), power (kW) or capacity (kWh), duration (hours)
      const capacityKwh = systemSize.capacity;

      // If duration is provided, calculate power from capacity and duration
      // Otherwise, use the directly provided power value
      let powerKw: number;
      if (systemSize.duration && systemSize.duration > 0) {
        powerKw = capacityKwh / systemSize.duration;
      } else if (systemSize.power && systemSize.power > 0) {
        powerKw = systemSize.power;
      } else {
        throw new Error('Either systemSize.duration or systemSize.power must be provided');
      }

      const baseInvestment =
        (costs.batteryCostPerKwh || 0) * capacityKwh +
        (costs.pcsCostPerKw || 0) * powerKw +
        (costs.emsCostPerKwh || 0) * capacityKwh +
        (costs.bmsCostPerKwh || 0) * capacityKwh +
        (costs.thermalMgmtCostPerKwh || 0) * capacityKwh +
        (costs.fireProtectionCostPerKwh || 0) * capacityKwh +
        (costs.containerCostPerKwh || 0) * capacityKwh +
        (costs.installationCostPerKw || 0) * powerKw +
        (costs.otherCostPerKwh || 0) * capacityKwh;

      return baseInvestment * (1 + (costs.contingencyPercent || 0));
    } else {
      // Old schema: capacity (kWh), power (kW)
      // Calculate total cost per Wh
      const costPerWh =
        costs.battery +
        costs.pcs / 1000 + // Convert ¥/W to ¥/Wh
        costs.bms +
        costs.ems +
        costs.thermalManagement +
        costs.fireProtection +
        costs.container +
        costs.installation +
        costs.other;

      // Total investment = cost per Wh * capacity in Wh
      const totalInvestment = costPerWh * systemSize.capacity * 1000;

      return totalInvestment;
    }
  }

  /**
   * Calculate annual operating costs including real business expenses
   *
   * Now includes:
   * - Personnel costs (operations, management, technical)
   * - Office costs (rent, expenses)
   * - Maintenance costs (regular, preventive)
   * - Insurance costs (equipment, liability, property)
   * - Other costs (licenses, regulatory, training, utilities)
   * - Land lease (if applicable)
   *
   * @param input - Project input with operatingCosts
   * @param initialInvestment - Initial investment (¥) for fallback
   * @returns Annual OPEX (¥/year)
   */
  calculateAnnualOpex(input: ProjectInput, initialInvestment: number): number {
    // If operatingCosts are provided, use them
    if (input.operatingCosts && Object.keys(input.operatingCosts).length > 0) {
      const oc = input.operatingCosts;

      // Sum all operating costs
      return (
        oc.operationsStaffCost +
        oc.managementCost +
        oc.technicalSupportCost +
        oc.officeRent +
        oc.officeExpenses +
        oc.regularMaintenanceCost +
        oc.preventiveMaintenanceCost +
        oc.equipmentInsurance +
        oc.liabilityInsurance +
        oc.propertyInsurance +
        oc.licenseFee +
        oc.regulatoryFee +
        oc.trainingCost +
        oc.utilitiesCost +
        oc.landLeaseCost
      );
    }

    // Fallback: 2% of initial investment (old method)
    return initialInvestment * 0.02;
  }

  /**
   * Calculate annual loan payment (equal principal and interest / 等额本息)
   *
   * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
   * Where:
   *   M = monthly payment
   *   P = principal (loan amount)
   *   r = monthly interest rate
   *   n = number of months
   *
   * @param principal - Loan amount (¥)
   * @param annualRate - Annual interest rate (e.g., 0.045 for 4.5%)
   * @param years - Loan term in years
   * @returns Annual loan payment (¥/year)
   */
  calculateAnnualLoanPayment(
    principal: number,
    annualRate: number,
    years: number
  ): number {
    if (principal <= 0 || annualRate <= 0 || years <= 0) {
      return 0;
    }

    const monthlyRate = annualRate / 12;
    const numberOfMonths = years * 12;

    // Monthly payment formula
    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) /
      (Math.pow(1 + monthlyRate, numberOfMonths) - 1);

    // Convert to annual payment
    return monthlyPayment * 12;
  }

  /**
   * Calculate taxes for a given year
   *
   * China tax system:
   * 1. 增值税 (VAT): 6% for modern services (storage operation)
   * 2. 城建税及教育费附加: 12% of VAT
   * 3. 企业所得税 (Corporate Income Tax): 25% of taxable profit
   *
   * @param input - Project input with tax rates
   * @param revenue - Annual revenue before tax
   * @param costs - Annual costs (OPEX + financing,不含税)
   * @returns Total taxes for the year
   */
  calculateTaxes(
    input: ProjectInput,
    revenue: number,
    costs: number
  ): number {
    if (!input.operatingCosts) {
      // Default: no taxes if operating costs not specified
      return 0;
    }

    const oc = input.operatingCosts;

    // 1. 增值税
    const vat = revenue * oc.vatRate;

    // 2. 城建税及教育费附加
    const surtax = vat * oc.surtaxRate;

    // 3. 企业所得税
    // Taxable profit = Revenue - VAT - Costs - Surtax
    // Note: VAT is passed through to consumers in some cases, but for storage
    // operators, it's often a cost. Assuming VAT is fully deductible here.
    const taxableProfit = Math.max(0, revenue - costs - vat - surtax);
    const corporateTax = taxableProfit * oc.corporateTaxRate;

    // Total taxes
    return vat + surtax + corporateTax;
  }

  /**
   * Calculate yearly costs breakdown including taxes
   *
   * @param input - Project input
   * @param initialInvestment - Initial investment (¥)
   * @param year - Year number (0 = first year, investment year)
   * @param revenue - Annual revenue for this year
   * @returns Yearly costs breakdown
   */
  calculateYearlyCosts(
    input: ProjectInput,
    initialInvestment: number,
    year: number
  ): YearlyCosts {
    // Initial investment only in year 0
    const initialInvestmentCost = year === 0 ? initialInvestment : 0;

    // Annual OPEX
    const annualOpex = this.calculateAnnualOpex(input, initialInvestment);

    // Financing cost
    let financing = 0;
    if (input.financing && year > 0 && year <= (input.financing.term ?? 0)) {
      const loanAmount = initialInvestment * (input.financing.loanRatio ?? 0);
      financing = this.calculateAnnualLoanPayment(
        loanAmount,
        input.financing.interestRate ?? 0,
        input.financing.term ?? 0
      );
    }

    const total = initialInvestmentCost + annualOpex + financing;

    return {
      initialInvestment: initialInvestmentCost,
      annualOpex,
      financing,
      total,
    };
  }

  /**
   * Calculate complete cash flows for project lifetime
   *
   * @param input - Project input
   * @param province - Province data
   * @param years - Project lifetime (default: 10)
   * @returns Cash flow result
   */
  calculateCashFlows(
    input: ProjectInput,
    province: ProvinceData,
    years: number = 10
  ): CashFlowResult {
    // Calculate initial investment
    const initialInvestment = this.calculateInitialInvestment(input);

    // Handle capacity and power (for new schema)
    // systemSize.capacity is already in kWh
    // systemSize.power is already in kW (if provided)
    // If duration is provided, calculate power from capacity and duration
    const capacityKwh = input.systemSize.capacity;
    let powerKw: number;
    if (input.systemSize.duration && input.systemSize.duration > 0) {
      powerKw = capacityKwh / input.systemSize.duration;
    } else if (input.systemSize.power && input.systemSize.power > 0) {
      powerKw = input.systemSize.power;
    } else {
      throw new Error('Either systemSize.duration or systemSize.power must be provided');
    }

    // Check if using new schema (depthOfDischarge) or old schema (dod)
    const dod = 'depthOfDischarge' in input.operatingParams
      ? input.operatingParams.depthOfDischarge
      : (input.operatingParams as any).dod;

    // Calculate revenue for all years
    const revenueResult = this.revenueCalculator.calculateLifetimeRevenue(
      province,
      capacityKwh,
      powerKw,
      input.operatingParams.systemEfficiency,
      dod,
      input.operatingParams.cyclesPerDay,
      input.operatingParams.degradationRate,
      years
    );

    // Calculate cash flows for each year
    const yearlyCashFlows: YearlyCashFlow[] = [];
    const annualCashFlows: number[] = [];

    // Year 0: Investment only (negative cash flow)
    const investmentCost = this.calculateYearlyCosts(input, initialInvestment, 0);
    yearlyCashFlows.push({
      revenue: 0, // No revenue in year 0
      costs: investmentCost,
      netCashFlow: -investmentCost.initialInvestment, // Only investment, no OPEX
      cumulativeCashFlow: -investmentCost.initialInvestment,
    });
    annualCashFlows.push(-investmentCost.initialInvestment);

    let cumulativeCashFlow = -investmentCost.initialInvestment;
    let totalRevenue = 0;
    let totalOpex = 0;
    let totalFinancing = 0;

    // Years 1+: Operating years (revenue - costs)
    for (let year = 1; year < years; year++) {
      const revenue = revenueResult.annualRevenues[year - 1]; // Fixed: year 1 maps to annualRevenues[0]
      const costs = this.calculateYearlyCosts(input, initialInvestment, year);
      const netCashFlow = revenue - costs.total;

      cumulativeCashFlow += netCashFlow;

      annualCashFlows.push(netCashFlow);

      yearlyCashFlows.push({
        revenue,
        costs,
        netCashFlow,
        cumulativeCashFlow,
      });

      // Accumulate totals
      totalRevenue += revenue;
      totalOpex += costs.annualOpex;
      totalFinancing += costs.financing;
    }

    // Calculate payback period (when cumulative cash flow becomes positive)
    let paybackPeriod = -1; // -1 means never pays back
    for (let year = 1; year < yearlyCashFlows.length; year++) {
      if (yearlyCashFlows[year].cumulativeCashFlow > 0) {
        // Linear interpolation for more precise payback
        const prevYear = yearlyCashFlows[year - 1];
        const currYear = yearlyCashFlows[year];

        // Fraction of year needed to reach break-even
        const cashFlowIncrease = currYear.cumulativeCashFlow - prevYear.cumulativeCashFlow;
        if (cashFlowIncrease > 0) {
          const fraction = Math.abs(prevYear.cumulativeCashFlow) / cashFlowIncrease;
          paybackPeriod = (year - 1) + fraction;
        } else {
          paybackPeriod = year;
        }
        break;
      }
    }

    return {
      yearlyCashFlows,
      annualCashFlows,
      totalInvestment: initialInvestment,
      totalRevenue,
      totalOpex,
      totalFinancing,
      paybackPeriod,
    };
  }

  /**
   * Calculate simple annual cash flow array (for IRR/NPV calculation)
   *
   * This is a convenience method that returns just the cash flow array
   * suitable for IRR/NPV calculations.
   *
   * @param input - Project input
   * @param province - Province data
   * @param years - Project lifetime (default: 10)
   * @returns Annual cash flow array
   */
  calculateAnnualCashFlows(
    input: ProjectInput,
    province: ProvinceData,
    years: number = 10
  ): number[] {
    const result = this.calculateCashFlows(input, province, years);
    return result.annualCashFlows;
  }
}

// Singleton instance
export const cashFlowCalculator = new CashFlowCalculator();
