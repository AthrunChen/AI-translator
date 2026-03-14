/**
 * AI 网页翻译器 - 内容脚本
 * 负责页面文本提取、翻译结果显示和交互
 * 功能：词汇高亮对应、原文/翻译切换、缓存翻译结果
 */

(function() {
  'use strict';

  // 防止重复注入
  if (window.aiTranslatorInjected) return;
  window.aiTranslatorInjected = true;

  // ============ 全局状态 ============
  let isTranslating = false;
  let translatedElements = new Set();
  let config = null;
  let pageContext = {
    title: document.title,
    url: window.location.href,
    summary: ''
  };
  
  // 翻译缓存：key = 原文hash, value = {translation, wordMap}
  const translationCache = new Map();
  
  // 当前显示模式: 'both' | 'source' | 'translation'
  let displayMode = 'both';
  
  // 存储段落级别的翻译数据
  const paragraphTranslations = new Map(); // element -> {source, translation, wordMap}

  // ============ DOM 工具函数 ============
  
  // 创建控制栏
  function createControls() {
    const controls = document.createElement('div');
    controls.className = 'ai-translator-controls';
    controls.id = 'ai-translator-controls';
    controls.innerHTML = `
      <button class="ai-translator-btn" id="ai-translator-translate-btn" title="翻译页面">🌐</button>
      <button class="ai-translator-btn" id="ai-translator-toggle-btn" title="切换原文/翻译" style="display:none;">👁</button>
      <button class="ai-translator-btn" id="ai-translator-settings-btn" title="设置">⚙️</button>
      <div class="ai-translator-status" id="ai-translator-status"></div>
    `;
    document.body.appendChild(controls);
    
    // 绑定事件
    document.getElementById('ai-translator-translate-btn').onclick = handleTranslateClick;
    document.getElementById('ai-translator-toggle-btn').onclick = toggleDisplayMode;
    document.getElementById('ai-translator-settings-btn').onclick = showSettingsPanel;
    
    return controls;
  }

  // 创建加载提示
  function showLoading(message = '正在翻译...') {
    removeLoading();
    const loading = document.createElement('div');
    loading.className = 'ai-translator-loading';
    loading.id = 'ai-translator-loading';
    loading.textContent = message;
    document.body.appendChild(loading);
    return loading;
  }

  function removeLoading() {
    const existing = document.getElementById('ai-translator-loading');
    if (existing) existing.remove();
  }

  // 创建进度条
  function showProgress(current, total) {
    let progress = document.getElementById('ai-translator-progress');
    if (!progress) {
      progress = document.createElement('div');
      progress.className = 'ai-translator-progress';
      progress.id = 'ai-translator-progress';
      progress.innerHTML = `
        <div style="font-size: 12px; color: #4a5568; margin-bottom: 6px;">
          翻译进度: <span id="ai-translator-progress-text">${current}/${total}</span>
        </div>
        <div class="ai-translator-progress-bar">
          <div class="ai-translator-progress-fill" id="ai-translator-progress-fill"></div>
        </div>
      `;
      document.body.appendChild(progress);
    }
    const percentage = (current / total * 100).toFixed(1);
    document.getElementById('ai-translator-progress-text').textContent = `${current}/${total}`;
    document.getElementById('ai-translator-progress-fill').style.width = `${percentage}%`;
  }

  function removeProgress() {
    const progress = document.getElementById('ai-translator-progress');
    if (progress) progress.remove();
  }

  // 显示错误
  function showError(message) {
    const error = document.createElement('div');
    error.className = 'ai-translator-error';
    error.textContent = message;
    document.body.appendChild(error);
    setTimeout(() => error.remove(), 5000);
  }

  // 更新状态显示
  function updateStatus(message) {
    const status = document.getElementById('ai-translator-status');
    if (status) status.textContent = message;
  }

  // ============ 文本提取逻辑 ============
  
  // 判断是否应该跳过该元素
  function shouldSkipElement(element) {
    if (!element) return true;
    
    // 跳过脚本、样式、代码等
    const skipTags = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'IFRAME', 'CANVAS', 'SVG', 'MATH', 'TEMPLATE', 'FIGCAPTION'];
    if (skipTags.includes(element.tagName)) return true;
    
    // 跳过图片相关元素
    const skipImageTags = ['IMG', 'PICTURE', 'FIGURE'];
    if (skipImageTags.includes(element.tagName)) return true;
    
    // 跳过已翻译的元素
    if (element.closest('.ai-translator-translation') || 
        element.classList?.contains('ai-translator-translation')) return true;
    
    // 跳过隐藏元素
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return true;
    
    // 跳过导航、侧边栏、页眉、页脚等
    const skipRoles = ['navigation', 'banner', 'complementary', 'contentinfo'];
    const role = element.getAttribute?.('role');
    if (skipRoles.includes(role)) return true;
    
    // 跳过页眉、页脚、导航栏
    const skipLandmarks = ['HEADER', 'FOOTER', 'NAV', 'ASIDE'];
    if (skipLandmarks.includes(element.tagName)) return true;
    
    // 跳过包含特定类名的元素（通常是图片说明、作者信息等）
    const skipClassPatterns = [
      /caption/i, /credit/i, /photo/i, /image/i, /getty/i, /afp/i, /reuters/i,
      /author/i, /byline/i, /timestamp/i, /date/i, /meta/i
    ];
    const className = element.className?.toString() || '';
    for (const pattern of skipClassPatterns) {
      if (pattern.test(className)) return true;
    }
    
    return false;
  }
  
  // 检查是否是图片说明文本
  function isImageCaption(text) {
    const captionPatterns = [
      /^AFP\s/i, /^Getty\s/i, /^Reuters\s/i, /^EPA\s/i, /^AP\s/i,
      /Photo:\s/i, /Image:\s/i, /Credit:\s/i, /Source:\s/i,
      /©\s*\d{4}/i,
      /^(Photo|Image|Picture)\s+(by|credit|courtesy)/i
    ];
    return captionPatterns.some(pattern => pattern.test(text.trim()));
  }

  // 判断文本是否需要翻译
  function shouldTranslate(text) {
    if (!text || text.trim().length < 10) return false;
    
    const trimmed = text.trim();
    
    // 如果全是中文，不翻译
    if (/^[\u4e00-\u9fa5\s\p{P}]+$/u.test(trimmed)) return false;
    
    // 如果包含足够的英文字母，需要翻译
    const englishChars = trimmed.match(/[a-zA-Z]/g);
    if (!englishChars || englishChars.length < 5) return false;
    
    // 检查是否是图片说明
    if (isImageCaption(trimmed)) return false;
    
    // 检查是否是代码
    if (/^[\{\}\[\]\(\)<>\/\\;:=+*&|^%$#@!~`-]+$/.test(trimmed)) return false;
    
    // 检查是否是URL
    if (/^https?:\/\//.test(trimmed)) return false;
    
    // 检查是否是邮箱
    if (/^[\w.-]+@[\w.-]+\.\w+$/.test(trimmed)) return false;
    
    return true;
  }

  // 提取页面文本块
  function extractTextBlocks() {
    const blocks = [];
    
    // 定义包含主要内容的元素标签
    const contentSelectors = [
      'article p', 'main p', '.article-body p', '.content p', '.story-body p',
      'article li', 'main li', '.article-body li', '.content li',
      'article h1, article h2, article h3, article h4, article h5',
      'main h1, main h2, main h3, main h4, main h5',
      '.article-body h1, .article-body h2, .article-body h3',
      '.content h1, .content h2, .content h3'
    ];
    
    // 首先尝试从主要内容区域提取
    let contentElements = [];
    for (const selector of contentSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        contentElements = [...contentElements, ...Array.from(elements)];
      }
    }
    
    // 去重
    contentElements = [...new Set(contentElements)];
    
    // 如果没有找到内容区域，回退到遍历所有段落
    if (contentElements.length === 0) {
      contentElements = Array.from(document.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote'));
    }
    
    // 过滤和收集文本块
    for (const element of contentElements) {
      // 跳过不应翻译的元素
      if (shouldSkipElement(element)) continue;
      
      // 检查元素是否在已跳过的容器中
      if (element.closest('nav, header, footer, aside, [role="navigation"], [role="banner"]')) continue;
      
      const fullText = element.textContent.trim();
      
      // 检查是否应该翻译
      if (!shouldTranslate(fullText)) continue;
      
      // 检查是否已经处理过（避免重复）- 基于hash和内容双重检测
      const elementHash = simpleHash(fullText);
      const isDuplicate = blocks.some(block => {
        // DOM包含关系检测
        const domOverlap = block.element.contains(element) || element.contains(block.element);
        // 内容hash检测（允许相同内容在不同位置）
        const contentSame = block.hash === elementHash;
        // 只有当DOM有包含关系且内容相同时才视为重复
        return domOverlap && contentSame;
      });
      if (isDuplicate) {
        console.log('跳过重复元素:', fullText.substring(0, 50) + '...');
        continue;
      }
      
      blocks.push({
        element: element,
        originalText: fullText,
        elementId: generateElementId(element),
        hash: simpleHash(fullText)
      });
    }
    
    console.log(`提取到 ${blocks.length} 个文本块`);
    return blocks;
  }
  
  // 生成元素唯一ID
  function generateElementId(element) {
    const text = element.textContent.substring(0, 50);
    return btoa(encodeURIComponent(text)).substring(0, 20);
  }

  // 生成页面摘要
  function generatePageSummary() {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) return metaDesc.content;
    
    const bodyText = document.body.innerText.slice(0, 500);
    return bodyText + '...';
  }

  // ============ 翻译处理 ============
  
  // 计算文本的hash（用于缓存）- 改进版，减少冲突
  function simpleHash(text) {
    let hash1 = 0;
    let hash2 = 0;
    const len = text.length;
    
    // 双哈希降低冲突概率
    for (let i = 0; i < len; i++) {
      const char = text.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1) + char;
      hash1 = hash1 & hash1;
      hash2 = ((hash2 << 7) - hash2) + char * (i + 1);
      hash2 = hash2 & hash2;
    }
    
    // 包含长度信息，进一步降低冲突
    return `${len}:${hash1.toString(16)}:${hash2.toString(16)}`;
  }
  
  // 调用 API 翻译
  async function translateWithAPI(text, context) {
    // 检查缓存
    const hash = simpleHash(text);
    if (translationCache.has(hash)) {
      console.log('使用缓存的翻译结果');
      return translationCache.get(hash);
    }
    
    const prompt = config.prompt
      .replace('{title}', context.title)
      .replace('{url}', context.url)
      .replace('{summary}', context.summary)
      .replace('{text}', text);

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'translate',
        prompt: prompt,
        apiConfig: config.api
      }, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        
        // 缓存结果
        translationCache.set(hash, response.result);
        resolve(response.result);
      });
    });
  }
  
  // 解析翻译结果并提取词汇对应表
  function parseTranslationWithWordMap(result, sourceText) {
    // 解析词汇对应表
    // 改进：存储结构 { normalized: string, original: string, chinese: string[] }
    const wordMap = new Map(); // 标准化英文 -> {originals: Set, chinese: string[]}
    
    // 查找 [词汇对应] ... [/词汇对应] 块
    const mappingMatch = result.match(/\[词汇对应\]([\s\S]*?)\[\/词汇对应\]/);
    if (mappingMatch) {
      const mappingText = mappingMatch[1].trim();
      const lines = mappingText.split('\n');
      
      for (const line of lines) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const englishOriginal = parts[0];
          const englishNormalized = parts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          const chinese = parts[1];
          
          if (englishNormalized.length >= 2) {
            if (!wordMap.has(englishNormalized)) {
              wordMap.set(englishNormalized, {
                originals: new Set(),  // 存储所有原始形式
                chinese: []
              });
            }
            const entry = wordMap.get(englishNormalized);
            entry.originals.add(englishOriginal.toLowerCase());
            if (!entry.chinese.includes(chinese)) {
              entry.chinese.push(chinese);
            }
          }
        }
      }
    }
    
    // 构建反向映射：中文 -> 标准化英文（用于译文→原文高亮）
    const chineseToEnglish = new Map();
    for (const [normalized, entry] of wordMap.entries()) {
      for (const chn of entry.chinese) {
        if (!chineseToEnglish.has(chn)) {
          chineseToEnglish.set(chn, []);
        }
        chineseToEnglish.get(chn).push(normalized);
      }
    }
    
    // 提取翻译部分（在 [词汇对应] 之前的内容）
    let translation = result;
    const mappingIndex = result.indexOf('[词汇对应]');
    if (mappingIndex > 0) {
      translation = result.substring(0, mappingIndex).trim();
      // 移除开头的 "原文 | 译文" 格式中的原文部分，只保留译文
      const pipeIndex = translation.indexOf('|');
      if (pipeIndex > 0) {
        translation = translation.substring(pipeIndex + 1).trim();
      }
    } else {
      // 如果没有词汇对应表，尝试简单解析
      const pipeIndex = result.indexOf('|');
      if (pipeIndex > 0) {
        translation = result.substring(pipeIndex + 1).trim();
      }
    }
    
    console.log('解析到词汇对应:', wordMap);
    console.log('中文→英文反向映射:', chineseToEnglish);
    
    return { translation, wordMap, chineseToEnglish };
  }
  
  // 全局词汇对应表（由 AI 返回）
  let globalWordMapping = new Map(); // 段落元素 -> {sourceWord -> [transWords]}
  
  // 高亮对应的译文段落
  function highlightTranslationForElement(sourceEl) {
    const transEl = sourceEl.nextElementSibling;
    if (transEl && transEl.classList.contains('ai-translator-translation')) {
      transEl.classList.add('highlight-source');
    }
  }
  
  // 高亮对应的原文段落
  function highlightSourceForElement(transEl) {
    const sourceEl = transEl.previousElementSibling;
    if (sourceEl) {
      sourceEl.classList.add('highlight-translation');
    }
  }
  
  // 清除段落高亮
  function clearParagraphHighlight() {
    document.querySelectorAll('.ai-translator-translation.highlight-source, .ai-source-text.highlight-translation').forEach(el => {
      el.classList.remove('highlight-source', 'highlight-translation');
    });
  }
  
  // 词汇级高亮 - 原文→译文（使用 AI 返回的对应表）
  function highlightTranslationWord(sourceEl, word) {
    if (!word || word.length < 2) return;
    
    // 支持多词短语：保留空格，但统一小写
    const wordNormalized = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const transEl = sourceEl.nextElementSibling;
    if (!transEl) return;
    
    // 获取该段落的词汇对应表（新结构）
    const mappingData = globalWordMapping.get(sourceEl);
    if (!mappingData || !mappingData.wordMap) {
      // 回退：尝试匹配相同的英文单词
      const transWords = transEl.querySelectorAll('.ai-translator-word');
      transWords.forEach(el => {
        const text = el.textContent.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (text === wordNormalized) {
          el.classList.add('highlight-source');
        }
      });
      return;
    }
    
    const { wordMap } = mappingData;
    
    // 查找标准化后的匹配
    if (wordMap.has(wordNormalized)) {
      const entry = wordMap.get(wordNormalized);
      const targetChineseWords = entry.chinese;
      
      console.log(`🔍 原文→译文: "${word}" (标准化: ${wordNormalized}) → ${targetChineseWords.join(', ')}`);
      
      const transWords = transEl.querySelectorAll('.ai-translator-word');
      
      transWords.forEach(el => {
        const text = el.textContent;
        // 匹配对应的中文词汇
        for (const target of targetChineseWords) {
          if (text.includes(target)) {
            el.classList.add('highlight-source');
            console.log(`  ✅ 高亮译文词汇: "${text}"`);
            break;
          }
        }
      });
    } else {
      console.log(`⚠️ 未找到对应: "${word}" (标准化: ${wordNormalized})`);
    }
  }
  
  // 词汇级高亮 - 译文→原文（反向查找）
  function highlightSourceWord(transEl, word) {
    if (!word || word.length < 1) return;
    
    console.log('🔍 查找中文词汇对应:', word);
    
    const sourceEl = transEl.previousElementSibling;
    if (!sourceEl) {
      console.log('❌ 未找到原文元素');
      return;
    }
    
    const mappingData = globalWordMapping.get(sourceEl);
    console.log('📋 词汇对应表:', mappingData);
    
    if (!mappingData || !mappingData.wordMap) {
      console.log('❌ 该段落无词汇对应表');
      return;
    }
    
    const { wordMap, chineseToEnglish } = mappingData;
    
    // 使用反向映射查找：中文 -> 标准化英文
    let found = false;
    let highlightCount = 0;
    
    // 方法1: 直接查找中文对应的标准化英文
    if (chineseToEnglish) {
      for (const [chn, engList] of chineseToEnglish.entries()) {
        // 检查中文是否匹配（完全匹配或包含）
        if (chn === word || chn.includes(word) || word.includes(chn)) {
          console.log(`  ✅ 中文匹配: "${word}" → "${chn}" → 英文: ${engList.join(', ')}`);
          
          // 高亮所有对应的英文形式（包括多词短语）
          const sourceWords = sourceEl.querySelectorAll('.ai-source-word');
          
          for (const engNormalized of engList) {
            const entry = wordMap.get(engNormalized);
            if (!entry) continue;
            
            // 获取所有原始形式（多词短语的不同写法）
            for (const engOriginal of entry.originals) {
              // 将原始形式分词，用于匹配
              const engWords = engOriginal.toLowerCase().split(/\s+/);
              
              sourceWords.forEach(el => {
                const elWord = el.dataset.word;
                // 匹配单数单词或多词短语中的任一词
                if (engWords.includes(elWord) || elWord === engNormalized) {
                  el.classList.add('highlight-translation');
                  highlightCount++;
                  console.log(`  🎨 高亮原文词汇: "${el.textContent}" (匹配: ${engOriginal})`);
                }
              });
            }
          }
          found = true;
        }
      }
    }
    
    // 方法2: 如果反向映射没找到，遍历 wordMap 查找
    if (!found) {
      console.log('  尝试遍历 wordMap 查找...');
      for (const [engNormalized, entry] of wordMap.entries()) {
        for (const chn of entry.chinese) {
          if (chn === word || chn.includes(word) || word.includes(chn)) {
            console.log(`  ✅ 遍历匹配: "${word}" → "${chn}" → ${engNormalized}`);
            
            const sourceWords = sourceEl.querySelectorAll('.ai-source-word');
            for (const engOriginal of entry.originals) {
              const engWords = engOriginal.toLowerCase().split(/\s+/);
              
              sourceWords.forEach(el => {
                const elWord = el.dataset.word;
                if (engWords.includes(elWord) || elWord === engNormalized) {
                  el.classList.add('highlight-translation');
                  highlightCount++;
                }
              });
            }
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }
    
    console.log(`  总计高亮 ${highlightCount} 个原文词汇`);
    
    if (!found) {
      console.log('  ⚠️ 未找到对应关系');
    }
  }
  
  // 清除词汇高亮
  function clearHighlight() {
    document.querySelectorAll('.ai-source-word.highlight-translation, .ai-translator-word.highlight-source').forEach(el => {
      el.classList.remove('highlight-source', 'highlight-translation');
    });
  }

  // 为元素添加词汇高亮功能（保留原有内容）
  function makeWordsInteractive(element, isSource = true) {
    if (isSource) {
      // 原文：遍历所有文本节点
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.trim().length > 0) {
          textNodes.push(node);
        }
      }
      
      // 从后向前处理，避免索引问题
      textNodes.reverse().forEach(textNode => {
        const text = textNode.textContent;
        // 匹配英文单词（3个字母以上）
        const regex = /\b([a-zA-Z]{3,})\b/g;
        let match;
        let lastIndex = 0;
        const fragments = [];
        
        while ((match = regex.exec(text)) !== null) {
          // 添加匹配前的文本
          if (match.index > lastIndex) {
            fragments.push(document.createTextNode(text.substring(lastIndex, match.index)));
          }
          
          // 创建可交互的单词span
          const span = document.createElement('span');
          span.className = 'ai-source-word';
          span.textContent = match[0];
          span.dataset.word = match[0].toLowerCase();
          
          // 添加悬停事件
          span.addEventListener('mouseenter', () => {
            // 优先尝试词汇级高亮
            highlightTranslationWord(element, span.dataset.word);
            // 如果词汇级没有匹配，再显示段落级高亮
            const transEl = element.nextElementSibling;
            if (transEl && !transEl.querySelector('.highlight-source')) {
              highlightTranslationForElement(element);
            }
          });
          span.addEventListener('mouseleave', () => {
            // 清除所有高亮
            clearParagraphHighlight();
            clearHighlight();
          });
          
          fragments.push(span);
          lastIndex = match.index + match[0].length;
        }
        
        // 添加剩余文本
        if (lastIndex < text.length) {
          fragments.push(document.createTextNode(text.substring(lastIndex)));
        }
        
        // 替换原节点
        if (fragments.length > 0) {
          const parent = textNode.parentNode;
          fragments.forEach(frag => parent.insertBefore(frag, textNode));
          parent.removeChild(textNode);
        }
      });
    } else {
      // 译文：使用 AI 返回的词汇对应表进行中文分词
      const sourceEl = element.previousElementSibling;
      const mappingData = sourceEl ? globalWordMapping.get(sourceEl) : null;
      // 新结构：mappingData = { wordMap, chineseToEnglish }
      const wordMap = mappingData && mappingData.wordMap ? mappingData.wordMap : null;
      
      // 构建基于 AI 词汇表的中文分词器
      const chineseTokenizer = buildChineseTokenizer(wordMap);
      
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.trim().length > 0) {
          textNodes.push(node);
        }
      }
      
      textNodes.reverse().forEach(textNode => {
        const text = textNode.textContent;
        const fragments = [];
        
        if (chineseTokenizer) {
          // 使用 AI 词汇表进行分词
          const tokens = tokenizeWithAIMapping(text, chineseTokenizer);
          
          for (const token of tokens) {
            if (token.isWord) {
              // 创建可交互的词汇 span
              const span = document.createElement('span');
              span.className = 'ai-translator-word';
              span.textContent = token.text;
              
              // 添加悬停事件
              span.addEventListener('mouseenter', () => {
                span.classList.add('highlight-source');
                highlightSourceWord(element, token.text);
                // 如果词汇级没有匹配，再显示段落级高亮
                if (sourceEl && !sourceEl.querySelector('.highlight-translation')) {
                  highlightSourceForElement(element);
                }
              });
              span.addEventListener('mouseleave', () => {
                span.classList.remove('highlight-source');
                clearParagraphHighlight();
                clearHighlight();
              });
              
              fragments.push(span);
            } else {
              fragments.push(document.createTextNode(token.text));
            }
          }
        } else {
          // 回退：使用简单的字符分割
          const regex = /([\u4e00-\u9fa5]{1,}|[a-zA-Z]{3,})/g;
          let match;
          let lastIndex = 0;
          
          while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
              fragments.push(document.createTextNode(text.substring(lastIndex, match.index)));
            }
            
            const span = document.createElement('span');
            span.className = 'ai-translator-word';
            span.textContent = match[0];
            
            span.addEventListener('mouseenter', () => {
              span.classList.add('highlight-source');
              highlightSourceWord(element, match[0]);
              if (sourceEl && !sourceEl.querySelector('.highlight-translation')) {
                highlightSourceForElement(element);
              }
            });
            span.addEventListener('mouseleave', () => {
              span.classList.remove('highlight-source');
              clearParagraphHighlight();
              clearHighlight();
            });
            
            fragments.push(span);
            lastIndex = match.index + match[0].length;
          }
          
          if (lastIndex < text.length) {
            fragments.push(document.createTextNode(text.substring(lastIndex)));
          }
        }
        
        // 替换原节点
        if (fragments.length > 0) {
          const parent = textNode.parentNode;
          fragments.forEach(frag => parent.insertBefore(frag, textNode));
          parent.removeChild(textNode);
        }
      });
    }
  }

  // 从 AI 返回的 wordMap 构建中文分词器
  function buildChineseTokenizer(wordMap) {
    if (!wordMap || wordMap.size === 0) return null;
    
    // 收集所有中文词汇，按长度降序（优先匹配长词）
    // 注意：新结构中 wordMap 的值是 {originals, chinese} 对象
    const chineseWords = [];
    for (const entry of wordMap.values()) {
      if (entry && entry.chinese) {
        for (const chn of entry.chinese) {
          if (chn && chn.length >= 1) {
            chineseWords.push(chn);
          }
        }
      }
    }
    
    // 去重并排序（长的优先，避免短词干扰）
    const uniqueWords = [...new Set(chineseWords)].sort((a, b) => b.length - a.length);
    
    if (uniqueWords.length === 0) return null;
    
    // 构建正则：转义特殊字符，按长度降序排列
    const pattern = uniqueWords.map(w => escapeRegExp(w)).join('|');
    
    try {
      return new RegExp(`(${pattern})`, 'g');
    } catch (e) {
      console.error('构建分词器失败:', e);
      return null;
    }
  }

  // 转义正则特殊字符
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 使用 AI 词汇表分词
  function tokenizeWithAIMapping(text, tokenizer) {
    const tokens = [];
    let lastIndex = 0;
    let match;
    
    // 重置正则 lastIndex
    tokenizer.lastIndex = 0;
    
    while ((match = tokenizer.exec(text)) !== null) {
      // 添加匹配前的非词汇文本
      if (match.index > lastIndex) {
        tokens.push({
          text: text.substring(lastIndex, match.index),
          isWord: false
        });
      }
      
      // 添加匹配的词汇
      tokens.push({
        text: match[0],
        isWord: true
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余文本
    if (lastIndex < text.length) {
      tokens.push({
        text: text.substring(lastIndex),
        isWord: false
      });
    }
    
    return tokens;
  }

  // 插入翻译到 DOM
  function insertTranslation(element, originalText, translationData) {
    if (translatedElements.has(element)) return;
    if (!translationData.translation) return;
    
    const { translation, wordMap, chineseToEnglish } = translationData;
    
    // 存储翻译数据
    paragraphTranslations.set(element, {
      source: originalText,
      translation: translation,
      wordMap: wordMap,
      chineseToEnglish: chineseToEnglish
    });
    
    // 保存词汇对应表到全局映射（用于高亮）
    if (wordMap && wordMap.size > 0) {
      globalWordMapping.set(element, {
        wordMap,
        chineseToEnglish
      });
    }
    
    // 保存原文到 dataset（用于原文/译文切换）
    element.dataset.originalHtml = element.innerHTML;
    element.dataset.originalText = originalText;
    element.classList.add('ai-source-text');
    
    // 为原文添加词汇高亮功能（保留原有DOM结构）
    makeWordsInteractive(element, true);
    
    // 创建翻译元素
    const translationEl = document.createElement('div');
    translationEl.className = 'ai-translator-translation';
    translationEl.id = `ai-trans-${generateElementId(element)}`;
    translationEl.textContent = translation;
    
    // 插入翻译到原元素后面
    element.insertAdjacentElement('afterend', translationEl);
    
    // 为译文添加词汇高亮功能
    makeWordsInteractive(translationEl, false);
    
    // 标记已翻译
    element.dataset.aiTranslated = 'true';
    translatedElements.add(element);
  }

  // 批量翻译处理 - 并行处理但保证顺序
  async function batchTranslate(blocks, concurrency = 10) {
    const total = blocks.length;
    let completed = 0;
    let failed = 0;
    
    if (total === 0) {
      removeProgress();
      return;
    }
    
    console.log(`共 ${total} 个文本块需要翻译，并发数: ${concurrency}`);
    
    // 更新进度显示
    function updateProgress() {
      showProgress(completed, total);
    }
    
    // 为每个块分配索引，保持顺序信息
    const indexedBlocks = blocks.map((block, index) => ({
      ...block,
      index,
      hash: simpleHash(block.originalText)
    }));
    
    // 分离已缓存和未缓存的块
    const cachedBlocks = indexedBlocks.filter(b => translationCache.has(b.hash));
    const uncachedBlocks = indexedBlocks.filter(b => !translationCache.has(b.hash));
    
    console.log(`已缓存: ${cachedBlocks.length}, 需翻译: ${uncachedBlocks.length}`);
    
    // 先应用已缓存的翻译
    cachedBlocks.forEach(block => {
      const cachedResult = translationCache.get(block.hash);
      const parsed = parseTranslationWithWordMap(cachedResult, block.originalText);
      insertTranslation(block.element, block.originalText, parsed);
      completed++;
    });
    updateProgress();
    
    if (uncachedBlocks.length === 0) {
      removeProgress();
      return;
    }
    
    // 并行处理未缓存的块，每个完成立即应用到DOM
    const completedBlocks = new Set(); // 已完成的块索引
    const failedBlocks = new Map(); // 失败块 -> 重试次数
    const MAX_RETRIES = 2; // 最大重试次数
    
    async function processBlock(block, retryCount = 0) {
      try {
        console.log(`开始翻译 [${block.index + 1}/${total}]${retryCount > 0 ? ` (重试 ${retryCount})` : ''}`);
        const startTime = Date.now();
        
        const result = await translateWithAPI(block.originalText, pageContext);
        
        // 检查结果是否有效
        if (!result || result.trim().length === 0) {
          throw new Error('API 返回空结果');
        }
        
        const parsed = parseTranslationWithWordMap(result, block.originalText);
        
        // 检查解析后的翻译是否为空
        if (!parsed.translation || parsed.translation.trim().length === 0) {
          throw new Error('解析后的翻译为空');
        }
        
        // 立即应用到DOM（不等待其他任务）
        insertTranslation(block.element, block.originalText, parsed);
        completedBlocks.add(block.index);
        completed++;
        
        const duration = Date.now() - startTime;
        console.log(`翻译完成 [${block.index + 1}] 耗时 ${duration}ms，已应用到DOM`);
        
        // 更新进度
        updateProgress();
        
      } catch (error) {
        console.error(`翻译失败 [${block.index + 1}]:`, error);
        
        // 检查是否需要重试
        const currentRetries = failedBlocks.get(block.index) || 0;
        if (currentRetries < MAX_RETRIES) {
          failedBlocks.set(block.index, currentRetries + 1);
          console.log(`[${block.index + 1}] 将在 1 秒后重试 (${currentRetries + 1}/${MAX_RETRIES})...`);
          
          // 延迟后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
          return processBlock(block, currentRetries + 1);
        }
        
        // 重试耗尽，标记为失败
        failed++;
        updateProgress();
        
        // 在页面上显示该段落翻译失败
        showTranslationError(block.element, `翻译失败: ${error.message}`);
      }
    }
    
    // 显示单个段落翻译失败的视觉提示
    function showTranslationError(element, message) {
      const errorEl = document.createElement('div');
      errorEl.className = 'ai-translator-error';
      errorEl.style.cssText = `
        margin: 8px 0;
        padding: 8px 12px;
        background: #fff5f5;
        border-left: 3px solid #fc8181;
        color: #c53030;
        font-size: 13px;
        border-radius: 0 4px 4px 0;
      `;
      errorEl.textContent = `⚠️ ${message} - 点击重试`;
      errorEl.style.cursor = 'pointer';
      
      errorEl.addEventListener('click', () => {
        errorEl.remove();
        // 重新翻译该段落
        processBlock({
          ...Array.from(indexedBlocks).find(b => b.element === element),
          index: Array.from(indexedBlocks).findIndex(b => b.element === element)
        });
      });
      
      element.insertAdjacentElement('afterend', errorEl);
    }
    
    // 并发控制 - 使用队列，保持并发数
    const queue = [...uncachedBlocks];
    const executing = [];
    
    // 处理队列中的任务
    while (queue.length > 0 || executing.length > 0) {
      // 启动新任务直到达到并发上限
      while (executing.length < concurrency && queue.length > 0) {
        const block = queue.shift();
        const promise = processBlock(block).finally(() => {
          // 任务完成后从executing中移除
          const index = executing.indexOf(promise);
          if (index > -1) executing.splice(index, 1);
        });
        executing.push(promise);
      }
      
      // 等待任意一个任务完成
      if (executing.length > 0) {
        await Promise.race(executing);
      }
    }
    
    console.log(`✅ 翻译完成: 成功 ${completed}, 失败 ${failed}`);
    removeProgress();
    
    if (failed > 0) {
      showError(`部分翻译失败: ${failed} 个文本块未翻译`);
    }
  }

  // ============ 原文/翻译切换功能 ============
  
  // 切换显示模式
  function toggleDisplayMode() {
    const modes = ['both', 'source', 'translation'];
    const currentIndex = modes.indexOf(displayMode);
    displayMode = modes[(currentIndex + 1) % modes.length];
    
    applyDisplayMode();
    updateToggleButton();
  }
  
  // 应用显示模式
  function applyDisplayMode() {
    const body = document.body;
    
    // 移除所有模式类
    body.classList.remove('ai-translator-original-hidden', 'ai-translator-translation-hidden');
    
    switch (displayMode) {
      case 'source':
        // 只看原文：隐藏翻译
        body.classList.add('ai-translator-translation-hidden');
        updateStatus('只看原文');
        break;
      case 'translation':
        // 只看译文：隐藏原文
        body.classList.add('ai-translator-original-hidden');
        updateStatus('只看译文');
        break;
      case 'both':
      default:
        // 双语对照
        updateStatus('双语对照');
        break;
    }
  }
  
  // 更新切换按钮状态
  function updateToggleButton() {
    const btn = document.getElementById('ai-translator-toggle-btn');
    if (!btn) return;
    
    const icons = {
      both: '👁',
      source: '📄',
      translation: '🌐'
    };
    
    btn.innerHTML = icons[displayMode] || '👁';
    btn.title = displayMode === 'both' ? '双语对照' : 
                displayMode === 'source' ? '只看原文' : '只看译文';
  }

  // ============ 事件处理 ============
  
  async function handleTranslateClick() {
    if (isTranslating) {
      showError('翻译正在进行中...');
      return;
    }
    
    // 加载配置
    config = await ConfigManager.getConfig();
    
    // 检查必要的配置项
    const missingConfig = [];
    if (!config.api.apiKey) missingConfig.push('API Key');
    if (!config.api.baseUrl) missingConfig.push('API URL');
    if (!config.api.model) missingConfig.push('模型');
    
    if (missingConfig.length > 0) {
      showError(`请先完成设置: ${missingConfig.join(', ')}`);
      showSettingsPanel();
      return;
    }
    
    // 检查是否已经有翻译
    if (translatedElements.size > 0) {
      // 已有翻译，直接显示切换按钮
      const toggleBtn = document.getElementById('ai-translator-toggle-btn');
      if (toggleBtn) toggleBtn.style.display = 'flex';
      
      // 如果当前是隐藏状态，恢复显示
      toggleDisplayMode();
      return;
    }
    
    isTranslating = true;
    const translateBtn = document.getElementById('ai-translator-translate-btn');
    if (translateBtn) translateBtn.disabled = true;
    
    showLoading('正在分析页面内容...');
    
    // 更新页面上下文
    pageContext.summary = generatePageSummary();
    
    // 提取文本块
    const blocks = extractTextBlocks();
    
    if (blocks.length === 0) {
      removeLoading();
      showError('没有找到需要翻译的内容');
      isTranslating = false;
      if (translateBtn) translateBtn.disabled = false;
      return;
    }
    
    console.log(`找到 ${blocks.length} 个文本块需要翻译`);
    
    // 开始翻译 - 串行处理保证顺序
    await batchTranslate(blocks);
    
    isTranslating = false;
    if (translateBtn) translateBtn.disabled = false;
    removeLoading();
    
    // 显示切换按钮
    const toggleBtn = document.getElementById('ai-translator-toggle-btn');
    if (toggleBtn) toggleBtn.style.display = 'flex';
    
    // 添加词汇高亮提示
    const tip = document.createElement('div');
    tip.className = 'ai-translator-loading';
    tip.style.background = '#ebf8ff';
    tip.style.color = '#2c5282';
    tip.innerHTML = '💡 鼠标悬停词汇可查看对应高亮';
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 5000);
    
    // 显示完成提示
    const loading = showLoading('翻译完成！');
    loading.style.background = '#c6f6d5';
    loading.style.color = '#22543d';
    setTimeout(removeLoading, 2000);
  }


  // ============ 设置面板 ============
  
  function showSettingsPanel() {
    // 移除已存在的面板
    const existing = document.querySelector('.ai-translator-settings');
    if (existing) {
      existing.remove();
      document.querySelector('.ai-translator-overlay')?.remove();
      return;
    }
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'ai-translator-overlay';
    overlay.onclick = () => {
      overlay.remove();
      document.querySelector('.ai-translator-settings')?.remove();
    };
    document.body.appendChild(overlay);
    
    // 创建设置面板
    const panel = document.createElement('div');
    panel.className = 'ai-translator-settings';
    panel.innerHTML = `
      <div class="ai-translator-settings-header">
        <span>AI 翻译器设置</span>
        <button class="ai-translator-settings-close">&times;</button>
      </div>
      <div class="ai-translator-settings-body">
        <div class="ai-translator-settings-group">
          <label class="ai-translator-settings-label">API Provider</label>
          <select class="ai-translator-settings-select" id="setting-provider">
            <option value="openai-compatible">OpenAI Compatible (Kimi/OpenAI)</option>
            <option value="anthropic-messages">Anthropic Messages API</option>
          </select>
          <small style="color: #718096; font-size: 11px; display: block; margin-top: 4px;">
            选择 API 格式类型
          </small>
        </div>
        <div class="ai-translator-settings-group">
          <label class="ai-translator-settings-label">API Key</label>
          <input type="password" class="ai-translator-settings-input" id="setting-api-key" placeholder="输入你的 API Key">
          <small style="color: #718096; font-size: 11px; display: block; margin-top: 4px;">
            OpenClaw格式: window.openclaw = {apiKey, baseUrl, model, provider}
          </small>
        </div>
        <div class="ai-translator-settings-group">
          <label class="ai-translator-settings-label">API Base URL</label>
          <input type="text" class="ai-translator-settings-input" id="setting-api-url" placeholder="https://api.moonshot.cn/v1">
        </div>
        <div class="ai-translator-settings-group">
          <label class="ai-translator-settings-label">模型</label>
          <input type="text" class="ai-translator-settings-input" id="setting-model" placeholder="kimi-latest">
          <small style="color: #718096; font-size: 11px; display: block; margin-top: 4px;">
            如: kimi-latest, kimi-for-coding, claude-3-haiku-20240307
          </small>
        </div>
        <div class="ai-translator-settings-group">
          <label class="ai-translator-settings-label">并行线程数</label>
          <input type="number" class="ai-translator-settings-input" id="setting-concurrency" min="1" max="20" value="10">
          <small style="color: #718096; font-size: 11px; display: block; margin-top: 4px;">
            同时发送的 API 请求数 (1-20)
          </small>
        </div>
        <div class="ai-translator-settings-group">
          <label class="ai-translator-settings-label">翻译提示词 Prompt</label>
          <textarea class="ai-translator-settings-textarea" id="setting-prompt" placeholder="输入自定义提示词..."></textarea>
          <small style="color: #718096; font-size: 11px;">
            可用变量: {title}, {url}, {summary}, {text}
          </small>
        </div>
        <button class="ai-translator-settings-save" id="setting-save">保存设置</button>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // 加载当前配置
    ConfigManager.getConfig().then(cfg => {
      document.getElementById('setting-provider').value = cfg.api.provider || 'openai-compatible';
      document.getElementById('setting-api-key').value = cfg.api.apiKey || '';
      document.getElementById('setting-api-url').value = cfg.api.baseUrl;
      document.getElementById('setting-model').value = cfg.api.model;
      document.getElementById('setting-concurrency').value = cfg.behavior?.concurrency || 10;
      document.getElementById('setting-prompt').value = cfg.prompt;
    });
    
    // 绑定事件
    panel.querySelector('.ai-translator-settings-close').onclick = () => {
      panel.remove();
      overlay.remove();
    };
    
    document.getElementById('setting-save').onclick = async () => {
      const concurrency = parseInt(document.getElementById('setting-concurrency').value) || 10;
      const newConfig = {
        api: {
          provider: document.getElementById('setting-provider').value,
          apiKey: document.getElementById('setting-api-key').value.trim(),
          baseUrl: document.getElementById('setting-api-url').value.trim() || DEFAULT_CONFIG.api.baseUrl,
          model: document.getElementById('setting-model').value.trim()
        },
        behavior: {
          concurrency: Math.min(Math.max(concurrency, 1), 20)
        },
        prompt: document.getElementById('setting-prompt').value.trim() || DEFAULT_CONFIG.prompt
      };
      
      const success = await ConfigManager.saveConfig(newConfig);
      if (success) {
        config = newConfig;
        panel.remove();
        overlay.remove();
        const loading = showLoading('设置已保存！');
        setTimeout(removeLoading, 1500);
      } else {
        showError('保存失败');
      }
    };
  }

  // ============ 初始化 ============
  
  function init() {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // 创建控制栏
    createControls();
    
    console.log('AI 网页翻译器已加载');
  }

  // 启动
  init();

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startTranslation') {
      handleTranslateClick();
      sendResponse({ success: true });
    } else if (request.action === 'openSettings') {
      showSettingsPanel();
      sendResponse({ success: true });
    } else if (request.action === 'getStatus') {
      sendResponse({ 
        isTranslating, 
        translatedCount: translatedElements.size,
        displayMode 
      });
    } else if (request.action === 'toggleDisplay') {
      toggleDisplayMode();
      sendResponse({ displayMode });
    }
    return true;
  });

})();
