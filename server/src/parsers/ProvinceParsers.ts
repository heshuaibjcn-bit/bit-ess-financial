/**
 * 各省定制解析器
 * 
 * 针对各省发改委网站结构定制的解析规则
 */

import * as cheerio from 'cheerio';
import type { TariffDetail, TimePeriodConfig } from '../../../src/types/real-tariff';

export interface ParseContext {
  html: string;
  provinceCode: string;
  provinceName: string;
  source: string;
}

export interface ParsedTariffData {
  policyNumber: string;
  policyTitle: string;
  publishDate: string;
  effectiveDate: string;
  tariffs: TariffDetail[];
  timePeriods: TimePeriodConfig;
  confidence: number;
}

/**
 * 基础解析器
 */
abstract class BaseProvinceParser {
  protected abstract provinceCode: string;
  protected abstract provinceName: string;

  /**
   * 解析主入口
   */
  abstract parse(ctx: ParseContext): ParsedTariffData;

  /**
   * 提取政策文号
   */
  protected extractPolicyNumber($: cheerio.CheerioAPI): string {
    const patterns = [
      /〔\d{4}〕\d+号/,
      /\d{4}年\d+号/,
      /发改价格\[\d{4}\]\d+号/,
      /发改价格〔\d{4}〕\d+号/,
    ];

    const text = $('body').text();
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    return '';
  }

  /**
   * 提取标题
   */
  protected extractTitle($: cheerio.CheerioAPI): string {
    const selectors = ['h1.title', 'h1', 'h2.title', '.article-title', 'title'];
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 5) return text;
    }
    return '';
  }

  /**
   * 提取日期
   */
  protected extractDate(text: string): string | null {
    const patterns = [
      /(\d{4})年(\d{1,2})月(\d{1,2})日/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      }
    }
    return null;
  }

  /**
   * 提取生效日期
   */
  protected extractEffectiveDate($: cheerio.CheerioAPI): string {
    const bodyText = $('body').text();
    const patterns = [
      /自(\d{4})年(\d{1,2})月(\d{1,2})日[起实施]/,
      /(\d{4})年(\d{1,2})月(\d{1,2})日[起实施]/,
    ];

    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) {
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      }
    }
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 提取发布日期
   */
  protected extractPublishDate($: cheerio.CheerioAPI): string {
    const selectors = ['.date', '.publish-date', '.time', '.publish-time', '.article-date'];
    
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) {
        const date = this.extractDate(text);
        if (date) return date;
      }
    }

    return new Date().toISOString().split('T')[0];
  }

  /**
   * 创建默认时段配置
   */
  protected createDefaultTimePeriods(provinceCode: string): TimePeriodConfig {
    const now = new Date().toISOString();
    return {
      id: '',
      versionId: '',
      provinceCode,
      peakHours: [8, 9, 10, 11, 14, 15, 16, 17, 18, 19],
      valleyHours: [23, 0, 1, 2, 3, 4, 5, 6],
      flatHours: [7, 12, 13, 20, 21, 22],
      peakDescription: '峰时段：8:00-11:00, 14:00-19:00',
      valleyDescription: '谷时段：23:00-次日7:00',
      flatDescription: '平时段：7:00, 12:00-13:00, 20:00-22:00',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 创建默认电价（保底）
   */
  protected createDefaultTariffs(provinceCode: string): TariffDetail[] {
    const now = new Date().toISOString();
    return [
      {
        id: '',
        versionId: '',
        provinceCode,
        voltageLevel: '0.4kV',
        tariffType: 'large_industrial',
        peakPrice: 1.063,
        valleyPrice: 0.358,
        flatPrice: 0.639,
        renewableEnergySurcharge: 0.019,
        reservoirFund: 0.0083,
        ruralGridRepayment: 0.02,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '',
        versionId: '',
        provinceCode,
        voltageLevel: '10kV',
        tariffType: 'large_industrial',
        peakPrice: 1.048,
        valleyPrice: 0.353,
        flatPrice: 0.631,
        renewableEnergySurcharge: 0.019,
        reservoirFund: 0.0083,
        ruralGridRepayment: 0.02,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '',
        versionId: '',
        provinceCode,
        voltageLevel: '35kV',
        tariffType: 'large_industrial',
        peakPrice: 1.033,
        valleyPrice: 0.348,
        flatPrice: 0.623,
        renewableEnergySurcharge: 0.019,
        reservoirFund: 0.0083,
        ruralGridRepayment: 0.02,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  /**
   * 计算置信度
   */
  protected calculateConfidence(data: Partial<ParsedTariffData>): number {
    let score = 0;
    let maxScore = 6;

    if (data.policyNumber) score++;
    if (data.policyTitle) score++;
    if (data.publishDate) score++;
    if (data.effectiveDate) score++;
    if (data.tariffs && data.tariffs.length > 0) score++;
    if (data.timePeriods) score++;

    return score / maxScore;
  }
}

/**
 * 广东省解析器
 */
class GuangdongParser extends BaseProvinceParser {
  protected provinceCode = 'GD';
  protected provinceName = '广东省';

  parse(ctx: ParseContext): ParsedTariffData {
    const $ = cheerio.load(ctx.html);
    const now = new Date().toISOString();

    // 广东发改委网站特定选择器
    const policyNumber = this.extractPolicyNumber($);
    const policyTitle = this.extractTitle($);
    const publishDate = this.extractPublishDate($);
    const effectiveDate = this.extractEffectiveDate($);

    // 广东电价表格通常在 .content 或 .article-content 中
    const tariffs = this.extractTariffs($, ctx.provinceCode);
    const timePeriods = this.extractTimePeriods($, ctx.provinceCode);

    const data: ParsedTariffData = {
      policyNumber,
      policyTitle,
      publishDate,
      effectiveDate,
      tariffs: tariffs.length > 0 ? tariffs : this.createDefaultTariffs(ctx.provinceCode),
      timePeriods: timePeriods.peakHours.length > 0 ? timePeriods : this.createDefaultTimePeriods(ctx.provinceCode),
      confidence: 0,
    };

    data.confidence = this.calculateConfidence(data);
    return data;
  }

  private extractTariffs($: cheerio.CheerioAPI, provinceCode: string): TariffDetail[] {
    const tariffs: TariffDetail[] = [];
    const now = new Date().toISOString();

    // 广东网站表格选择器
    $('.content table, .article-content table, .news-content table').each((_, table) => {
      const $table = $(table);
      const rows = $table.find('tr');

      rows.each((rowIndex, row) => {
        if (rowIndex === 0) return; // 跳过表头

        const cells = $(row).find('td');
        if (cells.length < 4) return;

        const voltageText = cells.eq(0).text().trim();
        const peakText = cells.eq(1).text().trim();
        const flatText = cells.eq(2).text().trim();
        const valleyText = cells.eq(3).text().trim();

        const voltageLevel = this.parseVoltageLevel(voltageText);
        if (!voltageLevel) return;

        const peakPrice = this.parsePrice(peakText);
        const flatPrice = this.parsePrice(flatText);
        const valleyPrice = this.parsePrice(valleyText);

        if (!peakPrice || !flatPrice || !valleyPrice) return;

        tariffs.push({
          id: '',
          versionId: '',
          provinceCode,
          voltageLevel,
          tariffType: 'large_industrial',
          peakPrice,
          valleyPrice,
          flatPrice,
          renewableEnergySurcharge: 0.019,
          reservoirFund: 0.0083,
          ruralGridRepayment: 0.02,
          createdAt: now,
          updatedAt: now,
        });
      });
    });

    return tariffs;
  }

  private extractTimePeriods($: cheerio.CheerioAPI, provinceCode: string): TimePeriodConfig {
    const bodyText = $('body').text();
    const now = new Date().toISOString();

    // 广东时段描述模式
    const peakMatch = bodyText.match(/峰时[段为]?[：:]\s*(\d+)[：:](\d+)[\-至](\d+)[：:](\d+)/);
    const valleyMatch = bodyText.match(/谷时[段为]?[：:]\s*(\d+)[：:](\d+)[\-至](\d+)[：:](\d+)/);

    return {
      id: '',
      versionId: '',
      provinceCode,
      peakHours: peakMatch ? this.parseHours(peakMatch) : [8, 9, 10, 11, 14, 15, 16, 17, 18, 19],
      valleyHours: valleyMatch ? this.parseHours(valleyMatch) : [23, 0, 1, 2, 3, 4, 5, 6],
      flatHours: [7, 12, 13, 20, 21, 22],
      peakDescription: '峰时段：8:00-11:00, 14:00-19:00',
      valleyDescription: '谷时段：23:00-次日7:00',
      flatDescription: '平时段：7:00, 12:00-13:00, 20:00-22:00',
      createdAt: now,
      updatedAt: now,
    };
  }

  private parseVoltageLevel(text: string): string | null {
    const patterns = [
      { pattern: /不满1千伏|0\.4千伏|1kV以下|低压/, level: '0.4kV' },
      { pattern: /1-?10千伏|10千伏|10kV|中压/, level: '10kV' },
      { pattern: /35千伏|35kV/, level: '35kV' },
      { pattern: /110千伏|110kV/, level: '110kV' },
      { pattern: /220千伏|220kV/, level: '220kV' },
    ];

    for (const { pattern, level } of patterns) {
      if (pattern.test(text)) return level;
    }
    return null;
  }

  private parsePrice(text: string): number | null {
    // 匹配价格模式：如 0.6390元/千瓦时 或 0.639
    const match = text.match(/(\d+\.\d+)/);
    if (match) {
      const price = parseFloat(match[1]);
      if (price > 0 && price < 10) return price;
    }
    return null;
  }

  private parseHours(match: RegExpMatchArray): number[] {
    const startHour = parseInt(match[1]);
    const endHour = parseInt(match[3]);
    const hours: number[] = [];
    
    for (let h = startHour; h <= endHour; h++) {
      hours.push(h % 24);
    }
    return hours;
  }
}

/**
 * 江苏省解析器
 */
class JiangsuParser extends BaseProvinceParser {
  protected provinceCode = 'JS';
  protected provinceName = '江苏省';

  parse(ctx: ParseContext): ParsedTariffData {
    const $ = cheerio.load(ctx.html);
    const now = new Date().toISOString();

    // 江苏网站特定选择器
    const policyNumber = this.extractPolicyNumber($);
    const policyTitle = $('.article-title, h1').first().text().trim();
    const publishDate = this.extractPublishDate($);
    const effectiveDate = this.extractEffectiveDate($);

    const tariffs = this.extractTariffs($, ctx.provinceCode);
    const timePeriods = this.createDefaultTimePeriods(ctx.provinceCode);

    const data: ParsedTariffData = {
      policyNumber,
      policyTitle,
      publishDate,
      effectiveDate,
      tariffs: tariffs.length > 0 ? tariffs : this.createDefaultTariffs(ctx.provinceCode),
      timePeriods,
      confidence: 0,
    };

    data.confidence = this.calculateConfidence(data);
    return data;
  }

  private extractTariffs($: cheerio.CheerioAPI, provinceCode: string): TariffDetail[] {
    const tariffs: TariffDetail[] = [];
    const now = new Date().toISOString();

    // 江苏网站表格选择器
    $('table').each((_, table) => {
      const $table = $(table);
      // 检查是否包含电价相关文字
      const tableText = $table.text();
      if (!tableText.includes('电价') && !tableText.includes('千瓦时')) return;

      const rows = $table.find('tr');
      rows.each((rowIndex, row) => {
        if (rowIndex === 0) return;

        const cells = $(row).find('td');
        if (cells.length < 3) return;

        const voltageText = cells.eq(0).text().trim();
        const voltageLevel = this.parseVoltageLevel(voltageText);
        if (!voltageLevel) return;

        // 尝试从其他单元格提取价格
        let peakPrice = 0, flatPrice = 0, valleyPrice = 0;
        
        cells.each((i, cell) => {
          if (i === 0) return;
          const text = $(cell).text().trim();
          const price = this.parsePrice(text);
          if (price) {
            if (peakPrice === 0) peakPrice = price;
            else if (flatPrice === 0) flatPrice = price;
            else if (valleyPrice === 0) valleyPrice = price;
          }
        });

        if (peakPrice === 0) peakPrice = flatPrice * 1.5;
        if (valleyPrice === 0) valleyPrice = flatPrice * 0.5;
        if (flatPrice === 0) flatPrice = (peakPrice + valleyPrice) / 2;

        if (peakPrice > 0 && flatPrice > 0 && valleyPrice > 0) {
          tariffs.push({
            id: '',
            versionId: '',
            provinceCode,
            voltageLevel,
            tariffType: 'large_industrial',
            peakPrice,
            valleyPrice,
            flatPrice,
            renewableEnergySurcharge: 0.019,
            reservoirFund: 0.0083,
            ruralGridRepayment: 0.02,
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    });

    return tariffs;
  }

  private parseVoltageLevel(text: string): string | null {
    const patterns = [
      { pattern: /不满1千伏|0\.4千伏|低压/, level: '0.4kV' },
      { pattern: /1-?10千伏|10千伏/, level: '10kV' },
      { pattern: /35千伏/, level: '35kV' },
      { pattern: /110千伏/, level: '110kV' },
    ];

    for (const { pattern, level } of patterns) {
      if (pattern.test(text)) return level;
    }
    return null;
  }

  private parsePrice(text: string): number | null {
    const match = text.match(/(\d+\.\d{2,4})/);
    if (match) {
      const price = parseFloat(match[1]);
      if (price > 0.1 && price < 5) return price;
    }
    return null;
  }
}

/**
 * 浙江省解析器
 */
class ZhejiangParser extends BaseProvinceParser {
  protected provinceCode = 'ZJ';
  protected provinceName = '浙江省';

  parse(ctx: ParseContext): ParsedTariffData {
    const $ = cheerio.load(ctx.html);
    const now = new Date().toISOString();

    const policyNumber = this.extractPolicyNumber($);
    const policyTitle = this.extractTitle($);
    const publishDate = this.extractPublishDate($);
    const effectiveDate = this.extractEffectiveDate($);

    const tariffs = this.extractTariffs($, ctx.provinceCode);
    const timePeriods = this.createDefaultTimePeriods(ctx.provinceCode);

    const data: ParsedTariffData = {
      policyNumber,
      policyTitle,
      publishDate,
      effectiveDate,
      tariffs: tariffs.length > 0 ? tariffs : this.createDefaultTariffs(ctx.provinceCode),
      timePeriods,
      confidence: 0,
    };

    data.confidence = this.calculateConfidence(data);
    return data;
  }

  private extractTariffs($: cheerio.CheerioAPI, provinceCode: string): TariffDetail[] {
    // 浙江与广东类似，可以使用通用逻辑
    return [];
  }
}

// ========== 解析器注册表 ==========

const parserRegistry = new Map<string, BaseProvinceParser>();

// 注册各省解析器
parserRegistry.set('GD', new GuangdongParser());
parserRegistry.set('JS', new JiangsuParser());
parserRegistry.set('ZJ', new ZhejiangParser());

/**
 * 获取省份解析器
 */
export function getProvinceParser(provinceCode: string): BaseProvinceParser | null {
  return parserRegistry.get(provinceCode) || null;
}

/**
 * 使用定制解析器解析
 */
export function parseWithProvinceParser(ctx: ParseContext): ParsedTariffData | null {
  const parser = getProvinceParser(ctx.provinceCode);
  if (parser) {
    return parser.parse(ctx);
  }
  return null;
}

/**
 * 检查是否有定制解析器
 */
export function hasCustomParser(provinceCode: string): boolean {
  return parserRegistry.has(provinceCode);
}

export { BaseProvinceParser, GuangdongParser, JiangsuParser, ZhejiangParser };
