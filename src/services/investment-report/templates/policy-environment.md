# 政策环境

## 模板规范

### 开头模板

```
本章节旨在分析项目所在地的政策环境和补贴机制。我们查阅了[政策来源]，并基于[分析基础]得出以下结论。
```

### 内容结构

#### 1. 适用政策列表

**要求：**
- 国家层面的储能支持政策
- 省级/市级补贴政策
- 电力市场交易政策
- 税收优惠政策

**格式：**
```
适用政策：
• 国家政策：
  - [政策名称]：[政策描述]
  - 发文机关：[机关]
  - 发文时间：[时间]
• 省级政策：
  - [政策名称]：[政策描述]
  - 补贴标准：[标准]
• 电力市场：
  - [市场名称]：[政策描述]
  - 交易规则：[规则]
```

#### 2. 补贴金额计算

**要求：**
- 可获得的补贴类型（容量补贴、电量补贴、投资补贴）
- 补贴标准和计算方式
- 预期年度补贴收入

**格式：**
```
补贴机制：
• 容量补贴：[标准]，预计 [金额] 万元
• 电量补贴：[标准]，预计 [金额] 万元/年
• 投资补贴：[标准]，预计 [金额] 万元
• 年度补贴总收入：[金额] 万元/年
```

#### 3. 合规性检查结果

**要求：**
- 项目是否符合政策要求
- 需要的审批或备案
- 潜在的合规风险

**格式：**
```
合规性检查：
• 政策符合性：[符合/不符合]
• 审批要求：[审批清单]
• 合规风险：[风险描述]
```

### 结尾模板

```
综上所述，项目所在地的政策环境[评价：友好/一般/严格]。考虑到项目所在地的政策环境，我们需要识别潜在风险。
```

## 输出格式

```typescript
interface PolicyEnvironment {
  applicablePolicies: {
    national: Array<{
      name: string;
      description: string;
      authority: string;
      date: string;
    }>;
    provincial: Array<{
      name: string;
      description: string;
      subsidyStandard: string;
    }>;
    electricityMarket: Array<{
      name: string;
      description: string;
      tradingRules: string;
    }>;
  };
  subsidyCalculation: {
    capacitySubsidy: string;
    electricitySubsidy: string;
    investmentSubsidy: string;
    totalAnnualSubsidy: string;
  };
  compliance: {
    policyCompliance: '符合' | '不符合' | '部分符合';
    approvalRequirements: string[];
    complianceRisks: string;
  };
}
```
