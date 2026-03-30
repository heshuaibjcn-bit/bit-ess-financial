# 电价数据库后端API - 快速部署指南

本目录包含完整的后端API实现，用于解决前端CORS问题并提供稳定的数据抓取服务。

## ⚡ 5分钟快速部署到Vercel（推荐）

### 步骤1：安装Vercel CLI

```bash
npm install -g vercel
```

### 步骤2：安装依赖

```bash
cd server
npm install
```

### 步骤3：部署到Vercel

```bash
vercel
```

按照提示操作：
1. 登录或创建Vercel账号
2. 选择项目设置
3. 确认部署

### 步骤4：获取API URL

部署完成后，Vercel会提供一个URL，例如：
```
https://tariff-crawler-api.vercel.app
```

### 步骤5：配置前端

在前端项目的 `.env.production` 中添加：

```bash
VITE_API_BASE_URL=https://tariff-crawler-api.vercel.app
```

### 步骤6：测试

访问以下URL测试API：

```bash
# 健康检查
curl https://tariff-crawler-api.vercel.app/health

# 获取广东省电价数据
curl https://tariff-crawler-api.vercel.app/api/tariff/GD

# 获取浙江省电价数据
curl https://tariff-crawler-api.vercel.app/api/tariff/ZJ

# 批量获取
curl -X POST https://tariff-crawler-api.vercel.app/api/tariff/batch \
  -H "Content-Type: application/json" \
  -d '{"provinces": ["GD", "ZJ", "JS"]}'
```

## 📦 本地开发

### 启动开发服务器

```bash
cd server
npm install
npm run dev
```

API将在 `http://localhost:3001` 运行

### 测试本地API

```bash
# 健康检查
curl http://localhost:3001/health

# 获取电价数据
curl http://localhost:3001/api/tariff/GD
```

## 🔧 其他部署选项

### Docker部署

```bash
# 构建镜像
docker build -t tariff-crawler-api .

# 运行容器
docker run -p 3001:3001 tariff-crawler-api
```

### VPS部署

```bash
# 1. 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装PM2
npm install -g pm2

# 3. 部署代码
git clone your-repo
cd your-repo/server
npm install
npm run build

# 4. 启动服务
pm2 start dist/tariff-crawler-api.js --name tariff-api

# 5. 配置自动启动
pm2 startup
pm2 save
```

## 📊 API端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/tariff/:province` | GET | 获取省份电价数据 |
| `/api/tariff/batch` | POST | 批量获取多个省份 |
| `/api/cache/clear` | POST | 清除缓存 |
| `/api/cache/stats` | GET | 获取缓存统计 |

### 支持的省份代码

- `GD` - 广东省
- `ZJ` - 浙江省
- `JS` - 江苏省

## 🔒 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `PORT` | 服务端口 | `3001` |
| `NODE_ENV` | 环境 | `development` |
| `API_KEY` | API密钥（可选） | - |

## 📈 监控

### 查看日志

```bash
# Vercel
vercel logs

# PM2
pm2 logs tariff-api

# Docker
docker logs -f container-id
```

### 性能监控

API自动缓存请求24小时，查看缓存统计：

```bash
curl http://localhost:3001/api/cache/stats
```

## 🆘 故障排除

### 问题1：端口被占用

```bash
# 查找占用端口的进程
lsof -ti:3001

# 杀死进程
kill -9 $(lsof -ti:3001)
```

### 问题2：依赖安装失败

```bash
# 清除缓存
rm -rf node_modules package-lock.json
npm install
```

### 问题3：TypeScript编译错误

```bash
# 重新构建
rm -rf dist
npm run build
```

## 📚 更多信息

详细部署指南请参考：`docs/TARIFF_CRAWLER_DEPLOYMENT.md`

## 💡 提示

1. **免费额度**：Vercel免费额度足够小项目使用
2. **自动HTTPS**：Vercel自动配置SSL证书
3. **全球CDN**：Vercel自动全球部署
4. **零运维**：无需管理服务器
5. **即时扩展**：自动处理流量峰值

## 🎯 下一步

1. ✅ 部署后端API
2. ✅ 配置前端环境变量
3. ✅ 测试API连接
4. ✅ 验证数据抓取功能
5. ✅ 设置定时任务（可选）

开始使用真实电价数据吧！🚀
