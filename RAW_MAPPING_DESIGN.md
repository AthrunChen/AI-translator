# 原始英文映射设计（无标准化转换）

## 核心变更

### 数据结构变化

**旧版（标准化映射）**：
```javascript
wordMap: Map<标准化英文, {originals: Set, chinese: string[]}>
// 如："onyourphone" -> {originals: ["on your phone"], chinese: ["手机上"]}

查找：word -> 标准化 -> 查 wordMap
```

**新版（原始英文映射）**：
```javascript
wordMap: Map<原始英文（小写）, {original: string, chinese: string[]}>
// 如："on your phone" -> {original: "on your phone", chinese: ["手机上"]}

查找：word -> 遍历 wordMap key -> 拆分对比
```

### 查找逻辑变化

**旧版 - 正向查找（英文→中文）**：
1. 标准化查询词：`word.toLowerCase().replace(/[^a-z0-9]/g, '')`
2. 直接查 wordMap：`wordMap.get(wordNormalized)`
3. 获取中文列表

**新版 - 正向查找（英文→中文）**：
1. 转为小写：`word.toLowerCase()`
2. 遍历 wordMap，将每个 key 拆分为单词列表
3. 检查查询词是否在单词列表中
4. 匹配成功则获取中文列表

**旧版 - 反向查找（中文→英文）**：
1. 查 chineseToEnglish 获取标准化英文
2. 再查 wordMap 获取原始英文
3. 拆分原始英文为单词
4. 高亮原文

**新版 - 反向查找（中文→英文）**：
1. 查 chineseToEnglish 直接获取原始英文
2. 拆分原始英文为单词
3. 直接高亮原文（无需再查 wordMap）

## 优势

1. **无信息丢失**：保留原始英文的完整信息（大小写、空格）
2. **多词短语支持**："on your phone" 直接映射到 "手机上"，无需猜测拆分
3. **调试友好**：日志中显示的是原始英文，不是标准化形式
4. **语义准确**：AI 返回什么，就使用什么，不经过算法转换

## 示例

输入：
```
Amical is also an AI voice assistant that lives on your desktop and on your phone (soon)
```

AI 返回的对照表：
```
| 中文词组 | 对应英文原文 |
|---------|------------|
| Amical | Amical |
| 还是一个 | is also an |
| AI 语音助手 | AI voice assistant |
| 驻留在 | that lives on |
| 你的 | your |
| 桌面 | desktop |
| 和 | and |
| 手机上 | on your phone |
| 即将推出 | soon |
```

存储结构：
```javascript
wordMap: {
  "amical": {original: "Amical", chinese: ["Amical"]},
  "is also an": {original: "is also an", chinese: ["还是一个"]},
  "ai voice assistant": {original: "AI voice assistant", chinese: ["AI 语音助手"]},
  ...
}

chineseToEnglish: {
  "Amical": ["Amical"],
  "还是一个": ["is also an"],
  "AI 语音助手": ["AI voice assistant"],
  "手机上": ["on your phone"],
  ...
}
```

高亮过程：
- 悬停 "手机上" → 获取 "on your phone" → 拆分 ["on", "your", "phone"] → 分别高亮原文中的这三个词
- 悬停 "is" → 遍历 wordMap → "is also an" 包含 "is" → 高亮 "还是一个"

## 注意事项

1. **遍历性能**：正向查找需要遍历所有 wordMap key，但词汇表通常 < 50 个条目，性能影响可忽略
2. **子串匹配**：部分匹配逻辑需要考虑空格，如 "assistant" 应该匹配 "ai voice assistant"
3. **大小写敏感**：存储时统一转小写，匹配时也转小写，保持大小写不敏感
