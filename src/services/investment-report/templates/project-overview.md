# 项目概况

## 模板规范

### 开头模板

```
本章节旨在介绍项目的基本情况、技术方案和系统配置。我们分析了[数据来源]，并基于[分析基础]得出以下结论。
```

### 内容结构

#### 1. 业主信息

**要求：**
- 业主名称
- 业主类型（企业类型、规模）
- 业主背景（行业经验、财务实力）

**格式：**
```
业主信息：
• 企业名称：[名称]
• 企业类型：[类型]
• 行业经验：[经验描述]
• 财务状况：[状况描述]
```

#### 2. 项目地点

**要求：**
- 省份/城市
- 具体地址
- 地理位置优势（如靠近负荷中心、工业园区）

**格式：**
```
项目地点：
• 省份/城市：[地点]
• 具体地址：[地址]
• 地理优势：[优势描述]
```

#### 3. 系统配置

**要求：**
- 系统容量（kW/MWh）
- 储能设备规格
- 系统架构（并网、离网、混合）

**格式：**
```
系统配置：
• 系统容量：[容量]
• 储能设备：[设备规格]
• 系统架构：[架构类型]
```

#### 4. 技术参数

**要求：**
- 额定功率
• 储能时长
• 充放电策略
- 预期年发电量/放电量

**格式：**
```
技术参数：
• 额定功率：[功率] kW
• 储能时长：[时长] h
• 充放电策略：[策略描述]
• 预期年放电量：[电量] MWh
```

### 结尾模板

```
综上所述，项目的基本情况和技术配置已明确。下一章节将深入分析项目的财务表现。
```

## 输出格式

```typescript
interface ProjectOverview {
  ownerInfo: {
    companyName: string;
    companyType: string;
    industryExperience: string;
    financialStatus: string;
  };
  location: {
    province: string;
    city: string;
    address: string;
    geographicalAdvantage: string;
  };
  systemConfig: {
    capacity: string;
    deviceSpecs: string;
    architecture: string;
  };
  technicalParams: {
    ratedPower: string;
    storageDuration: string;
    chargeDischargeStrategy: string;
    annualDischarge: string;
  };
}
```
