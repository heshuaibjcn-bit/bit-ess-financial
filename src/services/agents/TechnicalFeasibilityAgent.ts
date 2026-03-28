/**
 * Technical Feasibility Agent - Site and Grid Assessment
 *
 * Evaluates technical feasibility of energy storage projects:
 * - Assesses site conditions
 * - Evaluates grid capacity
 * - Analyzes technical constraints
 * - Generates technical assessment report
 */

import { NanoAgent, AgentCapability } from './NanoAgent';
import type { ProvinceData } from '../../domain/schemas/ProvinceSchema';

export interface TechnicalAssessmentInput {
  projectName: string;
  province: string;
  location?: {
    address?: string;
    coordinates?: { lat: number; lng: number };
    siteArea?: number; // square meters
    roofType?: 'flat' | 'sloped' | 'mixed';
  };
  grid?: {
    voltageLevel: '0.4kV' | '10kV' | '35kV';
    transformerCapacity?: number; // kVA
    availableCapacity?: number; // kVA
  };
  system?: {
    capacity: number; // MWh
    power: number; // MW
  };
}

export interface TechnicalFeasibilityResult {
  overallFeasibility: 'feasible' | 'feasible_with_conditions' | 'challenging' | 'not_feasible';
  score: number; // 0-100
  categories: CategoryAssessment[];
  recommendations: string[];
  constraints: TechnicalConstraint[];
  reportGenerated: string;
}

export interface CategoryAssessment {
  category: 'site' | 'grid' | 'environmental' | 'regulatory';
  score: number; // 0-100
  status: 'pass' | 'condition' | 'fail';
  findings: string[];
  requirements: string[];
}

export interface TechnicalConstraint {
  type: 'site_limitation' | 'grid_capacity' | 'environmental' | 'safety' | 'regulatory';
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  solution: string;
}

export class TechnicalFeasibilityAgent extends NanoAgent {
  constructor() {
    super({
      name: 'TechnicalFeasibilityAgent',
      description: 'Technical feasibility assessment for energy storage projects',
      version: '1.0.0',
      model: 'glm-5-turbo',
      maxTokens: 4096,
      temperature: 0.3,
      systemPrompt: `You are a Technical Feasibility Specialist for energy storage projects. Your role is to:

1. Assess site conditions and limitations
2. Evaluate grid connection capacity and requirements
3. Identify environmental constraints
4. Check regulatory compliance
5. Generate technical feasibility reports

Assessment framework:
- Overall feasibility score (0-100)
- Feasibility level (feasible/feasible with conditions/challenging/not feasible)
- Category scores (site/grid/environmental/regulatory)
- Technical constraints and solutions
- Specific recommendations

Key assessment areas:

1. Site Conditions:
   - Available space (roof area, land area)
   - Roof structure (flat, sloped, load-bearing capacity)
   - Access and logistics
   - Environmental factors
   - Safety distances

2. Grid Connection:
   - Transformer capacity
   - Voltage level compatibility
   - Available connection capacity
   - Grid stability
   - Connection requirements

3. Technical Requirements:
   - System sizing (capacity, power ratio)
   - Equipment specifications
   - Safety systems
   - Monitoring and control
   - Grid protection

4. Regulatory Compliance:
   - Building codes
   - Fire safety regulations
   - Environmental protection
   - Grid codes
   - Planning permissions

For each constraint:
- Identify the technical limitation
- Assess severity (low/medium/high)
- Propose practical solutions
- Estimate cost and timeline
- Recommend alternatives if needed

Provide clear, technical recommendations with:
- Specific feasibility scores
- Detailed constraint analysis
- Actionable solutions
- Cost and timeline estimates
- Risk mitigations`,
    });
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'site_assessment',
        description: 'Assess site conditions',
        inputFormat: 'Location and site details',
        outputFormat: 'SiteAssessment',
        estimatedTime: 30,
      },
      {
        name: 'grid_analysis',
        description: 'Analyze grid connection capacity',
        inputFormat: 'Grid information',
        outputFormat: 'GridAnalysis',
        estimatedTime: 25,
      },
      {
        name: 'constraint_check',
        description: 'Identify technical constraints',
        inputFormat: 'Project parameters',
        outputFormat: 'TechnicalConstraint list',
        estimatedTime: 35,
      },
      {
        name: 'feasibility_report',
        description: 'Generate feasibility report',
        inputFormat: 'All assessment data',
        outputFormat: 'TechnicalFeasibilityResult',
        estimatedTime: 40,
      },
    ];
  }

  async execute(input: TechnicalAssessmentInput): Promise<TechnicalFeasibilityResult> {
    this.log('Starting technical feasibility assessment');

    // Step 1: Assess site conditions
    const siteAssessment = await this.assessSite(input);

    // Step 2: Analyze grid connection
    const gridAssessment = await this.assessGrid(input);

    // Step 3: Check environmental factors
    const environmentalAssessment = await this.assessEnvironmental(input);

    // Step 4: Check regulatory compliance
    const regulatoryAssessment = await this.assessRegulatory(input);

    // Step 5: Identify constraints
    const constraints = await this.identifyConstraints(input, [
      siteAssessment,
      gridAssessment,
      environmentalAssessment,
      regulatoryAssessment,
    ]);

    // Step 6: Calculate overall score
    const categories = [siteAssessment, gridAssessment, environmentalAssessment, regulatoryAssessment];
    const overallScore = Math.round(
      categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length
    );

    // Step 7: Determine feasibility level
    const feasibility = this.determineFeasibility(overallScore, constraints);

    // Step 8: Generate recommendations
    const recommendations = await this.generateRecommendations(input, categories, constraints);

    const result: TechnicalFeasibilityResult = {
      overallFeasibility: feasibility,
      score: overallScore,
      categories,
      recommendations,
      constraints,
      reportGenerated: new Date().toISOString(),
    };

    this.log('Technical feasibility assessment completed');
    return result;
  }

  /**
   * Assess site conditions
   */
  private async assessSite(input: TechnicalAssessmentInput): Promise<CategoryAssessment> {
    this.log('Assessing site conditions');

    const findings: string[] = [];
    const requirements: string[] = [];

    // Check available area
    const minArea = input.system?.capacity ? input.system.capacity * 200 : 200; // 200 sqm per MWh
    if (input.location?.siteArea && input.location.siteArea < minArea) {
      findings.push(`可用面积${input.location.siteArea}平方米不足，建议至少${minArea}平方米`);
      requirements.push(`建议扩展面积至${minArea}平方米以上`);
    }

    // Check roof type
    if (input.location?.roofType === 'sloped') {
      findings.push('屋顶为斜坡结构，需要特殊支架');
      requirements.push('斜坡屋顶需要定制支架系统，成本约增加20%');
    }

    // Calculate score
    let score = 70; // Base score
    if (input.location?.siteArea && input.location.siteArea >= minArea) {
      score += 20;
    }
    if (input.location?.roofType === 'flat') {
      score += 10;
    }

    return {
      category: 'site',
      score: Math.min(score, 100),
      status: score >= 80 ? 'pass' : score >= 60 ? 'condition' : 'fail',
      findings: findings.length > 0 ? findings : ['场地条件良好'],
      requirements,
    };
  }

  /**
   * Assess grid connection
   */
  private async assessGrid(input: TechnicalAssessmentInput): Promise<CategoryAssessment> {
    this.log('Assessing grid connection');

    const findings: string[] = [];
    const requirements: string[] = [];

    // Check transformer capacity
    if (input.grid?.transformerCapacity) {
      const requiredCapacity = input.system?.power || 1;
      const utilization = requiredCapacity / input.grid.transformerCapacity;

      if (utilization > 0.8) {
        findings.push(`变压器容量利用率${(utilization * 100).toFixed(1)}%，接近上限`);
        requirements.push('建议评估变压器增容或选择其他接入点');
      } else {
        findings.push(`变压器容量充足，当前利用率${(utilization * 100).toFixed(1)}%`);
      }
    }

    // Check voltage level compatibility
    if (input.grid?.voltageLevel) {
      const voltageRequirements: Record<string, string> = {
        '0.4kV': '适合低压并网，需配置低压逆变器',
        '10kV': '适合中压并网，需配置升压变压器',
        '35kV': '适合高压并网，需配置高压开关柜',
      };
      findings.push(voltageRequirements[input.grid.voltageLevel]);
    }

    // Calculate score
    let score = 70;
    if (input.grid?.availableCapacity && input.grid.availableCapacity > input.system?.power! * 1000) {
      score += 20;
    }

    return {
      category: 'grid',
      score: Math.min(score, 100),
      status: score >= 80 ? 'pass' : score >= 60 ? 'condition' : 'fail',
      findings: findings.length > 0 ? findings : ['电网条件良好'],
      requirements,
    };
  }

  /**
   * Assess environmental factors
   */
  private async assessEnvironmental(input: TechnicalAssessmentInput): Promise<CategoryAssessment> {
    this.log('Assessing environmental factors');

    const findings: string[] = [];
    const requirements: string[] = [];

    // General environmental assessment
    findings.push('需进行环境影响评估');
    requirements.push('按照规定编制环境影响报告表');

    // Specific considerations based on province
    const provincialRequirements: Record<string, string[]> = {
      guangdong: ['需办理省环保批文', '需要进行电磁辐射评估'],
      zhejiang: ['需办理环评审批', '需符合地方环保标准'],
      jiangsu: ['需满足江苏省环保要求', '需进行安全评估'],
    };

    if (input.province && provincialRequirements[input.province]) {
      requirements.push(...provincialRequirements[input.province]);
    }

    return {
      category: 'environmental',
      score: 75,
      status: 'condition',
      findings,
      requirements,
    };
  }

  /**
   * Assess regulatory compliance
   */
  private async assessRegulatory(input: TechnicalAssessmentInput): Promise<CategoryAssessment> {
    this.log('Assessing regulatory compliance');

    const findings: string[] = [];
    const requirements: string[] = [];

    // General regulatory requirements
    findings.push('需符合《储能技术规范》等国家标准');
    requirements.push('设备需通过型式试验');

    // Voltage-specific requirements
    if (input.grid?.voltageLevel === '0.4kV') {
      findings.push('低压并网需备案');
      requirements.push('需符合《低压配电设计规范》');
    } else if (input.grid?.voltageLevel === '10kV') {
      findings.push('中压并网需审批');
      requirements.push('需符合《供配电系统设计规范》');
    } else if (input.grid?.voltageLevel === '35kV') {
      findings.push('高压并网需严格审批');
      requirements.push('需符合高压并网技术标准');
    }

    // Capacity-specific requirements
    if (input.system?.capacity && input.system.capacity >= 1) {
      requirements.push('大型储能项目需进行安全预评估');
    }

    return {
      category: 'regulatory',
      score: 70,
      status: 'condition',
      findings,
      requirements,
    };
  }

  /**
   * Identify technical constraints
   */
  private async identifyConstraints(
    input: TechnicalAssessmentInput,
    assessments: CategoryAssessment[]
  ): Promise<TechnicalConstraint[]> {
    this.log('Identifying technical constraints');

    const constraints: TechnicalConstraint[] = [];

    // Analyze each assessment category
    for (const assessment of assessments) {
      if (assessment.status === 'fail') {
        constraints.push({
          type: assessment.category === 'site' ? 'site_limitation' : 'grid_capacity',
          severity: 'high',
          description: assessment.findings.join('; '),
          impact: `可能导致项目无法实施或成本大幅增加`,
          solution: assessment.requirements.join('; '),
        });
      } else if (assessment.status === 'condition') {
        constraints.push({
          type: 'regulatory',
          severity: 'medium',
          description: assessment.findings[0],
          impact: '需要满足特定条件才能实施',
          solution: assessment.requirements.join('; '),
        });
      }
    }

    return constraints;
  }

  /**
   * Determine feasibility level
   */
  private determineFeasibility(
    score: number,
    constraints: TechnicalConstraint[]
  ): 'feasible' | 'feasible_with_conditions' | 'challenging' | 'not_feasible' {
    const criticalConstraints = constraints.filter(c => c.severity === 'high').length;
    const mediumConstraints = constraints.filter(c => c.severity === 'medium').length;

    if (score >= 80 && criticalConstraints === 0) {
      return 'feasible';
    } else if (score >= 60 && criticalConstraints === 0) {
      return 'feasible_with_conditions';
    } else if (score >= 40 && criticalConstraints <= 1) {
      return 'challenging';
    } else {
      return 'not_feasible';
    }
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    input: TechnicalAssessmentInput,
    assessments: CategoryAssessment[],
    constraints: TechnicalConstraint[]
  ): Promise<string[]> {
    this.log('Generating recommendations');

    const prompt = `基于以下技术评估结果提供3-5条具体建议：

项目名称：${input.projectName}
所在省份：${input.province}
可行性评分：${assessments[0].score.toFixed(0)}分

主要约束：
${constraints.slice(0, 3).map(c => `- ${c.description}: ${c.solution}`).join('\n')}

评估结果：
${assessments.map(a => `${a.category}: ${a.status} (${a.score}分)`).join(', ')}

请针对储能项目技术实施提供建议，包括：
1. 可行性提升措施
2. 成本优化建议
3. 风险缓解方案
4. 技术选型建议`;

    try {
      const response = await this.think(prompt);
      // Parse recommendations from response
      const lines = response.split('\n').filter(line => line.trim().length > 0);
      return lines.slice(0, 5);
    } catch (error) {
      // Fallback recommendations
      return [
        '建议先解决电网容量问题',
        '评估屋顶加固或改造方案',
        '提前办理环保和并网审批',
        '选择符合当地标准的设备',
        '预留充足的并网接入容量',
      ];
    }
  }
}
