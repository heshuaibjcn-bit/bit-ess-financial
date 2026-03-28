/**
 * OwnerInfoStep - Step 1: Owner Information Assessment
 *
 * Collects:
 * - Company basic information
 * - Background verification
 * - Collaboration model
 * - Facility information
 * - Site information
 * - Commission date
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  COLLABORATION_MODELS,
  COMPANY_SCALES,
  CREDIT_RATINGS,
  PAYMENT_HISTORIES,
  VOLTAGE_LEVELS,
  ROOF_TYPES,
  type CollaborationModel,
} from '../../domain/schemas/ProjectSchema';

export const OwnerInfoStep: React.FC = () => {
  const { t } = useTranslation();
  const { register, watch, formState: { errors } } = useFormContext();

  // Watch collaboration model for conditional rendering
  const collaborationModel = watch('ownerInfo.collaborationModel');

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('calculator.title')} - {t('calculator.steps.ownerInfo')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('calculator.ownerInfo.description')}
        </p>
      </div>

      {/* Company Basic Information */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {t('calculator.ownerInfo.companyInfo')}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <div className="md:col-span-2">
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.companyName')} <span className="text-red-500">*</span>
            </label>
            <input
              id="companyName"
              type="text"
              {...register('ownerInfo.companyName')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.ownerInfo?.companyName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('calculator.ownerInfo.companyName')}
            />
            {errors.ownerInfo?.companyName && (
              <p className="mt-1 text-sm text-red-600">{errors.ownerInfo.companyName.message}</p>
            )}
          </div>

          {/* Industry */}
          <div className="md:col-span-2">
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.industry')} <span className="text-red-500">*</span>
            </label>
            <input
              id="industry"
              type="text"
              {...register('ownerInfo.industry')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.ownerInfo?.industry ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('calculator.ownerInfo.industry')}
            />
            {errors.ownerInfo?.industry && (
              <p className="mt-1 text-sm text-red-600">{errors.ownerInfo.industry.message}</p>
            )}
          </div>

          {/* Contact Person */}
          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.contactPerson')} <span className="text-red-500">*</span>
            </label>
            <input
              id="contactPerson"
              type="text"
              {...register('ownerInfo.contactPerson')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.ownerInfo?.contactPerson ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('calculator.ownerInfo.contactPerson')}
            />
            {errors.ownerInfo?.contactPerson && (
              <p className="mt-1 text-sm text-red-600">{errors.ownerInfo.contactPerson.message}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.contactPhone')} <span className="text-red-500">*</span>
            </label>
            <input
              id="contactPhone"
              type="tel"
              {...register('ownerInfo.contactPhone')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.ownerInfo?.contactPhone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="13800000000"
            />
            {errors.ownerInfo?.contactPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.ownerInfo.contactPhone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Background Check */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('calculator.ownerInfo.backgroundCheck')}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Scale */}
          <div>
            <label htmlFor="companyScale" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.companyScale')}
            </label>
            <select
              id="companyScale"
              {...register('ownerInfo.companyScale')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">{t('calculator.ownerInfo.companyScale_small')}</option>
              <option value="medium">{t('calculator.ownerInfo.companyScale_medium')}</option>
              <option value="large">{t('calculator.ownerInfo.companyScale_large')}</option>
            </select>
          </div>

          {/* Credit Rating */}
          <div>
            <label htmlFor="creditRating" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.creditRating')}
            </label>
            <select
              id="creditRating"
              {...register('ownerInfo.creditRating')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CREDIT_RATINGS.map((rating) => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </div>

          {/* Payment History */}
          <div>
            <label htmlFor="paymentHistory" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.paymentHistory')}
            </label>
            <select
              id="paymentHistory"
              {...register('ownerInfo.paymentHistory')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="excellent">{t('calculator.ownerInfo.paymentHistory_excellent')}</option>
              <option value="good">{t('calculator.ownerInfo.paymentHistory_good')}</option>
              <option value="fair">{t('calculator.ownerInfo.paymentHistory_fair')}</option>
              <option value="poor">{t('calculator.ownerInfo.paymentHistory_poor')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collaboration Model */}
      <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {t('calculator.ownerInfo.collaboration')}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Collaboration Model */}
          <div>
            <label htmlFor="collaborationModel" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.collaboration')} <span className="text-red-500">*</span>
            </label>
            <select
              id="collaborationModel"
              {...register('ownerInfo.collaborationModel')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.ownerInfo?.collaborationModel ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {COLLABORATION_MODELS.map((model) => (
                <option key={model} value={model}>{t(`calculator.ownerInfo.collaboration_${model}`)}</option>
              ))}
            </select>
            {errors.ownerInfo?.collaborationModel && (
              <p className="mt-1 text-sm text-red-600">{errors.ownerInfo.collaborationModel.message}</p>
            )}
          </div>

          {/* Contract Duration */}
          <div>
            <label htmlFor="contractDuration" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.contractDuration')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="contractDuration"
                type="number"
                min="1"
                max="30"
                {...register('ownerInfo.contractDuration', { valueAsNumber: true })}
                className={`w-full px-3 py-2 pr-16 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.ownerInfo?.contractDuration ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <span className="absolute right-3 top-2 text-gray-500">{t('common.year')}</span>
            </div>
            {errors.ownerInfo?.contractDuration && (
              <p className="mt-1 text-sm text-red-600">{errors.ownerInfo.contractDuration.message}</p>
            )}
          </div>

          {/* Revenue Share Ratio (conditional) */}
          {collaborationModel === 'joint_venture' && (
            <div className="md:col-span-2">
              <label htmlFor="revenueShareRatio" className="block text-sm font-medium text-gray-700 mb-1">
                {t('calculator.ownerInfo.revenueShareRatio')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="revenueShareRatio"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  {...register('ownerInfo.revenueShareRatio', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 pr-16 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.ownerInfo?.revenueShareRatio ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="50"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                投资方分成比例（0-100%）
              </p>
              {errors.ownerInfo?.revenueShareRatio && (
                <p className="mt-1 text-sm text-red-600">{errors.ownerInfo.revenueShareRatio.message}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Facility Information */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {t('calculator.ownerInfo.facility')}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Transformer Capacity */}
          <div>
            <label htmlFor="transformerCapacity" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.transformerCapacity')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="transformerCapacity"
                type="number"
                min="0"
                step="100"
                {...register('facilityInfo.transformerCapacity', { valueAsNumber: true })}
                className={`w-full px-3 py-2 pr-16 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.facilityInfo?.transformerCapacity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1000"
              />
              <span className="absolute right-3 top-2 text-gray-500">kVA</span>
            </div>
            {errors.facilityInfo?.transformerCapacity && (
              <p className="mt-1 text-sm text-red-600">{errors.facilityInfo.transformerCapacity.message}</p>
            )}
          </div>

          {/* Voltage Level */}
          <div>
            <label htmlFor="voltageLevel" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.voltageLevel')} <span className="text-red-500">*</span>
            </label>
            <select
              id="voltageLevel"
              {...register('facilityInfo.voltageLevel')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.facilityInfo?.voltageLevel ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {VOLTAGE_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            {errors.facilityInfo?.voltageLevel && (
              <p className="mt-1 text-sm text-red-600">{errors.facilityInfo.voltageLevel.message}</p>
            )}
          </div>

          {/* Average Monthly Load */}
          <div>
            <label htmlFor="avgMonthlyLoad" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.avgMonthlyLoad')}
            </label>
            <div className="relative">
              <input
                id="avgMonthlyLoad"
                type="number"
                min="0"
                step="1000"
                {...register('facilityInfo.avgMonthlyLoad', { valueAsNumber: true })}
                className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="50000"
              />
              <span className="absolute right-3 top-2 text-gray-500">kWh</span>
            </div>
          </div>

          {/* Peak Load */}
          <div>
            <label htmlFor="peakLoad" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.peakLoad')}
            </label>
            <div className="relative">
              <input
                id="peakLoad"
                type="number"
                min="0"
                step="10"
                {...register('facilityInfo.peakLoad', { valueAsNumber: true })}
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="500"
              />
              <span className="absolute right-3 top-2 text-gray-500">kW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Site Information */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {t('calculator.ownerInfo.siteInfo')}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Available Area */}
          <div>
            <label htmlFor="availableArea" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.availableArea')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="availableArea"
                type="number"
                min="0"
                step="10"
                {...register('facilityInfo.availableArea', { valueAsNumber: true })}
                className={`w-full px-3 py-2 pr-20 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.facilityInfo?.availableArea ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="500"
              />
              <span className="absolute right-3 top-2 text-gray-500">{t('common.sqm')}</span>
            </div>
            {errors.facilityInfo?.availableArea && (
              <p className="mt-1 text-sm text-red-600">{errors.facilityInfo.availableArea.message}</p>
            )}
          </div>

          {/* Roof Type */}
          <div>
            <label htmlFor="roofType" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.roofType')} <span className="text-red-500">*</span>
            </label>
            <select
              id="roofType"
              {...register('facilityInfo.roofType')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.facilityInfo?.roofType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {ROOF_TYPES.map((type) => (
                <option key={type} value={type}>{t(`calculator.ownerInfo.roofType_${type}`)}</option>
              ))}
            </select>
            {errors.facilityInfo?.roofType && (
              <p className="mt-1 text-sm text-red-600">{errors.facilityInfo.roofType.message}</p>
            )}
          </div>

          {/* Load Bearing Capacity */}
          <div>
            <label htmlFor="loadBearingCapacity" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.loadBearingCapacity')}
            </label>
            <div className="relative">
              <input
                id="loadBearingCapacity"
                type="number"
                min="0"
                step="100"
                {...register('facilityInfo.loadBearingCapacity', { valueAsNumber: true })}
                className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2000"
              />
              <span className="absolute right-3 top-2 text-gray-500">{t('common.kgPerSqm')}</span>
            </div>
          </div>

          {/* Needs Expansion */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('facilityInfo.needsExpansion')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {t('calculator.ownerInfo.needsExpansion')}
              </span>
            </label>
          </div>

          {/* Commission Date */}
          <div>
            <label htmlFor="commissionDate" className="block text-sm font-medium text-gray-700 mb-1">
              {t('calculator.ownerInfo.commissionDate')} <span className="text-red-500">*</span>
            </label>
            <input
              id="commissionDate"
              type="date"
              {...register('facilityInfo.commissionDate')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.facilityInfo?.commissionDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.facilityInfo?.commissionDate && (
              <p className="mt-1 text-sm text-red-600">{errors.facilityInfo.commissionDate.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
