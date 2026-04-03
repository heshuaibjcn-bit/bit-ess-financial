/**
 * REGRESSION TEST: Cash flow revenue indexing fix
 *
 * IRON RULE: This test guards against a specific off-by-one indexing bug
 * that was previously fixed in CashFlowCalculator.calculateCashFlows().
 *
 * THE BUG:
 *   The original code used `annualRevenues[year]` to look up revenue for
 *   a given operating year. Because `annualRevenues` is 0-indexed (index 0
 *   holds year 1 revenue), this was wrong:
 *     - year 1 would read annualRevenues[1] (year 2's revenue) -- WRONG
 *     - year N would read annualRevenues[N] (could be undefined)     -- WRONG
 *
 * THE FIX:
 *   Use `annualRevenues[year - 1]` so that:
 *     - year 1 reads annualRevenues[0]  -- correct, first operating year
 *     - year 2 reads annualRevenues[1]  -- correct
 *     - year N reads annualRevenues[N-1] -- correct
 *
 * WHY THIS TEST EXISTS:
 *   If someone ever "simplifies" the loop and changes the indexing back,
 *   this test will immediately catch the regression. The test uses mocked
 *   revenues with distinct values per year so any index shift is detectable.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CashFlowCalculator } from '@/domain/services/CashFlowCalculator';
import type { ProvinceData } from '@/domain/schemas/ProvinceSchema';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';

// ---------------------------------------------------------------------------
// Mock RevenueCalculator to return deterministic, distinct per-year revenues
// ---------------------------------------------------------------------------
vi.mock('@/domain/services/RevenueCalculator', () => {
  return {
    RevenueCalculator: class MockRevenueCalculator {
      /**
       * Returns a RevenueResult with deliberately distinct revenues per year.
       * Each year's revenue is crafted so that a shifted index is detectable:
       *   annualRevenues[0] = 1_000_000  (year 1 revenue)
       *   annualRevenues[1] = 2_000_000  (year 2 revenue)
       *   annualRevenues[2] = 3_000_000  (year 3 revenue)
       *   annualRevenues[3] = 4_000_000  (year 4 revenue)
       *   annualRevenues[4] = 5_000_000  (year 5 revenue)
       *
       * If the bug resurfaces (using [year] instead of [year-1]),
       * year 1 would get 2M instead of 1M, immediately failing the test.
       */
      calculateLifetimeRevenue(
        _province: ProvinceData,
        _capacity: number,
        _power: number,
        _efficiency: number,
        _dod: number,
        _cyclesPerDay: number,
        _degradationRate: number,
        years: number
      ) {
        const annualRevenues: number[] = [];
        for (let i = 0; i < years; i++) {
          // Use power-of-2 values so no two years share the same revenue
          // even by coincidence.
          annualRevenues.push(Math.pow(10, i + 6)); // 10^6, 10^7, 10^8, ...
        }
        return {
          annualRevenues,
          annualBreakdown: annualRevenues.map((total) => ({
            peakValleyArbitrage: total,
            capacityCompensation: 0,
            demandResponse: 0,
            auxiliaryServices: 0,
            total,
          })),
          firstYearBreakdown: {
            peakValleyArbitrage: annualRevenues[0],
            capacityCompensation: 0,
            demandResponse: 0,
            auxiliaryServices: 0,
            total: annualRevenues[0],
          },
        };
      }
    },
  };
});

describe('CashFlowCalculator - Revenue Indexing Regression (IRON RULE)', () => {
  let calculator: CashFlowCalculator;

  // Minimal province data satisfying ProvinceData type
  const mockProvince: ProvinceData = {
    code: 'TEST',
    name: 'Test Province',
    pricing: {
      peakPrice: 1.0,
      valleyPrice: 0.3,
      peakHours: ['10:00-12:00'],
      valleyHours: ['00:00-06:00'],
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

  // Minimal project input
  const baseInput: ProjectInput = {
    province: 'guangdong',
    systemSize: {
      capacity: 1.0,  // 1 MWh = 1000 kWh
      duration: 2,    // 2 hours -> power = 500 kW
    },
    costs: {
      batteryCostPerKwh: 500,
      pcsCostPerKw: 200,
      emsCost: 50000,
      installationCostPerKw: 100,
      gridConnectionCost: 0,
      landCost: 0,
      developmentCost: 0,
      permittingCost: 0,
      contingencyPercent: 0,
    },
    operatingParams: {
      systemEfficiency: 0.88,
      depthOfDischarge: 0.9,
      cyclesPerDay: 2,
      degradationRate: 0.02,
      availabilityPercent: 0.97,
    },
  };

  beforeEach(() => {
    calculator = new CashFlowCalculator();
  });

  it('year 1 revenue must come from annualRevenues[0]', () => {
    // With the mock, annualRevenues[0] = 10^6 = 1,000,000
    const result = calculator.calculateCashFlows(baseInput, mockProvince, 5);

    // Year 0 has no revenue (investment year)
    expect(result.yearlyCashFlows[0].revenue).toBe(0);

    // Year 1 (first operating year) must use annualRevenues[0]
    expect(result.yearlyCashFlows[1].revenue).toBe(1_000_000);
  });

  it('year 2 revenue must come from annualRevenues[1]', () => {
    const result = calculator.calculateCashFlows(baseInput, mockProvince, 5);

    // Year 2 must use annualRevenues[1] = 10^7 = 10,000,000
    expect(result.yearlyCashFlows[2].revenue).toBe(10_000_000);
  });

  it('year N revenue must come from annualRevenues[N-1]', () => {
    // Test several year-to-index mappings
    const result = calculator.calculateCashFlows(baseInput, mockProvince, 5);

    // year 3 -> annualRevenues[2] = 10^8
    expect(result.yearlyCashFlows[3].revenue).toBe(100_000_000);

    // year 4 -> annualRevenues[3] = 10^9
    expect(result.yearlyCashFlows[4].revenue).toBe(1_000_000_000);
  });

  it('with multiple years, every year maps to the correct revenue', () => {
    const years = 5;
    const result = calculator.calculateCashFlows(baseInput, mockProvince, years);

    // Build the expected revenues from the mock's formula: 10^(i+6)
    const expectedRevenues: number[] = [];
    for (let i = 0; i < years; i++) {
      expectedRevenues.push(Math.pow(10, i + 6));
    }

    // Year 0 has no revenue
    expect(result.yearlyCashFlows[0].revenue).toBe(0);

    // Years 1 through (years-1) must match expectedRevenues[year-1]
    for (let year = 1; year < years; year++) {
      const expectedRevenue = expectedRevenues[year - 1];
      const actualRevenue = result.yearlyCashFlows[year].revenue;

      expect(actualRevenue).toBe(expectedRevenue);
    }
  });

  it('would fail if the bug resurfaced (annualRevenues[year] instead of [year-1])', () => {
    // This test documents what the WRONG behavior looks like.
    // If someone changes the indexing back, this test will catch it
    // because year 1 would get annualRevenues[1] = 10,000,000 instead of 1,000,000.
    const result = calculator.calculateCashFlows(baseInput, mockProvince, 5);

    // Year 1 must NOT be annualRevenues[1]
    expect(result.yearlyCashFlows[1].revenue).not.toBe(10_000_000);

    // Year 1 must NOT be annualRevenues[0] skipped (i.e., 0 or undefined)
    expect(result.yearlyCashFlows[1].revenue).not.toBe(0);
    expect(result.yearlyCashFlows[1].revenue).toBeDefined();
  });

  it('last operating year does not read out-of-bounds from annualRevenues', () => {
    // With 3 years, the loop runs for year 1 and year 2.
    // annualRevenues has indices [0, 1, 2].
    // year 2 must read annualRevenues[1], NOT annualRevenues[2] (which
    // would be valid but wrong) or annualRevenues[3] (out of bounds).
    const years = 3;
    const result = calculator.calculateCashFlows(baseInput, mockProvince, years);

    // annualRevenues = [10^6, 10^7, 10^8]
    // year 1 -> annualRevenues[0] = 10^6
    // year 2 -> annualRevenues[1] = 10^7
    expect(result.yearlyCashFlows[1].revenue).toBe(1_000_000);
    expect(result.yearlyCashFlows[2].revenue).toBe(10_000_000);
  });

  it('revenues are strictly distinct across years (no false positive overlap)', () => {
    const result = calculator.calculateCashFlows(baseInput, mockProvince, 5);

    // Collect all operating-year revenues
    const revenues: number[] = [];
    for (let year = 1; year < 5; year++) {
      revenues.push(result.yearlyCashFlows[year].revenue);
    }

    // All revenues must be unique (no duplicates from index shifting)
    const uniqueRevenues = new Set(revenues);
    expect(uniqueRevenues.size).toBe(revenues.length);
  });

  it('totalRevenue equals sum of all correctly-indexed annualRevenues', () => {
    const years = 5;
    const result = calculator.calculateCashFlows(baseInput, mockProvince, years);

    // Calculate expected total: sum of annualRevenues[0..years-2]
    // because the loop runs for year=1 to year=years-1, reading annualRevenues[year-1]
    let expectedTotal = 0;
    for (let i = 0; i < years - 1; i++) {
      expectedTotal += Math.pow(10, i + 6);
    }

    expect(result.totalRevenue).toBe(expectedTotal);
  });
});
