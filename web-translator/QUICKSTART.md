# 快速开始指南

## 5 分钟上手指南

### 1. 安装 Chrome 扩展（2分钟）

```bash
# 进入项目目录
cd web-translator/chrome

# 或者使用绝对路径
```

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的「开发者模式」开关
3. 点击「加载已解压的扩展程序」
4. 选择 `web-translator/chrome` 文件夹
5. 看到 🌐 图标出现在工具栏即安装成功

### 2. 配置 API Key（2分钟）

1. 访问 [Moonshot AI 开放平台](https://platform.moonshot.cn/)
2. 注册/登录账号
3. 进入「API Key 管理」
4. 点击「创建 API Key」
5. 复制生成的 Key

回到浏览器：

1. 点击工具栏的 🌐 图标
2. 点击「设置」
3. 粘贴 API Key
4. 点击「保存设置」

### 3. 开始使用（1分钟）

1. 打开任意英文网页（如 https://docs.python.org）
2. 点击 🌐 图标 → 「翻译当前页面」
3. 或点击页面右下角的 🌐 浮动按钮
4. 等待翻译完成，享受双语阅读！

## 环境变量配置（高级）

### OpenClaw 格式（推荐）

支持标准的 OpenClaw 配置，特别适用于 `anthropic-messages` provider：

```javascript
// 方式 1: 直接设置 window.openclaw
window.openclaw = {
  provider: "anthropic-messages",
  baseUrl: "https://api.kimi.com/coding",
  apiKey: "sk-kimi-your-api-key",
  model: "kimi-for-coding"
};

// 方式 2: 使用 KIMI_CODING_API_CONFIG 包装
window.KIMI_CODING_API_CONFIG = {
  openclaw: {
    provider: "anthropic-messages",
    baseUrl: "https://api.kimi.com/coding",
    apiKey: "sk-kimi-your-api-key",
    model: "kimi-for-coding"
  }
};

// 方式 3: localStorage
localStorage.setItem('openclaw', JSON.stringify({
  provider: "anthropic-messages",
  baseUrl: "https://api.kimi.com/coding",
  apiKey: "sk-kimi-your-api-key",
  model: "kimi-for-coding"
}));
```

### 标准格式

如果你使用 OpenAI 兼容格式（Kimi/OpenAI）：

```javascript
window.KIMI_CODING_API_CONFIG = {
  api_key: 'your-api-key-here',
  base_url: 'https://api.moonshot.cn/v1',
  model: 'kimi-latest'
};
```

### 修改配置文件

编辑 `chrome/config.js` 中的 DEFAULT_CONFIG：

```javascript
const DEFAULT_CONFIG = {
  api: {
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKey: 'your-api-key-here',  // 填入你的 Key
    model: 'kimi-latest'
  },
  // ...
};
```

## Safari 安装（可选）

### 自动转换

```bash
# 运行转换脚本
./scripts/build-safari.sh

# 然后打开生成的 Xcode 项目
open safari/AI\ Web\ Translator/AI\ Web\ Translator.xcodeproj
```

### 手动转换

详细步骤请参考 [Safari 转换指南](./safari-conversion.md)

## 功能特性

### AI 词汇对应（新功能）
利用 AI 的语义理解能力，实现精准的词汇级高亮：

**工作原理**：
1. 翻译时，AI 同时返回词汇对应表（如：network → 网络）
2. 脚本解析对应表，建立精确的词汇映射
3. 悬停时，根据 AI 提供的对应关系高亮相关词汇

**高亮效果**：
- 悬停原文英文单词 → 译文中对应的中文词汇高亮黄色
- 悬停译文中文词汇 → 原文中对应的英文单词高亮绿色
- 同时整段获得浅色系背景高亮

**优势**：
- 语义准确：AI 理解上下文，对应关系更精准
- 支持意译：即使译文结构调整，仍能正确对应
- 处理一词多义：根据语境选择正确对应

示例：
```
原文：The network provides connectivity.
AI 返回：network | 网络, provides | 提供, connectivity | 连接
悬停 "network" → 译文 "网络" 高亮
```

### 原文/译文切换
- 翻译完成后，点击右下角 👁 按钮切换显示模式
- 支持三种模式：双语对照 / 只看原文 / 只看译文
- 切换时**无需重新翻译**，使用缓存结果即时切换

### 翻译缓存
- 翻译结果自动缓存在内存中
- 切换显示模式时直接使用缓存，无需重新请求 API
- 刷新页面后缓存会重置

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 扩展图标不出现 | 刷新页面或重启 Chrome |
| API 请求失败 | 检查 API Key 是否正确，网络是否正常 |
| 某些内容未翻译 | 这是正常的，扩展会自动跳过代码块、图片说明等 |
| 翻译顺序错乱/重复 | 确保使用最新版本，已修复段落碎片化问题 |
| 翻译质量不佳 | 在设置中调整提示词 (Prompt) |
| 翻译速度过慢 | 检查网络连接，或在设置中增加并行线程数（1-20）|
| 触发 API 速率限制 | 在设置中降低并行线程数（建议 5-10）|
| 无法切换原文/译文 | 确保已完成翻译，然后点击 👁 按钮或扩展弹出窗口的"切换显示"|

## 下一步

- 阅读完整 [使用说明](./README.md)
- 查看 [Safari 转换指南](./safari-conversion.md)
- 自定义提示词以获得更好的翻译效果

## 需要帮助？

如有问题，请：
1. 检查浏览器 Console 的错误信息
2. 确认 API Key 有效且有足够余额
3. 尝试刷新页面后重新翻译
