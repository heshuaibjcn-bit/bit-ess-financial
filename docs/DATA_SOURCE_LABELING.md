# 电价数据来源标识系统

## 📋 概述

电价数据来源标识系统用于明确区分**真实政府数据**、**默认回退数据**和**模拟数据**，提供数据透明度和可信度评分。

---

## 🎯 三种数据来源

### 1. 真实数据 (Real) - `dataSource: 'real'`

**可信度**: 0.95 (95%)

**来源**: 从政府网站成功爬取并解析

**支持省份**:
- ✅ **广东省 (GD)** - http://drc.gd.gov.cn/
- ✅ **浙江省 (ZJ)** - https://fzggw.zj.gov.cn/
- ✅ **江苏省 (JS)** - http://fzggw.jiangsu.gov.cn/

**数据特征**:
- 政策文号：真实（如 "粤发改价格〔2024〕123号"）
- 价格数据：从HTML/PDF文档提取
- 生效日期：政策文件中的真实日期
- URL：指向真实的政府网站页面

**爬取流程**:
```
政府网站 → CORS代理 → HTML解析 → 提取电价表格 → 存储为真实数据
```

**日志示例**:
```javascript
{
  dataSource: 'real',
  dataConfidence: 0.95,
  crawlMetadata: {
    crawledAt: '2026-03-30T10:30:00Z',
    sourceUrl: 'http://drc.gd.gov.cn/jgml/gfbzzcj/gfxwjg/index.html',
    parseMethod: 'crawler',
    fallbackReason: undefined
  }
}
```

---

### 2. 默认数据 (Default) - `dataSource: 'default'`

**可信度**: 0.6 (60%)

**来源**: 爬虫运行但无法提取具体数据，回退到硬编码的参考价格

**触发条件**:
- 政府网站结构变化
- HTML解析失败
- PDF解析失败
- 找不到电价表格

**数据特征**:
- 政策文号：真实（如果提取到文号）
- 价格数据：**固定的示例价格**（非当前真实价格）
- 时段配置：默认时段

**默认价格参考**:
```javascript
{
  voltageLevel: '0.4kV',
  peakPrice: 1.063,    // 固定值
  valleyPrice: 0.358,  // 固定值
  flatPrice: 0.639,    // 固定值
}
```

**日志示例**:
```javascript
{
  dataSource: 'default',
  dataConfidence: 0.6,
  crawlMetadata: {
    crawledAt: '2026-03-30T10:30:00Z',
    sourceUrl: 'http://drc.gd.gov.cn/...',
    parseMethod: 'crawler_with_default_fallback',
    fallbackReason: 'Failed to extract real data from website'
  }
}
```

**控制台警告**:
```
⚠️ [Crawler] Using default tariff data (failed to extract from website)
```

---

### 3. 模拟数据 (Mock) - `dataSource: 'mock'`

**可信度**: 0.3 (30%)

**来源**: 没有实现爬虫的省份，使用随机生成的示例数据

**支持省份**:
- ⚠️ **安徽省 (AH)** - 未实现爬虫
- ⚠️ **其他未配置省份** - 回退到模拟数据

**数据特征**:
- 政策文号：**自动生成**（如 "AH发改价格〔2026〕912号"）
- 价格数据：**随机浮动**的示例价格
- 生效日期：下个月1号
- URL：示例URL（https://example.com/policy/...）

**价格生成逻辑**:
```javascript
peakPrice: 1.063 + (Math.random() - 0.5) * 0.1,  // 1.013 ~ 1.113
valleyPrice: 0.358 + (Math.random() - 0.5) * 0.05, // 0.333 ~ 0.383
flatPrice: 0.639 + (Math.random() - 0.5) * 0.08,   // 0.599 ~ 0.679
```

**日志示例**:
```javascript
{
  dataSource: 'mock',
  dataConfidence: 0.3,
  crawlMetadata: {
    crawledAt: '2026-03-30T10:30:00Z',
    sourceUrl: 'mock://data',
    parseMethod: 'mock',
    fallbackReason: 'No crawler implemented for this province'
  }
}
```

---

## 🔍 如何识别数据来源

### 在代码中

```typescript
const notice: ParsedTariffNotice = {
  // ... 其他字段
  dataSource: 'real',      // 'real' | 'default' | 'mock'
  dataConfidence: 0.95,    // 0.0 - 1.0
  crawlMetadata: {
    crawledAt: '2026-03-30T10:30:00Z',
    sourceUrl: 'http://...',
    parseMethod: 'crawler',
    fallbackReason?: string
  }
};
```

### 在数据库中

```typescript
const version: TariffVersion = {
  // ... 其他字段
  dataSource: 'real',
  dataConfidence: 0.95,
  crawlMetadata: { ... }
};
```

### 在UI中显示

**建议的UI展示**:

```tsx
<div className="tariff-source-badge">
  {dataSource === 'real' && (
    <span className="badge badge-success">
      ✓ 真实数据 (可信度: 95%)
    </span>
  )}
  {dataSource === 'default' && (
    <span className="badge badge-warning">
      ⚠️ 默认数据 (可信度: 60%)
    </span>
  )}
  {dataSource === 'mock' && (
    <span className="badge badge-danger">
      ⚠️ 模拟数据 (可信度: 30%)
    </span>
  )}
</div>
```

---

## 📊 当前省份数据状态

| 省份 | 代码 | 数据来源 | 可信度 | 爬虫状态 |
|------|------|----------|--------|----------|
| 广东省 | GD | real / default | 0.95 / 0.6 | ✅ 已实现 |
| 浙江省 | ZJ | real / default | 0.95 / 0.6 | ✅ 已实现 |
| 江苏省 | JS | real / default | 0.95 / 0.6 | ✅ 已实现 |
| 安徽省 | AH | mock | 0.3 | ❌ 未实现 |
| 其他省份 | - | mock | 0.3 | ❌ 未实现 |

---

## 🛠️ 技术实现

### 1. 类型定义

```typescript
// src/services/agents/LocalTariffUpdateAgent.ts

export type DataSourceType = 'real' | 'default' | 'mock';

export interface ParsedTariffNotice {
  // ... 原有字段
  dataSource: DataSourceType;
  dataConfidence: number;
  crawlMetadata?: {
    crawledAt?: string;
    sourceUrl?: string;
    parseMethod?: string;
    fallbackReason?: string;
  };
}
```

### 2. 爬虫标记

```typescript
// src/services/agents/TariffDataCrawler.ts

private getDefaultTariffs(): any[] {
  const tariffs = [ /* ... */ ];
  (tariffs as any).isDefaultData = true; // 标记为默认数据
  return tariffs;
}

private async parseHtmlNotice(url: string, provinceName: string): Promise<any> {
  // ... 解析逻辑
  const isDefaultData = (tariffs as any).isDefaultData === true;
  return { /* ... */, isDefaultData };
}
```

### 3. 智能体处理

```typescript
// src/services/agents/LocalTariffUpdateAgent.ts

private buildParsedNotice(provinceCode: string, crawlData: any): any {
  let dataSource: DataSourceType = 'real';
  let dataConfidence = 1.0;

  if (crawlData.source === 'mock' || crawlData.source === 'fallback') {
    dataSource = 'mock';
    dataConfidence = 0.3;
  } else if (parsed?.isDefaultData) {
    dataSource = 'default';
    dataConfidence = 0.6;
  } else {
    dataConfidence = 0.95;
  }

  return { /* ... */, dataSource, dataConfidence, crawlMetadata };
}
```

### 4. 数据库存储

```typescript
// src/repositories/LocalTariffRepository.ts

export interface TariffVersion {
  // ... 原有字段
  dataSource?: 'real' | 'default' | 'mock';
  dataConfidence?: number;
  crawlMetadata?: { /* ... */ };
}
```

---

## 🎨 UI 显示建议

### 1. 数据来源徽章

```tsx
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-600">数据来源:</span>
  {version.dataSource === 'real' && (
    <Tooltip content="从政府网站爬取的真实数据">
      <Badge variant="success" className="cursor-help">
        ✓ 真实数据
      </Badge>
    </Tooltip>
  )}
  {version.dataSource === 'default' && (
    <Tooltip content="爬虫失败，使用默认参考价格">
      <Badge variant="warning" className="cursor-help">
        ⚠️ 默认数据
      </Badge>
    </Tooltip>
  )}
  {version.dataSource === 'mock' && (
    <Tooltip content="未实现爬虫，使用模拟数据">
      <Badge variant="danger" className="cursor-help">
        ⚠️ 模拟数据
      </Badge>
    </Tooltip>
  )}
  <span className="text-xs text-gray-500">
    (可信度: {Math.round(version.dataConfidence! * 100)}%)
  </span>
</div>
```

### 2. 详细信息面板

```tsx
<Collapsible>
  <CollapsibleTrigger>
    查看数据来源详情
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold mb-2">爬取元数据</h4>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-gray-600">爬取时间</dt>
          <dd>{version.crawlMetadata?.crawledAt}</dd>
        </div>
        <div>
          <dt className="text-gray-600">数据源URL</dt>
          <dd>
            <a href={version.crawlMetadata?.sourceUrl} target="_blank" rel="noopener">
              {version.crawlMetadata?.sourceUrl}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-gray-600">解析方法</dt>
          <dd>{version.crawlMetadata?.parseMethod}</dd>
        </div>
        {version.crawlMetadata?.fallbackReason && (
          <div className="col-span-2">
            <dt className="text-gray-600">回退原因</dt>
            <dd className="text-orange-600">{version.crawlMetadata?.fallbackReason}</dd>
          </div>
        )}
      </dl>
    </div>
  </CollapsibleContent>
</Collapsible>
```

### 3. 可信度进度条

```tsx
<div className="w-full">
  <div className="flex justify-between text-sm mb-1">
    <span>数据可信度</span>
    <span className="font-semibold">
      {Math.round(version.dataConfidence! * 100)}%
    </span>
  </div>
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className={`h-2 rounded-full transition-all ${
        version.dataConfidence! >= 0.8 ? 'bg-green-500' :
        version.dataConfidence! >= 0.5 ? 'bg-yellow-500' :
        'bg-red-500'
      }`}
      style={{ width: `${version.dataConfidence! * 100}%` }}
    />
  </div>
</div>
```

---

## 📈 数据质量改进计划

### 短期目标 (1-2周)

1. **为安徽省实现真实爬虫**
   - 研究安徽省发改委网站结构
   - 实现 `crawlAnhui()` 方法
   - 测试数据提取准确性

2. **添加更多省份**
   - 山东省 (SD)
   - 上海市 (SH)
   - 北京市 (BJ)

### 中期目标 (1个月)

1. **改进爬虫鲁棒性**
   - 添加多种HTML解析策略
   - 实现PDF OCR备用方案
   - 增强错误恢复机制

2. **数据验证**
   - 交叉验证多个数据源
   - 价格合理性检查
   - 时段完整性验证

### 长期目标 (3个月)

1. **覆盖31个省份**
   - 为每个省份实现专用爬虫
   - 建立统一的数据更新调度
   - 实现自动化数据质量监控

2. **机器学习增强**
   - 使用AI识别电价表格结构
   - 自动适应网站结构变化
   - 智能数据填充和修复

---

## 🔧 调试和监控

### 查看控制台日志

```bash
# 开启详细日志
localStorage.setItem('verbose_logging', 'true')

# 运行电价更新检查
# 在浏览器控制台执行:
const agent = getLocalTariffUpdateAgent();
await agent.checkProvinceUpdate('AH');
```

### 日志输出示例

**真实数据成功**:
```
[Crawler] Starting Guangdong tariff crawl...
[Crawler] Found 15 tariff notices for 广东省
[Crawler] Parsing HTML notice: http://drc.gd.gov.cn/...
[Agent] Crawl result for GD: Success
[Agent] Data source: real, confidence: 0.95
```

**回退到默认数据**:
```
[Crawler] Starting Guangdong tariff crawl...
[Crawler] Found 0 tariff notices for 广东省
⚠️ [Crawler] Using default tariff data (failed to extract from website)
[Agent] Data source: default, confidence: 0.6
```

**使用模拟数据**:
```
[Agent] Fetching real data for AH...
[Agent] No crawler for AH, using mock data
[Agent] Data source: mock, confidence: 0.3
```

---

## ❓ 常见问题

### Q: 为什么会有"默认数据"？

**A**: 政府网站可能改版、HTML结构变化或PDF解析失败。此时爬虫仍会运行，但无法提取具体电价，只能使用硬编码的参考价格作为回退。

### Q: 模拟数据的价格是真实的吗？

**A**: 不是。模拟数据仅用于演示和测试，价格是在参考值附近随机生成的，**不能用于实际投资决策**。

### Q: 如何将某个省份从模拟数据改为真实数据？

**A**: 需要在 `TariffDataCrawler.ts` 中实现该省份的 `crawl{ProvinceName}()` 方法，并在 `LocalTariffUpdateAgent.ts` 的 switch 语句中添加对应的 case。

### Q: 可信度评分是如何计算的？

**A**:
- **0.95**: 爬虫成功，解析出具体数据
- **0.6**: 爬虫运行但解析失败，使用默认数据
- **0.3**: 未实现爬虫，使用模拟数据

### Q: 如何判断当前使用的是哪种数据？

**A**:
1. 查看控制台日志中的 `[Agent] Data source: ...` 行
2. 检查数据库中 `tariff_versions` 表的 `dataSource` 字段
3. 在UI中查看数据来源徽章

---

## 📚 相关文件

- `src/services/agents/LocalTariffUpdateAgent.ts` - 智能体主逻辑
- `src/services/agents/TariffDataCrawler.ts` - 爬虫实现
- `src/repositories/LocalTariffRepository.ts` - 数据仓库
- `src/services/database/LocalTariffDatabase.ts` - IndexedDB 存储

---

**文档版本**: 1.0
**最后更新**: 2026-03-30
**作者**: Claude (AI Assistant)
