/**
 * Main App Component
 *
 * C&I Energy Storage Investment Calculator
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n/config'; // Initialize i18n
import './index.css';

// Import components
import { CalculatorForm } from './components/CalculatorForm';
import { PageErrorBoundary } from './components';
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

function App() {
  const { t, i18n } = useTranslation();
  const { result, loading, error, triggerCalculation } = useCalculator({ debounce: 300 });
  const { provinces, loading: loadingProvinces } = useAllProvinces();
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  // Benchmark engine
  const [benchmarkEngine] = useState(() => new BenchmarkEngine());
  const [benchmarkComparison, setBenchmarkComparison] = useState<any>(null);

  // Handle calculation
  const handleCalculate = async (input: ProjectInput) => {
    try {
      console.log('🔥 handleCalculate called with:', input);
      await triggerCalculation(input);
      console.log('✅ Calculation triggered');

      // Get benchmark comparison if available
      // Note: result will be available in the next render cycle
      if (provinces.length > 0) {
        // Benchmark comparison will be done when result is available
      }
    } catch (err) {
      console.error('❌ Calculation failed:', err);
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
  }, [result, provinces, benchmarkComparison]);

  // Handle form submission
  const handleSubmit = async (input: ProjectInput) => {
    console.log('Project saved:', input);
    // TODO: Implement project save logic
  };

  // Language toggle
  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
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

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {language === 'zh' ? '中文' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calculator Form - Full Width for 5-Step Workflow */}
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
}

export default App;
