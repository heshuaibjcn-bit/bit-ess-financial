/**
 * 电价数据服务 - 服务端入口
 * 
 * 提供：
 * 1. 全国31省电价数据爬虫API
 * 2. 智能体调度服务
 * 3. 数据验证服务
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import tariffRoutes from './routes/tariffRoutes';

const app = express();
const PORT = process.env.TARIFF_SERVICE_PORT || 3001;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// 路由
app.use('/api/tariff', tariffRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'Real Tariff Data Service',
    version: '1.0.0',
    description: '全国真实电价数据服务',
    endpoints: {
      health: 'GET /api/tariff/health',
      provinces: 'GET /api/tariff/provinces',
      crawl: 'POST /api/tariff/crawl/:provinceCode',
      crawlBatch: 'POST /api/tariff/crawl-batch',
      crawlAll: 'POST /api/tariff/crawl-all',
    },
  });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         全国真实电价数据服务 (Real Tariff Service)          ║
║                                                            ║
║   服务端地址: http://localhost:${PORT}                      ║
║   支持省份: 31个省市自治区                                  ║
║   数据来源: 各省发改委官网                                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
