#!/bin/bash

# 修复 Safari 扩展签名问题
# 确保 App 和 Extension 使用相同的签名证书

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_FILE="$PROJECT_ROOT/safari/AI Web Translator/AI Web Translator.xcodeproj/project.pbxproj"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 修复 Safari 扩展签名问题...${NC}"

# 检查项目文件是否存在
if [ ! -f "$PROJECT_FILE" ]; then
    echo -e "${RED}❌ 错误: 未找到项目文件${NC}"
    echo "路径: $PROJECT_FILE"
    exit 1
fi

# 备份原文件
BACKUP_FILE="${PROJECT_FILE}.backup.$(date +%s)"
echo -e "${YELLOW}📦 备份原项目文件...${NC}"
cp "$PROJECT_FILE" "$BACKUP_FILE"
echo -e "${BLUE}   备份已保存到: $BACKUP_FILE${NC}"

# 尝试自动获取 Team ID
TEAM_ID=""

# 方法1: 从安全工具获取
echo -e "${YELLOW}🔍 尝试自动获取 Team ID...${NC}"
CERT_INFO=$(security find-certificate -c "Apple Development" -p 2>/dev/null | openssl x509 -noout -subject -nameopt RFC2253 2>/dev/null || true)
if [ -n "$CERT_INFO" ]; then
    # 提取 OU 字段
    TEAM_ID=$(echo "$CERT_INFO" | grep -o 'OU=[^,]*' | cut -d'=' -f2 | head -1)
fi

# 方法2: 如果方法1失败，尝试从用户输入
if [ -z "$TEAM_ID" ]; then
    echo -e "${YELLOW}⚠️  无法自动获取 Team ID${NC}"
    echo ""
    echo "请打开 Xcode，进入 Preferences > Accounts"
    echo "选择你的 Apple ID，然后点击 'Manage Certificates'"
    echo "找到 Team ID (通常是 10 个字符的字符串)"
    echo ""
    read -p "请输入你的 Team ID (例如: VKFLZM4DMK): " TEAM_ID
fi

if [ -z "$TEAM_ID" ]; then
    echo -e "${RED}❌ 错误: Team ID 不能为空${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 使用 Team ID: $TEAM_ID${NC}"

# 修复项目文件 - 添加 DEVELOPMENT_TEAM 到所有目标配置
echo -e "${YELLOW}📝 修改项目文件...${NC}"

# 使用 sed 添加 DEVELOPMENT_TEAM 设置
# 我们需要在每个 buildSettings 块中添加 DEVELOPMENT_TEAM

# 创建临时文件
TMP_FILE=$(mktemp)

# 读取文件并修改
awk -v team_id="$TEAM_ID" '
BEGIN { in_build_settings = 0; added_team = 0; }
/^[[:space:]]*buildSettings[[:space:]]*=/ {
    in_build_settings = 1
    added_team = 0
}
/^[[:space:]]*};/ && in_build_settings {
    if (!added_team) {
        # 在结束符前添加 DEVELOPMENT_TEAM
        print "\t\t\t\tDEVELOPMENT_TEAM = " team_id ";"
        added_team = 1
    }
    in_build_settings = 0
}
/DEVELOPMENT_TEAM[[:space:]]*=/ {
    # 替换现有的 DEVELOPMENT_TEAM
    sub(/DEVELOPMENT_TEAM[[:space:]]*=[^;]+;/, "DEVELOPMENT_TEAM = " team_id ";")
    added_team = 1
}
{ print }
' "$PROJECT_FILE" > "$TMP_FILE"

# 检查是否成功添加了 DEVELOPMENT_TEAM
if grep -q "DEVELOPMENT_TEAM = $TEAM_ID" "$TMP_FILE"; then
    mv "$TMP_FILE" "$PROJECT_FILE"
    echo -e "${GREEN}✅ 成功添加 DEVELOPMENT_TEAM 到项目配置${NC}"
else
    # 如果 awk 方法没有生效，尝试直接替换
    rm "$TMP_FILE"
    
    echo -e "${YELLOW}⚠️  使用备选方法...${NC}"
    
    # 为每个目标配置添加 DEVELOPMENT_TEAM
    # 找到所有 buildSettings 区域并添加
    
    # 方法: 在 CODE_SIGN_STYLE 行之前添加 DEVELOPMENT_TEAM
    sed -i.bak "s/CODE_SIGN_STYLE = Automatic;/DEVELOPMENT_TEAM = $TEAM_ID;\\
\t\t\t\tCODE_SIGN_STYLE = Automatic;/g" "$PROJECT_FILE"
    
    if grep -q "DEVELOPMENT_TEAM = $TEAM_ID" "$PROJECT_FILE"; then
        echo -e "${GREEN}✅ 成功添加 DEVELOPMENT_TEAM${NC}"
        rm -f "${PROJECT_FILE}.bak"
    else
        echo -e "${RED}❌ 自动修复失败，请手动设置签名${NC}"
        echo ""
        echo "手动设置步骤:"
        echo "1. 打开 Xcode"
        echo "2. 打开 safari/AI Web Translator/AI Web Translator.xcodeproj"
        echo "3. 选择项目，点击每个 Target"
        echo "4. 在 Signing & Capabilities 中选择你的 Team"
        echo "5. 确保所有 Targets 使用相同的 Team"
        exit 1
    fi
fi

# 验证修改
echo -e "${YELLOW}🔍 验证修改结果...${NC}"
TEAM_COUNT=$(grep -c "DEVELOPMENT_TEAM = $TEAM_ID" "$PROJECT_FILE" || true)
echo -e "${BLUE}   找到 $TEAM_COUNT 处 DEVELOPMENT_TEAM 配置${NC}"

echo ""
echo -e "${GREEN}✅ 签名修复完成！${NC}"
echo ""
echo -e "${YELLOW}📋 下一步:${NC}"
echo "   1. 在 Xcode 中重新打开项目"
echo "   2. 清理构建: Cmd + Shift + K"
echo "   3. 重新构建: Cmd + B"
echo ""
echo -e "${BLUE}💡 提示: 如果仍有问题，请检查:${NC}"
echo "   - Xcode 中是否登录了正确的 Apple ID"
echo "   - 是否选择了有效的 Development Team"
echo "   - macOS App 和 Extension 是否都配置了签名"
