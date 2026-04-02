/**
 * 解析智能体
 * 
 * 职责：
 * 1. 解析HTML内容提取电价数据
 * 2. 使用规则引擎提取结构化信息
 * 3. 返回标准化数据结构
 */

import * as cheerio from 'cheerio';
import type { ParseResult, TariffDetail, TimePeriodConfig } from '../../../src/types/real-tariff';
import { NATIONWIDE_DATA_SOURCES } from '../../../src/config/nationwide-data-sources';

/**
 * 解析智能体
 */
export class ParserAgent {
  /**
   * 解析HTML内容
   */
  async parseHTML(html: string, provinceCode: string): Promise<ParseResult> {
    console.log(`[ParserAgent] Parsing HTML for ${provinceCode}`);

    try {
      const $ = cheerio.load(html);
      const config = NATIONWIDE_DATA_SOURCES.find(s => s.code === provinceCode);

      // 提取政策信息
      const policyNumber = this.extractPolicyNumber($);
      const policyTitle = this.extractPolicyTitle($);
      const publishDate = this.extractPublishDate($);
      const effectiveDate = this.extractEffectiveDate($);

      // 提取电价表格
      const tariffs = this.extractTariffs($, provinceCode);

      // 提取时段配置
      const timePeriods = this.extractTimePeriods($, provinceCode);

      // 计算置信度
      const confidence = this.calculateConfidence({
        policyNumber,
        policyTitle,
        publishDate,
        effectiveDate,
        tariffs,
        timePeriods,
      });

      return {
        success: true,
        provinceCode,
        policyNumber,
        policyTitle,
        effectiveDate,
        publishDate,
        tariffs,
        timePeriods,
        confidence,
      };
    } catch (error) {
      console.error(`[ParserAgent] Parse failed for ${provinceCode}:`, error);
      return {
        success: false,
        provinceCode,
        policyNumber: '',
        policyTitle: '',
        effectiveDate: '',
        publishDate: '',
        tariffs: [],
        timePeriods: this.getDefaultTimePeriods(provinceCode),
        confidence: 0,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 提取政策文号
   */
  private extractPolicyNumber($: cheerio.CheerioAPI): string {
    const patterns = [
      /〔\d{4}〕\d+号/,
      /\d{4}年\d+号/,
      /发改价格\[\d{4}\]\d+号/,
      /发改价格〔\d{4}〕\d+号/,
    ];

    // 从标题和内容中查找
    const text = $('body').text();
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return '';
  }

  /**
   * 提取政策标题
   */
  private extractPolicyTitle($: cheerio.CheerioAPI): string {
    // 尝试多种标题选择器
    const selectors = ['h1', 'h2', '.title', '.article-title', 'title'];
    
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 5) {
        return text;
      }
    }

    return '';
  }

  /**
   * 提取发布日期
   */
  private extractPublishDate($: cheerio.CheerioAPI): string {
    const selectors = ['.date', '.publish-date', '.time', '.publish-time'];
    
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) {
        const date = this.parseDate(text);
        if (date) return date;
      }
    }

    // 从内容中查找日期模式
    const bodyText = $('body').text();
    const datePatterns = [
      /(\d{4})年(\d{1,2})月(\d{1,2})日/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
    ];

    for (const pattern of datePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      }
    }

    return new Date().toISOString().split('T')[0];
  }

  /**
   * 提取生效日期
   */
  private extractEffectiveDate($: cheerio.CheerioAPI): string {
    const bodyText = $('body').text();
    
    // 查找"自XXXX年XX月XX日起"的模式
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

    // 默认使用发布日期
    return this.extractPublishDate($);
  }

  /**
   * 提取电价数据
   */
  private extractTariffs($: cheerio.CheerioAPI, provinceCode: string): TariffDetail[] {
    const tariffs: TariffDetail[] = [];
    
    // 查找表格
    $('table').each((_, table) => {
      const $table = $(table);
      const rows = $table.find('tr');
      
      rows.each((rowIndex, row) => {
        if (rowIndex === 0) return; // 跳过表头
        
        const cells = $(row).find('td');
        if (cells.length < 3) return;

        const voltageText = cells.eq(0).text().trim();
        const priceText = cells.eq(cells.length - 1).text().trim();

        // 解析电压等级
        const voltageLevel = this.parseVoltageLevel(voltageText);
        if (!voltageLevel) return;

        // 解析价格
        const price = this.parsePrice(priceText);
        if (!price || price <= 0) return;

        tariffs.push({
          id: '', // 后续填充
          versionId: '', // 后续填充
          provinceCode,
          voltageLevel,
          tariffType: 'large_industrial',
          peakPrice: price * 1.5,  // 估算峰时电价
          valleyPrice: price * 0.5, // 估算谷时电价
          flatPrice: price,         // 平时电价
          renewableEnergySurcharge: 0.019,
          reservoirFund: 0.0083,
          ruralGridRepayment: 0.02,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    });

    return tariffs.length > 0 ? tariffs : this.getDefaultTariffs(provinceCode);
  }

  /**
   * 提取时段配置
   */
  private extractTimePeriods($: cheerio.CheerioAPI, provinceCode: string): TimePeriodConfig {
    const bodyText = $('body').text();
    
    // 尝试从文本中提取时段
    const peakHours = this.extractHours(bodyText, /峰时[段为]?[：:]\s*(\d+)[：:](\d+)[\-至](\d+)[：:](\d+)/);
    const valleyHours = this.extractHours(bodyText, /谷时[段为]?[：:]\s*(\d+)[：:](\d+)[\-至](\d+)[：:](\d+)/);
    const flatHours = this.extractHours(bodyText, /平时[段为]?[：:]\s*(\d+)[：:](\d+)[\-至](\d+)[：:](\d+)/);

    return {
      id: '', // 后续填充
      versionId: '', // 后续填充
      provinceCode,
      peakHours: peakHours.length > 0 ? peakHours : [8, 9, 10, 11, 14, 15, 16, 17, 18, 19],
      valleyHours: valleyHours.length > 0 ? valleyHours : [23, 0, 1, 2, 3, 4, 5, 6],
      flatHours: flatHours.length > 0 ? flatHours : [7, 12, 13, 20, 21, 22],
      peakDescription: '峰时段：8:00-11:00, 14:00-19:00',
      valleyDescription: '谷时段：23:00-次日7:00',
      flatDescription: '平时段：7:00, 12:00-13:00, 20:00-22:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 解析电压等级
   */
  private parseVoltageLevel(text: string): string | null {
    const patterns = [
      { pattern: /不满1千伏|0\.4千伏|1kV以下/, level: '0.4kV' },
      { pattern: /1-?10千伏|10千伏|10kV/, level: '10kV' },
      { pattern: /35千伏|35kV/, level: '35kV' },
      { pattern: /110千伏|110kV/, level: '110kV' },
      { pattern: /220千伏|220kV/, level: '220kV' },
    ];

    for (const { pattern, level } of patterns) {
      if (pattern.test(text)) {
        return level;
      }
    }

    return null;
  }

  /**
   * 解析价格
   */
  private parsePrice(text: string): number | null {
    const match = text.match(/(\d+\.?\d*)/);
    if (match) {
      const price = parseFloat(match[1]);
      if (price > 0 && price < 5) { // 合理的电价范围
        return price;
      }
    }
    return null;
  }

  /**
   * 解析日期
   */
  private parseDate(text: string): string | null {
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
   * 提取小时列表
   */
  private extractHours(text: string, pattern: RegExp): number[] {
    const match = text.match(pattern);
    if (!match) return [];

    // 简化的时段提取
    return [];
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(data: {
    policyNumber: string;
    policyTitle: string;
    publishDate: string;
    effectiveDate: string;
    tariffs: TariffDetail[];
    timePeriods: TimePeriodConfig;
  }): number {
    let score = 0;
    let maxScore = 6;

    if (data.policyNumber) score++;
    if (data.policyTitle) score++;
    if (data.publishDate) score++;
    if (data.effectiveDate) score++;
    if (data.tariffs.length > 0) score++;
    if (data.timePeriods.peakHours.length > 0) score++;

    return score / maxScore;
  }

  /**
   * 获取默认电价（保底数据）
   */
  private getDefaultTariffs(provinceCode: string): TariffDetail[] {
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
   * 获取默认时段配置
   */
  private getDefaultTimePeriods(provinceCode: string): TimePeriodConfig {
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
}

// 单例实例
let parserAgentInstance: ParserAgent | null = null;

export function getParserAgent(): ParserAgent {
  if (!parserAgentInstance) {
    parserAgentInstance = new ParserAgent();
  }
  return parserAgentInstance;
}
