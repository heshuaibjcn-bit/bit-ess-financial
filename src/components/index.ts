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
  TermsLink,
  type DisclaimerProps,
} from './Disclaimer';

// Report Disclaimers
export {
  ReportDisclaimer,
  RegulatoryNotice as ReportRegulatoryNotice,
  CertificationNotice,
} from './Export/ReportDisclaimer';

// AI Chat Components
export {
  AIChatSidebar,
  ChatMessageList,
  ChatInput,
  QuickPrompts,
  ThinkingIndicator,
} from './AIChat';

// Auth & Cloud Components
export { AuthPage } from './AuthPage';
export { ProjectListPage } from './ProjectListPage';
export { ProjectDetailPage } from './ProjectDetailPage';
export { ProjectCard, ProjectListItem } from './ProjectCard';
export { FilterBar } from './FilterBar';
export { SettingsPage } from './SettingsPage';

// Enhanced Features
export { StatisticsDashboard } from './StatisticsDashboard';
export { ImportExportDialog } from './ImportExportDialog';
export { TemplateSelectorDialog } from './TemplateSelectorDialog';
export { TariffUpdateButton } from './TariffUpdateButton';

// UI Components
export {
  LoadingSpinner,
  FullPageLoading,
  InlineLoadingSpinner,
} from './ui';
export {
  EmptyState,
  NoProjectsEmptyState,
  NoSearchResultsEmptyState,
  NoConnectionEmptyState,
} from './ui';
export { ConfirmDialog, useConfirmDialog } from './ui';
export { ToastProvider, useToast } from './ui';
export type { ToastVariant, Toast } from './ui';
