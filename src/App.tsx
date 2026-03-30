/**
 * Main App Component
 *
 * C&I Energy Storage Investment Calculator
 * Now with authentication and cloud project management!
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n/config'; // Initialize i18n
import './index.css';

// Import providers and contexts
import { useAuth } from './contexts/AuthContext';
import { SecurityProvider } from './contexts/SecurityContext';

// Import components
import { PageErrorBoundary } from './components';
import { FullPageLoading } from './components/ui';

// Lazy load pages for code splitting
const AuthPage = lazy(() => import('./components/AuthPage').then(m => ({ default: m.AuthPage })));
const ProjectListPage = lazy(() => import('./components/ProjectListPage').then(m => ({ default: m.ProjectListPage })));
const ProjectDetailPage = lazy(() => import('./components/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AdminDashboard = lazy(() => import('./components/admin').then(m => ({ default: m.AdminDashboard })));
const AgentMetricsDashboard = lazy(() => import('./components/admin/AgentMetricsDashboard').then(m => ({ default: m.AgentMetricsDashboard })));
const SecurityDashboard = lazy(() => import('./components/admin/SecurityDashboard').then(m => ({ default: m.SecurityDashboard })));
const TariffDatabaseManagement = lazy(() => import('./components/admin/TariffDatabaseManagement').then(m => ({ default: m.TariffDatabaseManagement })));

// Lazy load calculator components (for unauthenticated/demo mode)
const CalculatorForm = lazy(() => import('./components/CalculatorForm').then(m => ({ default: m.CalculatorForm })));

// Import hooks and services (these are small and used frequently)
import { useCalculator } from './hooks/useCalculator';
import { useAllProvinces } from './hooks/useProvince';
import { ProjectInput } from './domain/schemas/ProjectSchema';
import { BenchmarkEngine } from './domain/services/BenchmarkEngine';

// Import Disclaimer components directly (small utility components)
import { Disclaimer, RiskWarning, InlineDisclaimer, TermsLink } from './components/Disclaimer';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoading />;
  }

  if (!user) {
    // Redirect to login with return location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * Public Route Component
 * Redirects to dashboard if user is already authenticated
 */
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoading />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * Demo Calculator (for unauthenticated users)
 */
const DemoCalculator: React.FC = () => {
  const { t } = useTranslation();
  const { result, loading, error, triggerCalculation } = useCalculator({ debounce: 300 });
  const { provinces, loading: loadingProvinces } = useAllProvinces();
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  // Benchmark engine
  const [benchmarkEngine] = useState(() => new BenchmarkEngine());
  const [benchmarkComparison, setBenchmarkComparison] = useState<any>(null);

  // Handle calculation
  const handleCalculate = async (input: ProjectInput) => {
    try {
      await triggerCalculation(input);
    } catch (err) {
      console.error('Calculation failed:', err);
    }
  };

  // Watch for result changes to update benchmark
  useEffect(() => {
    if (result && provinces.length > 0 && !benchmarkComparison) {
      const input = result.input;
      if (input) {
        benchmarkEngine.compare(input, result)
          .then(setBenchmarkComparison)
          .catch(err => console.warn('Benchmark comparison failed:', err));
      }
    }
  }, [result, provinces, benchmarkComparison, benchmarkEngine]);

  // Handle form submission
  const handleSubmit = async (input: ProjectInput) => {
    console.log('Demo project saved:', input);
    // In demo mode, just log the data
  };

  // Language toggle
  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('app.title')}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('app.subtitle')}
              </p>
            </div>

            {/* Sign Up Button */}
            <a
              href="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {t('auth.signUp', { defaultValue: 'Sign Up' })}
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Notice */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                {t('demo.title', { defaultValue: 'Demo Mode' })}
              </h3>
              <p className="text-sm text-blue-800">
                {t('demo.description', { defaultValue: 'Sign up to save your projects and access them from any device.' })}
              </p>
            </div>
          </div>
        </div>

        {/* Calculator Form */}
        <Suspense fallback={<FullPageLoading />}>
          <PageErrorBoundary pageName="CalculatorForm">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <CalculatorForm
                onSubmit={handleSubmit}
                onCalculate={handleCalculate}
              />
            </div>
          </PageErrorBoundary>
        </Suspense>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {t('calculator.title')}
            </h3>
            <p className="text-sm text-blue-800">
              Calculate IRR, NPV, payback period, and LCOE for your energy storage project
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              {t('sensitivity.title')}
            </h3>
            <p className="text-sm text-green-800">
              Analyze how parameter changes affect your investment returns
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              {t('benchmark.title')}
            </h3>
            <p className="text-sm text-purple-800">
              Compare your project with 110+ industry benchmarks
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        {/* Disclaimer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Disclaimer type="short" variant="footer" />
          <TermsLink className="mb-4" />
        </div>

        {/* Footer content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2026 ESS Financial. {t('common.all')} {t('common.rights')}.
            </p>
            <p className="text-sm text-gray-500">
              Version 1.0.0 | {t('common.data')}: {t('common.source')} - {t('common.provinces')} 31
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/**
 * Loading component for lazy loaded routes
 */
const RouteLoading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

/**
 * Wrapper component for lazy loaded routes with error boundary
 */
interface LazyRouteWrapperProps {
  children: React.ReactNode;
}

const LazyRouteWrapper: React.FC<LazyRouteWrapperProps> = ({ children }) => (
  <Suspense fallback={<RouteLoading />}>
    <PageErrorBoundary pageName="LazyRoute">
      {children}
    </PageErrorBoundary>
  </Suspense>
);

/**
 * Main App Component with Routing
 */
function App() {
  // Initialize AI configuration on app startup
  useEffect(() => {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      // Dynamically import to avoid SSR issues
      import('@/config/Settings').then(({ initializeAIConfig }) => {
        try {
          initializeAIConfig();
        } catch (error) {
          console.warn('[App] Failed to initialize AI config:', error);
        }
      });
    }
  }, []);

  return (
    <SecurityProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LazyRouteWrapper>
                    <AuthPage mode="login" />
                  </LazyRouteWrapper>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <LazyRouteWrapper>
                    <AuthPage mode="register" />
                  </LazyRouteWrapper>
                </PublicRoute>
              }
            />

            {/* Demo Route (unauthenticated) */}
            <Route path="/demo" element={<LazyRouteWrapper><DemoCalculator /></LazyRouteWrapper>} />

            {/* Public Metrics Dashboard (unauthenticated) */}
            <Route
              path="/admin/agent-metrics"
              element={
                <LazyRouteWrapper>
                  <AgentMetricsDashboard refreshInterval={5000} />
                </LazyRouteWrapper>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <LazyRouteWrapper>
                    <ProjectListPage />
                  </LazyRouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id"
              element={
                <ProtectedRoute>
                  <LazyRouteWrapper>
                    <ProjectDetailPage />
                  </LazyRouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <LazyRouteWrapper>
                    <SettingsPage />
                  </LazyRouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <LazyRouteWrapper>
                    <AdminDashboard />
                  </LazyRouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/security"
              element={
                <ProtectedRoute>
                  <LazyRouteWrapper>
                    <SecurityDashboard />
                  </LazyRouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tariff-database"
              element={
                <ProtectedRoute>
                  <LazyRouteWrapper>
                    <TariffDatabaseManagement />
                  </LazyRouteWrapper>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </SecurityProvider>
  );
}

export default App;
