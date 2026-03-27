/**
 * PDF Export Button Component
 *
 * Provides UI for generating and downloading PDF reports.
 * Supports both sync and async generation with progress tracking.
 */

import React, { useState } from 'react';
import { useAsyncPDF, usePDF } from '@/hooks/usePDFGenerator';
import type {
  GeneratePDFOptions,
  PDFJob,
} from '@/services/pdf';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';
import type { CalculationResult } from '@/domain/models/CalculationResult';

export interface PDFExportButtonProps {
  projectInput: ProjectInput;
  calculationResult: CalculationResult;
  benchmarkComparison?: any;
  reportType?: 'investment-report' | 'sensitivity-report' | 'quick-summary';
  variant?: 'button' | 'dropdown';
  includeDisclaimer?: boolean;
  disabled?: boolean;
  onExportStart?: () => void;
  onExportComplete?: (result: PDFJob) => void;
  onExportError?: (error: Error) => void;
}

/**
 * PDF Export Button
 */
export const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  projectInput,
  calculationResult,
  benchmarkComparison,
  reportType = 'investment-report',
  variant = 'button',
  includeDisclaimer = true,
  disabled = false,
  onExportStart,
  onExportComplete,
  onExportError,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { generate, download, job, polling } = useAsyncPDF();

  const handleExport = async (
    type: 'investment-report' | 'sensitivity-report' | 'quick-summary'
  ) => {
    try {
      onExportStart?.();

      const options: GeneratePDFOptions = {
        projectInput,
        calculationResult,
        benchmarkComparison,
        reportType: type,
        includeDisclaimer,
      };

      const newJob = await generate(options);

      if (newJob.status === 'completed' && newJob.result) {
        download(
          `pdf-generator.generateFilename(
            projectInput.projectName || 'project',
            type
          )}`
        );
      }

      onExportComplete?.(newJob);
      setShowDropdown(false);
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('PDF generation failed');
      onExportError?.(err);
    }
  };

  const getReportTypeLabel = (
    type: 'investment-report' | 'sensitivity-report' | 'quick-summary'
  ) => {
    switch (type) {
      case 'investment-report':
        return '完整报告 / Full Report';
      case 'sensitivity-report':
        return '敏感性分析 / Sensitivity Analysis';
      case 'quick-summary':
        return '简要总结 / Quick Summary';
    }
  };

  const getProgressPercentage = () => {
    if (!job) return 0;
    if (job.status === 'completed') return 100;
    return job.progress;
  };

  const isExporting = polling || (job && job.status === 'processing');

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled || isExporting}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5 mr-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export PDF
          <svg
            className="w-5 h-5 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1">
              <button
                onClick={() => handleExport('investment-report')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {getReportTypeLabel('investment-report')}
              </button>
              <button
                onClick={() => handleExport('sensitivity-report')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {getReportTypeLabel('sensitivity-report')}
              </button>
              <button
                onClick={() => handleExport('quick-summary')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {getReportTypeLabel('quick-summary')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Single button variant with progress
  return (
    <div>
      <button
        onClick={() => handleExport(reportType)}
        disabled={disabled || isExporting}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
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
            Generating {getProgressPercentage()}%
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {getReportTypeLabel(reportType)}
          </>
        )}
      </button>

      {/* Download button when complete */}
      {job?.status === 'completed' && job.result && (
        <button
          onClick={() => {
            const filename = `pdf-generator.generateFilename(
              projectInput.projectName || 'project',
              reportType
            )`;
            download(filename);
          }}
          className="mt-2 inline-flex items-center px-3 py-1.5 border border-green-500 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Ready
        </button>
      )}

      {/* Error message */}
      {job?.status === 'failed' && (
        <div className="mt-2 text-xs text-red-600">
          PDF generation failed: {job.error}
        </div>
      )}
    </div>
  );
};

export default PDFExportButton;
