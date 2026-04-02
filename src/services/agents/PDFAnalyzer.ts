/**
 * PDF 分析器 - 从电价PDF文档中提取结构化数据
 *
 * 功能：
 * 1. 使用 pdfjs-dist 提取 PDF 文本内容
 * 2. 识别表格结构（电价表通常是表格）
 * 3. OCR 识别扫描版 PDF（可选）
 * 4. 解析电价数据（电压等级、电价类别、价格）
 * 5. 提取元数据（政策文号、生效日期、发文单位）
 */

import * as fs from 'fs';
import * as path from 'path';
// 使用 legacy 构建以支持 Node.js 环境
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * 解析后的电价数据
 */
export interface ParsedTariffData {
  // 基本信息
  provinceCode: string;
  provinceName: string;
  policyNumber?: string;
  policyTitle?: string;
  effectiveDate?: string;
  publisher?: string;

  // 电价表数据
  tariffItems: TariffItem[];

  // 元数据
  parseMethod: 'pdf-text' | 'ocr' | 'hybrid';
  confidence: number;
  parseWarnings: string[];
}

/**
 * 电价项
 */
export interface TariffItem {
  // 电压等级
  voltageLevel: string;
  // 用电类别
  category: string;
  // 电价（元/千瓦时）
  price: number;
  // 时段（分时电价）
  timePeriod?: string;
  // 季节（季节性电价）
  season?: string;
}

/**
 * PDF 分析结果
 */
export interface PDFAnalysisResult {
  success: boolean;
  pdfPath: string;
  parsedData?: ParsedTariffData;
  error?: string;
}

/**
 * PDF 元数据
 */
export interface PDFMetadata {
  title?: string;
  policyNumber?: string;
  effectiveDate?: string;
  publisher?: string;
  pageCount: number;
}

/**
 * PDF 分析器
 */
export class PDFAnalyzer {
  constructor() {
    // 配置 pdfjs-dist worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }

  /**
   * 分析 PDF 文件，提取电价数据
   */
  async analyzePDF(
    pdfPath: string,
    provinceCode: string,
    provinceName: string
  ): Promise<PDFAnalysisResult> {
    console.log(`[PDFAnalyzer] 开始分析 PDF: ${pdfPath}`);

    try {
      // 检查文件是否存在
      if (!fs.existsSync(pdfPath)) {
        return {
          success: false,
          pdfPath,
          error: `PDF 文件不存在: ${pdfPath}`,
        };
      }

      // 读取 PDF 文件
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;

      console.log(`[PDFAnalyzer] PDF 页数: ${pdfDoc.numPages}`);

      // 提取元数据
      const metadata = await this.extractMetadata(pdfDoc, pdfPath);

      // 提取所有页面的文本
      const fullText = await this.extractFullText(pdfDoc);

      // 尝试文本解析
      let parsedData: ParsedTariffData | null = null;
      let parseMethod: 'pdf-text' | 'ocr' | 'hybrid' = 'pdf-text';
      const warnings: string[] = [];

      try {
        parsedData = await this.parseTextContent(fullText, metadata, provinceCode, provinceName);
        console.log(`[PDFAnalyzer] 文本解析成功，提取到 ${parsedData.tariffItems.length} 条电价记录`);
      } catch (error) {
        const errorMsg = (error as Error).message;
        console.warn(`[PDFAnalyzer] 文本解析失败: ${errorMsg}`);
        warnings.push(`文本解析失败: ${errorMsg}`);

        // TODO: 如果文本解析失败，尝试 OCR
        // parsedData = await this.parseWithOCR(pdfPath, metadata, provinceCode, provinceName);
        // parseMethod = 'ocr';

        // 如果 OCR 也失败，使用混合方式
        // parseMethod = 'hybrid';

        return {
          success: false,
          pdfPath,
          error: `PDF 解析失败: ${errorMsg}`,
        };
      }

      if (parsedData) {
        parsedData.parseMethod = parseMethod;
        parsedData.parseWarnings = warnings;

        // 计算可信度
        parsedData.confidence = this.calculateConfidence(parsedData, metadata);

        return {
          success: true,
          pdfPath,
          parsedData,
        };
      }

      return {
        success: false,
        pdfPath,
        error: '无法解析 PDF 内容',
      };

    } catch (error) {
      console.error('[PDFAnalyzer] PDF 分析失败:', error);
      return {
        success: false,
        pdfPath,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 提取 PDF 元数据
   */
  private async extractMetadata(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    pdfPath: string
  ): Promise<PDFMetadata> {
    const metadata: PDFMetadata = {
      pageCount: pdfDoc.numPages,
    };

    try {
      // 尝试从 PDF 信息中提取元数据
      const info = await pdfDoc.getMetadata().catch(() => null);
      if (info) {
        const infoObj = info as any;
        if (infoObj.Title) metadata.title = infoObj.Title;
        if (infoObj.Creator) metadata.publisher = infoObj.Creator;
      }

      // 从第一页提取标题和文号
      const firstPage = await pdfDoc.getPage(1);
      const textContent = await firstPage.getTextContent();
      const firstPageText = textContent.items.map((item: any) => item.str).join(' ');

      // 尝试匹配政策文号（例如：粤发改价格〔2024〕123号）
      const policyNumberMatch = firstPageText.match(/[一二三四五六七八九十\u4e00-\u9fa5]+发改价格\〔\d{4}\〕\d+号/);
      if (policyNumberMatch) {
        metadata.policyNumber = policyNumberMatch[0];
      }

      // 尝试匹配生效日期
      const dateMatch = firstPageText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        metadata.effectiveDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // 尝试提取标题（通常在第一页开头）
      const lines = firstPageText.split(/\s+/).filter((line: string) => line.length > 0);
      if (lines.length > 0 && lines[0].length > 5 && lines[0].length < 50) {
        metadata.title = lines[0];
      }

    } catch (error) {
      console.warn('[PDFAnalyzer] 提取元数据失败:', error);
    }

    return metadata;
  }

  /**
   * 提取 PDF 全文
   */
  private async extractFullText(pdfDoc: pdfjsLib.PDFDocumentProxy): Promise<string> {
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join('\n');
      fullText += pageText + '\n\n';
    }

    return fullText;
  }

  /**
   * 从文本内容解析电价数据
   */
  private async parseTextContent(
    text: string,
    metadata: PDFMetadata,
    provinceCode: string,
    provinceName: string
  ): Promise<ParsedTariffData> {
    const tariffItems: TariffItem[] = [];

    // 按行分割文本
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // 解析电价表
    // 电价表通常包含电压等级、用电类别、价格等信息
    let currentVoltageLevel = '';
    let currentCategory = '';

    for (const line of lines) {
      // 检测电压等级（例如：不满1千伏、1-10千伏、35千伏）
      const voltageMatch = line.match(/(不满\d+千伏|\d+-?\d*千伏|\d+千伏以上?)/);
      if (voltageMatch) {
        currentVoltageLevel = voltageMatch[0];
        continue;
      }

      // 检测用电类别（例如：工商业、一般工商业、大工业）
      const categoryMatch = line.match(/(工商业用电|一般工商业|大工业|农业生产|居民|非居民)/);
      if (categoryMatch) {
        currentCategory = categoryMatch[0];
        continue;
      }

      // 检测价格（例如：0.6789 元/千瓦时）
      const priceMatch = line.match(/(\d+\.\d+)\s*(元\/千瓦时|元\/度|元\/kWh)?/);
      if (priceMatch && currentVoltageLevel && currentCategory) {
        const price = parseFloat(priceMatch[1]);

        // 验证价格合理性（0.3-2.0 元/千瓦时）
        if (price >= 0.3 && price <= 2.0) {
          tariffItems.push({
            voltageLevel: currentVoltageLevel,
            category: currentCategory,
            price: price,
          });

          console.log(`[PDFAnalyzer] 提取电价: ${currentVoltageLevel} ${currentCategory} = ${price} 元/千瓦时`);
        }
      }
    }

    // 如果没有提取到任何电价数据，尝试其他解析策略
    if (tariffItems.length === 0) {
      throw new Error('未能从 PDF 中提取到电价数据');
    }

    return {
      provinceCode,
      provinceName,
      policyNumber: metadata.policyNumber,
      policyTitle: metadata.title,
      effectiveDate: metadata.effectiveDate,
      publisher: metadata.publisher,
      tariffItems,
      parseMethod: 'pdf-text',
      confidence: 0,
      parseWarnings: [],
    };
  }

  /**
   * 计算解析可信度
   */
  private calculateConfidence(data: ParsedTariffData, metadata: PDFMetadata): number {
    let confidence = 0.5; // 基础可信度

    // 有政策文号，增加可信度
    if (data.policyNumber) {
      confidence += 0.15;
    }

    // 有生效日期，增加可信度
    if (data.effectiveDate) {
      confidence += 0.1;
    }

    // 有发文单位，增加可信度
    if (data.publisher) {
      confidence += 0.05;
    }

    // 电价记录数量合理（5-50条），增加可信度
    if (data.tariffItems.length >= 5 && data.tariffItems.length <= 50) {
      confidence += 0.1;
    }

    // 价格范围合理（0.4-1.5 元/千瓦时），增加可信度
    const validPrices = data.tariffItems.filter(item => item.price >= 0.4 && item.price <= 1.5);
    if (validPrices.length === data.tariffItems.length) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95); // 最高可信度 0.95
  }

  /**
   * TODO: 使用 OCR 解析扫描版 PDF
   */
  private async parseWithOCR(
    pdfPath: string,
    metadata: PDFMetadata,
    provinceCode: string,
    provinceName: string
  ): Promise<ParsedTariffData> {
    // TODO: 实现 OCR 解析
    // 可以使用 Tesseract.js 或其他 OCR 库
    throw new Error('OCR 解析功能尚未实现');
  }

  /**
   * 批量分析多个 PDF 文件
   */
  async analyzeMultiplePDFs(
    pdfPaths: string[],
    provinceCode: string,
    provinceName: string
  ): Promise<Map<string, PDFAnalysisResult>> {
    const results = new Map<string, PDFAnalysisResult>();

    for (const pdfPath of pdfPaths) {
      const result = await this.analyzePDF(pdfPath, provinceCode, provinceName);
      results.set(pdfPath, result);
    }

    return results;
  }

  /**
   * 获取目录中的所有 PDF 文件
   */
  getPDFFilesInDirectory(dir: string): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files = fs.readdirSync(dir);
    return files
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .map(f => path.join(dir, f));
  }
}

/**
 * 单例实例
 */
let analyzerInstance: PDFAnalyzer | null = null;

export function getPDFAnalyzer(): PDFAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new PDFAnalyzer();
  }
  return analyzerInstance;
}
