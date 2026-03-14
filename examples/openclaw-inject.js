/**
 * OpenClaw 配置注入示例
 * 
 * 此脚本展示如何通过 window.openclaw 配置 AI 网页翻译器
 * 可以在浏览器控制台执行，或作为 Tampermonkey 脚本注入
 */

// ============================================
// 示例 1: 使用 anthropic-messages provider (Kimi Coding API)
// ============================================
window.openclaw = {
  "provider": "anthropic-messages",
  "baseUrl": "https://api.kimi.com/coding",
  "apiKey": "sk-kimi-your-api-key",
  "model": "kimi-for-coding"
};

console.log('[AI Translator] OpenClaw 配置已注入:', window.openclaw);

// ============================================
// 示例 2: 使用 KIMI_CODING_API_CONFIG 包装格式
// ============================================
/*
window.KIMI_CODING_API_CONFIG = {
  "openclaw": {
    "provider": "anthropic-messages",
    "baseUrl": "https://api.kimi.com/coding",
    "apiKey": "sk-kimi-your-api-key",
    "model": "kimi-for-coding"
  }
};
*/

// ============================================
// 示例 3: OpenAI 兼容格式 (标准 Kimi API)
// ============================================
/*
window.openclaw = {
  "provider": "openai-compatible",
  "baseUrl": "https://api.moonshot.cn/v1",
  "apiKey": "sk-your-kimi-api-key",
  "model": "kimi-latest"
};
*/

// ============================================
// 示例 4: 使用 localStorage 持久化配置
// ============================================
/*
localStorage.setItem('openclaw', JSON.stringify({
  "provider": "anthropic-messages",
  "baseUrl": "https://api.kimi.com/coding",
  "apiKey": "sk-kimi-your-api-key",
  "model": "kimi-for-coding"
}));
*/

// ============================================
// 使用说明
// ============================================
// 
// 1. 复制此代码到浏览器控制台执行
// 2. 或者使用 Tampermonkey 创建用户脚本，设置 @run-at document-start
// 3. 然后加载 AI 网页翻译器扩展
// 4. 扩展会自动读取此配置
//
// 注意：为了安全，建议在实际使用时通过其他方式注入 API Key，
// 而不是直接写在脚本中
