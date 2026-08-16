const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const host = "127.0.0.1";
const port = Number.parseInt(process.env.MINAGRAPH_PORT, 10) || 8765;
const root = __dirname;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filename = path.resolve(root, relativePath);
  const relativeToRoot = path.relative(root, filename);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  fs.stat(filename, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes[path.extname(filename).toLowerCase()] || "application/octet-stream"
    });
    fs.createReadStream(filename).pipe(response);
  });
});

server.listen(port, host, () => {
  console.log(`Minagraph available at http://${host}:${port}`);
});
