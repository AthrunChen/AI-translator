# Bug 修复说明

## 修复的问题

### 1. 翻译结果顺序错乱 ✓
**问题原因**：并行处理 (`Promise.all`) 导致段落翻译完成顺序不确定

**修复方案**：改为串行处理，按顺序逐个翻译段落

### 2. 原文被清空替换 ✓
**问题原因**：`insertTranslation` 中使用 `element.innerHTML = ''` 清空了原文

**修复方案**：使用 `makeWordsInteractive()` 保留原有 DOM 结构，只在文本节点上添加高亮功能

### 3. 词汇高亮不工作 ✓
**问题原因**：
- 事件监听器绑定在动态创建的 span 上，可能失效
- 词汇匹配逻辑过于简单（只匹配前3个字母）

**修复方案**：
- 使用 `TreeWalker` 遍历文本节点，保留原有结构
- 改进匹配逻辑，支持完整词匹配和部分匹配
- 双向高亮：原文→译文，译文→原文

## 词汇高亮实现方式

### 原文高亮
1. 遍历原文元素的所有文本节点
2. 使用正则 `\b([a-zA-Z]{3,})\b` 匹配英文单词
3. 将匹配到的单词包裹在 `<span class="ai-source-word">` 中
4. 添加 `mouseenter` 事件，调用 `highlightTranslationWord()`

### 译文高亮
1. 创建译文元素 `<div class="ai-translator-translation">`
2. 遍历译文文本节点
3. 使用正则 `([\u4e00-\u9fa5]{1,}|[a-zA-Z]{3,})` 匹配中文或英文词汇
4. 将匹配到的词汇包裹在 `<span class="ai-translator-word">` 中
5. 添加 `mouseenter` 事件，高亮自身并尝试高亮原文

### 匹配算法
```javascript
// 原文词汇 → 译文词汇
function highlightTranslationWord(word) {
  const transWords = document.querySelectorAll('.ai-translator-word');
  transWords.forEach(el => {
    const text = el.textContent.toLowerCase();
    // 完整匹配或包含关系
    if (text === wordLower || 
        text.includes(wordLower) || 
        wordLower.includes(text)) {
      el.classList.add('highlight-source');
    }
  });
}
```

## 测试建议

1. **顺序测试**：翻译长文章，检查段落顺序是否正确
2. **高亮测试**：鼠标悬停英文单词，查看译文对应词汇是否高亮
3. **切换测试**：点击切换按钮，检查原文/译文显示切换是否正常
4. **缓存测试**：切换显示模式后，检查是否需要重新翻译

## 已知限制

1. **词汇对应不是100%准确**：基于简单的字符串匹配，不是语义对齐
2. **中文分词较粗糙**：按连续中文字符分割，可能不是词语边界
3. **处理速度**：串行处理比并行慢，但保证了顺序正确
