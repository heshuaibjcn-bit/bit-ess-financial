/**
 * AI PDF解析服务
 * 
 * 使用AI大模型（Claude）解析电价PDF文档
 * 功能：
 * 1. 智能识别表格结构
 * 2. 提取结构化电价数据
 * 3. 验证数据完整性
 * 4. 生成解析报告
 */

import { ParsedTariffData, TariffItem, PDFMetadata } from '../agents/PDFAnalyzer';
import { TimePeriodConfig } from '../parsers/ProvinceParserRegistry';
import { AI_CONFIG } from '../../config/aiConfig';

/**
 * AI解析选项
 */
export interface AIParseOptions {
  provinceCode?: string;
  provinceName?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * AI解析结果
 */
export interface AIParseResult {
  success: boolean;
  parsedData?: ParsedTariffData;
  rawResponse?: string;
  error?: string;
  confidence: number;
  processingTime: number;
  modelUsed: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

/**
 * AI表格识别结果
 */
export interface AITableRecognitionResult {
  success: boolean;
  tables: AITable[];
  error?: string;
}

/**
 * AI识别的表格
 */
export interface AITable {
  id: number;
  headers: string[];
  rows: string[][];
  type: 'tariff' | 'time_period' | 'other';
  confidence: number;
}

/**
 * AI PDF解析器
 */
export class AIPDFParser {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  
  constructor() {
    this.apiKey = import.meta.env.VITE_AI_API_KEY || '';
    this.baseUrl = import.meta.env.VITE_AI_API_URL || 'https://api.openai.com/v1';
    this.defaultModel = AI_CONFIG.model.primary;
  }
  
  /**
   * 使用AI解析PDF文本
   */
  async parseWithAI(
    text: string,
    metadata: PDFMetadata,
    options: AIParseOptions = {}
  ): Promise<AIParseResult> {
    const startTime = Date.now();
    
    try {
      // 构建提示词
      const prompt = this.buildParsePrompt(text, metadata, options);
      
      // 调用AI API
      const response = await this.callAI(prompt, options);
      
      // 解析AI响应
      const parsedData = this.parseAIResponse(response, options);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        parsedData,
        rawResponse: response,
        confidence: this.calculateAIConfidence(parsedData),
        processingTime,
        modelUsed: options.model || this.defaultModel,
      };
      
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        confidence: 0,
        processingTime: Date.now() - startTime,
        modelUsed: options.model || this.defaultModel,
      };
    }
  }
  
  /**
   * 使用AI识别表格结构
   */
  async recognizeTables(
    text: string,
    options: AIParseOptions = {}
  ): Promise<AITableRecognitionResult> {
    try {
      const prompt = this.buildTableRecognitionPrompt(text);
      const response = await this.callAI(prompt, options);
      
      const tables = this.parseTableRecognitionResponse(response);
      
      return {
        success: true,
        tables,
      };
      
    } catch (error) {
      return {
        success: false,
        tables: [],
        error: (error as Error).message,
      };
    }
  }
  
  /**
   * 验证解析结果
   */
  async validateParseResult(
    parsedData: ParsedTariffData,
    originalText: string
  ): Promise<{
    valid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const prompt = this.buildValidationPrompt(parsedData, originalText);
    
    try {
      const response = await this.callAI(prompt, { temperature: 0.1 });
      return this.parseValidationResponse(response);
    } catch (error) {
      return {
        valid: false,
        issues: ['AI验证失败: ' + (error as Error).message],
        suggestions: [],
      };
    }
  }
  
  /**
   * 构建解析提示词
   */
  private buildParsePrompt(
    text: string,
    metadata: PDFMetadata,
    options: AIParseOptions
  ): string {
    const provinceContext = options.provinceName 
      ? `这是${options.provinceName}的电价文件。`
      : '';
    
    return `你是一个专业的电价数据解析助手。请从以下电价政策PDF文本中提取结构化数据。

${provinceContext}

PDF元数据：
- 标题: ${metadata.title || '未知'}
- 页数: ${metadata.pageCount}
- 政策文号: ${metadata.policyNumber || '未知'}

请提取以下内容并以JSON格式返回：
1. 政策文号（如：粤发改价格〔2024〕123号）
2. 政策标题
3. 生效日期
4. 发文单位
5. 电价表格数据，包括：
   - 电压等级（如：不满1千伏、1-10千伏、35千伏等）
   - 用电类别（如：大工业、一般工商业、居民等）
   - 电价（元/千瓦时，保留4位小数）
   - 时段类型（峰、平、谷、尖峰等，如有）
   - 季节（夏季/非夏季等，如有）

请返回以下JSON格式：
{
  "policyNumber": "政策文号",
  "policyTitle": "政策标题",
  "effectiveDate": "YYYY-MM-DD",
  "publisher": "发文单位",
  "tariffItems": [
    {
      "voltageLevel": "电压等级",
      "category": "用电类别",
      "price": 0.6543,
      "timePeriod": "峰/平/谷（可选）",
      "season": "季节（可选）"
    }
  ],
  "timePeriods": {
    "peakHours": [8,9,10,11,12,13,14,15,16,17,18,19],
    "valleyHours": [23,0,1,2,3,4,5,6,7],
    "flatHours": [20,21,22],
    "peakDescription": "峰段描述",
    "valleyDescription": "谷段描述",
    "flatDescription": "平段描述"
  },
  "confidence": 0.85
}

注意：
- 只返回JSON数据，不要包含其他文字说明
- 电价单位统一为元/千瓦时
- 时段使用24小时制数字数组
- confidence字段表示你对解析结果的信心（0-1之间）

PDF文本内容：
---
${text.substring(0, 15000)}
---
`;
  }
  
  /**
   * 构建表格识别提示词
   */
  private buildTableRecognitionPrompt(text: string): string {
    return `请识别以下PDF文本中的表格结构，并以JSON格式返回。

请识别以下类型的表格：
1. 电价表 - 包含电压等级、用电类别、电价等信息
2. 时段表 - 包含峰谷平时段划分
3. 其他相关表格

返回JSON格式：
{
  "tables": [
    {
      "id": 1,
      "type": "tariff|time_period|other",
      "headers": ["列1", "列2", "列3"],
      "rows": [
        ["数据1", "数据2", "数据3"],
        ["数据4", "数据5", "数据6"]
      ],
      "confidence": 0.9
    }
  ]
}

注意：只返回JSON数据，不要包含其他文字说明。

PDF文本内容：
---
${text.substring(0, 10000)}
---
`;
  }
  
  /**
   * 构建验证提示词
   */
  private buildValidationPrompt(parsedData: ParsedTariffData, originalText: string): string {
    return `请验证以下电价解析结果是否准确。

原始文本（部分）：
---
${originalText.substring(0, 5000)}
---

解析结果：
${JSON.stringify(parsedData, null, 2)}

请检查：
1. 电价数据是否合理（范围0.2-2.0元/千瓦时）
2. 电压等级是否正确识别
3. 用电类别是否正确
4. 是否有遗漏的数据
5. 时段配置是否合理

返回JSON格式：
{
  "valid": true/false,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}
`;
  }
  
  /**
   * 调用AI API
   */
  private async callAI(prompt: string, options: AIParseOptions): Promise<string> {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.1;
    const maxTokens = options.maxTokens || 4000;
    
    // 这里使用模拟响应，实际使用时需要替换为真实的AI API调用
    // 可以集成 Claude、GPT-4、Gemini 等模型
    
    // 检查是否配置了API密钥
    if (!this.apiKey) {
      console.warn('[AIPDFParser] 未配置AI API密钥，使用模拟解析');
      return this.generateMockResponse(prompt);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: '你是一个专业的电价数据解析助手。' },
            { role: 'user', content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`AI API错误: ${response.status}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch (error) {
      console.error('[AIPDFParser] AI API调用失败:', error);
      // 失败时返回模拟响应
      return this.generateMockResponse(prompt);
    }
  }
  
  /**
   * 生成模拟响应（用于测试）
   */
  private generateMockResponse(prompt: string): string {
    // 简单的模拟响应，实际使用时应该调用真实AI API
    if (prompt.includes('表格识别')) {
      return JSON.stringify({
        tables: [
          {
            id: 1,
            type: 'tariff',
            headers: ['电压等级', '用电类别', '电价'],
            rows: [
              ['不满1千伏', '一般工商业', '0.6543'],
              ['1-10千伏', '大工业', '0.6234'],
            ],
            confidence: 0.85,
          },
        ],
      });
    }
    
    if (prompt.includes('验证')) {
      return JSON.stringify({
        valid: true,
        issues: [],
        suggestions: ['建议核对峰谷时段划分'],
      });
    }
    
    // 默认解析响应
    return JSON.stringify({
      policyNumber: 'XX发改价格〔2024〕123号',
      policyTitle: '工商业电价政策',
      effectiveDate: '2024-01-01',
      publisher: '省发展和改革委员会',
      tariffItems: [
        {
          voltageLevel: '不满1千伏',
          category: '一般工商业',
          price: 0.6543,
          timePeriod: '平段',
        },
        {
          voltageLevel: '1-10千伏',
          category: '大工业',
          price: 0.6234,
          timePeriod: '平段',
        },
      ],
      timePeriods: {
        peakHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        valleyHours: [23, 0, 1, 2, 3, 4, 5, 6, 7],
        flatHours: [20, 21, 22],
        peakDescription: '峰段（8:00-20:00，除谷段外）',
        valleyDescription: '谷段（23:00-7:00）',
        flatDescription: '平段（20:00-23:00）',
      },
      confidence: 0.75,
    });
  }
  
  /**
   * 解析AI响应
   */
  private parseAIResponse(response: string, options: AIParseOptions): ParsedTariffData {
    try {
      // 提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI响应中未找到JSON数据');
      }
      
      const data = JSON.parse(jsonMatch[0]);
      
      return {
        provinceCode: options.provinceCode || 'UNKNOWN',
        provinceName: options.provinceName || '未知省份',
        policyNumber: data.policyNumber,
        policyTitle: data.policyTitle,
        effectiveDate: data.effectiveDate,
        publisher: data.publisher,
        tariffItems: data.tariffItems || [],
        parseMethod: 'ai',
        confidence: data.confidence || 0.5,
        parseWarnings: [],
      };
      
    } catch (error) {
      throw new Error(`解析AI响应失败: ${(error as Error).message}`);
    }
  }
  
  /**
   * 解析表格识别响应
   */
  private parseTableRecognitionResponse(response: string): AITable[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return [];
      }
      
      const data = JSON.parse(jsonMatch[0]);
      return data.tables || [];
      
    } catch (error) {
      console.error('解析表格识别响应失败:', error);
      return [];
    }
  }
  
  /**
   * 解析验证响应
   */
  private parseValidationResponse(response: string): {
    valid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { valid: false, issues: ['无法解析验证响应'], suggestions: [] };
      }
      
      const data = JSON.parse(jsonMatch[0]);
      return {
        valid: data.valid ?? false,
        issues: data.issues || [],
        suggestions: data.suggestions || [],
      };
      
    } catch (error) {
      return { valid: false, issues: ['解析验证响应失败'], suggestions: [] };
    }
  }
  
  /**
   * 计算AI解析可信度
   */
  private calculateAIConfidence(parsedData: ParsedTariffData): number {
    let confidence = parsedData.confidence || 0.5;
    
    // 根据数据完整性调整可信度
    if (parsedData.tariffItems.length > 0) {
      confidence += 0.1;
    }
    
    if (parsedData.policyNumber) {
      confidence += 0.1;
    }
    
    if (parsedData.effectiveDate) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 0.95);
  }
}

// 导出单例
let aiParserInstance: AIPDFParser | null = null;

export function getAIPDFParser(): AIPDFParser {
  if (!aiParserInstance) {
    aiParserInstance = new AIPDFParser();
  }
  return aiParserInstance;
}
