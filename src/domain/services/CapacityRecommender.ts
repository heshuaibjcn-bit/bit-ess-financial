/**
 * CapacityRecommender - Smart capacity recommendation service
 *
 * Analyzes:
 * - Transformer capacity constraints
 * - Load patterns
 * - Tariff spread optimization
 * - Returns 3 proposals: conservative/standard/aggressive
 */

import {
  type OwnerInfo,
  type FacilityInfo,
  type TariffDetail,
  type TechnicalProposal,
  type OptimizationTarget,
  CHARGE_STRATEGIES,
} from '../schemas/ProjectSchema';

export interface RecommendationParams {
  ownerInfo: OwnerInfo;
  facilityInfo: FacilityInfo;
  tariffDetail: TariffDetail;
}

export interface RecommendationResult {
  conservative: TechnicalProposal;
  standard: TechnicalProposal;
  aggressive: TechnicalProposal;
  recommended: 'conservative' | 'standard' | 'aggressive';
  reasoning: string;
}

/**
 * Calculate optimal capacity based on transformer capacity
 * Typical rule: Battery system should be 60-80% of transformer capacity
 */
const calculateCapacityFromTransformer = (
  transformerCapacity: number,
  ratio: 'conservative' | 'standard' | 'aggressive'
): number => {
  const ratios = {
    conservative: 0.5,
    standard: 0.65,
    aggressive: 0.8,
  };
  // Convert kVA to kW (assuming power factor ~0.9)
  const transformerKW = transformerCapacity * 0.9;
  // Calculate capacity in MWh (assuming 2-hour duration)
  return (transformerKW * ratios[ratio] * 2) / 1000;
};

/**
 * Calculate optimal power based on peak load
 * Rule: Power should be 30-50% of peak load for peak shaving
 */
const calculatePowerFromPeakLoad = (
  peakLoad: number,
  ratio: 'conservative' | 'standard' | 'aggressive'
): number => {
  const ratios = {
    conservative: 0.3,
    standard: 0.4,
    aggressive: 0.5,
  };
  return (peakLoad * ratios[ratio]) / 1000; // Convert to MW
};

/**
 * Calculate capacity based on load patterns
 */
const calculateCapacityFromLoadPattern = (
  avgMonthlyLoad: number,
  ratio: 'conservative' | 'standard' | 'aggressive'
): number => {
  // Average daily load = monthly load / 30
  const avgDailyLoad = avgMonthlyLoad / 30;
  // Target to shift 10-30% of daily load
  const percentages = {
    conservative: 0.1,
    standard: 0.2,
    aggressive: 0.3,
  };
  // Target energy to shift (kWh)
  const targetEnergy = avgDailyLoad * percentages[ratio];
  // Capacity = target energy / DOD / efficiency
  return targetEnergy / 0.9 / 0.88 / 1000; // MWh
};

/**
 * Determine optimal charge/discharge strategy based on tariff spread
 */
const determineStrategy = (
  tariffDetail: TariffDetail,
  target: OptimizationTarget
): string => {
  const spread = tariffDetail.peakPrice - tariffDetail.valleyPrice;

  // If spread is high (>0.6), arbitrage is very profitable
  if (spread > 0.6) {
    return 'arbitrage_only';
  }
  // If moderate spread, mixed strategy
  if (spread > 0.4) {
    return 'mixed';
  }
  // Low spread, focus on peak shaving
  return 'peak_shaving';
};

/**
 * Generate proposal configuration
 */
const generateProposal = (
  params: RecommendationParams,
  type: 'conservative' | 'standard' | 'aggressive'
): TechnicalProposal => {
  const { facilityInfo, tariffDetail } = params;

  // Calculate capacity from multiple factors
  const capacityByTransformer = calculateCapacityFromTransformer(
    facilityInfo.transformerCapacity,
    type
  );
  const capacityByLoad = calculateCapacityFromLoadPattern(
    facilityInfo.avgMonthlyLoad,
    type
  );
  const capacityByPeakLoad = facilityInfo.peakLoad > 0
    ? (facilityInfo.peakLoad * (type === 'conservative' ? 0.3 : type === 'standard' ? 0.4 : 0.5) * 2) / 1000
    : capacityByTransformer;

  // Use the minimum of all constraints (most conservative)
  const recommendedCapacity = Math.min(
    capacityByTransformer,
    capacityByLoad,
    capacityByPeakLoad
  );

  // Calculate power based on capacity and duration
  // Conservative: 2h, Standard: 2h, Aggressive: 1.5h
  const durations = {
    conservative: 2,
    standard: 2,
    aggressive: 1.5,
  };
  const recommendedPower = recommendedCapacity / durations[type];
  const capacityPowerRatio = durations[type];

  // Determine optimization target
  const optimizationTargets: Record<typeof type, OptimizationTarget> = {
    conservative: 'cost',
    standard: 'balanced',
    aggressive: 'revenue',
  };

  // Determine charge strategy
  const chargeStrategy = determineStrategy(
    tariffDetail,
    optimizationTargets[type]
  ) as any;

  // Estimate cycle life and throughput
  const cycleLife = 6000; // Standard lithium-ion cycle life
  const expectedThroughput = recommendedCapacity * cycleLife * 0.9; // MWh total throughput

  return {
    recommendedCapacity: Math.round(recommendedCapacity * 100) / 100,
    recommendedPower: Math.round(recommendedPower * 100) / 100,
    capacityPowerRatio: Math.round(capacityPowerRatio * 10) / 10,
    chargeStrategy,
    cycleLife,
    expectedThroughput: Math.round(expectedThroughput),
    optimizedFor: optimizationTargets[type],
  };
};

/**
 * Generate recommendation reasoning
 */
const generateReasoning = (
  params: RecommendationParams,
  result: RecommendationResult
): string => {
  const { facilityInfo, tariffDetail, ownerInfo } = params;
  const reasons: string[] = [];

  // Transformer capacity analysis
  reasons.push(
    `基于变压器容量${facilityInfo.transformerCapacity}kVA，` +
    `推荐装机容量不超过${Math.round(facilityInfo.transformerCapacity * 0.9 * 0.65)}kW（约65%）`
  );

  // Load pattern analysis
  if (facilityInfo.avgMonthlyLoad > 0) {
    reasons.push(
      `根据平均月用电量${(facilityInfo.avgMonthlyLoad / 10000).toFixed(1)}万度，` +
      `可转移负荷约${(facilityInfo.avgMonthlyLoad / 30 * 0.2 / 1000).toFixed(2)}MWh/日`
    );
  }

  // Tariff spread analysis
  const spread = tariffDetail.peakPrice - tariffDetail.valleyPrice;
  reasons.push(
    `峰谷电价差¥${spread.toFixed(3)}/kWh，` +
    `套利空间${spread > 0.6 ? '较大' : spread > 0.4 ? '适中' : '较小'}`
  );

  // Collaboration model consideration
  if (ownerInfo.collaborationModel === 'investor_owned') {
    reasons.push('投资方独资模式，建议采用标准方案平衡风险与收益');
  } else if (ownerInfo.collaborationModel === 'joint_venture') {
    reasons.push('合资模式，建议根据分成比例选择激进程度');
  } else {
    reasons.push('EMC模式，建议优化收益分配');
  }

  return reasons.join('；') + '。';
};

/**
 * Main recommendation function
 */
export const recommendCapacity = (
  params: RecommendationParams
): RecommendationResult => {
  // Generate three proposals
  const conservative = generateProposal(params, 'conservative');
  const standard = generateProposal(params, 'standard');
  const aggressive = generateProposal(params, 'aggressive');

  // Determine which proposal to recommend based on collaboration model
  let recommended: 'conservative' | 'standard' | 'aggressive' = 'standard';

  if (params.ownerInfo.collaborationModel === 'investor_owned') {
    // Investor-owned: tend to be more conservative
    recommended = 'standard';
  } else if (params.ownerInfo.collaborationModel === 'joint_venture') {
    // Joint venture: depends on credit rating
    if (params.ownerInfo.creditRating === 'AAA' || params.ownerInfo.creditRating === 'AA') {
      recommended = 'aggressive';
    } else {
      recommended = 'standard';
    }
  } else {
    // EMC: optimize for revenue
    recommended = 'aggressive';
  }

  // Generate reasoning
  const reasoning = generateReasoning(params, {
    conservative,
    standard,
    aggressive,
    recommended,
    reasoning: '',
  });

  return {
    conservative,
    standard,
    aggressive,
    recommended,
    reasoning,
  };
};

/**
 * Calculate expected IRR for a given proposal
 * This is a simplified estimation - in production, use the full CalculationEngine
 */
export const estimateIRR = (
  proposal: TechnicalProposal,
  params: RecommendationParams
): number => {
  const { tariffDetail } = params;
  const spread = tariffDetail.peakPrice - tariffDetail.valleyPrice;

  // Base IRR calculation
  const capacityMW = proposal.recommendedCapacity;
  const powerMW = proposal.recommendedPower;

  // Rough estimation of annual revenue
  // Daily cycles * efficiency * spread * capacity * 365
  const annualRevenue = 1.5 * 0.88 * spread * capacityMW * 365;

  // Rough estimation of CAPEX (¥1.2/MWh for battery, ¥0.3/MW for PCS)
  const capex = capacityMW * 1000 * 1200 + powerMW * 1000 * 300;

  // Simple payback period
  const paybackYears = capex / annualRevenue;

  // Convert payback to rough IRR
  const irr = paybackYears < 5 ? 0.15 + (5 - paybackYears) * 0.03 :
              paybackYears < 8 ? 0.10 + (8 - paybackYears) * 0.015 :
              0.08;

  // Adjust based on optimization target
  if (proposal.optimizedFor === 'revenue') {
    return irr + 0.02; // Aggressive has higher IRR potential
  } else if (proposal.optimizedFor === 'cost') {
    return irr - 0.01; // Conservative is safer but lower IRR
  }
  return irr;
};
