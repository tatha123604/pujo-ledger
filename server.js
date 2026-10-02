const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { Pool } = require('pg');

const root = process.cwd();
const port = Number(process.env.PORT || 3000);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.manifest': 'application/manifest+json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;
const syncToken = process.env.SYNC_TOKEN || '';
const databaseReady = pool ? pool.query('CREATE TABLE IF NOT EXISTS ledger_state (id text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())').catch(error => console.error(error)) : Promise.resolve();

function cors(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
}

function authorized(request) {
  return Boolean(syncToken) && request.headers.authorization === `Bearer ${syncToken}`;
}

function sendJson(response, status, body) {
  cors(response);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => { body += chunk; if (body.length > 12_000_000) request.destroy(); });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

async function handleApi(request, response, pathname) {
  cors(response);
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return true; }
  if (pathname !== '/api/state') return false;
  if (!authorized(request)) { sendJson(response, 401, { error: 'Invalid sync code' }); return true; }
  if (!pool) { sendJson(response, 503, { error: 'Cloud database is not configured' }); return true; }
  await databaseReady;
  try {
    if (request.method === 'GET') {
      const result = await pool.query('SELECT payload, updated_at FROM ledger_state WHERE id = $1', ['main']);
      sendJson(response, 200, result.rows[0] || { payload: null });
      return true;
    }
    if (request.method === 'PUT') {
      const payload = JSON.parse(await readBody(request));
      await pool.query('INSERT INTO ledger_state (id, payload, updated_at) VALUES ($1, $2::jsonb, now()) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()', ['main', JSON.stringify(payload)]);
      sendJson(response, 200, { ok: true });
      return true;
    }
    sendJson(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    sendJson(response, 400, { error: 'Could not process sync request' });
  }
  return true;
}

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (requestPath.startsWith('/api/')) { handleApi(request, response, requestPath); return; }
  const requestedFile = path.resolve(root, `.${requestPath === '/' ? '/index.html' : requestPath}`);
  const safeFile = requestedFile.startsWith(root) ? requestedFile : path.join(root, 'index.html');

  fs.readFile(safeFile, (error, content) => {
    if (error) {
      fs.readFile(path.join(root, 'index.html'), (fallbackError, fallbackContent) => {
        if (fallbackError) {
          response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('Application failed to start.');
          return;
        }
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(fallbackContent);
      });
      return;
    }

    const contentType = contentTypes[path.extname(safeFile)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(content);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Pujo Ledger listening on port ${port}`);
});
