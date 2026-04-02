# 储能项目投资评估报告系统 - 实现方案

## 目标
构建一个完整的、专业的储能项目投资评估报告生成系统，涵盖7个核心环节。

---

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    InvestmentReportGenerator                  │
│                   (投资报告生成器 - 核心引擎)                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  ReportData  │    │ RiskAnalyzer│    │ ReportBuilder│
│  Collector   │    │ (风险评估)  │    │  (报告构建)  │
│  (数据收集器) │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Sources                             │
├─────────────┬─────────────┬─────────────┬──────────────┤
│ DueDiligence│ Calculation │ PolicyDB    │ Technical    │
│ Agent       │ Engine      │ (政策数据库) │ Proposal     │
└─────────────┴─────────────┴─────────────┴──────────────┘
```

---

## 核心模块设计

### 1. ReportDataCollector (数据收集器)

**职责**: 从各个模块收集报告所需的所有数据

```typescript
interface ReportDataContext {
  // 项目概况
  projectOverview: {
    name: string;
    location: string;
    scale: string;
    estimatedCommissioning: string;
  };

  // 业主背景调查
  ownerDueDiligence: {
    companyInfo: CompanyInfo;
    creditRating: CreditRating;
    financialHealth: FinancialHealth;
    paymentHistory: PaymentHistory;
    businessRisks: RiskFactor[];
    recommendations: string[];
  };

  // 电价政策分析
  policyAnalysis: {
    currentTariff: TariffStructure;
    capacityCompensation: CompensationPolicy;
    policyTrend: PolicyTrend;
    policyRisks: PolicyRisk[];
    policyOpportunities: PolicyOpportunity[];
  };

  // 技术方案评估
  technicalAssessment: {
    recommendedConfig: TechnicalConfiguration;
    technologySelection: TechnologySelection;
    chargeStrategy: ChargeStrategy;
    expectedPerformance: PerformanceMetrics;
    alternativeOptions: TechnicalOption[];
  };

  // 财务分析
  financialAnalysis: {
    investmentBreakdown: InvestmentBreakdown;
    revenueProjection: RevenueProjection;
    operatingCosts: OperatingCosts;
    financialMetrics: FinancialMetrics;
    cashFlowAnalysis: CashFlowAnalysis;
    sensitivityMatrix: SensitivityMatrix;
  };

  // 风险评估
  riskAssessment: {
    riskMatrix: RiskMatrix;
    detailedRisks: DetailedRisk[];
    riskMitigationStrategies: MitigationStrategy[];
    overallRiskRating: RiskRating;
  };

  // 投资建议
  investmentRecommendation: {
    overallRating: OverallRating;
    investmentAdvice: InvestmentAdvice;
    coreStrengths: string[];
    keySuccessFactors: string[];
    implementationRoadmap: ImplementationStep[];
    monitoringRequirements: MonitoringRequirement[];
  };
}
```

**实现要点**:
- 并行调用各个数据源以提高性能
- 对缺失数据进行mock并标注
- 数据验证和一致性检查

---

### 2. RiskAnalyzer (风险评估引擎)

**职责**: 系统化分析各类风险并生成风险矩阵

```typescript
interface RiskAnalyzer {
  // 分析财务风险
  analyzeFinancialRisks(context: ReportDataContext): FinancialRisk[];

  // 分析技术风险
  analyzeTechnicalRisks(context: ReportDataContext): TechnicalRisk[];

  // 分析政策风险
  analyzePolicyRisks(context: ReportDataContext): PolicyRisk[];

  // 分析业主信用风险
  analyzeCreditRisks(context: ReportDataContext): CreditRisk[];

  // 生成风险矩阵
  generateRiskMatrix(risks: Risk[]): RiskMatrix;

  // 计算整体风险评级
  calculateOverallRiskRating(matrix: RiskMatrix): RiskRating;

  // 生成风险缓释策略
  generateMitigationStrategies(risks: Risk[]): MitigationStrategy[];
}
```

**风险评级模型**:
```typescript
// 风险 = 发生概率 × 影响程度 × 风险权重
RiskScore = Probability × Impact × Weight

// 整体风险评级
RiskRating = {
  score: 0-25: "低风险 (⭐⭐⭐⭐⭐)",
  score: 26-50: "中等风险 (⭐⭐⭐⭐)",
  score: 51-75: "高风险 (⭐⭐⭐)",
  score: 76-100: "极高风险 (⭐⭐)",
}
```

---

### 3. PolicyAnalyzer (政策分析引擎)

**职责**: 深度分析电价政策、趋势和风险

```typescript
interface PolicyAnalyzer {
  // 当前政策结构分析
  analyzeCurrentPolicy(province: Province): PolicyStructure;

  // 政策趋势预测
  analyzePolicyTrend(province: Province): PolicyTrend;

  // 政策变化模拟
  simulatePolicyChange(
    currentPolicy: PolicyStructure,
    changeScenario: PolicyChangeScenario
  ): PolicyImpact;

  // 政策风险评估
  assessPolicyRisks(province: Province): PolicyRisk[];

  // 政策机会识别
  identifyPolicyOpportunities(province: Province): PolicyOpportunity[];
}
```

**政策分析维度**:
1. **稳定性分析**: 政策变更频率、监管环境
2. **趋势预测**: 市场化改革方向、价格趋势
3. **影响模拟**: 电价调整对IRR的影响
4. **机会识别**: 辅助服务市场、需求响应

---

### 4. ReportBuilder (报告构建器)

**职责**: 将所有数据组装成结构化的报告对象

```typescript
interface ReportBuilder {
  // 构建完整报告
  buildReport(context: ReportDataContext): InvestmentReport;

  // 生成执行摘要
  generateExecutiveSummary(report: InvestmentReport): ExecutiveSummary;

  // 构建各章节内容
  buildChapter1_ProjectOverview(context: ReportDataContext): Chapter1;
  buildChapter2_OwnerDueDiligence(context: ReportDataContext): Chapter2;
  buildChapter3_PolicyAnalysis(context: ReportDataContext): Chapter3;
  buildChapter4_TechnicalAssessment(context: ReportDataContext): Chapter4;
  buildChapter5_FinancialAnalysis(context: ReportDataContext): Chapter5;
  buildChapter6_RiskAssessment(context: ReportDataContext): Chapter6;
  buildChapter7_InvestmentRecommendation(context: ReportDataContext): Chapter7;

  // 数据可视化
  generateCharts(report: InvestmentReport): ReportCharts;

  // 质量检查
  validateReport(report: InvestmentReport): ValidationResult;
}
```

---

### 5. PDFReportGenerator (PDF生成器)

**职责**: 将结构化报告渲染为专业PDF

```typescript
interface PDFReportGenerator {
  // 生成PDF
  generatePDF(report: InvestmentReport): Promise<PDFResult>;

  // 报告样式配置
  private getReportStyles(): ReportStyles;

  // 页面布局
  private layoutPage(content: PageContent): PageLayout;

  // 图表渲染
  private renderChart(chart: Chart): ChartImage;

  // 目录生成
  private generateTableOfContents(report: InvestmentReport): TableOfContents;
}
```

**PDF技术选型**:
- 推荐: `@react-pdf/renderer` (已在使用)
- 备选: `pdfmake` + `pdfkit`
- 高级: `puppeteer` + HTML模板

---

## 数据流设计

```
用户操作流程:
  用户填写项目表单
    ↓
  点击"生成评估报告"
    ↓
  显示进度条 (7个步骤并行执行)
    ↓
  [步骤1] 收集项目数据
  [步骤2] 执行业主尽职调查
  [步骤3] 分析电价政策
  [步骤4] 评估技术方案
  [步骤5] 计算财务指标
  [步骤6] 进行风险评估
  [步骤7] 生成投资建议
    ↓
  数据汇总和验证
    ↓
  报告预览 (可选)
    ↓
  生成PDF报告
    ↓
  下载/分享报告
```

---

## 实现步骤

### Phase 1: 核心引擎 (3-5天)
- [ ] `ReportDataCollector` - 数据收集器
- [ ] `RiskAnalyzer` - 风险评估引擎
- [ ] `ReportBuilder` - 报告构建器
- [ ] 单元测试

### Phase 2: 数据源增强 (2-3天)
- [ ] 完善 `DueDiligenceAgent` (去除mock)
- [ ] 实现 `PolicyAnalyzer` (政策分析引擎)
- [ ] 集成现有数据源

### Phase 3: PDF生成 (2-3天)
- [ ] `PDFReportGenerator` 实现
- [ ] 报告模板设计
- [ ] 图表渲染优化

### Phase 4: UI集成 (2-3天)
- [ ] 报告生成入口
- [ ] 进度显示
- [ ] 报告预览
- [ ] 下载/分享功能

### Phase 5: 测试和优化 (2-3天)
- [ ] 端到端测试
- [ ] 性能优化
- [ ] 用户体验优化

**总计**: 11-17天 (2-3周)

---

## 技术债务和注意事项

### 1. 数据质量问题
- **现状**: 部分模块使用mock数据
- **解决**: 优先接入真实数据源，标注数据可信度

### 2. AI依赖问题
- **现状**: 部分分析依赖AI (Claude/GLM)
- **解决**: 混合模式 - AI + 规则引擎，关键指标用确定性算法

### 3. 性能问题
- **现状**: 报告生成涉及多个模块调用
- **解决**: 并行执行、缓存优化、增量生成

### 4. 版本控制
- **现状**: PDF报告历史版本管理
- **解决**: 报告版本控制、diff功能

---

## 扩展性考虑

### 未来功能
1. **批量报告**: 同时生成多个项目的对比报告
2. **模板系统**: 自定义报告模板和样式
3. **协作功能**: 报告评论、审批流程
4. **导出格式**: 支持Word、Excel、HTML等多种格式
5. **报告对比**: 不同时期报告的版本对比

### 国际化
- 报告内容多语言支持
- 不同国家的政策适配
- 货币和财务标准的本地化

---

## 成功指标

### 功能完整性
- ✅ 7个章节全部实现
- ✅ 所有关键数据点都有来源
- ✅ 报告生成成功率 > 95%

### 性能指标
- ✅ 报告生成时间 < 30秒
- ✅ PDF文件大小 < 5MB
- ✅ 并发处理能力 > 10个/分钟

### 质量指标
- ✅ 数据准确性 > 95%
- ✅ 报告完整性 > 98%
- ✅ 用户满意度 > 4.5/5

---

## 下一步行动

1. **确认方案**: 你是否认可这个设计方向？
2. **优先级排序**: 你想先实现哪些模块？
3. **时间规划**: 你期望的实现周期是多久？

---

**附注**: 这个方案是基于你现有系统的渐进式增强，充分利用已有的模块（DueDiligenceAgent、CalculationEngine、PDFGenerator等），避免重复开发。
