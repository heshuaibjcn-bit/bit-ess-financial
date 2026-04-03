/**
 * 质量验证测试 - 不依赖 AI 代理
 *
 * 测试内容:
 * 1. 模板文件完整性
 * 2. 术语表质量
 * 3. 语言风格指南质量
 * 4. 模拟报告生成（不调用 AI）
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// 加载术语表
const loadTerminology = () => {
  const terminologyPath = join(__dirname, '../terminology.json');
  return JSON.parse(readFileSync(terminologyPath, 'utf-8'));
};

// 加载禁止词汇
const loadForbiddenWords = (): string[] => {
  const guidePath = join(__dirname, '../language-style-guide.md');
  const guide = readFileSync(guidePath, 'utf-8');
  return ['非常好', '特别', '挺好', '差不多', '可能', '应该', '大概', '很多', '做一些', '搞'];
};

// 加载模板
const loadTemplate = (name: string) => {
  const templatePath = join(__dirname, '../templates', name);
  return readFileSync(templatePath, 'utf-8');
};

// 检查术语表质量
const validateTerminology = (terminology: any) => {
  console.log('\n=== 术语表质量检查 ===\n');

  const issues: string[] = [];

  // 1. 检查术语数量
  if (terminology.terminology.length < 20) {
    issues.push(`术语数量不足: ${terminology.terminology.length} < 20`);
  } else {
    console.log(`✅ 术语数量: ${terminology.terminology.length}`);
  }

  // 2. 检查核心术语
  const coreTerms = ['内部收益率', '净现值', '投资回收期', '储能平准化成本', '峰谷价差'];
  const terms = terminology.terminology.map((t: any) => t.term);
  const missingTerms = coreTerms.filter(t => !terms.includes(t));

  if (missingTerms.length > 0) {
    issues.push(`缺少核心术语: ${missingTerms.join(', ')}`);
  } else {
    console.log('✅ 核心术语完整');
  }

  // 3. 检查每个术语的必需字段
  let incompleteTerms = 0;
  terminology.terminology.forEach((term: any) => {
    if (!term.term || !term.english || !term.definition || !term.example_usage) {
      incompleteTerms++;
    }
    if (!Array.isArray(term.forbidden_synonyms)) {
      incompleteTerms++;
    }
  });

  if (incompleteTerms > 0) {
    issues.push(`${incompleteTerms} 个术语字段不完整`);
  } else {
    console.log('✅ 所有术语字段完整');
  }

  // 4. 检查术语定义质量
  let shortDefinitions = 0;
  terminology.terminology.forEach((term: any) => {
    if (term.definition.length < 10) {
      shortDefinitions++;
    }
  });

  if (shortDefinitions > 0) {
    issues.push(`${shortDefinitions} 个术语定义过短`);
  } else {
    console.log('✅ 术语定义质量良好');
  }

  return {
    valid: issues.length === 0,
    issues,
    score: Math.max(0, 100 - issues.length * 10),
  };
};

// 检查语言风格指南质量
const validateLanguageStyleGuide = (guide: string) => {
  console.log('\n=== 语言风格指南质量检查 ===\n');

  const issues: string[] = [];

  // 1. 检查必需章节
  const requiredSections = ['词汇规则', '句式风格', '数字格式', '语气和态度', '禁止词汇'];
  const missingSections = requiredSections.filter(section => !guide.includes(section));

  if (missingSections.length > 0) {
    issues.push(`缺少章节: ${missingSections.join(', ')}`);
  } else {
    console.log('✅ 包含所有必需章节');
  }

  // 2. 检查禁止词汇
  const forbiddenWords = ['非常好', '特别', '挺好', '差不多'];
  const missingForbiddenWords = forbiddenWords.filter(word => !guide.includes(word));

  if (missingForbiddenWords.length > 0) {
    issues.push(`缺少禁止词汇: ${missingForbiddenWords.join(', ')}`);
  } else {
    console.log('✅ 禁止词汇完整');
  }

  // 3. 检查指南长度
  if (guide.length < 500) {
    issues.push('指南内容过短');
  } else {
    console.log(`✅ 指南长度: ${guide.length} 字符`);
  }

  return {
    valid: issues.length === 0,
    issues,
    score: Math.max(0, 100 - issues.length * 10),
  };
};

// 检查模板质量
const validateTemplate = (name: string, content: string) => {
  console.log(`\n=== 模板质量检查: ${name} ===\n`);

  const issues: string[] = [];

  // 1. 检查必需部分
  const requiredParts = ['## 模板规范', '### 开头模板', '### 内容结构', '### 结尾模板', '## 输出格式'];
  const missingParts = requiredParts.filter(part => !content.includes(part));

  if (missingParts.length > 0) {
    issues.push(`缺少部分: ${missingParts.join(', ')}`);
  } else {
    console.log('✅ 包含所有必需部分');
  }

  // 2. 检查模板长度
  if (content.length < 200) {
    issues.push('模板内容过短');
  } else {
    console.log(`✅ 模板长度: ${content.length} 字符`);
  }

  // 3. 检查 AI 生成标记
  if (!content.includes('[AI生成:')) {
    issues.push('缺少 AI 生成标记');
  } else {
    console.log('✅ 包含 AI 生成标记');
  }

  return {
    valid: issues.length === 0,
    issues,
    score: Math.max(0, 100 - issues.length * 10),
  };
};

// 模拟报告内容生成
const generateMockNarrative = (template: string, projectName: string): string => {
  // 替换基本变量
  let narrative = template
    .replace(/\[AI生成:.*?\]/g, '这是模拟生成的示例内容。')
    .replace(/\$\{.*?\}/g, '示例数据')
    .replace(/\[.*?\]/g, '示例');

  return narrative;
};

// 检查模拟报告质量
const validateMockNarrative = (narrative: string, terminology: any, forbiddenWords: string[]) => {
  console.log('\n=== 模拟报告质量检查 ===\n');

  // 1. 术语使用检查
  const termsUsed = terminology.terminology.filter((t: any) =>
    narrative.includes(t.term)
  );
  const terminologyRate = (termsUsed.length / terminology.terminology.length) * 100;

  console.log(`术语使用率: ${terminologyRate.toFixed(1)}% (${termsUsed.length}/${terminology.terminology.length})`);

  // 2. 禁止词汇检查
  const foundForbiddenWords = forbiddenWords.filter(word => narrative.includes(word));
  const styleCompliance = ((forbiddenWords.length - foundForbiddenWords.length) / forbiddenWords.length) * 100;

  console.log(`语言风格符合度: ${styleCompliance.toFixed(1)}%`);

  // 3. 内容长度检查
  const contentLength = narrative.length;
  console.log(`内容长度: ${contentLength} 字符`);

  return {
    terminologyRate,
    styleCompliance,
    contentLength,
    passed: terminologyRate >= 50 && styleCompliance >= 90 && contentLength >= 200,
  };
};

// 主测试流程
const main = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           质量验证测试 - 报告系统评估                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const results: any = {
    terminology: null,
    languageGuide: null,
    templates: {},
    mockNarrative: null,
  };

  // 1. 验证术语表
  try {
    const terminology = loadTerminology();
    results.terminology = validateTerminology(terminology);
  } catch (error) {
    console.log(`❌ 术语表验证失败: ${error}`);
    results.terminology = { valid: false, issues: ['加载失败'], score: 0 };
  }

  // 2. 验证语言风格指南
  try {
    const guidePath = join(__dirname, '../language-style-guide.md');
    const guide = readFileSync(guidePath, 'utf-8');
    results.languageGuide = validateLanguageStyleGuide(guide);
  } catch (error) {
    console.log(`❌ 语言风格指南验证失败: ${error}`);
    results.languageGuide = { valid: false, issues: ['加载失败'], score: 0 };
  }

  // 3. 验证模板文件
  const templates = [
    'executive-summary.md',
    'project-overview.md',
    'financial-analysis.md',
    'policy-environment.md',
    'risk-assessment.md',
    'investment-recommendation.md',
  ];

  let templateScores = 0;
  templates.forEach(templateName => {
    try {
      const content = loadTemplate(templateName);
      const result = validateTemplate(templateName, content);
      results.templates[templateName] = result;
      if (result.valid) templateScores++;
    } catch (error) {
      console.log(`❌ 模板 ${templateName} 验证失败: ${error}`);
      results.templates[templateName] = { valid: false, issues: ['加载失败'], score: 0 };
    }
  });

  console.log(`\n✅ 有效模板: ${templateScores}/${templates.length}`);

  // 4. 生成并验证模拟报告
  try {
    const executiveSummaryTemplate = loadTemplate('executive-summary.md');
    const mockNarrative = generateMockNarrative(executiveSummaryTemplate, '测试项目');
    const terminology = loadTerminology();
    const forbiddenWords = loadForbiddenWords();

    results.mockNarrative = validateMockNarrative(mockNarrative, terminology, forbiddenWords);
  } catch (error) {
    console.log(`❌ 模拟报告生成失败: ${error}`);
  }

  // 5. 输出总结报告
  console.log('\n\n' + '='.repeat(60));
  console.log('总结报告');
  console.log('='.repeat(60) + '\n');

  const overallScore = (
    (results.terminology?.score || 0) * 0.3 +
    (results.languageGuide?.score || 0) * 0.2 +
    (templateScores / templates.length) * 100 * 0.3 +
    (results.mockNarrative?.passed ? 100 : 0) * 0.2
  );

  console.log(`综合质量评分: ${overallScore.toFixed(1)}/100\n`);

  // 各项评分
  console.log('各组件评分:');
  console.log(`  术语表: ${results.terminology?.score.toFixed(1)}/100`);
  console.log(`  语言风格指南: ${results.languageGuide?.score.toFixed(1)}/100`);
  console.log(`  模板系统: $((templateScores / templates.length) * 100).toFixed(1)/100`);
  console.log(`  模拟报告: ${results.mockNarrative?.passed ? '100/100' : '0/100'}`);

  // 问题列表
  const allIssues = [
    ...(results.terminology?.issues || []),
    ...(results.languageGuide?.issues || []),
  ];

  Object.values(results.templates).forEach((t: any) => {
    allIssues.push(...(t.issues || []));
  });

  if (allIssues.length > 0) {
    console.log('\n发现的问题:');
    allIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  } else {
    console.log('\n✅ 未发现任何问题');
  }

  // 最终结论
  console.log('\n' + '='.repeat(60));
  console.log('验收结论');
  console.log('='.repeat(60) + '\n');

  if (overallScore >= 90) {
    console.log('✅ 优秀 - 报告系统质量优秀，可以投入使用！');
    console.log('\n建议:');
    console.log('  - 系统已达到生产就绪状态');
    console.log('  - 可以开始生成真实报告');
    console.log('  - 建议添加人工审核环节');
  } else if (overallScore >= 80) {
    console.log('⚠️  良好 - 报告系统质量良好，可以投入使用');
    console.log('\n建议:');
    console.log('  - 修复发现的问题后可投入生产');
    console.log('  - 建议加强 AI prompt 约束');
  } else if (overallScore >= 70) {
    console.log('❌ 一般 - 报告系统需要优化');
    console.log('\n建议:');
    console.log('  - 必须修复所有关键问题');
    console.log('  - 补充缺失的术语和规则');
  } else {
    console.log('❌❌ 较差 - 报告系统需要重大改进');
    console.log('\n建议:');
    console.log('  - 需要全面检查和修复');
    console.log('  - 建议重新设计模板系统');
  }

  console.log('\n' + '='.repeat(60));
  console.log('测试完成');
  console.log('='.repeat(60) + '\n');
};

// 运行测试
main().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
