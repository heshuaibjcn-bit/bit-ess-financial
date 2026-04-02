/**
 * 安徽省电价PDF解析器
 * 
 * 特点：
 * - 华东电网格式
 * - 支持分时电价
 * - 支持两部制/单一制
 */

import { BaseProvinceParser, TimePeriodConfig, parserRegistry } from '../ProvinceParserRegistry';
import { PDFMetadata, ParsedTariffData, TariffItem } from '../../agents/PDFAnalyzer';

export class AnhuiParser extends BaseProvinceParser {
  readonly provinceCode = 'AH';
  readonly provinceName = '安徽省';
  
  // 安徽特有电压等级
  protected voltagePatterns = [
    /(不满\s*1\s*千伏|1-10\s*千伏|35\s*千伏|110\s*千伏)/,
    /(不满1千伏|1-10千伏|35千伏|110千伏)/,
  ];
  
  // 安徽用电类别
  protected categoryPatterns = [
    /(大工业用电|一般工商业及其他用电|居民生活用电|农业生产用电)/,
    /(大工业|一般工商业|居民|农业)/,
  ];
  
  /**
   * 检查是否支持该PDF
   */
  canParse(text: string, metadata: PDFMetadata): boolean {
    const textToCheck = text + ' ' + (metadata.title || '');
    return textToCheck.includes('安徽') || 
           textToCheck.includes('皖发改价格') ||
           textToCheck.includes('皖价电') ||
           textToCheck.includes('合肥');
  }
  
  /**
   * 解析PDF文本
   */
  async parse(text: string, metadata: PDFMetadata): Promise<ParsedTariffData> {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const tariffItems: TariffItem[] = [];
    
    let currentVoltageLevel = '';
    let currentCategory = '';
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
      
      // 提取时段
      const timePeriod = this.extractTimePeriod(line);
      if (timePeriod) {
        currentTimePeriod = timePeriod;
        continue;
      }
      
      // 提取价格
      const price = this.extractAnhuiPrice(line, lines, i);
      if (price !== null && currentVoltageLevel && currentCategory) {
        tariffItems.push({
          voltageLevel: currentVoltageLevel,
          category: currentCategory,
          price: price,
          timePeriod: currentTimePeriod || undefined,
        });
      }
    }
    
    if (tariffItems.length === 0) {
      throw new Error('未能从 PDF 中提取到安徽省的电价数据');
    }
    
    return {
      provinceCode: this.provinceCode,
      provinceName: this.provinceName,
      policyNumber: metadata.policyNumber || this.extractPolicyNumber(text),
      policyTitle: metadata.title || this.extractPolicyTitle(text),
      effectiveDate: metadata.effectiveDate || this.extractEffectiveDate(text),
      publisher: metadata.publisher || '安徽省发展和改革委员会',
      tariffItems,
      parseMethod: 'pdf-text',
      confidence: this.calculateConfidence(tariffItems, metadata),
      parseWarnings: [],
    };
  }
  
  /**
   * 提取时段
   */
  private extractTimePeriod(line: string): string | null {
    const patterns = [
      { pattern: /峰.*?电价/, name: '峰段' },
      { pattern: /谷.*?电价/, name: '谷段' },
      { pattern: /平.*?电价/, name: '平段' },
    ];
    
    for (const { pattern, name } of patterns) {
      if (pattern.test(line)) {
        return name;
      }
    }
    return null;
  }
  
  /**
   * 提取安徽电价
   */
  private extractAnhuiPrice(line: string, lines: string[], index: number): number | null {
    const priceMatches = line.match(/(\d+\.\d{4})/g);
    if (!priceMatches) return null;
    
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
    const match = text.match(/皖发改价格〔\d{4}〕\d+号/);
    if (match) return match[0];
    
    const match2 = text.match(/皖价电〔\d{4}〕\d+号/);
    if (match2) return match2[0];
    
    return undefined;
  }
  
  /**
   * 提取政策标题
   */
  private extractPolicyTitle(text: string): string | undefined {
    const lines = text.split('\n');
    for (const line of lines.slice(0, 10)) {
      if ((line.includes('电价') || line.includes('销售电价')) && line.length > 10 && line.length < 100) {
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
    return {
      peakHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
      valleyHours: [23, 0, 1, 2, 3, 4, 5, 6, 7, 8],
      flatHours: [],
      peakDescription: '峰段（9:00-23:00，除谷段外）',
      valleyDescription: '谷段（23:00-9:00）',
      flatDescription: '平段（无）',
    };
  }
}

// 自动注册
parserRegistry.register(new AnhuiParser());
