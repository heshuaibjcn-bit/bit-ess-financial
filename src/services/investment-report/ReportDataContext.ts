/**
 * 报告数据上下文 - 共享数据结构
 *
 * 职责：
 * - 存储报告生成过程中的所有数据
 * - 在智能体和计算引擎之间共享数据
 * - 提供数据验证和完整性检查
 * - 支持数据的版本控制和追溯
 */

import { Project } from '@/domain/models/Project';
import { OwnerInfo } from '@/domain/schemas/ProjectSchema';

// 使用现有的计算引擎类型
import { FinancialMetrics } from '@/domain/services/FinancialCalculator';
import type { CashFlowResult } from '@/domain/services/CashFlowCalculator';
import type { SensitivityResult } from '@/domain/services/SensitivityAnalyzer';

// ============ 智能体输出类型定义 ============

export interface DueDiligenceReport {
  // 企业基本信息
  companyInfo: {
    name: string;
    unifiedSocialCreditCode?: string;
    legalRepresentative?: string;
    registeredCapital?: number;
    establishedDate?: Date;
    status: string;
    industry: string;
  };
  // 信用评估
  creditRating: {
    level: string; // AAA, AA, A, BBB, BB, B, CCC
    score: number; // 0-100
    confidence: number; // 0-1
  };
  // 财务健康度
  financialHealth: {
    profitability: string;
    liquidity: string;
    solvency: string;
    efficiency: string;
  };
  // 付款历史
  paymentHistory: {
    onTimeRate: number; // 按时付款比例
    latePayments: number;
    defaults: number;
    records: Array<{
      date: Date;
      amount: number;
      status: 'on_time' | 'late' | 'default';
    }>;
  };
  // 业务风险
  businessRisks: Array<{
    category: string;
    level: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
    mitigation: string;
  }>;
  // 建议
  recommendations: string[];
  // 元数据
  metadata: {
    dataSource: string;
    reportGenerated: Date;
    confidence: number;
  };
}

export interface PolicyAnalysisReport {
  // 当前政策
  currentPolicy: {
    tariffType: string;
    peakPrice: number;
    valleyPrice: number;
    priceSpread: number;
    capacityCompensation?: number;
    demandResponseAvailable: boolean;
  };
  // 政策稳定性
  stability: {
    rating: 'stable' | 'moderate' | 'unstable';
    confidence: number;
    factors: string[];
  };
  // 政策趋势
  trend: {
    direction: 'stable' | 'improving' | 'declining';
    timeframe: string;
    keyChanges: string[];
  };
  // 对IRR的影响
  impact: {
    onIRR: number; // 百分比
    scenarios: Array<{
      scenario: string;
      irr: number;
    }>;
  };
  // 风险和机会
  risks: Array<{
    type: string;
    level: 'low' | 'medium' | 'high';
    description: string;
    response: string;
  }>;
  opportunities: Array<{
    type: string;
    description: string;
    potential: string;
  }>;
  // 应对建议
  recommendations: string[];
}

export interface TechnicalProposal {
  // 推荐配置
  recommended: {
    capacity: number; // MWh
    power: number; // MW
    duration: number; // 小时
    technology: string;
    brands: string[];
    chargeStrategy: string;
  };
  // 备选方案
  alternatives: Array<{
    type: 'conservative' | 'standard' | 'aggressive';
    capacity: number;
    power: number;
    expectedIRR: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  // 预期性能
  expectedPerformance: {
    annualThroughput: number; // MWh/年
    systemEfficiency: number;
    availability: number;
    year10Capacity: number; // 第10年容量保持率
  };
  // 实施计划
  implementation: {
    phases: Array<{
      phase: string;
      duration: string;
      keyActivities: string[];
    }>;
    totalTimeline: string;
    criticalPath: string[];
  };
  // 风险和建议
  risks: string[];
  recommendations: string[];
}

export interface RiskAssessmentReport {
  // 风险矩阵
  riskMatrix: {
    low: string[];
    medium: string[];
    high: string[];
    critical: string[];
  };
  // 详细风险列表
  risks: Array<{
    category: 'financial' | 'technical' | 'policy' | 'credit' | 'operational';
    source: string;
    description: string;
    likelihood: number; // 0-1
    impact: number; // 0-1
    score: number; // likelihood * impact * 100
    level: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string;
  }>;
  // 整体评级
  overallRating: {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  };
  // 缓释策略
  mitigationStrategies: Array<{
    aspect: string;
    strategy: string;
    effectiveness: 'high' | 'medium' | 'low';
    cost: 'high' | 'medium' | 'low';
  }>;
  // 应急预案
  contingencyPlans: Array<{
    trigger: string;
    actions: string[];
    expectedOutcome: string;
  }>;
}

// ============ 报告章节类型 ============

export type ChapterType =
  | 'project_overview'
  | 'owner_due_diligence'
  | 'policy_analysis'
  | 'technical_assessment'
  | 'financial_analysis'
  | 'risk_assessment'
  | 'investment_recommendation';

// ============ 上下文主类 ============

export class ReportDataContext {
  // 基础项目数据
  public readonly project: Project;

  // 智能体输出（可选，因为可能未执行或失败）
  private dueDiligenceReport?: DueDiligenceReport;
  private policyAnalysisReport?: PolicyAnalysisReport;
  private technicalProposal?: TechnicalProposal;
  private riskAssessmentReport?: RiskAssessmentReport;

  // 计算引擎输出（使用现有类型）
  private financialMetrics?: FinancialMetrics;
  private cashFlowResult?: CashFlowResult;
  private sensitivityResult?: SensitivityResult;

  // 验证状态
  private validationErrors: string[] = [];

  constructor(project: Project) {
    this.project = project;
  }

  // ============ 数据收集 ============

  /**
   * 从项目实体收集基础数据
   */
  collectBasicData(): void {
    // 数据已经在构造函数中注入
    // 这里可以添加额外的数据转换或预处理
    this.validate();
  }

  // ============ 智能体数据读写 ============

  setDueDiligenceReport(report: DueDiligenceReport): void {
    this.dueDiligenceReport = report;
  }

  getDueDiligenceReport(): DueDiligenceReport | undefined {
    return this.dueDiligenceReport;
  }

  setPolicyAnalysisReport(report: PolicyAnalysisReport): void {
    this.policyAnalysisReport = report;
  }

  getPolicyAnalysisReport(): PolicyAnalysisReport | undefined {
    return this.policyAnalysisReport;
  }

  setTechnicalProposal(proposal: TechnicalProposal): void {
    this.technicalProposal = proposal;
  }

  getTechnicalProposal(): TechnicalProposal | undefined {
    return this.technicalProposal;
  }

  setRiskAssessmentReport(report: RiskAssessmentReport): void {
    this.riskAssessmentReport = report;
  }

  getRiskAssessmentReport(): RiskAssessmentReport | undefined {
    return this.riskAssessmentReport;
  }

  // ============ 计算引擎数据读写 ============

  setFinancialMetrics(metrics: FinancialMetrics): void {
    this.financialMetrics = metrics;
  }

  getFinancialMetrics(): FinancialMetrics | undefined {
    return this.financialMetrics;
  }

  setCashFlowAnalysis(result: CashFlowResult): void {
    this.cashFlowResult = result;
  }

  getCashFlowAnalysis(): CashFlowResult | undefined {
    return this.cashFlowResult;
  }

  setSensitivityMatrix(result: SensitivityResult): void {
    this.sensitivityResult = result;
  }

  getSensitivityMatrix(): SensitivityResult | undefined {
    return this.sensitivityResult;
  }

  // ============ 数据验证 ============

  /**
   * 验证数据完整性
   * @throws Error 如果数据不完整
   */
  validate(): void {
    this.validationErrors = [];

    // 验证项目基础信息
    if (!this.project.id) {
      this.validationErrors.push('项目ID缺失');
    }

    if (!this.project.ownerInfo?.companyName) {
      this.validationErrors.push('业主公司名称缺失');
    }

    if (!this.project.facilityInfo) {
      this.validationErrors.push('场地信息缺失');
    }

    if (!this.project.tariffDetail) {
      this.validationErrors.push('电价信息缺失');
    }

    if (this.validationErrors.length > 0) {
      throw new Error(`数据验证失败:\n${this.validationErrors.join('\n')}`);
    }
  }

  /**
   * 检查报告生成所需的最小数据集
   */
  hasMinimumData(): boolean {
    return !!(
      this.project.id &&
      this.project.ownerInfo?.companyName &&
      this.project.facilityInfo &&
      this.project.tariffDetail
    );
  }

  /**
   * 获取数据完整性报告
   */
  getCompletenessReport(): {
    complete: string[];
    incomplete: string[];
    overall: number; // 0-100
  } {
    const required = {
      '项目ID': !!this.project.id,
      '业主信息': !!this.project.ownerInfo,
      '场地信息': !!this.project.facilityInfo,
      '电价信息': !!this.project.tariffDetail,
      '尽调报告': !!this.dueDiligenceReport,
      '政策分析': !!this.policyAnalysisReport,
      '技术方案': !!this.technicalProposal,
      '风险评估': !!this.riskAssessmentReport,
      '财务指标': !!this.financialMetrics,
      '现金流分析': !!this.cashFlowResult,
      '敏感度分析': !!this.sensitivityResult,
    };

    const complete = Object.keys(required).filter(key => required[key as keyof typeof required]);
    const incomplete = Object.keys(required).filter(key => !required[key as keyof typeof required]);

    return {
      complete,
      incomplete,
      overall: Math.round((complete.length / Object.keys(required).length) * 100),
    };
  }

  // ============ 导出功能 ============

  /**
   * 导出为JSON（用于调试或缓存）
   */
  toJSON(): object {
    return {
      project: {
        id: this.project.id,
        name: this.project.name,
        ownerInfo: this.project.ownerInfo,
        facilityInfo: this.project.facilityInfo,
        tariffDetail: this.project.tariffDetail,
      },
      agentReports: {
        dueDiligence: this.dueDiligenceReport,
        policyAnalysis: this.policyAnalysisReport,
        technicalProposal: this.technicalProposal,
        riskAssessment: this.riskAssessmentReport,
      },
      calculations: {
        financialMetrics: this.financialMetrics,
        cashFlowResult: this.cashFlowResult,
        sensitivityResult: this.sensitivityResult,
      },
      metadata: {
        completeness: this.getCompletenessReport(),
        validationErrors: this.validationErrors,
      },
    };
  }

  /**
   * 导出摘要（用于进度显示）
   */
  getSummary(): string {
    const report = this.getCompletenessReport();
    return `数据完整性: ${report.overall}% (${report.complete.length}/${report.complete.length + report.incomplete.length} 项完成)`;
  }
}
