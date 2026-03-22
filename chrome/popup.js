/**
 * AI 网页翻译器 - Popup 脚本
 */

// 默认配置
var DEFAULT_CONFIG = {
  api: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    provider: 'openai-compatible'
  },
  behavior: {
    concurrency: 10
  }
};

// Safari 兼容性：使用 browser API 作为 chrome 的替代
var isSafari = typeof browser !== 'undefined' && browser.runtime;
var _chrome = isSafari ? browser : chrome;

// 包装 tabs API 以支持 Promise
var chromeTabs = {
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
var chromeScripting = {
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

// 包装 storage API - Safari 使用 browser.storage.local (content script 和 popup 共享)
var chromeStorage = {
  sync: {
    get: async (keys) => {
      if (isSafari) {
        // Safari: 使用 browser.storage.local (content script 和 popup 共享)
        try {
          return await browser.storage.local.get(keys);
        } catch (e) {
          console.error('[AI Translator] Safari storage get 失败:', e);
          // 降级到 localStorage
          return new Promise((resolve) => {
            const result = {};
            if (typeof keys === 'string') {
              keys = [keys];
            }
            if (Array.isArray(keys)) {
              keys.forEach(key => {
                try {
                  const value = localStorage.getItem(key);
                  result[key] = value ? JSON.parse(value) : undefined;
                } catch (e) {
                  result[key] = undefined;
                }
              });
            } else if (typeof keys === 'object') {
              Object.keys(keys).forEach(key => {
                try {
                  const value = localStorage.getItem(key);
                  result[key] = value ? JSON.parse(value) : keys[key];
                } catch (e) {
                  result[key] = keys[key];
                }
              });
            }
            resolve(result);
          });
        }
      } else {
        // Chrome: 使用 chrome.storage.sync
        return new Promise((resolve) => {
          _chrome.storage.sync.get(keys, resolve);
        });
      }
    },
    set: async (items) => {
      if (isSafari) {
        // Safari: 使用 browser.storage.local
        try {
          await browser.storage.local.set(items);
          // 同时保存到 localStorage 作为后备
          Object.keys(items).forEach(key => {
            localStorage.setItem(key, JSON.stringify(items[key]));
          });
        } catch (e) {
          console.error('[AI Translator] Safari storage set 失败:', e);
          // 降级到 localStorage
          return new Promise((resolve, reject) => {
            try {
              Object.keys(items).forEach(key => {
                localStorage.setItem(key, JSON.stringify(items[key]));
              });
              resolve();
            } catch (e) {
              reject(e);
            }
          });
        }
      } else {
        // Chrome: 使用 chrome.storage.sync
        return new Promise((resolve, reject) => {
          _chrome.storage.sync.set(items, () => {
            if (_chrome.runtime.lastError) {
              reject(new Error(_chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        });
      }
    }
  }
};

// 包装 runtime API
var chromeRuntime = {
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
      console.log('[AI Translator] 发送消息失败:', error.message);
      // 如果 content script 未加载，先注入
      // Safari 错误消息可能不同，使用更宽泛的检查
      if (error.message.includes('Receiving end does not exist') || 
          error.message.includes('Could not establish connection') ||
          isSafari) {
        try {
          console.log('[AI Translator] 正在注入 content scripts...');
          await chromeScripting.executeScript({
            target: { tabId: tab.id },
            files: ['api-adapter.js', 'config.js', 'content.js']
          });
          console.log('[AI Translator] JS 脚本注入成功');
          
          await chromeScripting.insertCSS({
            target: { tabId: tab.id },
            files: ['translator.css']
          });
          console.log('[AI Translator] CSS 注入成功');
          
          // 等待脚本加载
          setTimeout(async () => {
            try {
              console.log('[AI Translator] 发送翻译消息...');
              await chromeTabs.sendMessage(tab.id, { action: 'startTranslation' });
              setTimeout(() => window.close(), 500);
            } catch (e) {
              console.error('[AI Translator] 发送消息失败:', e);
              showError('无法在当前页面运行翻译器');
              resetButton();
            }
          }, 500); // 增加等待时间，确保脚本加载完成
          
        } catch (e) {
          console.error('[AI Translator] 注入脚本失败:', e);
          showError('无法在当前页面注入脚本: ' + e.message);
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
  
  // 设置按钮点击 - 使用 popup 内嵌的设置面板
  const settingsPanel = document.getElementById('settings-panel');
  const settingsClose = document.getElementById('settings-close');
  const settingsCancel = document.getElementById('settings-cancel');
  const settingsSave = document.getElementById('settings-save');
  
  // 加载当前配置到设置面板
  async function loadSettingsToPanel() {
    try {
      const result = await chromeStorage.sync.get(['translatorConfig']);
      const cfg = result.translatorConfig || {};
      document.getElementById('setting-provider').value = cfg.api?.provider || 'openai-compatible';
      document.getElementById('setting-api-key').value = cfg.api?.apiKey || '';
      document.getElementById('setting-api-url').value = cfg.api?.baseUrl || '';
      document.getElementById('setting-model').value = cfg.api?.model || '';
      document.getElementById('setting-concurrency').value = cfg.behavior?.concurrency || 10;
    } catch (e) {
      console.error('加载配置失败:', e);
    }
  }
  
  // 打开设置面板
  btnSettings.addEventListener('click', async () => {
    await loadSettingsToPanel();
    settingsPanel.classList.add('active');
  });
  
  // 关闭设置面板
  function closeSettings() {
    settingsPanel.classList.remove('active');
  }
  
  settingsClose.addEventListener('click', closeSettings);
  settingsCancel.addEventListener('click', closeSettings);
  
  // 保存设置
  settingsSave.addEventListener('click', async () => {
    const newConfig = {
      api: {
        provider: document.getElementById('setting-provider').value,
        apiKey: document.getElementById('setting-api-key').value.trim(),
        baseUrl: document.getElementById('setting-api-url').value.trim() || 'https://api.openai.com/v1',
        model: document.getElementById('setting-model').value.trim() || 'gpt-3.5-turbo'
      },
      behavior: {
        concurrency: parseInt(document.getElementById('setting-concurrency').value) || 10
      }
    };
    
    try {
      await chromeStorage.sync.set({ translatorConfig: newConfig });
      console.log('配置已保存:', newConfig);
      closeSettings();
      // 更新 UI
      config = { ...DEFAULT_CONFIG, ...newConfig };
      updateUI(config);
      // 显示成功提示
      showSuccess('设置已保存！');
    } catch (e) {
      console.error('保存配置失败:', e);
      showError('保存失败: ' + e.message);
    }
  });
  
  // 点击遮罩关闭
  settingsPanel.addEventListener('click', (e) => {
    if (e.target === settingsPanel) {
      closeSettings();
    }
  });
  
  // 显示成功提示
  function showSuccess(message) {
    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      background: #c6f6d5;
      color: #276749;
      padding: 10px;
      border-radius: 6px;
      font-size: 13px;
      z-index: 1000;
      text-align: center;
    `;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
  }

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
