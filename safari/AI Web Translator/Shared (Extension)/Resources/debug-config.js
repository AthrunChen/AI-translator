// 调试配置加载
console.log('[AI Translator] 调试模式开启');
console.log('[AI Translator] 是否Safari:', typeof browser !== 'undefined' && browser.runtime);

// 测试存储 API
try {
  const testStorage = isSafari ? browser.storage.local : chrome.storage.sync;
  console.log('[AI Translator] 存储 API:', testStorage);
  
  testStorage.get(['test'], (result) => {
    console.log('[AI Translator] 存储测试成功:', result);
  });
} catch (e) {
  console.error('[AI Translator] 存储 API 错误:', e);
}
