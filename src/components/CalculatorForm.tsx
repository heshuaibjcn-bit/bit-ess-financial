/**
 * CalculatorForm - Multi-step investment calculator form
 *
 * Features:
 * - 4-step wizard: Basic Info → Costs → Operations → Financing
 * - Real-time calculation with debouncing
 * - Progress indicator
 * - Form validation with React Hook Form + Zod
 */

import React, { useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { ProjectInput, ProjectInputSchema } from '../domain/schemas/ProjectSchema';
import { useCalculator } from '../hooks/useCalculator';
import { useUIStore } from '../stores/uiStore';
import { QuickFillButton } from './QuickFillButton';

// Import step components
import { BasicInfoStep } from './form-steps/BasicInfoStep';
import { CostsStep } from './form-steps/CostsStep';
import { OperationsStep } from './form-steps/OperationsStep';
import { OperatingCostsStep } from './form-steps/OperatingCostsStep';
import { FinancingStep } from './form-steps/FinancingStep';
// Import new business-driven workflow steps directly
import { OwnerInfoStep } from './form-steps/OwnerInfoStep';
import { TariffDetailsStep } from './form-steps/TariffDetailsStep';
import { TechnicalAssessmentStep } from './form-steps/TechnicalAssessmentStep';
import { FinancialModelStep } from './form-steps/FinancialModelStep';
import { ReportOutputStep } from './form-steps/ReportOutputStep';

// Form step types
type FormStep = 0 | 1 | 2 | 3 | 4;

interface CalculatorFormProps {
  defaultValues?: Partial<ProjectInput>;
  onSubmit?: (data: ProjectInput) => void;
  onCalculate?: (data: ProjectInput) => void;
  showProgress?: boolean;
  className?: string;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  defaultValues,
  onSubmit,
  onCalculate,
  showProgress = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const { currentStep, setCurrentStep, totalSteps } = useUIStore();
  const { triggerCalculation, loading, error } = useCalculator({ debounce: 300 });

  // Initialize form with default values
  const methods = useForm<ProjectInput>({
    resolver: zodResolver(ProjectInputSchema),
    defaultValues: defaultValues || {
      province: 'guangdong',
      systemSize: {
        capacity: 2.0,
        duration: 2,
      },
      costs: {
        batteryCostPerKwh: 1200,
        pcsCostPerKw: 300,
        emsCost: 100000,
        installationCostPerKw: 150,
        gridConnectionCost: 200000,
        landCost: 0,
        developmentCost: 150000,
        permittingCost: 50000,
        contingencyPercent: 0.05,
      },
      operatingParams: {
        systemEfficiency: 0.88,
        depthOfDischarge: 0.90,
        cyclesPerDay: 1.5,
        degradationRate: 0.02,
        availabilityPercent: 0.97,
      },
      operatingCosts: {
        // 人力成本
        operationsStaffCost: 500000,
        managementCost: 300000,
        technicalSupportCost: 200000,
        // 办公成本
        officeRent: 100000,
        officeExpenses: 50000,
        // 维护成本
        regularMaintenanceCost: 200000,
        preventiveMaintenanceCost: 80000,
        // 保险费用
        equipmentInsurance: 100000,
        liabilityInsurance: 50000,
        propertyInsurance: 30000,
        // 其他运营费用
        licenseFee: 50000,
        regulatoryFee: 20000,
        trainingCost: 30000,
        utilitiesCost: 20000,
        landLeaseCost: 100000,
        // 销售费用
        salesExpenses: 303818,
        // 税费
        vatRate: 0.06,
        surtaxRate: 0.12,
        corporateTaxRate: 0.25,
      },
      financing: {
        hasLoan: false,
        equityRatio: 1.0, // 100% self-funded by default
        taxHolidayYears: 6, // 6 years VAT holiday
      },
      // NEW: Default values for business-driven fields
      ownerInfo: {
        companyName: '',
        industry: '',
        companyScale: 'medium',
        creditRating: 'AA',
        paymentHistory: 'good',
        collaborationModel: 'emc',
        contractDuration: 10,
        revenueShareRatio: 50, // 投资方分成比例
        // ownerShareRatio is auto-calculated as (100 - revenueShareRatio)
      },
      facilityInfo: {
        transformerCapacity: 1000,
        voltageLevel: '0.4kV',
        avgMonthlyLoad: 50000,
        peakLoad: 500,
        availableArea: 500,
        roofType: 'flat',
        needsExpansion: false,
        commissionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      },
      tariffDetail: {
        tariffType: 'industrial',
        peakPrice: 1.0,
        valleyPrice: 0.4,
        flatPrice: 0.6,
        hourlyPrices: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          price: hour >= 8 && hour <= 11 ? 1.0 : hour >= 23 || hour <= 6 ? 0.4 : 0.6,
          period: hour >= 8 && hour <= 11 ? ('peak' as const) : hour >= 23 || hour <= 6 ? ('valley' as const) : ('flat' as const),
        })),
      },
      technicalProposal: {
        recommendedCapacity: 2.0,
        recommendedPower: 1.0,
        capacityPowerRatio: 2.0,
        chargeStrategy: 'arbitrage_only',
        cycleLife: 6000,
        expectedThroughput: 10800,
        optimizedFor: 'balanced',
      },
    },
    mode: 'onChange',
  });

  const { watch, handleSubmit, trigger } = methods;

  // Watch all form values for auto-calculation
  const formValues = watch();

  // Auto-calculate on form changes (debounced via useCalculator hook)
  useEffect(() => {
    const validateAndCalculate = async () => {
      const isValid = await trigger();
      console.log('🔍 Form validation:', isValid, 'onCalculate exists:', !!onCalculate);
      console.log('📋 formValues keys:', Object.keys(formValues));
      console.log('📋 formValues:', JSON.stringify(formValues, null, 2));
      if (isValid && onCalculate) {
        console.log('📤 Calling onCalculate with formValues');
        onCalculate(formValues);
      } else {
        console.log('⚠️ Validation failed or no onCalculate callback');
      }
    };

    const timeoutId = setTimeout(validateAndCalculate, 300);
    return () => clearTimeout(timeoutId);
  }, [formValues, trigger, onCalculate]);

  // Navigation handlers - Validate current step fields only
  const goToNextStep = useCallback(async () => {
    // Define required fields for each step
    const stepRequiredFields = {
      0: ['ownerInfo.companyName', 'ownerInfo.industry', 'ownerInfo.collaborationModel', 'ownerInfo.contractDuration', 'facilityInfo.transformerCapacity', 'facilityInfo.voltageLevel', 'facilityInfo.availableArea', 'facilityInfo.roofType', 'facilityInfo.commissionDate'],
      1: ['tariffDetail.tariffType', 'tariffDetail.peakPrice', 'tariffDetail.valleyPrice', 'tariffDetail.flatPrice', 'tariffDetail.hourlyPrices'],
      2: [], // Technical assessment - auto-generated, no required input
      3: [], // Financial model - auto-calculated, no required input
      4: [], // Report output - no input required
    };

    const requiredFields = stepRequiredFields[currentStep as keyof typeof stepRequiredFields] || [];

    if (requiredFields.length > 0) {
      // Try to validate each required field individually
      let allValid = true;
      for (const field of requiredFields) {
        const fieldValid = await trigger(field as any);
        if (!fieldValid) {
          console.log(`❌ Field ${field} validation failed`);
          allValid = false;
        }
      }

      if (allValid && currentStep < totalSteps - 1) {
        setCurrentStep((currentStep + 1) as FormStep);
        console.log(`✅ Moved to step ${currentStep + 1}`);
      } else {
        console.error('❌ Navigation blocked - validation failed for step', currentStep);
      }
    } else {
      // No validation required - just navigate
      if (currentStep < totalSteps - 1) {
        setCurrentStep((currentStep + 1) as FormStep);
        console.log(`✅ Moved to step ${currentStep + 1} (no validation)`);
      }
    }
  }, [currentStep, totalSteps, trigger, setCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as FormStep);
    }
  }, [currentStep, setCurrentStep]);

  const goToStep = useCallback((step: FormStep) => {
    setCurrentStep(step);
  }, [setCurrentStep]);

  // Form submission handler
  const handleFormSubmit = useCallback((data: ProjectInput) => {
    if (onSubmit) {
      onSubmit(data);
    }
  }, [onSubmit]);

  // Step configuration - NEW: Business-driven 5-step workflow
  const steps = [
    {
      title: t('calculator.steps.ownerInfo'),
      component: OwnerInfoStep,
    },
    {
      title: t('calculator.steps.tariffDetails'),
      component: TariffDetailsStep,
    },
    {
      title: t('calculator.steps.technicalAssessment'),
      component: TechnicalAssessmentStep,
    },
    {
      title: t('calculator.steps.financialModel'),
      component: FinancialModelStep,
    },
    {
      title: t('calculator.steps.reportOutput'),
      component: ReportOutputStep,
    },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className={`calculator-form ${className}`}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Progress Indicator */}
          {showProgress && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('calculator.title')}
                  </h2>
                  <QuickFillButton />
                </div>
                <span className="text-sm text-gray-500">
                  {t('common.step')} {currentStep + 1} {t('common.of')} {totalSteps}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  {steps.map((step, index) => (
                    <React.Fragment key={index}>
                      <button
                        type="button"
                        onClick={() => goToStep(index as FormStep)}
                        className={`flex flex-col items-center focus:outline-none ${
                          index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                        disabled={index > currentStep}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                          index === currentStep
                            ? 'bg-blue-600 text-white'
                            : index < currentStep
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {index < currentStep ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span className={`mt-2 text-xs font-medium ${
                          index === currentStep ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </span>
                      </button>
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-1 mx-2 mt-5 ${
                          index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Current Step Component */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-red-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                      {t('errors.calculation')}
                    </h3>
                    <p className="mt-1 text-sm text-red-700">{error.message}</p>
                  </div>
                </div>
              </div>
            )}

            <CurrentStepComponent />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                currentStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t('common.previous')}
            </button>

            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                {t('common.next')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? t('common.loading') : t('results.actions.save')}
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default CalculatorForm;
