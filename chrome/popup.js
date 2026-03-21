/**
 * AI 网页翻译器 - Popup 脚本
 */

// Safari 兼容性：使用 browser API 作为 chrome 的替代
const isSafari = typeof browser !== 'undefined' && browser.runtime;
const _chrome = isSafari ? browser : chrome;

// 包装 tabs API 以支持 Promise
const chromeTabs = {
  query: (queryInfo) => {
    return new Promise((resolve) => {
      _chrome.tabs.query(queryInfo, resolve);
    });
  },
  sendMessage: (tabId, message) => {
    return new Promise((resolve, reject) => {
      _chrome.tabs.sendMessage(tabId, message, (response) => {
        if (_chrome.runtime.lastError) {
          reject(new Error(_chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
};

// 包装 scripting API
const chromeScripting = {
  executeScript: (details) => {
    return new Promise((resolve) => {
      if (isSafari) {
        // Safari 使用不同的 API
        _chrome.scripting.executeScript({
          target: { tabId: details.target?.tabId },
          files: details.files
        }, resolve);
      } else {
        _chrome.scripting.executeScript(details, resolve);
      }
    });
  },
  insertCSS: (details) => {
    return new Promise((resolve) => {
      if (isSafari) {
        _chrome.scripting.insertCSS({
          target: { tabId: details.target?.tabId },
          files: details.files
        }, resolve);
      } else {
        _chrome.scripting.insertCSS(details, resolve);
      }
    });
  }
};

// 包装 storage API
const chromeStorage = {
  sync: {
    get: (keys) => {
      return new Promise((resolve) => {
        _chrome.storage.sync.get(keys, resolve);
      });
    }
  }
};

// 包装 runtime API
const chromeRuntime = {
  sendMessage: (message) => {
    return new Promise((resolve, reject) => {
      _chrome.runtime.sendMessage(message, (response) => {
        if (_chrome.runtime.lastError) {
          reject(new Error(_chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // 获取 DOM 元素
  const btnTranslate = document.getElementById('btn-translate');
  const btnToggle = document.getElementById('btn-toggle');
  const btnSettings = document.getElementById('btn-settings');
  const toggleGroup = document.getElementById('toggle-group');
  const toggleStatus = document.getElementById('toggle-status');
  const apiStatus = document.getElementById('api-status');
  const modelName = document.getElementById('model-name');
  const providerName = document.getElementById('provider-name');
  const concurrencyValue = document.getElementById('concurrency-value');
  const cacheInfo = document.getElementById('cache-info');
  const cacheCount = document.getElementById('cache-count');
  const statusIndicator = document.getElementById('status-indicator');

  // 当前状态
  let currentDisplayMode = 'both';
  let hasTranslation = false;

  // 加载配置并更新 UI
  let config;
  try {
    config = await ConfigManager.getConfig();
    updateUI(config);
  } catch (e) {
    console.error('加载配置失败:', e);
  }

  // 更新 UI
  function updateUI(cfg) {
    // 检查 API Key 和 API URL
    const missingConfig = [];
    if (!cfg.api.apiKey) missingConfig.push('API Key');
    if (!cfg.api.baseUrl) missingConfig.push('API URL');
    if (!cfg.api.model) missingConfig.push('模型');
    
    if (missingConfig.length > 0) {
      apiStatus.classList.add('show');
      apiStatus.querySelector('.api-status-text').textContent = 
        `未配置: ${missingConfig.join(', ')}`;
      btnTranslate.disabled = true;
    } else {
      apiStatus.classList.remove('show');
      btnTranslate.disabled = false;
    }
    
    // 更新 provider、模型和并发数
    providerName.textContent = cfg.api.provider === 'anthropic-messages' ? 'Anthropic' : 'OpenAI';
    modelName.textContent = cfg.api.model || '-';
    concurrencyValue.textContent = (cfg.behavior?.concurrency || 10) + '线程';
  }

  // 获取当前标签页
  async function getCurrentTab() {
    const [tab] = await chromeTabs.query({ active: true, currentWindow: true });
    return tab;
  }

  // 检查页面翻译状态
  async function checkTranslationStatus() {
    const tab = await getCurrentTab();
    try {
      const response = await chromeTabs.sendMessage(tab.id, { action: 'getStatus' });
      if (response) {
        hasTranslation = response.translatedCount > 0;
        currentDisplayMode = response.displayMode || 'both';
        
        if (hasTranslation) {
          toggleGroup.style.display = 'flex';
          btnTranslate.querySelector('.btn-text').textContent = '重新翻译';
          updateToggleStatus();
          
          // 显示缓存信息
          if (response.translatedCount > 0) {
            cacheInfo.style.display = 'flex';
            cacheCount.textContent = response.translatedCount + ' 段落';
          }
        }
      }
    } catch (e) {
      // content script 未加载
      console.log('Content script not loaded yet');
    }
  }

  // 更新切换按钮状态
  function updateToggleStatus() {
    const modeText = {
      both: '双语对照',
      source: '只看原文',
      translation: '只看译文'
    };
    toggleStatus.textContent = modeText[currentDisplayMode] || '双语对照';
  }

  // 翻译按钮点击
  btnTranslate.addEventListener('click', async () => {
    const tab = await getCurrentTab();
    
    // 更新按钮状态
    btnTranslate.disabled = true;
    const originalText = btnTranslate.innerHTML;
    btnTranslate.innerHTML = '<div class="spinner"></div><span class="btn-text">翻译中...</span>';
    statusIndicator.querySelector('.status-text').textContent = '正在翻译...';
    
    try {
      // 发送消息给 content script
      await chromeTabs.sendMessage(tab.id, { action: 'startTranslation' });
      
      // 等待一段时间后检查状态
      setTimeout(async () => {
        await checkTranslationStatus();
        window.close();
      }, 500);
      
    } catch (error) {
      // 如果 content script 未加载，先注入
      if (error.message.includes('Receiving end does not exist')) {
        try {
          await chromeScripting.executeScript({
            target: { tabId: tab.id },
            files: ['api-adapter.js', 'config.js', 'content.js']
          });
          
          await chromeScripting.insertCSS({
            target: { tabId: tab.id },
            files: ['translator.css']
          });
          
          // 等待脚本加载
          setTimeout(async () => {
            try {
              await chromeTabs.sendMessage(tab.id, { action: 'startTranslation' });
              setTimeout(() => window.close(), 500);
            } catch (e) {
              showError('无法在当前页面运行翻译器');
              resetButton();
            }
          }, 200);
          
        } catch (e) {
          showError('无法在当前页面注入脚本');
          resetButton();
        }
      } else {
        showError('翻译启动失败: ' + error.message);
        resetButton();
      }
    }
    
    function resetButton() {
      btnTranslate.disabled = false;
      btnTranslate.innerHTML = originalText;
      statusIndicator.querySelector('.status-text').textContent = '准备就绪';
    }
  });

  // 切换按钮点击
  btnToggle.addEventListener('click', async () => {
    const tab = await getCurrentTab();
    
    try {
      const response = await chromeTabs.sendMessage(tab.id, { action: 'toggleDisplay' });
      if (response) {
        currentDisplayMode = response.displayMode;
        updateToggleStatus();
      }
      window.close();
    } catch (error) {
      showError('切换失败');
    }
  });

  // 测试按钮点击
  const btnTest = document.getElementById('btn-test');
  if (btnTest) {
    btnTest.addEventListener('click', async () => {
      btnTest.disabled = true;
      const originalText = btnTest.innerHTML;
      btnTest.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">测试中...</span>';
      
      try {
        // 直接从 storage 读取配置（popup.js 无法访问 ConfigManager）
        const result = await chromeStorage.sync.get(['translatorConfig']);
        const config = result.translatorConfig || {
          api: {
            baseUrl: 'https://api.moonshot.cn/v1',
            apiKey: '',
            model: 'kimi-latest',
            provider: 'openai-compatible'
          }
        };
        
        if (!config.api.apiKey) {
          showError('❌ API Key 未设置，请先配置');
          btnTest.disabled = false;
          btnTest.innerHTML = originalText;
          return;
        }
        
        // 发送到后台测试
        const response = await chromeRuntime.sendMessage({
          action: 'testConnection',
          apiConfig: config.api
        });
        
        if (response.success) {
          const resultText = typeof response.result === 'string' 
            ? response.result.substring(0, 50)
            : JSON.stringify(response.result).substring(0, 50);
          showError('✅ 连接成功!\n\n结果: ' + resultText);
        } else {
          showError('❌ 连接失败:\n' + response.error);
        }
        
      } catch (error) {
        showError('❌ 测试异常:\n' + error.message);
      } finally {
        btnTest.disabled = false;
        btnTest.innerHTML = originalText;
      }
    });
  }
  
  // 设置按钮点击
  btnSettings.addEventListener('click', async () => {
    const tab = await getCurrentTab();
    
    try {
      await chromeTabs.sendMessage(tab.id, { action: 'openSettings' });
      window.close();
    } catch (error) {
      // 如果 content script 未加载
      try {
        await chromeScripting.executeScript({
          target: { tabId: tab.id },
          files: ['api-adapter.js', 'config.js', 'content.js']
        });
        
        await chromeScripting.insertCSS({
          target: { tabId: tab.id },
          files: ['translator.css']
        });
        
        setTimeout(async () => {
          try {
            await chromeTabs.sendMessage(tab.id, { action: 'openSettings' });
            window.close();
          } catch (e) {
            showError('无法打开设置');
          }
        }, 200);
        
      } catch (e) {
        showError('无法打开设置');
      }
    }
  });

  // 显示错误
  function showError(message) {
    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      background: #fed7d7;
      color: #c53030;
      padding: 10px;
      border-radius: 6px;
      font-size: 13px;
      z-index: 1000;
      text-align: center;
    `;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }

  // 初始化时检查翻译状态
  await checkTranslationStatus();
});
