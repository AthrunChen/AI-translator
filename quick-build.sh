#!/bin/bash
set -e

echo "🔨 快速构建 Safari 扩展..."
cd "safari/AI Translator"

# 构建（使用更短的超时）
xcodebuild -project "AI Translator.xcodeproj" \
    -scheme "AI Translator (macOS)" \
    -configuration Debug \
    -destination 'platform=macOS' \
    -derivedDataPath "build/DerivedData" \
    build \
    CODE_SIGN_IDENTITY="-" \
    DEVELOPMENT_TEAM="" \
    CODE_SIGN_STYLE=Manual \
    2>&1 | grep -E "(BUILD|SUCCEEDED|FAILED|error:|warning:)" || true

APP_PATH="build/DerivedData/Build/Products/Debug/AI Translator.app"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ 构建失败，检查完整日志..."
    exit 1
fi

echo ""
echo "✅ 构建成功！"
echo "📦 应用位置: $APP_PATH"

# 检查扩展
EXT_PATH="$APP_PATH/Contents/PlugIns/AI Translator Extension.appex"
if [ -d "$EXT_PATH" ]; then
    echo "✅ 扩展已打包"
    ls "$EXT_PATH/Contents/Resources/" | head -5
else
    echo "⚠️  扩展未找到"
fi

echo ""
echo "🚀 正在启动..."
killall "AI Translator" 2>/dev/null || true
export CA_DISABLE_GPU=1
open "$APP_PATH"

echo ""
echo "✅ 应用已启动！"
echo ""
echo "📋 下一步："
echo "   1. 查看屏幕顶部菜单栏或 Dock 是否有 AI Translator"
echo "   2. 点击打开应用窗口"
echo "   3. 打开 Safari → 设置 → 扩展"
echo "   4. 勾选 'AI Translator Extension'"
