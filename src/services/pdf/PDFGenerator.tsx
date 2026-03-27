/**
 * PDF Generator Service
 *
 * Generates PDF documents using @react-pdf/renderer.
 * Supports async generation with progress tracking.
 */

import { pdf } from '@react-pdf/renderer';
import type { PDFJob } from './JobQueue';
import { jobQueue } from './JobQueue';
import {
  InvestmentReportPDF,
  SensitivityReportPDF,
  QuickSummaryPDF,
} from '@/components/PDF/InvestmentReportPDF';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';
import type { CalculationResult } from '@/domain/models/CalculationResult';

export interface GeneratePDFOptions {
  projectInput: ProjectInput;
  calculationResult: CalculationResult;
  benchmarkComparison?: any;
  reportType?: 'investment-report' | 'sensitivity-report' | 'quick-summary';
  includeDisclaimer?: boolean;
}

export interface PDFGenerationResult {
  pdfUrl: string;
  size: number;
  blob: Blob;
}

/**
 * PDF Generator Service
 *
 * Handles PDF generation with progress tracking and error handling.
 */
class PDFGeneratorService {
  private isGenerating = new Set<string>();

  /**
   * Generate PDF synchronously (returns immediately with blob)
   */
  async generate(options: GeneratePDFOptions): Promise<PDFGenerationResult> {
    const reportType = options.reportType || 'investment-report';

    // Create the appropriate document based on type
    const document = this.createDocument(reportType, options);

    // Generate PDF
    const blob = await pdf(document).toBlob();
    const url = URL.createObjectURL(blob);

    return {
      pdfUrl: url,
      size: blob.size,
      blob,
    };
  }

  /**
   * Generate PDF asynchronously (with job queue)
   */
  async generateAsync(options: GeneratePDFOptions): Promise<PDFJob> {
    const reportType = options.reportType || 'investment-report';

    // Create job
    const job = jobQueue.createJob({
      type: reportType,
      input: options,
    });

    // Start generation in background
    this.processJob(job.id, options);

    return job;
  }

  /**
   * Process a PDF generation job
   */
  private async processJob(jobId: string, options: GeneratePDFOptions) {
    if (this.isGenerating.has(jobId)) {
      return;
    }

    this.isGenerating.add(jobId);

    try {
      // Mark job as processing
      jobQueue.markJobProcessing(jobId);
      jobQueue.updateProgress(jobId, 10);

      // Create document
      const document = this.createDocument(
        options.reportType || 'investment-report',
        options
      );
      jobQueue.updateProgress(jobId, 30);

      // Generate PDF
      const blob = await pdf(document).toBlob();
      jobQueue.updateProgress(jobId, 80);

      // Create object URL
      const url = URL.createObjectURL(blob);
      jobQueue.updateProgress(jobId, 100);

      // Complete job
      jobQueue.completeJob(jobId, {
        pdfUrl: url,
        size: blob.size,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      jobQueue.failJob(jobId, errorMessage);
      console.error(`PDF generation failed for job ${jobId}:`, error);
    } finally {
      this.isGenerating.delete(jobId);
    }
  }

  /**
   * Create document based on report type
   */
  private createDocument(
    reportType: string,
    options: GeneratePDFOptions
  ): React.ReactElement {
    switch (reportType) {
      case 'investment-report':
        return (
          <InvestmentReportPDF
            projectInput={options.projectInput}
            calculationResult={options.calculationResult}
            benchmarkComparison={options.benchmarkComparison}
            includeDisclaimer={options.includeDisclaimer}
          />
        );

      case 'sensitivity-report':
        return (
          <SensitivityReportPDF
            projectName={options.projectInput.projectName || 'Project'}
            baseProject={options.projectInput}
            scenarios={options.input.scenarios || []}
          />
        );

      case 'quick-summary':
        return (
          <QuickSummaryPDF
            projectName={options.projectInput.projectName || 'Project'}
            irr={options.calculationResult.financialMetrics.irr}
            npv={options.calculationResult.financialMetrics.npv}
            paybackPeriod={options.calculationResult.financialMetrics.paybackPeriod}
            totalInvestment={options.calculationResult.costBreakdown.initialInvestment}
            annualRevenue={
              options.calculationResult.annualCashFlows[0]?.revenue || 0
            }
          />
        );

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  /**
   * Download PDF from blob URL
   */
  downloadPDF(pdfUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate filename for PDF
   */
  generateFilename(
    projectName: string,
    reportType: string
  ): string {
    const sanitizedName = projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitizedName}-${reportType}-${timestamp}.pdf`;
  }

  /**
   * Revoke PDF URL to free memory
   */
  revokePDFURL(pdfUrl: string): void {
    URL.revokeObjectURL(pdfUrl);
  }
}

// Singleton instance
export const pdfGenerator = new PDFGeneratorService();
