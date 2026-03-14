/**
 * 扩展内测试脚本
 * 在扩展的 content.js 中运行，无 CORS 限制
 */

// 测试词汇对应功能的独立函数
async function testWordMapping(apiConfig, testText) {
  const prompt = `你是一位专业的网页翻译助手。请将以下文本翻译成中文。

【翻译要求】
1. 保留所有英文专业术语、技术词汇、专有名词不翻译
2. 中文翻译应该通顺、自然、专业
3. 输出格式：翻译结果 + 词汇对应表

【待翻译内容】
${testText}

【输出格式要求】
请按以下格式输出：

原文 | 中文翻译

[词汇对应]
英文单词1 | 对应中文1
英文单词2 | 对应中文2
...
[/词汇对应]

重要提示：
- 只输出翻译结果和词汇对应表
- 词汇对应表只包含实词（名词、动词、形容词等）
- 每个英文单词对应最准确的中文翻译`;

  try {
    console.log('🧪 开始测试翻译...');
    console.log('测试文本:', testText);
    
    const result = await callTranslationAPI(prompt, apiConfig);
    
    console.log('✅ 翻译成功!');
    console.log('\n=== AI 原始响应 ===');
    console.log(result);
    console.log('==================\n');
    
    // 解析词汇对应表
    const mapping = parseWordMapping(result);
    console.log('=== 解析到的词汇对应 ===');
    mapping.forEach((chinese, english) => {
      console.log(`${english} → ${chinese.join(', ')}`);
    });
    console.log('========================\n');
    
    return { success: true, result, mapping };
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return { success: false, error: error.message };
  }
}

// 调用翻译 API
function callTranslationAPI(prompt, apiConfig) {
  return new Promise((resolve, reject) => {
    const { baseUrl, apiKey, model } = apiConfig;
    
    chrome.runtime.sendMessage({
      action: 'translate',
      prompt: prompt,
      apiConfig: { baseUrl, apiKey, model, provider: 'openai-compatible' }
    }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response.result);
    });
  });
}

// 解析词汇对应表
function parseWordMapping(result) {
  const mapping = new Map();
  
  const mappingMatch = result.match(/\[词汇对应\]([\s\S]*?)\[\/词汇对应\]/);
  if (mappingMatch) {
    const mappingText = mappingMatch[1].trim();
    const lines = mappingText.split('\n');
    
    for (const line of lines) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const english = parts[0].toLowerCase().replace(/[^a-z]/g, '');
        const chinese = parts[1];
        if (english.length >= 2) {
          if (!mapping.has(english)) {
            mapping.set(english, []);
          }
          mapping.get(english).push(chinese);
        }
      }
    }
  }
  
  return mapping;
}

// 测试用例
const testCases = [
  {
    name: '简单句',
    text: 'The cat sat on the mat.'
  },
  {
    name: '专业术语',
    text: 'GPS jamming affects navigation systems and mobile networks.'
  },
  {
    name: '技术段落',
    text: 'The stadium provides high-speed connectivity for thousands of fans using 5G networks.'
  }
];

// 运行所有测试
async function runAllTests(apiConfig) {
  console.log('🚀 开始运行词汇对应测试...\n');
  
  for (const testCase of testCases) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📋 测试: ${testCase.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    await testWordMapping(apiConfig, testCase.text);
    
    // 延迟1秒，避免请求过快
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n✅ 所有测试完成!');
}

// 导出函数
if (typeof window !== 'undefined') {
  window.testWordMapping = testWordMapping;
  window.runAllTests = runAllTests;
}
