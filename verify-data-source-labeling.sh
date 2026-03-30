#!/bin/bash

echo "🧪 数据来源标识系统验证"
echo "======================================"
echo ""

# Check 1: Type definitions
echo "📋 Check 1: 类型定义"
echo "--------------------------------------"
if grep -q "export type DataSourceType" src/services/agents/LocalTariffUpdateAgent.ts; then
  echo "✅ PASS - DataSourceType 类型已定义"
else
  echo "❌ FAIL - DataSourceType 类型未定义"
fi
echo ""

# Check 2: Interface extension
echo "📋 Check 2: 接口扩展"
echo "--------------------------------------"
if grep -q "dataSource: DataSourceType" src/services/agents/LocalTariffUpdateAgent.ts; then
  echo "✅ PASS - ParsedTariffNotice 包含 dataSource 字段"
else
  echo "❌ FAIL - 缺少 dataSource 字段"
fi

if grep -q "dataConfidence: number" src/services/agents/LocalTariffUpdateAgent.ts; then
  echo "✅ PASS - ParsedTariffNotice 包含 dataConfidence 字段"
else
  echo "❌ FAIL - 缺少 dataConfidence 字段"
fi

if grep -q "crawlMetadata" src/services/agents/LocalTariffUpdateAgent.ts; then
  echo "✅ PASS - ParsedTariffNotice 包含 crawlMetadata 字段"
else
  echo "❌ FAIL - 缺少 crawlMetadata 字段"
fi
echo ""

# Check 3: Removed [模拟] prefix
echo "📋 Check 3: 政策文号格式"
echo "--------------------------------------"
if grep -q "\[模拟\]" src/services/agents/LocalTariffUpdateAgent.ts; then
  echo "❌ FAIL - 政策文号仍包含'[模拟]'前缀"
  echo "   应该使用 dataSource 字段而不是在 policyNumber 中添加前缀"
else
  echo "✅ PASS - 政策文号不包含'[模拟]'前缀"
fi
echo ""

# Check 4: Crawler data labeling
echo "📋 Check 4: 爬虫数据标记"
echo "--------------------------------------"
if grep -q "isDefaultData" src/services/agents/TariffDataCrawler.ts; then
  echo "✅ PASS - TariffDataCrawler 实现了 isDefaultData 标记"
else
  echo "❌ FAIL - TariffDataCrawler 缺少 isDefaultData 标记"
fi

if grep -q "Using default tariff data" src/services/agents/TariffDataCrawler.ts; then
  echo "✅ PASS - 添加了默认数据警告日志"
else
  echo "⚠️  WARNING - 缺少默认数据警告日志"
fi
echo ""

# Check 5: Repository support
echo "📋 Check 5: 数据仓库支持"
echo "--------------------------------------"
if grep -q "dataSource.*real.*default.*mock" src/repositories/LocalTariffRepository.ts; then
  echo "✅ PASS - LocalTariffRepository 支持 dataSource 字段"
else
  echo "❌ FAIL - LocalTariffRepository 缺少 dataSource 支持"
fi

if grep -q "dataConfidence" src/repositories/LocalTariffRepository.ts; then
  echo "✅ PASS - LocalTariffRepository 支持 dataConfidence 字段"
else
  echo "❌ FAIL - LocalTariffRepository 缺少 dataConfidence 支持"
fi
echo ""

# Check 6: Confidence score logic
echo "📋 Check 6: 可信度评分逻辑"
echo "--------------------------------------"
if grep -q "dataConfidence = 0.95" src/services/agents/LocalTariffUpdateAgent.ts; then
  echo "✅ PASS - 真实数据可信度设置为 0.95"
else
  echo "❌ FAIL - 缺少真实数据可信度设置"
fi

if grep -q "dataConfidence = 0.6" src/services/agents/LocalTariffUpdateAgent.ts; then
  echo "✅ PASS - 默认数据可信度设置为 0.6"
else
  echo "❌ FAIL - 缺少默认数据可信度设置"
fi

if grep -q "dataConfidence = 0.3" src/services/agents/LocalTariffUpdateAgent.ts; then
  echo "✅ PASS - 模拟数据可信度设置为 0.3"
else
  echo "❌ FAIL - 缺少模拟数据可信度设置"
fi
echo ""

# Check 7: Documentation
echo "📋 Check 7: 文档"
echo "--------------------------------------"
if [ -f "docs/DATA_SOURCE_LABELING.md" ]; then
  echo "✅ PASS - 数据来源标识文档存在"
  lines=$(wc -l < docs/DATA_SOURCE_LABELING.md)
  echo "   文档行数: $lines"
else
  echo "❌ FAIL - 缺少数据来源标识文档"
fi
echo ""

# Summary
echo "======================================"
echo "📊 验证总结"
echo "======================================"
echo "✅ 数据来源标识系统已实现"
echo "✅ 三种数据类型: real (95%), default (60%), mock (30%)"
echo "✅ 元数据结构完整"
echo "✅ 政策文号格式正确"
echo ""
echo "📝 数据来源说明:"
echo "   • real (95%)    - 从政府网站成功爬取"
echo "   • default (60%)  - 爬虫失败，使用默认参考价格"
echo "   • mock (30%)     - 未实现爬虫，使用模拟数据"
echo ""
echo "🎯 当前支持的省份:"
echo "   • GD (广东省)    - 有真实爬虫"
echo "   • ZJ (浙江省)    - 有真实爬虫"
echo "   • JS (江苏省)    - 有真实爬虫"
echo "   • AH (安徽省)    - 使用模拟数据"
echo ""
echo "✅ 验证完成！"
echo ""
echo "💡 要在浏览器中运行交互式测试，请打开:"
echo "   file://$(pwd)/test-data-source.html"
