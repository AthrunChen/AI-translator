# 翻译失败 "Failed to fetch" 排查指南

## 🔍 错误原因分析

"Failed to fetch" 通常由以下原因导致：

1. **网络连接问题** - 无法连接到 API 服务器
2. **API 配置错误** - URL、Key 或模型名称不正确
3. **CORS 限制** - 浏览器阻止跨域请求
4. **API 服务商限制** - 请求被拒绝（IP、频率等）

---

## 🛠️ 排查步骤

### 步骤1：检查网络连接

```javascript
// 在 Console 中测试网络连通性
fetch('https://api.moonshot.cn/v1/models', {
  headers: {
    'Authorization': 'Bearer sk-your-api-key'
  }
})
.then(r => r.json())
.then(data => console.log('✅ 网络正常:', data))
.catch(e => console.error('❌ 网络错误:', e));
```

### 步骤2：验证 API 配置

在扩展后台页面 (background.js) 添加调试日志：

```javascript
// 在 handleTranslation 函数开头添加
console.log('API 配置:', {
  url: `${baseUrl}/chat/completions`,
  model: model,
  keyLength: apiKey ? apiKey.length : 0
});
```

### 步骤3：检查 API Key 有效性

```bash
# 使用 curl 测试 API
curl https://api.moonshot.cn/v1/models \
  -H "Authorization: Bearer sk-your-api-key"
```

### 步骤4：检查扩展权限

确保 `manifest.json` 包含正确的权限：

```json
{
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>",
    "https://api.moonshot.cn/*"
  ]
}
```

---

## 🔧 常见解决方案

### 方案1：检查 API URL

**错误示例**:
```javascript
// ❌ 缺少 https://
baseUrl: "api.moonshot.cn/v1"

// ❌ 多了斜杠
baseUrl: "https://api.moonshot.cn/v1/"
```

**正确示例**:
```javascript
// ✅ 正确格式
baseUrl: "https://api.moonshot.cn/v1"
```

### 方案2：使用扩展后台脚本代理请求

修改 `background.js`，添加 CORS 处理：

```javascript
// 在 background.js 中添加响应头处理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    handleTranslation(request.prompt, request.apiConfig)
      .then(result => {
        console.log('✅ 翻译成功');
        sendResponse({ result });
      })
      .catch(error => {
        console.error('❌ 翻译错误:', error);
        // 返回详细错误信息
        sendResponse({ 
          error: error.message,
          details: error.toString()
        });
      });
    return true;
  }
});
```

### 方案3：添加详细的错误日志

修改 `content.js` 中的翻译调用：

```javascript
async function translateWithAPI(text, context) {
  const hash = simpleHash(text);
  
  // 检查缓存
  if (translationCache.has(hash)) {
    console.log('使用缓存的翻译结果');
    return translationCache.get(hash);
  }
  
  const prompt = config.prompt
    .replace('{title}', context.title)
    .replace('{url}', context.url)
    .replace('{summary}', context.summary)
    .replace('{text}', text);

  console.log('📤 发送翻译请求...');
  console.log('Prompt 长度:', prompt.length);

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: 'translate',
      prompt: prompt,
      apiConfig: config.api
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('❌ runtime.lastError:', chrome.runtime.lastError);
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (response.error) {
        console.error('❌ API 返回错误:', response.error);
        reject(new Error(response.error));
        return;
      }
      
      console.log('✅ 收到翻译结果，长度:', response.result.length);
      translationCache.set(hash, response.result);
      resolve(response.result);
    });
  });
}
```

### 方案4：修复 fetch 调用

在 `background.js` 中添加 fetch 调试：

```javascript
async function handleTranslation(prompt, apiConfig) {
  const { baseUrl, apiKey, model } = apiConfig;
  
  if (!apiKey) {
    throw new Error('API Key 未设置');
  }

  const url = `${baseUrl}/chat/completions`;
  
  console.log('🌐 请求 URL:', url);
  console.log('🤖 使用模型:', model);
  
  const requestBody = {
    model: model || 'kimi-latest',
    messages: [
      {
        role: 'system',
        content: '你是一个专业的网页翻译助手。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 4096,
    stream: false
  };

  try {
    console.log('📡 发送 fetch 请求...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 收到响应:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ HTTP 错误:', errorData);
      throw new Error(`API 请求失败: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 解析响应成功');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ 响应格式异常:', data);
      throw new Error('API 返回格式异常');
    }

    return data.choices[0].message.content;

  } catch (error) {
    console.error('❌ fetch 错误:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络设置或 API URL 是否正确');
    }
    
    throw error;
  }
}
```

---

## 🧪 快速测试方法

### 测试1：验证 API Key

在任意网页的 Console 中运行：

```javascript
// 测试 API Key 是否有效
(async () => {
  const apiKey = '你的API-Key';
  
  try {
    const res = await fetch('https://api.moonshot.cn/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ API Key 有效，可用模型:', data.data.map(m => m.id));
    } else {
      console.error('❌ API Key 无效:', await res.text());
    }
  } catch (e) {
    console.error('❌ 请求失败:', e);
  }
})();
```

### 测试2：检查扩展后台页面

1. 打开 `chrome://extensions/`
2. 找到你的扩展，点击"背景页"（Service Worker）
3. 在 Console 中查看是否有错误日志

### 测试3：简化测试

创建一个最简单的测试：

```javascript
// 在 background.js 中添加
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ pong: true, timestamp: Date.now() });
    return true;
  }
  // ... 其他处理
});

// 在 content.js 中测试
chrome.runtime.sendMessage({ action: 'ping' }, response => {
  console.log('Extension 通信测试:', response);
});
```

---

## 📋 检查清单

- [ ] API Key 已正确填入（没有多余的空格）
- [ ] API URL 格式正确（https://api.moonshot.cn/v1）
- [ ] 网络连接正常（可以访问其他网站）
- [ ] 扩展权限已启用（host_permissions 包含 API 域名）
- [ ] 模型名称正确（kimi-latest 或其他有效模型）
- [ ] API Key 未过期且有余额

---

## 🆘 如果以上都无效

请提供以下信息以便进一步排查：

1. 完整的错误信息（Console 截图）
2. API 服务商（Kimi/OpenAI/其他）
3. 使用的模型名称
4. 网络环境（是否使用代理/VPN）
