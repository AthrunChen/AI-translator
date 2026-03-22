/**
 * API 适配器 - 统一 Chrome 和 Safari 的 API 调用
 * 同时支持从环境变量读取配置
 */

// 检测运行环境
const isSafari = typeof browser !== 'undefined' && browser.runtime;
const browserAPI = isSafari ? browser : chrome;
const storageArea = isSafari ? browserAPI.storage.local : browserAPI.storage.sync;

// 统一的存储 API
const StorageAPI = {
  async get(keys) {
    if (isSafari) {
      return await storageArea.get(keys);
    } else {
      return new Promise((resolve) => {
        browserAPI.storage.sync.get(keys, resolve);
      });
    }
  },

  async set(items) {
    if (isSafari) {
      return await storageArea.set(items);
    } else {
      return new Promise((resolve) => {
        browserAPI.storage.sync.set(items, resolve);
      });
    }
  }
};

// 统一的运行时消息 API
const RuntimeAPI = {
  async sendMessage(message) {
    if (isSafari) {
      return await browserAPI.runtime.sendMessage(message);
    } else {
      return new Promise((resolve, reject) => {
        browserAPI.runtime.sendMessage(message, (response) => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    }
  },

  onMessage(callback) {
    browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
      const result = callback(request, sender);
      if (result instanceof Promise) {
        result.then(sendResponse).catch(error => {
          sendResponse({ error: error.message });
        });
        return true;
      }
      return result;
    });
  }
};

// 统一的 Tabs API
const TabsAPI = {
  async query(queryInfo) {
    if (isSafari) {
      return await browserAPI.tabs.query(queryInfo);
    } else {
      return new Promise((resolve) => {
        browserAPI.tabs.query(queryInfo, resolve);
      });
    }
  },

  async sendMessage(tabId, message) {
    if (isSafari) {
      return await browserAPI.tabs.sendMessage(tabId, message);
    } else {
      return new Promise((resolve, reject) => {
        browserAPI.tabs.sendMessage(tabId, message, (response) => {
          if (browserAPI.runtime.lastError) {
            reject(new Error(browserAPI.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    }
  },

  async executeScript(tabId, details) {
    if (isSafari) {
      return await browserAPI.scripting.executeScript({
        target: { tabId: tabId },
        files: details.files
      });
    } else {
      return new Promise((resolve) => {
        browserAPI.scripting.executeScript({
          target: { tabId: tabId },
          files: details.files
        }, resolve);
      });
    }
  }
};

// 从环境变量加载配置（如果可用）
async function loadConfigFromEnv() {
  // 尝试从不同的来源获取配置
  const sources = [
    // 1. 从 window 对象（如果通过外部脚本注入）
    () => window.KIMI_CODING_API_CONFIG,
    // 2. 从 localStorage
    () => {
      try {
        const stored = localStorage.getItem('KIMI_CODING_API_CONFIG');
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    }
  ];

  for (const source of sources) {
    try {
      const config = source();
      if (config) {
        return config;
      }
    } catch (e) {
      // 继续下一个来源
    }
  }

  return null;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageAPI, RuntimeAPI, TabsAPI, loadConfigFromEnv, isSafari };
}
