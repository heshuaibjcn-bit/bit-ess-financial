// Test script to verify API configuration
console.log('=== AI API Configuration Test ===\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   VITE_GLM_API_KEY:', import.meta.env.VITE_GLM_API_KEY ? '✅ Set' : '❌ Not set');
console.log('   VITE_AI_PROVIDER:', import.meta.env.VITE_AI_PROVIDER || '❌ Not set');

// Check localStorage
console.log('\n2. LocalStorage:');
console.log('   glm_api_key:', localStorage.getItem('glm_api_key') ? '✅ Set' : '❌ Not set');
console.log('   anthropic_api_key:', localStorage.getItem('anthropic_api_key') ? '✅ Set' : '❌ Not set');

// Check settings
console.log('\n3. Settings Manager:');
import { getSettingsManager } from './src/config/Settings.js';
const settings = getSettingsManager();
console.log('   GLM Configured:', settings.isGLMConfigured() ? '✅ Yes' : '❌ No');

console.log('\n=== Test Complete ===');
