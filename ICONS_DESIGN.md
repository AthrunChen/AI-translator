# AI Web Translator 图标设计

## 设计风格

采用 **Apple Design Language** 风格：
- 大圆角矩形（28px radius on 128px canvas）
- 蓝紫色渐变背景（Indigo → Purple → Violet）
- 微妙的顶部高光
- **纯图形设计**：双箭头循环符号（无文字）
- 绿色 AI 就绪指示器
- 悬浮状态带发光效果

## 图标含义

**主图标**：双箭头循环符号
- 两个交叉的箭头形成循环
- 象征语言的相互转换（翻译）
- 中心点表示交汇、连接
- 简洁现代，易于识别

## 图标文件

### 主图标（带 AI 指示器）
| 文件 | 尺寸 | 用途 | 状态 |
|------|------|------|------|
| `icon.svg` | 矢量 | 源文件 | 正常 |
| `icon-hover.svg` | 矢量 | 源文件 | 悬浮（更亮+发光）|
| `icon16.png` | 16x16 | 扩展列表、Favicon | 正常 |
| `icon16-hover.png` | 16x16 | 悬浮状态 | 悬浮 |
| `icon48.png` | 48x48 | 扩展管理页面 | 正常 |
| `icon48-hover.png` | 48x48 | 悬浮状态 | 悬浮 |
| `icon128.png` | 128x128 | Chrome Web Store | 正常 |
| `icon128-hover.png` | 128x128 | 悬浮状态 | 悬浮 |

### Toolbar 图标（无 AI 指示器，更简洁）
位置：`chrome/icons/toolbar/`

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `icon-toolbar.svg` | 矢量 | 源文件 |
| `icon-toolbar-hover.svg` | 矢量 | 悬浮状态源文件 |
| `toolbar-icon-16.png` | 16x16 | Safari 工具栏 |
| `toolbar-icon-16-hover.png` | 16x16 | 悬浮状态 |
| `toolbar-icon-19.png` | 19x16 | Safari 工具栏 |
| `toolbar-icon-19-hover.png` | 19x16 | 悬浮状态 |
| `toolbar-icon-32.png` | 32x32 | 工具栏 @2x |
| `toolbar-icon-32-hover.png` | 32x32 | 悬浮状态 |
| `toolbar-icon-38.png` | 38x38 | Chrome 工具栏 |
| `toolbar-icon-38-hover.png` | 38x38 | 悬浮状态 |
| `toolbar-icon-48.png` | 48x48 | 工具栏 |
| `toolbar-icon-48-hover.png` | 48x48 | 悬浮状态 |
| `toolbar-icon-72.png` | 72x72 | 大尺寸工具栏 |
| `toolbar-icon-72-hover.png` | 72x72 | 悬浮状态 |

### macOS App 图标
位置：`chrome/icons/AppIcon.iconset/`

完整的 macOS App Icon 集合（10个尺寸，正常状态）：
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

## 颜色规范

### 正常状态渐变
- 起始色：`#6366F1` (Indigo-500)
- 中间色：`#8B5CF6` (Violet-500)
- 结束色：`#A855F7` (Purple-500)

### 悬浮状态渐变
- 起始色：`#818CF8` (Indigo-400)
- 中间色：`#A78BFA` (Violet-400)
- 结束色：`#C084FC` (Purple-400)

### 高光
- 颜色：白色
- 透明度：30% → 0%
- 方向：从上至下

### AI 指示器
- 正常背景：`#34D399` (Emerald-400)
- 悬浮背景：`#4ADE80` (Emerald-300)
- 对勾：白色

### 图形符号
- 颜色：白色
- 透明度：95%
- 描边宽度：5px
- 圆角线帽

## 悬浮状态效果

### 视觉变化
1. **背景变亮**：渐变从 500 色阶变为 400 色阶
2. **外发光**：添加柔和的白色/紫色光晕
3. **高光增强**：顶部高光透明度从 30% 增至 50%
4. **AI 指示器**：颜色从 Emerald-400 变为 Emerald-300

### 应用场景
- 鼠标悬停在扩展图标上
- 按钮悬停状态
- 工具栏图标激活状态

## 生成命令

```bash
cd chrome/icons

# 生成扩展图标（含悬浮状态）
node generate-icons.js

# 生成全套 App 图标和 Toolbar 图标
node generate-app-icons.js
```

## 同步到 Safari

```bash
# 同步所有图标
cp chrome/icons/*.svg safari/AI\ Web\ Translator/Shared\ \(Extension\)/Resources/icons/
cp chrome/icons/*.png safari/AI\ Web\ Translator/Shared\ \(Extension\)/Resources/icons/
cp chrome/icons/toolbar/*.png safari/AI\ Web\ Translator/Shared\ \(Extension\)/Resources/icons/
cp chrome/icons/AppIcon.iconset/icon_512x512@2x.png safari/AI\ Web\ Translator/Shared\ \(App\)/Resources/Icon.png
```

## 设计要点

1. **纯图形识别**：双箭头循环符号直观表达"翻译"概念，无需文字
2. **可读性**：小尺寸（16x16）下图标依然清晰可辨
3. **状态反馈**：悬浮状态提供视觉反馈，增强交互感
4. **一致性**：所有尺寸保持相同视觉比例和风格
5. **平台适配**：Toolbar 图标去除 AI 指示器，小尺寸下更简洁

## CSS 使用

```css
/* 按钮使用渐变背景 */
.ai-translator-btn {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%);
}

.ai-translator-btn:hover {
  background: linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #C084FC 100%);
}
```
