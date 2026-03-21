#!/bin/bash
# macOS 26 Safari 扩展修复脚本

set -e

echo "🔧 修复 macOS 26 兼容性问题..."

# 1. 清理所有缓存
echo "🧹 清理缓存..."
killall "AI Translator" 2>/dev/null || true
killall Safari 2>/dev/null || true
sleep 1

rm -rf ~/Library/Developer/Xcode/DerivedData/AI_Translator-*
rm -rf safari/AI\ Translator/build
rm -rf ~/Library/Containers/com.apple.Safari/Data/Library/Safari/WebExtensions/*
rm -rf ~/Library/Caches/com.apple.Safari/*

# 2. 重新构建
echo "🔨 重新构建..."
cd safari/AI\ Translator

xcodebuild -project "AI Translator.xcodeproj" \
    -scheme "AI Translator (macOS)" \
    -configuration Debug \
    -destination 'platform=macOS' \
    -derivedDataPath "build/DerivedData" \
    clean build \
    CODE_SIGN_IDENTITY="-" \
    DEVELOPMENT_TEAM="" \
    CODE_SIGN_STYLE=Manual \
    2>&1 | tail -15

APP_PATH="build/DerivedData/Build/Products/Debug/AI Translator.app"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建成功"

# 3. 修复权限和签名
echo "🔐 修复签名..."
codesign --force --deep --sign - "$APP_PATH" 2>/dev/null || true

# 4. 注册扩展到系统
echo "📋 注册扩展..."
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f -R "$APP_PATH"

cd ../..

# 5. 创建启动脚本
cat > run-safari.sh << 'EOF'
#!/bin/bash
# 启动脚本 - 完全禁用 Metal 和图形加速

# 设置所有环境变量禁用 Metal
export CA_ASSERT_MAIN_THREAD_TRANSACTIONS=0
export CA_DISABLE_GPU=1
export CA_LAYER_FRAMECOUNTER=0
export METAL_DEVICE_WRAPPER_TYPE=0
export METAL_DEBUG_ERROR_MODE=0
export MTL_DEBUG_LAYER=0
export MTL_ENABLE_DEBUG_INFO=0
export MTL_FAST_MATH=0
export CG_CONTEXT_SHOW_BACKTRACE=0
export CGBITMAP_CONTEXT_LOG_ERRORS=0
export NSShowAppKitThreads=0

# 杀掉旧进程
killall "AI Translator" 2>/dev/null || true
sleep 1

# 启动应用
APP_PATH="safari/AI Translator/build/DerivedData/Build/Products/Debug/AI Translator.app"
if [ -d "$APP_PATH" ]; then
    echo "🚀 启动 AI Translator..."
    open "$APP_PATH"
    sleep 3
    echo "✅ 应用已启动"
    echo ""
    echo "📋 下一步："
    echo "   1. 在屏幕顶部菜单栏或 Dock 找到 AI Translator"
    echo "   2. 点击打开应用窗口"
    echo "   3. 打开 Safari → 设置 → 扩展"
    echo "   4. 勾选 'AI Translator Extension'"
    echo ""
    echo "⚠️  如果没有看到扩展，请尝试："
    echo "   - 完全退出 Safari (Cmd+Q) 再重新打开"
    echo "   - 重启 Mac 后重试"
else
    echo "❌ 未找到应用，请先运行 fix-macos26.sh"
fi
EOF

chmod +x run-safari.sh

echo ""
echo "✅ 修复完成！"
echo ""
echo "🚀 现在运行: ./run-safari.sh"
