# Safari 扩展转换指南

本项目原生支持 Chrome 扩展。要将扩展转换为 Safari 版本，请按照以下步骤操作。

## 前提条件

- macOS 11.0+ (Big Sur 或更高版本)
- Xcode 13.0+ 
- 有效的 Apple Developer 账号（如需发布到 App Store）

## 转换步骤

### 1. 使用 safari-web-extension-converter

macOS 内置了 `safari-web-extension-converter` 工具，可以将 Chrome 扩展自动转换为 Safari 扩展：

```bash
# 转换命令
xcrun safari-web-extension-converter /path/to/web-translator/chrome \
  --project-location /path/to/output \
  --app-name "AI Web Translator" \
  --bundle-identifier com.yourcompany.ai-web-translator \
  --swift
```

### 2. 手动转换步骤

如果自动转换遇到问题，可以手动创建：

1. **打开 Xcode**，创建新项目
2. 选择 **App** 模板
3. 选择 **Safari Extension App** 类型
4. 配置项目信息

### 3. 文件适配

将 Chrome 扩展文件复制到 Safari 项目中的 `Resources/` 目录：

```
AI Web Translator/
├── AI Web Translator/
│   ├── AppDelegate.swift
│   ├── ViewController.swift
│   └── ...
├── AI Web Translator Extension/
│   └── Resources/
│       ├── manifest.json      ← 从 chrome/ 复制
│       ├── background.js      ← 从 chrome/ 复制 (需修改)
│       ├── content.js         ← 从 chrome/ 复制 (需修改)
│       ├── config.js          ← 从 chrome/ 复制
│       ├── popup.html         ← 从 chrome/ 复制
│       ├── popup.js           ← 从 chrome/ 复制 (需修改)
│       ├── popup.css          ← 从 chrome/ 复制
│       ├── translator.css     ← 从 chrome/ 复制
│       ├── welcome.html       ← 从 chrome/ 复制
│       └── icons/
│           ├── icon16.png
│           ├── icon48.png
│           └── icon128.png
```

### 4. 必要的代码修改

#### manifest.json 修改

Safari 支持 Manifest V2 和 V3，但有一些差异：

```json
{
  "manifest_version": 2,
  "default_locale": "zh_CN",
  "permissions": [
    "activeTab",
    "storage",
    "<all_urls>"
  ],
  "background": {
    "scripts": ["background.js"],
    "persistent": false
  }
}
```

#### background.js 修改

Safari 使用 `browser` API 而非 `chrome` API：

```javascript
// 将 chrome.* 替换为 browser.*
// Chrome:
chrome.runtime.onMessage.addListener(...)

// Safari:
browser.runtime.onMessage.addListener(...)
```

#### popup.js 修改

同样替换 API：

```javascript
// Chrome:
chrome.storage.sync.get(['key'], callback)

// Safari:
browser.storage.sync.get(['key']).then(callback)
```

### 5. 原生代码 (Swift)

需要创建必要的 Swift 文件来处理原生功能：

```swift
// SafariWebExtensionHandler.swift
import SafariServices

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        // 处理扩展请求
    }
}
```

### 6. 构建设置

在 Xcode 中配置：

1. **Signing & Capabilities**
   - 选择你的 Team
   - 配置 Bundle Identifier

2. **App Groups** (如需共享数据)
   - 添加 App Group: `group.com.yourcompany.ai-web-translator`

3. **Info.plist**
   - 配置 `NSExtension` 字典
   - 设置 `SFSafariWebsiteAccess` 权限

### 7. 测试

1. 在 Xcode 中选择目标设备/模拟器
2. 点击运行 (⌘+R)
3. Safari 会自动打开，提示启用扩展
4. 在 Safari 偏好设置 → 扩展中启用

### 8. 打包发布

#### 本地分发

```bash
# 归档
xcodebuild archive \
  -project "AI Web Translator.xcodeproj" \
  -scheme "AI Web Translator" \
  -archivePath "build/AI Web Translator.xcarchive"

# 导出
xcodebuild -exportArchive \
  -archivePath "build/AI Web Translator.xcarchive" \
  -exportOptionsPlist exportOptions.plist \
  -exportPath "build/Export"
```

#### App Store 发布

1. 在 App Store Connect 创建应用
2. 使用 Xcode 上传归档
3. 提交审核

## 已知问题与解决方案

### 问题 1: 跨域请求限制

Safari 扩展对跨域请求更严格：

**解决方案**: 在原生代码中处理 API 请求，通过 message passing 与 JS 通信。

```swift
// 在 SafariWebExtensionHandler.swift 中
if message?["action"] as? String == "translate" {
    // 使用 URLSession 发起请求
    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        // 处理响应
    }
    task.resume()
}
```

### 问题 2: Storage API 差异

Safari 的 storage API 与 Chrome 略有不同。

**解决方案**: 使用 Promise 包装器统一 API：

```javascript
// storage-polyfill.js
const storage = {
  sync: {
    get: (keys) => {
      return new Promise((resolve) => {
        if (typeof browser !== 'undefined') {
          browser.storage.sync.get(keys).then(resolve);
        } else {
          chrome.storage.sync.get(keys, resolve);
        }
      });
    },
    set: (items) => {
      return new Promise((resolve) => {
        if (typeof browser !== 'undefined') {
          browser.storage.sync.set(items).then(resolve);
        } else {
          chrome.storage.sync.set(items, resolve);
        }
      });
    }
  }
};
```

### 问题 3: Content Script 注入时机

Safari 可能在页面加载前注入 content script。

**解决方案**: 添加加载检测：

```javascript
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

## 完整项目结构

转换后的 Safari 项目结构：

```
AI Web Translator/
├── AI Web Translator/
│   ├── AppDelegate.swift
│   ├── SceneDelegate.swift
│   ├── ViewController.swift
│   ├── Main.storyboard
│   ├── Assets.xcassets
│   └── Info.plist
├── AI Web Translator Extension/
│   ├── SafariWebExtensionHandler.swift
│   ├── Info.plist
│   └── Resources/
│       ├── manifest.json
│       ├── *.js
│       ├── *.html
│       ├── *.css
│       └── icons/
└── AI Web Translator.xcodeproj
```

## 参考文档

- [Safari Extension Documentation](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
- [Converting Web Extensions](https://developer.apple.com/documentation/safariservices/safari_web_extensions/converting_a_web_extension_for_safari)
- [Manifest V3 in Safari](https://developer.apple.com/documentation/safariservices/safari_web_extensions/migrating_to_manifest_v3)

## 获取帮助

如遇到问题：

1. 检查 Safari 开发者菜单中的扩展日志
2. 查看 Xcode 控制台输出
3. 参考 Apple 开发者论坛
