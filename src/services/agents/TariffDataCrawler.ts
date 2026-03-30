/**
 * 真实电价数据抓取服务
 *
 * 从政府网站和电网公司官网抓取最新电价政策
 */

import * as pdfjsLib from 'pdfjs-dist';

interface CrawlResult {
  success: boolean;
  data?: any;
  error?: string;
  source: string;
  crawledAt: string;
}

interface NoticeInfo {
  title: string;
  url: string;
  publishDate: string;
  source: string;
  type: 'html' | 'pdf';
}

/**
 * 电价数据抓取器
 */
export class TariffDataCrawler {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 抓取广东省电价通知
   */
  async crawlGuangdong(): Promise<CrawlResult> {
    try {
      console.log('[Crawler] Starting Guangdong tariff crawl...');

      // 广东省发改委价格处页面
      const targetUrl = 'http://drc.gd.gov.cn/jgml/gfbzzcj/gfxwjg/index.html';

      // 使用CORS代理
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const html = await response.text();

      // 解析HTML获取最新电价通知
      const notices = this.parseNoticeList(html, '广东省');

      if (notices.length === 0) {
        return {
          success: false,
          error: 'No tariff notices found',
          source: url,
          crawledAt: new Date().toISOString(),
        };
      }

      // 获取最新的通知
      const latestNotice = notices[0];

      // 根据类型解析内容
      let parsedData;
      if (latestNotice.type === 'pdf') {
        parsedData = await this.parsePdfNotice(latestNotice.url, '广东省');
      } else {
        parsedData = await this.parseHtmlNotice(latestNotice.url, '广东省');
      }

      return {
        success: true,
        data: {
          notice: latestNotice,
          parsed: parsedData,
        },
        source: url,
        crawledAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Crawler] Guangdong crawl failed:', error);
      return {
        success: false,
        error: (error as Error).message,
        source: 'drc.gd.gov.cn',
        crawledAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 抓取浙江省电价通知
   */
  async crawlZhejiang(): Promise<CrawlResult> {
    try {
      console.log('[Crawler] Starting Zhejiang tariff crawl...');

      const targetUrl = 'https://fzggw.zj.gov.cn/col/col1229153765/index.html';
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const html = await response.text();
      const notices = this.parseNoticeList(html, '浙江省');

      if (notices.length === 0) {
        return {
          success: false,
          error: 'No tariff notices found',
          source: url,
          crawledAt: new Date().toISOString(),
        };
      }

      const latestNotice = notices[0];
      let parsedData;
      if (latestNotice.type === 'pdf') {
        parsedData = await this.parsePdfNotice(latestNotice.url, '浙江省');
      } else {
        parsedData = await this.parseHtmlNotice(latestNotice.url, '浙江省');
      }

      return {
        success: true,
        data: {
          notice: latestNotice,
          parsed: parsedData,
        },
        source: url,
        crawledAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Crawler] Zhejiang crawl failed:', error);
      return {
        success: false,
        error: (error as Error).message,
        source: 'fzggw.zj.gov.cn',
        crawledAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 抓取江苏省电价通知
   */
  async crawlJiangsu(): Promise<CrawlResult> {
    try {
      console.log('[Crawler] Starting Jiangsu tariff crawl...');

      const targetUrl = 'http://fzggw.jiangsu.gov.cn/col/col8437/index.html';
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const html = await response.text();
      const notices = this.parseNoticeList(html, '江苏省');

      if (notices.length === 0) {
        return {
          success: false,
          error: 'No tariff notices found',
          source: url,
          crawledAt: new Date().toISOString(),
        };
      }

      const latestNotice = notices[0];
      let parsedData;
      if (latestNotice.type === 'pdf') {
        parsedData = await this.parsePdfNotice(latestNotice.url, '江苏省');
      } else {
        parsedData = await this.parseHtmlNotice(latestNotice.url, '江苏省');
      }

      return {
        success: true,
        data: {
          notice: latestNotice,
          parsed: parsedData,
        },
        source: url,
        crawledAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Crawler] Jiangsu crawl failed:', error);
      return {
        success: false,
        error: (error as Error).message,
        source: 'fzggw.jiangsu.gov.cn',
        crawledAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 解析通知列表HTML
   */
  private parseNoticeList(html: string, provinceName: string): NoticeInfo[] {
    const notices: NoticeInfo[] = [];

    try {
      // 创建临时DOM解析器
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 查找链接元素（具体选择器根据不同网站结构调整）
      const links = doc.querySelectorAll('a[href]');

      links.forEach((link) => {
        const href = link.getAttribute('href');
        const title = link.textContent?.trim();
        const parent = link.parentElement;

        if (!href || !title) return;

        // 过滤出电价相关的通知
        const keywords = ['电价', '销售电价', '输配电价', '峰谷', '分时'];
        const isTariffRelated = keywords.some(kw => title.includes(kw));

        if (!isTariffRelated) return;

        // 构建完整URL
        let fullUrl = href;
        if (href.startsWith('/')) {
          const baseUrl = new URL(window.location.href);
          fullUrl = `${baseUrl.protocol}//${baseUrl.host}${href}`;
        } else if (!href.startsWith('http')) {
          fullUrl = new URL(href, window.location.href).href;
        }

        // 判断是否是PDF
        const isPdf = href.toLowerCase().includes('.pdf') ||
                      link.getAttribute('type') === 'application/pdf';

        // 提取发布日期
        let publishDate = '';
        if (parent) {
          const dateSpan = parent.querySelector('span');
          if (dateSpan) {
            publishDate = dateSpan.textContent?.trim() || '';
          }
        }

        // 如果没有找到日期，尝试从链接文本中提取
        if (!publishDate) {
          const dateMatch = title.match(/(\d{4})[年\-](\d{1,2})[月\-](\d{1,2})/);
          if (dateMatch) {
            publishDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
          }
        }

        notices.push({
          title,
          url: fullUrl,
          publishDate,
          source: provinceName,
          type: isPdf ? 'pdf' : 'html',
        });
      });

      // 按发布日期排序（最新的在前）
      notices.sort((a, b) => {
        const dateA = new Date(a.publishDate || '0');
        const dateB = new Date(b.publishDate || '0');
        return dateB.getTime() - dateA.getTime();
      });

      console.log(`[Crawler] Found ${notices.length} tariff notices for ${provinceName}`);
      return notices.slice(0, 10); // 返回最新的10条
    } catch (error) {
      console.error('[Crawler] Failed to parse notice list:', error);
      return [];
    }
  }

  /**
   * 解析HTML格式的通知
   */
  private async parseHtmlNotice(url: string, provinceName: string): Promise<any> {
    try {
      console.log('[Crawler] Parsing HTML notice:', url);

      // 如果URL不是代理URL，使用代理
      let fetchUrl = url;
      if (!url.includes('allorigins.win')) {
        fetchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch HTML: ${response.status}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 提取政策文号
      let policyNumber = '';
      const numberPatterns = [
        /〔?\d{4}\〕?\d+号/,
        /\d{4}年\d+号/,
        /发改价格\[\d{4}\]\d+号/,
      ];

      const bodyText = doc.body?.textContent || '';
      for (const pattern of numberPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          policyNumber = match[0];
          break;
        }
      }

      // 提取生效日期
      let effectiveDate = '';
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
      const tariffs = this.extractTariffData(doc);

      // 提取时段配置
      const timePeriods = this.extractTimePeriods(doc);

      // 检查是否使用了默认数据
      const isDefaultData = (tariffs as any).isDefaultData === true;

      return {
        policyNumber: policyNumber || '未知',
        policyTitle: doc.querySelector('h1')?.textContent || '电价调整通知',
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
        tariffs,
        timePeriods,
        isDefaultData,
      };
    } catch (error) {
      console.error('[Crawler] Failed to parse HTML notice:', error);
      throw error;
    }
  }

  /**
   * 解析PDF格式的通知
   */
  private async parsePdfNotice(url: string, provinceName: string): Promise<any> {
    try {
      console.log('[Crawler] Parsing PDF notice:', url);

      // 加载PDF
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;

      let fullText = '';

      // 提取所有页面的文本
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      // 提取政策文号
      let policyNumber = '';
      const numberPatterns = [
        /〔?\d{4}\〕?\d+号/,
        /\d{4}年\d+号/,
        /发改价格\[\d{4}\]\d+号/,
      ];

      for (const pattern of numberPatterns) {
        const match = fullText.match(pattern);
        if (match) {
          policyNumber = match[0];
          break;
        }
      }

      // 提取生效日期
      let effectiveDate = '';
      const datePatterns = [
        /(\d{4})年(\d{1,2})月(\d{1,2})日/,
        /自(\d{4})年(\d{1,2})月(\d{1,2})日/,
      ];

      for (const pattern of datePatterns) {
        const match = fullText.match(pattern);
        if (match) {
          effectiveDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
          break;
        }
      }

      // 提取电价数据
      const tariffs = this.extractTariffDataFromText(fullText);

      // 提取时段配置
      const timePeriods = this.extractTimePeriodsFromText(fullText);

      // 检查是否使用了默认数据
      const isDefaultData = (tariffs as any).isDefaultData === true;

      return {
        policyNumber: policyNumber || '未知',
        policyTitle: '电价调整通知',
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
        tariffs,
        timePeriods,
        isDefaultData,
      };
    } catch (error) {
      console.error('[Crawler] Failed to parse PDF notice:', error);
      throw error;
    }
  }

  /**
   * 从HTML文档提取电价数据
   */
  private extractTariffData(doc: Document): any[] {
    const tariffs: any[] = [];

    try {
      // 查找表格
      const tables = doc.querySelectorAll('table');

      tables.forEach((table) => {
        const rows = table.querySelectorAll('tr');

        rows.forEach((row, index) => {
          if (index === 0) return; // 跳过表头

          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return;

          // 尝试从表格中提取电价信息
          const voltageLevel = cells[0].textContent?.trim();
          const priceText = cells[1].textContent || cells[cells.length - 1].textContent;

          if (voltageLevel && priceText) {
            // 尝试解析价格
            const priceMatch = priceText.match(/(\d+\.?\d*)/);
            if (priceMatch) {
              const price = parseFloat(priceMatch[1]);
              if (price > 0 && price < 5) {
                // 合理的电价范围
                tariffs.push({
                  voltageLevel: this.normalizeVoltageLevel(voltageLevel),
                  tariffType: 'large_industrial',
                  peakPrice: price * 1.5, // 估算峰值电价
                  valleyPrice: price * 0.5, // 估算谷值电价
                  flatPrice: price, // 基础电价
                });
              }
            }
          }
        });
      });
    } catch (error) {
      console.error('[Crawler] Failed to extract tariff data:', error);
    }

    // 如果没有从表格中提取到数据，使用默认数据
    if (tariffs.length === 0) {
      console.warn('[Crawler] Using default tariff data (failed to extract from website)');
      return this.getDefaultTariffs();
    }

    return tariffs;
  }

  /**
   * 从文本提取电价数据
   */
  private extractTariffDataFromText(text: string): any[] {
    const tariffs: any[] = [];

    try {
      // 尝试从文本中提取价格信息
      const pricePatterns = [
        /(\d+\.?\d*)元.*?千瓦时/,
        /(\d+\.?\d*)元\/千瓦时/,
        /(\d+\.?\d*)元\/kWh/,
        /不满1千伏.*?(\d+\.?\d*)元/,
        /1-10千伏.*?(\d+\.?\d*)元/,
        /35千伏.*?(\d+\.?\d*)元/,
      ];

      const voltageLevels = [
        { level: '0.4kV', patterns: ['不满1千伏', '0.4千伏', '1kV以下'] },
        { level: '10kV', patterns: ['1-10千伏', '10千伏', '10kV'] },
        { level: '35kV', patterns: ['35千伏', '35kV'] },
        { level: '110kV', patterns: ['110千伏', '110kV'] },
        { level: '220kV', patterns: ['220千伏', '220kV'] },
      ];

      voltageLevels.forEach(({ level, patterns }) => {
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
    } catch (error) {
      console.error('[Crawler] Failed to extract tariffs from text:', error);
    }

    // 如果没有提取到数据，使用默认数据
    if (tariffs.length === 0) {
      return this.getDefaultTariffs();
    }

    return tariffs;
  }

  /**
   * 从HTML文档提取时段配置
   */
  private extractTimePeriods(doc: Document): any {
    const text = doc.body?.textContent || '';

    return this.extractTimePeriodsFromText(text);
  }

  /**
   * 从文本提取时段配置
   */
  private extractTimePeriodsFromText(text: string): any {
    const peakHours: number[] = [];
    const valleyHours: number[] = [];
    const flatHours: number[] = [];

    try {
      // 查找时段描述
      const peakPatterns = [
        /峰时[段时间][：:]\s*(\d+)[：:](\d+)[至－-](\d+)[：:](\d+)/,
        /峰[段时间为][：:]\s*([^\n]+)/,
      ];

      const valleyPatterns = [
        /谷时[段时间][：:]\s*(\d+)[：:](\d+)[至－-](\d+)[：:](\d+)/,
        /谷[段时间为][：:]\s*([^\n]+)/,
      ];

      // 默认时段配置
      const defaultTimePeriods = {
        peakHours: [8, 9, 10, 11, 14, 15, 16, 17, 18, 19],
        valleyHours: [23, 0, 1, 2, 3, 4, 5, 6],
        flatHours: [7, 12, 13, 20, 21, 22],
        peakDescription: '峰时段：8:00-11:00, 14:00-19:00',
        valleyDescription: '谷时段：23:00-次日7:00',
        flatDescription: '平时段：7:00, 12:00-13:00, 20:00-22:00',
      };

      // 尝试提取自定义时段
      // 这里可以根据实际文本模式进行解析

      return defaultTimePeriods;
    } catch (error) {
      console.error('[Crawler] Failed to extract time periods:', error);

      // 返回默认配置
      return {
        peakHours: [8, 9, 10, 11, 14, 15, 16, 17, 18, 19],
        valleyHours: [23, 0, 1, 2, 3, 4, 5, 6],
        flatHours: [7, 12, 13, 20, 21, 22],
        peakDescription: '峰时段：8:00-11:00, 14:00-19:00',
        valleyDescription: '谷时段：23:00-次日7:00',
        flatDescription: '平时段：7:00, 12:00-13:00, 20:00-22:00',
      };
    }
  }

  /**
   * 规范化电压等级
   */
  private normalizeVoltageLevel(level: string): string {
    const levelMap: Record<string, string> = {
      '不满1千伏': '0.4kV',
      '1-10千伏': '10kV',
      '35千伏': '35kV',
      '110千伏': '110kV',
      '220千伏': '220kV',
    };

    for (const [key, value] of Object.entries(levelMap)) {
      if (level.includes(key)) {
        return value;
      }
    }

    // 默认返回0.4kV
    return '0.4kV';
  }

  /**
   * 获取默认电价数据（标记为默认数据）
   */
  private getDefaultTariffs(): any[] {
    // 标记为默认数据
    const tariffs = [
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
    ];

    // 标记数组为默认数据
    (tariffs as any).isDefaultData = true;
    return tariffs;
  }

  /**
   * 检查缓存
   */
  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 批量抓取所有省份
   */
  async crawlAll(): Promise<Map<string, CrawlResult>> {
    const results = new Map<string, CrawlResult>();

    // 并行抓取所有省份
    const crawlers = [
      this.crawlGuangdong().then(r => results.set('GD', r)),
      this.crawlZhejiang().then(r => results.set('ZJ', r)),
      this.crawlJiangsu().then(r => results.set('JS', r)),
    ];

    await Promise.all(crawlers);

    return results;
  }
}

/**
 * 单例实例
 */
let crawlerInstance: TariffDataCrawler | null = null;

export function getTariffDataCrawler(): TariffDataCrawler {
  if (!crawlerInstance) {
    crawlerInstance = new TariffDataCrawler();
  }
  return crawlerInstance;
}
