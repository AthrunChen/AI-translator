#!/bin/bash
# 直接在 Safari 中加载扩展（无需构建 App）

echo "🚀 使用 Safari Extension Builder 直接加载扩展"

# 确保扩展文件存在
RESOURCES="safari/AI Translator/Shared (Extension)/Resources"

if [ ! -f "$RESOURCES/manifest.json" ]; then
    echo "❌ 扩展文件不完整"
    exit 1
fi

echo "✅ 扩展文件就绪"
echo ""
echo "📋 请手动操作："
echo ""
echo "   1. 打开 Safari"
echo "   2. 菜单栏 → 开发 → 显示扩展构建器"
echo "   3. 点击左下角的 '+' 按钮"
echo "   4. 选择以下目录："
echo "      $PWD/$RESOURCES"
echo "   5. 点击 '安装'"
echo ""
echo "⚠️  如果没有看到 '开发' 菜单："
echo "   Safari → 设置 → 高级 → 勾选 '在菜单栏中显示开发菜单'"
echo ""

# 打开 Safari
open -a Safari
