#!/bin/bash
# Safari 扩展运行脚本 - 禁用 Metal 渲染避免兼容性问题

# 1. 清理缓存
echo "清理缓存..."
rm -rf ~/Library/Developer/Xcode/DerivedData/AI_Translator-*

# 2. 构建项目（命令行）
echo "构建项目..."
cd "safari/AI Translator"
xcodebuild -project "AI Translator.xcodeproj" \
    -scheme "AI Translator (macOS)" \
    -configuration Debug \
    -destination 'platform=macOS' \
    build \
    CODE_SIGN_IDENTITY="-" \
    DEVELOPMENT_TEAM="" \
    2>&1 | tail -20

# 3. 查找构建产物
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "AI Translator.app" -path "*/Build/Products/Debug/*" 2>/dev/null | head -1)

if [ -z "$APP_PATH" ]; then
    echo "构建失败或未找到应用"
    exit 1
fi

echo "找到应用: $APP_PATH"

# 4. 运行应用（禁用 Metal）
echo "启动应用..."
export METAL_DEVICE_WRAPPER_TYPE=0
export METAL_DEBUG_ERROR_MODE=0
export CA_LAYER_FRAMECOUNTER=0

killall "AI Translator" 2>/dev/null
sleep 1

open "$APP_PATH"

echo ""
echo "应用已启动。请在 Safari → 设置 → 扩展 中启用 'AI Translator Extension'"
echo ""
echo "如果仍有问题，请尝试重启 Mac 后重试。"
