// Full AI Integration Test
const API_KEY = 'f4a0626b57dc444a9af9a6b2739ebaac.B1WYjlj71y7GQ2k6';
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

console.log('=== ESS Financial AI Integration Test ===\n');

// Test 1: Basic API Call
console.log('Test 1: Basic API Call');
async function testBasicCall() {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'glm-4',
      messages: [
        { role: 'user', content: '用一句话介绍储能系统的投资价值。' }
      ],
      max_tokens: 100
    })
  });
  
  const data = await response.json();
  if (data.choices) {
    console.log('✅ PASS - Basic API call successful');
    console.log('Response:', data.choices[0].message.content);
    return true;
  } else {
    console.log('❌ FAIL -', data.error?.message);
    return false;
  }
}

// Test 2: Investment Analysis Prompt
console.log('\nTest 2: Investment Analysis Prompt');
async function testInvestmentAnalysis() {
  const prompt = `你是一位储能投资顾问。请分析以下项目：
项目规模：2MWh / 500kW
IRR：8.5%
投资回收期：8.2年
峰谷价差：0.8元/kWh

请给出50字以内的投资建议。`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'glm-4',
      messages: [
        { role: 'system', content: '你是专业的储能投资顾问。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200
    })
  });
  
  const data = await response.json();
  if (data.choices) {
    console.log('✅ PASS - Investment analysis successful');
    console.log('AI 建议:', data.choices[0].message.content);
    console.log('Token Usage:', data.usage);
    return true;
  } else {
    console.log('❌ FAIL -', data.error?.message);
    return false;
  }
}

// Test 3: Risk Analysis
console.log('\nTest 3: Risk Analysis');
async function testRiskAnalysis() {
  const prompt = `分析这个储能项目的投资风险：
- 省份：广东
- IRR：8.5%
- 回收期：8.2年

请列举3个主要风险点，每个不超过20字。`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'glm-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300
    })
  });
  
  const data = await response.json();
  if (data.choices) {
    console.log('✅ PASS - Risk analysis successful');
    console.log('风险分析:', data.choices[0].message.content);
    return true;
  } else {
    console.log('❌ FAIL -', data.error?.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = [];
  
  results.push(await testBasicCall());
  results.push(await testInvestmentAnalysis());
  results.push(await testRiskAnalysis());
  
  console.log('\n=== Test Summary ===');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✅ ALL TESTS PASSED! AI integration is working perfectly.');
  } else {
    console.log('⚠️  Some tests failed. Check the error messages above.');
  }
}

runAllTests();
