/**
 * Job Queue Service for Async PDF Generation
 *
 * Manages background jobs for PDF generation with status tracking.
 * In-memory implementation (can be migrated to BullMQ/Redis for production).
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PDFJob {
  id: string;
  type: 'investment-report' | 'sensitivity-report' | 'quick-summary';
  status: JobStatus;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: {
    pdfUrl: string;
    size: number;
  };
  error?: string;
  input: any;
}

export interface CreateJobOptions {
  type: PDFJob['type'];
  input: any;
}

/**
 * Job Queue Service
 *
 * In-memory job queue for PDF generation.
 * For production, consider migrating to BullMQ with Redis backend.
 */
class JobQueueService {
  private jobs: Map<string, PDFJob> = new Map();
  private processingJobs: Set<string> = new Set();

  /**
   * Create a new PDF generation job
   */
  createJob(options: CreateJobOptions): PDFJob {
    const jobId = this.generateJobId();
    const job: PDFJob = {
      id: jobId,
      type: options.type,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      input: options.input,
    };

    this.jobs.set(jobId, job);
    return job;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): PDFJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Update job status
   */
  updateJobStatus(
    jobId: string,
    status: JobStatus,
    updates?: Partial<Pick<PDFJob, 'progress' | 'result' | 'error'>>
  ): PDFJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    job.status = status;

    if (updates) {
      if (updates.progress !== undefined) job.progress = updates.progress;
      if (updates.result !== undefined) job.result = updates.result;
      if (updates.error !== undefined) job.error = updates.error;
    }

    if (status === 'processing' && !job.startedAt) {
      job.startedAt = new Date();
    }

    if (status === 'completed' || status === 'failed') {
      job.completedAt = new Date();
      this.processingJobs.delete(jobId);
    }

    return job;
  }

  /**
   * Get all pending jobs
   */
  getPendingJobs(): PDFJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === 'pending'
    );
  }

  /**
   * Get all processing jobs
   */
  getProcessingJobs(): PDFJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === 'processing'
    );
  }

  /**
   * Get all jobs
   */
  getAllJobs(): PDFJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Mark job as processing
   */
  markJobProcessing(jobId: string): PDFJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'pending') return undefined;

    job.status = 'processing';
    job.startedAt = new Date();
    job.progress = 0;
    this.processingJobs.add(jobId);

    return job;
  }

  /**
   * Complete job with result
   */
  completeJob(jobId: string, result: PDFJob['result']): PDFJob | undefined {
    return this.updateJobStatus(jobId, 'completed', { result, progress: 100 });
  }

  /**
   * Fail job with error
   */
  failJob(jobId: string, error: string): PDFJob | undefined {
    return this.updateJobStatus(jobId, 'failed', { error });
  }

  /**
   * Update job progress
   */
  updateProgress(jobId: string, progress: number): PDFJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    job.progress = Math.max(0, Math.min(100, progress));
    return job;
  }

  /**
   * Clean up old completed/failed jobs
   */
  cleanup(olderThanHours: number = 24): number {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        job.completedAt < cutoff
      ) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      processing: jobs.filter((j) => j.status === 'processing').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
    };
  }

  /**
   * Clear all jobs (for testing)
   */
  clearAll(): void {
    this.jobs.clear();
    this.processingJobs.clear();
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance
export const jobQueue = new JobQueueService();
