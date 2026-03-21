#!/bin/bash
# 安装 Chrome 扩展（更可靠的方案）

echo "🌐 打开 Chrome..."
open -a "Google Chrome" 2>/dev/null || open -a "Chromium" 2>/dev/null || echo "请手动打开 Chrome"

echo ""
echo "📋 请按照以下步骤在 Chrome 中加载扩展："
echo ""
echo "1. 在 Chrome 地址栏输入：chrome://extensions/"
echo "2. 开启右上角的 '开发者模式' (Developer mode)"
echo "3. 点击 '加载已解压的扩展' (Load unpacked)"
echo "4. 选择以下目录："
echo "   $PWD/chrome"
echo "5. 点击 '选择' 完成安装"
echo ""
echo "✅ 安装后，Chrome 工具栏会出现翻译图标"
echo ""
echo "📁 扩展目录内容："
ls -la chrome/
