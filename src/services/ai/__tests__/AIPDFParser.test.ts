/**
 * AI PDF解析服务测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIPDFParser, getAIPDFParser } from '../AIPDFParser';
import { PDFMetadata } from '../../agents/PDFAnalyzer';

describe('AIPDFParser', () => {
  let parser: AIPDFParser;

  const mockMetadata: PDFMetadata = {
    title: '电价通知',
    policyNumber: '粤发改价格〔2024〕123号',
    effectiveDate: '2024-01-01',
    publisher: '广东省发展和改革委员会',
    pageCount: 5,
  };

  const mockPDFText = `
广东省发展和改革委员会文件
粤发改价格〔2024〕123号

关于调整工商业电价的通知

一、电价标准
不满1千伏 一般工商业用电 0.6543元/千瓦时
1-10千伏 大工业用电 0.6234元/千瓦时

二、执行时间
自2024年1月1日起执行。
`;

  beforeEach(() => {
    parser = new AIPDFParser();
  });

  it('应该正确初始化', () => {
    expect(parser).toBeDefined();
  });

  it('应该能解析PDF文本并返回结构化数据', async () => {
    const result = await parser.parseWithAI(mockPDFText, mockMetadata, {
      provinceCode: 'GD',
      provinceName: '广东省',
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.parsedData).toBeDefined();
    expect(result.modelUsed).toBeDefined();
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('应该能识别电价表格', async () => {
    const result = await parser.recognizeTables(mockPDFText);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.tables)).toBe(true);
  });

  it('应该能验证解析结果', async () => {
    const mockParsedData = {
      provinceCode: 'GD',
      provinceName: '广东省',
      policyNumber: '粤发改价格〔2024〕123号',
      policyTitle: '电价通知',
      effectiveDate: '2024-01-01',
      publisher: '广东省发改委',
      tariffItems: [
        { voltageLevel: '不满1千伏', category: '一般工商业', price: 0.6543 },
        { voltageLevel: '1-10千伏', category: '大工业', price: 0.6234 },
      ],
      parseMethod: 'ai' as const,
      confidence: 0.85,
      parseWarnings: [],
    };

    const validation = await parser.validateParseResult(mockParsedData, mockPDFText);

    expect(validation).toBeDefined();
    expect(typeof validation.valid).toBe('boolean');
    expect(Array.isArray(validation.issues)).toBe(true);
    expect(Array.isArray(validation.suggestions)).toBe(true);
  });

  it('应该正确处理空文本', async () => {
    const result = await parser.parseWithAI('', mockMetadata, {});

    // 应该返回失败或模拟数据
    expect(result).toBeDefined();
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
  });

  it('应该返回单例实例', () => {
    const instance1 = getAIPDFParser();
    const instance2 = getAIPDFParser();

    expect(instance1).toBe(instance2);
  });

  it('应该包含省份信息在解析结果中', async () => {
    const result = await parser.parseWithAI(mockPDFText, mockMetadata, {
      provinceCode: 'ZJ',
      provinceName: '浙江省',
    });

    if (result.parsedData) {
      expect(result.parsedData.provinceCode).toBe('ZJ');
      expect(result.parsedData.provinceName).toBe('浙江省');
    }
  });

  it('应该在解析结果中包含元数据', async () => {
    const result = await parser.parseWithAI(mockPDFText, mockMetadata, {});

    if (result.parsedData) {
      expect(result.parsedData.parseMethod).toBe('ai');
      expect(result.parsedData.tariffItems).toBeDefined();
      expect(Array.isArray(result.parsedData.tariffItems)).toBe(true);
    }
  });
});

describe('AI解析器性能', () => {
  const parser = new AIPDFParser();

  it('应该在合理时间内完成解析', async () => {
    const text = '测试文本';
    const metadata: PDFMetadata = { pageCount: 1 };

    const startTime = Date.now();
    await parser.parseWithAI(text, metadata, {});
    const endTime = Date.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(5000); // 应该在5秒内完成（包括模拟延迟）
  });
});
