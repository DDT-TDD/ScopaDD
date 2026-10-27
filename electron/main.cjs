const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');

const LAN_PORT = 8135;
const rooms = new Map(); // roomCode -> { stateJson, updatedAt, gameType }

function getLocalIPs() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips.length > 0 ? ips : ['127.0.0.1'];
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.ico': 'image/x-icon',
  };
  return map[ext] || 'application/octet-stream';
}

function startLocalLanServer() {
  const distDir = path.join(__dirname, '../dist');

  const server = http.createServer((req, res) => {
    // Enable CORS for local network / browser clients
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://localhost:${LAN_PORT}`);

    // 1. Endpoint to discover local LAN IP addresses
    if (parsedUrl.pathname === '/api/lan-info' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ips: getLocalIPs(),
          port: LAN_PORT,
        })
      );
      return;
    }

    // 2. Endpoint to get or update room state for zero-config Home Wi-Fi play
    if (parsedUrl.pathname === '/api/room') {
      const code = (parsedUrl.searchParams.get('code') || 'SOLE').toUpperCase();

      if (req.method === 'GET') {
        const room = rooms.get(code) || null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, room }));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
          if (body.length > 1e6) req.destroy();
        });
        req.on('end', () => {
          try {
            const payload = JSON.parse(body);
            rooms.set(code, {
              stateJson: payload.stateJson,
              gameType: payload.gameType || 'scopa',
              updatedAt: Date.now(),
              senderId: payload.senderId || '',
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false }));
          }
        });
        return;
      }
    }

    // 3. Serve static files from dist/ so any phone/tablet/PC on Home Wi-Fi can play!
    let safePath = path.normalize(decodeURIComponent(parsedUrl.pathname)).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
      safePath = '/index.html';
    }
    const filePath = path.join(distDir, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html for SPA
        const fallback = path.join(distDir, 'index.html');
        fs.readFile(fallback, (err2, data) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data);
        });
        return;
      }

      res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.on('error', (err) => {
    console.warn('Local LAN server port busy or unavailable:', err.message);
  });

  server.listen(LAN_PORT, '0.0.0.0', () => {
    console.log(`Scopa & Briscola LAN Server ready on http://${getLocalIPs()[0]}:${LAN_PORT}`);
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, '../dist/icon.ico');
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 850,
    minHeight: 600,
    title: 'Scopa & Briscola v1.0.0 — Famiglia & Tradizione Italiana',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    backgroundColor: '#12151c',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);

  // Load the compiled Vite distribution
  const indexPath = path.join(__dirname, '../dist/index.html');
  win.loadFile(indexPath);
}

app.whenReady().then(() => {
  startLocalLanServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
