/**
 * 增强型PDF分析器
 * 
 * 整合省份定制解析器和AI解析
 * 提供智能的PDF解析策略选择
 */

import { 
  PDFAnalyzer, 
  ParsedTariffData, 
  PDFMetadata, 
  PDFAnalysisResult,
  TariffItem 
} from '../agents/PDFAnalyzer';
import { 
  parserRegistry, 
  IProvinceTariffParser,
  BaseProvinceParser 
} from './ProvinceParserRegistry';
import { 
  AIPDFParser, 
  AIParseResult,
  getAIPDFParser 
} from '../ai/AIPDFParser';
import './provinces'; // 导入并注册所有省份解析器

/**
 * 解析策略
 */
export type ParseStrategy = 
  | 'auto'           // 自动选择
  | 'province'       // 使用省份定制解析器
  | 'ai'             // 使用AI解析
  | 'hybrid';        // 混合解析（省份+AI验证）

/**
 * 增强解析选项
 */
export interface EnhancedParseOptions {
  strategy?: ParseStrategy;
  provinceCode?: string;
  useAI?: boolean;
  validateWithAI?: boolean;
  fallbackToAI?: boolean;
  aiOptions?: {
    model?: string;
    temperature?: number;
  };
}

/**
 * 增强解析结果
 */
export interface EnhancedParseResult extends PDFAnalysisResult {
  strategy: ParseStrategy;
  provinceParserUsed?: string;
  aiResult?: AIParseResult;
  validationResult?: {
    valid: boolean;
    issues: string[];
    suggestions: string[];
  };
  comparisonResult?: {
    provinceParserConfidence: number;
    aiConfidence: number;
    difference: number;
  };
}

/**
 * 增强型PDF分析器
 */
export class EnhancedPDFAnalyzer extends PDFAnalyzer {
  private aiParser: AIPDFParser;
  
  constructor() {
    super();
    this.aiParser = getAIPDFParser();
  }
  
  /**
   * 增强型PDF分析
   */
  async analyzePDFEnhanced(
    pdfPath: string,
    provinceCode: string,
    provinceName: string,
    options: EnhancedParseOptions = {}
  ): Promise<EnhancedParseResult> {
    const strategy = options.strategy || 'auto';
    
    console.log(`[EnhancedPDFAnalyzer] 使用策略: ${strategy}`);
    
    switch (strategy) {
      case 'province':
        return this.parseWithProvinceParser(pdfPath, provinceCode, provinceName, options);
      case 'ai':
        return this.parseWithAI(pdfPath, provinceCode, provinceName, options);
      case 'hybrid':
        return this.parseWithHybrid(pdfPath, provinceCode, provinceName, options);
      case 'auto':
      default:
        return this.parseWithAutoStrategy(pdfPath, provinceCode, provinceName, options);
    }
  }
  
  /**
   * 自动选择解析策略
   */
  private async parseWithAutoStrategy(
    pdfPath: string,
    provinceCode: string,
    provinceName: string,
    options: EnhancedParseOptions
  ): Promise<EnhancedParseResult> {
    // 检查是否有省份定制解析器
    const hasProvinceParser = parserRegistry.hasParser(provinceCode);
    
    if (hasProvinceParser) {
      console.log(`[EnhancedPDFAnalyzer] 发现${provinceName}定制解析器，优先使用`);
      
      // 尝试使用省份定制解析器
      const result = await this.parseWithProvinceParser(pdfPath, provinceCode, provinceName, {
        ...options,
        fallbackToAI: true,
      });
      
      // 如果省份解析器成功且可信度高，直接返回
      if (result.success && result.parsedData && result.parsedData.confidence >= 0.7) {
        return result;
      }
      
      // 否则尝试混合解析
      console.log(`[EnhancedPDFAnalyzer] 省份解析器可信度不足，切换到混合解析`);
      return this.parseWithHybrid(pdfPath, provinceCode, provinceName, options);
    }
    
    // 没有省份解析器，使用AI解析
    console.log(`[EnhancedPDFAnalyzer] 未发现${provinceName}定制解析器，使用AI解析`);
    return this.parseWithAI(pdfPath, provinceCode, provinceName, options);
  }
  
  /**
   * 使用省份定制解析器
   */
  private async parseWithProvinceParser(
    pdfPath: string,
    provinceCode: string,
    provinceName: string,
    options: EnhancedParseOptions
  ): Promise<EnhancedParseResult> {
    console.log(`[EnhancedPDFAnalyzer] 使用${provinceName}定制解析器`);
    
    try {
      // 首先提取PDF文本和元数据
      const { text, metadata } = await this.extractPDFContent(pdfPath);
      
      // 获取省份解析器
      const parser = parserRegistry.getParser(provinceCode);
      
      if (!parser) {
        if (options.fallbackToAI) {
          console.log(`[EnhancedPDFAnalyzer] 未找到${provinceName}解析器，回退到AI解析`);
          return this.parseWithAI(pdfPath, provinceCode, provinceName, options);
        }
        
        throw new Error(`未找到${provinceName}的定制解析器`);
      }
      
      // 使用省份解析器解析
      const parsedData = await parser.parse(text, metadata);
      
      // 如果需要AI验证
      let validationResult;
      if (options.validateWithAI) {
        validationResult = await this.aiParser.validateParseResult(parsedData, text);
      }
      
      const result: EnhancedParseResult = {
        success: true,
        pdfPath,
        parsedData,
        strategy: 'province',
        provinceParserUsed: provinceCode,
        validationResult,
      };
      
      // 如果验证失败且允许回退，使用AI解析
      if (validationResult && !validationResult.valid && options.fallbackToAI) {
        console.log(`[EnhancedPDFAnalyzer] 验证失败，回退到AI解析`);
        return this.parseWithAI(pdfPath, provinceCode, provinceName, options);
      }
      
      return result;
      
    } catch (error) {
      const errorMsg = (error as Error).message;
      console.error(`[EnhancedPDFAnalyzer] 省份解析器失败:`, errorMsg);
      
      if (options.fallbackToAI) {
        console.log(`[EnhancedPDFAnalyzer] 回退到AI解析`);
        return this.parseWithAI(pdfPath, provinceCode, provinceName, options);
      }
      
      return {
        success: false,
        pdfPath,
        error: errorMsg,
        strategy: 'province',
      };
    }
  }
  
  /**
   * 使用AI解析
   */
  private async parseWithAI(
    pdfPath: string,
    provinceCode: string,
    provinceName: string,
    options: EnhancedParseOptions
  ): Promise<EnhancedParseResult> {
    console.log(`[EnhancedPDFAnalyzer] 使用AI解析`);
    
    try {
      // 提取PDF文本和元数据
      const { text, metadata } = await this.extractPDFContent(pdfPath);
      
      // 使用AI解析
      const aiResult = await this.aiParser.parseWithAI(text, metadata, {
        provinceCode,
        provinceName,
        ...options.aiOptions,
      });
      
      if (!aiResult.success || !aiResult.parsedData) {
        return {
          success: false,
          pdfPath,
          error: aiResult.error || 'AI解析失败',
          strategy: 'ai',
          aiResult,
        };
      }
      
      return {
        success: true,
        pdfPath,
        parsedData: aiResult.parsedData,
        strategy: 'ai',
        aiResult,
      };
      
    } catch (error) {
      return {
        success: false,
        pdfPath,
        error: (error as Error).message,
        strategy: 'ai',
      };
    }
  }
  
  /**
   * 混合解析（省份解析器 + AI验证/补充）
   */
  private async parseWithHybrid(
    pdfPath: string,
    provinceCode: string,
    provinceName: string,
    options: EnhancedParseOptions
  ): Promise<EnhancedParseResult> {
    console.log(`[EnhancedPDFAnalyzer] 使用混合解析策略`);
    
    try {
      // 提取PDF文本和元数据
      const { text, metadata } = await this.extractPDFContent(pdfPath);
      
      // 并行运行省份解析器和AI解析
      const [provinceResult, aiResult] = await Promise.allSettled([
        this.runProvinceParser(text, metadata, provinceCode),
        this.aiParser.parseWithAI(text, metadata, { provinceCode, provinceName }),
      ]);
      
      // 处理结果
      const provinceData = provinceResult.status === 'fulfilled' ? provinceResult.value : null;
      const aiData = aiResult.status === 'fulfilled' && aiResult.value.success 
        ? aiResult.value.parsedData 
        : null;
      
      // 比较并选择最佳结果
      if (provinceData && aiData) {
        const comparison = this.compareResults(provinceData, aiData);
        
        // 选择可信度更高的结果
        const bestResult = comparison.provinceBetter ? provinceData : aiData;
        
        // 合并两个结果的优势
        const mergedResult = this.mergeResults(provinceData, aiData);
        
        return {
          success: true,
          pdfPath,
          parsedData: mergedResult,
          strategy: 'hybrid',
          provinceParserUsed: provinceCode,
          aiResult: aiResult.status === 'fulfilled' ? aiResult.value : undefined,
          comparisonResult: comparison,
        };
      }
      
      // 只有一个成功，使用成功的那个
      if (provinceData) {
        return {
          success: true,
          pdfPath,
          parsedData: provinceData,
          strategy: 'hybrid',
          provinceParserUsed: provinceCode,
        };
      }
      
      if (aiData) {
        return {
          success: true,
          pdfPath,
          parsedData: aiData,
          strategy: 'hybrid',
          aiResult: aiResult.status === 'fulfilled' ? aiResult.value : undefined,
        };
      }
      
      // 都失败了
      return {
        success: false,
        pdfPath,
        error: '省份解析器和AI解析都失败了',
        strategy: 'hybrid',
      };
      
    } catch (error) {
      return {
        success: false,
        pdfPath,
        error: (error as Error).message,
        strategy: 'hybrid',
      };
    }
  }
  
  /**
   * 提取PDF内容
   */
  private async extractPDFContent(pdfPath: string): Promise<{ text: string; metadata: PDFMetadata }> {
    // 这里需要实现PDF内容提取逻辑
    // 暂时返回空，实际使用时需要集成PDF提取库
    return {
      text: '',
      metadata: {
        pageCount: 0,
      },
    };
  }
  
  /**
   * 运行省份解析器
   */
  private async runProvinceParser(
    text: string,
    metadata: PDFMetadata,
    provinceCode: string
  ): Promise<ParsedTariffData | null> {
    const parser = parserRegistry.getParser(provinceCode);
    if (!parser) return null;
    
    try {
      return await parser.parse(text, metadata);
    } catch (error) {
      console.error(`[EnhancedPDFAnalyzer] 省份解析器错误:`, error);
      return null;
    }
  }
  
  /**
   * 比较两个解析结果
   */
  private compareResults(provinceData: ParsedTariffData, aiData: ParsedTariffData): {
    provinceBetter: boolean;
    provinceParserConfidence: number;
    aiConfidence: number;
    difference: number;
  } {
    const provinceConfidence = provinceData.confidence || 0;
    const aiConfidence = aiData.confidence || 0;
    
    // 比较电价数据
    const provincePriceCount = provinceData.tariffItems.length;
    const aiPriceCount = aiData.tariffItems.length;
    
    // 计算价格差异（如果电压等级和类别相同）
    let priceDifference = 0;
    let commonItems = 0;
    
    for (const pItem of provinceData.tariffItems) {
      const aItem = aiData.tariffItems.find(
        ai => ai.voltageLevel === pItem.voltageLevel && ai.category === pItem.category
      );
      if (aItem) {
        priceDifference += Math.abs(pItem.price - aItem.price);
        commonItems++;
      }
    }
    
    const avgDifference = commonItems > 0 ? priceDifference / commonItems : 0;
    
    // 综合评分
    const provinceScore = provinceConfidence + (provincePriceCount * 0.01);
    const aiScore = aiConfidence + (aiPriceCount * 0.01);
    
    return {
      provinceBetter: provinceScore >= aiScore,
      provinceParserConfidence: provinceConfidence,
      aiConfidence: aiConfidence,
      difference: avgDifference,
    };
  }
  
  /**
   * 合并两个解析结果
   */
  private mergeResults(provinceData: ParsedTariffData, aiData: ParsedTariffData): ParsedTariffData {
    // 创建合并后的电价项列表
    const mergedItems: TariffItem[] = [];
    const addedKeys = new Set<string>();
    
    // 优先使用省份解析器的数据
    for (const item of provinceData.tariffItems) {
      const key = `${item.voltageLevel}_${item.category}_${item.timePeriod || ''}`;
      mergedItems.push(item);
      addedKeys.add(key);
    }
    
    // 添加AI解析器独有的数据
    for (const item of aiData.tariffItems) {
      const key = `${item.voltageLevel}_${item.category}_${item.timePeriod || ''}`;
      if (!addedKeys.has(key)) {
        mergedItems.push(item);
      }
    }
    
    return {
      ...provinceData,
      tariffItems: mergedItems,
      confidence: Math.max(provinceData.confidence, aiData.confidence),
      parseMethod: 'hybrid',
    };
  }
  
  /**
   * 批量分析多个PDF
   */
  async analyzeMultiplePDFsEnhanced(
    pdfPaths: string[],
    provinceCode: string,
    provinceName: string,
    options: EnhancedParseOptions = {}
  ): Promise<Map<string, EnhancedParseResult>> {
    const results = new Map<string, EnhancedParseResult>();
    
    for (const pdfPath of pdfPaths) {
      const result = await this.analyzePDFEnhanced(pdfPath, provinceCode, provinceName, options);
      results.set(pdfPath, result);
    }
    
    return results;
  }
}

// 导出单例
let enhancedAnalyzerInstance: EnhancedPDFAnalyzer | null = null;

export function getEnhancedPDFAnalyzer(): EnhancedPDFAnalyzer {
  if (!enhancedAnalyzerInstance) {
    enhancedAnalyzerInstance = new EnhancedPDFAnalyzer();
  }
  return enhancedAnalyzerInstance;
}
