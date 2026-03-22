# 构建指南

## 快速开始

### Chrome 扩展

```bash
# 直接加载，无需构建
# 1. 打开 Chrome → chrome://extensions/
# 2. 开启「开发者模式」
# 3. 点击「加载已解压的扩展程序」
# 4. 选择 chrome/ 文件夹
```

### Safari 扩展

```bash
# 一键构建（需要先配置 Xcode 签名）
./quick-build.sh

# 手动构建
./scripts/build-safari.sh
```

## 详细步骤

### Safari 首次构建

1. **安装依赖**
   - macOS 12.0+
   - Xcode 14.0+ (App Store)
   - Apple ID (免费开发者账号即可)

2. **配置签名**
   ```bash
   # 打开 Xcode 项目
   open safari/AI\ Web\ Translator/AI\ Web\ Translator.xcodeproj
   
   # 或在 Xcode 中：
   # 1. 选择项目 → Targets → AI Web Translator (macOS)
   # 2. Signing & Capabilities → 选择你的 Team
   ```

3. **构建运行**
   ```bash
   # 方式一：命令行
   ./quick-build.sh
   
   # 方式二：Xcode
   # 选择 Target → My Mac → 点击 Run
   ```

4. **启用扩展**
   - Safari → 设置 → 扩展 → 勾选 "AI Web Translator"
   - 自定义工具栏 → 添加翻译图标
   - 授予网站访问权限

## 开发工作流

### 修改代码后同步

```bash
# 修改 chrome/ 目录后，同步到 Safari
./scripts/sync-to-safari.sh

# 然后重新构建 Safari 扩展
./quick-build.sh
```

### 图标生成

```bash
cd chrome/icons

# 生成扩展图标
node generate-icons.js

# 生成 macOS App 图标（全套尺寸）
node generate-app-icons.js
```

## 故障排查

| 问题 | 解决 |
|------|------|
| "No signing certificate" | 检查 Xcode 中是否选择了有效的 Team |
| 扩展不显示 | Safari → 设置 → 扩展 → 确认已启用 |
| 点击无反应 | 检查网站权限设置 |
| 每次重启需重新启用 | 使用付费开发者账号签名可解决 |

## 文件说明

| 脚本 | 用途 |
|------|------|
| `quick-build.sh` | 快速构建 Safari 扩展 |
| `scripts/build-safari.sh` | 完整构建脚本（带签名检查）|
| `scripts/sync-to-safari.sh` | 同步代码到 Safari 项目 |
| `chrome/icons/generate-icons.js` | 生成扩展图标 |
| `chrome/icons/generate-app-icons.js` | 生成 macOS App 图标 |
