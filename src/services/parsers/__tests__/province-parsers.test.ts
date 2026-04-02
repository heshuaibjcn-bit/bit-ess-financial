/**
 * 省份电价解析器测试
 * 
 * 测试所有省份定制解析器的功能
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  parserRegistry,
  getParserRegistry,
  BaseProvinceParser,
  IProvinceTariffParser,
} from '../ProvinceParserRegistry';
import '../provinces'; // 导入所有解析器
import { PDFMetadata } from '../../agents/PDFAnalyzer';

// 测试用的PDF元数据
const mockMetadata: PDFMetadata = {
  title: '关于调整工商业电价的通知',
  policyNumber: '粤发改价格〔2024〕123号',
  effectiveDate: '2024-01-01',
  publisher: '广东省发展和改革委员会',
  pageCount: 5,
};

// 模拟PDF文本数据
const createMockPDFText = (province: string) => `
${province}发展和改革委员会文件

关于调整工商业电价的通知

一、电价标准

不满1千伏
一般工商业用电
电度电价 0.6543 元/千瓦时

1-10千伏
大工业用电
电度电价 0.6234 元/千瓦时

35千伏
大工业用电
电度电价 0.5987 元/千瓦时

二、执行时间
自2024年1月1日起执行。
`;

describe('省份解析器注册中心', () => {
  it('应该正确初始化并包含所有省份解析器', () => {
    const provinces = parserRegistry.getRegisteredProvinces();
    
    // 验证已注册的省份
    expect(provinces).toContain('GD'); // 广东
    expect(provinces).toContain('ZJ'); // 浙江
    expect(provinces).toContain('JS'); // 江苏
    expect(provinces).toContain('SH'); // 上海
    expect(provinces).toContain('HN'); // 湖南
    expect(provinces).toContain('HB'); // 湖北
    expect(provinces).toContain('SC'); // 四川
    expect(provinces).toContain('AH'); // 安徽
    expect(provinces).toContain('FJ'); // 福建
    
    // 验证总数
    expect(provinces.length).toBeGreaterThanOrEqual(9);
  });

  it('应该能根据省份代码获取解析器', () => {
    const gdParser = parserRegistry.getParser('GD');
    expect(gdParser).toBeDefined();
    expect(gdParser?.provinceCode).toBe('GD');
    expect(gdParser?.provinceName).toBe('广东省');
  });

  it('应该能根据内容自动匹配解析器', () => {
    const text = '广东省发展和改革委员会关于调整电价的通知';
    const matchedParser = parserRegistry.findParserForContent(text, mockMetadata);
    
    expect(matchedParser).toBeDefined();
    expect(matchedParser?.provinceCode).toBe('GD');
  });
});

describe('广东省解析器', () => {
  const parser = parserRegistry.getParser('GD');
  
  it('应该能识别广东电价文件', () => {
    expect(parser).toBeDefined();
    
    const text = '粤发改价格〔2024〕123号 广东省电价通知';
    const canParse = parser!.canParse(text, mockMetadata);
    expect(canParse).toBe(true);
  });

  it('应该能解析电价数据', async () => {
    const text = createMockPDFText('广东省');
    
    const result = await parser!.parse(text, mockMetadata);
    
    expect(result.provinceCode).toBe('GD');
    expect(result.provinceName).toBe('广东省');
    expect(result.tariffItems.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    
    // 验证电价项
    const firstItem = result.tariffItems[0];
    expect(firstItem.voltageLevel).toBeDefined();
    expect(firstItem.category).toBeDefined();
    expect(firstItem.price).toBeGreaterThan(0);
  });

  it('应该能检测季节性电价', async () => {
    const seasonalText = `
广东省电价表

夏季（7-9月）
不满1千伏
一般工商业用电
电度电价 0.6543 元/千瓦时

非夏季
不满1千伏
一般工商业用电
电度电价 0.6234 元/千瓦时
    `;
    
    const result = await parser!.parse(seasonalText, mockMetadata);
    
    // 检查是否有季节性数据
    const hasSeasonalData = result.tariffItems.some(item => 
      item.season === '夏季' || item.season === '非夏季'
    );
    expect(hasSeasonalData).toBe(true);
  });
});

describe('浙江省解析器', () => {
  const parser = parserRegistry.getParser('ZJ');
  
  it('应该能识别浙江电价文件', () => {
    expect(parser).toBeDefined();
    
    const text = '浙发改价格〔2024〕89号 浙江省电价通知';
    const canParse = parser!.canParse(text, mockMetadata);
    expect(canParse).toBe(true);
  });

  it('应该能解析浙江电价数据', async () => {
    const text = createMockPDFText('浙江省');
    
    const result = await parser!.parse(text, mockMetadata);
    
    expect(result.provinceCode).toBe('ZJ');
    expect(result.provinceName).toBe('浙江省');
    expect(result.tariffItems.length).toBeGreaterThan(0);
  });
});

describe('江苏省解析器', () => {
  const parser = parserRegistry.getParser('JS');
  
  it('应该能识别江苏电价文件', () => {
    expect(parser).toBeDefined();
    
    const text = '苏发改价格〔2024〕56号 江苏省电价通知';
    const canParse = parser!.canParse(text, mockMetadata);
    expect(canParse).toBe(true);
  });

  it('应该能解析江苏电价数据', async () => {
    const text = createMockPDFText('江苏省');
    
    const result = await parser!.parse(text, mockMetadata);
    
    expect(result.provinceCode).toBe('JS');
    expect(result.provinceName).toBe('江苏省');
    expect(result.tariffItems.length).toBeGreaterThan(0);
  });
});

describe('解析器基类功能', () => {
  const parser = parserRegistry.getParser('GD');
  
  it('应该能提取电压等级', () => {
    const testCases = [
      { line: '不满1千伏用电', expected: '不满1千伏' },
      { line: '1-10千伏用电', expected: '1-10千伏' },
      { line: '35千伏用电', expected: '35千伏' },
    ];
    
    testCases.forEach(({ line, expected }) => {
      const result = parser!.extractVoltageLevel(line);
      expect(result).toBe(expected);
    });
  });

  it('应该能提取用电类别', () => {
    const testCases = [
      { line: '大工业用电', expected: '大工业' },
      { line: '一般工商业用电', expected: '一般工商业' },
    ];
    
    testCases.forEach(({ line, expected }) => {
      const result = parser!.extractCategory(line);
      expect(result).toContain(expected);
    });
  });

  it('应该能提取价格', () => {
    const testCases = [
      { line: '电价 0.6543 元/千瓦时', expected: 0.6543 },
      { line: '电价 0.6234元', expected: 0.6234 },
    ];
    
    testCases.forEach(({ line, expected }) => {
      const result = parser!.extractPrice(line);
      expect(result).toBe(expected);
    });
  });

  it('应该验证价格合理性', () => {
    const validPrices = [0.3, 0.5, 1.0, 1.5, 2.0, 2.5];
    const invalidPrices = [0.1, -0.5, 0, 3.5];
    
    validPrices.forEach(price => {
      const isValid = (parser as any).isValidPrice(price);
      expect(isValid).toBe(true);
    });
    
    invalidPrices.forEach(price => {
      const isValid = (parser as any).isValidPrice(price);
      expect(isValid).toBe(false);
    });
  });
});

describe('解析可信度计算', () => {
  const parser = parserRegistry.getParser('GD');
  
  it('应该根据数据完整性计算可信度', async () => {
    const completeText = createMockPDFText('广东省');
    const result = await parser!.parse(completeText, mockMetadata);
    
    // 完整数据应该有较高的可信度
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('应该根据元数据完整性计算可信度', async () => {
    const incompleteMetadata: PDFMetadata = {
      pageCount: 5,
    };
    
    const text = createMockPDFText('广东省');
    const result = await parser!.parse(text, incompleteMetadata);
    
    // 缺少元数据的可信度应该较低
    expect(result.confidence).toBeLessThan(0.9);
  });
});

// 性能测试
describe('解析器性能测试', () => {
  it('应该在合理时间内解析PDF文本', async () => {
    const parser = parserRegistry.getParser('GD');
    const text = createMockPDFText('广东省');
    
    const startTime = Date.now();
    await parser!.parse(text, mockMetadata);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(1000); // 应该在1秒内完成
  });

  it('应该能处理大量数据', async () => {
    const parser = parserRegistry.getParser('GD');
    
    // 生成大量符合格式的测试数据
    let largeText = '广东省电价表\n\n';
    const voltageLevels = ['不满1千伏', '1-10千伏', '35千伏', '110千伏'];
    const categories = ['一般工商业', '大工业'];
    
    for (let i = 0; i < 50; i++) {
      const voltage = voltageLevels[i % voltageLevels.length];
      const category = categories[i % categories.length];
      const price = 0.6 + (i % 10) * 0.01;
      largeText += `${voltage}\n${category}用电\n电度电价 ${price.toFixed(4)} 元/千瓦时\n\n`;
    }
    
    const result = await parser!.parse(largeText, mockMetadata);
    expect(result.tariffItems.length).toBeGreaterThan(0);
  });
});
