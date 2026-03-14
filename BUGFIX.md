# Bug 修复记录

## 修复的问题

### 1. 进度条不更新、译文不逐步显示 ✅

**问题原因**：
- 并行处理后，所有翻译完成后再统一应用到DOM
- 用户看不到翻译进度和逐步显示的效果

**修复方案**：
- 每个段落翻译完成后立即应用到DOM
- 实时更新进度条

```javascript
async function processBlock(block) {
  const result = await translateWithAPI(block.originalText, pageContext);
  
  // 立即应用到DOM，不等待其他任务
  insertTranslation(block.element, block.originalText, parsed);
  completed++;
  updateProgress(); // 实时更新进度
}
```

### 2. 词汇高亮不完善 ✅

**问题原因**：
- 中英文词汇匹配逻辑过于复杂，效果不佳
- 简单的字符串匹配无法准确对应中英词汇

**修复方案**：
采用双层高亮策略：

#### 第一层：段落级高亮（确保有效）
- 悬停原文词汇 → 整段译文高亮（浅黄色背景）
- 悬停译文词汇 → 整段原文高亮（浅绿色背景）

#### 第二层：词汇级高亮（精确匹配）
- 悬停原文英文单词 → 译文中相同的英文单词高亮（黄色）
- 悬停译文词汇 → 原文中相同的英文单词高亮（绿色）

```javascript
// 段落级高亮
function highlightTranslationForElement(sourceEl) {
  const transEl = sourceEl.nextElementSibling;
  if (transEl) transEl.classList.add('highlight-source');
}

// 词汇级高亮
function highlightTranslationWord(word) {
  // 精确匹配相同的英文单词
  transWords.forEach(el => {
    if (el.textContent.toLowerCase() === wordLower) {
      el.classList.add('highlight-source');
    }
  });
}
```

## 高亮效果说明

### 原文词汇悬停
1. **整段译文** 获得浅黄色背景（段落级）
2. **译文中相同的英文单词** 获得深黄色背景（词汇级，针对专业术语）

### 译文词汇悬停
1. **整段原文** 获得浅绿色背景（段落级）
2. **原文中相同的英文单词** 获得深绿色背景（词汇级，针对专业术语）

## 测试建议

1. 打开一篇英文文章，开始翻译
2. 观察译文是否逐步显示（应该是）
3. 观察进度条是否实时更新（应该是）
4. 鼠标悬停在原文英文单词上，查看译文段落是否高亮
5. 鼠标悬停在译文中文上，查看原文段落是否高亮
6. 对于专业术语（如 "mobile", "network"），双向高亮应正常工作
