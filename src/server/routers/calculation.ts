/**
 * Calculation Router
 *
 * Type-safe API endpoints for calculation operations
 */

import { z } from 'zod';
import { t, protectedProcedure } from '../trpc';
import { CalculationEngine } from '../../domain/services/CalculationEngine';
import { ProjectInput } from '../../domain/schemas/ProjectSchema';
import { BenchmarkEngine } from '../../domain/services/BenchmarkEngine';

export const calculationRouter = t.router({
  /**
   * Calculate project metrics
   */
  calculate: protectedProcedure
    .input(z.custom<ProjectInput>())
    .mutation(async ({ input }) => {
      const engine = new CalculationEngine();
      const result = engine.calculate(input);

      return result;
    }),

  /**
   * Calculate with benchmark comparison
   */
  calculateWithBenchmark: protectedProcedure
    .input(z.custom<ProjectInput>())
    .mutation(async ({ input }) => {
      // Calculate project metrics
      const calcEngine = new CalculationEngine();
      const result = calcEngine.calculate(input);

      // Get benchmark comparison
      const benchmarkEngine = new BenchmarkEngine();
      const comparison = await benchmarkEngine.compare(input, result);

      return {
        result,
        comparison,
      };
    }),

  /**
   * Sensitivity analysis
   */
  sensitivityAnalysis: protectedProcedure
    .input(z.object({
      input: z.custom<ProjectInput>(),
      parameter: z.string(),
      range: z.object({
        min: z.number(),
        max: z.number(),
        steps: z.number(),
      }),
    }))
    .mutation(async ({ input }) => {
      const engine = new CalculationEngine();
      const results = [];

      const stepSize = (input.range.max - input.range.min) / input.range.steps;

      for (let i = 0; i <= input.range.steps; i++) {
        const value = input.range.min + stepSize * i;

        // Clone input and update parameter
        const modifiedInput = {
          ...input.input,
          [input.parameter]: value,
        };

        const result = engine.calculate(modifiedInput);

        results.push({
          parameter: input.parameter,
          value,
          irr: result.financialMetrics.irr,
          npv: result.financialMetrics.npv,
        });
      }

      return results;
    }),

  /**
   * Multi-parameter sensitivity
   */
  multiParameterSensitivity: protectedProcedure
    .input(z.object({
      input: z.custom<ProjectInput>(),
      parameters: z.array(z.object({
        name: z.string(),
        min: z.number(),
        max: z.number(),
        current: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      const engine = new CalculationEngine();
      const results = [];

      // Calculate for each parameter
      for (const param of input.parameters) {
        const testInput = {
          ...input.input,
          [param.name]: param.max,
        };

        const result = engine.calculate(testInput);

        results.push({
          indicator: param.name,
          current: param.current,
          min: param.min,
          max: param.max,
          irrAtMax: result.financialMetrics.irr,
          npvAtMax: result.financialMetrics.npv,
        });
      }

      return results;
    }),

  /**
   * Scenario analysis
   */
  scenarioAnalysis: protectedProcedure
    .input(z.object({
      scenarios: z.array(z.object({
        name: z.string(),
        input: z.custom<ProjectInput>(),
      })),
    }))
    .mutation(async ({ input }) => {
      const engine = new CalculationEngine();
      const results = [];

      for (const scenario of input.scenarios) {
        const result = engine.calculate(scenario.input);

        results.push({
          name: scenario.name,
          irr: result.financialMetrics.irr,
          npv: result.financialMetrics.npv,
          paybackPeriod: result.financialMetrics.paybackPeriod,
          lcoe: result.financialMetrics.lcoe,
        });
      }

      return results;
    }),

  /**
   * Get available benchmarks
   */
  benchmarks: protectedProcedure
    .query(async () => {
      const benchmarkEngine = new BenchmarkEngine();

      // Get all available benchmarks
      const benchmarks = await benchmarkEngine.getAllBenchmarks();

      return benchmarks;
    }),

  /**
   * Compare with specific benchmark
   */
  compareBenchmark: protectedProcedure
    .input(z.object({
      input: z.custom<ProjectInput>(),
      result: z.any(), // EngineResult
      benchmarkId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const benchmarkEngine = new BenchmarkEngine();

      const comparison = await benchmarkEngine.compareById(
        input.input,
        input.result,
        input.benchmarkId
      );

      return comparison;
    }),
});
