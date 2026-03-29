/**
 * Data Integration Usage Examples
 *
 * This file demonstrates how to use the real data integration services
 * in your application.
 */

import {
  getDataIntegrationManager,
  setupPolicyDataIntegration,
  setupTariffDataIntegration,
  setupCompanyDataIntegration,
  getCacheManager
} from '@/services/data-integration';
import {
  PolicyDataValidator,
  TariffDataValidator,
  CompanyDataValidator
} from '@/services/data-integration';
import { printSetupInstructions } from '@/config/dataIntegration';

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize all data integrations
 */
export async function initializeDataIntegrations() {
  console.log('=== Initializing Data Integrations ===\n');

  // Print setup instructions
  printSetupInstructions();

  // Setup integrations
  const policyIntegration = setupPolicyDataIntegration();
  const tariffIntegration = setupTariffDataIntegration();
  const companyIntegration = setupCompanyDataIntegration();

  // Get manager
  const manager = getDataIntegrationManager();

  // Schedule automatic updates
  manager.scheduleUpdate('policy-data', 3600000); // Every hour
  manager.scheduleUpdate('tariff-data', 86400000); // Every day

  console.log('✅ Data integrations initialized\n');

  return {
    policy: policyIntegration,
    tariff: tariffIntegration,
    company: companyIntegration,
    manager
  };
}

// ============================================================================
// POLICY DATA EXAMPLES
// ============================================================================

/**
 * Example 1: Get latest policies
 */
export async function getLatestPolicies() {
  const manager = getDataIntegrationManager();

  // Update policy data
  const result = await manager.updateByName('policy-data');

  console.log(`Policy update completed:`);
  console.log(`- Records processed: ${result.recordsProcessed}`);
  console.log(`- Records added: ${result.recordsAdded}`);
  console.log(`- Duration: ${result.duration}ms`);
  console.log(`- Errors: ${result.errors.length}`);

  return result;
}

/**
 * Example 2: Validate policy data quality
 */
export async function checkPolicyDataQuality(policyData: any[]) {
  const validator = new PolicyDataValidator();
  const quality = validator.checkQuality(policyData);

  console.log('\n=== Policy Data Quality Report ===');
  console.log(`Completeness: ${quality.completeness.toFixed(1)}%`);
  console.log(`Accuracy: ${quality.accuracy.toFixed(1)}%`);
  console.log(`Timeliness: ${quality.timeliness.toFixed(1)}%`);
  console.log(`Consistency: ${quality.consistency.toFixed(1)}%`);
  console.log(`Overall Score: ${quality.overallScore.toFixed(1)}%`);

  if (quality.issues.length > 0) {
    console.log('\nIssues found:');
    quality.issues.forEach(issue => console.log(`  - ${issue}`));
  }

  if (quality.recommendations.length > 0) {
    console.log('\nRecommendations:');
    quality.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }

  return quality;
}

// ============================================================================
// TARIFF DATA EXAMPLES
// ============================================================================

/**
 * Example 3: Get tariff data for a province
 */
export async function getProvinceTariff(province: string) {
  const tariffIntegration = setupTariffDataIntegration();

  // Get tariff data (uses cache if available)
  const tariff = await tariffIntegration.getTariff(province);

  console.log(`\n=== ${province} Tariff Data ===`);
  console.log(`Peak Price: ¥${tariff.peakPrice.toFixed(3)}/kWh`);
  console.log(`Flat Price: ¥${tariff.flatPrice.toFixed(3)}/kWh`);
  console.log(`Valley Price: ¥${tariff.valleyPrice.toFixed(3)}/kWh`);
  console.log(`Price Spread: ¥${(tariff.peakPrice - tariff.valleyPrice).toFixed(3)}/kWh`);

  return tariff;
}

/**
 * Example 4: Get hourly prices for energy storage analysis
 */
export async function getHourlyPricesForAnalysis(province: string, date: Date = new Date()) {
  const tariffIntegration = setupTariffDataIntegration();

  // Get 24-hour prices
  const hourlyPrices = await tariffIntegration.getHourlyPrices(province, date);

  console.log(`\n=== ${province} Hourly Prices (${date.toDateString()}) ===`);

  hourlyPrices.forEach((price, hour) => {
    const period = hour >= 8 && hour < 12 ? 'Morning Peak' :
                  hour >= 14 && hour < 18 ? 'Afternoon Peak' :
                  hour >= 19 && hour < 21 ? 'Evening Peak' :
                  hour >= 23 || hour < 7 ? 'Valley' : 'Flat';
    console.log(`${hour.toString().padStart(2, '0')}:00 - ¥${price.toFixed(3)} (${period})`);
  });

  // Calculate arbitrage opportunities
  const avgPrice = hourlyPrices.reduce((sum, p) => sum + p, 0) / hourlyPrices.length;
  const peakPrice = Math.max(...hourlyPrices);
  const valleyPrice = Math.min(...hourlyPrices);
  const arbitrageSpread = peakPrice - valleyPrice;

  console.log(`\nArbitrage Analysis:`);
  console.log(`- Average Price: ¥${avgPrice.toFixed(3)}/kWh`);
  console.log(`- Peak Price: ¥${peakPrice.toFixed(3)}/kWh`);
  console.log(`- Valley Price: ¥${valleyPrice.toFixed(3)}/kWh`);
  console.log(`- Arbitrage Spread: ¥${arbitrageSpread.toFixed(3)}/kWh`);
  console.log(`- Daily Revenue (1MW): ¥${(arbitrageSpread * 2 * 1.5 * 1000).toFixed(2)}`);

  return hourlyPrices;
}

// ============================================================================
// COMPANY DATA EXAMPLES
// ============================================================================

/**
 * Example 5: Get company information
 */
export async function getCompanyInformation(companyName: string) {
  const companyIntegration = setupCompanyDataIntegration();

  // Get company info
  const companyInfo = await companyIntegration.getCompanyInfo(companyName);

  if (!companyInfo) {
    console.log(`Company not found: ${companyName}`);
    return null;
  }

  console.log(`\n=== ${companyInfo.name} ===`);
  console.log(`Credit Code: ${companyInfo.creditCode}`);
  console.log(`Registration Date: ${companyInfo.registrationDate}`);
  console.log(`Registered Capital: ¥${(companyInfo.registeredCapital / 10000).toFixed(1)}万`);
  console.log(`Legal Representative: ${companyInfo.legalRepresentative}`);
  console.log(`Business Status: ${companyInfo.businessStatus}`);
  console.log(`Industry: ${companyInfo.industry || 'N/A'}`);
  console.log(`Credit Score: ${companyInfo.creditScore || 'N/A'}`);
  console.log(`Risk Level: ${companyInfo.riskLevel || 'N/A'}`);

  return companyInfo;
}

/**
 * Example 6: Batch company search for due diligence
 */
export async function batchCompanySearch(companyNames: string[]) {
  const companyIntegration = setupCompanyDataIntegration();

  console.log(`\n=== Batch Company Search (${companyNames.length} companies) ===`);

  // Batch search
  const companies = await companyIntegration.batchSearch(companyNames);

  // Group by risk level
  const byRisk = {
    low: companies.filter(c => c.riskLevel === 'low'),
    medium: companies.filter(c => c.riskLevel === 'medium'),
    high: companies.filter(c => c.riskLevel === 'high')
  };

  console.log(`\nRisk Distribution:`);
  console.log(`- Low Risk: ${byRisk.low.length} companies`);
  console.log(`- Medium Risk: ${byRisk.medium.length} companies`);
  console.log(`- High Risk: ${byRisk.high.length} companies`);

  // Display details
  console.log(`\nCompany Details:`);
  companies.forEach(company => {
    const riskIcon = company.riskLevel === 'low' ? '✅' :
                     company.riskLevel === 'medium' ? '⚠️' : '❌';
    console.log(`${riskIcon} ${company.name}: Score ${company.creditScore}, ${company.riskLevel} risk`);
  });

  return companies;
}

// ============================================================================
// CACHE MANAGEMENT EXAMPLES
// ============================================================================

/**
 * Example 7: Monitor cache performance
 */
export function monitorCachePerformance() {
  const cacheManager = getCacheManager();
  const stats = cacheManager.getAllStats();

  console.log('\n=== Cache Performance ===');

  Object.entries(stats).forEach(([name, stat]) => {
    console.log(`\n${name} Cache:`);
    console.log(`- Size: ${stat.size} entries`);
    console.log(`- Hits: ${stat.hits}`);
    console.log(`- Misses: ${stat.misses}`);
    console.log(`- Hit Rate: ${stat.hitRate.toFixed(1)}%`);
    console.log(`- Evictions: ${stat.evictions}`);
  });

  return stats;
}

/**
 * Example 8: Warm up cache for better performance
 */
export async function warmupCache() {
  const cacheManager = getCacheManager();
  const policyCache = cacheManager.getCache('policy');
  const tariffCache = cacheManager.getCache('tariff');
  const companyCache = cacheManager.getCache('company');

  console.log('\n=== Warming Up Cache ===');

  // Warm up policy cache
  if (policyCache) {
    const policyKeys = ['policy:latest', 'policy:national', 'policy:guangdong'];
    await policyCache.warmup(
      policyKeys,
      async (key) => {
        // Simulate data loading
        return { key, data: `Sample data for ${key}` };
      },
      { ttl: 3600000 }
    );
  }

  // Warm up tariff cache
  if (tariffCache) {
    const provinces = ['广东', '浙江', '江苏', '上海', '北京'];
    await tariffCache.warmup(
      provinces.map(p => `tariff:${p}`),
      async (key) => {
        const province = key.split(':')[1];
        const tariffIntegration = setupTariffDataIntegration();
        return await tariffIntegration.getTariff(province);
      },
      { ttl: 86400000 }
    );
  }

  console.log('✅ Cache warmup complete');
}

// ============================================================================
// INTEGRATION STATUS EXAMPLES
// ============================================================================

/**
 * Example 9: Get comprehensive integration status
 */
export function getIntegrationStatus() {
  const manager = getDataIntegrationManager();
  const status = manager.getStatus();
  const metrics = manager.getMetrics();

  console.log('\n=== Data Integration Status ===');

  console.log(`\nOverall Metrics:`);
  console.log(`- Total Integrations: ${metrics.totalIntegrations}`);
  console.log(`- Enabled: ${metrics.enabledIntegrations}`);
  console.log(`- Total Updates: ${metrics.totalUpdates}`);
  console.log(`- Total Errors: ${metrics.totalErrors}`);
  console.log(`- Avg Success Rate: ${metrics.averageSuccessRate.toFixed(1)}%`);

  console.log(`\nPer-Integration Status:`);
  status.forEach(s => {
    const statusIcon = s.status === 'healthy' ? '✅' :
                      s.status === 'error' ? '❌' :
                      s.status === 'updating' ? '🔄' : '⏸️';
    console.log(`${statusIcon} ${s.name}:`);
    console.log(`  Status: ${s.status}`);
    console.log(`  Success Rate: ${s.successRate.toFixed(1)}%`);
    console.log(`  Updates: ${s.updateCount}`);
    console.log(`  Errors: ${s.errorCount}`);
    console.log(`  Last Update: ${s.lastUpdate ? new Date(s.lastUpdate).toLocaleString() : 'Never'}`);
  });

  return { status, metrics };
}

// ============================================================================
// COMPLETE WORKFLOW EXAMPLE
// ============================================================================

/**
 * Example 10: Complete workflow - Energy storage project analysis
 */
export async function analyzeEnergyStorageProject(projectConfig: {
  province: string;
  companyName: string;
  projectName: string;
}) {
  console.log(`\n=== Energy Storage Project Analysis ===`);
  console.log(`Project: ${projectConfig.projectName}`);
  console.log(`Location: ${projectConfig.province}`);
  console.log(`Company: ${projectConfig.companyName}\n`);

  // Step 1: Get tariff data
  console.log('Step 1: Analyzing tariff structure...');
  const tariff = await getProvinceTariff(projectConfig.province);
  const hourlyPrices = await getHourlyPricesForAnalysis(projectConfig.province);

  // Step 2: Get company information
  console.log('\nStep 2: Assessing company creditworthiness...');
  const companyInfo = await getCompanyInformation(projectConfig.companyName);

  if (companyInfo) {
    const validator = new CompanyDataValidator();
    const validation = validator.validate(companyInfo);
    console.log(`Company validation: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`Validation score: ${validation.score}/100`);
  }

  // Step 3: Get relevant policies
  console.log('\nStep 3: Retrieving relevant policies...');
  const policyResult = await getLatestPolicies();

  // Step 4: Generate analysis summary
  console.log('\n=== Analysis Summary ===');
  console.log(`Tariff Arbitrage Spread: ¥${(tariff.peakPrice - tariff.valleyPrice).toFixed(3)}/kWh`);
  console.log(`Estimated Annual Revenue: ¥${((tariff.peakPrice - tariff.valleyPrice) * 2 * 1.5 * 365 * 1000).toFixed(0)}`);
  console.log(`Company Credit Score: ${companyInfo?.creditScore || 'N/A'}`);
  console.log(`Company Risk Level: ${companyInfo?.riskLevel || 'N/A'}`);
  console.log(`Available Policies: ${policyResult.recordsAdded}`);

  // Step 5: Recommendation
  const isRecommended =
    (tariff.peakPrice - tariff.valleyPrice) > 0.6 &&
    (companyInfo?.creditScore || 0) > 70 &&
    companyInfo?.riskLevel !== 'high';

  console.log(`\nRecommendation: ${isRecommended ? '✅ PROCEED' : '⚠️  REVIEW NEEDED'}`);

  return {
    tariff,
    hourlyPrices,
    companyInfo,
    policyCount: policyResult.recordsAdded,
    recommended: isRecommended
  };
}

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export const DataIntegrationExamples = {
  // Initialization
  initializeDataIntegrations,

  // Policy data
  getLatestPolicies,
  checkPolicyDataQuality,

  // Tariff data
  getProvinceTariff,
  getHourlyPricesForAnalysis,

  // Company data
  getCompanyInformation,
  batchCompanySearch,

  // Cache management
  monitorCachePerformance,
  warmupCache,

  // Status monitoring
  getIntegrationStatus,

  // Complete workflow
  analyzeEnergyStorageProject
};
