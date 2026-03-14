// 默认配置
const DEFAULT_CONFIG = {
  // API 配置 - 从环境变量或这里配置
  api: {
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKey: '', // 留空，从存储中读取
    model: 'kimi-latest',
    provider: 'openai-compatible' // 可选: 'openai-compatible', 'anthropic-messages'
  },
  
  // 翻译提示词 - 可自定义
  prompt: `你是一位专业的网页翻译助手。请将以下网页段落翻译成中文。

【翻译要求】
1. 保留所有英文专业术语、技术词汇、专有名词不翻译
2. 保留代码、变量名、URL、路径、版本号等不变
3. 保持原文段落结构，不要拆分句子
4. 中文翻译应该通顺、自然、专业
5. 输出格式：翻译结果 + 词汇对应表

【上下文信息】
页面标题: {title}
页面URL: {url}
页面摘要: {summary}

【待翻译内容】
{text}

【输出格式要求】
请按以下格式输出：

原文段落 | 中文翻译

[词汇对应]
英文单词1 | 对应中文1
英文单词2 | 对应中文2
...
[/词汇对应]

【示例】
The network provides connectivity for fans. | 网络为粉丝提供连接。

[词汇对应]
network | 网络
provides | 提供
connectivity | 连接
fans | 粉丝
[/词汇对应]

重要提示：
- 只输出翻译结果和词汇对应表，不要添加额外说明
- 词汇对应表只包含实词（名词、动词、形容词等），跳过虚词
- 如果原文已经是中文，直接返回原文 | 原文，词汇对应表为空`,

  // 界面设置
  ui: {
    translationColor: '#2c5282',
    translationBackground: '#ebf8ff',
    showOriginal: true,
    fontSize: '14px'
  },
  
  // 行为设置
  behavior: {
    autoTranslate: false,
    translateOnLoad: false,
    skipCodeBlocks: true,
    skipPreBlocks: true,
    concurrency: 10  // 并行翻译线程数
  }
};

// 配置管理器
const ConfigManager = {
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
      const result = await chrome.storage.sync.get(['translatorConfig']);
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
        const result = source();
        if (result && result.apiKey) {
          return result;
        }
      } catch (e) {
        // 继续下一个来源
      }
    }
    
    return null;
  },
  
  // 解析 OpenClaw 格式配置
  parseOpenClawConfig(config) {
    if (!config) return null;
    
    return {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || DEFAULT_CONFIG.api.baseUrl,
      model: config.model || DEFAULT_CONFIG.api.model,
      provider: config.provider || 'openai-compatible'
    };
  },
  
  // 解析标准格式配置
  parseStandardConfig(config) {
    if (!config) return null;
    if (config.api_key || config.apiKey) {
      return {
        apiKey: config.api_key || config.apiKey,
        baseUrl: config.base_url || config.baseUrl || DEFAULT_CONFIG.api.baseUrl,
        model: config.model || DEFAULT_CONFIG.api.model,
        provider: config.provider || 'openai-compatible'
      };
    }
    return null;
  },

  // 保存配置
  async saveConfig(config) {
    try {
      await chrome.storage.sync.set({ translatorConfig: config });
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
  },

  // 从环境变量加载 API 配置 (如果在扩展环境中可用)
  async loadFromEnv() {
    // 在实际部署时，可以通过外部消息传递或其他方式注入
    // 这里提供一个扩展点
    return this.getConfig();
  }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConfigManager, DEFAULT_CONFIG };
}
