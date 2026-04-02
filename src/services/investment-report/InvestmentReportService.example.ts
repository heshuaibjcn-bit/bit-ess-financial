/**
 * 投资报告生成服务使用示例
 *
 * 演示如何使用 InvestmentReportService 生成完整的投资评估报告
 */

import { InvestmentReportService } from './src/services/investment-report/InvestmentReportService';
import { Project } from './src/domain/entities/Project';
import type { ReportGenerationOptions } from './src/services/investment-report/InvestmentReportService';

/**
 * 示例1: 基本使用 - 生成完整报告
 */
async function example1_BasicUsage() {
  // 1. 创建服务实例
  const service = new InvestmentReportService();

  // 2. 准备项目数据（从现有Project实体）
  const project = Project.fromInput({
    // ... 项目输入数据
  });

  // 3. 生成报告
  const result = await service.generateReport(project, {
    // 可选：进度回调
    onProgress: (step, progress) => {
      console.log(`[${progress}%] ${step}`);
    },
  });

  // 4. 使用结果
  console.log('报告ID:', result.reportId);
  console.log('生成时间:', result.metadata.generationTime, 'ms');
  console.log('执行的智能体:', result.metadata.agentsExecuted);
  console.log('报告叙述:', Object.keys(result.narratives));

  // 5. 访问报告数据
  const financialMetrics = result.dataContext.getFinancialMetrics();
  console.log('IRR:', financialMetrics?.irr);
  console.log('NPV:', financialMetrics?.npv);
}

/**
 * 示例2: 流式生成 - 实时进度反馈
 */
async function example2_StreamGeneration() {
  const service = new InvestmentReportService();
  const project = Project.fromInput({ /* ... */ });

  // 使用流式生成器
  for await (const update of service.generateReportStream(project)) {
    if (update.step === 'complete') {
      console.log('报告生成完成！');
      // update 是最终的 InvestmentReportResult
      console.log('报告ID:', update.reportId);
    } else if (update.step === 'error') {
      console.error('生成失败:', update.message);
    } else {
      console.log(`[${update.progress}%] ${update.message}`);
    }
  }
}

/**
 * 示例3: 选择性启用智能体
 */
async function example3_SelectiveAgents() {
  const service = new InvestmentReportService();
  const project = Project.fromInput({ /* ... */ });

  // 只启用部分智能体
  const result = await service.generateReport(project, {
    enableAgent: {
      dueDiligence: true,      // 启用业主尽调
      policyAnalysis: false,   // 禁用政策分析
      technicalProposal: true,  // 启用技术方案
      riskAssessment: true,     // 启用风险评估
      reportNarrative: true,    // 启用报告叙述
    },
    onProgress: (step, progress) => {
      console.log(`[${progress}%] ${step}`);
    },
  });

  console.log('执行的智能体:', result.metadata.agentsExecuted);
  // 输出: ["DueDiligenceAgent", "TechnicalProposalAgent", "RiskAssessmentAgent", "ReportNarrativeAgent"]
}

/**
 * 示例4: 错误处理和回退
 */
async function example4_ErrorHandling() {
  const service = new InvestmentReportService();
  const project = Project.fromInput({ /* ... */ });

  try {
    const result = await service.generateReport(project, {
      fallbackToMock: true, // AI服务失败时回退到mock数据
    });

    // 检查是否有错误
    if (result.metadata.errors.length > 0) {
      console.warn('报告生成过程中遇到错误:');
      result.metadata.errors.forEach(error => {
        console.warn(`- ${error.component}: ${error.error}`);
        console.warn(`  回退方案: ${error.fallback}`);
      });
    }

    // 即使有错误，报告仍然会生成（使用回退数据）
    console.log('报告已生成（可能包含部分回退数据）');
  } catch (error) {
    console.error('报告生成完全失败:', error);
  }
}

/**
 * 示例5: 访问报告数据
 */
async function example5_AccessReportData() {
  const service = new InvestmentReportService();
  const project = Project.fromInput({ /* ... */ });

  const result = await service.generateReport(project);
  const context = result.dataContext;

  // 访问各类分析结果
  console.log('=== 业主尽调 ===');
  const dueDiligence = context.getDueDiligenceReport();
  console.log('公司名称:', dueDiligence?.companyInfo.name);
  console.log('信用等级:', dueDiligence?.creditRating.level);

  console.log('\n=== 政策分析 ===');
  const policyAnalysis = context.getPolicyAnalysisReport();
  console.log('峰谷价差:', policyAnalysis?.currentPolicy.priceSpread);
  console.log('政策稳定性:', policyAnalysis?.stability.rating);

  console.log('\n=== 技术方案 ===');
  const technicalProposal = context.getTechnicalProposal();
  console.log('推荐容量:', technicalProposal?.recommended.capacity, 'MWh');
  console.log('推荐功率:', technicalProposal?.recommended.power, 'MW');

  console.log('\n=== 财务分析 ===');
  const financialMetrics = context.getFinancialMetrics();
  console.log('IRR:', financialMetrics?.irr, '%');
  console.log('NPV:', financialMetrics?.npv);
  console.log('回收期:', financialMetrics?.paybackPeriodStatic, '年');

  console.log('\n=== 风险评估 ===');
  const riskAssessment = context.getRiskAssessmentReport();
  console.log('风险等级:', riskAssessment?.overallRating.level);
  console.log('风险评分:', riskAssessment?.overallRating.score);

  console.log('\n=== 报告叙述 ===');
  console.log('项目概况章节长度:', result.narratives.project_overview?.length);
  console.log('投资建议章节长度:', result.narratives.investment_recommendation?.length);
}

/**
 * 示例6: 导出报告数据
 */
async function example6_ExportReportData() {
  const service = new InvestmentReportService();
  const project = Project.fromInput({ /* ... */ });

  const result = await service.generateReport(project);

  // 导出为JSON
  const jsonData = result.dataContext.toJSON();
  console.log('完整报告数据（JSON）:', JSON.stringify(jsonData, null, 2));

  // 如果有PDF，可以保存
  if (result.pdfBuffer) {
    const fs = await import('fs');
    fs.writeFileSync(`/tmp/${result.reportId}.pdf`, result.pdfBuffer);
    console.log('PDF已保存到:', `/tmp/${result.reportId}.pdf`);
  }
}

/**
 * 示例7: 与现有UI集成
 */
async function example7_UIIntegration() {
  // 在React组件中使用
  /*
  import { useState } from 'react';
  import { InvestmentReportService } from '@/services/investment-report/InvestmentReportService';

  function InvestmentReportButton({ project }) {
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState({ step: '', progress: 0 });
    const [report, setReport] = useState(null);

    const handleGenerate = async () => {
      setGenerating(true);
      setProgress({ step: '', progress: 0 });

      try {
        const service = new InvestmentReportService();
        const result = await service.generateReport(project, {
          onProgress: (step, progressValue) => {
            setProgress({ step, progress: progressValue });
          },
        });

        setReport(result);
      } catch (error) {
        console.error('报告生成失败:', error);
      } finally {
        setGenerating(false);
      }
    };

    return (
      <div>
        <button onClick={handleGenerate} disabled={generating}>
          {generating ? `生成中... ${progress.progress}%` : '生成投资报告'}
        </button>

        {progress.step && (
          <div className="progress">
            <div className="step">{progress.step}</div>
            <div className="bar">
              <div className="fill" style={{ width: `${progress.progress}%` }} />
            </div>
          </div>
        )}

        {report && (
          <div className="report-result">
            <h3>报告生成完成</h3>
            <p>报告ID: {report.reportId}</p>
            <p>生成时间: {report.metadata.generationTime}ms</p>

            <div className="chapters">
              <h4>报告章节</h4>
              {Object.entries(report.narratives).map(([chapter, content]) => (
                <div key={chapter}>
                  <h5>{chapter}</h5>
                  <p>{content.substring(0, 200)}...</p>
                </div>
              ))}
            </div>

            {report.pdfPath && (
              <button onClick={() => window.open(report.pdfPath)}>
                下载PDF报告
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
  */
}

// 导出示例函数
export {
  example1_BasicUsage,
  example2_StreamGeneration,
  example3_SelectiveAgents,
  example4_ErrorHandling,
  example5_AccessReportData,
  example6_ExportReportData,
  example7_UIIntegration,
};
