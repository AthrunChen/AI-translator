// Safari 兼容性 - 使用 var 避免重复声明
var isSafari = typeof browser !== 'undefined' && browser.runtime;
var _chrome = isSafari ? browser : chrome;

// Safari 使用 browser.storage.local 作为主要存储 (content script 和 popup 共享)
var storageAPI = {
  async get(keys) {
    if (isSafari) {
      // Safari: 使用 browser.storage.local (content script 和 popup 共享)
      try {
        return await browser.storage.local.get(keys);
      } catch (e) {
        console.error('[AI Translator] Safari storage get 失败:', e);
        // 降级到 localStorage (仅作为后备)
        const result = {};
        if (typeof keys === 'string') {
          keys = [keys];
        }
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            const value = localStorage.getItem(key);
            result[key] = value ? JSON.parse(value) : undefined;
          });
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            const value = localStorage.getItem(key);
            result[key] = value ? JSON.parse(value) : keys[key];
          });
        }
        return result;
      }
    } else {
      // Chrome: 使用 chrome.storage.sync
      return new Promise((resolve) => {
        _chrome.storage.sync.get(keys, resolve);
      });
    }
  },
  
  async set(items) {
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
        Object.keys(items).forEach(key => {
          localStorage.setItem(key, JSON.stringify(items[key]));
        });
      }
    } else {
      // Chrome: 使用 chrome.storage.sync
      return new Promise((resolve) => {
        _chrome.storage.sync.set(items, resolve);
      });
    }
  }
};

// 默认配置
var DEFAULT_CONFIG = {
  // API 配置 - 从环境变量或这里配置
  // ⚠️ 注意：默认 API URL 为空，必须在设置面板中配置或注入配置
  api: {
    baseUrl: '', // 默认空，需在设置中配置，如: 'https://api.moonshot.cn/v1'
    apiKey: '', // 留空，从存储中读取
    model: '',  // 默认空，需在设置中配置，如: 'kimi-latest'
    provider: 'openai-compatible' // 可选: 'openai-compatible', 'anthropic-messages'
  },
  
  // 翻译提示词 - 可自定义
  prompt: `你是一位专业的网页翻译助手。请将以下网页段落翻译成中文。

【翻译要求】
1. 保留所有英文专业术语、技术词汇、专有名词不翻译
2. 保留代码、变量名、URL、路径、版本号等不变
3. 保持原文段落结构，不要拆分句子
4. 中文翻译应该通顺、自然、专业

【输出格式 - 必须严格遵守】
1. 第一行：中文翻译结果（纯译文，不要有原文）
2. 空一行
3. 词汇对应表（Markdown表格格式）：
   | 英文原文 | 中文翻译 |
   |---------|---------|
   | 英文词1 | 中文翻译1 |
   | 英文词2 | 中文翻译2 |

【上下文信息】
页面标题: {title}
页面URL: {url}
页面摘要: {summary}

【要翻译的文本】
{text}

请严格按照上述格式输出，先输出中文翻译，然后输出词汇对应表。`,

  // 显示设置
  display: {
    showOriginal: true,  // 是否显示原文
    highlightTerms: true // 是否高亮专业术语
  },
  
  // 行为设置
  behavior: {
    concurrency: 10,     // 并行翻译请求数
    cacheResults: true,  // 是否缓存翻译结果
    autoTranslate: false // 是否自动翻译（默认关闭）
  }
};

var ConfigManager = {
  // 获取配置
  async getConfig() {
    let config = DEFAULT_CONFIG;
    
    // 1. 尝试从环境变量加载（KIMI_CODING_API_CONFIG）
    try {
      const envConfig = this.loadFromEnv();
      if (envConfig) {
        config = this.mergeConfig(config, { api: envConfig });
      }
    } catch (e) {
      console.log('环境变量配置加载失败:', e);
    }
    
    // 2. 从存储中加载用户配置（覆盖环境变量）
    try {
      const result = await storageAPI.get(['translatorConfig']);
      if (result.translatorConfig) {
        config = this.mergeConfig(config, result.translatorConfig);
      }
    } catch (e) {
      console.log('使用默认配置');
    }
    
    return config;
  },
  
  // 从环境变量加载配置
  loadFromEnv() {
    // 检查各种可能的配置来源
    const sources = [
      // 方式1: window.openclaw (OpenClaw 格式配置)
      () => {
        if (typeof window !== 'undefined' && window.openclaw) {
          const config = typeof window.openclaw === 'string' 
            ? JSON.parse(window.openclaw)
            : window.openclaw;
          return this.parseOpenClawConfig(config);
        }
        return null;
      },
      // 方式2: window.KIMI_CODING_API_CONFIG (通过外部脚本注入)
      () => {
        if (typeof window !== 'undefined' && window.KIMI_CODING_API_CONFIG) {
          const raw = typeof window.KIMI_CODING_API_CONFIG === 'string' 
            ? JSON.parse(window.KIMI_CODING_API_CONFIG)
            : window.KIMI_CODING_API_CONFIG;
          
          // 检查是否是 openclaw 格式
          if (raw.openclaw) {
            return this.parseOpenClawConfig(raw.openclaw);
          }
          return this.parseStandardConfig(raw);
        }
        return null;
      },
      // 方式3: localStorage
      () => {
        try {
          const stored = localStorage.getItem('KIMI_CODING_API_CONFIG');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.openclaw) {
              return this.parseOpenClawConfig(parsed.openclaw);
            }
            return this.parseStandardConfig(parsed);
          }
          
          // 也尝试 openclaw 键
          const openclawStored = localStorage.getItem('openclaw');
          if (openclawStored) {
            return this.parseOpenClawConfig(JSON.parse(openclawStored));
          }
        } catch (e) {
          return null;
        }
      },
      // 方式4: 检查全局变量
      () => {
        if (typeof KIMI_CODING_API_CONFIG !== 'undefined') {
          const raw = typeof KIMI_CODING_API_CONFIG === 'string'
            ? JSON.parse(KIMI_CODING_API_CONFIG)
            : KIMI_CODING_API_CONFIG;
          
          if (raw.openclaw) {
            return this.parseOpenClawConfig(raw.openclaw);
          }
          return this.parseStandardConfig(raw);
        }
        return null;
      },
      // 方式5: 检查 openclaw 全局变量
      () => {
        if (typeof openclaw !== 'undefined') {
          const raw = typeof openclaw === 'string'
            ? JSON.parse(openclaw)
            : openclaw;
          return this.parseOpenClawConfig(raw);
        }
        return null;
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
  },
  
  // 解析 OpenClaw 格式配置
  parseOpenClawConfig(config) {
    return {
      baseUrl: config.baseUrl || config.apiUrl || '',
      apiKey: config.apiKey || '',
      model: config.model || '',
      provider: config.provider || 'openai-compatible'
    };
  },
  
  // 解析标准格式配置
  parseStandardConfig(config) {
    return {
      baseUrl: config.baseUrl || config.apiUrl || '',
      apiKey: config.apiKey || '',
      model: config.model || '',
      provider: config.provider || 'openai-compatible'
    };
  },
  
  // 保存配置
  async saveConfig(config) {
    try {
      await storageAPI.set({ translatorConfig: config });
      return true;
    } catch (e) {
      console.error('保存配置失败:', e);
      return false;
    }
  },
  
  // 合并配置
  mergeConfig(defaults, saved) {
    const merged = { ...defaults };
    for (const key in saved) {
      if (typeof saved[key] === 'object' && saved[key] !== null && !Array.isArray(saved[key])) {
        merged[key] = { ...defaults[key], ...saved[key] };
      } else {
        merged[key] = saved[key];
      }
    }
    return merged;
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConfigManager, DEFAULT_CONFIG };
}
