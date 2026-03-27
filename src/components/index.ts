/**
 * Error Boundary Components
 *
 * Provides error boundary components at different levels:
 * - App-level: Catches all application errors
 * - Page-level: Catches errors in major sections
 * - Feature-level: Catches errors in individual components
 */

export { ErrorBoundary, withErrorBoundary, useErrorHandler } from './ErrorBoundary';
export { AppErrorBoundary } from './AppErrorBoundary';
export { PageErrorBoundary } from './PageErrorBoundary';
export { FeatureErrorBoundary } from './FeatureErrorBoundary';

// PDF Components
export {
  InvestmentReportPDF,
  SensitivityReportPDF,
  QuickSummaryPDF,
} from './PDF/InvestmentReportPDF';

// Export Components
export { PDFExportButton } from './Export/PDFExportButton';
export {
  Disclaimer,
  InlineDisclaimer,
  RiskWarning,
  RegulatoryNotice,
  TermsLink,
  type DisclaimerProps,
} from './Disclaimer';

// Report Disclaimers
export {
  ReportDisclaimer,
  RegulatoryNotice as ReportRegulatoryNotice,
  CertificationNotice,
} from './Export/ReportDisclaimer';
