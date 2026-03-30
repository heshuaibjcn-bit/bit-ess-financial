// Test GLM API directly
const API_KEY = 'f4a0626b57dc444a9af9a6b2739ebaac.B1WYjlj71y7GQ2k6';
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

async function testGLMAPI() {
  console.log('=== Testing GLM API ===\n');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4-turbo',
        messages: [
          {
            role: 'user',
            content: '你好，请用一句话介绍你自己。'
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });
    
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Call Successful!');
      console.log('Response:', data.choices[0].message.content);
      console.log('\nUsage:', data.usage);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ API Call Failed!');
      console.log('Error:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ Request Error:', error.message);
    return false;
  }
}

testGLMAPI().then(success => {
  if (success) {
    console.log('\n✅ GLM API is working correctly!');
  } else {
    console.log('\n❌ GLM API test failed. Check API key or network.');
  }
});
