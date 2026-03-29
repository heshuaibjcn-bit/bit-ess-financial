// GLM-5 Turbo API 简单测试工具
// 可以直接在浏览器控制台中运行

async function testGLMAPI(apiKey) {
  const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  console.log('🧪 开始测试GLM-5 Turbo API...');
  console.log('🔑 API密钥:', apiKey.substring(0, 10) + '...');

  // 测试1: 基础连接
  console.log('\n📋 测试1: 基础连接测试');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-5-turbo',
        messages: [
          { role: 'system', content: '你是一个测试助手' },
          { role: 'user', content: '你好，请简单介绍一下你自己' }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    console.log('📡 HTTP状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API错误:', errorText);

      // 分析错误
      if (response.status === 401) {
        console.error('🔑 原因: API密钥无效或过期');
        console.log('💡 解决方案: 请检查API密钥是否正确');
      } else if (response.status === 403) {
        console.error('🚫 原因: 权限不足或余额不足');
        console.log('💡 解决方案: 请检查智谱AI账户余额');
      } else if (response.status === 429) {
        console.error('⏰ 原因: 请求过于频繁');
        console.log('💡 解决方案: 请稍后再试');
      }

      return false;
    }

    const data = await response.json();
    console.log('✅ API调用成功！');
    console.log('📊 完整响应:', data);

    // 提取回复内容
    const reply = data.choices[0]?.message?.content;
    if (reply) {
      console.log('💬 AI回复:', reply);
      console.log('📏 回复长度:', reply.length, '字符');

      // 检查回复质量
      if (reply.length > 20) {
        console.log('✅ 回复内容长度正常');
      } else {
        console.warn('⚠️ 回复内容过短');
      }

      // 检查是否包含中文
      if (/[\u4e00-\u9fa5]/.test(reply)) {
        console.log('✅ 回复包含中文内容');
      } else {
        console.warn('⚠️ 回复可能不包含中文');
      }

    } else {
      console.error('❌ 无法提取回复内容');
      return false;
    }

    // 显示Token使用情况
    if (data.usage) {
      console.log('📈 Token使用:', data.usage);
    }

    return true;

  } catch (error) {
    console.error('❌ 网络错误:', error);
    console.log('💡 可能的原因: 网络连接问题或CORS限制');
    return false;
  }
}

// 测试2: 储能相关问题测试
async function testEnergyStorageQuery(apiKey) {
  const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  console.log('\n📋 测试2: 储能相关问题测试');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-5-turbo',
        messages: [
          { role: 'system', content: '你是一个专业的储能投资顾问' },
          { role: 'user', content: '广东省工商业储能项目的IRR通常在什么范围？请用简短的中文回答。' }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      const reply = data.choices[0]?.message?.content;
      console.log('💬 储能问题回复:', reply);

      // 检查回复质量
      const keywords = ['IRR', '投资回报', '储能', '收益率', '%', '百分比'];
      const hasKeywords = keywords.some(keyword => reply.includes(keyword));

      if (hasKeywords) {
        console.log('✅ 回复包含相关术语，质量良好');
      } else {
        console.warn('⚠️ 回复可能不够专业');
      }

      return true;
    } else {
      console.error('❌ 储能问题测试失败');
      return false;
    }

  } catch (error) {
    console.error('❌ 储能问题测试出错:', error);
    return false;
  }
}

// 测试3: 不同模型对比
async function testDifferentModels(apiKey) {
  const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  const models = ['glm-5-turbo', 'glm-4', 'glm-3-turbo'];

  console.log('\n📋 测试3: 不同模型对比测试');

  for (const model of models) {
    try {
      console.log(`\n🔄 测试模型: ${model}`);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: '你好' }
          ],
          max_tokens: 50
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices[0]?.message?.content;
        console.log(`✅ ${model} 可用 - 回复:`, reply);
      } else {
        console.log(`❌ ${model} 不可用 - 状态:`, response.status);
      }

    } catch (error) {
      console.log(`❌ ${model} 测试出错:`, error.message);
    }
  }
}

// 主测试函数
async function runAllTests(apiKey) {
  if (!apiKey) {
    console.error('❌ 请提供API密钥');
    console.log('使用方法: 在控制台运行 testGLMAPI("your-api-key-here")');
    return;
  }

  console.log('==========================================');
  console.log('🚀 GLM-5 Turbo API 完整诊断');
  console.log('==========================================');

  const test1 = await testGLMAPI(apiKey);

  if (test1) {
    await testEnergyStorageQuery(apiKey);
    await testDifferentModels(apiKey);
  }

  console.log('\n==========================================');
  console.log('🎯 诊断完成');
  console.log('==========================================');

  if (test1) {
    console.log('✅ 基础功能正常，GLM-5 Turbo可以正常使用');
  } else {
    console.log('❌ 存在问题，请根据上述信息进行排查');
  }
}

// 使用说明
console.log('📘 GLM API测试工具使用说明:');
console.log('1. 基础测试: testGLMAPI("your-api-key")');
console.log('2. 完整诊断: runAllTests("your-api-key")');
console.log('3. 储能问题: testEnergyStorageQuery("your-api-key")');
console.log('4. 模型对比: testDifferentModels("your-api-key")');

// 导出到全局作用域
window.testGLMAPI = testGLMAPI;
window.runAllTests = runAllTests;
window.testEnergyStorageQuery = testEnergyStorageQuery;
window.testDifferentModels = testDifferentModels;

console.log('✅ 测试工具已加载，可以直接使用上述函数');
