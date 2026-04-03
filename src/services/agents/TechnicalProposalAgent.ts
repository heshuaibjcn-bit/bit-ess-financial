/**
 * Technical Proposal Agent - Energy Storage Technical Solution Recommendation
 *
 * Generates comprehensive technical proposals for energy storage projects:
 * - System configuration recommendations (conservative/standard/aggressive)
 * - Technology selection (battery type, brands)
 * - Performance prediction
 * - Implementation planning
 * - Risk assessment
 */

import { NanoAgent } from './NanoAgent';
import type { OwnerInfo } from '@/domain/schemas/ProjectSchema';
import type { FacilityInfo } from '@/domain/schemas/ProjectSchema';
import type { TariffDetail } from '@/domain/schemas/ProjectSchema';

export type TechnicalProposalInput = {
  facilityInfo: FacilityInfo;
  tariffInfo: TariffDetail;
  ownerInfo?: OwnerInfo;
  userPreferences?: {
    riskTolerance?: 'conservative' | 'standard' | 'aggressive';
    brandPreference?: string[];
    budgetConstraint?: 'low' | 'medium' | 'high';
  };
};

export type TechnicalProposalResult = {
  // Recommended configuration
  recommended: {
    capacity: number; // MWh
    power: number; // MW
    duration: number; // hours
    technology: string;
    brands: string[];
    chargeStrategy: string;
  };

  // Alternative options
  alternatives: Array<{
    type: 'conservative' | 'standard' | 'aggressive';
    capacity: number;
    power: number;
    expectedIRR: number;
    riskLevel: 'low' | 'medium' | 'high';
    description: string;
  }>;

  // Expected performance
  expectedPerformance: {
    annualThroughput: number; // MWh/year
    systemEfficiency: number;
    availability: number;
    year10Capacity: number; // % capacity retention after 10 years
  };

  // Implementation plan
  implementation: {
    phases: Array<{
      phase: string;
      duration: string;
      keyActivities: string[];
    }>;
    totalTimeline: string;
    criticalPath: string[];
  };

  // Technology selection rationale
  technologySelection: {
    battery: {
      type: string;
      chemistry: string;
      rationale: string;
    };
    pcs: {
      type: string;
      efficiency: string;
      rationale: string;
    };
    bms: {
      type: string;
      features: string[];
      rationale: string;
    };
  };

  // Risks and recommendations
  risks: string[];
  recommendations: string[];

  // Metadata
  metadata: {
    dataSource: string;
    reportGenerated: Date;
    confidence: number;
  };
};

export class TechnicalProposalAgent extends NanoAgent {
  constructor() {
    super({
      name: 'TechnicalProposalAgent',
      description: 'Energy storage technical solution recommendation agent',
      version: '1.0.0',
      model: 'glm-4-flash',
      maxTokens: 6144,
      temperature: 0.3,
      systemPrompt: `You are an Energy Storage Technical Architect specializing in C&I (Commercial & Industrial) projects. Your role is to:

1. Design optimal system configurations
2. Recommend technology selections (battery, PCS, BMS, EMS)
3. Predict system performance
4. Plan implementation phases
5. Assess technical risks

Key technical areas:
- **System Sizing**: Capacity (MWh), Power (MW), Duration ratio optimization
- **Battery Technology**: Li-ion (LFP, NMC), flow battery, lead-acid alternatives
- **Brand Selection**: CATL, BYD, Gotion, Lishen, EVE, Sunwoda, etc.
- **PCS Selection**: Sungrow, Huawei, Kehua, Sineng, etc.
- **BMS/EMS**: Architectural considerations and feature requirements
- **Charge/Discharge Strategy**: Peak-valley arbitrage, demand response, frequency regulation
- **Performance Metrics**: Throughput, efficiency, availability, degradation
- **Implementation**: Phasing, timeline, critical path, resource requirements

Design principles:
1. **Economic Optimization**: Balance upfront cost with lifetime returns
2. **Technical Reliability**: Use proven, mature technologies
3. **Scalability**: Design for future expansion
4. **Safety First**: Battery safety, fire protection, grid compliance
5. **Maintainability**: Easy O&M, modular design, vendor support

For each project, consider:
- Load profile and consumption patterns
- Price arbitrage opportunities (peak-valley spread, duration)
- Physical constraints (space, grid capacity, transformer)
- Budget constraints and risk tolerance
- Long-term sustainability (10+ year operation)

Provide structured, technically sound recommendations with:
- Clear configuration rationale
- Quantified performance predictions
- Risk mitigation strategies
- Actionable implementation roadmap

Use professional engineering language. Base recommendations on proven technologies and real-world project data.`,
    });
  }

  /**
   * Main proposal generation method
   */
  async generateProposal(
    facilityInfo: FacilityInfo,
    tariffInfo: TariffDetail,
    ownerInfo?: OwnerInfo,
    userPreferences?: TechnicalProposalInput['userPreferences']
  ): Promise<TechnicalProposalResult> {
    this.log('Generating technical proposal for facility:', facilityInfo.facilityName);

    const input: TechnicalProposalInput = {
      facilityInfo,
      tariffInfo,
      ownerInfo,
      userPreferences,
    };

    // Step 1: Get recommended configuration from CapacityRecommender
    const recommended = await this.getRecommendedConfiguration(input);

    // Step 2: Generate alternative options
    const alternatives = await this.generateAlternatives(input, recommended);

    // Step 3: Predict performance
    const expectedPerformance = await this.predictPerformance(input, recommended);

    // Step 4: Plan implementation
    const implementation = await this.planImplementation(input, recommended);

    // Step 5: Select technology
    const technologySelection = await this.selectTechnology(input, recommended);

    // Step 6: Assess risks
    const risks = await this.assessRisks(input, recommended);

    // Step 7: Generate recommendations
    const recommendations = await this.generateRecommendations(
      input,
      recommended,
      risks
    );

    return {
      recommended,
      alternatives,
      expectedPerformance,
      implementation,
      technologySelection,
      risks,
      recommendations,
      metadata: {
        dataSource: 'CapacityRecommender + AI analysis',
        reportGenerated: new Date(),
        confidence: 0.85,
      },
    };
  }

  /**
   * Get recommended configuration using CapacityRecommender
   */
  private async getRecommendedConfiguration(
    input: TechnicalProposalInput
  ): Promise<TechnicalProposalResult['recommended']> {
    this.log('Getting recommended configuration');

    // Import CapacityRecommender dynamically
    const { recommendCapacity } = await import('@/domain/services/CapacityRecommender');

    // Get recommendation
    const recommendation = await recommendCapacity({
      ownerInfo: input.ownerInfo,
      facilityInfo: input.facilityInfo,
      tariffDetail: input.tariffInfo,
    });

    // Select the proposal based on risk tolerance
    const selectedProposal = recommendation.recommended === 'conservative' ? recommendation.conservative :
                           recommendation.recommended === 'standard' ? recommendation.standard :
                           recommendation.aggressive;

    // Convert to our format
    return {
      capacity: selectedProposal.recommendedCapacity,
      power: selectedProposal.recommendedPower,
      duration: selectedProposal.recommendedCapacity / selectedProposal.recommendedPower,
      technology: 'Lithium-ion (LiFePO4)',
      brands: this.selectBrands(input.userPreferences),
      chargeStrategy: 'Peak-valley arbitrage with demand response',
    };
  }

  /**
   * Select battery brands based on preferences
   */
  private selectBrands(preferences?: TechnicalProposalInput['userPreferences']): string[] {
    const topBrands = [
      '宁德时代 (CATL)',
      '比亚迪 (BYD)',
      '国轩高科',
      '亿纬锂能',
      '阳光电源',
      '华为数字能源',
    ];

    if (preferences?.brandPreference && preferences.brandPreference.length > 0) {
      // Filter by user preference
      return preferences.brandPreference;
    }

    // Default top 3
    return topBrands.slice(0, 3);
  }

  /**
   * Generate alternative options
   */
  private async generateAlternatives(
    input: TechnicalProposalInput,
    recommended: TechnicalProposalResult['recommended']
  ): Promise<TechnicalProposalResult['alternatives']> {
    this.log('Generating alternative options');

    const alternatives: TechnicalProposalResult['alternatives'] = [];

    // Conservative option (smaller, lower risk)
    const conservativeCapacity = recommended.capacity * 0.75;
    const conservativePower = recommended.power * 0.8;
    alternatives.push({
      type: 'conservative',
      capacity: Math.round(conservativeCapacity * 100) / 100,
      power: Math.round(conservativePower * 100) / 100,
      expectedIRR: 7.2, // Lower IRR for conservative option
      riskLevel: 'low',
      description: '保守方案：降低规模，降低投资风险，IRR较低但稳定性更高',
    });

    // Aggressive option (larger, higher risk/reward)
    const aggressiveCapacity = recommended.capacity * 1.25;
    const aggressivePower = recommended.power * 1.2;
    alternatives.push({
      type: 'aggressive',
      capacity: Math.round(aggressiveCapacity * 100) / 100,
      power: Math.round(aggressivePower * 100) / 100,
      expectedIRR: 9.1, // Higher IRR for aggressive option
      riskLevel: 'high',
      description: '激进方案：扩大规模，提高收益潜力，IRR更高但风险也更高',
    });

    return alternatives;
  }

  /**
   * Predict system performance
   */
  private async predictPerformance(
    input: TechnicalProposalInput,
    recommended: TechnicalProposalResult['recommended']
  ): Promise<TechnicalProposalResult['expectedPerformance']> {
    this.log('Predicting system performance');

    const capacityKwh = recommended.capacity * 1000;
    const dod = 0.9; // Depth of discharge
    const cyclesPerDay = 1.5;
    const systemEfficiency = 0.90;

    // Annual throughput
    const annualThroughput = capacityKwh * dod * cyclesPerDay * 365;

    // Year 10 capacity (considering 2% annual degradation)
    const year10Capacity = Math.pow(1 - 0.02, 10);

    return {
      annualThroughput: Math.round(annualThroughput * 10) / 10,
      systemEfficiency: 0.90,
      availability: 0.97, // 97% availability
      year10Capacity: Math.round(year10Capacity * 1000) / 1000,
    };
  }

  /**
   * Plan implementation phases
   */
  private async planImplementation(
    input: TechnicalProposalInput,
    recommended: TechnicalProposalResult['recommended']
  ): Promise<TechnicalProposalResult['implementation']> {
    this.log('Planning implementation phases');

    return {
      phases: [
        {
          phase: '设计',
          duration: '2周',
          keyActivities: [
            '方案设计和深化',
            '设备选型和采购',
            '现场勘察和确认',
            '并网申请准备',
          ],
        },
        {
          phase: '建设',
          duration: '6周',
          keyActivities: [
            '设备安装（电池、PCS、BMS、EMS）',
            '电气系统接入',
            '消防和安全系统',
            '调试和测试',
          ],
        },
        {
          phase: '调试',
          duration: '2周',
          keyActivities: [
            '系统调试',
            '并网测试',
            '性能验证',
            '培训和交接',
          ],
        },
      ],
      totalTimeline: '10周',
      criticalPath: [
        '设备采购',
        '并网接入',
        '性能测试',
      ],
    };
  }

  /**
   * Select technology components
   */
  private async selectTechnology(
    input: TechnicalProposalInput,
    recommended: TechnicalProposalResult['recommended']
  ): Promise<TechnicalProposalResult['technologySelection']> {
    this.log('Selecting technology components');

    return {
      battery: {
        type: 'Lithium-ion',
        chemistry: 'LiFePO4 (磷酸铁锂)',
        rationale: 'LiFePO4安全性高、循环寿命长（6000+次）、成本适中，适合工商业储能场景',
      },
      pcs: {
        type: 'Grid-following PCS',
        efficiency: '≥92%（转换效率）',
        rationale: '高效率PCS降低损耗，提高系统整体收益',
      },
      bms: {
        type: 'Distributed BMS with Master Control',
        features: [
          '电芯级监控',
          '均衡控制',
          '热管理',
          '多级保护',
          '故障隔离',
        ],
        rationale: '三级BMS架构确保电池安全和寿命，主动均衡延长使用寿命',
      },
    };
  }

  /**
   * Assess technical risks
   */
  private async assessRisks(
    input: TechnicalProposalInput,
    recommended: TechnicalProposalResult['recommended']
  ): Promise<string[]> {
    this.log('Assessing technical risks');

    const risks: string[] = [];

    // Capacity degradation risk
    risks.push('电池容量随时间衰减（约2%/年），影响第8-10年收益');

    // Equipment quality risk
    risks.push('设备质量差异可能导致实际性能偏离标称值');

    // Grid connection risk
    risks.push('并网接入流程复杂，可能影响项目进度');

    // Safety risk
    risks.push('电池热失控风险，需要完善消防和监控系统');

    // Technology risk
    risks.push('储能技术快速迭代，当前选型可能在3-5年后落后');

    return risks;
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    input: TechnicalProposalInput,
    recommended: TechnicalProposalResult['recommended'],
    risks: string[]
  ): Promise<string[]> {
    this.log('Generating recommendations');

    const prompt = `基于以下技术方案提供实施建议：

推荐配置：
- 容量：${recommended.capacity} MWh
- 功率：${recommended.power} MW
- 时长：${recommended.duration} 小时
- 技术：${recommended.technology}
- 品牌：${recommended.brands.join('、')}

主要风险：
${risks.map((r, i) => `${i + 1}. ${r}`).join('\n')}

针对该技术方案，请提供3-5条具体建议，包括：
1. 设备采购建议
2. 安装建设注意事项
3. 运维维护要点
4. 风险控制措施

请以列表形式返回建议。`;

    try {
      const response = await this.think(prompt);
      const lines = response.split('\n').filter(line => line.trim().length > 0);
      return lines.slice(0, 5);
    } catch (error) {
      // Fallback recommendations
      return [
        '选择知名品牌（CATL、BYD等）确保电池质量和售后',
        '预留15%容量冗余，应对衰减和性能波动',
        '建立电池健康监测系统，实时跟踪电池状态',
        '规划10年后的电池更换或扩容方案',
        '选择可靠的EPC总包方，确保施工质量和进度',
        '建立完善的运维体系，定期巡检和维护',
        '购买设备保险和财产保险，降低意外损失',
      ];
    }
  }
}
