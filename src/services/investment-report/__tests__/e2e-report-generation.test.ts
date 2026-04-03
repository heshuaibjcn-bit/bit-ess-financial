/**
 * End-to-End Report Generation Test
 *
 * 验证完整的报告生成流程，不依赖真实 AI API
 * 使用模拟数据来验证所有组件的集成
 */

// 步骤 1: 首先加载环境变量
import { config } from 'dotenv';
config();

// 步骤 2: 在导入任何模块之前设置 import.meta.env
// @ts-ignore
globalThis.importMetaEnv = {
  VITE_GLM_API_KEY: process.env.VITE_GLM_API_KEY || 'test_key',
};

// 步骤 3: 现在可以导入服务了
// 注意：我们使用动态 import 来确保 import.meta.env 已经设置
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        端到端报告生成测试 - 完整流程验证                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // 动态导入所有依赖
  const { InvestmentReportService } = await import('../InvestmentReportService');
  const { ReportDataContext } = await import('../ReportDataContext');

  // 扩展 Project 类型以包含测试所需的所有字段
  type TestProject = any;

  // 创建测试项目数据
  const createTestProject = (): TestProject => {
    return {
      id: 'test-e2e-project',
      userId: 'test-user',
      projectName: '广州XX电子有限公司储能项目',
      description: '1MWh/500kW 工商业储能系统投资分析',
      province: 'guangdong',
      systemSize: {
        capacity: 1000, // kWh
        power: 500,     // kW
      },
      costs: {
        // 使用更现实的成本数据（单位：元/单位容量）
        batteryCostPerKwh: 1200,  // 电池成本：1200元/kWh
        pcsCostPerKw: 300,        // PCS成本：300元/kW
        bmsCostPerKwh: 100,       // BMS成本：100元/kWh
        emsCostPerKwh: 50,        // EMS成本：50元/kWh
        thermalMgmtCostPerKwh: 80, // 热管理成本：80元/kWh
        fireProtectionCostPerKwh: 50, // 消防成本：50元/kWh
        containerCostPerKwh: 100,   // 集装箱成本：100元/kWh
        installationCostPerKw: 150, // 安装成本：150元/kW
        otherCostPerKwh: 20,        // 其他成本：20元/kWh
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
    };
  };

  const project = createTestProject();
  const service = new InvestmentReportService();

  console.log('📋 测试项目信息:');
  console.log(`   项目名称: ${project.projectName}`);
  console.log(`   省份: ${project.province}`);
  console.log(`   系统容量: ${project.systemSize.capacity} kWh`);
  console.log(`   额定功率: ${project.systemSize.power} kW\n`);

  try {
    // 步骤 1: 生成报告（不启用 AI 代理，使用模拟数据）
    console.log('⏳ 步骤 1: 生成报告数据...');
    const result = await service.generateReport(project, {
      enableAgent: {
        dueDiligence: false,
        policyAnalysis: false,
        technicalProposal: false,
        riskAssessment: false,
        reportNarrative: false, // 不启用 AI，使用模板
      },
    });

    console.log('✅ 报告生成成功\n');

    // 步骤 2: 验证报告数据完整性
    console.log('⏳ 步骤 2: 验证报告数据完整性...');

    const context = result.dataContext;
    if (!context) {
      console.log('❌ 缺少报告上下文\n');
      return;
    }

    // 验证财务指标
    const financialMetrics = context.getFinancialMetrics();
    if (!financialMetrics) {
      console.log('❌ 缺少财务指标\n');
      return;
    }

    console.log('✅ 财务指标完整');
    console.log(`   IRR: ${financialMetrics.irr?.toFixed(2)}%`);
    console.log(`   NPV: ¥${financialMetrics.npv?.toFixed(0)}万`);
    console.log(`   回收期: ${financialMetrics.paybackPeriodStatic?.toFixed(1)}年\n`);

    // 步骤 3: 验证报告结构
    console.log('⏳ 步骤 3: 验证报告结构...');

    const expectedChapters = [
      'executive_summary',
      'project_overview',
      'financial_analysis',
      'policy_environment',
      'risk_assessment',
      'investment_recommendation',
    ];

    const missingChapters: string[] = [];
    for (const chapter of expectedChapters) {
      if (!result.narratives || !result.narratives[chapter]) {
        missingChapters.push(chapter);
      }
    }

    if (missingChapters.length > 0) {
      console.log(`❌ 缺少章节: ${missingChapters.join(', ')}\n`);
      return;
    }

    console.log('✅ 所有 6 个章节完整\n');

    // 步骤 4: 验证章节内容质量
    console.log('⏳ 步骤 4: 验证章节内容质量...');

    let totalLength = 0;
    let emptyChapters: string[] = [];

    for (const [chapter, content] of Object.entries(result.narratives || {})) {
      const length = content?.length || 0;
      totalLength += length;

      if (length < 50) {
        emptyChapters.push(chapter);
      }

      console.log(`   ${chapter}: ${length} 字符`);
    }

    console.log(`\n   总内容长度: ${totalLength} 字符`);

    if (emptyChapters.length > 0) {
      console.log(`⚠️  以下章节内容较少: ${emptyChapters.join(', ')}`);
    } else {
      console.log('✅ 所有章节内容充实\n');
    }

    // 步骤 5: 显示报告样本
    console.log('⏳ 步骤 5: 显示报告样本...');
    console.log('─'.repeat(60));

    const executiveSummary = result.narratives?.executive_summary || '';
    const sample = executiveSummary.substring(0, 500);
    console.log(sample + (executiveSummary.length > 500 ? '...\n' : '\n'));
    console.log('─'.repeat(60) + '\n');

    // 最终评分
    console.log('⏳ 计算质量评分...');

    let score = 0;
    const maxScore = 100;

    // 数据完整性 (30 分)
    if (financialMetrics.irr && financialMetrics.npv && financialMetrics.paybackPeriodStatic) {
      score += 30;
      console.log('✅ 数据完整性: 30/30');
    } else {
      console.log('❌ 数据完整性: 0/30');
    }

    // 章节完整性 (30 分)
    if (missingChapters.length === 0) {
      score += 30;
      console.log('✅ 章节完整性: 30/30');
    } else {
      console.log(`❌ 章节完整性: ${30 - missingChapters.length * 5}/30`);
    }

    // 内容质量 (40 分)
    if (emptyChapters.length === 0 && totalLength > 1000) {
      score += 40;
      console.log('✅ 内容质量: 40/40');
    } else if (emptyChapters.length === 0 && totalLength > 500) {
      score += 30;
      console.log('⚠️  内容质量: 30/40 (内容偏短)');
    } else {
      console.log(`❌ 内容质量: ${40 - emptyChapters.length * 10}/40`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`综合质量评分: ${score}/${maxScore}`);
    console.log('='.repeat(60) + '\n');

    // 最终结论
    if (score >= 90) {
      console.log('🎉 优秀 - 系统可以投入生产使用！');
      console.log('\n下一步建议:');
      console.log('  1. 启用 AI 代理 (reportNarrative: true) 生成真实 AI 内容');
      console.log('  2. 添加人工审核环节');
      console.log('  3. 在实际应用环境中测试');
    } else if (score >= 70) {
      console.log('⚠️  良好 - 系统基本可用，建议优化');
      console.log('\n优化建议:');
      if (missingChapters.length > 0) {
        console.log(`  - 补充缺失的章节: ${missingChapters.join(', ')}`);
      }
      if (emptyChapters.length > 0) {
        console.log(`  - 丰富内容较少的章节: ${emptyChapters.join(', ')}`);
      }
    } else {
      console.log('❌ 需要改进 - 系统尚未达到生产标准');
      console.log('\n必须修复的问题:');
      console.log('  - 检查数据生成流程');
      console.log('  - 检查章节模板');
      console.log('  - 检查服务集成');
    }

    console.log('\n' + '='.repeat(60));
    console.log('测试完成');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.log('❌ 测试执行失败\n');
    console.error('错误详情:', error);
  }
}

// 运行测试
main().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
