/**
 * ReportOutputStep - Step 5: Comprehensive Report Output
 *
 * Features:
 * - Report preview with all sections
 * - Export to PDF option
 * - Export to Word option
 * - Share functionality
 * - Print option
 */

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const ReportOutputStep: React.FC = () => {
  const { t } = useTranslation();
  const { watch } = useFormContext();
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Watch all data
  const ownerInfo = watch('ownerInfo');
  const facilityInfo = watch('facilityInfo');
  const tariffDetail = watch('tariffDetail');
  const technicalProposal = watch('technicalProposal');

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      // TODO: Implement PDF export
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('PDF导出功能开发中...');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportWord = async () => {
    setExporting(true);
    try {
      // TODO: Implement Word export
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Word导出功能开发中...');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      // TODO: Implement share functionality
      alert('分享功能开发中...');
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const chapters = [
    { key: 'overview', title: t('calculator.reportOutput.chapters.overview') },
    { key: 'owner', title: t('calculator.reportOutput.chapters.owner') },
    { key: 'tariff', title: t('calculator.reportOutput.chapters.tariff') },
    { key: 'technical', title: t('calculator.reportOutput.chapters.technical') },
    { key: 'financial', title: t('calculator.reportOutput.chapters.financial') },
    { key: 'risk', title: t('calculator.reportOutput.chapters.risk') },
    { key: 'recommendation', title: t('calculator.reportOutput.chapters.recommendation') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('calculator.title')} - {t('calculator.steps.reportOutput')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('calculator.reportOutput.description')}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7M12 15c4.478 0 8.268-2.943 9.542-7" />
          </svg>
          <span>{t('calculator.reportOutput.preview')}</span>
        </button>

        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v5a2 2 0 01-2 2h-3m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v2m-6 6h12" />
          </svg>
          <span>{exporting ? t('common.loading') : t('calculator.reportOutput.exportPDF')}</span>
        </button>

        <button
          onClick={handleExportWord}
          disabled={exporting}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors disabled:bg-gray-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m0 0l4 4m4-24v8m0 0l8 8" />
          </svg>
          <span>{exporting ? t('common.loading') : t('calculator.reportOutput.exportWord')}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.815 9 12c0 .768-.093 1.534-.211 2.274-.393m7.316-5.607a3.316 3.316 0 00-4.257-1.274 3.316 3.316 0 00-1.274-4.257m7.316 5.607M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{t('calculator.reportOutput.share')}</span>
        </button>
      </div>

      {/* Report Preview */}
      {showPreview && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
            <h1 className="text-2xl font-bold mb-2">工商业储能项目投资评估报告</h1>
            <p className="text-blue-100">Energy Storage Investment Assessment Report</p>
            <p className="text-sm text-blue-200 mt-2">
              报告日期: {new Date().toLocaleDateString('zh-CN')}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
            {/* Chapter 1: Project Overview */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-2">1</span>
                {chapters[0].title}
              </h2>
              <div className="pl-8 space-y-2 text-sm text-gray-700">
                <p><strong>项目名称:</strong> {ownerInfo?.companyName}储能项目</p>
                <p><strong>所属行业:</strong> {ownerInfo?.industry}</p>
                <p><strong>项目地点:</strong> {watch('province')}</p>
                <p><strong>合作模式:</strong> {t(`calculator.ownerInfo.collaboration_${ownerInfo?.collaborationModel}`)}</p>
                <p><strong>合作年限:</strong> {ownerInfo?.contractDuration}年</p>
              </div>
            </section>

            {/* Chapter 2: Owner Background */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-2">2</span>
                {chapters[1].title}
              </h2>
              <div className="pl-8 space-y-2 text-sm text-gray-700">
                <p><strong>企业规模:</strong> {t(`calculator.ownerInfo.companyScale_${ownerInfo?.companyScale}`)}</p>
                <p><strong>信用评级:</strong> {ownerInfo?.creditRating}</p>
                <p><strong>用电历史:</strong> {t(`calculator.ownerInfo.paymentHistory_${ownerInfo?.paymentHistory}`)}</p>
                <p><strong>联系人:</strong> {ownerInfo?.contactPerson} ({ownerInfo?.contactPhone})</p>
              </div>
            </section>

            {/* Chapter 3: Tariff Policy */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-2">3</span>
                {chapters[2].title}
              </h2>
              <div className="pl-8 space-y-2 text-sm text-gray-700">
                <p><strong>电价类型:</strong> {t(`calculator.tariffDetails.tariffType_${tariffDetail?.tariffType}`)}</p>
                <p><strong>峰时电价:</strong> ¥{tariffDetail?.peakPrice?.toFixed(3)}/kWh</p>
                <p><strong>谷时电价:</strong> ¥{tariffDetail?.valleyPrice?.toFixed(3)}/kWh</p>
                <p><strong>平时电价:</strong> ¥{tariffDetail?.flatPrice?.toFixed(3)}/kWh</p>
                <p><strong>价差:</strong> ¥{((tariffDetail?.peakPrice || 0) - (tariffDetail?.valleyPrice || 0)).toFixed(3)}/kWh</p>
              </div>
            </section>

            {/* Chapter 4: Technical Proposal */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-2">4</span>
                {chapters[3].title}
              </h2>
              <div className="pl-8 space-y-2 text-sm text-gray-700">
                <p><strong>推荐容量:</strong> {technicalProposal?.recommendedCapacity} MWh</p>
                <p><strong>推荐功率:</strong> {technicalProposal?.recommendedPower} MW</p>
                <p><strong>放电时长:</strong> {technicalProposal?.capacityPowerRatio} 小时</p>
                <p><strong>充放电策略:</strong> {t(`calculator.technicalAssessment.chargeStrategy_${technicalProposal?.chargeStrategy}`)}</p>
                <p><strong>优化目标:</strong> {t(`calculator.technicalAssessment.optimizedFor_${technicalProposal?.optimizedFor}`)}</p>
                <p><strong>循环寿命:</strong> {technicalProposal?.cycleLife.toLocaleString()} 次</p>
              </div>
            </section>

            {/* Chapter 5: Financial Analysis */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-2">5</span>
                {chapters[4].title}
              </h2>
              <div className="pl-8 text-sm text-gray-700">
                <p className="text-gray-500 italic">（详细财务分析数据请见财务测算章节）</p>
              </div>
            </section>

            {/* Chapter 6: Risk Assessment */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-2">6</span>
                {chapters[5].title}
              </h2>
              <div className="pl-8 space-y-2 text-sm text-gray-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>电价政策变化风险</li>
                  <li>系统性能衰减风险</li>
                  <li>运营成本波动风险</li>
                  <li>业主信用风险 (评级: {ownerInfo?.creditRating})</li>
                </ul>
              </div>
            </section>

            {/* Chapter 7: Investment Recommendation */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-2">7</span>
                {chapters[6].title}
              </h2>
              <div className="pl-8 text-sm text-gray-700">
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <p className="font-medium text-green-900">
                    基于以上分析，该项目在当前技术方案和市场条件下具有一定的投资价值。
                  </p>
                  <p className="text-green-800 mt-2">
                    建议在实际投资前进行更详细的尽职调查，包括现场勘察、设备选型、
                    电网接入方案确认等。同时，建议建立完善的风险管控机制和运营管理体系。
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 text-center text-sm text-gray-600">
            <p>本报告由工商业储能投资决策平台自动生成，仅供参考。</p>
            <p className="mt-1">This report is automatically generated by the C&I Energy Storage Investment Platform.</p>
          </div>
        </div>
      )}

      {/* Report Structure */}
      {!showPreview && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-800 mb-4">报告章节</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {chapters.map((chapter, index) => (
              <div key={chapter.key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-700">{chapter.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1 text-sm text-blue-800">
            <p className="font-medium mb-1">导出说明</p>
            <ul className="space-y-1 text-blue-700">
              <li>• PDF格式：适合打印和正式归档，包含完整报告内容</li>
              <li>• Word格式：适合进一步编辑和修改</li>
              <li>• 分享功能：生成只读链接，可设置有效期</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
