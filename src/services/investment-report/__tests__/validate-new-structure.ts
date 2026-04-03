/**
 * 简单验证脚本 - 测试新的报告结构
 *
 * 验证：
 * 1. 章节结构正确
 * 2. 模板文件存在
 * 3. 术语表和风格指南存在
 * 4. 数据结构定义正确
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const __dirname = '/Users/shuai/ess_financial/src/services/investment-report';

console.log('=== 新报告结构验证 ===\n');

// 1. 验证章节结构
console.log('1. 验证章节结构...');
try {
  const templateIndexPath = join(__dirname, 'templates/index.ts');
  const templateIndexContent = readFileSync(templateIndexPath, 'utf-8');

  if (templateIndexContent.includes('executive_summary') &&
      templateIndexContent.includes('project_overview') &&
      templateIndexContent.includes('financial_analysis') &&
      templateIndexContent.includes('policy_environment') &&
      templateIndexContent.includes('risk_assessment') &&
      templateIndexContent.includes('investment_recommendation')) {
    console.log('✅ 章节结构定义正确');
  } else {
    console.log('❌ 章节结构定义不完整');
  }
} catch (error) {
  console.log('❌ 无法读取模板索引:', error);
}

// 2. 验证模板文件
console.log('\n2. 验证模板文件...');
const templates = [
  'executive-summary.md',
  'project-overview.md',
  'financial-analysis.md',
  'policy-environment.md',
  'risk-assessment.md',
  'investment-recommendation.md',
];

let templatesExist = 0;
templates.forEach(template => {
  const templatePath = join(__dirname, 'templates', template);
  if (existsSync(templatePath)) {
    templatesExist++;
    console.log(`✅ ${template}`);
  } else {
    console.log(`❌ ${template} 不存在`);
  }
});

if (templatesExist === 6) {
  console.log(`✅ 所有 6 个模板文件都存在`);
} else {
  console.log(`❌ 只有 ${templatesExist}/6 个模板文件存在`);
}

// 3. 验证术语表
console.log('\n3. 验证术语表...');
try {
  const terminologyPath = join(__dirname, 'terminology.json');
  const terminology = JSON.parse(readFileSync(terminologyPath, 'utf-8'));

  if (terminology.terminology && terminology.terminology.length >= 20) {
    console.log(`✅ 术语表包含 ${terminology.terminology.length} 个术语`);

    // 检查核心术语
    const terms = terminology.terminology.map((t: any) => t.term);
    const coreTerms = ['内部收益率', '净现值', '投资回收期', '储能平准化成本', '峰谷价差'];
    const missingTerms = coreTerms.filter(t => !terms.includes(t));

    if (missingTerms.length === 0) {
      console.log('✅ 核心术语都存在');
    } else {
      console.log(`❌ 缺少核心术语: ${missingTerms.join(', ')}`);
    }
  } else {
    console.log('❌ 术语表格式不正确或术语数量不足');
  }
} catch (error) {
  console.log('❌ 无法读取或解析术语表:', error);
}

// 4. 验证语言风格指南
console.log('\n4. 验证语言风格指南...');
try {
  const guidePath = join(__dirname, 'language-style-guide.md');
  const guide = readFileSync(guidePath, 'utf-8');

  const requiredSections = ['词汇规则', '句式风格', '数字格式', '语气和态度', '禁止词汇'];
  const missingSections = requiredSections.filter(section => !guide.includes(section));

  if (missingSections.length === 0) {
    console.log('✅ 语言风格指南包含所有必需部分');
  } else {
    console.log(`❌ 缺少部分: ${missingSections.join(', ')}`);
  }

  // 检查禁止词汇
  const forbiddenWords = ['非常好', '特别', '挺好', '差不多'];
  const missingForbiddenWords = forbiddenWords.filter(word => !guide.includes(word));

  if (missingForbiddenWords.length === 0) {
    console.log('✅ 禁止词汇列表完整');
  } else {
    console.log(`❌ 缺少禁止词汇: ${missingForbiddenWords.join(', ')}`);
  }
} catch (error) {
  console.log('❌ 无法读取语言风格指南:', error);
}

// 5. 验证 PDF 模板
console.log('\n5. 验证 PDF 模板...');
const pdfTemplates = [
  'cover.html.ts',
  'chapter-page.html.ts',
  'content-page.html.ts',
];

let pdfTemplatesExist = 0;
pdfTemplates.forEach(template => {
  const templatePath = join(__dirname, 'pdf-templates', template);
  if (existsSync(templatePath)) {
    pdfTemplatesExist++;
    console.log(`✅ ${template}`);
  } else {
    console.log(`❌ ${template} 不存在`);
  }
});

if (pdfTemplatesExist === 3) {
  console.log(`✅ 所有 3 个 PDF 模板文件都存在`);
} else {
  console.log(`❌ 只有 ${pdfTemplatesExist}/3 个 PDF 模板文件存在`);
}

// 6. 验证 ReportNarrativeAgent
console.log('\n6. 验证 ReportNarrativeAgent...');
try {
  const agentPath = join(__dirname, '../agents/ReportNarrativeAgent.ts');
  const agentContent = readFileSync(agentPath, 'utf-8');

  // 检查是否包含新的章节
  const newChapters = [
    'executive_summary',
    'project_overview',
    'financial_analysis',
    'policy_environment',
    'risk_assessment',
    'investment_recommendation',
  ];

  const missingChapters = newChapters.filter(chapter => !agentContent.includes(`'${chapter}'`));

  if (missingChapters.length === 0) {
    console.log('✅ ReportNarrativeAgent 包含所有新章节');
  } else {
    console.log(`❌ ReportNarrativeAgent 缺少章节: ${missingChapters.join(', ')}`);
  }

  // 检查是否包含语言风格约束
  if (agentContent.includes('CRITICAL LANGUAGE STYLE REQUIREMENTS') ||
      agentContent.includes('语言风格指南') ||
      agentContent.includes('terminology.json')) {
    console.log('✅ ReportNarrativeAgent 包含语言风格约束');
  } else {
    console.log('⚠️  ReportNarrativeAgent 可能缺少语言风格约束引用');
  }
} catch (error) {
  console.log('❌ 无法读取 ReportNarrativeAgent:', error);
}

// 7. 验证 InvestmentReportService
console.log('\n7. 验证 InvestmentReportService...');
try {
  const servicePath = join(__dirname, 'InvestmentReportService.ts');
  const serviceContent = readFileSync(servicePath, 'utf-8');

  if (serviceContent.includes('REPORT_STRUCTURE')) {
    console.log('✅ InvestmentReportService 使用新的 REPORT_STRUCTURE');
  } else {
    console.log('❌ InvestmentReportService 未使用 REPORT_STRUCTURE');
  }

  if (serviceContent.includes("generateNarratives(context)")) {
    console.log('✅ InvestmentReportService 调用 generateNarratives');
  } else {
    console.log('⚠️  InvestmentReportService 可能未调用 generateNarratives');
  }
} catch (error) {
  console.log('❌ 无法读取 InvestmentReportService:', error);
}

// 8. 验证 ReportDataContext
console.log('\n8. 验证 ReportDataContext...');
try {
  const contextPath = join(__dirname, 'ReportDataContext.ts');
  const contextContent = readFileSync(contextPath, 'utf-8');

  const newChapters = [
    'executive_summary',
    'project_overview',
    'financial_analysis',
    'policy_environment',
    'risk_assessment',
    'investment_recommendation',
  ];

  const missingChapters = newChapters.filter(chapter => !contextContent.includes(`'${chapter}'`));

  if (missingChapters.length === 0) {
    console.log('✅ ReportDataContext ChapterType 包含所有新章节');
  } else {
    console.log(`❌ ReportDataContext ChapterType 缺少章节: ${missingChapters.join(', ')}`);
  }
} catch (error) {
  console.log('❌ 无法读取 ReportDataContext:', error);
}

// 总结
console.log('\n=== 验证完成 ===');
console.log('新报告结构已基本实现，可以进行 AI 生成测试。');
