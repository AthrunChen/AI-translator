#!/bin/bash
# 终极方案：使用 Safari Web Extension 原生加载

echo "🎯 终极方案：直接加载 Web 扩展"
echo ""

# 确保扩展文件完整
RESOURCES="safari/AI Translator/Shared (Extension)/Resources"

if [ ! -f "$RESOURCES/manifest.json" ]; then
    echo "❌ 扩展文件不完整"
    exit 1
fi

echo "✅ 扩展文件检查通过"
echo ""
echo "📋 请按照以下步骤操作："
echo ""
echo "方法 1 - Safari Extension Builder（推荐）:"
echo "   1. 打开 Safari"
echo "   2. 菜单栏：开发 → 显示扩展构建器"
echo "   3. 点击左下角 '+' → 添加扩展"
echo "   4. 选择目录：$PWD/$RESOURCES"
echo "   5. 点击 '安装'"
echo ""
echo "方法 2 - 重启 Mac 后重试:"
echo "   如果方法1无效，请重启 Mac 后再次运行 ./run-safari.sh"
echo ""
echo "方法 3 - 降级到稳定版 macOS:"
echo "   macOS 15 (Sequoia) 正式版完全支持 Safari 扩展"
echo ""

# 打开 Safari
open -a Safari

# 尝试自动打开扩展构建器
sleep 2
osascript << 'APPLESCRIPT'
tell application "Safari"
    activate
end tell

 tell application "System Events"
    tell process "Safari"
        try
            click menu item "显示扩展构建器" of menu "开发" of menu bar 1
        end try
    end tell
end tell
APPLESCRIPT
