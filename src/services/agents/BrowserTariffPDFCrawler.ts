/**
 * 浏览器自动化电价PDF爬虫
 *
 * 使用 Playwright 访问各省电网网站，自动发现并下载电价PDF文档
 *
 * 功能：
 * 1. 访问各省电网公司电价公告页面
 * 2. 自动查找最新电价PDF文档
 * 3. 下载PDF到本地
 * 4. 提取PDF元数据（发布日期、文号等）
 */

import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

/**
 * PDF下载结果
 */
export interface PDFDownloadResult {
  success: boolean;
  provinceCode: string;
  provinceName: string;
  pdfUrl?: string;
  localPath?: string;
  fileName?: string;
  fileSize?: number;
  downloadDate: string;
  metadata?: {
    title?: string;
    publishDate?: string;
    policyNumber?: string;
    sourceUrl?: string;
  };
  error?: string;
}

/**
 * 省份电网网站配置
 */
interface PowerGridConfig {
  name: string;
  provinceCode: string;
  provinceName: string;
  // 主要电价公告页面
  mainPageUrl: string;
  // PDF查找策略
  pdfSearchStrategy: 'selector' | 'link-text' | 'pattern';
  // 选择器或模式
  selector?: string;
  linkPattern?: RegExp;
  // PDF下载的基础URL（如果是相对路径）
  baseUrl?: string;
}

/**
 * 各省电网网站配置
 */
const POWER_GRID_CONFIGS: PowerGridConfig[] = [
  {
    name: '广东电网',
    provinceCode: 'GD',
    provinceName: '广东省',
    mainPageUrl: 'https://www.csg.cn/api/psc/download',
    pdfSearchStrategy: 'link-text',
    linkPattern: /销售电价.*\.pdf$/i,
    baseUrl: 'https://www.csg.cn',
  },
  {
    name: '浙江电网',
    provinceCode: 'ZJ',
    provinceName: '浙江省',
    mainPageUrl: 'https://www.zj.sgcc.com.cn/zjsd/zcwj/gfwj/index.html',
    pdfSearchStrategy: 'selector',
    selector: 'a[href$=".pdf"]',
    baseUrl: 'https://www.zj.sgcc.com.cn',
  },
  {
    name: '江苏电网',
    provinceCode: 'JS',
    provinceName: '江苏省',
    mainPageUrl: 'https://www.js.sgcc.com.cn/ztsd/zcwj/zcwj/index.html',
    pdfSearchStrategy: 'link-text',
    linkPattern: /电价.*通知.*\.pdf$/i,
    baseUrl: 'https://www.js.sgcc.com.cn',
  },
  {
    name: '安徽电网',
    provinceCode: 'AH',
    provinceName: '安徽省',
    mainPageUrl: 'https://www.ah.sgcc.com.cn/ztsd/zcwj/zcwj/index.html',
    pdfSearchStrategy: 'link-text',
    linkPattern: /销售电价.*\.pdf$/i,
    baseUrl: 'https://www.ah.sgcc.com.cn',
  },
];

/**
 * 浏览器自动化PDF爬虫
 */
export class BrowserTariffPDFCrawler {
  private downloadsDir: string;

  constructor(downloadsDir: string = './downloads/tariffs') {
    this.downloadsDir = downloadsDir;
    // 确保下载目录存在
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
  }

  /**
   * 为单个省份下载最新电价PDF
   */
  async downloadLatestTariffPDF(config: PowerGridConfig): Promise<PDFDownloadResult> {
    console.log(`[BrowserCrawler] 开始为 ${config.provinceName} 下载最新电价PDF...`);

    let browser;
    try {
      // 启动浏览器
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // 设置下载路径
      const downloadPath = path.join(this.downloadsDir, config.provinceCode);
      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
      }

      // 访问主页面
      console.log(`[BrowserCrawler] 访问: ${config.mainPageUrl}`);
      await page.goto(config.mainPageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 等待页面加载
      await page.waitForTimeout(2000);

      // 查找PDF链接
      const pdfLinks = await this.findPDFLinks(page, config);

      if (pdfLinks.length === 0) {
        return {
          success: false,
          provinceCode: config.provinceCode,
          provinceName: config.provinceName,
          downloadDate: new Date().toISOString(),
          error: `未找到PDF文档`,
        };
      }

      // 选择最新的PDF（通常是第一个）
      const latestPDF = pdfLinks[0];
      console.log(`[BrowserCrawler] 找到PDF: ${latestPDF.title}`);

      // 下载PDF
      const downloadResult = await this.downloadPDF(page, latestPDF.url, config);

      await browser.close();

      return downloadResult;

    } catch (error) {
      console.error(`[BrowserCrawler] ${config.provinceName} 下载失败:`, error);

      if (browser) {
        await browser.close();
      }

      return {
        success: false,
        provinceCode: config.provinceCode,
        provinceName: config.provinceName,
        downloadDate: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  /**
   * 在页面中查找PDF链接
   */
  private async findPDFLinks(page: any, config: PowerGridConfig): Promise<Array<{ url: string; title: string }>> {
    const pdfLinks: Array<{ url: string; title: string }> = [];

    try {
      if (config.pdfSearchStrategy === 'selector' && config.selector) {
        // 使用CSS选择器查找
        const elements = await page.$$(config.selector);
        const count = elements.length;

        for (let i = 0; i < count; i++) {
          const element = elements[i];
          const url = await element.evaluate((el: any) => el.getAttribute('href'));
          const title = await element.evaluate((el: any) => el.textContent);

          if (url && url.toLowerCase().includes('.pdf')) {
            pdfLinks.push({
              url: this.resolveUrl(url, config.baseUrl),
              title: title?.trim() || `PDF ${i + 1}`,
            });
          }
        }
      } else if (config.pdfSearchStrategy === 'link-text' && config.linkPattern) {
        // 查找所有链接，用正则匹配
        const links = await page.$$('a[href]');

        for (const link of links) {
          const url = await link.evaluate((el: any) => el.getAttribute('href'));
          const text = await link.evaluate((el: any) => el.textContent);

          if (url && text && config.linkPattern!.test(text)) {
            pdfLinks.push({
              url: this.resolveUrl(url, config.baseUrl),
              title: text.trim(),
            });
          }
        }
      }

      console.log(`[BrowserCrawler] 找到 ${pdfLinks.length} 个PDF链接`);
      return pdfLinks;

    } catch (error) {
      console.error('[BrowserCrawler] 查找PDF链接失败:', error);
      return [];
    }
  }

  /**
   * 解析相对URL为绝对URL
   */
  private resolveUrl(url: string, baseUrl?: string): string {
    if (!url) return url;

    // 如果已经是绝对URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // 使用baseURL解析相对路径
    if (baseUrl) {
      try {
        return new URL(url, baseUrl).href;
      } catch {
        return url;
      }
    }

    return url;
  }

  /**
   * 下载PDF文件
   */
  private async downloadPDF(
    page: any,
    pdfUrl: string,
    config: PowerGridConfig
  ): Promise<PDFDownloadResult> {
    try {
      console.log(`[BrowserCrawler] 下载PDF: ${pdfUrl}`);

      // 生成文件名
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `${config.provinceCode}_电价_${timestamp}.pdf`;
      const downloadPath = path.join(this.downloadsDir, config.provinceCode, fileName);

      // 设置下载行为
      await page.goto(pdfUrl);

      // 等待导航完成
      await page.waitForLoad({ timeout: 30000 });

      // PDF页面会直接显示PDF，我们需要用另一种方式下载
      // 使用fetch下载
      const pdfContent = await page.evaluate(async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to download PDF: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        return Array.from(new Uint8Array(buffer));
      }, pdfUrl);

      // 保存到文件
      const buffer = Buffer.from(pdfContent);
      fs.writeFileSync(downloadPath, buffer);

      const stats = fs.statSync(downloadPath);

      console.log(`[BrowserCrawler] PDF已保存: ${downloadPath} (${stats.size} bytes)`);

      return {
        success: true,
        provinceCode: config.provinceCode,
        provinceName: config.provinceName,
        pdfUrl,
        localPath: downloadPath,
        fileName,
        fileSize: stats.size,
        downloadDate: new Date().toISOString(),
        metadata: {
          sourceUrl: pdfUrl,
          title: `${config.provinceName}电价PDF`,
        },
      };

    } catch (error) {
      console.error('[BrowserCrawler] PDF下载失败:', error);
      throw error;
    }
  }

  /**
   * 批量下载多个省份的PDF
   */
  async downloadMultiplePDFs(provinceCodes: string[] = []): Promise<Map<string, PDFDownloadResult>> {
    const results = new Map<string, PDFDownloadResult>();

    // 如果没有指定省份，下载所有配置的省份
    const codesToDownload = provinceCodes.length > 0
      ? provinceCodes
      : POWER_GRID_CONFIGS.map(c => c.provinceCode);

    for (const provinceCode of codesToDownload) {
      const config = POWER_GRID_CONFIGS.find(c => c.provinceCode === provinceCode);
      if (!config) {
        console.warn(`[BrowserCrawler] 未找到省份 ${provinceCode} 的配置`);
        continue;
      }

      const result = await this.downloadLatestTariffPDF(config);
      results.set(provinceCode, result);

      // 避免请求过于频繁
      await this.sleep(2000);
    }

    return results;
  }

  /**
   * 为所有配置的省份下载PDF
   */
  async downloadAll(): Promise<Map<string, PDFDownloadResult>> {
    return await this.downloadMultiplePDFs(
      POWER_GRID_CONFIGS.map(c => c.provinceCode)
    );
  }

  /**
   * 获取已下载的PDF文件列表
   */
  getDownloadedPDFs(provinceCode?: string): string[] {
    const baseDir = provinceCode
      ? path.join(this.downloadsDir, provinceCode)
      : this.downloadsDir;

    if (!fs.existsSync(baseDir)) {
      return [];
    }

    const files = fs.readdirSync(baseDir);
    return files
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .map(f => path.join(baseDir, f));
  }

  /**
   * 辅助方法：延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 单例实例
 */
let crawlerInstance: BrowserTariffPDFCrawler | null = null;

export function getBrowserTariffPDFCrawler(): BrowserTariffPDFCrawler {
  if (!crawlerInstance) {
    crawlerInstance = new BrowserTariffPDFCrawler();
  }
  return crawlerInstance;
}
