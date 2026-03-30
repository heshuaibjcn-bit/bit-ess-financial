#!/bin/bash
# 智能体功能验证脚本
# 运行此脚本验证 AI 配置是否正确

echo "================================"
echo "  ESS Financial AI 配置验证"
echo "================================"
echo ""

# 检查 .env 文件
echo "1. 检查 .env 文件..."
if [ -f .env ]; then
    echo "   ✅ .env 文件存在"
    if grep -q "VITE_GLM_API_KEY" .env; then
        echo "   ✅ GLM API Key 已配置"
    else
        echo "   ❌ GLM API Key 未配置"
    fi
else
    echo "   ❌ .env 文件不存在"
fi
echo ""

# 检查 .gitignore
echo "2. 检查 .gitignore..."
if grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo "   ✅ .env 已添加到 .gitignore"
else
    echo "   ⚠️  .env 未在 .gitignore 中"
fi
echo ""

# 检查修改的文件
echo "3. 检查已修改的文件..."
echo "   修改的文件:"
git diff --name-only 2>/dev/null | grep -E "(InvestmentAdvisor|AIChatService|NanoAgent|Settings|App\.tsx)" | while read file; do
    echo "   ✅ $file"
done
echo ""

# 检查开发服务器
echo "4. 检查开发服务器..."
if pgrep -f "vite" > /dev/null; then
    echo "   ✅ Vite 开发服务器正在运行"
    PORT=$(lsof -ti:5173 2>/dev/null)
    if [ -n "$PORT" ]; then
        echo "   ✅ 端口 5173 已占用（服务器运行中）"
    fi
else
    echo "   ⚠️  Vite 开发服务器未运行"
    echo "   运行 'npm run dev' 启动服务器"
fi
echo ""

echo "================================"
echo "  验证完成"
echo "================================"
echo ""
echo "下一步："
echo "1. 运行 'npm run dev' 启动开发服务器"
echo "2. 访问 http://localhost:5173"
echo "3. 打开浏览器控制台，运行以下命令验证配置："
echo ""
echo "   console.log('GLM Key:', import.meta.env.VITE_GLM_API_KEY?.substring(0, 20) + '...');"
echo "   console.log('Provider:', import.meta.env.VITE_AI_PROVIDER);"
echo "   console.log('LocalStorage:', localStorage.getItem('glm_api_key')?.substring(0, 20) + '...');"
echo ""
echo "4. 测试 AI 功能："
echo "   - 完成一个项目计算"
echo "   - 点击 AI 投资顾问"
echo "   - 发送消息：'这个项目的投资风险是什么？'"
echo ""
echo "5. 测试智能体："
echo "   - 访问 /admin"
echo "   - 选择任意智能体"
echo "   - 点击运行"
echo ""
