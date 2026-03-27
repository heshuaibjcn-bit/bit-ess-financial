/**
 * Tests for PDF Generation Services
 *
 * Tests JobQueue and PDFGenerator services
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jobQueue } from '@/services/pdf/JobQueue';
import { pdfGenerator } from '@/services/pdf/PDFGenerator';
import type { PDFJob } from '@/services/pdf/JobQueue';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';
import type { CalculationResult } from '@/domain/models/CalculationResult';

// Mock react-pdf renderer
vi.mock('@react-pdf/renderer', () => ({
  pdf: () => ({
    toBlob: async () =>
      new Blob(['mock-pdf-content'], { type: 'application/pdf' }),
    toDataUrl: async () => 'data:application/pdf;base64,mock',
    toArrayBuffer: async () => new ArrayBuffer(0),
  }),
  Font: {
    register: vi.fn(),
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

// Mock the PDF components
vi.mock('@/components/PDF/InvestmentReportPDF', () => ({
  InvestmentReportPDF: () => null,
  SensitivityReportPDF: () => null,
  QuickSummaryPDF: () => null,
}));

// Mock document for download tests
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  },
  writable: true,
});

describe('JobQueue Service', () => {
  beforeEach(() => {
    jobQueue.clearAll(); // Clear all jobs before each test
  });

  afterEach(() => {
    jobQueue.clearAll(); // Clear all jobs after each test
  });

  describe('createJob', () => {
    it('should create a new job with pending status', () => {
      const job = jobQueue.createJob({
        type: 'investment-report',
        input: { test: 'data' },
      });

      expect(job.id).toMatch(/^pdf-\d+-[a-z0-9]+$/);
      expect(job.status).toBe('pending');
      expect(job.progress).toBe(0);
      expect(job.input).toEqual({ test: 'data' });
      expect(job.createdAt).toBeInstanceOf(Date);
    });

    it('should create unique job IDs', () => {
      const job1 = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });
      const job2 = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });

      expect(job1.id).not.toBe(job2.id);
    });
  });

  describe('getJob', () => {
    it('should return job by ID', () => {
      const job = jobQueue.createJob({
        type: 'quick-summary',
        input: {},
      });

      const retrieved = jobQueue.getJob(job.id);
      expect(retrieved).toEqual(job);
    });

    it('should return undefined for non-existent job', () => {
      const retrieved = jobQueue.getJob('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status to processing', () => {
      const job = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });

      const updated = jobQueue.updateJobStatus(job.id, 'processing');

      expect(updated?.status).toBe('processing');
      expect(updated?.startedAt).toBeInstanceOf(Date);
    });

    it('should update job status to completed with result', () => {
      const job = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });

      const result = {
        pdfUrl: 'blob:http://example.com/pdf',
        size: 12345,
      };

      const updated = jobQueue.updateJobStatus(job.id, 'completed', {
        result,
        progress: 100,
      });

      expect(updated?.status).toBe('completed');
      expect(updated?.result).toEqual(result);
      expect(updated?.progress).toBe(100);
      expect(updated?.completedAt).toBeInstanceOf(Date);
    });

    it('should update job status to failed with error', () => {
      const job = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });

      const updated = jobQueue.updateJobStatus(job.id, 'failed', {
        error: 'Generation failed',
      });

      expect(updated?.status).toBe('failed');
      expect(updated?.error).toBe('Generation failed');
      expect(updated?.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('markJobProcessing', () => {
    it('should mark pending job as processing', () => {
      const job = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });

      const updated = jobQueue.markJobProcessing(job.id);

      expect(updated?.status).toBe('processing');
      expect(updated?.progress).toBe(0);
      expect(updated?.startedAt).toBeInstanceOf(Date);
    });

    it('should not mark completed job as processing', () => {
      const job = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });

      jobQueue.updateJobStatus(job.id, 'completed');
      const updated = jobQueue.markJobProcessing(job.id);

      expect(updated).toBeUndefined();
    });
  });

  describe('completeJob and failJob', () => {
    it('should complete job with result', () => {
      const job = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });

      const result = {
        pdfUrl: 'blob:http://example.com/pdf',
        size: 12345,
      };

      const updated = jobQueue.completeJob(job.id, result);

      expect(updated?.status).toBe('completed');
      expect(updated?.result).toEqual(result);
      expect(updated?.progress).toBe(100);
    });

    it('should fail job with error', () => {
      const job = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });

      const updated = jobQueue.failJob(job.id, 'Test error');

      expect(updated?.status).toBe('failed');
      expect(updated?.error).toBe('Test error');
    });
  });

  describe('updateProgress', () => {
    it('should update job progress', () => {
      const job = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });

      jobQueue.updateProgress(job.id, 50);
      let updated = jobQueue.getJob(job.id);
      expect(updated?.progress).toBe(50);

      // Test clamping
      jobQueue.updateProgress(job.id, 150);
      updated = jobQueue.getJob(job.id);
      expect(updated?.progress).toBe(100);

      jobQueue.updateProgress(job.id, -10);
      updated = jobQueue.getJob(job.id);
      expect(updated?.progress).toBe(0);
    });
  });

  describe('getPendingJobs and getProcessingJobs', () => {
    it('should return only pending jobs', () => {
      const job1 = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });
      const job2 = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });

      jobQueue.markJobProcessing(job1.id);

      const pending = jobQueue.getPendingJobs();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(job2.id);
    });

    it('should return only processing jobs', () => {
      const job1 = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });
      const job2 = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });

      jobQueue.markJobProcessing(job1.id);

      const processing = jobQueue.getProcessingJobs();
      expect(processing).toHaveLength(1);
      expect(processing[0].id).toBe(job1.id);
    });
  });

  describe('getAllJobs', () => {
    it('should return all jobs', () => {
      jobQueue.createJob({ type: 'investment-report', input: {} });
      jobQueue.createJob({ type: 'quick-summary', input: {} });
      jobQueue.createJob({ type: 'sensitivity-report', input: {} });

      const allJobs = jobQueue.getAllJobs();
      expect(allJobs).toHaveLength(3);
    });
  });

  describe('cleanup', () => {
    it('should remove old completed jobs', () => {
      const job1 = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });
      jobQueue.completeJob(job1.id, {
        pdfUrl: 'blob:http://example.com/pdf',
        size: 12345,
      });

      // Manually set completedAt to 25 hours ago
      const job = jobQueue.getJob(job1.id);
      if (job) {
        (job as any).completedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
      }

      const cleaned = jobQueue.cleanup(24);

      expect(cleaned).toBe(1);
      expect(jobQueue.getJob(job1.id)).toBeUndefined();
    });

    it('should not remove recent jobs', () => {
      const job1 = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });
      jobQueue.completeJob(job1.id, {
        pdfUrl: 'blob:http://example.com/pdf',
        size: 12345,
      });

      const cleaned = jobQueue.cleanup(24);

      expect(cleaned).toBe(0);
      expect(jobQueue.getJob(job1.id)).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return queue statistics', () => {
      // Create jobs in different states
      const job1 = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });
      const job2 = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });
      const job3 = jobQueue.createJob({
        type: 'investment-report',
        input: {},
      });

      jobQueue.markJobProcessing(job1.id);
      jobQueue.completeJob(job2.id, {
        pdfUrl: 'blob:http://example.com/pdf',
        size: 12345,
      });
      jobQueue.failJob(job3.id, 'Test error');

      const stats = jobQueue.getStats();

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(0);
      expect(stats.processing).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
    });
  });
});

describe('PDFGenerator Service', () => {
  const mockProjectInput: ProjectInput = {
    province: 'Guangdong',
    projectName: 'Test Project',
    systemSize: {
      capacity: 1,
      duration: 2,
    },
    electricityPrice: {
      peakPrice: 1.2,
      valleyPrice: 0.4,
    },
  };

  const mockCalculationResult: CalculationResult = {
    financialMetrics: {
      irr: 15.5,
      npv: 500000,
      roi: 25,
      paybackPeriod: 5.2,
      profitMargin: 18,
    },
    revenueBreakdown: {
      peakValleyArbitrage: 300000,
      capacityCompensation: 200000,
      total: 500000,
    },
    costBreakdown: {
      initialInvestment: 1000000,
      annualOperatingCost: 50000,
    },
    annualCashFlows: [
      {
        year: 1,
        revenue: 500000,
        operatingCost: 50000,
        financingCost: 0,
        netCashFlow: 450000,
        cumulativeCashFlow: -550000,
      },
    ],
    performanceMetrics: {
      levelizedCost: 0.85,
      capacityFactor: 85,
    },
    calculationParams: {
      discountRate: 0.08,
      projectLifetime: 10,
    },
  };

  describe('generate', () => {
    it('should generate PDF synchronously', async () => {
      const result = await pdfGenerator.generate({
        projectInput: mockProjectInput,
        calculationResult: mockCalculationResult,
        reportType: 'investment-report',
      });

      expect(result.pdfUrl).toMatch(/^blob:/);
      expect(result.size).toBeGreaterThan(0);
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('should generate different report types', async () => {
      const types = [
        'investment-report',
        'quick-summary',
      ] as const;

      for (const type of types) {
        const result = await pdfGenerator.generate({
          projectInput: mockProjectInput,
          calculationResult: mockCalculationResult,
          reportType: type,
        });

        expect(result.pdfUrl).toMatch(/^blob:/);
        expect(result.blob).toBeInstanceOf(Blob);
      }
    });
  });

  describe('generateAsync', () => {
    it('should create job and generate PDF asynchronously', async () => {
      const job = await pdfGenerator.generateAsync({
        projectInput: mockProjectInput,
        calculationResult: mockCalculationResult,
        reportType: 'investment-report',
      });

      expect(job.type).toBe('investment-report');

      // Wait for job to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      const updatedJob = jobQueue.getJob(job.id);
      // Job should be completed after processing
      expect(['completed', 'processing']).toContain(updatedJob?.status || '');
    });
  });

  describe('generateFilename', () => {
    it('should generate valid filename', () => {
      const filename = pdfGenerator.generateFilename(
        'My Test Project!',
        'investment-report'
      );

      // Filename format: sanitized-name-report-type-date.pdf
      expect(filename).toMatch(/^[a-z0-9-]+-investment-report-\d{4}-\d{2}-\d{2}\.pdf$/);
      expect(filename).toContain('my-test-project');
    });

    it('should include date in filename', () => {
      const filename = pdfGenerator.generateFilename(
        'Project',
        'quick-summary'
      );

      // Filename should contain today's date
      const today = new Date().toISOString().split('T')[0];
      expect(filename).toContain(today);
      expect(filename).toContain('quick-summary');
    });
  });

  describe('downloadPDF', () => {
    it('should trigger download', () => {
      const linkSpy = vi.spyOn(document, 'createElement');
      const appendSpy = vi.spyOn(document.body, 'appendChild');
      const removeSpy = vi.spyOn(document.body, 'removeChild');
      const clickSpy = vi.fn();

      // Mock link element
      const mockLink = {
        href: '',
        download: '',
        click: clickSpy,
      };
      linkSpy.mockReturnValue(mockLink as any);

      pdfGenerator.downloadPDF('blob:http://example.com/test', 'test.pdf');

      expect(linkSpy).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('blob:http://example.com/test');
      expect(mockLink.download).toBe('test.pdf');
      expect(clickSpy).toHaveBeenCalled();

      linkSpy.mockRestore();
      appendSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});
