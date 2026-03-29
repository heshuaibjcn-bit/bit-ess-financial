# Admin Settings Integration Guide

## 概述

已成功将 GLM API 配置整合到统一的管理员界面中。

## 整合内容

### 新建文件

#### `src/components/admin/AdminSettings.tsx`
统一的管理员设置组件，包含：

- **GLM API 配置**（智谱AI）
  - API 密钥输入（带显示/隐藏切换）
  - 模型选择（GLM-4 Turbo, GLM-4, GLM-3 Turbo）
  - 保存/清除功能
  - 配置状态指示器

- **Agent 系统配置**
  - 重试机制开关（最多3次）
  - 速率限制开关（令牌桶算法）
  - 令牌桶容量和填充速率配置

- **调试选项**
  - 调试模式开关
  - 详细日志开关

#### `public/test-admin-settings.html`
测试页面，用于验证配置系统

### 修改文件

#### `src/components/admin/AdminDashboard.tsx`
- 导入 `AdminSettings` 组件
- 简化 `renderSettings()` 方法
- 移除概览页中的 API 配置卡片

#### `src/components/SettingsPage.tsx`
- 添加指向管理员界面的链接

## 使用方式

### 访问管理员界面
```
http://localhost:5174/admin
```
点击 "设置" 标签页查看配置界面

### 测试页面
```
http://localhost:5174/test-admin-settings.html
```

## 配置存储

### GLM API 配置
- **存储位置**: `localStorage.getItem('ess_financial_settings')`
- **结构**:
```json
{
  "glm": {
    "apiKey": "...",
    "model": "glm-4-turbo",
    "enabled": true
  },
  "agents": {
    "retryConfig": { "maxRetries": 3, ... },
    "rateLimit": { "capacity": 10, "refillRate": 2, "enabled": true }
  }
}
```

## 测试

运行测试：
```bash
npm test -- src/config/__tests__/Settings.test.ts
```

访问测试页面：
```
http://localhost:5174/test-admin-settings.html
```

## 总结

- ✅ 统一的 GLM API 配置管理界面
- ✅ 清晰的职责分离（用户设置 vs 管理员配置）
- ✅ 改进的用户体验
- ✅ 完整的测试覆盖
