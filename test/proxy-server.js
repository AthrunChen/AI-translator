/**
 * CORS 代理服务器
 * 解决浏览器直接访问 API 的跨域问题
 * 
 * 使用方法：
 * 1. 确保安装了 Node.js
 * 2. 运行: node proxy-server.js
 * 3. 测试文件中的 API URL 改为: http://localhost:3000/proxy
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;
const TARGET_API = 'api.kimi.com'; // 修改为你的 API 域名

const server = http.createServer((req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 只处理 /proxy 路径
  if (!req.url.startsWith('/proxy')) {
    res.writeHead(404);
    res.end('Not Found. Use /proxy/{target-path}');
    return;
  }
  
  // 解析目标路径
  const targetPath = req.url.replace('/proxy', '') || '/';
  
  console.log(`${new Date().toISOString()} ${req.method} ${targetPath}`);
  
  // 构建目标请求选项
  const options = {
    hostname: TARGET_API,
    port: 443,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: TARGET_API
    }
  };
  
  // 发送请求到目标 API
  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy Error: ' + err.message);
  });
  
  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`🚀 CORS 代理服务器运行在 http://localhost:${PORT}`);
  console.log('');
  console.log('📋 使用方法:');
  console.log(`  1. 将测试文件中的 API URL 改为: http://localhost:${PORT}/proxy`);
  console.log(`  2. 保持其他配置不变`);
  console.log(`  3. 刷新测试页面即可`);
  console.log('');
  console.log('⚠️  注意: 此代理仅用于本地测试，不要用于生产环境');
});
