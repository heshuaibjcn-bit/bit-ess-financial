/**
 * calculationStore - Manages calculation results state
 *
 * Handles:
 * - Calculation loading/error states
 * - Result caching
 * - Auto-calculation on project changes
 */

import { create } from 'zustand';
import { calculationEngine } from '@/domain/services/CalculationEngine';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';
import type { EngineResult } from '@/domain/services/CalculationEngine';

/**
 * Generate cache key from project input
 */
function generateCacheKey(input: ProjectInput): string {
  return JSON.stringify(input);
}

/**
 * Calculation store state
 */
interface CalculationState {
  // Result state
  result: EngineResult | null;
  loading: boolean;
  error: string | null;
  lastInput: ProjectInput | null;

  // Metadata
  lastCalculated: Date | null;
  cacheKey: string | null;

  // Actions
  calculate: (input: ProjectInput, options?: any) => Promise<EngineResult>;
  clearResult: () => void;
  clearError: () => void;
  retry: () => Promise<void>;

  // Computed values (selectors)
  isValid: boolean;
  hasResult: boolean;
  recommendation: number;
}

/**
 * Calculation store
 */
export const useCalculationStore = create<CalculationState>((set, get) => ({
  // Initial state
  result: null,
  loading: false,
  error: null,
  lastInput: null,
  lastCalculated: null,
  cacheKey: null,

  // Calculate project
  calculate: async (input, options) => {
    const cacheKey = generateCacheKey(input);
    const currentCacheKey = get().cacheKey;

    // Return cached result if available
    if (currentCacheKey === cacheKey && get().result) {
      return get().result!;
    }

    set({ loading: true, error: null });

    try {
      const result = await calculationEngine.calculateProject(input, options);

      set({
        result,
        loading: false,
        lastCalculated: new Date(),
        cacheKey,
        lastInput: input,
        error: null,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '计算失败';
      set({
        loading: false,
        error: errorMessage,
        lastInput: input,
      });
      throw error;
    }
  },

  // Clear result
  clearResult: () => {
    set({
      result: null,
      cacheKey: null,
      lastCalculated: null,
      lastInput: null,
      error: null,
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Retry last calculation
  retry: async () => {
    const { lastInput } = get();

    if (!lastInput) {
      throw new Error('No previous calculation to retry');
    }

    set({ error: null, loading: true });

    try {
      const result = await calculationEngine.calculateProject(lastInput);
      set({
        result,
        loading: false,
        lastCalculated: new Date(),
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重试计算失败';
      set({
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // Computed: Is result valid
  get isValid() {
    const { result } = get();
    return result?.validation.valid ?? false;
  },

  // Computed: Has result
  get hasResult() {
    const { result } = get();
    return result !== null;
  },

  // Computed: Recommendation rating (1-5)
  get recommendation() {
    const { result } = get();
    if (!result) return 0;

    const irr = result.metrics.irr;
    if (irr === null) return 1;
    if (irr < 0) return 1;
    if (irr < 6) return 2;
    if (irr < 10) return 3;
    if (irr < 15) return 4;
    return 5;
  },
}));

/**
 * Selector hooks for common use cases
 */
export const useCalculationResult = () => useCalculationStore((state) => state.result);
export const useCalculationLoading = () => useCalculationStore((state) => state.loading);
export const useCalculationError = () => useCalculationStore((state) => state.error);
export const useIsCalculating = () => useCalculationStore((state) => state.loading);
export const useLastCalculated = () => useCalculationStore((state) => state.lastCalculated);

/**
 * Hook to auto-calculate when project changes
 */
export const useAutoCalculate = (debounceMs = 500) => {
  const calculate = useCalculationStore((state) => state.calculate);
  const loading = useCalculationStore((state) => state.loading);

  let timeoutId: NodeJS.Timeout | null = null;

  const triggerCalculation = async (input: ProjectInput | null, options?: any) => {
    if (!input || loading) return;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(async () => {
      try {
        await calculate(input, options);
      } catch (error) {
        // Error is stored in the store
        console.error('Auto-calculation failed:', error);
      }
    }, debounceMs);
  };

  return { triggerCalculation };
};

/**
 * Helper hook for computed values
 */
export const useComputedMetrics = () => {
  const result = useCalculationStore((state) => state.result);

  if (!result) {
    return {
      irr: null,
      npv: 0,
      roi: 0,
      lcoc: 0,
      profitMargin: 0,
      paybackPeriod: -1,
    };
  }

  return {
    irr: result.metrics.irr,
    npv: result.metrics.npv,
    roi: result.metrics.roi,
    lcoc: result.metrics.lcoc,
    profitMargin: result.metrics.profitMargin,
    paybackPeriod: result.paybackPeriod,
  };
};

/**
 * Helper hook for investment recommendation
 */
export const useRecommendation = () => {
  const result = useCalculationStore((state) => state.result);
  const recommendation = useCalculationStore((state) => state.recommendation);

  if (!result) {
    return {
      rating: 0,
      label: '未计算',
      description: '请先完成项目参数输入',
    };
  }

  const labels = ['不推荐', '较差', '一般', '良好', '优秀'];
  const descriptions = [
    '项目无法盈利或存在异常',
    '内部收益率低于6%，投资回报较低',
    '内部收益率6-10%，投资回报一般',
    '内部收益率10-15%，投资回报良好',
    '内部收益率超过15%，投资回报优秀',
  ];

  return {
    rating: recommendation as 1 | 2 | 3 | 4 | 5,
    label: labels[recommendation - 1] || '未知',
    description: descriptions[recommendation - 1] || '',
  };
};
