/**
 * Project Repository
 *
 * Handles all project-related database operations
 */

import { BaseRepository } from './BaseRepository';
import { supabase, createRealtimeSubscription } from '../lib/supabase';
import { Database } from '../lib/supabase-schema';
import { ProjectInput } from '../domain/schemas/ProjectSchema';
import { EngineResult } from '../domain/services/CalculationEngine';

export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

/**
 * Extended project data with calculation results
 */
export interface ProjectWithCalculations extends ProjectRow {
  calculations?: Database['public']['Tables']['calculations']['Row'][];
  latest_calculation?: Database['public']['Tables']['calculations']['Row'];
}

/**
 * Project repository
 */
export class ProjectRepository extends BaseRepository<'projects'> {
  constructor() {
    super('projects');
  }

  /**
   * Find projects by user ID
   */
  async findByUserId(userId: string, options?: {
    includeDemo?: boolean;
    limit?: number;
    offset?: number;
  }) {
    if (!supabase) {
      throw new Error('Database not available');
    }

    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);

    if (!options?.includeDemo) {
      query = query.eq('is_demo', false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    query = query.order('updated_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Find project with calculations
   */
  async findWithCalculations(projectId: string): Promise<ProjectWithCalculations | null> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        calculations(
          id,
          created_at,
          input_data,
          result_data
        )
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Create project from input and calculation result
   */
  async createFromCalculation(
    userId: string,
    name: string,
    input: ProjectInput,
    result: EngineResult,
    options?: {
      description?: string;
      isDemo?: boolean;
    }
  ): Promise<ProjectRow> {
    const projectData: ProjectInsert = {
      user_id: userId,
      name,
      description: options?.description,
      province: input.province,
      capacity: input.capacity,
      investment: input.investment,
      electricity_price: input.electricityPrice,
      peak_price: input.peakPrice,
      valley_price: input.valleyPrice,
      discharge_cycles_per_day: input.dischargeCyclesPerDay,
      daily_charge_hours: input.dailyChargeHours,
      system_efficiency: input.systemEfficiency,
      battery_unit_cost: input.batteryUnitCost,
      pcs_unit_cost: input.pcsUnitCost,
      bms_unit_cost: input.bmsUnitCost,
      ems_unit_cost: input.emsUnitCost,
      installation_cost_per_watt: input.installationCostPerWatt,
      annual_om_cost_percent: input.annualOMCostPercent,
      electricity_price_increase_rate: input.electricityPriceIncreaseRate,
      battery_annual_degradation_rate: input.batteryAnnualDegradationRate,
      calculated_irr: result.financialMetrics.irr,
      calculated_npv: result.financialMetrics.npv,
      calculated_payback_period: result.financialMetrics.paybackPeriod,
      calculated_lcoe: result.financialMetrics.lcoe,
      is_demo: options?.isDemo ?? false,
    };

    return this.create(projectData);
  }

  /**
   * Update project calculations
   */
  async updateCalculations(
    projectId: string,
    result: EngineResult
  ): Promise<ProjectRow> {
    const updateData: ProjectUpdate = {
      calculated_irr: result.financialMetrics.irr,
      calculated_npv: result.financialMetrics.npv,
      calculated_payback_period: result.financialMetrics.paybackPeriod,
      calculated_lcoe: result.financialMetrics.lcoe,
      last_calculated_at: new Date().toISOString(),
    };

    return this.update(projectId, updateData);
  }

  /**
   * Update benchmark data
   */
  async updateBenchmark(
    projectId: string,
    benchmarkData: {
      irr?: number;
      npv?: number;
      paybackPeriod?: number;
    }
  ): Promise<ProjectRow> {
    const updateData: ProjectUpdate = {
      benchmark_irr: benchmarkData.irr,
      benchmark_npv: benchmarkData.npv,
      benchmark_payback_period: benchmarkData.paybackPeriod,
    };

    return this.update(projectId, updateData);
  }

  /**
   * Clone project
   */
  async cloneProject(projectId: string, newName: string): Promise<ProjectRow> {
    const original = await this.findById(projectId);
    if (!original) {
      throw new Error('Project not found');
    }

    const cloneData: ProjectInsert = {
      user_id: original.user_id,
      name: newName,
      description: original.description,
      province: original.province,
      capacity: original.capacity,
      investment: original.investment,
      electricity_price: original.electricity_price,
      peak_price: original.peak_price,
      valley_price: original.valley_price,
      discharge_cycles_per_day: original.discharge_cycles_per_day,
      daily_charge_hours: original.daily_charge_hours,
      system_efficiency: original.system_efficiency,
      battery_unit_cost: original.battery_unit_cost,
      pcs_unit_cost: original.pcs_unit_cost,
      bms_unit_cost: original.bms_unit_cost,
      ems_unit_cost: original.ems_unit_cost,
      installation_cost_per_watt: original.installation_cost_per_watt,
      annual_om_cost_percent: original.annual_om_cost_percent,
      electricity_price_increase_rate: original.electricity_price_increase_rate,
      battery_annual_degradation_rate: original.battery_annual_degradation_rate,
      calculated_irr: original.calculated_irr,
      calculated_npv: original.calculated_npv,
      calculated_payback_period: original.calculated_payback_period,
      calculated_lcoe: original.calculated_lcoe,
      is_demo: original.is_demo,
    };

    return this.create(cloneData);
  }

  /**
   * Get project statistics
   */
  async getStatistics(userId: string): Promise<{
    totalProjects: number;
    totalInvestment: number;
    totalCapacity: number;
    averageIRR: number;
    averageNPV: number;
    averagePaybackPeriod: number;
  }> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_demo', false);

    if (error) {
      throw error;
    }

    const projects = data || [];

    return {
      totalProjects: projects.length,
      totalInvestment: projects.reduce((sum, p) => sum + p.investment, 0),
      totalCapacity: projects.reduce((sum, p) => sum + p.capacity, 0),
      averageIRR: projects.length > 0
        ? projects.reduce((sum, p) => sum + p.calculated_irr, 0) / projects.length
        : 0,
      averageNPV: projects.length > 0
        ? projects.reduce((sum, p) => sum + p.calculated_npv, 0) / projects.length
        : 0,
      averagePaybackPeriod: projects.length > 0
        ? projects.reduce((sum, p) => sum + p.calculated_payback_period, 0) / projects.length
        : 0,
    };
  }

  /**
   * Search projects
   */
  async search(
    userId: string,
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<ProjectRow[]> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const searchQuery = supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_demo', false)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (options?.limit) {
      searchQuery.limit(options.limit);
    }

    if (options?.offset) {
      searchQuery.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await searchQuery;

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Subscribe to project changes
   */
  subscribeToProjects(
    userId: string,
    callbacks: {
      onInsert?: (project: ProjectRow) => void;
      onUpdate?: (project: ProjectRow) => void;
      onDelete?: (project: ProjectRow) => void;
    }
  ) {
    const subscription = createRealtimeSubscription('projects');

    if (callbacks.onInsert) {
      subscription.onInsert((payload) => {
        if (payload.new.user_id === userId) {
          callbacks.onInsert?.(payload.new as ProjectRow);
        }
      });
    }

    if (callbacks.onUpdate) {
      subscription.onUpdate((payload) => {
        if (payload.new.user_id === userId) {
          callbacks.onUpdate?.(payload.new as ProjectRow);
        }
      });
    }

    if (callbacks.onDelete) {
      subscription.onDelete((payload) => {
        if (payload.old.user_id === userId) {
          callbacks.onDelete?.(payload.old as ProjectRow);
        }
      });
    }

    subscription.subscribe();

    return subscription;
  }
}

/**
 * Global project repository instance
 */
export const projectRepository = new ProjectRepository();