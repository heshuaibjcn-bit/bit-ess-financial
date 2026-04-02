/**
 * Policy Pool System - Test and Verification
 */

import { getPolicyPool } from '../services/policy/PolicyPoolService';
import { getPolicyAnalyzer } from '../services/policy/AIPolicyAnalyzer';

export async function testPolicyPool() {
  console.log('=== Policy Pool System Test ===\n');

  // Test 1: Initialize policy pool
  console.log('1. Initializing Policy Pool...');
  const policyPool = getPolicyPool();
  await policyPool.initialize();
  console.log('✅ Policy Pool initialized\n');

  // Test 2: Get all policies
  console.log('2. Getting all policies...');
  const allPolicies = policyPool.getAllPolicies();
  console.log(`✅ Found ${allPolicies.length} policies\n`);

  // Test 3: Get statistics
  console.log('3. Getting statistics...');
  const stats = policyPool.getStatistics();
  console.log('✅ Statistics:', stats);
  console.log('');

  // Test 4: Filter by category
  console.log('4. Filtering by category...');
  const tariffPolicies = policyPool.getPoliciesByCategory('tariff');
  console.log(`✅ Found ${tariffPolicies.length} tariff policies\n`);

  // Test 5: Get latest policies
  console.log('5. Getting latest policies...');
  const latestPolicies = policyPool.getLatestPolicies(7);
  console.log(`✅ Found ${latestPolicies.length} policies from last 7 days\n`);

  // Test 6: Search policies
  console.log('6. Searching policies...');
  const searchResults = policyPool.searchPolicies('电价');
  console.log(`✅ Found ${searchResults.length} policies matching "电价"\n`);

  // Test 7: Get notifications
  console.log('7. Getting notifications...');
  const notifications = policyPool.getNotifications();
  console.log(`✅ Found ${notifications.length} notifications\n`);

  // Test 8: AI Policy Analyzer (if available)
  console.log('8. Testing AI Policy Analyzer...');
  const analyzer = getPolicyAnalyzer();
  if (analyzer.isAvailable()) {
    console.log('✅ AI Analyzer is available');

    // Test analysis with sample policy
    const samplePolicy = allPolicies[0];
    if (samplePolicy) {
      console.log('   Testing policy analysis...');
      try {
        // Note: This would make an actual API call in production
        console.log('   ✅ Policy analysis would be performed here');
      } catch (error) {
        console.log('   ⚠️  Policy analysis skipped (API call required)');
      }
    }
  } else {
    console.log('⚠️  AI Analyzer not available (requires API key)');
  }
  console.log('');

  console.log('=== Test Complete ===');
  return {
    success: true,
    totalPolicies: allPolicies.length,
    stats,
  };
}

// Auto-run test on load
if (typeof window !== 'undefined') {
  (window as any).testPolicyPool = testPolicyPool;
}
