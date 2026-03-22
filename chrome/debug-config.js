/**
 * Safari 调试配置和兼容层
 * 添加详细的日志记录和错误处理
 */

// Safari 检测 - 使用 var 避免重复声明错误
var isSafariDebug = typeof browser !== 'undefined' && browser.runtime;

// 全局调试开关
var DEBUG = {
  enabled: true,
  logLevel: 'debug', // 'debug' | 'info' | 'warn' | 'error'
  logToStorage: false, // 是否将日志存入 localStorage
  maxLogEntries: 100
};

// 日志存储
var LogStore = {
  entries: [],
  
  add(level, message, data) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.stringify(data) : undefined,
      userAgent: navigator.userAgent
    };
    this.entries.push(entry);
    if (this.entries.length > DEBUG.maxLogEntries) {
      this.entries.shift();
    }
    if (DEBUG.logToStorage) {
      try {
        localStorage.setItem('aiTranslatorLogs', JSON.stringify(this.entries));
      } catch (e) {}
    }
  },
  
  getAll() {
    return this.entries;
  },
  
  clear() {
    this.entries = [];
    localStorage.removeItem('aiTranslatorLogs');
  },
  
  export() {
    return JSON.stringify(this.entries, null, 2);
  }
};

// 增强版日志函数 - 使用 function 声明避免重复定义
function debugLog(level) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (!DEBUG.enabled) return;
  
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevel = levels.indexOf(DEBUG.logLevel);
  const msgLevel = levels.indexOf(level);
  
  if (msgLevel < currentLevel) return;
  
  const prefix = `[AI Translator][${level.toUpperCase()}]`;
  const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  
  // 存储日志
  LogStore.add(level, message, args.length > 1 ? args : undefined);
  
  // 输出到控制台
  switch (level) {
    case 'debug':
      console.debug(prefix, ...args);
      break;
    case 'info':
      console.log(prefix, ...args);
      break;
    case 'warn':
      console.warn(prefix, ...args);
      break;
    case 'error':
      console.error(prefix, ...args);
      break;
  }
}

// 便捷函数
var D = {
  debug: (...args) => debugLog('debug', ...args),
  info: (...args) => debugLog('info', ...args),
  warn: (...args) => debugLog('warn', ...args),
  error: (...args) => debugLog('error', ...args),
  
  // 追踪函数调用
  trace(label) {
    const stack = new Error().stack;
    this.debug(`TRACE: ${label}`, stack);
  },
  
  // 显示当前状态
  state(label, obj) {
    this.info(`STATE [${label}]:`, obj);
  }
};

// Safari 兼容的消息发送包装器
var MessageBridge = {
  /**
   * 检测当前运行环境
   */
  detectEnvironment() {
    const env = {
      isSafari: typeof browser !== 'undefined' && browser.runtime,
      isChrome: typeof chrome !== 'undefined' && chrome.runtime && !isSafari,
      hasBrowser: typeof browser !== 'undefined',
      hasChrome: typeof chrome !== 'undefined',
      userAgent: navigator.userAgent
    };
    D.info('环境检测:', env);
    return env;
  },

  /**
   * 发送消息到 background script
   * 自动处理 Safari (Promise) 和 Chrome (callback) 的差异
   */
  async sendMessage(message) {
    D.info('发送消息:', message.action || message);
    
    const env = this.detectEnvironment();
    
    try {
      if (env.isSafari) {
        // Safari: 使用 Promise API
        D.debug('使用 Safari Promise API');
        const response = await browser.runtime.sendMessage(message);
        D.debug('收到响应:', response);
        return response;
      } else {
        // Chrome: 使用 callback API
        D.debug('使用 Chrome callback API');
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              D.error('Chrome 消息错误:', chrome.runtime.lastError.message);
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            D.debug('收到响应:', response);
            resolve(response);
          });
        });
      }
    } catch (error) {
      D.error('发送消息失败:', error.message);
      throw error;
    }
  },

  /**
   * 测试与 background 的连接
   */
  async testConnection() {
    D.info('测试 background 连接...');
    try {
      const response = await this.sendMessage({ action: 'ping' });
      D.info('连接测试成功:', response);
      return { success: true, response };
    } catch (error) {
      D.error('连接测试失败:', error.message);
      return { success: false, error: error.message };
    }
  }
};

// 全局调试工具 - 使用多种方式确保可访问
var AITranslatorDebug = {
  D,
  LogStore,
  MessageBridge,
  DEBUG,
  
  // 显示所有日志
  showLogs() {
    console.table(LogStore.getAll());
    return LogStore.getAll();
  },
  
  // 导出日志到剪贴板
  async exportLogs() {
    const logs = LogStore.export();
    try {
      await navigator.clipboard.writeText(logs);
      D.info('日志已复制到剪贴板');
    } catch (e) {
      D.error('复制失败:', e);
      console.log('日志:', logs);
    }
    return logs;
  },
  
  // 测试配置
  async testConfig() {
    D.info('测试配置加载...');
    try {
      const config = await ConfigManager.getConfig();
      D.info('配置:', {
        hasApiKey: !!config.api?.apiKey,
        apiKeyLength: config.api?.apiKey?.length,
        baseUrl: config.api?.baseUrl,
        model: config.api?.model,
        provider: config.api?.provider
      });
      return config;
    } catch (error) {
      D.error('配置测试失败:', error);
      throw error;
    }
  },
  
  // 测试翻译
  async testTranslate(text = 'Hello world') {
    D.info('测试翻译:', text);
    try {
      const config = await ConfigManager.getConfig();
      const response = await MessageBridge.sendMessage({
        action: 'translate',
        prompt: `Translate to Chinese: ${text}`,
        apiConfig: config.api
      });
      D.info('翻译结果:', response);
      return response;
    } catch (error) {
      D.error('翻译测试失败:', error);
      throw error;
    }
  },
  
  // 测试 Safari storage
  async testStorage() {
    D.info('测试 Safari storage...');
    const testKey = 'testStorage_' + Date.now();
    const testValue = { test: true, timestamp: Date.now() };
    
    try {
      // 测试 browser.storage.local
      if (typeof browser !== 'undefined' && browser.storage?.local) {
        D.info('测试 browser.storage.local...');
        await browser.storage.local.set({ [testKey]: testValue });
        const result = await browser.storage.local.get(testKey);
        if (result[testKey]?.test === true) {
          D.info('✅ browser.storage.local 工作正常');
          await browser.storage.local.remove(testKey);
          return { success: true, api: 'browser.storage.local' };
        }
      }
      
      // 测试 localStorage
      D.info('测试 localStorage...');
      localStorage.setItem(testKey, JSON.stringify(testValue));
      const lsResult = JSON.parse(localStorage.getItem(testKey));
      if (lsResult?.test === true) {
        D.info('✅ localStorage 工作正常 (注意: popup 和 content script 不共享)');
        localStorage.removeItem(testKey);
        return { success: true, api: 'localStorage' };
      }
      
      return { success: false, error: '所有存储方式都失败' };
    } catch (error) {
      D.error('Storage 测试失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 开启高亮调试模式
  enableHighlightDebug() {
    window.HIGHLIGHT_DEBUG = true;
    D.info('✅ 高亮调试模式已开启');
    D.info('现在悬停词汇时会输出详细匹配日志');
    return '高亮调试已开启';
  },
  
  // 关闭高亮调试模式
  disableHighlightDebug() {
    window.HIGHLIGHT_DEBUG = false;
    D.info('⛔ 高亮调试模式已关闭');
    return '高亮调试已关闭';
  },
  
  // 获取高亮统计
  getHighlightStats() {
    if (typeof highlightDebugStats !== 'undefined') {
      highlightDebugStats.log();
      return {
        ...highlightDebugStats,
        chineseMatchRate: highlightDebugStats.totalChineseWords > 0 
          ? (highlightDebugStats.matchedChineseWords / highlightDebugStats.totalChineseWords * 100).toFixed(1) + '%'
          : 'N/A',
        englishMatchRate: highlightDebugStats.totalEnglishWords > 0
          ? (highlightDebugStats.matchedEnglishWords / highlightDebugStats.totalEnglishWords * 100).toFixed(1) + '%'
          : 'N/A'
      };
    } else {
      D.error('highlightDebugStats 未找到，请先在页面上进行一些高亮操作');
      return null;
    }
  },
  
  // 重置高亮统计
  resetHighlightStats() {
    if (typeof highlightDebugStats !== 'undefined') {
      highlightDebugStats.reset();
      D.info('✅ 高亮统计已重置');
    } else {
      D.error('highlightDebugStats 未找到');
    }
  },
  
  // 分析词汇对应表
  analyzeWordMapping() {
    if (typeof globalWordMapping === 'undefined' || globalWordMapping.size === 0) {
      D.error('没有找到词汇对应表，请先翻译页面');
      return null;
    }
    
    const stats = {
      totalParagraphs: globalWordMapping.size,
      totalWords: 0,
      sampleMappings: []
    };
    
    let count = 0;
    for (const [el, data] of globalWordMapping.entries()) {
      if (data.wordMap) {
        stats.totalWords += data.wordMap.size;
        if (count < 3) {
          const samples = [];
          for (const [eng, entry] of data.wordMap.entries()) {
            samples.push({
              english: Array.from(entry.originals).join('/'),
              chinese: entry.chinese
            });
            if (samples.length >= 5) break;
          }
          stats.sampleMappings.push(samples);
          count++;
        }
      }
    }
    
    D.info('词汇对应表分析:', stats);
    return stats;
  },

  // 完整的诊断
  async diagnose() {
    D.info('========== 开始诊断 ==========');
    
    // 1. 环境检测
    const env = MessageBridge.detectEnvironment();
    
    // 2. 连接测试
    const connection = await MessageBridge.testConnection();
    
    // 3. 配置测试
    let config = null;
    try {
      config = await this.testConfig();
    } catch (e) {
      D.error('配置测试失败:', e);
    }
    
    // 4. 存储测试
    const storage = await this.testStorage();
    
    // 5. localStorage 检查 (后备)
    D.info('localStorage 检查:', {
      hasTranslatorConfig: !!localStorage.getItem('translatorConfig'),
      keys: Object.keys(localStorage)
    });
    
    // 6. DOM 检查
    D.info('DOM 检查:', {
      hasControls: !!document.getElementById('ai-translator-controls'),
      bodyExists: !!document.body,
      readyState: document.readyState
    });
    
    D.info('========== 诊断完成 ==========');
    
    return {
      env,
      connection,
      config: config ? {
        hasApiKey: !!config.api?.apiKey,
        baseUrl: config.api?.baseUrl,
        model: config.api?.model
      } : null,
      storage
    };
  }
};

// 在页面加载时自动运行诊断
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    D.info('DOMContentLoaded - debug-config 已加载');
    setTimeout(() => window.AITranslatorDebug?.diagnose(), 1000);
  });
} else {
  D.info('debug-config 已加载 (DOM 已就绪)');
}

D.info('调试配置加载完成，可用命令:');
D.info('- AITranslatorDebug.diagnose() - 运行完整诊断');
D.info('- AITranslatorDebug.testConnection() - 测试后台连接');
D.info('- AITranslatorDebug.testConfig() - 测试配置');
D.info('- AITranslatorDebug.testStorage() - 测试存储');
D.info('- AITranslatorDebug.testTranslate() - 测试翻译');
D.info('- AITranslatorDebug.showLogs() - 显示所有日志');
D.info('- AITranslatorDebug.exportLogs() - 导出日志');
D.info('');
D.info('高亮调试命令:');
D.info('- AITranslatorDebug.enableHighlightDebug() - 开启高亮调试');
D.info('- AITranslatorDebug.disableHighlightDebug() - 关闭高亮调试');
D.info('- AITranslatorDebug.getHighlightStats() - 获取高亮统计');
D.info('- AITranslatorDebug.resetHighlightStats() - 重置统计');
D.info('- AITranslatorDebug.analyzeWordMapping() - 分析词汇对应表');
