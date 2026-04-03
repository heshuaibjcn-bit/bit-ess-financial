# 财务分析

## 模板规范

### 开头模板

```
本章节旨在评估项目的财务表现和投资价值。我们分析了[计算方法]，并基于[财务数据]得出以下结论。
```

### 内容结构

#### 1. 关键财务指标

**要求：**
- IRR（内部收益率）：项目在整个生命周期内的年化收益率
- NPV（净现值）：项目未来现金流的现值与初始投资的差额
- 投资回收期：收回初始投资所需的时间
- LCOS（储能平准化成本）：生命周期总成本 / 总放电量
- 投资利润率：NPV / 初始投资 × 100%

**格式：**
```
关键财务指标：
• 内部收益率（IRR）：[X]%
• 净现值（NPV）：[金额] 万元
• 投资回收期：[X] 年
• 储能平准化成本（LCOS）：[金额] 元/kWh
• 投资利润率：[X]%
```

#### 2. 现金流分析

**要求：**
- 25 年现金流表格（可选，详细报告）
- 累计现金流曲线图
- 关键现金流节点（投资年份、盈亏平衡年份）

**格式：**
```
现金流分析：
• 25 年累计现金流：[金额] 万元
• 现金流曲线：[图表描述]
• 盈亏平衡年份：第 [X] 年
```

#### 3. 敏感性分析摘要

**要求：**
- IRR 对关键变量的敏感性
- 最敏感的 3 个变量
- 敏感性矩阵（可选，详细报告）

**格式：**
```
敏感性分析：
• IRR 敏感性：
  - 初始投资：±[X]% → IRR 变化 ±[Y]%
  - 电价：±[X]% → IRR 变化 ±[Y]%
  - 年利用时长：±[X]% → IRR 变化 ±[Y]%
• 最敏感因素：[因素名称]
```

### 结尾模板

```
综上所述，项目财务表现[评价：优秀/良好/一般/较差]。基于以上财务分析结果，我们进一步评估项目的政策环境。
```

## 输出格式

```typescript
interface FinancialAnalysis {
  keyMetrics: {
    irr: string;           // "12.3%"
    npv: string;           // "230 万元"
    paybackPeriod: string;  // "5.2 年"
    lcos: string;          // "0.65 元/kWh"
    profitMargin: string;  // "15.3%"
  };
  cashFlowAnalysis: {
    cumulativeCashFlow: string;
    breakEvenYear: number;
  };
  sensitivity: {
    irrSensitivity: {
      initialInvestment: { change: string; impact: string };
      electricityPrice: { change: string; impact: string };
      utilizationHours: { change: string; impact: string };
    };
    mostSensitiveFactor: string;
  };
}
```
