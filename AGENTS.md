# AGENTS.md - ESS Financial

> **工商业储能投资分析系统 / C&I Energy Storage Investment Analysis System**
>
> 本文档供 AI 编程助手阅读，帮助理解项目架构和开发规范。
> This document is for AI coding agents to understand the project architecture and conventions.

---

## 项目概览 / Project Overview

ESS Financial 是一个面向工商业储能项目的投资分析计算器，提供 IRR、NPV、投资回收期、LCOE 等关键财务指标计算。

### 核心功能
- **多步骤工作流**: 业主信息 → 电价详情 → 技术评估 → 财务模型 → 报告输出
- **财务指标**: IRR、NPV、Payback Period、LCOE
- **高级分析**: 敏感性分析、场景对比、行业基准
- **PDF 报告**: 专业投资评估报告，含图表和表格
- **本地项目管理**: 无需云端设置，支持 CRUD、自动保存、跨标签页同步

### 技术栈
| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript 5 |
| 构建工具 | Vite 6 |
| 状态管理 | Zustand 5 |
| 路由 | React Router v7 |
| 表单处理 | React Hook Form + Zod |
| 图表 | ECharts 6 + Recharts |
| PDF 生成 | @react-pdf/renderer |
| 样式 | Tailwind CSS 4 |
| 国际化 | i18next (zh/en) |
| 测试 | Vitest + Playwright |

---

## 项目结构 / Project Structure

```
ess_financial/
├── src/
│   ├── components/              # React 组件
│   │   ├── ui/                 # 可复用 UI 组件 (Button, Input, Modal, Toast...)
│   │   ├── form-steps/         # 计算器表单步骤组件
│   │   ├── charts/             # 图表组件 (ECharts/Recharts 封装)
│   │   ├── AIChat/             # AI 聊天侧边栏组件
│   │   ├── admin/              # 管理后台组件
│   │   ├── collaboration/      # 协作功能组件
│   │   ├── form/               # 表单相关组件
│   │   ├── security/           # 安全相关组件
│   │   ├── PDF/                # PDF 报告组件
│   │   └── Export/             # 导出功能组件
│   ├── contexts/               # React Contexts
│   │   ├── AuthContext.tsx     # 认证上下文 (本地存储版)
│   │   └── SecurityContext.tsx # 安全上下文
│   ├── domain/                 # 领域层 - 业务逻辑和模型
│   │   ├── models/             # 领域模型 (Project, Scenario, Benchmark...)
│   │   ├── schemas/            # Zod Schema 定义
│   │   ├── services/           # 领域服务 (计算引擎、分析器)
│   │   └── repositories/       # 仓库接口定义
│   ├── hooks/                  # 自定义 React Hooks
│   │   ├── useCalculator.ts    # 计算逻辑 Hook
│   │   ├── useProject.ts       # 项目管理 Hook
│   │   ├── useAIChat.ts        # AI 聊天 Hook
│   │   └── realtime/           # 实时数据同步 Hooks
│   ├── lib/                    # 工具库
│   │   ├── localStorage.ts     # 本地存储服务 (替代 Supabase)
│   │   ├── supabase.ts         # Supabase 客户端 (可选云端)
│   │   └── echarts-theme.ts    # ECharts 主题配置
│   ├── stores/                 # Zustand 状态管理
│   │   ├── cloudProjectStore.ts # 项目状态管理
│   │   ├── calculationStore.ts # 计算状态管理
│   │   └── uiStore.ts          # UI 状态管理
│   ├── services/               # 应用服务层
│   │   ├── agents/             # AI Agent 服务
│   │   ├── ai/                 # AI 相关服务
│   │   ├── api/                # API 客户端
│   │   ├── cache/              # 缓存服务
│   │   ├── pdf/                # PDF 生成服务
│   │   ├── security/           # 安全服务
│   │   └── data-integration/   # 数据集成服务
│   ├── repositories/           # 数据仓库实现
│   ├── i18n/                   # 国际化配置
│   │   ├── config.ts           # i18n 初始化
│   │   └── locales/            # 翻译文件 (zh.json, en.json)
│   ├── types/                  # TypeScript 类型定义
│   ├── test/                   # 测试文件
│   │   ├── unit/               # 单元测试
│   │   └── e2e/                # E2E 测试 (Playwright)
│   ├── App.tsx                 # 主应用组件
│   └── main.tsx                # 应用入口
├── public/                     # 静态资源
├── server/                     # 服务端代码 (如有)
├── docs/                       # 文档
└── scripts/                    # 脚本工具
```

---

## 构建和开发命令 / Build & Development Commands

```bash
# 开发服务器
npm run dev
# 启动在 http://localhost:5173

# 构建生产版本
npm run build
# 输出到 dist/ 目录

# 预览生产构建
npm run preview

# 类型检查
npm run type-check

# ESLint 检查
npm run lint
```

---

## 测试 / Testing

### 测试框架配置
- **单元测试**: Vitest 2.x + jsdom + @testing-library/react
- **E2E 测试**: Playwright (Chromium, Firefox, WebKit, Mobile)

### 测试命令
```bash
# 运行单元测试 (监视模式)
npm run test

# 运行单元测试 (UI 界面)
npm run test:ui

# 运行单元测试 (单次)
npm run test:run

# 运行 E2E 测试
npm run test:e2e
```

### 测试文件位置
- 单元测试: `src/**/*.test.ts`, `src/**/*.test.tsx`
- E2E 测试: `src/test/e2e/*.spec.ts`
- 测试配置: `vitest.config.ts`, `playwright.config.ts`

### 测试覆盖率要求
- 语句覆盖率: 80%
- 分支覆盖率: 80%
- 函数覆盖率: 80%
- 行覆盖率: 80%

---

## 代码规范 / Code Style Guidelines

### TypeScript 配置
- 严格模式启用 (`strict: true`)
- 目标: ES2020
- 模块: ESNext
- JSX: react-jsx

### 路径别名 / Path Aliases
```typescript
// tsconfig.json 中配置
"@/*": ["./src/*"]
"@/components/*": ["./src/components/*"]
"@/domain/*": ["./src/domain/*"]
"@/lib/*": ["./src/lib/*"]
"@/hooks/*": ["./src/hooks/*"]
```

### 命名规范
- **组件**: PascalCase (e.g., `ProjectCard.tsx`)
- **Hooks**: camelCase, 以 `use` 开头 (e.g., `useCalculator.ts`)
- **工具函数**: camelCase (e.g., `localStorage.ts`)
- **类型/接口**: PascalCase (e.g., `ProjectInput`)
- **常量**: UPPER_SNAKE_CASE (e.g., `PROVINCES`)

### 代码组织原则
1. **领域驱动设计**: 业务逻辑集中在 `src/domain/`
2. **关注点分离**: UI、状态、业务逻辑分层清晰
3. **组件粒度**: 小组件优先，避免巨型组件
4. **类型安全**: 优先使用 Zod Schema 推导类型

---

## 数据模型 / Data Models

### 核心 Schema (Zod)

```typescript
// src/domain/schemas/ProjectSchema.ts

// 31 个中国省份
export const PROVINCES = [
  'guangdong', 'shandong', 'shanghai', 'zhejiang', 'jiangsu', ...
] as const;

// 合作模式
export const COLLABORATION_MODELS = [
  'investor_owned', 'joint_venture', 'emc'
] as const;

// 主项目输入 Schema
export const ProjectInputSchema = z.object({
  province: z.enum(PROVINCES),
  systemSize: SystemSizeSchema,
  costs: CostsSchema,
  financing: FinancingSchema,
  operatingParams: OperatingParamsSchema,
  operatingCosts: OperatingCostsSchema,
  // 业务驱动字段
  ownerInfo: OwnerInfoSchema,
  facilityInfo: FacilityInfoSchema,
  tariffDetail: TariffDetailSchema,
  technicalProposal: TechnicalProposalSchema,
});
```

### 本地存储数据结构
- **用户数据**: `ess_users`, `ess_current_user`
- **项目数据**: `ess_projects`
- **用户配置**: `ess_user_profiles`

---

## 认证与数据持久化 / Auth & Data Persistence

### 本地存储方案
项目默认使用 **localStorage** 进行数据持久化，无需后端:

```typescript
// src/lib/localStorage.ts
export const localAuthService = {
  signUp: async (email, password, displayName) => {...},
  signIn: async (email, password) => {...},
  signOut: async () => {...},
};

export const localProjectService = {
  getProjects: (userId) => {...},
  createProject: (userId, data) => {...},
  updateProject: (userId, projectId, updates) => {...},
  deleteProject: (userId, projectId) => {...},
  duplicateProject: (userId, projectId) => {...},
};
```

### 跨标签页同步
通过 `storage` 事件实现项目数据跨标签页实时同步。

### 可选云端方案
如需多设备同步，可配置 Supabase (见 `CLOUD_SETUP.md`)。

---

## 路由结构 / Routing

```typescript
// 公开路由
/login           - 登录
/register        - 注册
/demo            - 演示模式 (无需登录)
/admin/agent-metrics - Agent 指标面板 (公开)

// 受保护路由 (需登录)
/                - 项目列表/仪表板
/project/:id     - 项目编辑器
/settings        - 设置页面
/admin           - 管理后台
/admin/security  - 安全面板
/admin/tariff-database - 电价数据库管理
```

---

## 国际化 / i18n

- 默认语言: 中文 (zh)
- 支持语言: 中文 (zh), 英文 (en)
- 翻译文件: `src/i18n/locales/zh.json`, `src/i18n/locales/en.json`
- 语言检测: localStorage → navigator

```typescript
// 使用示例
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<span>{t('app.title')}</span>
```

---

## 部署 / Deployment

### Docker 部署
```bash
# 启动完整环境 (包含 PostgreSQL, Redis, Nginx)
docker-compose up -d
```

### 静态托管部署
构建输出为纯静态文件，可部署到:
- Vercel
- Netlify
- Cloudflare Pages
- AWS Amplify

```bash
npm run build
# 部署 dist/ 目录
```

---

## 安全考虑 / Security Considerations

1. **密码存储**: 当前为明文存储 (本地开发模式)，生产环境应使用哈希
2. **XSS 防护**: React 自动转义，避免使用 `dangerouslySetInnerHTML`
3. **输入验证**: 所有用户输入通过 Zod Schema 验证
4. **CSP**: 建议在生产环境配置 Content Security Policy

---

## 开发注意事项 / Development Notes

### 添加新组件
1. 在对应目录创建组件文件 (PascalCase)
2. 如有必要，在 `src/components/index.ts` 导出
3. 编写单元测试 (同目录 `.test.tsx`)

### 添加新 Schema
1. 在 `src/domain/schemas/` 创建 Zod Schema
2. 导出类型定义: `export type Xxx = z.infer<typeof XxxSchema>`
3. 添加交叉验证 (`.refine()` 如有需要)

### 修改存储逻辑
- 项目数据操作通过 `useCloudProjectStore` (Zustand)
- 直接 localStorage 操作应封装在 `src/lib/localStorage.ts`

### 性能优化
- 大组件使用 `React.lazy()` 懒加载 (已在 App.tsx 中配置)
- 列表渲染使用虚拟滚动 (如数据量大)
- 图表使用 `useMemo` 避免重复计算

---

## 关键文件速查 / Quick Reference

| 文件 | 用途 |
|------|------|
| `src/App.tsx` | 路由配置、懒加载、错误边界 |
| `src/main.tsx` | 应用入口、Provider 配置 |
| `src/domain/schemas/ProjectSchema.ts` | 核心数据模型 |
| `src/lib/localStorage.ts` | 本地存储服务 |
| `src/stores/cloudProjectStore.ts` | 项目状态管理 |
| `src/contexts/AuthContext.tsx` | 认证状态 |
| `src/i18n/config.ts` | 国际化配置 |
| `vite.config.ts` | Vite 配置 |
| `vitest.config.ts` | 测试配置 |

---

## 故障排查 / Troubleshooting

### 常见问题
1. **本地存储数据丢失**: 清除浏览器数据会导致所有项目丢失，建议定期导出 PDF 备份
2. **跨标签页不同步**: 检查 `localRealtime` 初始化
3. **类型错误**: 运行 `npm run type-check` 检查

### 调试工具
- React DevTools
- Redux DevTools (Zustand 兼容)
- browser DevTools Application 标签查看 localStorage

---

*最后更新: 2026-03-31*
