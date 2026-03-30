// Test different GLM model names
const API_KEY = 'f4a0626b57dc444a9af9a6b2739ebaac.B1WYjlj71y7GQ2k6';
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const MODELS = [
  'glm-4-turbo',
  'glm-4',
  'glm-4-flash',
  'glm-4-plus',
  'glm-3-turbo',
  'glm-3',
];

async function testModel(modelName) {
  console.log(`\n=== Testing model: ${modelName} ===`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: '你好'
          }
        ],
        max_tokens: 50
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.choices) {
      console.log(`✅ ${modelName} WORKS!`);
      console.log(`Response: ${data.choices[0].message.content.substring(0, 50)}...`);
      return modelName;
    } else {
      console.log(`❌ ${modelName} failed:`, data.error?.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.log(`❌ ${modelName} error:`, error.message);
    return null;
  }
}

async function testAllModels() {
  console.log('=== Testing GLM API Models ===\n');
  
  for (const model of MODELS) {
    const workingModel = await testModel(model);
    if (workingModel) {
      console.log(`\n✅ Found working model: ${workingModel}`);
      break;
    }
  }
}

testAllModels();
