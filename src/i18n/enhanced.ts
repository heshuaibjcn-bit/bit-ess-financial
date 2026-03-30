/**
 * Enhanced Internationalization
 *
 * Advanced i18n system with:
 * - Namespace support
 * - Pluralization
 * - Date/number formatting
 * - RTL support
 * - Language switching with persistence
 * - Context-aware translations
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getCurrentLanguage as getBaseCurrentLanguage } from './config';

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = ['zh', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Language metadata
 */
export const LANGUAGE_META: Record<SupportedLanguage, {
  name: string;
  nativeName: string;
  flag: string;
  locale: string;
  direction: 'ltr' | 'rtl';
}> = {
  zh: {
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    locale: 'zh-CN',
    direction: 'ltr',
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    locale: 'en-US',
    direction: 'ltr',
  },
};

/**
 * Translation namespaces
 */
export const NAMESPACES = {
  COMMON: 'common',
  PROJECT: 'project',
  CALCULATOR: 'calculator',
  VALIDATION: 'validation',
  ERRORS: 'errors',
} as const;

/**
 * Get current language
 */
export function getCurrentLanguage(): SupportedLanguage {
  return getBaseCurrentLanguage() as SupportedLanguage;
}

/**
 * Get language metadata
 */
export function getLanguageMeta(language: SupportedLanguage) {
  return LANGUAGE_META[language];
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES.map(lang => ({
    code: lang,
    ...LANGUAGE_META[lang],
  }));
}

/**
 * Change language with persistence and side effects
 */
export async function changeLanguage(
  language: SupportedLanguage,
  options?: {
    persist?: boolean;
    reload?: boolean;
    onBeforeChange?: () => void;
    onAfterChange?: () => void;
  }
): Promise<void> {
  const { persist = true, reload = false, onBeforeChange, onAfterChange } = options || {};

  try {
    onBeforeChange?.();

    // Change language
    await i18n.changeLanguage(language);

    // Persist preference
    if (persist) {
      localStorage.setItem('ess_language', language);
    }

    // Update document attributes
    document.documentElement.lang = LANGUAGE_META[language].locale;
    document.documentElement.dir = LANGUAGE_META[language].direction;

    onAfterChange?.();

    // Reload if requested
    if (reload) {
      window.location.reload();
    }
  } catch (error) {
    console.error('Failed to change language:', error);
    throw error;
  }
}

/**
 * Enhanced formatting utilities
 */
export const FormatUtils = {
  /**
   * Format currency with options
   */
  currency(
    amount: number,
    options?: {
      language?: SupportedLanguage;
      currency?: string;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  ): string {
    const language = options?.language || getCurrentLanguage();
    const locale = LANGUAGE_META[language].locale;

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: options?.currency || 'CNY',
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    }).format(amount);
  },

  /**
   * Format percentage with options
   */
  percentage(
    value: number,
    options?: {
      language?: SupportedLanguage;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  ): string {
    const language = options?.language || getCurrentLanguage();
    const locale = LANGUAGE_META[language].locale;

    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }).format(value / 100);
  },

  /**
   * Format number with options
   */
  number(
    value: number,
    options?: {
      language?: SupportedLanguage;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      useGrouping?: boolean;
    }
  ): string {
    const language = options?.language || getCurrentLanguage();
    const locale = LANGUAGE_META[language].locale;

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits,
      useGrouping: options?.useGrouping ?? true,
    }).format(value);
  },

  /**
   * Format date with options
   */
  date(
    date: Date | string,
    options?: {
      language?: SupportedLanguage;
      format?: 'full' | 'long' | 'medium' | 'short';
    }
  ): string {
    const language = options?.language || getCurrentLanguage();
    const locale = LANGUAGE_META[language].locale;
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const formatOptions = {
      full: {
        year: 'numeric' as const,
        month: 'long' as const,
        day: 'numeric' as const,
        weekday: 'long' as const,
      },
      long: {
        year: 'numeric' as const,
        month: 'long' as const,
        day: 'numeric' as const,
      },
      medium: {
        year: 'numeric' as const,
        month: 'short' as const,
        day: 'numeric' as const,
      },
      short: {
        year: '2-digit' as const,
        month: 'numeric' as const,
        day: 'numeric' as const,
      },
    };

    return new Intl.DateTimeFormat(locale, formatOptions[options?.format || 'long']).format(dateObj);
  },

  /**
   * Format time with options
   */
  time(
    date: Date | string,
    options?: {
      language?: SupportedLanguage;
      format?: 'full' | 'long' | 'medium' | 'short';
    }
  ): string {
    const language = options?.language || getCurrentLanguage();
    const locale = LANGUAGE_META[language].locale;
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const formatOptions = {
      full: {
        hour: 'numeric' as const,
        minute: 'numeric' as const,
        second: 'numeric' as const,
        timeZoneName: 'short' as const,
      },
      long: {
        hour: 'numeric' as const,
        minute: 'numeric' as const,
        second: 'numeric' as const,
      },
      medium: {
        hour: 'numeric' as const,
        minute: 'numeric' as const,
      },
      short: {
        hour: 'numeric' as const,
        minute: 'numeric' as const,
      },
    };

    return new Intl.DateTimeFormat(locale, formatOptions[options?.format || 'medium']).format(dateObj);
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  relativeTime(
    date: Date | string,
    options?: {
      language?: SupportedLanguage;
    }
  ): string {
    const language = options?.language || getCurrentLanguage();
    const locale = LANGUAGE_META[language].locale;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffSeconds < 60) {
      return rtf.format(-diffSeconds, 'second');
    } else if (diffMinutes < 60) {
      return rtf.format(-diffMinutes, 'minute');
    } else if (diffHours < 24) {
      return rtf.format(-diffHours, 'hour');
    } else if (diffDays < 30) {
      return rtf.format(-diffDays, 'day');
    } else if (diffMonths < 12) {
      return rtf.format(-diffMonths, 'month');
    } else {
      return rtf.format(-diffYears, 'year');
    }
  },

  /**
   * Format file size
   */
  fileSize(
    bytes: number,
    options?: {
      language?: SupportedLanguage;
      decimals?: number;
    }
  ): string {
    const language = options?.language || getCurrentLanguage();
    const decimals = options?.decimals ?? 2;

    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
    const unit = sizes[i];

    // Use formatNumber for proper localization
    return FormatUtils.number(value, { language, minimumFractionDigits: decimals }) + ' ' + unit;
  },

  /**
   * Format list (e.g., "A, B, and C")
   */
  list(
    items: string[],
    options?: {
      language?: SupportedLanguage;
      style?: 'long' | 'short' | 'narrow';
    }
  ): string {
    const language = options?.language || getCurrentLanguage();
    const locale = LANGUAGE_META[language].locale;

    return new Intl.ListFormat(locale, {
      style: options?.style || 'long',
    }).format(items);
  },
};

/**
 * Pluralization helper
 */
export function pluralize(
  count: number,
  options: {
    zero?: string;
    one: string;
    other: string;
    language?: SupportedLanguage;
  }
): string {
  const language = options?.language || getCurrentLanguage();

  // Use Intl.PluralRules for language-aware pluralization
  const pr = new Intl.PluralRules(LANGUAGE_META[language].locale);
  const rule = pr.select(count);

  switch (rule) {
    case 'zero':
      return options.zero || options.other;
    case 'one':
      return options.one;
    case 'two':
    case 'few':
    case 'many':
    case 'other':
    default:
      return options.other;
  }
}

/**
 * Translation helper with context
 */
export function translate(
  key: string,
  options?: {
    ns?: string;
    defaultValue?: string;
    count?: number;
    replace?: Record<string, string | number>;
    language?: SupportedLanguage;
  }
): string {
  const language = options?.language || getCurrentLanguage();
  const i18nOptions: any = {
    ns: options?.ns,
    defaultValue: options?.defaultValue,
    lng: language,
  };

  if (options?.count !== undefined) {
    i18nOptions.count = options.count;
  }

  let translation = i18n.t(key, i18nOptions);

  // Replace variables
  if (options?.replace) {
    Object.entries(options.replace).forEach(([placeholder, value]) => {
      translation = translation.replace(
        new RegExp(`{{${placeholder}}}`, 'g'),
        String(value)
      );
    });
  }

  return translation;
}

/**
 * Check if language is RTL
 */
export function isRTL(language?: SupportedLanguage): boolean {
  const lang = language || getCurrentLanguage();
  return LANGUAGE_META[lang].direction === 'rtl';
}

/**
 * Get text direction for current language
 */
export function getTextDirection(language?: SupportedLanguage): 'ltr' | 'rtl' {
  const lang = language || getCurrentLanguage();
  return LANGUAGE_META[lang].direction;
}

/**
 * Initialize enhanced i18n with defaults
 */
export function initializeEnhancedI18n() {
  // Load persisted language preference
  const persistedLanguage = localStorage.getItem('ess_language') as SupportedLanguage;
  if (persistedLanguage && SUPPORTED_LANGUAGES.includes(persistedLanguage)) {
    i18n.changeLanguage(persistedLanguage);
  }

  // Set initial HTML attributes
  const currentLanguage = getCurrentLanguage();
  document.documentElement.lang = LANGUAGE_META[currentLanguage].locale;
  document.documentElement.dir = LANGUAGE_META[currentLanguage].direction;
}

/**
 * React hook for enhanced i18n
 */
export function useEnhancedI18n() {
  const currentLanguage = getCurrentLanguage();

  return {
    language: currentLanguage,
    languageMeta: LANGUAGE_META[currentLanguage],
    isRTL: isRTL(currentLanguage),
    format: FormatUtils,
    pluralize: (count: number, options: Omit<Parameters<typeof pluralize>[1], 'language'>) =>
      pluralize(count, { ...options, language: currentLanguage }),
    translate: (key: string, options?: Omit<Parameters<typeof translate>[1], 'language'>) =>
      translate(key, { ...options, language: currentLanguage }),
    changeLanguage: (language: SupportedLanguage) => changeLanguage(language, { reload: false }),
  };
}
