// Frontend static server + proxy to admin API
const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ADMIN_PORT = 8000;
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.map': 'application/json',
};

// Check if http-proxy is available, otherwise use simple proxy
let proxy;
try {
  proxy = httpProxy.createProxyServer({ target: `http://localhost:${ADMIN_PORT}` });
  proxy.on('error', () => {});
} catch (e) {
  proxy = null;
}

http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // Proxy API and uploads to admin server
  if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
    if (proxy) {
      proxy.web(req, res);
    } else {
      // Fallback: manual proxy request
      const options = {
        hostname: 'localhost',
        port: ADMIN_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers,
      };
      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxyReq.on('error', () => {
        res.writeHead(502);
        res.end('Proxy error');
      });
      req.pipe(proxyReq);
    }
    return;
  }

  // Serve static files
  let filePath = url === '/' ? path.join(ROOT, 'index.html') : path.join(ROOT, url);

  if (!fs.existsSync(filePath) && !path.extname(url)) {
    const htmlPath = filePath + '.html';
    if (fs.existsSync(htmlPath)) filePath = htmlPath;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      const notFound = path.join(ROOT, '404.html');
      fs.readFile(notFound, (err2, data2) => {
        if (err2) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404'); }
        else { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(data2); }
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Frontend:  http://localhost:${PORT}`);
  console.log(`Admin API: http://localhost:${PORT}/api/products`);
});
