# 词汇对应功能测试指南

## 问题说明

直接使用浏览器打开 `test-word-mapping.html` 会因**跨域(CORS)限制**导致 API 请求失败。

错误信息：`Load failed` 或 `CORS error`

## 解决方案

### 方法1：使用本地HTTP服务器（推荐简单测试）

1. 打开终端
2. 进入 test 目录：
```bash
cd "/Users/chenyufan/Desktop/workspace/AI translator/test"
```

3. 启动Python HTTP服务器：
```bash
python3 -m http.server 8000
```

4. 浏览器访问：
```
http://localhost:8000/test-word-mapping.html
```

> **注意**：某些API服务商仍可能阻止来自 localhost 的请求

---

### 方法2：在扩展内测试（推荐完整测试）

#### 步骤1：修改 content.js

在 `content.js` 文件末尾添加：

```javascript
// ===== 测试代码 =====
window.testTranslation = async function() {
  const testText = 'The network provides connectivity for fans at sports events.';
  
  const prompt = `你是一位专业的网页翻译助手。请将以下文本翻译成中文。

【翻译要求】
1. 保留所有英文专业术语、技术词汇、专有名词不翻译
2. 中文翻译应该通顺、自然、专业
3. 输出格式：翻译结果 + 词汇对应表

【待翻译内容】
${testText}

【输出格式要求】
请按以下格式输出：

原文 | 中文翻译

[词汇对应]
英文单词1 | 对应中文1
英文单词2 | 对应中文2
...
[/词汇对应]`;

  const config = await ConfigManager.getConfig();
  
  try {
    const result = await translateWithAPI(testText, pageContext);
    console.log('=== AI 返回结果 ===');
    console.log(result);
    
    const parsed = parseTranslationWithWordMap(result, testText);
    console.log('=== 解析的词汇对应 ===');
    console.log(parsed.wordMap);
    
    return parsed;
  } catch (e) {
    console.error('测试失败:', e);
  }
};
```

#### 步骤2：在网页控制台运行

1. 打开任意英文网页
2. 按 F12 打开开发者工具 → Console
3. 运行：
```javascript
window.testTranslation()
```

---

### 方法3：添加测试按钮到扩展

修改 `popup.html`，添加测试按钮：

```html
<button class="btn btn-secondary" id="btn-test">🧪 测试词汇对应</button>
```

修改 `popup.js`，添加测试逻辑：

```javascript
document.getElementById('btn-test').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  chrome.tabs.sendMessage(tab.id, { action: 'testWordMapping' });
});
```

在 `content.js` 的消息监听中添加：

```javascript
if (request.action === 'testWordMapping') {
  // 运行测试
  window.testTranslation();
  sendResponse({ success: true });
}
```

---

### 方法4：直接查看网络请求（最快验证）

1. 正常翻译一篇文章
2. 打开 F12 → Network → 找到 API 请求
3. 查看 Response，确认包含 `[词汇对应]` 块

---

## 验证词汇对应功能是否工作

### 检查点1：AI 是否返回词汇对应表

在 Console 中应该能看到：
```
解析到词汇对应: Map(4) {
  'network' => ['网络'],
  'provides' => ['提供'],
  ...
}
```

### 检查点2：高亮是否生效

- 悬停英文单词 "network" → 译文 "网络" 应该高亮黄色
- 悬停中文 "网络" → 原文 "network" 应该高亮绿色

### 检查点3：对应表是否正确

点击扩展 popup 中的测试按钮，检查返回的对应表是否合理。

---

## 常见问题

**Q: 为什么 AI 没有返回词汇对应表？**

A: 检查 Prompt 是否正确。可以在 background.js 的响应处理中打印结果：
```javascript
console.log('AI 响应:', data.choices[0].message.content);
```

**Q: 词汇对应不准确怎么办？**

A: 这是正常的。AI 的词汇对应基于其训练数据，可能不完美。可以通过优化 Prompt 来改进：
- 要求更多上下文
- 指定专业领域
- 提供示例

**Q: 如何调试高亮功能？**

A: 在 `highlightTranslationWord` 和 `highlightSourceWord` 函数中添加：
```javascript
console.log('查找对应:', word);
console.log('对应表:', wordMap);
```
