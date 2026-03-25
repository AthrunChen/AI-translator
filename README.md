# AI 网页翻译器

一款支持 Chrome 和 Safari 的智能网页翻译浏览器扩展，基于 Kimi AI 实现高质量的英中翻译。

## ✨ 功能特点

- 🤖 **AI 驱动翻译** - 使用 Kimi AI 大模型，翻译质量高，理解上下文
- 📄 **双语对照** - 保留英文原文，中文翻译显示在原文下方
- ✨ **双向词汇高亮** - 独家功能！鼠标悬停词汇时，AI 自动识别对应关系，原文↔译文双向高亮
  - 🟢 悬停英文词汇 → 高亮对应的中文翻译
  - 🟡 悬停中文词汇 → 高亮对应的英文原文
  - 支持多词短语（如 "US Army Secretary" ↔ "美国陆军部长"）
- 🎯 **专业术语保留** - 智能识别技术词汇、专有名词，保持不翻译
- 📝 **可调提示词** - 支持自定义 AI 提示词 (Prompt)，满足个性化需求
- 🌐 **页面上下文** - 翻译时提供整个页面的标题、URL、摘要作为上下文
- 🎨 **美观界面** - 现代化的 UI 设计，支持深色模式
- ⚡ **快速便捷** - 一键翻译，实时显示进度
- 🧩 **双平台支持** - Chrome 和 Safari 全功能支持

### 浏览器支持对比

| 功能 | Chrome | Safari |
|------|--------|--------|
| AI 翻译 | ✅ | ✅ |
| 双语对照 | ✅ | ✅ |
| 词汇高亮 | ✅ | ✅ |
| 自定义提示词 | ✅ | ✅ |
| 深色模式 | ✅ | ✅ |
| 安装方式 | 商店/开发者模式 | Xcode 构建 |
| 自动更新 | ✅ Chrome Web Store | 需手动重新构建 |
| iOS 支持 | ❌ | ⚠️ iPad 优化中 |

## 📦 安装

### Chrome 安装

#### 方式一：开发者模式加载（推荐开发测试）

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `chrome` 文件夹
5. 扩展安装完成，工具栏会出现翻译图标

#### 方式二：Chrome Web Store（待发布）

访问 [Chrome Web Store 页面](#) 安装

### Safari 安装

Safari 版本需要 macOS 和 Xcode 来构建和安装。

#### 系统要求

- macOS 12.0+ (Monterey 或更高版本)
- Xcode 14.0+ (App Store 安装)
- Apple Developer Account（免费或付费均可）

#### 步骤一：配置代码签名

1. 打开 `safari/AI Web Translator/AI Web Translator.xcodeproj`
2. 在 Xcode 左侧栏选择项目 → 选择 Target "AI Web Translator (iOS)" 和 "AI Web Translator (macOS)"
3. 在 "Signing & Capabilities" 标签页：
   - 勾选 "Automatically manage signing"
   - 选择你的 Team（需要 Apple ID 登录）
   - **或** 手动设置 `DEVELOPMENT_TEAM` 为你的 Team ID

> 💡 **Team ID 获取方法**：
> - 登录 [Apple Developer Portal](https://developer.apple.com/account/resources/certificates/list)
> - 在 Membership 页面查看 Team ID
> - 或在 Xcode → Preferences → Accounts 中查看

#### 步骤二：构建和运行

**方法一：使用 Xcode（推荐）**

1. 用 Xcode 打开 `safari/AI Web Translator/AI Web Translator.xcodeproj`
2. 选择目标：
   - macOS: `AI Web Translator (macOS)` → My Mac
   - iOS: `AI Web Translator (iOS)` → 选择你的设备或模拟器
3. 点击 ▶️ 运行按钮构建
4. 首次运行会提示开启 Safari 扩展权限，按提示操作

**方法二：使用命令行脚本**

```bash
# 快速构建（需要先配置好签名）
./quick-build.sh

# 或使用完整构建脚本
./scripts/build-safari.sh
```

#### 步骤三：启用扩展

1. 打开 Safari → 设置 → 扩展
2. 找到 "AI Web Translator" 并勾选启用
3. 在工具栏右键 → "自定义工具栏"，将翻译图标拖到工具栏
4. **重要**：在 "扩展" 设置中，为需要翻译的网站授予权限（如 "所有网站" 或特定域名）

#### 步骤四：验证安装

1. 访问任意英文网页（如 [Apple News](https://www.apple.com/newsroom/)）
2. 点击 Safari 工具栏的翻译图标（蓝紫色 A-文 图标）
3. 配置 API Key（见下方配置章节）
4. 点击 "翻译当前页面"

#### Safari 版本已知限制

| 限制 | 说明 | 解决方案 |
|------|------|----------|
| 每次重启需重新启用 | 未签名的扩展每次 Safari 重启后需要重新启用 | 使用付费开发者账号签名后不再出现 |
| 仅支持 macOS | Safari 扩展架构限制 | 使用 Chrome 版本支持 Windows/Linux |
| 首次使用需授权 | Safari 要求用户明确授权每个网站 | 在扩展设置中勾选 "所有网站" |

#### Safari 故障排查

**问题：构建失败 "No signing certificate"**
- 解决：确保 Xcode 中已选择有效的 Team，或检查 Apple ID 是否已添加到 Xcode

**问题：扩展在 Safari 中不显示**
- 解决：检查 Safari → 设置 → 扩展 中是否已启用，并确保已添加到工具栏

**问题：点击图标无反应**
- 解决：检查 Safari → 设置 → 扩展 → AI Web Translator → 网站权限，确保已授予访问权限

**问题：翻译后页面样式错乱**
- 解决：某些网站的 CSS 可能与扩展冲突，尝试刷新页面或排除该域名

**问题：出现 "无法验证扩展" 警告**
- 解决：这是未付费开发者账号的正常现象，点击 "允许" 即可继续

详细技术文档请参考 [Safari 转换指南](./safari-conversion.md)

## 🔧 配置

⚠️ **首次使用必须配置以下三项**：
- **API URL** - API 服务端点地址
- **API Key** - 你的 API 密钥
- **模型** - 使用的模型名称

### 方式一：通过设置面板（推荐）

1. 点击浏览器工具栏中的翻译图标
2. 点击「设置」按钮
3. 选择 API Provider（OpenAI Compatible 或 Anthropic Messages）
4. 填写以下配置：
   - **API Base URL**: 如 `https://api.moonshot.cn/v1` (Kimi) 或 `https://api.openai.com/v1` (OpenAI)
   - **API Key**: 你的 API 密钥
   - **模型**: 如 `kimi-latest` (Kimi) 或 `gpt-4` (OpenAI)
5. 点击「保存设置」

**常用配置示例**：

| 服务商 | API Base URL | 模型 |
|--------|-------------|------|
| Kimi (Moonshot) | `https://api.moonshot.cn/v1` | `kimi-latest` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4` 或 `gpt-3.5-turbo` |
| 自定义 | 你的 API 地址 | 你的模型名称 |

### 获取 API Key

1. 访问 [Moonshot AI 开放平台](https://platform.moonshot.cn/)
2. 注册/登录账号
3. 在控制台创建 API Key
4. 复制 Key 到扩展设置中

## 🚀 使用

### 基本使用

1. 访问任意英文网页
2. 点击浏览器工具栏的翻译图标
3. 点击「翻译当前页面」
4. 等待翻译完成，页面会自动显示双语内容

### 快捷键

- 点击页面右下角的 🌐 按钮快速开始翻译

### 自定义提示词

默认提示词支持以下变量：
- `{title}` - 页面标题
- `{url}` - 页面 URL
- `{summary}` - 页面内容摘要
- `{text}` - 待翻译文本

示例自定义提示词：
```
请将以下网页内容翻译成中文。
页面主题: {title}
内容: {text}

要求：
1. 保留所有代码、变量名、URL
2. 使用学术风格翻译
3. 输出格式：原文 | 译文
```

## 📁 项目结构

```
AI-Web-Translator/
├── chrome/                    # Chrome 扩展
│   ├── manifest.json          # 扩展配置
│   ├── background.js          # 后台脚本（API 调用）
│   ├── content.js             # 内容脚本（页面处理）
│   ├── config.js              # 配置管理
│   ├── popup.html             # 弹出窗口
│   ├── popup.js               # 弹出窗口逻辑
│   ├── popup.css              # 弹出窗口样式
│   ├── translator.css         # 翻译结果显示样式
│   ├── api-adapter.js         # API 适配器
│   ├── view-mapping.js        # 词汇映射处理
│   ├── welcome.html           # 欢迎页面
│   └── icons/                 # 图标资源
│
├── safari/                    # Safari 扩展（macOS/iOS）
│   ├── AI Translator/         # Xcode 项目（主要）
│   │   ├── AI Translator.xcodeproj
│   │   ├── Shared (App)/      # macOS/iOS 应用代码
│   │   └── Shared (Extension)/# 扩展代码
│   │       └── Resources/     # 扩展资源（与 Chrome 共享）
│   └── AI Web Translator/     # 备选 Xcode 项目
│
├── scripts/                   # 构建脚本
│   ├── build-safari.sh        # Safari 构建脚本
│   ├── fix-safari-signing.sh  # 签名修复脚本
│   └── fix-signing.sh
│
├── quick-build.sh             # 快速构建脚本
├── install-chrome.sh          # Chrome 安装脚本
├── safari-conversion.md       # Safari 转换技术文档
└── README.md                  # 本文件
```

## ⚙️ 技术实现

### 支持的 API 格式

| Provider | 说明 | 认证方式 |
|---------|------|---------|
| `openai-compatible` | OpenAI 兼容格式 (Kimi, OpenAI, Azure) | `Authorization: Bearer {apiKey}` |
| `anthropic-messages` | Anthropic Messages API 格式 | `x-api-key: {apiKey}` |

### 并行翻译优化

采用 **10 线程并行** 翻译策略：
- 页面文本被智能分成多个批次
- 最多同时发送 10 个 API 请求
- 大幅提升翻译速度（相比串行翻译提升约 5-10 倍）
- 可在设置中调整并发数 (1-20)

⚠️ **注意**: 过高的并发可能导致 API 速率限制，建议根据 API 服务商的限制进行调整

### 翻译流程

```
用户点击翻译
    ↓
提取页面文本块（过滤代码、脚本等）
    ↓
构建带页面上下文的 Prompt
    ↓
根据 provider 调用对应 API 格式
    ↓
解析翻译结果
    ↓
插入到页面 DOM（原文下方显示译文）
```

### 核心特性

- **段落级翻译**: 以段落为单位进行翻译，避免碎片化，保持上下文完整
- **智能文本提取**: 自动识别可翻译文本，跳过代码块、图片说明、导航等
- **批量翻译**: 将多个段落合并请求，提高效率
- **上下文感知**: 提供页面标题、URL、摘要帮助 AI 理解语境
- **双语展示**: 保留原文，译文以相同样式显示在原文下方，不再使用蓝底高亮
- **并行加速**: 支持 10 线程并行翻译，大幅提升速度
- **AI 词汇对应**: 利用 AI 语义理解能力，实现精准的词汇级高亮对应
- **原文/译文切换**: 支持三种显示模式：双语对照、只看原文、只看译文
- **翻译缓存**: 翻译结果自动缓存，切换显示模式无需重新翻译
- **实时进度**: 翻译过程中实时更新进度条，译文逐步显示

## 🔒 隐私说明

- 扩展仅在用户主动点击翻译时发送数据到 API
- 页面内容仅用于翻译，不会被存储或用于其他目的
- API Key 保存在浏览器本地存储中
- 不会收集任何用户行为数据

## 🛠️ 开发

### 本地开发

```bash
# 克隆仓库
git clone <repo-url>
cd web-translator

# Chrome 开发
# 1. 修改 chrome/ 目录下的文件
# 2. 在 chrome://extensions/ 中刷新扩展

# Safari 开发
# 1. 修改 chrome/ 目录下的文件
# 2. 运行 ./scripts/sync-to-safari.sh 同步到 Safari 项目
# 3. 在 Xcode 中重新构建运行
# 或直接使用 ./quick-build.sh 一键构建

# 测试页面
# 访问任意英文技术文档网站测试
```

### Safari 开发工作流

**代码同步**

Chrome 和 Safari 共享大部分代码。修改 `chrome/` 目录后，需要同步到 Safari：

```bash
# 手动同步
./scripts/sync-to-safari.sh

# 或使用快速构建（自动同步）
./quick-build.sh
```

**重要区别**

| 特性 | Chrome | Safari |
|------|--------|--------|
| 存储 API | `chrome.storage.sync` | `browser.storage.local` |
| 变量声明 | `const/let` | `var`（共享命名空间） |
| 构建方式 | 直接加载 | 需 Xcode 构建 |
| 调试方式 | DevTools | Safari 开发者工具 |

**Safari 专用注意事项**

1. **使用 `var` 而非 `const/let`**：Safari 扩展的内容脚本共享全局命名空间，使用 `const` 会导致重复声明错误
2. **存储隔离**：Safari 使用 `browser.storage.local` 替代 `localStorage` 进行 popup 和 content script 间的通信
3. **Manifest V2**：当前使用 V2，未来可能需要升级到 V3

### 调试

#### Chrome 调试

**Content Script**: 
- 在网页上右键 → 检查 → Console 查看日志

**Background Script**:
- 扩展管理页面 → 点击「背景页」查看 DevTools

**Popup**:
- 右键点击扩展图标 → 检查弹出内容

#### Safari 调试

**Content Script**:
- Safari → 开发 → 你的设备 → 当前页面
- 或 Safari → 设置 → 高级 → 勾选 "在菜单栏中显示开发菜单"
- 然后在网页上右键 → "检查元素"

**Extension 背景页**:
- Safari → 开发 → 扩展背景页 → AI Web Translator Extension

**Popup**:
- 由于 Safari 限制，popup 调试较困难，建议在页面中插入调试元素或使用 alert

## 🐛 常见问题

**Q: 翻译按钮不显示？**
A: 尝试刷新页面，或检查扩展是否已启用。

**Q: API 请求失败？**
A: 检查 API Key 是否正确，以及网络连接是否正常。

**Q: 某些内容没有翻译？**
A: 扩展会自动跳过代码块、图片说明、导航栏等元素，这是预期行为。

**Q: 翻译结果顺序错乱？**
A: 请确保使用的是最新版本，已修复段落碎片化导致的顺序问题。

**Q: 图片说明被翻译了？**
A: 扩展已尽可能过滤图片说明，但某些网站的图片说明格式可能无法完全识别。

**Q: 如何清除翻译？**
A: 刷新页面即可恢复原文。

**Q: 翻译速度太慢？**
A: 检查网络连接，或在设置中增加并行线程数（1-20）。如果遇到 API 速率限制，请降低线程数。

**Q: 如何切换原文和译文？**
A: 点击右下角控制栏的 👁 按钮，或在扩展弹出窗口中点击"切换显示"。

**Q: 词汇高亮对应功能如何使用？**
A: 将鼠标悬停在原文或译文的词汇上，对应的词汇会自动高亮显示（原文为绿色，译文为黄色）。

**Q: Safari 版本和 Chrome 版本功能有区别吗？**
A: 核心翻译功能完全一致。Safari 版本由于平台限制，在首次安装和使用体验上略有不同（如需要重新启用扩展）。

**Q: Safari 扩展每次重启都需要重新启用？**
A: 这是未使用付费开发者账号签名的正常现象。使用付费 Apple Developer Program（$99/年）签名后即可永久启用。

**Q: 可以在 iPhone/iPad 上使用吗？**
A: Safari 扩展支持 iOS 15+，但本扩展主要针对桌面网页优化，移动端体验可能不完善。

## 📋 待办事项

- [ ] 支持更多翻译模式（段落级、整页级）
- [ ] 添加翻译历史记录
- [ ] 支持导出翻译内容
- [ ] 添加更多语言支持
- [ ] 优化大页面性能
- [ ] 添加键盘快捷键
- [ ] Safari 版本支持自动更新检查
- [ ] Safari iOS 版本优化适配
- [ ] 提交到 Mac App Store

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🙏 致谢

- 由 [Kimi AI](https://kimi.moonshot.cn/) 提供翻译能力
- 图标设计采用 Apple Design Language 风格
- Safari 扩展基于 Apple Safari Web Extensions API
