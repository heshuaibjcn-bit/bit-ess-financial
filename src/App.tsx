/**
 * Main App Component
 *
 * C&I Energy Storage Investment Calculator
 * Now with authentication and cloud project management!
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n/config'; // Initialize i18n
import './index.css';

// Import providers and contexts
import { useAuth } from './contexts/AuthContext';

// Import components
import { PageErrorBoundary } from './components';
import { FullPageLoading } from './components/ui';

// Import pages
import { AuthPage } from './components/AuthPage';
import { ProjectListPage } from './components/ProjectListPage';
import { ProjectDetailPage } from './components/ProjectDetailPage';
import { SettingsPage } from './components/SettingsPage';

// Import calculator components (for unauthenticated/demo mode)
import { CalculatorForm } from './components/CalculatorForm';
import { useCalculator } from './hooks/useCalculator';
import { useAllProvinces } from './hooks/useProvince';
import { ProjectInput } from './domain/schemas/ProjectSchema';
import { BenchmarkEngine } from './domain/services/BenchmarkEngine';
import {
  Disclaimer,
  RiskWarning,
  InlineDisclaimer,
  TermsLink,
} from './components/Disclaimer';

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
        <PageErrorBoundary pageName="CalculatorForm">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <CalculatorForm
              onSubmit={handleSubmit}
              onCalculate={handleCalculate}
            />
          </div>
        </PageErrorBoundary>

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
 * Main App Component with Routing
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthPage mode="login" />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthPage mode="register" />
            </PublicRoute>
          }
        />

        {/* Demo Route (unauthenticated) */}
        <Route path="/demo" element={<DemoCalculator />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProjectListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:id"
          element={
            <ProtectedRoute>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
