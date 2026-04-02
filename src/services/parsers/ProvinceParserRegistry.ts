/**
 * 省份电价解析器注册中心
 * 
 * 管理所有省份特定的电价PDF解析器
 * 提供统一的解析器获取接口
 */

import { ParsedTariffData, TariffItem, PDFMetadata } from '../agents/PDFAnalyzer';

/**
 * 解析器接口
 */
export interface IProvinceTariffParser {
  readonly provinceCode: string;
  readonly provinceName: string;
  
  /**
   * 检查是否支持该PDF
   */
  canParse(text: string, metadata: PDFMetadata): boolean;
  
  /**
   * 解析PDF文本内容
   */
  parse(text: string, metadata: PDFMetadata): Promise<ParsedTariffData>;
  
  /**
   * 提取电压等级
   */
  extractVoltageLevel(line: string): string | null;
  
  /**
   * 提取用电类别
   */
  extractCategory(line: string): string | null;
  
  /**
   * 提取价格
   */
  extractPrice(line: string): number | null;
  
  /**
   * 提取时段信息
   */
  extractTimePeriods?(text: string): TimePeriodConfig | null;
}

/**
 * 时段配置
 */
export interface TimePeriodConfig {
  peakHours: number[];
  valleyHours: number[];
  flatHours: number[];
  peakDescription: string;
  valleyDescription: string;
  flatDescription: string;
  seasonalPeriods?: SeasonalPeriod[];
}

/**
 * 季节性时段
 */
export interface SeasonalPeriod {
  name: string;
  months: number[];
  peakHours: number[];
  valleyHours: number[];
  flatHours: number[];
}

/**
 * 解析器基类
 */
export abstract class BaseProvinceParser implements IProvinceTariffParser {
  abstract readonly provinceCode: string;
  abstract readonly provinceName: string;
  
  // 电压等级匹配模式（可由子类覆盖）
  protected voltagePatterns: RegExp[] = [
    /(不满\d+千伏|\d+-?\d*千伏|\d+千伏以上?)/,
  ];
  
  // 用电类别匹配模式（可由子类覆盖）
  protected categoryPatterns: RegExp[] = [
    /(工商业用电|一般工商业|大工业|农业生产|居民|非居民)/,
  ];
  
  // 价格匹配模式（可由子类覆盖）
  protected pricePatterns: RegExp[] = [
    /(\d+\.\d{3,4})\s*(元\/千瓦时|元\/度|元\/kWh)?/,
  ];
  
  /**
   * 检查是否支持该PDF
   * 默认检查省份名称或代码是否出现在文本中
   */
  canParse(text: string, metadata: PDFMetadata): boolean {
    const textToCheck = text + ' ' + (metadata.title || '');
    return textToCheck.includes(this.provinceName) || 
           textToCheck.includes(this.provinceCode);
  }
  
  /**
   * 解析PDF文本内容
   */
  async parse(text: string, metadata: PDFMetadata): Promise<ParsedTariffData> {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const tariffItems: TariffItem[] = [];
    
    let currentVoltageLevel = '';
    let currentCategory = '';
    let currentTimePeriod = '';
    
    for (const line of lines) {
      // 尝试提取电压等级
      const voltage = this.extractVoltageLevel(line);
      if (voltage) {
        currentVoltageLevel = voltage;
        continue;
      }
      
      // 尝试提取用电类别
      const category = this.extractCategory(line);
      if (category) {
        currentCategory = category;
        continue;
      }
      
      // 尝试提取时段
      const timePeriod = this.extractTimePeriodFromLine(line);
      if (timePeriod) {
        currentTimePeriod = timePeriod;
        continue;
      }
      
      // 尝试提取价格
      const price = this.extractPrice(line);
      if (price !== null && currentVoltageLevel && currentCategory) {
        // 验证价格合理性
        if (this.isValidPrice(price)) {
          tariffItems.push({
            voltageLevel: currentVoltageLevel,
            category: currentCategory,
            price: price,
            timePeriod: currentTimePeriod || undefined,
          });
        }
      }
    }
    
    if (tariffItems.length === 0) {
      throw new Error(`未能从 PDF 中提取到${this.provinceName}的电价数据`);
    }
    
    // 提取时段配置
    const timePeriods = this.extractTimePeriods?.(text) || this.getDefaultTimePeriods();
    
    const parsedData: ParsedTariffData = {
      provinceCode: this.provinceCode,
      provinceName: this.provinceName,
      policyNumber: metadata.policyNumber,
      policyTitle: metadata.title,
      effectiveDate: metadata.effectiveDate,
      publisher: metadata.publisher,
      tariffItems,
      parseMethod: 'pdf-text',
      confidence: this.calculateConfidence(tariffItems, metadata),
      parseWarnings: [],
    };
    
    return parsedData;
  }
  
  /**
   * 提取电压等级
   */
  extractVoltageLevel(line: string): string | null {
    for (const pattern of this.voltagePatterns) {
      const match = line.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }
  
  /**
   * 提取用电类别
   */
  extractCategory(line: string): string | null {
    for (const pattern of this.categoryPatterns) {
      const match = line.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }
  
  /**
   * 提取价格
   */
  extractPrice(line: string): number | null {
    for (const pattern of this.pricePatterns) {
      const match = line.match(pattern);
      if (match) {
        const price = parseFloat(match[1]);
        if (this.isValidPrice(price)) {
          return price;
        }
      }
    }
    return null;
  }
  
  /**
   * 从行中提取时段信息
   */
  protected extractTimePeriodFromLine(line: string): string | null {
    const patterns = [
      /峰.*时段?/,
      /谷.*时段?/,
      /平.*时段?/,
      /尖.*时段?/,
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }
  
  /**
   * 验证价格是否合理
   */
  protected isValidPrice(price: number): boolean {
    return price >= 0.2 && price <= 3.0;
  }
  
  /**
   * 获取默认时段配置
   */
  protected getDefaultTimePeriods(): TimePeriodConfig {
    return {
      peakHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      valleyHours: [23, 0, 1, 2, 3, 4, 5, 6, 7],
      flatHours: [22],
      peakDescription: '峰段（8:00-22:00，除谷段外）',
      valleyDescription: '谷段（23:00-7:00）',
      flatDescription: '平段（特殊情况）',
    };
  }
  
  /**
   * 计算解析可信度
   */
  protected calculateConfidence(tariffItems: TariffItem[], metadata: PDFMetadata): number {
    let confidence = 0.5;
    
    // 有政策文号，增加可信度
    if (metadata.policyNumber) {
      confidence += 0.15;
    }
    
    // 有生效日期，增加可信度
    if (metadata.effectiveDate) {
      confidence += 0.1;
    }
    
    // 电价记录数量合理（5-100条），增加可信度
    if (tariffItems.length >= 5 && tariffItems.length <= 100) {
      confidence += 0.1;
    }
    
    // 价格范围合理（0.4-1.5 元/千瓦时），增加可信度
    const validPrices = tariffItems.filter(item => item.price >= 0.4 && item.price <= 1.5);
    if (validPrices.length === tariffItems.length) {
      confidence += 0.1;
    }
    
    // 有多种电压等级，增加可信度
    const voltageLevels = new Set(tariffItems.map(item => item.voltageLevel));
    if (voltageLevels.size >= 2) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 0.95);
  }
}

/**
 * 解析器注册中心
 */
class ProvinceParserRegistry {
  private parsers: Map<string, IProvinceTariffParser> = new Map();
  
  /**
   * 注册解析器
   */
  register(parser: IProvinceTariffParser): void {
    this.parsers.set(parser.provinceCode, parser);
    console.log(`[ParserRegistry] 注册解析器: ${parser.provinceCode} - ${parser.provinceName}`);
  }
  
  /**
   * 获取解析器
   */
  getParser(provinceCode: string): IProvinceTariffParser | undefined {
    return this.parsers.get(provinceCode);
  }
  
  /**
   * 获取所有解析器
   */
  getAllParsers(): IProvinceTariffParser[] {
    return Array.from(this.parsers.values());
  }
  
  /**
   * 根据内容自动选择合适的解析器
   */
  findParserForContent(text: string, metadata: PDFMetadata): IProvinceTariffParser | undefined {
    for (const parser of this.parsers.values()) {
      if (parser.canParse(text, metadata)) {
        return parser;
      }
    }
    return undefined;
  }
  
  /**
   * 检查是否有解析器
   */
  hasParser(provinceCode: string): boolean {
    return this.parsers.has(provinceCode);
  }
  
  /**
   * 获取已注册的省份代码列表
   */
  getRegisteredProvinces(): string[] {
    return Array.from(this.parsers.keys());
  }
}

// 导出单例实例
export const parserRegistry = new ProvinceParserRegistry();

/**
 * 获取解析器注册中心实例
 */
export function getParserRegistry(): ProvinceParserRegistry {
  return parserRegistry;
}
