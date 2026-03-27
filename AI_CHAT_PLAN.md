# AI对话功能规划

## 目标
为工商业储能投资决策平台增加AI对话功能，让AI能够辅助评价项目，提供投资建议。

## 用户选择
- **AI提供商**: DeepSeek
- **密钥管理**: 后端代理（最安全）
- **功能范围**: 完整功能（基础对话 + 快捷问题 + 流式响应 + Markdown渲染）

## 架构说明

**当前项目状态：**
- 纯前端React应用（Vite构建）
- 无后端服务器
- 需要添加后端代理来实现安全的密钥管理

**两阶段实施方案：**

### 阶段1：MVP（前端直接调用）- 本次实现
- 前端直接调用DeepSeek API
- 用户在设置中输入自己的API密钥
- 加密存储到localStorage
- 优点：快速实现，无需后端
- 缺点：密钥暴露在前端

### 阶段2：生产环境（后端代理）- 未来可选
- 添加轻量级后端服务
- 推荐使用Vite的SSR模式或独立Node.js服务
- 后端持有API密钥，前端通过后端API调用

## 实施步骤

### Step 1: 创建AI服务层（第1周）

**文件：**
1. `/Users/alex/ess_financial/src/types/ai.ts` - AI类型定义
2. `/Users/alex/ess_financial/src/services/ai/DeepSeekService.ts` - DeepSeek API集成
3. `/Users/alex/ess_financial/src/services/ai/PromptBuilder.ts` - 提示词构建
4. `/Users/alex/ess_financial/src/services/ai/ContextBuilder.ts` - 上下文构建

### Step 2: 扩展状态管理（第1周）

**文件：**
- `/Users/alex/ess_financial/src/stores/uiStore.ts` - 添加AI对话状态

### Step 3: 创建UI组件（第2周）

**文件：**
1. `/Users/alex/ess_financial/src/components/AIChat/AIChatSidebar.tsx` - 主侧边栏
2. `/Users/alex/ess_financial/src/components/AIChat/ChatMessageList.tsx` - 消息列表
3. `/Users/alex/ess_financial/src/components/AIChat/ChatInput.tsx` - 输入框
4. `/Users/alex/ess_financial/src/components/AIChat/QuickPrompts.tsx` - 快捷问题
5. `/Users/alex/ess_financial/src/components/AIChat/ThinkingIndicator.tsx` - 思考指示器
6. `/Users/alex/ess_financial/src/components/AIChat/AISettings.tsx` - API密钥配置

### Step 4: 在ResultsOverview中添加入口（第2周）

**文件：**
- `/Users/alex/ess_financial/src/components/ResultsOverview.tsx` - 添加"AI分析"按钮

### Step 5: 国际化（第2周）

**文件：**
- `/Users/alex/ess_financial/src/i18n/locales/zh.json`
- `/Users/alex/ess_financial/src/i18n/locales/en.json`

### Step 6: 依赖安装

```bash
npm install react-markdown remark-gfm rehype-highlight
npm install -D @types/react-markdown
```

## 关键特性

1. **侧边栏UI**：从右侧滑出，类似ShareDialog
2. **流式响应**：逐字显示AI回复
3. **Markdown渲染**：支持代码块、列表等
4. **快捷问题**：预设问题标签
5. **多语言**：中英文支持
6. **错误处理**：网络错误、API错误等

## 测试验证

**功能测试清单：**
- [ ] 点击"AI智能分析"按钮打开侧边栏
- [ ] 显示欢迎消息和快捷问题
- [ ] 点击快捷问题自动填充并发送
- [ ] 输入自定义问题并发送
- [ ] AI回复显示为Markdown格式
- [ ] 流式响应正常工作
- [ ] 思考状态正确显示
- [ ] 错误处理正确显示
- [ ] API密钥配置功能正常
- [ ] 清空对话功能正常

## 实施时间线

- **Week 1**: AI服务层、类型定义、状态管理
- **Week 2**: UI组件、ResultsOverview集成、国际化
- **Week 3**: 测试、优化、文档

总计：3周完整实现
