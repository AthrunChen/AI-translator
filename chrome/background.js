/**
 * AI 网页翻译器 - 后台脚本
 * 处理 API 调用和跨域请求
 */

// Safari 兼容性 - 使用 var 避免重复声明
var isSafari = typeof browser !== 'undefined' && browser.runtime;
var _chrome = isSafari ? browser : chrome;

// 处理来自 content script 的消息
_chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    handleTranslation(request.prompt, request.apiConfig)
      .then(result => {
        sendResponse({ result });
      })
      .catch(error => {
        console.error('翻译错误:', error);
        sendResponse({ error: error.message, details: error.stack });
      });
    return true; // 保持消息通道开放
  }
  
  // 添加测试连接功能
  if (request.action === 'testConnection') {
    testAPIConnection(request.apiConfig)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('连接测试失败:', error);
        sendResponse({ success: false, error: error.message, details: error.stack });
      });
    return true;
  }
  
  // 添加简单的 ping 测试
  if (request.action === 'ping') {
    sendResponse({ pong: true, timestamp: Date.now() });
    return true;
  }
});

// 处理翻译请求
async function handleTranslation(prompt, apiConfig) {
  const { baseUrl, apiKey, model, provider } = apiConfig;
  
  if (!apiKey) {
    throw new Error('API Key 未设置，请在扩展设置中配置');
  }

  // 根据 provider 选择不同的 API 格式
  switch (provider) {
    case 'anthropic-messages':
      return await callAnthropicAPI(prompt, { baseUrl, apiKey, model });
    case 'openai-compatible':
    default:
      return await callOpenAICompatibleAPI(prompt, { baseUrl, apiKey, model });
  }
}

// 调用 OpenAI 兼容格式 API (Kimi / OpenAI / Azure 等)
async function callOpenAICompatibleAPI(prompt, config) {
  const { baseUrl, apiKey, model } = config;
  const url = `${baseUrl}/chat/completions`;
  
  console.log('🌐 [API 请求]', {
    url: url,
    model: model || 'kimi-latest',
    promptLength: prompt.length,
    keyLength: apiKey ? apiKey.length : 0
  });
  
  const requestBody = {
    model: model || 'kimi-latest',
    messages: [
      {
        role: 'system',
        content: '你是一个专业的网页翻译助手，擅长将英文内容翻译成自然流畅的中文，同时保留专业术语和技术词汇。'
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
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
        console.error('❌ API 错误响应:', errorData);
      } catch (e) {
        const errorText = await response.text();
        console.error('❌ API 错误文本:', errorText.substring(0, 500));
      }
      throw new Error(`API 请求失败: ${errorMessage}`);
    }

    const data = await response.json();
    console.log('✅ 响应解析成功');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ 响应格式异常:', data);
      throw new Error('API 返回格式异常');
    }

    const result = data.choices[0].message.content;
    
    // 打印完整结果（包含词汇对应表）
    console.log('\n📝 AI 完整返回:\n' + '='.repeat(50));
    console.log(result);
    console.log('='.repeat(50) + '\n');
    
    return result;

  } catch (error) {
    console.error('❌ fetch 错误:', error.name, error.message);
    
    if (error.name === 'TypeError') {
      if (error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查: 1)网络连接 2)API URL是否正确 3)是否使用代理/VPN');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('无法连接到 API 服务器，请检查网络设置或 API URL');
      }
    }
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    throw error;
  }
}

// 调用 Anthropic Messages API 格式
async function callAnthropicAPI(prompt, config) {
  const { baseUrl, apiKey, model } = config;
  
  // Anthropic API 使用 /v1/messages 端点
  const url = baseUrl.endsWith('/v1') 
    ? `${baseUrl}/messages` 
    : `${baseUrl}/v1/messages`;
  
  const requestBody = {
    model: model || 'claude-3-haiku-20240307',
    max_tokens: 4096,
    temperature: 0.3,
    system: '你是一个专业的网页翻译助手，擅长将英文内容翻译成自然流畅的中文，同时保留专业术语和技术词汇。',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`API 请求失败: ${errorMessage}`);
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('API 返回格式异常');
    }

    return data.content[0].text;

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络设置');
    }
    throw error;
  }
}

// 安装/更新时的处理
_chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('AI 网页翻译器已安装');
    // 打开欢迎页面或设置页面
    _chrome.tabs.create({
      url: _chrome.runtime.getURL('welcome.html')
    });
  } else if (details.reason === 'update') {
    console.log('AI 网页翻译器已更新');
  }
});

// 处理图标点击
// Safari 兼容性：使用 browserAction 或 command
const browserActionAPI = _chrome.browserAction || _chrome.action;
if (browserActionAPI && browserActionAPI.onClicked) {
  browserActionAPI.onClicked.addListener((tab) => {
  // 发送消息给 content script 开始翻译
  _chrome.tabs.sendMessage(tab.id, { action: 'startTranslation' }, (response) => {
    if (_chrome.runtime.lastError) {
      // 如果 content script 未加载，先注入
      _chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['api-adapter.js', 'config.js', 'content.js']
      }, () => {
        // 注入 CSS
        _chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['translator.css']
        });
        // 再次发送消息
        setTimeout(() => {
          _chrome.tabs.sendMessage(tab.id, { action: 'startTranslation' });
        }, 100);
      });
    }
  });
  });
}


// 测试 API 连接
async function testAPIConnection(apiConfig) {
  const { baseUrl, apiKey, model, provider } = apiConfig;
  
  console.log('🧪 [测试连接] 配置:', {
    provider: provider || 'openai-compatible',
    baseUrl: baseUrl,
    model: model || 'default',
    keyLength: apiKey ? apiKey.length : 0
  });
  
  if (!apiKey) {
    throw new Error('API Key 未设置');
  }
  
  // 根据 provider 选择测试方式
  if (provider === 'anthropic-messages') {
    return await testAnthropicConnection({ baseUrl, apiKey, model });
  } else {
    return await testOpenAIConnection({ baseUrl, apiKey, model });
  }
}

// 测试 OpenAI 兼容 API
async function testOpenAIConnection(config) {
  const { baseUrl, apiKey, model } = config;
  const url = `${baseUrl}/chat/completions`;
  
  console.log('🌐 [OpenAI测试] URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'kimi-latest',
        messages: [
          { role: 'user', content: 'Say "Connection test successful" in Chinese.' }
        ],
        max_tokens: 50
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      result: data.choices?.[0]?.message?.content,
      model: data.model,
      usage: data.usage
    };
    
  } catch (error) {
    console.error('❌ [OpenAI测试] 失败:', error);
    throw error;
  }
}

// 测试 Anthropic API
async function testAnthropicConnection(config) {
  const { baseUrl, apiKey, model } = config;
  const url = baseUrl.endsWith('/v1') 
    ? `${baseUrl}/messages` 
    : `${baseUrl}/v1/messages`;
  
  console.log('🌐 [Anthropic测试] URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: 50,
        messages: [
          { role: 'user', content: 'Say "Connection test successful" in Chinese.' }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      result: data.content?.[0]?.text,
      model: data.model,
      usage: data.usage
    };
    
  } catch (error) {
    console.error('❌ [Anthropic测试] 失败:', error);
    throw error;
  }
}
