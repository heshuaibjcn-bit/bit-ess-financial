/**
 * QuickFillButton - Quick fill sample data button
 *
 * Allows users to quickly populate the form with example data
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCloudProjectStore } from '@/stores/cloudProjectStore';
import { getSampleProject, SAMPLE_PROJECT_DESCRIPTIONS } from '@/config/sampleProjects';

interface QuickFillButtonProps {
  className?: string;
  onFill?: () => void;
}

export const QuickFillButton: React.FC<QuickFillButtonProps> = ({
  className = '',
  onFill,
}) => {
  const { t } = useTranslation();
  const { updateCurrentProjectFormData } = useCloudProjectStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleFill = async (key: keyof typeof SAMPLE_PROJECT_DESCRIPTIONS) => {
    const sampleProject = getSampleProject(key);
    // Update the current project's form data
    await updateCurrentProjectFormData(sampleProject);
    setShowMenu(false);
    if (onFill) onFill();
  };

  return (
    <div className={`quick-fill-button relative ${className}`}>
      {/* Main button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {t('actions.quickFill', '填入示例')}
        <svg className={`w-4 h-4 ml-2 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-20 animate-fade-in-up">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                选择示例项目
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                快速填入不同场景的示例数据
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              {Object.entries(SAMPLE_PROJECT_DESCRIPTIONS).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleFill(key as keyof typeof SAMPLE_PROJECT_DESCRIPTIONS)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{info.name}</span>
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                          IRR {info.irr}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{info.description}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="mt-2 flex items-center text-xs">
                    <span className="text-gray-500">风险等级：</span>
                    <span className={`ml-1 font-medium ${
                      info.risk === '较低' ? 'text-green-600' :
                      info.risk === '中等' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {info.risk}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
              <p className="text-xs text-gray-500 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                填入后将覆盖当前表单数据
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuickFillButton;
