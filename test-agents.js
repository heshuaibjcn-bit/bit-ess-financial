/**
 * Agent Test Runner
 *
 * Tests all 7 NanoClaw agents to verify functionality
 */

// Load environment variables
import { config } from 'dotenv';
config();

// Polyfill localStorage for Node.js environment
global.localStorage = {
  getItem: (key) => global.localStorage._store[key] || null,
  setItem: (key, value) => { global.localStorage._store[key] = value.toString(); },
  removeItem: (key) => { delete global.localStorage._store[key]; },
  clear: () => { global.localStorage._store = {}; },
  get length() { return Object.keys(this._store).length; },
  key: (index) => Object.keys(this._store)[index] || null,
  _store: {}
};

// Polyfill window.location and import.meta.env
global.window = {
  location: { hostname: 'localhost' }
};

// Polyfill import.meta.env for Vite environment variables
global.importMetaEnv = {
  VITE_GLM_API_KEY: process.env.VITE_GLM_API_KEY || 'test-key',
  VITE_GLM_MODEL: process.env.VITE_GLM_MODEL || 'glm-4-turbo',
  VITE_GLM_BASE_URL: process.env.VITE_GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/'
};

// Monkey-patch import.meta.env access
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent) {
  if (request === './src/services/agents/index.js') {
    return originalResolveFilename.call(this, request.replace('.js', ''), parent);
  }
  return originalResolveFilename.call(this, request, parent);
};

import {
  PolicyUpdateAgent,
  TariffUpdateAgent,
  DueDiligenceAgent,
  SentimentAnalysisAgent,
  TechnicalFeasibilityAgent,
  FinancialFeasibilityAgent,
  ReportGenerationAgent,
  getAgentManager,
  getCommunicationLogger,
} from './src/services/agents/index.js';

const logger = getCommunicationLogger();

const TEST_CASES = {
  policy: {
    agent: 'PolicyUpdateAgent',
    input: {
      query: '广东省储能补贴政策',
      province: '广东',
      dateRange: { start: '2025-01-01', end: '2025-12-31' }
    }
  },
  tariff: {
    agent: 'TariffUpdateAgent',
    input: {
      province: '广东',
      dateRange: { start: '2025-01-01', end: '2025-12-31' }
    }
  },
  dueDiligence: {
    agent: 'DueDiligenceAgent',
    input: {
      companyName: '腾讯科技有限公司',
      projectType: '储能',
      investmentAmount: 50000000
    }
  },
  sentiment: {
    agent: 'SentimentAnalysisAgent',
    input: {
      query: '储能行业 市场前景',
      sources: ['news', 'social', 'reports'],
      dateRange: { start: '2025-01-01', end: '2025-12-31' }
    }
  },
  technical: {
    agent: 'TechnicalFeasibilityAgent',
    input: {
      projectName: '测试储能项目',
      location: { province: '广东', city: '深圳' },
      systemConfig: {
        capacity: 10, // MWh
        powerRating: 5, // MW
        batteryType: '锂离子电池',
        dischargeDuration: 2
      },
      gridConstraints: {
        maxChargePower: 5,
        maxDischargePower: 5,
        dailyCycles: 2
      }
    }
  },
  financial: {
    agent: 'FinancialFeasibilityAgent',
    input: {
      projectName: '测试储能项目',
      initialInvestment: 50000000,
      operatingCosts: {
        annualMaintenance: 500000,
        electricityCost: 0.5,
        laborCost: 200000
      },
      revenueStreams: {
        arbitrageRevenue: 8000000,
        capacityRevenue: 2000000,
        ancillaryServicesRevenue: 1000000
      },
      financialParameters: {
        projectLifetime: 10,
        discountRate: 0.08,
        electricityPriceEscalation: 0.02
      }
    }
  },
  report: {
    agent: 'ReportGenerationAgent',
    input: {
      reportType: 'investment',
      projectName: '测试储能项目',
      data: {
        policy: { summary: '政策支持良好', risk: 'low' },
        tariff: { peakValleySpread: 0.8, arbitragePotential: 'high' },
        dueDiligence: { companyRisk: 'low', creditScore: 85 },
        sentiment: { overallSentiment: 'positive', trend: 'growing' },
        technical: { feasibility: 'high', constraints: [] },
        financial: { irr: 0.15, npv: 25000000, paybackPeriod: 6.5 }
      }
    }
  }
};

async function testAgent(agentName, input) {
  const startTime = Date.now();
  console.log(`\n🧪 Testing ${agentName}...`);
  console.log(`   Input: ${JSON.stringify(input, null, 2).substring(0, 200)}...`);

  try {
    let agent;
    let result;

    switch (agentName) {
      case 'PolicyUpdateAgent':
        agent = new PolicyUpdateAgent();
        result = await agent.execute(input);
        break;
      case 'TariffUpdateAgent':
        agent = new TariffUpdateAgent();
        result = await agent.execute(input);
        break;
      case 'DueDiligenceAgent':
        agent = new DueDiligenceAgent();
        result = await agent.execute(input);
        break;
      case 'SentimentAnalysisAgent':
        agent = new SentimentAnalysisAgent();
        result = await agent.execute(input);
        break;
      case 'TechnicalFeasibilityAgent':
        agent = new TechnicalFeasibilityAgent();
        result = await agent.execute(input);
        break;
      case 'FinancialFeasibilityAgent':
        agent = new FinancialFeasibilityAgent();
        result = await agent.execute(input);
        break;
      case 'ReportGenerationAgent':
        agent = new ReportGenerationAgent();
        result = await agent.execute(input);
        break;
      default:
        throw new Error(`Unknown agent: ${agentName}`);
    }

    const duration = Date.now() - startTime;
    console.log(`   ✅ SUCCESS (${duration}ms)`);
    console.log(`   Result: ${JSON.stringify(result, null, 2).substring(0, 300)}...`);

    return {
      agent: agentName,
      status: 'success',
      duration,
      result
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`   ❌ FAILED (${duration}ms)`);
    console.error(`   Error: ${error.message}`);

    return {
      agent: agentName,
      status: 'failed',
      duration,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  NanoClaw Agent System Test Suite                          ║');
  console.log('║  Testing 7 Agents for Functionality                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = [];

  // Test each agent
  for (const [key, testCase] of Object.entries(TEST_CASES)) {
    const result = await testAgent(testCase.agent, testCase.input);
    results.push(result);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test Summary                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const successCount = results.filter(r => r.status === 'success').length;
  const failureCount = results.filter(r => r.status === 'failed').length;
  const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length);

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);
  console.log(`Average Duration: ${avgDuration}ms\n`);

  // Detailed results
  console.log('Detailed Results:');
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`  ${icon} ${result.agent}: ${result.status} (${result.duration}ms)`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  // Get communication logger stats
  const stats = logger.getStats();
  console.log('\nCommunication Logger Stats:');
  console.log(`  Total Calls: ${stats.totalCalls || 0}`);
  console.log(`  Successful: ${stats.successfulCalls || 0}`);
  console.log(`  Failed: ${stats.failedCalls || 0}`);
  if (stats.successRate) {
    console.log(`  Success Rate: ${stats.successRate.toFixed(1)}%`);
  }

  return {
    total: results.length,
    passed: successCount,
    failed: failureCount,
    successRate: (successCount / results.length) * 100,
    avgDuration,
    results
  };
}

// Run tests
runAllTests()
  .then(summary => {
    console.log('\n✅ Test suite completed!');

    // Exit with appropriate code
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Test suite failed to run:', error);
    process.exit(1);
  });
