/**
 * 查看词汇对应表工具
 * 在任意已翻译的页面，打开 Console 运行以下代码
 */

// 方法1: 查看所有段落的词汇对应表
function viewAllMappings() {
  console.log('📊 所有词汇对应表:\n');
  
  // 遍历所有已翻译的段落
  const sourceElements = document.querySelectorAll('[data-ai-translated="true"]');
  
  sourceElements.forEach((el, index) => {
    const originalText = el.dataset.originalText;
    const transEl = el.nextElementSibling;
    const translation = transEl ? transEl.textContent : 'N/A';
    
    console.log(`\n--- 段落 ${index + 1} ---`);
    console.log('原文:', originalText);
    console.log('译文:', translation);
    
    // 从 globalWordMapping 获取对应表（如果在 content.js 中定义）
    if (typeof globalWordMapping !== 'undefined' && globalWordMapping.has(el)) {
      const mapping = globalWordMapping.get(el);
      console.log('词汇对应:');
      mapping.forEach((chineseList, english) => {
        console.log(`  ${english} → ${chineseList.join(', ')}`);
      });
    }
  });
}

// 方法2: 查看特定段落的详细对应
function viewParagraphMapping(paragraphIndex = 0) {
  const sourceElements = document.querySelectorAll('[data-ai-translated="true"]');
  
  if (paragraphIndex >= sourceElements.length) {
    console.error(`❌ 只有 ${sourceElements.length} 个段落，索引 ${paragraphIndex} 超出范围`);
    return;
  }
  
  const el = sourceElements[paragraphIndex];
  const transEl = el.nextElementSibling;
  
  console.log(`\n📄 段落 ${paragraphIndex + 1} 详情:\n`);
  console.log('原文:', el.dataset.originalText);
  console.log('译文:', transEl ? transEl.textContent : 'N/A');
  
  // 词汇对应
  if (typeof globalWordMapping !== 'undefined' && globalWordMapping.has(el)) {
    const mapping = globalWordMapping.get(el);
    console.log('\n📝 词汇对应表:');
    console.table(Array.from(mapping.entries()).map(([eng, chn]) => ({
      '英文': eng,
      '中文': chn.join(', ')
    })));
  } else {
    console.log('⚠️ 未找到词汇对应表（可能该段落未使用AI词汇对应功能）');
  }
}

// 方法3: 搜索特定单词的对应关系
function findWordMapping(word) {
  const wordLower = word.toLowerCase();
  console.log(`🔍 查找 "${word}" 的对应关系:\n`);
  
  let found = false;
  
  if (typeof globalWordMapping !== 'undefined') {
    globalWordMapping.forEach((mapping, element) => {
      if (mapping.has(wordLower)) {
        const chinese = mapping.get(wordLower);
        const originalText = element.dataset.originalText;
        console.log(`✅ 找到对应:`);
        console.log(`  ${word} → ${chinese.join(', ')}`);
        console.log(`  所在段落: ${originalText.substring(0, 50)}...\n`);
        found = true;
      }
    });
  }
  
  if (!found) {
    console.log(`❌ 未找到 "${word}" 的对应关系`);
  }
}

// 方法4: 实时高亮测试
function testHighlight(word) {
  console.log(`🧪 测试高亮: "${word}"`);
  
  // 查找原文中的单词
  const sourceWords = document.querySelectorAll('.ai-source-word');
  sourceWords.forEach(el => {
    if (el.dataset.word === word.toLowerCase()) {
      console.log('✅ 找到原文单词:', el.textContent);
      
      // 模拟悬停效果
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      
      setTimeout(() => {
        el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        console.log('已清除高亮');
      }, 2000);
    }
  });
}

// 导出函数
window.viewAllMappings = viewAllMappings;
window.viewParagraphMapping = viewParagraphMapping;
window.findWordMapping = findWordMapping;
window.testHighlight = testHighlight;

console.log('✅ 词汇对应查看工具已加载');
console.log('可用命令:');
console.log('  viewAllMappings()           - 查看所有段落');
console.log('  viewParagraphMapping(0)     - 查看第N个段落');
console.log('  findWordMapping("network")  - 查找特定单词');
console.log('  testHighlight("network")    - 测试高亮效果');
