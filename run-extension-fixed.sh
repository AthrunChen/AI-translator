#!/bin/bash
set -e

echo "🧹 清理旧的构建..."
killall "AI Translator" 2>/dev/null || true
rm -rf ~/Library/Developer/Xcode/DerivedData/AI_Translator-*
rm -rf safari/AI\ Translator/build

echo ""
echo "🔨 构建应用..."
cd "safari/AI Translator"

# 使用干净的路径构建
xcodebuild -project "AI Translator.xcodeproj" \
    -scheme "AI Translator (macOS)" \
    -configuration Debug \
    -destination 'platform=macOS' \
    -derivedDataPath "build/DerivedData" \
    build \
    CODE_SIGN_IDENTITY="-" \
    DEVELOPMENT_TEAM="" \
    CODE_SIGN_STYLE=Manual

# 检查构建结果
APP_PATH="build/DerivedData/Build/Products/Debug/AI Translator.app"
if [ ! -d "$APP_PATH" ]; then
    echo "❌ 未找到应用"
    exit 1
fi

echo ""
echo "✅ 构建成功: $APP_PATH"

# 检查扩展是否存在
EXTENSION_PATH="$APP_PATH/Contents/PlugIns/AI Translator Extension.appex"
if [ ! -d "$EXTENSION_PATH" ]; then
    echo "⚠️  警告: 扩展文件未找到"
else
    echo "✅ 扩展已打包"
fi

echo ""
echo "🚀 启动应用..."

# 使用兼容模式
export CA_DISABLE_GPU=1
export METAL_DEVICE_WRAPPER_TYPE=0

# 确保权限
chmod -R +x "$APP_PATH/Contents/MacOS/" 2>/dev/null || true

# 运行
open "$APP_PATH"

echo ""
echo "⏳ 等待启动..."
sleep 4

echo ""
echo "📋 检查应用状态..."
if pgrep -f "AI Translator" > /dev/null; then
    echo "✅ 应用正在运行"
else
    echo "⚠️  应用可能未启动成功，尝试直接运行可执行文件..."
    "$APP_PATH/Contents/MacOS/AI Translator" &
fi

echo ""
echo "🌐 现在请在 Safari 中启用扩展："
echo "   1. 打开 Safari"
echo "   2. 点击菜单栏 Safari → 设置"
echo "   3. 切换到 '扩展' 标签"
echo "   4. 找到 'AI Translator Extension' 并勾选"
echo ""
echo "⚠️  如果没有看到扩展，尝试以下命令强制刷新："
echo "   killall Safari; sleep 2; open -a Safari"
echo ""
read -p "按回车键继续..."
