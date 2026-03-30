# 电价数据库后端API部署指南

本指南提供完整的后端API部署方案，解决CORS问题，实现生产环境的真实数据抓取。

## 🎯 问题分析

### 为什么客户端爬虫无法直接工作？

1. **CORS（跨域资源共享）限制**
   - 浏览器的同源策略阻止前端直接访问政府网站
   - 政府网站没有设置`Access-Control-Allow-Origin`头

2. **网络稳定性**
   - 政府网站可能响应慢或不稳定
   - 需要重试机制和超时控制

3. **数据缓存需求**
   - 避免频繁请求相同内容
   - 减少对目标网站的压力

## 🏗️ 解决方案架构

```
前端应用
  ↓
后端API (本服务)
  ↓
政府网站 (广东省/浙江省/江苏省发改委)
```

**后端API职责：**
- ✅ 绕过CORS限制
- ✅ 提供请求缓存（24小时）
- ✅ 实现重试机制
- ✅ 解析HTML和PDF
- ✅ 定时更新数据

## 📦 部署选项

### 选项1：Vercel Serverless Functions（推荐）

**优点：**
- ✅ 免费额度足够小项目使用
- ✅ 自动HTTPS
- ✅ 全球CDN加速
- ✅ 零配置部署

**部署步骤：**

1. 安装Vercel CLI：
```bash
npm install -g vercel
```

2. 创建Vercel配置文件 `vercel.json`：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/tariff-crawler-api.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/tariff/(.*)",
      "dest": "server/tariff-crawler-api.ts"
    }
  ]
}
```

3. 部署：
```bash
vercel
```

4. 访问：`https://your-project.vercel.app/api/tariff/GD`

### 选项2：Express.js + VPS/云服务器

**优点：**
- ✅ 完全控制
- ✅ 可以运行长时间任务
- ✅ 支持定时任务

**部署步骤：**

1. 安装依赖：
```bash
cd server
npm install
```

2. 构建TypeScript：
```bash
npm run build
```

3. 启动服务：
```bash
npm start
```

4. 使用PM2保持运行：
```bash
npm install -g pm2
pm2 start dist/tariff-crawler-api.js --name tariff-api
pm2 save
pm2 startup
```

### 选项3：Docker容器（推荐用于生产）

**优点：**
- ✅ 环境一致性
- ✅ 易于扩展
- ✅ 快速部署

**部署步骤：**

1. 创建 `Dockerfile`：
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY server/tsconfig.json ./
COPY server/tariff-crawler-api.ts ./

RUN npm install -g typescript tsx
RUN npx tsc

EXPOSE 3001

CMD ["node", "dist/tariff-crawler-api.js"]
```

2. 构建镜像：
```bash
docker build -t tariff-crawler-api .
```

3. 运行容器：
```bash
docker run -p 3001:3001 tariff-crawler-api
```

4. 使用Docker Compose：
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    restart: always
```

### 选项4：Netlify Functions

**部署步骤：**

1. 创建 `netlify.toml`：
```toml
[build]
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

2. 将API代码移到 `netlify/functions/api.ts`

3. 部署：
```bash
netlify deploy --prod
```

### 选项5：Cloudflare Workers

**优点：**
- ✅ 全球边缘网络
- ✅ 免费额度慷慨
- ✅ 超低延迟

**部署步骤：**

1. 安装Wrangler CLI：
```bash
npm install -g wrangler
```

2. 创建Worker脚本

3. 部署：
```bash
wrangler publish
```

## 🔧 前端集成

部署后端API后，更新前端配置：

### 1. 创建环境变量

创建 `.env.production`：
```bash
VITE_API_BASE_URL=https://your-backend-api.com
```

### 2. 更新前端代码

修改 `src/services/agents/TariffDataCrawler.ts`：

```typescript
async crawlGuangdong(): Promise<CrawlResult> {
  try {
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/tariff/GD`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: result.success,
      data: result.data,
      source: result.source || 'API',
      crawledAt: result.crawledAt,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      source: 'API',
      crawledAt: new Date().toISOString(),
    };
  }
}
```

### 3. 更新CORS配置

后端API已经配置了CORS，允许所有来源访问：
```typescript
app.use(cors());
```

生产环境建议限制来源：
```typescript
app.use(cors({
  origin: ['https://your-frontend.com', 'https://your-app.vercel.app'],
}));
```

## 🚀 快速开始

### 本地测试

1. 启动后端API：
```bash
cd server
npm install
npm run dev
```

2. 测试API：
```bash
curl http://localhost:3001/api/tariff/GD
```

3. 更新前端环境变量：
```bash
VITE_API_BASE_URL=http://localhost:3001
```

4. 启动前端：
```bash
npm run dev
```

### 生产部署

**推荐流程（Vercel）：**

1. 部署后端到Vercel：
```bash
cd server
vercel
```

2. 获取后端URL（例如：`https://tariff-api.vercel.app`）

3. 更新前端环境变量：
```bash
VITE_API_BASE_URL=https://tariff-api.vercel.app
```

4. 部署前端：
```bash
vercel --prod
```

## 🔒 安全配置

### 1. API密钥认证（可选）

```typescript
const API_KEY = process.env.API_KEY;

app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### 2. 速率限制

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100个请求
});

app.use('/api/', limiter);
```

### 3. 请求日志

```typescript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

## 📊 监控和维护

### 1. 健康检查端点

访问 `/health` 端点检查服务状态：
```bash
curl https://your-api.com/health
```

### 2. 缓存管理

清除缓存：
```bash
curl -X POST https://your-api.com/api/cache/clear
```

查看缓存统计：
```bash
curl https://your-api.com/api/cache/stats
```

### 3. 错误监控

使用Sentry或其他错误监控服务：
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});

app.use(Sentry.Handlers.errorHandler());
```

## 💰 成本估算

### Vercel方案（推荐）

| 项目 | 免费额度 | 预估成本 |
|------|----------|----------|
| 请求次数 | 100GB/月 | $0-20/月 |
| 执行时间 | 100小时/月 | $0-10/月 |
| 总计 | - | **$0-30/月** |

### VPS方案

| 提供商 | 配置 | 月费 |
|--------|------|------|
| DigitalOcean | 1GB RAM, 1 CPU | $6/月 |
| Linode | 1GB RAM, 1 CPU | $5/月 |
| AWS EC2 | t2.micro | $8.5/月 |

## 🎯 生产环境检查清单

- [ ] 后端API已部署
- [ ] 前端环境变量已配置
- [ ] HTTPS已启用
- [ ] CORS配置正确
- [ ] 缓存机制工作正常
- [ ] 错误监控已设置
- [ ] 日志记录已启用
- [ ] 健康检查端点可访问
- [ ] 定时任务已配置
- [ ] 备份策略已制定

## 🐛 常见问题

### Q1: API返回404错误

**原因：** 路由配置不正确

**解决：** 检查vercel.json或netlify.toml配置

### Q2: 请求超时

**原因：** 政府网站响应慢

**解决：** 增加超时时间或使用缓存

### Q3: CORS错误仍然存在

**原因：** 前端仍在尝试直接访问政府网站

**解决：** 确保前端通过后端API访问

### Q4: 数据不准确

**原因：** 政府网站结构变化

**解决：** 更新解析逻辑或使用人工验证

## 📞 支持

如有问题，请查看：
- 代码仓库：`server/tariff-crawler-api.ts`
- API文档：访问 `/health` 端点
- 示例请求：查看本目录下的示例代码
