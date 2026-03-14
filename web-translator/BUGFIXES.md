# Bug 修复记录

## 修复的问题

### 1. 多线程 API 调用失效 ✅
**问题**: 改成串行处理后速度变慢

**修复**: 
- 恢复并行处理，使用 `Promise.race` 实现并发控制
- 同时保证按原始顺序应用到 DOM
- 可配置并发数（默认 10 线程）

```javascript
// 并发控制逻辑
while (queue.length > 0 || executing.length > 0) {
  // 启动新任务直到达到并发上限
  while (executing.length < concurrency && queue.length > 0) {
    const promise = processBlock(block).then(...);
    executing.push(promise);
  }
  // 等待任意一个任务完成
  if (executing.length > 0) {
    await Promise.race(executing);
  }
}
```

### 2. 鼠标悬停译文，原文无高亮 ✅
**问题**: 译文悬停时，原文词汇没有对应高亮

**修复**:
- 添加调试日志 `console.log` 便于排查
- 改进匹配逻辑，支持中英文双向匹配
- 译文 span 添加 `highlight-source` 类（黄色）
- 调用 `highlightSourceWord` 高亮对应原文（绿色）

### 3. 鼠标悬停原文，译文无高亮 ✅
**问题**: 原文悬停时，译文词汇没有对应高亮

**修复**:
- 原文 span 悬停时调用 `highlightTranslationWord`
- 查找所有 `.ai-translator-word` 元素
- 匹配时添加 `highlight-source` 类（黄色）

## 词汇高亮机制

### 原文 → 译文
- 触发: 鼠标悬停在 `.ai-source-word` 上
- 效果: 
  - 原文词汇: 浅绿色 (`:hover`)
  - 对应译文: 黄色 (`highlight-source`)

### 译文 → 原文
- 触发: 鼠标悬停在 `.ai-translator-word` 上
- 效果:
  - 译文词汇: 黄色 (`highlight-source`)
  - 对应原文: 绿色 (`highlight-translation`)

### 匹配算法
```javascript
if (text === word || 
    text.includes(word) || 
    word.includes(text)) {
  el.classList.add('highlight-xxx');
}
```

## 测试建议

1. 打开网页，点击 🌐 翻译
2. 观察 Network 面板，确认有多个并发请求
3. 鼠标悬停在英文单词上，查看译文是否高亮黄色
4. 鼠标悬停在中文词汇上，查看原文是否高亮绿色
5. 点击 👁 按钮切换显示模式，检查是否正常

## 注意事项

- 词汇对应基于简单的字符串匹配，不是语义对齐
- 中文分词按连续字符分割，可能不是词语边界
- 控制台会输出匹配日志，便于调试
