/**
 * API 连接测试脚本
 * 使用与扩展完全相同的配置和调用方式
 * 
 * 使用方法：
 * 1. 在扩展已加载的网页中，按 F12 打开 Console
 * 2. 复制粘贴此代码运行
 * 3. 或者将代码添加到 content.js 末尾，然后调用 window.testAPI()
 */

// 测试配置 - 使用与扩展相同的配置方式
async function testAPIConnection() {
  console.log('🧪 开始 API 连接测试...\n');
  
  // 1. 获取扩展配置（与扩展使用相同方式）
  console.log('📋 步骤1: 读取扩展配置');
  let config;
  try {
    config = await ConfigManager.getConfig();
    console.log('✅ 配置读取成功');
    console.log('  - Provider:', config.api.provider);
    console.log('  - Base URL:', config.api.baseUrl);
    console.log('  - Model:', config.api.model);
    console.log('  - API Key:', config.api.apiKey ? config.api.apiKey.substring(0, 10) + '...' : '未设置');
  } catch (e) {
    console.error('❌ 读取配置失败:', e);
    return;
  }
  
  if (!config.api.apiKey) {
    console.error('❌ API Key 未设置，请先配置');
    return;
  }
  
  // 2. 构建测试 Prompt（使用与扩展相同的格式）
  console.log('\n📋 步骤2: 构建测试请求');
  const testText = 'The network provides connectivity.';
  const prompt = config.prompt
    .replace('{title}', 'Test Page')
    .replace('{url}', 'http://test.com')
    .replace('{summary}', 'Test summary')
    .replace('{text}', testText);
  
  console.log('  - 测试文本:', testText);
  console.log('  - Prompt 长度:', prompt.length);
  
  // 3. 发送请求（使用与扩展完全相同的方式）
  console.log('\n📋 步骤3: 发送翻译请求');
  console.log('  - 调用方式: chrome.runtime.sendMessage');
  console.log('  - Action: translate');
  
  const startTime = Date.now();
  
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'translate',
        prompt: prompt,
        apiConfig: config.api
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
    
    const duration = Date.now() - startTime;
    
    if (response.error) {
      console.error(`❌ 请求失败 (${duration}ms):`, response.error);
      return;
    }
    
    console.log(`✅ 请求成功 (${duration}ms)`);
    console.log('\n=== AI 返回结果 ===');
    console.log(response.result);
    console.log('===================');
    
    // 4. 解析词汇对应表
    console.log('\n📋 步骤4: 解析词汇对应表');
    const mappingMatch = response.result.match(/\[词汇对应\]([\s\S]*?)\[\/词汇对应\]/);
    if (mappingMatch) {
      console.log('✅ 找到词汇对应表');
      const lines = mappingMatch[1].trim().split('\n');
      lines.forEach(line => {
        if (line.includes('|')) {
          const [eng, chn] = line.split('|').map(s => s.trim());
          console.log(`  ${eng} → ${chn}`);
        }
      });
    } else {
      console.warn('⚠️ 未找到词汇对应表');
    }
    
  } catch (error) {
    console.error('❌ 请求异常:', error.name, error.message);
    console.log('\n🔍 排查建议:');
    console.log('  1. 检查网络连接');
    console.log('  2. 检查扩展后台页面日志 (chrome://extensions/ → 背景页)');
    console.log('  3. 验证 API Key 是否有效');
    console.log('  4. 检查 API URL 格式');
  }
}

// 使用特定的 API 配置测试（不依赖扩展配置）
async function testWithCustomConfig(apiConfig) {
  console.log('🧪 使用自定义配置测试...\n');
  console.log('配置信息:', {
    provider: apiConfig.provider,
    baseUrl: apiConfig.baseUrl,
    model: apiConfig.model,
    keyLength: apiConfig.apiKey?.length || 0
  });
  
  const testPrompt = `你是一位专业的网页翻译助手。请将以下网页段落翻译成中文。

【翻译要求】
1. 保留所有英文专业术语、技术词汇、专有名词不翻译
2. 保留代码、变量名、URL、路径、版本号等不变
3. 保持原文段落结构，不要拆分句子
4. 中文翻译应该通顺、自然、专业
5. 输出格式：每段原文后紧跟中文翻译，用 | 分隔

【上下文信息】
页面标题: Test
页面URL: http://test.com
页面摘要: Test summary

【待翻译内容】
The network provides connectivity for fans.

【输出格式示例】
原文段落1 | 中文翻译1

重要提示：
- 保持段落完整，不要拆分句子
- 只输出翻译结果，不要添加额外说明`;

  console.log('\n📡 发送请求...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'translate',
        prompt: testPrompt,
        apiConfig: apiConfig
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
    
    if (response.error) {
      console.error('❌ 失败:', response.error);
    } else {
      console.log('✅ 成功!');
      console.log('\n结果:', response.result);
    }
    
  } catch (error) {
    console.error('❌ 异常:', error);
  }
}

// 快速测试函数
function quickTest() {
  // 使用 OpenClaw 格式的配置
  const config = {
    provider: "openai-compatible",
    baseUrl: "https://api.moonshot.cn/v1",
    apiKey: "", // 会自动从扩展配置读取
    model: "kimi-latest"
  };
  
  // 如果 window.openclaw 存在，使用它
  if (typeof window.openclaw !== 'undefined') {
    Object.assign(config, window.openclaw);
    console.log('使用 window.openclaw 配置');
  }
  
  testWithCustomConfig(config);
}

// 导出到 window
window.testAPI = testAPIConnection;
window.testAPIWithConfig = testWithCustomConfig;
window.quickTest = quickTest;

console.log('✅ API 测试脚本已加载');
console.log('可用命令:');
console.log('  - testAPI()           // 使用扩展配置测试');
console.log('  - testAPIWithConfig({...})  // 使用自定义配置');
console.log('  - quickTest()         // 快速测试');
