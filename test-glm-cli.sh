#!/bin/bash

# GLM-5 Turbo API 诊断工具

echo "🧪 GLM-5 Turbo API 诊断工具"
echo "================================"

# 检查是否有API密钥
if [ -z "$1" ]; then
    echo "❌ 错误: 请提供API密钥"
    echo "用法: ./test-glm-cli.sh <your-api-key>"
    echo ""
    echo "获取API密钥: https://open.bigmodel.cn/"
    exit 1
fi

API_KEY="$1"
API_URL="https://open.bigmodel.cn/api/paas/v4/chat/completions"

echo "📋 诊断信息:"
echo "API URL: $API_URL"
echo "API Key: ${API_KEY:0:10}... (已隐藏)"
echo ""

# 测试1: 简单连接测试
echo "🔍 测试1: 基础连接测试"
echo "-----------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "glm-5-turbo",
    "messages": [
      {"role": "system", "content": "你是一个测试助手"},
      {"role": "user", "content": "你好"}
    ],
    "max_tokens": 50,
    "temperature": 0.3
  }' 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP状态码: $HTTP_CODE"
echo "响应内容:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# 检查HTTP状态码
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API连接成功！"

    # 提取回复内容
    REPLY=$(echo "$BODY" | jq -r '.choices[0].message.content' 2>/dev/null)
    if [ -n "$REPLY" ] && [ "$REPLY" != "null" ]; then
        echo "💬 AI回复: $REPLY"

        # 检查回复是否有意义
        if [ ${#REPLY} -gt 10 ]; then
            echo "✅ 回复内容有意义（长度: ${#REPLY} 字符）"
        else
            echo "⚠️  回复内容过短，可能有问题"
        fi
    else
        echo "❌ 无法提取回复内容"
    fi

    # 显示Token使用情况
    TOKENS=$(echo "$BODY" | jq '.usage' 2>/dev/null)
    if [ -n "$TOKENS" ] && [ "$TOKENS" != "null" ]; then
        echo "📊 Token使用: $TOKENS"
    fi

else
    echo "❌ API连接失败 (HTTP $HTTP_CODE)"

    # 分析错误原因
    if [ "$HTTP_CODE" = "401" ]; then
        echo "🔑 原因: API密钥无效或过期"
        echo "💡 解决方案: 请检查API密钥是否正确，或重新获取密钥"
    elif [ "$HTTP_CODE" = "403" ]; then
        echo "🚫 原因: 权限不足或账户余额不足"
        echo "💡 解决方案: 请检查智谱AI账户余额和权限"
    elif [ "$HTTP_CODE" = "429" ]; then
        echo "⏰ 原因: 请求过于频繁（限流）"
        echo "💡 解决方案: 请稍后再试，或升级API套餐"
    elif [ "$HTTP_CODE" = "500" ]; then
        echo "🔧 原因: 服务器内部错误"
        echo "💡 解决方案: 通常是智谱AI服务问题，请稍后重试"
    else
        echo "❓ 原因: 未知错误"
        echo "💡 解决方案: 请联系智谱AI技术支持"
    fi
fi

echo ""
echo "================================"

# 测试2: 复杂查询测试
if [ "$HTTP_CODE" = "200" ]; then
    echo "🔍 测试2: 复杂查询测试（储能相关问题）"
    echo "-----------------------------------"

    RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d '{
        "model": "glm-5-turbo",
        "messages": [
          {"role": "system", "content": "你是一个专业的储能投资顾问"},
          {"role": "user", "content": "请简单分析一下广东省工商业储能项目的投资回报率通常在什么范围？"}
        ],
        "max_tokens": 200,
        "temperature": 0.7
      }' 2>&1)

    HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
    BODY2=$(echo "$RESPONSE2" | head -n -1)

    echo "HTTP状态码: $HTTP_CODE2"

    if [ "$HTTP_CODE2" = "200" ]; then
        REPLY2=$(echo "$BODY2" | jq -r '.choices[0].message.content' 2>/dev/null)
        echo "💬 AI回复: $REPLY2"

        # 检查回复质量
        if echo "$REPLY2" | grep -qE "(IRR|投资回报|储能|收益率|百分比|%)"; then
            echo "✅ 回复内容包含专业术语，质量良好"
        else
            echo "⚠️  回复内容可能不够专业"
        fi
    else
        echo "❌ 复杂查询失败"
    fi

    echo ""
fi

# 测试3: 模型参数测试
echo "🔍 测试3: 不同模型测试"
echo "-----------------------------------"

for MODEL in "glm-5-turbo" "glm-4"; do
    echo "测试模型: $MODEL"

    RESPONSE3=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d "{
        \"model\": \"$MODEL\",
        \"messages\": [
          {\"role\": \"user\", \"content\": \"你好\"}
        ],
        \"max_tokens\": 50
      }" 2>&1)

    HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)

    if [ "$HTTP_CODE3" = "200" ]; then
        echo "✅ $MODEL 可用"
    else
        echo "❌ $MODEL 不可用 (HTTP $HTTP_CODE3)"
    fi
done

echo ""
echo "================================"
echo "🎯 诊断总结:"
echo "如果所有测试都通过，GLM-5 Turbo应该可以正常使用"
echo "如果发现问题，请根据上述建议进行排查"
