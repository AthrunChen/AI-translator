#!/bin/bash
# macOS 26 兼容的运行脚本

echo "🚀 构建 Safari 扩展..."
cd "safari/AI Translator"

# 构建
xcodebuild -project "AI Translator.xcodeproj" \
    -scheme "AI Translator (macOS)" \
    -configuration Debug \
    -destination 'platform=macOS' \
    build \
    CODE_SIGN_IDENTITY="-" \
    DEVELOPMENT_TEAM="" \
    SWIFT_OPTIMIZATION_LEVEL="-Onone" \
    2>&1 | grep -E "(BUILD|SUCCEEDED|FAILED|error:)"

# 找到应用
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "AI Translator.app" -path "*/Build/Products/Debug/*" 2>/dev/null | head -1)

if [ -z "$APP_PATH" ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo ""
echo "✅ 应用位置: $APP_PATH"
echo ""

# 杀掉旧进程
killall "AI Translator" 2>/dev/null
sleep 1

# 使用兼容性模式运行（禁用 Metal）
echo "🎯 启动应用（兼容模式）..."
export CA_ASSERT_MAIN_THREAD_TRANSACTIONS=0
export CA_DISABLE_GPU=1
export METAL_DEVICE_WRAPPER_TYPE=0
export METAL_DEBUG_ERROR_MODE=0
export MTL_DEBUG_LAYER=0

open "$APP_PATH"

echo ""
echo "⏳ 等待应用启动..."
sleep 3

echo ""
echo "📋 下一步操作："
echo "   1. 在屏幕顶部菜单栏或 Dock 找到 'AI Translator'"
echo "   2. 点击打开应用窗口"
echo "   3. 然后打开 Safari → 设置 → 扩展"
echo "   4. 勾选 'AI Translator Extension' 启用"
echo ""
echo "⚠️  如果应用图标显示异常，属于已知问题，不影响功能"
