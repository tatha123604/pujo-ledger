const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

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

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
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
