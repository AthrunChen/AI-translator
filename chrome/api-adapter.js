/**
 * API 适配器 - 统一 Chrome 和 Safari 的 API 调用
 * 同时支持从环境变量读取配置
 */

// 检测运行环境
const isSafari = typeof browser !== 'undefined' && browser.runtime;
const browserAPI = isSafari ? browser : chrome;

// 统一的存储 API
const StorageAPI = {
  async get(keys) {
    if (isSafari) {
      return await browserAPI.storage.sync.get(keys);
    } else {
      return new Promise((resolve) => {
        browserAPI.storage.sync.get(keys, resolve);
      });
    }
  },

  async set(items) {
    if (isSafari) {
      return await browserAPI.storage.sync.set(items);
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
  module.exports = { StorageAPI, RuntimeAPI, loadConfigFromEnv, isSafari };
}
