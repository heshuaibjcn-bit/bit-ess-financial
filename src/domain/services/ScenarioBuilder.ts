/**
 * ScenarioBuilder - Multi-scenario comparison and analysis
 *
 * Creates and compares different project scenarios for what-if analysis.
 */

import type { ProjectInput } from '../schemas/ProjectSchema';
import { calculationEngine } from './CalculationEngine';

/**
 * Scenario type
 */
export type ScenarioType = 'optimistic' | 'base' | 'pessimistic' | 'custom';

/**
 * Scenario definition
 */
export interface Scenario {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  type: ScenarioType;

  // Modified inputs relative to base
  modifications: Partial<ProjectInput>;

  // Calculation result
  result: ScenarioResult;

  // Metadata
  createdAt: Date;
}

/**
 * Scenario calculation result
 */
export interface ScenarioResult {
  scenarioId: string;

  // Key metrics
  irr: number;
  irrChange: number; // Percentage points change from base
  npv: number;
  npvChange: number; // ¥ change from base

  // Revenue breakdown
  revenue: {
    total: number;
    peakValleyArbitrage: number;
    capacityCompensation: number;
    demandResponse: number;
    auxiliaryServices: number;
  };

  // Metrics
  paybackPeriod: number;
  totalInvestment: number;
  roi: number;
}

/**
 * Scenario comparison result
 */
export interface ScenarioComparison {
  baseScenario: Scenario;
  scenarios: Scenario[];

  // Comparison summary
  irrRange: {
    min: number;
    max: number;
    range: number;
  };

  npvRange: {
    min: number;
    max: number;
    range: number;
  };

  // Best and worst scenarios
  bestIRR: Scenario;
  worstIRR: Scenario;
  bestNPV: Scenario;
  worstNPV: Scenario;
}

/**
 * Scenario builder class
 */
export class ScenarioBuilder {
  /**
   * Create preset scenario
   */
  createPresetScenario(type: ScenarioType, baseInput: ProjectInput): Scenario {
    const modifications = this.getPresetModifications(type, baseInput);
    const id = this.generateScenarioId(type, baseInput);

    return {
      id,
      name: this.getPresetName(type),
      nameEn: this.getPresetNameEn(type),
      description: this.getPresetDescription(type),
      type,
      modifications,
      result: {} as ScenarioResult, // Will be calculated
      createdAt: new Date(),
    };
  }

  /**
   * Create custom scenario
   */
  createCustomScenario(
    baseInput: ProjectInput,
    modifications: Partial<ProjectInput>,
    name: string,
    description?: string
  ): Scenario {
    const id = this.generateScenarioId('custom', baseInput, Date.now());

    return {
      id,
      name,
      nameEn: name,
      description,
      type: 'custom',
      modifications,
      result: {} as ScenarioResult,
      createdAt: new Date(),
    };
  }

  /**
   * Calculate scenario result
   */
  async calculateScenario(
    scenario: Scenario,
    baseInput: ProjectInput,
    baseResult?: any
  ): Promise<Scenario> {
    // Apply modifications to base input
    const scenarioInput = this.applyModifications(baseInput, scenario.modifications);

    // Calculate
    const result = await calculationEngine.calculateProject(scenarioInput, {});

    // Get base result for comparison
    const baseIRR = baseResult?.irr || 0;
    const baseNPV = baseResult?.npv || 0;

    // Extract revenue breakdown
    const revenue = {
      total: result.revenueBreakdown.peakValleyArbitrage +
              result.revenueBreakdown.capacityCompensation +
              result.revenueBreakdown.demandResponse +
              result.revenueBreakdown.auxiliaryServices,
      peakValleyArbitrage: result.revenueBreakdown.peakValleyArbitrage,
      capacityCompensation: result.revenueBreakdown.capacityCompensation,
      demandResponse: result.revenueBreakdown.demandResponse,
      auxiliaryServices: result.revenueBreakdown.auxiliaryServices,
    };

    const scenarioResult: ScenarioResult = {
      scenarioId: scenario.id,
      irr: result.irr || 0,
      irrChange: (result.irr || 0) - baseIRR,
      npv: result.npv,
      npvChange: result.npv - baseNPV,
      revenue,
      paybackPeriod: result.paybackPeriod,
      totalInvestment: result.totalInvestment,
      roi: result.metrics.roi,
    };

    return {
      ...scenario,
      result: scenarioResult,
    };
  }

  /**
   * Compare scenarios
   */
  async compareScenarios(
    baseInput: ProjectInput,
    scenarios: Scenario[]
  ): Promise<ScenarioComparison> {
    // Calculate base scenario
    const baseScenario = this.createPresetScenario('base', baseInput);
    const calculatedBase = await this.calculateScenario(baseScenario, baseInput);
    scenarios = [calculatedBase, ...scenarios];

    // Calculate all scenarios
    const calculatedScenarios = await Promise.all(
      scenarios.map((s) => this.calculateScenario(s, baseInput, calculatedBase.result))
    );

    // Find best and worst
    const sortedByIRR = [...calculatedScenarios].sort((a, b) => b.result.irr - a.result.irr);
    const sortedByNPV = [...calculatedScenarios].sort((a, b) => b.result.npv - a.result.npv);

    const irrValues = calculatedScenarios.map(s => s.result.irr);
    const npvValues = calculatedScenarios.map(s => s.result.npv);

    return {
      baseScenario: calculatedScenarios[0],
      scenarios: calculatedScenarios.slice(1),
      irrRange: {
        min: Math.min(...irrValues),
        max: Math.max(...irrValues),
        range: Math.max(...irrValues) - Math.min(...irrValues),
      },
      npvRange: {
        min: Math.min(...npvValues),
        max: Math.max(...npvValues),
        range: Math.max(...npvValues) - Math.min(...npvValues),
      },
      bestIRR: sortedByIRR[0],
      worstIRR: sortedByIRR[sortedByIRR.length - 1],
      bestNPV: sortedByNPV[0],
      worstNPV: sortedByNPV[sortedByNPV.length - 1],
    };
  }

  /**
   * Get preset modifications
   */
  private getPresetModifications(type: ScenarioType, input: ProjectInput): Partial<ProjectInput> {
    switch (type) {
      case 'optimistic':
        return {
          costs: {
            ...input.costs,
            batteryCostPerKwh: input.costs.batteryCostPerKwh * 0.8, // -20% battery cost
          },
          operatingParams: {
            ...input.operatingParams,
            systemEfficiency: Math.min(1, input.operatingParams.systemEfficiency * 1.05), // +5% efficiency
            cyclesPerDay: Math.min(4, input.operatingParams.cyclesPerDay * 1.2), // +20% cycles
          },
        };

      case 'pessimistic':
        return {
          costs: {
            ...input.costs,
            batteryCostPerKwh: input.costs.batteryCostPerKwh * 1.2, // +20% battery cost
          },
          operatingParams: {
            ...input.operatingParams,
            systemEfficiency: input.operatingParams.systemEfficiency * 0.95, // -5% efficiency
            cyclesPerDay: Math.max(1, input.operatingParams.cyclesPerDay * 0.8), // -20% cycles
          },
        };

      case 'base':
      default:
        return {};
    }
  }

  /**
   * Get preset scenario name
   */
  private getPresetName(type: ScenarioType): string {
    const names = {
      optimistic: '乐观情景',
      base: '基准情景',
      pessimistic: '悲观情景',
      custom: '自定义情景',
    };

    return names[type] || type;
  }

  /**
   * Get preset scenario English name
   */
  private getPresetNameEn(type: ScenarioType): string {
    const names = {
      optimistic: 'Optimistic',
      base: 'Base',
      pessimistic: 'Pessimistic',
      custom: 'Custom',
    };

    return names[type] || type;
  }

  /**
   * Get preset scenario description
   */
  private getPresetDescription(type: ScenarioType): string {
    const descriptions = {
      optimistic: '电池成本降低20%，系统效率提升5%，日循环次数增加20%',
      base: '基于当前输入参数的基准情景',
      pessimistic: '电池成本增加20%，系统效率降低5%，日循环次数减少20%',
      custom: '自定义参数情景',
    };

    return descriptions[type] || '';
  }

  /**
   * Generate scenario ID
   */
  private generateScenarioId(type: ScenarioType, input: ProjectInput, suffix?: number): string {
    const timestamp = suffix || Date.now();
    const hash = JSON.stringify(input).length; // Simple hash
    return `${type}-${hash}-${timestamp}`;
  }

  /**
   * Apply modifications to base input
   */
  private applyModifications(
    base: ProjectInput,
    modifications: Partial<ProjectInput>
  ): ProjectInput {
    return {
      ...base,
      ...modifications,
      // Deep merge for nested objects
      systemSize: {
        ...base.systemSize,
        ...(modifications.systemSize || {}),
      },
      costs: {
        ...base.costs,
        ...(modifications.costs || {}),
      },
      operatingParams: {
        ...base.operatingParams,
        ...(modifications.operatingParams || {}),
      },
      financing: {
        ...base.financing,
        ...(modifications.financing || {}),
      },
    };
  }

  /**
   * Save scenario (max 5 custom scenarios)
   */
  saveScenario(scenario: Scenario, savedScenarios: Scenario[]): Scenario[] {
    // Check if already saved
    const existingIndex = savedScenarios.findIndex(s => s.id === scenario.id);

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...savedScenarios];
      updated[existingIndex] = scenario;
      return updated;
    }

    // Add new (max 5)
    if (savedScenarios.length >= 5) {
      // Remove oldest custom scenario
      const customScenarios = savedScenarios.filter(s => s.type === 'custom');
      if (customScenarios.length > 0) {
        const oldestCustom = customScenarios.sort((a, b) =>
          a.createdAt.getTime() - b.createdAt.getTime()
        )[0];
        return savedScenarios.filter(s => s.id !== oldestCustom.id);
      }
    }

    return [...savedScenarios, scenario];
  }

  /**
   * List all scenarios
   */
  listScenarios(savedScenarios: Scenario[]): Scenario[] {
    return savedScenarios;
  }

  /**
   * Delete scenario
   */
  deleteScenario(scenarioId: string, savedScenarios: Scenario[]): Scenario[] {
    return savedScenarios.filter(s => s.id !== scenarioId);
  }

  /**
   * Get radar chart data for scenario comparison
   */
  getRadarChartData(comparison: ScenarioComparison): {
    indicators: string[];
    scenarios: Array<{
      name: string;
      data: number[];
    }>;
  } {
    // Metrics to compare (normalized 0-100)
    const metrics = ['IRR', 'NPV', 'ROI', 'Revenue', 'Payback'];
    const indicators = ['IRR(%)', 'NPV(万元)', 'ROI(%)', '年收入(万元)', '回收期(年)'];

    // Normalize values to 0-100 scale
    const maxIRR = Math.max(...comparison.scenarios.map(s => s.result.irr));
    const maxNPV = Math.max(...comparison.scenarios.map(s => s.result.npv));
    const maxROI = Math.max(...comparison.scenarios.map(s => s.result.roi));
    const maxRevenue = Math.max(...comparison.scenarios.map(s => s.result.revenue.total / 10000));
    const maxPayback = Math.max(...comparison.scenarios.map(s => s.result.paybackPeriod));

    const scenarios = comparison.scenarios.map((scenario) => {
      const irr = scenario.result.irr;
      const npv = scenario.result.npv / 10000; // Convert to 万元
      const roi = scenario.result.roi;
      const revenue = scenario.result.revenue.total / 10000; // Convert to 万元
      const payback = scenario.result.paybackPeriod;

      return {
        name: scenario.name,
        data: [
          (irr / maxIRR) * 100,
          (npv / maxNPV) * 100,
          (roi / maxROI) * 100,
          (revenue / maxRevenue) * 100,
          payback === -1 ? 0 : Math.max(0, 100 - (payback / maxPayback) * 100),
        ],
      };
    });

    return { indicators, scenarios };
  }
}

// Singleton instance
export const scenarioBuilder = new ScenarioBuilder();
