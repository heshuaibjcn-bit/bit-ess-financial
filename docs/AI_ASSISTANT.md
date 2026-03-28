# 储能项目 AI 助手

基于 NanoClaw 设计理念的轻量级储能项目咨询助手。

## 功能特性

### ✅ 已实现功能
- **电价政策问答** - 解答峰谷电价、基本电费等问题
- **储能方案建议** - 根据用电数据推荐储能配置
- **数据分析解释** - 解释 ROI、回收期等经济指标
- **多轮对话** - 支持上下文对话
- **历史记录** - 保存对话历史（最多 10 条）

### 🔒 安全特性
- **本地存储** - API Key 存储在浏览器 localStorage
- **环境变量** - 支持通过 .env 文件配置
- **数据隔离** - 对话历史不会离开浏览器
- **轻量级** - 核心代码 < 500 行

## 快速开始

### 1. 获取 API Key

访问 [Anthropic Console](https://console.anthropic.com/)：
1. 注册/登录账号
2. 进入 API Keys 页面
3. 创建新的 API Key
4. 复制 key

### 2. 配置 API Key

**方式一：环境变量（推荐用于开发）**
```bash
# 复制 .env.example 到 .env
cp .env.example .env

# 编辑 .env 文件，添加你的 API Key
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**方式二：应用内设置**
1. 打开应用
2. 点击右下角的 AI 助手图标
3. 点击设置（齿轮图标）
4. 输入你的 API Key
5. 点击保存

### 3. 开始使用

在电价详情页面（Step 2），你可以：
- 点击快速提问按钮
- 输入自定义问题
- 查看对话历史
- 清空对话记录

## 使用示例

### 电价政策问题
```
问：什么是峰谷电价？
答：峰谷电价是根据用电时间的不同而制定的差异化的电价...
```

### 储能方案建议
```
问：广东省10kV大工业用户适合装储能吗？
答：广东省10kV大工业用户的峰谷价差较大，峰时电价1.061元/kWh...
```

### 数据分析解释
```
问：ROI 15% 是什么意思？
答：ROI（投资回报率）15% 意味着每年能获得投资成本15%的收益...
```

## 技术架构

```
┌─────────────────┐
│  React Frontend │
│                 │
│  ┌───────────┐  │
│  │AI Assistant│  │
│  │ Component │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ Assistant │  │
│  │ Service   │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
         ▼
┌─────────────────┐
│  Anthropic API  │
│  (Claude Haiku) │
└─────────────────┘
```

## 文件结构

```
src/
├── components/
│   └── AIAssistant.tsx          # AI 助手 UI 组件
├── services/
│   └── energyStorageAssistant.ts # AI 助手服务层
├── config/
│   └── aiConfig.ts               # AI 配置
└── components/form-steps/
    └── TariffDetailsStep.tsx    # 集成 AI 助手
```

## 配置选项

可以在 `src/config/aiConfig.ts` 中自定义：

- **模型选择** - 更换 Claude 模型
- **功能开关** - 启用/禁用特定功能
- **UI 配置** - 调整界面外观
- **提示词模板** - 自定义助手行为

## 成本估算

使用 Claude Haiku 模型（推荐）：
- **输入**：$0.25 / 1M tokens
- **输出**：$1.25 / 1M tokens
- **典型对话**：约 $0.001 - $0.01 / 次

预计每月成本：$1-5（取决于使用频率）

## 常见问题

### Q: API Key 存储安全吗？
A: API Key 存储在浏览器的 localStorage 中，只有你的浏览器可以访问。建议使用独立的 API Key，并设置月度限额。

### Q: 对话历史会保存在哪里？
A: 对话历史仅保存在浏览器内存中，刷新页面后会清空。不会被发送到任何服务器（除了 Anthropic API）。

### Q: 可以更换 AI 模型吗？
A: 可以在 `src/config/aiConfig.ts` 中修改 `model.primary` 配置。

### Q: 支持本地模型吗？
A: 目前不支持，但架构设计允许未来集成 Web-LLM 等本地模型方案。

## 未来计划

- [ ] 支持本地模型（Web-LLM）
- [ ] 集成项目文档（RAG）
- [ ] 导出对话记录
- [ ] 多语言支持
- [ ] 语音输入/输出

## 相关资源

- [NanoClaw GitHub](https://github.com/qwibitai/nanoclaw)
- [Anthropic API 文档](https://docs.anthropic.com/)
- [Claude 模型介绍](https://docs.anthropic.com/claude/docs/about-claude/models)

## 许可证

MIT License - 与主项目一致
