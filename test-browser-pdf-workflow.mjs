/**
 * 测试浏览器自动化 PDF 下载和分析工作流
 *
 * 功能：
 * 1. 访问各省电网网站
 * 2. 下载最新的电价PDF文档
 * 3. 分析PDF内容
 * 4. 显示提取的电价数据
 */

import { getBrowserTariffPDFCrawler } from './src/services/agents/BrowserTariffPDFCrawler.ts';
import { getPDFAnalyzer } from './src/services/agents/PDFAnalyzer.ts';

console.log('🧪 测试浏览器自动化 PDF 工作流\n');
console.log('='.repeat(60));

// 测试配置
const TEST_PROVINCE = 'GD'; // 广东省

try {
  // Step 1: 测试 PDF 下载
  console.log('\n📥 Step 1: 测试 PDF 下载');
  console.log('-'.repeat(60));

  const crawler = getBrowserTariffPDFCrawler();
  console.log(`正在为 ${TEST_PROVINCE} 下载最新的电价PDF...`);

  const downloadResults = await crawler.downloadMultiplePDFs([TEST_PROVINCE]);
  const downloadResult = downloadResults.get(TEST_PROVINCE);

  if (!downloadResult) {
    console.error('❌ 下载失败: 未找到结果');
    process.exit(1);
  }

  if (!downloadResult.success) {
    console.error(`❌ 下载失败: ${downloadResult.error}`);
    process.exit(1);
  }

  console.log('✅ PDF 下载成功!');
  console.log(`   省份: ${downloadResult.provinceName}`);
  console.log(`   文件名: ${downloadResult.fileName}`);
  console.log(`   文件大小: ${((downloadResult.fileSize || 0) / 1024).toFixed(2)} KB`);
  console.log(`   本地路径: ${downloadResult.localPath}`);
  console.log(`   下载时间: ${downloadResult.downloadDate}`);

  if (downloadResult.metadata) {
    console.log(`   数据源: ${downloadResult.metadata.sourceUrl}`);
  }

  // Step 2: 测试 PDF 分析
  console.log('\n📄 Step 2: 测试 PDF 分析');
  console.log('-'.repeat(60));

  const analyzer = getPDFAnalyzer();
  console.log(`正在分析 PDF 文件...`);

  const analysisResult = await analyzer.analyzePDF(
    downloadResult.localPath || '',
    TEST_PROVINCE,
    downloadResult.provinceName
  );

  if (!analysisResult.success) {
    console.error(`❌ 分析失败: ${analysisResult.error}`);
    process.exit(1);
  }

  const parsedData = analysisResult.parsedData;
  console.log('✅ PDF 分析成功!');
  console.log(`   省份: ${parsedData.provinceName}`);
  console.log(`   政策文号: ${parsedData.policyNumber || '未提取到'}`);
  console.log(`   生效日期: ${parsedData.effectiveDate || '未提取到'}`);
  console.log(`   发文单位: ${parsedData.publisher || '未提取到'}`);
  console.log(`   解析方法: ${parsedData.parseMethod}`);
  console.log(`   可信度: ${(parsedData.confidence * 100).toFixed(1)}%`);
  console.log(`   电价记录数: ${parsedData.tariffItems.length}`);

  if (parsedData.parseWarnings.length > 0) {
    console.log(`   ⚠️  警告: ${parsedData.parseWarnings.join(', ')}`);
  }

  // Step 3: 显示电价数据
  console.log('\n💰 Step 3: 电价数据详情');
  console.log('-'.repeat(60));

  if (parsedData.tariffItems.length > 0) {
    console.log('电压等级 | 用电类别 | 价格 (元/千瓦时) | 时段 | 季节');
    console.log('-'.repeat(60));

    for (const item of parsedData.tariffItems) {
      const voltage = item.voltageLevel.padEnd(10);
      const category = item.category.padEnd(12);
      const price = item.price.toFixed(4).padStart(10);
      const period = (item.timePeriod || '-').padEnd(6);
      const season = item.season || '-';

      console.log(`${voltage} | ${category} | ${price} | ${period} | ${season}`);
    }

    // 统计信息
    const prices = parsedData.tariffItems.map(item => item.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    console.log('-'.repeat(60));
    console.log('价格统计:');
    console.log(`  最低价格: ${minPrice.toFixed(4)} 元/千瓦时`);
    console.log(`  最高价格: ${maxPrice.toFixed(4)} 元/千瓦时`);
    console.log(`  平均价格: ${avgPrice.toFixed(4)} 元/千瓦时`);
  } else {
    console.log('⚠️  未提取到电价数据');
  }

  // Step 4: 测试总结
  console.log('\n📊 测试总结');
  console.log('='.repeat(60));
  console.log('✅ PDF 下载: 成功');
  console.log('✅ PDF 分析: 成功');
  console.log(`✅ 数据提取: ${parsedData.tariffItems.length} 条记录`);
  console.log(`✅ 数据可信度: ${(parsedData.confidence * 100).toFixed(1)}%`);
  console.log('\n🎉 测试完成！浏览器自动化 PDF 工作流运行正常。\n');

} catch (error) {
  console.error('\n❌ 测试失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
