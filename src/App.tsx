/**
 * Main App Component
 * 
 * ESS Financial - C&I Energy Storage Investment Calculator
 * Minimal business style with white & blue color palette
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n/config';
import './index.css';

import { useAuth } from './contexts/AuthContext';
import { SecurityProvider } from './contexts/SecurityContext';
import { PageErrorBoundary } from './components';
import { FullPageLoading } from './components/ui';

// Lazy load pages
const AuthPage = lazy(() => import('./components/AuthPage').then(m => ({ default: m.AuthPage })));
const ProjectListPage = lazy(() => import('./components/ProjectListPage').then(m => ({ default: m.ProjectListPage })));
const ProjectDetailPage = lazy(() => import('./components/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AdminDashboard = lazy(() => import('./components/admin').then(m => ({ default: m.AdminDashboard })));
const AgentMetricsDashboard = lazy(() => import('./components/admin/AgentMetricsDashboard').then(m => ({ default: m.AgentMetricsDashboard })));
const SecurityDashboard = lazy(() => import('./components/admin/SecurityDashboard').then(m => ({ default: m.SecurityDashboard })));
const TariffDatabaseManagement = lazy(() => import('./components/admin/TariffDatabaseManagement').then(m => ({ default: m.TariffDatabaseManagement })));
const CalculatorForm = lazy(() => import('./components/CalculatorForm').then(m => ({ default: m.CalculatorForm })));

import { useCalculator } from './hooks/useCalculator';
import { useAllProvinces } from './hooks/useProvince';
import { ProjectInput } from './domain/schemas/ProjectSchema';
import { BenchmarkEngine } from './domain/services/BenchmarkEngine';
// Note: Disclaimer and TermsLink can be imported when needed

// Protected Route
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoading />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
};

// Public Route
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoading />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Demo Calculator
const DemoCalculator: React.FC = () => {
  const { t } = useTranslation();
  const { result, /* loading, error, */ triggerCalculation } = useCalculator({ debounceMs: 300 });
  const { provinces /*, loading: loadingProvinces */ } = useAllProvinces();
  // const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [benchmarkEngine] = useState(() => new BenchmarkEngine());
  const [benchmarkComparison, setBenchmarkComparison] = useState<any>(null);

  const handleCalculate = async (input: ProjectInput) => {
    try {
      await triggerCalculation(input);
    } catch (err) {
      console.error('Calculation failed:', err);
    }
  };

  useEffect(() => {
    if (result && provinces.length > 0 && !benchmarkComparison) {
      const input = (result as EngineResult & { input?: ProjectInput }).input;
      if (input) {
        benchmarkEngine.compare(input, result)
          .then(setBenchmarkComparison)
          .catch(err => console.warn('Benchmark comparison failed:', err));
      }
    }
  }, [result, provinces, benchmarkComparison, benchmarkEngine]);

  const handleSubmit = async (input: ProjectInput) => {
    console.log('Demo project saved:', input);
  };

  return (
    <div className="min-h-screen bg-gradient-mesh relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-200/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-64 h-64 bg-primary-300/10 rounded-full blur-3xl" />
      </div>

      {/* Header with Glass Effect */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">{t('app.title')}</h1>
                <p className="text-xs text-neutral-500">{t('app.subtitle')}</p>
              </div>
            </div>

            <a
              href="/register"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">{t('auth.signUp', { defaultValue: '注册' })}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Demo Notice */}
        <div className="mb-6 bg-gradient-to-r from-primary-50/90 to-primary-100/60 backdrop-blur-sm border border-primary-200/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-md shadow-primary-500/20 flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-900 mb-1">
                {t('demo.title', { defaultValue: '演示模式' })}
              </h3>
              <p className="text-sm text-primary-700">
                {t('demo.description', { defaultValue: '注册账户以保存项目并随时访问。' })}
              </p>
            </div>
          </div>
        </div>

        {/* Calculator Form */}
        <Suspense fallback={<FullPageLoading />}>
          <PageErrorBoundary pageName="CalculatorForm">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-neutral-200/60 shadow-xl shadow-black/5 p-6 relative overflow-hidden">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <CalculatorForm
                  onSubmit={handleSubmit}
                  onCalculate={handleCalculate}
                />
              </div>
            </div>
          </PageErrorBoundary>
        </Suspense>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="group bg-gradient-to-b from-white/90 to-neutral-50/80 backdrop-blur-sm border border-neutral-200/60 rounded-2xl p-6 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-primary-500/0 transition-all duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-50 rounded-xl shadow-md shadow-primary-500/10 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-neutral-900">{t('calculator.title')}</h3>
              </div>
              <p className="text-sm text-neutral-600">
                计算 IRR、NPV、投资回收期和度电成本
              </p>
            </div>
          </div>

          <div className="group bg-gradient-to-b from-white/90 to-neutral-50/80 backdrop-blur-sm border border-neutral-200/60 rounded-2xl p-6 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-success-500/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-success-500/0 to-success-500/0 group-hover:from-success-500/5 group-hover:to-success-500/0 transition-all duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-success-100 to-success-50 rounded-xl shadow-md shadow-success-500/10 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-neutral-900">{t('sensitivity.title')}</h3>
              </div>
              <p className="text-sm text-neutral-600">
                分析参数变化对投资回报的影响
              </p>
            </div>
          </div>

          <div className="group bg-gradient-to-b from-white/90 to-neutral-50/80 backdrop-blur-sm border border-neutral-200/60 rounded-2xl p-6 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-warning-500/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-warning-500/0 to-warning-500/0 group-hover:from-warning-500/5 group-hover:to-warning-500/0 transition-all duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-warning-100 to-warning-50 rounded-xl shadow-md shadow-warning-500/10 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-neutral-900">{t('benchmark.title')}</h3>
              </div>
              <p className="text-sm text-neutral-600">
                与 110+ 行业基准进行比较
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-xl border-t border-neutral-200/60 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-500">
              © 2026 ESS Financial. 保留所有权利。
            </p>
            <p className="text-sm text-neutral-500">
              版本 1.0.0 | 数据：31 个省份
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Route Loading
const RouteLoading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-50">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
  </div>
);

// Lazy Route Wrapper
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

// Main App
function App() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
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

            {/* Demo Route */}
            <Route path="/demo" element={<LazyRouteWrapper><DemoCalculator /></LazyRouteWrapper>} />

            {/* Public Metrics Dashboard */}
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
