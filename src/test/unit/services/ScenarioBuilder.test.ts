/**
 * Tests for ScenarioBuilder service
 */

import { describe, it, expect, vi } from 'vitest';
import { ScenarioBuilder } from '../../../domain/services/ScenarioBuilder';
import type { ProjectInput } from '../../../domain/schemas/ProjectSchema';

// Mock the calculationEngine
vi.mock('../../../domain/services/CalculationEngine', () => ({
  calculationEngine: {
    calculateProject: vi.fn().mockResolvedValue({
      irr: 12.5,
      npv: 500000,
      paybackPeriod: 5.2,
      annualCashFlows: Array.from({ length: 10 }, (_, i) => 100000 + i * 10000),
      revenueBreakdown: {
        peakValleyArbitrage: 150000,
        capacityCompensation: 30000,
        demandResponse: 10000,
        auxiliaryServices: 5000,
      },
      costBreakdown: {
        initialInvestment: 2000000,
        annualOpeex: 50000,
        annualFinancing: 80000,
      },
      totalInvestment: 2000000,
      levelizedCost: 0.45,
      capacityFactor: 0.72,
      calculatedAt: new Date(),
      calculationVersion: '1.0.0',
      validation: { valid: true, issues: [] },
      metrics: { irr: 12.5, npv: 500000, roi: 0.15, lcoc: 0.45, profitMargin: 0.25 },
    }),
  },
}));

function createBaseInput(): ProjectInput {
  return {
    province: 'guangdong',
    systemSize: { capacity: 2.0, duration: 2 },
    costs: {
      batteryCostPerKwh: 1200,
      pcsCostPerKw: 300,
      emsCost: 100000,
      installationCostPerKw: 150,
      gridConnectionCost: 200000,
      landCost: 0,
      developmentCost: 150000,
      permittingCost: 50000,
      contingencyPercent: 0.05,
    },
    operatingParams: {
      systemEfficiency: 0.88,
      depthOfDischarge: 0.9,
      cyclesPerDay: 1.5,
      degradationRate: 0.02,
      availabilityPercent: 0.97,
    },
  };
}

describe('ScenarioBuilder', () => {
  const builder = new ScenarioBuilder();

  describe('createPresetScenario', () => {
    it('should create an optimistic scenario', () => {
      const scenario = builder.createPresetScenario('optimistic', createBaseInput());

      expect(scenario.type).toBe('optimistic');
      expect(scenario.name).toContain('乐观');
      expect(scenario.nameEn).toBe('Optimistic');
      expect(scenario.modifications.costs?.batteryCostPerKwh).toBeLessThan(1200);
    });

    it('should create a pessimistic scenario', () => {
      const scenario = builder.createPresetScenario('pessimistic', createBaseInput());

      expect(scenario.type).toBe('pessimistic');
      expect(scenario.name).toContain('悲观');
      expect(scenario.modifications.costs?.batteryCostPerKwh).toBeGreaterThan(1200);
    });

    it('should create a base scenario with no modifications', () => {
      const scenario = builder.createPresetScenario('base', createBaseInput());

      expect(scenario.type).toBe('base');
      expect(scenario.modifications).toEqual({});
    });
  });

  describe('createCustomScenario', () => {
    it('should create a custom scenario with given modifications', () => {
      const modifications = {
        operatingParams: { cyclesPerDay: 2.0 },
      };

      const scenario = builder.createCustomScenario(
        createBaseInput(),
        modifications,
        'High Cycle Test'
      );

      expect(scenario.type).toBe('custom');
      expect(scenario.name).toBe('High Cycle Test');
      expect(scenario.modifications).toEqual(modifications);
    });
  });

  describe('calculateScenario', () => {
    it('should calculate and populate scenario results', async () => {
      const scenario = builder.createPresetScenario('optimistic', createBaseInput());
      const result = await builder.calculateScenario(scenario, createBaseInput());

      expect(result.result).toBeDefined();
      expect(result.result.irr).toBe(12.5);
      expect(result.result.npv).toBe(500000);
      expect(result.result.revenue.total).toBe(195000);
    });
  });

  describe('saveScenario', () => {
    it('should add a new scenario', () => {
      const scenario = builder.createPresetScenario('optimistic', createBaseInput());
      const saved = builder.saveScenario(scenario, []);

      expect(saved).toHaveLength(1);
      expect(saved[0].id).toBe(scenario.id);
    });

    it('should update an existing scenario', () => {
      const scenario = builder.createPresetScenario('optimistic', createBaseInput());
      const saved = builder.saveScenario(scenario, []);
      const updated = { ...scenario, name: 'Updated' };
      const resaved = builder.saveScenario(updated, saved);

      expect(resaved).toHaveLength(1);
      expect(resaved[0].name).toBe('Updated');
    });

    it('should limit to 5 scenarios', () => {
      const base = createBaseInput();
      let scenarios: any[] = [];

      for (let i = 0; i < 6; i++) {
        const s = builder.createCustomScenario(base, {}, `Scenario ${i}`);
        scenarios = builder.saveScenario(s, scenarios);
      }

      expect(scenarios.length).toBeLessThanOrEqual(5);
    });
  });

  describe('deleteScenario', () => {
    it('should remove a scenario by id', () => {
      const scenario = builder.createPresetScenario('optimistic', createBaseInput());
      const saved = builder.saveScenario(scenario, []);
      const remaining = builder.deleteScenario(scenario.id, saved);

      expect(remaining).toHaveLength(0);
    });
  });

  describe('listScenarios', () => {
    it('should return all saved scenarios', () => {
      const s1 = builder.createPresetScenario('optimistic', createBaseInput());
      const s2 = builder.createPresetScenario('pessimistic', createBaseInput());
      const saved = builder.saveScenario(s1, []);
      const all = builder.saveScenario(s2, saved);
      const listed = builder.listScenarios(all);

      expect(listed).toHaveLength(2);
    });
  });

  describe('getRadarChartData', () => {
    it('should generate normalized radar chart data', () => {
      const comparison = {
        baseScenario: {
          id: 'base',
          name: 'Base',
          result: {
            irr: 10,
            npv: 400000,
            roi: 0.12,
            revenue: { total: 150000 },
            paybackPeriod: 6,
          },
        },
        scenarios: [
          {
            id: 'optimistic',
            name: 'Optimistic',
            result: {
              irr: 15,
              npv: 600000,
              roi: 0.18,
              revenue: { total: 200000 },
              paybackPeriod: 4,
            },
          },
          {
            id: 'pessimistic',
            name: 'Pessimistic',
            result: {
              irr: 7,
              npv: 200000,
              roi: 0.08,
              revenue: { total: 100000 },
              paybackPeriod: 8,
            },
          },
        ],
        irrRange: { min: 7, max: 15, range: 8 },
        npvRange: { min: 200000, max: 600000, range: 400000 },
        bestIRR: {} as any,
        worstIRR: {} as any,
        bestNPV: {} as any,
        worstNPV: {} as any,
      };

      const data = builder.getRadarChartData(comparison as any);

      expect(data.indicators).toHaveLength(5);
      expect(data.scenarios).toHaveLength(2);
      // Optimistic IRR should be highest (100%)
      expect(data.scenarios[0].data[0]).toBe(100);
      // Pessimistic IRR should be lower
      expect(data.scenarios[1].data[0]).toBeLessThan(100);
    });
  });
});
