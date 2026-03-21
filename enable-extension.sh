#!/bin/bash
# 强制 Safari 识别扩展

echo "🔄 重启应用和 Safari..."
killall "AI Translator" 2>/dev/null
killall Safari 2>/dev/null
sleep 2

echo "🚀 重新启动应用..."
export CA_DISABLE_GPU=1
open safari/AI\ Translator/build/DerivedData/Build/Products/Debug/AI\ Translator.app

sleep 3

echo "🌐 打开 Safari 扩展设置..."
open -a Safari

sleep 2

echo ""
echo "📋 请手动操作："
echo "   1. 在 Safari 中点击菜单：Safari → 设置 → 扩展"
echo "   2. 查找 'AI Translator Extension'"
echo "   3. 勾选启用"
echo ""
echo "⚠️  如果还是看不到，尝试以下命令清除缓存："
echo "   rm -rf ~/Library/Containers/com.apple.Safari/Data/Library/Safari/WebExtensions/"
echo ""
read -p "按回车键继续..."
