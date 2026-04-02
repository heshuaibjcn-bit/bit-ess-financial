/**
 * uiStore - Manages UI state
 *
 * Handles:
 * - Form wizard navigation
 * - Language preference
 * - Theme preference
 * - UI component states
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { ChatMessage, QuickPrompt, AIChatError } from '@/types/ai';

/**
 * UI state structure
 */
interface UIState {
  // Form wizard
  currentStep: number;
  totalSteps: number;

  // Language
  language: 'zh' | 'en';

  // Theme
  theme: 'light' | 'dark';

  // UI components
  sidebarOpen: boolean;
  showResults: boolean;
  showAdvanced: boolean;

  // Dialog states
  showSaveDialog: boolean;
  showShareDialog: boolean;
  showDeleteConfirm: boolean;

  // AI Chat
  aiChatOpen: boolean;
  chatMessages: ChatMessage[];
  isAiThinking: boolean;
  inputMessage: string;
  chatError: string | null;
  chatErrorType: AIChatError | null;
  quickPrompts: QuickPrompt[];

  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetSteps: () => void;

  setLanguage: (lang: 'zh' | 'en') => void;
  toggleLanguage: () => void;

  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  setShowResults: (show: boolean) => void;
  setShowAdvanced: (show: boolean) => void;
  toggleAdvanced: () => void;

  setShowSaveDialog: (show: boolean) => void;
  setShowShareDialog: (show: boolean) => void;
  setShowDeleteConfirm: (show: boolean) => void;

  // AI Chat actions
  setAIChatOpen: (open: boolean) => void;
  addChatMessage: (message: ChatMessage) => void;
  updateChatMessage: (id: string, content: string) => void;
  updateMessageStreamingState: (id: string, isStreaming: boolean) => void;
  removeChatMessage: (id: string) => void;
  clearChatMessages: () => void;
  setIsAiThinking: (thinking: boolean) => void;
  setInputMessage: (message: string) => void;
  setChatError: (error: string | null) => void;
  setChatErrorType: (errorType: AIChatError | null) => void;
  clearChatError: () => void;
}

/**
 * UI store with localStorage persistence
 */
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 0,
      totalSteps: 6, // Owner Info → Tariff → Technical → Financial → Analysis → Report

      language: 'zh',
      theme: 'light',

      sidebarOpen: true,
      showResults: false,
      showAdvanced: false,

      showSaveDialog: false,
      showShareDialog: false,
      showDeleteConfirm: false,

      // AI Chat initial state
      aiChatOpen: false,
      chatMessages: [],
      isAiThinking: false,
      inputMessage: '',
      chatError: null,
      chatErrorType: null,
      quickPrompts: [],

      // Form wizard navigation
      setCurrentStep: (step) => {
        const totalSteps = get().totalSteps;
        set({ currentStep: Math.max(0, Math.min(step, totalSteps - 1)) });
      },

      nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps - 1) {
          set({ currentStep: currentStep + 1 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      resetSteps: () => {
        set({ currentStep: 0 });
      },

      // Language management
      setLanguage: (lang) => {
        set({ language: lang });
      },

      toggleLanguage: () => {
        const { language } = get();
        set({ language: language === 'zh' ? 'en' : 'zh' });
      },

      // Theme management
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      // Sidebar management
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      toggleSidebar: () => {
        const { sidebarOpen } = get();
        set({ sidebarOpen: !sidebarOpen });
      },

      // Results display
      setShowResults: (show) => {
        set({ showResults: show });
      },

      // Advanced options
      setShowAdvanced: (show) => {
        set({ showAdvanced: show });
      },

      toggleAdvanced: () => {
        const { showAdvanced } = get();
        set({ showAdvanced: !showAdvanced });
      },

      // Dialog management
      setShowSaveDialog: (show) => {
        set({ showSaveDialog: show });
      },

      setShowShareDialog: (show) => {
        set({ showShareDialog: show });
      },

      setShowDeleteConfirm: (show) => {
        set({ showDeleteConfirm: show });
      },

      // AI Chat actions
      setAIChatOpen: (open) => {
        set({ aiChatOpen: open });
      },

      addChatMessage: (message) => {
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
        }));
      },

      updateChatMessage: (id, content) => {
        set((state) => ({
          chatMessages: state.chatMessages.map((msg) =>
            msg.id === id ? { ...msg, content } : msg
          ),
        }));
      },

      updateMessageStreamingState: (id, isStreaming) => {
        set((state) => ({
          chatMessages: state.chatMessages.map((msg) =>
            msg.id === id ? { ...msg, isStreaming } : msg
          ),
        }));
      },

      removeChatMessage: (id) => {
        set((state) => ({
          chatMessages: state.chatMessages.filter((msg) => msg.id !== id),
        }));
      },

      clearChatMessages: () => {
        set({ chatMessages: [] });
      },

      setIsAiThinking: (thinking) => {
        set({ isAiThinking: thinking });
      },

      setInputMessage: (message) => {
        set({ inputMessage: message });
      },

      setChatError: (error) => {
        set({ chatError: error });
      },

      setChatErrorType: (errorType) => {
        set({ chatErrorType });
      },

      clearChatError: () => {
        set({ chatError: null, chatErrorType: null });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        showAdvanced: state.showAdvanced,
      }),
    }
  )
);

/**
 * Selector hooks for common use cases
 */
export const useCurrentStep = () => useUIStore((state) => state.currentStep);
export const useTotalSteps = () => useUIStore((state) => state.totalSteps);
export const useLanguage = () => useUIStore((state) => state.language);
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen);
export const useShowResults = () => useUIStore((state) => state.showResults);
export const useShowAdvanced = () => useUIStore((state) => state.showAdvanced);

/**
 * AI Chat selector hooks
 */
export const useAIChatOpen = () => useUIStore((state) => state.aiChatOpen);
export const useChatMessages = () => useUIStore((state) => state.chatMessages);
export const useIsAiThinking = () => useUIStore((state) => state.isAiThinking);
export const useInputMessage = () => useUIStore((state) => state.inputMessage);
export const useChatError = () => useUIStore((state) => state.chatError);
export const useChatErrorType = () => useUIStore((state) => state.chatErrorType);
export const useQuickPrompts = () => useUIStore((state) => state.quickPrompts);

/**
 * Computed helper hooks
 */
export const useIsFirstStep = () => useUIStore((state) => state.currentStep === 0);
export const useIsLastStep = () => {
  const currentStep = useUIStore((state) => state.currentStep);
  const totalSteps = useUIStore((state) => state.totalSteps);
  return currentStep === totalSteps - 1;
};

/**
 * Hook to get step labels
 */
export const useStepLabels = () => {
  const language = useUIStore((state) => state.language);

  const labels = {
    zh: ['业主信息', '电价详情', '技术评估', '财务测算', '数据分析', '整体报告'],
    en: ['Owner Info', 'Tariff Details', 'Technical Assessment', 'Financial Model', 'Data Analysis', 'Report Output'],
  };

  return labels[language];
};

/**
 * Hook to get step descriptions
 */
export const useStepDescriptions = () => {
  const language = useUIStore((state) => state.language);

  const descriptions = {
    zh: [
      '收集业主背景、合作模式、电力设施情况',
      '展示当地分时电价政策，24小时分布图',
      '基于前两步数据，智能推荐系统配置',
      '基于合作模式和技术方案计算财务指标',
      '敏感性分析、基准对比和项目评估',
      '生成专业投资评估报告',
    ],
    en: [
      'Collect owner background, collaboration model, and facility information',
      'Display local TOU tariff policy and 24-hour distribution chart',
      'AI-recommended system configuration based on previous data',
      'Calculate financial metrics based on collaboration model and technical proposal',
      'Sensitivity analysis, benchmark comparison, and project evaluation',
      'Generate professional investment assessment report',
    ],
  };

  return descriptions[language];
};

/**
 * Initialize theme on store creation
 */
if (typeof window !== 'undefined') {
  const theme = useUIStore.getState().theme;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
}
