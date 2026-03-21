#!/bin/bash
# 使用 Apple 官方工具重新生成 Safari 扩展

set -e

echo "🔧 使用 safari-web-extension-converter 重新生成项目..."

# 备份旧项目
if [ -d "safari/AI Translator" ]; then
    echo "📦 备份旧项目..."
    mv "safari/AI Translator" "safari/AI Translator.backup.$(date +%s)"
fi

# 使用官方工具转换
echo "🔄 转换 Chrome 扩展到 Safari..."
xcrun safari-web-extension-converter \
    "chrome" \
    --project-location "safari" \
    --app-name "AI Translator" \
    --bundle-identifier "com.chenyufan.ai-translator" \
    --swift \
    --force

echo ""
echo "✅ 项目重新生成完成！"
echo ""

# 修改新项目的构建设置以兼容 macOS 26
echo "🔧 应用 macOS 26 兼容性修复..."

PROJECT_FILE="safari/AI Translator/AI Translator.xcodeproj/project.pbxproj"

# 禁用 Hardened Runtime 和沙盒（测试用）
sed -i '' 's/ENABLE_HARDENED_RUNTIME = YES;/ENABLE_HARDENED_RUNTIME = NO;/g' "$PROJECT_FILE"
sed -i '' 's/ENABLE_APP_SANDBOX = YES;/ENABLE_APP_SANDBOX = NO;/g' "$PROJECT_FILE"

# 设置手动签名
sed -i '' 's/CODE_SIGN_STYLE = Automatic;/CODE_SIGN_STYLE = Manual;/g' "$PROJECT_FILE"
sed -i '' 's/DEVELOPMENT_TEAM = [^;]*;/DEVELOPMENT_TEAM = "";/g' "$PROJECT_FILE"
sed -i '' 's/CODE_SIGN_IDENTITY = [^;]*;/CODE_SIGN_IDENTITY = "-";/g' "$PROJECT_FILE"

# 设置架构
sed -i '' 's/MACOSX_DEPLOYMENT_TARGET = [0-9.]*;/MACOSX_DEPLOYMENT_TARGET = 11.0;/g' "$PROJECT_FILE"

echo "✅ 兼容性修复完成"
echo ""
echo "🔨 开始构建..."

cd "safari/AI Translator"

# 构建
xcodebuild -project "AI Translator.xcodeproj" \
    -scheme "AI Translator (macOS)" \
    -configuration Debug \
    -destination 'platform=macOS' \
    -derivedDataPath "build/DerivedData" \
    build \
    CODE_SIGN_IDENTITY="-" \
    DEVELOPMENT_TEAM="" \
    CODE_SIGN_STYLE=Manual \
    2>&1 | tail -10

echo ""
echo "✅ 构建完成！"
echo ""
echo "🚀 启动应用..."

# 启动
export CA_DISABLE_GPU=1
open "build/DerivedData/Build/Products/Debug/AI Translator.app"

echo ""
echo "📋 请检查 Safari → 设置 → 扩展"
