# 🚀 让电价数据库在生产环境工作 - 5分钟部署指南

这个指南将帮助你在5分钟内部署后端API，解决CORS问题，让真实的电价数据抓取功能正常工作。

## 📋 前置要求

- ✅ Node.js 18+ 已安装
- ✅ npm 或 bun 已安装
- ✅ GitHub 账号（用于Vercel部署）

## ⚡ 步骤1：部署后端API（2分钟）

### 选项A：使用Vercel（推荐，免费）

```bash
# 1. 安装Vercel CLI
npm install -g vercel

# 2. 登录Vercel
vercel login

# 3. 部署后端API
cd server
npm install
vercel

# 4. 按照提示操作：
# - 连接GitHub账号
# - 选择项目设置
# - 确认部署
```

**完成！** 你会得到一个URL，例如：
```
https://tariff-crawler-api.vercel.app
```

### 选项B：本地运行（测试用）

```bash
# 1. 安装依赖
cd server
npm install

# 2. 启动服务
npm run dev

# 3. API将在 http://localhost:3001 运行
```

## 🔧 步骤2：配置前端（1分钟）

### 创建环境变量文件

在项目根目录创建 `.env.production`：

```bash
VITE_API_BASE_URL=https://tariff-crawler-api.vercel.app
```

**重要：** 将URL替换为你在步骤1中获得的实际URL

### 本地开发环境

创建 `.env.development`：

```bash
VITE_API_BASE_URL=http://localhost:3001
```

## ✅ 步骤3：测试API（1分钟）

```bash
# 测试健康检查
curl https://tariff-crawler-api.vercel.app/health

# 测试获取广东省电价数据
curl https://tariff-crawler-api.vercel.app/api/tariff/GD

# 测试获取浙江省电价数据
curl https://tariff-crawler-api.vercel.app/api/tariff/ZJ
```

**预期结果：**
```json
{
  "success": true,
  "province": "GD",
  "data": {
    "policyNumber": "...",
    "policyTitle": "...",
    "effectiveDate": "2026-XX-XX",
    "tariffs": [...],
    "timePeriods": {...}
  },
  "crawledAt": "2026-03-30T..."
}
```

## 🎯 步骤4：更新前端代码（1分钟）

### 方法1：使用新的API客户端

更新 `src/services/agents/LocalTariffUpdateAgent.ts`：

```typescript
import { getTariffDataCrawlerWithAPI } from '@/services/api/TariffApiClient';

// 替换原来的爬虫
const crawler = new TariffDataCrawlerWithAPI(
  import.meta.env.VITE_API_BASE_URL
);
```

### 方法2：直接调用API

```typescript
import { fetchTariffData } from '@/services/api/TariffApiClient';

// 在组件中使用
const result = await fetchTariffData('GD');
if (result.success && result.data) {
  console.log('Tariff data:', result.data);
}
```

## 🚀 步骤5：部署前端（1分钟）

```bash
# 部署到Vercel
npm run build
vercel --prod
```

## ✅ 验证功能

1. 打开前端应用
2. 进入电价数据库管理页面
3. 选择一个省份（如广东省）
4. 点击"检查当前省份"
5. 查看：现在应该显示真实的电价数据！

## 🎉 完成！

你的电价数据库现在使用真实的政府数据源！

## 📊 工作原理

```
用户点击"检查更新"
    ↓
前端调用后端API
    ↓
后端爬取政府网站
    ↓
解析HTML/PDF
    ↓
返回结构化数据
    ↓
前端显示给用户
```

## 💡 提示

1. **缓存**：后端自动缓存数据24小时，提高速度
2. **定时更新**：每小时自动更新数据
3. **错误处理**：如果爬取失败，自动使用默认数据
4. **监控**：访问 `/health` 端点检查服务状态

## 🔧 故障排除

### 问题1：前端仍然显示CORS错误

**解决：** 确保前端环境变量正确设置
```bash
echo "VITE_API_BASE_URL=https://your-api.vercel.app" > .env.production
```

### 问题2：API返回404

**解决：** 检查后端是否正确部署
```bash
curl https://your-api.vercel.app/health
```

### 问题3：数据不准确

**解决：**
1. 清除缓存：`curl -X POST https://your-api.vercel.app/api/cache/clear`
2. 等待下次定时更新（每小时）
3. 检查政府网站是否可访问

## 📚 更多信息

- 详细部署指南：`docs/TARIFF_CRAWLER_DEPLOYMENT.md`
- 后端API文档：`server/README.md`
- API客户端示例：`src/services/api/TariffApiClient.ts`

## 🆘 需要帮助？

1. 检查后端日志：`vercel logs`
2. 测试API端点：使用curl命令
3. 查看缓存状态：访问 `/api/cache/stats`

**开始使用真实的电价数据吧！** 🎊
