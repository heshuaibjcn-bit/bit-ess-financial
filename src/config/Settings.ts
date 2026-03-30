/**
 * Application Settings Management
 *
 * Centralized configuration for:
 * - API keys (GLM, external services)
 * - Model selection
 * - Feature flags
 * - User preferences
 */

export interface AppSettings {
  // GLM API Configuration
  glm: {
    apiKey: string;
    model: string;
    baseURL?: string;
    enabled: boolean;
  };

  // Data Integration Settings
  dataIntegration: {
    policy: {
      enabled: boolean;
      updateInterval: number; // milliseconds
    };
    tariff: {
      enabled: boolean;
      updateInterval: number;
    };
    company: {
      enabled: boolean;
      cache: boolean;
    };
  };

  // Agent Settings
  agents: {
    retryConfig: {
      maxRetries: number;
      initialDelay: number;
      maxDelay: number;
      backoffMultiplier: number;
      jitter: boolean;
    };
    rateLimit: {
      capacity: number;
      refillRate: number;
      enabled: boolean;
    };
  };

  // UI Settings
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'zh' | 'en';
    autoSave: boolean;
  };
}

/**
 * Default settings (deep frozen to prevent mutation)
 */
const DEFAULT_SETTINGS_RAW: AppSettings = {
  glm: {
    apiKey: '',
    model: 'glm-4',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    enabled: false
  },

  dataIntegration: {
    policy: {
      enabled: true,
      updateInterval: 3600000 // 1 hour
    },
    tariff: {
      enabled: true,
      updateInterval: 86400000 // 24 hours
    },
    company: {
      enabled: true,
      cache: true
    }
  },

  agents: {
    retryConfig: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true
    },
    rateLimit: {
      capacity: 10,
      refillRate: 2,
      enabled: true
    }
  },

  ui: {
    theme: 'light',
    language: 'zh',
    autoSave: true
  }
};

/**
 * Deep freeze an object to make it immutable
 */
function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Freeze all nested objects
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] !== null && typeof obj[key] === 'object') {
      deepFreeze(obj[key]);
    }
  }

  return Object.freeze(obj);
}

export const DEFAULT_SETTINGS = deepFreeze(DEFAULT_SETTINGS_RAW);

/**
 * Settings Manager Class
 */
class SettingsManager {
  private readonly STORAGE_KEY = 'ess_financial_settings';
  private settings: AppSettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return this.mergeSettings(DEFAULT_SETTINGS, parsed);
      }
    } catch (error) {
      console.warn('Failed to load settings from storage:', error);
    }
    // Deep clone to avoid references to frozen DEFAULT_SETTINGS
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  /**
   * Deep merge two objects
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== undefined) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (
          sourceValue !== null &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue !== null &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          // Recursively merge nested objects
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          // Override with source value
          result[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }

    return result;
  }

  /**
   * Merge settings (deep merge for nested objects)
   */
  private mergeSettings(defaults: AppSettings, user: Partial<AppSettings>): AppSettings {
    return this.deepMerge(defaults, user);
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings to storage:', error);
      throw new Error('Failed to save settings: ' + error);
    }
  }

  /**
   * Get all settings
   */
  getAllSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Get specific setting
   */
  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<AppSettings>): AppSettings {
    this.settings = this.mergeSettings(this.settings, updates);
    this.saveSettings();
    return { ...this.settings };
  }

  /**
   * Update GLM API key
   */
  updateGLMApiKey(apiKey: string): void {
    this.settings.glm.apiKey = apiKey;
    this.settings.glm.enabled = apiKey.length > 0;
    this.saveSettings();

    // Also save to localStorage for NanoAgent compatibility
    localStorage.setItem('glm_api_key', apiKey);
  }

  /**
   * Validate API key format
   */
  validateApiKey(apiKey: string): { valid: boolean; message: string } {
    if (!apiKey) {
      return { valid: false, message: 'API key is required' };
    }

    if (apiKey.length < 20) {
      return { valid: false, message: 'API key appears too short (expected 20+ characters)' };
    }

    return { valid: true, message: 'API key format looks valid' };
  }

  /**
   * Check if GLM API is configured
   */
  isGLMConfigured(): boolean {
    return this.settings.glm.enabled &&
           this.settings.glm.apiKey.length > 0;
  }

  /**
   * Reset settings to defaults
   */
  resetToDefaults(): void {
    // Clear localStorage first to ensure we don't reload stale data
    localStorage.removeItem(this.STORAGE_KEY);

    // Deep clone defaults to get mutable copy
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    // Save the clean defaults
    this.saveSettings();
  }

  /**
   * Export settings (for backup)
   */
  exportSettings(): string {
    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: this.settings
    }, null, 2);
  }

  /**
   * Import settings (from backup)
   */
  importSettings(json: string): void {
    try {
      const parsed = JSON.parse(json);
      // Handle both new format (with settings wrapper) and old format (direct settings)
      const settingsData = parsed.settings || parsed;
      this.settings = this.mergeSettings(DEFAULT_SETTINGS, settingsData);
      this.saveSettings();
    } catch (error) {
      throw new Error('Invalid settings file: ' + error);
    }
  }
}

// Singleton instance
let settingsManagerInstance: SettingsManager | null = null;

export function getSettingsManager(): SettingsManager {
  if (!settingsManagerInstance) {
    settingsManagerInstance = new SettingsManager();
  }
  return settingsManagerInstance;
}

/**
 * Initialize AI configuration from environment variables
 * This should be called once on app startup
 */
export function initializeAIConfig(): void {
  // Check if we have environment variables configured
  const envGlmKey = import.meta.env.VITE_GLM_API_KEY;
  const envAnthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  // Initialize GLM API key from environment if:
  // 1. Environment variable is set
  // 2. localStorage doesn't already have a key (user hasn't manually configured)
  if (envGlmKey && !localStorage.getItem('glm_api_key')) {
    localStorage.setItem('glm_api_key', envGlmKey);
    console.log('[AI Config] Initialized GLM API key from environment');
  }

  // Initialize Anthropic API key from environment
  if (envAnthropicKey && !localStorage.getItem('anthropic_api_key')) {
    localStorage.setItem('anthropic_api_key', envAnthropicKey);
    console.log('[AI Config] Initialized Anthropic API key from environment');
  }

  // Sync with settings manager
  const settingsManager = getSettingsManager();
  const storedGlmKey = localStorage.getItem('glm_api_key');
  if (storedGlmKey && !settingsManager.isGLMConfigured()) {
    settingsManager.updateGLMApiKey(storedGlmKey);
  }
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetSettingsManager(): void {
  settingsManagerInstance = null;
}
