/**
 * 广东省电价PDF解析器
 * 
 * 特点：
 * - 南方电网格式
 * - 支持分时电价（峰平谷）
 * - 支持季节性电价（夏季/非夏季）
 * - 大工业用电有基本电价
 */

import { BaseProvinceParser, TimePeriodConfig, parserRegistry } from '../ProvinceParserRegistry';
import { PDFMetadata, ParsedTariffData, TariffItem } from '../../agents/PDFAnalyzer';

export class GuangdongParser extends BaseProvinceParser {
  readonly provinceCode = 'GD';
  readonly provinceName = '广东省';
  
  // 广东特有电压等级模式
  protected voltagePatterns = [
    /(不满\s*1\s*千伏|1-10\s*千伏|20\s*千伏|35-110\s*千伏|220\s*千伏及以上?)/,
    /(不满1千伏|1-10千伏|20千伏|35千伏|110千伏|220千伏)/,
  ];
  
  // 广东用电类别
  protected categoryPatterns = [
    /(大工业|一般工商业|居民生活用电|农业生产|非工业|普通工业)/,
    /(工商业|居民|农业)/,
  ];
  
  // 广东价格模式（支持更多小数位）
  protected pricePatterns = [
    /(\d+\.\d{2,4})/,
  ];
  
  /**
   * 检查是否支持该PDF
   */
  canParse(text: string, metadata: PDFMetadata): boolean {
    const textToCheck = text + ' ' + (metadata.title || '');
    return textToCheck.includes('广东') || 
           textToCheck.includes('粤发改价格') ||
           textToCheck.includes('南方电网') ||
           textToCheck.includes('广州') ||
           textToCheck.includes('深圳');
  }
  
  /**
   * 解析PDF文本
   */
  async parse(text: string, metadata: PDFMetadata): Promise<ParsedTariffData> {
    // 检查是否是季节性电价
    const hasSeasonalTariff = this.detectSeasonalTariff(text);
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const tariffItems: TariffItem[] = [];
    
    let currentVoltageLevel = '';
    let currentCategory = '';
    let currentSeason = '';
    let currentTimePeriod = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 提取电压等级
      const voltage = this.extractVoltageLevel(line);
      if (voltage) {
        currentVoltageLevel = voltage;
        continue;
      }
      
      // 提取用电类别
      const category = this.extractCategory(line);
      if (category) {
        currentCategory = category;
        continue;
      }
      
      // 提取季节（广东特有）
      if (hasSeasonalTariff) {
        const season = this.extractSeason(line);
        if (season) {
          currentSeason = season;
          continue;
        }
      }
      
      // 提取时段
      const timePeriod = this.extractTimePeriod(line);
      if (timePeriod) {
        currentTimePeriod = timePeriod;
        continue;
      }
      
      // 提取价格
      const price = this.extractGuangdongPrice(line, lines, i);
      if (price !== null && currentVoltageLevel && currentCategory) {
        tariffItems.push({
          voltageLevel: currentVoltageLevel,
          category: currentCategory,
          price: price,
          timePeriod: currentTimePeriod || undefined,
          season: currentSeason || undefined,
        });
      }
    }
    
    if (tariffItems.length === 0) {
      throw new Error('未能从 PDF 中提取到广东省的电价数据');
    }
    
    return {
      provinceCode: this.provinceCode,
      provinceName: this.provinceName,
      policyNumber: metadata.policyNumber || this.extractPolicyNumber(text),
      policyTitle: metadata.title || this.extractPolicyTitle(text),
      effectiveDate: metadata.effectiveDate || this.extractEffectiveDate(text),
      publisher: metadata.publisher || '广东省发展和改革委员会',
      tariffItems,
      parseMethod: 'pdf-text',
      confidence: this.calculateConfidence(tariffItems, metadata),
      parseWarnings: [],
    };
  }
  
  /**
   * 检测是否是季节性电价
   */
  private detectSeasonalTariff(text: string): boolean {
    const seasonalKeywords = ['夏季', '非夏季', '夏季电价', '非夏季电价', '7-9月', '7月-9月'];
    return seasonalKeywords.some(keyword => text.includes(keyword));
  }
  
  /**
   * 提取季节
   */
  private extractSeason(line: string): string | null {
    if (line.includes('非夏季')) {
      return '非夏季';
    }
    if (line.includes('夏季')) {
      return '夏季';
    }
    return null;
  }
  
  /**
   * 提取时段
   */
  private extractTimePeriod(line: string): string | null {
    const patterns = [
      { pattern: /峰.*?(?:电价|时段)/, name: '峰段' },
      { pattern: /谷.*?(?:电价|时段)/, name: '谷段' },
      { pattern: /平.*?(?:电价|时段)/, name: '平段' },
      { pattern: /尖.*?(?:电价|时段)/, name: '尖峰' },
      { pattern: /深谷/, name: '深谷' },
    ];
    
    for (const { pattern, name } of patterns) {
      if (pattern.test(line)) {
        return name;
      }
    }
    return null;
  }
  
  /**
   * 提取广东电价（考虑上下文）
   */
  private extractGuangdongPrice(line: string, lines: string[], index: number): number | null {
    // 广东电价通常以4位小数表示
    const priceMatches = line.match(/(\d+\.\d{4})/g);
    if (!priceMatches) return null;
    
    // 如果有多个价格，取第一个合理的
    for (const match of priceMatches) {
      const price = parseFloat(match);
      if (price >= 0.3 && price <= 2.0) {
        return price;
      }
    }
    return null;
  }
  
  /**
   * 提取政策文号
   */
  private extractPolicyNumber(text: string): string | undefined {
    const match = text.match(/粤发改价格〔\d{4}〕\d+号/);
    return match ? match[0] : undefined;
  }
  
  /**
   * 提取政策标题
   */
  private extractPolicyTitle(text: string): string | undefined {
    const lines = text.split('\n');
    for (const line of lines.slice(0, 10)) {
      if (line.includes('电价') && line.length > 10 && line.length < 100) {
        return line.trim();
      }
    }
    return undefined;
  }
  
  /**
   * 提取生效日期
   */
  private extractEffectiveDate(text: string): string | undefined {
    const match = text.match(/自\s*(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日起?/);
    if (match) {
      const [, year, month, day] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return undefined;
  }
  
  /**
   * 提取时段配置
   */
  extractTimePeriods(text: string): TimePeriodConfig | null {
    // 广东标准时段配置
    const hasSeasonal = this.detectSeasonalTariff(text);
    
    if (hasSeasonal) {
      // 季节性时段配置
      return {
        peakHours: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        valleyHours: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        flatHours: [9, 20, 21, 22, 23],
        peakDescription: '峰段（10:00-19:00）',
        valleyDescription: '谷段（0:00-8:00）',
        flatDescription: '平段（其他时间）',
        seasonalPeriods: [
          {
            name: '夏季（7-9月）',
            months: [7, 8, 9],
            peakHours: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
            valleyHours: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            flatHours: [9, 20, 21, 22, 23],
          },
          {
            name: '非夏季',
            months: [1, 2, 3, 4, 5, 6, 10, 11, 12],
            peakHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            valleyHours: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            flatHours: [21, 22, 23],
          },
        ],
      };
    }
    
    // 标准时段配置
    return {
      peakHours: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
      valleyHours: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      flatHours: [9, 20, 21, 22, 23],
      peakDescription: '峰段（10:00-19:00）',
      valleyDescription: '谷段（0:00-8:00）',
      flatDescription: '平段（其他时间）',
    };
  }
}

// 自动注册
parserRegistry.register(new GuangdongParser());
