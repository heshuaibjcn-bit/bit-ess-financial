# ESS Financial AI智能体系统 - 实施路线图

## 项目目标

在现有6步表单输入的基础上，构建AI智能体驱动的项目评估报告系统。

**保持不变**: 用户界面（6步表单）
**核心改变**: 后端逻辑从规则计算 → 规则引擎 + AI智能体混合模式

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户界面层 (保持不变)                      │
│  6步表单输入 → 点击"生成报告" → 下载PDF                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   InvestmentReportService                      │
│                  (报告服务 - 主编排器)                             │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  规则引擎层  │    │  AI智能体层   │    │  数据服务层   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
  ┌─────────┐         ┌────────┐         ┌─────────┐
  │财务计算  │         │智能体1-6│         │电价数据库 │
  │现金流  │         │并行执行 │         │定时更新   │
  │敏感度   │         └────────┘         └─────────┘
  └─────────┘              │
                          ▼
                   ┌──────────────┐
                   │报告数据汇总   │
                   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  PDF生成器    │
                   └──────────────┘
```

---

## 智能体详细设计

### 智能体1: 业主尽调智能体 (DueDiligenceAgent)

**触发**: 用户填写第1步（业主信息）后自动触发

**输入**:
```typescript
{
  companyName: "XXXX科技有限公司",
  industry: "制造业",
  province: "guangdong",
  // ... 其他业主信息
}
```

**任务流程**:
```
1. 查询企业信用信息公示系统 (国家公示系统)
   ├─ 统一社会信用代码
   ├─ 法定代表人
   ├─ 注册资本
   ├─ 成立日期
   └─ 经营状态

2. 查询天眼查/企查查 (需要API密钥)
   ├─ 信用评分
   ├─ 财务数据
   ├─ 诉讼记录
   ├─ 经营异常
   └─ 关联企业

3. AI分析评估
   ├─ 信用等级判定
   ├─ 财务健康度分析
   ├─ 业务风险识别
   └─ 合作建议

4. 生成尽调报告
```

**输出**:
```typescript
{
  companyInfo: { /* 企业基本信息 */ },
  creditRating: { level: "AA", score: 85 },
  financialHealth: { /* 财务健康度 */ },
  paymentHistory: { /* 付款历史 */ },
  businessRisks: [ /* 风险列表 */ ],
  recommendations: [ /* 建议 */ ],
  confidence: 0.85,
  dataSource: "国家企业信用信息公示系统 + 天眼查",
  reportGenerated: "2026-XX-XX"
}
```

**实现要点**:
- API集成：天眼查API、企查查API
- 数据缓存：避免重复查询同一公司
- AI prompt: 设计专业的尽调分析prompt
- 超时控制: 单次尽调不超过60秒

---

### 智能体2: 政策分析智能体 (PolicyAnalysisAgent)

**触发**: 用户填写第3步（电价详情）后自动触发

**输入**:
```typescript
{
  province: "guangdong",
  tariffType: "industrial",
  peakPrice: 1.2,
  valleyPrice: 0.4,
  hourlyPrices: [/* 24小时电价 */],
  // ... 其他电价信息
}
```

**任务流程**:
```
1. 查询政策数据库
   ├─ 当前分时电价政策
   ├─ 容量补偿政策
   ├─ 需求响应政策
   └─ 辅助服务市场政策

2. AI政策趋势分析
   ├─ 政策稳定性评估
   ├─ 改革方向预测
   ├─ 风险因素识别
   └─ 机会点发现

3. 影响分析 (规则引擎)
   ├─ 电价±10%对IRR的影响
   ├─ 政策取消补偿的影响
   └─ 新政策开放的收益

4. 生成政策分析报告
```

**输出**:
```typescript
{
  currentPolicy: { /* 当前政策详情 */ },
  stability: {
    rating: "moderate",
    confidence: 0.75,
    factors: ["市场化改革加速", "补偿标准可能下调"]
  },
  trend: {
    direction: "stable",
    timeframe: "未来1-2年",
    keyChanges: []
  },
  impact: {
    onIRR: 0.8, // 政策变化对IRR的影响百分比
    scenarios: [
      { scenario: "价差-10%", irr: 7.2 },
      { scenario: "政策不变", irr: 8.0 },
      { scenario: "价差+10%", irr: 8.8 }
    ]
  },
  risks: [ /* 政策风险列表 */ ],
  opportunities: [ /* 政策机会列表 */ ],
  recommendations: [ /* 应对建议 */ ]
}
```

**实现要点**:
- 政策数据库设计（31省 × 多政策类型）
- AI prompt: 政策分析需要专业知识
- 与财务计算引擎联动（影响分析）

---

### 智能体3: 风险评估智能体 (RiskAssessmentAgent)

**触发**: 所有分析完成后触发

**输入**:
```typescript
{
  dueDiligenceReport: /* 尽调报告 */,
  policyAnalysisReport: /* 政策分析报告 */,
  technicalProposal: /* 技术方案 */,
  financialMetrics: /* 财务指标 */,
  projectInfo: /* 项目基础信息 */
}
```

**任务流程**:
```
1. 收集各类风险
   ├─ 从尽调报告提取信用风险
   ├─ 从政策分析提取政策风险
   ├─ 从技术方案提取技术风险
   └─ 从财务分析提取财务风险

2. 风险评分 (规则引擎)
   ├─ 每个风险计算评分
   ├─ 风险 = 发生概率 × 影响程度 × 权重
   └─ 生成风险矩阵

3. AI风险综合分析
   ├─ 风险相关性分析
   ├─ 连锁风险识别
   ├─ 极端情景压力测试
   └─ 风险演化趋势

4. 生成风险缓释策略
   ├─ 合同层面措施
   ├─ 技术层面措施
   ├─ 财务层面措施
   └─ 运营层面措施

5. 生成风险评估报告
```

**输出**:
```typescript
{
  riskMatrix: {
    low: [/* 低风险列表 */],
    medium: [/* 中风险列表 */],
    high: [/* 高风险列表 */],
    critical: [/* 极高风险列表 */]
  },
  risks: [
    {
      category: "financial",
      source: "业主信用",
      description: "3次逾期付款记录",
      likelihood: 0.3,
      impact: 0.7,
      score: 21,
      level: "medium",
      mitigation: "合同严格付款条款，收取20%预付款"
    },
    // ... 其他风险
  ],
  overallRating: {
    score: 45,
    level: "medium",
    confidence: 0.8
  },
  mitigationStrategies: [
    {
      aspect: "合同",
      strategy: "设置分阶段付款条款",
      effectiveness: "high",
      cost: "low"
    },
    // ... 其他策略
  ],
  contingencyPlans: [
    {
      trigger: "业主连续2个月逾期付款",
      actions: ["暂停服务", "启动追偿程序", "处置抵押物"],
      expectedOutcome: "最大程度减少损失"
    }
    // ... 其他预案
  ]
}
```

**实现要点**:
- 风险评分算法（规则引擎）
- AI综合分析（风险关联、压力测试）
- 缓释策略生成（AI + 规则模板）

---

### 智能体4: 技术方案智能体 (TechnicalProposalAgent)

**触发**: 用户填写第2步（场地设施）+ 第3步（电价详情）后触发

**输入**:
```typescript
{
  facilityInfo: { /* 场地信息 */ },
  tariffInfo: { /* 电价信息 */ },
  ownerInfo: { /* 业主信息 */ },
  preferences: { /* 用户偏好 (如果有) */ }
}
```

**任务流程**:
```
1. 规则引擎计算最优配置 (已有CapacityRecommender)
   ├─ 保守方案
   ├─ 标准方案
   └─ 激进方案

2. AI技术选型分析
   ├─ 电池技术路线推荐 (Li-ion vs 其他)
   ├─ 设备品牌推荐 (宁德时代 vs 比亚迪 vs 其他)
   ├─ 系统架构设计
   └─ 集成方案

3. AI性能预测
   ├─ 年吞吐量预测
   ├─ 系统效率评估
   ├- 可用率目标
   └─ 10年衰减曲线

4. AI实施规划
   ├─ 分阶段实施方案
   ├─ 关键路径识别
   ├─ 时间节点规划
   └─ 资源需求估算

5. 生成技术方案报告
```

**输出**:
```typescript
{
  recommended: {
    capacity: 2.0, // MWh
    power: 0.5,    // MW
    duration: 4.0, // 小时
    technology: "lithium-ion",
    brands: ["宁德时代", "阳光电源", "华为数字能源"],
    chargeStrategy: "arbitrage_with_demand_response"
  },
  alternatives: [
    {
      type: "conservative",
      capacity: 1.5,
      power: 0.4,
      expectedIRR: 7.2,
      riskLevel: "low"
    },
    {
      type: "aggressive",
      capacity: 2.5,
      power: 0.6,
      expectedIRR: 9.1,
      riskLevel: "high"
    }
  ],
  expectedPerformance: {
    annualThroughput: 1095, // MWh/年
    systemEfficiency: 0.90,
    availability: 0.97,
    year10Capacity: 0.82
  },
  implementation: {
    phases: [
      { phase: "设计", duration: "2周", keyActivities: ["方案设计", "设备采购"] },
      { phase: "建设", duration: "6周", keyActivities: ["设备安装", "并网接入"] },
      { phase: "调试", duration: "2周", keyActivities: ["系统调试", "性能测试"] }
    ],
    totalTimeline: "10周",
    criticalPath: ["设备采购", "并网接入", "性能测试"]
  },
  risks: [ /* 技术风险 */ ],
  recommendations: [ /* 实施建议 */ ]
}
```

**实现要点**:
- 复用现有的 `CapacityRecommender`
- AI prompt: 技术选型需要专业知识
- 与财务计算联动（不同方案的IRR）

---

### 智能体5: 报告叙述智能体 (ReportNarrativeAgent)

**触发**: 所有分析数据准备好后触发

**输入**:
```typescript
{
  chapter: "project_overview" | "owner_due_diligence" | ...,
  structuredData: { /* 该章节的结构化数据 */ },
  targetAudience: "investor" | "bank" | "internal",
  language: "zh"
}
```

**任务流程**:
```
1. 理解数据结构
   ├─ 识别关键数据点
   ├─ 理解数据关联
   └─ 确定叙述重点

2. 生成章节叙述
   ├─ 标题和摘要
   ├─ 正文叙述（专业、清晰）
   ├─ 表格呈现
   └─ 结论和建议

3. 优化表达
   ├─ 专业术语准确
   ├─ 逻辑连贯
   ├─ 重点突出
   └─ 风险提示
```

**输出**:
```typescript
{
  title: "项目概况",
  content: `
## 项目概况

### 1.1 基本信息
- **项目名称**: XXXX工业园储能项目
- **项目地点**: 广东省深圳市
...

### 1.2 项目背景
本项目基于业主的用电需求和当地电价政策...
  `,
  summary: "2MWh/500kW工商业储能项目，IRR预计8.0%"
}
```

**实现要点**:
- 为每个章节定制AI prompt
- Markdown格式输出
- 保持专业报告风格

---

### 智能体6: 电价更新智能体 (TariffUpdateAgent)

**触发**: 定时任务（每天/每周）

**任务流程**:
```
1. 扫描政策发布源
   ├─ 国家发改委
   ├─ 省发改委
   ├─ 电网公司
   └─ 第三方政策平台

2. 识别新政策
   ├─ 分时电价调整
   ├─ 容量补偿标准变化
   ├─ 需求响应新规则
   └─ 辅助服务市场开放

3. 数据解析
   ├─ PDF文档解析
   ├─ 网页内容提取
   ├─ 数据清洗验证
   └─ 结构化存储

4. 更新数据库
   ├─ 更新现有省份数据
   ├─ 添加历史版本记录
   ├─ 标记数据来源和时效性
   └─ 生成变更日志

5. 通知机制
   ├─ 通知管理员
   ├─ 发送变更摘要
   └─ 更新影响分析
```

**输出**:
```typescript
{
  updatedProvinces: ["guangdong", "jiangsu"],
  changes: [
    {
      province: "guangdong",
      policyType: "peak_valley_price",
      oldValue: { peak: 1.2, valley: 0.4 },
      newValue: { peak: 1.15, valley: 0.45 },
      effectiveDate: "2026-XX-XX",
      impact: "IRR影响约-0.3%"
    }
  ],
  updateLog: /* 变更日志 */
}
```

**实现要点**:
- 定时任务调度 (node-cron / BullMQ)
- PDF/网页解析 (已有 `PDFAnalyzer` / `BrowserTariffPDFCrawler`)
- 数据版本控制
- 变更通知机制

---

## 技术栈和依赖

### 新增依赖
```json
{
  "dependencies": {
    "node-cron": "^3.0.0",           // 定时任务
    "bullmq": "^4.0.0",                 // 任务队列
    "ioredis": "^5.0.0",                 // 任务队列Redis
    "cheerio": "^1.20.0",                // 网页抓取（已有）
    "pdf-parse": "^1.1.1"                // PDF解析（已有）
  }
}
```

### 复用现有模块
```
✅ DueDiligenceAgent - 增强API调用
✅ CalculationEngine - 保持不变
✅ CapacityRecommender - 集成到TechnicalProposalAgent
✅ PDFGenerator - 保持不变
✅ ProvinceParser - 复用到PolicyAnalysisAgent
```

---

## 开发计划

### Week 1: 基础设施
- [ ] `InvestmentReportService` 主服务框架
- [ ] `ReportDataContext` 共享上下文
- [ ] 错误处理和降级机制
- [ ] 进度反馈WebSocket

### Week 2: 智能体1-2
- [ ] 增强 `DueDiligenceAgent` (API集成)
- [ ] 新建 `PolicyAnalysisAgent`
- [ ] 单元测试和集成测试

### Week 3: 智能体3-4
- [ ] 新建 `RiskAssessmentAgent`
- [ ] 新建 `TechnicalProposalAgent`
- [ ] 单元测试和集成测试

### Week 4: 智能体5-6
- [ ] 新建 `ReportNarrativeAgent`
- [ ] 新建 `TariffUpdateAgent`
- [ ] 单元测试和集成测试

### Week 5: 集成和优化
- [ ] 端到端测试
- [ ] 性能优化（并行执行、缓存）
- [ ] 用户体验优化
- [ ] 文档和部署

---

## 数据流图

```
用户输入 (6步表单)
    │
    ▼
┌─────────────────────────────────────────┐
│  InvestmentReportService              │
│  ├─ collectData()                     │
│  ├─ runAgents() - 并行执行            │
│  │  ├─ dueDiligenceAgent              │
│  │  ├─ policyAnalysisAgent            │
│  │  ├─ technicalProposalAgent        │
│  │  └─ riskAssessmentAgent (等待其他)  │
│  ├─ runCalculations() - 并行执行       │
│  │  ├─ financialCalculator            │
│  │  ├─ cashFlowGenerator             │
│  │  └─ sensitivityAnalyzer            │
│  ├─ generateNarratives() - 并行执行      │
│  │  └─ reportNarrativeAgent           │
│  ├─ generatePDF()                       │
│  └─ return Report                      │
└─────────────────────────────────────────┘
```

---

## 关键技术决策

### 1. 智能体并行 vs 串行
**决策**: 部分并行 + 部分串行
- 尽调Agent、政策Agent、技术Agent可以并行
- 风险Agent必须等待其他Agent完成
- 投资建议Agent必须等待所有分析完成

### 2. AI API选择
**选项**:
- A) Claude 3.5 Sonnet (更强大，更贵)
- B) GLM-4 (更便宜，中文优化)
- C) GPT-4 Turbo (均衡)

**推荐**: B) GLM-4
- 成本效益最优
- 中文表现优秀
- 国内访问稳定

### 3. 数据存储
**决策**: 智能体输出 + 原始数据
- 保存完整的智能体输出（便于追溯）
- 保存原始输入数据（便于重新生成）
- 版本控制（报告历史）

---

## 下一步行动

你想要：
1. **看代码示例** — 我给你展示某个智能体的具体实现代码
2. **讨论API** — 天眼查/企查查API怎么集成
3. **设计数据结构** — 报告的完整数据模型设计
4. **开始实现** — 从哪个模块开始编码

**告诉我你的想法，我们继续！**
