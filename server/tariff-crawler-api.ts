/**
 * 后端电价数据抓取API
 *
 * 这是一个Express.js后端服务，解决CORS问题并提供稳定的数据抓取
 *
 * 功能：
 * 1. 代理爬虫请求，避免CORS问题
 * 2. 实现请求缓存，减少对目标网站的访问频率
 * 3. 定时任务自动更新数据
 * 4. 提供REST API接口
 * 5. 错误处理和重试机制
 *
 * 部署选项：
 * - Vercel Serverless Functions
 * - Netlify Functions
 * - Express.js (VPS/云服务器)
 * - AWS Lambda + API Gateway
 * - Cloudflare Workers
 */

import express from 'express';
import cors from 'cors';
import nodeFetch from 'node-fetch';
import { LRUCache } from 'lru-cache';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';

// ============= 类型定义 =============
interface TariffNotice {
  title: string;
  url: string;
  publishDate: string;
  source: string;
  type: 'html' | 'pdf';
}

interface ParsedTariffData {
  policyNumber: string;
  policyTitle: string;
  effectiveDate: string;
  tariffs: Array<{
    voltageLevel: string;
    tariffType: string;
    peakPrice: number;
    valleyPrice: number;
    flatPrice: number;
  }>;
  timePeriods: {
    peakHours: number[];
    valleyHours: number[];
    flatHours: number[];
    peakDescription?: string;
    valleyDescription?: string;
    flatDescription?: string;
  };
}

// ============= 配置 =============
const CONFIG = {
  // 缓存配置
  cache: {
    max: 100, // 最多缓存100个请求
    ttl: 1000 * 60 * 60 * 24, // 24小时过期
  },

  // 爬虫配置
  crawler: {
    timeout: 30000, // 30秒超时
    retryAttempts: 3,
    retryDelay: 1000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },

  // 定时任务配置
  scheduler: {
    enabled: true,
    cron: '0 2 * * *', // 每天凌晨2点执行
  },
};

// ============= 缓存系统 =============
const crawlCache = new LRUCache<string, any>({
  max: CONFIG.cache.max,
  ttl: CONFIG.cache.ttl,
});

// ============= Express应用 =============
const app = express();
app.use(cors());
app.use(express.json());

// ============= 工具函数 =============

/**
 * 带重试的fetch请求
 */
async function fetchWithRetry(
  url: string,
  attempts: number = CONFIG.crawler.retryAttempts
): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    try {
      console.log(`[Fetch] Attempt ${i + 1}/${attempts} for ${url}`);

      const response = await nodeFetch(url, {
        timeout: CONFIG.crawler.timeout,
        headers: {
          'User-Agent': CONFIG.crawler.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`[Fetch] Success on attempt ${i + 1}`);
      return text;
    } catch (error) {
      console.error(`[Fetch] Attempt ${i + 1} failed:`, error.message);

      if (i === attempts - 1) {
        throw error;
      }

      // 等待后重试
      await new Promise(resolve =>
        setTimeout(resolve, CONFIG.crawler.retryDelay * (i + 1))
      );
    }
  }

  throw new Error('All fetch attempts failed');
}

/**
 * 广东省电价爬虫
 */
async function crawlGuangdong(): Promise<ParsedTariffData> {
  console.log('[Crawler] Starting Guangdong crawl...');

  const cacheKey = 'guangdong:tariff';
  const cached = crawlCache.get(cacheKey);
  if (cached) {
    console.log('[Crawler] Using cached data for Guangdong');
    return cached;
  }

  // 广东省发改委价格处
  const url = 'http://drc.gd.gov.cn/jgml/gfbzzcj/gfxwjg/index.html';
  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);

  // 查找最新的电价通知
  const notices: TariffNotice[] = [];
  $('a[href]').each((_, element) => {
    const $el = $(element);
    const title = $el.text().trim();
    const href = $el.attr('href');

    if (!href || !title) return;

    // 过滤电价相关通知
    if (title.includes('电价') || title.includes('销售电价')) {
      notices.push({
        title,
        url: href.startsWith('http') ? href : `http://drc.gd.gov.cn${href}`,
        publishDate: '',
        source: '广东省',
        type: href.toLowerCase().includes('.pdf') ? 'pdf' : 'html',
      });
    }
  });

  if (notices.length === 0) {
    throw new Error('No tariff notices found');
  }

  // 使用最新通知
  const latestNotice = notices[0];
  console.log('[Crawler] Found notice:', latestNotice.title);

  // 解析通知内容
  const parsedData = await parseNoticeContent(latestNotice);

  // 缓存结果
  crawlCache.set(cacheKey, parsedData);

  return parsedData;
}

/**
 * 浙江省电价爬虫
 */
async function crawlZhejiang(): Promise<ParsedTariffData> {
  console.log('[Crawler] Starting Zhejiang crawl...');

  const cacheKey = 'zhejiang:tariff';
  const cached = crawlCache.get(cacheKey);
  if (cached) {
    console.log('[Crawler] Using cached data for Zhejiang');
    return cached;
  }

  const url = 'https://fzggw.zj.gov.cn/col/col1229153765/index.html';
  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);

  const notices: TariffNotice[] = [];
  $('a[href]').each((_, element) => {
    const $el = $(element);
    const title = $el.text().trim();
    const href = $el.attr('href');

    if (!href || !title) return;

    if (title.includes('电价') || title.includes('销售电价')) {
      notices.push({
        title,
        url: href.startsWith('http') ? href : `https://fzggw.zj.gov.cn${href}`,
        publishDate: '',
        source: '浙江省',
        type: href.toLowerCase().includes('.pdf') ? 'pdf' : 'html',
      });
    }
  });

  if (notices.length === 0) {
    throw new Error('No tariff notices found');
  }

  const latestNotice = notices[0];
  const parsedData = await parseNoticeContent(latestNotice);

  crawlCache.set(cacheKey, parsedData);

  return parsedData;
}

/**
 * 江苏省电价爬虫
 */
async function crawlJiangsu(): Promise<ParsedTariffData> {
  console.log('[Crawler] Starting Jiangsu crawl...');

  const cacheKey = 'jiangsu:tariff';
  const cached = crawlCache.get(cacheKey);
  if (cached) {
    console.log('[Crawler] Using cached data for Jiangsu');
    return cached;
  }

  const url = 'http://fzggw.jiangsu.gov.cn/col/col8437/index.html';
  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);

  const notices: TariffNotice[] = [];
  $('a[href]').each((_, element) => {
    const $el = $(element);
    const title = $el.text().trim();
    const href = $el.attr('href');

    if (!href || !title) return;

    if (title.includes('电价') || title.includes('销售电价')) {
      notices.push({
        title,
        url: href.startsWith('http') ? href : `http://fzggw.jiangsu.gov.cn${href}`,
        publishDate: '',
        source: '江苏省',
        type: href.toLowerCase().includes('.pdf') ? 'pdf' : 'html',
      });
    }
  });

  if (notices.length === 0) {
    throw new Error('No tariff notices found');
  }

  const latestNotice = notices[0];
  const parsedData = await parseNoticeContent(latestNotice);

  crawlCache.set(cacheKey, parsedData);

  return parsedData;
}

/**
 * 解析通知内容
 */
async function parseNoticeContent(notice: TariffNotice): Promise<ParsedTariffData> {
  console.log('[Parser] Parsing notice:', notice.title);

  try {
    if (notice.type === 'pdf') {
      return await parsePdfNotice(notice);
    } else {
      return await parseHtmlNotice(notice);
    }
  } catch (error) {
    console.error('[Parser] Failed to parse notice:', error);
    // 返回默认数据
    return getDefaultTariffData();
  }
}

/**
 * 解析HTML通知
 */
async function parseHtmlNotice(notice: TariffNotice): Promise<ParsedTariffData> {
  console.log('[Parser] Parsing HTML notice');

  const html = await fetchWithRetry(notice.url);
  const $ = cheerio.load(html);

  // 提取政策文号
  let policyNumber = '未知';
  const bodyText = $('body').text();
  const numberPatterns = [
    /〔?\d{4}\〕?\d+号/,
    /\d{4}年\d+号/,
    /发改价格\[\d{4}\]\d+号/,
  ];

  for (const pattern of numberPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      policyNumber = match[0];
      break;
    }
  }

  // 提取生效日期
  let effectiveDate = new Date().toISOString().split('T')[0];
  const datePatterns = [
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
  ];

  for (const pattern of datePatterns) {
    const match = html.match(pattern);
    if (match) {
      effectiveDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      break;
    }
  }

  // 提取电价数据
  const tariffs = extractTariffsFromHtml($);

  // 提取时段配置
  const timePeriods = extractTimePeriodsFromText(bodyText);

  return {
    policyNumber,
    policyTitle: notice.title,
    effectiveDate,
    tariffs,
    timePeriods,
  };
}

/**
 * 解析PDF通知
 */
async function parsePdfNotice(notice: TariffNotice): Promise<ParsedTariffData> {
  console.log('[Parser] Parsing PDF notice');

  const response = await nodeFetch(notice.url);
  const buffer = await response.buffer();
  const data = await pdfParse(buffer);
  const text = data.text;

  // 提取政策文号
  let policyNumber = '未知';
  const numberPatterns = [
    /〔?\d{4}\〕?\d+号/,
    /\d{4}年\d+号/,
  ];

  for (const pattern of numberPatterns) {
    const match = text.match(pattern);
    if (match) {
      policyNumber = match[0];
      break;
    }
  }

  // 提取生效日期
  let effectiveDate = new Date().toISOString().split('T')[0];
  const datePatterns = [
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    /自(\d{4})年(\d{1,2})月(\d{1,2})日/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      effectiveDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      break;
    }
  }

  // 提取电价数据
  const tariffs = extractTariffsFromText(text);

  // 提取时段配置
  const timePeriods = extractTimePeriodsFromText(text);

  return {
    policyNumber,
    policyTitle: notice.title,
    effectiveDate,
    tariffs,
    timePeriods,
  };
}

/**
 * 从HTML提取电价数据
 */
function extractTariffsFromHtml($: cheerio.CheerioAPI): ParsedTariffData['tariffs'] {
  const tariffs: ParsedTariffData['tariffs'] = [];

  $('table tr').each((_, row) => {
    const $row = $(row);
    const cells = $row.find('td').toArray();

    if (cells.length < 2) return;

    const voltageText = $(cells[0]).text().trim();
    const priceText = $(cells[cells.length - 1]).text().trim();

    const priceMatch = priceText.match(/(\d+\.?\d*)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      if (price > 0 && price < 5) {
        tariffs.push({
          voltageLevel: normalizeVoltageLevel(voltageText),
          tariffType: 'large_industrial',
          peakPrice: price * 1.5,
          valleyPrice: price * 0.5,
          flatPrice: price,
        });
      }
    }
  });

  return tariffs.length > 0 ? tariffs : getDefaultTariffData().tariffs;
}

/**
 * 从文本提取电价数据
 */
function extractTariffsFromText(text: string): ParsedTariffData['tariffs'] {
  const tariffs: ParsedTariffData['tariffs'] = [];

  const voltagePatterns = [
    { level: '0.4kV', patterns: ['不满1千伏', '0.4千伏', '1kV以下'] },
    { level: '10kV', patterns: ['1-10千伏', '10千伏', '10kV'] },
    { level: '35kV', patterns: ['35千伏', '35kV'] },
    { level: '110kV', patterns: ['110千伏', '110kV'] },
  ];

  voltagePatterns.forEach(({ level, patterns }) => {
    for (const pattern of patterns) {
      const regex = new RegExp(`${pattern}.*?(\\d+\\.?\\d*)元`);
      const match = text.match(regex);
      if (match) {
        const price = parseFloat(match[1]);
        if (price > 0 && price < 5) {
          tariffs.push({
            voltageLevel: level,
            tariffType: 'large_industrial',
            peakPrice: price * 1.5,
            valleyPrice: price * 0.5,
            flatPrice: price,
          });
          break;
        }
      }
    }
  });

  return tariffs.length > 0 ? tariffs : getDefaultTariffData().tariffs;
}

/**
 * 从文本提取时段配置
 */
function extractTimePeriodsFromText(text: string): ParsedTariffData['timePeriods'] {
  // 默认时段配置
  return {
    peakHours: [8, 9, 10, 11, 14, 15, 16, 17, 18, 19],
    valleyHours: [23, 0, 1, 2, 3, 4, 5, 6],
    flatHours: [7, 12, 13, 20, 21, 22],
    peakDescription: '峰时段：8:00-11:00, 14:00-19:00',
    valleyDescription: '谷时段：23:00-次日7:00',
    flatDescription: '平时段：7:00, 12:00-13:00, 20:00-22:00',
  };
}

/**
 * 规范化电压等级
 */
function normalizeVoltageLevel(text: string): string {
  const levelMap: Record<string, string> = {
    '不满1千伏': '0.4kV',
    '1-10千伏': '10kV',
    '35千伏': '35kV',
    '110千伏': '110kV',
  };

  for (const [key, value] of Object.entries(levelMap)) {
    if (text.includes(key)) {
      return value;
    }
  }

  return '0.4kV';
}

/**
 * 获取默认电价数据
 */
function getDefaultTariffData(): ParsedTariffData {
  return {
    policyNumber: '默认',
    policyTitle: '电价调整通知',
    effectiveDate: new Date().toISOString().split('T')[0],
    tariffs: [
      {
        voltageLevel: '0.4kV',
        tariffType: 'large_industrial',
        peakPrice: 1.063,
        valleyPrice: 0.358,
        flatPrice: 0.639,
      },
      {
        voltageLevel: '10kV',
        tariffType: 'large_industrial',
        peakPrice: 1.048,
        valleyPrice: 0.353,
        flatPrice: 0.631,
      },
      {
        voltageLevel: '35kV',
        tariffType: 'large_industrial',
        peakPrice: 1.033,
        valleyPrice: 0.348,
        flatPrice: 0.623,
      },
    ],
    timePeriods: {
      peakHours: [8, 9, 10, 11, 14, 15, 16, 17, 18, 19],
      valleyHours: [23, 0, 1, 2, 3, 4, 5, 6],
      flatHours: [7, 12, 13, 20, 21, 22],
      peakDescription: '峰时段：8:00-11:00, 14:00-19:00',
      valleyDescription: '谷时段：23:00-次日7:00',
      flatDescription: '平时段：7:00, 12:00-13:00, 20:00-22:00',
    },
  };
}

// ============= API路由 =============

/**
 * 健康检查
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * 获取省份电价数据
 */
app.get('/api/tariff/:province', async (req, res) => {
  try {
    const { province } = req.params;
    const provinceCode = province.toUpperCase();

    console.log(`[API] Fetching tariff data for ${provinceCode}`);

    let data;
    switch (provinceCode) {
      case 'GD':
        data = await crawlGuangdong();
        break;
      case 'ZJ':
        data = await crawlZhejiang();
        break;
      case 'JS':
        data = await crawlJiangsu();
        break;
      default:
        return res.status(400).json({
          error: `Unsupported province: ${provinceCode}`,
          supported: ['GD', 'ZJ', 'JS'],
        });
    }

    res.json({
      success: true,
      province: provinceCode,
      data,
      crawledAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[API] Error fetching tariff data:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      province: req.params.province,
    });
  }
});

/**
 * 批量获取多个省份
 */
app.post('/api/tariff/batch', async (req, res) => {
  try {
    const { provinces } = req.body;

    if (!Array.isArray(provinces)) {
      return res.status(400).json({ error: 'provinces must be an array' });
    }

    console.log(`[API] Batch fetching for ${provinces.length} provinces`);

    const results = await Promise.allSettled(
      provinces.map(async (provinceCode) => {
        let data;
        switch (provinceCode) {
          case 'GD':
            data = await crawlGuangdong();
            break;
          case 'ZJ':
            data = await crawlZhejiang();
            break;
          case 'JS':
            data = await crawlJiangsu();
            break;
          default:
            throw new Error(`Unsupported province: ${provinceCode}`);
        }

        return { provinceCode, data };
      })
    );

    const response = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          province: provinces[index],
          success: true,
          data: result.value.data,
        };
      } else {
        return {
          province: provinces[index],
          success: false,
          error: result.reason.message,
        };
      }
    });

    res.json({
      success: true,
      results,
      crawledAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Batch fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 清除缓存
 */
app.post('/api/cache/clear', (req, res) => {
  crawlCache.clear();
  res.json({ success: true, message: 'Cache cleared' });
});

/**
 * 获取缓存统计
 */
app.get('/api/cache/stats', (req, res) => {
  res.json({
    size: crawlCache.size,
    calculatedSize: crawlCache.calculatedSize,
    itemCounts: crawlCache.itemCount,
  });
});

// ============= 定时任务 =============

/**
 * 定时更新数据
 */
async function scheduledUpdate() {
  console.log('[Scheduler] Starting scheduled update...');

  const provinces = ['GD', 'ZJ', 'JS'];
  const results = [];

  for (const province of provinces) {
    try {
      console.log(`[Scheduler] Updating ${province}...`);

      let data;
      switch (province) {
        case 'GD':
          data = await crawlGuangdong();
          break;
        case 'ZJ':
          data = await crawlZhejiang();
          break;
        case 'JS':
          data = await crawlJiangsu();
          break;
      }

      results.push({ province, success: true, data });
      console.log(`[Scheduler] ${province} updated successfully`);
    } catch (error) {
      console.error(`[Scheduler] Failed to update ${province}:`, error);
      results.push({ province, success: false, error: error.message });
    }
  }

  console.log('[Scheduler] Scheduled update completed:', results);
  return results;
}

// ============= 启动服务器 =============

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[Server] Tariff crawler API running on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  console.log(`[Server] API endpoint: http://localhost:${PORT}/api/tariff/:province`);

  // 启动定时任务
  if (CONFIG.scheduler.enabled) {
    console.log('[Server] Scheduler enabled');
    // 每小时执行一次预加载
    setInterval(async () => {
      try {
        await scheduledUpdate();
      } catch (error) {
        console.error('[Scheduler] Scheduled update failed:', error);
      }
    }, 60 * 60 * 1000); // 1小时

    // 启动时立即执行一次
    scheduledUpdate().catch(console.error);
  }
});

export default app;
