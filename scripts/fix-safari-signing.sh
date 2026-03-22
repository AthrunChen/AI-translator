#!/bin/bash

# Safari 扩展签名修复脚本
# 自动添加 DEVELOPMENT_TEAM 到 Xcode 项目

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SAFARI_PROJECT="$PROJECT_ROOT/safari/AI Web Translator/AI Web Translator.xcodeproj"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Safari 扩展签名修复...${NC}"

if [ ! -d "$SAFARI_PROJECT" ]; then
    echo -e "${RED}❌ Safari 项目不存在: $SAFARI_PROJECT${NC}"
    echo -e "${YELLOW}   请先运行: bash scripts/build-safari.sh${NC}"
    exit 1
fi

# 自动获取 Team ID
TEAM_ID=$(security find-identity -v -p codesigning 2>/dev/null | grep "Apple Development" | head -1 | sed 's/.*"\(.*\)".*/\1/' | xargs -I{} sh -c 'security find-certificate -c "{}" -p 2>/dev/null | openssl x509 -noout -subject 2>/dev/null | grep -o "OU=[^,]*" | cut -d= -f2' || echo "")

if [ -z "$TEAM_ID" ]; then
    echo -e "${YELLOW}⚠️  无法自动获取 Team ID${NC}"
    echo -e "${YELLOW}   请从 Xcode 中查看你的 Team ID${NC}"
    read -p "请输入 Team ID (例如: VKFLZM4DMK): " TEAM_ID
fi

if [ -z "$TEAM_ID" ]; then
    echo -e "${RED}❌ 未提供 Team ID${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 使用 Team ID: $TEAM_ID${NC}"

PBXPROJ="$SAFARI_PROJECT/project.pbxproj"

# 备份
BACKUP_FILE="${PBXPROJ}.backup.$(date +%s)"
cp "$PBXPROJ" "$BACKUP_FILE"
echo -e "${YELLOW}   已备份到: $BACKUP_FILE${NC}"

# 使用 awk 添加 DEVELOPMENT_TEAM
awk -v team="$TEAM_ID" '
/CODE_SIGN_STYLE = Automatic;/ {
    print
    print "\t\t\t\tDEVELOPMENT_TEAM = " team ";"
    next
}
{ print }
' "$PBXPROJ" > "${PBXPROJ}.tmp" && mv "${PBXPROJ}.tmp" "$PBXPROJ"

# 验证
COUNT=$(grep -c "DEVELOPMENT_TEAM = $TEAM_ID" "$PBXPROJ" || echo "0")
echo -e "${GREEN}✅ 签名配置完成${NC}"
echo -e "${GREEN}   - 已配置 $COUNT 处 DEVELOPMENT_TEAM${NC}"

echo -e ""
echo -e "${YELLOW}📋 下一步:${NC}"
echo -e "   1. 打开 Xcode 项目"
echo -e "   2. Cmd + Shift + K (清理)"
echo -e "   3. Cmd + B (构建)"
