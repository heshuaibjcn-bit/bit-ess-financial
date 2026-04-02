# 混合模式智能体系统设计

## 核心架构

```
InvestmentReportOrchestrator (主控编排器)
    │
    ├─→ 规则引擎层 (RuleEngineLayer)
    │   ├─ FinancialCalculator (财务计算器) ✅已有
    │   ├─ CashFlowGenerator (现金流生成器) ✅已有
    │   ├─ SensitivityAnalyzer (敏感度分析器) ✅已有
    │   └─ DataValidator (数据验证器) ✅已有
    │
    └─→ AI智能体层 (AIAgentLayer)
        ├─ DueDiligenceAgent (尽调智能体) ✅已有，需增强
        ├─ PolicyAnalysisAgent (政策分析智能体) 🆕新建
        ├─ TechnicalProposalAgent (技术方案智能体) 🆕新建
        ├─ RiskAssessmentAgent (风险评估智能体) 🆕新建
        ├─ InvestmentAdvisorAgent (投资顾问智能体) ✅已有，需增强
        └─ ReportNarrativeAgent (报告叙述智能体) 🆕新建
```

---

## 智能体职责设计

### 1. PolicyAnalysisAgent (政策分析智能体)

**职责**:
- 分析当前电价政策的稳定性和趋势
- 预测政策变化对项目收益的影响
- 识别政策风险和机会
- 提供政策应对建议

**输入**:
```typescript
interface PolicyAnalysisInput {
  province: Province;
  currentTariff: TariffDetail;
  projectDuration: number; // 年
  expectedIRR: number;
}
```

**输出**:
```typescript
interface PolicyAnalysisOutput {
  // 政策稳定性评估
  stability: {
    rating: 'stable' | 'moderate' | 'volatile';
    confidence: number; // 0-100
    factors: string[];
  };

  // 政策趋势
  trend: {
    direction: 'improving' | 'stable' | 'declining';
    keyChanges: PolicyChange[];
    timeframe: string;
  };

  // 政策影响分析
  impact: {
    onIRR: number; // 政策变化对IRR的影响
    scenarios: Scenario[];
  };

  // 政策风险
  risks: PolicyRisk[];

  // 政策机会
  opportunities: PolicyOpportunity[];

  // 应对建议
  recommendations: string[];
}
```

**实现思路**:
```typescript
class PolicyAnalysisAgent extends NanoAgent {
  async analyze(input: PolicyAnalysisInput): Promise<PolicyAnalysisOutput> {
    // 1. 收集政策数据（从PolicyDataIntegration）
    const policyData = await this.collectPolicyData(input.province);

    // 2. AI分析政策稳定性
    const stability = await this.assessStability(policyData);

    // 3. AI预测政策趋势
    const trend = await this.predictTrend(policyData);

    // 4. 规则引擎计算政策影响
    const impact = this.calculateImpact(input, trend);

    // 5. AI识别风险和机会
    const risks = await this.identifyRisks(policyData, trend);
    const opportunities = await this.identifyOpportunities(policyData);

    // 6. AI生成应对建议
    const recommendations = await this.generateRecommendations(
      stability, trend, risks, opportunities
    );

    return { stability, trend, impact, risks, opportunities, recommendations };
  }

  // 规则引擎部分：计算政策变化对IRR的影响
  private calculateImpact(
    input: PolicyAnalysisInput,
    trend: PolicyTrend
  ): PolicyImpact {
    // 使用规则引擎计算不同情景下的IRR变化
    const scenarios = [
      { name: '政策不变', priceChange: 0 },
      { name: '价差-10%', priceChange: -0.1 },
      { name: '价差+10%', priceChange: 0.1 },
      { name: '政策不利', priceChange: -0.2 },
      { name: '政策有利', priceChange: 0.2 },
    ];

    return scenarios.map(scenario => {
      const newIRR = input.expectedIRR * (1 + scenario.priceChange);
      return {
        scenario: scenario.name,
        irr: newIRR,
        delta: newIRR - input.expectedIRR,
      };
    });
  }
}
```

---

### 2. TechnicalProposalAgent (技术方案智能体)

**职责**:
- 基于项目需求推荐最优技术方案
- 评估不同技术路线的优劣
- 提供设备选型建议
- 识别技术风险

**输入**:
```typescript
interface TechnicalProposalInput {
  ownerInfo: OwnerInfo;
  facilityInfo: FacilityInfo;
  tariffDetail: TariffDetail;
  budgetConstraints?: BudgetConstraints;
  preferences?: TechnicalPreferences;
}
```

**输出**:
```typescript
interface TechnicalProposalOutput {
  // 推荐配置
  recommended: {
    capacity: number;
    power: number;
    duration: number;
    technology: TechnologyType;
    brands: BrandRecommendation[];
  };

  // 方案对比
  alternatives: TechnicalAlternative[];

  // 技术优势
  strengths: string[];

  // 技术风险
  risks: TechnicalRisk[];

  // 预期性能
  expectedPerformance: {
    annualThroughput: number;
    systemEfficiency: number;
    availability: number;
    year10Capacity: number;
  };

  // 实施建议
  implementation: {
    phases: ImplementationPhase[];
    timeline: string;
    criticalPath: string[];
  };
}
```

**实现思路**:
```typescript
class TechnicalProposalAgent extends NanoAgent {
  async propose(input: TechnicalProposalInput): Promise<TechnicalProposalOutput> {
    // 1. 规则引擎：计算最优容量（已有CapacityRecommender）
    const baseRecommendation = recommendCapacity({
      ownerInfo: input.ownerInfo,
      facilityInfo: input.facilityInfo,
      tariffDetail: input.tariffDetail,
    });

    // 2. AI分析：推荐技术路线
    const technology = await this.recommendTechnology(input, baseRecommendation);

    // 3. AI推荐：设备品牌
    const brands = await this.recommendBrands(technology, baseRecommendation);

    // 4. 规则引擎：计算预期性能
    const expectedPerformance = this.calculatePerformance(baseRecommendation);

    // 5. AI识别：技术风险
    const risks = await this.identifyRisks(input, baseRecommendation, brands);

    // 6. AI规划：实施阶段
    const implementation = await this.planImplementation(baseRecommendation);

    // 7. AI生成：替代方案
    const alternatives = await this.generateAlternatives(baseRecommendation);

    return {
      recommended: {
        ...baseRecommendation,
        technology,
        brands,
      },
      alternatives,
      strengths: await this.identifyStrengths(baseRecommendation),
      risks,
      expectedPerformance,
      implementation,
    };
  }

  // 规则引擎部分：计算预期性能
  private calculatePerformance(recommendation: TechnicalProposal): {
    annualThroughput: number;
    systemEfficiency: number;
    availability: number;
    year10Capacity: number;
  } {
    const { capacity, power, cyclesPerDay, degradationRate, systemEfficiency } = recommendation;

    const annualThroughput = capacity * cyclesPerDay * 365;
    const availability = 0.97; // 系统可用率
    const year10Capacity = capacity * Math.pow(1 - degradationRate, 10);

    return {
      annualThroughput,
      systemEfficiency,
      availability,
      year10Capacity,
    };
  }
}
```

---

### 3. RiskAssessmentAgent (风险评估智能体)

**职责**:
- 综合各方信息识别项目风险
- 评估风险等级和影响
- 提供风险缓释策略
- 生成风险矩阵

**输入**:
```typescript
interface RiskAssessmentInput {
  // 来自其他智能体的分析结果
  dueDiligence: DueDiligenceOutput;
  policyAnalysis: PolicyAnalysisOutput;
  technicalProposal: TechnicalProposalOutput;
  financialAnalysis: FinancialAnalysisOutput;

  // 项目基础信息
  projectInfo: {
    province: Province;
    scale: SystemSize;
    investment: number;
  };
}
```

**输出**:
```typescript
interface RiskAssessmentOutput {
  // 风险矩阵
  riskMatrix: RiskMatrix;

  // 详细风险列表
  risks: DetailedRisk[];

  // 整体风险评级
  overallRating: {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  };

  // 缓释策略
  mitigationStrategies: MitigationStrategy[];

  // 应急预案
  contingencyPlans: ContingencyPlan[];
}
```

**实现思路**:
```typescript
class RiskAssessmentAgent extends NanoAgent {
  async assess(input: RiskAssessmentInput): Promise<RiskAssessmentOutput> {
    // 1. 收集各方风险信息
    const creditRisks = this.extractCreditRisks(input.dueDiligence);
    const policyRisks = input.policyAnalysis.risks;
    const technicalRisks = await this.identifyTechnicalRisks(input.technicalProposal);
    const financialRisks = await this.identifyFinancialRisks(input.financialAnalysis);

    // 2. 规则引擎：计算风险评分
    const allRisks = [...creditRisks, ...policyRisks, ...technicalRisks, ...financialRisks];
    const scoredRisks = allRisks.map(risk => ({
      ...risk,
      score: this.calculateRiskScore(risk), // 规则引擎
    }));

    // 3. 规则引擎：生成风险矩阵
    const riskMatrix = this.generateRiskMatrix(scoredRisks);

    // 4. 规则引擎：计算整体风险评级
    const overallRating = this.calculateOverallRating(riskMatrix);

    // 5. AI生成：缓释策略
    const mitigationStrategies = await this.generateMitigationStrategies(scoredRisks);

    // 6. AI生成：应急预案
    const contingencyPlans = await this.generateContingencyPlans(scoredRisks);

    return {
      riskMatrix,
      risks: scoredRisks,
      overallRating,
      mitigationStrategies,
      contingencyPlans,
    };
  }

  // 规则引擎：计算单个风险评分
  private calculateRiskScore(risk: Risk): number {
    // 风险评分 = 发生概率 × 影响程度 × 风险类别权重
    const probability = risk.likelihood || 0.5; // 0-1
    const impact = risk.impact || 0.5; // 0-1
    const categoryWeight = this.getCategoryWeight(risk.category);

    return Math.round(probability * impact * categoryWeight * 100);
  }

  // 规则引擎：风险类别权重
  private getCategoryWeight(category: string): number {
    const weights: Record<string, number> = {
      'financial': 0.3,      // 财务风险权重最高
      'legal': 0.2,
      'policy': 0.25,
      'operational': 0.15,
      'reputational': 0.1,
    };
    return weights[category] || 0.2;
  }
}
```

---

### 4. ReportNarrativeAgent (报告叙述智能体)

**职责**:
- 将结构化数据转化为自然语言报告
- 生成各章节的叙述性文字
- 确保报告的专业性和可读性
- 保持报告的连贯性

**输入**:
```typescript
interface NarrativeInput {
  chapter: ChapterType;
  structuredData: any; // 来自规则引擎和AI智能体的结构化数据
  targetAudience: 'investor' | 'bank' | 'internal';
  language: 'zh' | 'en';
}
```

**输出**:
```typescript
interface NarrativeOutput {
  title: string;
  content: string; // Markdown格式的章节内容
  summary: string; // 章节摘要
}
```

**实现思路**:
```typescript
class ReportNarrativeAgent extends NanoAgent {
  async generate(input: NarrativeInput): Promise<NarrativeOutput> {
    const prompt = this.buildNarrativePrompt(input);
    const response = await this.think(prompt);

    return {
      title: this.extractTitle(response),
      content: response,
      summary: this.extractSummary(response),
    };
  }

  private buildNarrativePrompt(input: NarrativeInput): string {
    const chapterInstructions = {
      'project_overview': `
        请基于项目数据生成"项目概况"章节，包括：
        - 基本信息（项目名称、地点、规模、投运时间）
        - 项目背景（建设必要性）
        - 场地条件（变压器、用电情况、可用面积）

        要求：简洁明了，2-3段文字即可。
      `,

      'owner_due_diligence': `
        请基于尽调数据生成"业主背景调查"章节，包括：
        - 企业基本信息表
        - 信用评估结论（评级、评分、说明）
        - 财务健康度评估
        - 业务风险表格
        - 合作模式说明

        要求：使用表格展示数据，结论清晰。
      `,

      'policy_analysis': `
        请基于政策分析数据生成"电价政策分析"章节，包括：
        - 当前电价结构（分时电价表、电费单组成）
        - 容量补偿政策
        - 政策稳定性分析（趋势、风险评级、应对策略）

        要求：使用表格展示电价数据，分析要有数据支撑。
      `,

      'technical_assessment': `
        请基于技术方案数据生成"技术方案评估"章节，包括：
        - 系统配置（推荐方案 vs 保守 vs 激进）
        - 技术选型（电池、PCS、BMS品牌）
        - 充放电策略
        - 预期性能指标

        要求：使用表格对比方案，技术参数要具体。
      `,

      'financial_analysis': `
        请基于财务数据生成"财务分析"章节，包括：
        - 投资估算表
        - 收入预测（10年）
        - 成本费用
        - 融资方案
        - 财务指标表（IRR、NPV等）
        - 现金流分析
        - 敏感性分析

        要求：使用多个表格，关键指标要突出显示。
      `,

      'risk_assessment': `
        请基于风险评估数据生成"风险评估"章节，包括：
        - 风险矩阵表格
        - 详细风险分析（风险1、风险2、风险3...）
        - 风险缓释策略总结

        要求：风险矩阵清晰，每个风险都要有应对措施。
      `,

      'investment_recommendation': `
        请基于所有分析生成"投资建议"章节，包括：
        - 总体评估（投资评级⭐）
        - 投资建议（是否建议投资）
        - 核心优势（3-5点）
        - 关键成功因素
        - 实施建议（前期、建设、运营）
        - 后续监控要求

        要求：结论明确，建议具体可行。
      `,
    };

    const instruction = chapterInstructions[input.chapter];
    const dataDesc = this.describeData(input.structuredData);

    return `
# ${instruction.split('\n')[0].replace(/#/g, '').trim()}

## 项目数据
${dataDesc}

## 生成要求
${instruction.split('\n').slice(1).join('\n')}

## 输出格式
- 使用Markdown格式
- 重要数据用表格呈现
- 章节标题用 ## 二级标题
- 小标题用 ### 三级标题
- 保持专业、客观的语调
`;
  }

  private describeData(data: any): string {
    // 将结构化数据转换为文本描述
    // 这里可以根据不同的数据类型定制描述方式
    return JSON.stringify(data, null, 2);
  }
}
```

---

### 5. InvestmentReportOrchestrator (主控编排器)

**职责**:
- 协调规则引擎和AI智能体
- 管理报告生成流程
- 处理错误和重试
- 提供进度反馈

```typescript
class InvestmentReportOrchestrator {
  async generateReport(projectInput: ProjectInput): Promise<InvestmentReport> {
    // 报告生成状态
    const state = {
      projectOverview: null,
      ownerDueDiligence: null,
      policyAnalysis: null,
      technicalAssessment: null,
      financialAnalysis: null,
      riskAssessment: null,
      investmentRecommendation: null,
    };

    // ===== 并行执行规则引擎任务 =====
    const [
      financialResult,
      cashFlowResult,
      sensitivityResult,
    ] = await Promise.all([
      this.runFinancialCalculator(projectInput),
      this.runCashFlowGenerator(projectInput),
      this.runSensitivityAnalyzer(projectInput),
    ]);

    // ===== 并行执行AI智能体任务 =====
    const [
      dueDiligenceResult,
      policyAnalysisResult,
      technicalProposalResult,
    ] = await Promise.all([
      this.runDueDiligenceAgent(projectInput),
      this.runPolicyAnalysisAgent(projectInput, financialResult),
      this.runTechnicalProposalAgent(projectInput),
    ]);

    // ===== 串联依赖任务 =====
    // 风险评估依赖前面的结果
    const riskAssessmentResult = await this.runRiskAssessmentAgent({
      dueDiligence: dueDiligenceResult,
      policyAnalysis: policyAnalysisResult,
      technicalProposal: technicalProposalResult,
      financialAnalysis: financialResult,
      projectInfo: projectInput,
    });

    // 投资建议依赖所有前面的结果
    const investmentRecommendationResult = await this.runInvestmentAdvisorAgent({
      allAnalyses: {
        dueDiligence: dueDiligenceResult,
        policyAnalysis: policyAnalysisResult,
        technicalProposal: technicalProposalResult,
        financialAnalysis: financialResult,
        riskAssessment: riskAssessmentResult,
      },
    });

    // ===== 生成报告叙述 =====
    const narratives = await this.generateNarratives({
      projectOverview: state.projectOverview,
      ownerDueDiligence: dueDiligenceResult,
      policyAnalysis: policyAnalysisResult,
      technicalAssessment: technicalProposalResult,
      financialAnalysis: financialResult,
      riskAssessment: riskAssessmentResult,
      investmentRecommendation: investmentRecommendationResult,
    });

    // ===== 汇总所有结果 =====
    return {
      metadata: this.generateMetadata(),
      projectOverview: state.projectOverview,
      ownerDueDiligence: dueDiligenceResult,
      policyAnalysis: policyAnalysisResult,
      technicalAssessment: technicalProposalResult,
      financialAnalysis: financialResult,
      riskAssessment: riskAssessmentResult,
      investmentRecommendation: investmentRecommendationResult,
      narratives,
      generatedAt: new Date().toISOString(),
    };
  }

  // 规则引擎调用
  private async runFinancialCalculator(input: ProjectInput) {
    // 使用现有的CalculationEngine
    const engine = new CalculationEngine();
    return engine.calculate(input);
  }

  // AI智能体调用
  private async runDueDiligenceAgent(input: ProjectInput) {
    const agent = new DueDiligenceAgent();
    return await agent.execute({
      companyName: input.ownerInfo?.companyName || '',
      searchDepth: 'standard',
    });
  }

  // ... 其他类似方法
}
```

---

## 关键设计决策

### 1. 智能体间通信

**问题**: 智能体之间如何共享信息？

**方案**: 使用统一的 `ReportDataContext` 对象作为共享上下文

```typescript
interface ReportDataContext {
  // 只读的输入数据
  readonly input: ProjectInput;

  // 各个智能体产生的结果
  dueDiligence?: DueDiligenceOutput;
  policyAnalysis?: PolicyAnalysisOutput;
  technicalProposal?: TechnicalProposalOutput;
  financialAnalysis?: FinancialAnalysisOutput;
  riskAssessment?: RiskAssessmentOutput;
  investmentRecommendation?: InvestmentRecommendationOutput;

  // 工具方法
  getData<T>(key: string): T | undefined;
  setData<T>(key: string, value: T): void;
}
```

### 2. 错误处理

**问题**: AI智能体失败怎么办？

**方案**:
- 超时机制（30秒超时）
- 降级策略（AI失败时使用规则引擎的默认值）
- 重试机制（最多3次）
- 用户通知（明确标注哪些部分使用了默认值）

```typescript
async function runAgentWithFallback<T>(
  agentCall: () => Promise<T>,
  fallbackValue: T,
  sectionName: string
): Promise<T> {
  try {
    return await withTimeout(agentCall(), 30000); // 30秒超时
  } catch (error) {
    console.warn(`${sectionName} AI agent failed, using fallback:`, error);
    return fallbackValue;
  }
}
```

### 3. 成本控制

**问题**: AI调用成本

**方案**:
- 智能体prompt优化（减少token使用）
- 结果缓存（相同项目不重复调用）
- 批量处理（减少调用次数）

```typescript
class CacheManager {
  private cache = new Map<string, { result: any; timestamp: number }>();

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1小时有效
      return cached.result as T;
    }

    const result = await fetcher();
    this.cache.set(key, { result, timestamp: Date.now() });
    return result;
  }
}
```

---

## 实现优先级

### Phase 1: 核心编排器 (2-3天)
- [ ] `InvestmentReportOrchestrator` 基础框架
- [ ] `ReportDataContext` 共享上下文
- [ ] 错误处理和降级机制
- [ ] 进度反馈机制

### Phase 2: AI智能体 (5-7天)
- [ ] `PolicyAnalysisAgent` 政策分析
- [ ] `TechnicalProposalAgent` 技术方案
- [ ] `RiskAssessmentAgent` 风险评估
- [ ] `ReportNarrativeAgent` 报告叙述

### Phase 3: 智能体增强 (3-5天)
- [ ] 增强现有的 `DueDiligenceAgent`
- [ ] 增强现有的 `InvestmentAdvisor`
- [ ] 添加工具调用能力

### Phase 4: 报告生成 (2-3天)
- [ ] `PDFReportGenerator` 实现
- [ ] 报告模板优化
- [ ] 图表渲染

### Phase 5: 集成测试 (2-3天)
- [ ] 端到端测试
- [ ] 性能优化
- [ ] 用户体验优化

**总计**: 14-21天 (3-4周)

---

## 下一步

你想要：
1. **开始写代码** — 我从哪个模块开始？
2. **继续讨论** — 还有哪个环节需要澄清？
3. **看个示例** - 想看看某个智能体的具体实现代码？

告诉我你的想法！
