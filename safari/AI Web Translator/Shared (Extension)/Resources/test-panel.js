// 测试面板创建
function testSettingsPanel() {
  console.log('[Test] 开始测试设置面板');
  
  // 移除已存在的
  document.querySelector('.ai-translator-settings')?.remove();
  document.querySelector('.ai-translator-overlay')?.remove();
  
  // 创建遮罩
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999999;
  `;
  overlay.onclick = () => {
    overlay.remove();
    panel.remove();
  };
  document.body.appendChild(overlay);
  
  // 创建简单面板
  const panel = document.createElement('div');
  panel.className = 'ai-translator-settings';
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    background: white;
    padding: 20px;
    border-radius: 8px;
    z-index: 1000000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;
  panel.innerHTML = `
    <h3>AI 翻译器设置 (测试)</h3>
    <input type="text" id="test-api-key" placeholder="API Key" style="width:100%;margin:10px 0;padding:8px;"><br>
    <input type="text" id="test-api-url" placeholder="API URL" style="width:100%;margin:10px 0;padding:8px;"><br>
    <button id="test-save" style="padding:10px 20px;">保存</button>
    <button id="test-close" style="padding:10px 20px;margin-left:10px;">关闭</button>
  `;
  document.body.appendChild(panel);
  
  // 绑定事件
  document.getElementById('test-close').onclick = () => {
    overlay.remove();
    panel.remove();
  };
  
  document.getElementById('test-save').onclick = () => {
    const key = document.getElementById('test-api-key').value;
    const url = document.getElementById('test-api-url').value;
    localStorage.setItem('translatorConfig', JSON.stringify({
      api: { apiKey: key, baseUrl: url, model: 'gpt-3.5-turbo', provider: 'openai-compatible' }
    }));
    alert('已保存到 localStorage');
    overlay.remove();
    panel.remove();
  };
  
  console.log('[Test] 测试面板已创建');
}

// 暴露到全局
window.testSettingsPanel = testSettingsPanel;
