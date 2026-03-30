# 🧪 浏览器 UI 测试指南

## 在浏览器中测试 AI 功能

### 1. 打开应用
访问: http://localhost:5173

### 2. 打开开发者工具
按 F12 或右键 → 检查

### 3. 运行验证命令

在 Console 中粘贴:

```javascript
// 验证配置
console.log('=== AI Configuration ===');
console.log('GLM Key:', import.meta.env.VITE_GLM_API_KEY?.substring(0, 30) + '...');
console.log('Provider:', import.meta.env.VITE_AI_PROVIDER);
console.log('Model:', 'glm-4');
console.log('LocalStorage:', localStorage.getItem('glm_api_key')?.substring(0, 30) + '...');

// 测试 Settings Manager
import('./src/config/Settings.js').then(({ getSettingsManager }) => {
  const settings = getSettingsManager();
  console.log('GLM Configured:', settings.isGLMConfigured());
  console.log('GLM Model:', settings.getSetting('glm').model);
});

// 测试 AI Chat Service
import('./src/services/ai/AIChatService.js').then(({ aiChatService }) => {
  console.log('AI Chat Service:', aiChatService ? '✅ Loaded' : '❌ Failed');
});
```

### 4. 测试 AI 聊天

1. 创建一个新项目或打开现有项目
2. 完成项目计算
3. 点击"AI 投资顾问"按钮
4. 输入: *"这个项目的投资风险是什么？"*
5. 等待 AI 响应

**预期**: 收到关于投资风险的详细分析

### 5. 测试智能体

1. 访问 `/admin`
2. 选择"设置"标签
3. 确认 GLM API 配置显示 ✅
4. 返回"智能体"标签
5. 选择任意智能体（如"政策更新智能体"）
6. 点击"运行"按钮
7. 观察 LLM 控制台

**预期**: 
- 不再弹出"请先配置 API 密钥"
- LLM 控制台显示 AI 请求和响应

---

## 预期结果

### ✅ 成功标志

- API 配置显示 ✅
- AI 聊天返回真实分析
- 智能体可以运行
- LLM 控制台有日志

### ❌ 失败标志

- 弹出"请先配置 API 密钥"
- AI 聊天返回模拟数据
- 控制台有 API 错误

---

**测试时间**: 约 5 分钟
**测试范围**: 所有 AI 功能
