/**
 * 文档AI解析服务
 * 
 * 使用 transformers.js 本地模型
 * 支持PDF文档内容提取和表格识别
 */

import { pipeline, PipelineType } from '@xenova/transformers';

export interface ExtractedTable {
  headers: string[];
  rows: string[][];
}

export interface ExtractedData {
  policyNumber?: string;
  effectiveDate?: string;
  publishDate?: string;
  tables: ExtractedTable[];
  confidence: number;
}

/**
 * 文档AI服务
 */
export class DocumentAIService {
  private qaPipeline: any = null;
  private tablePipeline: any = null;
  private isInitialized = false;

  /**
   * 初始化AI模型
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[DocumentAI] Initializing models...');

    try {
      // 使用轻量级模型进行问答
      this.qaPipeline = await pipeline(
        'question-answering',
        'Xenova/distilbert-base-uncased-distilled-squad',
        { quantized: true } // 使用量化模型减少体积
      );

      // 表格结构识别模型
      this.tablePipeline = await pipeline(
        'object-detection',
        'Xenova/detr-resnet-50',
        { quantized: true }
      );

      this.isInitialized = true;
      console.log('[DocumentAI] Models initialized successfully');
    } catch (error) {
      console.error('[DocumentAI] Failed to initialize models:', error);
      throw error;
    }
  }

  /**
   * 从PDF提取电价数据
   */
  async extractTariffFromPDF(pdfBuffer: ArrayBuffer): Promise<ExtractedData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('[DocumentAI] Extracting tariff data from PDF...');

    try {
      // 将PDF转换为文本（简化处理，实际需要PDF解析库）
      const text = await this.pdfToText(pdfBuffer);
      
      // 使用QA模型提取关键信息
      const [policyNumber, effectiveDate, publishDate] = await Promise.all([
        this.extractWithQA(text, '政策文号是什么？'),
        this.extractWithQA(text, '生效日期是什么时候？'),
        this.extractWithQA(text, '发布日期是什么时候？'),
      ]);

      // 提取表格
      const tables = await this.extractTables(text);

      // 计算置信度
      const confidence = this.calculateConfidence({
        policyNumber,
        effectiveDate,
        publishDate,
        tables,
      });

      return {
        policyNumber,
        effectiveDate,
        publishDate,
        tables,
        confidence,
      };
    } catch (error) {
      console.error('[DocumentAI] Extraction failed:', error);
      return {
        tables: [],
        confidence: 0,
      };
    }
  }

  /**
   * 使用QA模型提取信息
   */
  private async extractWithQA(context: string, question: string): Promise<string | undefined> {
    try {
      const result = await this.qaPipeline(question, context);
      if (result && result.answer && result.score > 0.3) {
        return result.answer;
      }
      return undefined;
    } catch (error) {
      console.warn('[DocumentAI] QA extraction failed:', error);
      return undefined;
    }
  }

  /**
   * 提取表格数据
   */
  private async extractTables(text: string): Promise<ExtractedTable[]> {
    const tables: ExtractedTable[] = [];
    
    // 简单的表格检测：查找制表符或空格分隔的数据
    const lines = text.split('\n');
    let currentTable: ExtractedTable | null = null;

    for (const line of lines) {
      // 检测是否包含数字和价格模式
      if (this.isTableRow(line)) {
        if (!currentTable) {
          currentTable = { headers: [], rows: [] };
        }
        
        const cells = this.splitTableCells(line);
        if (currentTable.headers.length === 0) {
          currentTable.headers = cells;
        } else {
          currentTable.rows.push(cells);
        }
      } else {
        if (currentTable && currentTable.rows.length > 0) {
          tables.push(currentTable);
          currentTable = null;
        }
      }
    }

    if (currentTable && currentTable.rows.length > 0) {
      tables.push(currentTable);
    }

    return tables;
  }

  /**
   * 判断是否为表格行
   */
  private isTableRow(line: string): boolean {
    // 包含数字和电压等级的行可能是表格行
    const hasVoltage = /千伏|kV|电压/.test(line);
    const hasPrice = /\d+\.\d+/.test(line);
    return hasVoltage && hasPrice;
  }

  /**
   * 分割表格单元格
   */
  private splitTableCells(line: string): string[] {
    // 使用空格或制表符分割
    return line
      .split(/\s+|\t/)
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);
  }

  /**
   * 将PDF转换为文本
   * 注意：这里需要PDF解析库，如pdf.js
   */
  private async pdfToText(pdfBuffer: ArrayBuffer): Promise<string> {
    // 简化实现，实际需要集成pdf.js
    // const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    // let text = '';
    // for (let i = 1; i <= pdf.numPages; i++) {
    //   const page = await pdf.getPage(i);
    //   const content = await page.getTextContent();
    //   text += content.items.map((item: any) => item.str).join(' ');
    // }
    // return text;
    
    // 临时返回空字符串
    return '';
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(data: Partial<ExtractedData>): number {
    let score = 0;
    let maxScore = 4;

    if (data.policyNumber) score++;
    if (data.effectiveDate) score++;
    if (data.publishDate) score++;
    if (data.tables && data.tables.length > 0) score++;

    return score / maxScore;
  }

  /**
   * 检查模型是否已加载
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// 单例实例
let aiServiceInstance: DocumentAIService | null = null;

export function getDocumentAIService(): DocumentAIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new DocumentAIService();
  }
  return aiServiceInstance;
}
