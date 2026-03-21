#!/bin/bash
# 修复 Safari 扩展注册问题

echo "🧹 清理所有缓存..."
killall "AI Translator" 2>/dev/null
killall Safari 2>/dev/null
sleep 1

# 清理 Safari 扩展缓存
rm -rf ~/Library/Containers/com.apple.Safari/Data/Library/Safari/WebExtensions/*
rm -rf ~/Library/Containers/com.apple.Safari/Data/Library/Safari/Extensions/*
rm -rf ~/Library/Containers/com.apple.Safari/Data/Library/Preferences/com.apple.Safari.Extensions.plist

echo "🔨 重新构建扩展..."
cd "safari/AI Translator"

# 清理旧构建
rm -rf build

# 重新构建
xcodebuild -project "AI Translator.xcodeproj" \
    -scheme "AI Translator (macOS)" \
    -configuration Debug \
    -destination 'platform=macOS' \
    -derivedDataPath "build/DerivedData" \
    clean build \
    CODE_SIGN_IDENTITY="-" \
    DEVELOPMENT_TEAM="" \
    CODE_SIGN_STYLE=Manual \
    2>&1 | tail -10

APP_PATH="build/DerivedData/Build/Products/Debug/AI Translator.app"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo ""
echo "✅ 重新构建成功"

# 检查扩展是否存在
EXT_PATH="$APP_PATH/Contents/PlugIns/AI Translator Extension.appex"
if [ ! -d "$EXT_PATH" ]; then
    echo "❌ 扩展不存在"
    exit 1
fi

echo "✅ 扩展已打包"

# 确保扩展有正确的权限
echo "🔧 修复权限..."
chmod -R 755 "$APP_PATH"
codesign --force --deep --sign - "$APP_PATH" 2>/dev/null || true

echo ""
echo "🚀 启动应用..."
export CA_DISABLE_GPU=1
open "$APP_PATH"

sleep 3

echo ""
echo "📋 强制注册扩展到系统..."
# 强制系统重新扫描扩展
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP_PATH"

echo ""
echo "🌐 打开 Safari..."
open -a Safari

echo ""
echo "✅ 完成！请在 Safari → 设置 → 扩展中查看"
echo ""
echo "⚠️  如果还是没有，尝试以下步骤："
echo "   1. 完全退出 Safari (Cmd+Q)"
echo "   2. 重新打开 Safari"
echo "   3. 再次检查 设置 → 扩展"
echo ""
echo "🔄 或者尝试重启 Mac 后重试"
