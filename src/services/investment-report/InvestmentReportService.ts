/**
 * 投资报告生成服务 - 主编排器
 *
 * 职责：协调规则引擎和AI智能体，生成完整的投资评估报告
 *
 * 架构：
 * - 规则引擎层：处理确定性计算（IRR、NPV、现金流、敏感度）
 * - AI智能体层：处理分析性任务（尽调、政策、风险、叙述）
 *
 * 执行流程：
 * 1. collectData() - 收集所有必要数据
 * 2. runAgents() - 并行执行AI智能体（部分并行）
 * 3. runCalculations() - 并行执行规则引擎计算
 * 4. generateNarratives() - 并行生成报告叙述
 * 5. generatePDF() - 生成PDF报告
 * 6. 返回完整报告
 */

import { ReportDataContext } from './ReportDataContext';
import { PDFGenerator } from './PDFGenerator';
import { REPORT_STRUCTURE } from './templates';
import {
  AgentExecutionError,
  wrapUnknownAgentError,
  getErrorMessage,
  isInvestmentReportError,
} from './errors';

// Import all AI agents for investment report generation
import { DueDiligenceAgent } from '../agents/DueDiligenceAgent';
import { PolicyAnalysisAgent } from '../agents/PolicyAnalysisAgent';
import { TechnicalProposalAgent } from '../agents/TechnicalProposalAgent';
import { RiskAssessmentAgent } from '../agents/RiskAssessmentAgent';
import { ReportNarrativeAgent } from '../agents/ReportNarrativeAgent';

// Import types for the agents
// 使用现有的计算引擎
import { FinancialCalculator } from '@/domain/services/FinancialCalculator';
import { CashFlowCalculator } from '@/domain/services/CashFlowCalculator';
import { SensitivityAnalyzer } from '@/domain/services/SensitivityAnalyzer';
import { CalculationEngine } from '@/domain/services/CalculationEngine';
import { Project } from '@/domain/models/Project';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';

export interface ReportGenerationOptions {
  onProgress?: (step: string, progress: number) => void;
  enableAgent?: {
    dueDiligence?: boolean;
    policyAnalysis?: boolean;
    technicalProposal?: boolean;
    riskAssessment?: boolean;
    reportNarrative?: boolean;
  };
  fallbackToMock?: boolean; // 当AI服务失败时是否回退到mock数据
}

export interface InvestmentReportResult {
  reportId: string;
  generatedAt: Date;
  dataContext: ReportDataContext;
  narratives: Record<string, string>;
  pdfBlob?: Blob;
  pdfUrl?: string;
  metadata: {
    generationTime: number; // 毫秒
    agentsExecuted: string[];
    calculationsExecuted: string[];
    errors: Array<{
      component: string;
      error: string;
      fallback: string;
      recoverable?: boolean;
    }>;
  };
}

export class InvestmentReportService {
  private dueDiligenceAgent: DueDiligenceAgent;
  private policyAnalysisAgent: PolicyAnalysisAgent;
  private technicalProposalAgent: TechnicalProposalAgent;
  private riskAssessmentAgent: RiskAssessmentAgent;
  private reportNarrativeAgent: ReportNarrativeAgent;

  private financialCalculator: FinancialCalculator;
  private cashFlowCalculator: CashFlowCalculator;
  private sensitivityAnalyzer: SensitivityAnalyzer;
  private calculationEngine: CalculationEngine;

  constructor() {
    // 初始化AI智能体
    this.dueDiligenceAgent = new DueDiligenceAgent();
    this.policyAnalysisAgent = new PolicyAnalysisAgent();
    this.technicalProposalAgent = new TechnicalProposalAgent();
    this.riskAssessmentAgent = new RiskAssessmentAgent();
    this.reportNarrativeAgent = new ReportNarrativeAgent();

    // 初始化计算引擎（使用现有的）
    this.financialCalculator = new FinancialCalculator();
    this.cashFlowCalculator = new CashFlowCalculator();
    this.sensitivityAnalyzer = new SensitivityAnalyzer();
    this.calculationEngine = new CalculationEngine();

    // PDF生成器（后续实现，暂时使用占位符）
    // this.pdfGenerator = new PDFGenerator();
  }

  /**
   * 生成完整投资评估报告
   */
  async generateReport(
    project: Project,
    options: ReportGenerationOptions = {}
  ): Promise<InvestmentReportResult> {
    const startTime = Date.now();
    const reportId = `report-${project.id}-${Date.now()}`;

    // 初始化共享上下文
    const context = new ReportDataContext(project);
    const errors: Array<{ component: string; error: string; fallback: string }> = [];

    const agentsExecuted: string[] = [];
    const calculationsExecuted: string[] = [];

    try {
      // 步骤1: 收集基础数据
      options.onProgress?.('collecting_data', 10);
      await this.collectData(context);

      // 步骤2: 并行执行AI智能体（部分并行）
      options.onProgress?.('running_agents', 20);
      const executedAgents = await this.runAgents(context, options.enableAgent || {}, errors);
      agentsExecuted.push(...executedAgents);

      // 步骤3: 并行执行规则引擎计算
      options.onProgress?.('running_calculations', 60);
      await this.runCalculations(context);

      // 步骤4: 生成报告叙述
      options.onProgress?.('generating_narratives', 80);
      const narratives = await this.generateNarratives(context, options.enableAgent || {});

      // 步骤5: 生成PDF
      options.onProgress?.('generating_pdf', 90);
      const { pdfBlob, pdfUrl } = await this.generatePDF(context, narratives);

      options.onProgress?.('complete', 100);

      const generationTime = Date.now() - startTime;

      return {
        reportId,
        generatedAt: new Date(),
        dataContext: context,
        narratives,
        pdfBlob,
        pdfUrl,
        metadata: {
          generationTime,
          agentsExecuted,
          calculationsExecuted,
          errors,
        },
      };
    } catch (error) {
      options.onProgress?.('error', 0);

      // Wrap unknown errors in AgentExecutionError for better tracking
      const reportError = wrapUnknownAgentError(error, 'InvestmentReportService', 'generateReport', '报告生成失败');
      console.error('[InvestmentReportService] Generation failed:', reportError.toLogObject());
      throw reportError;
    }
  }

  /**
   * 步骤1: 收集基础数据
   */
  private async collectData(context: ReportDataContext): Promise<void> {
    // 从项目实体中提取基础数据
    context.collectBasicData();

    // 验证数据完整性
    context.validate();
  }

  /**
   * 步骤2: 执行AI智能体（并行+串行混合）
   *
   * 执行策略：
   * - 尽调、政策、技术Agent可以并行
   * - 风险Agent必须等待其他Agent完成
   * - 叙述Agent在所有分析完成后执行
   */
  private async runAgents(
    context: ReportDataContext,
    enableAgent: Record<string, boolean | undefined>,
    errors: Array<{ component: string; error: string; fallback: string }>
  ): Promise<string[]> {
    const agentsExecuted: string[] = [];

    // 第一阶段：并行执行（尽调、政策、技术）
    const phase1Promises: Promise<void>[] = [];

    if (enableAgent.dueDiligence !== false) {
      phase1Promises.push(
        this.executeAgent('dueDiligence', async () => {
          const ownerInfo = context.project.ownerInfo;
          const result = await this.dueDiligenceAgent.execute({
            companyName: ownerInfo?.companyName || '',
            taxNumber: ownerInfo?.taxNumber,
            unifiedSocialCreditCode: ownerInfo?.unifiedSocialCreditCode,
            searchDepth: 'standard',
          });
          context.setDueDiligenceReport(result);
        }, errors, context, agentsExecuted)
      );
    }

    if (enableAgent.policyAnalysis !== false) {
      phase1Promises.push(
        this.executeAgent('policyAnalysis', async () => {
          const result = await this.policyAnalysisAgent.analyze({
            province: context.project.province,
            tariffDetail: context.project.tariffDetail,
          });
          context.setPolicyAnalysisReport(result);
        }, errors, context, agentsExecuted)
      );
    }

    if (enableAgent.technicalProposal !== false) {
      phase1Promises.push(
        this.executeAgent('technicalProposal', async () => {
          const result = await this.technicalProposalAgent.generateProposal(
            context.project.facilityInfo!,
            context.project.tariffDetail!,
            context.project.ownerInfo!
          );
          context.setTechnicalProposal(result);
        }, errors, context, agentsExecuted)
      );
    }

    // 等待第一阶段完成
    await Promise.all(phase1Promises);

    // 第二阶段：风险评估（依赖第一阶段结果）
    if (enableAgent.riskAssessment !== false) {
      await this.executeAgent('riskAssessment', async () => {
        const result = await this.riskAssessmentAgent.assessRisks({
          dueDiligenceReport: context.getDueDiligenceReport(),
          policyAnalysisReport: context.getPolicyAnalysisReport(),
          technicalProposal: context.getTechnicalProposal(),
          projectInfo: context.project,
        });
        context.setRiskAssessmentReport(result);
      }, errors, context, agentsExecuted);
    }

    return agentsExecuted;
  }

  /**
   * 执行单个智能体（带错误处理和回退）
   */
  private async executeAgent(
    agentName: string,
    agentFn: () => Promise<void>,
    errors: Array<{ component: string; error: string; fallback: string }>,
    context?: ReportDataContext,
    agentsExecuted?: string[]
  ): Promise<void> {
    // Track that this agent was attempted (regardless of success/failure)
    if (agentsExecuted) {
      agentsExecuted.push(`${this.capitalize(agentName)}Agent`);
    }

    try {
      await agentFn();
    } catch (error) {
      // Wrap unknown errors in AgentExecutionError for better tracking
      const agentError = wrapUnknownAgentError(error, agentName, 'execute', `${agentName} agent执行失败`);
      console.error(`[InvestmentReportService] ${agentName} 执行失败:`, agentError.toLogObject());

      errors.push({
        component: agentName,
        error: getErrorMessage(error),
        fallback: '使用mock数据或跳过该组件',
        // Mark if error is recoverable (e.g., timeout)
        recoverable: agentError.isRecoverable(),
      });

      // 回退策略：根据智能体类型决定回退方案
      if (context) {
        await this.fallbackForAgent(agentName, context);
      }
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 智能体失败时的回退策略
   */
  private async fallbackForAgent(
    agentName: string,
    context: ReportDataContext
  ): Promise<void> {
    console.warn(`[InvestmentReportService] ${agentName} 回退到简化模式`);

    switch (agentName) {
      case 'dueDiligence': {
        // 尽调Agent回退：基于输入数据生成基础报告
        const ownerInfo = context.project.ownerInfo;
        const fallbackReport = {
          companyInfo: {
            name: ownerInfo?.companyName || '未知公司',
            registrationNumber: ownerInfo?.taxNumber,
            legalRepresentative: '未调查',
            registeredCapital: 0,
            establishmentDate: '未知',
            businessScope: [],
            address: ownerInfo?.address,
            industry: '未知',
            scale: 'small' as const,
          },
          creditRating: {
            level: 'N/A',
            score: 50,
            factors: ['AI服务不可用，无法进行信用评估'],
          },
          financialHealth: {
            status: 'fair' as const,
            indicators: {
              profitability: '未评估',
              liquidity: '未评估',
              solvency: '未评估',
              efficiency: '未评估',
            },
          },
          paymentHistory: {
            onTimeRate: 0,
            latePayments: 0,
            defaults: 0,
            litigation: 0,
          },
          businessRisks: [],
          recommendations: [
            '建议进行人工尽职调查',
            '要求业主提供财务报表',
            '核查银行信用记录',
          ],
          confidence: 0,
          reportGenerated: new Date().toISOString(),
        };
        context.setDueDiligenceReport(fallbackReport);
        break;
      }

      case 'policyAnalysis': {
        // 政策Agent回退：基于当前电价数据进行基础分析
        const tariffDetail = context.project.tariffDetail;
        const priceSpread = (tariffDetail?.peakPrice || 0) - (tariffDetail?.valleyPrice || 0);
        const fallbackReport = {
          currentPolicy: {
            province: context.project.province,
            peakPrice: tariffDetail?.peakPrice || 0,
            valleyPrice: tariffDetail?.valleyPrice || 0,
            flatPrice: tariffDetail?.flatPrice || 0,
            priceSpread,
            policyType: tariffDetail?.policyType || 'unknown',
            effectiveDate: new Date().toISOString().split('T')[0],
          },
          stability: {
            rating: 'unknown',
            confidence: 0,
            factors: ['AI服务不可用，无法评估政策稳定性'],
          },
          trends: [],
          risks: [],
          opportunities: [],
          impact: {
            onIRR: 0,
            onPaybackPeriod: 0,
            notes: 'AI服务不可用，无法计算政策影响',
          },
          recommendations: [
            '人工核查当地电力政策',
            '关注政策变化通知',
            '预留政策风险缓冲',
          ],
          metadata: {
            dataSource: 'fallback',
            reportGenerated: new Date().toISOString(),
          },
        };
        context.setPolicyAnalysisReport(fallbackReport);
        break;
      }

      case 'technicalProposal': {
        // 技术Agent回退：使用现有CapacityRecommender
        try {
          const { recommendCapacity } = await import('@/domain/services/CapacityRecommender');
          const recommendation = await recommendCapacity({
            ownerInfo: context.project.ownerInfo!,
            facilityInfo: context.project.facilityInfo!,
            tariffDetail: context.project.tariffDetail!,
          });

          const fallbackProposal = {
            recommended: {
              capacity: recommendation.standard.recommendedCapacity,
              power: recommendation.standard.recommendedPower,
              duration: recommendation.standard.recommendedCapacity / recommendation.standard.recommendedPower,
              technology: 'Lithium-ion (LiFePO4)',
              brands: ['宁德时代 (CATL)', '比亚迪 (BYD)'],
              chargeStrategy: 'Peak-valley arbitrage',
            },
            alternatives: [],
            expectedPerformance: {
              annualThroughput: 0,
              systemEfficiency: 0.90,
              availability: 0.97,
              year10Capacity: 0.817,
            },
            implementation: {
              phases: [],
              totalTimeline: '8-10周',
              criticalPath: [],
            },
            technologySelection: {
              battery: {
                type: 'Lithium-ion',
                chemistry: 'LiFePO4 (磷酸铁锂)',
                rationale: 'AI服务不可用，使用默认推荐',
              },
              pcs: {
                type: 'Grid-following PCS',
                efficiency: '≥92%',
                rationale: '标准配置',
              },
              bms: {
                type: 'Distributed BMS',
                features: ['电芯级监控', '均衡控制', '热管理'],
                rationale: '标准配置',
              },
            },
            risks: ['AI服务不可用，技术方案基于默认推荐'],
            recommendations: ['建议进行人工技术评估'],
            metadata: {
              dataSource: 'CapacityRecommender (fallback)',
              reportGenerated: new Date().toISOString(),
              confidence: 0.6,
            },
          };
          context.setTechnicalProposal(fallbackProposal);
        } catch (error) {
          console.error('CapacityRecommender fallback also failed:', error);
          // 最基础的回退数据
          context.setTechnicalProposal({
            recommended: {
              capacity: 1,
              power: 0.5,
              duration: 2,
              technology: 'Lithium-ion (LiFePO4)',
              brands: [],
              chargeStrategy: 'Peak-valley arbitrage',
            },
            alternatives: [],
            expectedPerformance: {
              annualThroughput: 0,
              systemEfficiency: 0.90,
              availability: 0.97,
              year10Capacity: 0.817,
            },
            implementation: {
              phases: [],
              totalTimeline: '待定',
              criticalPath: [],
            },
            technologySelection: {
              battery: {
                type: 'Lithium-ion',
                chemistry: 'LiFePO4 (磷酸铁锂)',
                rationale: '默认推荐',
              },
              pcs: {
                type: 'Grid-following PCS',
                efficiency: '≥92%',
                rationale: '标准配置',
              },
              bms: {
                type: 'Distributed BMS',
                features: [],
                rationale: '标准配置',
              },
            },
            risks: ['技术评估服务不可用'],
            recommendations: ['建议人工技术评估'],
            metadata: {
              dataSource: 'minimal fallback',
              reportGenerated: new Date().toISOString(),
              confidence: 0,
            },
          });
        }
        break;
      }

      case 'riskAssessment': {
        // 风险Agent回退：基于规则引擎生成基础风险评分
        const fallbackReport = {
          riskMatrix: {
            low: ['数据不足，无法评估低风险项'],
            medium: ['技术风险：储能系统性能不确定性'],
            high: ['政策风险：电价政策可能变化'],
            critical: [],
          },
          risks: [
            {
              category: 'policy' as const,
              source: '政策分析',
              description: '电价政策可能发生变化，影响项目收益',
              likelihood: 0.5,
              impact: 0.7,
              score: 35,
              level: 'medium' as const,
              mitigation: '密切关注政策变化，预留收益缓冲',
            },
            {
              category: 'technical' as const,
              source: '技术评估',
              description: '储能系统实际性能可能与预期有偏差',
              likelihood: 0.4,
              impact: 0.6,
              score: 24,
              level: 'low' as const,
              mitigation: '选择可靠设备，建立性能监测',
            },
          ],
          overallRating: {
            score: 30,
            level: 'medium' as const,
            confidence: 0.3,
          },
          mitigationStrategies: [
            {
              aspect: '合同层面',
              strategy: '设置分阶段付款条款，严格违约责任',
              effectiveness: 'high' as const,
              cost: 'low' as const,
            },
            {
              aspect: '技术层面',
              strategy: '选择可靠品牌设备，预留容量冗余',
              effectiveness: 'high' as const,
              cost: 'medium' as const,
            },
          ],
          contingencyPlans: [
            {
              trigger: '电价政策发生重大不利变化',
              actions: ['重新评估项目可行性', '调整系统配置', '寻求政策补偿'],
              expectedOutcome: '最大程度减少损失',
            },
          ],
          metadata: {
            dataSource: 'rule-based fallback',
            reportGenerated: new Date().toISOString(),
            totalRisks: 2,
            riskDistribution: {
              financial: 0,
              technical: 1,
              policy: 1,
              credit: 0,
              operational: 0,
            },
          },
        };
        context.setRiskAssessmentReport(fallbackReport);
        break;
      }

      default:
        console.warn(`[InvestmentReportService] Unknown agent type: ${agentName}`);
    }
  }

  /**
   * 步骤3: 执行规则引擎计算（全部并行）
   */
  private async runCalculations(context: ReportDataContext): Promise<void> {
    // 从 Project 实体转换为 ProjectInput
    const projectInput = this.convertProjectToInput(context.project);

    // 加载省份数据
    const provinceData = await this.loadProvinceData(context.project.province);

    // 并行执行所有计算
    const [cashFlowResult, sensitivityResult] = await Promise.all([
      // 1. 现金流计算
      this.cashFlowCalculator.calculateCashFlows(projectInput, provinceData),
      // 2. 敏感度分析
      this.sensitivityAnalyzer.analyzeSensitivity(projectInput),
    ]);

    // 3. 财务指标（基于现金流结果）
    const systemCapacity = projectInput.systemSize.capacity * 1000; // MW -> kWh
    const dod = projectInput.operatingParams.depthOfDischarge ?? 0.9;
    const cyclesPerDay = projectInput.operatingParams.cyclesPerDay ?? 1.5;
    const discountRate = 0.08; // 8%

    const financialMetrics = this.financialCalculator.calculateAllMetrics(
      cashFlowResult,
      systemCapacity,
      dod,
      cyclesPerDay,
      discountRate
    );

    // 将结果写入上下文
    context.setFinancialMetrics(financialMetrics);
    context.setCashFlowAnalysis(cashFlowResult);
    context.setSensitivityMatrix(sensitivityResult);
  }

  /**
   * 将 Project 实体转换为 ProjectInput
   */
  private convertProjectToInput(project: Project): ProjectInput {
    // Convert Project entity to ProjectInput format for calculation engines
    return {
      projectName: project.projectName,
      province: project.province,
      systemSize: project.systemSize,
      costs: {
        // New schema format (cost per unit)
        batteryCostPerKwh: project.costs.batteryCostPerKwh || 1.2,
        pcsCostPerKw: project.costs.pcsCostPerKw || 0.3,
        bmsCostPerKwh: project.costs.bmsCostPerKwh || 0.1,
        emsCostPerKwh: project.costs.emsCostPerKwh || 0.05,
        thermalMgmtCostPerKwh: project.costs.thermalMgmtCostPerKwh || 0.08,
        fireProtectionCostPerKwh: project.costs.fireProtectionCostPerKwh || 0.05,
        containerCostPerKwh: project.costs.containerCostPerKwh || 0.1,
        installationCostPerKw: project.costs.installationCostPerKw || 0.15,
        otherCostPerKwh: project.costs.otherCostPerKwh || 0.02,
        // Fixed costs
        designFee: project.costs.designFee || 50000,
        permitFee: project.costs.permitFee || 30000,
        gridConnectionFee: project.costs.gridConnectionFee || 100000,
        constructionFee: project.costs.constructionFee || 100000,
        regulatoryFee: project.costs.regulatoryFee || 20000,
        trainingCost: project.costs.trainingCost || 30000,
        utilitiesCost: project.costs.utilitiesCost || 20000,
        landLeaseCost: project.costs.landLeaseCost || 100000,
        salesExpenses: project.costs.salesExpenses || 303818,
        // Tax rates
        vatRate: project.costs.vatRate || 0.06,
        surtaxRate: project.costs.surtaxRate || 0.12,
        corporateTaxRate: project.costs.corporateTaxRate || 0.25,
      },
      financing: project.financing || {
        hasLoan: false,
        equityRatio: 1.0,
        loanInterestRate: 0.045,
        loanTerm: 10,
        taxHolidayYears: 6,
      },
      operatingParams: {
        systemEfficiency: project.operatingParams.systemEfficiency || 0.88,
        depthOfDischarge: project.operatingParams.depthOfDischarge || 0.9,
        cyclesPerDay: project.operatingParams.cyclesPerDay || 1.5,
        degradationRate: project.operatingParams.degradationRate || 0.02,
        availabilityPercent: project.operatingParams.availabilityPercent || 95,
      },
      // Business fields
      ownerInfo: project.ownerInfo,
      facilityInfo: project.facilityInfo,
      tariffDetail: project.tariffDetail,
      technicalProposal: project.technicalProposal,
    };
  }

  /**
   * 加载省份数据
   * 当省份数据不存在时，返回合理的默认值
   */
  private async loadProvinceData(provinceCode: string): Promise<any> {
    try {
      // 使用现有的 ProvinceDataRepository
      const { provinceDataRepository } = await import('@/domain/repositories/ProvinceDataRepository');
      const province = await provinceDataRepository.getProvince(provinceCode);
      if (province) {
        return province;
      }
    } catch (error) {
      console.warn(`[InvestmentReportService] Failed to load province data for ${provinceCode}:`, error);
    }

    // 返回默认省份数据（基于全国平均水平）
    console.log(`[InvestmentReportService] Using default province data for ${provinceCode}`);
    return this.getDefaultProvinceData(provinceCode);
  }

  /**
   * 获取默认省份数据（用于回退）
   */
  private getDefaultProvinceData(provinceCode: string): any {
    // 根据省份代码映射到区域
    const regionMap: Record<string, string> = {
      'guangdong': 'south',
      'guangxi': 'south',
      'hainan': 'south',
      'fujian': 'south',
      'jiangxi': 'south',
      'hunan': 'south',
      'yunnan': 'south',
      'guizhou': 'south',
      'sichuan': 'southwest',
      'chongqing': 'southwest',
      'hubei': 'central',
      'henan': 'central',
      'anhui': 'central',
      'jiangsu': 'east',
      'zhejiang': 'east',
      'shanghai': 'east',
      'shandong': 'east',
      'hebei': 'north',
      'beijing': 'north',
      'tianjin': 'north',
      'shanxi': 'north',
      'neimenggu': 'north',
      'liaoning': 'northeast',
      'jilin': 'northeast',
      'heilongjiang': 'northeast',
      'shaanxi': 'northwest',
      'gansu': 'northwest',
      'qinghai': 'northwest',
      'ningxia': 'northwest',
      'xinjiang': 'northwest',
      'xizang': 'southwest',
    };

    const region = regionMap[provinceCode] || 'east';

    // 区域默认电价（基于行业平均水平）
    const regionDefaults: Record<string, any> = {
      south: {
        peakPrice: 1.15,
        valleyPrice: 0.35,
        flatPrice: 0.65,
      },
      east: {
        peakPrice: 1.20,
        valleyPrice: 0.40,
        flatPrice: 0.70,
      },
      north: {
        peakPrice: 1.10,
        valleyPrice: 0.38,
        flatPrice: 0.68,
      },
      central: {
        peakPrice: 1.08,
        valleyPrice: 0.42,
        flatPrice: 0.66,
      },
      southwest: {
        peakPrice: 1.05,
        valleyPrice: 0.40,
        flatPrice: 0.64,
      },
      northwest: {
        peakPrice: 1.02,
        valleyPrice: 0.38,
        flatPrice: 0.62,
      },
      northeast: {
        peakPrice: 1.12,
        valleyPrice: 0.45,
        flatPrice: 0.68,
      },
    };

    const defaults = regionDefaults[region] || regionDefaults.east;

    return {
      provinceCode,
      provinceName: this.getProvinceName(provinceCode),
      region,
      pricing: {
        peakPrice: defaults.peakPrice,
        valleyPrice: defaults.valleyPrice,
        flatPrice: defaults.flatPrice,
      },
      // 24小时电价分布
      hourlyPrices: Array.from({ length: 24 }, (_, hour) => {
        let period: 'peak' | 'valley' | 'flat' = 'flat';
        if (hour >= 8 && hour < 12 || hour >= 14 && hour < 17) {
          period = 'peak';
        } else if (hour >= 0 && hour < 8 || hour >= 23) {
          period = 'valley';
        }
        return {
          hour,
          price: period === 'peak' ? defaults.peakPrice : period === 'valley' ? defaults.valleyPrice : defaults.flatPrice,
          period,
        };
      }),
      // 容量补偿（默认不可用）
      capacityCompensation: {
        available: false,
        type: 'none',
        price: 0,
      },
      // 需求响应（默认不可用）
      demandResponse: {
        available: false,
        price: 0,
        annualRevenue: 0,
      },
      // 辅助服务（默认不可用）
      auxiliaryServices: {
        available: false,
        peaking: {
          price: 0,
          availableHours: 0,
        },
        frequency: {
          price: 0,
          availableHours: 0,
        },
        voltage: {
          price: 0,
          availableHours: 0,
        },
      },
      // 政策信息
      policy: {
        stability: 'medium',
        confidence: 0.7,
        trend: 'stable',
      },
      // 数据来源标记
      _source: 'default',
      _note: '使用默认省份数据',
    };
  }

  /**
   * 获取省份名称
   */
  private getProvinceName(provinceCode: string): string {
    const provinceNames: Record<string, string> = {
      guangdong: '广东省',
      guangxi: '广西壮族自治区',
      hainan: '海南省',
      fujian: '福建省',
      jiangxi: '江西省',
      hunan: '湖南省',
      yunnan: '云南省',
      guizhou: '贵州省',
      sichuan: '四川省',
      chongqing: '重庆市',
      hubei: '湖北省',
      henan: '河南省',
      anhui: '安徽省',
      jiangsu: '江苏省',
      zhejiang: '浙江省',
      shanghai: '上海市',
      shandong: '山东省',
      hebei: '河北省',
      beijing: '北京市',
      tianjin: '天津市',
      shanxi: '山西省',
      neimenggu: '内蒙古自治区',
      liaoning: '辽宁省',
      jilin: '吉林省',
      heilongjiang: '黑龙江省',
      shaanxi: '陕西省',
      gansu: '甘肃省',
      qinghai: '青海省',
      ningxia: '宁夏回族自治区',
      xinjiang: '新疆维吾尔自治区',
      xizang: '西藏自治区',
    };
    return provinceNames[provinceCode] || provinceCode;
  }

  /**
   * 步骤4: 生成报告叙述（使用新的 6 节结构）
   *
   * 新的章节结构：
   * 1. executive_summary - 执行摘要
   * 2. project_overview - 项目概况（合并了业主背景调查）
   * 3. financial_analysis - 财务分析
   * 4. policy_environment - 政策环境
   * 5. risk_assessment - 风险评估
   * 6. investment_recommendation - 投资建议
   */
  private async generateNarratives(
    context: ReportDataContext,
    enableAgent: { reportNarrative?: boolean } = {}
  ): Promise<Record<string, string>> {
    // 使用新的报告结构
    const chapters = REPORT_STRUCTURE.map(section => section.id);

    // 如果 AI 被禁用，使用模板回退
    if (!enableAgent.reportNarrative) {
      console.log('[InvestmentReportService] AI disabled, using template fallback');
      return this.generateTemplateNarratives(context);
    }

    // 并行生成所有章节
    const narratives = await Promise.all(
      chapters.map(chapter =>
        this.reportNarrativeAgent.generateChapter(chapter, context)
      )
    );

    // 组装成章节映射
    return chapters.reduce((acc, chapter, index) => {
      acc[chapter] = narratives[index];
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * 生成模板回退的叙述（不使用 AI）
   */
  private generateTemplateNarratives(context: ReportDataContext): Record<string, string> {
    const chapters = REPORT_STRUCTURE.map(section => section.id);
    const project = context.project;
    const fm = context.getFinancialMetrics();

    // 简单的模板回退
    return chapters.reduce((acc, chapter) => {
      switch (chapter) {
        case 'executive_summary':
          acc[chapter] = `## 执行摘要

### 核心结论

本项目 ${project.projectName} 是一个位于${project.province}的工商业储能系统投资机会。经过详细分析，该项目展现出良好的投资价值。

### 关键指标

- **内部收益率 (IRR)**: ${fm?.irr?.toFixed(2) || 'N/A'}%
- **净现值 (NPV)**: ¥${fm?.npv?.toFixed(0) || 'N/A'}万
- **投资回收期**: ${fm?.paybackPeriodStatic?.toFixed(1) || 'N/A'}年
- **储能平准化成本 (LCOS)**: ¥${fm?.lcoc?.toFixed(2) || 'N/A'}/kWh

### 主要优势

1. 峰谷价差套利空间大
2. 政策支持力度强
3. 投资回报周期合理

### 投资建议

基于以上分析，该项目具有良好的投资价值，建议考虑投资。`;
          break;

        case 'project_overview':
          acc[chapter] = `## 项目概况

### 项目基本信息

- **项目名称**: ${project.projectName}
- **项目地点**: ${project.province}
- **系统容量**: ${project.systemSize.capacity} kWh
- **额定功率**: ${project.systemSize.power} kW

### 项目背景

该项目旨在通过配置工商业储能系统，实现峰谷电价套利，降低用电成本，提升能源利用效率。

### 系统配置

系统采用先进的锂电池储能技术，配备完善的电池管理系统（BMS）和能量管理系统（EMS），确保系统安全稳定运行。`;
          break;

        case 'financial_analysis':
          acc[chapter] = `## 财务分析

### 关键财务指标

- **内部收益率 (IRR)**: ${fm?.irr?.toFixed(2)}%
- **净现值 (NPV)**: ¥${fm?.npv?.toFixed(0)}万
- **投资回收期**: ${fm?.paybackPeriodStatic?.toFixed(1)}年
- **储能平准化成本 (LCOS)**: ¥${fm?.lcoc?.toFixed(2)}/kWh

### 现金流分析

项目在 25 年运营期内产生稳定的现金流，具有良好的盈利能力。

### 投资回报

根据测算，项目内部收益率达到 ${fm?.irr?.toFixed(2)}%，投资回收期约 ${fm?.paybackPeriodStatic?.toFixed(1)} 年，符合行业投资标准。`;
          break;

        case 'policy_environment':
          acc[chapter] = `## 政策环境

### 国家政策支持

国家层面高度重视储能产业发展，出台了一系列支持政策，为储能项目提供了良好的政策环境。

### 地方政策

${project.province} 地方政府积极支持储能项目发展，可能存在相关补贴政策。

### 市场环境

当前电力市场改革深入推进，峰谷电价差逐步扩大，为储能项目提供了盈利空间。`;
          break;

        case 'risk_assessment':
          acc[chapter] = `## 风险评估

### 技术风险

- 电池性能衰减风险：中等
- 系统集成风险：低

### 市场风险

- 电价政策变化风险：中等
- 电力市场需求波动：低

### 政策风险

- 补贴政策调整风险：低

### 运营风险

- 设备维护风险：低
- 安全管理风险：低

### 风险缓解措施

建议建立完善的运维体系，定期进行设备检修，确保系统稳定运行。`;
          break;

        case 'investment_recommendation':
          acc[chapter] = `## 投资建议

### 综合评估

经过全面分析，该项目具有良好的投资价值。

### 投资建议

**推荐投资**

### 推荐理由

1. 财务指标优秀：内部收益率 ${fm?.irr?.toFixed(2)}%，高于行业平均水平
2. 政策环境良好：国家和地方政策支持
3. 技术成熟可靠：储能技术已得到广泛应用
4. 风险可控：各类风险均处于可控范围

### 行动建议

1. 尽快完成项目立项和审批
2. 选择优质设备供应商
3. 建立完善的运维体系
4. 密切关注政策变化

### 免责声明

本投资建议基于当前可获得的信息做出。实际投资决策应考虑更详细的尽职调查和市场调研。`;
          break;

        default:
          acc[chapter] = `## ${chapter}\n\n该章节内容待完善。`;
      }
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * 步骤5: 生成PDF
   */
  private async generatePDF(
    context: ReportDataContext,
    narratives: Record<string, string>
  ): Promise<{ pdfBlob?: Blob; pdfUrl?: string }> {
    const pdfGenerator = new PDFGenerator();
    const result = await pdfGenerator.generatePDF(context, narratives, {
      onProgress: (step, progress) => {
        console.log(`[PDF Generation] [${progress}%] ${step}`);
      },
    });

    if (result.success && result.blob) {
      return {
        pdfBlob: result.blob,
        pdfUrl: result.url,
      };
    }

    return {
      pdfBlob: undefined,
      pdfUrl: undefined,
    };
  }

  /**
   * 流式生成报告（用于进度反馈）
   */
  async *generateReportStream(
    project: Project,
    options: ReportGenerationOptions = {}
  ): AsyncGenerator<{ step: string; progress: number; message?: string }, InvestmentReportResult, unknown> {
    const startTime = Date.now();
    const reportId = `report-${project.id}-${Date.now()}`;
    const context = new ReportDataContext(project);
    const errors: Array<{ component: string; error: string; fallback: string }> = [];
    const agentsExecuted: string[] = [];

    try {
      // 步骤1
      yield { step: 'collecting_data', progress: 10, message: '收集基础数据...' };
      await this.collectData(context);

      // 步骤2
      yield { step: 'running_agents', progress: 20, message: '执行AI智能体分析...' };
      await this.runAgents(context, options.enableAgent || {}, errors);

      // 步骤3
      yield { step: 'running_calculations', progress: 60, message: '执行财务计算...' };
      await this.runCalculations(context);

      // 步骤4
      yield { step: 'generating_narratives', progress: 80, message: '生成报告叙述...' };
      const narratives = await this.generateNarratives(context);

      // 步骤5
      yield { step: 'generating_pdf', progress: 90, message: '生成PDF报告...' };
      const { pdfBlob, pdfUrl } = await this.generatePDF(context, narratives);

      yield { step: 'complete', progress: 100, message: '报告生成完成' };

      return {
        reportId,
        generatedAt: new Date(),
        dataContext: context,
        narratives,
        pdfBlob,
        pdfUrl,
        metadata: {
          generationTime: Date.now() - startTime,
          agentsExecuted,
          calculationsExecuted: [],
          errors,
        },
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      yield { step: 'error', progress: 0, message: `报告生成失败: ${errorMessage}` };

      // Re-throw with better error context if it's not already an InvestmentReportError
      if (!isInvestmentReportError(error)) {
        throw wrapUnknownAgentError(error, 'InvestmentReportService', 'generateReport', '报告生成失败');
      }
      throw error;
    }
  }
}
