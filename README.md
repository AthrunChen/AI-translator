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

请参考 [Safari 转换指南](./safari-conversion.md)

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

### 方式二：通过 OpenClaw 格式配置（推荐用于脚本注入）

支持标准的 OpenClaw 配置格式：

```javascript
// 在网页 Console 中执行，或在外部脚本中注入
window.openclaw = {
  "provider": "anthropic-messages",
  "baseUrl": "https://api.kimi.com/coding",
  "apiKey": "sk-kimi-your-api-key",
  "model": "kimi-for-coding"
};
```

或使用 `KIMI_CODING_API_CONFIG` 包装：

```javascript
window.KIMI_CODING_API_CONFIG = {
  "openclaw": {
    "provider": "anthropic-messages",
    "baseUrl": "https://api.kimi.com/coding",
    "apiKey": "sk-kimi-your-api-key",
    "model": "kimi-for-coding"
  }
};
```

### 方式三：localStorage

```javascript
localStorage.setItem('openclaw', JSON.stringify({
  "provider": "anthropic-messages",
  "baseUrl": "https://api.kimi.com/coding",
  "apiKey": "sk-kimi-your-api-key",
  "model": "kimi-for-coding"
}));
```

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
web-translator/
├── chrome/                    # Chrome 扩展
│   ├── manifest.json          # 扩展配置
│   ├── background.js          # 后台脚本（API 调用）
│   ├── content.js             # 内容脚本（页面处理）
│   ├── config.js              # 配置管理
│   ├── popup.html             # 弹出窗口
│   ├── popup.js               # 弹出窗口逻辑
│   ├── popup.css              # 弹出窗口样式
│   ├── translator.css         # 翻译结果显示样式
│   ├── welcome.html           # 欢迎页面
│   └── icons/                 # 图标
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── safari-conversion.md       # Safari 转换指南
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

# 测试页面
# 访问任意英文技术文档网站测试
```

### 调试

**Content Script**: 
- 在网页上右键 → 检查 → Console 查看日志

**Background Script**:
- 扩展管理页面 → 点击「背景页」查看 DevTools

**Popup**:
- 右键点击扩展图标 → 检查弹出内容

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

## 📋 待办事项

- [ ] 支持更多翻译模式（段落级、整页级）
- [ ] 添加翻译历史记录
- [ ] 支持导出翻译内容
- [ ] 添加更多语言支持
- [ ] 优化大页面性能
- [ ] 添加键盘快捷键

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🙏 致谢

- 由 [Kimi AI](https://kimi.moonshot.cn/) 提供翻译能力
- 图标设计基于 Fluent Emoji
