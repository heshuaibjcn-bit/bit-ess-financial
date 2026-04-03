# 风险评估

## 模板规范

### 开头模板

```
本章节旨在识别和评估项目的主要风险因素。我们分析了[风险类型]，并基于[评估方法]得出以下结论。
```

### 内容结构

#### 1. 风险矩阵

**要求：**
- 风险类型：技术风险、市场风险、政策风险、运营风险
- 风险等级：高/中/低
- 风险影响：对财务指标的影响
- 缓解建议：具体的风险缓解策略

**格式：**
```
风险矩阵：
• 技术风险：
  - [具体风险1]：等级 [高/中/低]，影响 IRR [±X]%
    缓解建议：[建议]
  - [具体风险2]：等级 [高/中/低]，影响 NPV [±金额]万元
    缓解建议：[建议]
• 市场风险：
  - [具体风险1]：等级 [高/中/低]，影响 [影响描述]
    缓解建议：[建议]
• 政策风险：
  - [具体风险1]：等级 [高/中/低]，影响 [影响描述]
    缓解建议：[建议]
• 运营风险：
  - [具体风险1]：等级 [高/中/低]，影响 [影响描述]
    缓解建议：[建议]
```

#### 2. 关键风险描述

**要求：**
- 选择 3-5 个最重要的风险
- 详细描述风险特征
- 评估发生概率和影响程度

**格式：**
```
关键风险：
1. [风险名称]
   - 风险特征：[描述]
   - 发生概率：[高/中/低]
   - 影响程度：[描述]
   - 缓解措施：[措施]
```

#### 3. 风险缓解策略

**要求：**
- 针对每个关键风险的缓解策略
- 实施步骤和时间表
- 责任人和监控指标

**格式：**
```
缓解策略：
• 针对 [风险1]：
  - 策略：[策略描述]
  - 实施步骤：[步骤]
  - 责任人：[角色]
  - 监控指标：[指标]
```

### 结尾模板

```
综上所述，项目的主要风险已识别，缓解策略已制定。综合以上技术、财务、政策和风险分析，我们提出投资建议。
```

## 输出格式

```typescript
interface RiskAssessment {
  riskMatrix: {
    technical: Array<{
      risk: string;
      level: 'high' | 'medium' | 'low';
      impact: string;
      mitigation: string;
    }>;
    market: Array<{
      risk: string;
      level: 'high' | 'medium' | 'low';
      impact: string;
      mitigation: string;
    }>;
    policy: Array<{
      risk: string;
      level: 'high' | 'medium' | 'low';
      impact: string;
      mitigation: string;
    }>;
    operational: Array<{
      risk: string;
      level: 'high' | 'medium' | 'low';
      impact: string;
      mitigation: string;
    }>;
  };
  keyRisks: Array<{
    name: string;
    description: string;
    probability: 'high' | 'medium' | 'low';
    impact: string;
    mitigation: string;
  }>;
  mitigationStrategies: Array<{
    riskName: string;
    strategy: string;
    implementationSteps: string[];
    responsible: string;
    monitoringMetrics: string;
  }>;
}
```
