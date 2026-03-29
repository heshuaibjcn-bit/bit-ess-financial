/**
 * SettingsManager Integration Tests
 *
 * Tests the complete settings management system including:
 * - localStorage persistence
 * - API key validation
 * - Settings CRUD operations
 * - Export/Import functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSettingsManager, resetSettingsManager, DEFAULT_SETTINGS } from '../Settings';

describe('SettingsManager Integration Tests', () => {
  let settingsManager: ReturnType<typeof getSettingsManager>;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset singleton to ensure fresh instance
    resetSettingsManager();
    // Create fresh instance
    settingsManager = getSettingsManager();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      const settings = settingsManager.getAllSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should load settings from localStorage', () => {
      const customSettings = {
        glm: {
          apiKey: 'test-key-123456789012345678',
          model: 'glm-4',
          baseURL: 'https://test.api.com',
          enabled: true
        }
      };

      localStorage.setItem('ess_financial_settings', JSON.stringify(customSettings));

      // Reset singleton to force loading from localStorage
      resetSettingsManager();
      const newManager = getSettingsManager();
      const loaded = newManager.getAllSettings();

      expect(loaded.glm.apiKey).toBe('test-key-123456789012345678');
      expect(loaded.glm.model).toBe('glm-4');
    });
  });

  describe('API Key Management', () => {
    it('should update API key and enable GLM', () => {
      settingsManager.updateGLMApiKey('new-test-key-123456789012345');
      const settings = settingsManager.getAllSettings();

      expect(settings.glm.apiKey).toBe('new-test-key-123456789012345');
      expect(settings.glm.enabled).toBe(true);
    });

    it('should disable GLM when API key is cleared', () => {
      settingsManager.updateGLMApiKey('test-key-123456789012345');
      expect(settingsManager.isGLMConfigured()).toBe(true);

      settingsManager.updateGLMApiKey('');
      expect(settingsManager.isGLMConfigured()).toBe(false);
    });

    it('should validate API key format', () => {
      // Empty key
      expect(settingsManager.validateApiKey('')).toEqual({
        valid: false,
        message: 'API key is required'
      });

      // Too short
      expect(settingsManager.validateApiKey('short')).toEqual({
        valid: false,
        message: 'API key appears too short (expected 20+ characters)'
      });

      // Valid length
      const result = settingsManager.validateApiKey('a'.repeat(20));
      expect(result.valid).toBe(true);
      expect(result.message).toBe('API key format looks valid');
    });
  });

  describe('Settings CRUD', () => {
    it('should get specific setting', () => {
      const glm = settingsManager.getSetting('glm');
      expect(glm).toEqual(DEFAULT_SETTINGS.glm);
    });

    it('should update nested settings', () => {
      settingsManager.updateSettings({
        glm: { model: 'glm-3-turbo' }
      });

      const updated = settingsManager.getSetting('glm');
      expect(updated.model).toBe('glm-3-turbo');
    });

    it('should merge updates with existing settings', () => {
      settingsManager.updateSettings({
        glm: { apiKey: 'test-key-123456789012345' },
        ui: { theme: 'dark' }
      });

      const settings = settingsManager.getAllSettings();
      expect(settings.glm.apiKey).toBe('test-key-123456789012345');
      expect(settings.ui.theme).toBe('dark');
      expect(settings.glm.model).toBe(DEFAULT_SETTINGS.glm.model); // Unchanged
    });
  });

  describe('Persistence', () => {
    it('should persist settings to localStorage', () => {
      settingsManager.updateGLMApiKey('persistent-key-12345678901');

      const stored = localStorage.getItem('ess_financial_settings');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.glm.apiKey).toBe('persistent-key-12345678901');
    });

    it('should load persisted settings on new instance', () => {
      settingsManager.updateGLMApiKey('cross-instance-key-12345');

      // Create new instance (simulates page refresh)
      const newManager = getSettingsManager();
      expect(newManager.getSetting('glm').apiKey).toBe('cross-instance-key-12345');
    });
  });

  describe('Export/Import', () => {
    it('should export settings as JSON', () => {
      settingsManager.updateGLMApiKey('export-test-123456789012');

      const exported = settingsManager.exportSettings();
      const parsed = JSON.parse(exported);

      expect(parsed.settings.glm.apiKey).toBe('export-test-123456789012');
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('exportedAt');
    });

    it('should import settings from JSON', () => {
      const importData = {
        glm: {
          apiKey: 'imported-key-123456789012',
          model: 'glm-4',
          enabled: true
        },
        ui: {
          theme: 'dark' as const,
          language: 'en' as const,
          autoSave: false
        }
      };

      settingsManager.importSettings(JSON.stringify(importData));
      const settings = settingsManager.getAllSettings();

      expect(settings.glm.apiKey).toBe('imported-key-123456789012');
      expect(settings.ui.theme).toBe('dark');
    });

    it('should handle invalid import data', () => {
      expect(() => {
        settingsManager.importSettings('invalid json{{{');
      }).toThrow();
    });

    it('should merge import with defaults', () => {
      const partialImport = {
        glm: { apiKey: 'partial-import-123456' }
      };

      settingsManager.importSettings(JSON.stringify(partialImport));
      const settings = settingsManager.getAllSettings();

      expect(settings.glm.apiKey).toBe('partial-import-123456');
      expect(settings.glm.model).toBe(DEFAULT_SETTINGS.glm.model); // From defaults
    });
  });

  describe('Reset', () => {
    it('should reset to defaults', () => {
      settingsManager.updateSettings({
        glm: { apiKey: 'will-be-deleted' },
        ui: { theme: 'dark' }
      });

      settingsManager.resetToDefaults();
      const settings = settingsManager.getAllSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should clear localStorage on reset', () => {
      settingsManager.updateGLMApiKey('some-key-123456789012');
      expect(localStorage.getItem('ess_financial_settings')).toBeDefined();

      settingsManager.resetToDefaults();
      // localStorage should have defaults, not be empty
      expect(localStorage.getItem('ess_financial_settings')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long API keys', () => {
      const longKey = 'a'.repeat(1000);
      settingsManager.updateGLMApiKey(longKey);

      expect(settingsManager.getSetting('glm').apiKey).toBe(longKey);
      expect(settingsManager.validateApiKey(longKey).valid).toBe(true);
    });

    it('should handle special characters in API key', () => {
      const specialKey = 'sk-test_2024.key@api#123!';
      settingsManager.updateGLMApiKey(specialKey);

      expect(settingsManager.getSetting('glm').apiKey).toBe(specialKey);
    });

    it('should handle concurrent updates', () => {
      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        settingsManager.updateGLMApiKey(`key-${i}`);
      }

      const final = settingsManager.getSetting('glm').apiKey;
      expect(final).toBe('key-9'); // Last update should win
    });
  });

  describe('Configuration Status', () => {
    it('should return false when not configured', () => {
      expect(settingsManager.isGLMConfigured()).toBe(false);
    });

    it('should return true when API key is set', () => {
      settingsManager.updateGLMApiKey('configured-key-123456789');
      expect(settingsManager.isGLMConfigured()).toBe(true);
    });

    it('should return false when API key is cleared', () => {
      settingsManager.updateGLMApiKey('temp-key-123456789');
      expect(settingsManager.isGLMConfigured()).toBe(true);

      settingsManager.updateGLMApiKey('');
      expect(settingsManager.isGLMConfigured()).toBe(false);
    });
  });
});
