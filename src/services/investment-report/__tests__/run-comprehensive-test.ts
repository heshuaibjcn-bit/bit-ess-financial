/**
 * 简化版综合测试 - 直接调用 InvestmentReportService
 *
 * 避免导入 visual-style 等有编译问题的模块
 */

import { InvestmentReportService } from '../InvestmentReportService';
import { ReportDataContext } from '../ReportDataContext';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// 类型导入
import type { Project } from '@/domain/models/Project';
import type { OwnerInfo, FacilityInfo, TariffDetail } from '@/domain/schemas/ProjectSchema';

// 扩展 Project 类型
type TestProject = Project & {
  ownerInfo?: OwnerInfo;
  facilityInfo?: FacilityInfo;
  tariffDetail?: TariffDetail;
};

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// 加载术语表
const loadTerminology = () => {
  const terminologyPath = join(__dirname, '../terminology.json');
  const terminology = JSON.parse(readFileSync(terminologyPath, 'utf-8'));
  return terminology.terminology;
};

// 加载禁止词汇
const loadForbiddenWords = (): string[] => {
  return ['非常好', '特别', '挺好', '差不多', '可能', '应该', '大概', '很多', '做一些', '搞'];
};

// 创建测试项目数据
const createTestProjects = (): TestProject[] => {
  return [
    {
      // 项目 1: 广东省制造业项目
      id: 'test-guangdong-manufacturing',
      userId: 'test-user',
      projectName: '广州XX电子有限公司储能项目',
      description: '1MWh/500MW 工商业储能系统',
      province: 'guangdong',
      systemSize: {
        capacity: 1000,
        power: 500,
      },
      costs: {
        batteryCostPerKwh: 1.2,
        pcsCostPerKw: 0.3,
        bmsCostPerKwh: 0.1,
        emsCostPerKwh: 0.05,
        thermalMgmtCostPerKwh: 0.08,
        fireProtectionCostPerKwh: 0.05,
        containerCostPerKwh: 0.1,
        installationCostPerKw: 0.15,
        otherCostPerKwh: 0.02,
      },
      operatingParams: {
        systemEfficiency: 0.88,
        depthOfDischarge: 0.9,
        cyclesPerDay: 1.5,
        degradationRate: 0.02,
        availabilityPercent: 95,
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      version: 1,
      ownerInfo: {
        companyName: '广州XX电子有限公司',
        industry: '制造业',
        address: '广东省广州市番禺区科技园',
      },
      facilityInfo: {
        address: '广东省广州市番禺区科技园路123号',
        transformerCapacity: 630,
        voltageLevel: '10kV',
        avgMonthlyLoad: 300000,
        peakLoad: 500,
        availableArea: 500,
      },
      tariffDetail: {
        policyType: 'two-part',
        peakPrice: 1.15,
        valleyPrice: 0.35,
        flatPrice: 0.65,
      },
    },
    ];
};

// 检查术语使用准确率
const checkTerminologyAccuracy = (content: string, terminology: any[]): {
  total: number;
  correct: number;
  accuracy: number;
} => {
  const found = terminology.filter(term => content.includes(term.term));
  const total = terminology.length;
  const correct = found.length;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  return { total, correct, accuracy };
};

// 检查语言风格符合度
const checkLanguageStyleCompliance = (content: string, forbiddenWords: string[]): {
  violations: number;
  compliance: number;
  foundWords: string[];
} => {
  const foundWords = forbiddenWords.filter(word => content.includes(word));
  const violations = foundWords.length;
  const compliance = forbiddenWords.length > 0
    ? ((forbiddenWords.length - violations) / forbiddenWords.length) * 100
    : 100;
  return { violations, compliance, foundWords };
};

// 主测试流程
const main = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        综合质量测试 - AI 报告质量评估                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const projects = createTestProjects();
  const terminology = loadTerminology();
  const forbiddenWords = loadForbiddenWords();
  const service = new InvestmentReportService();

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试项目 #${i + 1}: ${project.projectName}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // 生成报告
      console.log('1. 正在生成报告...');
      const result = await service.generateReport(project as Project, {
        enableAgent: {
          dueDiligence: false,
          policyAnalysis: false,
          technicalProposal: false,
          riskAssessment: false,
          reportNarrative: true,
        },
      });

      if (!result.success || !result.narratives) {
        console.log('❌ 报告生成失败\n');
        continue;
      }

      console.log('✅ 报告生成成功\n');

      // 合并所有章节内容
      const allContent = Object.values(result.narratives).join('\n\n');

      // 检查术语使用准确率
      console.log('2. 检查术语使用准确率...');
      const termCheck = checkTerminologyAccuracy(allContent, terminology);
      console.log(`   - 准确率: ${termCheck.accuracy.toFixed(1)}% (${termCheck.correct}/${termCheck.total})`);

      // 检查语言风格符合度
      console.log('\n3. 检查语言风格符合度...');
      const styleCheck = checkLanguageStyleCompliance(allContent, forbiddenWords);
      console.log(`   - 违规次数: ${styleCheck.violations}`);
      console.log(`   - 符合度: ${styleCheck.compliance.toFixed(1)}%`);

      if (styleCheck.violations > 0) {
        console.log('   ⚠️  发现禁止词汇:', styleCheck.foundWords.join(', '));
      }

      // 检查内容完整性
      console.log('\n4. 检查内容完整性...');
      const chapters = Object.keys(result.narratives);
      const complete = chapters.filter(ch => {
        const content = result.narratives[ch];
        return content && content.length > 100;
      }).length;

      console.log(`   - 完整章节: ${complete}/${chapters.length}`);

      // 各章节长度
      console.log('\n各章节内容长度:');
      chapters.forEach(ch => {
        const len = result.narratives[ch]?.length || 0;
        console.log(`   - ${ch}: ${len} 字符`);
      });

      // 质量评分
      console.log('\n5. 质量评估:');
      const qualityScore = (
        (termCheck.accuracy * 0.4 +
          styleCheck.compliance * 0.3 +
          (complete / chapters.length) * 100 * 0.3)
      );

      console.log(`   综合质量评分: ${qualityScore.toFixed(1)}/100`);

      let verdict = '';
      if (qualityScore >= 90) {
        verdict = '✅ 优秀 - 通过验收';
      } else if (qualityScore >= 80) {
        verdict = '⚠️  良好 - 需要微调';
      } else if (qualityScore >= 70) {
        verdict = '❌ 一般 - 需要优化';
      } else {
        verdict = '❌❌ 较差 - 需要重大改进';
      }

      console.log(`   评估结果: ${verdict}`);

      // 显示执行摘要样本
      console.log('\n6. 报告样本 (执行摘要前300字符):');
      console.log('---');
      console.log(result.narratives.executive_summary?.substring(0, 300) + '...\n');
      console.log('---\n');

    } catch (error) {
      console.log(`❌ 处理项目时出错: ${error}\n`);
    }
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
