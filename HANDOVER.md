# AI 网页翻译器 - 项目交接文档

## 📋 项目概述

一个基于 AI 的浏览器扩展，支持 Chrome 和 Safari，实现网页内容的智能翻译，具有段落级翻译、AI 词汇对应、双向高亮等特色功能。

---

## ✅ 已实现功能

### 核心功能
1. **段落级翻译** - 以段落为单位进行翻译，保持上下文完整
2. **✨ 双向词汇高亮** - **核心特色功能**：
   - 鼠标悬停任意词汇，AI 自动识别对应关系
   - 🟢 悬停英文 → 高亮对应中文（黄色）
   - 🟡 悬停中文 → 高亮对应英文（绿色）
   - 支持多词短语（如 "US Army Secretary" ↔ "美国陆军部长"）
3. **AI 词汇对应** - 利用 AI 返回原文与译文的词汇映射表
4. **并行翻译** - 支持 10 线程并行处理，提升翻译速度
5. **原文/译文切换** - 支持三种显示模式（双语对照/只看原文/只看译文）
6. **翻译缓存** - 缓存翻译结果，切换显示模式无需重新请求
7. **实时进度** - 翻译过程中实时更新进度条
8. **多 API 支持** - 支持 OpenAI 兼容格式和 Anthropic Messages API

### 配置方式
- 通过扩展设置面板配置
- 支持 OpenClaw 格式环境变量注入
- 支持 `window.openclaw` / `localStorage` 配置

---

## 📁 项目结构

```
web-translator/
├── chrome/                      # Chrome 扩展
│   ├── manifest.json           # 扩展配置
│   ├── background.js           # 后台脚本（API调用、CORS代理）
│   ├── content.js              # 内容脚本（页面处理、高亮逻辑）⭐核心
│   ├── config.js               # 配置管理
│   ├── popup.html/js/css       # 弹出窗口 UI
│   ├── translator.css          # 翻译结果样式
│   ├── api-adapter.js          # API 适配层
│   └── welcome.html            # 欢迎页面
├── safari/                      # Safari 扩展相关
│   └── Info.plist.template
├── test/                        # 测试文件
│   ├── test-word-mapping.html  # 词汇对应测试页面
│   ├── diagnose.html           # API 连接诊断工具
│   └── proxy-server.js         # CORS 代理服务器
└── HANDOVER.md                 # 本文档
```

---

## 🔧 模块定义

### 1. background.js - 后台服务层
**职责**：
- 处理所有外部 API 请求（无 CORS 限制）
- 支持两种 API 格式：OpenAI 兼容 / Anthropic Messages
- 提供 `testConnection` 接口用于测试连接

**关键函数**：
```javascript
handleTranslation(prompt, apiConfig)     // 主翻译入口
callOpenAICompatibleAPI(prompt, config)  // OpenAI 格式
callAnthropicAPI(prompt, config)         // Anthropic 格式
testAPIConnection(apiConfig)             // 测试连接
```

**消息接口**：
- `action: 'translate'` - 翻译请求
- `action: 'testConnection'` - 连接测试
- `action: 'ping'` - 健康检查

### 2. content.js - 页面处理层 ⭐核心模块
**职责**：
- 页面文本提取和过滤
- 翻译结果渲染
- 词汇高亮逻辑实现
- 原文/译文切换控制

**核心数据结构**：
```javascript
globalWordMapping = new Map()  // 段落元素 -> Map(英文->中文数组)
translationCache = new Map()   // 文本hash -> 翻译结果
displayMode = 'both'|'source'|'translation'
```

**关键函数**：
```javascript
extractTextBlocks()                    // 提取页面文本
parseTranslationWithWordMap()          // 解析AI返回的词汇对应表
makeWordsInteractive(element, isSource) // 使词汇可交互
highlightTranslationWord()             // 原文→译文高亮
highlightSourceWord()                  // 译文→原文高亮
batchTranslate(blocks, concurrency)    // 批量翻译
```

### 3. config.js - 配置管理层
**职责**：
- 默认配置定义
- 配置持久化（chrome.storage.sync）
- 从环境变量加载配置（OpenClaw格式）

**配置项**：
```javascript
{
  api: {
    provider: 'openai-compatible'|'anthropic-messages',
    baseUrl: string,    // ⚠️ 必须配置，如 'https://api.moonshot.cn/v1'
    apiKey: string,     // ⚠️ 必须配置
    model: string       // ⚠️ 必须配置，如 'kimi-latest'
  },
  prompt: string,  // 翻译提示词模板
  behavior: {
    concurrency: number  // 并行线程数
  }
}
```

**注意**：默认配置中 `baseUrl` 和 `model` 为空字符串，**首次使用必须在设置面板中配置**。

### 4. popup.js - 弹出窗口控制层
**职责**：
- 扩展图标点击后的 UI 交互
- 触发翻译/测试/设置等功能
- **注意**：不能直接访问 ConfigManager（content.js 中定义）

**解决方案**：
```javascript
// 正确：直接读取 storage
const result = await chrome.storage.sync.get(['translatorConfig']);

// 错误：ConfigManager 未定义
const config = await ConfigManager.getConfig(); // ❌
```

---

## 🔌 API 接口

### 对外 API（background.js 提供）

#### 翻译接口
```javascript
chrome.runtime.sendMessage({
  action: 'translate',
  prompt: string,      // 包含待翻译文本的完整 prompt
  apiConfig: {
    provider: 'openai-compatible' | 'anthropic-messages',
    baseUrl: string,   // 如: 'https://api.moonshot.cn/v1'
    apiKey: string,    // API Key
    model: string      // 如: 'kimi-latest'
  }
}, callback)

// 响应
{ result: string } | { error: string, details: string }
```

#### 测试连接接口
```javascript
chrome.runtime.sendMessage({
  action: 'testConnection',
  apiConfig: object  // 同上
}, callback)

// 响应
{ success: true, result: object } | { success: false, error: string }
```

### Prompt 格式

翻译 Prompt 模板位于 `config.js`，关键要求：
```
【输出格式要求】
原文 | 中文翻译

[词汇对应]
英文单词1 | 对应中文1
英文单词2 | 对应中文2
...
[/词汇对应]
```

---

## 🎯 高亮功能实现逻辑

### 实现架构

```
┌─────────────────┐         ┌─────────────────┐
│   原文段落      │         │   译文段落      │
│  (sourceEl)     │◄───────►│  (transEl)      │
└────────┬────────┘         └────────┬────────┘
         │                           │
    .ai-source-word           .ai-translator-word
         │                           │
         └───► 悬停事件 ◄────────────┘
                │
         ┌──────┴──────┐
         ▼             ▼
   段落级高亮      词汇级高亮
   (subtle)       (prominent)
```

### 数据流

1. **AI 返回阶段**
   ```
   AI Response → parseTranslationWithWordMap() 
   → wordMap(Map) → globalWordMapping.set(element, wordMap)
   ```

2. **高亮触发阶段**
   ```
   鼠标悬停 → makeWordsInteractive() 绑定的 mouseenter
   → highlightSourceWord() / highlightTranslationWord()
   → 查询 globalWordMapping → 匹配词汇 → 添加 CSS class
   ```

### 核心算法

#### 原文→译文高亮
```javascript
function highlightTranslationWord(sourceEl, word) {
  const wordLower = normalize(word);  // 小写+去标点
  const mapping = globalWordMapping.get(sourceEl);
  
  if (mapping.has(wordLower)) {
    const targetWords = mapping.get(wordLower); // ['网络']
    // 在 transEl 中查找包含 targetWords 的 span
    transWords.forEach(el => {
      if (targetWords.some(t => el.textContent.includes(t))) {
        el.classList.add('highlight-source'); // 黄色
      }
    });
  }
}
```

#### 译文→原文高亮（反向查找）
```javascript
function highlightSourceWord(transEl, word) {
  const mapping = globalWordMapping.get(sourceEl);
  
  // 反向查找：中文 → 英文
  for (const [eng, chns] of mapping.entries()) {
    if (chns.some(chn => chn.includes(word) || word.includes(chn))) {
      // 高亮对应的英文单词
      sourceWords.forEach(el => {
        if (el.dataset.word === eng) {
          el.classList.add('highlight-translation'); // 绿色
        }
      });
    }
  }
}
```

### 样式体系

```css
/* 段落级 -  subtle */
.ai-source-text.highlight-translation {
  background-color: rgba(154, 230, 180, 0.1); /* 10% */
}

/* 词汇级 - prominent */
.ai-source-word.highlight-translation {
  background-color: rgba(72, 187, 120, 0.7) !important; /* 70% */
}
```

---

## 🐛 已知问题 & 解决方案

### 问题1：CORS 跨域限制
**现象**：测试文件直接访问 API 报错
```
Access to fetch at 'https://api.kimi.com/coding/...' 
from origin 'null' has been blocked by CORS policy
```

**原因**：浏览器安全策略阻止 `file://` 协议页面访问外部 API

**解决方案**：
1. 使用扩展后台脚本代理请求（已实施）
2. 启动本地 HTTP 服务器（开发测试）
3. 使用 CORS 代理服务器（`proxy-server.js`）

### 问题2：ConfigManager 未定义
**现象**：`popup.js` 中调用 `ConfigManager.getConfig()` 报错

**原因**：`ConfigManager` 定义在 `content.js`，popup 无法访问

**解决方案**：
```javascript
// popup.js 中直接读取 storage
const result = await chrome.storage.sync.get(['translatorConfig']);
const config = result.translatorConfig || DEFAULT_CONFIG;
```

### 问题3：高亮整段而非词汇
**现象**：悬停译文词汇，整段原文都被高亮

**原因**：段落级高亮过于显眼，词汇级高亮可能被遮挡

**解决方案**：
1. 调整样式对比度：段落级 10%，词汇级 70%
2. 优化高亮逻辑：优先词汇级，无匹配时再显示段落级
3. 添加调试日志追踪匹配过程

**当前状态**：词汇级高亮逻辑已实现，但存在匹配精度问题

### 问题4：并行处理顺序
**现象**：翻译完成顺序错乱，导致页面显示顺序错误

**原因**：`Promise.all` 导致先完成的先显示

**解决方案**：
```javascript
// 先收集所有结果，再按顺序应用到 DOM
const results = new Map();
await Promise.all(blocks.map(async (block) => {
  results.set(block.index, await translate(block));
}));
// 按索引顺序应用
for (let i = 0; i < blocks.length; i++) {
  insertTranslation(results.get(i));
}
```

### 问题5：API 配置不一致
**现象**：测试连接成功但翻译失败，或配置不生效

**原因**：不同模块使用不同的配置读取方式

**解决方案**：
- 统一配置存储在 `chrome.storage.sync`
- 各模块独立读取，不依赖全局变量
- 添加配置验证和默认值

---

## 🚀 快速开始开发

### 环境搭建
1. 克隆项目到本地
2. Chrome 打开 `chrome://extensions/`
3. 开启开发者模式 → 加载已解压的扩展 → 选择 `chrome/` 目录

### 调试方法
1. **Content Script**：在网页上 F12 → Console
2. **Background**：`chrome://extensions/` → 点击"背景页"
3. **Popup**：右键点击扩展图标 → 检查弹出内容

### 添加新功能建议流程
1. 在 `background.js` 添加服务端逻辑（如需 API 调用）
2. 在 `content.js` 添加页面交互逻辑
3. 在 `translator.css` 添加样式
4. 如需 UI，修改 `popup.html/js`

### 关键调试技巧
```javascript
// 查看词汇对应表
chrome.runtime.sendMessage({action: 'ping'});

// 测试翻译
chrome.runtime.sendMessage({
  action: 'translate',
  prompt: 'Hello | 你好',
  apiConfig: {...}
}, console.log);

// 查看后台日志
// chrome://extensions/ → 背景页 → Console
```

---

## 📝 待办事项

### 高优先级
- [ ] 修复词汇级高亮精度问题（当前悬停译文时整段原文高亮）
- [ ] 添加词汇高亮开关（用户可选择只显示词汇级或段落级）
- [ ] 优化中文分词（当前按字符分割，应使用词语分割）

### 中优先级
- [ ] 支持更多 API 提供商（Azure、AWS 等）
- [ ] 添加翻译历史记录
- [ ] 支持导出翻译内容

### 低优先级
- [ ] Safari 扩展完整适配
- [ ] 键盘快捷键支持
- [ ] 暗黑模式优化

---

## 📞 联系方式

如有问题，请查看：
1. 浏览器 Console 错误日志
2. 扩展后台页面日志
3. 本文档的"已知问题"章节

---

**最后更新**：2024年3月
**版本**：v1.0.0
