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
