# 电价数据系统

## 概述

本系统提供可靠的中国各省份工商业电价数据，支持按电压等级自动匹配电价类型，并提供手动和自动更新功能。

## 数据来源

电价数据来自以下官方渠道：

1. **国家发展和改革委员会（NDRC）**
   - 官网：https://www.ndrc.gov.cn/
   - 发布各省份电价调整政策

2. **国家电网公司**
   - 官网：https://www.sgcc.com.cn/
   - 覆盖26个省份（除南方电网区域）

3. **南方电网公司**
   - 官网：https://www.csg.cn/
   - 覆盖广东、广西、云南、贵州、海南五省区

## 数据结构

### 电压等级与电价类型映射

| 电压等级 | 电价类型 | 适用场景 |
|---------|---------|---------|
| 0.4kV（低压） | industrial（一般工商业） | 不满1千伏的工商业用户 |
| 10kV（高压） | large_industrial（大工业） | 1-10千伏的大工业用户 |
| 35kV（超高压） | large_industrial（大工业） | 35千伏及以上的大型工业用户 |

### 时段划分

**峰时段**：电价最高的时段，通常在白天用电高峰期
**平时段**：介于峰谷之间的过渡时段
**谷时段**：电价最低的时段，通常在夜间和凌晨

具体时段划分因省份而异，详见各省电价政策文件。

## 使用方法

### 1. 自动加载

当用户在表单中选择省份和电压等级后，电价数据会自动加载：

```typescript
// 在表单中
<FormField name="facilityInfo.voltageLevel">
  <Select options={['0.4kV', '10kV', '35kV']} />
</FormField>

// 电价自动更新
useEffect(() => {
  const tariff = getTariffByVoltage(province, voltageLevel);
  // 自动填充峰谷平电价和24小时分布
}, [province, voltageLevel]);
```

### 2. 手动更新

用户可以点击"电价数据"按钮手动检查和更新：

```typescript
<TariffUpdateButton onUpdated={() => {
  // 数据更新后的回调
  refreshTariffData();
}} />
```

### 3. 编程方式访问

```typescript
import { getTariffService } from '@/services/tariffDataService';

const service = getTariffService();

// 获取特定省份和电压等级的电价
const tariff = service.getTariffByVoltage('guangdong', '0.4kV');

// 生成24小时电价分布
const hourlyPrices = service.generateHourlyPrices('guangdong', '0.4kV');

// 检查是否需要更新
const needsUpdate = service.needsUpdate();

// 手动触发更新
await service.updateTariffData();
```

## 自动更新机制

### 更新频率

- **检查频率**：每30天自动检查一次更新
- **更新周期**：按发改委和电网公司发布周期，通常为每月或每季度
- **有效期提示**：显示距离下次更新的天数

### 更新流程

1. **自动检查**：应用启动时检查距离上次更新的时间
2. **版本比较**：对比本地版本号与远程版本号
3. **可用更新通知**：如果有新版本，显示"NEW"标识和提示
4. **手动更新**：用户点击"更新"按钮执行更新
5. **数据验证**：验证新数据格式的正确性
6. **本地存储**：更新后保存到localStorage

### 数据存储

电价数据存储在以下位置：

- **运行时内存**：应用启动时从JSON文件加载
- **localStorage**：更新后的数据持久化存储
- **缓存**：使用Map缓存已访问的省份数据

## 当前覆盖的省份

### 详细数据（5个省份）

- 广东省（guangdong）
- 浙江省（zhejiang）
- 江苏省（jiangsu）
- 山东省（shandong）
- 上海市（shanghai）

### 默认数据（其余26个省份）

使用全国平均电价作为默认值，包含峰谷平三档电价和标准时段划分。

## 数据字段说明

### TariffInfo（电价信息）

```typescript
interface TariffInfo {
  tariffType: TariffType;        // 电价类型
  name: string;                  // 电价名称
  peakPrice: number;             // 峰时电价（元/kWh）
  valleyPrice: number;           // 谷时电价（元/kWh）
  flatPrice: number;             // 平时电价（元/kWh）
  effectiveDate: string;         // 生效日期（YYYY-MM-DD）
  policyNumber: string;          // 政策文件编号
}
```

### HourlyPrice（小时电价）

```typescript
interface HourlyPrice {
  hour: number;      // 小时（0-23）
  price: number;     // 电价（元/kWh）
  period: 'peak' | 'valley' | 'flat';  // 时段
}
```

## 定价依据

电价数据基于以下政策文件：

1. **国家政策**
   - 《关于完善工商业分时电价有关事项的通知》
   - 《关于电价调整的通知》

2. **地方政策**
   - 各省发改委发布的电价调整文件
   - 电网公司公布的销售电价表

## 注意事项

1. **数据时效性**
   - 电价政策会定期调整，建议每月检查更新
   - 政策文件生效后1-2个月内数据会更新

2. **使用场景**
   - 本数据适用于投资测算和可行性研究
   - 实际交易价格以电网公司账单为准

3. **免责声明**
   - 本数据仅供参考，不构成投资建议
   - 使用本数据产生的任何后果，开发者不承担责任

## 技术支持

如有电价数据问题或更新需求，请联系：

- **技术支持**：support@ess-financial.com
- **数据问题**：data@ess-financial.com
- **反馈渠道**：https://github.com/your-org/ess-financial/issues

## 更新日志

### v1.0.0 (2026-03-28)
- 初始版本
- 支持5个省份的详细电价数据
- 实现按电压等级自动匹配电价类型
- 添加手动和自动更新功能
