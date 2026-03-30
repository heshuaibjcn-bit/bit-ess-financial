# 全国电价数据库系统 - 使用指南

## 📋 概述

全国电价数据库系统是ESS Financial平台的核心功能之一，提供完整的全国31个省份电价数据管理能力，包括：

- ✅ 完整的电价数据库架构
- ✅ 智能体自动更新
- ✅ 版本控制和历史对比
- ✅ 数据验证和审批流程
- ✅ 实时变化通知

## 🏗️ 系统架构

### 数据库架构

```
tariff_provinces (省份表)
    ↓
tariff_versions (版本表)
    ↓
tariff_data (电价数据表)
tariff_time_periods (时段配置表)
    ↓
tariff_update_logs (更新日志表)
```

### 核心组件

1. **数据库层** (Supabase)
   - PostgreSQL数据库
   - Row Level Security (RLS)
   - 实时订阅
   - RESTful API

2. **数据访问层** (TypeScript)
   - `TariffRepository` - 数据仓库
   - 类型安全的API调用
   - 事务管理

3. **业务逻辑层** (智能体)
   - `TariffUpdateAgentEnhanced` - 增强型更新智能体
   - 自动解析电价通知
   - 智能数据验证
   - 变更分析

4. **界面层** (React)
   - `TariffDatabaseManagement` - 管理界面
   - React Hooks
   - 实时更新

## 🚀 快速开始

### 1. 数据库初始化

```bash
# 在Supabase项目中执行SQL迁移
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/migrations/001_create_tariff_tables.sql
```

或在Supabase Dashboard的SQL Editor中执行该脚本。

### 2. 初始化省份数据

```typescript
import { getTariffRepository } from '@/repositories/TariffRepository';

const repository = getTariffRepository();
await repository.initializeProvinces();
```

### 3. 导入历史数据

```typescript
import { getTariffUpdateAgent } from '@/services/agents/TariffUpdateAgent.enhanced';

const agent = getTariffUpdateAgent();
const result = await agent.importHistoricalData();

console.log(`导入完成: ${result.imported} 成功, ${result.failed} 失败`);
```

### 4. 使用管理界面

访问路由: `/admin/tariff-database`

## 📖 详细功能

### 1. 省份管理

查看所有省份的电价数据：

```typescript
import { getTariffRepository } from '@/repositories/TariffRepository';

const repository = getTariffRepository();

// 获取所有省份
const provinces = await repository.getProvinces();

// 获取指定省份的当前电价
const tariffData = await repository.getActiveTariffByProvince('GD');

// 根据电压等级获取电价
const tariff = await repository.getTariffByVoltage('GD', '10kV');
```

### 2. 智能体自动更新

#### 解析电价通知

```typescript
import { getTariffUpdateAgent } from '@/services/agents/TariffUpdateAgent.enhanced';

const agent = getTariffUpdateAgent();

// 解析通知URL
const parsed = await agent.parseNotice('https://example.com/tariff-notice.pdf');

if (parsed) {
  console.log(`解析成功，置信度: ${parsed.confidence}`);
  console.log(`省份: ${parsed.province_name}`);
  console.log(`版本: ${parsed.version}`);
}
```

#### 验证并存储

```typescript
// 验证并存储解析的数据
const result = await agent.validateAndStore(parsed, 'user-id');

if (result.success) {
  console.log(`存储成功，版本ID: ${result.version_id}`);

  // 检查是否需要审批
  if (result.requires_approval) {
    console.log('需要管理员审批');
  }

  // 查看价格变化
  result.changes.price_changes.forEach(change => {
    console.log(`${change.voltage_level} ${change.field}: ${change.change_percent}%`);
  });
}
```

#### 批量检查更新

```typescript
// 批量检查多个省份
const provinceCodes = ['GD', 'ZJ', 'JS'];
const results = await agent.batchCheckProvinces(provinceCodes);

results.forEach(result => {
  if (result.success) {
    console.log(`${result.province_name}: 发现更新`);
  }
});
```

#### 自动定时检查

```typescript
// 自动检查所有省份（适合定时任务）
const summary = await agent.autoCheckAndUpdate();

console.log(`检查了 ${summary.checked} 个省份`);
console.log(`更新了 ${summary.updated} 个省份`);
console.log(`失败 ${summary.failed} 个`);
```

### 3. 版本管理

#### 查看版本历史

```typescript
const history = await repository.getVersionHistory('GD');

history.forEach(version => {
  console.log(`v${version.version} - ${version.effective_date}`);
  console.log(`  状态: ${version.status}`);
  console.log(`  文号: ${version.policy_number}`);
});
```

#### 版本对比

```typescript
const comparison = await repository.compareVersions(versionId1, versionId2);

if (comparison) {
  console.log('版本对比:');
  comparison.changes.forEach(change => {
    console.log(`${change.voltage_level} ${change.field}:`);
    console.log(`  ${change.old_value} → ${change.new_value}`);
    console.log(`  变化: ${change.change_percent}%`);
  });
}
```

### 4. 审批流程

#### 获取待审批项

```typescript
const pending = await repository.getPendingApprovals();

pending.forEach(item => {
  console.log(`${item.province.name} - 版本 ${item.version.version}`);

  if (item.agent_info) {
    console.log(`  智能体: ${item.agent_info.agent_name}`);
    console.log(`  置信度: ${item.agent_info.confidence * 100}%`);
  }
});
```

#### 批准更新

```typescript
const success = await repository.approveUpdate(updateId, 'admin-user-id');

if (success) {
  console.log('更新已批准并激活');
}
```

#### 拒绝更新

```typescript
const success = await repository.rejectUpdate(
  updateId,
  'admin-user-id',
  '数据验证失败：峰时电价低于谷时电价'
);
```

### 5. 更新日志

```typescript
// 获取更新日志
const logs = await repository.getUpdateLogs('GD', 50);

logs.forEach(log => {
  console.log(`${log.update_type} - ${log.status}`);
  console.log(`  触发方式: ${log.trigger_type}`);
  console.log(`  创建时间: ${log.created_at}`);

  if (log.changes_summary.price_changes) {
    log.changes_summary.price_changes.forEach(change => {
      console.log(`  ${change.voltage_level} ${change.field}: ${change.change_percent}%`);
    });
  }
});
```

## 🔧 配置

### 智能体配置

```typescript
import { getTariffUpdateAgent } from '@/services/agents/TariffUpdateAgent.enhanced';

const agent = getTariffUpdateAgent({
  // 自动检查间隔（小时）
  auto_check_interval_hours: 24,

  // 是否启用自动审批（低置信度更新）
  enable_auto_approval: false,

  // 价格变化通知阈值（百分比）
  notification_threshold_percent: 5,

  // 最大重试次数
  max_retries: 3,

  // 数据源配置
  sources: {
    ndrc: 'https://www.ndrc.gov.cn',
    grid_companies: [
      'https://www.csg.cn',
      'https://www.sgcc.com.cn',
    ],
  },
});
```

## 🎯 React Hooks

### useTariffDatabase

```typescript
import { useTariffDatabase } from '@/hooks/useTariffDatabase';

function MyComponent() {
  const {
    provinces,
    selectedProvince,
    versionHistory,
    updateLogs,
    loading,
    error,
    loadProvinceDetail,
    loadVersionHistory,
  } = useTariffDatabase();

  // 使用数据...
}
```

### useAgentUpdate

```typescript
import { useAgentUpdate } from '@/hooks/useTariffDatabase';

function UpdateComponent() {
  const {
    updating,
    results,
    parseNotice,
    validateAndStore,
    autoCheck,
  } = useAgentUpdate();

  const handleUpdate = async () => {
    const summary = await autoCheck();
    // 处理结果...
  };

  return <button onClick={handleUpdate}>检查更新</button>;
}
```

### useApprovalManagement

```typescript
import { useApprovalManagement } from '@/hooks/useTariffDatabase';

function ApprovalComponent() {
  const {
    pendingApprovals,
    loading,
    approveUpdate,
    rejectUpdate,
  } = useApprovalManagement();

  return (
    <div>
      {pendingApprovals.map(item => (
        <div key={item.id}>
          <button onClick={() => approveUpdate(item.id, 'user-id')}>
            批准
          </button>
          <button onClick={() => rejectUpdate(item.id, 'user-id', '原因')}>
            拒绝
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 📡 API接口

### 获取省份列表

```typescript
GET /api/tariff/provinces

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "GD",
      "name": "广东省",
      "region": "南方电网",
      "grid_company": "南方电网"
    }
  ]
}
```

### 获取省份电价

```typescript
GET /api/tariff/provinces/{code}

Response:
{
  "success": true,
  "data": {
    "province": { ... },
    "version": { ... },
    "tariffs": [ ... ],
    "time_periods": { ... }
  }
}
```

### 解析通知

```typescript
POST /api/tariff/agent/parse

Body:
{
  "url": "https://example.com/notice.pdf"
}

Response:
{
  "success": true,
  "data": {
    "province_code": "GD",
    "province_name": "广东省",
    "version": "1.1.0",
    "confidence": 0.95,
    ...
  }
}
```

## 🔐 安全和权限

### 行级安全策略（RLS）

```sql
-- 公开读取电价数据
CREATE POLICY "Public read access to provinces"
  ON tariff_provinces FOR SELECT USING (true);

-- 只有管理员可以写入
CREATE POLICY "Admin write access to versions"
  ON tariff_versions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 用户只能管理自己的订阅
CREATE POLICY "Users manage own subscriptions"
  ON tariff_subscriptions FOR ALL USING (user_id = auth.uid());
```

### 审批流程

智能体提交的更新默认需要审批：

1. 智能体解析电价通知
2. 创建`draft`状态的版本
3. 生成更新日志（`requires_approval: true`）
4. 管理员审核
5. 批准 → 激活版本，将旧版本标记为`expired`
6. 拒绝 → 标记为`failed`，记录原因

## 📊 数据验证

系统自动验证以下内容：

### 必填字段

- 省份代码（2位大写字母）
- 版本号（x.y.z格式）
- 生效日期（有效日期）
- 政策文号

### 价格合理性

- 峰时电价 > 谷时电价
- 所有价格 > 0
- 平均电价与计算值接近

### 时间段完整性

- 必须覆盖24小时
- 小时数0-23
- 无重复

## 🎨 界面截图

管理界面包含以下标签页：

1. **概览** - 省份基本信息、电价概览、时段配置
2. **电价详情** - 各电压等级详细价格数据
3. **版本历史** - 所有历史版本和对比
4. **更新日志** - 完整的更新记录
5. **审批管理** - 待审批的智能体更新

## 🔄 工作流程

### 典型的电价更新流程

```
1. 智能体检测到新通知
   ↓
2. 解析PDF/HTML文档
   ↓
3. 验证数据格式和合理性
   ↓
4. 创建draft版本
   ↓
5. 生成更新日志
   ↓
6. 管理员审批
   ↓
7. 激活版本，标记旧版本过期
   ↓
8. 发送通知给订阅用户
```

## 📈 扩展功能

### 订阅通知

用户可以订阅电价变化通知：

```typescript
// 创建订阅
await supabase.from('tariff_subscriptions').insert({
  user_id: userId,
  province_ids: [provinceId1, provinceId2],
  voltage_levels: ['10kV', '35kV'],
  notification_types: ['price_change', 'new_policy'],
  threshold_percent: 5.0,
});

// 当价格变化超过阈值时，自动发送通知
```

### 定时任务

设置定时任务自动检查更新：

```typescript
// 每天凌晨2点检查
cron.schedule('0 2 * * *', async () => {
  const agent = getTariffUpdateAgent();
  await agent.autoCheckAndUpdate();
});
```

## 🐛 故障排除

### 问题：数据库连接失败

```typescript
// 检查Supabase配置
console.log(supabase);

// 确保环境变量已设置
// VITE_SUPABASE_URL=your-project-url
// VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 问题：智能体解析失败

```typescript
// 检查智能体状态
const agent = getTariffUpdateAgent();

// 查看日志
console.log(agent.getLogs());

// 尝试手动解析
const parsed = await agent.parseNotice(url);
console.log(`置信度: ${parsed?.confidence}`);
```

### 问题：版本审批失败

```typescript
// 检查用户权限
const { data: user } = await supabase.auth.getUser();
console.log('User role:', user);

// 查看待审批项
const pending = await repository.getPendingApprovals();
console.log(`待审批: ${pending.length} 个`);
```

## 📚 相关文档

- [数据库架构文档](./DATABASE.md)
- [智能体系统文档](./AI.md)
- [API文档](./API.md)

## 🤝 贡献

如需改进电价数据库系统，请：

1. Fork项目
2. 创建特性分支
3. 提交Pull Request
4. 参与代码审查

## 📄 许可证

Proprietary - All rights reserved
