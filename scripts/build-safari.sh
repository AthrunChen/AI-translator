#!/bin/bash

# Safari 扩展构建脚本
# 将 Chrome 扩展转换为 Safari 扩展

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHROME_DIR="$PROJECT_ROOT/chrome"
SAFARI_DIR="$PROJECT_ROOT/safari"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始构建 Safari 扩展...${NC}"

# 检查是否安装了 xcrun
if ! command -v xcrun &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 xcrun，请安装 Xcode Command Line Tools${NC}"
    exit 1
fi

# 创建临时目录
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${YELLOW}📦 准备扩展文件...${NC}"

# 复制 Chrome 扩展文件
mkdir -p "$TEMP_DIR/extension"
cp -r "$CHROME_DIR"/* "$TEMP_DIR/extension/"

# 修改 manifest.json 为 Safari 兼容版本
echo -e "${YELLOW}📝 适配 Safari manifest...${NC}"

# 创建 Safari 版本 manifest
cat > "$TEMP_DIR/extension/manifest.json" << 'MANIFEST'
{
  "manifest_version": 2,
  "name": "AI 网页翻译器",
  "version": "1.0.0",
  "description": "使用 AI 智能翻译网页内容，保留英文原文，中文显示在下方",
  "default_locale": "zh_CN",
  "permissions": [
    "activeTab",
    "storage",
    "<all_urls>"
  ],
  "background": {
    "scripts": ["api-adapter.js", "config.js", "background.js"],
    "persistent": false
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["debug-config.js", "api-adapter.js", "config.js", "content.js"],
      "css": ["translator.css"],
      "run_at": "document_end"
    }
  ],
  "browser_action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": [
    "translator.css"
  ]
}
MANIFEST

# 输出目录
OUTPUT_DIR="${SAFARI_DIR}/AI Web Translator"

# 使用 safari-web-extension-converter 转换
echo -e "${YELLOW}🔄 运行 safari-web-extension-converter...${NC}"

if xcrun --find safari-web-extension-converter &> /dev/null; then
    # 删除旧项目（如果存在）
    if [ -d "$OUTPUT_DIR" ]; then
        echo -e "${YELLOW}🗑️  清理旧项目...${NC}"
        rm -rf "$OUTPUT_DIR"
    fi
    
    # 运行转换器
    xcrun safari-web-extension-converter "$TEMP_DIR/extension" \
        --project-location "$SAFARI_DIR" \
        --app-name "AI Web Translator" \
        --bundle-identifier "com.yourcompany.ai-web-translator" \
        --swift \
        --force \
        --no-prompt \
        --no-open \
        --copy-resources
    
    echo -e "${GREEN}✅ Safari 扩展项目已生成: ${OUTPUT_DIR}${NC}"
    echo -e "${YELLOW}📋 下一步:${NC}"
    echo -e "   1. 打开 ${OUTPUT_DIR}/AI Web Translator.xcodeproj"
    echo -e "   2. 在 Xcode 中配置签名 (Team)"
    echo -e "   3. 构建并运行测试"
    echo -e "   4. 归档并分发"
else
    echo -e "${YELLOW}⚠️  未找到 safari-web-extension-converter${NC}"
    echo -e "${YELLOW}   请确保已安装 Xcode 13.0+${NC}"
    echo -e ""
    echo -e "${YELLOW}📝 手动转换步骤:${NC}"
    echo -e "   1. 打开 Xcode"
    echo -e "   2. 选择 File → New → Project"
    echo -e "   3. 选择 Safari Extension App"
    echo -e "   4. 将 ${TEMP_DIR}/extension 中的文件复制到项目 Resources 目录"
    exit 1
fi
