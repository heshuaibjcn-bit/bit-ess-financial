# Platform Services - 平台通用服务架构

## 概述

已将智能体系统的核心功能抽象为平台通用服务，提供可复用的 AI 服务基础设施。

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Platform Services Layer                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   AIClient    │  │ CacheManager │  │  AgentBase   │    │
│  │               │  │               │  │              │    │
│  │  - LLM 抽象   │  │  - LRU 缓存   │  │  - 输入验证   │    │
│  │  - 重试逻辑   │  │  - TTL 管理   │  │  - 结果缓存   │    │
│  │  - 速率限制   │  │  - 统计信息   │  │  - 错误处理   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                    │                    │            │
│         └────────────────────┴────────────────────┘            │
│                            │                                 │
│                   ┌─────────────────────────────┐            │
│                   │   ServiceRegistry (DI)      │            │
│                   │   - 服务注册                  │            │
│                   │   - 服务发现                  │            │
│                   │   - 依赖注入                  │            │
│                   └─────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
         ┌────────────────────┴────────────────────┐
         │         Application Layer               │
         │  - Policy Agent                         │
         │  - Tariff Agent                         │
         │  - Due Diligence Agent                  │
         │  - ...                                   │
         └────────────────────────────────────────┘
```

## 核心服务

### 1. AIClient - 统一 AI 客户端

**功能：**
- 支持多个 LLM 提供者（GLM、Claude 等）
- 自动重试机制（指数退避 + 抖动）
- 速率限制保护
- 流式响应支持
- 批量请求处理

**使用方式：**
```typescript
import { getAIClient } from '@/services/platform';

const client = getAIClient();
const response = await client.chat({
  messages: [{ role: 'user', content: '你好' }],
  system: '你是一个助手',
  maxTokens: 1024
});
```

### 2. CacheManager - 通用缓存管理

**功能：**
- LRU（最近最少使用）淘汰策略
- TTL（生存时间）自动过期
- 缓存命中率统计
- 类型安全的泛型支持

**使用方式：**
```typescript
import { getCache } from '@/services/platform';

const cache = getCache<MyDataType>();

// 设置缓存（1小时TTL）
cache.set('key', data, 3600000);

// 获取缓存
const data = cache.get('key');

// 查看统计
const stats = cache.getStats();
console.log('Hit rate:', stats.hitRate);
```

### 3. AgentBase - 智能体基类

**功能：**
- 标准 execute() 方法
- 输入验证框架
- 结果自动缓存
- 错误处理和日志
- 批量执行支持

**使用方式：**
```typescript
import { AgentBase } from '@/services/platform';

interface MyInput { text: string }
interface MyOutput { result: string }

class MyAgent extends AgentBase<MyInput, MyOutput> {
  protected config: AgentConfig = {
    name: 'my-agent',
    version: '1.0.0',
    description: '我的智能体',
    category: 'custom'
  };

  protected validateInput(input: MyInput) {
    const errors: string[] = [];
    if (!input.text) errors.push('text is required');
    return { valid: errors.length === 0, errors };
  }

  protected async process(input: MyInput): Promise<MyOutput> {
    const response = await this.callAI({
      messages: [{ role: 'user', content: input.text }]
    });
    return { result: response };
  }
}

// 使用
const agent = new MyAgent();
const result = await agent.execute({ text: '你好' });
```

### 4. ServiceRegistry - 服务注册表

**功能：**
- 服务注册和发现
- 依赖注入容器
- 单例模式管理

**使用方式：**
```typescript
import { getServiceRegistry } from '@/services/platform';

const registry = getServiceRegistry();

// 注册服务
registry.register('my-service', myServiceInstance);

// 获取服务
const service = registry.get('my-service');

// 列出所有服务
const services = registry.list();
```

## 优势

### 1. 代码复用
- ✅ 核心功能只需实现一次
- ✅ 所有智能体自动继承通用能力
- ✅ 减少重复代码

### 2. 一致性
- ✅ 统一的错误处理
- ✅ 统一的日志格式
- ✅ 统一的缓存策略

### 3. 可扩展性
- ✅ 轻松添加新的 LLM 提供者
- ✅ 轻松创建新的智能体
- ✅ 插件化架构

### 4. 性能优化
- ✅ 内置缓存减少 API 调用
- ✅ 速率限制防止配额耗尽
- ✅ 批量处理提高效率

### 5. 可维护性
- ✅ 清晰的分层架构
- ✅ 单一职责原则
- ✅ 易于测试和调试

## 迁移指南

### 现有智能体如何使用平台服务

**之前：**
```typescript
class PolicyUpdateAgent {
  async execute(input: PolicyUpdateInput) {
    // 手动实现所有功能
    // 手动处理重试
    // 手动处理缓存
    // 手动处理错误
  }
}
```

**之后：**
```typescript
class PolicyUpdateAgent extends AgentBase<PolicyUpdateInput, PolicyUpdateResult> {
  protected validateInput(input) { /* ... */ }
  protected async process(input) {
    // 只关注核心逻辑
    // 重试、缓存、错误处理由基类处理
  }
}
```

## 服务健康检查

```typescript
import { getPlatformHealth } from '@/services/platform';

const health = getPlatformHealth();
console.log(health);
// {
//   services: ['ai-client', 'cache'],
//   aiClient: { provider: 'GLM', model: 'glm-4-turbo', ... },
//   cache: { size: 5, maxSize: 100, hitRate: 0.85 },
//   timestamp: '2024-03-29T12:00:00.000Z'
// }
```

## 测试和演示

### 访问测试页面
```
http://localhost:5174/test-platform-services.html
```

### 运行示例智能体
```typescript
import { exampleUsage } from '@/services/platform/examples/ExampleAgent';

const results = await exampleUsage();
```

## 文件结构

```
src/services/platform/
├── index.ts                    # 导出所有服务
├── PlatformServices.ts         # AIClient, CacheManager, ServiceRegistry
├── AgentBase.ts                # AgentBase, AgentRegistry, InputValidator
└── examples/
    └── ExampleAgent.ts         # 使用示例

public/
└── test-platform-services.html  # 测试演示页面
```

## 最佳实践

### 1. 创建新智能体
```typescript
// 1. 继承 AgentBase
// 2. 定义输入输出类型
// 3. 实现 validateInput()
// 4. 实现 process()
// 5. 配置 AgentConfig
```

### 2. 使用缓存
```typescript
// 对于计算密集型操作
const expensiveResult = await this.cache.get('key');
if (!expensiveResult) {
  const result = await this.process(input);
  this.cache.set('key', result, 3600000);
}
```

### 3. 批量处理
```typescript
// 使用批量 API 提高效率
const results = await client.batchChat(requests);
```

### 4. 错误处理
```typescript
// AgentBase 自动处理错误并返回标准格式
const result = await agent.execute(input);
if (!result.success) {
  console.error(result.error);
}
```

## 下一步

### 短期
- [ ] 将现有 7 个智能体迁移到 AgentBase
- [ ] 添加更多 LLM 提供者支持
- [ ] 实现流式响应
- [ ] 添加缓存预热功能

### 中期
- [ ] 实现智能体编排器
- [ ] 添加智能体监控面板
- [ ] 实现智能体版本管理
- [ ] 添加 A/B 测试支持

### 长期
- [ ] 多租户支持
- [ ] 分布式缓存
- [ ] 智能体市场（插件系统）
- [ ] 低代码智能体构建器

## 总结

平台通用服务提供了：
- ✅ 统一的 AI 接入层
- ✅ 高性能缓存系统
- ✅ 标准化的智能体开发框架
- ✅ 完善的服务注册机制

这将大大简化新功能的开发，提高代码质量和系统性能！
