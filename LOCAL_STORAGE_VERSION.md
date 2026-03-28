# 本地存储版本说明

## 更新内容

已将 Supabase 云端存储替换为**本地存储方案**，无需任何云服务配置即可使用完整功能。

## 主要变化

### 1. 认证系统
- ❌ 移除：Supabase Auth
- ✅ 使用：本地存储认证
- 📧 功能：注册、登录、登出
- 🔒 安全：密码存储在浏览器 localStorage 中

### 2. 项目存储
- ❌ 移除：Supabase PostgreSQL 数据库
- ✅ 使用：localStorage + 实时同步
- 💾 功能：创建、编辑、删除、复制项目
- 🔄 同步：跨标签页实时同步

### 3. 数据位置
所有数据存储在浏览器的 localStorage 中：
- `ess_users` - 用户账号信息
- `ess_current_user` - 当前登录会话
- `ess_projects` - 项目数据
- `ess_user_profiles` - 用户配置

## 功能对比

| 功能 | Supabase 版本 | 本地存储版本 |
|------|--------------|------------|
| 用户注册/登录 | ✅ | ✅ |
| 项目 CRUD | ✅ | ✅ |
| 实时同步 | ✅ 跨设备 | ✅ 跨标签页 |
| 数据持久化 | ✅ 云端 | ✅ 浏览器 |
| 配置难度 | ⚠️ 需要云服务 | ✅ 零配置 |
| 数据备份 | ✅ 云端自动 | ⚠️ 需手动导出 |
| 多设备访问 | ✅ | ❌ 单设备 |

## 优缺点

### 优点
- ✅ **零配置**：无需创建云账号或配置 API
- ✅ **隐私保护**：数据完全在本地，不上传到任何服务器
- ✅ **快速启动**：开箱即用，无需等待
- ✅ **离线可用**：无需网络连接即可使用
- ✅ **无成本**：无需付费云服务

### 缺点
- ⚠️ **数据丢失风险**：清除浏览器数据会丢失所有项目
- ⚠️ **单设备限制**：数据不会在不同设备间同步
- ⚠️ **无自动备份**：需要手动导出重要项目

## 数据备份建议

### 方案 1: 导出 PDF
使用内置的 PDF 导出功能保存重要项目报告。

### 方案 2: 手动导出数据
在浏览器开发者工具中导出 localStorage：
1. 打开开发者工具（F12）
2. 切换到 Application 标签
3. 选择 Local Storage → localhost:5173
4. 复制并保存相关键值对

### 方案 3: 未来增强
可以添加以下功能：
- JSON 导出/导入
- 定期自动备份提示
- 可选的云端同步

## 使用指南

### 注册账号
1. 访问 http://localhost:5173/register
2. 填写邮箱、密码和名称
3. 点击"创建账户"

### 登录
1. 访问 http://localhost:5173/login
2. 输入邮箱和密码
3. 点击"登录"

### 创建项目
1. 登录后会自动跳转到项目列表
2. 点击"新建项目"按钮
3. 填写项目信息并开始分析

### 数据持久化
- 所有更改会自动保存
- 刷新页面数据不会丢失
- 关闭浏览器后数据仍然保留
- 清除浏览器数据会删除所有内容

## 技术实现

### 文件变更
- ✅ 新增：`src/lib/localStorage.ts` - 本地存储服务
- ✅ 修改：`src/contexts/AuthContext.tsx` - 使用本地认证
- ✅ 修改：`src/stores/cloudProjectStore.ts` - 使用本地存储
- ✅ 修改：`src/hooks/realtime/useRealtimeProjects.ts` - 本地实时同步
- ❌ 删除：`src/lib/supabase.ts` - 不再需要

### 存储结构
```typescript
// 用户数据
interface User {
  id: string;
  email: string;
  password: string;
  displayName?: string;
  createdAt: string;
}

// 项目数据
interface LocalProject {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  formData: ProjectInput;
  status: 'draft' | 'in_progress' | 'completed';
  collaborationModel: string | null;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## 迁移到云端（可选）

如果将来需要云端功能，可以：
1. 按照 `CLOUD_SETUP.md` 设置 Supabase
2. 恢复 Supabase 相关代码
3. 提供数据迁移工具从 localStorage 导入到云端

## 常见问题

### Q: 数据会丢失吗？
A: 只要不清除浏览器数据，数据会一直保留。建议定期导出重要项目。

### Q: 可以在不同电脑上使用吗？
A: 本地存储版本的数据只在当前浏览器中。如需多设备访问，需要配置 Supabase 云端同步。

### Q: 如何备份数据？
A: 使用 PDF 导出功能保存项目报告，或在开发者工具中导出 localStorage 数据。

### Q: 安全吗？
A: 密码存储在本地浏览器中，不会上传到任何服务器。但请勿在公共电脑上使用。
