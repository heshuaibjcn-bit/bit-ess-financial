/**
 * React Hooks for PDF Generation
 *
 * Provides hooks for generating PDFs synchronously and asynchronously.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { pdfGenerator, jobQueue } from '@/services/pdf';
import type {
  GeneratePDFOptions,
  PDFGenerationResult,
  PDFJob,
} from '@/services/pdf';

/**
 * Hook for synchronous PDF generation
 */
export function usePDF() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<PDFGenerationResult | null>(null);

  const generate = useCallback(async (options: GeneratePDFOptions) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const pdfResult = await pdfGenerator.generate(options);
      setResult(pdfResult);
      return pdfResult;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('PDF generation failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const download = useCallback((pdfUrl: string, filename: string) => {
    pdfGenerator.downloadPDF(pdfUrl, filename);
  }, []);

  return {
    generate,
    download,
    loading,
    error,
    result,
  };
}

/**
 * Hook for asynchronous PDF generation with polling
 */
export function useAsyncPDF() {
  const [job, setJob] = useState<PDFJob | null>(null);
  const [polling, setPolling] = useState(false);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const resultRef = useRef<string | null>(null);

  // Generate PDF asynchronously
  const generate = useCallback(async (options: GeneratePDFOptions) => {
    try {
      const newJob = await pdfGenerator.generateAsync(options);
      setJob(newJob);
      return newJob;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to create PDF job');
      throw error;
    }
  }, []);

  // Start polling for job completion
  const startPolling = useCallback((jobId: string) => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
    }

    setPolling(true);

    pollInterval.current = setInterval(() => {
      const currentJob = jobQueue.getJob(jobId);
      if (!currentJob) {
        stopPolling();
        return;
      }

      setJob(currentJob);

      if (currentJob.status === 'completed') {
        stopPolling();
        if (currentJob.result?.pdfUrl) {
          resultRef.current = currentJob.result.pdfUrl;
        }
      } else if (currentJob.status === 'failed') {
        stopPolling();
      }
    }, 500); // Poll every 500ms
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
    setPolling(false);
  }, []);

  // Download completed PDF
  const download = useCallback((filename: string) => {
    const url = resultRef.current || job?.result?.pdfUrl;
    if (url) {
      pdfGenerator.downloadPDF(url, filename);
    }
  }, [job]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  // Auto-start polling when job is created
  useEffect(() => {
    if (job && job.status === 'pending' && !polling) {
      startPolling(job.id);
    }
  }, [job, polling, startPolling]);

  return {
    generate,
    download,
    job,
    polling,
    startPolling,
    stopPolling,
  };
}

/**
 * Hook for managing multiple PDF jobs
 */
export function usePDFJobs() {
  const [jobs, setJobs] = useState<PDFJob[]>([]);

  const refresh = useCallback(() => {
    const allJobs = Array.from(
      // Access private jobs map through stats or add a getAllJobs method
      [] // Would need to add getAllJobs() to JobQueueService
    );
    setJobs(allJobs);
  }, []);

  const getJob = useCallback((jobId: string) => {
    return jobQueue.getJob(jobId);
  }, []);

  const cleanup = useCallback((olderThanHours: number = 24) => {
    return jobQueue.cleanup(olderThanHours);
  }, []);

  return {
    jobs,
    refresh,
    getJob,
    cleanup,
  };
}
