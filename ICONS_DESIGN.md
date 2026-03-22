# AI Web Translator 图标设计

## 设计风格

采用 **Apple Design Language** 风格：
- 大圆角矩形（28px radius on 128px canvas）
- 蓝紫色渐变背景（Indigo → Purple → Violet）
- 微妙的顶部高光
- 简洁的 "A-文" 双语标识
- 绿色 AI 就绪指示器

## 图标文件

### Chrome 扩展图标
| 文件 | 尺寸 | 用途 |
|------|------|------|
| `icon16.png` | 16x16 | 扩展列表、Favicon |
| `icon48.png` | 48x48 | 扩展管理页面 |
| `icon128.png` | 128x128 | Chrome Web Store |
| `icon.svg` | 矢量 | 源文件 |

### Safari 扩展图标
位置：`safari/AI Web Translator/Shared (Extension)/Resources/icons/`
- 与 Chrome 相同尺寸
- 自动同步

### macOS App Icon
位置：`chrome/icons/AppIcon.iconset/`

完整的 macOS App Icon 集合：
```
icon_16x16.png       (16x16)
icon_16x16@2x.png    (32x32)
icon_32x32.png       (32x32)
icon_32x32@2x.png    (64x64)
icon_128x128.png     (128x128)
icon_128x128@2x.png  (256x256)
icon_256x256.png     (256x256)
icon_256x256@2x.png  (512x512)
icon_512x512.png     (512x512)
icon_512x512@2x.png  (1024x1024)
```

### Safari Toolbar 图标
位置：`chrome/icons/toolbar/`

专为 Safari 工具栏按钮设计（无 AI 指示器，更简洁）：
```
toolbar-icon-16.png  (16x16)
toolbar-icon-19.png  (19x19)
toolbar-icon-32.png  (32x32)
toolbar-icon-38.png  (38x38)
toolbar-icon-48.png  (48x48)
toolbar-icon-72.png  (72x72)
```

## 颜色规范

### 主渐变
- 起始色：`#6366F1` (Indigo-500)
- 中间色：`#8B5CF6` (Violet-500)
- 结束色：`#A855F7` (Purple-500)

### 高光
- 颜色：白色
- 透明度：30% → 0%
- 方向：从上至下

### AI 指示器
- 背景：`#34D399` (Emerald-400)
- 对勾：白色

## 生成命令

```bash
cd chrome/icons

# 生成扩展图标
node generate-icons.js

# 生成全套 App 图标
node generate-app-icons.js
```

## 同步到 Safari

```bash
cp chrome/icons/*.{png,svg} safari/AI\ Web\ Translator/Shared\ \(Extension\)/Resources/icons/
cp chrome/icons/AppIcon.iconset/icon_512x512@2x.png safari/AI\ Web\ Translator/Shared\ \(App\)/Resources/Icon.png
```

## 设计要点

1. **可读性**：小尺寸（16x16）下 "A" 和 "文" 依然清晰可辨
2. **识别性**：蓝紫色系在工具栏中具有独特辨识度
3. **一致性**：所有尺寸保持相同视觉比例
4. **平台适配**：Toolbar 图标去除 AI 指示器，避免小尺寸下信息过载
