# Safari 扩展调试指南

## 问题描述
Safari 版本的扩展可以配置 API key 并保存，测试连接也能通过，但点击"翻译当前页面"后没有反应。

## 根本原因
Safari 使用 `browser` 对象而不是 `chrome` 对象，且 `browser.runtime.sendMessage` 返回 Promise，而 Chrome 使用回调函数。

## 修复内容

### 1. 添加了调试配置 (debug-config.js)
- 自动检测运行环境 (Safari/Chrome)
- 提供统一的消息发送接口 `sendMessageToBackground()`
- 添加详细的日志记录
- 提供全局调试工具 `AITranslatorDebug`

### 2. 修复了 content.js
- 使用新的 `sendMessageToBackground()` 函数替代直接调用 `_chrome.runtime.sendMessage`
- 添加了详细的调试日志
- 在翻译前测试后台连接

## 如何在 Safari 中调试

### 1. 打开 Safari 开发者工具
1. 打开 Safari 偏好设置 → 高级 → 勾选"在菜单栏中显示开发菜单"
2. 打开你要翻译的网页
3. 点击 Safari 菜单 → 开发 → 你的设备 → 选择网页 → "检查元素"

### 2. 查看控制台日志
在 Safari 开发者工具的控制台中，你应该能看到以下日志：

```
[AI Translator][INFO] content.js 开始加载
[AI Translator][INFO] content.js 注入成功
[AI Translator][INFO] 创建控制栏...
[AI Translator][INFO] AI 网页翻译器已加载
```

点击翻译按钮后：
```
[AI Translator][INFO] ========== handleTranslateClick 开始 ==========
[AI Translator][INFO] 当前环境: {isSafari: true, ...}
[AI Translator][INFO] 正在加载配置...
[AI Translator][INFO] 配置加载完成: {hasApiKey: true, ...}
[AI Translator][INFO] 测试后台连接...
[AI Translator][INFO] 后台连接正常: {pong: true, ...}
```

### 3. 使用调试命令
在 Safari 开发者工具的控制台中，可以运行以下命令：

```javascript
// 运行完整诊断
AITranslatorDebug.diagnose()

// 测试后台连接
AITranslatorDebug.testConnection()

// 测试配置加载
AITranslatorDebug.testConfig()

// 测试翻译功能
AITranslatorDebug.testTranslate('Hello world')

// 显示所有日志
AITranslatorDebug.showLogs()

// 导出日志到剪贴板
AITranslatorDebug.exportLogs()
```

### 4. 检查后台脚本日志
1. 打开 Safari → 偏好设置 → 扩展 → AI Web Translator
2. 点击"检查背景页"或"检查全局页"
3. 查看控制台中的后台脚本日志

## 常见问题

### 问题：点击翻译没有反应，控制台没有日志
**解决：**
1. 确认 debug-config.js 已加载：
   ```javascript
   typeof window.AITranslatorDebug !== 'undefined'
   ```
2. 检查 manifest.json 中 content_scripts 的顺序：
   ```json
   "js": ["debug-config.js", "api-adapter.js", "config.js", "content.js"]
   ```

### 问题：后台连接测试失败
**错误信息：** `无法连接到后台脚本`

**解决：**
1. 检查 background.js 是否在 manifest 中正确配置
2. 检查 Safari 扩展权限是否启用
3. 重新构建并重新加载扩展

### 问题：API 调用失败
**错误信息：** `未收到响应` 或 `API 请求失败`

**解决：**
1. 检查 API Key、Base URL、Model 是否配置正确
2. 检查网络连接
3. 查看后台脚本日志获取详细错误信息

## 重新构建步骤

如果修改了代码，需要重新构建 Safari 扩展：

```bash
# 1. 重新构建 Safari 项目
bash scripts/build-safari.sh

# 2. 重新修复签名
bash scripts/fix-safari-signing.sh

# 3. 在 Xcode 中清理并重建
# Cmd + Shift + K (清理)
# Cmd + B (构建)
```

## 日志导出

如果无法解决问题，请导出日志并分享：

```javascript
AITranslatorDebug.exportLogs()
```

这会将所有日志复制到剪贴板，你可以粘贴到文本文件中。
