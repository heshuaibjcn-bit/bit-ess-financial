/**
 * Investment Report Button Component
 *
 * Generates AI-powered investment analysis reports using InvestmentReportService.
 * Shows progress during AI agent execution and allows downloading the report.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { InvestmentReportService } from '@/services/investment-report/InvestmentReportService';
import type { Project } from '@/domain/models/Project';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';

export interface InvestmentReportButtonProps {
  disabled?: boolean;
  onReportStart?: () => void;
  onReportComplete?: (result: any) => void;
  onReportError?: (error: Error) => void;
  variant?: 'button' | 'full-width';
}

interface ReportProgress {
  step: string;
  progress: number;
  message: string;
}

/**
 * Investment Report Button
 */
export const InvestmentReportButton: React.FC<InvestmentReportButtonProps> = ({
  disabled = false,
  onReportStart,
  onReportComplete,
  onReportError,
  variant = 'button',
}) => {
  const { t } = useTranslation();
  const { getValues } = useFormContext();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<ReportProgress | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setProgress({ step: 'initializing', progress: 0, message: '初始化中...' });
      onReportStart?.();

      // Get form values
      const formValues = getValues() as ProjectInput;

      // Convert to Project (basic transformation)
      const project: Project = {
        id: `temp-${Date.now()}`,
        userId: 'current-user',
        projectName: formValues.projectName || '储能项目',
        description: '工商业储能投资分析项目',
        province: formValues.province || 'guangdong',
        systemSize: formValues.systemSize,
        costs: {
          batteryCostPerKwh: formValues.costs?.battery || 1.2,
          pcsCostPerKw: formValues.costs?.pcs || 0.3,
          bmsCostPerKwh: formValues.costs?.bms || 0.1,
          emsCostPerKwh: formValues.costs?.ems || 0.05,
          thermalMgmtCostPerKwh: formValues.costs?.thermalManagement || 0.08,
          fireProtectionCostPerKwh: formValues.costs?.fireProtection || 0.05,
          containerCostPerKwh: formValues.costs?.container || 0.1,
          installationCostPerKw: formValues.costs?.installation || 0.15,
          otherCostPerKwh: formValues.costs?.other || 0.02,
          designFee: formValues.costs?.designFee || 50000,
          permitFee: formValues.costs?.permitFee || 30000,
          gridConnectionFee: formValues.costs?.gridConnectionFee || 100000,
          constructionFee: formValues.costs?.constructionFee || 100000,
          regulatoryFee: formValues.costs?.regulatoryFee || 20000,
          trainingCost: formValues.costs?.trainingCost || 30000,
          utilitiesCost: formValues.costs?.utilitiesCost || 20000,
          landLeaseCost: formValues.costs?.landLeaseCost || 100000,
          salesExpenses: formValues.costs?.salesExpenses || 303818,
          vatRate: formValues.costs?.vatRate || 0.06,
          surtaxRate: formValues.costs?.surtaxRate || 0.12,
          corporateTaxRate: formValues.costs?.corporateTaxRate || 0.25,
        },
        financing: formValues.financing || {
          hasLoan: false,
          equityRatio: 1.0,
          loanInterestRate: 0.045,
          loanTerm: 10,
          taxHolidayYears: 6,
        },
        operatingParams: {
          systemEfficiency: 0.88,
          depthOfDischarge: 0.9,
          cyclesPerDay: 1.5,
          degradationRate: 0.02,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        // Business fields
        ownerInfo: formValues.ownerInfo,
        facilityInfo: formValues.facilityInfo,
        tariffDetail: formValues.tariffDetail,
      };

      // Initialize service
      const service = new InvestmentReportService();

      // Generate report with progress tracking
      const reportResult = await service.generateReport(project, {
        onProgress: (step, progressValue) => {
          const stepMessages: Record<string, string> = {
            'collecting_data': '收集中...',
            'running_agents': 'AI分析中...',
            'running_calculations': '计算中...',
            'generating_narratives': '生成报告中...',
            'generating_pdf': '导出中...',
            'complete': '完成',
          };
          setProgress({
            step,
            progress: progressValue,
            message: stepMessages[step] || step,
          });
        },
        enableAgent: {
          dueDiligence: true,
          policyAnalysis: true,
          technicalProposal: true,
          riskAssessment: true,
          reportNarrative: true,
        },
      });

      setResult(reportResult);
      setProgress({ step: 'complete', progress: 100, message: '完成' });

      onReportComplete?.(reportResult);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Report generation failed');
      console.error('Investment report generation failed:', err);
      setProgress({ step: 'error', progress: 0, message: '生成失败' });
      onReportError?.(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!result || !result.dataContext) return;

    // Generate markdown content
    const { PDFGenerator } = require('@/services/investment-report/PDFGenerator');
    const pdfGenerator = new PDFGenerator();

    // This will be async, but for simplicity we'll do it synchronously
    pdfGenerator
      .generatePDF(result.dataContext, result.narratives, {
        format: 'markdown',
      })
      .then((pdfResult: any) => {
        if (pdfResult.success && pdfResult.outputPath) {
          // Read the file and trigger download
          fetch(pdfResult.outputPath)
            .then((res) => res.text())
            .then((content) => {
              const blob = new Blob([content], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `investment-report-${Date.now()}.md`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            });
        }
      });
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    if (progress.step === 'complete') return 100;
    if (progress.step === 'error') return 0;
    return progress.progress;
  };

  const buttonClassName = variant === 'full-width'
    ? 'w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400'
    : 'inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className={variant === 'full-width' ? '' : 'inline-block'}>
      <button
        onClick={handleGenerateReport}
        disabled={disabled || generating}
        className={buttonClassName}
      >
        {generating ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {progress?.message || '生成中...'} {getProgressPercentage()}%
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI投资报告
          </>
        )}
      </button>

      {/* Download button when complete */}
      {result && result.reportId && !generating && (
        <div className="mt-2 space-y-2">
          <button
            onClick={handleDownloadMarkdown}
            className="w-full inline-flex items-center justify-center px-3 py-2 border border-green-500 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载报告 (Markdown)
          </button>
          <div className="text-xs text-gray-600">
            <p>报告ID: {result.reportId}</p>
            <p>生成时间: {result.generatedAt instanceof Date ? result.generatedAt.toLocaleString('zh-CN') : 'N/A'}</p>
            {result.metadata && (
              <p>执行时长: {result.metadata.generationTime?.toFixed(2)}秒</p>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {progress?.step === 'error' && !generating && (
        <div className="mt-2 text-xs text-red-600">
          AI报告生成失败，请稍后重试
        </div>
      )}
    </div>
  );
};

export default InvestmentReportButton;
